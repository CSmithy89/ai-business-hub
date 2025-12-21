# Story PM-09.3: Cross-Project Dependencies

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 6

---

## User Story

As a **workspace admin**,
I want **to view dependencies across projects**,
So that **I can identify blockers between initiatives**.

---

## Acceptance Criteria

### AC1: Dependencies Dashboard Route
**Given** I navigate to `/dashboard/pm/dependencies`  
**When** the page loads  
**Then** I see a dependencies dashboard listing task relations

### AC2: Cross-Project Focus
**Given** dependencies are listed  
**When** I toggle cross-project only  
**Then** I only see dependencies where source and target tasks belong to different projects

### AC3: Filters
**Given** I want to focus on specific dependencies  
**When** I filter by project or relation type  
**Then** the dependency list updates accordingly

### AC4: Drill-Down Links
**Given** I see a dependency  
**When** I select a source or target task  
**Then** I can navigate to the corresponding project’s task list

---

## Technical Approach

- Add a PM dependencies endpoint that aggregates task relations with project metadata.
- Build a dashboard page with filters and a cross-project toggle.
- Render dependency rows with deep links to project task views.

---

## Implementation Tasks

### Frontend
- [x] Create dependencies dashboard page and layout.
- [x] Add filters for project and relation type, plus cross-project toggle.
- [x] Render dependency list with links to project task views.

### Backend
- [x] Add dependencies endpoint returning task relation + project metadata.

---

## Files to Create/Modify

### Frontend
- `apps/web/src/app/(dashboard)/dashboard/pm/dependencies/page.tsx`
- `apps/web/src/components/pm/dependencies/DependenciesDashboard.tsx`
- `apps/web/src/components/pm/dependencies/DependenciesFilters.tsx`
- `apps/web/src/hooks/use-pm-dependencies.ts`

### Backend
- `apps/api/src/pm/dependencies/dependencies.controller.ts`
- `apps/api/src/pm/dependencies/dependencies.service.ts`
- `apps/api/src/pm/dependencies/dependencies.module.ts`
- `apps/api/src/pm/dependencies/dto/dependencies-query.dto.ts`
- `apps/api/src/pm/pm.module.ts`

---

## Testing Requirements

- Dependencies list renders with source/target project context.
- Filters apply to project and relation type.
- Cross-project toggle hides same-project dependencies.

---

## Dependencies

- PM-02.8 (Task Relations)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added a dependencies API to return task relations with project metadata and cross-project filtering.
- Built a dashboard with filters for project, relation type, and cross-project-only toggling.
- Wired dependency rows with deep links to project task views.

## Files Updated

- `apps/web/src/app/(dashboard)/dashboard/pm/dependencies/page.tsx`
- `apps/web/src/components/pm/dependencies/DependenciesDashboard.tsx`
- `apps/web/src/components/pm/dependencies/DependenciesFilters.tsx`
- `apps/web/src/hooks/use-pm-dependencies.ts`
- `apps/api/src/pm/dependencies/dependencies.controller.ts`
- `apps/api/src/pm/dependencies/dependencies.service.ts`
- `apps/api/src/pm/dependencies/dependencies.module.ts`
- `apps/api/src/pm/dependencies/dto/dependencies-query.dto.ts`
- `apps/api/src/pm/pm.module.ts`

---

## Senior Developer Review

**Outcome:** APPROVE

- Dependencies endpoint is scoped and avoids impacting existing task APIs.
- Dashboard filters cover project, relation type, and cross-project focus with clear drill-downs.
- No blocking issues found. Tests not run in this step.
