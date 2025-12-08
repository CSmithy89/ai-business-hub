# Runbook: Database Recovery

## Overview
Restore PostgreSQL when data corruption or accidental deletes occur. Prefer point-in-time recovery to minimize data loss.

## When to Use
- Production data corruption or accidental destructive migration
- Failed deployment leaves database in unusable state
- RDS/Cloud database alerts for failed storage or replication

## Prerequisites
- Access to database snapshots/backups
- `psql` or cloud console access
- Ability to scale down app traffic (maintenance mode or drain)
- Recent migration history (Prisma migrations)

## Step-by-Step Procedure

### 1. Freeze writes and notify
- Enable maintenance mode or scale API replicas to 0.
- Announce downtime window in incident channel.

### 2. Identify restore point
**Command (list latest snapshots):**
```bash
# Adjust per cloud provider; example uses AWS CLI for RDS
aws rds describe-db-snapshots --db-instance-identifier "$DB_INSTANCE" \
  --query 'DBSnapshots[0:5].[DBSnapshotIdentifier,SnapshotCreateTime]'
```

### 3. Restore to new instance
- Create new DB from chosen snapshot (or PITR).
- Apply required security groups / credentials identical to prod.

### 4. Run migrations on restored instance
**Command:**
```bash
DATABASE_URL="$RESTORED_DATABASE_URL" pnpm --filter @hyvve/api prisma migrate deploy
```

### 5. Validate data
- Smoke queries: counts for key tables, recent rows.
- Check Prisma introspection if schema drift is suspected.

### 6. Cut over application
- Update secret/connection string to point to restored DB.
- Restart API/agent workloads to pick up new connection string.

### 7. Monitor
- Check `/api/metrics` for DB connection errors and latency.
- Watch logs for failed queries.

## Verification
- App health checks pass; no DB connection errors.
- Critical flows (auth, approvals, agent calls) succeed.
- Grafana shows stable DB latency and replication (if applicable).

## Rollback
- If restored instance shows issues, revert connection string to prior DB.
- Keep original instance untouched until new instance is validated.

## Related Runbooks
- [Incident Response](./incident-response.md)
- [Key Rotation](./key-rotation.md)
