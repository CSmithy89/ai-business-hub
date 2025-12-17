# Epic KB-02: KB Real-Time & RAG

**Goal:** Users get collaborative editing with live cursors and AI-powered semantic search.

**FRs Covered:** KB-F4, KB-F6

---

### Story KB-02.1: Hocuspocus Server Setup

**As a** platform developer,
**I want** Yjs/Hocuspocus server for real-time editing,
**So that** multiple users can edit simultaneously.

**Acceptance Criteria:**

**Given** Hocuspocus dependencies installed
**When** server starts
**Then** WebSocket endpoint available for Yjs sync

**And** authentication via JWT

**And** document state persisted to yjsState column

**And** debounced save to PostgreSQL (5 seconds)

**Prerequisites:** KB-01.1

**Technical Notes:**
- Hocuspocus in `apps/api/src/modules/kb/hocuspocus/`
- Separate port or path for WS

---

### Story KB-02.2: Collaborative Editor Integration

**As a** KB user,
**I want** to edit pages with others simultaneously,
**So that** we can collaborate in real-time.

**Acceptance Criteria:**

**Given** multiple users open same page
**When** one user types
**Then** other users see changes immediately

**And** no conflicts (CRDT handles merging)

**And** offline edits sync when reconnected

**Prerequisites:** KB-02.1

**Technical Notes:**
- Tiptap Collaboration extension
- IndexedDB for offline persistence

---

### Story KB-02.3: Cursor Presence

**As a** KB user,
**I want** to see other users' cursors,
**So that** I know where they're editing.

**Acceptance Criteria:**

**Given** multiple users editing
**When** user moves cursor
**Then** others see colored cursor with name label

**And** selection highlighting visible

**And** user list shows who's currently editing

**Prerequisites:** KB-02.2

**Technical Notes:**
- Tiptap CollaborationCursor extension
- Color generated from userId

---

### Story KB-02.4: Offline Editing Support

**As a** KB user,
**I want** to edit pages offline,
**So that** I can work without connectivity.

**Acceptance Criteria:**

**Given** I lose network connection
**When** I continue editing
**Then** changes saved locally (IndexedDB)

**And** "Offline" indicator shows

**And** on reconnect, changes sync automatically

**And** conflicts resolved via CRDT

**Prerequisites:** KB-02.2

**Technical Notes:**
- y-indexeddb provider
- Network status detection

---

### Story KB-02.5: pgvector Setup & Migration

**As a** platform developer,
**I want** pgvector extension enabled,
**So that** we can store embeddings for RAG.

**Acceptance Criteria:**

**Given** PostgreSQL database
**When** migration runs
**Then** vector extension enabled

**And** PageEmbedding table created with vector column

**And** ivfflat index created for fast similarity search

**Prerequisites:** KB-01.1

**Technical Notes:**
- CREATE EXTENSION IF NOT EXISTS vector
- Index with lists=100 for MVP scale

---

### Story KB-02.6: Embedding Generation Pipeline

**As a** platform,
**I want** automatic embedding generation on page save,
**So that** pages are searchable semantically.

**Acceptance Criteria:**

**Given** page content is saved
**When** content differs from last embedding
**Then** text extracted and chunked (512 tokens, 50 overlap)

**And** embeddings generated via tenant's BYOAI config

**And** stored in PageEmbedding table

**And** old embeddings replaced

**Prerequisites:** KB-02.5

**Technical Notes:**
- Background job for embedding generation
- Queue to avoid blocking saves

---

### Story KB-02.7: Semantic Search

**As a** KB user,
**I want** to search by meaning not just keywords,
**So that** I find relevant content even with different wording.

**Acceptance Criteria:**

**Given** pages have embeddings
**When** I search "how to deploy"
**Then** results include pages about "deployment process" and "release workflow"

**And** results ranked by vector similarity

**And** verified pages boosted (1.5x)

**And** hybrid search: combines FTS + semantic

**Prerequisites:** KB-02.6

**Technical Notes:**
- POST /api/kb/search/semantic
- Cosine similarity with pgvector

---

### Story KB-02.8: Agent KB Context API

**As a** platform agent,
**I want** to query KB for relevant context,
**So that** I can provide informed responses.

**Acceptance Criteria:**

**Given** agent needs context
**When** agent calls RAG API
**Then** returns top-k relevant chunks

**And** formatted context string ready for LLM

**And** source citations included

**Prerequisites:** KB-02.7

**Technical Notes:**
- POST /api/kb/rag/query
- Used by Navi and other agents

---
