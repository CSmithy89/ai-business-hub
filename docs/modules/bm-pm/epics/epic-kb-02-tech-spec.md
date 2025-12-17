# Epic KB-02: KB Real-Time & RAG - Technical Specification

**Epic:** KB-02 - KB Real-Time & RAG  
**FRs Covered:** KB-F4, KB-F6  
**Stories:** 8 (KB-02.1 to KB-02.8)  
**Created:** 2025-12-17  
**Status:** Technical Context  

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Backend Design](#backend-design)
5. [Frontend Design](#frontend-design)
6. [Security & Multi-Tenancy](#security--multi-tenancy)
7. [Story Implementation Guide](#story-implementation-guide)
8. [Testing Strategy](#testing-strategy)
9. [Operational Notes](#operational-notes)

---

## Overview

### Epic Goal

Add real-time collaborative editing (CRDT) to Knowledge Base pages and enable semantic search + RAG context retrieval using embeddings.

### Scope

**In Scope (KB-02):**
- Real-time multi-user page editing with cursor presence (Yjs + Hocuspocus)
- Offline-first editing (IndexedDB) with automatic merge on reconnect
- pgvector enablement + embeddings storage/indexing
- Background embedding generation on page save
- Hybrid search (FTS + vector similarity) and RAG query endpoint for agents

**Out of Scope (KB-03+):**
- Verified content workflows (badge/review cycles)
- @mentions / hash references extraction
- Scribe agent automation

### Dependencies

- KB-01: Knowledge Page CRUD + editor foundation
- PostgreSQL + Prisma
- Existing session token auth (same as `RealtimeGateway.validateToken`)
- BullMQ (already present) for background embedding work
- BYOAI provider selection via existing AI providers module (OpenAI/Anthropic/etc.)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Knowledge Base (KB-02)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Frontend (Next.js)                                                         │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  KB Page Editor                                                       │  │
│   │  • Tiptap + Collaboration + CollaborationCursor                       │  │
│   │  • Hocuspocus provider (WS)                                           │  │
│   │  • IndexedDB persistence (offline)                                    │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Backend (NestJS)                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  KB Collab Server (Hocuspocus)                                        │  │
│   │  • WebSocket endpoint (separate port)                                 │  │
│   │  • Auth via session token                                             │  │
│   │  • Persist state to knowledge_pages.yjs_state                         │  │
│   │  • Debounced save (5s)                                                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│   Embeddings & RAG                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  BullMQ Job                                                          │  │
│   │  • Chunk text -> embeddings via BYOAI                                 │  │
│   │  • Store in page_embeddings (pgvector)                                │  │
│   │  • ivfflat index for cosine similarity                                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

- **Collaboration** is real-time and must not block REST mutations.
- **Persistence** for collaboration state is server-side and debounced.
- **Embeddings** are asynchronous background work; API calls must be fast.

---

## Data Models

### Existing Prisma Models Used

- `KnowledgePage.yjsState: Bytes?` — persisted Yjs document state for collaboration
- `PageEmbedding` — chunk-level embeddings for semantic search

### pgvector Requirements

- PostgreSQL extension: `vector`
- Index: `ivfflat` on `page_embeddings.embedding` with `vector_cosine_ops`

---

## Backend Design

### Collaboration Server (KB-02.1)

- Implement a Hocuspocus server as a Nest provider (start/stop lifecycle)
- Default port: `KB_COLLAB_PORT` (fallback `3002`)
- Document name format: `kb:page:{pageId}`
- Auth:
  - Client passes session token in connection params/headers
  - Server validates token via Prisma sessions (same logic as `RealtimeGateway`)
- Persistence:
  - On load: fetch `knowledge_pages.yjs_state`
  - On store: encode Yjs state and persist to `knowledge_pages.yjs_state`
  - Debounce writes to reduce DB load (5 seconds)

### Embedding Pipeline (KB-02.6)

- BullMQ queue for `kb-embedding` jobs
- Trigger:
  - On explicit “save” (version create) or on debounced server persistence (configurable)
- Dedup:
  - Compute hash of extracted text and skip if unchanged (store hash alongside embeddings)
- Chunking:
  - Approx 512 tokens with 50 overlap (tokenization strategy defined in implementation)

### Search (KB-02.7)

- Hybrid search:
  - FTS candidates for query terms
  - Vector similarity ranking and boosting
- Boosting:
  - Verified pages score multiplier 1.5x
- New endpoints:
  - `POST /api/kb/search/semantic`
  - `POST /api/kb/rag/query`

---

## Frontend Design

### Collaborative Editor Integration (KB-02.2–KB-02.4)

- Extend existing KB page editor to support:
  - Hocuspocus provider connection lifecycle
  - Collaboration extensions
  - Offline persistence (IndexedDB)
  - Network status indicator and “reconnecting” state

### Presence Cursors (KB-02.3)

- Show collaborator cursors and selections
- Deterministic color derived from `userId`
- Display name label from session user info

---

## Security & Multi-Tenancy

- Workspace isolation:
  - Collaboration documents must validate `tenantId` + `workspaceId` against the page
  - Never allow cross-workspace subscription to a page doc
- Auth:
  - Reject unauthenticated WS connections
  - Rate limit or connection limit similar to `RealtimeGateway` (optional hardening)
- Input safety:
  - Search snippet rendering remains sanitized (KB-01 hardening)

---

## Story Implementation Guide

### KB-02.1: Hocuspocus Server Setup

- Add server dependencies (`@hocuspocus/server`, `yjs`, etc.)
- Add Nest provider for lifecycle start/stop
- Persist to `KnowledgePage.yjsState` with 5s debounce
- Validate session token and page ownership (`tenantId` + `workspaceId`)

### KB-02.2: Collaborative Editor Integration

- Add Tiptap collaboration extensions + Hocuspocus client provider
- Ensure remote updates render correctly and local edits merge without conflicts
- Add IndexedDB persistence provider for offline editing

### KB-02.3: Cursor Presence

- Add collaboration cursor extension
- Surface collaborator list (name + color) and cursor overlays

### KB-02.4: Offline Editing Support

- Detect offline state and show indicator
- Continue accepting edits locally
- Sync automatically on reconnect

### KB-02.5: pgvector Setup & Migration

- Add migration:
  - `CREATE EXTENSION IF NOT EXISTS vector;`
  - Create ivfflat index for cosine similarity
- Verify migrations run in Docker and local Postgres

### KB-02.6: Embedding Generation Pipeline

- Create BullMQ queue + processor
- Extract text, chunk, embed using BYOAI provider config
- Store embeddings per chunk and replace old rows atomically

### KB-02.7: Semantic Search

- Implement vector search query using pgvector cosine similarity
- Combine with FTS score and verified boost
- Return results with citations (chunk/page references)

### KB-02.8: Agent KB Context API

- RAG query endpoint for agents
- Returns top-k chunks with citations and a pre-formatted context string

---

## Testing Strategy

- Backend:
  - Unit tests for collaboration persistence adapter (load/store)
  - Unit tests for RAG query ranking and verified boost
  - Integration tests for search endpoints (mock embedding provider)
- Web:
  - Component tests for offline indicator and provider lifecycle
  - Cursor rendering smoke test (jsdom-level, mocked provider)

---

## Operational Notes

- Configure `KB_COLLAB_PORT` for local/dev environments
- Consider separating collab server into its own process for production scaling (future)
- Monitor DB write load for Yjs persistence; keep debouncing and batch updates where possible

