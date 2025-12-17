# Story PM-02.5: Task Hierarchy

Status: done

## Story

As a project user,
I want to create parent-child task relationships,
so that I can break down work into subtasks.

## Acceptance Criteria

1. Given a task exists  
   When I click "Add Subtask" in task panel  
   Then a new task is created with `parentId` set
2. And the parent task shows subtask count and completion percentage
3. And maximum 3 levels are supported: Epic → Story → Task/Subtask
4. And completing all children auto-suggests completing the parent

## Tasks / Subtasks

- [x] Add API support for creating subtasks (AC: 1,3)
  - [x] Allow `parentId` in `POST /pm/tasks`
  - [x] Enforce max depth (3 levels) and prevent cycles
- [x] Add UI support in task detail panel (AC: 1,2,4)
  - [x] Subtasks summary (count + percent)
  - [x] Subtasks list with click-to-open
  - [x] "Add subtask" inline create
  - [x] Suggest marking parent as Done when all children are Done
- [x] Tests (as feasible) (AC: 1,3)
  - [x] Service test for max depth rule
  - [x] Service test for create with parentId

## Dev Notes

- `UpdateTaskDto` already supports updating `parentId`; ensure create supports it too.
- Max depth enforcement should apply to both create and update.
- UI should be resilient if a task has no children.

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.5)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-5-task-hierarchy.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added `parentId` support to task creation and list filtering, with server-side hierarchy validation (max depth + cycle prevention).  
✅ Extended task detail payload with children list + computed subtask summary (count/done/%).  
✅ Implemented subtasks UI in task detail sheet: summary, list, inline create, and “all done” suggestion.  
✅ Added unit tests for subtask creation and max-depth enforcement.

### File List

-
  `apps/api/src/pm/tasks/dto/create-task.dto.ts`
-
  `apps/api/src/pm/tasks/dto/list-tasks.query.dto.ts`
-
  `apps/api/src/pm/tasks/tasks.service.ts`
-
  `apps/api/src/pm/tasks/tasks.service.spec.ts`
-
  `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
-
  `apps/web/src/hooks/use-pm-tasks.ts`
-
  `docs/modules/bm-pm/sprint-status.yaml`
-
  `docs/modules/bm-pm/stories/pm-02-5-task-hierarchy.md`
-
  `docs/modules/bm-pm/stories/pm-02-5-task-hierarchy.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- API enforces hierarchy constraints in both create and update paths, preventing cycles and limiting depth.
- UI matches acceptance criteria and provides a clear “complete parent” suggestion without forcing status changes.
- Tests cover key constraints (parentId create + max depth), which are the most failure-prone parts.

### Minor Suggestions (Non-blocking)

- Consider adding a `parentId` filter to the web task list query type if/when you add a dedicated subtasks view.
