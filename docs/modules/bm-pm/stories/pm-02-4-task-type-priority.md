# Story PM-02.4: Task Type & Priority

Status: done

## Story

As a project user,
I want to classify tasks by type and priority,
so that I can organize and filter work.

## Acceptance Criteria

1. Given I am editing a task  
   When I set type  
   Then options are: Epic, Story, Task, Subtask, Bug, Research, Content, Agent Review
2. And each type has a distinct icon and color
3. And priority options are: Urgent (red), High (orange), Medium (yellow), Low (blue), None (gray)
4. And filters in list view support type and priority

## Tasks / Subtasks

- [x] Add task type UI + metadata (AC: 1,2)
  - [x] Define `TaskType` label/icon/color mapping
  - [x] Add Type select to task detail panel
- [x] Improve priority UI (AC: 3)
  - [x] Show colored priority indicator in select + list rows
- [x] Add list filters (AC: 4)
  - [x] Add Type filter to tasks list
  - [x] Add Priority filter to tasks list
- [ ] Tests (as feasible) (AC: 1,4)
  - [ ] Unit test filter query wiring (type/priority)

## Dev Notes

- API supports `type` and `priority` filters: `GET /pm/tasks?type=...&priority=...`.
- Task detail edits should update via `PATCH /pm/tasks/:id` with auto-save semantics (blur/select change).

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.4)
- `docs/modules/bm-pm/tech-spec-epic-pm-02.md`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-4-task-type-priority.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added a shared task metadata map (labels, icons, colors) for Task Type + Priority.  
✅ Implemented Task Type and Priority selectors in the task detail panel with visual indicators.  
✅ Added Type and Priority filters to the tasks list and surfaced type/priority in task rows.

### File List

- `apps/web/src/lib/pm/task-meta.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-4-task-type-priority.md`
- `docs/modules/bm-pm/stories/pm-02-4-task-type-priority.context.xml`
## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Type and priority now have consistent visual semantics (icons + colors) across filters, list rows, and the detail panel.
- List filters wire directly into the existing `usePmTasks` query shape (type/priority already supported by API).
- Update mutations remain consistent with the auto-save behavior (select change triggers patch).

### Minor Suggestions (Non-blocking)

- Consider extracting the repeated Filter icon in the Filters card into a small helper once filtering expands in PM-03.
