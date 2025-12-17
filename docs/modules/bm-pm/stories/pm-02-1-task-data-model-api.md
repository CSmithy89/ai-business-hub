# Story PM-02.1: Task Data Model & API

Status: done

## Story

As a platform developer,
I want Task CRUD API with full feature support,
so that users can manage work items.

## Acceptance Criteria

1. Given the Task Prisma model  
   When I POST `/pm/tasks`  
   Then a task is created with an auto-generated sequential `taskNumber` (e.g. `PROJECT-001`)
2. And GET `/pm/tasks` supports filters: `phaseId`, `status`, `assigneeId`, `type`, `priority`
3. And PATCH `/pm/tasks/:id` updates fields with activity logging
4. And DELETE `/pm/tasks/:id` soft-deletes the task
5. And bulk operations exist: PATCH `/pm/tasks/bulk` (status, assignee, phase)
6. And events are published: `pm.task.created`, `pm.task.updated`, `pm.task.status_changed`
7. And all endpoints enforce workspace isolation (TenantGuard + `workspaceId` filtering)

## Tasks / Subtasks

- [x] Implement Tasks API module (AC: 1,2,3,4,5,7)
  - [x] Create `TasksModule`, `TasksController`, `TasksService`
  - [x] Add DTOs for create/update/list/bulk with `class-validator`
  - [x] Implement workspace scoping + soft delete filtering
- [x] Implement `taskNumber` sequencing (AC: 1)
  - [x] Generate next number per project transactionally
  - [x] Preserve uniqueness via existing DB constraint (`@@unique([projectId, taskNumber])`)
- [x] Implement activity logging (AC: 3)
  - [x] Create `TaskActivity` entries for create/update/status changes
- [x] Publish task events (AC: 6)
  - [x] Add `EventTypes.PM_TASK_*` constants in `@hyvve/shared`
  - [x] Publish events from service using `EventPublisherService`
- [x] Add tests (AC: 1,2,3,4,5,7)
  - [x] Unit tests for sequencing + workspace scoping + soft delete
  - [x] Unit tests for bulk update behavior

## Dev Notes

- Task-related Prisma models/enums already exist in `packages/db/prisma/schema.prisma` (Task, TaskActivity, TaskRelation, etc).
- API patterns should follow existing PM modules in `apps/api/src/pm/projects/*` and `apps/api/src/pm/phases/*`:
  - Guards: `AuthGuard` + `TenantGuard` + `RolesGuard`
  - Always filter by `workspaceId` and exclude `deletedAt != null`
- Events are published via `apps/api/src/events/event-publisher.service.ts` and event names are centralized in `@hyvve/shared` `EventTypes`.

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.1)
- `docs/modules/bm-pm/PRD.md` (FR-3: Task Management)
- `docs/modules/bm-pm/tech-spec-epic-pm-02.md`
- `packages/db/prisma/schema.prisma` (Task + related models)
- `apps/api/src/common/guards/tenant.guard.ts` (workspace isolation)
- `apps/api/src/events/event-publisher.service.ts` (event emission)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-1-task-data-model-api.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Implemented `pm/tasks` CRUD + filters + bulk update with workspace scoping and soft delete.  
✅ Added task event types in `@hyvve/shared` and published task lifecycle events from the service.  
✅ Added deterministic unit tests for sequencing, list scoping, and bulk updates.

### File List

- `apps/api/src/pm/pm.module.ts`
- `apps/api/src/pm/tasks/dto/bulk-update-tasks.dto.ts`
- `apps/api/src/pm/tasks/dto/create-task.dto.ts`
- `apps/api/src/pm/tasks/dto/list-tasks.query.dto.ts`
- `apps/api/src/pm/tasks/dto/update-task.dto.ts`
- `apps/api/src/pm/tasks/tasks.controller.ts`
- `apps/api/src/pm/tasks/tasks.module.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `packages/shared/src/types/events.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-1-task-data-model-api.md`
- `docs/modules/bm-pm/stories/pm-02-1-task-data-model-api.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- API follows established PM module patterns (guards + workspace scoping + soft delete filtering).
- `taskNumber` sequencing is implemented transactionally and covered by unit tests.
- Bulk updates are workspace-scoped via `updateMany`, reducing cross-tenant risk.

### Minor Suggestions (Non-blocking)

- Consider validating `parentId` belongs to the same project/workspace before allowing updates (hierarchy work is expanded in PM-02.5).
- Event payloads could be standardized between single-task and bulk status changes (shape differences are acceptable but may add consumer complexity).
