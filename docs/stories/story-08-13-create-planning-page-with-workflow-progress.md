# Story 08.13: Create Planning Page with Workflow Progress

**Story ID:** 08.13
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.12

---

## User Story

**As a** user
**I want** a planning page to track my business planning progress
**So that** I can complete all planning workflows

---

## Description

This story creates the Planning Page where users interact with Blake (Planning Team Lead) and specialist agents to develop their business plan. The page shows workflow progress, chat interface, and completed artifacts.

---

## Acceptance Criteria

### Page Structure
- [x] Create `/dashboard/[businessId]/planning` page
- [x] Display workflow progress for BMP workflows
- [x] Show chat interface with Blake (team leader)
- [x] Display completed artifacts (canvas, projections, etc.)

### Workflow Progress
- [x] Show progress bar and step indicators
- [x] Indicate current workflow step
- [x] Show dependencies between workflows
- [x] Indicate which workflows require validation data

### Chat Interface
- [x] Chat with Blake (Planning Orchestrator)
- [x] Show agent delegation to specialist agents
- [x] Display suggested actions
- [x] Auto-scroll to latest messages

### Artifacts Display
- [x] Show Business Model Canvas preview
- [x] Display financial projections summary
- [x] Add download links for generated documents

---

## Technical Implementation Details

### Workflow Dependencies

```
business-model-canvas ───┐
                         ├──→ business-plan ──→ pitch-deck
financial-projections ───┤
pricing-strategy ────────┤
growth-forecast ─────────┘
```

### Agent Configuration

| Agent | Name | Role |
|-------|------|------|
| Leader | Blake | Planning Orchestrator |
| Member | Model | Business Model Canvas Expert |
| Member | Finance | Financial Analyst |
| Member | Revenue | Monetization Strategist |
| Member | Forecast | Growth Forecaster |

---

## Definition of Done

- [x] Planning page created at correct route
- [x] Workflow progress displayed
- [x] Chat interface functional
- [x] Agent avatars and names displayed
- [x] Mock responses working
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
