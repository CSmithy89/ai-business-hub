# Core-PM Wireframe Gap Analysis

**Analysis Date:** 2025-12-16
**Status:** ALL GAPS RESOLVED

**UX alignment note (Phase 1–3):** This document tracks PRD → wireframe prompt coverage. For UX pack alignment (routes, hierarchy, approvals overlay, BMAD sub-state display), see `docs/design/wireframes/CORE-PM-UX-WIREFRAME-ALIGNMENT.md`.

---

## Executive Summary

Deep audit of PRD v2.0 against wireframe prompts revealed:
- **Numbering Conflict:** PM-17 to PM-20 used by both old and new wireframes ✓ Fixed
- **Missing P1 Features:** 2 critical wireframes not covered ✓ Created (BATCH-16)
- **Missing P2 Features:** 5 wireframes for Phase 2 features ✓ Created (BATCH-17)
- **Missing P3 Features:** 10 wireframes for Phase 3/Vision ✓ Created (BATCH-18, BATCH-19)
- **Total New Wireframes Created:** 17 additional wireframes

---

## Issue 1: Numbering Conflict

### Problem
BATCH-09 (original PM module) defines:
- PM-17: Global Search
- PM-18: User Profile & Account
- PM-19: Onboarding Flow
- PM-20: Help & Support Center

BATCH-14 (new Core-PM) reuses the same IDs for:
- PM-17: BMAD Phase View
- PM-18: Agent Team Panel
- PM-19: Hybrid Assignment
- PM-20: Planning Poker

### Resolution
Renumber Core-PM features to PM-21 through PM-24:

| Old ID | New ID | Wireframe |
|--------|--------|-----------|
| PM-17 | **PM-21** | BMAD Phase View |
| PM-18 | **PM-22** | Agent Team Panel |
| PM-19 | **PM-23** | Hybrid Assignment |
| PM-20 | **PM-24** | Planning Poker |

---

## Issue 2: Missing P1 Features

### PM-25: Visual Dependency Editor ❌ MISSING

**PRD Reference:** Section 5 (P1), lines 242-245
```
5. **Visual Dependency Editor** *(Competitor-inspired: Monday, Wrike, OpenProject)*
   - Drag-drop dependency creation on Gantt/Timeline
   - Dependency type selector (FS, SS, FF, SF)
   - Conflict warnings and cycle detection
```

**Required Wireframe:**
- Full-screen dependency management view
- Drag-drop dependency lines between tasks
- Dependency type picker (Finish-to-Start, Start-to-Start, etc.)
- Critical path highlighting
- Conflict/cycle warnings
- Integration with PM-06 Timeline/Gantt

### PM-26: Saved Views Manager ❌ MISSING

**PRD Reference:** FR-4.5, line 1355-1359
```
**FR-4.5: Saved Views**
- Save filter/sort combinations
- Public/private views
- View sharing
- Default views per role
```

**Required Wireframe:**
- Save view modal
- Saved views dropdown/panel
- Public/private toggle
- Share view dialog
- Set as default option

---

## Issue 3: Missing P2/Phase 2 Features

### PM-27: Executive Portfolio Dashboard ❌ MISSING

**PRD Reference:** FR-4.6, lines 1361-1366; Phase 2, line 285
```
**FR-4.6: Executive Portfolio Dashboard (Phase 2)**
- Cross-product health summary
- Aggregate metrics
- Resource utilization
- Risk overview
```

**Required Wireframe:**
- Multi-product overview grid
- Aggregate health scores
- Resource utilization heatmap
- Cross-product risk indicators
- Drill-down to product detail

### PM-28: Daily Briefing (Navi) ❌ MISSING

**PRD Reference:** FR-5.3, lines 1381-1385
```
**FR-5.3: Daily Briefing**
- Navi's morning summary (configurable time)
- Opt-in/out per user
- Expandable sections
- One-click actions
```

**Required Wireframe:**
- Morning briefing modal/panel
- Sections: Due today, blockers, agent suggestions
- Expandable/collapsible sections
- Quick action buttons
- Snooze/dismiss controls

### PM-29: GitHub/GitLab Integration Panel ❌ MISSING

**PRD Reference:** Phase 2, lines 298-306; FR-8.3
```
**GitHub/GitLab Deep Integration** *(Competitor-inspired: Linear - best-in-class)*
- Development panel: See all commits, PRs, branches on task
- Repository configuration
- Auto-linking and status sync
```

**Required Wireframe:**
- Task detail "Development" tab/panel
- Commits list with messages
- PRs list with status
- Branches list
- Repository connection settings

### PM-30: CSV Import Wizard ❌ MISSING

**PRD Reference:** FR-8.1, lines 1456-1460
```
**FR-8.1: CSV Import/Export**
- Column mapping wizard
- Template download
- Batch import with validation
- Export with field selection
```

**Required Wireframe:**
- Multi-step import wizard
- File upload step
- Column mapping interface
- Preview with validation errors
- Import progress/results

### PM-31: Sprint Enhancements Dashboard ❌ MISSING

**PRD Reference:** Phase 2, lines 318-321
```
6. **Sprint Enhancements** *(Competitor-inspired: Linear, Taiga)*
   - Sprint cooldown period (configurable break between sprints)
   - Doom-line projection (visual deadline risk based on velocity)
   - Baseline comparison snapshots (planned vs actual)
```

**Required Wireframe:**
- Sprint settings with cooldown config
- Doom-line visualization on burndown
- Baseline vs actual comparison chart
- Sprint velocity trend

---

## Issue 4: Missing P3/Phase 3 Features

### PM Phase 3 (Vision) - 6 Wireframes

| ID | Name | PRD Reference |
|----|------|---------------|
| **PM-32** | Workflow Builder | Phase 3, lines 353-360 |
| **PM-33** | Predictive Analytics (Prism) | Phase 3, lines 362-368 |
| **PM-34** | API & Webhooks Configuration | Phase 3, lines 370-374 |
| **PM-35** | Task Templates Library | Phase 3, lines 376-379 |
| **PM-36** | OKR & Goals Tracking | Phase 3, lines 376-381 |
| **PM-37** | Enterprise Audit & Compliance | Phase 3, lines 383-386 |

### KB Phase 3 (Vision) - 4 Wireframes

| ID | Name | PRD Reference |
|----|------|---------------|
| **KB-13** | AI Q&A Chat Interface | Phase 3, lines 390-395 |
| **KB-14** | KB Analytics Dashboard | Phase 3, lines 397-401, 407 |
| **KB-15** | KB Governance & Permissions | Phase 3, lines 403-407 |
| **KB-16** | External KB Sync Settings | Phase 3, lines 409-413 |

---

## Summary: All Missing Wireframes

| Priority | ID | Name | PRD Reference |
|----------|-----|------|---------------|
| **P1** | PM-25 | Visual Dependency Editor | Section 5, lines 242-245 |
| **P1** | PM-26 | Saved Views Manager | FR-4.5, lines 1355-1359 |
| **P2** | PM-27 | Executive Portfolio Dashboard | FR-4.6, Phase 2 |
| **P2** | PM-28 | Daily Briefing (Navi) | FR-5.3, lines 1381-1385 |
| **P2** | PM-29 | GitHub/GitLab Integration | Phase 2, FR-8.3 |
| **P2** | PM-30 | CSV Import Wizard | FR-8.1, lines 1456-1460 |
| **P2** | PM-31 | Sprint Enhancements | Phase 2, lines 318-321 |
| **P3** | PM-32 | Workflow Builder | Phase 3, lines 353-360 |
| **P3** | PM-33 | Predictive Analytics (Prism) | Phase 3, lines 362-368 |
| **P3** | PM-34 | API & Webhooks Configuration | Phase 3, lines 370-374 |
| **P3** | PM-35 | Task Templates Library | Phase 3, lines 376-379 |
| **P3** | PM-36 | OKR & Goals Tracking | Phase 3, lines 376-381 |
| **P3** | PM-37 | Enterprise Audit & Compliance | Phase 3, lines 383-386 |
| **P3** | KB-13 | AI Q&A Chat Interface | Phase 3, lines 390-395 |
| **P3** | KB-14 | KB Analytics Dashboard | Phase 3, lines 397-407 |
| **P3** | KB-15 | KB Governance & Permissions | Phase 3, lines 403-407 |
| **P3** | KB-16 | External KB Sync Settings | Phase 3, lines 409-413 |

---

## Required Actions

### 1. Fix Numbering (High Priority) - COMPLETED
- [x] Update CORE-PM-WIREFRAME-AUDIT.md: PM-17→PM-21, PM-18→PM-22, PM-19→PM-23, PM-20→PM-24
- [x] Update BATCH-14-CORE-PM-UPDATES.md: Same renumbering

### 2. Create Missing P1 Prompts (High Priority) - COMPLETED
- [x] Create BATCH-16 for PM-25 (Visual Dependency Editor) and PM-26 (Saved Views)

### 3. Create Phase 2 Prompts (Medium Priority) - COMPLETED
- [x] Create BATCH-17 for PM-27 to PM-31 (Phase 2 features)

### 4. Create Phase 3 Prompts (Low Priority) - COMPLETED
- [x] Create BATCH-18 for PM-32 to PM-37 (Phase 3 PM features)
- [x] Create BATCH-19 for KB-13 to KB-16 (Phase 3 KB features)

---

## Updated Wireframe Count

| Category | Count |
|----------|-------|
| Existing PM (keep) | 11 |
| Existing PM (update) | 5 |
| New KB (created) | 12 |
| New PM - Core (renumber to PM-21-24) | 4 |
| New PM - P1 Missing | 2 |
| New PM - P2 Missing | 5 |
| New PM - P3 Vision | 6 |
| New KB - P3 Vision | 4 |
| Real-time Collaboration | 3 |
| **Total Core-PM Wireframes** | **52** |

---

## Batch Summary

| Batch | Contents | Status |
|-------|----------|--------|
| BATCH-12 | KB-01 to KB-06 (Core KB) | Complete |
| BATCH-13 | KB-07 to KB-12 (KB Enhancements) | Complete |
| BATCH-14 | PM-21 to PM-24 (Core-PM Updates) | Complete |
| BATCH-15 | RT-01 to RT-03 (Real-time) | Complete |
| BATCH-16 | PM-25 to PM-26 (P1 Missing) | Complete |
| BATCH-17 | PM-27 to PM-31 (Phase 2) | Complete |
| BATCH-18 | PM-32 to PM-37 (Phase 3 PM) | Complete |
| BATCH-19 | KB-13 to KB-16 (Phase 3 KB) | Complete |

---

_Gap analysis complete. All wireframe prompts created._
