# Story PM-01.6: Project Settings Page

Status: done

## Story

As a project lead,
I want to configure project settings,
so that I can customize behavior for my team.

## Acceptance Criteria

1. Given I am project lead or admin  
   When I navigate to the Settings tab  
   Then I can configure:
   - General (name, description, dates)
   - Automation (auto-approval threshold, suggestion mode)
   - Phases (reorder, add, edit)
   - Danger Zone (archive, delete)
2. And changes auto-save with a "Saved" toast
3. And archive sets `status=ARCHIVED`

## Tasks / Subtasks

- [x] Enable project-lead access for project update/delete and phase mutations (AC: 1,3)
- [x] Implement settings UI at `/dashboard/pm/[slug]/settings` (AC: 1,2,3)
  - [x] General section (auto-save)
  - [x] Automation section (auto-save)
  - [x] Phases section (add/edit/reorder)
  - [x] Danger zone (archive/delete)

## Dev Notes

- Project lead is stored on `ProjectTeam.leadUserId`; project creation should initialize a team record.
- Use existing Nest endpoints:
  - PATCH `/pm/projects/:id`
  - DELETE `/pm/projects/:id`
  - POST `/pm/projects/:projectId/phases`
  - PATCH `/pm/phases/:id`

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.6)
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/settings/page.tsx` (currently placeholder)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-6-project-settings-page.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added project-lead enforcement for project updates/deletes and phase mutations for workspace members.  
✅ Implemented `/dashboard/pm/[slug]/settings` with autosave general + automation settings, phase add/edit/reorder, and archive/delete actions.

### File List

- `apps/api/src/pm/projects/dto/create-project.dto.ts`
- `apps/api/src/pm/projects/projects.controller.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `apps/api/src/pm/projects/projects.service.spec.ts`
- `apps/api/src/pm/phases/phases.controller.ts`
- `apps/api/src/pm/phases/phases.service.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/CreateProjectModal.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/settings/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/settings/ProjectSettingsContent.tsx`
- `apps/web/src/hooks/use-pm-projects.ts`
- `apps/web/src/hooks/use-pm-phases.ts`
- `packages/shared/src/types/pm.ts`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-6-project-settings-page.md`
- `docs/modules/bm-pm/stories/pm-01-6-project-settings-page.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Settings page meets acceptance criteria: autosave edits, phases management (add/edit/reorder), and a clear danger zone.
- Access control is enforced server-side for members via “project lead” checks, while owners/admins retain access via existing role gating.
- Unit tests updated to cover lead enforcement and team initialization during project creation.

### Minor Suggestions (Non-blocking)

- Consider batching phase re-order swaps to avoid multiple “Saved” toasts per action if phase ordering becomes heavily used.
