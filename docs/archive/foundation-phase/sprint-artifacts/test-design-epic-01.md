# Test Design: Epic 01 - Authentication System

**Date:** 2025-12-02
**Author:** chris (TEA Agent)
**Status:** Draft

---

## Executive Summary

**Scope:** Full test design for Epic 01 - Authentication System

**Risk Summary:**
- Total risks identified: 12
- High-priority risks (score >= 6): 4
- Critical categories: SEC (Security), BUS (Business)

**Coverage Summary:**
- P0 scenarios: 11 tests (~22 hours)
- P1 scenarios: 14 tests (~14 hours)
- P2/P3 scenarios: 8 tests (~4 hours)
- **Total effort**: ~40 hours (~5 days)

---

## Risk Assessment

### High-Priority Risks (Score >= 6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|-------------|-------------|--------|-------|------------|-------|----------|
| R-001 | SEC | Authentication bypass via manipulated JWT | 2 | 3 | 6 | Validate JWT signature on every request, test with tampered tokens | QA | Sprint 1 |
| R-002 | SEC | Password hash storage weakness | 2 | 3 | 6 | Verify Argon2id configuration, test hash format, never log passwords | DEV | Sprint 1 |
| R-003 | SEC | Session hijacking via token theft | 2 | 3 | 6 | HTTP-only cookies, secure flag, test XSS vectors | QA | Sprint 1 |
| R-004 | BUS | User cannot complete registration | 2 | 3 | 6 | E2E happy path, error handling, email delivery validation | QA | Sprint 1 |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|-------------|-------------|--------|-------|------------|-------|
| R-005 | SEC | CSRF attack on auth endpoints | 1 | 3 | 3 | Verify better-auth CSRF protection, test cross-origin requests | QA |
| R-006 | TECH | better-auth Prisma adapter compatibility | 2 | 2 | 4 | Integration tests for all auth flows with real database | DEV |
| R-007 | TECH | Google OAuth callback handling failure | 2 | 2 | 4 | Test OAuth flow end-to-end, handle edge cases | QA |
| R-008 | DATA | Session state inconsistency across devices | 2 | 2 | 4 | Test multi-device scenarios, session listing | QA |
| R-009 | BUS | Email verification link expired | 2 | 2 | 4 | Test 24hr expiry, resend functionality, clear error messages | QA |
| R-010 | BUS | Password reset fails silently | 2 | 2 | 4 | Test complete reset flow, verify session invalidation | QA |

### Low-Priority Risks (Score 1-2)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|-------------|--------|-------|--------|
| R-011 | PERF | Sign-in latency exceeds 300ms target | 1 | 2 | 2 | Monitor p95 response times |
| R-012 | OPS | Resend email delivery delays | 1 | 2 | 2 | Monitor delivery webhooks |

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## Test Coverage Plan

### P0 (Critical) - Run on every commit

**Criteria**: Blocks core journey + High risk (>= 6) + No workaround

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-1.1 User registration with valid email/password | E2E | R-004 | 1 | QA | Happy path registration flow |
| AC-2.2 Verification link activates account | E2E | R-004 | 1 | QA | Email verification completes |
| AC-3.1 Sign in with valid credentials | E2E | R-001, R-002 | 1 | QA | Login creates valid session |
| AC-3.2 Invalid credentials rejected | API | R-001 | 2 | QA | Wrong password, timing-safe |
| AC-3.3 Unverified user cannot sign in | API | R-001 | 1 | QA | Block unverified accounts |
| AC-4.1 Google OAuth initiates correctly | E2E | R-007 | 1 | QA | Redirect to Google consent |
| AC-6.1 Session persists across page loads | E2E | R-003 | 1 | QA | Cookie persistence |
| AC-6.2 Sign out clears session | E2E | R-003 | 1 | QA | Session invalidation |
| JWT signature validation | Unit | R-001 | 2 | DEV | Reject tampered tokens |

**Total P0**: 11 tests, ~22 hours

### P1 (High) - Run on PR to main

**Criteria**: Important features + Medium risk (3-4) + Common workflows

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| AC-1.2 Email format validation | Unit | - | 2 | DEV | Client + server validation |
| AC-1.3 Password strength validation | Unit | - | 3 | DEV | Weak/medium/strong |
| AC-1.4 Duplicate email rejected | API | - | 1 | QA | 409 Conflict response |
| AC-2.3 Expired verification token handled | API | R-009 | 1 | QA | 24hr expiry |
| AC-4.2 Google OAuth creates/links account | API | R-007 | 2 | QA | New user + existing |
| AC-5.1 Password reset email sent | API | R-010 | 1 | QA | Email delivery |
| AC-5.2 Password reset updates password | API | R-010 | 1 | QA | Password updated |
| AC-5.3 Expired reset token rejected | API | R-010 | 1 | QA | 1hr expiry |
| AC-6.3 Sign out all devices | API | R-008 | 1 | QA | Bulk invalidation |
| AC-7.1 Rate limiting enforced | API | - | 1 | QA | 429 response |

**Total P1**: 14 tests, ~14 hours

### P2 (Medium) - Run nightly/weekly

**Criteria**: Secondary features + Low risk (1-2) + Edge cases

| Requirement | Test Level | Risk Link | Test Count | Owner | Notes |
|-------------|------------|-----------|------------|-------|-------|
| Email case normalization | Unit | - | 1 | DEV | test@EXAMPLE.com = test@example.com |
| OAuth email collision | API | R-007 | 1 | QA | Google email matches password user |
| Password reset with active session | API | - | 1 | QA | Session preserved vs invalidated |
| Concurrent sign-in attempts | API | - | 1 | QA | Race condition handling |
| Token reuse prevention | API | - | 2 | QA | Verification + reset tokens |

**Total P2**: 6 tests, ~3 hours

### P3 (Low) - Run on-demand

**Criteria**: Nice-to-have + Exploratory + Performance benchmarks

| Requirement | Test Level | Test Count | Owner | Notes |
|-------------|------------|------------|-------|-------|
| Sign-in p95 latency | Performance | 1 | DEV | < 300ms target |
| Password hashing duration | Performance | 1 | DEV | 200-500ms range |

**Total P3**: 2 tests, ~1 hour

---

## Execution Order

### Smoke Tests (< 5 min)

**Purpose**: Fast feedback, catch build-breaking issues

- [x] Homepage loads (30s) - `smoke.spec.ts`
- [x] Sign-in page loads with form (30s) - `smoke.spec.ts`
- [x] Sign-up page loads (30s) - `smoke.spec.ts`

**Total**: 3 scenarios

### P0 Tests (< 10 min)

**Purpose**: Critical path validation

- [ ] Register with valid email/password (E2E)
- [ ] Email verification flow (E2E)
- [ ] Sign in with valid credentials (E2E)
- [ ] Invalid credentials rejected (API)
- [ ] Unverified user blocked (API)
- [ ] Google OAuth initiation (E2E)
- [ ] Session persistence (E2E)
- [ ] Sign out (E2E)
- [ ] JWT validation (Unit)

**Total**: 11 scenarios

### P1 Tests (< 30 min)

**Purpose**: Important feature coverage

- [ ] Email validation (Unit)
- [ ] Password strength (Unit)
- [ ] Duplicate email (API)
- [ ] Verification token expiry (API)
- [ ] Google OAuth account linking (API)
- [ ] Password reset flow (API)
- [ ] Reset token expiry (API)
- [ ] Sign out all devices (API)
- [ ] Rate limiting (API)

**Total**: 14 scenarios

### P2/P3 Tests (< 60 min)

**Purpose**: Full regression coverage

- [ ] Edge cases (Unit/API)
- [ ] Performance benchmarks (Performance)

**Total**: 8 scenarios

---

## Resource Estimates

### Test Development Effort

| Priority | Count | Hours/Test | Total Hours | Notes |
|----------|-------|------------|-------------|-------|
| P0 | 11 | 2.0 | 22 | Complex setup, security critical |
| P1 | 14 | 1.0 | 14 | Standard coverage |
| P2 | 6 | 0.5 | 3 | Simple edge cases |
| P3 | 2 | 0.5 | 1 | Performance benchmarks |
| **Total** | **33** | **-** | **40** | **~5 days** |

### Prerequisites

**Test Data:**
- `UserFactory` - Create users with faker (auto-cleanup)
- `WorkspaceFactory` - Create workspaces for multi-tenant tests
- Seeded test user: `test@example.com` / `Test1234!`

**Tooling:**
- Playwright for E2E browser automation
- Vitest for unit/integration tests (when added)
- Mock Resend service for email tests

**Environment:**
- Local PostgreSQL via Docker
- Redis for rate limiting tests
- `.env.local` with test credentials

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: >= 95% (waivers required for failures)
- **P2/P3 pass rate**: >= 90% (informational)
- **High-risk mitigations**: 100% complete or approved waivers

### Coverage Targets

- **Critical paths**: >= 80%
- **Security scenarios**: 100%
- **Business logic**: >= 70%
- **Edge cases**: >= 50%

### Non-Negotiable Requirements

- [x] All P0 tests pass
- [x] No high-risk (>= 6) items unmitigated
- [x] Security tests (SEC category) pass 100%
- [x] Performance targets met (PERF category)

---

## Mitigation Plans

### R-001: Authentication bypass via manipulated JWT (Score: 6)

**Mitigation Strategy:**
1. Verify JWT signature validation on every protected route
2. Test with tampered payloads (modified claims, invalid signature)
3. Ensure timing-safe comparison for token validation

**Owner:** QA
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** E2E tests with tampered tokens return 401

### R-002: Password hash storage weakness (Score: 6)

**Mitigation Strategy:**
1. Verify better-auth uses Argon2id (not bcrypt or MD5)
2. Test that passwords are never logged or returned in responses
3. Validate hash format in database matches Argon2id pattern

**Owner:** DEV
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Unit test for hash format, audit logging review

### R-003: Session hijacking via token theft (Score: 6)

**Mitigation Strategy:**
1. Verify HTTP-only flag on session cookies
2. Test Secure flag in production config
3. Validate CSP headers prevent XSS vectors
4. Test session invalidation on password change

**Owner:** QA
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** Browser inspection of cookie attributes

### R-004: User cannot complete registration (Score: 6)

**Mitigation Strategy:**
1. E2E test full registration flow (form -> email -> verify -> login)
2. Test error handling for each failure point
3. Validate Resend integration delivers emails < 5 seconds
4. Test retry/resend verification email functionality

**Owner:** QA
**Timeline:** Sprint 1
**Status:** Planned
**Verification:** E2E test passes in CI

---

## Assumptions and Dependencies

### Assumptions

1. better-auth Prisma adapter is compatible with Prisma 6.x
2. Resend API is available and credentials are configured
3. Google Cloud OAuth consent is configured for development
4. Test users can receive emails (or mock in CI)

### Dependencies

1. PostgreSQL database running - Required for all tests
2. Resend API key - Required for email tests
3. Google OAuth credentials - Required for OAuth tests

### Risks to Plan

- **Risk**: Resend unavailable in CI environment
  - **Impact**: Cannot test email delivery end-to-end
  - **Contingency**: Mock Resend responses, test email content separately

- **Risk**: Google OAuth requires manual consent
  - **Impact**: Cannot fully automate OAuth E2E tests
  - **Contingency**: Test up to redirect, mock callback

---

## Test Files Reference

### Existing Test Files

| File | Purpose | Status |
|------|---------|--------|
| `apps/web/tests/e2e/smoke.spec.ts` | Basic page load sanity | Created |
| `apps/web/tests/e2e/auth.spec.ts` | Authentication E2E flows | Created |
| `apps/web/tests/support/fixtures/index.ts` | Composable fixtures | Created |
| `apps/web/tests/support/fixtures/factories/user-factory.ts` | User data factory | Created |
| `apps/web/tests/support/fixtures/factories/workspace-factory.ts` | Workspace data factory | Created |

### Required Test API Endpoints

For factory cleanup and test data setup:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/test/create-user` | POST | Create test user via API |
| `/api/test/delete-user/:id` | DELETE | Cleanup test user |
| `/api/test/create-workspace` | POST | Create test workspace |
| `/api/test/delete-workspace/:id` | DELETE | Cleanup test workspace |

**Note**: These endpoints should only be enabled in `TEST_ENV=local` environments.

---

## Approval

**Test Design Approved By:**

- [ ] Product Manager: _______ Date: _______
- [ ] Tech Lead: _______ Date: _______
- [ ] QA Lead: _______ Date: _______

**Comments:**

---

## Appendix

### Knowledge Base References

- `risk-governance.md` - Risk classification framework
- `probability-impact.md` - Risk scoring methodology
- `test-levels-framework.md` - Test level selection
- `test-priorities-matrix.md` - P0-P3 prioritization

### Related Documents

- PRD: `docs/prd.md`
- Epic: `docs/epics/EPIC-01/`
- Architecture: `docs/architecture.md`
- Tech Spec: `docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-01.md`

---

**Generated by**: BMad TEA Agent - Test Architect Module
**Workflow**: `.bmad/bmm/workflows/testarch/test-design`
**Version**: 4.0 (BMad v6)
