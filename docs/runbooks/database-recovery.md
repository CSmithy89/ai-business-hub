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

### 4b. Rollback guidance for recent migrations (Prisma)
Prisma migrations are not automatically reversible in production. Prefer restoring from a snapshot/PITR.

If a deployment introduced an incompatible schema change (example: new tables like `workspace_modules` and `mcp_server_configs`, or updated defaults), use one of:
- **Preferred:** restore DB from snapshot/PITR taken immediately before migration, then redeploy the last known good app version.
- **Alternate (expert-only):** manually revert schema changes with SQL + mark migrations as rolled back using `prisma migrate resolve`.

**Mark a migration as rolled back (does not change DB schema by itself):**
```bash
DATABASE_URL="$DATABASE_URL" pnpm --filter @hyvve/api prisma migrate resolve --rolled-back "<migration_name>"
```

**Important:** only use `--rolled-back` after you have manually restored schema state (or restored from snapshot). Otherwise Prisma state will diverge from the real database.

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
