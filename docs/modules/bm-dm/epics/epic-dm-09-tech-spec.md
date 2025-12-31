# Epic DM-09 Technical Specification: Observability & Testing Infrastructure

**Epic:** DM-09
**Phase:** 7 - Tech Debt & Stabilization (Sprint 3 - Could Do)
**Stories:** 8
**Points:** 50
**Dependencies:** DM-07 (Infrastructure Stabilization), DM-08 (Quality & Performance)
**Source:** tech-debt-consolidated.md Sprint 3

---

## Executive Summary

This epic implements comprehensive observability through distributed tracing, metrics exposure, and robust end-to-end testing infrastructure. Focus areas:

1. **Observability** - OpenTelemetry integration for distributed tracing
2. **Metrics** - Prometheus exposition for dashboards and alerting
3. **E2E Testing** - Playwright infrastructure for critical flows
4. **Visual Testing** - Percy/Chromatic for regression detection
5. **Load Testing** - k6 performance baseline and regression detection
6. **Integration Testing** - CCR and localStorage verification

---

## Architecture Overview

### Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │   Jaeger UI     │    │   Grafana       │    │   Prometheus        │  │
│  │   (Traces)      │    │   (Dashboards)  │    │   (Metrics)         │  │
│  │   :16686        │    │   :3001         │    │   :9090             │  │
│  └────────┬────────┘    └────────┬────────┘    └──────────┬──────────┘  │
│           │                      │                        │              │
│           └──────────────────────┴────────────────────────┘              │
│                                  │                                       │
│                        ┌─────────▼──────────┐                           │
│                        │  OTLP Collector    │                           │
│                        │  (OpenTelemetry)   │                           │
│                        │  :4317 (gRPC)      │                           │
│                        │  :4318 (HTTP)      │                           │
│                        └─────────┬──────────┘                           │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│    AgentOS          │  │    NestJS API       │  │    Next.js Web      │
│    (Python/FastAPI) │  │    (apps/api)       │  │    (apps/web)       │
│                     │  │                     │  │                     │
│  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │ OTel SDK      │  │  │  │ OTel SDK      │  │  │  │ Browser Perf  │  │
│  │ - Tracing     │  │  │  │ - Tracing     │  │  │  │ - Web Vitals  │  │
│  │ - Metrics     │  │  │  │ - Metrics     │  │  │  │ - Spans       │  │
│  └───────────────┘  │  │  └───────────────┘  │  │  └───────────────┘  │
│                     │  │                     │  │                     │
│  ┌───────────────┐  │  │                     │  │                     │
│  │ /metrics      │  │  │                     │  │                     │
│  │ (Prometheus)  │  │  │                     │  │                     │
│  └───────────────┘  │  │                     │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### Testing Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TESTING INFRASTRUCTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    E2E Tests (Playwright)                            ││
│  │  apps/web/e2e/                                                       ││
│  │  ├── fixtures/          # Auth, dashboard, mocks                    ││
│  │  ├── pages/             # Page object models                        ││
│  │  ├── tests/             # Test specs                                ││
│  │  │   ├── progress-streaming.spec.ts                                 ││
│  │  │   ├── approval-queue.spec.ts                                     ││
│  │  │   └── dashboard-widgets.spec.ts                                  ││
│  │  └── playwright.config.ts                                           ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Visual Regression (Percy)                         ││
│  │  apps/web/src/components/__visual_tests__/                          ││
│  │  ├── widgets.visual.ts                                              ││
│  │  └── hitl.visual.ts                                                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Load Tests (k6)                                   ││
│  │  tests/load/k6/                                                     ││
│  │  ├── a2a-endpoints.js                                               ││
│  │  ├── dashboard-flow.js                                              ││
│  │  └── ccr-routing.js                                                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    Integration Tests (Python)                        ││
│  │  agents/tests/integration/                                          ││
│  │  ├── test_ccr_routing.py                                            ││
│  │  ├── test_ccr_fallback.py                                           ││
│  │  └── test_ccr_quota.py                                              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Story Technical Specifications

### DM-09.1: OpenTelemetry Integration

**Objective:** Add distributed tracing to Python agents for debugging multi-agent flows.

**Technical Approach:**

1. **SDK Installation** - Add OpenTelemetry packages to requirements.txt
2. **Auto-Instrumentation** - Instrument FastAPI, HTTPX, Redis, SQLAlchemy
3. **Custom Spans** - Add spans for A2A calls, caching, rate limiting
4. **Context Propagation** - W3C Trace Context headers
5. **Export Configuration** - OTLP exporter to Jaeger/collector

**Key Files:**
```
agents/
├── observability/
│   ├── __init__.py           # NEW - Package exports
│   ├── tracing.py            # NEW - Tracer configuration
│   ├── config.py             # NEW - OTel settings
│   └── decorators.py         # NEW - @traced decorator
├── main.py                   # MODIFY - Add instrumentation
├── requirements.txt          # MODIFY - Add OTel packages
└── requirements-dev.txt      # MODIFY - Add testing deps

docker/
└── docker-compose.yml        # MODIFY - Add Jaeger service
```

**Package Dependencies (requirements.txt):**
```
# OpenTelemetry Core
opentelemetry-api>=1.22.0
opentelemetry-sdk>=1.22.0
opentelemetry-exporter-otlp>=1.22.0

# Auto-Instrumentation
opentelemetry-instrumentation-fastapi>=0.43b0
opentelemetry-instrumentation-httpx>=0.43b0
opentelemetry-instrumentation-redis>=0.43b0
opentelemetry-instrumentation-sqlalchemy>=0.43b0
opentelemetry-instrumentation-logging>=0.43b0
```

**Tracing Configuration Pattern:**
```python
# agents/observability/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class OTelSettings(BaseSettings):
    """OpenTelemetry configuration."""

    otel_enabled: bool = True
    otel_service_name: str = "hyvve-agentos"
    otel_exporter_endpoint: str = "http://localhost:4317"
    otel_sampling_rate: float = 1.0  # 100% in dev, lower in prod
    otel_log_spans: bool = False  # Debug logging

    class Config:
        env_prefix = ""
        case_sensitive = False

def get_otel_settings() -> OTelSettings:
    return OTelSettings()
```

```python
# agents/observability/tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
import logging

from .config import get_otel_settings

logger = logging.getLogger(__name__)

_tracer: trace.Tracer | None = None

def configure_tracing() -> trace.Tracer:
    """
    Configure OpenTelemetry tracing.

    Call this once at application startup before instrumenting.
    """
    global _tracer

    settings = get_otel_settings()

    if not settings.otel_enabled:
        logger.info("OpenTelemetry disabled")
        return trace.get_tracer(__name__)

    # Create resource with service info
    resource = Resource.create({
        SERVICE_NAME: settings.otel_service_name,
        SERVICE_VERSION: "0.2.0",
    })

    # Configure sampler (reduce volume in production)
    sampler = TraceIdRatioBased(settings.otel_sampling_rate)

    # Create provider
    provider = TracerProvider(
        resource=resource,
        sampler=sampler,
    )

    # Add OTLP exporter
    exporter = OTLPSpanExporter(
        endpoint=settings.otel_exporter_endpoint,
        insecure=True,  # Use TLS in production
    )
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)

    # Set global provider
    trace.set_tracer_provider(provider)

    _tracer = trace.get_tracer(__name__)
    logger.info(f"OpenTelemetry configured: {settings.otel_exporter_endpoint}")

    return _tracer

def instrument_app(app):
    """
    Instrument FastAPI app and HTTP clients.

    Call after configure_tracing().
    """
    settings = get_otel_settings()

    if not settings.otel_enabled:
        return

    # Auto-instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # Auto-instrument HTTPX (A2A calls)
    HTTPXClientInstrumentor().instrument()

    # Auto-instrument Redis
    RedisInstrumentor().instrument()

    logger.info("OpenTelemetry instrumentation complete")

def get_tracer(name: str = __name__) -> trace.Tracer:
    """Get a tracer instance for creating custom spans."""
    return trace.get_tracer(name)
```

```python
# agents/observability/decorators.py
from functools import wraps
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from typing import Callable, Any
import asyncio

def traced(
    span_name: str | None = None,
    attributes: dict | None = None,
):
    """
    Decorator to create a span around a function.

    Works with both sync and async functions.

    Example:
        @traced("a2a.call", {"agent.type": "gateway"})
        async def call_agent(agent_id: str):
            ...
    """
    def decorator(func: Callable) -> Callable:
        name = span_name or f"{func.__module__}.{func.__name__}"
        tracer = trace.get_tracer(__name__)

        @wraps(func)
        async def async_wrapper(*args, **kwargs) -> Any:
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                try:
                    result = await func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs) -> Any:
            with tracer.start_as_current_span(name) as span:
                if attributes:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                try:
                    result = func(*args, **kwargs)
                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    span.record_exception(e)
                    raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
```

**Integration with DM-08 Patterns:**

From DM-08 retrospective, add spans for:
- `agents/services/cache.py` - Cache hits/misses, staleness
- Rate limiting decisions in middleware

```python
# Example: Adding spans to existing cache service
# agents/services/cache.py modifications

from agents.observability import get_tracer

tracer = get_tracer(__name__)

async def get_cached_data(key: str, workspace_id: str):
    with tracer.start_as_current_span("cache.get") as span:
        span.set_attribute("cache.key", key)
        span.set_attribute("tenant.workspace_id", workspace_id)

        result = await redis.get(key)

        if result:
            span.set_attribute("cache.hit", True)
        else:
            span.set_attribute("cache.hit", False)

        return result
```

**Docker Compose Addition:**
```yaml
# Add to docker/docker-compose.yml

  # Jaeger - Distributed Tracing
  jaeger:
    image: jaegertracing/all-in-one:1.52
    container_name: hyvve_jaeger
    restart: unless-stopped
    ports:
      - "16686:16686"  # Jaeger UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    networks:
      - hyvve_network
```

**Acceptance Criteria:**
- [ ] AC1: OpenTelemetry configured in agent system
- [ ] AC2: A2A calls create linked spans
- [ ] AC3: Trace context propagated in headers (W3C Trace Context)
- [ ] AC4: Traces viewable in Jaeger UI at localhost:16686
- [ ] AC5: Sampling rate configurable via OTEL_SAMPLING_RATE

---

### DM-09.2: Metrics Exposure System

**Objective:** Expose Prometheus metrics for monitoring and alerting.

**Technical Approach:**

1. **Prometheus Client** - Use prometheus_client library
2. **Metrics Registry** - Centralized metric definitions
3. **Endpoint** - `/metrics` for Prometheus scraping
4. **Histograms** - Request duration, response sizes
5. **Counters** - Request counts, errors
6. **Gauges** - Active tasks, connections

**Key Files:**
```
agents/
├── observability/
│   └── metrics.py            # NEW - Metrics definitions
├── api/
│   └── routes/
│       └── metrics.py        # NEW - /metrics endpoint
└── main.py                   # MODIFY - Mount metrics router
```

**Package Dependencies:**
```
# Add to requirements.txt
prometheus-client>=0.19.0
```

**Metrics Module:**
```python
# agents/observability/metrics.py
from prometheus_client import (
    Histogram,
    Counter,
    Gauge,
    Info,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from typing import Optional
import time

# Create a custom registry to avoid default metrics
REGISTRY = CollectorRegistry()

# ============================================================================
# Service Info
# ============================================================================

AGENTOS_INFO = Info(
    "agentos",
    "AgentOS service information",
    registry=REGISTRY,
)
AGENTOS_INFO.info({
    "version": "0.2.0",
    "protocols": "a2a_0.3.0,agui_0.1.0",
})

# ============================================================================
# A2A Request Metrics
# ============================================================================

A2A_REQUEST_DURATION = Histogram(
    "a2a_request_duration_seconds",
    "A2A request duration in seconds",
    labelnames=["agent", "operation", "status"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=REGISTRY,
)

A2A_REQUEST_COUNT = Counter(
    "a2a_requests_total",
    "Total A2A requests",
    labelnames=["agent", "operation", "status"],
    registry=REGISTRY,
)

A2A_ACTIVE_TASKS = Gauge(
    "a2a_active_tasks",
    "Currently active A2A tasks",
    labelnames=["agent"],
    registry=REGISTRY,
)

A2A_RESPONSE_SIZE = Histogram(
    "a2a_response_size_bytes",
    "A2A response size in bytes",
    labelnames=["agent"],
    buckets=(100, 500, 1000, 5000, 10000, 50000, 100000),
    registry=REGISTRY,
)

# ============================================================================
# Cache Metrics
# ============================================================================

CACHE_OPERATIONS = Counter(
    "cache_operations_total",
    "Cache operations",
    labelnames=["operation", "result"],  # operation: get/set, result: hit/miss
    registry=REGISTRY,
)

CACHE_LATENCY = Histogram(
    "cache_latency_seconds",
    "Cache operation latency",
    labelnames=["operation"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1),
    registry=REGISTRY,
)

# ============================================================================
# Rate Limit Metrics
# ============================================================================

RATE_LIMIT_HITS = Counter(
    "rate_limit_hits_total",
    "Rate limit enforcement events",
    labelnames=["endpoint", "workspace_id", "result"],  # result: allowed/denied
    registry=REGISTRY,
)

# ============================================================================
# CCR Metrics
# ============================================================================

CCR_REQUESTS = Counter(
    "ccr_requests_total",
    "CCR routing requests",
    labelnames=["provider", "task_type", "status"],
    registry=REGISTRY,
)

CCR_LATENCY = Histogram(
    "ccr_latency_seconds",
    "CCR routing latency",
    labelnames=["provider"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
    registry=REGISTRY,
)

CCR_TOKENS = Counter(
    "ccr_tokens_total",
    "CCR tokens used",
    labelnames=["provider", "direction"],  # direction: input/output
    registry=REGISTRY,
)

# ============================================================================
# Helper Functions
# ============================================================================

def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest(REGISTRY)

def get_content_type() -> str:
    """Get Prometheus content type header."""
    return CONTENT_TYPE_LATEST

class RequestTimer:
    """
    Context manager for timing requests and recording metrics.

    Example:
        with RequestTimer(A2A_REQUEST_DURATION, agent="navi", operation="query"):
            result = await do_query()
    """

    def __init__(
        self,
        histogram: Histogram,
        **labels,
    ):
        self.histogram = histogram
        self.labels = labels
        self.start_time: Optional[float] = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.perf_counter() - self.start_time
        status = "error" if exc_type else "success"
        self.histogram.labels(**self.labels, status=status).observe(duration)
```

**Metrics Endpoint:**
```python
# agents/api/routes/metrics.py
from fastapi import APIRouter, Response

from agents.observability.metrics import get_metrics, get_content_type

router = APIRouter()

@router.get("/metrics")
async def prometheus_metrics():
    """
    Prometheus metrics endpoint.

    Exposes all registered metrics for scraping.
    """
    return Response(
        content=get_metrics(),
        media_type=get_content_type(),
    )
```

**Grafana Dashboard Template:**

Create `docs/observability/grafana-agentos-dashboard.json` with panels for:
- A2A Request Rate (requests/second by agent)
- A2A Latency (p50, p95, p99)
- Active Tasks
- Cache Hit Rate
- Rate Limit Events
- CCR Usage by Provider

**Acceptance Criteria:**
- [ ] AC1: Prometheus metrics endpoint at `/metrics`
- [ ] AC2: Request duration histogram per agent/operation
- [ ] AC3: Request count with success/failure labels
- [ ] AC4: Active task gauge updated in real-time
- [ ] AC5: Grafana dashboard template provided

---

### DM-09.3: E2E Test Infrastructure Setup

**Objective:** Set up Playwright infrastructure for browser-based E2E tests.

**Technical Approach:**

1. **Configuration** - Extend existing playwright.config.ts
2. **Fixtures** - Auth, dashboard, API mocking
3. **Page Objects** - Dashboard, ApprovalQueue, Widget models
4. **CI Integration** - GitHub Actions workflow
5. **Reports** - HTML and JUnit output

**Key Files:**
```
apps/web/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts       # NEW - Auth fixture
│   │   ├── dashboard.fixture.ts  # NEW - Dashboard fixture
│   │   ├── api-mock.fixture.ts   # NEW - API mocking
│   │   └── index.ts              # NEW - Export all fixtures
│   ├── pages/
│   │   ├── base.page.ts          # NEW - Base page object
│   │   ├── dashboard.page.ts     # NEW - Dashboard page object
│   │   ├── approval.page.ts      # NEW - Approval queue page
│   │   └── index.ts              # NEW - Export all pages
│   ├── tests/                    # Test specs (DM-09.4)
│   └── global-setup.ts           # NEW - Global setup
├── playwright.config.ts          # MODIFY - E2E config
└── package.json                  # MODIFY - Add scripts
```

**Auth Fixture:**
```typescript
// apps/web/e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

interface AuthUser {
  id: string;
  email: string;
  workspaceId: string;
  token: string;
}

type AuthFixtures = {
  authenticatedPage: Page;
  testUser: AuthUser;
};

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    // Test user credentials (seeded in test DB)
    const user: AuthUser = {
      id: 'test-user-e2e',
      email: 'e2e@test.local',
      workspaceId: 'test-workspace-e2e',
      token: process.env.E2E_TEST_TOKEN || 'dev-token',
    };
    await use(user);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Set auth cookies/localStorage before navigating
    await page.context().addCookies([
      {
        name: 'session_token',
        value: testUser.token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Set localStorage for auth state
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, testUser.token);

    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Dashboard Fixture:**
```typescript
// apps/web/e2e/fixtures/dashboard.fixture.ts
import { test as authTest } from './auth.fixture';
import { DashboardPage } from '../pages/dashboard.page';

type DashboardFixtures = {
  dashboardPage: DashboardPage;
};

export const test = authTest.extend<DashboardFixtures>({
  dashboardPage: async ({ authenticatedPage }, use) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.waitForLoad();
    await use(dashboard);
  },
});

export { expect } from '@playwright/test';
```

**API Mock Fixture:**
```typescript
// apps/web/e2e/fixtures/api-mock.fixture.ts
import { test as base, Page, Route } from '@playwright/test';

type MockResponse = {
  status?: number;
  body: unknown;
  delay?: number;
};

type ApiMockFixtures = {
  mockApi: (pattern: string | RegExp, response: MockResponse) => Promise<void>;
  mockWebSocket: (messages: unknown[]) => Promise<void>;
};

export const test = base.extend<ApiMockFixtures>({
  mockApi: async ({ page }, use) => {
    const mocks: Array<() => Promise<void>> = [];

    const mockApi = async (pattern: string | RegExp, response: MockResponse) => {
      await page.route(pattern, async (route: Route) => {
        if (response.delay) {
          await new Promise((r) => setTimeout(r, response.delay));
        }
        await route.fulfill({
          status: response.status || 200,
          contentType: 'application/json',
          body: JSON.stringify(response.body),
        });
      });
    };

    await use(mockApi);
  },

  mockWebSocket: async ({ page }, use) => {
    // WebSocket mocking for real-time updates
    const mockWebSocket = async (messages: unknown[]) => {
      await page.addInitScript((msgs) => {
        // Mock WebSocket to emit test messages
        const originalWebSocket = window.WebSocket;
        (window as any).WebSocket = class MockWebSocket {
          onmessage: ((event: MessageEvent) => void) | null = null;
          onopen: (() => void) | null = null;

          constructor() {
            setTimeout(() => {
              this.onopen?.();
              msgs.forEach((msg, i) => {
                setTimeout(() => {
                  this.onmessage?.({ data: JSON.stringify(msg) } as MessageEvent);
                }, i * 100);
              });
            }, 10);
          }

          send() {}
          close() {}
        };
      }, messages);
    };

    await use(mockWebSocket);
  },
});

export { expect } from '@playwright/test';
```

**Dashboard Page Object:**
```typescript
// apps/web/e2e/pages/dashboard.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class DashboardPage extends BasePage {
  // Locators
  readonly widgetGrid: Locator;
  readonly loadingSpinner: Locator;
  readonly errorBanner: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    super(page, '/dashboard');
    this.widgetGrid = page.locator('[data-testid="widget-grid"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorBanner = page.locator('[data-testid="error-banner"]');
    this.refreshButton = page.locator('[data-testid="refresh-button"]');
  }

  async waitForLoad(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 30000 });
    await this.widgetGrid.waitFor({ state: 'visible' });
  }

  async getWidgetCount(): Promise<number> {
    const widgets = this.page.locator('[data-testid^="widget-"]');
    return await widgets.count();
  }

  async getWidget(testId: string): Promise<Locator> {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  async getProgressBar(): Promise<Locator> {
    return this.page.locator('[data-testid="progress-bar"]');
  }

  async startTask(taskName: string): Promise<void> {
    await this.page.click(`[data-testid="start-task-${taskName}"]`);
  }

  async waitForTaskCompletion(timeout = 30000): Promise<void> {
    await expect(this.page.locator('[data-testid="task-status"]')).toHaveText(
      'Completed',
      { timeout }
    );
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
    await this.waitForLoad();
  }
}
```

**Approval Page Object:**
```typescript
// apps/web/e2e/pages/approval.page.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ApprovalPage extends BasePage {
  readonly approvalQueue: Locator;
  readonly approvalCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page, '/approvals');
    this.approvalQueue = page.locator('[data-testid="approval-queue"]');
    this.approvalCards = page.locator('[data-testid^="approval-card-"]');
    this.emptyState = page.locator('[data-testid="approval-empty-state"]');
  }

  async getApprovalCount(): Promise<number> {
    return await this.approvalCards.count();
  }

  async approveItem(approvalId: string): Promise<void> {
    const card = this.page.locator(`[data-testid="approval-card-${approvalId}"]`);
    await card.locator('[data-testid="approve-button"]').click();
    await expect(card).toHaveAttribute('data-status', 'approved');
  }

  async rejectItem(approvalId: string, reason?: string): Promise<void> {
    const card = this.page.locator(`[data-testid="approval-card-${approvalId}"]`);
    await card.locator('[data-testid="reject-button"]').click();

    if (reason) {
      await this.page.fill('[data-testid="rejection-reason"]', reason);
    }

    await this.page.click('[data-testid="confirm-reject"]');
    await expect(card).toHaveAttribute('data-status', 'rejected');
  }

  async waitForNewApproval(timeout = 10000): Promise<void> {
    const initialCount = await this.getApprovalCount();
    await expect(this.approvalCards).toHaveCount(initialCount + 1, { timeout });
  }
}
```

**Playwright Config Update:**
```typescript
// apps/web/playwright.config.ts - Add E2E project
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e/tests',  // Changed from ./tests/e2e
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      chromiumSandbox: false,
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
    ['list'],
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Global setup for test database
  globalSetup: './e2e/global-setup.ts',
});
```

**GitHub Actions Integration:**
```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: hyvve_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm --filter web exec playwright install --with-deps chromium

      - name: Build app
        run: pnpm --filter web build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:7777

      - name: Start services
        run: |
          pnpm --filter web start &
          pnpm --filter api start &
          sleep 10

      - name: Run E2E tests
        run: pnpm --filter web test:e2e
        env:
          E2E_TEST_TOKEN: test-token

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7
```

**Acceptance Criteria:**
- [ ] AC1: Playwright configured with TypeScript
- [ ] AC2: Auth fixture for logged-in sessions
- [ ] AC3: CI pipeline runs E2E tests on PR
- [ ] AC4: Page object models for Dashboard, Approval Queue
- [ ] AC5: Test report artifacts saved

---

### DM-09.4: Critical Flow E2E Tests

**Objective:** Write E2E tests for critical user flows.

**Technical Approach:**

1. **Progress Streaming** - Task → Progress updates → Completion
2. **Approval Queue** - Submit → Review → Approve/Reject
3. **Dashboard Widgets** - Load → Update → Error handling
4. **Network Mocking** - Deterministic test data

**Key Files:**
```
apps/web/e2e/tests/
├── progress-streaming.spec.ts    # NEW
├── approval-queue.spec.ts        # NEW
└── dashboard-widgets.spec.ts     # NEW
```

**Progress Streaming Test:**
```typescript
// apps/web/e2e/tests/progress-streaming.spec.ts
import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Progress Streaming', () => {
  test('task progress updates widget in real-time', async ({ dashboardPage, mockApi }) => {
    // Mock initial dashboard data
    await mockApi('/api/dashboard/widgets', {
      body: {
        widgets: [
          {
            id: 'task-1',
            type: 'progress',
            data: { progress: 0, status: 'pending' },
          },
        ],
      },
    });

    // Navigate and wait for load
    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify initial state
    const progressBar = await dashboardPage.getProgressBar();
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Trigger long-running task
    await dashboardPage.startTask('analysis');

    // Mock SSE progress updates
    await dashboardPage.page.evaluate(() => {
      // Simulate SSE events
      const events = [
        { progress: 25, status: 'analyzing' },
        { progress: 50, status: 'processing' },
        { progress: 75, status: 'finalizing' },
        { progress: 100, status: 'completed' },
      ];

      events.forEach((data, i) => {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('dashboard:progress', { detail: data })
          );
        }, i * 500);
      });
    });

    // Verify progress updates
    await expect(progressBar).toHaveAttribute('aria-valuenow', '50', {
      timeout: 5000,
    });

    // Verify completion
    await dashboardPage.waitForTaskCompletion(10000);
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  test('handles progress errors gracefully', async ({ dashboardPage, mockApi }) => {
    await mockApi('/api/dashboard/widgets', {
      body: { widgets: [] },
    });

    await dashboardPage.goto();

    // Start task that will error
    await dashboardPage.startTask('failing-task');

    // Mock error response
    await mockApi('/api/tasks/failing-task/start', {
      status: 500,
      body: { error: 'Task failed' },
    });

    // Verify error state
    const errorBanner = dashboardPage.errorBanner;
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText('Task failed');
  });
});
```

**Approval Queue Test:**
```typescript
// apps/web/e2e/tests/approval-queue.spec.ts
import { test, expect } from '../fixtures/auth.fixture';
import { ApprovalPage } from '../pages/approval.page';

test.describe('Approval Queue', () => {
  let approvalPage: ApprovalPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    approvalPage = new ApprovalPage(authenticatedPage);
  });

  test('displays pending approvals', async ({ mockApi }) => {
    await mockApi('/api/approvals', {
      body: {
        items: [
          {
            id: 'approval-1',
            type: 'content_publish',
            title: 'Blog Post: AI in 2025',
            status: 'pending',
            confidence: 0.75,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'approval-2',
            type: 'email_send',
            title: 'Newsletter Campaign',
            status: 'pending',
            confidence: 0.62,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    await approvalPage.goto();
    await expect(approvalPage.approvalQueue).toBeVisible();

    const count = await approvalPage.getApprovalCount();
    expect(count).toBe(2);
  });

  test('approves item successfully', async ({ mockApi }) => {
    await mockApi('/api/approvals', {
      body: {
        items: [
          {
            id: 'approval-1',
            type: 'content_publish',
            title: 'Test Content',
            status: 'pending',
            confidence: 0.8,
          },
        ],
      },
    });

    await mockApi('/api/approvals/approval-1/approve', {
      body: { success: true, status: 'approved' },
    });

    await approvalPage.goto();
    await approvalPage.approveItem('approval-1');

    // Verify approved state
    const card = approvalPage.page.locator('[data-testid="approval-card-approval-1"]');
    await expect(card).toHaveAttribute('data-status', 'approved');
  });

  test('rejects item with reason', async ({ mockApi }) => {
    await mockApi('/api/approvals', {
      body: {
        items: [
          {
            id: 'approval-1',
            type: 'content_publish',
            title: 'Test Content',
            status: 'pending',
          },
        ],
      },
    });

    await mockApi('/api/approvals/approval-1/reject', {
      body: { success: true, status: 'rejected' },
    });

    await approvalPage.goto();
    await approvalPage.rejectItem('approval-1', 'Content needs revision');

    const card = approvalPage.page.locator('[data-testid="approval-card-approval-1"]');
    await expect(card).toHaveAttribute('data-status', 'rejected');
  });

  test('receives real-time approval updates', async ({ mockApi, mockWebSocket }) => {
    await mockApi('/api/approvals', {
      body: { items: [] },
    });

    // Mock WebSocket message for new approval
    await mockWebSocket([
      {
        type: 'approval:new',
        data: {
          id: 'approval-new',
          type: 'content_publish',
          title: 'New Approval Item',
          status: 'pending',
        },
      },
    ]);

    await approvalPage.goto();

    // Verify empty state initially
    await expect(approvalPage.emptyState).toBeVisible();

    // Wait for WebSocket update
    await approvalPage.waitForNewApproval(10000);

    // Verify new item appeared
    const count = await approvalPage.getApprovalCount();
    expect(count).toBe(1);
  });
});
```

**Dashboard Widget Test:**
```typescript
// apps/web/e2e/tests/dashboard-widgets.spec.ts
import { test, expect } from '../fixtures/dashboard.fixture';

test.describe('Dashboard Widgets', () => {
  test('loads all widget types correctly', async ({ dashboardPage, mockApi }) => {
    await mockApi('/api/dashboard/widgets', {
      body: {
        widgets: [
          { id: 'task-1', type: 'task_card', data: { title: 'Task 1', status: 'pending' } },
          { id: 'metrics-1', type: 'metrics', data: { value: 42, label: 'Active Users' } },
          { id: 'alert-1', type: 'alert', data: { level: 'warning', message: 'Low disk space' } },
        ],
      },
    });

    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify widgets rendered
    const widgetCount = await dashboardPage.getWidgetCount();
    expect(widgetCount).toBe(3);

    // Verify specific widgets
    const taskCard = await dashboardPage.getWidget('widget-task-1');
    await expect(taskCard).toContainText('Task 1');

    const metrics = await dashboardPage.getWidget('widget-metrics-1');
    await expect(metrics).toContainText('42');
    await expect(metrics).toContainText('Active Users');
  });

  test('validates widget data with Zod schemas (DM-08.1)', async ({ dashboardPage, mockApi }) => {
    // Send invalid widget data
    await mockApi('/api/dashboard/widgets', {
      body: {
        widgets: [
          {
            id: 'invalid-1',
            type: 'task_card',
            data: { title: 123 },  // Invalid: title should be string
          },
        ],
      },
    });

    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify error widget rendered instead of crashing
    const errorWidget = await dashboardPage.getWidget('widget-invalid-1');
    await expect(errorWidget).toContainText('validation');
  });

  test('respects MAX bounds for state (DM-08.6)', async ({ dashboardPage, mockApi }) => {
    // Generate 100 alerts (exceeds MAX_ALERTS=50)
    const alerts = Array.from({ length: 100 }, (_, i) => ({
      id: `alert-${i}`,
      level: 'info',
      message: `Alert ${i}`,
    }));

    await mockApi('/api/dashboard/alerts', { body: { alerts } });

    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Verify only MAX_ALERTS are rendered
    const alertWidgets = dashboardPage.page.locator('[data-testid^="alert-"]');
    const count = await alertWidgets.count();
    expect(count).toBeLessThanOrEqual(50);
  });

  test('widget refresh updates data', async ({ dashboardPage, mockApi }) => {
    let requestCount = 0;

    await mockApi('/api/dashboard/widgets', {
      body: {
        widgets: [
          { id: 'metrics-1', type: 'metrics', data: { value: requestCount * 10 } },
        ],
      },
    });

    await dashboardPage.goto();
    await dashboardPage.waitForLoad();

    // Update mock response
    requestCount = 1;
    await mockApi('/api/dashboard/widgets', {
      body: {
        widgets: [
          { id: 'metrics-1', type: 'metrics', data: { value: 10 } },
        ],
      },
    });

    await dashboardPage.refresh();

    const metrics = await dashboardPage.getWidget('widget-metrics-1');
    await expect(metrics).toContainText('10');
  });
});
```

**Test Stability Guidelines:**

Based on DM-08 retrospective recommendations:
1. Use explicit waits, not arbitrary timeouts
2. Mock network requests for deterministic behavior
3. Test data isolation per test
4. Avoid flaky selectors - prefer data-testid

**Acceptance Criteria:**
- [ ] AC1: Progress streaming E2E test passes
- [ ] AC2: Approval queue E2E test passes
- [ ] AC3: Widget lifecycle E2E test passes
- [ ] AC4: Tests run in <2 minutes total
- [ ] AC5: Tests stable (no flakes in 10 consecutive runs)

---

### DM-09.5: Visual Regression Testing

**Objective:** Detect UI regressions with visual snapshot testing.

**Technical Approach:**

1. **Tool Selection** - Percy.io (cloud-based visual testing)
2. **Component Snapshots** - All widget states
3. **HITL Cards** - All approval states
4. **CI Integration** - Percy GitHub integration
5. **Threshold Config** - 1% pixel change threshold

**Key Files:**
```
apps/web/
├── src/components/__visual_tests__/
│   ├── widgets.visual.ts         # NEW
│   └── hitl.visual.ts            # NEW
├── .percy.yml                    # NEW - Percy config
└── package.json                  # MODIFY - Add Percy deps
```

**Package Dependencies:**
```json
{
  "devDependencies": {
    "@percy/cli": "^1.27.0",
    "@percy/playwright": "^1.0.4"
  }
}
```

**Percy Configuration:**
```yaml
# apps/web/.percy.yml
version: 2
snapshot:
  widths:
    - 1280
    - 768
    - 375
  min-height: 1024
  percy-css: |
    /* Disable animations for consistent snapshots */
    *, *::before, *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
discovery:
  allowed-hostnames:
    - localhost
upload:
  # Only upload on CI
  files: '**/*.{png,jpg}'
```

**Widget Visual Tests:**
```typescript
// apps/web/src/components/__visual_tests__/widgets.visual.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Widget Visual Regression', () => {
  const widgetStates = [
    // TaskCard states
    { type: 'task_card', state: 'pending', data: { title: 'Task', status: 'pending' } },
    { type: 'task_card', state: 'active', data: { title: 'Task', status: 'in_progress' } },
    { type: 'task_card', state: 'completed', data: { title: 'Task', status: 'completed' } },
    { type: 'task_card', state: 'error', data: { title: 'Task', status: 'blocked' } },

    // ProjectStatus states
    { type: 'project_status', state: 'healthy', data: { health: 'healthy', score: 95 } },
    { type: 'project_status', state: 'warning', data: { health: 'warning', score: 65 } },
    { type: 'project_status', state: 'critical', data: { health: 'critical', score: 30 } },

    // MetricsWidget states
    { type: 'metrics', state: 'positive', data: { value: 1234, trend: 'up', change: 12.5 } },
    { type: 'metrics', state: 'negative', data: { value: 1234, trend: 'down', change: -8.2 } },
    { type: 'metrics', state: 'stable', data: { value: 1234, trend: 'stable', change: 0 } },

    // AlertWidget states
    { type: 'alert', state: 'info', data: { level: 'info', message: 'Info message' } },
    { type: 'alert', state: 'warning', data: { level: 'warning', message: 'Warning message' } },
    { type: 'alert', state: 'error', data: { level: 'error', message: 'Error message' } },

    // ProgressIndicator states
    { type: 'progress', state: 'zero', data: { progress: 0, label: 'Starting' } },
    { type: 'progress', state: 'half', data: { progress: 50, label: 'Processing' } },
    { type: 'progress', state: 'complete', data: { progress: 100, label: 'Complete' } },
    { type: 'progress', state: 'error', data: { progress: 45, error: 'Failed' } },
  ];

  for (const widget of widgetStates) {
    test(`${widget.type} - ${widget.state}`, async ({ page }) => {
      // Navigate to storybook or component preview
      await page.goto(
        `/storybook/iframe.html?id=widgets-${widget.type}--${widget.state}`
      );
      await page.waitForLoadState('networkidle');

      // Take Percy snapshot
      await percySnapshot(page, `Widget: ${widget.type} (${widget.state})`);
    });
  }
});
```

**HITL Visual Tests:**
```typescript
// apps/web/src/components/__visual_tests__/hitl.visual.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('HITL Card Visual Regression', () => {
  const approvalStates = [
    {
      state: 'pending',
      data: {
        id: 'test-1',
        type: 'content_publish',
        title: 'Blog Post: AI Trends',
        confidence: 0.75,
        status: 'pending',
      },
    },
    {
      state: 'pending-low-confidence',
      data: {
        id: 'test-2',
        type: 'email_send',
        title: 'Newsletter',
        confidence: 0.45,
        status: 'pending',
      },
    },
    {
      state: 'approved',
      data: {
        id: 'test-3',
        type: 'content_publish',
        title: 'Approved Content',
        confidence: 0.85,
        status: 'approved',
        approvedBy: 'user@test.com',
        approvedAt: '2025-01-01T12:00:00Z',
      },
    },
    {
      state: 'rejected',
      data: {
        id: 'test-4',
        type: 'content_publish',
        title: 'Rejected Content',
        confidence: 0.55,
        status: 'rejected',
        rejectedBy: 'user@test.com',
        rejectedAt: '2025-01-01T12:00:00Z',
        rejectionReason: 'Content needs revision',
      },
    },
    {
      state: 'expired',
      data: {
        id: 'test-5',
        type: 'content_publish',
        title: 'Expired Request',
        confidence: 0.7,
        status: 'expired',
        expiresAt: '2024-12-31T12:00:00Z',
      },
    },
  ];

  for (const approval of approvalStates) {
    test(`ApprovalCard - ${approval.state}`, async ({ page }) => {
      await page.goto(
        `/storybook/iframe.html?id=hitl-approvalcard--${approval.state}`
      );
      await page.waitForLoadState('networkidle');

      await percySnapshot(page, `ApprovalCard: ${approval.state}`);
    });
  }

  test('Approval Queue - Full View', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=hitl-approvalqueue--default');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Approval Queue: Default View');
  });

  test('Approval Queue - Empty State', async ({ page }) => {
    await page.goto('/storybook/iframe.html?id=hitl-approvalqueue--empty');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Approval Queue: Empty State');
  });
});
```

**CI Integration:**
```yaml
# Add to .github/workflows/visual.yml
name: Visual Regression

on:
  pull_request:
    branches: [main]

jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Build Storybook
        run: pnpm --filter web build-storybook

      - name: Start Storybook
        run: |
          pnpm --filter web serve-storybook &
          sleep 5

      - name: Run Percy
        run: pnpm --filter web percy exec -- playwright test --project=visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

**Acceptance Criteria:**
- [ ] AC1: Percy/Chromatic configured and connected
- [ ] AC2: All widget states have baseline snapshots
- [ ] AC3: HITL cards have baseline snapshots
- [ ] AC4: Visual diffs reported on PRs
- [ ] AC5: Threshold set to catch >1% pixel change

---

### DM-09.6: Load Testing Infrastructure

**Objective:** Establish performance baselines for A2A endpoints.

**Technical Approach:**

1. **Tool** - k6 (JavaScript-based load testing)
2. **Scenarios** - Ramp-up, steady, spike, ramp-down
3. **Thresholds** - p95 < 500ms, error rate < 1%
4. **CI Integration** - On-demand workflow
5. **Results** - Archive for trend analysis

**Key Files:**
```
tests/
├── load/
│   ├── k6/
│   │   ├── a2a-endpoints.js      # NEW
│   │   ├── dashboard-flow.js     # NEW
│   │   ├── ccr-routing.js        # NEW
│   │   └── config.js             # NEW - Shared config
│   ├── results/
│   │   └── .gitkeep
│   └── README.md                 # NEW - Load test docs
└── scripts/
    └── run-load-tests.sh         # NEW
```

**K6 Configuration:**
```javascript
// tests/load/k6/config.js
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:7777';
export const WEB_URL = __ENV.WEB_URL || 'http://localhost:3000';

export const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

export const defaultOptions = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  tags: {
    environment: __ENV.ENVIRONMENT || 'development',
  },
};

export const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`,
  'X-Workspace-Id': 'load-test-workspace',
};
```

**A2A Endpoints Load Test:**
```javascript
// tests/load/k6/a2a-endpoints.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, defaultOptions, headers } from './config.js';

// Custom metrics
const a2aErrorRate = new Rate('a2a_errors');
const a2aDuration = new Trend('a2a_duration');

export const options = {
  ...defaultOptions,
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '2m', target: 50 },    // Steady state
    { duration: '30s', target: 100 },  // Spike
    { duration: '30s', target: 50 },   // Recovery
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    ...defaultOptions.thresholds,
    a2a_errors: ['rate<0.01'],
    a2a_duration: ['p(95)<500'],
  },
};

export default function () {
  group('A2A Discovery', () => {
    const res = http.get(`${BASE_URL}/.well-known/agent-card.json`, { headers });

    check(res, {
      'discovery returns 200': (r) => r.status === 200,
      'has agents array': (r) => JSON.parse(r.body).agents !== undefined,
    });

    a2aErrorRate.add(res.status !== 200);
  });

  group('A2A Query - Dashboard Gateway', () => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'run',
      params: {
        task: 'Get dashboard overview',
        context: { caller_id: 'load-test' },
      },
      id: `load-${Date.now()}`,
    });

    const res = http.post(`${BASE_URL}/a2a/dashboard_gateway/rpc`, payload, {
      headers,
      timeout: '30s',
    });

    const success = check(res, {
      'query returns 200': (r) => r.status === 200,
      'has result': (r) => {
        const body = JSON.parse(r.body);
        return body.result !== undefined || body.error !== undefined;
      },
    });

    a2aErrorRate.add(!success);
    a2aDuration.add(res.timings.duration);
  });

  group('A2A Query - Navi Agent', () => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'run',
      params: {
        task: 'Get project status summary',
        context: { caller_id: 'load-test', project_id: 'test-project' },
      },
      id: `load-navi-${Date.now()}`,
    });

    const res = http.post(`${BASE_URL}/a2a/navi/rpc`, payload, {
      headers,
      timeout: '30s',
    });

    check(res, {
      'navi returns 200': (r) => r.status === 200,
    });

    a2aErrorRate.add(res.status !== 200);
    a2aDuration.add(res.timings.duration);
  });

  sleep(1); // Think time between iterations
}

export function handleSummary(data) {
  return {
    'results/a2a-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Text summary helper
function textSummary(data, options) {
  const { metrics } = data;
  let summary = '\n=== A2A Load Test Summary ===\n\n';

  summary += `HTTP Requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `Request Duration (p95): ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms\n`;
  summary += `Error Rate: ${((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `A2A Duration (p95): ${metrics.a2a_duration?.values?.['p(95)']?.toFixed(2) || 'N/A'}ms\n`;

  return summary;
}
```

**Dashboard Flow Load Test:**
```javascript
// tests/load/k6/dashboard-flow.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL, WEB_URL, defaultOptions, headers } from './config.js';

export const options = {
  ...defaultOptions,
  stages: [
    { duration: '1m', target: 30 },   // Ramp up
    { duration: '3m', target: 30 },   // Steady state
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function () {
  // Simulate full dashboard load flow

  group('1. Initial Page Load', () => {
    const res = http.get(`${WEB_URL}/dashboard`, { headers });
    check(res, { 'page loads': (r) => r.status === 200 });
  });

  group('2. Fetch Widgets', () => {
    const res = http.get(`${BASE_URL}/api/dashboard/widgets`, { headers });
    check(res, {
      'widgets load': (r) => r.status === 200,
      'has widget data': (r) => JSON.parse(r.body).widgets !== undefined,
    });
  });

  group('3. Fetch Alerts', () => {
    const res = http.get(`${BASE_URL}/api/dashboard/alerts`, { headers });
    check(res, { 'alerts load': (r) => r.status === 200 });
  });

  group('4. Fetch Metrics', () => {
    const res = http.get(`${BASE_URL}/api/dashboard/metrics`, { headers });
    check(res, { 'metrics load': (r) => r.status === 200 });
  });

  group('5. Poll for Updates', () => {
    // Simulate polling interval
    for (let i = 0; i < 3; i++) {
      http.get(`${BASE_URL}/api/dashboard/updates?since=${Date.now() - 5000}`, {
        headers,
      });
      sleep(2);
    }
  });

  sleep(5); // User think time
}
```

**Run Script:**
```bash
#!/bin/bash
# tests/scripts/run-load-tests.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOAD_DIR="$SCRIPT_DIR/../load"
RESULTS_DIR="$LOAD_DIR/results"

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

# Default values
TEST_TYPE="${1:-a2a}"
ENVIRONMENT="${2:-development}"
BASE_URL="${BASE_URL:-http://localhost:7777}"

echo "=== Running Load Tests ==="
echo "Test: $TEST_TYPE"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

# Select test file
case "$TEST_TYPE" in
  "a2a")
    TEST_FILE="$LOAD_DIR/k6/a2a-endpoints.js"
    ;;
  "dashboard")
    TEST_FILE="$LOAD_DIR/k6/dashboard-flow.js"
    ;;
  "ccr")
    TEST_FILE="$LOAD_DIR/k6/ccr-routing.js"
    ;;
  *)
    echo "Unknown test type: $TEST_TYPE"
    echo "Available: a2a, dashboard, ccr"
    exit 1
    ;;
esac

# Run k6
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULT_FILE="$RESULTS_DIR/${TEST_TYPE}-${TIMESTAMP}.json"

k6 run \
  --env BASE_URL="$BASE_URL" \
  --env ENVIRONMENT="$ENVIRONMENT" \
  --out json="$RESULT_FILE" \
  "$TEST_FILE"

echo ""
echo "Results saved to: $RESULT_FILE"
```

**CI Workflow (On-Demand):**
```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Test type'
        required: true
        default: 'a2a'
        type: choice
        options:
          - a2a
          - dashboard
          - ccr
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  load-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Load Tests
        run: |
          chmod +x tests/scripts/run-load-tests.sh
          ./tests/scripts/run-load-tests.sh ${{ inputs.test_type }} ${{ inputs.environment }}
        env:
          BASE_URL: ${{ secrets[format('{0}_API_URL', inputs.environment)] }}
          AUTH_TOKEN: ${{ secrets.LOAD_TEST_TOKEN }}

      - uses: actions/upload-artifact@v4
        with:
          name: load-test-results-${{ inputs.test_type }}-${{ github.run_id }}
          path: tests/load/results/
          retention-days: 30
```

**Acceptance Criteria:**
- [ ] AC1: k6/Locust configured for A2A endpoints
- [ ] AC2: Baseline performance documented (p50, p95, p99)
- [ ] AC3: Load test runs in CI (on demand, not every PR)
- [ ] AC4: Performance regression alerts defined
- [ ] AC5: Load test results archived

---

### DM-09.7: CCR Operational Verification Tests

**Objective:** Verify CCR routing, fallback, and quota enforcement.

**Technical Approach:**

1. **Integration Tests** - Real CCR client behavior
2. **Routing Tests** - Primary model selection
3. **Fallback Tests** - Model failure recovery
4. **Quota Tests** - Limit enforcement
5. **Health Tests** - Connection validation

**Key Files:**
```
agents/tests/integration/
├── __init__.py               # NEW
├── conftest.py               # NEW - Integration fixtures
├── test_ccr_routing.py       # NEW
├── test_ccr_fallback.py      # NEW
├── test_ccr_quota.py         # NEW
└── test_ccr_health.py        # NEW
```

**Integration Fixtures:**
```python
# agents/tests/integration/conftest.py
"""
Integration test fixtures for CCR testing.

These tests require:
- Running CCR instance (or mock)
- Valid test credentials
- Test workspace with quota limits
"""

import pytest
import os
from typing import AsyncGenerator

# Import from DM-08.4 fixtures
from agents.tests.fixtures import mock_redis, async_mock_factory


@pytest.fixture
def ccr_enabled():
    """Skip test if CCR is not enabled."""
    if not os.getenv("CCR_ENABLED", "false").lower() == "true":
        pytest.skip("CCR not enabled")


@pytest.fixture
def ccr_test_config():
    """CCR test configuration."""
    return {
        "workspace_id": os.getenv("CCR_TEST_WORKSPACE", "test-workspace"),
        "primary_model": "claude-3-opus",
        "fallback_model": "claude-3-sonnet",
        "daily_limit": 10000,  # Test limit
    }


@pytest.fixture
async def ccr_client(ccr_enabled):
    """Create CCR client for integration tests."""
    from agents.models.ccr_provider import CCRClient

    client = CCRClient()
    yield client
    await client.close()


@pytest.fixture
async def exhausted_quota_workspace(ccr_test_config, mock_redis):
    """
    Create a workspace with exhausted quota.

    Uses mock Redis to simulate quota exhaustion.
    """
    workspace_id = f"quota-exhausted-{ccr_test_config['workspace_id']}"

    # Set quota to 0 remaining
    await mock_redis.set(
        f"ccr:quota:{workspace_id}:daily",
        ccr_test_config["daily_limit"]  # Used all tokens
    )

    return workspace_id
```

**CCR Routing Tests:**
```python
# agents/tests/integration/test_ccr_routing.py
"""CCR routing integration tests."""

import pytest
from agents.models.ccr_provider import CCRClient, route_request


@pytest.mark.integration
class TestCCRRouting:
    """Test CCR model routing behavior."""

    async def test_routes_to_primary_model(self, ccr_client, ccr_test_config):
        """Test CCR routes to primary model for standard tasks."""
        result = await ccr_client.route_request({
            "task": "code_review",
            "workspace_id": ccr_test_config["workspace_id"],
            "complexity": "standard",
        })

        assert result["success"] is True
        assert result["model"] == ccr_test_config["primary_model"]
        assert "routing_reason" in result

    async def test_routes_based_on_task_type(self, ccr_client, ccr_test_config):
        """Test CCR selects model based on task type."""
        # Complex task -> high-capability model
        complex_result = await ccr_client.route_request({
            "task": "architecture_design",
            "workspace_id": ccr_test_config["workspace_id"],
            "complexity": "high",
        })

        # Simple task -> efficient model
        simple_result = await ccr_client.route_request({
            "task": "text_formatting",
            "workspace_id": ccr_test_config["workspace_id"],
            "complexity": "low",
        })

        # Complex should use more capable model
        assert complex_result["model"] in ["claude-3-opus", "claude-3-sonnet"]
        # Simple can use efficient model
        assert simple_result["model"] is not None

    async def test_respects_workspace_preferences(self, ccr_client, ccr_test_config):
        """Test CCR respects workspace model preferences."""
        result = await ccr_client.route_request({
            "task": "content_generation",
            "workspace_id": ccr_test_config["workspace_id"],
            "preferred_provider": "anthropic",
        })

        assert result["success"] is True
        assert "claude" in result["model"].lower()

    async def test_returns_routing_metadata(self, ccr_client, ccr_test_config):
        """Test CCR returns useful routing metadata."""
        result = await ccr_client.route_request({
            "task": "code_review",
            "workspace_id": ccr_test_config["workspace_id"],
        })

        assert "latency_ms" in result
        assert "routing_reason" in result
        assert "alternatives" in result
```

**CCR Fallback Tests:**
```python
# agents/tests/integration/test_ccr_fallback.py
"""CCR fallback behavior tests."""

import pytest
from unittest.mock import patch, AsyncMock


@pytest.mark.integration
class TestCCRFallback:
    """Test CCR model fallback behavior."""

    async def test_falls_back_on_primary_failure(self, ccr_client, ccr_test_config):
        """Test CCR falls back when primary model fails."""
        # Mock primary model failure
        with patch.object(
            ccr_client,
            "_call_model",
            side_effect=[
                Exception("Primary model unavailable"),  # First call fails
                AsyncMock(return_value={"success": True}),  # Fallback succeeds
            ],
        ):
            result = await ccr_client.route_request({
                "task": "code_review",
                "workspace_id": ccr_test_config["workspace_id"],
            })

            assert result["success"] is True
            assert result["model"] == ccr_test_config["fallback_model"]
            assert result["fallback_used"] is True

    async def test_fallback_chain_exhaustion(self, ccr_client, ccr_test_config):
        """Test behavior when all fallbacks fail."""
        # Mock all models failing
        with patch.object(
            ccr_client,
            "_call_model",
            side_effect=Exception("All models unavailable"),
        ):
            result = await ccr_client.route_request({
                "task": "code_review",
                "workspace_id": ccr_test_config["workspace_id"],
            })

            assert result["success"] is False
            assert "error" in result
            assert "fallback_attempts" in result

    async def test_fallback_preserves_context(self, ccr_client, ccr_test_config):
        """Test fallback preserves request context."""
        original_context = {
            "task": "code_review",
            "workspace_id": ccr_test_config["workspace_id"],
            "custom_data": {"key": "value"},
        }

        with patch.object(
            ccr_client,
            "_call_model",
            side_effect=[
                Exception("Primary fails"),
                AsyncMock(return_value={"success": True, "context": original_context}),
            ],
        ):
            result = await ccr_client.route_request(original_context)

            # Context should be preserved through fallback
            assert result.get("context", {}).get("custom_data") == {"key": "value"}

    async def test_fallback_timeout_handling(self, ccr_client, ccr_test_config):
        """Test fallback handles timeout gracefully."""
        import asyncio

        async def slow_model(*args, **kwargs):
            await asyncio.sleep(10)  # Simulate slow response
            return {"success": True}

        with patch.object(ccr_client, "_call_model", side_effect=slow_model):
            with pytest.raises(asyncio.TimeoutError):
                await asyncio.wait_for(
                    ccr_client.route_request({
                        "task": "code_review",
                        "workspace_id": ccr_test_config["workspace_id"],
                    }),
                    timeout=1.0,
                )
```

**CCR Quota Tests:**
```python
# agents/tests/integration/test_ccr_quota.py
"""CCR quota enforcement tests."""

import pytest


@pytest.mark.integration
class TestCCRQuota:
    """Test CCR quota enforcement."""

    async def test_enforces_daily_quota(
        self, ccr_client, exhausted_quota_workspace
    ):
        """Test CCR respects daily quota limits."""
        result = await ccr_client.route_request({
            "task": "code_review",
            "workspace_id": exhausted_quota_workspace,
        })

        assert result["success"] is False
        assert result["error"] == "quota_exceeded"
        assert "remaining_tokens" in result
        assert result["remaining_tokens"] == 0

    async def test_returns_quota_status(self, ccr_client, ccr_test_config):
        """Test CCR returns quota information."""
        result = await ccr_client.get_quota_status(
            workspace_id=ccr_test_config["workspace_id"]
        )

        assert "daily_limit" in result
        assert "used_today" in result
        assert "remaining" in result
        assert "reset_at" in result

    async def test_quota_warning_threshold(self, ccr_client, ccr_test_config):
        """Test CCR warns when approaching quota limit."""
        # Use 80% of quota
        result = await ccr_client.route_request({
            "task": "code_review",
            "workspace_id": ccr_test_config["workspace_id"],
            "_test_used_percentage": 0.8,  # Test helper
        })

        assert result["success"] is True
        assert result.get("quota_warning") is True
        assert "quota_remaining_percentage" in result

    async def test_workspace_isolation(self, ccr_client):
        """Test quota is isolated per workspace."""
        workspace_a = "workspace-a-test"
        workspace_b = "workspace-b-test"

        # Exhaust workspace A quota
        await ccr_client._set_quota_used(workspace_a, 10000)

        # Workspace B should still work
        result = await ccr_client.route_request({
            "task": "code_review",
            "workspace_id": workspace_b,
        })

        assert result["success"] is True
```

**CCR Health Tests:**
```python
# agents/tests/integration/test_ccr_health.py
"""CCR health check tests."""

import pytest
from agents.models.ccr_provider import validate_ccr_connection, CCRClient


@pytest.mark.integration
class TestCCRHealth:
    """Test CCR health and connectivity."""

    async def test_validates_connection(self, ccr_enabled):
        """Test CCR connection validation."""
        is_healthy = await validate_ccr_connection()
        assert is_healthy is True

    async def test_health_check_endpoint(self, ccr_client):
        """Test CCR health check returns status."""
        health = await ccr_client.health_check()

        assert health["status"] in ["healthy", "degraded", "unhealthy"]
        assert "latency_ms" in health
        assert "available_models" in health

    async def test_detects_degraded_state(self, ccr_client):
        """Test CCR detects degraded service state."""
        # This would typically be tested with a staging CCR that has
        # intentional degradation
        health = await ccr_client.health_check(include_model_status=True)

        assert "model_status" in health
        for model, status in health["model_status"].items():
            assert status in ["available", "degraded", "unavailable"]

    async def test_connection_retry_logic(self, ccr_enabled):
        """Test connection retries on transient failures."""
        from unittest.mock import patch, AsyncMock

        call_count = 0

        async def flaky_connect():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ConnectionError("Transient failure")
            return True

        with patch(
            "agents.models.ccr_provider._connect",
            side_effect=flaky_connect,
        ):
            result = await validate_ccr_connection(max_retries=3)
            assert result is True
            assert call_count == 3
```

**Acceptance Criteria:**
- [ ] AC1: CCR routing tests pass
- [ ] AC2: Fallback behavior verified
- [ ] AC3: Quota enforcement verified
- [ ] AC4: Connection error handling verified
- [ ] AC5: Health check endpoint verified

---

### DM-09.8: LocalStorage Quota Testing

**Objective:** Ensure graceful handling of localStorage quota limits.

**Technical Approach:**

1. **Unit Tests** - Quota exceeded scenarios
2. **Graceful Degradation** - No crashes on quota exceeded
3. **Cleanup Strategy** - LRU eviction when near limit
4. **Monitoring** - Log quota warnings
5. **User Feedback** - Warning toast on quota issues

**Key Files:**
```
apps/web/src/
├── lib/storage/
│   ├── __tests__/
│   │   └── quota.test.ts         # NEW
│   └── quota-handler.ts          # NEW - Quota management
└── stores/
    └── __tests__/
        └── persistence.test.ts   # MODIFY - Add quota tests
```

**Quota Handler:**
```typescript
// apps/web/src/lib/storage/quota-handler.ts
import { logger } from '@/lib/logger';

const STORAGE_PREFIX = 'hyvve:';
const QUOTA_WARNING_THRESHOLD = 0.8; // 80%
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB (typical localStorage limit)

interface StorageResult {
  success: boolean;
  warning?: string;
  error?: string;
  bytesUsed?: number;
  bytesRemaining?: number;
}

/**
 * Get current localStorage usage estimate.
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      used += (key.length + (value?.length || 0)) * 2; // UTF-16
    }
  }

  return {
    used,
    total: MAX_STORAGE_SIZE,
    percentage: used / MAX_STORAGE_SIZE,
  };
}

/**
 * Safely set item in localStorage with quota handling.
 */
export function safeSetItem(key: string, value: string): StorageResult {
  const fullKey = `${STORAGE_PREFIX}${key}`;
  const valueSize = (fullKey.length + value.length) * 2;

  // Check current usage
  const usage = getStorageUsage();

  // Warn if approaching quota
  if (usage.percentage > QUOTA_WARNING_THRESHOLD) {
    logger.warn('localStorage approaching quota', {
      used: usage.used,
      percentage: usage.percentage,
    });
  }

  try {
    localStorage.setItem(fullKey, value);

    const newUsage = getStorageUsage();

    return {
      success: true,
      warning: newUsage.percentage > QUOTA_WARNING_THRESHOLD
        ? `Storage at ${Math.round(newUsage.percentage * 100)}% capacity`
        : undefined,
      bytesUsed: newUsage.used,
      bytesRemaining: MAX_STORAGE_SIZE - newUsage.used,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Attempt cleanup
      const cleaned = cleanupOldEntries();

      if (cleaned > 0) {
        // Retry after cleanup
        try {
          localStorage.setItem(fullKey, value);
          return {
            success: true,
            warning: 'Storage cleaned up to make room',
          };
        } catch {
          // Still failing
        }
      }

      logger.error('localStorage quota exceeded', { key, valueSize });

      return {
        success: false,
        error: 'Storage quota exceeded',
        bytesUsed: usage.used,
        bytesRemaining: 0,
      };
    }

    // Other error
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown storage error',
    };
  }
}

/**
 * Clean up old entries using LRU strategy.
 *
 * Returns number of bytes freed.
 */
export function cleanupOldEntries(targetFreeBytes = 100 * 1024): number {
  const entries: Array<{ key: string; timestamp: number; size: number }> = [];

  // Collect all HYVVE entries with timestamps
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        let timestamp = 0;
        try {
          const parsed = JSON.parse(value);
          timestamp = parsed._timestamp || parsed.timestamp || 0;
        } catch {
          // Non-JSON value, use 0 timestamp (oldest)
        }

        entries.push({
          key,
          timestamp,
          size: (key.length + value.length) * 2,
        });
      }
    }
  }

  // Sort by timestamp (oldest first)
  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest until we free enough space
  let freedBytes = 0;
  for (const entry of entries) {
    if (freedBytes >= targetFreeBytes) break;

    localStorage.removeItem(entry.key);
    freedBytes += entry.size;

    logger.debug('Cleaned up old storage entry', { key: entry.key, size: entry.size });
  }

  return freedBytes;
}

/**
 * Check if localStorage is available.
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
```

**Quota Tests:**
```typescript
// apps/web/src/lib/storage/__tests__/quota.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  safeSetItem,
  getStorageUsage,
  cleanupOldEntries,
  isStorageAvailable,
} from '../quota-handler';

describe('localStorage quota handling', () => {
  // Mock localStorage
  let mockStorage: Record<string, string> = {};
  let quotaExceeded = false;

  beforeEach(() => {
    mockStorage = {};
    quotaExceeded = false;

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        if (quotaExceeded) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw error;
        }
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      key: (index: number) => Object.keys(mockStorage)[index] || null,
      get length() {
        return Object.keys(mockStorage).length;
      },
      clear: () => {
        mockStorage = {};
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('safeSetItem', () => {
    it('stores item successfully when quota available', () => {
      const result = safeSetItem('test-key', JSON.stringify({ data: 'value' }));

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockStorage['hyvve:test-key']).toBeDefined();
    });

    it('gracefully handles quota exceeded', () => {
      quotaExceeded = true;

      const result = safeSetItem('test-key', JSON.stringify({ data: 'large-data' }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('quota');
    });

    it('cleans up old entries when quota exceeded', () => {
      // Pre-populate with old entries
      mockStorage['hyvve:old-1'] = JSON.stringify({ _timestamp: 1000, data: 'x'.repeat(1000) });
      mockStorage['hyvve:old-2'] = JSON.stringify({ _timestamp: 2000, data: 'x'.repeat(1000) });

      // Simulate quota exceeded on first try, then success
      let attempts = 0;
      vi.stubGlobal('localStorage', {
        ...localStorage,
        setItem: (key: string, value: string) => {
          attempts++;
          if (attempts === 1 && key === 'hyvve:new-key') {
            throw new DOMException('Quota exceeded', 'QuotaExceededError');
          }
          mockStorage[key] = value;
        },
      });

      const result = safeSetItem('new-key', JSON.stringify({ data: 'new' }));

      // Should have cleaned up and succeeded
      expect(result.success).toBe(true);
      expect(result.warning).toContain('cleaned up');
    });

    it('returns warning when approaching quota', () => {
      // Fill storage to 85%
      const largeData = 'x'.repeat(4 * 1024 * 1024); // 4MB
      mockStorage['hyvve:large'] = largeData;

      const result = safeSetItem('small', JSON.stringify({ data: 'small' }));

      expect(result.success).toBe(true);
      expect(result.warning).toContain('capacity');
    });
  });

  describe('cleanupOldEntries', () => {
    it('removes oldest entries first', () => {
      mockStorage['hyvve:oldest'] = JSON.stringify({ _timestamp: 1000 });
      mockStorage['hyvve:middle'] = JSON.stringify({ _timestamp: 2000 });
      mockStorage['hyvve:newest'] = JSON.stringify({ _timestamp: 3000 });

      cleanupOldEntries(100);

      expect(mockStorage['hyvve:oldest']).toBeUndefined();
      expect(mockStorage['hyvve:newest']).toBeDefined();
    });

    it('stops when target bytes freed', () => {
      mockStorage['hyvve:item1'] = JSON.stringify({ _timestamp: 1000, data: 'x'.repeat(50) });
      mockStorage['hyvve:item2'] = JSON.stringify({ _timestamp: 2000, data: 'x'.repeat(50) });
      mockStorage['hyvve:item3'] = JSON.stringify({ _timestamp: 3000, data: 'x'.repeat(50) });

      // Only request small cleanup
      cleanupOldEntries(100);

      // Should only remove first item
      expect(mockStorage['hyvve:item1']).toBeUndefined();
      expect(mockStorage['hyvve:item2']).toBeDefined();
      expect(mockStorage['hyvve:item3']).toBeDefined();
    });

    it('handles non-JSON values', () => {
      mockStorage['hyvve:plain'] = 'plain-text-value';
      mockStorage['hyvve:json'] = JSON.stringify({ _timestamp: Date.now() });

      // Non-JSON treated as oldest (timestamp 0)
      cleanupOldEntries(100);

      expect(mockStorage['hyvve:plain']).toBeUndefined();
      expect(mockStorage['hyvve:json']).toBeDefined();
    });
  });

  describe('getStorageUsage', () => {
    it('calculates storage usage correctly', () => {
      mockStorage['key1'] = 'value1';
      mockStorage['key2'] = 'value2';

      const usage = getStorageUsage();

      expect(usage.used).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(1);
    });
  });

  describe('isStorageAvailable', () => {
    it('returns true when localStorage works', () => {
      expect(isStorageAvailable()).toBe(true);
    });

    it('returns false when localStorage throws', () => {
      vi.stubGlobal('localStorage', {
        setItem: () => {
          throw new Error('Storage disabled');
        },
      });

      expect(isStorageAvailable()).toBe(false);
    });
  });
});
```

**Persistence Store Tests:**
```typescript
// apps/web/src/stores/__tests__/persistence.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveDashboardState, loadDashboardState } from '../dashboard-store';

describe('Dashboard state persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('quota handling', () => {
    it('logs warning but does not throw on quota exceeded', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      // Mock quota exceeded
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      const largeState = {
        widgets: Array(100).fill({ id: 'w', data: { large: 'x'.repeat(10000) } }),
      };

      // Should not throw
      const result = await saveDashboardState(largeState);

      expect(result.success).toBe(true);
      expect(result.warning).toContain('quota');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('preserves most recent data on quota cleanup', async () => {
      // Save old state
      await saveDashboardState({ widgets: [{ id: 'old', timestamp: 1000 }] });

      // Mock quota exceeded on next save
      let firstCall = true;
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
        if (firstCall && key.includes('dashboard')) {
          firstCall = false;
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        // Allow after cleanup
      });

      // Save new state
      const newState = { widgets: [{ id: 'new', timestamp: Date.now() }] };
      await saveDashboardState(newState);

      // Load and verify new state is preserved
      const loaded = loadDashboardState();
      expect(loaded?.widgets[0].id).toBe('new');
    });

    it('falls back to in-memory when localStorage unavailable', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const state = { widgets: [{ id: 'test' }] };
      const result = saveDashboardState(state);

      // Should still work (in-memory fallback)
      expect(result.success).toBe(true);
      expect(result.warning).toContain('memory');
    });
  });

  describe('data integrity', () => {
    it('validates loaded state structure', () => {
      // Store invalid JSON
      localStorage.setItem('hyvve:dashboard:state', 'not-json');

      const loaded = loadDashboardState();

      // Should return null for invalid data
      expect(loaded).toBeNull();
    });

    it('handles corrupted state gracefully', () => {
      // Store partial/corrupted state
      localStorage.setItem(
        'hyvve:dashboard:state',
        JSON.stringify({ widgets: 'not-an-array' })
      );

      const loaded = loadDashboardState();

      // Should return null or default state
      expect(loaded?.widgets).toBeUndefined();
    });
  });
});
```

**Acceptance Criteria:**
- [ ] AC1: Quota exceeded handling tested
- [ ] AC2: Graceful degradation verified
- [ ] AC3: Cleanup strategy tested
- [ ] AC4: Quota warning logged
- [ ] AC5: No data loss on quota exceeded

---

## Test Strategy

### Test Coverage Matrix

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| DM-09.1 | Tracer config | Span export | N/A |
| DM-09.2 | Metric definitions | Scrape endpoint | N/A |
| DM-09.3 | Fixtures | Page objects | Setup validation |
| DM-09.4 | N/A | N/A | Critical flows |
| DM-09.5 | N/A | N/A | Visual snapshots |
| DM-09.6 | N/A | Load scenarios | N/A |
| DM-09.7 | Mock tests | CCR integration | N/A |
| DM-09.8 | Quota handling | N/A | N/A |

### Using DM-08 Fixtures

All new Python tests MUST use the fixtures from `agents/tests/fixtures/`:

```python
# Example: Using DM-08 fixtures in DM-09 tests
from agents.tests.fixtures import (
    mock_redis,
    mock_redis_pipeline,
    async_mock_factory,
    async_context_manager,
)

@pytest.fixture
def mock_otel_exporter(async_mock_factory):
    """Mock OpenTelemetry exporter using DM-08 patterns."""
    return async_mock_factory(return_value={"success": True})
```

---

## Performance Metrics

| Metric | Baseline | Target | Story |
|--------|----------|--------|-------|
| Trace export latency | N/A | <10ms overhead | DM-09.1 |
| Metrics scrape time | N/A | <100ms | DM-09.2 |
| E2E test duration | N/A | <2 min | DM-09.4 |
| A2A p95 latency | Unknown | <500ms | DM-09.6 |
| Visual diff detection | Manual | Automated | DM-09.5 |

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation | Story |
|------|------------|--------|------------|-------|
| E2E test flakiness | High | Medium | Explicit waits, network mocking | DM-09.3, DM-09.4 |
| Trace overhead | Medium | Low | Sampling rate, async export | DM-09.1 |
| Load test env impact | Medium | High | Isolated environment, rate limits | DM-09.6 |
| Visual baseline churn | Medium | Low | Design freeze during baseline | DM-09.5 |
| CCR test failures | Low | Medium | Mock fallbacks, skip on CI | DM-09.7 |
| localStorage browser variance | Low | Low | Feature detection, fallbacks | DM-09.8 |

---

## Success Criteria

1. **A2A calls traceable** end-to-end in Jaeger UI
2. **Prometheus metrics** scraped and graphable
3. **E2E tests pass** consistently (10 consecutive runs)
4. **Visual regressions detected** before merge
5. **Performance baseline** documented (p50, p95, p99)
6. **CCR integration verified** with routing and fallback
7. **localStorage quota** handled gracefully

---

## File Structure Summary

### New Files
```
agents/
├── observability/
│   ├── __init__.py
│   ├── tracing.py
│   ├── config.py
│   ├── decorators.py
│   └── metrics.py
├── api/routes/
│   └── metrics.py
└── tests/integration/
    ├── __init__.py
    ├── conftest.py
    ├── test_ccr_routing.py
    ├── test_ccr_fallback.py
    ├── test_ccr_quota.py
    └── test_ccr_health.py

apps/web/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   ├── dashboard.fixture.ts
│   │   ├── api-mock.fixture.ts
│   │   └── index.ts
│   ├── pages/
│   │   ├── base.page.ts
│   │   ├── dashboard.page.ts
│   │   ├── approval.page.ts
│   │   └── index.ts
│   ├── tests/
│   │   ├── progress-streaming.spec.ts
│   │   ├── approval-queue.spec.ts
│   │   └── dashboard-widgets.spec.ts
│   └── global-setup.ts
├── src/components/__visual_tests__/
│   ├── widgets.visual.ts
│   └── hitl.visual.ts
├── src/lib/storage/
│   ├── __tests__/quota.test.ts
│   └── quota-handler.ts
└── .percy.yml

tests/
├── load/
│   ├── k6/
│   │   ├── a2a-endpoints.js
│   │   ├── dashboard-flow.js
│   │   └── config.js
│   └── results/.gitkeep
└── scripts/
    └── run-load-tests.sh

.github/workflows/
├── e2e.yml
├── visual.yml
└── load-test.yml

docs/observability/
└── grafana-agentos-dashboard.json
```

### Modified Files
```
agents/
├── main.py                   # Add OTel instrumentation
├── requirements.txt          # Add OTel packages
└── requirements-dev.txt      # Add testing deps

apps/web/
├── playwright.config.ts      # E2E config
├── package.json              # Add Percy deps
└── src/stores/__tests__/
    └── persistence.test.ts   # Add quota tests

docker/
└── docker-compose.yml        # Add Jaeger service
```

---

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Source document
- [DM-03 Retrospective](./epic-dm-03-retrospective.md) - REC-04, REC-06, REC-16
- [DM-05 Retrospective](../../sprint-artifacts/epic-dm-05-retrospective.md) - REC-22, REC-23, REC-24
- [DM-08 Tech Spec](./epic-dm-08-tech-spec.md) - Async fixtures, caching, rate limiting patterns
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Percy Documentation](https://docs.percy.io/)
- [k6 Documentation](https://k6.io/docs/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)

---

*Tech Spec generated: 2025-12-31*
*Epic: DM-09 Observability & Testing Infrastructure*
