# Epic DM-09: Observability & Testing Infrastructure

## Overview

Implement comprehensive observability through distributed tracing, metrics exposure, and robust end-to-end testing infrastructure. This epic addresses testing gaps and observability recommendations from the [Tech Debt Consolidated Document](../tech-debt-consolidated.md).

## Source Reference

**Tech Debt Document:** `docs/modules/bm-dm/tech-debt-consolidated.md`
**Priority:** Sprint 3 - Could Do (Observability & Testing)
**Items Addressed:** REC-04, REC-06, REC-16, REC-22, REC-23, REC-24, Testing Gaps 1-6

## Scope

### Observability Items

| ID | Item | Category | Source Epic |
|----|------|----------|-------------|
| REC-04 | Distributed tracing (OpenTelemetry) for A2A calls | Observability | DM-03 |
| REC-06 | Expose `duration_ms` metrics to monitoring system | Observability | DM-03 |
| REC-16 | Load testing for A2A endpoints | Performance | DM-03 |

### Testing Gap Items

| ID | Gap | Risk Level | Source Epic |
|----|-----|------------|-------------|
| Testing Gap #1 | Visual regression tests for widgets | Medium | DM-03, DM-05 |
| Testing Gap #2 | Load testing for A2A endpoints | High | DM-03 |
| Testing Gap #3 | E2E tests for progress streaming | Medium | DM-05 |
| Testing Gap #4 | CCR operational verification | High | DM-02 |
| Testing Gap #5 | localStorage quota testing | Medium | DM-04 |
| Testing Gap #6 | E2E tests for approval queue flow | Medium | DM-05 |
| REC-22 | Address pre-existing test failures before new epics | Medium | DM-05 |
| REC-23 | E2E tests for critical flows | High | DM-05 |
| REC-24 | Visual regression tests for HITL cards | Medium | DM-05 |

## Proposed Stories

### Story DM-09.1: OpenTelemetry Integration

**Problem:** No distributed tracing across A2A calls, making debugging multi-agent flows difficult.

**Root Cause (from DM-03 Retrospective):**
- Agent calls span multiple services
- No correlation IDs for request tracing
- Performance bottlenecks hard to identify

**Implementation:**
- Add OpenTelemetry SDK to Python agents
- Configure trace exporters (Jaeger, Zipkin, or OTLP)
- Add spans for A2A request/response cycles
- Propagate trace context through headers
- Add spans for key operations (database, Redis, external APIs)

**Instrumentation Points:**
```python
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor

# Auto-instrument FastAPI
FastAPIInstrumentor.instrument()

# Auto-instrument HTTP clients
HTTPXClientInstrumentor.instrument()

# Custom spans for A2A
tracer = trace.get_tracer(__name__)

async def call_agent(agent_id: str, request: dict):
    with tracer.start_as_current_span(f"a2a.{agent_id}") as span:
        span.set_attribute("agent.id", agent_id)
        span.set_attribute("request.type", request.get("type"))
        result = await _do_call(agent_id, request)
        span.set_attribute("response.success", result.get("success", False))
        return result
```

**Files to Create/Modify:**
```
agents/
├── observability/
│   ├── __init__.py
│   ├── tracing.py
│   └── config.py
├── main.py (add instrumentation)
└── requirements.txt (add otel packages)

docker/
└── docker-compose.yaml (add Jaeger)
```

**Acceptance Criteria:**
- [ ] AC1: OpenTelemetry configured in agent system
- [ ] AC2: A2A calls create linked spans
- [ ] AC3: Trace context propagated in headers
- [ ] AC4: Traces viewable in Jaeger/Zipkin UI
- [ ] AC5: Sampling rate configurable

**Points:** 8

---

### Story DM-09.2: Metrics Exposure System

**Problem:** Performance metrics (duration_ms) not exposed to monitoring.

**Root Cause (from DM-03 Retrospective):**
- Metrics collected but not exported
- No Prometheus/StatsD integration

**Implementation:**
- Add Prometheus metrics exporter
- Expose key metrics: request duration, queue length, error rates
- Add `/metrics` endpoint for scraping
- Create Grafana dashboard templates

**Metrics to Expose:**
```python
from prometheus_client import Histogram, Counter, Gauge

REQUEST_DURATION = Histogram(
    'a2a_request_duration_seconds',
    'A2A request duration',
    ['agent', 'operation']
)

REQUEST_COUNT = Counter(
    'a2a_requests_total',
    'Total A2A requests',
    ['agent', 'status']
)

ACTIVE_TASKS = Gauge(
    'a2a_active_tasks',
    'Currently active A2A tasks',
    ['agent']
)
```

**Files to Create/Modify:**
```
agents/
├── observability/
│   └── metrics.py
├── api/
│   └── routes/
│       └── metrics.py (/metrics endpoint)
└── gateway/
    └── dashboard_gateway.py (add metrics)
```

**Acceptance Criteria:**
- [ ] AC1: Prometheus metrics endpoint at `/metrics`
- [ ] AC2: Request duration histogram per agent/operation
- [ ] AC3: Request count with success/failure labels
- [ ] AC4: Active task gauge updated in real-time
- [ ] AC5: Grafana dashboard template provided

**Points:** 5

---

### Story DM-09.3: E2E Test Infrastructure Setup

**Problem:** No E2E test framework for critical flows like progress streaming and approval queue.

**Gaps Addressed:**
- Testing Gap #3: E2E tests for progress streaming
- Testing Gap #6: E2E tests for approval queue flow
- REC-23: E2E tests for critical flows

**Implementation:**
- Set up Playwright for browser-based E2E tests
- Configure test fixtures for authenticated sessions
- Create test utilities for API mocking
- Implement page object models for key pages
- Set up CI integration for E2E runs

**Test Structure:**
```
apps/web/
├── e2e/
│   ├── fixtures/
│   │   ├── auth.ts
│   │   └── dashboard.ts
│   ├── pages/
│   │   ├── dashboard.page.ts
│   │   └── approval.page.ts
│   ├── tests/
│   │   ├── progress-streaming.spec.ts
│   │   ├── approval-queue.spec.ts
│   │   └── dashboard-widgets.spec.ts
│   └── playwright.config.ts
```

**Acceptance Criteria:**
- [ ] AC1: Playwright configured with TypeScript
- [ ] AC2: Auth fixture for logged-in sessions
- [ ] AC3: CI pipeline runs E2E tests on PR
- [ ] AC4: Page object models for Dashboard, Approval Queue
- [ ] AC5: Test report artifacts saved

**Points:** 8

---

### Story DM-09.4: Critical Flow E2E Tests

**Problem:** Critical user flows lack automated verification.

**Flows to Test:**
1. Progress streaming (Task status → Widget update → Completion)
2. Approval queue (Submit → Review → Approve/Reject)
3. Dashboard widget lifecycle (Load → Update → Error handling)

**Implementation:**
- Write E2E tests for progress streaming flow
- Write E2E tests for approval queue flow
- Write E2E tests for dashboard widget interactions
- Add network mocking for deterministic tests

**Test Examples:**
```typescript
// progress-streaming.spec.ts
test('task progress updates widget in real-time', async ({ page }) => {
  await page.goto('/dashboard');

  // Trigger long-running task
  await page.click('[data-testid="start-task"]');

  // Verify progress updates
  await expect(page.locator('[data-testid="progress-bar"]'))
    .toHaveAttribute('aria-valuenow', '0');

  // Wait for progress
  await expect(page.locator('[data-testid="progress-bar"]'))
    .toHaveAttribute('aria-valuenow', '50', { timeout: 10000 });

  // Verify completion
  await expect(page.locator('[data-testid="task-status"]'))
    .toHaveText('Completed', { timeout: 30000 });
});
```

**Acceptance Criteria:**
- [ ] AC1: Progress streaming E2E test passes
- [ ] AC2: Approval queue E2E test passes
- [ ] AC3: Widget lifecycle E2E test passes
- [ ] AC4: Tests run in <2 minutes total
- [ ] AC5: Tests stable (no flakes in 10 consecutive runs)

**Points:** 8

---

### Story DM-09.5: Visual Regression Testing

**Problem:** UI changes may introduce visual regressions undetected.

**Gaps Addressed:**
- Testing Gap #1: Visual regression tests for widgets
- REC-24: Visual regression tests for HITL cards

**Implementation:**
- Set up Percy or Chromatic for visual testing
- Add snapshot tests for all widget components
- Add snapshot tests for HITL approval cards
- Configure visual diff thresholds
- Integrate with CI pipeline

**Components to Snapshot:**
```
- TaskCard (all states: pending, active, completed, error)
- ProjectStatus (healthy, warning, critical)
- MetricsWidget (positive/negative trends)
- AlertWidget (info, warning, error levels)
- ApprovalCard (pending, approved, rejected)
- ProgressIndicator (0%, 50%, 100%, error)
```

**Files to Create:**
```
apps/web/src/
├── components/
│   └── __visual_tests__/
│       ├── widgets.visual.ts
│       └── hitl.visual.ts
└── .percy.yml
```

**Acceptance Criteria:**
- [ ] AC1: Percy/Chromatic configured and connected
- [ ] AC2: All widget states have baseline snapshots
- [ ] AC3: HITL cards have baseline snapshots
- [ ] AC4: Visual diffs reported on PRs
- [ ] AC5: Threshold set to catch >1% pixel change

**Points:** 5

---

### Story DM-09.6: Load Testing Infrastructure

**Problem:** A2A endpoint performance under load is unknown.

**Gaps Addressed:**
- Testing Gap #2: Load testing for A2A endpoints
- REC-16: Load testing for A2A endpoints

**Implementation:**
- Set up k6 or Locust for load testing
- Create load test scenarios for A2A endpoints
- Define performance baselines
- Add load testing to release process
- Document performance characteristics

**Load Test Scenarios:**
```javascript
// k6 load test
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp up
    { duration: '3m', target: 50 },  // Steady
    { duration: '1m', target: 100 }, // Spike
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  const res = http.post('http://localhost:8000/a2a/query', {
    agent: 'dashboard_gateway',
    action: 'get_widgets',
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

**Files to Create:**
```
tests/
├── load/
│   ├── k6/
│   │   ├── a2a-endpoints.js
│   │   └── dashboard-flow.js
│   └── results/
│       └── .gitkeep
└── scripts/
    └── run-load-tests.sh
```

**Acceptance Criteria:**
- [ ] AC1: k6/Locust configured for A2A endpoints
- [ ] AC2: Baseline performance documented (p50, p95, p99)
- [ ] AC3: Load test runs in CI (on demand, not every PR)
- [ ] AC4: Performance regression alerts defined
- [ ] AC5: Load test results archived

**Points:** 8

---

### Story DM-09.7: CCR Operational Verification Tests

**Problem:** CCR (Claude Code Router) integration lacks operational verification.

**Gap Addressed:** Testing Gap #4: CCR operational verification

**Implementation:**
- Create integration tests for CCR routing
- Test model fallback scenarios
- Verify quota enforcement
- Test connection error handling
- Add health check verification

**Test Scenarios:**
```python
@pytest.mark.integration
async def test_ccr_routing_primary():
    """Test CCR routes to primary model."""
    result = await ccr_client.route_request({"task": "code_review"})
    assert result["model"] == "claude-3-opus"

@pytest.mark.integration
async def test_ccr_fallback():
    """Test CCR falls back when primary fails."""
    with mock_model_failure("claude-3-opus"):
        result = await ccr_client.route_request({"task": "code_review"})
        assert result["model"] == "claude-3-sonnet"

@pytest.mark.integration
async def test_ccr_quota_enforcement():
    """Test CCR respects quota limits."""
    await exhaust_quota("workspace-1")
    result = await ccr_client.route_request(
        {"task": "code_review"},
        workspace="workspace-1"
    )
    assert result["error"] == "quota_exceeded"
```

**Files to Create:**
```
agents/
└── tests/
    └── integration/
        ├── test_ccr_routing.py
        ├── test_ccr_fallback.py
        └── test_ccr_quota.py
```

**Acceptance Criteria:**
- [ ] AC1: CCR routing tests pass
- [ ] AC2: Fallback behavior verified
- [ ] AC3: Quota enforcement verified
- [ ] AC4: Connection error handling verified
- [ ] AC5: Health check endpoint verified

**Points:** 5

---

### Story DM-09.8: LocalStorage Quota Testing

**Problem:** Dashboard state persistence may fail silently if localStorage quota exceeded.

**Gap Addressed:** Testing Gap #5: localStorage quota testing

**Implementation:**
- Add unit tests for localStorage quota handling
- Test quota exceeded scenarios
- Verify graceful degradation
- Test cleanup strategies
- Add monitoring for quota usage

**Test Scenarios:**
```typescript
describe('localStorage quota handling', () => {
  it('gracefully handles quota exceeded', async () => {
    // Fill localStorage to near capacity
    fillLocalStorageToCapacity();

    // Attempt to save dashboard state
    const result = await saveDashboardState(largeState);

    // Should not throw, but may truncate or skip
    expect(result.success).toBe(true);
    expect(result.warning).toContain('quota');
  });

  it('cleans up old state when quota near', async () => {
    fillLocalStorageToNearCapacity();

    await saveDashboardState(newState);

    // Should have cleaned up oldest entries
    expect(localStorage.length).toBeLessThan(previousLength);
  });
});
```

**Files to Modify:**
```
apps/web/src/
├── lib/storage/
│   └── __tests__/
│       └── quota.test.ts
└── stores/
    └── __tests__/
        └── persistence.test.ts
```

**Acceptance Criteria:**
- [ ] AC1: Quota exceeded handling tested
- [ ] AC2: Graceful degradation verified
- [ ] AC3: Cleanup strategy tested
- [ ] AC4: Quota warning logged
- [ ] AC5: No data loss on quota exceeded

**Points:** 3

---

## Total Points: 50

## Dependencies

- DM-07 (Tests must pass first)
- DM-08 (Caching affects test behavior)

## Technical Notes

### OpenTelemetry Configuration

```python
# agents/observability/config.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

def configure_tracing():
    provider = TracerProvider()
    processor = BatchSpanProcessor(
        OTLPSpanExporter(endpoint="http://jaeger:4317")
    )
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

## Risks

1. **E2E Test Flakiness** - Async operations may cause intermittent failures
2. **Load Test Environment** - Need isolated environment to avoid impacting production
3. **Visual Baseline Churn** - Design changes require baseline updates

## Success Criteria

- A2A calls traceable end-to-end
- Performance baselines documented
- Critical flows have automated E2E tests
- Visual regressions caught before merge
- Load characteristics understood

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Source document
- [DM-03 Retrospective](epic-dm-03-retrospective.md) - REC-04, REC-06, REC-16
- [DM-05 Retrospective](../../sprint-artifacts/epic-dm-05-retrospective.md) - REC-22, REC-23, REC-24
- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [k6 Documentation](https://k6.io/docs/)
