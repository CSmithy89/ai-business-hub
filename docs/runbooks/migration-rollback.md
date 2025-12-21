# Runbook: Migration Rollback

## Overview

Guide for rolling back Prisma database migrations when a deployment introduces breaking schema changes or data issues.

## When to Use

- New migration causes application errors
- Schema change breaks API compatibility
- Data corruption from migration script
- Need to revert to previous application version

## Important Considerations

**Prisma migrations are forward-only by design.** There is no automatic `migrate down` command. Rollback requires either:

1. **Snapshot/PITR restore** (preferred) - Restore database to pre-migration state
2. **Manual SQL rollback** (expert-only) - Write and execute reverse SQL

## Prerequisites

- Database backup/snapshot from before migration
- Access to production database
- Knowledge of what the migration changed
- Ability to deploy previous application version

## Step-by-Step Procedures

### Option 1: Snapshot Restore (Preferred)

This is the safest approach for production rollbacks.

#### 1. Enable maintenance mode

```bash
# Scale down API to prevent writes
kubectl scale deployment api --replicas=0
# Or set maintenance mode flag
```

#### 2. Identify pre-migration snapshot

```bash
# AWS RDS example
aws rds describe-db-snapshots \
  --db-instance-identifier "$DB_INSTANCE" \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table
```

#### 3. Restore from snapshot

```bash
# AWS RDS example - creates new instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$DB_INSTANCE-restored" \
  --db-snapshot-identifier "$SNAPSHOT_ID"
```

#### 4. Update connection string

Update `DATABASE_URL` in your secrets/environment to point to restored instance.

#### 5. Deploy previous application version

```bash
# Deploy the last known good version
git checkout <previous-tag>
# Redeploy
```

#### 6. Mark migration as rolled back in Prisma

```bash
DATABASE_URL="$DATABASE_URL" pnpm --filter @hyvve/db prisma migrate resolve \
  --rolled-back "<migration_name>"
```

### Option 2: Manual SQL Rollback (Expert Only)

Use only when snapshot restore is not possible and you understand the migration changes.

#### 1. Analyze the migration

```bash
# View migration SQL
cat packages/db/prisma/migrations/<migration_name>/migration.sql
```

#### 2. Write reverse SQL

For each change in the migration, write the inverse operation:

| Migration Action | Rollback Action |
|-----------------|-----------------|
| `CREATE TABLE x` | `DROP TABLE x` |
| `ALTER TABLE ADD COLUMN` | `ALTER TABLE DROP COLUMN` |
| `CREATE INDEX` | `DROP INDEX` |
| `ALTER TABLE ADD CONSTRAINT` | `ALTER TABLE DROP CONSTRAINT` |

#### 3. Execute rollback SQL

```bash
# Connect to database and run rollback
psql "$DATABASE_URL" -f rollback.sql
```

#### 4. Mark migration as rolled back

```bash
DATABASE_URL="$DATABASE_URL" pnpm --filter @hyvve/db prisma migrate resolve \
  --rolled-back "<migration_name>"
```

## PM-05 Migration Reference

The PM-05 epic introduced the following schema changes:

### Tables Added

- `ProjectHealthCheck` - Health check snapshots
- `RiskEntry` - Detected project risks
- `ProjectReport` - Generated reports
- `ReportSchedule` - Scheduled report automation
- `PhaseCheckpoint` - Phase milestone checkpoints

### Rollback SQL (if needed)

```sql
-- Rollback PM-05 migrations (use with caution)
-- Run in reverse order of creation

DROP TABLE IF EXISTS "ReportSchedule" CASCADE;
DROP TABLE IF EXISTS "ProjectReport" CASCADE;
DROP TABLE IF EXISTS "RiskEntry" CASCADE;
DROP TABLE IF EXISTS "ProjectHealthCheck" CASCADE;
DROP TABLE IF EXISTS "PhaseCheckpoint" CASCADE;

-- Remove enums if added
DROP TYPE IF EXISTS "ReportType";
DROP TYPE IF EXISTS "ReportFormat";
DROP TYPE IF EXISTS "StakeholderType";
DROP TYPE IF EXISTS "ReportFrequency";
DROP TYPE IF EXISTS "RiskSeverity";
DROP TYPE IF EXISTS "RiskStatus";
DROP TYPE IF EXISTS "CheckpointStatus";
```

## Verification

After rollback:

1. **Check Prisma migration status:**
   ```bash
   pnpm --filter @hyvve/db prisma migrate status
   ```

2. **Verify schema matches application:**
   ```bash
   pnpm --filter @hyvve/db prisma db pull --force
   git diff packages/db/prisma/schema.prisma
   ```

3. **Test critical paths:**
   - Authentication flow
   - Project CRUD operations
   - API health endpoints

## Prevention

- Always take a database snapshot before deploying migrations
- Test migrations in staging with production-like data
- Use feature flags for new functionality
- Keep migrations small and focused

## Related Runbooks

- [Database Recovery](./database-recovery.md)
- [Incident Response](./incident-response.md)
