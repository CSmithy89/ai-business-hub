# Observability Guide

The HYVVE API now exposes Prometheus-compatible metrics at `GET /metrics`.
Scrape the endpoint every 15 seconds to populate Grafana dashboards.

## Metric Inventory

| Metric | Type | Labels | Description |
| ------ | ---- | ------ | ----------- |
| `http_requests_total` | Counter | `method`, `route`, `status` | Total HTTP requests processed |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Request latency (buckets: 50ms-10s) |
| `active_http_connections` | Gauge | — | Open HTTP keep-alive connections |
| `event_bus_throughput_total` | Counter | `stream` | Total events published per stream |
| `event_bus_consumer_lag` | Gauge | `consumer_group` | Redis Stream consumer lag |
| `event_bus_dlq_size` | Gauge | — | Size of DLQ stream |
| `approval_queue_depth` | Gauge | `status` | Pending/approved/rejected/auto_approved counts |
| `ai_provider_health` | Gauge | `provider`, `workspace`, `provider_id` | Provider health (1 healthy, 0 unhealthy) |

## Prometheus Scrape Example

```yaml
scrape_configs:
  - job_name: 'hyvve-api'
    scheme: http
    metrics_path: /metrics
    static_configs:
      - targets: ['api.hyvve.local:3001']
```

## Alert Ideas

- `event_bus_dlq_size > 50` for 5 minutes → DLQ runbook
- `event_bus_consumer_lag > 100` → replay backlog investigation
- `approval_queue_depth{status="pending"} > 500` → staffing or automation issue
- `ai_provider_health == 0` for critical providers → rotate API keys
