# PM-06 Code Review Follow-up Items

This document tracks additional code review feedback that was not blocking for merge but should be addressed in follow-up work.

## High Priority

### 1. Missing Test Coverage
**Status:** ✅ FIXED
**Effort:** Medium-High

**Unit tests created:**
- `notifications.service.spec.ts` - Preference management, notification CRUD, quiet hours logic
- `digest.service.spec.ts` - Digest generation, token verification, email sending
- `presence.service.spec.ts` - Redis presence tracking, multi-project support, batch queries

Note: `DigestSchedulerService` tests skipped (mostly BullMQ integration, covered by E2E).

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
**Status:** ✅ FIXED
**Effort:** Medium
**Severity:** Bug

~~The presence location key `presence:user:${userId}:location` is NOT project-scoped.~~

**Fix applied:** Changed to project-scoped key `presence:user:${userId}:project:${projectId}:location`

### 4. Digest Scheduler Race Condition
**Status:** ✅ FIXED
**Effort:** Low

~~If `scheduleUserDigest` is called multiple times rapidly, it could create duplicate jobs.~~

**Fix applied:** Added check for existing job before scheduling in `scheduleUserDigest`.

### 5. Configurable Presence TTL
**Status:** ✅ FIXED
**Effort:** Low

~~The presence TTL is currently hardcoded as a class constant.~~

**Fix applied:** TTL now configurable via `PRESENCE_TTL_SECONDS` environment variable (default: 300s).

---

## Low Priority

### 6. Partial Index on Unread Notifications
**Status:** ✅ FIXED
**Effort:** Low

**Fix applied:** Added raw SQL migration `20251221000000_add_unread_notifications_partial_index` with:
```sql
CREATE INDEX idx_notifications_unread ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
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
**Status:** ✅ FIXED
**Effort:** Low

**Fixes applied:**
- Notification bell: Added `aria-live="polite"` region for count updates
- Toast notifications: Sonner library handles ARIA internally
- Presence indicators: Added `aria-label` to PresenceAvatar and PresenceBar

---

## Production Hardening (Fixed)

These production issues were identified and fixed in a follow-up review:

### CRITICAL Issues (Fixed)

| Issue | Description | Fix |
|-------|-------------|-----|
| Job Obliteration | DigestSchedulerService destroyed all jobs on restart | Now only obliterates in dev; prod removes only orphaned jobs |
| Template Path Resolution | Email templates not found in webpack/esbuild builds | Added fallback path resolution with env override |
| JWT_SECRET Validation | Runtime crash if JWT_SECRET not set | Throws at constructor initialization |

### HIGH Priority Issues (Fixed)

| Issue | Description | Fix |
|-------|-------------|-----|
| Digest Race Condition | Rapid preference updates could race scheduler | Added in-memory lock (Set) with proper typing |
| Presence Reconnection Race | Rapid WebSocket reconnects sent duplicate updates | Added 1-second debounce with timestamp check |
| Query Over-Invalidation | React Query invalidated too many queries | Added predicate function for precise matching |

### MEDIUM Priority Issues (Fixed)

| Issue | Description | Fix |
|-------|-------------|-----|
| Quiet Hours Validation | No client-side HH:MM format validation | Added regex validation with error display |
| Unsubscribe Rate Limiting | Public endpoint had no rate limiting | Added @Throttle decorator (3 req/sec) |
| Stale Presence Cleanup | No automatic cleanup of expired presence | Added cron job (every 5 min) using SCAN |

### LOW Priority Issues (Fixed)

| Issue | Description | Fix |
|-------|-------------|-----|
| Conflict Detection False Positives | Timestamp comparison too strict | Added 1-second tolerance for latency/clock skew |

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
