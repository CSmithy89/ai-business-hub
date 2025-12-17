# Story PM-01.2: Phase CRUD API

Status: done

## Story

As a platform developer,
I want Phase CRUD operations nested under projects,
so that projects can have structured work phases.

## Acceptance Criteria

1. Given a project exists  
   When I POST `/pm/projects/:projectId/phases`  
   Then a phase is created with required fields (`name`, `phaseNumber`)
2. And GET `/pm/projects/:projectId/phases` returns an ordered list
3. And PATCH `/pm/phases/:id` updates phase fields
4. And only one phase can have `status=CURRENT` per project
5. And phase state machine enforced: `UPCOMING → CURRENT → COMPLETED`
6. Events emitted: `pm.phase.created`, `pm.phase.updated`, `pm.phase.transitioned`

## Tasks / Subtasks

- [x] Extend shared PM events/schemas (AC: 6)
  - [x] Add PM phase event types in `@hyvve/shared`
- [x] Implement Phases API (AC: 1,2,3,4,5,6)
  - [x] Add `PhasesController` + `PhasesService` under `apps/api/src/pm/phases`
  - [x] POST create phase under project (workspace-scoped)
  - [x] GET list phases ordered by `phaseNumber`
  - [x] PATCH update phase fields
  - [x] Enforce one CURRENT per project (transaction)
  - [x] Enforce state transitions UPCOMING → CURRENT → COMPLETED
  - [x] Publish `pm.phase.*` events
- [x] Add unit tests (AC: 4,5)
  - [x] Transition rules are enforced
  - [x] Setting CURRENT unsets previous CURRENT

## Dev Notes

- Phase model exists in `packages/db/prisma/schema.prisma` (enum `PhaseStatus`).
- Tenant isolation via `AuthGuard` + `TenantGuard` and Prisma `workspaceId` filtering.

### Project Structure Notes

- Extend Nest PM module with a new `PhasesModule` and wire it into `PmModule`.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.2)
- `docs/modules/bm-pm/tech-spec-epic-pm-01.md` (Phase service notes)
- `packages/db/prisma/schema.prisma` (Phase model + PhaseStatus)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-2-phase-crud-api.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added phase create/list/update endpoints under `pm/` with workspace scoping.  
✅ Enforced CURRENT uniqueness per project and validated phase status transitions.  
✅ Added PM phase event types and unit tests for transition behavior.

### File List

- `apps/api/src/pm/pm.module.ts`
- `apps/api/src/pm/phases/dto/create-phase.dto.ts`
- `apps/api/src/pm/phases/dto/update-phase.dto.ts`
- `apps/api/src/pm/phases/phases.controller.ts`
- `apps/api/src/pm/phases/phases.module.ts`
- `apps/api/src/pm/phases/phases.service.ts`
- `apps/api/src/pm/phases/phases.service.spec.ts`
- `packages/shared/src/types/events.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-2-phase-crud-api.md`
- `docs/modules/bm-pm/stories/pm-01-2-phase-crud-api.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Correct nesting + routes: project-scoped create/list and global phase update.
- CURRENT uniqueness enforced via transaction, and the chosen rule (auto-complete previous CURRENT) matches the allowed state machine.
- Transition validation is explicit and tested.

### Minor Suggestions (Non-blocking)

- If CANCELLED becomes part of the phase lifecycle, extend `isValidTransition` with an explicit policy and tests.
