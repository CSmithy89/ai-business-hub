# Consolidated Technical Debt, Issues & Future Enhancements

**Generated:** 2025-12-05
**Source:** Epic 00-09 Retrospectives
**Project:** HYVVE Platform

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [Critical Issues (P0)](#critical-issues-p0)
3. [High Priority Issues (P1)](#high-priority-issues-p1)
4. [Medium Priority Issues (P2)](#medium-priority-issues-p2)
5. [Low Priority Issues (P3)](#low-priority-issues-p3)
6. [Technical Debt by Category](#technical-debt-by-category)
7. [Testing Gaps](#testing-gaps)
8. [Documentation Gaps](#documentation-gaps)
9. [Future Enhancements](#future-enhancements)
10. [Resolved Items](#resolved-items)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Epics Reviewed | 10 (Epic 00-09) |
| Total Stories Delivered | 96 |
| Total Story Points | 209 |
| Outstanding Critical Issues | 5 |
| Outstanding High Priority Issues | 12 |
| Outstanding Medium Priority Issues | 18 |
| Outstanding Low Priority Issues | 15 |
| Testing Gaps | 6 (was 12, 6 resolved) |
| Documentation Gaps | 6 |

---

## Critical Issues (P0)

### Production Blockers - Must Fix Before Go-Live

#### 1. In-Memory Rate Limiting Not Production-Ready
**Epic:** 09 | **Status:** PENDING

**Location:**
- `apps/web/src/lib/utils/rate-limit.ts`
- `apps/web/src/app/api/auth/2fa/verify-login/route.ts`

**Issue:** Two different in-memory rate limiters using Map storage. Clears on server restart. In serverless deployments, each instance has its own Map.

**Risk:** HIGH - Attackers can bypass rate limits by hitting different instances or waiting for restarts.

**Required Fix:** Migrate to Redis (Upstash) for distributed rate limiting.

---

#### 2. Incomplete Trusted Device Feature
**Epic:** 09 | **Status:** PENDING (feature disabled)

**Location:** `apps/web/src/lib/trusted-device.ts`

**Issue:** Creates cookies but never validates them. `isTrustedDevice()` always returns `false`.

**Risk:** MEDIUM - Dead code path, misleading users who enable "trust this device".

**Required Fix:** Either remove cookie creation entirely OR implement full database-backed trusted device storage and validation.

---

#### 3. Encryption Key Not Validated
**Epic:** 09 | **Status:** PENDING

**Location:** Multiple files using `BETTER_AUTH_SECRET`

**Issue:** No startup validation that encryption key has sufficient entropy.

**Required Fix:** Add validation requiring minimum 32-byte entropy. Log warning or fail startup if key is too weak.

---

#### 4. Missing Input Validation Pipeline
**Epic:** 05 | **Status:** PENDING

**Location:** `apps/api/src/events/dto/replay-events.dto.ts`

**Issue:** ReplayEventsDto has validation decorators, but ValidationPipe may not be enabled globally.

**Required Fix:** Verify ValidationPipe is enabled in main.ts or per-route.

---

#### 5. Database Migration Pending
**Epic:** 08 | **Status:** PENDING (requires DB)

**Issue:** Schema changes for AgentChatMessage, AgentSession need migration verification.

**Required Actions:**
1. When DB is available: `npx prisma migrate dev`
2. Test migration against clean database
3. Verify multi-tenant isolation

---

## High Priority Issues (P1)

### Security & Stability - Should Fix Soon

#### 1. XSS Sanitization May Be Insufficient
**Epic:** 09 | **Status:** PENDING

**Location:** `apps/web/src/app/api/workspaces/[id]/roles/route.ts`

**Issue:** Current regex-based sanitization can potentially be bypassed.

**Recommendation:** Use DOMPurify for robust sanitization. Add unit tests for edge cases.

---

#### 2. Backup Code Race Condition
**Epic:** 09 | **Status:** PENDING

**Location:** `verify-login/route.ts:86-99`

**Issue:** Time window between bcrypt verify and mark-as-used. Same backup code could be used twice under high concurrency.

**Required Fix:** Use pessimistic locking in transaction OR implement optimistic concurrency with version check.

---

#### 3. Account Unlinking Logic Gap
**Epic:** 09 | **Status:** PENDING

**Location:** `unlink-account/route.ts:75-82`

**Issue:** Checks for password presence but not if password credential is actually functional.

**Required Fix:** Validate credential has valid/active authentication before allowing unlink.

---

#### 4. JSON Field Validation Missing
**Epic:** 08 | **Status:** PENDING

**Location:** JSON columns in ValidationSession, PlanningSession, BrandingSession

**Issue:** No JSON schema validation. Malformed data could cause runtime errors.

**Recommendation:** Define Zod schemas for JSON fields and validate before saving.

---

#### 5. Missing CSRF Protection
**Epic:** 08 | **Status:** PENDING

**Location:** All POST/PUT/DELETE routes

**Issue:** No CSRF token validation on state-changing operations.

**Recommendation:** Add CSRF middleware or use Next.js Server Actions built-in protection.

---

#### 6. Harden AgentOS Error Handling
**Epic:** 04 | **Status:** PENDING

**Issue:** AgentOS error handling and retry logic needs hardening.

---

#### 7. Wire Up Approval Event Emissions
**Epic:** 04 | **Status:** PENDING

**Issue:** Approval events are stubs, need real implementation.

---

#### 8. E2E Permission Flow Tests
**Epic:** 03, 04 | **Status:** PENDING

**Issue:** Need integration tests across RLS + Prisma Extension + Guards layers.

---

#### 9. Complete Audit Logging Integration
**Epic:** 03 | **Status:** PENDING

**Issue:** Audit service only integrated with module permission changes. Role changes and member add/remove not logged.

---

#### 10. Agent Session Persistence
**Epic:** 08 | **Status:** PENDING

**Issue:** AgentChatMessage and AgentSession models exist but aren't used in chat APIs.

**Recommendation:** Persist messages to enable conversation continuity.

---

#### 11. File Storage Adapters for Production
**Epic:** 08 | **Status:** PARTIAL

**Location:** `apps/web/src/lib/storage/`

**Issue:** Pattern implemented but S3/Supabase adapters are stubs.

**Required Fix:** Implement full adapters for production deployment.

---

#### 12. Agno Agent API Wiring
**Epic:** 08 | **Status:** PENDING

**Issue:** Agent code EXISTS in `/agents/` but only ApprovalAgent is exposed via API. Validation, Planning, and Branding teams need endpoints added to `agents/main.py`.

**What EXISTS:** Full Agno implementations (~55K lines) for all 16 agents across 3 teams.

**What's NEEDED:**
- Add `/agents/validation/runs` endpoint
- Add `/agents/planning/runs` endpoint
- Add `/agents/branding/runs` endpoint
- Connect frontend workflow pages to these endpoints

---

## Medium Priority Issues (P2)

### Code Quality & Performance

#### 1. No Event Schema Versioning
**Epic:** 05 | **Status:** PENDING

**Issue:** Version field hardcoded to '1.0'. When schemas evolve, handlers may break on old events.

**Recommendation:** Define event schema migration strategy, add version-based handler routing.

---

#### 2. No Prometheus Metrics Export
**Epic:** 05 | **Status:** PENDING

**Issue:** Dashboard great for humans, but no Prometheus/Grafana integration.

**Recommendation:** Add `/metrics` endpoint with throughput, lag, DLQ size, duration histogram.

---

#### 3. Duplicate Rate Limiters
**Epic:** 09 | **Status:** PENDING

**Issue:** Two separate rate limiting implementations exist.

**Required Fix:** Consolidate to single rate-limit utility.

---

#### 4. Inconsistent Error Formats
**Epic:** 09 | **Status:** PENDING

**Issue:** Error response format varies across endpoints.

**Required Fix:** Standardize to `{ success: false, error: { code, message } }`.

---

#### 5. Magic Numbers in Code
**Epic:** 09, 08 | **Status:** PARTIAL

**Issue:** Hardcoded values like `100000` (PBKDF2 iterations), `10000` (rate limit entries) scattered.

**Required Fix:** Extract to named constants.

---

#### 6. Missing Type Safety
**Epic:** 09 | **Status:** PENDING

**Location:** `unlink-account/route.ts:102`

**Issue:** Uses `as any` type assertion for audit event type.

**Required Fix:** Add `ACCOUNT_UNLINKED` to `AuditEventType` enum.

---

#### 7. TypeScript Strictness
**Epic:** 08 | **Status:** PENDING

**Issue:** Optional chaining that could be replaced with proper null checks.

---

#### 8. PgBouncer Session Mode Documentation
**Epic:** 03 | **Status:** PENDING

**Issue:** RLS requires session mode. Need deployment documentation.

---

#### 9. Permission Check Memoization
**Epic:** 03 | **Status:** PENDING

**Issue:** May need memoization after monitoring production performance.

---

#### 10. Query Performance Monitoring Post-RLS
**Epic:** 03 | **Status:** PENDING

**Issue:** Need metrics after production deployment.

---

#### 11. TokenUsage Prisma Indexes Migration
**Epic:** 06 | **Status:** PENDING

**Issue:** Indexes added to schema but migration not run yet.

---

#### 12. Register ScheduleModule
**Epic:** 06 | **Status:** PENDING

**Location:** `apps/api/src/ai-providers/ai-providers.module.ts`

**Issue:** Required for health check cron job.

---

#### 13. ChatPanel v2 for Multi-Agent
**Epic:** 07 | **Status:** PENDING

**Issue:** Current ChatPanel is static mock UI, needs multi-agent architecture.

---

#### 14. Image File Upload Integration
**Epic:** 02 | **Status:** PENDING

**Issue:** Workspace image uses URL input rather than file upload.

**Recommendation:** Integrate with Supabase Storage or S3.

---

#### 15. Ownership Transfer Feature
**Epic:** 02 | **Status:** SCHEDULED (Story 02-8)

**Issue:** No mechanism for workspace owner to transfer ownership.

---

#### 16. Email Template System
**Epic:** 01, 02 | **Status:** PENDING

**Issue:** Verification and invitation emails use basic inline styles.

**Recommendation:** Create shared email template system with consistent branding.

---

#### 17. Error Handling Inconsistencies
**Epic:** 08 | **Status:** PARTIAL

**Issue:** Some endpoints return generic errors without logging or proper codes.

---

#### 18. Error Correlation IDs
**Epic:** 08 | **Status:** PENDING

**Issue:** Need to wire telemetry throughout workflow routes.

---

## Low Priority Issues (P3)

### Nice to Have

#### 1. Frontend Delete Confirmation Not Accessible
**Epic:** 05 | **Status:** PENDING

**Location:** `apps/web/src/app/admin/events/page.tsx`

**Issue:** Uses `confirm()` which is not accessible.

**Recommendation:** Use proper modal component.

---

#### 2. Frontend API Response Validation
**Epic:** 05 | **Status:** PENDING

**Issue:** Frontend hooks don't validate response shapes at runtime.

---

#### 3. Console Logs in Production
**Epic:** 07 | **Status:** PENDING

**Issue:** Multiple `console.log` statements for placeholder functionality.

---

#### 4. Missing Skip Links
**Epic:** 07 | **Status:** PENDING

**Issue:** No "skip to main content" link for keyboard navigation.

---

#### 5. localStorage Persistence Security
**Epic:** 07 | **Status:** DOCUMENTED

**Issue:** Zustand persists UI state without encryption. Don't add sensitive data.

---

#### 6. Hard Delete Scheduler
**Epic:** 02 | **Status:** PENDING

**Issue:** 30-day workspace deletion grace period needs scheduled hard delete.

---

#### 7. localStorage Session Fallback
**Epic:** 02 | **Status:** PENDING

**Issue:** Session workspace persistence may need client-side fallback.

---

#### 8. ENCRYPTION_MASTER_KEY Deployment Documentation
**Epic:** 06 | **Status:** PENDING

**Issue:** 32+ char key, rotation procedures need documentation.

---

#### 9. Pagination for CSV Export
**Epic:** 06 | **Status:** PENDING

**Issue:** Handle large datasets gracefully.

---

#### 10. Integration Tests for Provider Health Checks
**Epic:** 06 | **Status:** PENDING

---

#### 11. Key Rotation Runbook
**Epic:** 06 | **Status:** PENDING

---

#### 12. ESLint Apostrophe Handling
**Epic:** 01 | **Status:** DOCUMENTED

**Issue:** Unescaped apostrophes trigger ESLint errors. Consider rule override.

---

#### 13. Enable JWT Signature Verification
**Epic:** 00 | **Status:** PENDING

**Issue:** Disabled for MVP, needs enabling for production.

---

#### 14. Accessibility Improvements
**Epic:** 08 | **Status:** PARTIAL

**Issue:** Need ARIA labels, keyboard nav, screen reader testing.

---

#### 15. Operational Runbook
**Epic:** 05 | **Status:** PENDING

**Issue:** Missing `docs/runbooks/event-bus.md` covering DLQ management, replay procedures, recovery.

---

## Technical Debt by Category

### Security Technical Debt

| Item | Epic | Priority | Status |
|------|------|----------|--------|
| In-memory rate limiting | 09 | Critical | Pending |
| Trusted device incomplete | 09 | Critical | Pending |
| Encryption key validation | 09 | Critical | Pending |
| XSS sanitization | 09 | High | Pending |
| Backup code race condition | 09 | High | Pending |
| Account unlinking validation | 09 | High | Pending |
| CSRF protection | 08 | High | Pending |
| JWT signature verification | 00 | Low | Pending |

### Performance Technical Debt

| Item | Epic | Priority | Status |
|------|------|----------|--------|
| TokenUsage indexes | 06 | Medium | Pending |
| Permission check memoization | 03 | Medium | Monitor |
| RLS query performance | 03 | Medium | Monitor |
| Backup code N+1 pattern | 09 | Low | Monitor |

### Code Quality Technical Debt

| Item | Epic | Priority | Status |
|------|------|----------|--------|
| Duplicate rate limiters | 09 | Medium | Pending |
| Inconsistent error formats | 09 | Medium | Pending |
| Magic numbers | 09, 08 | Medium | Partial |
| Type safety (`as any`) | 09 | Medium | Pending |

### Infrastructure Technical Debt

| Item | Epic | Priority | Status |
|------|------|----------|--------|
| Database migrations | 08 | Critical | Pending |
| File storage adapters | 08 | High | Partial |
| ScheduleModule registration | 06 | Medium | Pending |
| Event schema versioning | 05 | Medium | Pending |

---

## Testing Gaps

### Critical Testing Needed

| Test Suite | Epic | Status | Test File |
|------------|------|--------|-----------|
| 2FA setup flow (happy path + errors) | 09 | ✅ Done | `two-factor-auth.spec.ts` |
| Rate limiting concurrency behavior | 09 | Pending | - |
| Backup code regeneration | 09 | ✅ Done | `two-factor-auth.spec.ts` |
| Permission validation edge cases | 09 | ✅ Done | `team-members.spec.ts` |
| OAuth failure states and recovery | 09 | ✅ Done | `oauth-providers.spec.ts` |
| Account unlinking safeguards | 09 | ✅ Done | `oauth-providers.spec.ts` |
| E2E permission flow tests (RLS + Prisma + Guards) | 03, 04 | ✅ Done | `rls.integration.spec.ts` |
| Workflow API tests (validation, planning, branding) | 08 | Pending | - |
| File upload/extraction pipeline | 08 | Pending | - |
| Agent team configurations | 08 | Pending | - |
| Integration tests for handoff workflows | 08 | Pending | - |
| Unit tests for Zustand store transitions | 07 | Pending | -|

### Additional Test Coverage Added (2025-12-05)

| Test Suite | Epic | Test File |
|------------|------|-----------|
| Approval queue E2E (cards, bulk, confidence routing) | 04 | `approvals.spec.ts` |
| Event bus E2E (health, DLQ, replay, stats) | 05 | `events.spec.ts` |
| BYOAI configuration E2E (providers, tokens, health) | 06 | `ai-providers.spec.ts` |
| Team members UI E2E (stats, search, invitations) | 09 | `team-members.spec.ts` |

---

## Documentation Gaps

| Document | Epic | Status |
|----------|------|--------|
| Epic 09 Migration Guide (env vars, schema changes) | 09 | Pending |
| API Documentation (JSDoc/OpenAPI) for all new routes | 09 | Pending |
| Event Bus Operational Runbook | 05 | Pending |
| ENCRYPTION_MASTER_KEY deployment guide | 06 | Pending |
| PgBouncer session mode requirements | 03 | Pending |
| Docker environment verification | 00 | Resolved |

---

## Future Enhancements

### Authentication & Security

| Enhancement | Source Epic | Priority |
|-------------|-------------|----------|
| Redis-based distributed rate limiting | 09, 01 | High |
| Full trusted device implementation | 09 | Medium |
| Multi-factor authentication expansion (SMS, WebAuthn) | 09 | Low |
| SAML/SSO integration | PRD (Enterprise) | Future |
| SCIM user provisioning | PRD (Enterprise) | Future |

### User Experience

| Enhancement | Source Epic | Priority |
|-------------|-------------|----------|
| ChatPanel v2 for multi-agent conversations | 07, 08 | High |
| Email template system with branding | 01, 02 | Medium |
| Image file upload for workspaces | 02 | Medium |
| Skip links for accessibility | 07 | Medium |
| Dark mode design tokens review | 06 | Low |

### Platform Features

| Enhancement | Source Epic | Priority |
|-------------|-------------|----------|
| Ownership transfer flow | 02 | Medium |
| Agent session persistence | 08 | High |
| Agno AI integration for workflows | 08 | High |
| Prometheus metrics export | 05 | Medium |
| Hard delete scheduler | 02 | Low |
| Custom data retention policies | PRD (Enterprise) | Future |
| White-labeling options | PRD (Enterprise) | Future |
| Dedicated tenant infrastructure | PRD (Enterprise) | Future |
| Multi-region deployment | PRD (Vision) | Future |
| Marketplace for community modules | PRD (Vision) | Future |

### RBAC Enhancements (from PRD)

| Enhancement | Source | Priority |
|-------------|--------|----------|
| Custom role creation | PRD (Advanced RBAC) | Medium |
| Permission templates | PRD (Advanced RBAC) | Medium |
| Time-limited access grants | PRD (Advanced RBAC) | Medium |
| Audit log export for compliance | PRD (Advanced RBAC) | Medium |

### Mobile & Offline (from PRD Vision)

| Enhancement | Source | Priority |
|-------------|--------|----------|
| Mobile applications (iOS/Android) | PRD (Vision) | Future |
| Offline mode with sync | PRD (Vision) | Future |
| AI model fine-tuning per tenant | PRD (Vision) | Future |
| SOC2 Type II certification | PRD (Vision) | Future |

### Agent Team Integration (API Wiring Required)

**Status Update (2025-12-05):** Agent code EXISTS in `/agents/` directory with full Agno configurations. What's missing is API integration.

#### ✅ Agent Code EXISTS (Implemented)

| Team | Location | Agents | Lines of Code |
|------|----------|--------|---------------|
| **Validation** | `agents/validation/` | Vera, Marco, Cipher, Persona, Risk | ~17K lines |
| **Planning** | `agents/planning/` | Blake, Model, Finn, Revenue, Forecast | ~17K lines |
| **Branding** | `agents/branding/` | Bella, Sage, Vox, Iris, Artisan, Audit | ~21K lines |

All agents use proper Agno framework:
- `agno.agent.Agent` and `agno.team.Team`
- `agno.models.anthropic.Claude`
- `agno.storage.postgres.PostgresStorage`
- Custom tools for each domain

#### ❌ What's NOT Done (Integration Tasks)

| Task | Priority | Effort |
|------|----------|--------|
| Add `/agents/validation/runs` endpoint to `main.py` | High | Small |
| Add `/agents/planning/runs` endpoint to `main.py` | High | Small |
| Add `/agents/branding/runs` endpoint to `main.py` | High | Small |
| Connect Next.js workflow pages to agent endpoints | High | Medium |
| Test end-to-end with actual AI providers | High | Medium |
| Add session persistence for agent conversations | Medium | Small |

**Note:** Only `/agents/approval/runs` (ApprovalAgent) is currently exposed in `main.py`.

### Developer Experience

| Enhancement | Source Epic | Priority |
|-------------|-------------|----------|
| Consolidated rate-limit utility | 09 | Medium |
| Standardized error response format | 09 | Medium |
| Event schema versioning strategy | 05 | Medium |
| Constants extraction | 09, 08 | Low |

---

## Resolved Items

### Critical Issues Resolved

| Item | Epic | Resolution |
|------|------|------------|
| 2FA bypass vulnerability | 09 | Changed to fail-closed pattern |
| Rate limit memory leak | 09 | Added MAX_ENTRIES cap |
| Missing input sanitization | 09 | Added sanitizeInput() |
| Race condition in event handlers | 05 | Moved status update outside loop |
| Consumer loop error handling | 05 | Added circuit breaker |
| DLQ trimming without warning | 05 | Added size threshold warnings |
| Raw SQL in EventReplayService | 05 | Replaced with Prisma Client API |
| Tenant isolation in DLQ | 05 | Added TenantGuard and filtering |

### High Priority Issues Resolved

| Item | Epic | Resolution |
|------|------|------------|
| Admin endpoints authentication | 05 | Verified guards present |
| Silent metadata update failures | 05 | Added retry with backoff |
| Sync PBKDF2 blocking event loop | 06 | Converted to async |
| CSV injection vulnerability | 06 | Added sanitizeCSVValue() |
| Logger leaking sensitive data | 06 | Changed to log only messages |
| Keyboard shortcut modifier bug | 07 | Fixed logic |
| XSS in chat messages | 07 | Added DOMPurify |
| Missing error boundaries | 07 | Wrapped layout sections |
| Document parser placeholders | 08 | Implemented real PDF/DOCX parsing |
| API pagination | 08 | Implemented cursor + offset pagination |
| Rate limiting middleware | 08 | Created with X-RateLimit headers |
| Storage adapter pattern | 08 | Implemented with S3/Supabase stubs |

### Medium Priority Issues Resolved

| Item | Epic | Resolution |
|------|------|------------|
| Hardcoded configuration values | 05 | Centralized in constants |
| BullMQ job retention | 05 | Added BULLMQ_CONFIG |
| Pattern matching documentation | 05 | Added JSDoc to decorator |
| Zod validation for events | 05 | Added 8 payload schemas |
| CreateWorkspaceModal | 02 | Implemented |
| E2E workspace tests | 02 | Fixed and compiled |
| Password special character validation | 01 | Resolved |

---

## Action Item Summary

### Immediate (Before Production)

1. Migrate rate limiting to Redis/Upstash
2. Validate encryption key entropy on startup
3. Run database migrations
4. Enable ValidationPipe globally
5. Implement full S3/Supabase storage adapters

### Next Sprint

1. Fix backup code race condition with locking
2. Implement CSRF protection
3. Add JSON field validation schemas
4. Complete agent session persistence
5. Integrate Agno AI for workflows
6. Add comprehensive test coverage

### Backlog

1. Event schema versioning
2. Prometheus metrics
3. Email template system
4. Ownership transfer
5. ChatPanel v2 architecture
6. Operational runbooks

---

## PRD Status Notes

### Items Completed But Not Marked in PRD

The following items from the PRD "Growth Features (Post-MVP)" section were **implemented in Epic 09** but the PRD checkboxes haven't been updated:

- [x] GitHub OAuth provider - **Done** (Story 09.2)
- [x] Microsoft OAuth provider (enterprise) - **Done** (Story 09.1)
- [x] Magic link / passwordless authentication - **Done** (Story 09.6)
- [x] 2FA/TOTP support - **Done** (Story 09.3, 09.4, 09.5)
- [x] Account linking (multiple OAuth providers) - **Done** (Story 09.7)

**Action:** Update `docs/prd.md` to check these items as complete.

### Items Not Yet Implemented from PRD

**Advanced RBAC (Post-MVP):**
- [ ] Custom role creation
- [ ] Permission templates
- [ ] Time-limited access grants
- [ ] Audit log export for compliance

**Enterprise Features:**
- [ ] SAML/SSO integration
- [ ] SCIM user provisioning
- [ ] Custom data retention policies
- [ ] White-labeling options
- [ ] Dedicated tenant infrastructure

**Vision (Future):**
- [ ] Mobile applications (iOS/Android)
- [ ] Offline mode with sync
- [ ] AI model fine-tuning per tenant
- [ ] Marketplace for community modules
- [ ] Multi-region deployment
- [ ] SOC2 Type II certification

### Business Onboarding - Agent Integration Status

Epic 08 built the **infrastructure** for Business Onboarding (database models, APIs, workflows, UI pages). The **Agno agent code also EXISTS** in `/agents/` directory:

| Team | PRD Description | Code Status | API Status |
|------|-----------------|-------------|------------|
| Vera's Team (Validation) | 5 agents | ✅ Implemented | ❌ Not wired up |
| Blake's Team (Planning) | 5 agents | ✅ Implemented | ❌ Not wired up |
| Bella's Team (Branding) | 6 agents | ✅ Implemented | ❌ Not wired up |

**What EXISTS:**
- Full Agno agent configurations in `agents/validation/`, `agents/planning/`, `agents/branding/`
- Team orchestration with `agno.team.Team`
- Custom tools for each domain (market research, competitor analysis, etc.)
- PostgreSQL storage integration

**What's MISSING:**
- API endpoints in `agents/main.py` (only ApprovalAgent exposed)
- Frontend integration with workflow pages
- End-to-end testing with AI providers

**Next Steps:** Wire up existing agent code to API endpoints and connect to frontend.

---

*Document compiled from Epic 00-09 retrospectives and PRD analysis*
*Last Updated: 2025-12-05 (Testing gaps updated with new E2E test coverage)*
