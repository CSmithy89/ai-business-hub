# Story DM-11.1: Redis State Persistence

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
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

---

## Implementation Notes

**Implemented:** 2026-01-01
**Status:** Complete

### Files Created

| File | Description |
|------|-------------|
| `apps/api/src/modules/dashboard/dto/dashboard-state.dto.ts` | DTO classes for state persistence API |
| `apps/api/src/modules/dashboard/dashboard-state.service.ts` | Redis state persistence service |
| `apps/api/src/modules/dashboard/dashboard-state.controller.ts` | REST API endpoints for state CRUD |
| `apps/api/src/modules/dashboard/dashboard.module.ts` | NestJS module registration |
| `apps/api/src/modules/dashboard/dashboard-state.service.spec.ts` | Service unit tests |
| `apps/api/src/modules/dashboard/dashboard-state.controller.spec.ts` | Controller unit tests |
| `apps/web/src/lib/api/dashboard-state.ts` | Frontend API client |
| `apps/web/src/lib/api/__tests__/dashboard-state.test.ts` | API client tests |
| `apps/web/src/hooks/use-dashboard-sync.ts` | Dashboard sync hook |
| `apps/web/src/hooks/__tests__/use-dashboard-sync.test.tsx` | Hook tests |

### Files Modified

| File | Changes |
|------|---------|
| `apps/api/src/app.module.ts` | Added DashboardModule import |
| `apps/web/src/stores/dashboard-state-store.ts` | Added sync state and actions (isSyncing, lastSyncedAt, syncError, syncToServer, restoreFromServer, clearSyncError) |
| `apps/web/src/lib/dm-constants.ts` | Added STATE_SYNC constants (SYNC_DEBOUNCE_MS, RESTORE_ON_AUTH, SIGNIFICANT_CHANGE_PATHS) |
| `apps/web/src/hooks/index.ts` | Exported useDashboardSync hook |
| `apps/web/src/stores/__tests__/dashboard-state-store.test.ts` | Added sync state tests |

### Implementation Details

**Backend:**
- Redis key pattern: `hyvve:dashboard:state:{userId}:{workspaceId}`
- Default TTL: 30 days (2592000 seconds), configurable via `REDIS_STATE_TTL` env var
- Uses BullMQ queue connection to access Redis client (follows existing pattern)
- Fail-open pattern: Redis errors are logged but don't break dashboard functionality
- Conflict resolution: version-based with timestamp fallback

**Frontend:**
- Sync debounce: 2000ms to avoid excessive Redis writes
- Restore on auth: Automatically restores state from server on authentication
- Significant change paths: Only widgets, activeProject, activeTasks trigger sync
- Graceful error handling: API errors logged as warnings, fallback to localStorage

**Testing:**
- Service tests: Save, get, delete, conflict resolution, TTL, error handling
- Controller tests: Authentication, workspace scoping, error responses
- API client tests: Success cases, error handling, conflict resolution
- Hook tests: Auth restore, sync triggers, state reflection

### Acceptance Criteria Status

- [x] AC1: State persists to Redis via API (POST /api/dashboard/state)
- [x] AC2: State restores on login (useDashboardSync hook)
- [x] AC3: Conflict resolution handles version mismatches (version + timestamp)
- [x] AC4: State scoped to user + workspace (Redis key pattern)
- [x] AC5: TTL configurable (REDIS_STATE_TTL env var, default 30 days)

---

## Senior Developer Review

**Reviewer:** Claude AI (Senior Developer)
**Date:** 2026-01-01
**Status:** APPROVE

### Code Quality Assessment

#### Strengths

1. **Excellent Fail-Open Pattern**: The implementation correctly handles Redis unavailability gracefully - the dashboard continues to work with localStorage fallback while logging warnings. This is critical for user experience.

2. **Robust Conflict Resolution**: The version-based conflict resolution with timestamp fallback (`resolveConflict` method in `dashboard-state.service.ts`) provides a sound strategy for multi-device scenarios. The logic is clear and well-documented.

3. **Comprehensive Test Coverage**: All layers are thoroughly tested:
   - Service tests cover save, get, delete, conflict resolution, TTL, and error handling
   - Controller tests verify authentication, workspace scoping, and error responses
   - Frontend API client tests handle success cases, 404s, and network errors
   - Hook tests verify auth-based restore and sync triggers

4. **Clean Separation of Concerns**: The implementation properly separates:
   - DTOs for validation (`dashboard-state.dto.ts`)
   - Service for business logic (`dashboard-state.service.ts`)
   - Controller for HTTP handling (`dashboard-state.controller.ts`)
   - Frontend API client for HTTP calls (`dashboard-state.ts`)
   - Hook for sync lifecycle management (`use-dashboard-sync.ts`)

5. **Follows Existing Patterns**: The implementation follows established project patterns:
   - Uses BullMQ queue connection to access Redis (matching `RateLimitService` pattern)
   - Uses `AuthGuard` and `TenantGuard` for authentication/authorization
   - Centralizes constants in `dm-constants.ts` (per DM-08 retrospective)

#### Areas for Improvement

None - the code meets standards and follows best practices. Minor observations (not blocking):

- The `mockRedis: any` type in `dashboard-state.service.spec.ts` (line 17) could be more strictly typed, but this is acceptable for test code and matches the project's existing test patterns.

### Acceptance Criteria Verification

- [x] **AC1: State persists to Redis via API**
  - Verified: `DashboardStateService.saveState()` saves state to Redis with key pattern `hyvve:dashboard:state:{userId}:{workspaceId}`
  - POST endpoint at `/api/dashboard/state` exposed via `DashboardStateController`
  - Tests confirm successful save and proper Redis SET call with TTL

- [x] **AC2: State restores on login**
  - Verified: `useDashboardSync` hook calls `restoreFromServer()` when authentication state changes to authenticated
  - `RESTORE_ON_AUTH` constant controls this behavior
  - Tests confirm restore is triggered on auth change and only once per session

- [x] **AC3: Conflict resolution handles version mismatches**
  - Verified: `saveState()` checks existing version before saving
  - If `serverVersion > clientVersion`, returns `conflictResolution: 'server'`
  - `resolveConflict()` method provides version-based + timestamp fallback resolution
  - Frontend store handles conflict by triggering `restoreFromServer()`
  - Tests cover all conflict scenarios

- [x] **AC4: State scoped to user + workspace**
  - Verified: Redis key pattern `hyvve:dashboard:state:{userId}:{workspaceId}` ensures proper scoping
  - Controller uses `@CurrentUser()` and `@CurrentWorkspace()` decorators
  - `AuthGuard` and `TenantGuard` enforce authentication and workspace isolation

- [x] **AC5: TTL configurable**
  - Verified: Default TTL is 30 days (2,592,000 seconds)
  - Configurable via `REDIS_STATE_TTL` environment variable
  - Service constructor reads from `ConfigService` with fallback to default
  - Warning logged if invalid TTL value provided
  - Tests verify default TTL is applied

### Test Coverage

**Backend Tests:**
- `dashboard-state.service.spec.ts`: 14 test cases covering all service methods
- `dashboard-state.controller.spec.ts`: 7 test cases covering all endpoints

**Frontend Tests:**
- `dashboard-state.test.ts`: 12 test cases for API client
- `use-dashboard-sync.test.tsx`: 9 test cases for sync hook
- `dashboard-state-store.test.ts`: 8 additional test cases for sync state

**Coverage Assessment:** Excellent - all critical paths are tested including:
- Happy paths (save, get, delete)
- Error conditions (Redis unavailable, network errors)
- Edge cases (corrupted data, 404 responses)
- Conflict resolution scenarios

### Security Review

1. **Authentication/Authorization**: All endpoints protected by `AuthGuard` and `TenantGuard`
2. **Data Isolation**: State is scoped to user + workspace via Redis key pattern
3. **Input Validation**: `SaveDashboardStateDto` validates request body with class-validator decorators
4. **No Sensitive Data**: State contains dashboard UI preferences, not credentials
5. **Error Handling**: Errors are logged but don't expose internal details to clients

No security concerns identified.

### Recommendation

**APPROVE** for merge.

The implementation is well-architected, follows project patterns, has comprehensive test coverage, and correctly implements all acceptance criteria. The fail-open pattern ensures reliability, and the conflict resolution strategy is sound for multi-device scenarios.
