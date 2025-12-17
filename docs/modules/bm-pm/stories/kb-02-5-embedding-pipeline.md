# Story: KB-02.5 - Embedding Pipeline

**Epic:** KB-02 - KB Real-Time & RAG  
**Status:** Done  
**Completed:** 2025-12-18  
**Points:** 8

---

## Story Description

As a KB user, I want page content to be embedded automatically in the background, so that semantic search and RAG can retrieve relevant context.

---

## Acceptance Criteria

- [x] Given a KB page is created or updated
- [x] When the change is persisted
- [x] Then a background job is enqueued to generate embeddings
- [x] And embeddings are stored per chunk in `page_embeddings`
- [x] And pgvector has an ivfflat cosine index to support fast similarity search
- [x] And failures do not block the main CRUD request

---

## Technical Implementation

### Database (Prisma + Postgres)

- Added an ivfflat index for cosine similarity on `page_embeddings.embedding`.

**Migration:** `packages/db/prisma/migrations/20251217230000_add_page_embeddings_vector_index/migration.sql`

### Backend (NestJS)

#### 1. BullMQ Queue + Processor
- Queue: `kb-embeddings`
- Job: `generate-page-embeddings`

**Location:** `apps/api/src/kb/embeddings/`

#### 2. Chunking + Embeddings
- Uses `knowledge_pages.content_text` as the source text.
- Chunks by word windows with overlap (approx token proxy).
- Calls an OpenAI-compatible `/v1/embeddings` endpoint using the workspace’s default valid BYOAI provider (OpenAI / OpenRouter / DeepSeek).
- Stores embeddings via raw SQL insert (Prisma `Unsupported("vector(1536)")` field).

**Location:** `apps/api/src/kb/embeddings/embeddings.service.ts`

#### 3. Triggers from Page CRUD
On create/update, the embeddings job is enqueued asynchronously (errors are logged but do not fail the request).

**Location:** `apps/api/src/kb/pages/pages.service.ts`

### Configuration

- `KB_EMBEDDINGS_ENABLED` (default: enabled unless explicitly set to `false`)
- `KB_EMBEDDINGS_MODEL` (default: `text-embedding-3-small`)

---

## Tests

- Added unit tests for chunking, provider base URL mapping, and pgvector serialization.

**Location:** `apps/api/src/kb/embeddings/embeddings.utils.spec.ts`

