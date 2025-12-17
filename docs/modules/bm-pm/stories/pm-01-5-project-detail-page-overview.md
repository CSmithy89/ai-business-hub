# Story PM-01.5: Project Detail Page - Overview Tab

Status: done

## Story

As a project user,
I want to see project overview with phases and progress,
so that I understand the current state at a glance.

## Acceptance Criteria

1. Given I navigate to `/dashboard/pm/[slug]`  
   When the page loads  
   Then I see a header (icon, name, progress ring, status badge)
2. And a horizontal phase timeline showing all phases
3. And quick stats (tasks, team, days remaining)
4. And tab navigation (Overview, Tasks, Team, Docs, Settings)

## Tasks / Subtasks

- [x] Add API support for project lookup by slug (AC: 1,2,3)
  - [x] Add GET `/pm/projects/by-slug/:slug` (workspace-scoped, includes phases)
- [x] Add project detail fetch hook (AC: 1)
  - [x] Fetch by slug via Nest API with token + workspace context
- [x] Implement overview UI (AC: 1,2,3,4)
  - [x] Header with progress ring + status badge
  - [x] Phase timeline component
  - [x] Quick stats section
  - [x] Tab navigation links

## Dev Notes

- The list page links to `/dashboard/pm/[slug]`, so the backend needs a slug lookup endpoint (in addition to id-based lookup).
- Prefer explicit Tailwind class strings; keep UI responsive.

### References

- `docs/modules/bm-pm/epics/epic-pm-01-project-phase-management.md` (Story PM-01.5)
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/page.tsx` (currently placeholder)
- `apps/api/src/pm/projects/projects.service.ts` (add slug lookup)

## Dev Agent Record

### Context Reference

- `docs/modules/bm-pm/stories/pm-01-5-project-detail-page-overview.context.xml`

### Agent Model Used

gpt-5.2-codex

### Debug Log References

### Completion Notes List

✅ Added slug lookup API (`GET /pm/projects/by-slug/:slug`) and a `usePmProject` hook.  
✅ Implemented `/dashboard/pm/[slug]` overview UI with header, phases timeline, quick stats, and tab navigation.

### File List

- `apps/api/src/pm/projects/projects.controller.ts`
- `apps/api/src/pm/projects/projects.service.ts`
- `apps/api/src/pm/projects/projects.service.spec.ts`
- `apps/web/src/hooks/use-pm-projects.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/ProjectOverviewContent.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/team/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/docs/page.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/settings/page.tsx`
- `docs/modules/bm-pm/sprint-status.yaml`
- `docs/modules/bm-pm/stories/pm-01-5-project-detail-page-overview.md`
- `docs/modules/bm-pm/stories/pm-01-5-project-detail-page-overview.context.xml`

## Senior Developer Review (AI)

Outcome: **APPROVE**

### What Looks Good

- Added slug-based project lookup without breaking existing id-based API, and ensured route ordering avoids `:id` catching `by-slug`.
- UI meets acceptance: header, phases timeline, quick stats, and tab navigation with working routes.

### Minor Suggestions (Non-blocking)

- Consider a shared `[slug]/layout.tsx` for tabs to avoid duplicating navigation across future tab pages.
