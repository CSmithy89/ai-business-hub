# Story DM-11.10: Wire ErrorWidget Retry Button

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 2
**Priority:** Low

---

## Problem Statement

The ErrorWidget component has a retry prop (`onRetry`) but it's not connected anywhere in the actual widget rendering flow. When widgets fail to render (unknown type, validation error, data error), users see the error but have no way to retry the failed operation.

This creates a poor user experience where errors require a full page refresh to attempt recovery.

## Gap Addressed

**TD-15:** Retry button not wired in ErrorWidget (onRetry prop available but unused)

## Implementation Plan

### 1. Enhance ErrorWidget Component

Add loading state, retry count tracking, and max retries limit:

```typescript
// apps/web/src/components/slots/widgets/ErrorWidget.tsx

export interface ErrorWidgetProps {
  message: string;
  widgetType?: string;
  availableTypes?: string[];
  onRetry?: () => void | Promise<void>;
  retryCount?: number;
  maxRetries?: number;
}

export function ErrorWidget({
  message,
  widgetType,
  availableTypes,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
}: ErrorWidgetProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const canRetry = onRetry && retryCount < maxRetries;

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // ... render with loading spinner when isRetrying
}
```

### 2. Wire Retry Callback in DashboardSlots

Connect retry button to dashboard state refresh for state-driven widgets:

```typescript
// apps/web/src/components/slots/DashboardSlots.tsx

// For tool-call errors, provide a way to request retry
const handleToolRetry = useCallback(() => {
  // In tool-call mode, we can't directly retry
  // Instead, we can clear the error state and request refresh
  console.log('[DashboardSlots] Tool retry requested');
}, []);

// For validation/data errors, pass the retry handler
<ErrorWidget
  message={errorMessages}
  widgetType={widgetType}
  onRetry={handleToolRetry}
/>
```

### 3. Add State Refresh Hook

Create a hook to refresh dashboard state on retry:

```typescript
// Extend useAgentStateSync to expose refresh
export function useAgentStateSync(options: AgentStateSyncOptions) {
  const refresh = useCallback(() => {
    // Request fresh data from agent
  }, []);

  return { refresh };
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/components/slots/widgets/ErrorWidget.tsx` | Add retryCount, maxRetries, loading state |
| `apps/web/src/components/slots/widgets/__tests__/ErrorWidget.test.tsx` | Add tests for new props and loading state |
| `apps/web/src/components/slots/DashboardSlots.tsx` | Wire onRetry callbacks to ErrorWidget usages |

## Acceptance Criteria

- [x] AC1: ErrorWidget shows loading spinner during retry
- [x] AC2: Retry button disabled after max retries reached
- [x] AC3: Retry count displayed when retries exhausted
- [x] AC4: onRetry callback connected in DashboardSlots
- [x] AC5: Tests cover loading state and retry limits

## Test Requirements

### Unit Tests

1. **Loading State Tests**
   - Shows loading spinner when isRetrying is true
   - Disables button during retry
   - Hides loading spinner when retry completes

2. **Retry Count Tests**
   - Shows retry button when under max retries
   - Hides retry button when max retries exceeded
   - Displays retry count when exhausted

3. **Async Retry Tests**
   - Handles async onRetry callbacks
   - Handles retry errors gracefully
   - Resets loading state on error

## Dependencies

- **DM-03** (Widget Rendering Pipeline) - ErrorWidget base component
- **DM-04** (Shared State) - State refresh mechanism

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md#dm-1110-wire-errorwidget-retry-button-2-pts)
- [Tech Debt TD-15](../tech-debt-consolidated.md)
- [ErrorWidget Component](../../../../apps/web/src/components/slots/widgets/ErrorWidget.tsx)

---

*Story Created: 2026-01-01*
*Epic: DM-11 | Story: 10 of 15 | Points: 2*

---

## Implementation Notes

**Implemented:** 2026-01-01

### Changes Made

1. **ErrorWidget.tsx** - Enhanced with retry functionality:
   - Added `retryCount` and `maxRetries` props (default 3 retries)
   - Added `isRetrying` loading state with async handler
   - Shows loading spinner during retry operation
   - Displays retry count when retryCount > 0: "Retry (1/3)"
   - Shows "Maximum retries exceeded" message when exhausted
   - Button disabled during loading or when retries exhausted

2. **DashboardSlots.tsx** - Wired retry callbacks:
   - Added `handleToolRetry` callback for tool-call errors
   - Connected to dashboard state store's `clearErrors` action
   - All 4 ErrorWidget instances now have onRetry prop

3. **ErrorWidget.test.tsx** - Comprehensive test coverage:
   - 29 tests covering all new functionality
   - Loading state tests with async promise handling
   - Retry count display tests
   - Retry exhausted message tests
   - Edge cases (maxRetries=0, undefined props)

### Technical Notes

- Retry in CopilotKit tool-call context clears error state and logs
- Full retry (re-triggering the action) requires re-sending the original message
- Loading state uses async/await pattern for proper error handling
- Tests use real timers for async operations to avoid flaky tests
