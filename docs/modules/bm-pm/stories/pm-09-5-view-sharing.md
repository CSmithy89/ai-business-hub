# Story PM-09.5: View Sharing & Permissions

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **to share saved views with my team**,
So that **everyone can align on the same task perspective**.

---

## Acceptance Criteria

### AC1: Share Controls
**Given** I am saving or editing a view  
**When** I choose sharing settings  
**Then** I can mark the view as private or team-shared

### AC2: Shareable Link
**Given** a view is shared  
**When** I copy the share link  
**Then** the URL opens the task list with that view applied

### AC3: Permissions Enforcement
**Given** I am not the view owner  
**When** I open a team-shared view  
**Then** I can apply it but cannot edit or delete it

---

## Technical Approach

- Use existing SavedView.isShared to control team sharing.
- Add share-link generation using a `viewId` query param on the tasks route.
- Apply shared view by ID when `viewId` is present in the URL.

---

## Implementation Tasks

### Frontend
- [x] Add share link action to saved views dropdown for shared views.
- [x] Apply saved views via `viewId` query param in task list route.
- [x] Keep edit/delete actions limited to view owners.

---

## Files to Create/Modify

### Frontend
- `apps/web/src/components/pm/saved-views/SavedViewsDropdown.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

- Shared view copy link opens tasks page with the view applied.
- Non-owners can apply shared views but cannot edit/delete.

---

## Dependencies

- PM-03.6 (Saved Views CRUD)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added share link copy actions for shared views in the saved views menu.
- Applied saved views via `viewId` query parameter on the tasks page.
- Preserved owner-only edit/delete controls for shared views.

## Files Updated

- `apps/web/src/components/pm/saved-views/SavedViewsDropdown.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Senior Developer Review

**Outcome:** APPROVE

- Share links apply views through existing saved view access rules.
- Non-owners can apply shared views but cannot modify them.
- No blocking issues found. Tests not run in this step.
