# Troubleshooting: Performance Issues

## Signals
- Latency spikes on `/api/metrics` dashboards (HTTP histogram) or agent APIs
- Elevated queue lag or DLQ growth
- CPU/memory saturation or connection pool exhaustion

## Checks
- Grafana: API latency, error rate, DB/Redis resource panels.
- `/api/metrics`: `http_request_duration_seconds`, `http_requests_total`, event bus gauges.
- Logs: timeouts, slow queries, long-running tasks.
- Recent deploys/feature flags impacting performance.

## Steps
1. **Scope** affected endpoints/routes and time window.
2. **Check resource saturation**: DB connections, Redis latency, CPU/memory.
3. **Inspect slow queries** (DB dashboard) and recent migrations.
4. **Review queues**: consumer lag; pause noisy producers if needed.
5. **Profile** hot endpoints in staging if regression suspected.

## Mitigations
- Scale out API/agent replicas; increase queue consumers temporarily.
- Apply emergency query/index fix if clear and safe.
- Roll back recent deploy or disable feature flag causing load.
- Throttle/shape incoming traffic if runaway client is identified.

## Verification
- Latency and error rate return to baseline.
- DLQ/lag clears and remains stable.
- Resource utilization normalized.

## Escalation / Related
- For persistent DLQ/lag, use [DLQ Management](../dlq-management.md).
- For auth-related bottlenecks, see [Auth Failures](./auth-failures.md).
- Follow [Incident Response](../incident-response.md) for Sev1/Sev2.
