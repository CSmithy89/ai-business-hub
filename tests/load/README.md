# HYVVE Platform Load Testing

This directory contains k6 load tests for the HYVVE platform. Load tests verify performance baselines and detect regressions in A2A endpoints, dashboard flows, and CCR routing.

## Quick Start

### Prerequisites

1. **Install k6:**
   ```bash
   # macOS
   brew install k6

   # Linux (Debian/Ubuntu)
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6

   # Docker
   docker pull grafana/k6
   ```

2. **Start the platform:**
   ```bash
   # From project root
   docker compose up -d
   ```

### Running Tests Locally

Use the runner script for convenient execution:

```bash
# Run all tests
./tests/scripts/run-load-tests.sh all

# Run specific test
./tests/scripts/run-load-tests.sh a2a
./tests/scripts/run-load-tests.sh dashboard
./tests/scripts/run-load-tests.sh ccr

# Override target URL
./tests/scripts/run-load-tests.sh --base-url http://staging:7777 a2a

# Override VUs and duration
./tests/scripts/run-load-tests.sh --vus 100 --duration 5m a2a

# Dry run (print commands without executing)
./tests/scripts/run-load-tests.sh --dry-run all
```

Or run k6 directly:

```bash
cd tests/load

# A2A endpoints test
k6 run k6/a2a-endpoints.js

# Dashboard flow test
k6 run k6/dashboard-flow.js

# CCR routing test
k6 run k6/ccr-routing.js

# With environment variables
k6 run -e BASE_URL=http://staging:7777 -e AUTH_TOKEN=xxx k6/a2a-endpoints.js
```

## Test Scenarios

### 1. A2A Endpoints (`k6/a2a-endpoints.js`)

Tests A2A protocol endpoints under load:

| Stage | Duration | Target VUs | Purpose |
|-------|----------|------------|---------|
| Ramp up | 30s | 0 -> 20 | Gradual warm-up |
| Ramp to steady | 2m | 20 -> 50 | Increase to target |
| Steady state | 2m | 50 | Baseline measurement |
| Spike | 30s | 50 -> 100 | Stress test |
| Recovery | 30s | 100 -> 50 | Recovery validation |
| Ramp down | 30s | 50 -> 0 | Graceful shutdown |

**Endpoints Tested:**
- `GET /.well-known/agent.json` - Global agent discovery
- `GET /.well-known/agents` - Multi-agent listing
- `GET /a2a/{agent}/.well-known/agent.json` - Individual agent discovery
- `POST /a2a/dashboard/rpc` - Dashboard Gateway RPC
- `POST /a2a/navi/rpc` - Navi PM Agent RPC
- `POST /a2a/pulse/rpc` - Pulse Agent RPC
- `POST /a2a/herald/rpc` - Herald Agent RPC

### 2. Dashboard Flow (`k6/dashboard-flow.js`)

Simulates realistic dashboard user behavior:

| Stage | Duration | Target VUs | Purpose |
|-------|----------|------------|---------|
| Ramp up | 1m | 0 -> 30 | Gradual warm-up |
| Steady state | 3m | 30 | Sustained load |
| Ramp down | 1m | 30 -> 0 | Graceful shutdown |

**Flow Simulated:**
1. Initial page load (health checks)
2. Fetch widget configurations
3. Fetch metrics for graphs
4. Poll for updates (3x with 2s intervals)
5. Occasional AG-UI streaming request

### 3. CCR Routing (`k6/ccr-routing.js`)

Tests Claude Code Router integration:

| Stage | Duration | Target VUs | Purpose |
|-------|----------|------------|---------|
| Ramp up | 30s | 0 -> 20 | Gradual warm-up |
| Steady state | 2m | 20 | Routing performance |
| Ramp down | 30s | 20 -> 0 | Graceful shutdown |

**Operations Tested:**
- Health endpoint polling
- Metrics endpoint
- Model routing decisions
- Quota checks

## Performance Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration` p95 | < 500ms | 95th percentile response time |
| `http_req_duration` p99 | < 1000ms | 99th percentile response time |
| `http_req_failed` rate | < 1% | Error rate under load |
| `a2a_errors` rate | < 1% | A2A-specific error rate |
| `a2a_duration` p95 | < 500ms | A2A operation latency |
| `a2a_discovery_duration` p95 | < 200ms | Discovery endpoint latency |
| `dashboard_widget_duration` p95 | < 800ms | Widget rendering latency |
| `ccr_routing_duration` p95 | < 100ms | Routing decision latency |

## Baseline Performance (Expected)

Based on initial testing, expected baseline metrics:

| Endpoint Type | p50 | p95 | p99 |
|---------------|-----|-----|-----|
| A2A Discovery | 10-30ms | 50-100ms | 100-200ms |
| A2A RPC (health) | 20-50ms | 100-200ms | 200-400ms |
| A2A RPC (run) | 100-500ms | 500-1000ms | 1000-2000ms |
| Dashboard Health | 5-20ms | 30-80ms | 80-150ms |
| CCR Health | 5-15ms | 20-50ms | 50-100ms |
| CCR Routing | 10-30ms | 50-100ms | 100-150ms |

**Note:** These are estimates. Run baseline tests in your environment to establish actual values.

## CI Usage

Load tests are available via GitHub Actions (on-demand only):

1. Go to **Actions** tab in GitHub
2. Select **Load Tests** workflow
3. Click **Run workflow**
4. Configure:
   - **Environment:** development, staging, or production
   - **Test Type:** all, a2a, dashboard, or ccr
   - **Base URL:** (optional) Override target URL
   - **VUs:** (optional) Override virtual users
   - **Duration:** (optional) Override test duration
5. Click **Run workflow**

### Secrets Required

For authenticated tests, add these secrets:
- `LOAD_TEST_AUTH_TOKEN` - JWT token for protected endpoints

### Artifacts

Results are uploaded as artifacts and retained for 30 days.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:7777` | AgentOS base URL |
| `WEB_URL` | `http://localhost:3000` | Next.js web URL |
| `CCR_URL` | `http://localhost:3456` | CCR base URL |
| `AUTH_TOKEN` | `test-token` | JWT for auth |
| `WORKSPACE_ID` | `load-test-workspace` | Tenant workspace |
| `ENVIRONMENT` | `development` | Environment tag |

### Custom Metrics

The tests export custom metrics for detailed analysis:

- `a2a_errors` (Rate) - A2A operation failures
- `a2a_duration` (Trend) - A2A RPC latencies
- `a2a_discovery_duration` (Trend) - Discovery latencies
- `dashboard_widget_duration` (Trend) - Widget fetch times
- `ccr_routing_duration` (Trend) - Routing decisions
- `ccr_health_duration` (Trend) - CCR health checks
- `ccr_availability` (Rate) - CCR uptime
- `successful_requests` (Counter) - Success count
- `failed_requests` (Counter) - Failure count

## Results

Results are saved to `tests/load/results/` with timestamps:
- `a2a-endpoints-YYYYMMDD-HHMMSS.json`
- `dashboard-flow-YYYYMMDD-HHMMSS.json`
- `ccr-routing-YYYYMMDD-HHMMSS.json`

**Note:** Result files are git-ignored. Only `.gitkeep` is committed.

### Analyzing Results

1. **Console Summary:** Each test prints a summary with key metrics.

2. **JSON Analysis:** Parse result files with jq:
   ```bash
   # Get p95 latency
   jq '.metrics.http_req_duration.values."p(95)"' results/a2a-*.json

   # Get error rate
   jq '.metrics.http_req_failed.values.rate' results/a2a-*.json
   ```

3. **Grafana Integration:** Export to InfluxDB for visualization:
   ```bash
   k6 run --out influxdb=http://localhost:8086/k6 k6/a2a-endpoints.js
   ```

## Performance Regression Alerts

Thresholds are defined in each test file. When a threshold is violated:

1. **Local:** k6 exits with non-zero code
2. **CI:** Job fails and alerts are sent

### Adding Custom Alerts

Edit thresholds in `k6/config.js` or individual test files:

```javascript
export const options = {
  thresholds: {
    // Fail if p95 > 500ms
    http_req_duration: ['p(95)<500'],
    // Fail if error rate > 1%
    http_req_failed: ['rate<0.01'],
    // Custom metric threshold
    'http_req_duration{endpoint:discovery}': ['p(95)<200'],
  },
};
```

## Troubleshooting

### Common Issues

1. **Connection refused:**
   - Ensure target services are running
   - Check BASE_URL is correct
   - Verify firewall/network settings

2. **Authentication failures:**
   - Provide valid AUTH_TOKEN
   - Check token expiration
   - Verify workspace permissions

3. **Rate limiting:**
   - DM-08.3 rate limiting may affect results
   - Use load-test workspace with higher limits
   - Reduce VUs if needed

4. **CCR not available:**
   - CCR is optional; tests gracefully handle absence
   - Check CCR_URL if running CCR locally

### Debug Mode

Run with verbose output:

```bash
k6 run --verbose k6/a2a-endpoints.js
```

## Related Documentation

- [Story: DM-09.6 Load Testing Infrastructure](../../docs/modules/bm-dm/stories/dm-09-6-load-testing-infrastructure.md)
- [Tech Spec: DM-09 Observability & Testing](../../docs/modules/bm-dm/epics/epic-dm-09-tech-spec.md)
- [k6 Documentation](https://k6.io/docs/)
