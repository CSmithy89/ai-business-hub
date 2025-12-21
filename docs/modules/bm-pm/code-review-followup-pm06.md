# PM-06 Code Review Follow-up Items

This document tracks additional code review feedback that was not blocking for merge but should be addressed in follow-up work.

## High Priority

### 1. Missing Test Coverage
**Status:** TODO
**Effort:** Medium-High

No unit tests exist for the new PM-06 services:
- `NotificationsService` - preference management, notification creation, quiet hours logic
- `DigestService` - digest generation, email template rendering, token verification
- `DigestSchedulerService` - BullMQ job scheduling, cron expression generation
- `PresenceService` - Redis presence tracking, user lookup

**Recommendation:** Create test files with Jest mocks for Prisma, Redis, and BullMQ.

### 2. Email Service Stub
**Status:** Documented
**Effort:** Low (tracking only)

The `EmailService` currently logs emails instead of sending them. This is intentional for MVP but needs production implementation.

**Location:** `apps/api/src/common/services/email.service.ts`

**Production requirements:**
- Integrate with email provider (SendGrid, AWS SES, Resend, etc.)
- Add email templates to build pipeline
- Configure SMTP/API credentials
- Add email delivery monitoring

---

## Medium Priority

### 3. Presence Location Key Scoping Bug
**Status:** TODO
**Effort:** Medium
**Severity:** Bug

The presence location key `presence:user:${userId}:location` is NOT project-scoped. This causes issues when a user has presence in multiple projects simultaneously:

1. User joins Project A - location stored
2. User joins Project B - location OVERWRITES Project A
3. User leaves Project A - entire location hash DELETED
4. User's presence in Project B is now broken

**Current code:**
```typescript
const locationKey = `presence:user:${userId}:location`;
```

**Fix:** Make location key project-scoped:
```typescript
const locationKey = `presence:user:${userId}:project:${projectId}:location`;
```

**Files to update:**
- `apps/api/src/realtime/presence.service.ts` - updatePresence, getProjectPresence, removePresence

### 4. Digest Scheduler Race Condition
**Status:** TODO
**Effort:** Low

If `scheduleUserDigest` is called multiple times rapidly, it could create duplicate jobs before the previous one is registered.

**Current mitigation:** BullMQ's `jobId` option prevents true duplicates.

**Additional fix:** Add a distributed lock or check for existing job before scheduling.

### 5. Configurable Presence TTL
**Status:** TODO
**Effort:** Low

The presence TTL is currently hardcoded as a class constant. Should be configurable via environment variable.

**Current:**
```typescript
private readonly PRESENCE_TTL_SECONDS = 300; // 5 minutes
```

**Recommendation:**
```typescript
private readonly PRESENCE_TTL_SECONDS = parseInt(
  process.env.PRESENCE_TTL_SECONDS || '300',
  10
);
```

---

## Low Priority

### 6. Partial Index on Unread Notifications
**Status:** TODO
**Effort:** Low

Add a partial index for unread notifications to improve query performance:

```prisma
@@index([userId, createdAt], map: "idx_notifications_unread")
// Note: Prisma doesn't support partial indexes directly
// Use raw SQL migration: CREATE INDEX ... WHERE read_at IS NULL
```

### 7. Framer Motion Bundle Size
**Status:** Review
**Effort:** Medium

Framer Motion adds ~60KB to bundle. Consider:
- Tree-shaking unused features
- Using `@motionone/dom` for simpler animations (~5KB)
- CSS animations for basic transitions

**Affected components:** Notification toast animations, presence indicators

### 8. ARIA Accessibility Attributes
**Status:** TODO
**Effort:** Low

Add missing ARIA attributes:
- Notification bell: `aria-label`, `aria-live` for count updates
- Toast notifications: `role="alert"`, `aria-live="polite"`
- Presence indicators: `aria-label` for user status

---

## Already Addressed

These items from code review were already fixed:

| Item | Status | Commit |
|------|--------|--------|
| JWT secret fallback | Fixed | e09039a |
| Email logging sensitive data | Fixed | e09039a |
| BullMQ job key removal | Fixed | e09039a |
| Timezone regex validation | Fixed | e09039a |
| Luxon isValid check | Fixed | e09039a |
| Promise.allSettled for cleanup | Fixed | e09039a |
| Type safety (as any) | Fixed | e09039a |
| N+1 query in presence | Fixed | e09039a |
| Composite index for digests | Fixed | e09039a |
| Reset preferences removes jobs | Fixed | e09039a |
| HEALTH_ALERT bypasses quiet hours | Fixed | e09039a |
| Unsubscribe error handling | Fixed | e09039a |
| Query param validation | Fixed | e09039a |
| Quiet hours partial updates | Fixed | e09039a |
| User validation in unsubscribe | Fixed | e09039a |
| PUSH channel mapping | Fixed | e09039a |
| Magic number TTL constants | Fixed | fe57cfb |
| JSX apostrophe escaping | Fixed | 8ef7b07 |
