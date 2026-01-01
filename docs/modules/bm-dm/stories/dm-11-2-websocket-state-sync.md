# Story DM-11.2: WebSocket State Synchronization

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 8
**Priority:** High

---

## Problem Statement

State changes on one device don't reflect on others in real-time. When a user updates their dashboard on their desktop, the changes don't appear on their mobile device or in other browser tabs until they manually refresh. This creates a disjointed experience and can lead to data conflicts when users work across multiple devices.

## Root Cause

From DM-04 Retrospective (REC-18):
- Dashboard state only syncs via localStorage (browser-local)
- No mechanism for real-time state propagation across devices
- DM-11.1 adds Redis persistence but lacks real-time sync
- Users must manually refresh to see changes from other devices

## Gap Addressed

**REC-18:** WebSocket state sync for multi-device synchronization

## Implementation Plan

### 1. Add WebSocket Event Types

Extend `apps/api/src/realtime/realtime.types.ts` with new state sync events:
```typescript
// State sync event types
export interface DashboardStateUpdatePayload {
  path: string;           // e.g., 'widgets.w1', 'activeProject'
  value: unknown;
  version: number;
  timestamp: string;
  sourceTabId: string;    // Exclude sender from receiving
}

export interface DashboardStateSyncPayload {
  path: string;
  value: unknown;
  version: number;
  sourceTabId: string;
}

export interface DashboardStateFullPayload {
  state: Record<string, unknown>;
  version: number;
}

// Add to WS_EVENTS
export const WS_EVENTS = {
  // ... existing events
  DASHBOARD_STATE_UPDATE: 'dashboard.state.update',
  DASHBOARD_STATE_SYNC: 'dashboard.state.sync',
  DASHBOARD_STATE_FULL: 'dashboard.state.full',
  DASHBOARD_STATE_REQUEST: 'dashboard.state.request',
} as const;
```

### 2. Create State Sync Gateway

Create `apps/api/src/modules/realtime/state-sync.gateway.ts`:
- Handle `dashboard.state.update` events from clients
- Broadcast `dashboard.state.sync` to all other user connections
- Handle reconnection with `dashboard.state.full` to restore state
- Integrate with DM-11.1 Redis persistence for state recovery
- Use user-scoped rooms for isolation (`user:{userId}:state`)

### 3. Create Frontend State Sync Client

Create `apps/web/src/lib/realtime/state-sync-client.ts`:
- Subscribe to state sync events from WebSocket
- Send state updates to server on significant changes
- Handle reconnection with state reconciliation
- Implement diff-based updates to minimize payload size
- Track local tab ID to avoid self-echo

### 4. Integrate with Dashboard Store

Modify `apps/web/src/stores/dashboard-state-store.ts`:
- Add WebSocket sync listener on store initialization
- Emit state updates for significant changes (widget add/remove, layout changes)
- Apply incoming sync updates with conflict detection
- Debounce outgoing updates to prevent flooding

### 5. Implement Diff-Based Updates

Create `apps/web/src/lib/realtime/state-diff.ts`:
- Generate minimal diffs for state changes
- Apply diffs to local state
- Handle path-based updates (e.g., `widgets.w1.data`)

## Files to Create

| File | Description |
|------|-------------|
| `apps/api/src/modules/realtime/state-sync.gateway.ts` | NestJS gateway for state sync WebSocket handling |
| `apps/api/src/modules/realtime/state-sync.gateway.spec.ts` | Unit tests for state sync gateway |
| `apps/web/src/lib/realtime/state-sync-client.ts` | Frontend WebSocket client for state sync |
| `apps/web/src/lib/realtime/state-diff.ts` | Diff generation and application utilities |
| `apps/web/src/lib/realtime/__tests__/state-sync-client.test.ts` | State sync client tests |
| `apps/web/src/lib/realtime/__tests__/state-diff.test.ts` | State diff utility tests |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/realtime/realtime.types.ts` | Add state sync event types and payloads |
| `apps/api/src/realtime/realtime.module.ts` | Register StateSyncGateway |
| `apps/web/src/stores/dashboard-state-store.ts` | Integrate WebSocket sync listeners and emitters |
| `apps/web/src/hooks/use-dashboard-sync.ts` | Add WebSocket sync alongside Redis sync |
| `apps/web/src/lib/dm-constants.ts` | Add WEBSOCKET_SYNC constants |

## API Design

### WebSocket Events

```typescript
// Client -> Server: State update
{
  event: 'dashboard.state.update',
  payload: {
    path: 'widgets.w1',           // JSONPath to updated property
    value: { type: 'vitals', data: {...} },
    version: 42,
    timestamp: '2026-01-01T12:00:00Z',
    sourceTabId: 'tab-abc123'
  }
}

// Server -> All Other Clients (same user): Sync notification
{
  event: 'dashboard.state.sync',
  payload: {
    path: 'widgets.w1',
    value: { type: 'vitals', data: {...} },
    version: 42,
    sourceTabId: 'tab-abc123'     // Clients ignore if matches their tabId
  }
}

// Client -> Server: Request full state (on reconnection)
{
  event: 'dashboard.state.request',
  payload: {
    lastKnownVersion: 40
  }
}

// Server -> Client: Full state (reconnection recovery)
{
  event: 'dashboard.state.full',
  payload: {
    state: { widgets: {...}, activeProject: '...', ... },
    version: 42
  }
}
```

### Room Structure

```
user:{userId}:state  // All tabs/devices for a user share this room
```

### Conflict Resolution

When receiving a sync event:
1. Compare `incomingVersion` with `localVersion`
2. If `incomingVersion > localVersion`: Apply update directly
3. If `incomingVersion == localVersion`: Apply (same version, merge)
4. If `incomingVersion < localVersion`: Log warning, keep local (local is ahead)

## State Sync Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STATE SYNC FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Device A (Desktop)                 Server                Device B (Mobile)│
│   ┌──────────────┐              ┌──────────────┐         ┌──────────────┐   │
│   │ Dashboard    │              │ State Sync   │         │ Dashboard    │   │
│   │ Store        │              │ Gateway      │         │ Store        │   │
│   └──────┬───────┘              └──────┬───────┘         └──────┬───────┘   │
│          │                             │                        │           │
│   1. User adds widget                  │                        │           │
│          │                             │                        │           │
│   2. Store emits update ───────────────►                        │           │
│      { path: 'widgets.w1',             │                        │           │
│        version: 42 }                   │                        │           │
│          │                             │                        │           │
│          │                      3. Save to Redis                │           │
│          │                      4. Broadcast to room            │           │
│          │                             │                        │           │
│          │                             ├───────────────────────►│           │
│          │                             │     state:sync         │           │
│          │                             │                        │           │
│          │                             │                 5. Apply update    │
│          │                             │                    (version check) │
│          │                             │                        │           │
│   6. Widget appears                    │              6. Widget appears     │
│      instantly                         │                 (100-500ms delay)  │
│          │                             │                        │           │
└──────────┴─────────────────────────────┴────────────────────────┴───────────┘
```

## Reconnection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       RECONNECTION FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client                              Server                                 │
│   ┌──────────────┐               ┌──────────────┐                           │
│   │ State Sync   │               │ State Sync   │                           │
│   │ Client       │               │ Gateway      │                           │
│   └──────┬───────┘               └──────┬───────┘                           │
│          │                              │                                    │
│   1. Disconnect detected                │                                    │
│          │                              │                                    │
│   2. Reconnect (auto via Socket.io)     │                                    │
│          │                              │                                    │
│   3. Send state:request ────────────────►                                    │
│      { lastKnownVersion: 40 }           │                                    │
│          │                              │                                    │
│          │                       4. Check Redis                              │
│          │                          currentVersion: 42                       │
│          │                              │                                    │
│          ◄──────────────────────────────┤                                    │
│          │          state:full          │                                    │
│          │    { state: {...},           │                                    │
│          │      version: 42 }           │                                    │
│          │                              │                                    │
│   5. Apply full state                   │                                    │
│      (merge with local changes)         │                                    │
│          │                              │                                    │
└──────────┴──────────────────────────────┴────────────────────────────────────┘
```

## Acceptance Criteria

- [x] AC1: State changes broadcast via WebSocket to all user devices
- [x] AC2: Multi-tab sync works (changes in one tab appear in others)
- [x] AC3: Multi-device sync works (changes on desktop appear on mobile)
- [x] AC4: Reconnection restores state from server
- [x] AC5: Diff-based updates minimize bandwidth (only changed paths sent)

## Technical Notes

### Tab ID Generation

```typescript
// Generate unique tab ID on page load (SSR-safe)
const getTabId = (): string => {
  if (typeof window === 'undefined') return '';

  let tabId = sessionStorage.getItem('hyvve:tabId');
  if (!tabId) {
    tabId = `tab-${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem('hyvve:tabId', tabId);
  }
  return tabId;
};
```

### Significant Change Detection

Only emit updates for meaningful changes (per DM-11.1 patterns):
```typescript
const SIGNIFICANT_CHANGE_PATHS = [
  'widgets',
  'activeProject',
  'activeTasks',
  // Layout changes, NOT individual data updates
];

function isSignificantChange(path: string): boolean {
  return SIGNIFICANT_CHANGE_PATHS.some(
    (p) => path === p || path.startsWith(`${p}.`)
  );
}
```

### Debounce Configuration

```typescript
// Debounce WebSocket emissions (separate from Redis sync)
const WS_SYNC_DEBOUNCE_MS = 100; // Faster than Redis sync (2000ms)
```

### Error Handling

- WebSocket disconnection: Queue updates locally, replay on reconnect
- Server unavailable: Fall back to Redis-only sync (DM-11.1)
- Invalid payload: Log warning, skip update
- Version conflict: Server state wins (per DM-11.1 patterns)

### Performance Considerations

- Maximum payload size: 64KB (reject larger updates)
- Debounce emissions to prevent flooding (100ms)
- Use path-based updates instead of full state
- Exclude sender from receiving their own updates (sourceTabId)

## Test Requirements

### Unit Tests

1. **State Sync Gateway Tests** (`state-sync.gateway.spec.ts`)
   - Handle state update events
   - Broadcast to room (excluding sender)
   - Handle reconnection requests
   - Return full state from Redis
   - Validate input payloads

2. **State Sync Client Tests** (`state-sync-client.test.ts`)
   - Connect to WebSocket on initialization
   - Send updates on significant changes
   - Apply incoming sync updates
   - Handle reconnection
   - Exclude self-echo (same tabId)

3. **State Diff Tests** (`state-diff.test.ts`)
   - Generate diffs for nested objects
   - Apply diffs correctly
   - Handle array changes
   - Handle null/undefined values

### Integration Tests

1. **Multi-Tab Sync Test**
   - Open two tabs with same user
   - Update state in tab A
   - Verify state appears in tab B within 500ms

2. **Reconnection Test**
   - Connect, make changes
   - Disconnect (simulate network loss)
   - Reconnect
   - Verify state reconciliation

## Dependencies

- **DM-11.1** (Redis State Persistence) - Must be complete for reconnection recovery
- **Foundation Phase** (WebSocket Infrastructure) - Socket.io already configured
- **DM-09** (Observability) - Tracing for WebSocket events

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - REC-18
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - State persistence patterns
- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md) - Full technical specification
- [DM-11.1 Story](./dm-11-1-redis-state-persistence.md) - Redis persistence (prerequisite)
- [Realtime Gateway](../../../../apps/api/src/realtime/realtime.gateway.ts) - Existing WebSocket infrastructure

---

## Code Review Notes

**Review Date:** 2026-01-01
**Reviewer:** Senior Developer (Claude Code)
**Recommendation:** APPROVED

### Strengths

1. **Architecture & Design**
   - Clean separation of concerns between gateway, types, diff utilities, and sync client
   - Follows existing WebSocket patterns in the codebase
   - Singleton pattern appropriate for app-wide state sync coordination
   - Immutable state updates maintained throughout

2. **Security Implementation**
   - Input validation with Zod schemas on all payloads
   - Rate limiting (100 updates/minute/user) properly implemented
   - 64KB payload size limits enforced on client and server
   - Authentication required before processing any state updates
   - Room-based isolation prevents cross-tenant data leakage

3. **Code Quality**
   - Comprehensive TypeScript types for all payloads
   - Centralized constants in `DM_CONSTANTS.WS_SYNC`
   - Excellent JSDoc documentation
   - Well-implemented utility functions with edge case handling

4. **Error Handling**
   - Graceful degradation (Redis failures don't block broadcasts)
   - Callbacks wrapped in try-catch
   - Proper connection state tracking and reconnection handling

5. **Test Coverage**
   - Gateway: 15+ test cases for auth, updates, requests, rate limiting
   - State diff: Comprehensive tests for all utility functions
   - State sync client: Tests for connection, events, debouncing, filtering

### Minor Improvements (Non-blocking)

1. Version comparison in `applyFullState` uses `<=` which may reject same-version updates
2. Rate limit map entries never cleaned up (minor memory concern)
3. Some store methods missing JSDoc for consistency

### Files Reviewed

**Backend:**
- `apps/api/src/realtime/realtime.types.ts` - New event types and schemas
- `apps/api/src/realtime/realtime.gateway.ts` - Dashboard state handlers
- `apps/api/src/realtime/realtime.module.ts` - Module imports
- `apps/api/src/realtime/realtime.gateway.spec.ts` - Gateway tests

**Frontend:**
- `apps/web/src/lib/realtime/types.ts` - Frontend types
- `apps/web/src/lib/realtime/state-diff.ts` - Diff utilities
- `apps/web/src/lib/realtime/state-sync-client.ts` - WebSocket client
- `apps/web/src/lib/dm-constants.ts` - WS_SYNC constants
- `apps/web/src/stores/dashboard-state-store.ts` - Store updates
- `apps/web/src/hooks/use-dashboard-sync.ts` - Hook updates
- `apps/web/src/lib/realtime/state-diff.test.ts` - Diff tests
- `apps/web/src/lib/realtime/state-sync-client.test.ts` - Client tests

### Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | PASS | `handleDashboardStateUpdate` broadcasts to user room |
| AC2 | PASS | Tab ID filtering via `sourceTabId`, room-based broadcast |
| AC3 | PASS | All devices join same `dashboard:state:${userId}` room |
| AC4 | PASS | `handleDashboardStateRequest` returns full state from Redis |
| AC5 | PASS | `computeDiff` generates minimal changes, path-based updates |

### Security Review Summary

| Aspect | Status |
|--------|--------|
| Authentication | PASS |
| Authorization | PASS |
| Input Validation | PASS |
| Rate Limiting | PASS |
| Payload Size Limits | PASS |
| Self-Echo Prevention | PASS |
| Room Isolation | PASS |
