# Epic 14: Testing & Observability - Technical Specification

**Date:** 2025-12-06
**Epic:** EPIC-14
**Author:** Development Team
**Status:** Draft
**Version:** 1.0

---

## Executive Summary

Epic 14 closes critical testing gaps identified in retrospectives from Epic 00-12 and establishes production-grade observability infrastructure. This epic is divided into two parallel tracks:

1. **Testing Track** (Stories 14.1-14.3, 14.6, 14.9-14.18): Close testing gaps
2. **Observability Track** (Stories 14.4-14.5, 14.7-14.8): Production monitoring and operational readiness

**Total:** 18 stories, 38 points
**Parallel Execution Possible:** Stories with no dependencies can run in parallel

---

## Architecture Overview

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Testing Stack                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Unit Tests (Jest + Vitest)                                        │
│  ├── Zustand Store Tests (Story 14.2)                             │
│  │   └── apps/web/src/store/__tests__/                            │
│  ├── Agent Client Tests (Story 14.9)                              │
│  │   └── apps/web/src/lib/__tests__/agent-client.test.ts         │
│  └── Utility Tests (existing)                                      │
│                                                                     │
│  Integration Tests (Vitest + Redis Testcontainers)                │
│  ├── Rate Limit Concurrency (Story 14.1)                          │
│  │   └── apps/web/src/__tests__/rate-limit.test.ts               │
│  ├── CSRF Flow (Story 14.6)                                       │
│  │   └── apps/web/src/__tests__/csrf-integration.test.ts         │
│  ├── File Upload Pipeline (Story 14.3)                            │
│  │   └── apps/web/src/__tests__/file-upload.test.ts              │
│  └── Quick Actions + CSRF (Story 14.13)                           │
│      └── apps/web/src/__tests__/quick-actions-csrf.test.ts        │
│                                                                     │
│  E2E Tests (Playwright)                                            │
│  └── OAuth Flow Tests (Story 14.18)                               │
│      └── apps/web/tests/e2e/oauth-flow.spec.ts                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Observability Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Production Observability                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Prometheus Metrics (Story 14.4)                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ GET /api/metrics (NestJS)                                    │  │
│  │                                                               │  │
│  │ event_bus_throughput_total                                   │  │
│  │ event_bus_consumer_lag                                       │  │
│  │ event_bus_dlq_size                                           │  │
│  │ http_request_duration_seconds (histogram)                    │  │
│  │ http_requests_total                                          │  │
│  │ approval_queue_depth                                         │  │
│  │ ai_provider_health{provider="..."}                           │  │
│  │ active_websocket_connections                                 │  │
│  │ agent_api_requests_total{team="..."}                         │  │
│  │ agent_api_rate_limit_hits{team="..."}                        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                        │                                            │
│                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   Grafana Dashboards                         │  │
│  │  - Event Bus Health                                          │  │
│  │  - API Performance                                           │  │
│  │  - Approval Queue Status                                     │  │
│  │  - AI Provider Status                                        │  │
│  │  - Agent API Metrics                                         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Operational Runbooks (Story 14.5)                                 │
│  └── docs/runbooks/                                                │
│      ├── dlq-management.md                                         │
│      ├── database-recovery.md                                      │
│      ├── incident-response.md                                      │
│      └── key-rotation.md                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Decision Records

### ADR-14.1: Vitest for Frontend Tests

**Context:** Need to test Zustand stores, agent client, and integration scenarios.

**Decision:** Use Vitest for all frontend tests (unit + integration).

**Rationale:**
- Native ESM support (Next.js 15 is ESM-first)
- Faster than Jest for modern TypeScript
- Compatible with existing test infrastructure
- Better for testing modern React patterns

**Consequences:**
- Consistent test runner for web app
- Faster test execution
- May need Vitest migration for existing Jest tests (future work)

---

### ADR-14.2: Testcontainers for Redis Integration Tests

**Context:** Rate limit tests need real Redis behavior (concurrency, sliding window).

**Decision:** Use `@testcontainers/redis` for integration tests.

**Rationale:**
- Real Redis instance for accurate testing
- No need for mocking complex Redis commands
- Isolated test environment
- Automatic cleanup

**Consequences:**
- Requires Docker in CI/CD
- Slightly slower tests (container startup)
- More reliable than mocks

---

### ADR-14.3: prom-client for Metrics Export

**Context:** Need Prometheus-compatible metrics endpoint.

**Decision:** Use `prom-client` for NestJS metrics.

**Rationale:**
- Industry standard for Node.js Prometheus integration
- Supports histograms, gauges, counters
- Easy Grafana integration
- Active maintenance

**Consequences:**
- Prometheus-specific format (vendor lock-in)
- Need Prometheus/Grafana for visualization
- Standard observability stack

---

### ADR-14.4: Python rate-limiters for Agent Endpoints

**Context:** Agent endpoints (FastAPI) need rate limiting.

**Decision:** Use `slowapi` (Flask-Limiter for FastAPI) with Redis backend.

**Rationale:**
- FastAPI-native rate limiting library
- Redis-backed for distributed rate limiting
- Decorator-based API (@limiter.limit)
- Consistent with NestJS approach

**Consequences:**
- Requires Redis connection in agent service
- Simple integration with existing Redis infrastructure

---

### ADR-14.5: Zod for Runtime Validation

**Context:** Agent responses need runtime validation for type safety.

**Decision:** Use Zod schemas for agent API response validation.

**Rationale:**
- TypeScript-first validation
- Already used elsewhere in codebase
- Runtime + compile-time type safety
- Excellent error messages

**Consequences:**
- Schemas must be kept in sync with Python API
- Validation overhead (minimal)

---

## Testing Strategy

### Story 14.1: Rate Limit Concurrency Tests

**Test Approach:** Integration tests with real Redis

**File:** `apps/web/src/__tests__/rate-limit.test.ts`

**Test Cases:**
1. **Concurrent Requests** - Send 100 requests in parallel, verify rate limit enforced
2. **Sliding Window** - Test that limits reset after window expires
3. **Rate Limit Headers** - Verify `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
4. **DDoS Simulation** - Test with 1000+ concurrent requests
5. **Multi-User** - Verify per-user rate limiting (different users isolated)

**Dependencies:**
- `@upstash/ratelimit` (already installed - Epic 10)
- `@testcontainers/redis` (NEW)
- `vitest` (already installed)

**Example Test:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { RedisContainer } from '@testcontainers/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

describe('Rate Limit Concurrency', () => {
  let redisContainer: RedisContainer
  let redis: Redis

  beforeAll(async () => {
    redisContainer = await new RedisContainer().start()
    redis = new Redis({
      url: redisContainer.getConnectionUrl(),
    })
  })

  afterAll(async () => {
    await redisContainer.stop()
  })

  it('should enforce rate limit under concurrent load', async () => {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
    })

    // Send 100 concurrent requests
    const results = await Promise.all(
      Array(100).fill(null).map(() => limiter.limit('test-user'))
    )

    const allowed = results.filter(r => r.success).length
    const blocked = results.filter(r => !r.success).length

    expect(allowed).toBe(10) // Only 10 allowed
    expect(blocked).toBe(90) // Rest blocked
  })
})
```

---

### Story 14.2: Zustand Store Unit Tests

**Test Approach:** Unit tests with state assertions

**File:** `apps/web/src/store/__tests__/ui-store.test.ts`

**Test Cases:**
1. **Sidebar Toggle** - Verify collapsed state transitions
2. **Theme Toggle** - Verify light/dark mode switches
3. **Command Palette** - Test open/close state
4. **Notification State** - Test notification management
5. **localStorage Persistence** - Verify hydration on mount
6. **Chat Panel Toggle** - Test chat panel state

**Dependencies:**
- `vitest` (already installed)
- `zustand` (already installed)

**Example Test:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUIStore } from '../ui-store'

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarCollapsed: false })
  })

  it('should toggle sidebar collapsed state', () => {
    const { result } = renderHook(() => useUIStore())

    expect(result.current.sidebarCollapsed).toBe(false)

    act(() => {
      result.current.toggleSidebar()
    })

    expect(result.current.sidebarCollapsed).toBe(true)
  })

  it('should toggle theme', () => {
    const { result } = renderHook(() => useUIStore())

    expect(result.current.theme).toBe('light')

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
  })
})
```

---

### Story 14.3: File Upload Pipeline Tests

**Test Approach:** Integration tests with fixture files

**File:** `apps/web/src/__tests__/file-upload.test.ts`

**Test Cases:**
1. **PDF Upload** - Upload sample.pdf, verify text extraction
2. **DOCX Upload** - Upload sample.docx, verify text extraction
3. **File Size Limit** - Reject files over 10MB
4. **File Type Validation** - Reject non-PDF/DOCX files
5. **Upload Progress** - Test progress tracking
6. **Multiple Files** - Upload multiple documents in sequence

**Fixtures:**
- `apps/web/src/__tests__/fixtures/sample.pdf`
- `apps/web/src/__tests__/fixtures/sample.docx`

**Dependencies:**
- `vitest` (already installed)
- `pdf-parse` (already installed)
- `mammoth` (already installed)

---

### Story 14.6: CSRF Integration Tests

**Test Approach:** Integration tests with full CSRF flow

**Files:**
- `apps/web/src/__tests__/csrf-integration.test.ts`
- `apps/web/src/__tests__/quick-actions-csrf.test.ts`

**Test Cases:**
1. **Full CSRF Flow** - Fetch token → Use on protected endpoint
2. **Expired Token** - Token older than 1 hour rejected
3. **Invalid Token** - Random token rejected with 403
4. **Missing Token** - No token returns 403
5. **Session Change** - Token invalidated when session changes
6. **Concurrent Requests** - Same token works for concurrent calls
7. **Quick Actions** - Approve/reject with CSRF validation
8. **Auto Refresh** - Token automatically refreshed on expiry

**Dependencies:**
- `vitest` (already installed)
- `@hyvve/db` (existing)

---

### Story 14.9: Agent Client Unit Tests

**Test Approach:** Unit tests with mocked fetch

**File:** `apps/web/src/lib/__tests__/agent-client.test.ts`

**Test Cases:**
1. **Successful Request** - runValidation with 200 response
2. **Network Error** - Timeout, connection refused
3. **Timeout** - Request exceeds 30s timeout
4. **JSON Parse Error** - Invalid JSON response
5. **HTTP Errors** - 401, 403, 500 responses
6. **All Teams** - Test validation, planning, branding clients

**Dependencies:**
- `vitest` (already installed)
- `msw` (Mock Service Worker) (NEW)

**Example Test:**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { agentClient, AgentAPIError } from '../agent-client'

describe('AgentClient', () => {
  it('should successfully run validation', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        content: 'Validation complete',
        session_id: 'sess_123',
        metadata: { business_id: 'biz_123', team: 'validation' }
      })
    })

    const response = await agentClient.runValidation({
      message: 'Test message',
      business_id: 'biz_123'
    })

    expect(response.success).toBe(true)
    expect(response.content).toBe('Validation complete')
  })

  it('should handle network timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AbortError')), 100)
      )
    )

    await expect(
      agentClient.runValidation({
        message: 'Test',
        business_id: 'biz_123'
      })
    ).rejects.toThrow(AgentAPIError)
  })
})
```

---

## Observability Architecture

### Story 14.4: Prometheus Metrics Export

**Architecture:**

```
NestJS App
    │
    ├── MetricsModule
    │   ├── MetricsController (/api/metrics)
    │   ├── MetricsService
    │   └── Collectors
    │       ├── EventBusCollector
    │       ├── ApprovalQueueCollector
    │       ├── AIProviderCollector
    │       └── WebSocketCollector
    │
    └── Prometheus /metrics endpoint
```

**Metrics to Export:**

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `event_bus_throughput_total` | Counter | `stream` | Total events published |
| `event_bus_consumer_lag` | Gauge | `consumer_group` | Consumer lag in events |
| `event_bus_dlq_size` | Gauge | - | Dead letter queue size |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Request latency |
| `http_requests_total` | Counter | `method`, `route`, `status` | Total HTTP requests |
| `approval_queue_depth` | Gauge | `status` | Approval items by status |
| `ai_provider_health` | Gauge | `provider` | AI provider health (1=healthy, 0=unhealthy) |
| `active_websocket_connections` | Gauge | - | Active WebSocket connections |
| `agent_api_requests_total` | Counter | `team`, `status` | Agent API calls |
| `agent_api_rate_limit_hits` | Counter | `team` | Rate limit blocks on agent APIs |

**Implementation:**

```typescript
// apps/api/src/metrics/metrics.module.ts
import { Module } from '@nestjs/common'
import { MetricsController } from './metrics-controller'
import { MetricsService } from './metrics-service'
import { EventsModule } from '../events'
import { ApprovalsModule } from '../approvals'
import { AIProvidersModule } from '../ai-providers'

@Module({
  imports: [EventsModule, ApprovalsModule, AIProvidersModule],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

```typescript
// apps/api/src/metrics/metrics-service.ts
import { Injectable } from '@nestjs/common'
import * as promClient from 'prom-client'

@Injectable()
export class MetricsService {
  private readonly register: promClient.Registry

  // Counters
  public readonly eventBusThroughput: promClient.Counter
  public readonly httpRequestsTotal: promClient.Counter
  public readonly agentApiRequests: promClient.Counter
  public readonly agentRateLimitHits: promClient.Counter

  // Gauges
  public readonly eventBusLag: promClient.Gauge
  public readonly eventBusDLQSize: promClient.Gauge
  public readonly approvalQueueDepth: promClient.Gauge
  public readonly aiProviderHealth: promClient.Gauge
  public readonly activeWebSockets: promClient.Gauge

  // Histograms
  public readonly httpRequestDuration: promClient.Histogram

  constructor() {
    this.register = new promClient.Registry()

    // Register default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register })

    // Initialize custom metrics
    this.eventBusThroughput = new promClient.Counter({
      name: 'event_bus_throughput_total',
      help: 'Total events published to event bus',
      labelNames: ['stream'],
      registers: [this.register],
    })

    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register],
    })

    // ... initialize other metrics
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics()
  }
}
```

**Dependencies:**
- `prom-client` (NEW - install via `pnpm add prom-client`)

---

### Story 14.5: Operational Runbooks

**Runbook Structure:**

```
docs/runbooks/
├── README.md                  # Index with quick links
├── dlq-management.md          # Dead letter queue operations
├── database-recovery.md       # DB backup/restore
├── incident-response.md       # General incident handling
├── key-rotation.md            # Encryption key rotation
└── troubleshooting/
    ├── auth-failures.md
    ├── agent-errors.md
    └── performance-issues.md
```

**Template Structure:**

```markdown
# Runbook: [Topic]

## Overview
Brief description of the operational procedure.

## When to Use
Triggering conditions or scenarios.

## Prerequisites
- Access level required
- Tools needed
- Knowledge required

## Step-by-Step Procedure

### 1. [Step Name]
**Command:**
\`\`\`bash
command here
\`\`\`

**Expected Output:**
\`\`\`
output here
\`\`\`

**Troubleshooting:**
- If X happens, do Y

### 2. [Next Step]
...

## Verification
How to verify the operation succeeded.

## Rollback
How to undo if something goes wrong.

## Related Runbooks
- Link to related procedures
```

**Example Runbook (DLQ Management):**

```markdown
# Runbook: Dead Letter Queue Management

## Overview
Manage failed events in the Dead Letter Queue (DLQ).

## When to Use
- DLQ size alert triggered (threshold: 100 events)
- Manual investigation of failed events
- Replaying failed events after fix deployed

## Prerequisites
- Admin access to NestJS API
- Access to Redis CLI (optional)
- Understanding of event schema

## Step-by-Step Procedure

### 1. View DLQ Size
**Command:**
\`\`\`bash
curl https://api.hyvve.io/api/events/health
\`\`\`

**Expected Output:**
\`\`\`json
{
  "status": "healthy",
  "dlqSize": 45,
  "consumers": [...]
}
\`\`\`

### 2. Inspect Failed Events
**Command:**
\`\`\`bash
curl https://api.hyvve.io/api/events/dlq \
  -H "Authorization: Bearer $ADMIN_TOKEN"
\`\`\`

**Expected Output:**
\`\`\`json
{
  "data": [
    {
      "id": "evt_123",
      "type": "approval.requested",
      "failedAt": "2025-12-06T12:00:00Z",
      "error": "...",
      "data": {...}
    }
  ]
}
\`\`\`

### 3. Retry Failed Events
**Command:**
\`\`\`bash
curl -X POST https://api.hyvve.io/api/events/dlq/retry \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["evt_123", "evt_124"]}'
\`\`\`

### 4. Purge DLQ (DANGER)
**WARNING:** Only use after confirming events are no longer needed.

\`\`\`bash
curl -X DELETE https://api.hyvve.io/api/events/dlq \
  -H "Authorization: Bearer $ADMIN_TOKEN"
\`\`\`

## Verification
Check DLQ size reduced:
\`\`\`bash
curl https://api.hyvve.io/api/events/health | jq '.dlqSize'
\`\`\`

## Rollback
DLQ purge is irreversible. Retry can be stopped via queue pause.

## Related Runbooks
- Event Replay
- Incident Response
```

---

## Story Dependencies

### Dependency Graph

```
Epic 10 (Complete)
    ├── Story 14.1 (Rate Limit Tests) - Depends on Epic 10 Story 10.1
    ├── Story 14.6 (CSRF Tests) - Depends on Epic 10 Story 10.6
    └── Story 14.7 (Agent Rate Limiting) - Depends on Epic 10 Story 10.1

Epic 11 (Complete)
    ├── Story 14.7 (Agent Rate Limiting) - Depends on Epic 11 (Agent API)
    ├── Story 14.8 (Business Ownership) - Depends on Epic 11 (Agent API)
    ├── Story 14.9 (Agent Client Tests) - Depends on Epic 11 (Agent Client)
    └── Story 14.10 (Agent Response Validation) - Depends on Epic 11 (Agent Client)

No Dependencies (Can Start Immediately)
    ├── Story 14.2 (Zustand Store Tests)
    ├── Story 14.3 (File Upload Tests)
    ├── Story 14.4 (Prometheus Metrics)
    ├── Story 14.5 (Operational Runbooks)
    ├── Story 14.11 (API URL Centralization)
    ├── Story 14.12 (Optimistic Update Type Safety)
    ├── Story 14.13 (Approval Quick Actions Tests)
    ├── Story 14.14 (Countdown Timer Optimization)
    ├── Story 14.15 (Password Match Validation)
    ├── Story 14.16 (Error Boundary Monitoring)
    ├── Story 14.17 (Mock Data Extraction)
    └── Story 14.18 (OAuth E2E Tests)
```

### Parallel Execution Plan

**Phase 1 (No Dependencies):**
- 14.2, 14.3, 14.4, 14.5, 14.11-14.18 (13 stories in parallel)

**Phase 2 (After Epic 10/11):**
- 14.1, 14.6, 14.7, 14.8, 14.9, 14.10 (5 stories)

---

## Implementation Notes

### Story 14.7: Agent Endpoint Rate Limiting

**File:** `agents/middleware/rate_limit.py`

**Implementation:**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import redis

# Initialize Redis connection
redis_client = redis.from_url(os.getenv("REDIS_URL"))

# Initialize limiter with Redis backend
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL")
)

# Apply to FastAPI app in main.py
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Use decorator on endpoints
@app.post("/agents/validation/runs")
@limiter.limit("10/minute")  # 10 requests per minute per user
async def validation_run(request: Request, payload: AgentRequest):
    # ... implementation
    pass
```

**Dependencies:**
- `slowapi` (NEW - Python package)
- `redis` (already installed)

---

### Story 14.8: Business ID Ownership Validation

**File:** `agents/middleware/business_validator.py`

**Implementation:**

```python
from fastapi import Request, HTTPException, Depends
from jose import jwt
import os

async def validate_business_ownership(
    request: Request,
    business_id: str
) -> None:
    """
    Validate that the authenticated user owns the business.

    Raises:
        HTTPException: 403 if business_id doesn't belong to user's workspace
    """
    # Extract JWT from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = auth_header[7:]

    # Decode JWT (already verified by better-auth)
    try:
        claims = jwt.decode(
            token,
            os.getenv("BETTER_AUTH_SECRET"),
            algorithms=["HS256"]
        )
        user_id = claims.get("sub")
        workspace_id = claims.get("workspace_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Query database to verify business belongs to workspace
    # (Use SQLAlchemy or Prisma Python client)
    business = await db.business.find_unique(
        where={"id": business_id}
    )

    if not business or business.workspace_id != workspace_id:
        # Log unauthorized access attempt
        logger.warning(
            f"Unauthorized business access attempt",
            extra={
                "user_id": user_id,
                "workspace_id": workspace_id,
                "business_id": business_id
            }
        )
        raise HTTPException(
            status_code=403,
            detail="Business not found or access denied"
        )

# Apply to endpoints
@app.post("/agents/validation/runs")
async def validation_run(
    payload: AgentRequest,
    _: None = Depends(
        lambda: validate_business_ownership(request, payload.business_id)
    )
):
    # ... implementation
    pass
```

---

### Story 14.10: Agent Response Runtime Validation

**File:** `apps/web/src/lib/schemas/agent-response.ts`

**Implementation:**

```typescript
import { z } from 'zod'

export const TeamRunResponseSchema = z.object({
  success: z.boolean(),
  content: z.string().optional(),
  session_id: z.string(),
  agent_name: z.string().optional(),
  error: z.string().optional(),
  metadata: z.object({
    business_id: z.string(),
    team: z.string(),
    workspace_id: z.string().optional(),
  }).catchall(z.unknown()),
})

export type TeamRunResponse = z.infer<typeof TeamRunResponseSchema>
```

**Updated Agent Client:**

```typescript
// apps/web/src/lib/agent-client.ts

import { TeamRunResponseSchema, type TeamRunResponse } from './schemas/agent-response'

export class AgentClient {
  private async makeRequest(
    team: AgentTeam,
    request: AgentRequest
  ): Promise<AgentResponse> {
    // ... existing fetch logic

    // Validate response with Zod
    const parseResult = TeamRunResponseSchema.safeParse(data)

    if (!parseResult.success) {
      // Log validation error
      console.error('Agent response validation failed:', parseResult.error)

      // Fallback to graceful degradation
      return {
        success: false,
        session_id: data.session_id || '',
        error: 'Invalid response format from agent API',
        metadata: {
          business_id: request.business_id,
          team,
          validationError: parseResult.error.message
        }
      }
    }

    return parseResult.data
  }
}

// Session persistence using localStorage
export function saveSession(sessionId: string, businessId: string): void {
  const key = `agent-session:${businessId}`
  localStorage.setItem(key, sessionId)
}

export function loadSession(businessId: string): string | null {
  const key = `agent-session:${businessId}`
  return localStorage.getItem(key)
}
```

---

## File Structure

### New Test Files

```
apps/web/
├── src/
│   ├── __tests__/
│   │   ├── rate-limit.test.ts                    (Story 14.1)
│   │   ├── csrf-integration.test.ts              (Story 14.6)
│   │   ├── quick-actions-csrf.test.ts            (Story 14.6)
│   │   ├── file-upload.test.ts                   (Story 14.3)
│   │   └── fixtures/
│   │       ├── sample.pdf
│   │       └── sample.docx
│   ├── store/
│   │   └── __tests__/
│   │       └── ui-store.test.ts                  (Story 14.2)
│   └── lib/
│       ├── __tests__/
│       │   └── agent-client.test.ts              (Story 14.9)
│       └── schemas/
│           └── agent-response.ts                 (Story 14.10)
└── tests/
    └── e2e/
        └── oauth-flow.spec.ts                    (Story 14.18)
```

### New Backend Files

```
apps/api/
└── src/
    └── metrics/
        ├── metrics.module.ts                     (Story 14.4)
        ├── metrics-controller.ts                 (Story 14.4)
        └── metrics-service.ts                    (Story 14.4)

agents/
└── middleware/
    ├── rate_limit.py                             (Story 14.7)
    └── business_validator.py                     (Story 14.8)
```

### New Documentation

```
docs/
├── observability.md                              (Story 14.4)
└── runbooks/
    ├── README.md                                 (Story 14.5)
    ├── dlq-management.md                         (Story 14.5)
    ├── database-recovery.md                      (Story 14.5)
    ├── incident-response.md                      (Story 14.5)
    ├── key-rotation.md                           (Story 14.5)
    └── troubleshooting/
        ├── auth-failures.md                      (Story 14.5)
        ├── agent-errors.md                       (Story 14.5)
        └── performance-issues.md                 (Story 14.5)
```

---

## Package Dependencies

### New NPM Packages

```json
{
  "devDependencies": {
    "@testcontainers/redis": "^11.9.0",
    "msw": "^2.0.0"
  },
  "dependencies": {
    "prom-client": "^15.0.0"
  }
}
```

### New Python Packages

```
slowapi==0.1.9
redis==5.0.0
```

---

## Success Criteria

### Testing Track
- [ ] All 18 stories have passing tests
- [ ] Test coverage >80% for new code
- [ ] No flaky tests in CI/CD
- [ ] All integration tests use real Redis (no mocks)

### Observability Track
- [ ] Prometheus /metrics endpoint returns valid format
- [ ] All 10 core metrics exported
- [ ] Runbooks cover all critical operations
- [ ] Grafana dashboard examples documented

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Testcontainers slow in CI | Medium | Medium | Cache Docker images, use Redis Alpine |
| Metrics endpoint performance | Low | Medium | Cache metrics for 5s, use separate endpoint |
| Runbook drift from reality | Medium | High | Automate runbook testing, review quarterly |
| Zod schema sync with Python | Medium | Medium | Generate schemas from OpenAPI spec (future) |

---

## Related Documents

- [EPIC-14 Epic File](../epics/EPIC-14-testing-observability.md)
- [Epic 10 Retrospective](./retrospective-epic-10.md)
- [Epic 11 Retrospective](./epic-11-retro-2025-12-06.md)
- [Epic 12 Retrospective](./epic-12-retrospective.md)
- [Consolidated Tech Debt](./CONSOLIDATED-TECH-DEBT-AND-IMPROVEMENTS.md)
- [Architecture Document](../architecture.md)

---

_Generated by BMAD Epic Tech Context Workflow_
_Date: 2025-12-06_
_For: EPIC-14 Testing & Observability_
