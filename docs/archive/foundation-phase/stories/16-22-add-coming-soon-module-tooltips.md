# Story 16-22: Add Coming Soon Module Tooltips

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P3
**Points:** 1
**Status:** In Progress

## User Story

As a user seeing "Coming Soon" modules
I want tooltips explaining what's coming
So that I understand the roadmap

## Acceptance Criteria

- [x] Add tooltip to CRM/Projects status dots
- [x] Tooltip content: "Coming Soon · Expected Q1 2026"
- [x] Consistent "Coming Soon" treatment across all modules
- [x] Use shadcn Tooltip component

## Technical Notes

- Update SidebarNavItem to support coming soon tooltip
- Show tooltip on hover over status dot
- Use design system styling

## Files to Create/Modify

- `apps/web/src/components/shell/SidebarNavItem.tsx`
- `apps/web/src/components/shell/SidebarNav.tsx`

## Implementation Steps

1. Add comingSoon prop to SidebarNavItem
2. Show tooltip on status dot when comingSoon is true
3. Update SidebarNav to pass comingSoon for CRM/Projects
4. Test tooltip displays correctly

## Testing Checklist

- [x] Tooltip shows on hover over status dot
- [x] Content shows "Coming Soon" message
- [x] Works in both expanded and collapsed states
- [x] TypeScript check passes
- [ ] ESLint passes

---

## Implementation Summary

**Date:** 2025-12-13
**Status:** Done

### Changes Made

1. **SidebarNavItem.tsx:**
   - Added `comingSoon` prop (optional string)
   - Status dot shows tooltip on hover when comingSoon is set
   - Collapsed state tooltip includes coming soon text below label
   - Used shadcn Tooltip component for consistency

2. **SidebarNav.tsx:**
   - CRM nav item now has `comingSoon="Coming Soon · Expected Q1 2026"`
   - Projects nav item now has `comingSoon="Coming Soon · Expected Q1 2026"`

### Behavior

**Expanded State:**
- Hover over status dot (colored circle) shows tooltip
- Tooltip displays coming soon message

**Collapsed State:**
- Hover over entire nav item shows tooltip
- Tooltip shows label on first line, coming soon on second line

### Verification

- [x] TypeScript check passes
- [x] Tooltip shows on hover over status dot
- [x] Coming soon message displays correctly
- [x] Works in expanded and collapsed states

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Simple, non-intrusive addition using existing shadcn Tooltip component.
