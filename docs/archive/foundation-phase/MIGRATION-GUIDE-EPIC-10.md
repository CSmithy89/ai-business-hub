# Epic 10 Migration Guide

**Epic:** EPIC-10 - Platform Hardening
**Migration Focus:** Epic 08 Agent Models (AgentChatMessage, AgentSession)
**Status:** Ready for Deployment
**Last Updated:** 2025-12-06

---

## Overview

This guide provides procedures for deploying Epic 08 database migrations to production. The primary changes are two new tables for agent chat persistence:

- `agent_chat_messages` - Stores chat messages for agent sessions
- `agent_sessions` - Links agent sessions to module sessions

### Migration Characteristics

- **Type:** Schema-only (DDL)
- **Data Migration:** None (new tables)
- **Downtime Required:** No
- **Reversible:** Yes (rollback procedure provided)
- **Estimated Time:** 5-10 seconds
- **Risk Level:** Low

---

## Pre-Migration Checklist

Before running migrations, verify:

- [ ] **Database Backup Created**
  ```bash
  pg_dump -Fc hyvve_prod > backup_$(date +%Y%m%d_%H%M%S).dump
  ```

- [ ] **Backup Restoration Tested**
  ```bash
  # Test on separate instance
  pg_restore -d hyvve_test backup_YYYYMMDD_HHMMSS.dump
  ```

- [ ] **Maintenance Window Scheduled** (optional, zero downtime expected)

- [ ] **Stakeholders Notified** (if maintenance window required)

- [ ] **Database Connection Available**
  ```bash
  psql $DATABASE_URL -c "SELECT version();"
  ```

- [ ] **Prisma CLI Available**
  ```bash
  cd packages/db
  npx prisma --version
  ```

- [ ] **Environment Variables Set**
  ```bash
  echo $DATABASE_URL
  echo $DIRECT_URL  # For migrations, bypasses connection pooler
  ```

---

## Migration Steps

### Step 1: Backup Production Database

```bash
# Create timestamped backup
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).dump"
pg_dump -Fc hyvve_prod > $BACKUP_FILE

# Verify backup size (should be > 0 bytes)
ls -lh $BACKUP_FILE

# Store backup in safe location
aws s3 cp $BACKUP_FILE s3://hyvve-backups/epic-10/ # Or your backup storage
```

### Step 2: Run Migration in Development (First Time)

```bash
cd packages/db

# Generate migration from current schema
npx prisma migrate dev --name epic-08-agent-models

# This will:
# 1. Compare schema.prisma to current database
# 2. Generate SQL migration file
# 3. Apply migration to dev database
# 4. Regenerate Prisma Client
```

**Expected Output:**
```
Migrations folder already exists.
Applying migration `20251206XXXXXX_epic_08_agent_models`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251206XXXXXX_epic_08_agent_models/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client
```

### Step 3: Review Generated Migration SQL

```bash
# View migration SQL
cat prisma/migrations/20251206XXXXXX_epic_08_agent_models/migration.sql
```

**Expected SQL:**
```sql
-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "AgentModuleType" AS ENUM ('VALIDATION', 'PLANNING', 'BRANDING');
CREATE TYPE "AgentSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "agent_chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "agent_id" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sessions" (
    "id" TEXT NOT NULL,
    "module_type" "AgentModuleType" NOT NULL,
    "module_session_id" TEXT NOT NULL,
    "current_agent" TEXT,
    "workflow_step" TEXT,
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_chat_messages_session_id_created_at_idx" ON "agent_chat_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_sessions_module_type_module_session_id_idx" ON "agent_sessions"("module_type", "module_session_id");

-- CreateIndex
CREATE INDEX "agent_sessions_status_last_activity_at_idx" ON "agent_sessions"("status", "last_activity_at");
```

**Validation:**
- ✅ Only CREATE statements (no ALTER, DROP, or DELETE)
- ✅ Enums created for type safety
- ✅ Tables use snake_case naming
- ✅ Indexes created for query performance
- ✅ No foreign key constraints (by design - loose coupling)

### Step 4: Test Migration in Staging

```bash
# Set staging database URL
export DATABASE_URL="postgresql://user:pass@staging-db:5432/hyvve"
export DIRECT_URL="postgresql://user:pass@staging-db:5432/hyvve"

# Deploy migration
cd packages/db
npx prisma migrate deploy

# Expected output:
# 1 migration found in prisma/migrations
# Applying migration `20251206XXXXXX_epic_08_agent_models`
# Migration applied successfully
```

### Step 5: Verify Migration Success

```bash
# Pull current schema from database
npx prisma db pull --print

# Verify tables exist
psql $DATABASE_URL -c "\dt agent_*"

# Expected output:
#               List of relations
#  Schema |        Name         | Type  |  Owner
# --------+---------------------+-------+---------
#  public | agent_chat_messages | table | hyvve
#  public | agent_sessions      | table | hyvve
```

```bash
# Verify indexes exist
psql $DATABASE_URL -c "\d agent_chat_messages"

# Expected output includes:
# Indexes:
#     "agent_chat_messages_pkey" PRIMARY KEY, btree (id)
#     "agent_chat_messages_session_id_created_at_idx" btree (session_id, created_at)
```

### Step 6: Run Integration Tests

```bash
# Run test suite
cd ../..
pnpm test:integration

# Specific tests for agent chat
pnpm test apps/web/src/__tests__/agent-chat.test.ts
```

**Test Coverage:**
- Create AgentSession
- Add messages to session
- Retrieve messages in order
- Verify multi-tenant isolation
- Test cascade deletes

### Step 7: Monitor Staging for 24 Hours

- Check application logs for errors
- Monitor database performance metrics
- Verify agent chat features work end-to-end
- Test with real user workflows

### Step 8: Deploy to Production

```bash
# Set production database URL
export DATABASE_URL="postgresql://user:pass@prod-db:5432/hyvve"
export DIRECT_URL="postgresql://user:pass@prod-db:5432/hyvve"

# Deploy migration (non-interactive)
cd packages/db
npx prisma migrate deploy

# Verify success
echo $?  # Should be 0
```

### Step 9: Post-Migration Verification

```bash
# Verify tables created
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'agent%';"

# Verify indexes
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('agent_chat_messages', 'agent_sessions');"

# Check table sizes (should be 0 or minimal)
psql $DATABASE_URL -c "SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
WHERE relname LIKE 'agent%'
ORDER BY pg_total_relation_size(relid) DESC;"
```

### Step 10: Deploy Application Code

```bash
# Deploy updated application with Prisma Client regenerated
# (Deploy via CI/CD pipeline or manual deployment)

# Verify Prisma Client includes new models
# In application code:
# import { prisma } from '@/lib/db'
# prisma.agentChatMessage.findMany() // Should be available
```

---

## Rollback Procedure

If issues occur after migration, follow these steps:

### Option 1: Revert Migration (Recommended)

```bash
# Prisma doesn't have built-in rollback, so we manually revert

# Connect to database
psql $DATABASE_URL

# Drop tables in reverse order
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS agent_chat_messages CASCADE;

# Drop enums
DROP TYPE IF EXISTS AgentSessionStatus;
DROP TYPE IF EXISTS AgentModuleType;
DROP TYPE IF EXISTS ChatMessageRole;

# Exit psql
\q
```

### Option 2: Restore from Backup

```bash
# Stop application servers to prevent writes
# (Use deployment tool or manual process)

# Restore database from backup
pg_restore -d hyvve_prod backup_YYYYMMDD_HHMMSS.dump

# Or for clean restore:
dropdb hyvve_prod
createdb hyvve_prod
pg_restore -d hyvve_prod backup_YYYYMMDD_HHMMSS.dump

# Verify restoration
psql hyvve_prod -c "SELECT COUNT(*) FROM workspaces;"
```

### Option 3: Mark Migration as Rolled Back

```bash
# If you manually reverted but Prisma still thinks migration is applied
cd packages/db
npx prisma migrate resolve --rolled-back 20251206XXXXXX_epic_08_agent_models
```

---

## Multi-Tenant Isolation Verification

After migration, verify tenant isolation works correctly:

### Test 1: Create Test Data

```sql
-- Create two test workspaces
INSERT INTO workspaces (id, name, slug) VALUES
  ('ws-tenant-1', 'Tenant 1', 'tenant-1'),
  ('ws-tenant-2', 'Tenant 2', 'tenant-2');

-- Create two test businesses (one per workspace)
INSERT INTO businesses (id, workspace_id, user_id, name, stage, onboarding_status) VALUES
  ('biz-1', 'ws-tenant-1', 'user-1', 'Business 1', 'IDEA', 'WIZARD'),
  ('biz-2', 'ws-tenant-2', 'user-2', 'Business 2', 'IDEA', 'WIZARD');

-- Create validation sessions
INSERT INTO validation_sessions (id, business_id) VALUES
  ('val-1', 'biz-1'),
  ('val-2', 'biz-2');

-- Create agent sessions
INSERT INTO agent_sessions (id, module_type, module_session_id, status) VALUES
  ('agent-session-1', 'VALIDATION', 'val-1', 'ACTIVE'),
  ('agent-session-2', 'VALIDATION', 'val-2', 'ACTIVE');

-- Create chat messages
INSERT INTO agent_chat_messages (id, session_id, role, content) VALUES
  ('msg-1', 'agent-session-1', 'USER', 'Message for tenant 1'),
  ('msg-2', 'agent-session-2', 'USER', 'Message for tenant 2');
```

### Test 2: Verify Isolation via Session Chain

```sql
-- Query messages for tenant 1 (via session chain)
SELECT acm.*
FROM agent_chat_messages acm
JOIN agent_sessions ags ON acm.session_id = ags.id
JOIN validation_sessions vs ON ags.module_session_id = vs.id
JOIN businesses b ON vs.business_id = b.id
WHERE b.workspace_id = 'ws-tenant-1';

-- Should return only: 'Message for tenant 1'

-- Query messages for tenant 2
SELECT acm.*
FROM agent_chat_messages acm
JOIN agent_sessions ags ON acm.session_id = ags.id
JOIN validation_sessions vs ON ags.module_session_id = vs.id
JOIN businesses b ON vs.business_id = b.id
WHERE b.workspace_id = 'ws-tenant-2';

-- Should return only: 'Message for tenant 2'
```

### Test 3: Verify No Cross-Tenant Access

```sql
-- Try to access tenant 2's messages with tenant 1's context
-- (This should return 0 rows)
SELECT acm.*
FROM agent_chat_messages acm
WHERE acm.session_id = 'agent-session-2'
AND EXISTS (
  SELECT 1 FROM agent_sessions ags
  JOIN validation_sessions vs ON ags.module_session_id = vs.id
  JOIN businesses b ON vs.business_id = b.id
  WHERE b.workspace_id = 'ws-tenant-1'
  AND ags.id = acm.session_id
);

-- Should return 0 rows
```

### Test 4: Application-Level Isolation

```typescript
// In application code, verify isolation is enforced
import { prisma } from '@/lib/db'

async function getAgentMessages(sessionId: string, workspaceId: string) {
  // Get messages, but verify session belongs to workspace
  const session = await prisma.agentSession.findFirst({
    where: {
      id: sessionId,
      // Verify session chain leads to workspace
      OR: [
        {
          // Validation module
          ValidationSession: {
            business: { workspaceId }
          }
        },
        {
          // Planning module
          PlanningSession: {
            business: { workspaceId }
          }
        },
        {
          // Branding module
          BrandingSession: {
            business: { workspaceId }
          }
        }
      ]
    }
  })

  if (!session) {
    throw new Error('Session not found or access denied')
  }

  // Now safe to fetch messages
  return prisma.agentChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }
  })
}
```

---

## Performance Verification

### Index Usage Verification

```sql
-- Verify indexes are used for common queries

-- Query 1: Get messages for session (should use index)
EXPLAIN ANALYZE
SELECT * FROM agent_chat_messages
WHERE session_id = 'agent-session-1'
ORDER BY created_at ASC;

-- Should show: Index Scan using agent_chat_messages_session_id_created_at_idx

-- Query 2: Find active sessions by module (should use index)
EXPLAIN ANALYZE
SELECT * FROM agent_sessions
WHERE module_type = 'VALIDATION'
AND module_session_id = 'val-1';

-- Should show: Index Scan using agent_sessions_module_type_module_session_id_idx

-- Query 3: Find active sessions (should use index)
EXPLAIN ANALYZE
SELECT * FROM agent_sessions
WHERE status = 'ACTIVE'
ORDER BY last_activity_at DESC;

-- Should show: Index Scan using agent_sessions_status_last_activity_at_idx
```

### Performance Benchmarks

Expected query performance (empty tables):
- Get messages for session: < 1ms
- Create new message: < 2ms
- Create new session: < 2ms
- Update session activity: < 1ms

Expected query performance (1000 messages per session):
- Get messages for session: < 10ms
- Create new message: < 3ms
- Paginated message fetch (LIMIT 20): < 2ms

---

## Monitoring

### Post-Migration Monitoring (24 Hours)

Monitor these metrics:

1. **Database Performance**
   - Query execution time (should be < 10ms for agent queries)
   - Connection pool usage (should not increase)
   - Lock contention (should be zero)
   - Index usage (should use new indexes)

2. **Application Logs**
   - Agent chat errors (should be zero)
   - Session creation errors (should be zero)
   - Multi-tenant isolation errors (should be zero)

3. **User Experience**
   - Agent chat loading time (should be < 1s)
   - Message send latency (should be < 200ms)
   - Session persistence across page reloads (should work)

### Monitoring Queries

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE tablename IN ('agent_chat_messages', 'agent_sessions')
ORDER BY size_bytes DESC;

-- Check for slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%agent_%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('agent_chat_messages', 'agent_sessions')
ORDER BY idx_scan DESC;
```

---

## Troubleshooting

### Issue: Migration Fails with "relation already exists"

**Cause:** Tables already exist from previous migration attempt

**Solution:**
```bash
# Drop tables manually
psql $DATABASE_URL -c "DROP TABLE IF EXISTS agent_sessions CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS agent_chat_messages CASCADE;"

# Mark migration as resolved
npx prisma migrate resolve --rolled-back 20251206XXXXXX_epic_08_agent_models

# Re-run migration
npx prisma migrate deploy
```

### Issue: Migration Fails with "enum already exists"

**Cause:** Enums created from previous migration attempt

**Solution:**
```bash
# Drop enums
psql $DATABASE_URL -c "DROP TYPE IF EXISTS ChatMessageRole CASCADE;"
psql $DATABASE_URL -c "DROP TYPE IF EXISTS AgentModuleType CASCADE;"
psql $DATABASE_URL -c "DROP TYPE IF EXISTS AgentSessionStatus CASCADE;"

# Re-run migration
npx prisma migrate deploy
```

### Issue: Prisma Client doesn't have new models

**Cause:** Prisma Client not regenerated

**Solution:**
```bash
cd packages/db
npx prisma generate

# In application directory
cd ../../apps/web
pnpm install  # Reinstall to get updated client
```

### Issue: "Cannot read database" errors in application

**Cause:** Database connection not configured

**Solution:**
```bash
# Verify environment variables
echo $DATABASE_URL
echo $DIRECT_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Restart application
```

### Issue: Cross-tenant data access

**Cause:** Session chain validation not implemented

**Solution:**
- Review application code for proper workspace validation
- Verify session lookups include workspace check
- See "Multi-Tenant Isolation Verification" section above

---

## Post-Migration Tasks

After successful migration and verification:

- [ ] **Remove Backup Files** (after 30 days retention)
  ```bash
  # After 30 days of successful operation
  rm backup_20251206_*.dump
  # Or delete from S3/backup storage
  ```

- [ ] **Update Documentation**
  - Mark Story 10.5 as complete
  - Update sprint-status.yaml
  - Archive migration guide (keep for reference)

- [ ] **Update Monitoring Dashboards**
  - Add metrics for agent_chat_messages table size
  - Add alerts for slow agent queries
  - Add dashboard for agent session activity

- [ ] **Team Communication**
  - Notify team migration is complete
  - Share any lessons learned
  - Update runbooks if needed

---

## FAQ

### Q: Do I need to run migrations in development?

**A:** Yes, run `npx prisma migrate dev` first. This generates the migration file and tests it in development.

### Q: What's the difference between `migrate dev` and `migrate deploy`?

**A:**
- `migrate dev` - Development only. Generates migration files, applies them, and regenerates client.
- `migrate deploy` - Production only. Applies existing migration files. Does NOT generate new migrations.

### Q: Can I run migrations without downtime?

**A:** Yes. These migrations only create new tables (DDL). Existing queries are unaffected.

### Q: What if I need to rollback?

**A:** Use the rollback procedure in this guide. Migrations are reversible by dropping tables.

### Q: How do I test migrations locally?

**A:**
```bash
# Use docker-compose for local PostgreSQL
docker-compose up -d postgres

# Run migration
cd packages/db
npx prisma migrate dev

# Verify
npx prisma studio  # GUI to inspect database
```

### Q: Do agent models have RLS policies?

**A:** No. Agent models use application-level isolation via session chain validation. See "Multi-Tenant Isolation Verification" section.

### Q: What happens to existing data?

**A:** Nothing. These are new tables. Existing tables are not modified.

### Q: How long do migrations take?

**A:** 5-10 seconds. Only DDL operations (CREATE TABLE, CREATE INDEX).

### Q: Can I pause mid-migration?

**A:** No. Migrations are atomic transactions. They either complete fully or rollback.

---

## Contact

For migration support:
- Slack: #platform-team
- Email: platform@hyvve.com
- On-call: PagerDuty escalation

---

## Appendix: Migration SQL Reference

Complete SQL for reference (generated by Prisma):

```sql
-- CreateEnum
CREATE TYPE "ChatMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "AgentModuleType" AS ENUM ('VALIDATION', 'PLANNING', 'BRANDING');
CREATE TYPE "AgentSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "agent_chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "ChatMessageRole" NOT NULL,
    "agent_id" TEXT,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_sessions" (
    "id" TEXT NOT NULL,
    "module_type" "AgentModuleType" NOT NULL,
    "module_session_id" TEXT NOT NULL,
    "current_agent" TEXT,
    "workflow_step" TEXT,
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_chat_messages_session_id_created_at_idx"
ON "agent_chat_messages"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "agent_sessions_module_type_module_session_id_idx"
ON "agent_sessions"("module_type", "module_session_id");

-- CreateIndex
CREATE INDEX "agent_sessions_status_last_activity_at_idx"
ON "agent_sessions"("status", "last_activity_at");

COMMENT ON TABLE "agent_chat_messages" IS 'Chat messages for agent sessions (Epic 08)';
COMMENT ON TABLE "agent_sessions" IS 'Links agent sessions to module sessions (Epic 08)';
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-06
**Approved By:** Platform Team
**Next Review:** After Epic 10 Deployment
