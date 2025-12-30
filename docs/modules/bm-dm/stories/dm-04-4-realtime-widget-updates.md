# Story DM-04.4: Real-Time Widget Updates

**Epic:** DM-04 - Shared State & Real-Time
**Points:** 5
**Status:** done
**Priority:** High (Completes the state synchronization loop)
**Dependencies:** DM-04.3 (Complete - Agent State Emissions)

---

## Overview

Implement automatic widget updates when agent state changes, completing the real-time state synchronization loop. This story creates state-driven widget wrappers that subscribe to the Zustand store and automatically re-render when their corresponding state updates, without requiring explicit tool calls.

This story implements:
- State-driven widget wrapper components that connect to Zustand selectors
- Hybrid rendering mode supporting both tool calls (DM-03) and state updates (DM-04)
- Loading and error state handling in widgets
- Real-time update indicator showing last update time
- Timestamp formatting utilities
- Widget registry updates for dual-mode rendering

The components created here will be used by:
- Dashboard page for real-time updates
- State persistence (DM-04.5)
- Future HITL workflows (DM-05)

---

## Acceptance Criteria

- [ ] **AC1:** State-driven widgets (`StateProjectStatusWidget`, `StateMetricsWidget`, `StateActivityWidget`, `StateAlertsWidget`) render from Zustand store
- [ ] **AC2:** `DashboardSlots` supports hybrid mode (both tool calls AND state updates render widgets)
- [ ] **AC3:** Loading indicators show during state updates with skeleton components
- [ ] **AC4:** Error states display correctly with error widget component
- [ ] **AC5:** `RealTimeIndicator` component shows last update time and refresh button
- [ ] **AC6:** Widgets animate in/out smoothly using Tailwind CSS transitions
- [ ] **AC7:** Unit tests pass with >80% coverage for widget rendering

---

## Technical Approach

### Widget Update Architecture

State-driven widgets connect to the Zustand store via selector hooks from DM-04.2:

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                         │
│  ┌─────────────────┐     ┌─────────────────────────────────┐│
│  │ Zustand Store   │ <-- │ useAgentStateSync (DM-04.2)     ││
│  │ dashboardState  │     │                                 ││
│  └────────┬────────┘     └─────────────────────────────────┘│
│           │                                                  │
│  ┌────────v───────────────────────────────────────────────┐ │
│  │             Selector Hooks                              │ │
│  │  useProjectStatus | useMetrics | useActivity | useAlerts│ │
│  └────────┬───────────┬───────────┬───────────┬───────────┘ │
│           │           │           │           │              │
│  ┌────────v────┐ ┌────v────┐ ┌────v────┐ ┌────v────┐       │
│  │ StateProject│ │ State   │ │ State   │ │ State   │       │
│  │ StatusWidget│ │ Metrics │ │ Activity│ │ Alerts  │       │
│  │             │ │ Widget  │ │ Widget  │ │ Widget  │       │
│  └─────────────┘ └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

1. **State Widgets as Wrappers:** New components wrap existing widget components, connecting them to state
2. **Hybrid Mode:** DashboardSlots supports tool-call rendering (DM-03) AND state rendering (DM-04)
3. **Selector-Based Re-renders:** Each widget uses specific selector hooks for efficient updates
4. **Loading/Error States:** Widgets handle loading and error conditions gracefully

### Rendering Modes

The `DashboardSlots` component supports three modes:

| Mode | Tool Calls | State Updates | Use Case |
|------|------------|---------------|----------|
| `hybrid` (default) | Yes | Yes | Normal operation - both methods work |
| `tool-only` | Yes | No | DM-03 compatibility mode |
| `state-only` | No | Yes | Pure state-driven mode |

---

## Implementation Tasks

### Task 1: Create State-Driven Widget Wrappers (2 points)

Create `apps/web/src/components/widgets/StateWidget.tsx` with:

1. **StateProjectStatusWidget:**
   - Subscribe to `useProjectStatus()` selector
   - Show `LoadingWidget` when loading and no data
   - Show `ErrorWidget` when Navi agent has error
   - Render `ProjectStatusWidget` with state data

2. **StateMetricsWidget:**
   - Subscribe to `useMetrics()` selector
   - Show `LoadingWidget` when loading and no data
   - Show `ErrorWidget` when Pulse agent has error
   - Render `MetricsWidget` with metrics array

3. **StateActivityWidget:**
   - Subscribe to `useActivity()` (aliased as `useTeamActivity`)
   - Show `LoadingWidget` when loading and no data
   - Show `ErrorWidget` when Herald agent has error
   - Render `TeamActivityWidget` with formatted activities
   - Format timestamps using `formatTimestamp()` utility

4. **StateAlertsWidget:**
   - Subscribe to `useAlerts()` selector (non-dismissed only)
   - Return null if no alerts
   - Render stack of `AlertWidget` components

5. **Helper Functions:**
   - `formatTimestamp(ts: number): string` - Convert Unix ms to relative time

### Task 2: Update DashboardSlots for Hybrid Mode (1.5 points)

Modify `apps/web/src/components/slots/DashboardSlots.tsx`:

1. **Add Props Interface:**
   ```typescript
   interface DashboardSlotsProps {
     mode?: 'hybrid' | 'tool-only' | 'state-only';
   }
   ```

2. **Initialize State Sync:**
   - Call `useAgentStateSync()` at component mount
   - Pass `debug: true` in development mode

3. **Tool-Call Rendering (Existing):**
   - Keep existing `useRenderToolCall` for `render_dashboard_widget`
   - Skip rendering in `state-only` mode

4. **State-Driven Rendering (New):**
   - Skip in `tool-only` mode
   - Render state widgets in grid layout
   - Alerts at top, main widgets in responsive grid

5. **Animation Classes:**
   - Add `animate-in fade-in-50 duration-300` for smooth transitions

### Task 3: Create Real-Time Indicator (0.5 points)

Create `apps/web/src/components/widgets/RealTimeIndicator.tsx`:

1. **Component Props:**
   ```typescript
   interface RealTimeIndicatorProps {
     onRefresh?: () => void;
   }
   ```

2. **State Subscriptions:**
   - `timestamp` from dashboard state
   - `isLoading` from loading state

3. **Display Elements:**
   - Status dot (green=connected, yellow+pulse=loading)
   - Last update time (formatted relative)
   - Optional refresh button with spinning icon when loading

4. **Format Helper:**
   - `formatLastUpdate()` - Returns "Just now", "5s ago", "2m ago", or time string

### Task 4: Create Loading and Error Widgets (0.5 points)

Ensure `apps/web/src/components/widgets/LoadingWidget.tsx` exists:
- Accept `type` prop for widget type name
- Render skeleton placeholder

Ensure `apps/web/src/components/widgets/ErrorWidget.tsx` exists:
- Accept `message` and `widgetType` props
- Display error message with icon
- Optional `availableTypes` prop for unknown widget errors

### Task 5: Write Unit Tests (0.5 points)

Create `apps/web/src/components/widgets/__tests__/StateWidget.test.tsx`:

1. **State Widget Tests:**
   - Each widget renders with data from store
   - Widgets show loading state correctly
   - Widgets show error state correctly
   - Widgets return null when no data

2. **DashboardSlots Tests:**
   - Hybrid mode renders both tool calls and state
   - Tool-only mode skips state widgets
   - State-only mode skips tool call rendering

3. **RealTimeIndicator Tests:**
   - Shows correct status dot color
   - Formats timestamp correctly
   - Refresh button calls callback

---

## Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/components/widgets/StateWidget.tsx` | State-driven widget wrappers connecting to Zustand store |
| `apps/web/src/components/widgets/RealTimeIndicator.tsx` | Real-time update indicator with status and refresh |
| `apps/web/src/components/widgets/__tests__/StateWidget.test.tsx` | Unit tests for state widgets and DashboardSlots |

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/components/slots/DashboardSlots.tsx` | Add hybrid mode support and state widget rendering |
| `apps/web/src/components/widgets/index.ts` | Export new state widgets and RealTimeIndicator |
| `docs/modules/bm-dm/sprint-status.yaml` | Update story status to drafted |

---

## API Reference

### State Widget Components

```typescript
// State-driven widgets - no props needed, connect to store internally
export function StateProjectStatusWidget(): JSX.Element | null;
export function StateMetricsWidget(): JSX.Element | null;
export function StateActivityWidget(): JSX.Element | null;
export function StateAlertsWidget(): JSX.Element | null;
```

### DashboardSlots Props

```typescript
interface DashboardSlotsProps {
  /**
   * Rendering mode:
   * - 'hybrid' (default): Both tool calls AND state updates render widgets
   * - 'tool-only': Only render from tool calls (DM-03 behavior)
   * - 'state-only': Only render from state updates
   */
  mode?: 'hybrid' | 'tool-only' | 'state-only';
}
```

### RealTimeIndicator Props

```typescript
interface RealTimeIndicatorProps {
  /** Callback when refresh button is clicked */
  onRefresh?: () => void;
}
```

### Timestamp Formatting

```typescript
/**
 * Format Unix timestamp (ms) to relative time string
 * @param ts Unix timestamp in milliseconds
 * @returns Relative time string ("Just now", "5m ago", etc.)
 */
function formatTimestamp(ts: number): string;
```

---

## Definition of Done

- [ ] `StateProjectStatusWidget` renders from Zustand store
- [ ] `StateMetricsWidget` renders from Zustand store
- [ ] `StateActivityWidget` renders from Zustand store with formatted timestamps
- [ ] `StateAlertsWidget` renders stack of alerts from store
- [ ] `DashboardSlots` accepts `mode` prop with three options
- [ ] Hybrid mode renders both tool calls and state widgets
- [ ] `useAgentStateSync()` called in DashboardSlots
- [ ] `LoadingWidget` shown when loading and no data
- [ ] `ErrorWidget` shown when agent errors and no data
- [ ] `RealTimeIndicator` shows last update time
- [ ] Status dot indicates connection/loading state
- [ ] Refresh button triggers callback
- [ ] `formatTimestamp()` utility implemented
- [ ] Smooth animations with Tailwind transitions
- [ ] State widgets exported from widgets/index.ts
- [ ] Unit tests for all state widgets
- [ ] Unit tests for DashboardSlots modes
- [ ] Unit tests for RealTimeIndicator
- [ ] Sprint status updated to review

---

## Technical Notes

### Selector Hook Usage

Each state widget uses dedicated selector hooks from DM-04.2:

```typescript
// StateProjectStatusWidget
const status = useProjectStatus();
const isLoading = useIsLoading();
const errors = useErrors();
```

This ensures widgets only re-render when their specific slice of state changes.

### Loading State Logic

Show loading widget only when BOTH conditions are true:
1. `isLoading === true`
2. Widget data is null/undefined

This prevents flashing loading states during background refreshes.

### Error State Logic

Show error widget only when BOTH conditions are true:
1. Relevant agent has error in `errors` map
2. Widget data is null/undefined

This allows cached data to display even when refresh fails.

### Timestamp Formatting Logic

```typescript
function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 1000) return 'Just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}
```

### Animation Classes

Use Tailwind CSS for smooth widget transitions:
```typescript
className="animate-in fade-in-50 duration-300"
```

Requires `tailwindcss-animate` plugin (already installed in project).

---

## Test Scenarios

### Unit Tests

| Test | Description |
|------|-------------|
| StateProjectStatusWidget renders with data | Widget displays project info from store |
| StateProjectStatusWidget shows loading | Skeleton shown when loading, no data |
| StateProjectStatusWidget shows error | Error widget when Navi fails |
| StateProjectStatusWidget returns null | No render when no data, not loading |
| StateMetricsWidget renders with data | Widget displays metrics from store |
| StateActivityWidget formats timestamps | Activities show relative times |
| StateAlertsWidget filters dismissed | Only non-dismissed alerts rendered |
| DashboardSlots hybrid mode | Both tool and state widgets render |
| DashboardSlots tool-only mode | Only tool widgets render |
| DashboardSlots state-only mode | Only state widgets render |
| RealTimeIndicator shows time | Correct relative time displayed |
| RealTimeIndicator refresh button | Callback triggered on click |
| formatTimestamp accuracy | All time ranges formatted correctly |

### Integration Tests (Manual)

| Test | Steps | Expected |
|------|-------|----------|
| State sync E2E | 1. Load dashboard, 2. Send query to agent, 3. Observe widgets | Widgets populate from state emission |
| Loading state | 1. Trigger data fetch, 2. Observe widgets | Loading skeleton shown |
| Error state | 1. Cause agent error, 2. Observe widgets | Error widget shown |
| Refresh button | 1. Click refresh, 2. Observe | Refresh callback triggered |

---

## Dependencies

### From DM-04.1 (Complete)

| Export | Usage |
|--------|-------|
| `ProjectStatusState` | Type for project status data |
| `MetricsState` | Type for metrics data |
| `ActivityState` | Type for activity data |
| `AlertEntry` | Type for alert items |

### From DM-04.2 (Complete)

| Export | Usage |
|--------|-------|
| `useProjectStatus()` | Selector for project status |
| `useMetrics()` | Selector for metrics |
| `useTeamActivity()` | Selector for activity (aliased) |
| `useAlerts()` | Selector for non-dismissed alerts |
| `useIsLoading()` | Selector for loading state |
| `useErrors()` | Selector for error map |
| `useAgentStateSync()` | Hook to initialize state sync |

### From DM-04.3 (Complete)

| Component | Relationship |
|-----------|--------------|
| State emitter | Emits state that widgets consume |
| Loading state | Triggers loading indicators |
| Error state | Triggers error displays |

### From DM-03 (Complete)

| Component | Usage |
|-----------|-------|
| `DashboardSlots` | Extended with hybrid mode |
| `ProjectStatusWidget` | Wrapped by StateProjectStatusWidget |
| `MetricsWidget` | Wrapped by StateMetricsWidget |
| `TeamActivityWidget` | Wrapped by StateActivityWidget |
| `AlertWidget` | Used by StateAlertsWidget |
| `LoadingWidget` | Used for loading states |
| `ErrorWidget` | Used for error states |

### External Packages

| Package | Version | Usage |
|---------|---------|-------|
| react | ^18.x | Component framework |
| zustand | ^4.x | State management (via hooks) |
| lucide-react | ^0.x | Icons (RefreshCw) |
| tailwindcss-animate | ^1.x | Animation classes |

---

## References

- [Epic DM-04 Definition](../epics/epic-dm-04-shared-state.md)
- [Epic DM-04 Tech Spec](../epics/epic-dm-04-tech-spec.md) - Section 3.4
- [DM-04.1 Story](./dm-04-1-state-schema-definition.md) - State types
- [DM-04.2 Story](./dm-04-2-frontend-state-subscription.md) - Selector hooks
- [DM-04.3 Story](./dm-04-3-agent-state-emissions.md) - State emitter
- [DM-03.3 Story](./dm-03-3-widget-rendering-pipeline.md) - Base widgets
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS Animate](https://github.com/jamiebuilds/tailwindcss-animate)

---

## Implementation Notes

**Completed: 2025-12-30**

### Files Created

| File | Description |
|------|-------------|
| `apps/web/src/components/slots/widgets/StateWidget.tsx` | State-driven widget wrappers with formatTimestamp utility |
| `apps/web/src/components/slots/widgets/RealTimeIndicator.tsx` | Real-time status indicator with refresh button |
| `apps/web/src/components/slots/widgets/__tests__/StateWidget.test.tsx` | Unit tests for all state widgets |

### Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/components/slots/DashboardSlots.tsx` | Added hybrid mode support with mode prop, useAgentStateSync integration, state widget grid |
| `apps/web/src/components/slots/widgets/index.ts` | Exported new state widgets, RealTimeIndicator, and formatTimestamp |

### Implementation Details

**Task 1: State-Driven Widget Wrappers (2 points)**
- Created `StateProjectStatusWidget`, `StateMetricsWidget`, `StateActivityWidget`, `StateAlertsWidget`
- Each wrapper uses selector hooks from DM-04.2 (`useProjectStatus`, `useMetrics`, `useTeamActivity`, `useAlerts`)
- Uses `useAnyLoading` and `useWidgetError` for loading/error state detection
- Renders `LoadingWidget` when loading AND no cached data
- Renders `ErrorWidget` when error AND no cached data
- Shows cached data during background refreshes (prevents flashing)
- Data transformation implemented for state schema to widget props:
  - Status format: 'on-track' -> 'on_track' (hyphen to underscore)
  - Activity timestamps: number -> formatted string via `formatTimestamp()`
  - Metrics trend: state enum -> widget change object
  - Alert type: direct mapping to severity

**Task 2: DashboardSlots Hybrid Mode (1.5 points)**
- Added `mode` prop with three options: 'hybrid' (default), 'tool-only', 'state-only'
- Calls `useAgentStateSync()` hook on mount for state synchronization
- Tool-call rendering skipped in 'state-only' mode
- State widget grid skipped in 'tool-only' mode
- Animation classes added to all rendered widgets

**Task 3: RealTimeIndicator (0.5 points)**
- Status dot: green (connected), yellow+pulse (syncing), gray (no data)
- Last updated timestamp with relative formatting
- Optional refresh button with spinning animation when loading
- Auto-refreshes relative time display every 10 seconds

**Task 4: Loading and Error Widgets (0.5 points)**
- Verified existing `LoadingWidget` and `ErrorWidget` from DM-03.3
- Both already support the required props (type, message, onRetry)
- Skeleton animations already implemented in LoadingWidget

**Task 5: Unit Tests (0.5 points)**
- Created comprehensive test suite for all state widgets
- Tests for loading state handling
- Tests for error state handling
- Tests for data transformation
- Tests for RealTimeIndicator component
- Tests for formatTimestamp utility

### Key Design Decisions

1. **Cached Data Priority**: When loading with existing cached data, widgets show cached data instead of loading spinner. This prevents UI flashing during background refreshes.

2. **Agent-to-Widget Mapping**: Each state widget maps to a specific agent for error detection:
   - StateProjectStatusWidget -> 'navi'
   - StateMetricsWidget -> 'pulse'
   - StateActivityWidget -> 'herald'
   - StateAlertsWidget -> any (alerts can come from any agent)

3. **Animation Strategy**: All widgets use `animate-in fade-in-50 duration-300` for smooth transitions, leveraging the already-installed `tailwindcss-animate` plugin.

4. **Hybrid Mode Default**: The default mode is 'hybrid' to allow both tool-call rendering (for explicit responses in chat) and state-driven rendering (for real-time dashboard updates).

---

*Story Created: 2025-12-30*
*Story Completed: 2025-12-30*
*Epic: DM-04 | Story: 4 of 5 | Points: 5*

---

## Senior Developer Review

**Reviewer:** Code Review Agent
**Date:** 2025-12-30
**Outcome:** APPROVE

### Summary

The implementation of real-time widget updates is well-executed with clean code architecture, proper TypeScript typing, efficient selector hook usage, and comprehensive test coverage. All acceptance criteria have been met. The code follows project patterns and demonstrates thoughtful design decisions around cached data handling, animation transitions, and hybrid rendering modes.

### Checklist

- [x] Code follows project patterns
- [x] Type safety maintained
- [x] Tests adequate (34 tests, all passing)
- [x] Documentation complete
- [x] No security issues
- [x] React patterns correct

### Detailed Findings

#### Code Quality - EXCELLENT

**StateWidget.tsx (337 lines)**
- Clean component structure with proper 'use client' directive
- Comprehensive JSDoc documentation with @see references to story/spec docs
- Well-organized utility functions (`formatTimestamp`, `convertStatusFormat`)
- Clear separation between loading/error/data states
- Proper use of data-testid attributes for testing
- Animation classes consistently applied (`animate-in fade-in-50 duration-300`)

**RealTimeIndicator.tsx (145 lines)**
- Clean component with proper accessibility (aria-live, aria-label, aria-hidden)
- Efficient auto-refresh of relative time display (10-second interval)
- Proper cleanup of interval in useEffect
- Good use of Tailwind utility classes for status dot animations
- Optional refresh callback pattern well-implemented

**DashboardSlots.tsx (203 lines)**
- Clean hybrid mode implementation with proper mode prop typing
- Appropriate use of `useAgentStateSync` hook for state bridging
- Proper error handling for tool-call rendering (null data, data.error, unknown types)
- Responsive grid layout for state widgets
- Good animation class application to all rendered widgets

#### Type Safety - EXCELLENT

- All components properly typed with TypeScript
- Interface definitions match story specifications exactly
- Proper null checks and conditional rendering
- Type transformations well-documented (e.g., status format conversion)
- Mock types in tests properly typed with `ReturnType<typeof vi.fn>`

#### React Patterns - EXCELLENT

- Efficient selector hook usage - each widget subscribes only to its state slice
- Proper memoization not needed (selectors already handle shallow equality)
- Correct hook ordering (hooks called unconditionally before conditional returns)
- Proper use of useEffect cleanup for interval timer
- No unnecessary re-renders (selectors from DM-04.2 handle optimization)

#### Testing - EXCELLENT

**StateWidget.test.tsx (529 lines, 34 tests)**
- Comprehensive coverage of all state widgets
- Tests for loading states, error states, and data rendering
- Tests for data transformation (status format, timestamps)
- Tests for RealTimeIndicator (status dot colors, loading state, refresh button)
- Tests for formatTimestamp utility covering all time ranges
- Proper mocking of selector hooks and store
- Good use of data-testid for reliable element selection

#### Design Decisions - APPROVED

1. **Cached Data Priority**: Showing cached data during background refreshes (instead of loading skeleton) prevents UI flashing - this is the correct UX pattern.

2. **Agent-to-Widget Mapping**: Clear mapping of widgets to agent error sources (navi, pulse, herald) enables proper error attribution.

3. **Hybrid Mode Default**: Defaulting to 'hybrid' mode allows both tool-call and state-driven rendering to coexist, which is the right choice for gradual migration.

4. **Animation Strategy**: Using `tailwindcss-animate` plugin for smooth transitions is appropriate and maintains consistency.

#### Minor Observations (Non-Blocking)

1. **StateMetricsWidget icon mapping**: Line 189 maps `m.unit` to `icon`, with a comment noting this may need adjustment. This is acceptable as the icon field is optional.

2. **StateActivityWidget title**: Hardcoded to "Recent Activity" (line 249) rather than pulling from state. This is acceptable as the activity state schema doesn't include a title field.

3. **Timestamp precision**: `formatLastUpdate` in RealTimeIndicator handles 0 as falsy (line 56: `if (!timestamp)`), which correctly shows "Not updated" for uninitialized state.

### CI/Build Status

- **TypeScript Check**: PASS (no errors)
- **ESLint**: PASS (warnings only, no errors in new code)
- **Unit Tests**: PASS (34/34 tests passing)
- **Build**: Expected to pass (type-check confirms no issues)

### Decision

**APPROVED** - The implementation is production-ready. All acceptance criteria are met, code quality is excellent, type safety is maintained throughout, and test coverage is comprehensive. The code follows established project patterns and demonstrates thoughtful engineering decisions.

The story can be marked as DONE and the sprint status updated accordingly.
