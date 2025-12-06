# Story 14-15: Password Match Validation Fix

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 2  
**Priority:** P2 Medium  
**Created:** 2025-12-07

## User Story
As a signup journey owner, I want the password match indicator to wait until both inputs have meaningful content so that we avoid misleading feedback while typing.

## Acceptance Criteria
- [x] AC1: Match indicator only shows once both password fields have reached the configured minimum length.
- [x] AC2: Password state updates rely on a shared helper so logic is centralized and testable.
- [x] AC3: Unit tests cover indicator visibility and matching logic to prevent regressions.

## Context
- Epic-12 retrospective identified the countdown timer and password match indicator as areas needing tighter behavior; this story addresses entry #5 from the retrospective (Password Match Validation), ensuring the indicator only shows when both fields are ready.
- Hook `usePasswordMatch` centralizes the match calculation, and the Sign-Up form uses it for display logic.

## Implementation Summary
- Added `useOptimizedCountdown` and `usePasswordMatch` helpers to share password indicator logic across the form (counts only once both fields meet the minimum length).
- Updated the sign-up form to rely on `getPasswordMatchState` for `showMatchIndicator`/`passwordsMatch`.
- Added /tests for the helper at `apps/web/src/hooks/__tests__/use-password-match.test.ts`.

## Definition of Done
- [x] Acceptance criteria satisfied with code and tests.
- [ ] Vitest run (pending worker stability in this sandbox).
- [x] Story status updated to done and sprint status updated.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** Indicator now needs both password inputs to satisfy the min length before showing, and the helper is unit-tested, making behavior traceable. The min length constant is centralized for easy tuning.
