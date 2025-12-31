# Story DM-08-5: Widget Type Deduplication

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

Widget type definitions are duplicated between TypeScript (frontend) and Python (agents), leading to potential drift and inconsistencies.

## Root Cause

From tech debt analysis:
- Widget types defined separately in `apps/web/src/components/slots/types.ts`
- Widget types also defined in `agents/gateway/tools.py`
- No validation that these stay in sync

## Implementation Plan

### 1. Create Single Source of Truth

Create `packages/shared/src/types/widget.ts` with canonical widget type definitions.

### 2. Sync to Python

Create `packages/shared/widget-types.json` for Python to read at runtime.

### 3. Add Validation Script

Create `scripts/validate-widget-types.ts` for build-time validation.

## Acceptance Criteria

- [x] AC1: Widget types defined in @hyvve/shared package
- [x] AC2: Frontend imports from shared package
- [x] AC3: Python loads from shared JSON file
- [x] AC4: Validation script created
- [x] AC5: Placeholder widgets for unimplemented types

---

## Implementation Notes

### Files Created/Modified

**Shared Package (Source of Truth):**
- `packages/shared/src/types/widget.ts` - Canonical TypeScript definitions
- `packages/shared/widget-types.json` - JSON for Python sync
- `packages/shared/src/index.ts` - Export widget types

**Frontend Updates:**
- `apps/web/src/components/slots/types.ts` - Re-exports from shared
- `apps/web/src/components/slots/widgets/PlaceholderWidget.tsx` - Placeholder for future widgets
- `apps/web/src/components/slots/widgets/index.ts` - Export placeholders
- `apps/web/src/components/slots/widget-registry.tsx` - Register all 8 widget types

**Python Updates:**
- `agents/gateway/tools.py` - Load WIDGET_TYPES from shared JSON

**Validation:**
- `scripts/validate-widget-types.ts` - Build-time sync validation

### Widget Types (8 total)

| Type | Component | Status |
|------|-----------|--------|
| ProjectStatus | ProjectStatusWidget | Implemented |
| TaskList | TaskListWidget | Implemented |
| Metrics | MetricsWidget | Implemented |
| Alert | AlertWidget | Implemented |
| TeamActivity | TeamActivityWidget | Implemented |
| KanbanBoard | KanbanBoardWidget | Placeholder |
| GanttChart | GanttChartWidget | Placeholder |
| BurndownChart | BurndownChartWidget | Placeholder |

### Type Hierarchy

```
BaseWidgetData (shared)
├── ProjectStatusData
├── TaskListData
├── MetricsData
├── AlertData
├── TeamActivityData
├── KanbanBoardData
├── GanttChartData
└── BurndownChartData
```

---

## Review Notes

(To be filled during code review)
