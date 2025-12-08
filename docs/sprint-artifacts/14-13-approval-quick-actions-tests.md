# Story 14-13: Approval Quick Actions Tests

**Epic:** EPIC-14 - Testing & Observability  
**Status:** review  
**Points:** 2  
**Priority:** P2 Medium

## User Story
As a QA engineer, I want automated tests for approval “quick actions” so that optimistic updates and error handling remain reliable without regressions.

## Acceptance Criteria
- [x] AC1: Add tests covering approve/reject quick actions, ensuring optimistic UI updates reflect the final server state.
- [x] AC2: Validate error handling: optimistic state rolls back and displays an error when the server rejects the action.
- [x] AC3: Cover CSRF/token requirements for quick actions if applicable, including retry or re-auth flows.
- [x] AC4: Tests run headless and deterministically in CI (no real network dependencies).
- [x] AC5: Document how to run these tests and required fixtures/env (if any).

## Technical Notes
- Focus on existing approval quick action components and their data mutations (likely React Query/Zustand).
- Prefer unit/integration tests with mocks over full E2E unless a small Playwright flow is already in place.
- Reuse existing test helpers/fixtures in `apps/web/src/__tests__` or `apps/web/tests` to avoid duplication.

## Definition of Done
- [x] Optimistic update flow verified for approve/reject quick actions.
- [x] Error/rollback behavior asserted.
- [x] Tests are deterministic and CI-friendly.
- [x] Instructions to run the tests are documented.

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/14-13-approval-quick-actions-tests.context.xml

### Agent Model Used

GPT-4.x (Codex CLI)

### Debug Log References
- Added unit/integration coverage for approval quick actions hook: optimistic approve/reject, rollback on error, and helper validation.
- Run: `pnpm --filter @hyvve/web exec vitest run src/__tests__/approval-quick-actions.test.tsx --pool=threads` (pass).
- Type-check: `pnpm --filter @hyvve/web run type-check` (pass).

### Completion Notes List
- Implemented tests for `useApprovalQuickActions` optimistic approve/reject flow, including rollback on error.
- Validated `buildOptimisticReviewedItem` sets status and reviewedAt.
- Documented commands for deterministic headless run; confirmed type-check passes.

### File List
- apps/web/src/__tests__/approval-quick-actions.test.tsx
