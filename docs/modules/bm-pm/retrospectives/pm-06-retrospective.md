# Epic PM-06: Real-Time & Notifications - Retrospective

**Epic:** PM-06 - Real-Time & Notifications
**Completion Date:** 2025-12-21
**Sprint Duration:** 3 days (accelerated delivery)
**Stories Completed:** 6/6
**Code Review Rounds:** 5 fix commits

---

## Executive Summary

Epic PM-06 successfully delivered a comprehensive real-time infrastructure for the HYVVE Core-PM module. This epic added WebSocket event broadcasting, presence tracking, real-time Kanban updates, notification preferences, in-app notifications, and email digest functionality.

### Key Achievements

- **All 6 stories completed** with end-to-end implementation
- **57 unit tests added** - first PM epic with meaningful test coverage
- **10 production issues** identified and fixed proactively
- **Comprehensive presence system** with Redis sorted sets and auto-cleanup
- **Flexible notification preferences** with 15 granular settings

---

## Team Velocity & Metrics

| Metric | Value |
|--------|-------|
| Stories Completed | 6/6 |
| Feature Commits | 6 |
| Code Review Fix Commits | 5 |
| Total Commits | 13 |
| Unit Tests Added | 57 |
| Files Changed | 50+ |
| Lines Added | ~4,500 |

### Stories Completed

| Story | Title | Status |
|-------|-------|--------|
| PM-06.1 | WebSocket Event Broadcasting | Done |
| PM-06.2 | Presence Indicators | Done |
| PM-06.3 | Real-Time Kanban | Done |
| PM-06.4 | Notification Preferences | Done |
| PM-06.5 | In-App Notifications | Done |
| PM-06.6 | Email Digest Notifications | Done |

---

## PM-05 Action Item Follow-Through

### Items Addressed

| ID | Action | Status | Evidence |
|----|--------|--------|----------|
| PM-05-NOTIF-1 | Complete notification integration | DONE | PM-06.4, PM-06.5, PM-06.6 |
| PM-05-TEST-1 | Add unit tests for services | Partial | 57 tests for notification/digest/presence |

### Items Not Addressed

| ID | Action | Status | Notes |
|----|--------|--------|-------|
| PM-05-TEST-2 | Integration tests for report endpoints | Not Done | Different module |
| PM-05-TEST-3 | Python tests for PM agents | Not Done | No Python in PM-06 |

### PM-05 Lessons Applied

| Lesson | PM-06 Status |
|--------|--------------|
| Frontend + backend in same stories | Applied - all 6 stories end-to-end |
| Constants extraction | Applied - TTL, debounce constants |
| Cron-based automation | Applied - presence cleanup, digest scheduling |
| Write tests during implementation | Partial - tests added during review phase |

---

## What Went Well

### 1. Comprehensive Real-Time Architecture

The WebSocket event system delivered is production-grade:
- 4 event categories (task, phase, project, team)
- 12+ specific event types
- Room-scoped broadcasting (project/workspace)
- Event Bus to WebSocket integration

**Code Pattern:**
```typescript
// Event emission pattern
this.realtimeGateway.emitToRoom(
  `project:${projectId}`,
  'pm.task.updated',
  { task, correlationId }
);
```

### 2. Production Hardening Process

Multiple rounds of code review caught 10 critical issues:

**CRITICAL Issues Fixed:**
- Job obliteration on restart (dev-only now)
- Template path resolution for webpack builds
- JWT_SECRET validation at startup

**HIGH Priority Issues Fixed:**
- Race condition in digest preference changes (in-memory lock)
- Presence reconnection duplicates (1-second debounce)
- Query over-invalidation (predicate functions)

**MEDIUM Priority Issues Fixed:**
- Quiet hours HH:MM validation
- Rate limiting on unsubscribe endpoint
- Stale presence cleanup cron

### 3. Test Coverage Breakthrough

First PM epic with meaningful test coverage:
- 23 NotificationsService tests
- 15 DigestService tests
- 19 PresenceService tests
- Mock patterns for Redis, BullMQ, Prisma

### 4. Presence Tracking with Redis

Robust presence implementation:
- Redis sorted sets with TTL timestamps
- Project-scoped rooms
- 5-minute cleanup cron using SCAN
- Configurable TTL via environment variable

### 5. Notification Preferences UI

Polished settings experience:
- 15 granular preference fields
- Per-type and per-channel toggles
- Quiet hours with timezone support
- Email digest frequency selection

---

## What Could Be Improved

### 1. Email Service is Still a Stub

**Issue:** EmailService logs emails instead of sending them.

**Impact:** Digest notifications don't actually deliver in production.

**Root Cause:** External provider integration deferred for MVP.

**Action Required:** Implement SendGrid/SES before production deployment.

### 2. Production vs Development Gaps

**Issue:** Several features worked in dev but failed in builds:
- Template path resolution
- Job obliteration behavior
- JWT secret fallbacks

**Root Cause:** Dev environment is more permissive than production.

**Lesson:** Test in build environment, not just dev mode.

### 3. Multi-Round Review Required

**Issue:** 5 fix commits needed after initial implementation.

**Impact:** Extended review cycle, multiple context switches.

**Root Cause:** Issues not caught during implementation.

**Lesson:** More thorough self-review before PR.

### 4. Push Notifications Not Implemented

**Issue:** PUSH channel returns null, UI shows "Coming Soon".

**Impact:** Mobile users don't receive notifications.

**Root Cause:** Web Push API complexity deferred.

**Status:** Technical debt for future epic.

---

## Technical Decisions Made

### 1. Redis Sorted Sets for Presence

**Decision:** Use sorted sets with TTL timestamps.
**Rationale:** Efficient cleanup via ZRANGEBYSCORE, atomic operations.
**Trade-off:** More complex than simple keys, but scales better.

### 2. BullMQ for Digest Scheduling

**Decision:** Use repeatable jobs with user-specific job keys.
**Rationale:** Reliable scheduling, persistence across restarts.
**Trade-off:** Requires Redis, adds operational complexity.

### 3. JWT Tokens for Unsubscribe

**Decision:** Signed JWT with 7-day expiry.
**Rationale:** Stateless verification, no database lookup.
**Trade-off:** Tokens can't be revoked before expiry.

### 4. React Query Predicate Invalidation

**Decision:** Use predicate functions instead of exact matching.
**Rationale:** Precise cache control, avoids over-invalidation.
**Trade-off:** More complex, but more accurate.

### 5. In-Memory Lock for Race Conditions

**Decision:** Use Set for in-memory locking.
**Rationale:** Prevents duplicate scheduling on rapid updates.
**Trade-off:** Not distributed - won't work across instances.

---

## Deliverables Summary

### WebSocket Events Added

| Category | Events |
|----------|--------|
| Task | created, updated, deleted, status_changed, assigned |
| Phase | created, updated, transitioned |
| Project | created, updated, deleted |
| Team | member_added, member_removed, member_updated |
| Presence | joined, left, updated |
| Notification | new, read, deleted |

### API Endpoints Added

**Notifications:**
- `GET /pm/notifications` - List notifications with pagination
- `GET /pm/notifications/unread-count` - Get unread count
- `PATCH /pm/notifications/:id/read` - Mark as read
- `PATCH /pm/notifications/read-all` - Mark all as read
- `DELETE /pm/notifications/:id` - Delete notification

**Preferences:**
- `GET /pm/notifications/preferences` - Get preferences
- `PATCH /pm/notifications/preferences` - Update preferences
- `POST /pm/notifications/preferences/reset` - Reset to defaults

**Presence:**
- `GET /pm/presence/:projectId` - Get project presence
- `GET /pm/presence/:projectId/:userId` - Get user presence

**Digest:**
- `GET /pm/notifications/digest/unsubscribe/:token` - Unsubscribe page

### Database Models Added/Updated

| Model | Changes |
|-------|---------|
| `NotificationPreference` | 15 new fields for preferences |
| `Notification` | Full model for notification storage |

### Frontend Components Added

| Component | Location | Purpose |
|-----------|----------|---------|
| `NotificationCenter` | `components/notifications/` | Bell icon with dropdown |
| `NotificationItem` | `components/notifications/` | Individual notification |
| `NotificationPreferencesPanel` | `components/notifications/` | Settings page |
| `PresenceBar` | `components/pm/presence/` | Avatar stack |
| `PresenceAvatar` | `components/pm/presence/` | Online indicator |
| `QuietHoursTimePicker` | `components/notifications/` | Time picker |

### Hooks Added

| Hook | Purpose |
|------|---------|
| `usePresence` | Track user presence with heartbeat |
| `useProjectPresence` | Query project presence |
| `useRealtimeKanban` | WebSocket Kanban sync |
| `useTaskConflictDetection` | Detect stale edits |
| `useNotificationsApi` | Notification CRUD |
| `useRealtimeNotifications` | Live notification events |

---

## Key Observations

### 1. Bundle Size (LOW Priority)

Framer Motion adds ~60KB to bundle. Acceptable for MVP, but consider:
- Code splitting for animation components
- Using `@motionone/dom` (~5KB) for simpler animations
- CSS animations for basic transitions

### 2. Accessibility

**Completed:**
- ARIA live regions added for notifications (`aria-live="polite"`)
- ARIA labels for presence avatars and presence bar

**Future:**
- Add keyboard navigation for notification list (arrow keys, Enter to select)
- Focus management when notification panel opens/closes

### 3. Email Service (HIGH - Future)

Currently a stub that logs instead of sending. Before production:
- Integrate real provider (SendGrid, AWS SES, or Resend)
- Add email templates to build pipeline
- Configure SMTP/API credentials
- Add delivery tracking and monitoring
- Handle bounces and complaints

### 4. Database Optimization

**Completed:**
- N+1 query fixed with batched user lookups in `getProjectPresence`
- Composite index for digest queries
- Partial index on unread notifications

**Future:**
- Cache user profiles in Redis (5min TTL) for presence queries
- Monitor query performance with large notification volumes

### 5. Template Robustness

**Completed:**
- Path resolution hardened with 4-tier fallback:
  1. `EMAIL_TEMPLATES_PATH` environment variable
  2. `__dirname` (development)
  3. `process.cwd()` relative path (bundled builds)
  4. `dist/` folder (compiled builds)

**Future:**
- Add integration test for production builds in CI
- Validate template existence at build time

---

## Action Items

### Production Readiness (Before Deployment)

| ID | Action | Owner | Priority |
|----|--------|-------|----------|
| PM-06-PROD-1 | Implement real email provider (SendGrid/SES) | Dev | High |
| PM-06-PROD-2 | Add email templates to build pipeline | Dev | Medium |
| PM-06-PROD-3 | Configure SMTP/API credentials | DevOps | High |
| PM-06-PROD-4 | Add email delivery monitoring | Dev | Medium |

### Technical Debt

| ID | Issue | Priority | Effort |
|----|-------|----------|--------|
| TD-PM06-1 | PUSH channel not implemented | Low | Medium |
| TD-PM06-2 | Framer Motion bundle size (~60KB) | Low | Medium |
| TD-PM06-3 | In-memory lock not distributed | Medium | Medium |
| TD-PM06-4 | Email templates hardcoded paths | Low | Low |

### Future Improvements

| ID | Issue | Priority | Notes |
|----|-------|----------|-------|
| FUT-PM06-1 | Add keyboard navigation for notification list | Low | Accessibility enhancement |
| FUT-PM06-2 | Cache user profiles in Redis (5min TTL) | Medium | Performance optimization after N+1 fix |
| FUT-PM06-3 | Add integration test for production builds | Medium | Template path validation in CI |
| FUT-PM06-4 | Code splitting for Framer Motion | Low | Bundle size optimization if needed |
| FUT-PM06-5 | Email delivery tracking/monitoring | High | Required with email provider integration |

### Documentation

| ID | Action | Owner |
|----|--------|-------|
| DOC-PM06-1 | Add WebSocket event reference to API docs | Dev |
| DOC-PM06-2 | Document email provider configuration | Dev |
| DOC-PM06-3 | Add presence troubleshooting runbook | Dev |

---

## Lessons Learned

### What to Keep Doing

1. **Production hardening phase** - 10 issues caught before deployment
2. **Multi-round code review** - Thorough review process works
3. **Unit tests for services** - 57 tests is a good foundation
4. **Constants extraction** - TTL, debounce values externalized
5. **Debounce and throttle patterns** - Prevents duplicate events

### What to Start Doing

1. **Test in build environment** - Not just dev mode
2. **Consider multi-instance from start** - In-memory locks don't scale
3. **Stub external services explicitly** - Email service pattern
4. **Add E2E tests for WebSocket flows** - Unit tests alone insufficient
5. **Write tests during implementation** - Not just in review phase

### What to Stop Doing

1. **Obliterating jobs in production** - Use orphan cleanup instead
2. **Fallback secrets** - Fail fast on missing configuration
3. **Deferring all tests to review** - Write during implementation
4. **Assuming dev environment matches production** - Always test builds

---

## Team Agreements

1. Write tests alongside implementation, not after
2. Test template/path resolution in build environment before merging
3. Use production-safe defaults (no obliteration, strict validation)
4. Rate limit all public endpoints
5. Validate environment configuration at startup (fail fast)

---

## Impact on Next Epic (PM-07)

Epic PM-07 (Integrations & Bridge Agent) builds on PM-06:

### Dependencies Met

- WebSocket events ready for import progress updates
- Notification system for import completion alerts
- Presence for collaborative import sessions

### Patterns to Reuse

1. **BullMQ jobs** - For long-running import operations
2. **Progress events** - WebSocket updates during import
3. **Notification creation** - Import complete/failed notifications

### No Blockers Identified

PM-07 can proceed independently. All PM-06 features that PM-07 depends on are complete.

---

## Conclusion

Epic PM-06 was a successful delivery that added comprehensive real-time infrastructure to HYVVE's Core-PM module. The production hardening process proved valuable, catching 10 issues that could have caused production failures.

**Key achievements:**
- Complete WebSocket event system (12+ events)
- Robust presence tracking with Redis
- Flexible notification preferences (15 settings)
- Email digest with BullMQ scheduling
- 57 unit tests (first PM epic with coverage)

**Critical gap:**
- Email service needs production implementation before deployment

The patterns established (debouncing, rate limiting, fail-fast validation) will serve future epics well.

---

**Retrospective Completed:** 2025-12-21
**Next Epic:** PM-07 - Integrations & Bridge Agent
**Status:** Ready to proceed with action items noted

---

## Appendix: Commit Timeline

1. `8ef6820` - Feat(pm-06.1): WebSocket event broadcasting
2. `7595502` - Feat(pm-06.2): Presence indicators
3. `1b03a15` - Feat(pm-06.3): Real-time Kanban
4. `59c9087` - Feat(pm-06.4): Notification preferences
5. `3a928d5` - Feat(pm-06.5): In-app notifications
6. `265c9d8` - Feat(pm-06.6): Email digest
7. `8f97211` - Docs: README and CHANGELOG
8. `e09039a` - Fix: code review findings (14 issues)
9. `fe57cfb` - Refactor: extract TTL constants
10. `8ef7b07` - Fix: JSX apostrophe escaping
11. `2647c27` - Docs: code review follow-up tracking
12. `def4fa0` - Fix: code review follow-up items (57 tests)
13. `c338c56` - Fix: production hardening (10 issues)

## Appendix: Files Changed Summary

**Backend Services:**
- `apps/api/src/pm/notifications/notifications.service.ts`
- `apps/api/src/pm/notifications/notifications.controller.ts`
- `apps/api/src/pm/notifications/digest.service.ts`
- `apps/api/src/pm/notifications/digest-scheduler.service.ts`
- `apps/api/src/pm/notifications/digest-unsubscribe.controller.ts`
- `apps/api/src/realtime/presence.service.ts`
- `apps/api/src/realtime/realtime.gateway.ts`
- `apps/api/src/realtime/realtime-event.handler.ts`

**Frontend Components:**
- `apps/web/src/components/notifications/NotificationCenter.tsx`
- `apps/web/src/components/notifications/NotificationItem.tsx`
- `apps/web/src/components/notifications/NotificationPreferencesPanel.tsx`
- `apps/web/src/components/pm/presence/PresenceBar.tsx`
- `apps/web/src/components/pm/presence/PresenceAvatar.tsx`
- `apps/web/src/components/pm/kanban/TaskCard.tsx`

**Hooks:**
- `apps/web/src/hooks/use-presence.ts`
- `apps/web/src/hooks/use-project-presence.ts`
- `apps/web/src/hooks/use-realtime-kanban.ts`
- `apps/web/src/hooks/use-task-conflict-detection.ts`
- `apps/web/src/hooks/use-notifications-api.ts`
- `apps/web/src/hooks/use-realtime-notifications.ts`

**Tests:**
- `apps/api/src/pm/notifications/notifications.service.spec.ts` (23 tests)
- `apps/api/src/pm/notifications/digest.service.spec.ts` (15 tests)
- `apps/api/src/realtime/presence.service.spec.ts` (19 tests)
