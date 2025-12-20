# PM-06 Code Review Fixes

This document summarizes all issues identified in the code reviews for Epic PM-06 and provides specific fixes.

---

## 🔴 CRITICAL (Must Fix Before Merge)

### 1. JWT Secret Fallback - Security Vulnerability
**File:** `apps/api/src/pm/notifications/notifications.module.ts:33`

**Problem:** Hardcoded fallback secret allows token forgery if `JWT_SECRET` is not set.

```typescript
// ❌ Current (INSECURE)
secret: process.env.JWT_SECRET || 'temporary-secret',

// ✅ Fix
secret: (() => {
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-only-secret-not-for-production';
  }
  return process.env.JWT_SECRET;
})(),
```

---

### 2. Email Service Logs Sensitive Data
**File:** `apps/api/src/common/services/email.service.ts:28-31`

**Problem:** Logs email HTML/text which contains JWT unsubscribe tokens.

```typescript
// ❌ Current (LOGS TOKENS)
this.logger.debug(`HTML: ${options.html.substring(0, 200)}...`);

// ✅ Fix - Log metadata only
this.logger.debug(`HTML length: ${options.html.length} chars`);
if (options.text) {
  this.logger.debug(`Text length: ${options.text.length} chars`);
}
```

---

### 3. BullMQ Repeat Configuration Wrong
**File:** `apps/api/src/pm/notifications/digest-scheduler.service.ts:84-85`

**Problem:** Uses `pattern` instead of `cron` - jobs won't schedule correctly.

```typescript
// ❌ Current (WRONG)
repeat: {
  pattern: cronExpression,
},

// ✅ Fix
repeat: {
  cron: cronExpression,
},
```

---

### 4. Digest Job Removal Fails
**File:** `apps/api/src/pm/notifications/digest-scheduler.service.ts:106-117`

**Problem:** `removeRepeatableByKey` expects the full key, not just `jobId`.

```typescript
// ❌ Current (WON'T WORK)
await this.digestQueue.removeRepeatableByKey(`digest-${userId}`);

// ✅ Fix - Get actual key from repeatable jobs
async removeUserDigest(userId: string): Promise<void> {
  try {
    const repeatableJobs = await this.digestQueue.getRepeatableJobs();
    const jobId = `digest-${userId}`;
    const job = repeatableJobs.find((j) => j.id === jobId);

    if (!job) {
      this.logger.debug(`No digest job found for user ${userId}`);
      return;
    }

    await this.digestQueue.removeRepeatableByKey(job.key);
    this.logger.debug(`Removed digest job for user ${userId}`);
  } catch (error) {
    this.logger.warn(`Error removing digest: ${error}`);
  }
}
```

---

### 5. Timezone Regex Rejects Valid Timezones
**File:** `apps/api/src/pm/notifications/dto/update-preferences.dto.ts:11`

**Problem:** Rejects `UTC` and multi-segment zones like `America/Argentina/Buenos_Aires`.

```typescript
// ❌ Current (TOO RESTRICTIVE)
const timezoneRegex = /^[A-Za-z]+\/[A-Za-z_]+$/;

// ✅ Fix - Allow UTC and multi-segment
const timezoneRegex = /^[A-Za-z_]+(?:\/[A-Za-z0-9_\-+]+)*$/;
```

---

## 🟠 HIGH PRIORITY

### 6. Luxon Invalid Timezone Not Caught
**File:** `apps/api/src/pm/notifications/digest-scheduler.service.ts:153-155`

**Problem:** Luxon returns invalid DateTime instead of throwing for bad timezones.

```typescript
// ✅ Fix - Add isValid check
const userTime = DateTime.now().setZone(timezone).set({ hour: 9, minute: 0, second: 0 });

if (!userTime.isValid) {
  throw new Error(`Invalid timezone: ${timezone}`);
}

const utcTime = userTime.toUTC();
```

---

### 7. Presence Cleanup Race Condition
**File:** `apps/api/src/realtime/realtime.gateway.ts:341-407`

**Problem:** Sequential cleanup fails fast; if one project fails, others may not clean up.

```typescript
// ❌ Current - Stops on first error
for (const projectId of projectRooms) {
  await this.presenceService.removePresence(userId, projectId);
}

// ✅ Fix - Use Promise.allSettled
const cleanupPromises = Array.from(projectRooms).map(async (projectId) => {
  await this.presenceService.removePresence(userId, projectId);
  this.server.to(`project:${projectId}`).emit('pm.presence.left', {
    userId,
    projectId,
    timestamp: new Date().toISOString(),
  });
});
await Promise.allSettled(cleanupPromises);
```

---

### 8. Type Safety - `as any` in digest.service.ts
**File:** `apps/api/src/pm/notifications/digest.service.ts:322-350`

```typescript
// ❌ Current
const projectId = (notification.data as any).projectId;

// ✅ Fix - Use typed assertion
const projectId = (notification.data as { projectId?: string })?.projectId;
```

---

### 9. N+1 Query in getProjectPresence
**File:** `apps/api/src/realtime/presence.service.ts:98-143`

**Problem:** Fetches user details inside `Promise.all` loop.

```typescript
// ✅ Fix - Batch user lookup
const userIds = [...]; // Get from Redis

// Single query for all users
const users = await this.prisma.user.findMany({
  where: { id: { in: userIds } },
  select: { id: true, name: true, email: true, image: true },
});

const userMap = new Map(users.map(u => [u.id, u]));

// Then map presence data using userMap
```

---

### 10. Missing Composite Index
**File:** `packages/db/prisma/schema.prisma:442-445`

```prisma
// ✅ Add to Notification model
@@index([userId, workspaceId, createdAt])
@@index([userId, type, createdAt])
```

---

### 11. Reset Preferences Doesn't Remove Digest Jobs
**File:** `apps/api/src/pm/notifications/notifications.service.ts`

```typescript
// ✅ Fix - Add to resetToDefaults()
const preferences = await this.prisma.notificationPreference.create({
  data: { userId },
});

// Remove any scheduled digest jobs
try {
  await this.digestSchedulerService.removeUserDigest(userId);
} catch (error) {
  this.logger.error(`Error removing digest job during reset: ${error}`);
}

return preferences;
```

---

### 12. Quiet Hours Blocks Health Alerts
**File:** `apps/api/src/pm/notifications/notifications.service.ts:163`

```typescript
// ❌ Current - Blocks all notifications
if (this.isInQuietHours(preferences, new Date())) {
  return false;
}

// ✅ Fix - Bypass for critical notifications
const isCriticalNotification = notificationType === PMNotificationType.HEALTH_ALERT;
if (!isCriticalNotification && this.isInQuietHours(preferences, new Date())) {
  this.logger.debug(`User ${userId} is in quiet hours, suppressing notification`);
  return false;
}
```

---

### 13. Unsubscribe Returns 400 for Server Errors
**File:** `apps/api/src/pm/notifications/digest-unsubscribe.controller.ts:56-57`

```typescript
// ❌ Current - All errors return 400
res.status(400).send(this.getErrorHtml());

// ✅ Fix - Distinguish error types
const isTokenError = error instanceof Error &&
  error.message === 'Invalid or expired unsubscribe token';
res.status(isTokenError ? 400 : 500).send(this.getErrorHtml());
```

---

## 🟡 MEDIUM PRIORITY

### 14. Read Query Param Validation
**File:** `apps/api/src/pm/notifications/dto/list-notifications.dto.ts`

```typescript
// ❌ Current - Silently ignores invalid values
read: z.string().optional()

// ✅ Fix - Enforce valid values
read: z.enum(['true', 'false']).optional()
```

---

### 15. QuietHours Partial Update Logic
**File:** `apps/api/src/pm/notifications/dto/update-preferences.dto.ts:68-77`

```typescript
// ✅ Fix - Check if field was provided in update
const startProvided = Object.prototype.hasOwnProperty.call(data, 'quietHoursStart');
const endProvided = Object.prototype.hasOwnProperty.call(data, 'quietHoursEnd');

if (startProvided !== endProvided) {
  return false; // Can't update just one
}

if (startProvided && endProvided) {
  const bothNull = data.quietHoursStart === null && data.quietHoursEnd === null;
  const bothSet = data.quietHoursStart !== null && data.quietHoursEnd !== null;
  return bothNull || bothSet;
}

return true; // Neither provided is ok
```

---

### 16. Add userId Validation in Unsubscribe
**File:** `apps/api/src/pm/notifications/digest-unsubscribe.controller.ts`

```typescript
const { userId } = this.digestService.verifyUnsubscribeToken(token);

// ✅ Add validation
if (!userId) {
  throw new Error('Invalid token payload: missing userId');
}
```

---

### 17. PUSH Channel Returns Wrong Preference
**File:** `apps/api/src/pm/notifications/notifications.service.ts`

```typescript
// ✅ Fix - Handle PUSH explicitly
if (channel === NotificationChannel.PUSH) {
  return null; // No push preferences yet, fall back to send
}

const channelPrefix = channel === NotificationChannel.EMAIL ? 'email' : 'inApp';
```

---

### 18. Use Shared Types for PresencePayload
**File:** `apps/api/src/realtime/realtime.types.ts:426-431`

```typescript
// ❌ Current - Inline type
export interface PresencePayload {
  userAvatar: string | null;
  projectId: string;
  // ...
}

// ✅ Fix - Import from shared
export type { PresencePayload } from '@hyvve/shared';
```

---

## 🟢 LOW PRIORITY (Nice-to-Have)

### 19. Test Coverage
Create test files:
- `apps/api/src/pm/notifications/__tests__/digest.service.spec.ts`
- `apps/api/src/pm/notifications/__tests__/notifications.service.spec.ts`
- `apps/api/src/realtime/__tests__/presence.service.spec.ts`
- `apps/web/src/hooks/__tests__/use-realtime-kanban.test.tsx`

---

### 20. Move Redis Init to onModuleInit
**File:** `apps/api/src/realtime/presence.service.ts:29`

```typescript
// ✅ Fix
export class PresenceService implements OnModuleInit {
  private redis: RedisClient;

  async onModuleInit() {
    this.redis = this.redisProvider.getClient();
  }
}
```

---

### 21. useCallback for Event Handlers
**File:** `apps/web/src/hooks/use-realtime-kanban.ts`

```typescript
// ✅ Wrap handlers in useCallback
const handleTaskCreated = useCallback((data: PMTaskEventPayload) => {
  // handler logic
}, [projectId, phaseId, queryClient, workspaceId]);
```

---

### 22. Define Session Types
**File:** `apps/web/src/hooks/use-task-conflict-detection.ts`

```typescript
// ✅ Define proper interface
interface SessionData {
  activeWorkspaceId?: string;
  correlationId?: string;
}

const sessionData = session?.session as SessionData | undefined;
```

---

### 23. Add Migration Rollback
**File:** `packages/db/prisma/migrations/20251220064644_add_pm_notification_preferences/down.sql`

```sql
-- Rollback migration
ALTER TABLE "notification_preferences"
  DROP COLUMN IF EXISTS "email_task_assigned",
  DROP COLUMN IF EXISTS "email_task_mentioned",
  -- ... all new columns
```

---

### 24. Add Error Boundaries
**File:** Create `apps/web/src/components/notifications/NotificationErrorBoundary.tsx`

```tsx
'use client';

import { ErrorBoundary } from 'react-error-boundary';

export function NotificationErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div className="text-sm text-muted-foreground">Notifications unavailable</div>}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Implementation Order

1. **Phase 1 - Critical Security** (blocks merge)
   - JWT secret fallback
   - Email logging
   - BullMQ cron fix
   - Digest job removal

2. **Phase 2 - Critical Logic**
   - Timezone regex
   - Luxon validation
   - Presence cleanup

3. **Phase 3 - High Priority**
   - Type safety fixes
   - N+1 query
   - Database index
   - Reset preferences
   - Quiet hours bypass

4. **Phase 4 - Medium Priority**
   - Validation fixes
   - Error handling

5. **Phase 5 - Low Priority** (future sprint)
   - Tests
   - Performance optimizations
   - Error boundaries
