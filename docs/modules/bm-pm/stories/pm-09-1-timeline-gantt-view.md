# Story PM-09.1: Timeline View (Gantt)

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 8

---

## User Story

As a **project user**,
I want **a Gantt-style timeline view**,
So that **I can visualize task schedules and dependencies**.

---

## Acceptance Criteria

### AC1: Timeline Layout
**Given** I select Timeline view  
**When** view loads  
**Then** I see a horizontal timeline with task bars, dependency arrows, and critical path highlighting

### AC2: Drag to Adjust Dates
**Given** tasks are visible  
**When** I drag a task bar  
**Then** the task start/end dates update

### AC3: Resize Duration
**Given** tasks are visible  
**When** I drag the task bar edges  
**Then** the task duration updates

### AC4: Zoom Levels
**Given** I am in timeline view  
**When** I switch zoom levels  
**Then** I can view the timeline by day, week, or month

---

## Technical Approach

- Add a new Timeline view component in the PM task views.
- Use a lightweight, native HTML/CSS timeline grid with drag/resize handlers.
- Compute dependency lines and highlight critical path tasks.
- Persist zoom preference per project.

---

## Implementation Tasks

### Frontend
- [x] Add Timeline view toggle in tasks page.
- [x] Implement Timeline view component with zoom controls.
- [x] Add drag/resize handlers to update dates locally.
- [x] Render dependency arrows and critical path styling.

### Backend
- [x] Add API support for updating task dates (if not present).

---

## Files to Create/Modify

### Frontend
- `apps/web/src/components/pm/views/TimelineView.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/lib/pm/view-preferences.ts`

### Backend
- `apps/api/src/pm/tasks/tasks.service.ts`

---

## Testing Requirements

- Timeline renders tasks with correct dates.
- Drag/resize updates task dates.
- Zoom levels update grid scale.

---

## Dependencies

- PM-03.7 (Advanced filters)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added a Timeline view with zoom controls, drag/resize interactions, dependency arrows, and critical path highlighting.
- Persisted Timeline as a view mode preference and wired it into task view toggles.
- Enabled task start date updates through the API to support Gantt interactions.

## Files Updated

- `apps/web/src/components/pm/views/TimelineView.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`
- `apps/web/src/lib/pm/view-preferences.ts`
- `apps/web/src/hooks/use-pm-tasks.ts`
- `apps/api/src/pm/tasks/dto/update-task.dto.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`

---

## Senior Developer Review

**Outcome:** APPROVE

- Timeline UI delivers zoom, drag/resize, dependency arrows, and critical path highlight with acceptable defaults.
- Added startedAt support is scoped to task updates and does not break existing task flows.
- Zoom preference stored per project; no blocking issues found. Tests not run in this step.
