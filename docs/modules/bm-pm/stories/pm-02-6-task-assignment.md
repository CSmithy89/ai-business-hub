# Story PM-02.6: Task Assignment

Status: done

## Story

As a project user,
I want to assign tasks to team members or agents,
so that work is distributed and tracked.

## Acceptance Criteria

1. Given I am editing task assignment  
   When I open the assignee selector  
   Then I see: team members (with avatars), agents (with AI badge), "Unassigned" option
2. And selecting a member sets `assigneeId`
3. And selecting an agent sets `agentId` and `assignmentType=AGENT`
4. And I can set both for `HYBRID` assignment

## Tasks / Subtasks

- [x] Update task detail panel assignment UI (AC: 1-4)
  - [x] Add member assignee selector with avatars + unassigned
  - [x] Add agent selector with AI badge + unassigned
  - [x] Auto-derive assignmentType based on selected values
- [x] Ensure API update supports assignment fields (AC: 2-4)
  - [x] Patch `assigneeId`, `agentId`, `assignmentType` together
- [x] Tests (as feasible) (AC: 2-4)
  - [x] Unit test assignmentType derivation logic (pure helper)

## Dev Notes

- Use project team members (`usePmTeam`) for the human selector.
- Use workspace agents (`useAgents`) for the agent selector.
- Assignment type rules:
  - both set → `HYBRID`
  - agent only → `AGENT`
  - member only (or neither) → `HUMAN`

### References

- `docs/modules/bm-pm/epics/epic-pm-02-task-management-system.md` (Story PM-02.6)
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-team.ts`
- `apps/web/src/hooks/use-agents.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-02-6-task-assignment.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added an agent selector alongside the human assignee selector, including clear “Unassigned” options.  
✅ Auto-derived `assignmentType` (HUMAN/AGENT/HYBRID) based on selection and patched related fields together.  
✅ Added a small pure helper with a unit test for assignmentType derivation.

### File List

- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/lib/pm/task-assignment.ts`
- `apps/web/src/lib/pm/task-assignment.test.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-02-6-task-assignment.md`
- `docs/modules/bm-pm/stories/pm-02-6-task-assignment.context.xml`
## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Assignment state is normalized in one place (derived type), avoiding invalid combinations.
- UI makes hybrid assignment possible without adding a confusing third control.
- Test coverage targets the logic that tends to regress (type derivation).

### Minor Suggestions (Non-blocking)

- Consider filtering the agent list to `enabled` + non-`offline` once agent status becomes more meaningful in PM views.
