# Story PM-01.8: Project Team Management

Status: done

## Story

As a project lead,
I want to manage my project team,
so that I can assign roles and control access.

## Acceptance Criteria

1. Given I am on the project Team tab  
   When I view the team  
   Then I see team members with avatar, name, role, and capacity
2. And I can add team members with role and permissions
3. And I can edit/remove members (with task reassignment)

## Tasks / Subtasks

- [x] Add project team API endpoints (AC: 1,2,3)
  - [x] GET team for project (members + user details + assigned task counts)
  - [x] POST add member (lead-gated for workspace members)
  - [x] PATCH edit member (lead-gated for workspace members)
  - [x] DELETE remove member (deactivate + optional task reassignment)
- [x] Implement Team tab UI at `/dashboard/pm/[slug]/team` (AC: 1,2,3)
  - [x] Members table (avatar, role, capacity, permissions, assigned tasks)
  - [x] Add/Edit member dialogs
  - [x] Remove member flow with reassignment selection when needed

## Dev Notes

- Team membership is project-scoped (`ProjectTeam` + `TeamMember`) but users come from workspace membership (`WorkspaceMember.user`).
- Removal is implemented as `isActive=false` and enforces reassignment when tasks are assigned to the removed user.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.8)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-8-project-team-management.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added PM team endpoints to fetch/manage project team members (add/edit/remove), including task reassignment enforcement on removal.  
✅ Implemented `/dashboard/pm/[slug]/team` with member table, dialogs for add/edit, and a remove flow that requires reassignment when tasks exist.

### File List

- `apps/api/src/pm/pm.module.ts`
- `apps/api/src/pm/team/team.module.ts`
- `apps/api/src/pm/team/team.controller.ts`
- `apps/api/src/pm/team/team.service.ts`
- `apps/api/src/pm/team/dto/create-team-member.dto.ts`
- `apps/api/src/pm/team/dto/update-team-member.dto.ts`
- `apps/web/src/hooks/use-pm-team.ts`
- `apps/web/src/hooks/use-workspace-members.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/team/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/team/ProjectTeamContent.tsx`
- `packages/shared/src/types/events.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-8-project-team-management.md`
- `docs/modules/bm-pm/stories/pm-01-8-project-team-management.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Team management is workspace-aware (only workspace members can be added) and project-lead gated for member role while keeping owner/admin access.
- Removal flow is safe: lead cannot be removed and task reassignment is enforced when tasks are assigned.

### Minor Suggestions (Non-blocking)

- Consider adding server-side pagination for workspace members if large workspaces become common.

