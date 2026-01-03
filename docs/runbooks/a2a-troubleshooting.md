# A2A Troubleshooting Guide

Operational guide for diagnosing and resolving Agent-to-Agent (A2A) communication issues in the HYVVE Dynamic Module System.

## Quick Reference

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Dashboard widgets loading forever | Agent timeout | Check agent health endpoints |
| "Agent not found" error | Discovery failure | Verify agent registration |
| Intermittent failures | Rate limiting | Check rate limits and quotas |
| All agents unresponsive | Gateway down | Restart gateway agent |
| Partial widget data | Specialist agent failure | Check specific agent logs |

## Diagnostic Commands

### Health Checks

```bash
# Gateway agent health
curl http://localhost:8000/health

# Individual agent health
curl http://localhost:8001/health  # Navi (PM)
curl http://localhost:8002/health  # Sage (Strategy)
curl http://localhost:8003/health  # Scribe (KB)

# Agent mesh status
curl http://localhost:8000/mesh/status

# List registered agents
curl http://localhost:8000/agents
```

### Log Access

```bash
# Gateway agent logs
docker logs hyvve-gateway-agent --tail 100

# All agent logs
docker compose logs agents --tail 100 -f

# Filter for errors
docker logs hyvve-gateway-agent 2>&1 | grep -i error

# Filter for specific workspace
docker logs hyvve-gateway-agent 2>&1 | grep "ws_xxx"
```

## Common Issues

### 1. Dashboard Widgets Not Loading (504 Gateway Timeout)

**Symptoms:**
- Widgets show loading spinner indefinitely
- Browser console shows 504 errors
- User sees "Request timed out" message

**Diagnosis:**

```bash
# Step 1: Check gateway health
curl -v http://localhost:8000/health

# Step 2: Check agent logs for timeouts
docker logs hyvve-gateway-agent 2>&1 | grep -i timeout

# Step 3: Check mesh connectivity
curl http://localhost:8000/mesh/status | jq
```

**Possible Causes:**

1. **Agent not running**
   ```bash
   # Check if container is running
   docker ps | grep agent

   # Restart if needed
   docker compose restart agents
   ```

2. **Model API timeout**
   ```bash
   # Check model provider status
   curl -I https://api.anthropic.com/v1/health

   # Check API key validity in logs
   docker logs hyvve-gateway-agent 2>&1 | grep -i "api key\|auth"
   ```

3. **Redis connection lost**
   ```bash
   # Check Redis health
   redis-cli ping

   # Check connection from agent
   docker exec hyvve-gateway-agent redis-cli -h redis ping
   ```

**Resolution:**

```bash
# Restart the agent stack
docker compose restart agents

# If persistent, restart the full stack
docker compose down && docker compose up -d
```

---

### 2. Agent Not Found (404 Not Registered)

**Symptoms:**
- "Agent 'navi' not found in mesh" error
- Widget shows "Service unavailable"
- Gateway logs show 404 for agent routes

**Diagnosis:**

```bash
# List registered agents
curl http://localhost:8000/agents | jq '.agents[].name'

# Check agent registration logs
docker logs hyvve-navi-agent 2>&1 | grep -i "register"

# Verify agent card
docker exec hyvve-navi-agent cat /app/agent_card.json | jq
```

**Possible Causes:**

1. **Agent failed to start**
   ```bash
   # Check container status
   docker ps -a | grep navi

   # Check exit code if stopped
   docker inspect hyvve-navi-agent --format='{{.State.ExitCode}}'
   ```

2. **Discovery service unreachable**
   ```bash
   # Check discovery endpoint
   curl http://localhost:8000/discovery/ping
   ```

3. **Agent card misconfiguration**
   ```bash
   # Validate agent card schema
   docker exec hyvve-navi-agent python -c "
   import json
   with open('/app/agent_card.json') as f:
       card = json.load(f)
       print(f'Name: {card[\"name\"]}')
       print(f'Capabilities: {card[\"capabilities\"]}')
   "
   ```

**Resolution:**

```bash
# Force re-registration
docker compose restart navi-agent

# Or manually trigger registration
curl -X POST http://localhost:8001/register
```

---

### 3. Rate Limiting Errors (429 Too Many Requests)

**Symptoms:**
- Intermittent 429 responses
- "Rate limit exceeded" in logs
- Widgets load on retry

**Diagnosis:**

```bash
# Check rate limit headers
curl -v http://localhost:8000/api/dashboard 2>&1 | grep -i "x-ratelimit"

# Check Redis rate limit keys
redis-cli keys "ratelimit:*" | head -10

# View specific rate limit
redis-cli get "ratelimit:ws_xxx:a2a"
```

**Rate Limit Configuration:**

| Limit Type | Default | Key Pattern |
|------------|---------|-------------|
| Per-workspace A2A | 100/min | `ratelimit:{workspace_id}:a2a` |
| Per-user API | 60/min | `ratelimit:{user_id}:api` |
| Global agent | 1000/min | `ratelimit:global:agent` |

**Resolution:**

```bash
# Reset specific rate limit (use sparingly)
redis-cli del "ratelimit:ws_xxx:a2a"

# Adjust limits in config (requires restart)
# Edit: agents/config/settings.py
# A2A_RATE_LIMIT_PER_MINUTE = 200
```

---

### 4. Partial Widget Data

**Symptoms:**
- Some widgets load, others show errors
- Dashboard partially renders
- Specific capabilities failing

**Diagnosis:**

```bash
# Check which agents are healthy
curl http://localhost:8000/mesh/status | jq '.agents[] | {name, status, last_check}'

# Check specific agent logs
docker logs hyvve-sage-agent --tail 50

# Test specific capability
curl -X POST http://localhost:8000/a2a/invoke \
  -H "Content-Type: application/json" \
  -d '{"agent": "sage", "capability": "strategy.analyze", "params": {}}'
```

**Common Patterns:**

| Failing Widget | Agent | Capability |
|----------------|-------|------------|
| Project Overview | Navi | project.status |
| Strategy Insights | Sage | strategy.analyze |
| Timeline | Chrono | timeline.manage |
| KB Search | Scribe | kb.search |

**Resolution:**

Restart the specific failing agent:

```bash
docker compose restart sage-agent
```

---

### 5. Agent Communication Failures (Connection Refused)

**Symptoms:**
- "Connection refused" in gateway logs
- Agent health checks failing
- Inter-agent calls timing out

**Diagnosis:**

```bash
# Check network connectivity
docker exec hyvve-gateway-agent ping -c 3 navi-agent

# Check port bindings
docker port hyvve-navi-agent

# Verify Docker network
docker network inspect hyvve-network
```

**Resolution:**

```bash
# Recreate Docker network
docker compose down
docker network rm hyvve-network
docker compose up -d
```

---

### 6. Stale State After Agent Restart

**Symptoms:**
- Old data showing after restart
- State not syncing across tabs
- Widget data inconsistent

**Diagnosis:**

```bash
# Check Redis state
redis-cli hgetall "state:dashboard:ws_xxx"

# Check state version
redis-cli get "state:version:ws_xxx"

# Check WebSocket connections
curl http://localhost:3000/api/realtime/status
```

**Resolution:**

```bash
# Force state refresh
curl -X POST http://localhost:8000/state/refresh \
  -H "Content-Type: application/json" \
  -d '{"workspace_id": "ws_xxx", "force": true}'

# Clear cached state
redis-cli del "state:dashboard:ws_xxx"
```

---

### 7. HITL Approvals Not Showing

**Symptoms:**
- Agent paused but no approval card
- Approval timeout errors
- Approvals stuck in pending state

**Diagnosis:**

```bash
# Check pending approvals
curl http://localhost:3000/api/approvals?status=pending

# Check WebSocket events
# In browser console:
# socket.on('approval.created', console.log)

# Check approval bridge logs
docker logs hyvve-gateway-agent 2>&1 | grep -i approval
```

**Resolution:**

```bash
# Manually expire stuck approvals
curl -X POST http://localhost:3000/api/approvals/cleanup \
  -H "Content-Type: application/json" \
  -d '{"older_than_minutes": 10}'
```

---

## Log Analysis Patterns

### Error Patterns to Watch

```bash
# Authentication failures
docker logs hyvve-gateway-agent 2>&1 | grep -E "401|unauthorized|invalid token"

# Database connection issues
docker logs hyvve-gateway-agent 2>&1 | grep -E "ECONNREFUSED|connection refused|pg_"

# Memory issues
docker logs hyvve-gateway-agent 2>&1 | grep -E "out of memory|OOM|heap"

# Rate limiting
docker logs hyvve-gateway-agent 2>&1 | grep -E "429|rate limit|throttle"
```

### Useful Log Queries

```bash
# Requests by response time (slow queries)
docker logs hyvve-gateway-agent 2>&1 | \
  grep "response_time_ms" | \
  awk -F'response_time_ms=' '{print $2}' | \
  sort -n | tail -10

# Error rate by agent
docker logs hyvve-gateway-agent 2>&1 | \
  grep "error" | \
  grep -oP 'agent=\K[a-z]+' | \
  sort | uniq -c | sort -rn

# Requests per workspace
docker logs hyvve-gateway-agent 2>&1 | \
  grep -oP 'workspace_id=\K[a-z0-9_]+' | \
  sort | uniq -c | sort -rn | head -10
```

---

## Health Check Interpretation

### Healthy Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "model_api": "ok"
  }
}
```

### Degraded Response

```json
{
  "status": "degraded",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "model_api": "timeout"  // Some functionality impaired
  }
}
```

### Unhealthy Response

```json
{
  "status": "unhealthy",
  "version": "1.0.0",
  "uptime_seconds": 60,
  "checks": {
    "database": "connection_failed",
    "redis": "ok",
    "model_api": "ok"
  },
  "error": "Database connection lost"
}
```

---

## Escalation Checklist

Before escalating, verify:

- [ ] All agents running (`docker ps`)
- [ ] Gateway health check passes
- [ ] Redis is accessible
- [ ] Model API keys are valid
- [ ] No rate limiting in effect
- [ ] Logs collected for the incident time window
- [ ] Workspace ID and user ID identified

---

## Related Documentation

- [A2A Request Flow](../architecture/diagrams/a2a-request-flow.md)
- [Agent Mesh Topology](../architecture/diagrams/agent-mesh-topology.md)
- [HITL Approval Flow](../architecture/diagrams/hitl-approval-flow.md)
- [Incident Response Runbook](./incident-response.md)
