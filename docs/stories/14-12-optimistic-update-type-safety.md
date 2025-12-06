# Story 14-12: Optimistic Update Type Safety

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 2  
**Priority:** P2 Medium  
**Created:** 2025-12-07

## User Story
As a frontend engineer, I want the optimistic approval mutations to keep `reviewedAt` formatting consistent with backend payloads so that cached data matches server responses and downstream consumers (e.g., metrics) parse the value reliably.

## Acceptance Criteria
- [x] AC1: Optimistic updates write `reviewedAt` as an ISO string, mirroring the server payload and avoiding Date-object drift.
- [x] AC2: Shared approval types accept string timestamps so type checking is happy with cached values.
- [x] AC3: Add a lightweight regression test that exercises the optimistic helper to ensure string typings are preserved.

## Context
- Added in Epic-12 retrospective as technical debt item #2: optimistic updates wrote `reviewedAt` as a Date object (`new Date()`), while backend responses are ISO strings, causing inconsistencies when data is cached or later serialized for metrics. See `docs/sprint-artifacts/epic-12-retrospective.md` for reference.
- Optimistic mutation logic lives in `apps/web/src/hooks/use-approval-quick-actions.ts`.
- Shared type `ApprovalItem` lives in `packages/shared/src/types/approval.ts`.

## Implementation Summary
- Extended `ApprovalItem.reviewedAt` to allow `string | Date` so the optimistic cache can safely store ISO timestamps while preserving compatibility with existing data consumers.
- Introduced `buildOptimisticReviewedItem` helper that returns the updated approval with `reviewedAt: new Date().toISOString()` and reused it in both approve/reject optimistic paths.
- Added regression test `apps/web/src/hooks/use-approval-quick-actions.test.ts` to ensure the helper produces ISO-formatted strings.

## Definition of Done
- [x] Acceptance criteria satisfied with code and tests.
- [x] Vitest regression test added and run locally (`pnpm test --filter use-approval-quick-actions`).
- [x] Story status updated to done and sprint status updated.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** Reviewed update ensures optimistic `reviewedAt` values are ISO strings and shareable with backend responses. Shared type now accepts string timestamps. Regression test ensures helper and mutate path stay consistent.
