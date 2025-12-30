# bm-dm Module: Consolidated Tech Debt & Recommendations

**Module:** bm-dm (Dynamic Module System)
**Generated:** 2025-12-31
**Source:** Retrospectives from Epics DM-01 through DM-06
**Total Items:** 75

---

## Executive Summary

This document consolidates all tech debt, recommendations, lessons learned, and gaps identified across all 6 retrospectives from the bm-dm module (38 stories, 231 points delivered).

| Category | Count |
|----------|-------|
| Tech Debt Items | 20 |
| Recommendations | 27 |
| Lessons Learned | 16 |
| Documentation Gaps | 6 |
| Testing Gaps | 6 |
| **TOTAL** | **75** |

---

## Tech Debt (20 Items)

### Critical Priority

| ID | Item | Source | Status |
|----|------|--------|--------|
| TD-01 | `/kb` SSR issue (window usage) blocking clean builds | DM-01 | Unresolved |
| TD-02 | Pre-existing test failures (rate-limit, TimelineView, WidgetSlotGrid) | DM-03 | Tracked |
| TD-17 | Pre-existing ~24 failing TypeScript tests (DashboardSlots, API, Redis mock) | DM-05 | Tracked |

### High Priority

| ID | Item | Source | Status |
|----|------|--------|--------|
| TD-03 | DM-02.9 status mismatch (story says in-progress, sprint says done) | DM-02 | Needs reconciliation |
| TD-04 | Redis persistence not implemented (deferred from DM-04.5) | DM-04 | Deferred |
| TD-05 | Keyboard shortcut conflicts between legacy chat and Copilot chat | DM-01 | Unresolved |
| TD-06 | Constants mismatch for chat shortcut (`DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT`) | DM-01 | Unresolved |
| TD-18 | Integration tests for progress streaming deferred (AC21) | DM-05 | E2E pending |
| TD-19 | Approval cancellation API not implemented | DM-05 | Backend needed |

### Medium Priority

| ID | Item | Source | Status |
|----|------|--------|--------|
| TD-07 | Widget type duplication (WIDGET_TYPES list in frontend/backend) | DM-03 | Unresolved |
| TD-08 | CopilotKit API drift between spec and implementation | DM-01 | Needs update |
| TD-09 | Missing implementation notes for DM-01.6 to DM-01.8 | DM-01 | Documentation |
| TD-10 | Missing implementation notes for DM-02.5 to DM-02.9 | DM-02 | Documentation |
| TD-11 | `useAlerts` selector creates new filtered array on each call | DM-04 | Performance |
| TD-12 | `useAgentStateWidget` rebuilds object vs selecting from store | DM-04 | Performance |
| TD-13 | Response parsers (Navi/Pulse/Herald) need schema validation | DM-04 | Data integrity |
| TD-14 | Metrics state unbounded (MAX_ALERTS=50, MAX_ACTIVITIES=100 exist, metrics don't) | DM-04 | State bloat risk |
| TD-20 | `wait_for_approval()` uses polling fallback (less efficient than event-driven) | DM-05 | Efficiency |

### Low Priority

| ID | Item | Source | Status |
|----|------|--------|--------|
| TD-15 | Retry button not wired in ErrorWidget (onRetry prop available but unused) | DM-03 | UX |
| TD-16 | Naming complexity: pulse→Vitals, navi→projectStatus, herald→activity | DM-02/04 | Cognitive overhead |

---

## Recommendations (27 Items)

### High Priority

| ID | Recommendation | Source | Effort | Rationale |
|----|----------------|--------|--------|-----------|
| REC-01 | Add Zod schemas for widget data payloads - validate before rendering | DM-03 | Medium | Data integrity |
| REC-02 | Implement short TTL caching (5-10s) for dashboard data | DM-03 | Medium | Performance |
| REC-03 | Add rate limiting for A2A endpoints - per-workspace limits | DM-03 | Medium | Production stability |
| REC-04 | Distributed tracing (OpenTelemetry) for A2A calls | DM-03 | High | Observability |
| REC-22 | Address pre-existing test failures before starting new epics | DM-05 | Medium | Test gate reliability |

### Medium Priority

| ID | Recommendation | Source | Effort | Rationale |
|----|----------------|--------|--------|-----------|
| REC-05 | Create reusable async mock fixtures (AsyncMock + MagicMock) | DM-06 | Low | Test velocity |
| REC-06 | Expose `duration_ms` metrics to monitoring system | DM-03 | Low | Observability |
| REC-07 | Implement remaining widget types (ProjectStatus, TaskList, Metrics, Alert) | DM-03 | Medium | Feature completeness |
| REC-08 | Create A2A flow architecture diagrams | DM-03 | Low | Documentation |
| REC-09 | Add local Semgrep check to pre-commit | DM-06 | Low | Security |
| REC-10 | Performance testing for mesh router | DM-06 | Medium | Production readiness |
| REC-11 | Parallel MCP server connections (currently sequential) | DM-06 | Medium | Startup performance |
| REC-12 | Parallel health checks in mesh (use asyncio.gather) | DM-06 | Low | Performance |
| REC-23 | Add E2E tests for critical flows (progress streaming, approval queue) | DM-05 | High | Integration coverage |
| REC-24 | Add visual regression tests for HITL cards | DM-05 | Medium | UI stability |

### Low Priority

| ID | Recommendation | Source | Effort | Rationale |
|----|----------------|--------|--------|-----------|
| REC-13 | HTTP/2 deployment guide and troubleshooting | DM-03 | Low | Deployment |
| REC-14 | Common A2A troubleshooting guide | DM-03 | Low | Operations |
| REC-15 | Visual regression tests (Percy/Chromatic) for widgets | DM-03 | Medium | UI stability |
| REC-16 | Load testing for A2A endpoints | DM-03 | High | Performance baseline |
| REC-17 | Redis persistence endpoint for state (`POST/GET/DELETE /api/dashboard/state`) | DM-04 | High | State durability |
| REC-18 | WebSocket state sync for multi-device synchronization | DM-04 | High | Multi-device support |
| REC-19 | State migration system when STATE_VERSION increments | DM-04 | Medium | Upgrade path |
| REC-20 | Compress large state before localStorage save | DM-04 | Low | Quota management |
| REC-21 | Document MCP server configuration | DM-06 | Low | Documentation |
| REC-25 | Add Semgrep rules for common async pitfalls | DM-05 | Low | Code quality |
| REC-26 | Document CopilotKit patterns in a central guide | DM-05 | Low | Documentation |
| REC-27 | Implement proper event-driven notifications instead of polling | DM-05 | Medium | Efficiency |

---

## Lessons Learned (16 Items)

### Code Patterns

| # | Lesson | Source | Application |
|---|--------|--------|-------------|
| 1 | **Circular reference protection** - Use WeakSet for recursive object traversal | DM-06 | `filterSensitiveContext()` |
| 2 | **AsyncMock patterns** - Need both function mock AND module mock for proper testing | DM-06 | `test_route_request_success` |
| 3 | **Debounce race conditions** - Always cancel existing task/timer before scheduling new one | DM-04 | `DashboardStateEmitter` |
| 4 | **State immutability** - When truncating collections, operate on a copy, not the source | DM-04 | State truncation |
| 5 | **SSR-safe initialization** - Use lazy init functions, not module-level constants | DM-04 | `getTabId()` |
| 6 | **Division by zero guards** - Always validate ratios before use | DM-06 | `SplitLayout`, `WizardLayout` |
| 7 | **Test-first for async patterns** - Writing tests first identifies edge cases | DM-05 | `TaskManager` |
| 8 | **Serialization consistency** - Explicit Field aliases in Pydantic + documented conversions | DM-05 | Python/TS bridge |
| 9 | **Progress emission strategy** - Use `emit_now()` to bypass debounce for real-time updates | DM-05 | Progress streaming |

### Process Patterns

| # | Lesson | Source | Application |
|---|--------|--------|-------------|
| 10 | **AI code review catches bugs unit tests miss** - Logical inversions, missing awaits, security issues | DM-05, DM-06 | Review process |
| 11 | **Keep story specs aligned with APIs** - Update docs when upstream library APIs change | DM-01 | CopilotKit integration |
| 12 | **Document implementation notes per story** - Enables retrospective accuracy and auditability | DM-01, DM-02 | Story files |
| 13 | **Story status must match sprint status** - Prevents confusion and audit failures | DM-02 | DM-02.9 mismatch |

### Architecture Patterns

| # | Lesson | Source | Application |
|---|--------|--------|-------------|
| 14 | **Hybrid rendering mode** - Support both tool-calls AND state-driven updates for flexibility | DM-04 | Dashboard widgets |
| 15 | **BroadcastChannel for cross-tab** - Simpler than WebSocket/Redis for browser-only sync | DM-04 | State persistence |
| 16 | **Parallel A2A calls essential** - 3x speedup over sequential calls | DM-03 | `gather_dashboard_data()` |

---

## Documentation Gaps (6 Items)

| # | Gap | Source | Priority |
|---|-----|--------|----------|
| 1 | Architecture diagrams for A2A flow | DM-03 | Medium |
| 2 | HTTP/2 deployment guide | DM-03 | Low |
| 3 | A2A troubleshooting guide | DM-03 | Low |
| 4 | MCP server configuration docs | DM-06 | Low |
| 5 | CopilotKit patterns central guide | DM-05 | Medium |
| 6 | Implementation notes backfill (DM-01.6-01.8, DM-02.5-02.9) | DM-01, DM-02 | Medium |

---

## Testing Gaps (6 Items)

| # | Gap | Risk Level | Source |
|---|-----|------------|--------|
| 1 | Visual regression tests for widgets | Medium - UI drift | DM-03, DM-05 |
| 2 | Load testing for A2A endpoints | High - Performance unknown | DM-03 |
| 3 | E2E tests for progress streaming | Medium - Integration gaps | DM-05 |
| 4 | CCR operational verification | High - Runtime failures | DM-02 |
| 5 | localStorage quota testing | Medium - Data loss risk | DM-04 |
| 6 | E2E tests for approval queue flow | Medium - HITL flow gaps | DM-05 |

---

## Prioritized Action Backlog

### Sprint 1 (Must Do)

| Task | Category | Effort |
|------|----------|--------|
| Fix `/kb` SSR build issue (TD-01) | Tech Debt | Medium |
| Fix pre-existing test failures (TD-02, TD-17) | Tech Debt | High |
| Reconcile DM-02.9 status (TD-03) | Tech Debt | Low |
| Unify chat shortcut handling (TD-05, TD-06) | Tech Debt | Medium |

### Sprint 2 (Should Do)

| Task | Category | Effort |
|------|----------|--------|
| Add rate limiting for A2A endpoints (REC-03) | Recommendation | Medium |
| Implement dashboard caching (REC-02) | Recommendation | Medium |
| Add Zod validation for widget payloads (REC-01) | Recommendation | Medium |
| Create reusable async mock fixtures (REC-05) | Recommendation | Low |
| Deduplicate WIDGET_TYPES (TD-07) | Tech Debt | Low |

### Sprint 3+ (Could Do)

| Task | Category | Effort |
|------|----------|--------|
| OpenTelemetry integration (REC-04) | Recommendation | High |
| Parallel MCP connections (REC-11) | Recommendation | Medium |
| E2E tests for critical flows (REC-23) | Recommendation | High |
| Architecture diagrams (REC-08) | Documentation | Low |
| Visual regression tests (REC-15, REC-24) | Testing | Medium |

---

## Bugs Fixed in Code Review (Historical)

These bugs were caught by AI code review before merge - documenting for future reference:

### DM-05 (10 bugs)
1. Semaphore cancellation race condition
2. camelCase key formatting in approval_bridge.py
3. Task cleanup using wrong timestamp
4. Inverted isExecuting prop
5. Missing await on callbacks
6. URL encoding for approvalId
7. RegExp metacharacter escaping
8. Type guard improvements
9. Undefined checks
10. Test assertion fixes

### DM-06 (13 bugs)
1. render_generative_layout tool registration missing
2. Missing act() wrappers in tests
3. Division by zero in SplitLayout
4. Division by zero in WizardLayout
5. JSON Schema format incorrect
6. Workspace scoping bug in RAG indexer
7. MCP client race condition
8. Discovery service lifecycle issue
9. Circular reference in filterSensitiveContext
10. Insufficient sensitive field filtering
11. Unused imports (logger, AgentCapability, AgentEndpoint)
12. Missing Tuple type hint
13. Test mock setup incorrect

---

## Module Completion Summary

| Epic | Stories | Points | Retro Status |
|------|---------|--------|--------------|
| DM-01: CopilotKit Frontend | 8 | 44 | Done |
| DM-02: Agno Backend | 9 | 51 | Done |
| DM-03: Dashboard Integration | 5 | 34 | Done |
| DM-04: Shared State | 5 | 26 | Done |
| DM-05: Advanced HITL | 5 | 34 | Done |
| DM-06: Contextual Intelligence | 6 | 42 | Done |
| **TOTAL** | **38** | **231** | **Complete** |

---

*Document generated from bm-dm retrospective analysis*
*Party Mode session: 2025-12-31*
