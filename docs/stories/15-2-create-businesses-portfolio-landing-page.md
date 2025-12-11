# Story 15.2: Create Businesses Portfolio Landing Page

**Story ID:** 15.2
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 5
**Status:** done

---

## User Story

**As a** signed-in user
**I want** to see all my businesses on a dedicated portfolio page
**So that** I can quickly access or create businesses

---

## Context

This story creates the main landing page for signed-in users at `/businesses`. It displays all businesses in the current workspace as a card grid, with status indicators, progress visualization, and quick actions. The backend API (`/api/businesses`) and React Query hook (`useBusinesses`) already exist from EPIC-08.

**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md Section 2.1, 10.1
**Wireframe:** BO-01 Portfolio Dashboard with Business Cards

---

## Acceptance Criteria

### Page Structure

- [x] Create page at `/businesses` route
- [x] Display businesses as responsive card grid
- [x] Page header with title "Your Businesses" and "Add Business" button

### Business Card Requirements

- [x] Each business card shows:
  - Business logo/placeholder (initials avatar) - uses card header styling
  - Business name
  - Status badge (Draft, Validating, Planning, Branding, Active)
  - Validation score (if available, as progress ring or percentage)
  - Phase progress indicators (validation, planning, branding)
  - Last updated timestamp (relative: "2 hours ago")
  - "Continue" action button linking to business default route (click navigates)

### Add New Business Card

- [x] "Add New Business" card at end of grid (StartBusinessCard component)
- [x] Links to `/onboarding/wizard`
- [x] Visual distinct from business cards (dashed border, plus icon)

### Empty State

- [x] Empty state for users with no businesses (EmptyBusinessState component)
- [x] "Create Your First Business" CTA
- [x] Warm, encouraging copy

### Search and Sort

- [x] Search bar to filter businesses by name
- [x] Sort options: Name, Created Date, Last Activity, Status

### Responsive Layout

- [x] 3 columns on desktop (lg:grid-cols-3)
- [x] 2 columns on tablet (md:grid-cols-2)
- [x] 1 column on mobile (default)

### Loading States

- [x] Skeleton loaders while fetching data (BusinessCardSkeleton)
- [x] Error state with retry button

---

## Technical Implementation

### Files to Create

```
apps/web/src/app/(app)/businesses/page.tsx
apps/web/src/components/business/BusinessCard.tsx
apps/web/src/components/business/BusinessGrid.tsx
apps/web/src/components/business/AddBusinessCard.tsx
apps/web/src/components/business/BusinessCardSkeleton.tsx
apps/web/src/components/business/BusinessEmptyState.tsx
```

### Existing Infrastructure

| Resource | Location | Description |
|----------|----------|-------------|
| API | `/api/businesses` | GET endpoint with pagination |
| Hook | `use-businesses.ts` | React Query hook for fetching |
| Status helpers | `business-status.ts` | Badge variants, labels, routes |
| Business type | `@hyvve/db` | Prisma Business model |

### Component Dependencies

- shadcn/ui: Card, Badge, Button, Input, Select, Skeleton, Avatar
- lucide-react: Plus, Search, Building2, Clock, ArrowRight
- @tanstack/react-query: useQuery (via useBusinesses hook)

### Status Badge Colors

```typescript
const statusColors = {
  WIZARD: 'bg-gray-100 text-gray-700',      // Getting Started
  VALIDATION: 'bg-blue-100 text-blue-700',  // Validating
  PLANNING: 'bg-purple-100 text-purple-700', // Planning
  BRANDING: 'bg-pink-100 text-pink-700',    // Branding
  COMPLETE: 'bg-green-100 text-green-700',  // Active
}
```

---

## Tech Spec Reference

See **tech-spec-epic-15.md** Section: "Story 15.2: Create Businesses Portfolio Landing Page"

---

## Definition of Done

- [x] Page renders at `/businesses` route
- [x] Business cards display with all required information
- [x] Add Business card links to wizard
- [x] Empty state shows when no businesses
- [x] Search filters businesses by name
- [x] Sort changes business order
- [x] Responsive grid works on all screen sizes
- [x] Skeleton loaders show during fetch
- [x] Error state with retry functionality
- [x] TypeScript type check passes
- [x] ESLint passes
- [ ] Code review completed

---

## Dependencies

- **Story 15.11:** Businesses sub-navigation (done) - provides nav link to this page
- Existing: `/api/businesses` endpoint, `useBusinesses` hook, Business types

---

## Notes

- The redirect from sign-in to `/businesses` is handled in a separate story (15.15)
- Business card click navigates based on `getBusinessDefaultRoute()` from business-status.ts
- Use relative time formatting ("2 hours ago") for updatedAt display
- Consider virtualization if many businesses (out of scope for now)

---

## Related Stories

- **15.11:** Main Menu Restructuring (done - provides Businesses nav)
- **15.3:** Onboarding Wizard (Add Business links here)
- **15.15:** Update Sign-in Flow Redirect

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_
_Tech Spec: tech-spec-epic-15.md_

---

## Tasks/Subtasks

- [x] **Task 1:** Create BusinessCard component with status, progress, actions (existed from EPIC-08)
- [x] **Task 2:** Create BusinessCardSkeleton for loading state (existed from EPIC-08)
- [x] **Task 3:** Create AddBusinessCard component (StartBusinessCard from EPIC-08)
- [x] **Task 4:** Create BusinessEmptyState component (EmptyBusinessState from EPIC-08)
- [x] **Task 5:** Create BusinessGrid component with search/sort (NEW)
- [x] **Task 6:** Create /businesses page assembling all components (NEW)
- [x] **Task 7:** Verify TypeScript type check passes
- [x] **Task 8:** Verify ESLint passes

---

## File List

### Files Created (this story)

| File | Description |
|------|-------------|
| `apps/web/src/app/(app)/businesses/page.tsx` | Main businesses portfolio page |
| `apps/web/src/components/business/BusinessGrid.tsx` | Grid with search/sort functionality |

### Files Used (existed from EPIC-08)

| File | Description |
|------|-------------|
| `apps/web/src/components/business/BusinessCard.tsx` | Individual business card |
| `apps/web/src/components/business/BusinessCardSkeleton.tsx` | Loading skeleton |
| `apps/web/src/components/business/StartBusinessCard.tsx` | Add new business CTA card |
| `apps/web/src/components/business/EmptyBusinessState.tsx` | Empty state display |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete - page and BusinessGrid created | Claude Code |

---

## Dev Agent Record

### Context Reference

- Leveraged existing components from EPIC-08 (BusinessCard, Skeleton, Empty, StartCard)
- Used existing useBusinesses hook and business-status helpers

### Completion Notes

**Implementation Summary:**
- Created BusinessGrid.tsx with search filtering and 4 sort options
- Created /businesses page with header and grid layout
- Reused 4 existing business components from EPIC-08
- Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
- TypeScript and ESLint checks pass

---

## Senior Developer Review (AI)

**Reviewer:** Claude Code (Code Review Workflow)
**Date:** 2025-12-11
**Review Status:** APPROVED

---

### Acceptance Criteria Validation

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Page at /businesses route | PASS | `app/(app)/businesses/page.tsx` created |
| AC2 | Responsive card grid | PASS | `BusinessGrid.tsx:192` - grid md:grid-cols-2 lg:grid-cols-3 |
| AC3 | Page header with title and button | PASS | `page.tsx:28-41` - header with Add Business link |
| AC4 | Business card shows required info | PASS | `BusinessCard.tsx` - name, badge, score, progress, timestamp |
| AC5 | Add Business card | PASS | `StartBusinessCard.tsx` - dashed border, links to wizard |
| AC6 | Empty state | PASS | `EmptyBusinessState.tsx` - CTA and encouraging copy |
| AC7 | Search bar | PASS | `BusinessGrid.tsx:155-164` - filters by name/description |
| AC8 | Sort options | PASS | `BusinessGrid.tsx:166-180` - 4 options (updated, created, name, status) |
| AC9 | Responsive 3/2/1 columns | PASS | Tailwind classes in grid |
| AC10 | Skeleton loaders | PASS | `BusinessGrid.tsx:89-104` - 6 skeleton cards while loading |
| AC11 | Error state with retry | PASS | `BusinessGrid.tsx:107-139` - error message and Try Again button |

---

### Code Quality Assessment

**Architecture:**
- Clean separation: page handles layout, BusinessGrid handles data presentation
- Proper use of React Query via useBusinesses hook
- Memoized filtering/sorting with useMemo

**Patterns:**
- Follows project conventions (functional components, TypeScript)
- Lucide icons used consistently
- Proper error boundaries

---

### Final Verdict

**Status:** APPROVED FOR MERGE

All acceptance criteria met. Efficiently reused existing EPIC-08 components. TypeScript and ESLint pass.
