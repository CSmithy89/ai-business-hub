# Epic DM-08 Technical Specification: Quality & Performance Hardening

**Epic:** DM-08
**Phase:** 7 - Tech Debt & Stabilization
**Stories:** 7
**Points:** 35
**Dependencies:** DM-07 (Infrastructure Stabilization) - Complete
**Source:** tech-debt-consolidated.md Sprint 2

---

## Executive Summary

This epic implements data validation, caching, rate limiting, and performance optimizations to harden the system for production reliability. Focus areas:

1. **Data Integrity** - Zod/Pydantic validation at system boundaries
2. **Performance** - Dashboard caching and selector optimization
3. **Stability** - A2A rate limiting per workspace
4. **Developer Experience** - Reusable async mock fixtures
5. **Consistency** - Single source of truth for widget types

---

## Architecture Overview

### Data Flow with Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────────┐ │
│  │ React Query │───▶│ Dashboard    │───▶│ Widget Renderer         │ │
│  │ Cache (SWR) │    │ Cache Layer  │    │ + Zod Validation        │ │
│  │ 5-10s TTL   │    │              │    │ (DM-08.1)               │ │
│  └─────────────┘    └──────────────┘    └─────────────────────────┘ │
│        │                   │                      │                  │
│        │                   │                      ▼                  │
│        │                   │            ┌─────────────────────────┐ │
│        │                   │            │ Zustand Store           │ │
│        │                   │            │ (optimized selectors)   │ │
│        │                   │            │ (DM-08.6)               │ │
│        │                   │            └─────────────────────────┘ │
│        │                   │                                        │
└────────┼───────────────────┼────────────────────────────────────────┘
         │                   │
         ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (NestJS)                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Rate Limiting Middleware                      ││
│  │                    (per-workspace, 100 req/min)                  ││
│  │                    (DM-08.3)                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTS (Python/FastAPI)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐ │
│  │ Rate Limiter    │───▶│ Agent Handlers  │───▶│ Response Parser  │ │
│  │ (slowapi)       │    │ (Navi, Pulse,   │    │ + Pydantic       │ │
│  │ (DM-08.3)       │    │  Herald)        │    │ Validation       │ │
│  └─────────────────┘    └─────────────────┘    │ (DM-08.7)        │ │
│                                                 └──────────────────┘ │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Shared Widget Types                           ││
│  │                    (single source of truth)                      ││
│  │                    (DM-08.5)                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Test Fixtures Library                         ││
│  │                    (async mocks, redis, a2a)                     ││
│  │                    (DM-08.4)                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Story Technical Specifications

### DM-08.1: Zod Widget Validation

**Objective:** Validate widget data at the render boundary to prevent runtime crashes.

**Technical Approach:**

1. **Schema Definitions** - Create Zod schemas in `apps/web/src/lib/schemas/widget-schemas.ts`
2. **Validation Utility** - Add `validateWidgetData(type, data)` function
3. **Integration Point** - Call validation in `WidgetRenderer.tsx` before render
4. **Error Handling** - Show `ErrorWidget` with validation failure details

**Key Files:**
```
apps/web/src/
├── lib/schemas/
│   └── widget-schemas.ts       # NEW - Zod schemas for all widgets
├── lib/utils/
│   └── validate-widget.ts      # NEW - Validation utility
└── components/widgets/
    └── WidgetRenderer.tsx      # MODIFY - Add validation call
```

**Schema Pattern:**
```typescript
import { z } from 'zod';

// Base widget data schema
export const BaseWidgetDataSchema = z.object({
  timestamp: z.string().datetime().optional(),
});

// Widget-specific schemas
export const TaskCardDataSchema = BaseWidgetDataSchema.extend({
  taskId: z.string(),
  title: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignee: z.string().optional(),
});

export const MetricsDataSchema = BaseWidgetDataSchema.extend({
  value: z.number(),
  label: z.string(),
  trend: z.enum(['up', 'down', 'stable']).optional(),
  previousValue: z.number().optional(),
});

// Schema registry by widget type
export const WIDGET_SCHEMAS: Record<string, z.ZodSchema> = {
  task_card: TaskCardDataSchema,
  metrics: MetricsDataSchema,
  // ... other widgets
};
```

**Validation Pattern:**
```typescript
export function validateWidgetData<T>(
  type: string,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const schema = WIDGET_SCHEMAS[type];
  if (!schema) {
    return { success: true, data: data as T }; // Unknown types pass through
  }
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data as T }
    : { success: false, error: result.error };
}
```

---

### DM-08.2: Dashboard Data Caching

**Objective:** Reduce A2A request frequency with short-lived cache.

**Technical Approach:**

1. **Cache Strategy** - Use React Query (already installed) with 5-10s staleTime
2. **Cache Keys** - Scope by workspace: `['dashboard', workspaceId, dataType]`
3. **Invalidation** - On user action or WebSocket event
4. **Deduplication** - Prevent concurrent identical requests

**Key Files:**
```
apps/web/src/
├── lib/cache/
│   └── dashboard-cache.ts      # NEW - Cache configuration
├── hooks/
│   └── useDashboardData.ts     # MODIFY - Use cached fetcher
└── providers/
    └── QueryProvider.tsx       # MODIFY - Configure defaults
```

**Cache Configuration:**
```typescript
// dashboard-cache.ts
export const DASHBOARD_CACHE_CONFIG = {
  staleTime: 10_000,        // 10s before data considered stale
  cacheTime: 60_000,        // 60s keep in cache after unmount
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 1,
};

export const getDashboardQueryKey = (workspaceId: string, dataType: string) =>
  ['dashboard', workspaceId, dataType] as const;
```

**Hook Pattern:**
```typescript
export function useDashboardData(workspaceId: string) {
  return useQuery({
    queryKey: getDashboardQueryKey(workspaceId, 'all'),
    queryFn: () => fetchDashboardData(workspaceId),
    ...DASHBOARD_CACHE_CONFIG,
  });
}
```

---

### DM-08.3: A2A Rate Limiting

**Objective:** Protect backend from request abuse with per-workspace limits.

**Technical Approach:**

1. **Library** - Use `slowapi` for FastAPI rate limiting
2. **Key Function** - Rate limit by workspace ID (from auth context)
3. **Limits** - 100 requests/minute per workspace (configurable)
4. **Headers** - Return `X-RateLimit-*` headers for client awareness

**Key Files:**
```
agents/
├── api/
│   ├── middleware/
│   │   └── rate_limit.py       # NEW - Rate limit setup
│   └── routes/
│       └── a2a.py              # MODIFY - Add decorators
└── config/
    └── rate_limits.py          # NEW - Limit configuration
```

**Rate Limit Setup:**
```python
# rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

def get_workspace_id(request: Request) -> str:
    """Extract workspace ID from request for rate limiting."""
    # From auth header or request body
    workspace_id = request.headers.get("x-workspace-id")
    if not workspace_id:
        # Fallback to IP-based limiting
        return get_remote_address(request)
    return f"workspace:{workspace_id}"

limiter = Limiter(key_func=get_workspace_id)

# rate_limits.py
RATE_LIMITS = {
    "a2a_query": "100/minute",
    "a2a_discover": "30/minute",
    "a2a_health": "300/minute",
}
```

**Route Decorator:**
```python
from agents.api.middleware.rate_limit import limiter
from agents.config.rate_limits import RATE_LIMITS

@router.post("/a2a/query")
@limiter.limit(RATE_LIMITS["a2a_query"])
async def a2a_query(request: Request, query: A2AQueryRequest):
    ...
```

---

### DM-08.4: Async Mock Fixtures

**Objective:** Create reusable test fixtures for consistent async mocking.

**Technical Approach:**

1. **Fixture Location** - `agents/tests/fixtures/`
2. **Coverage** - Redis, HTTP client, A2A client, database
3. **Factory Pattern** - Allow customization of mock responses
4. **Documentation** - Comprehensive docstrings

**Key Files:**
```
agents/tests/
├── conftest.py                 # MODIFY - Import shared fixtures
└── fixtures/
    ├── __init__.py             # NEW - Export all fixtures
    ├── async_mocks.py          # NEW - Generic async patterns
    ├── redis_mocks.py          # NEW - Redis-specific
    ├── a2a_mocks.py            # NEW - A2A client mocks
    └── database_mocks.py       # NEW - DB session mocks
```

**Fixture Patterns:**
```python
# async_mocks.py
from unittest.mock import AsyncMock, MagicMock
import pytest

@pytest.fixture
def async_mock_factory():
    """Factory for creating async mocks with custom return values."""
    def _factory(return_value=None, side_effect=None):
        mock = AsyncMock()
        if return_value is not None:
            mock.return_value = return_value
        if side_effect is not None:
            mock.side_effect = side_effect
        return mock
    return _factory

# redis_mocks.py
@pytest.fixture
def mock_redis():
    """Reusable Redis mock with async methods."""
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    redis.exists = AsyncMock(return_value=0)
    redis.expire = AsyncMock(return_value=True)
    redis.incr = AsyncMock(return_value=1)
    redis.pipeline = MagicMock(return_value=MagicMock(
        execute=AsyncMock(return_value=[True, True])
    ))
    return redis
```

---

### DM-08.5: Widget Type Deduplication

**Objective:** Create single source of truth for widget types.

**Technical Approach:**

1. **Source of Truth** - Define in `packages/shared/src/widget-types.ts`
2. **TypeScript** - Export types and enum from shared package
3. **Python** - Generate or sync from TypeScript definition
4. **Build Validation** - Add check that types match

**Key Files:**
```
packages/shared/src/
├── widget-types.ts             # NEW/MODIFY - Canonical definition
└── index.ts                    # MODIFY - Export widget types

agents/
└── models/
    └── widget_types.py         # MODIFY - Import from shared

scripts/
└── validate-widget-types.ts    # NEW - Build-time validation
```

**Shared Definition:**
```typescript
// packages/shared/src/widget-types.ts
export const WIDGET_TYPES = {
  TASK_CARD: 'task_card',
  PROJECT_STATUS: 'project_status',
  METRICS: 'metrics',
  ALERT: 'alert',
  ACTIVITY: 'activity',
  PROGRESS: 'progress',
  TEXT: 'text',
  ERROR: 'error',
  LOADING: 'loading',
} as const;

export type WidgetType = typeof WIDGET_TYPES[keyof typeof WIDGET_TYPES];

// For Python sync - export as JSON-compatible format
export const WIDGET_TYPES_LIST = Object.values(WIDGET_TYPES);
```

**Python Sync Strategy:**
```python
# widget_types.py
from enum import Enum
import json
from pathlib import Path

# Read from shared package at import time (or during build)
SHARED_TYPES_PATH = Path(__file__).parent.parent.parent.parent / \
    "packages/shared/dist/widget-types.json"

class WidgetType(str, Enum):
    TASK_CARD = "task_card"
    PROJECT_STATUS = "project_status"
    METRICS = "metrics"
    ALERT = "alert"
    ACTIVITY = "activity"
    PROGRESS = "progress"
    TEXT = "text"
    ERROR = "error"
    LOADING = "loading"
```

---

### DM-08.6: Zustand Selector Optimization

**Objective:** Eliminate unnecessary re-renders from selector patterns.

**Technical Approach:**

1. **Pre-compute Derived State** - Store `activeAlerts` instead of filtering each call
2. **Shallow Comparison** - Use `shallow` from zustand for object/array selectors
3. **Memoized Callbacks** - Wrap selectors in `useCallback`
4. **MAX_METRICS** - Add bounds to prevent unbounded state growth

**Key Files:**
```
apps/web/src/
├── stores/
│   └── dashboard-store.ts      # MODIFY - Pre-compute derived state
└── hooks/
    ├── useAlerts.ts            # MODIFY - Optimized selector
    └── useAgentStateWidget.ts  # MODIFY - Direct selection
```

**Optimized Patterns:**

```typescript
// dashboard-store.ts
interface DashboardState {
  alerts: Alert[];
  activeAlerts: Alert[];  // Pre-computed
  metrics: Metric[];
  // ...
}

// MAX bounds
const MAX_ALERTS = 50;
const MAX_ACTIVITIES = 100;
const MAX_METRICS = 50;  // NEW - DM-08.6

const useDashboardStore = create<DashboardState>((set) => ({
  alerts: [],
  activeAlerts: [],

  addAlert: (alert) => set((state) => {
    const newAlerts = [...state.alerts, alert].slice(-MAX_ALERTS);
    return {
      alerts: newAlerts,
      activeAlerts: newAlerts.filter(a => !a.dismissed),  // Pre-compute
    };
  }),

  addMetric: (metric) => set((state) => ({
    metrics: [...state.metrics, metric].slice(-MAX_METRICS),
  })),
}));

// useAlerts.ts - OPTIMIZED
import { shallow } from 'zustand/shallow';

export const useAlerts = () => useDashboardStore(
  (state) => state.activeAlerts,  // Direct selection, no filter
  shallow
);

// useAgentStateWidget.ts - OPTIMIZED
export const useAgentStateWidget = (widgetId: string) => useDashboardStore(
  useCallback((state) => state.widgets[widgetId], [widgetId]),
  shallow
);
```

---

### DM-08.7: Response Parser Validation

**Objective:** Validate agent responses with Pydantic before state updates.

**Technical Approach:**

1. **Schema Location** - `agents/{module}/schemas/` per agent
2. **Validation Point** - In parser functions before returning data
3. **Error Handling** - Log and return safe defaults on validation failure
4. **Mirror Frontend** - Schemas should align with Zod schemas from DM-08.1

**Key Files:**
```
agents/
├── pm/
│   └── schemas/
│       ├── __init__.py         # NEW
│       ├── navi_response.py    # NEW
│       ├── pulse_response.py   # NEW
│       └── herald_response.py  # NEW
└── gateway/
    └── parsers.py              # MODIFY - Add validation
```

**Schema Patterns:**
```python
# pulse_response.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class VitalsMetric(BaseModel):
    """Single vital metric from Pulse agent."""
    name: str
    value: float
    unit: str = ""
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None

class PulseVitalsResponse(BaseModel):
    """Complete vitals response from Pulse agent."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    cpu_usage: float = Field(ge=0, le=100)
    memory_usage: float = Field(ge=0, le=100)
    active_tasks: int = Field(ge=0)
    health_score: float = Field(ge=0, le=100)
    metrics: List[VitalsMetric] = []

    @validator('health_score')
    def validate_health(cls, v):
        return round(v, 2)  # Normalize to 2 decimal places

# parsers.py
from agents.pm.schemas.pulse_response import PulseVitalsResponse

def parse_pulse_response(raw_data: dict) -> dict:
    """Parse and validate Pulse agent response."""
    try:
        validated = PulseVitalsResponse(**raw_data)
        return validated.dict()
    except ValidationError as e:
        logger.warning(f"Pulse response validation failed: {e}")
        return get_default_vitals()
```

---

## Test Strategy

### Unit Tests

| Story | Test Focus | Files |
|-------|------------|-------|
| DM-08.1 | Schema validation pass/fail cases | `widget-schemas.test.ts` |
| DM-08.2 | Cache hit/miss, invalidation | `dashboard-cache.test.ts` |
| DM-08.3 | Rate limit enforcement | `test_rate_limit.py` |
| DM-08.4 | Fixture behavior verification | `test_fixtures.py` |
| DM-08.5 | Type sync validation | `validate-widget-types.test.ts` |
| DM-08.6 | Selector re-render counting | `dashboard-store.test.ts` |
| DM-08.7 | Response validation | `test_parsers.py` |

### Integration Tests

- Cache integration with React Query
- Rate limiting with real Redis
- End-to-end widget rendering with validation

---

## Performance Metrics

| Metric | Current | Target | Story |
|--------|---------|--------|-------|
| Dashboard API calls/min | ~60 | <20 | DM-08.2 |
| Widget render errors | Unknown | 0 crashes | DM-08.1 |
| Component re-renders | High | 50% reduction | DM-08.6 |
| Test setup time | Variable | Consistent | DM-08.4 |

---

## Risk Mitigation

| Risk | Mitigation | Story |
|------|------------|-------|
| Cache staleness | Short TTL (5-10s), manual refresh option | DM-08.2 |
| Rate limit too aggressive | Start conservative, tune based on metrics | DM-08.3 |
| Selector refactoring breaks behavior | Comprehensive component tests first | DM-08.6 |
| Type sync drift | Build-time validation script | DM-08.5 |

---

## Success Criteria

1. **Zero widget render crashes** from malformed data
2. **50% reduction** in dashboard API calls
3. **A2A endpoints protected** with rate limiting
4. **Single source of truth** for widget types
5. **All tests use shared fixtures** (no duplicate mock patterns)
6. **Measurable re-render reduction** in React DevTools

---

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md)
- [Epic DM-08 Requirements](./epic-dm-08-quality-performance.md)
- [DM-03 Retrospective](./epic-dm-03-retrospective.md) - Source for REC-01, REC-02, REC-03
- [DM-04 Retrospective](../retrospectives/epic-dm-04-retro-2025-12-30.md) - Source for TD-11, TD-12, TD-13, TD-14
- [DM-06 Retrospective](./epic-dm-06-retrospective.md) - Source for REC-05
- [Zustand Best Practices](https://docs.pmnd.rs/zustand/guides/prevent-rerenders-with-use-shallow)
