# Story DM-11.1: Redis State Persistence

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** drafted
**Points:** 8
**Priority:** High

---

## Problem Statement

Dashboard state only persists to localStorage, which means state is lost when the browser storage is cleared. This creates a poor user experience when switching devices or clearing browser data. The state needs to be persisted server-side using Redis to enable state recovery across devices and browser sessions.

## Root Cause

From DM-04 Retrospective (TD-04, REC-17):
- Dashboard state only persists to localStorage, not server-side
- State is lost on browser clear or when switching devices
- No server-side backup for state recovery

## Implementation Plan

### 1. Create Dashboard State DTO

Create `apps/api/src/modules/dashboard/dto/dashboard-state.dto.ts`:
```typescript
import { z } from 'zod';

export const DashboardStateSchema = z.object({
  version: z.number(),
  state: z.record(z.unknown()),
  checksum: z.string().optional(),
});

export type DashboardStateDto = z.infer<typeof DashboardStateSchema>;

export const SaveStateResponseSchema = z.object({
  success: z.boolean(),
  serverVersion: z.number(),
  conflictResolution: z.enum(['server', 'client']).optional(),
});

export const GetStateResponseSchema = z.object({
  version: z.number(),
  state: z.record(z.unknown()),
  lastModified: z.string(),
});
```

### 2. Create Dashboard State Service

Create `apps/api/src/modules/dashboard/dashboard-state.service.ts`:
- Save state to Redis with key pattern: `dashboard:state:{userId}:{workspaceId}`
- Get state from Redis with version and lastModified timestamp
- Delete state from Redis
- Handle conflict resolution when versions differ
- Set TTL on Redis keys (configurable, default 30 days)

### 3. Create Dashboard State Controller

Create `apps/api/src/modules/dashboard/dashboard-state.controller.ts`:
- `POST /api/dashboard/state` - Save state to Redis
- `GET /api/dashboard/state` - Get state from Redis
- `DELETE /api/dashboard/state` - Delete state from Redis
- All endpoints require authentication
- Endpoints scoped to user + workspace

### 4. Create Frontend API Client

Create `apps/web/src/lib/api/dashboard-state.ts`:
- `saveDashboardState(state, version)` - POST to save state
- `getDashboardState()` - GET to retrieve state
- `deleteDashboardState()` - DELETE to clear state
- Handle API errors gracefully

### 5. Update Dashboard Store with Sync Logic

Modify `apps/web/src/stores/dashboard-store.ts`:
- Add `syncToServer()` method for significant state changes
- Add `restoreFromServer()` method for login recovery
- Implement conflict resolution logic:
  - If serverVersion > localVersion: restore from server
  - If localVersion > serverVersion: push to server
  - If equal: compare timestamps and merge
- Add debounced sync on state changes
- Call `restoreFromServer()` on authentication

### 6. Integrate with DM-08 Caching Patterns

Per DM-08 retrospective recommendations:
- Use staleness tracking for cache invalidation
- Add cache metrics to observability
- Consider cache warming on agent startup

## Files to Create

| File | Description |
|------|-------------|
| `apps/api/src/modules/dashboard/dashboard-state.controller.ts` | REST API endpoints for state CRUD |
| `apps/api/src/modules/dashboard/dashboard-state.service.ts` | Redis state persistence service |
| `apps/api/src/modules/dashboard/dto/dashboard-state.dto.ts` | Zod schemas for state validation |
| `apps/web/src/lib/api/dashboard-state.ts` | Frontend API client for state sync |

## Files to Modify

| File | Changes |
|------|---------|
| `apps/api/src/modules/dashboard/dashboard.module.ts` | Register state controller and service |
| `apps/web/src/stores/dashboard-store.ts` | Add sync logic and conflict resolution |
| `apps/api/src/app.module.ts` | Ensure dashboard module is imported |

## API Design

### Save State

```typescript
POST /api/dashboard/state
Headers: Authorization: Bearer <token>
Body: { version: number, state: DashboardState, checksum?: string }
Response: { success: boolean, serverVersion: number, conflictResolution?: 'server' | 'client' }
```

### Get State

```typescript
GET /api/dashboard/state
Headers: Authorization: Bearer <token>
Response: { version: number, state: DashboardState, lastModified: string }
```

### Delete State

```typescript
DELETE /api/dashboard/state
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

## Redis Key Structure

```
dashboard:state:{userId}:{workspaceId} -> JSON string (main state)
dashboard:state:{userId}:{workspaceId}:version -> integer (version number)
dashboard:state:{userId}:{workspaceId}:modified -> ISO timestamp (last modified)
```

## Conflict Resolution Logic

```typescript
async function resolveConflict(
  serverState: StateData,
  clientState: StateData
): Promise<'server' | 'client' | 'merge'> {
  if (serverState.version > clientState.version) {
    return 'server'; // Server wins
  }
  if (clientState.version > serverState.version) {
    return 'client'; // Client wins, push to Redis
  }
  // Same version - compare timestamps
  if (serverState.modifiedAt > clientState.modifiedAt) {
    return 'server';
  }
  return 'client';
}
```

## Acceptance Criteria

- [ ] AC1: State persists to Redis via API
- [ ] AC2: State restores on login
- [ ] AC3: Conflict resolution handles version mismatches
- [ ] AC4: State scoped to user + workspace
- [ ] AC5: TTL configurable (default 30 days)

## Technical Notes

### TTL Configuration

- Default TTL: 30 days (2592000 seconds)
- Configurable via `REDIS_STATE_TTL` environment variable
- Per DM-08 retrospective: Move TTL values to environment variables

### Error Handling

- If Redis is unavailable, fall back to localStorage only
- Log errors but don't break the dashboard experience
- Return appropriate HTTP status codes for API errors

### Performance Considerations

- Debounce state sync to avoid excessive Redis writes
- Only sync on "significant" changes (widget add/remove, layout changes)
- Use Redis pipelining for multi-key operations

## Test Requirements

1. Unit tests for dashboard state service
   - Save state to Redis
   - Get state from Redis
   - Delete state from Redis
   - Conflict resolution logic

2. Unit tests for dashboard state controller
   - Authentication required
   - User/workspace scoping
   - Error handling

3. Integration tests for API endpoints
   - POST/GET/DELETE round-trip
   - Conflict resolution scenarios
   - TTL expiration

4. Frontend tests
   - API client methods
   - Store sync logic
   - Conflict resolution in store

## Dependencies

- DM-07 (Infrastructure Stabilization) - Stable base required
- DM-08 (Quality & Performance) - Caching patterns to follow
- DM-09 (Observability) - Tracing for Redis operations

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - TD-04, REC-17
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - State persistence patterns
- [DM-08 Tech Spec](./epic-dm-08-tech-spec.md) - Caching and TTL patterns
- [Epic DM-11 Tech Spec](./epic-dm-11-tech-spec.md) - Full technical specification
