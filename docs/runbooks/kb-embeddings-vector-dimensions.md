# Runbook: KB Embeddings Vector Dimensions

This runbook documents how HYVVE’s KB embeddings are dimensioned today, why changing the embeddings model can break the system, and the recommended migration strategies to support multiple dimensions safely.

---

## Current State (KB-02)

- Storage: `page_embeddings.embedding` is `vector(1536)` (pgvector) via Prisma `Unsupported("vector(1536)")`.
- Default model: `text-embedding-3-small` (1536 dims).
- Runtime behavior:
  - `KB_EMBEDDINGS_MODEL` controls the model sent to the provider.
  - `KB_EMBEDDINGS_DIMS` can override dimensions (or be inferred from the model name).
  - The API **fails fast** if dims ≠ 1536 because the DB column is fixed at `vector(1536)`.

**Why this matters:** If you change to a 3072-dim model (e.g. `text-embedding-3-large`) without a DB migration, inserts and similarity queries will fail or silently misbehave.

---

## Safe Migration Options

### Option A (Simple, Breaking): Migrate the column to a new fixed dimension

**Use when:** You want a single global embeddings dimension and can accept rebuilding all embeddings.

1. Deploy code that can generate embeddings for the new model/dims.
2. Run a DB migration that changes:
   - `page_embeddings.embedding` from `vector(1536)` → `vector(3072)` (or your chosen dim).
   - Rebuild the ivfflat index afterwards.
3. Backfill embeddings for all pages (re-embed content).

**Pros:** Simple schema, simple queries.

**Cons:** Breaks existing embeddings; requires full re-embed + reindex; downtime risk if index creation isn’t `CONCURRENTLY`.

---

### Option B (Recommended): Multi-model / multi-dimension storage

**Use when:** You want to support switching models over time, A/B tests, or mixed providers.

Schema approaches:

1. **New table per (model,dims)**:
   - `page_embeddings_v2` with `(embedding_model, embedding_dims, embedding)` and a dimension-specific storage strategy.
2. **Partitioned embeddings table**:
   - Partition by `embedding_dims` (or by `embedding_model`), each partition has a fixed `vector(N)` type.
3. **Separate columns per supported dim**:
   - e.g. `embedding_1536 vector(1536) NULL`, `embedding_3072 vector(3072) NULL` (only if you’ll support a small, fixed set).

Query strategy:
- Semantic search / RAG chooses the active `(model,dims)` (via config) and queries only the matching storage.

Backfill strategy:
- Keep old embeddings until new embeddings are ready, then cut over config.

**Pros:** Safe transitions, supports coexistence, avoids forced global rewrite.

**Cons:** More schema and query complexity.

---

## Operational Notes

- ivfflat index creation can be expensive; schedule during maintenance windows or run `CONCURRENTLY` via an out-of-band migration process if needed.
- Always ensure the `vector` extension is present before creating indexes.
- When switching models, plan for cost controls (rate limiting/pacing) and backfill job sizing.

