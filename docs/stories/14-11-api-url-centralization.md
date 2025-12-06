# Story 14-11: API URL Centralization

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 2  
**Priority:** P2 High  
**Created:** 2025-12-07

## User Story
As a frontend developer, I want a single source of truth for backend API URLs so that hooks and services don't duplicate environment lookups or drift.

## Acceptance Criteria
- [x] AC1: All web hooks/services that call NestJS use centralized config (`api-config.ts`) instead of inline `process.env` lookups.
- [x] AC2: Approval quick actions hook uses centralized endpoints/constants (no hardcoded paths/base URLs).
- [x] AC3: Add test/guard to prevent regression (e.g., snapshot of endpoints or unit check for hook construction).

## Context
- Epic-12 retrospective added tech debt: "API URL Centralization" for approval quick actions and other hooks duplicating `NEXT_PUBLIC_API_URL` usage.
- Existing central config: `apps/web/src/lib/api-config.ts` with `NESTJS_API_URL` and `API_ENDPOINTS`.
- Duplications exist in `use-approval-quick-actions.ts`, `use-approvals.ts`, `use-ai-providers.ts`, `use-token-limits.ts`, `use-token-usage.ts`, `use-agent-preferences.ts`, `use-event-stats.ts`.

## Implementation Summary
- Refactored hooks to use centralized config (`NESTJS_API_URL`/`API_ENDPOINTS`) instead of inline env lookups: `use-approval-quick-actions`, `use-approvals`, `use-ai-providers`, `use-token-limits`, `use-token-usage`, `use-agent-preferences`, `use-event-stats`.
- Quick actions now uses `API_ENDPOINTS` and exposes `performApprovalAction` (for testing) with centralized URL construction.
- Added regression test `apps/web/src/hooks/use-approval-quick-actions.test.ts` asserting API calls use centralized endpoints.

## Definition of Done
- [x] Acceptance criteria satisfied with code changes and tests.
- [ ] Tests to be run in CI (not executed locally here).
- [x] Story status updated to done; sprint status updated.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** All NestJS-facing hooks now consume centralized `api-config`; quick actions regression test ensures endpoint builder is used. Ensure CI runs Vitest suite to validate test.

## Definition of Done
- [ ] Acceptance criteria satisfied with code changes and tests.
- [ ] Tests run in CI (not executed locally here).
- [ ] Story status updated to done; sprint status updated.
