# Story PM-02.7: Task States & Workflow

Status: done

## Story

As a project user,
I want tasks to follow a consistent workflow,
so that task progress is tracked reliably.

## Acceptance Criteria

1. Given default task states exist  
   When I change task status  
   Then options are: Backlog, Todo, In Progress, Review, Awaiting Approval, Done, Cancelled
2. And status changes are logged to activity
3. And moving to Done sets `completedAt` timestamp
4. And (optional) moving to In Progress sets `startedAt` timestamp

## Tasks / Subtasks

- [x] Ensure API status transitions set timestamps (AC: 2-4)
  - [x] `DONE` sets `completedAt`
  - [x] `IN_PROGRESS` sets `startedAt` (if not set yet)
- [x] Ensure UI uses the canonical status list (AC: 1)
- [x] Tests (as feasible) (AC: 3-4)
  - [x] Unit test startedAt/completedAt behavior on status changes

## Dev Notes

- `completedAt` behavior exists; add/verify `startedAt` behavior when moving into In Progress.
- Bulk updates should apply consistent timestamp rules where relevant.

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.7)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-7-task-state-machine.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added `startedAt` stamping on first transition into `IN_PROGRESS` (single-task update + bulk update).  
✅ Verified `completedAt` stamping on `DONE` remains intact.  
✅ Added unit tests covering startedAt/completedAt behavior on status transitions.

### File List

- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-7-task-state-machine.md`
- `docs/modules/bm-pm/stories/pm-02-7-task-state-machine.context.xml`
## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Timestamp rules are applied at the service layer (single + bulk), so UI stays simple.
- Tests exercise the timestamp side effects directly via the update entrypoint.

### Minor Suggestions (Non-blocking)

- Consider clearing `startedAt` when moving back to `TODO/BACKLOG` if you want “first started” vs “currently active” semantics.
