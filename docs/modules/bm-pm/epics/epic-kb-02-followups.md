# Epic KB-02 Follow-ups (Post-PR TODO)

This file tracks actionable follow-ups based on code review for **Epic KB-02: KB Real-Time & RAG**.

## P0 (High Priority)

### 1) Embedding dimensions are hardcoded (1536)
- **Where:** `apps/api/src/kb/embeddings/embeddings.service.ts`, `apps/api/src/kb/search/search.service.ts`, `apps/api/src/kb/rag/rag.service.ts`
- **Risk:** Changing `KB_EMBEDDINGS_MODEL` to a model with different dimensions (e.g. 3072) will break at runtime.
- **Important constraint:** The DB column is `vector(1536)` and Prisma schema uses `Unsupported("vector(1536)")`, so supporting other dimensions requires a **schema + migration** (not just config).
- **TODO:**
  - [x] Add `KB_EMBEDDINGS_DIMS` (default `1536`) and centralize dims in one place.
  - [x] Fail-fast if dims do not match current DB schema (`vector(1536)`).
  - Plan migration strategy to support other dims:
    - Option A: migrate `page_embeddings.embedding` to `vector(3072)` (breaking for existing 1536 data).
    - Option B: create a new table keyed by `(model, dims)` or separate columns per model.

### 2) Embeddings error handling may leak provider details
- **Where:** `apps/api/src/kb/embeddings/embeddings.service.ts` (`response.text()` included in thrown message)
- **Risk:** Provider error bodies can include sensitive/debug content; this can end up in logs or API responses (semantic search/RAG).
- **TODO:**
  - [x] In production: log only `status`, `provider`, and model (no body).
  - [x] Return a generic error to clients; keep a redacted/truncated body only in non-production logs.

## P1 (Medium Priority)

### 3) Large raw SQL batch inserts could stress DB
- **Where:** `apps/api/src/kb/embeddings/embeddings.service.ts` (chunking + insert batching)
- **Context:** Defaults are `maxChunks=200`, `batchSize=25`. Vector payload dominates query size.
- **TODO:**
  - [x] Make chunking and DB batch size configurable via env.
  - Add safety caps based on total payload size (e.g., reduce batch size as chunk count grows).
  - Consider metrics/logging for “chunks per doc” and “embedding insert duration”.

### 4) No cost/rate protection around external embeddings calls
- **Where:** `apps/api/src/kb/embeddings/embeddings.service.ts` (external `/v1/embeddings` calls)
- **Risk:** Bulk edits or repeated saves could trigger high cost / provider rate limits.
- **TODO:**
  - [x] Add BullMQ processor concurrency limits (concurrency=1).
  - [x] Add basic circuit breaker (open on 429/5xx).
  - [x] Coalesce duplicate jobs per page via `jobId` + `updateData()` + delayed debounce on updates.

### 5) Breadcrumb path building can be optimized
- **Where:** `apps/api/src/kb/search/search.service.ts` (`buildBreadcrumbPathsBatch`)
- **Risk:** Up to 10 sequential queries for deep trees.
- **TODO:**
  - [x] Replace iterative fetching with a PostgreSQL recursive CTE (with cycle guard).

## P2 (Low Priority)

### 6) Frontend auto-save timeout uses state (minor race window)
- **Where:** `apps/web/src/components/kb/editor/PageEditor.tsx`
- **TODO:** [x] Replace `saveTimeoutId` state with `useRef` to eliminate timing window and reduce renders.

### 7) Standardize error formats
- **Where:** Various KB API/services
- **TODO:** Pick consistent error codes/objects (vs mixed strings and sentences).

### 8) Extract magic numbers into constants
- **Where:** `apps/api/src/kb/embeddings/embeddings.service.ts` (attempts, backoff, batch sizes, limits)
- **TODO:** Move to `embeddings.constants.ts` (or similar) for tuning.

### 9) Vector conversion caching (optional)
- **Where:** `vectorToPgvectorText` call sites
- **TODO:** Only worth it if the same vector is reused frequently; likely minimal gain.

## Not Actionable / Already Covered

- **“Missing index on `page_embeddings.page_id`”**: already present (`@@index([pageId])` in Prisma schema and `page_embeddings_page_id_idx` migration).
- **“Debounced persistence race in collab server”**: timeout is cleared before re-scheduling; looks OK as-is.
