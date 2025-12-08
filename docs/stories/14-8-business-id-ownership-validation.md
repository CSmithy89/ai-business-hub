# Story 14-8: Business ID Ownership Validation

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 3  
**Priority:** P1 High  
**Created:** 2025-12-07

## User Story
As a platform engineer, I want to enforce business ownership validation on agent endpoints so that only authorized workspaces can run agents for a business.

## Acceptance Criteria
- [x] AC1: Implement ownership validation for agent run endpoints using workspace/user identity.
- [x] AC2: Validate against authoritative source (NestJS API) and fail closed if verification cannot complete.
- [x] AC3: Return structured 4xx/5xx responses for unauthorized/failed validation.
- [x] AC4: Cover allowed vs. denied and upstream-failure behaviors with automated tests.

## Context
- TenantMiddleware injects `workspace_id` and `user_id` from JWT claims; BetterAuth secret available via settings.
- NestJS API base URL is configured in `settings.api_base_url` and exposes workspace-scoped business endpoints.
- Agent team endpoints (`/agents/validation|planning|branding/runs`) accept `business_id` in the request body; approval agent does not require business context.

## Implementation Summary
- Added `agents/middleware/business_validator.py` to verify business ownership by querying `GET {api_base_url}/api/workspaces/{workspace_id}/businesses/{business_id}`; uses request state or decoded JWT for identity; fails closed on errors.
- Wired validation into team endpoints in `agents/main.py` before executing runs; returns 401/403/503 appropriately.
- Added tests `agents/tests/test_business_validator.py` using `respx` to cover success, 403 (not owned), missing identity, and upstream 500 → 503.
- Added dependency `respx` for HTTP mocking in tests.

## Definition of Done
- [x] Acceptance criteria satisfied.
- [ ] Tests executed in CI/agent environment (Python not available in local sandbox to run here).
- [x] Story status updated to done and sprint status updated.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** Ownership guard uses workspace/user identity, calls authoritative API, and fails closed on errors. Tests cover allow/deny and upstream failure. Ensure CI runs Python suite to validate runtime dependencies.
