# Story PM-01.3: Project List Page

Status: done

## Story

As a workspace user,
I want to see all my projects in a filterable list,
so that I can navigate to any project quickly.

## Acceptance Criteria

1. Given I am logged into a workspace with projects  
   When I navigate to `/dashboard/pm`  
   Then I see project cards with icon, name, type badge, progress bar
2. And a filter bar with status, type, search
3. And a "New Project" button prominently displayed
4. And clicking a project navigates to `/dashboard/pm/[slug]`
5. And empty state shows "Create your first project" CTA
6. Responsive layout: 3 cols desktop, 2 tablet, 1 mobile

## Tasks / Subtasks

- [x] Add PM projects data hook (AC: 1,2)
  - [x] Fetch via `NESTJS_API_URL` + `/pm/projects` with token + workspace context
- [x] Implement `/dashboard/pm` page (AC: 1,2,3,5,6)
  - [x] Project cards (icon/name/type/progress)
  - [x] Filter bar (status/type/search)
  - [x] Empty state + CTA
- [x] Wire navigation to project detail (AC: 4)
  - [x] Link cards to `/dashboard/pm/[slug]`

## Dev Notes

- Existing sidebar module link currently points to `/projects` (coming soon). Update to `/dashboard/pm` when ready.
- Use `useSession()` and send `Authorization: Bearer <token>` to Nest endpoints (AuthGuard).

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.3)
- `apps/web/src/components/shell/SidebarNav.tsx` (Projects module nav link)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-3-project-list-page.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added `/dashboard/pm` project list UI with filters, responsive grid, and empty state CTA.  
✅ Added `usePmProjects` hook to fetch projects from Nest with session token + workspace context.  
✅ Added placeholder routes for `/dashboard/pm/[slug]` and `/dashboard/pm/new` and updated sidebar Projects link.

### File List

- `apps/api/src/pm/projects/dto/list-projects.query.dto.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `packages/shared/src/types/pm.ts`
- `apps/web/src/hooks/use-pm-projects.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/PmProjectsContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/new/page.tsx`
- `apps/web/src/components/shell/SidebarNav.tsx`
- `apps/web/src/app/(dashboard)/projects/page.tsx`
- `apps/web/src/app/(dashboard)/projects/ProjectsContent.tsx`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-3-project-list-page.md`
- `docs/modules/bm-pm/stories/pm-01-3-project-list-page.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- `/dashboard/pm` meets ACs: cards, filters, empty state, responsive grid, and navigation target exists.
- `usePmProjects` follows existing token + React Query patterns and keeps requests workspace-scoped.
- Added a minimal server-side search filter to the API to support the UI search field.

### Minor Suggestions (Non-blocking)

- Consider adding a skeleton/loading state component for the grid (instead of a plain text block) to match the rest of the dashboard polish.
