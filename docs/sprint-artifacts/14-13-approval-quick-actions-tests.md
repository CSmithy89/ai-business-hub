# Story 14-13: Approval Quick Actions Tests

**Epic:** EPIC-14 - Testing & Observability  
**Status:** drafted  
**Points:** 2  
**Priority:** P2 Medium

## User Story
As a QA engineer, I want automated tests for approval “quick actions” so that optimistic updates and error handling remain reliable without regressions.

## Acceptance Criteria
- [ ] AC1: Add tests covering approve/reject quick actions, ensuring optimistic UI updates reflect the final server state.
- [ ] AC2: Validate error handling: optimistic state rolls back and displays an error when the server rejects the action.
- [ ] AC3: Cover CSRF/token requirements for quick actions if applicable, including retry or re-auth flows.
- [ ] AC4: Tests run headless and deterministically in CI (no real network dependencies).
- [ ] AC5: Document how to run these tests and required fixtures/env (if any).

## Technical Notes
- Focus on existing approval quick action components and their data mutations (likely React Query/Zustand).
- Prefer unit/integration tests with mocks over full E2E unless a small Playwright flow is already in place.
- Reuse existing test helpers/fixtures in `apps/web/src/__tests__` or `apps/web/tests` to avoid duplication.

## Definition of Done
- [ ] Optimistic update flow verified for approve/reject quick actions.
- [ ] Error/rollback behavior asserted.
- [ ] Tests are deterministic and CI-friendly.
- [ ] Instructions to run the tests are documented.

## Dev Agent Record

### Context Reference

{{context_file_path}}

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
