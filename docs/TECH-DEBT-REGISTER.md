# Tech Debt Register

**Last Updated:** 2025-12-28
**Owner:** Engineering Team

This document tracks all formally deferred technical debt items across the HYVVE platform.

---

## Deferred Items

### TD-001: EPIC-02 Ownership Transfer

| Attribute | Value |
|-----------|-------|
| **Story ID** | `02-8-implement-ownership-transfer` |
| **Epic** | EPIC-02: Workspace Management |
| **Priority** | LOW |
| **Status** | FORMALLY DEFERRED |
| **Added** | 2025-12-02 (Epic 02/03 Retrospective) |
| **Decision** | Defer to post-MVP workspace enhancement epic |

**What:** Ability for workspace owners to transfer ownership to another workspace member.

**Why Deferred:**
- Not critical for MVP - workspace operations function without this
- Foundation already established via EPIC-03 RBAC
- Low risk user impact (rare use case for new businesses)
- Settings UI patterns needed from EPIC-07 for proper implementation

**Implementation Scope (when addressed):**
1. Backend API: `POST /api/workspaces/:id/transfer-ownership`
   - Validate new owner is workspace member
   - Update current owner to admin role
   - Set new owner with owner role
   - Emit `workspace.ownership_transferred` event
2. Settings UI: New section in workspace settings
   - Search/select dialog for new owner
   - Confirmation with email notification
   - Audit trail integration
3. Tests: Authorization and ownership validation

**Estimated Effort:** 3-5 story points (Medium)

**Trigger to Re-evaluate:**
- User feedback requesting this feature
- Enterprise customers with multi-owner requirements
- Post-MVP workspace enhancements epic

---

### TD-002: OpenAPI Specification Generation

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Already exists at `/api/docs` (Swagger) and `/api/redoc` |

**Note:** The retrospective identified this as missing, but investigation confirmed that OpenAPI specification is already auto-generated via NestJS decorators (`@ApiOperation`, `@ApiResponse`, etc.) and is available at runtime endpoints.

---

### TD-003: E2E Tests for Real-Time Features

| Attribute | Value |
|-----------|-------|
| **Priority** | LOW |
| **Status** | PARTIALLY RESOLVED |
| **Added** | 2025-12-12 (EPIC-16 Retrospective) |

**What:** Comprehensive E2E tests for WebSocket/SSE real-time features and celebration animations.

**Current State:**
- Basic E2E tests exist for UI flows
- WebSocket connection tests not comprehensive
- Celebration animation tests deferred (visual verification)

**Trigger to Re-evaluate:**
- Real-time feature bugs in production
- Pre-launch quality gate for mobile/tablet

---

## Resolved Items

### TD-R001: N+1 Query Detection

| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Added CI pipeline check via `scripts/detect-n-plus-one.sh` |

---

### TD-R002: Constants in DM Tech Specs

| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Added comprehensive constants sections to DM-01 and DM-02 epic specs |

---

### TD-R003: Rate Limiting by Design

| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Added rate limiting requirements tables to DM-01 and DM-02 epic specs |

---

### TD-R004: Agent Name Finalization

| Attribute | Value |
|-----------|-------|
| **Priority** | HIGH |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Finalized agent names in DM-02 spec (dashboard_gateway, dm_orchestrator, widget_renderer) |

---

### TD-R005: Module Documentation Standardization

| Attribute | Value |
|-----------|-------|
| **Priority** | MEDIUM |
| **Status** | RESOLVED |
| **Added** | 2025-12-28 (Combined Retrospective) |
| **Resolution** | Standardized file naming, renamed verbose MODULE-BRIEF files, added README.md to modules missing them, documented standards in docs/modules/README.md |

---

## Tech Debt Guidelines

### Adding New Items

When adding tech debt:
1. Create unique ID: `TD-XXX` (or `TD-RXXX` for resolved)
2. Document: What, Why Deferred, Implementation Scope, Trigger to Re-evaluate
3. Set realistic priority based on user impact and engineering cost
4. Add to sprint retrospective if discovered during development

### Priority Levels

| Priority | Criteria | Action |
|----------|----------|--------|
| **CRITICAL** | Security vulnerability, data loss risk | Fix immediately |
| **HIGH** | Significant user impact, blocking features | Address next sprint |
| **MEDIUM** | Quality improvement, developer experience | Plan within 2-3 sprints |
| **LOW** | Nice-to-have, future enhancement | Defer to backlog |

### Status Definitions

- **IDENTIFIED**: Known but not yet evaluated
- **FORMALLY DEFERRED**: Evaluated and intentionally postponed
- **IN PROGRESS**: Being actively worked on
- **RESOLVED**: Completed and verified
- **WONT FIX**: Evaluated and decided not to address

---

## References

- [Combined Retrospective](./retrospectives/combined-foundation-pm-retrospective.md)
- [EPIC-02 Retrospective](./archive/foundation-phase/retrospectives/retrospective-epic-02.md)
- [EPIC-03 Retrospective](./archive/foundation-phase/retrospectives/retrospective-epic-03.md)
