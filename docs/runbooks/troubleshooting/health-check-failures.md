# Health Check Failures Troubleshooting

## Overview

This runbook covers common health check failures and their resolutions.

## Symptoms

- Health scores not updating
- Stale health data in dashboard
- Errors in logs: `Health check failed for project`
- Risk alerts not triggering

## Common Issues

### 1. Cron Job Not Running

**Symptoms:**
- No health check logs in the last 15+ minutes
- `lastHealthCheck` timestamps are stale

**Diagnosis:**
```bash
# Check API logs for cron job activity
grep "HealthCheckCron" /var/log/api/app.log | tail -20

# Check if lock is stuck in Redis
redis-cli GET "lock:cron:health-check"
```

**Resolution:**
1. Verify API is running and healthy
2. Check Redis connection
3. If lock is stuck, manually release:
   ```bash
   redis-cli DEL "lock:cron:health-check"
   ```
4. Restart API if cron scheduler is stuck

### 2. Project Not Found Error

**Symptoms:**
- Log: `ProjectNotFoundException: Project {id} not found`

**Diagnosis:**
- Project was deleted but still in active projects query
- Data inconsistency between cache and database

**Resolution:**
1. Verify project exists: `SELECT * FROM "Project" WHERE id = '{id}'`
2. Check if `deletedAt` is set (soft delete)
3. If project is deleted, error is expected and can be ignored
4. If project exists but error persists, check for RLS policy issues

### 3. Database Connection Timeout

**Symptoms:**
- Log: `Health check failed for project ... Database timeout`
- Multiple projects failing simultaneously

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hyvve';

-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC
LIMIT 10;
```

**Resolution:**
1. Check database connection pool settings
2. Increase `HEALTH_CHECK_STALE_MINUTES` to reduce load
3. Reduce `HEALTH_CHECK_BATCH_SIZE` to process fewer projects per run
4. Kill long-running queries if blocking health checks

### 4. Task Query Performance

**Symptoms:**
- Log: `Health check for project ... took {N}ms` where N > 5000
- Slow but not failing

**Diagnosis:**
```sql
-- Check task count for problematic project
SELECT COUNT(*) FROM "Task" WHERE "projectId" = '{id}' AND "deletedAt" IS NULL;

-- Check for missing indexes
EXPLAIN ANALYZE SELECT * FROM "Task" WHERE "projectId" = '{id}' AND "deletedAt" IS NULL;
```

**Resolution:**
1. Ensure index exists on `Task(projectId, deletedAt)`
2. Current batch limit is 1000 tasks per project
3. For very large projects, consider archiving old tasks

### 5. Risk Detection False Positives

**Symptoms:**
- Too many risks created per health check
- Duplicate risks in database

**Diagnosis:**
```sql
-- Check recent risks for a project
SELECT * FROM "RiskEntry"
WHERE "projectId" = '{id}'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Check for duplicates
SELECT "riskType", "title", COUNT(*)
FROM "RiskEntry"
WHERE "projectId" = '{id}' AND status != 'RESOLVED'
GROUP BY "riskType", "title"
HAVING COUNT(*) > 1;
```

**Resolution:**
1. The service already filters out risks matching active risk types
2. If duplicates exist, resolve older ones:
   ```sql
   UPDATE "RiskEntry"
   SET status = 'RESOLVED', "resolvedAt" = NOW()
   WHERE "projectId" = '{id}' AND id NOT IN (
     SELECT MAX(id) FROM "RiskEntry"
     WHERE "projectId" = '{id}'
     GROUP BY "riskType", "title"
   );
   ```

### 6. Redis Lock Not Releasing

**Symptoms:**
- Only one instance processing health checks
- Other instances always log "skipping"

**Diagnosis:**
```bash
# Check lock status
redis-cli GET "lock:cron:health-check"
redis-cli TTL "lock:cron:health-check"
```

**Resolution:**
1. Lock should auto-expire based on TTL (14 minutes for health checks)
2. If TTL is very high or -1, manually delete:
   ```bash
   redis-cli DEL "lock:cron:health-check"
   ```
3. Check API crash logs - lock may not have released on crash

## Metrics to Monitor

- `health_check_duration_ms` - Time per health check
- `health_check_success_count` - Successful checks per run
- `health_check_failure_count` - Failed checks per run
- `active_risks_count` - Total active risks across projects

## Preventive Measures

1. **Alerts:** Set up alerts for:
   - No health check logs in 20 minutes
   - Health check error rate > 10%
   - Average duration > 10 seconds

2. **Capacity:** Review settings if projects grow:
   - `HEALTH_CHECK_BATCH_SIZE`: Default 100
   - `HEALTH_CHECK_CONCURRENCY`: Default 5
   - `HEALTH_CHECK_LIMITS.MAX_TASKS`: Default 1000

3. **Data Hygiene:**
   - Archive completed projects
   - Clean up completed/cancelled tasks older than 90 days

## Related Files

- `apps/api/src/pm/agents/health.cron.ts` - Cron job
- `apps/api/src/pm/agents/health.service.ts` - Health calculation logic
- `apps/api/src/pm/agents/constants.ts` - Configuration constants
- `docs/architecture/health-score-algorithm.md` - Algorithm documentation
