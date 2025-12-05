# Event Bus Operational Runbook

This runbook covers operational procedures for the HYVVE Event Bus system, which uses Redis Streams for event-driven communication between services.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Health Monitoring](#health-monitoring)
3. [Common Operations](#common-operations)
4. [Dead Letter Queue (DLQ) Management](#dead-letter-queue-dlq-management)
5. [Event Replay Procedures](#event-replay-procedures)
6. [Incident Response](#incident-response)
7. [Troubleshooting Guide](#troubleshooting-guide)

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    EVENT BUS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Publishers                    Redis Streams                     │
│  ┌─────────┐                  ┌─────────────┐                   │
│  │ API     │ ──publish──────► │ Main Stream │                   │
│  │ AgentOS │                  └──────┬──────┘                   │
│  │ Workers │                         │                          │
│  └─────────┘                         │                          │
│                                      ▼                          │
│                              ┌───────────────┐                  │
│                              │Consumer Groups│                  │
│                              └───────┬───────┘                  │
│                                      │                          │
│                           ┌──────────┴──────────┐               │
│                           ▼                     ▼               │
│                    ┌─────────────┐      ┌─────────────┐        │
│                    │  Handlers   │      │    DLQ      │        │
│                    │  (Success)  │      │  (Failures) │        │
│                    └─────────────┘      └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Event Flow

1. **Publish:** Services publish events to Redis Streams
2. **Consume:** Consumer groups read events
3. **Process:** Handlers process events with retry logic
4. **DLQ:** Failed events (after max retries) go to Dead Letter Queue
5. **Acknowledge:** Successful events are acknowledged and trimmed

### Key Streams

| Stream | Purpose |
|--------|---------|
| `hyvve:events` | Main event stream |
| `hyvve:dlq` | Dead Letter Queue |
| `hyvve:events:metadata` | Event metadata storage |

---

## Health Monitoring

### Dashboard

Access the Event Bus monitoring dashboard at:
```
https://your-domain.com/admin/events
```

### Key Metrics to Monitor

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| DLQ Size | > 100 | > 500 | Review and reprocess |
| Consumer Lag | > 1000 | > 5000 | Scale consumers |
| Failed Events/hr | > 10 | > 50 | Investigate handlers |
| Processing Time p99 | > 5s | > 30s | Optimize handlers |

### CLI Health Check

```bash
# Check Redis Streams info
redis-cli -u $REDIS_URL XINFO STREAM hyvve:events

# Check consumer group status
redis-cli -u $REDIS_URL XINFO GROUPS hyvve:events

# Check DLQ size
redis-cli -u $REDIS_URL XLEN hyvve:dlq
```

### API Health Endpoints

```bash
# Event bus health
curl https://api.your-domain.com/events/health

# Expected response
{
  "status": "healthy",
  "streamLength": 15423,
  "dlqLength": 3,
  "consumerGroups": 2,
  "lastProcessedAt": "2025-12-05T10:30:00Z"
}
```

---

## Common Operations

### View Recent Events

```bash
# View last 10 events
redis-cli -u $REDIS_URL XREVRANGE hyvve:events + - COUNT 10

# View events by type
# (Use admin dashboard for filtering)
```

### View Consumer Group Status

```bash
# List consumer groups
redis-cli -u $REDIS_URL XINFO GROUPS hyvve:events

# View pending messages per consumer
redis-cli -u $REDIS_URL XPENDING hyvve:events <group-name>
```

### Stream Maintenance

```bash
# Get stream length
redis-cli -u $REDIS_URL XLEN hyvve:events

# Trim stream to last 100,000 events
redis-cli -u $REDIS_URL XTRIM hyvve:events MAXLEN ~ 100000
```

---

## Dead Letter Queue (DLQ) Management

### Understanding DLQ

Events land in the DLQ when:
- Handler throws unrecoverable error
- Max retry attempts exceeded (default: 3)
- Processing timeout exceeded

### View DLQ Contents

```bash
# View DLQ size
redis-cli -u $REDIS_URL XLEN hyvve:dlq

# View oldest DLQ entries
redis-cli -u $REDIS_URL XRANGE hyvve:dlq - + COUNT 10

# View newest DLQ entries
redis-cli -u $REDIS_URL XREVRANGE hyvve:dlq + - COUNT 10
```

### Analyze DLQ Events

Via Admin Dashboard:
1. Navigate to `/admin/events`
2. Select "Dead Letter Queue" tab
3. Filter by event type, date range, or error message
4. Review failure reasons

### Reprocess DLQ Events

#### Option 1: Admin Dashboard (Recommended)

1. Go to `/admin/events`
2. Select DLQ events to reprocess
3. Click "Reprocess Selected"
4. Monitor for success/failure

#### Option 2: API Endpoint

```bash
# Reprocess specific event
curl -X POST https://api.your-domain.com/events/dlq/reprocess \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventId": "1234567890-0"}'

# Reprocess all DLQ events of a type
curl -X POST https://api.your-domain.com/events/dlq/reprocess-type \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType": "approval.item.created"}'
```

#### Option 3: CLI Script

```bash
# Reprocess DLQ events (use with caution)
# This moves events from DLQ back to main stream

redis-cli -u $REDIS_URL --eval reprocess-dlq.lua hyvve:dlq hyvve:events , 100
```

### Clear DLQ Events

**Warning:** Only clear events after investigation or if they're truly unrecoverable.

```bash
# Clear specific event
redis-cli -u $REDIS_URL XDEL hyvve:dlq <event-id>

# Clear all DLQ events (DANGEROUS)
redis-cli -u $REDIS_URL DEL hyvve:dlq
```

### DLQ Alerting

Set up alerts for DLQ growth:

```yaml
# Example Prometheus alert
- alert: EventBusDLQGrowth
  expr: redis_stream_length{stream="hyvve:dlq"} > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Event Bus DLQ has {{ $value }} events"
```

---

## Event Replay Procedures

### When to Replay Events

- Handler bug fixed, need to reprocess affected events
- New subscriber needs historical events
- Data recovery after incident

### Replay by Time Range

```bash
# Via API
curl -X POST https://api.your-domain.com/events/replay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2025-12-01T00:00:00Z",
    "endTime": "2025-12-01T23:59:59Z",
    "eventTypes": ["approval.item.created"]
  }'
```

### Replay by Event Type

```bash
curl -X POST https://api.your-domain.com/events/replay \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypes": ["workspace.member.invited"],
    "limit": 1000
  }'
```

### Replay Considerations

1. **Idempotency:** Ensure handlers are idempotent before replay
2. **Rate Limiting:** Use `batchSize` parameter to avoid overwhelming consumers
3. **Tenant Isolation:** Replay respects tenant boundaries
4. **Monitoring:** Watch for increased error rates during replay

### Replay Progress Monitoring

```bash
# Check replay job status
curl https://api.your-domain.com/events/replay/status/<job-id> \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## Incident Response

### Scenario: High DLQ Growth

**Symptoms:**
- DLQ size increasing rapidly
- Specific event type failing consistently

**Steps:**
1. **Identify pattern:**
   ```bash
   # Check which event types are failing
   redis-cli -u $REDIS_URL XRANGE hyvve:dlq - + COUNT 100 | grep -o '"type":"[^"]*"' | sort | uniq -c | sort -rn
   ```

2. **Check handler logs:**
   ```bash
   # Search for handler errors
   grep "EventHandler" /var/log/api/error.log | tail -100
   ```

3. **Pause consumer (if needed):**
   ```bash
   # Via API - pause specific consumer group
   curl -X POST https://api.your-domain.com/events/consumers/pause \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

4. **Fix root cause** (deploy handler fix)

5. **Resume and reprocess:**
   ```bash
   # Resume consumers
   curl -X POST https://api.your-domain.com/events/consumers/resume \
     -H "Authorization: Bearer $ADMIN_TOKEN"

   # Reprocess DLQ
   curl -X POST https://api.your-domain.com/events/dlq/reprocess-all \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

### Scenario: Consumer Lag Building

**Symptoms:**
- Events not being processed timely
- Consumer lag metric increasing

**Steps:**
1. **Check consumer health:**
   ```bash
   redis-cli -u $REDIS_URL XINFO GROUPS hyvve:events
   ```

2. **Scale consumers** (if infrastructure supports)

3. **Check for slow handlers:**
   ```bash
   # Look for slow processing in logs
   grep "processing_time" /var/log/api/app.log | awk '$NF > 5000'
   ```

4. **Optimize or parallelize handlers**

### Scenario: Redis Connection Issues

**Symptoms:**
- Events not publishing
- Timeouts in event processing

**Steps:**
1. **Verify Redis connectivity:**
   ```bash
   redis-cli -u $REDIS_URL ping
   ```

2. **Check Redis memory:**
   ```bash
   redis-cli -u $REDIS_URL INFO memory
   ```

3. **Check connection pool:**
   ```bash
   redis-cli -u $REDIS_URL CLIENT LIST | wc -l
   ```

4. **Restart API if connection pool exhausted**

---

## Troubleshooting Guide

### Event Not Being Processed

1. Check event was published:
   ```bash
   redis-cli -u $REDIS_URL XRANGE hyvve:events <event-id> <event-id>
   ```

2. Check consumer group received it:
   ```bash
   redis-cli -u $REDIS_URL XPENDING hyvve:events <group-name>
   ```

3. Check handler logs for errors

4. Check if event is in DLQ

### Event Processing Slow

1. Enable handler timing logs
2. Profile database queries in handlers
3. Check for N+1 query patterns
4. Consider async processing for heavy operations

### Events Lost After Restart

1. Verify Redis persistence is enabled:
   ```bash
   redis-cli -u $REDIS_URL CONFIG GET save
   redis-cli -u $REDIS_URL CONFIG GET appendonly
   ```

2. Check for XACK without processing (bug in handler)

3. Review consumer group configuration

### Duplicate Event Processing

1. Ensure handlers are idempotent
2. Check for manual XACK issues
3. Verify consumer group acknowledgment logic

---

## Appendix: Redis Commands Reference

| Command | Purpose |
|---------|---------|
| `XLEN stream` | Get stream length |
| `XINFO STREAM stream` | Stream details |
| `XINFO GROUPS stream` | Consumer groups |
| `XRANGE stream - + COUNT n` | Read oldest n events |
| `XREVRANGE stream + - COUNT n` | Read newest n events |
| `XPENDING stream group` | Pending messages |
| `XACK stream group id` | Acknowledge message |
| `XDEL stream id` | Delete message |
| `XTRIM stream MAXLEN n` | Trim stream |

---

*Last updated: 2025-12-05*
