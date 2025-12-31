# Story DM-08-2: Dashboard Data Caching

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** High

---

## Problem Statement

Dashboard requests may be made too frequently, causing unnecessary load and latency. React Query caching can reduce redundant requests.

## Root Cause

From DM-03 Retrospective:
- No caching strategy for dashboard data
- Repeated requests on re-mounts

## Implementation Plan

### 1. Create Dashboard Cache Configuration

Create `apps/web/src/lib/cache/dashboard-cache.ts`:
- Centralized cache configuration for dashboard
- Cache keys scoped by workspace/tenant
- Stale time, cache time, retry settings

### 2. Create Cached Dashboard Data Hook

Create `apps/web/src/hooks/use-dashboard-data.ts`:
- React Query hook for fetching dashboard data
- Uses cache configuration
- Supports prefetching and invalidation

### 3. Update QueryClient Defaults

Update `apps/web/src/app/providers.tsx`:
- Configure optimal defaults for dashboard queries
- Add deduplication settings

## Acceptance Criteria

- [x] AC1: Dashboard cache configuration created
- [x] AC2: useDashboardData hook with caching
- [x] AC3: Cache keys properly scoped by workspace
- [x] AC4: 10s stale time prevents over-fetching
- [x] AC5: Cache invalidation on user actions (invalidate/invalidateAll utilities)

## Technical Notes

### Cache Configuration
```typescript
export const DASHBOARD_CACHE_CONFIG = {
  staleTime: 10_000,        // 10s before stale
  cacheTime: 60_000,        // 60s in cache after unmount
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
};
```

## Files to Create/Modify

```
apps/web/src/
├── lib/cache/
│   └── dashboard-cache.ts      # NEW
├── hooks/
│   └── use-dashboard-data.ts   # NEW
└── app/
    └── providers.tsx           # MODIFY (if needed)
```

---

## Implementation Notes

### Files Created

1. **`apps/web/src/lib/cache/dashboard-cache.ts`** - Cache configuration:
   - `DASHBOARD_CACHE_CONFIG` - Standard 10s stale/60s gc config
   - `DASHBOARD_LONG_CACHE_CONFIG` - 60s stale for slow-changing data
   - `DASHBOARD_REALTIME_CACHE_CONFIG` - 5s stale for live data
   - `getDashboardQueryKey()` - Workspace-scoped cache keys
   - `getDashboardQueryKeyWithParams()` - Keys with filter params
   - `getDashboardInvalidationKey()` - Partial keys for invalidation

2. **`apps/web/src/hooks/use-dashboard-data.ts`** - React Query hooks:
   - `useDashboardData()` - Basic cached data fetching
   - `useDashboardDataWithParams()` - Parameterized queries
   - `useDashboardCache()` - Utility hook for prefetch/invalidate

3. **`apps/web/src/lib/cache/__tests__/dashboard-cache.test.ts`** - Tests:
   - 19 tests covering config values and key factories

### Files Modified

1. **`apps/web/src/hooks/index.ts`** - Added exports for new hooks

### Design Decisions

- Three cache configurations for different use cases (default/long/realtime)
- Workspace ID in all cache keys ensures multi-tenant isolation
- React Query's built-in deduplication handles concurrent requests
- Provider defaults unchanged (existing 60s staleTime still applies globally)

---

## Review Notes

(To be filled during code review)
