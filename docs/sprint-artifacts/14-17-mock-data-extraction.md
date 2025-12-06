# Story 14.17: Mock Data Extraction

Status: review

## Requirements Context Summary

- Epic 14 targets testing/observability; backlog item 14-17 from Epic 12 retro calls for moving mock data into a separate file for testability and maintenance. [Source: docs/sprint-artifacts/epic-12-retrospective.md]
- Mock payloads are currently scattered across UI hooks and API routes (e.g., notifications hook, approval metrics/confidence API handlers). [Source: apps/web/src/hooks/use-notifications.ts; apps/web/src/app/api/approvals/metrics/route.ts; apps/web/src/app/api/approvals/[id]/confidence/route.ts]
- Mock usage must stay opt-in and never leak to production; `NEXT_PUBLIC_ENABLE_MOCK_DATA`/`IS_PRODUCTION` guards exist in api-config. [Source: apps/web/src/lib/api-config.ts]
- Previous story 14-16 (Error Boundary Monitoring) integrated telemetry at providers/error-boundary and added regression tests; reuse shared telemetry modules and keep test coverage intact. [Source: docs/stories/14-16-error-boundary-monitoring.md]

## Project Structure Alignment

- Frontend hooks live under `apps/web/src/hooks`; API mock handlers under `apps/web/src/app/api/**`.
- Shared web utilities/config live under `apps/web/src/lib`; a central mock data module should live here for reuse.
- Multi-tenant and production safety: mock data must remain dev-only and gated via api-config flags (`IS_PRODUCTION`, `IS_MOCK_DATA_ENABLED`).
- Prior story 14-16 wired telemetry via `apps/web/src/lib/telemetry/error-tracking.ts` and `Providers`; keep new modules cohesive with existing shared libs.

## Story

As a frontend engineer,
I want all mock payloads centralized behind a single, flagged module,
so that demo data is reusable for tests without leaking into production.

## Acceptance Criteria

1. Mock data is centralized in a shared module (e.g., `apps/web/src/lib/mock-data.ts`) exporting typed payloads for notifications and approval metrics/confidence; no inline mock payloads remain in hooks/API handlers. [Source: apps/web/src/hooks/use-notifications.ts; apps/web/src/app/api/approvals/metrics/route.ts]
2. Hooks/API routes that previously used inline mock data now import from the shared module with consistent typing; runtime behavior is unchanged in dev. [Source: apps/web/src/hooks/use-notifications.ts; apps/web/src/app/api/approvals/[id]/confidence/route.ts]
3. Production safety is preserved: mock data is only served when `IS_MOCK_DATA_ENABLED` is true; production builds log/warn if mocks are enabled and avoid serving demo payloads. [Source: apps/web/src/lib/api-config.ts]
4. Add regression tests to ensure imports use the shared module and that mock mode is gated; document the module usage in this story file.

## Tasks / Subtasks

- [x] Extract existing inline mock payloads into `apps/web/src/lib/mock-data.ts` with typed exports (notifications, approval metrics/confidence). (AC1)
- [x] Refactor `use-notifications` hook to import shared mock payloads; ensure behavior parity. (AC2)
- [x] Refactor approval metrics/confidence API routes to consume shared mocks; keep workspace filters placeholder-safe. (AC2)
- [x] Enforce mock gating via `IS_MOCK_DATA_ENABLED` checks; add warnings for production if enabled. (AC3)
- [x] Add unit tests covering shared mock module imports/gating; update this story file with module usage notes. (AC4)

### Review Follow-ups (AI)
- [x] [AI-Review][High] Remove duplicate confidence generator or import missing type so confidence route compiles cleanly (apps/web/src/app/api/approvals/[id]/confidence/route.ts:60-157)
- [x] [AI-Review][Medium] Fix Vitest crash and get apps/web/src/lib/mock-data.test.ts passing (`pnpm vitest run src/lib/mock-data.test.ts --pool=threads`)

## Dev Notes

- Centralize mock data in `apps/web/src/lib/mock-data.ts` to keep hooks/routes lean and testable.
- Reuse `IS_MOCK_DATA_ENABLED`/`IS_PRODUCTION` from `api-config`; never return mock responses when mock mode is off.
- Consider adding deterministic timestamps (fixed ISO strings) in mocks to keep tests stable; convert to Date where needed at call sites.
- Keep telemetry wiring intact from 14-16; avoid touching `providers.tsx` or `error-boundary.tsx`.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/14-17-mock-data-extraction.context.xml

### Agent Model Used

@hyvve/web vitest (unit), Next.js API routes; tooling: pnpm, TypeScript, React Query

### Debug Log References

- Planned centralization: create shared mock module for notifications, approval metrics, and confidence breakdown; gate via `IS_MOCK_DATA_ENABLED`; refactor hook and API routes to consume shared payloads.
- Tests: `pnpm vitest run src/lib/mock-data.test.ts --pool=threads` (passes; avoids default forks worker crash).

### Completion Notes List

- Centralized mock payloads and deterministic confidence generator in `apps/web/src/lib/mock-data.ts`; added gating helper.
- Hook now imports shared mock notifications and respects mock mode flag.
- Approval metrics and confidence API routes now consume shared mock data and block when mock mode is disabled.
- Added unit tests for mock data determinism and gating; tests pass with `--pool=threads` to avoid worker crash in default fork pool.
- Removed duplicate confidence generator code in approval confidence route; route now uses shared mock generator only.

### File List

- apps/web/src/lib/mock-data.ts (new shared mock payloads + gating)
- apps/web/src/hooks/use-notifications.ts (imports shared mock data, gating)
- apps/web/src/app/api/approvals/metrics/route.ts (shared mock, gating)
- apps/web/src/app/api/approvals/[id]/confidence/route.ts (shared mock, gating)
- apps/web/src/lib/mock-data.test.ts (new tests)
- docs/sprint-artifacts/14-17-mock-data-extraction.context.xml (context file)
- docs/sprint-artifacts/sprint-status.yaml (status updates)
- docs/sprint-artifacts/14-17-mock-data-extraction.md (status/tasks/notes)

### Change Log

- Added shared mock data module, refactored consumers, and introduced gating + tests (2025-12-07)
- Senior Developer Review notes appended; outcome: Changes Requested (2025-12-07)
- Addressed review follow-ups (confidence route fix, passing mock-data tests) (2025-12-07)

## Senior Developer Review (AI)

- Reviewer: chris
- Date: 2025-12-07
- Outcome: Approve
- Summary: All ACs satisfied after centralizing mock payloads, gating by env flags, refactoring consumers, and stabilizing mock-data tests (run with threads pool). No outstanding issues found.

### Key Findings

- **Low**: Vitest default forks pool previously crashed; resolved by running `pnpm vitest run src/lib/mock-data.test.ts --pool=threads` (documented).

### Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
| ---- | ----------- | ------ | -------- |
| 1 | Shared mock module exports typed payloads; no inline mocks remain in hooks/API | Implemented | apps/web/src/lib/mock-data.ts:1-185; apps/web/src/hooks/use-notifications.ts:10-18; apps/web/src/app/api/approvals/metrics/route.ts:1-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:1-33 |
| 2 | Hooks/API routes import shared module; runtime parity in dev | Implemented | apps/web/src/hooks/use-notifications.ts:10-42; apps/web/src/app/api/approvals/metrics/route.ts:1-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:1-40 |
| 3 | Production safety: mocks only when `IS_MOCK_DATA_ENABLED` | Implemented | apps/web/src/app/api/approvals/metrics/route.ts:23-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:25-33; apps/web/src/lib/mock-data.ts:186-193 |
| 4 | Regression tests ensure shared import/gating | Implemented | apps/web/src/lib/mock-data.test.ts:1-38; `pnpm vitest run src/lib/mock-data.test.ts --pool=threads` pass |

Acceptance Criteria Summary: 4 of 4 implemented.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| ---- | --------- | ----------- | -------- |
| Extract mock payloads into shared module | Complete | Verified | apps/web/src/lib/mock-data.ts:1-185 |
| Refactor use-notifications to shared mocks | Complete | Verified | apps/web/src/hooks/use-notifications.ts:10-42 |
| Refactor approval metrics/confidence routes to shared mocks | Complete | Verified | apps/web/src/app/api/approvals/metrics/route.ts:1-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:1-40 |
| Enforce mock gating via flags | Complete | Verified | apps/web/src/app/api/approvals/metrics/route.ts:23-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:25-33; apps/web/src/lib/mock-data.ts:186-193 |
| Add unit tests for shared mocks/gating | Complete | Verified | apps/web/src/lib/mock-data.test.ts:1-38; `pnpm vitest run src/lib/mock-data.test.ts --pool=threads` |

Tasks Summary: 5 of 5 verified.

### Test Coverage and Gaps

- Unit: apps/web/src/lib/mock-data.test.ts (passes with threads pool). No gaps noted for mock-module scope.

### Architectural Alignment

- Centralized mock data mirrors existing pattern (agents mock-data). Gating respects prod safety and multi-tenant readiness.

### Security Notes

- Mock responses blocked unless `IS_MOCK_DATA_ENABLED`; production guarded via api-config.

### Best-Practices and References

- Maintain deterministic timestamps for stable assertions; document threads pool usage when running Vitest locally.

### Action Items

**Code Changes Required**
- None.

**Advisory Notes**
- Note: When running Vitest locally, use `pnpm vitest run src/lib/mock-data.test.ts --pool=threads` if fork pool instability recurs.

## Senior Developer Review (AI)

- Reviewer: chris
- Date: 2025-12-07
- Outcome: Changes Requested
- Summary: Centralized mock data and gating look good, but TypeScript errors remain in confidence route (missing type import/duplicate generator) and new mock-data tests currently crash the Vitest runner. Resolve the type error and get tests passing to satisfy AC4/task 5.

### Key Findings

- **High**: `apps/web/src/app/api/approvals/[id]/confidence/route.ts` still declares `generateMockConfidenceBreakdown` with `ConfidenceBreakdown` type but no import (lines 60-157). This is a TS compile error and duplicate logic after introducing `getMockConfidenceBreakdown`.
- **Medium**: Test run for `apps/web/src/lib/mock-data.test.ts` crashes the Vitest worker (`pnpm --filter @hyvve/web test -- src/lib/mock-data.test.ts`), so AC4/task 5 not satisfied and mocks aren’t covered by passing tests.

### Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
| ---- | ----------- | ------ | -------- |
| 1 | Shared mock module exports typed payloads; no inline mocks in hooks/API | Implemented | apps/web/src/lib/mock-data.ts:1-81; apps/web/src/hooks/use-notifications.ts:10-18; apps/web/src/app/api/approvals/metrics/route.ts:1-30 |
| 2 | Hooks/API routes import shared module; runtime parity in dev | Implemented | apps/web/src/hooks/use-notifications.ts:10-18; apps/web/src/app/api/approvals/[id]/confidence/route.ts:1-37 |
| 3 | Production safety: mocks served only when `IS_MOCK_DATA_ENABLED` | Implemented | apps/web/src/app/api/approvals/metrics/route.ts:23-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:25-33; apps/web/src/lib/mock-data.ts:186-193 |
| 4 | Regression tests ensure shared import/gating | Missing | Vitest run crashes on `apps/web/src/lib/mock-data.test.ts` (see tests section) |

Acceptance Criteria Summary: 3 of 4 implemented; AC4 missing due to failing/crashing tests.

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
| ---- | --------- | ----------- | -------- |
| Extract mock payloads into shared module | Complete | Verified | apps/web/src/lib/mock-data.ts:1-185 |
| Refactor use-notifications to shared mocks | Complete | Verified | apps/web/src/hooks/use-notifications.ts:10-42 |
| Refactor approval metrics/confidence routes to shared mocks | Complete | Verified | apps/web/src/app/api/approvals/metrics/route.ts:1-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:1-37 |
| Enforce mock gating via flags | Complete | Verified | apps/web/src/app/api/approvals/metrics/route.ts:23-31; apps/web/src/app/api/approvals/[id]/confidence/route.ts:25-33; apps/web/src/lib/mock-data.ts:186-193 |
| Add unit tests for shared mocks/gating | Complete | **Questionable** (tests crash) | apps/web/src/lib/mock-data.test.ts:1-38; vitest crash during `pnpm --filter @hyvve/web test -- src/lib/mock-data.test.ts` |

Tasks Summary: 4 verified, 1 questionable (tests crashing).

### Test Coverage and Gaps

- Added `apps/web/src/lib/mock-data.test.ts`, but Vitest run crashes with worker error before executing tests (`pnpm --filter @hyvve/web test -- src/lib/mock-data.test.ts`).
- Need a passing run to validate mock determinism and gating (AC4).

### Architectural Alignment

- Centralization aligns with existing mock pattern (`apps/web/src/app/api/agents/mock-data.ts`). No architecture violations noted.

### Security Notes

- Mock gating enforced in API routes; ensure mock mode disabled in production before deployment.

### Best-Practices and References

- Keep deterministic timestamps for stable tests (already applied in `mock-data.ts`).
- Remove dead/duplicate generator to avoid type drift and confusion.

### Action Items

**Code Changes Required**
- [ ] [High] Remove or update the duplicate `generateMockConfidenceBreakdown` and import missing types so confidence route compiles cleanly (apps/web/src/app/api/approvals/[id]/confidence/route.ts:60-157).
- [ ] [Medium] Fix Vitest crash and ensure `apps/web/src/lib/mock-data.test.ts` passes; rerun `pnpm --filter @hyvve/web test -- src/lib/mock-data.test.ts`.

**Advisory Notes**
- Note: Keep mock mode disabled in production unless explicitly demoing.
