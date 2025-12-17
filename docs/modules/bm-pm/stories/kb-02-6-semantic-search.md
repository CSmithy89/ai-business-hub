# Story: KB-02.6 - Semantic Search

**Epic:** KB-02 - KB Real-Time & RAG  
**Status:** Done  
**Completed:** 2025-12-18  
**Points:** 8

---

## Story Description

As a KB user, I want semantic search that uses embeddings so I can find relevant pages even when my query doesn’t match exact keywords.

---

## Acceptance Criteria

- [x] Given I submit a semantic query
- [x] When embeddings are available
- [x] Then results are ranked by vector similarity (cosine distance)
- [x] And results include a best-matching chunk snippet
- [x] And multi-tenant filtering is enforced (tenantId + workspaceId)
- [x] And the endpoint is rate-limited (same window as FTS search)

---

## Technical Implementation

### Backend (NestJS)

#### 1. New Endpoint
- `POST /kb/search/semantic`

**Location:** `apps/api/src/kb/search/search.controller.ts`

#### 2. Vector Search Query
- Embeds the query using the workspace’s default valid BYOAI provider (OpenAI-compatible).
- Computes cosine distance via pgvector operator `<=>`.
- Picks the best chunk per page using a window function and returns page results sorted by distance.

**Location:** `apps/api/src/kb/search/search.service.ts`

#### 3. Embeddings Service Reuse
Added a reusable method to embed arbitrary strings for a workspace (used by semantic search and later RAG endpoints).

**Location:** `apps/api/src/kb/embeddings/embeddings.service.ts`

### Tests

- Extended search controller rate-limit tests to cover semantic search and fixed Jest mapping for workspace `@hyvve/shared/*` imports.

**Location:** `apps/api/src/kb/search/search.controller.spec.ts`  
**Jest config:** `apps/api/package.json`

