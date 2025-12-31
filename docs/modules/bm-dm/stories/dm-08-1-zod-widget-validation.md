# Story DM-08-1: Add Zod Schema Validation for Widget Data

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** High

---

## Problem Statement

Widget data payloads from A2A responses are not validated before rendering, risking runtime errors from malformed data. Components may crash when receiving unexpected data shapes.

## Root Cause

From DM-03 Retrospective:
- A2A responses are trusted without validation
- Widget components may crash on unexpected data shapes
- No validation layer between data fetch and render

## Implementation Plan

### 1. Create Widget Zod Schemas

Create `apps/web/src/lib/schemas/widget-schemas.ts`:
- Base widget data schema with common fields
- Widget-specific schemas for each type (TaskCard, Metrics, Alert, Activity, Progress, Text)
- Schema registry mapping widget types to their schemas

### 2. Create Validation Utility

Create `apps/web/src/lib/utils/validate-widget.ts`:
- `validateWidgetData<T>(type, data)` function
- Returns success/error result with typed data
- Logs validation failures for debugging

### 3. Integrate with Widget Renderer

Modify widget rendering pipeline to:
- Call validation before render
- Show ErrorWidget for invalid data instead of crashing
- Include validation error details in fallback UI

## Acceptance Criteria

- [x] AC1: Zod schemas defined for all widget types (ProjectStatus, TaskList, Metrics, Alert, TeamActivity)
- [x] AC2: Validation runs before widget render
- [x] AC3: Invalid data shows fallback UI, not crash
- [x] AC4: Validation errors logged with widget type and data shape
- [x] AC5: Unit tests for all widget schemas (25 tests passing)

## Technical Notes

### Schema Pattern
```typescript
import { z } from 'zod';

export const TaskCardDataSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee: z.string().optional(),
});
```

### Validation Pattern
```typescript
export function validateWidgetData<T>(
  type: string,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const schema = WIDGET_SCHEMAS[type];
  if (!schema) return { success: true, data: data as T };
  return schema.safeParse(data);
}
```

## Files to Create/Modify

```text
apps/web/src/
├── lib/schemas/
│   └── widget-schemas.ts       # NEW
├── lib/utils/
│   └── validate-widget.ts      # NEW
└── components/widgets/
    └── WidgetRenderer.tsx      # MODIFY
```

## Test Plan

1. Unit tests for each schema with valid/invalid data
2. Test validation utility error handling
3. Integration test for widget rendering with invalid data

---

## Implementation Notes

### Files Created

1. **`apps/web/src/lib/schemas/widget-schemas.ts`** - Zod schemas for all widget types:
   - `BaseWidgetDataSchema` - Common id/title fields
   - `ProjectStatusDataSchema` - Project progress with status enum
   - `TaskListDataSchema` - Task list with status/priority enums
   - `MetricsDataSchema` - Metrics with change indicators
   - `AlertDataSchema` - Alerts with severity enum
   - `TeamActivityDataSchema` - Activity feed items
   - `WIDGET_SCHEMAS` registry mapping types to schemas

2. **`apps/web/src/lib/utils/validate-widget.ts`** - Validation utility:
   - `validateWidgetData<T>()` - Returns success/error result
   - `formatValidationError()` - Formats errors for logging
   - `logValidationFailure()` - Dev/prod appropriate logging
   - `validateAndLogWidgetData()` - Convenience combined function

3. **`apps/web/src/lib/schemas/__tests__/widget-schemas.test.ts`** - Unit tests:
   - 25 tests covering valid/invalid data for each schema
   - Tests for edge cases (empty arrays, optional fields)
   - Tests for enum validation (invalid values rejected)

### Files Modified

1. **`apps/web/src/components/slots/DashboardSlots.tsx`**:
   - Added `validateAndLogWidgetData()` call before widget render
   - Shows `ErrorWidget` with validation error details for invalid data
   - Proper type casting after validation ensures type safety

### Design Decisions

- Schemas allow unknown widget types through for forward compatibility
- Validation errors show user-friendly messages in ErrorWidget
- Development vs production logging differs (full data vs data keys only)

---

## Review Notes

(To be filled during code review)
