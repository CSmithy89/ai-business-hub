# Story PM-02.8: Task Relations

Status: done

## Story

As a project user,
I want to link related tasks,
so that I can track dependencies and connections.

## Acceptance Criteria

1. Given I am in task detail panel  
   When I click "Add Relation"  
   Then I can select relation type: Blocks, Blocked By, Relates To, Duplicates
2. And I can search/select a target task
3. And relations display in the panel with links to related tasks
4. And "blocked" tasks show a warning indicator

## Tasks / Subtasks

- [x] Add relations API endpoints (AC: 1-3)
  - [x] Create relation for task (and inverse where applicable)
  - [x] Remove relation
  - [x] Include related task info in task detail payload
- [x] Add relations UI in task detail sheet (AC: 1-4)
  - [x] Add relation form (type + search)
  - [x] List relations (outgoing/incoming)
  - [x] Remove relation button (outgoing)
  - [x] Show blocked warning
- [x] Tests (as feasible) (AC: 1-2)
  - [x] Service test for creating inverse relations

## Dev Notes

- Use `TaskRelationType` in schema; map to UX labels (Blocks, Blocked By, Relates To, Duplicates).
- Inverse mapping:
  - BLOCKS ↔ BLOCKED_BY
  - DUPLICATES ↔ DUPLICATED_BY
  - RELATES_TO ↔ RELATES_TO

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.8)
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-8-task-relations.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

- Added `POST /pm/tasks/:id/relations` + `DELETE /pm/tasks/:id/relations/:relationId` with inverse relation creation/removal.
- Extended task detail payload to include related task summaries for relations and a derived `isBlocked` flag.
- Added “Relations” section to task detail sheet with type selector, task search, outgoing/incoming lists, and “Blocked” badge.

### File List

- `apps/api/src/pm/tasks/dto/create-task-relation.dto.ts`
- `apps/api/src/pm/tasks/tasks.controller.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`
- `apps/api/src/pm/tasks/tasks.service.spec.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`

## Senior Developer Review (AI)

Outcome: **APPROVE**
