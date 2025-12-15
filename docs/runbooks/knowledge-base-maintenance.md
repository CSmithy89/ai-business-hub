# Runbook: Knowledge Base Maintenance

This runbook covers operational maintenance for HYVVE’s workspace-scoped knowledge base (RAG) backed by Postgres + pgvector.

---

## What HYVVE Stores

Each workspace gets its own pgvector table to enforce tenant isolation. AgentOS caches `Knowledge` instances in memory to avoid rebuilding vector DB clients on every request.

Key implementation reference:

- `agents/knowledge/factory.py` (`KnowledgeFactory`)

---

## When to Use This Runbook

Use this runbook when you need to:

- Diagnose unusually large knowledge tables or storage growth.
- Clear stuck/stale knowledge caches during debugging.
- Delete a workspace’s knowledge table (for compliance, workspace deletion, or reset).
- Tune cache limits in response to memory pressure.

---

## Key Concepts

### Table Naming

HYVVE uses two naming schemes:

1. **Current (hashed) table names**:
   - Format: `knowledge_{sanitized_workspace_id}_{sha256_prefix}`
   - `sanitized_workspace_id` is lowercased, non-alphanumeric replaced with `_`, and truncated.
   - `sha256_prefix` is a hex prefix derived from the raw workspace ID.

2. **Legacy (older) table names**:
   - Format: `knowledge_{sanitized_workspace_id}`
   - The sanitized portion may be truncated to fit identifier limits.

`KnowledgeFactory` prefers a legacy table if it exists, to avoid orphaning older data.

### Cache and Pooling

AgentOS maintains per-process in-memory caches and a small asyncpg pool for metadata/DDL operations.

Environment variables:

- `KNOWLEDGE_CACHE_MAX_INSTANCES` (default `50`): max number of cached workspace `Knowledge` instances per process.
- `KNOWLEDGE_CACHE_TTL_SECONDS` (default `3600`): TTL for cached instances.
- `KNOWLEDGE_TABLE_NAME_CACHE_MAX` (default `500`): upper bound for the table-name cache (clears when exceeded).

---

## Routine Checks

### List knowledge tables

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'knowledge_%'
ORDER BY table_name;
```

### Inspect table sizes

```sql
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
WHERE relname LIKE 'knowledge_%'
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## Cache Maintenance

### Clear caches (operational)

The knowledge cache is per-process. The simplest way to clear it is to restart AgentOS workers.

If you have a Python REPL attached to the AgentOS process, you can also clear cache in-process:

```python
from agents.knowledge.factory import get_knowledge_factory

factory = get_knowledge_factory()
factory.clear_cache()  # clears all workspaces
```

To clear a single workspace:

```python
factory.clear_cache("workspace-id")
```

### Close pooled resources (shutdown)

If you are stopping AgentOS cleanly, you can close the internal asyncpg pool:

```python
await factory.close()
```

---

## Table Cleanup (Workspace Reset / Deletion)

### Safety checks before you drop tables

1. Ensure you have the correct workspace ID.
2. Confirm you are operating on the correct environment/database.
3. Ensure backups/snapshots are available and access-controlled.

### Drop a workspace’s knowledge tables

`KnowledgeFactory.delete_workspace_knowledge(workspace_id)` is implemented in `agents/knowledge/factory.py`, but it is not exposed via an HTTP endpoint.

Operational options:

#### Option A: Drop via SQL (manual)

1. Identify candidate tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'knowledge_%'
ORDER BY table_name;
```

2. Drop the tables you have validated belong to the workspace:

```sql
DROP TABLE IF EXISTS "knowledge_<workspace_fragment>_<sha_suffix>" CASCADE;
DROP TABLE IF EXISTS "knowledge_<legacy_fragment>" CASCADE;
```

#### Option B: Drop via in-process call (preferred when available)

If you can run code inside the AgentOS environment:

```python
from agents.knowledge.factory import get_knowledge_factory

factory = get_knowledge_factory()
ok = await factory.delete_workspace_knowledge("workspace-id")
print(ok)
```

This will:

- Remove cached instances for that workspace (if present)
- Drop both the current and legacy knowledge tables (best effort)

---

## Troubleshooting

### Workspace returns unexpected knowledge results

Common causes:

- A legacy table exists and is still being used for that workspace.
- AgentOS workers are running with different cache state (multi-process deployment).

Suggested checks:

- Verify which table name is resolved for the workspace by reproducing in an AgentOS REPL.
- Confirm the workspace’s table exists and contains only that workspace’s expected data.

### Memory pressure in AgentOS

Suggested actions:

- Lower `KNOWLEDGE_CACHE_MAX_INSTANCES`.
- Lower `KNOWLEDGE_CACHE_TTL_SECONDS`.
- Restart AgentOS workers to clear caches after changing env vars.

