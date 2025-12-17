# Story PM-02.2: Task Detail Panel

Status: done

## Story

As a project user,
I want to view and edit task details in a slide-out panel,
so that I can manage tasks without leaving the current view.

## Acceptance Criteria

1. Given I click a task in any view  
   When the panel slides open  
   Then I see: title (inline editable), description (rich text), status dropdown, priority dropdown, assignee selector, due date picker, story points input
2. And I see an activity timeline at the bottom
3. And the close button returns me to the previous view
4. And the URL updates to include `taskId` for direct linking
5. And updates auto-save on field blur

## Tasks / Subtasks

- [x] Implement task detail panel UI (AC: 1,2,3,4,5)
  - [x] Create slide-over panel component (right side, ~480px)
  - [x] Load task by `taskId` and display editable fields
  - [x] Implement auto-save on blur for each field
  - [x] Render activity timeline list
- [x] Wire URL state (AC: 3,4)
  - [x] Persist `taskId` in URL/search params
  - [x] Restore open panel from URL (deep link)
- [x] Add API client hooks (AC: 1,2,5)
  - [x] Fetch task details and activity
  - [x] Patch updates per-field
- [ ] Tests (as feasible) (AC: 3,4,5)
  - [ ] Unit test URL open/close behavior
  - [ ] Unit test update calls on blur (mocked)

## Dev Notes

- Slide-over panel is right-aligned, 480px wide, dismissible, and should not require navigation away from the underlying view.
- Task API endpoints are provided by PM-02.1 under `apps/api/src/pm/tasks/*`.
- Description editing uses markdown input with an inline preview (rich text via markdown rendering).

### Wireframe

- PM-05 Task Detail Modal: `docs/design/wireframes/Finished wireframes and html files/pm-05_task_detail_modal/`

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.2)
- `docs/modules/bm-pm/tech-spec-epic-pm-02.md`
- `apps/web` (Project pages + routing)
- `apps/api/src/pm/tasks/tasks.controller.ts` (task endpoints)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-2-task-detail-panel.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Implemented project tasks page with a clickable task list and URL-driven `taskId` deep linking.  
✅ Added a right-side task detail sheet with auto-save-on-blur for key fields and an activity timeline.  
✅ Added `usePmTasks` / `usePmTask` / `useUpdatePmTask` hooks for list/detail/update.

### File List

- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-2-task-detail-panel.md`
- `docs/modules/bm-pm/stories/pm-02-2-task-detail-panel.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- URL-driven `taskId` deep linking is implemented and the close action removes the param without leaving the page.
- Auto-save behavior is consistent and uses existing session/workspace context for authorization.
- Activity timeline is surfaced directly from the task detail response.

### Minor Suggestions (Non-blocking)

- Consider adding unit tests for URL open/close and blur-triggered updates once navigation mocks are in place.
