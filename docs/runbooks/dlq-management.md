# Runbook: Dead Letter Queue Management

## Overview
Manage failed events in the event bus DLQ. Use this when DLQ size grows or specific events need reprocessing.

## When to Use
- DLQ size alert triggered (threshold: 100 events) or sustained lag
- Specific event types failing repeatedly
- After deploying a fix for event handling and replay is needed

## Prerequisites
- Admin API token with access to `/api/events/*`
- Network access to the API
- Knowledge of event schemas and consumers

## Step-by-Step Procedure

### 1. Check DLQ size and consumer lag
**Command:**
```bash
curl -s "$API_BASE/api/events/health" | jq '{dlqSize, consumerLag: .consumers}'
```

### 2. Inspect failed events
**Command:**
```bash
curl -s "$API_BASE/api/events/dlq" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[:20]'
```

### 3. Retry failed events (preferred)
**Command:**
```bash
curl -s -X POST "$API_BASE/api/events/dlq/retry" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventIds": ["evt_123","evt_124"]}'
```

### 4. Retry by type (after code fix)
**Command:**
```bash
curl -s -X POST "$API_BASE/api/events/dlq/retry" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "approval.requested"}'
```

### 5. Purge DLQ (last resort)
**Command (dangerous):**
```bash
curl -s -X DELETE "$API_BASE/api/events/dlq" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Verification
- DLQ size decreases: `curl -s "$API_BASE/api/events/health" | jq '.dlqSize'`
- Consumers caught up: `consumerLag` near zero
- No new DLQ growth over 10–15 minutes

## Rollback
- If retries re-queue failures, pause consumers and investigate cause.
- DLQ purge is irreversible—double-confirm before executing.

## Related Runbooks
- [Incident Response](./incident-response.md)
- [Performance Issues](./troubleshooting/performance-issues.md)
