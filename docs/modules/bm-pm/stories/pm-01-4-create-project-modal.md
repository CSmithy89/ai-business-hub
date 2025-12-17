# Story PM-01.4: Create Project Modal

Status: done

## Story

As a workspace user,
I want to create a new project with template selection,
so that I can start managing work immediately.

## Acceptance Criteria

1. Given I click "New Project"  
   When the modal opens  
   Then I see a multi-step wizard:
   - Step 1 (Basics): Name, description, type, color, icon
   - Step 2 (Template): BMAD templates or flexible options
   - Step 3 (Team): Assign project lead (required)
2. And on success, navigates to the new project page

## Tasks / Subtasks

- [x] Implement create project modal wizard (AC: 1,2)
  - [x] Add modal component on `/dashboard/pm` with 3 steps
  - [x] Validate required fields per step
  - [x] Submit to Nest `POST /pm/projects`
  - [x] Navigate to `/dashboard/pm/[slug]` on success
- [x] Add create project mutation hook (AC: 2)
  - [x] Use session token + active workspace context for AuthGuard/TenantGuard

## Dev Notes

- Backend `POST /pm/projects` requires `businessId` and `name`; UI should allow selecting a business if not in business context.
- Phase templates auto-generation is handled in PM-01.7; for PM-01.4 pass `bmadTemplateId` and navigate on success.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.4)
- `apps/web/src/app/(dashboard)/dashboard/pm/PmProjectsContent.tsx` (New Project entry point)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-4-create-project-modal.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added a 3-step Create Project modal wizard (Basics → Template → Team) from `/dashboard/pm`.  
✅ Added create project mutation (POST `/pm/projects`) and navigates to `/dashboard/pm/[slug]` on success.

### File List

- `apps/web/src/hooks/use-pm-projects.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/CreateProjectModal.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/PmProjectsContent.tsx`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-4-create-project-modal.md`
- `docs/modules/bm-pm/stories/pm-01-4-create-project-modal.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Modal wizard matches the requested step structure and validates required fields before advancing.
- Create mutation uses session token + active workspace context and navigates to the new project route on success.
- Business selection is included so the UI can satisfy the backend `businessId` requirement even outside business context.

### Minor Suggestions (Non-blocking)

- Populate business default selection once businesses load (if the list arrives after the modal opens) for a smoother first-run experience.
