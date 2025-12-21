# Story PM-09.4: Custom View Builder

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **to customize saved views with columns and sorting**,
So that **my task views match how I work**.

---

## Acceptance Criteria

### AC1: View Builder Options
**Given** I save or edit a view  
**When** the view modal opens  
**Then** I can choose visible columns and default sorting

### AC2: Persisted Customization
**Given** I save a customized view  
**When** I apply it later  
**Then** column visibility and sorting match the saved configuration

### AC3: View Type Compatibility
**Given** I am in table or list views  
**When** I save a view  
**Then** column and sort preferences are stored without breaking other view types

---

## Technical Approach

- Extend the saved view modal with column selection and sort options.
- Persist column configuration in SavedView.columns and sortBy/sortOrder fields.
- Apply column visibility and sorting preferences when a saved view is applied.

---

## Implementation Tasks

### Frontend
- [x] Add column + sort controls to the view modal.
- [x] Persist column selections in saved view payload.
- [x] Apply saved view columns/sort preferences on view load.

---

## Files to Create/Modify

### Frontend
- `apps/web/src/components/pm/saved-views/SaveViewModal.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/lib/pm/view-preferences.ts`

---

## Testing Requirements

- Saved views persist column selections and sort order.
- Applying a saved view updates column visibility and sorting.

---

## Dependencies

- PM-03.6 (Saved Views CRUD)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Extended the view save/edit modal with column visibility and sorting controls.
- Persisted column selections and sort preferences in saved views.
- Applied saved view columns and sorting when views are loaded.

## Files Updated

- `apps/web/src/components/pm/saved-views/SaveViewModal.tsx`
- `apps/web/src/components/pm/saved-views/SavedViewsDropdown.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Senior Developer Review

**Outcome:** APPROVE

- View builder enhancements stay within existing saved view patterns.
- Column and sort preferences apply cleanly without affecting non-table views.
- No blocking issues found. Tests not run in this step.
