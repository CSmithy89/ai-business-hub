# Story: KB-02.7 - Agent KB Queries (RAG Endpoint)

**Epic:** KB-02 - KB Real-Time & RAG  
**Status:** Done  
**Completed:** 2025-12-18  
**Points:** 8

---

## Story Description

As an agent (or agent-backed feature), I want an API that returns the most relevant KB chunks for a query, including citations, so I can answer user questions grounded in workspace KB content.

---

## Acceptance Criteria

- [x] Given an authenticated request with a query
- [x] When embeddings are available
- [x] Then the API returns top-k matching chunks (vector similarity)
- [x] And includes citations (pageId/slug/title/chunkIndex)
- [x] And returns a pre-formatted context string suitable for LLM prompting
- [x] And enforces tenantId + workspaceId filtering

---

## Technical Implementation

### Backend (NestJS)

#### 1. New RAG Endpoint
- `POST /kb/rag/query`

**Location:** `apps/api/src/kb/rag/rag.controller.ts`

#### 2. Retrieval Strategy
- Embed the query using the workspace’s default valid BYOAI provider (OpenAI-compatible).
- Query `page_embeddings` joined to `knowledge_pages` and rank by cosine distance (`<=>`).
- Returns:
  - `chunks[]`: scored chunk results
  - `citations[]`: minimal citation metadata
  - `context`: preformatted multi-chunk context block

**Location:** `apps/api/src/kb/rag/rag.service.ts`

### Tests

- Unit test for RAG formatting (context + citations).

**Location:** `apps/api/src/kb/rag/rag.service.spec.ts`

