# Story 14-13: Approval Quick Actions Tests

**Epic:** EPIC-14 - Testing & Observability  
**Status:** drafted  
**Points:** 2  
**Priority:** P2 Medium  
**Created:** 2025-12-07

## User Story
As a developer, I want deterministic unit tests for the approval quick actions hook so that optimistic updates, toast flows, and rollback behavior stay stable.

## Acceptance Criteria
- [ ] AC1: Test approve/reject flows succeed and call the correct centralized endpoints.
- [ ] AC2: Test optimistic update rollback restores previous data when approval fails.
- [ ] AC3: Test toast notifications show success/error messaging (mocking sonner).

## Context
- Learned from Epic-12 retro that quick actions are critical and tests were missing; Epic-14 tech debt adds unit coverage (see docs/sprint-artifacts/epic-12-retrospective.md).
- Hook uses React Query mutations, optimistic updates, toast success/failure via `sonner`, and centralized endpoints via `API_ENDPOINTS`.

## Implementation Plan
1. Mock `useQueryClient` to provide `setQueriesData`, `getQueryData`, and `invalidateQueries` spies.
2. Mock `apiPost` and `toast` to assert success/error flows.
3. Reuse `buildOptimisticReviewedItem` to check values inside mutations for rollback.
4. Cover rollback path by simulating API failure (non-ok response).

## Definition of Done
- [ ] Acceptance criteria met by tests.
- [ ] Vitest runs locally to exercise the new spec(s).
- [ ] Story status updated to done and sprint status updated.
