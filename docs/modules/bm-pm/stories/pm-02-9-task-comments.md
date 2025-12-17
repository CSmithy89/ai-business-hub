# Story PM-02.9: Task Comments

Status: done

## Story

As a project user,
I want to comment on tasks,
so that I can collaborate and leave context where work happens.

## Acceptance Criteria

1. Given I am viewing a task detail panel  
   When I add a comment  
   Then the comment is saved and appears in the comments list
2. Given I authored a comment  
   When I edit or delete it  
   Then it is updated/removed successfully
3. Given comments exist  
   When I view the task detail panel  
   Then I see comments in chronological order with timestamps

## Tasks / Subtasks

- [x] Add comments API endpoints (AC: 1-3)
  - [x] Create comment (threaded optional)
  - [x] Edit comment (author only)
  - [x] Delete comment (soft delete, author only)
  - [x] Activity log entries for comment actions
- [x] Add comments UI in task detail sheet (AC: 1-3)
  - [x] Comment list + timestamps
  - [x] Add comment input
  - [x] Inline edit/delete for author
- [x] Tests (as feasible) (AC: 1-2)

## Dev Notes

- Use `TaskComment` table (`deletedAt` for soft delete).
- Authorization: only the comment author can edit/delete.
- Emit `pm.task.updated` on comment changes.

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.11: Task Activity Log includes comments)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-9-task-comments.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

- Added comment CRUD endpoints under `/pm/tasks/:id/comments` with author-only edit/delete and soft delete.
- Added task detail comments UI with post/edit/delete and chronological display.

### File List

- `apps/api/src/pm/tasks/dto/create-task-comment.dto.ts`
- `apps/api/src/pm/tasks/dto/update-task-comment.dto.ts`
- `apps/api/src/pm/tasks/tasks.controller.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `docs/modules/bm-pm/stories/pm-02-9-task-comments.md`
- `docs/modules/bm-pm/stories/pm-02-9-task-comments.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**
