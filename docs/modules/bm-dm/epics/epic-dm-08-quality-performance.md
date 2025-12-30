# Epic DM-08: Quality & Performance Hardening

## Overview

Implement data validation, caching, rate limiting, and performance optimizations to harden the system for production reliability. This epic resolves Sprint 2 "Should Do" items from the [Tech Debt Consolidated Document](../tech-debt-consolidated.md).

## Source Reference

**Tech Debt Document:** `docs/modules/bm-dm/tech-debt-consolidated.md`
**Priority:** Sprint 2 - Should Do (Quality Improvements)
**Items Addressed:** REC-01, REC-02, REC-03, REC-05, TD-07, TD-11, TD-12, TD-13, TD-14

## Scope

### Quality & Performance Items

| ID | Item | Category | Source Epic |
|----|------|----------|-------------|
| REC-01 | Add Zod schemas for widget data payloads | Data Integrity | DM-03 |
| REC-02 | Implement short TTL caching (5-10s) for dashboard data | Performance | DM-03 |
| REC-03 | Add rate limiting for A2A endpoints - per-workspace | Stability | DM-03 |
| REC-05 | Create reusable async mock fixtures | Test Velocity | DM-06 |
| TD-07 | Widget type duplication (WIDGET_TYPES in frontend/backend) | Consistency | DM-03 |
| TD-11 | `useAlerts` selector creates new filtered array on each call | Performance | DM-04 |
| TD-12 | `useAgentStateWidget` rebuilds object vs selecting from store | Performance | DM-04 |
| TD-13 | Response parsers (Navi/Pulse/Herald) need schema validation | Data Integrity | DM-04 |
| TD-14 | Metrics state unbounded (MAX_ALERTS=50, MAX_ACTIVITIES=100 exist, metrics don't) | State Bloat | DM-04 |

## Proposed Stories

### Story DM-08.1: Add Zod Schema Validation for Widget Data

**Problem:** Widget data payloads are not validated before rendering, risking runtime errors from malformed data.

**Root Cause (from DM-03 Retrospective):**
- A2A responses trusted without validation
- Widget components may crash on unexpected data shapes

**Implementation:**
- Define Zod schemas for each widget type's data payload
- Create `validateWidgetData(type, data)` utility
- Add validation layer in widget rendering pipeline
- Log validation failures for debugging
- Apply pattern from architecture: "Validate at system boundaries"

**Schema Examples:**
```typescript
// Widget data schemas
const ProjectStatusDataSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  status: z.enum(['active', 'paused', 'completed']),
  health: z.number().min(0).max(100).optional(),
});

const MetricsDataSchema = z.object({
  value: z.number(),
  label: z.string(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  previousValue: z.number().optional(),
});
```

**Files to Create/Modify:**
```
apps/web/src/
├── lib/schemas/
│   └── widget-schemas.ts
├── components/widgets/
│   └── WidgetRenderer.tsx (add validation)
└── lib/utils/
    └── validate-widget.ts
```

**Acceptance Criteria:**
- [ ] AC1: Zod schemas defined for all widget types (TaskCard, ProjectStatus, Metrics, Alert, Activity)
- [ ] AC2: Validation runs before widget render
- [ ] AC3: Invalid data shows fallback UI, not crash
- [ ] AC4: Validation errors logged with widget type and data shape
- [ ] AC5: Unit tests for all widget schemas

**Points:** 5

---

### Story DM-08.2: Implement Dashboard Data Caching

**Problem:** Dashboard data fetched on every render without caching, causing unnecessary A2A calls.

**Root Cause (from DM-03 Retrospective):**
- No caching layer between frontend and A2A endpoints
- Repeated requests for same data within short windows

**Implementation:**
- Add short TTL cache (5-10 seconds) for dashboard data
- Use React Query or SWR for automatic cache management
- Implement cache key strategy per workspace/user
- Add cache invalidation on relevant events
- Consider stale-while-revalidate pattern

**Cache Strategy:**
```typescript
// Cache keys by workspace and data type
const cacheKey = `dashboard:${workspaceId}:${dataType}`;

// SWR configuration
const { data } = useSWR(cacheKey, fetcher, {
  refreshInterval: 10000, // 10s TTL
  revalidateOnFocus: false,
  dedupingInterval: 5000,
});
```

**Files to Create/Modify:**
```
apps/web/src/
├── lib/cache/
│   └── dashboard-cache.ts
├── hooks/
│   └── useDashboardData.ts (refactor to use cache)
└── providers/
    └── CacheProvider.tsx
```

**Acceptance Criteria:**
- [ ] AC1: Dashboard data cached with 5-10s TTL
- [ ] AC2: Repeated requests within TTL served from cache
- [ ] AC3: Cache scoped to workspace
- [ ] AC4: Manual refresh bypasses cache
- [ ] AC5: Network request count reduced by >50% in typical usage

**Points:** 5

---

### Story DM-08.3: Add Rate Limiting for A2A Endpoints

**Problem:** A2A endpoints lack rate limiting, risking abuse and resource exhaustion.

**Root Cause (from DM-03 Retrospective):**
- No per-workspace request limits
- No protection against burst traffic

**Implementation:**
- Add rate limiting middleware to A2A FastAPI routes
- Implement per-workspace limits (e.g., 100 req/min)
- Add rate limit headers in responses
- Return 429 Too Many Requests when exceeded
- Log rate limit violations for monitoring

**Rate Limit Configuration:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_workspace_id)

@router.post("/a2a/query")
@limiter.limit("100/minute")
async def a2a_query(request: Request, ...):
    ...
```

**Files to Create/Modify:**
```
agents/
├── api/
│   ├── middleware/
│   │   └── rate_limit.py
│   └── routes/
│       └── a2a.py (add rate limit decorators)
└── config/
    └── rate_limits.py
```

**Acceptance Criteria:**
- [ ] AC1: Rate limiting active on all A2A endpoints
- [ ] AC2: Limits configurable per endpoint
- [ ] AC3: 429 response with Retry-After header
- [ ] AC4: Rate limit headers (X-RateLimit-*) in responses
- [ ] AC5: Violations logged with workspace context

**Points:** 5

---

### Story DM-08.4: Create Reusable Async Mock Fixtures

**Problem:** Test files duplicate AsyncMock setup patterns, leading to inconsistency and bugs.

**Root Cause (from DM-06 Retrospective):**
- Same mock patterns recreated per test file
- Complex AsyncMock+MagicMock combinations error-prone

**Implementation:**
- Create shared fixture library for common async mocks
- Include patterns for: HTTP clients, Redis, database, A2A responses
- Add factory functions for customizing mock responses
- Document usage patterns

**Fixture Examples:**
```python
# conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock

@pytest.fixture
def mock_redis():
    """Reusable Redis mock with async methods."""
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    return redis

@pytest.fixture
def mock_a2a_client():
    """Reusable A2A client mock."""
    client = MagicMock()
    client.send_request = AsyncMock(return_value={'success': True})
    return client
```

**Files to Create/Modify:**
```
agents/
├── tests/
│   ├── conftest.py (shared fixtures)
│   └── fixtures/
│       ├── __init__.py
│       ├── async_mocks.py
│       ├── redis_mocks.py
│       └── a2a_mocks.py
```

**Acceptance Criteria:**
- [ ] AC1: Shared fixtures for Redis, HTTP, A2A, Database mocks
- [ ] AC2: Existing tests refactored to use fixtures
- [ ] AC3: Factory functions for custom mock responses
- [ ] AC4: Documentation in fixture docstrings
- [ ] AC5: No duplicate mock patterns in test files

**Points:** 5

---

### Story DM-08.5: Deduplicate Widget Type Constants

**Problem:** `WIDGET_TYPES` defined separately in frontend and backend, risking drift.

**Root Cause (from DM-03 Retrospective):**
- Frontend has TypeScript enum
- Backend has Python enum
- No single source of truth

**Implementation:**
- Create shared widget types definition
- Generate TypeScript types from OpenAPI/JSON Schema
- Or: Define in `@hyvve/shared` package, export to both
- Update all usages to reference shared definition
- Add validation that types match at build time

**Options:**
1. **OpenAPI First:** Define in `openapi.yaml`, generate types
2. **Shared Package:** Define in `@hyvve/shared`, import in Python via JSON
3. **Code Generation:** Single YAML file, generate both TS and Python

**Files to Modify:**
```
packages/shared/src/
└── widget-types.ts

agents/
└── models/
    └── widget_types.py

# Or use code generation:
codegen/
└── widget-types.yaml → generates both
```

**Acceptance Criteria:**
- [ ] AC1: Single source of truth for widget types
- [ ] AC2: Frontend imports shared types
- [ ] AC3: Backend imports/validates against same types
- [ ] AC4: Build-time validation prevents drift
- [ ] AC5: Adding new widget type requires one change

**Points:** 5

---

### Story DM-08.6: Optimize Zustand Selectors

**Problem:** Selectors create new arrays/objects on each call, causing unnecessary re-renders.

**Issues (from DM-04 Retrospective):**
- TD-11: `useAlerts` creates new filtered array each call
- TD-12: `useAgentStateWidget` rebuilds object instead of selecting

**Implementation:**
- Refactor `useAlerts` to use memoized selector
- Refactor `useAgentStateWidget` to select from store directly
- Apply Zustand selector best practices
- Add state bounds for metrics (TD-14: MAX_METRICS limit)

**Before/After:**
```typescript
// BEFORE (TD-11) - Creates new array each call
const useAlerts = () => useDashboardStore(
  (state) => state.alerts.filter(a => !a.dismissed)
);

// AFTER - Memoized with shallow compare
const useAlerts = () => useDashboardStore(
  useCallback((state) => state.activeAlerts, []),
  shallow
);
// Pre-compute activeAlerts in store when alerts change
```

**Files to Modify:**
```
apps/web/src/
├── stores/
│   └── dashboard-store.ts
└── hooks/
    ├── useAlerts.ts
    └── useAgentStateWidget.ts
```

**Acceptance Criteria:**
- [ ] AC1: `useAlerts` uses memoized selector
- [ ] AC2: `useAgentStateWidget` selects without rebuilding
- [ ] AC3: MAX_METRICS constant added (consistent with MAX_ALERTS, MAX_ACTIVITIES)
- [ ] AC4: Re-render count reduced (measurable via React DevTools)
- [ ] AC5: No regression in component behavior

**Points:** 5

---

### Story DM-08.7: Add Response Parser Schema Validation

**Problem:** Agent response parsers (Navi, Pulse, Herald) don't validate data, risking corrupt state.

**Root Cause (from DM-04 Retrospective):**
- Responses from A2A trusted without schema validation
- Invalid data could corrupt frontend state

**Implementation:**
- Add Pydantic schemas for each agent's response format
- Validate responses in parser before state updates
- Handle validation failures gracefully (log, use defaults)
- Mirror frontend Zod schemas (DM-08.1) on backend

**Schema Examples:**
```python
from pydantic import BaseModel, validator

class PulseVitalsResponse(BaseModel):
    """Pulse agent vitals response."""
    cpu_usage: float
    memory_usage: float
    active_tasks: int
    health_score: float

    @validator('health_score')
    def validate_health(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Health score must be 0-100')
        return v
```

**Files to Create/Modify:**
```
agents/
├── pm/
│   └── schemas/
│       ├── navi_response.py
│       ├── pulse_response.py
│       └── herald_response.py
└── gateway/
    └── parsers.py (add validation)
```

**Acceptance Criteria:**
- [ ] AC1: Pydantic schemas for Navi, Pulse, Herald responses
- [ ] AC2: All responses validated before processing
- [ ] AC3: Validation failures logged with context
- [ ] AC4: Invalid responses don't corrupt state
- [ ] AC5: Schema tests with valid/invalid examples

**Points:** 5

---

## Total Points: 35

## Dependencies

- DM-07 (Infrastructure must be stable first)

## Technical Notes

### Zustand Selector Best Practices

```typescript
import { shallow } from 'zustand/shallow';

// Use shallow comparison for object/array selectors
const useWidgetData = (widgetId: string) =>
  useDashboardStore(
    useCallback(
      (state) => state.widgets[widgetId],
      [widgetId]
    ),
    shallow
  );

// Pre-compute derived state in store
set((state) => ({
  alerts: newAlerts,
  activeAlerts: newAlerts.filter(a => !a.dismissed), // Pre-computed
}));
```

### Cache Invalidation Strategy

```typescript
// Invalidate on relevant mutations
const queryClient = useQueryClient();

const updateProject = useMutation({
  mutationFn: updateProjectApi,
  onSuccess: () => {
    queryClient.invalidateQueries(['dashboard', workspaceId]);
  },
});
```

## Risks

1. **Cache Staleness** - Users may see outdated data
2. **Rate Limit Tuning** - Too aggressive limits may impact legitimate use
3. **Selector Refactoring** - May surface hidden re-render bugs

## Success Criteria

- Widget rendering resilient to malformed data
- Dashboard load time improved by caching
- A2A endpoints protected from abuse
- Test velocity improved with shared fixtures
- No more "works on my machine" due to type drift

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Source document
- [DM-03 Retrospective](epic-dm-03-retrospective.md) - REC-01, REC-02, REC-03, TD-07
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - TD-11, TD-12, TD-13, TD-14
- [DM-06 Retrospective](epic-dm-06-retrospective.md) - REC-05
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/prevent-rerenders-with-use-shallow)
