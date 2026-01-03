# Observability Stack Runbook

Operations guide for the HYVVE observability infrastructure.

## Stack Overview

| Component | Purpose | Port |
|-----------|---------|------|
| Jaeger | Distributed tracing | 16686 |
| Prometheus | Metrics collection | 9090 |
| Grafana | Dashboards | 3001 |
| Loki | Log aggregation | 3100 |

## Deployment

### Docker Compose (Development)

```bash
# Start observability stack
docker compose -f docker-compose.observability.yml up -d

# Check status
docker compose -f docker-compose.observability.yml ps

# View logs
docker compose -f docker-compose.observability.yml logs -f jaeger
```

### Production (Kubernetes)

```bash
# Deploy with Helm
helm repo add grafana https://grafana.github.io/helm-charts
helm install loki grafana/loki-stack

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/prometheus

helm repo add jaegertracing https://jaegertracing.github.io/helm-charts
helm install jaeger jaegertracing/jaeger
```

## Accessing Services

### Local Development

| Service | URL |
|---------|-----|
| Jaeger UI | http://localhost:16686 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

### Production

Access via ingress with authentication:
- `https://jaeger.hyvve.app`
- `https://grafana.hyvve.app`

## Common Tasks

### Viewing Traces

1. Open Jaeger UI
2. Select service: `hyvve-api` or `agentos`
3. Set time range
4. Click "Find Traces"

### Finding Slow Requests

```promql
# Prometheus query for slow API requests
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket{service="hyvve-api"}[5m])
) > 1
```

### Checking Error Rates

```promql
# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100
```

### Viewing Agent Logs

```bash
# Loki query (LogQL)
{app="agentos"} |= "error"

# With JSON parsing
{app="agentos"} | json | level="error"
```

## Alerting

### Prometheus Alerts

```yaml
# prometheus/alerts.yml
groups:
  - name: hyvve
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: AgentUnhealthy
        expr: up{job="agentos"} == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: AgentOS instance is down
```

### Grafana Alerts

Configure in Grafana UI:
1. Edit panel → Alert tab
2. Create alert rule
3. Set notification channel (Slack, email, etc.)

## Dashboards

### Importing HYVVE Dashboards

```bash
# Import via Grafana API
curl -X POST -H "Content-Type: application/json" \
  -d @dashboards/hyvve-overview.json \
  http://admin:admin@localhost:3001/api/dashboards/db
```

### Key Dashboards

| Dashboard | Metrics |
|-----------|---------|
| API Overview | Request rate, latency, errors |
| Agent Performance | A2A tasks, duration, success rate |
| HITL Approvals | Pending, approved, rejected, timeout |
| WebSocket | Active connections, message rate |

## Troubleshooting

### Traces Not Appearing

1. Check OTEL_ENABLED=true in service config
2. Verify Jaeger is running: `docker ps | grep jaeger`
3. Check connectivity: `curl http://localhost:4317`
4. View collector logs: `docker logs jaeger`

### Metrics Missing

1. Verify Prometheus is scraping:
   - Go to http://localhost:9090/targets
   - Check target status
2. Verify service exposes /metrics endpoint
3. Check Prometheus config for correct targets

### Logs Not Aggregating

1. Check Loki is running
2. Verify promtail config includes log paths
3. Check promtail logs for errors

### High Memory Usage

```bash
# Check Prometheus memory
curl -s http://localhost:9090/metrics | grep process_resident_memory

# Reduce retention if needed
# prometheus.yml
storage:
  tsdb:
    retention.time: 7d  # Reduce from default 15d
```

## Retention Policies

| Data Type | Development | Production |
|-----------|-------------|------------|
| Traces | 24 hours | 7 days |
| Metrics | 7 days | 30 days |
| Logs | 3 days | 14 days |

## Security

### Metrics Endpoint Authentication

```typescript
// NestJS metrics endpoint with auth
@Get('metrics')
@UseGuards(MetricsAuthGuard)
async getMetrics() {
  return this.prometheusService.getMetrics();
}
```

### Grafana Access Control

1. Enable authentication
2. Create read-only role for dashboards
3. Restrict alert management to admins

## Related Documentation

- [OpenTelemetry Usage Guide](../guides/opentelemetry-usage.md)
- [Metrics Auth Key Rotation](./key-rotation.md)
