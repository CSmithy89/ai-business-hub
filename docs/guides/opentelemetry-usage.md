# OpenTelemetry Usage Guide

How to instrument, monitor, and debug HYVVE using OpenTelemetry (OTel).

## Overview

HYVVE uses OpenTelemetry for:
- **Traces**: Request flow across services
- **Metrics**: Performance and business metrics
- **Logs**: Structured logging with trace context

## Configuration

### Environment Variables

```bash
# Enable/disable telemetry
OTEL_ENABLED=true

# Exporter endpoint (Jaeger, Tempo, etc.)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Service identification
OTEL_SERVICE_NAME=hyvve-api
OTEL_SERVICE_VERSION=1.0.0

# Sampling (1.0 = all, 0.1 = 10%)
OTEL_TRACES_SAMPLER_ARG=1.0
```

### NestJS API Setup

```typescript
// apps/api/src/telemetry/otel.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

export function initTelemetry() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new NestInstrumentation(),
    ],
  });

  sdk.start();
}
```

### AgentOS Setup

```python
# agents/telemetry/otel.py
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter

def init_telemetry():
    # Traces
    trace.set_tracer_provider(TracerProvider())
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter())
    )

    # Metrics
    metrics.set_meter_provider(MeterProvider(
        metric_readers=[PeriodicExportingMetricReader(OTLPMetricExporter())]
    ))
```

## Tracing

### Manual Span Creation

```typescript
// TypeScript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('hyvve-api');

async function processWidget(widgetId: string) {
  return tracer.startActiveSpan('process-widget', async (span) => {
    span.setAttribute('widget.id', widgetId);

    try {
      const result = await doWork();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

```python
# Python
from opentelemetry import trace

tracer = trace.get_tracer("agentos")

async def process_a2a_task(task_id: str):
    with tracer.start_as_current_span("process-a2a-task") as span:
        span.set_attribute("task.id", task_id)

        try:
            result = await execute_task()
            span.set_status(Status(StatusCode.OK))
            return result
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR))
            raise
```

### Trace Context Propagation

```typescript
// Propagate context in HTTP headers
import { propagation, context } from '@opentelemetry/api';

function makeA2ACall(url: string, body: any) {
  const headers = {};
  propagation.inject(context.active(), headers);

  return fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
```

## Metrics

### Custom Metrics

```typescript
// Counter
const widgetRenderCount = meter.createCounter('widget.render.count', {
  description: 'Number of widgets rendered',
});
widgetRenderCount.add(1, { widget_type: 'metrics' });

// Histogram (latency)
const requestDuration = meter.createHistogram('http.request.duration', {
  description: 'HTTP request duration in ms',
  unit: 'ms',
});
requestDuration.record(123.45, { path: '/api/dashboard' });

// Gauge (current value)
const activeConnections = meter.createObservableGauge('ws.connections.active', {
  description: 'Active WebSocket connections',
});
activeConnections.addCallback((result) => {
  result.observe(getConnectionCount());
});
```

### Standard Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http.request.duration` | Histogram | HTTP request latency |
| `http.request.count` | Counter | HTTP request count |
| `a2a.task.duration` | Histogram | A2A task execution time |
| `a2a.task.count` | Counter | A2A task count |
| `widget.render.duration` | Histogram | Widget rendering time |
| `ws.connections.active` | Gauge | Active WebSocket connections |
| `approval.pending` | Gauge | Pending HITL approvals |

## Viewing Telemetry

### Local Development (Jaeger)

```bash
# Start Jaeger
docker run -d \
  -p 16686:16686 \
  -p 4317:4317 \
  jaegertracing/all-in-one:latest

# View UI
open http://localhost:16686
```

### Finding Slow Requests

1. Open Jaeger UI
2. Select service `hyvve-api`
3. Set operation to `HTTP POST /api/dashboard`
4. Sort by Duration (descending)
5. Click trace to see breakdown

### Cross-Service Traces

A2A requests create spans across services:

```
hyvve-api
└── POST /api/dashboard (150ms)
    └── agentos
        └── process-a2a-task (120ms)
            ├── navi-agent (40ms)
            ├── sage-agent (50ms)
            └── compose-widgets (30ms)
```

## Debugging

### Missing Traces

1. Check `OTEL_ENABLED=true`
2. Verify exporter endpoint is reachable
3. Check sampling rate isn't 0

### High Cardinality

Avoid attributes with unbounded values:
```typescript
// Bad - creates too many time series
span.setAttribute('user.email', email);

// Good - use IDs or buckets
span.setAttribute('user.id', userId);
span.setAttribute('request.size.bucket', getSizeBucket(size));
```

## Related Documentation

- [Observability Stack Runbook](../runbooks/observability-stack.md)
- [A2A Request Flow](../architecture/diagrams/a2a-request-flow.md)
