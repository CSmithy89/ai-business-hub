# Epic 14: Testing & Observability

**Epic ID:** EPIC-14
**Status:** Backlog
**Priority:** P2/P3 - Medium/Low
**Phase:** Post-Foundation Enhancement

---

## Epic Overview

Close remaining testing gaps from Epic 00-09 retrospectives and add production observability features. This epic ensures comprehensive test coverage and monitoring capabilities for production deployment.

### Business Value
Confidence in production deployments through comprehensive testing. Real-time visibility into system health and performance. Faster incident response with proper observability.

### Success Criteria
- [ ] All critical testing gaps closed
- [ ] Prometheus metrics endpoint operational
- [ ] Operational runbooks documented
- [ ] Test coverage meets minimum thresholds

### Dependencies
- **Partial dependency on EPIC-11** for agent-related tests
- **Partial dependency on EPIC-10** for rate limiting tests
- **Can start immediately** for stories without dependencies

---

## Stories

### Story 14.1: Rate Limit Concurrency Tests

**Points:** 2
**Priority:** P2 Medium
**Depends on:** EPIC-10 Story 10.1 (Redis Rate Limiting)

**As a** developer
**I want** concurrency tests for rate limiting
**So that** I can verify rate limits work under load

**Acceptance Criteria:**
- [ ] AC1: Create test file `apps/web/src/__tests__/rate-limit.test.ts`
- [ ] AC2: Test concurrent requests against same endpoint
- [ ] AC3: Verify rate limit is enforced correctly under concurrency
- [ ] AC4: Test sliding window behavior
- [ ] AC5: Test rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)
- [ ] AC6: Use Redis test container for integration tests

**Files:**
- `apps/web/src/__tests__/rate-limit.test.ts` (create)
- `docker/docker-compose.test.yml` (modify for Redis)

**Testing Gap Addressed:** "Rate limiting concurrency behavior" from tech debt tracker

---

### Story 14.2: Zustand Store Unit Tests

**Points:** 2
**Priority:** P2 Medium
**Depends on:** None

**As a** developer
**I want** unit tests for Zustand stores
**So that** state transitions are verified

**Acceptance Criteria:**
- [ ] AC1: Create test file for UI store (`apps/web/src/store/__tests__/ui-store.test.ts`)
- [ ] AC2: Test sidebar collapse/expand transitions
- [ ] AC3: Test theme toggle transitions
- [ ] AC4: Test command palette open/close
- [ ] AC5: Test notification state management
- [ ] AC6: Verify localStorage persistence works correctly
- [ ] AC7: Test hydration behavior

**Files:**
- `apps/web/src/store/__tests__/ui-store.test.ts` (create)
- `apps/web/src/store/__tests__/test-utils.ts` (create)

**Testing Gap Addressed:** "Unit tests for Zustand store transitions" from tech debt tracker

---

### Story 14.3: File Upload Pipeline Tests

**Points:** 3
**Priority:** P2 Medium
**Depends on:** None

**As a** developer
**I want** tests for document upload and extraction
**So that** file processing is verified

**Acceptance Criteria:**
- [ ] AC1: Create test file `apps/web/src/__tests__/file-upload.test.ts`
- [ ] AC2: Test PDF upload and text extraction
- [ ] AC3: Test DOCX upload and text extraction
- [ ] AC4: Test file size limits enforcement
- [ ] AC5: Test file type validation
- [ ] AC6: Test upload progress tracking
- [ ] AC7: Create test fixtures with sample documents

**Files:**
- `apps/web/src/__tests__/file-upload.test.ts` (create)
- `apps/web/src/__tests__/fixtures/sample.pdf` (create)
- `apps/web/src/__tests__/fixtures/sample.docx` (create)

**Testing Gap Addressed:** "File upload/extraction pipeline" from tech debt tracker

---

### Story 14.4: Prometheus Metrics Export

**Points:** 4
**Priority:** P2 Medium
**Depends on:** None

**As an** operator
**I want** Prometheus-compatible metrics endpoint
**So that** I can integrate with Grafana dashboards

**Acceptance Criteria:**
- [ ] AC1: Install `prom-client` package for NestJS API
- [ ] AC2: Create `/metrics` endpoint returning Prometheus format
- [ ] AC3: Export event bus metrics (throughput, lag, DLQ size)
- [ ] AC4: Export API latency histogram (request duration)
- [ ] AC5: Export active connections count
- [ ] AC6: Export approval queue depth
- [ ] AC7: Export AI provider health status
- [ ] AC8: Document metrics in `docs/observability.md`

**Files:**
- `apps/api/src/metrics/metrics.module.ts` (create)
- `apps/api/src/metrics/metrics-controller.ts` (create)
- `apps/api/src/metrics/metrics-service.ts` (create)
- `docs/observability.md` (create)

**Tech Debt Addressed:** "No Prometheus Metrics Export" from tech debt tracker

---

### Story 14.5: Operational Runbooks

**Points:** 4
**Priority:** P3 Low
**Depends on:** None

**As an** operator
**I want** documented runbooks for common operations
**So that** I can handle incidents efficiently

**Acceptance Criteria:**
- [ ] AC1: Create `docs/runbooks/` directory structure
- [ ] AC2: Document DLQ management procedures (view, retry, purge)
- [ ] AC3: Document event replay procedures
- [ ] AC4: Document database recovery procedures
- [ ] AC5: Document rate limit emergency bypass
- [ ] AC6: Document agent restart procedures
- [ ] AC7: Document key rotation procedures
- [ ] AC8: Include troubleshooting decision trees

**Files:**
- `docs/runbooks/dlq-management.md` (create)
- `docs/runbooks/database-recovery.md` (create)
- `docs/runbooks/incident-response.md` (create)
- `docs/runbooks/key-rotation.md` (create)
- `docs/runbooks/README.md` (create index)

**Documentation Gap Addressed:** "Operational Runbook" from tech debt tracker

### Story 14.6: CSRF Integration Tests (NEW - Epic 10 Tech Debt)

**Points:** 3
**Priority:** P2 Medium
**Depends on:** EPIC-10 Story 10.6 (CSRF Protection)

**As a** developer
**I want** integration tests for the CSRF protection flow
**So that** I can verify CSRF works correctly end-to-end

**Acceptance Criteria:**
- [ ] AC1: Create test file `apps/web/src/__tests__/csrf-integration.test.ts`
- [ ] AC2: Test full CSRF flow from token fetch to protected endpoint
- [ ] AC3: Test quick actions (approve/reject) with CSRF validation
- [ ] AC4: Test expired token handling and automatic refresh
- [ ] AC5: Test session change invalidates token
- [ ] AC6: Test missing token returns 403
- [ ] AC7: Test invalid token returns 403
- [ ] AC8: Test concurrent requests with same token

**Files:**
- `apps/web/src/__tests__/csrf-integration.test.ts` (create)
- `apps/web/src/__tests__/quick-actions-csrf.test.ts` (create)

**Testing Gap Addressed:** "CSRF integration tests" from Epic 10 retrospective

---

### Story 14.7: Agent Endpoint Rate Limiting (NEW - Epic 11 Tech Debt)

**Points:** 2
**Priority:** P1 High
**Depends on:** EPIC-11 (Agent Integration), EPIC-10 Story 10.1 (Redis Rate Limiting)

**As a** platform operator
**I want** rate limiting on agent API endpoints
**So that** the system is protected from API abuse

**Acceptance Criteria:**
- [ ] AC1: Apply Redis rate limiting to `/agents/validation/runs`
- [ ] AC2: Apply Redis rate limiting to `/agents/planning/runs`
- [ ] AC3: Apply Redis rate limiting to `/agents/branding/runs`
- [ ] AC4: Configure appropriate limits (e.g., 10 requests/minute per user)
- [ ] AC5: Return 429 Too Many Requests with Retry-After header
- [ ] AC6: Log rate limit violations for monitoring
- [ ] AC7: Add rate limit headers to responses

**Files:**
- `agents/middleware/rate_limit.py` (create)
- `agents/main.py` (modify - add rate limit middleware)

**Tech Debt Addressed:** "Add rate limiting to agent endpoints" from Epic 11 retrospective

---

### Story 14.8: Business ID Ownership Validation (NEW - Epic 11 Tech Debt)

**Points:** 2
**Priority:** P1 High
**Depends on:** EPIC-11 (Agent Integration)

**As a** security engineer
**I want** validation that users can only access their own businesses
**So that** tenant isolation is enforced at the API level

**Acceptance Criteria:**
- [ ] AC1: Validate business_id belongs to user's workspace in validation endpoint
- [ ] AC2: Validate business_id belongs to user's workspace in planning endpoint
- [ ] AC3: Validate business_id belongs to user's workspace in branding endpoint
- [ ] AC4: Return 403 Forbidden for unauthorized business access
- [ ] AC5: Log unauthorized access attempts
- [ ] AC6: Add integration tests for ownership validation

**Files:**
- `agents/middleware/business_validator.py` (create)
- `agents/main.py` (modify - add validation)
- `agents/tests/test_business_ownership.py` (create)

**Security Gap Addressed:** "Validate business_id ownership" from Epic 11 retrospective

---

### Story 14.9: Agent Client Unit Tests (NEW - Epic 11 Tech Debt)

**Points:** 2
**Priority:** P2 Medium
**Depends on:** EPIC-11 (Agent Integration)

**As a** developer
**I want** unit tests for the agent-client.ts module
**So that** API client behavior is verified

**Acceptance Criteria:**
- [ ] AC1: Create test file `apps/web/src/lib/__tests__/agent-client.test.ts`
- [ ] AC2: Test runTeamChat with successful response
- [ ] AC3: Test runTeamChat with network error
- [ ] AC4: Test runTeamChat with timeout
- [ ] AC5: Test JSON parsing error handling
- [ ] AC6: Mock fetch for isolated testing
- [ ] AC7: Test all three team clients (validation, planning, branding)

**Files:**
- `apps/web/src/lib/__tests__/agent-client.test.ts` (create)

**Testing Gap Addressed:** "Add agent-client.ts unit tests" from Epic 11 retrospective

---

### Story 14.10: Agent Response Runtime Validation (NEW - Epic 11 Tech Debt)

**Points:** 2
**Priority:** P2 Medium
**Depends on:** EPIC-11 (Agent Integration)

**As a** developer
**I want** Zod runtime validation for agent API responses
**So that** type safety is guaranteed at runtime

**Acceptance Criteria:**
- [ ] AC1: Create Zod schema for TeamRunResponse
- [ ] AC2: Validate agent responses before processing in frontend
- [ ] AC3: Handle validation errors gracefully with fallback
- [ ] AC4: Log validation failures for debugging
- [ ] AC5: Add session persistence using localStorage
- [ ] AC6: Restore session_id on page refresh

**Files:**
- `apps/web/src/lib/agent-client.ts` (modify - add Zod)
- `apps/web/src/lib/schemas/agent-response.ts` (create)

**Tech Debt Addressed:** "Add Zod runtime validation" and "Implement session persistence" from Epic 11 retrospective

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 10 |
| Total Points | 26 |
| P1 High | 2 stories (4 points) |
| P2 Medium | 7 stories (18 points) |
| P3 Low | 1 story (4 points) |
| Dependencies | Partial (EPIC-10, EPIC-11) |
| Can Start Immediately | Stories 14.2, 14.3, 14.4, 14.5 |
| Requires EPIC-11 | Stories 14.7, 14.8, 14.9, 14.10 |

---

## Testing Gaps Addressed

From `docs/sprint-artifacts/CONSOLIDATED-TECH-DEBT-AND-IMPROVEMENTS.md`:

| Gap | Story | Status After Epic |
|-----|-------|-------------------|
| Rate limiting concurrency behavior | 14.1 | Resolved |
| Unit tests for Zustand store transitions | 14.2 | Resolved |
| File upload/extraction pipeline | 14.3 | Resolved |
| CSRF integration tests (Epic 10 tech debt) | 14.6 | Resolved |

From Epic 11 Retrospective (`docs/sprint-artifacts/epic-11-retro-2025-12-06.md`):

| Gap | Story | Status After Epic |
|-----|-------|-------------------|
| Add rate limiting to agent endpoints | 14.7 | Resolved |
| Validate business_id ownership | 14.8 | Resolved |
| Add agent-client.ts unit tests | 14.9 | Resolved |
| Add Zod runtime validation | 14.10 | Resolved |
| Implement session persistence | 14.10 | Resolved |

**Note:** Agent-related E2E tests were completed in EPIC-11 Story 11.5.

---

### Story 14.19: Rate Limit Header Implementation

**Points:** 2  
**Priority:** P2 Medium  
**Depends on:** Story 14.1 (Rate Limit Concurrency Tests)

**As an** API consumer  
**I want** every rate-limited HTTP route to emit standard `X-RateLimit-*` headers  
**So that** clients can adjust request volume before hitting hard limits

**Acceptance Criteria:**
- [ ] AC1: Export the shared `generateRateLimitHeaders()` helper from `lib/utils/rate-limit.ts`
- [ ] AC2: Attach headers for all auth-related routes that call `checkRateLimit`
- [ ] AC3: Attach headers for workspace/API routes using rate limiting
- [ ] AC4: Add tests verifying headers for representative endpoints
- [ ] AC5: Update documentation/story files to describe header behavior

**Files:**
- `apps/web/src/lib/utils/rate-limit.ts` (export helper + doc)
- `apps/web/src/app/api/**/route.ts` (forward helper output to responses)
- `apps/web/src/__tests__/rate-limit.test.ts` (header assertions)
- `docs/stories/14-19-rate-limit-headers.md` (story doc)

**Definition of Done:**
- [ ] All rate-limited endpoints emit `X-RateLimit-Limit`, `-Remaining`, and `-Reset`
- [ ] Automated tests cover header emission for representative routes
- [ ] Story file captures implementation/testing details


---

## Observability Stack

After completing this epic, the following monitoring will be available:

```
┌─────────────────────────────────────────────────────────────┐
│                     Prometheus Metrics                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ event_bus_throughput_total                              ││
│  │ event_bus_consumer_lag                                  ││
│  │ event_bus_dlq_size                                      ││
│  │ http_request_duration_seconds (histogram)               ││
│  │ http_requests_total                                     ││
│  │ approval_queue_depth                                    ││
│  │ ai_provider_health{provider="claude|openai|..."}        ││
│  │ active_websocket_connections                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Grafana Dashboards                        │
│  - Event Bus Health                                          │
│  - API Performance                                           │
│  - Approval Queue Status                                     │
│  - AI Provider Status                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Runbook Structure

```
docs/runbooks/
├── README.md                  # Index with links
├── dlq-management.md          # Dead letter queue operations
├── event-replay.md            # Event replay procedures
├── database-recovery.md       # DB backup/restore
├── incident-response.md       # General incident handling
├── key-rotation.md            # Encryption key rotation
└── troubleshooting/
    ├── auth-failures.md
    ├── agent-errors.md
    └── performance-issues.md
```

---

_Generated by BMAD Party Mode Planning Session_
_Date: 2025-12-05_
