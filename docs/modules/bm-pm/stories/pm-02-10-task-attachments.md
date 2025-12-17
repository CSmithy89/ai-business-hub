# Story PM-02.10: Task Attachments

Status: done

## Story

As a project user,
I want to attach files to tasks,
so that relevant documents are accessible in context.

## Acceptance Criteria

1. Given I am in task detail panel  
   When I drag/drop or click "Attach File"  
   Then the file uploads and the attachment appears in the list
2. Given attachments exist  
   When I view the task  
   Then I see name and can click to download/open
3. Given I remove an attachment  
   When I confirm removal  
   Then the attachment disappears from the list

## Tasks / Subtasks

- [x] Add attachments API endpoints (AC: 1-3)
  - [x] Create attachment record for task
  - [x] Remove attachment record
  - [x] Activity log entries for attachment actions
- [x] Add upload endpoint (web) (AC: 1)
  - [x] Store file using configured file storage adapter
  - [x] Return `fileUrl` + metadata for API record creation
- [x] Add attachments UI in task detail sheet (AC: 1-3)
  - [x] Drag/drop + click-to-upload
  - [x] Attachment list with open link
  - [x] Remove attachment
- [x] Tests (as feasible) (AC: 1-2)

## Dev Notes

- MVP stores files via `apps/web` API route using `getFileStorage()` (default local storage).
- Core record is persisted via Nest API `TaskAttachment` row.

### References

- `packages/db/prisma/schema.prisma` (`TaskAttachment`)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-10-task-attachments.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

- Added `/pm/tasks/:id/attachments` create/delete endpoints and attachment activity logging.
- Added `/api/pm/tasks/[taskId]/attachments/upload` for MVP file uploads using `getFileStorage()` (local by default).
- Added attachments UI in `TaskDetailSheet` with drag/drop, upload spinner, list, and remove.

### File List

- `apps/api/src/pm/tasks/dto/create-task-attachment.dto.ts`
- `apps/api/src/pm/tasks/tasks.controller.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `apps/web/src/app/api/pm/tasks/[taskId]/attachments/upload/route.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `docs/modules/bm-pm/stories/pm-02-10-task-attachments.md`
- `docs/modules/bm-pm/stories/pm-02-10-task-attachments.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**
