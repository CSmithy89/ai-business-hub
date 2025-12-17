# Story: KB-02.1 - Yjs Collaboration Setup

**Epic:** KB-02 - KB Real-Time & RAG
**Status:** Done
**Completed:** 2025-12-17
**Points:** 8

---

## Story Description

As a platform developer, I want a Yjs/Hocuspocus server for real-time editing, so that multiple users can edit the same KB page simultaneously.

---

## Acceptance Criteria

- [x] Given Hocuspocus dependencies installed
- [x] When the API server starts
- [x] Then a WebSocket endpoint is available for Yjs sync
- [x] And authentication is enforced via the existing session token
- [x] And document state is persisted to the `knowledge_pages.yjs_state` column
- [x] And persistence is debounced (5 seconds)

---

## Technical Implementation

### Backend

#### 1. Collaboration Server (Hocuspocus)
Added a Nest-managed Hocuspocus server that starts with the API process (disabled in tests).

- Default port: `3002` (override via `KB_COLLAB_PORT`)
- Bind host: `0.0.0.0` (override via `KB_COLLAB_HOST`)
- Can be disabled via `KB_COLLAB_ENABLED=false`

**Location:** `apps/api/src/kb/collab/kb-collab.server.service.ts`

#### 2. Authentication + Workspace Access Enforcement
Connections authenticate using the same session token model as REST endpoints (sessions table), and access is verified via workspace membership.

Document naming convention:
- `kb:page:{pageId}`

The server verifies:
- Session token is valid and not expired
- The page exists and is not deleted
- The user is a member of the page’s workspace

#### 3. Persistence to Postgres
The server loads and stores Yjs state to:
- `KnowledgePage.yjsState` (`knowledge_pages.yjs_state`)

Writes are debounced to reduce DB load:
- 5 seconds (`PERSIST_DEBOUNCE_MS = 5000`)

#### 4. KB Module Integration
Registered the collab server module in KB.

**Location:** `apps/api/src/kb/kb.module.ts`

### Dependencies

Installed:
- `@hocuspocus/server`
- `yjs`

### Tests

Added unit tests to verify:
- Document naming validation
- Authentication context creation
- Loading persisted Yjs state
- Debounced persistence behavior

**Location:** `apps/api/src/kb/collab/kb-collab.server.service.spec.ts`

