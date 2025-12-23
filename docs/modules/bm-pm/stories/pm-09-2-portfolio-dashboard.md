# Story PM-09.2: Executive Portfolio Dashboard

**Epic:** PM-09 - Advanced Views
**Status:** done
**Points:** 8

---

## User Story

As a **workspace admin**,
I want **a cross-project portfolio dashboard**,
So that **I can see health and performance across all projects in one place**.

---

## Acceptance Criteria

### AC1: Portfolio Dashboard Route
**Given** I navigate to `/dashboard/pm/portfolio`  
**When** the page loads  
**Then** I see a portfolio dashboard with aggregate metrics across projects

### AC2: Project Health Overview
**Given** the dashboard is visible  
**When** project data loads  
**Then** each project shows health score, status, and key metrics at a glance

### AC3: Filters and Date Range
**Given** I want to focus on specific projects  
**When** I apply filters (status, team, date range)  
**Then** the portfolio metrics and project list update accordingly

### AC4: Drill-Down Navigation
**Given** I review a project on the dashboard  
**When** I select a project card  
**Then** I can navigate to that project’s detail view

---

## Technical Approach

- Build a dedicated portfolio dashboard page under the PM dashboard.
- Aggregate project-level metrics using existing PM project endpoints.
- Add client-side filters for status, team, and date range.
- Provide quick navigation to each project detail view.

---

## Implementation Tasks

### Frontend
- [x] Create portfolio dashboard page and layout.
- [x] Render project cards with health + metric summaries.
- [x] Add filter controls (status, team, date range).
- [x] Wire drill-down navigation into project detail pages.

### Backend
- [x] Add portfolio aggregate endpoint if current data is insufficient.

---

## Files to Create/Modify

### Frontend
- `apps/web/src/app/(dashboard)/dashboard/pm/portfolio/page.tsx`
- `apps/web/src/components/pm/portfolio/PortfolioDashboard.tsx`
- `apps/web/src/components/pm/portfolio/PortfolioFilters.tsx`
- `apps/web/src/hooks/use-pm-portfolio.ts`

### Backend
- `apps/api/src/pm/portfolio/portfolio.controller.ts`
- `apps/api/src/pm/portfolio/portfolio.service.ts`

---

## Testing Requirements

- Portfolio dashboard renders with project summaries.
- Filters update the project list and metrics.
- Project card click navigates to project detail.

---

## Dependencies

- PM-05.6 (Herald report generation)

---

## References

- [Epic Definition](../epics/epic-pm-09-advanced-views.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added a portfolio dashboard route with summary metrics, filters, and project drill-down cards.
- Implemented a PM portfolio API to deliver health scores, team lead metadata, and aggregates.
- Wired filters for status, team lead, search, and target date ranges.

## Files Updated

- `apps/web/src/app/(dashboard)/dashboard/pm/portfolio/page.tsx`
- `apps/web/src/components/pm/portfolio/PortfolioDashboard.tsx`
- `apps/web/src/components/pm/portfolio/PortfolioFilters.tsx`
- `apps/web/src/hooks/use-pm-portfolio.ts`
- `apps/api/src/pm/portfolio/portfolio.controller.ts`
- `apps/api/src/pm/portfolio/portfolio.service.ts`
- `apps/api/src/pm/portfolio/portfolio.module.ts`
- `apps/api/src/pm/portfolio/dto/portfolio-query.dto.ts`
- `apps/api/src/pm/pm.module.ts`

---

## Senior Developer Review

**Outcome:** APPROVE

- Portfolio API provides aggregated metrics and filter support without touching existing project list endpoints.
- UI uses consistent PM styling and offers clear drill-down paths to project detail.
- No blocking issues found. Tests not run in this step.
