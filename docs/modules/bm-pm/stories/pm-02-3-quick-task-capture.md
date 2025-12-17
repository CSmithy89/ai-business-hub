# Story PM-02.3: Quick Task Capture

Status: done

## Story

As a project user,
I want to create tasks quickly with a keyboard shortcut,
so that I can capture ideas without friction.

## Acceptance Criteria

1. Given I am on any project page  
   When I press `c`  
   Then a quick capture modal opens with: title input (focused), phase dropdown (current phase default), "Create" and "Create & Open" buttons
2. And pressing Enter creates the task and closes the modal
3. And pressing Shift+Enter creates the task and opens the detail panel
4. And pressing Escape closes the modal without creating

## Tasks / Subtasks

- [x] Add quick capture modal UI (AC: 1)
  - [x] Focus title input on open
  - [x] Phase dropdown defaults to current phase
  - [x] Buttons: Create, Create & Open
- [x] Add keyboard shortcut `c` on project pages (AC: 1,4)
  - [x] Use existing `useKeyboardShortcut` and ensure it doesn’t trigger inside inputs
- [x] Wire task creation API (AC: 2,3)
  - [x] Add `useCreatePmTask` hook using `POST /pm/tasks`
  - [x] Enter creates; Shift+Enter creates+opens
- [x] Tests (as feasible) (AC: 2,3,4)

## Dev Notes

- Shortcut must be active on project sub-pages (`/dashboard/pm/[slug]/*`) only.
- “Create & Open” can deep-link to the task detail panel via URL `taskId`.

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.3)
- `apps/web/src/hooks/use-keyboard-shortcut.ts`
- `apps/web/src/hooks/use-pm-projects.ts` (phase list)
- `apps/api/src/pm/tasks/tasks.controller.ts` (create task endpoint)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-3-quick-task-capture.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added a project-level layout shell that registers `c` for quick task capture on any project sub-page.  
✅ Implemented quick capture modal with focused title input, phase defaulting, and Enter/Shift+Enter/Escape behavior.  
✅ Added `useCreatePmTask` hook and deep-linking to the task detail panel via `taskId`.

### File List

- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/layout.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/project-shell.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-3-quick-task-capture.md`
- `docs/modules/bm-pm/stories/pm-02-3-quick-task-capture.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Shortcut is scoped to project routes via the `[slug]` layout shell.
- Modal keyboard behaviors match the acceptance criteria and focus is set on open.
- Phase default selection is deterministic (CURRENT → lowest phaseNumber fallback).

### Minor Suggestions (Non-blocking)

- Consider adding a small “Press `c` to capture” hint in the Tasks UI once PM-03 is implemented.
