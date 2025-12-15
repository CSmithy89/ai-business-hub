# Story 15.14: Implement Business Switcher Dropdown

**Story ID:** 15.14
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 5
**Status:** in-progress

---

## User Story

**As a** business owner
**I want** to quickly switch between my businesses
**So that** I can easily navigate between different business contexts

---

## Context

The header currently shows a hardcoded workspace placeholder ("Acme Corp"). This story implements a functional business switcher dropdown that:
- Shows the currently selected business
- Allows switching between businesses
- Shows status badges for each business
- Provides quick access to the portfolio page

**Source:** EPIC-15 tech spec Phase 5
**Backlog Reference:** Section 10.2 - Business Switcher (P0)

---

## Acceptance Criteria

- [x] Create BusinessSwitcher component
- [x] Dropdown shows all businesses for current workspace
- [x] Each business shows:
  - Business name
  - Onboarding status badge
  - Check mark if currently selected
- [x] Clicking a business navigates to that business's default route
- [x] "View All Businesses" link to portfolio page
- [x] Integrates into Header component
- [x] Loading state while fetching businesses
- [x] Responsive design (hidden on mobile, shown on md+ screens)

---

## Technical Implementation

### Files to Create

```
apps/web/src/components/business/business-switcher.tsx
```

### Files to Modify

```
apps/web/src/components/shell/Header.tsx  # Replace placeholder with BusinessSwitcher
```

### Implementation Strategy

1. Create BusinessSwitcher component using existing patterns from:
   - WorkspaceSelector for dropdown structure
   - useBusinesses hook for data fetching
   - getStatusVariant/getStatusLabel for status badges

2. Component features:
   - Uses shadcn/ui DropdownMenu
   - Shows first business letter as avatar
   - Status badge from business-status utilities
   - Conditional rendering based on business count

3. Integration:
   - Replace hardcoded placeholder in Header.tsx
   - Pass current business context from URL or store

---

## Definition of Done

- [x] BusinessSwitcher component created
- [x] Dropdown displays businesses with status badges
- [x] Business selection navigates to correct route
- [x] Header updated to use BusinessSwitcher
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- useBusinesses hook (existing)
- business-status utilities (existing)
- shadcn/ui dropdown-menu component (existing)

---

## Notes

- Business context determined by URL path (`/dashboard/[businessId]/...`)
- If no business selected, show "Select Business" placeholder
- Dropdown fetches on open for fresh data

---

## Related Stories

- **15.2:** Create Businesses Portfolio Landing Page (foundation)
- **08.2:** Implement Portfolio Dashboard with Business Cards (data model)
- **15.11:** Main Menu Restructuring with Businesses Tab

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_

---

## Tasks/Subtasks

- [x] **Task 1:** Create business-switcher.tsx component
- [x] **Task 2:** Add status badges using existing utilities
- [x] **Task 3:** Implement business selection navigation
- [x] **Task 4:** Update Header.tsx to use BusinessSwitcher
- [x] **Task 5:** Verify TypeScript type check passes
- [x] **Task 6:** Verify ESLint passes

---

## File List

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/components/business/business-switcher.tsx` | Business switcher dropdown |

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/components/shell/Header.tsx` | Replace placeholder with BusinessSwitcher |

---

## Code Review

### Changes Summary
- Created `business-switcher.tsx` component with:
  - DropdownMenu from shadcn/ui for the switcher UI
  - Integration with useBusinesses hook for data fetching
  - Status badges using existing getStatusVariant/getStatusLabel utilities
  - Avatar colors based on onboarding status (gradient backgrounds)
  - Navigation to business default route on selection
  - "View All Businesses" link to portfolio page
  - Loading and error states
- Updated `Header.tsx`:
  - Replaced hardcoded placeholder with BusinessSwitcher component
  - Removed unused ChevronDown import
  - Updated component documentation

### Code Quality
- TypeScript: No errors
- ESLint: No new errors (pre-existing `<img>` warnings only)
- Follows existing patterns from WorkspaceSelector
- Reuses business-status utilities for consistency

### Testing Results
- BusinessSwitcher renders in header
- Dropdown opens and shows businesses
- Status badges display correctly
- Business selection navigates to correct route
- "View All Businesses" navigates to portfolio

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |
