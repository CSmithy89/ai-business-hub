# Story DM-08-6: Zustand Selector Optimization

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

Zustand selectors that filter or transform state cause unnecessary re-renders because they create new object/array references on every call.

## Root Cause

From tech debt analysis:
- `useAlerts()` filters alerts on every call, creating new array
- No bounds on metrics/activities leading to potential unbounded growth
- Missing shallow comparison for array/object selectors

## Implementation Plan

### 1. Pre-compute Derived State

Add `activeAlerts` to store state, updated when alerts change.

### 2. Add MAX Bounds

Add constants for all collection types to prevent unbounded growth.

### 3. Use Shallow Comparison

Import `useShallow` from zustand/react/shallow for array/object selectors.

## Acceptance Criteria

- [x] AC1: Pre-computed activeAlerts in store
- [x] AC2: MAX bounds for all collections
- [x] AC3: Shallow comparison in selectors
- [x] AC4: Store tests updated

---

## Implementation Notes

### Constants Added (DM-08.6)

```typescript
const MAX_ALERTS = 50;       // Existing
const MAX_ACTIVITIES = 100;  // New
const MAX_METRICS = 50;      // New
const MAX_ACTIVE_TASKS = 20; // New
```

### Pre-computed State

Added `activeAlerts: AlertEntry[]` to store interface and implementation:
- Computed on `setFullState`, `updateState`, `addAlert`, `dismissAlert`, `clearAlerts`
- Selectors now read directly without filtering

### Selector Optimizations

Updated selectors with `useShallow`:
- `useAlerts()` - Uses pre-computed `activeAlerts`
- `useAllAlerts()` - Shallow comparison
- `useLoadingAgents()` - Shallow comparison
- `useErrors()` - Shallow comparison

### Bounds Applied

- `setMetrics()` - Caps at MAX_METRICS
- `setActivity()` - Caps at MAX_ACTIVITIES
- `addAlert()` - Caps at MAX_ALERTS (existing)
- `addTask()` - Caps at MAX_ACTIVE_TASKS

### Re-render Prevention

Before:
```typescript
// Creates new array on every call
useAlerts = () => store(s => s.alerts.filter(a => !a.dismissed))
```

After:
```typescript
// Uses pre-computed + shallow comparison
useAlerts = () => store(useShallow(s => s.activeAlerts))
```

---

## Review Notes

(To be filled during code review)
