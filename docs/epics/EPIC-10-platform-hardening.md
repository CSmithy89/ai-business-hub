# Epic 10: Platform Hardening

**Epic ID:** EPIC-10
**Status:** Backlog
**Priority:** P0/P1 - Critical/High
**Phase:** Post-Foundation Stabilization

---

## Epic Overview

Fix all P0 critical and P1 high-priority security and infrastructure issues identified during Epic 00-09 retrospectives. This epic addresses production blockers and security vulnerabilities before new feature development.

### Business Value
Production-ready platform with enterprise-grade security. Eliminates known vulnerabilities and ensures reliable operation at scale.

### Success Criteria
- [ ] All P0 critical issues resolved
- [ ] Rate limiting distributed via Redis (not in-memory)
- [ ] Encryption keys validated at startup
- [ ] CSRF protection enabled on all state-changing routes
- [ ] Database migrations verified and documented

### Dependencies
- **None** - Can start immediately
- **Parallel with:** EPIC-11 (Agent Integration), EPIC-12 (UX Polish)

---

## Stories

### Story 10.1: Redis Rate Limiting Migration

**Points:** 3
**Priority:** P0 Critical

**As a** platform operator
**I want** distributed rate limiting via Redis
**So that** rate limits persist across server restarts and work in serverless deployments

**Acceptance Criteria:**
- [ ] AC1: Install `@upstash/ratelimit` package
- [ ] AC2: Create Redis rate limiter utility in `apps/web/src/lib/utils/rate-limit-redis.ts`
- [ ] AC3: Configure Upstash Redis connection via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] AC4: Replace in-memory rate limiter in `apps/web/src/app/api/auth/2fa/verify-login/route.ts`
- [ ] AC5: Replace duplicate rate limiter in `apps/web/src/lib/utils/rate-limit.ts`
- [ ] AC6: Add fallback to in-memory for local development when Redis unavailable
- [ ] AC7: Rate limits persist across server restarts (verified in staging)
- [ ] AC8: Update `docs/DEPLOYMENT.md` with Upstash configuration

**Files:**
- `apps/web/src/lib/utils/rate-limit.ts` (modify)
- `apps/web/src/lib/utils/rate-limit-redis.ts` (create)
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts` (modify)
- `packages/config/.env.example` (update)

**Technical Notes:**
- Consolidates two duplicate rate limiters into single implementation
- Upstash provides serverless-friendly Redis

---

### Story 10.2: Encryption Key Validation

**Points:** 2
**Priority:** P0 Critical

**As a** security engineer
**I want** startup validation of encryption key entropy
**So that** weak keys are caught before production deployment

**Acceptance Criteria:**
- [ ] AC1: Create key validation utility in `apps/web/src/lib/utils/validate-secrets.ts`
- [ ] AC2: Validate `BETTER_AUTH_SECRET` is at least 32 characters
- [ ] AC3: Validate key has sufficient entropy (not simple patterns like "aaaa...")
- [ ] AC4: Log warning in development if key is weak
- [ ] AC5: Fail startup in production if key doesn't meet requirements
- [ ] AC6: Add validation to Next.js instrumentation or middleware

**Files:**
- `apps/web/src/lib/utils/validate-secrets.ts` (create)
- `apps/web/src/instrumentation.ts` (create/modify)

**Technical Notes:**
- BETTER_AUTH_SECRET used for JWT signing and session encryption
- Entropy validation prevents dictionary-based keys

---

### Story 10.3: Fix Trusted Device Feature

**Points:** 2
**Priority:** P0 Critical

**As a** user
**I want** the "Trust this device" feature to work correctly
**So that** I'm not misled by non-functional UI

**Acceptance Criteria:**
- [ ] AC1: Audit current `isTrustedDevice()` implementation
- [ ] AC2: Option A: Implement database-backed trusted device storage
  - Store device fingerprint, user agent, IP in database
  - Validate cookies against stored devices
  - Add device management UI in settings
- [ ] AC3: Option B: Remove feature entirely
  - Remove cookie creation code
  - Remove "Trust this device" checkbox from UI
  - Clean up dead code paths
- [ ] AC4: Whichever option chosen, no misleading UX remains
- [ ] AC5: Update security documentation

**Files:**
- `apps/web/src/lib/trusted-device.ts` (modify/delete)
- `apps/web/src/components/auth/two-factor-verify.tsx` (modify)

**Technical Notes:**
- Current implementation creates cookies but `isTrustedDevice()` always returns false
- Recommend Option B (remove) for simplicity unless full implementation is required

---

### Story 10.4: Enable Global ValidationPipe

**Points:** 1
**Priority:** P0 Critical

**As a** backend developer
**I want** automatic DTO validation on all endpoints
**So that** invalid input is rejected before reaching business logic

**Acceptance Criteria:**
- [ ] AC1: Verify ValidationPipe configuration in `apps/api/src/main.ts`
- [ ] AC2: Enable `transform: true` for automatic type transformation
- [ ] AC3: Enable `whitelist: true` to strip unknown properties
- [ ] AC4: Enable `forbidNonWhitelisted: true` to reject unknown properties
- [ ] AC5: Test with existing DTOs (`ReplayEventsDto`, etc.)
- [ ] AC6: Add integration test for validation behavior

**Files:**
- `apps/api/src/main.ts` (modify)
- `apps/api/src/events/dto/replay-events.dto.ts` (verify)

**Technical Notes:**
- NestJS ValidationPipe with class-validator decorators
- Ensures all API input is validated before processing

---

### Story 10.5: Database Migration Verification

**Points:** 2
**Priority:** P0 Critical

**As a** database administrator
**I want** pending schema migrations verified and documented
**So that** deployment proceeds safely

**Acceptance Criteria:**
- [ ] AC1: Run `npx prisma migrate dev` against development database
- [ ] AC2: Verify AgentChatMessage model migrated correctly
- [ ] AC3: Verify AgentSession model migrated correctly
- [ ] AC4: Verify all indexes created (especially tenantId indexes)
- [ ] AC5: Test migration against clean database (reset + migrate)
- [ ] AC6: Verify multi-tenant isolation works with new models
- [ ] AC7: Document migration steps in `docs/MIGRATION-GUIDE-EPIC-10.md`

**Files:**
- `packages/db/prisma/schema.prisma` (verify)
- `packages/db/prisma/migrations/` (generate)
- `docs/MIGRATION-GUIDE-EPIC-10.md` (create)

**Technical Notes:**
- Epic 08 added AgentChatMessage and AgentSession models
- Migration requires database availability

---

### Story 10.6: CSRF Protection

**Points:** 3
**Priority:** P1 High

**As a** security engineer
**I want** CSRF token validation on state-changing routes
**So that** cross-site request forgery attacks are prevented

**Acceptance Criteria:**
- [ ] AC1: Evaluate Next.js Server Actions built-in CSRF protection
- [ ] AC2: If using API routes, implement CSRF middleware
- [ ] AC3: Generate CSRF token on session creation
- [ ] AC4: Include CSRF token in all forms and AJAX requests
- [ ] AC5: Validate token on all state-changing endpoints (POST/PUT/DELETE)
- [ ] AC6: Reject requests with missing/invalid tokens (403)
- [ ] AC7: Add CSRF token to client-side fetch utilities

**Files:**
- `apps/web/src/middleware.ts` (modify)
- `apps/web/src/lib/csrf.ts` (create)
- `apps/web/src/lib/api-client.ts` (modify)

**Technical Notes:**
- All POST/PUT/DELETE routes currently lack CSRF protection
- Consider SameSite=Strict cookies as additional defense

---

### Story 10.7: XSS Sanitization Hardening

**Points:** 2
**Priority:** P1 High

**As a** security engineer
**I want** robust XSS sanitization using DOMPurify
**So that** regex-bypass attacks are prevented

**Acceptance Criteria:**
- [ ] AC1: Install `isomorphic-dompurify` package
- [ ] AC2: Create sanitization utility in `apps/web/src/lib/utils/sanitize.ts`
- [ ] AC3: Replace regex sanitization in `apps/web/src/app/api/workspaces/[id]/roles/route.ts`
- [ ] AC4: Apply sanitization to all user-generated content inputs
- [ ] AC5: Add unit tests for XSS edge cases (event handlers, data URIs, SVG, etc.)
- [ ] AC6: Audit chat message rendering for XSS vectors

**Files:**
- `apps/web/src/lib/utils/sanitize.ts` (create)
- `apps/web/src/app/api/workspaces/[id]/roles/route.ts` (modify)
- `apps/web/src/components/chat/ChatMessage.tsx` (audit)

**Technical Notes:**
- Current regex-based sanitization can be bypassed
- DOMPurify is industry standard for HTML sanitization

---

### Story 10.8: Backup Code Race Condition Fix

**Points:** 3
**Priority:** P1 High

**As a** security engineer
**I want** atomic backup code usage
**So that** same code cannot be used twice under concurrent requests

**Acceptance Criteria:**
- [ ] AC1: Implement pessimistic locking in backup code verification
- [ ] AC2: Use database transaction with `SELECT ... FOR UPDATE`
- [ ] AC3: Mark code as used atomically within same transaction
- [ ] AC4: Alternative: Implement optimistic concurrency with version check
- [ ] AC5: Add concurrency test to verify fix
- [ ] AC6: Log attempted duplicate usage for security monitoring

**Files:**
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts` (modify)
- Prisma client extension for locking (if needed)

**Technical Notes:**
- Time window between bcrypt verify and mark-as-used allows race condition
- Under high concurrency, same backup code could be used twice

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 8 |
| Total Points | 21 |
| P0 Critical | 5 stories (10 points) |
| P1 High | 3 stories (8 points) |
| Dependencies | None |
| Parallel with | EPIC-11, EPIC-12 |

---

## Technical Debt Addressed

From `docs/sprint-artifacts/CONSOLIDATED-TECH-DEBT-AND-IMPROVEMENTS.md`:

| Issue | Priority | Status After Epic |
|-------|----------|-------------------|
| In-memory rate limiting | P0 | Resolved |
| Trusted device incomplete | P0 | Resolved |
| Encryption key validation | P0 | Resolved |
| Missing ValidationPipe | P0 | Resolved |
| Database migration pending | P0 | Resolved |
| XSS sanitization | P1 | Resolved |
| Backup code race condition | P1 | Resolved |
| CSRF protection | P1 | Resolved |

---

_Generated by BMAD Party Mode Planning Session_
_Date: 2025-12-05_
