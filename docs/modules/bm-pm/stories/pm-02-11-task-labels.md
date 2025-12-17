# Story PM-02.11: Task Labels

Status: done

## Story

As a project user,
I want to tag tasks with labels,
so that I can categorize and filter work by custom criteria.

## Acceptance Criteria

1. Given I am in task detail panel  
   When I add a label (new or existing)  
   Then the label appears on the task
2. Given labels exist on a task  
   When I remove one  
   Then it is removed successfully
3. Given I have tasks with labels  
   When I filter tasks by label in the list view  
   Then I only see matching tasks

## Tasks / Subtasks

- [x] Add labels API endpoints (AC: 1-3)
  - [x] Upsert label (create if missing; update color if exists)
  - [x] Remove label
  - [x] Add list filter by label
  - [x] Activity log entries for label actions
- [x] Add labels UI in task detail sheet (AC: 1-2)
  - [x] Add label input + color picker
  - [x] Display labels as badges
  - [x] Remove label
- [x] Tests (as feasible) (AC: 1-2)

## Dev Notes

- Labels are stored per-task in `TaskLabel` (`@@unique([taskId, name])`); MVP treats name case-insensitively when upserting.
- List filtering uses `GET /pm/tasks?label=...` (case-insensitive).

### References

- `packages/db/prisma/schema.prisma` (`TaskLabel`)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-11-task-labels.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

- Added label upsert/delete endpoints and label filtering via `GET /pm/tasks?label=...`.
- Added labels UI in `TaskDetailSheet` with name input, color picker, badges, and remove.

### File List

- `apps/api/src/pm/tasks/dto/list-tasks.query.dto.ts`
- `apps/api/src/pm/tasks/dto/upsert-task-label.dto.ts`
- `apps/api/src/pm/tasks/tasks.controller.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `docs/modules/bm-pm/stories/pm-02-11-task-labels.md`
- `docs/modules/bm-pm/stories/pm-02-11-task-labels.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**
