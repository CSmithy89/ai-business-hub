# Story PM-09.6: View Templates

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **reusable view templates**,
So that **I can apply a consistent view setup across projects**.

---

## Acceptance Criteria

### AC1: Template Library
**Given** I open the templates menu  
**When** templates are available  
**Then** I can see a list of saved templates

### AC2: Save Template
**Given** I have configured a view  
**When** I save it as a template  
**Then** it appears in the template library

### AC3: Apply Template
**Given** I select a template  
**When** it is applied  
**Then** filters, columns, sorting, and view type update to match the template

---

## Technical Approach

- Store templates in localStorage scoped to the active workspace.
- Provide a templates menu alongside saved views on the task page.
- Apply template settings by reusing the existing applyView logic.

---

## Implementation Tasks

### Frontend
- [x] Add templates menu for saving and applying templates.
- [x] Persist templates to localStorage per workspace.
- [x] Apply template settings to the task view state.

---

## Files to Create/Modify

### Frontend
- `apps/web/src/components/pm/views/ViewTemplatesMenu.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

- Templates persist across reloads within a workspace.
- Applying a template updates view mode, filters, columns, and sorting.

---

## Dependencies

- PM-09.4 (Custom View Builder)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added a templates menu for saving and applying view templates.
- Stored templates in localStorage scoped to the active workspace.
- Applied template view state (filters, columns, sorting, view type) on selection.

## Files Updated

- `apps/web/src/components/pm/views/ViewTemplatesMenu.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Senior Developer Review

**Outcome:** APPROVE

- Templates reuse existing view state and preferences without backend changes.
- Applying templates updates filters, columns, and sorting consistently.
- No blocking issues found. Tests not run in this step.
