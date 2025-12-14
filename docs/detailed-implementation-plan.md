# HYVVE Detailed Implementation Plan & Audit

**Status:** Living Document
**Date:** 2025-12-14
**Version:** 2.10
**Last Audit:** 2025-12-14

---

## 1. Executive Summary

This document outlines the strategic roadmap for evolving the HYVVE platform into a modular, agentic business orchestration system. It is based on the "Modular Monolith" architecture (inspired by ERPNext/Odoo) and integrates cutting-edge agent protocols (A2A, AG-UI, MCP).

### Core Philosophy: The 90/5 Promise
**Goal:** Automate 90% of business operations, requiring ~5 hours/week of human oversight.
**Mechanism:**
1.  **Strict Data Layer:** Shared PostgreSQL schema for truth.
2.  **Autonomous Agents:** Python-based Agno agents for execution.
3.  **Human-in-the-Loop:** AG-UI for transparent, streaming, interactive oversight.
4.  **Interoperability:** A2A protocol for agent-to-agent collaboration.

---

## 2. Audit & Gap Analysis

### 2.1. Current State (Based on `agents/` analysis - Dec 2025)

**What's Built:**
*   **Runtime:** FastAPI server (`AgentOS`) hosting agent teams (Validation, Planning, Branding, Platform/Approval).
*   **Registry:** `AgentRegistry` class with A2A card generation (`agents/registry.py`) - **EXISTS BUT NOT WIRED**.
*   **Streaming:** `EventEncoder` class for AG-UI SSE format (`agents/ag_ui/encoder.py`) - **EXISTS BUT NOT USED**.
*   **BYOAI:** `BYOAIClient` for fetching provider configs (`agents/providers/byoai_client.py`) - **IMPLEMENTED**.
*   **Middleware:** TenantMiddleware (JWT/workspace), Rate Limiting, Business Validator - **IMPLEMENTED**.
*   **Teams:** Validation, Planning, Branding teams with factory pattern - **IMPLEMENTED**.

**What's Missing:**
*   **Endpoints return JSON, not SSE** - StreamingResponse not used in `main.py`.
*   **A2A discovery endpoint** - `/.well-known/agent-card.json` not exposed.
*   **A2A RPC endpoint** - `/a2a/{agent_id}/rpc` JSON-RPC not implemented.
*   **Registry integration** - Registry exists but teams not registered.
*   **RAG/Knowledge** - No PgVector implementation.
*   **MCP Integration** - No MCP SDK in requirements.

### 2.2. Gap Analysis Matrix

| Component | Current State | Target Requirement | Gap Severity |
|-----------|---------------|-------------------|--------------|
| **Protocol** | Custom REST API | **A2A Protocol** (JSON-RPC 2.0) | 🔴 High |
| **Discovery** | Registry exists, endpoint missing | `/.well-known/agent-card.json` | 🟡 Medium (code exists) |
| **Streaming** | EventEncoder exists, not wired | **AG-UI** (SSE `text/event-stream`) | 🟡 Medium (code exists) |
| **Events** | Basic events in encoder | Full AG-UI Event Set (see 4.2.1) | 🟠 Medium |
| **BYOAI** | BYOAIClient implemented | Dynamic provider injection | 🟢 Low (mostly done) |
| **Persistence** | PostgresStorage for sessions | **Shared Schema** (business data) | 🟠 Medium |
| **RAG** | None | **PgVector** Knowledge Base | 🟠 Medium |
| **MCP** | None | **MCP** with Permissions | 🟠 Medium |

---

## 3. Architecture Strategy: "The Modular Monolith"

We will adopt a structure where "Modules" are vertical slices containing both the traditional CRUD logic (NestJS) and the Agentic logic (Python).

### 3.1. Module Structure
Each module (e.g., `BM-CRM`) consists of:

1.  **Data Layer (PostgreSQL):** Shared schema (e.g., `crm_contacts`, `crm_deals`).
2.  **Operational Layer (NestJS):** REST API for UI CRUD, webhooks, and fast business logic.
3.  **Agentic Layer (Python AgentOS):** Agno Team exposing A2A/AG-UI endpoints.

### 3.2. Shared Services (The Foundation)
Modules depend *only* on the Foundation, not each other directly.

*   **Auth & RBAC:** (Already implemented via `better-auth`).
*   **Event Bus:** Redis Streams for async cross-module triggers.
*   **Agent Registry:** A dynamic lookup service in AgentOS to route A2A requests.

---

## 4. Technical Implementation Plan

### Phase 1: Agent Foundation Upgrade (The "AgentOS 2.0")

**Status:** ✅ Complete - A2A and AG-UI protocols implemented

#### 4.1. Protocols & Standards
*   **✅ Spec Completed:** `docs/architecture/a2a-protocol.md` (JSON-RPC, Agent Card).
*   **✅ Spec Completed:** `docs/architecture/ag-ui-protocol.md` (SSE Events, Render Hints).
*   **✅ Spec Completed:** `docs/architecture/remote-coding-agent-patterns.md` (Resumable Sessions, Safety).
*   **✅ Spec Completed:** `docs/architecture/agno-implementation-guide.md` (Deep Dive into Agno components).

#### 4.2. AG-UI Integration (Streaming)

**Objective:** Replace standard JSON responses with SSE streams.

**Current Status:**
*   ✅ `EventEncoder` class exists at `agents/ag_ui/encoder.py`
*   ✅ Basic event types defined (`RUN_STARTED`, `TEXT_MESSAGE_CHUNK`, `RUN_FINISHED`, `ERROR`)
*   ❌ `StreamingResponse` not used in `main.py` endpoints
*   ❌ Tool call events have TODO comment
*   ❌ Missing `THOUGHT_CHUNK` and `UI_RENDER_HINT` events

##### 4.2.1. Complete AG-UI Event Types

The following events MUST be supported (per `ag-ui-protocol.md` and `agno-implementation-guide.md`):

| Event Type | Purpose | Status |
|------------|---------|--------|
| `RUN_STARTED` | Agent begins processing | ✅ Implemented |
| `RUN_FINISHED` | Agent completes execution | ✅ Implemented |
| `TEXT_MESSAGE_CHUNK` | Token-by-token text streaming | ✅ Implemented |
| `TOOL_CALL_START` | Tool invocation begins | ⚠️ Enum only |
| `TOOL_CALL_ARGS` | Progressive tool arguments display | ❌ Missing |
| `TOOL_CALL_RESULT` | Tool returns result | ⚠️ Enum only |
| `THOUGHT_CHUNK` | Reasoning model thinking (o1/Claude) | ❌ Missing |
| `UI_RENDER_HINT` | Rich component rendering instruction | ❌ Missing |
| `ERROR` | Fatal error occurred | ✅ Implemented |

##### 4.2.2. Event Mapping (Agno to AG-UI)

```
| Agno Event     | AG-UI Event Type      |
|----------------|----------------------|
| RunStart       | RUN_STARTED          |
| Stream (Text)  | TEXT_MESSAGE_CHUNK   |
| Stream (Think) | THOUGHT_CHUNK        |
| ToolCall       | TOOL_CALL_START      |
| ToolCallArgs   | TOOL_CALL_ARGS       |
| ToolOutput     | TOOL_CALL_RESULT     |
| RenderHint     | UI_RENDER_HINT       |
| RunFinish      | RUN_FINISHED         |
| Error          | ERROR                |
```

##### 4.2.3. Implementation Tasks

1.  **Update `ag_ui/encoder.py`:**
    *   Add `THOUGHT_CHUNK` to `AGUIEventType` enum
    *   Add `TOOL_CALL_ARGS` to `AGUIEventType` enum
    *   Add `UI_RENDER_HINT` to `AGUIEventType` enum
    *   Implement tool call detection in `stream_response()`

2.  **Update `main.py` endpoints:**
    *   Convert `/agents/*/runs` endpoints to use `StreamingResponse`
    *   Import and use `EventEncoder.stream_response()`
    *   Add `media_type="text/event-stream"` to responses

3.  **Frontend Hook:**
    *   Create `useAgentStream` hook for SSE consumption
    *   Handle all event types with appropriate UI updates

#### 4.3. A2A Protocol Implementation (Interoperability)

**Objective:** Make agents discoverable and callable.

**Current Status:**
*   ✅ `AgentRegistry` class exists at `agents/registry.py`
*   ✅ `AgentCard`, `AgentSkill`, `AgentCapabilities` Pydantic models defined
*   ✅ Card generation from agent tools implemented
*   ❌ Registry not instantiated/used in `main.py`
*   ❌ Discovery endpoint not exposed
*   ❌ RPC endpoint not implemented

##### 4.3.1. Implementation Tasks

1.  **Wire Registry in `main.py`:**
    ```python
    from registry import registry

    @app.on_event("startup")
    async def startup_event():
        # Register all teams
        registry.register_team(create_validation_team(...), "validation")
        registry.register_team(create_planning_team(...), "planning")
        registry.register_team(create_branding_team(...), "branding")
    ```

2.  **Add Discovery Endpoint:**
    ```python
    @app.get("/.well-known/agent-card.json")
    async def get_agent_cards():
        """List all registered agent cards (A2A Discovery)"""
        return {"agents": [card.model_dump() for card in registry.list_cards()]}

    @app.get("/a2a/{agent_id}/.well-known/agent-card.json")
    async def get_agent_card(agent_id: str):
        """Get specific agent card"""
        card = registry.get_card(agent_id)
        if not card:
            raise HTTPException(404, "Agent not found")
        return card.model_dump()
    ```

3.  **Add JSON-RPC Endpoint:**
    ```python
    @app.post("/a2a/{agent_id}/rpc")
    async def a2a_rpc(agent_id: str, request: JSONRPCRequest):
        """A2A JSON-RPC 2.0 endpoint"""
        team = registry.get_team(agent_id)
        if not team:
            return JSONRPCError(code=-32601, message="Agent not found")

        if request.method == "run":
            response = await team.arun(request.params["task"])
            return JSONRPCResponse(id=request.id, result={"content": response.content})
    ```

#### 4.4. Configuration & Secrets Management

**Objective:** Enable "Bring Your Own AI" and Module Config.

**Current Status:**
*   ✅ `BYOAIClient` implemented at `agents/providers/byoai_client.py`
*   ✅ Provider config fetching with caching
*   ✅ Token limit checking and usage recording
*   ❌ Not integrated into agent creation flow
*   ❌ MCP integration not started

##### 4.4.1. Implementation Tasks

1.  **Integrate BYOAI into Teams:**
    *   Modify team factories to accept `ProviderConfig`
    *   Inject API keys from BYOAI into Agno agent `model` parameter

2.  **MCP Integration:**
    *   Add `mcp` package to requirements
    *   Create `agents/providers/mcp.py` for user-scoped MCP tools
    *   Implement permission flags (Read/Write/Execute)

### Phase 2: Data & State Strategy

#### 4.5. Shared Schema Persistence
**Objective:** Agents must read/write actual business data.
*   **Action:** Define Pydantic models that mirror the Prisma schema.
*   **Resumable Sessions:** Store `AgentSession` in Postgres to survive restarts.

#### 4.6. Knowledge Base (RAG)
**Objective:** Long-term memory for business context.
*   **Action:** Initialize `PgVector` knowledge base.
*   **Ingestion Pipeline:** Implement `ReaderFactory` and `AgenticChunking`.
    *   *Files:* PDF, CSV, Markdown processing.
    *   *Web:* Scrape and index relevant business URLs.
    *   *Integration:* `agent.knowledge.search(query, filter={"workspace_id": ...})`

### Phase 3: Module Implementation (Iterative)

#### 4.7. First Module: BM-CRM
*   **Data:** Contacts, Companies, Interactions.
*   **Agents:**
    *   `LeadScorer`: Background agent listening to Redis events.
    *   `CRMAssistant`: A2A/AG-UI agent for user interaction.
*   **Integration:** Exposes `crm.search` tool via MCP/A2A.

### Phase 4: Frontend Implementation (Management UI)

#### 4.8. Module Management UI
**Status:** ✅ Complete

**Primary Location:** `apps/web/src/app/(dashboard)/settings/modules/page.tsx`

**Implemented:**
*   ✅ Grid view of available modules (grouped by category)
    *   UI: `apps/web/src/components/settings/module-management.tsx`
    *   Hook: `apps/web/src/hooks/use-workspace-modules.ts`
*   ✅ Toggle switches to Enable/Disable optional modules per workspace
    *   Core modules are forced enabled (toggle disabled)
    *   Permission enforcement occurs in API routes (owner/admin required for mutations)
*   ✅ Status indicators (Active/Inactive)
    *   Note: explicit "Error" status is not currently emitted by the module API
*   ✅ "Configure" button per module
    *   Implemented as a JSON-backed config editor (workspace-scoped): `apps/web/src/components/settings/module-config-dialog.tsx`

#### 4.9. AI & Keys Configuration
**Status:** ✅ Complete (with final routing decisions)

**Final UX Structure:**
*   ✅ **API Keys (BYOAI / LLM connections)** is the canonical home for all workspace AI provider keys
    *   Page: `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx`
    *   UI: `apps/web/src/components/settings/ai-provider-list.tsx`
*   ✅ **AI Configuration** is focused on preferences + usage (not keys)
    *   Redirect: `apps/web/src/app/(dashboard)/settings/ai-config/page.tsx` → `/settings/ai-config/agent-preferences`
    *   Sub-navigation: `apps/web/src/components/settings/ai-config-subnav.tsx`
    *   Preferences: `apps/web/src/app/(dashboard)/settings/ai-config/agent-preferences/page.tsx`
    *   Usage: `apps/web/src/app/(dashboard)/settings/ai-config/usage/page.tsx`
*   ✅ **MCP Integrations** is a dedicated page (not a tab inside AI config)
    *   Page: `apps/web/src/app/(dashboard)/settings/mcp/page.tsx`
    *   UI: `apps/web/src/components/settings/mcp-integrations.tsx`
    *   Hooks: `apps/web/src/hooks/use-mcp-servers.ts`
    *   Dialogs: `apps/web/src/components/settings/add-mcp-server-dialog.tsx`, `apps/web/src/components/settings/edit-mcp-server-dialog.tsx`

#### 4.10. Agent Team Configuration
**Location:** `apps/web/src/app/(dashboard)/agents/[id]/configure` (Existing - Refine)
*   Model selection dropdown (GPT-4, Claude 3.5)
*   Tool toggle controls
*   Prompt/Persona editor (Admin only)

---

## 5. Next Steps (Prioritized)

### 5.1. Immediate (Wire Existing Code) ✅ COMPLETE

| Task | File(s) | Status |
|------|---------|--------|
| Add missing AG-UI events to encoder | `agents/ag_ui/encoder.py` | ✅ Done |
| Wire registry in main.py startup | `agents/main.py` | ✅ Done |
| Add A2A discovery endpoint | `agents/main.py` | ✅ Done |
| Add A2A RPC endpoint | `agents/main.py` | ✅ Done |
| Convert team endpoints to SSE | `agents/main.py` | ✅ Done |
| Update requirements.txt | `agents/requirements.txt` | ✅ Done |

### 5.2. Short-Term (New Implementation) ✅ COMPLETE

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| Integrate BYOAI into team factories | Use ProviderConfig for model selection | 4 hours | ✅ Done |
| Create `useAgentStream` hook | Frontend SSE consumer with Zod validation | 4 hours | ✅ Done |
| Add JSON-RPC request/response models | Pydantic models for A2A | 2 hours | ✅ Done |
| Enable JWT signature verification | Security fix in tenant.py | 1 hour | ✅ Done |
| Fix HTTP client lifecycle | Resource leak prevention in byoai_client.py | 1 hour | ✅ Done |
| Add race condition prevention | Stream ID tracking in useAgentStream | 1 hour | ✅ Done |

### 5.3. Medium-Term (New Features)

| Task | Description | Effort | Status |
|------|-------------|--------|--------|
| PgVector setup | RAG knowledge base | 1 day | ✅ Done |
| MCP provider integration | Dynamic tool loading | 2 days | ✅ Done |
| Module config API | Enable/disable modules | 1 day | ✅ Done |

### 5.4. Frontend Management UI ✅ COMPLETE

| Task | Location(s) | Status |
|------|-------------|--------|
| Workspace module management page | `apps/web/src/app/(dashboard)/settings/modules/page.tsx` | ✅ Done |
| Workspace module config editor (JSON) | `apps/web/src/components/settings/module-config-dialog.tsx` | ✅ Done |
| MCP integrations management page | `apps/web/src/app/(dashboard)/settings/mcp/page.tsx` | ✅ Done |
| MCP add/edit dialogs + hooks | `apps/web/src/components/settings/*mcp*`, `apps/web/src/hooks/use-mcp-servers.ts` | ✅ Done |
| API Keys page for BYOAI providers | `apps/web/src/app/(dashboard)/settings/api-keys/page.tsx` | ✅ Done |
| AI config sub-navigation (preferences/usage) | `apps/web/src/components/settings/ai-config-subnav.tsx` | ✅ Done |
| Settings nav updated (Modules + MCP) | `apps/web/src/components/layouts/settings-layout.tsx` | ✅ Done |

#### 5.4.1. UI + API Hardening Pass ✅ COMPLETE

| Area | Improvement | Files | Status |
|------|-------------|-------|--------|
| Modules | Prevent sensitive module config exposure (admins/owners only) | `apps/web/src/app/api/workspaces/[id]/modules/route.ts`, `apps/web/src/app/api/workspaces/[id]/modules/[moduleId]/route.ts` | ✅ Done |
| Modules | Ensure `disabledAt` is set when creating disabled module records | `apps/web/src/app/api/workspaces/[id]/modules/[moduleId]/route.ts` | ✅ Done |
| MCP | Fix DELETE race condition (return 404 on already-deleted) | `apps/web/src/app/api/workspaces/[id]/mcp-servers/[serverId]/route.ts` | ✅ Done |
| MCP | Include `envVars` on detail GET + support editing in UI | `apps/web/src/app/api/workspaces/[id]/mcp-servers/[serverId]/route.ts`, `apps/web/src/hooks/use-mcp-servers.ts`, `apps/web/src/components/settings/edit-mcp-server-dialog.tsx` | ✅ Done |
| MCP | Clamp timeout inputs to backend constraints + reset form on Cancel | `apps/web/src/components/settings/add-mcp-server-dialog.tsx`, `apps/web/src/components/settings/edit-mcp-server-dialog.tsx` | ✅ Done |
| MCP | Validate `headers`/`envVars` payload size/shape to avoid abuse/prototype keys | `apps/web/src/lib/validation/safe-string-map.ts`, `apps/web/src/app/api/workspaces/[id]/mcp-servers/route.ts`, `apps/web/src/app/api/workspaces/[id]/mcp-servers/[serverId]/route.ts` | ✅ Done |
| AI Providers | Don’t swallow non-schema-drift DB errors when loading agent preferences | `apps/api/src/ai-providers/agent-preferences.service.ts` | ✅ Done |
| Usage | Normalize Nest base URL + URL-encode IDs for token limit routes | `apps/web/src/hooks/use-token-limits.ts` | ✅ Done |
| Chat | Revoke preview object URLs on send to avoid memory leaks | `apps/web/src/components/chat/ChatInput.tsx` | ✅ Done |
| Web | Safe JSON parsing for fetch helpers to avoid unhandled `response.json()` exceptions | `apps/web/src/lib/utils/safe-json.ts`, `apps/web/src/hooks/*`, `apps/web/src/app/reset-password/page.tsx` | ✅ Done |
| Dashboard | Signed-out UX: show Sign in CTA instead of alarming load error | `apps/web/src/app/(dashboard)/dashboard/DashboardContent.tsx` | ✅ Done |
| Realtime | Fix hook-order crash in connection indicator (prevents “Header unavailable”) | `apps/web/src/components/ui/connection-status.tsx` | ✅ Done |
| Tests | Stabilize upload progress duration test (remove real-time flake) | `apps/web/src/__tests__/file-upload.test.ts` | ✅ Done |

---

### 5.5. Dev Runtime + Key Interop ✅ COMPLETE

#### 5.5.1. Redis Implementation for Development ✅ COMPLETE

**Goal:** Enable local Redis for dev rate limiting, while maintaining easy switch to cloud providers in production.

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Update rate-limit.ts - Add ioredis support alongside Upstash | `apps/web/src/lib/utils/rate-limit.ts` | ✅ Done |
| 2 | Add Redis connection utility - Shared Redis client with priority: REDIS_URL → UPSTASH → in-memory | `apps/web/src/lib/utils/redis.ts` | ✅ Done |
| 3 | Update .env.example - Document REDIS_URL for local dev | `.env.example` | ✅ Done |
| 4 | Verify Docker Redis - Ensure docker-compose.yml Redis works | `docker/docker-compose.yml` | ✅ Done |
| 5 | Test & verify - Confirm rate limiting supports Redis backend | `apps/web/src/lib/utils/rate-limit.test.ts` | ✅ Done |
| 6 | Monorepo env alignment - Ensure web app can read repo-root REDIS_URL during dev | `apps/web/next.config.ts` | ✅ Done |

#### 5.5.2. Python-Side API Key Decryption ✅ COMPLETE

**Goal:** Allow Python AgentOS to decrypt API keys that were encrypted by the Next.js app, enabling agents to use user-provided AI provider keys.

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Create encryption.py - Mirror the Node.js AES-256-GCM encryption/decryption | `agents/utils/encryption.py` | ✅ Done |
| 2 | Verify cryptography dependency is installed | `agents/requirements.txt` | ✅ Done |
| 3 | Update BYOAIClient - Decrypt API keys when fetching provider configs (via DB lookup) | `agents/providers/byoai_client.py` | ✅ Done |
| 4 | Add unit tests - Round-trip + Node↔Python compatibility | `agents/tests/test_encryption.py` | ✅ Done |
| 5 | Cross-language verification - Node encrypted → Python decrypted works | `agents/tests/test_encryption.py` | ✅ Done |

#### 5.5.3. Realtime UX Regression ✅ FIXED

**Issue:** “Real-time updates unavailable” shown due to missing/incorrect session token retrieval for WebSocket auth and dev hostname/CORS mismatches (Docker/VM/WSL access via non-`localhost` hostnames).

**Fix:** Prefer Better Auth session token from `useSession()`, and fall back to cookie-based auth (HttpOnly session cookie) in development.
Additional dev hardening: default WebSocket hostname to the current `window.location.hostname` when env points at `localhost`, and allow private-network origins when `CORS_ALLOWED_ORIGINS` is not set (dev only).

*   ✅ `apps/web/src/lib/auth-client.ts`
*   ✅ `apps/web/src/lib/realtime/realtime-provider.tsx`
*   ✅ `apps/api/src/realtime/realtime.gateway.ts`
*   ✅ Cookie parsing hardened (preserves `=` inside cookie values) in `apps/api/src/realtime/realtime.gateway.ts`

#### 5.5.4. AgentOS + DB Hardening Follow-ups ✅ COMPLETE

| Area | Improvement | Files | Status |
|------|-------------|-------|--------|
| AgentOS config | Treat empty/whitespace `ENCRYPTION_MASTER_KEY` as unset to avoid false “configured” state | `agents/config.py` | ✅ Done |
| Knowledge | Collision-resistant tenant table naming (hash suffix), legacy table preservation, concurrent creation lock, and safe deletion even without cached instance | `agents/knowledge/factory.py` | ✅ Done |
| BYOAI | Do not cache decrypted provider keys in process memory; cache encrypted values and hydrate decrypted keys only for returned objects | `agents/providers/byoai_client.py` | ✅ Done |
| Auth | TenantMiddleware requires `sub`, supports optional issuer/audience validation, and avoids logging raw token errors | `agents/middleware/tenant.py` | ✅ Done |
| Error handling | Avoid returning raw exception strings to clients for team execution failures | `agents/main.py` | ✅ Done |
| DB migrations | Add DB-level default for `updated_at` on new module/MCP tables | `packages/db/prisma/migrations/20251214153000_add_updated_at_defaults/migration.sql` | ✅ Done |
| Prisma schema | Align MCP tool filter arrays with DB defaults | `packages/db/prisma/schema.prisma` | ✅ Done |

---

## 6. Dependency Requirements

### 6.1. Current Dependencies (`agents/requirements.txt`)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
agno
sqlalchemy>=2.0.0
psycopg2-binary>=2.9.0
asyncpg>=0.29.0
pyjwt==2.8.0
python-dotenv>=1.0.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
requests>=2.31.0
httpx>=0.27.0
respx>=0.20.2
slowapi>=0.1.9
limits>=3.7.0
```

### 6.2. Required Additions
```
# AG-UI Streaming
sse-starlette>=1.8.0

# A2A Performance
orjson>=3.9.0

# RAG Knowledge Base
pgvector>=0.2.5

# BYOAI Key Encryption
cryptography>=41.0.0

# Model Context Protocol
mcp>=0.1.0
```

---

## 7. Audit Checklist

Use this checklist to verify implementation completeness:

### 7.1. Infrastructure
- [x] FastAPI server running (`agents/main.py`)
- [x] TenantMiddleware active on routes (with JWT signature verification)
- [x] Rate limiting configured
- [ ] Redis connection for distributed registry (optional)

### 7.1b. Security
- [x] JWT signature verification enabled (tenant.py)
- [x] HTTP client resource management (byoai_client.py)
- [x] Input validation with Zod schemas (useAgentStream)
- [x] Race condition prevention (stream ID tracking)
- [x] API key encryption at rest (Node encrypt + Python decrypt)

### 7.2. AG-UI Protocol
- [x] `EventEncoder` class exists
- [x] `THOUGHT_CHUNK` event type added
- [x] `UI_RENDER_HINT` event type added
- [x] `TOOL_CALL_ARGS` event type added
- [x] `StreamingResponse` used in endpoints
- [x] Tool call detection implemented
- [x] Client error events sanitized (no raw exception strings)

### 7.3. A2A Protocol
- [x] `AgentRegistry` class exists
- [x] `AgentCard` Pydantic model defined
- [x] Registry instantiated at startup
- [x] Teams registered in registry
- [x] `/.well-known/agent-card.json` endpoint exposed
- [x] `/a2a/{agent_id}/rpc` endpoint implemented

### 7.4. BYOAI Integration
- [x] `BYOAIClient` implemented
- [x] Provider config caching
- [x] HTTP client lifecycle management (reusable client)
- [x] `create_agno_model()` factory function
- [x] `resolve_and_create_model()` convenience function
- [x] Integration in team execution (`_resolve_provider_for_team`)
- [x] Token limit enforcement in agent runs (`_check_token_limit`)
- [x] Usage recording after completions (`_record_usage`)

### 7.5. Frontend SSE Integration
- [x] `useAgentStream` React hook
- [x] Zod validation for all AG-UI events
- [x] Race condition prevention (stream ID tracking)
- [x] Stale closure fixes (callback refs)
- [x] Proper abort/cleanup handling
- [x] Support for all AG-UI event types

### 7.6. Dependencies
- [x] `sse-starlette` in requirements.txt
- [x] `orjson` in requirements.txt
- [x] `pgvector` in requirements.txt
- [x] `cryptography` in requirements.txt
- [x] `tiktoken` in requirements.txt (token counting)
- [x] Document processing libs (pypdf, python-docx, beautifulsoup4)
- [x] `mcp` in requirements.txt

### 7.7. RAG Knowledge Base
- [x] `KnowledgeFactory` with tenant isolation (`agents/knowledge/factory.py`)
- [x] Collision-safe table naming (hash suffix for long IDs)
- [x] BYOAI integration for embeddings
- [x] Document ingestion module (`agents/knowledge/ingestion.py`)
- [x] Content type detection (PDF, CSV, URL, etc.)
- [x] API endpoints (`/knowledge/ingest`, `/knowledge/search`)
- [x] Metadata filters applied in search (`workspace_id` isolation + user filters)
- [x] Team integration helpers (`agents/knowledge/team_integration.py`)
- [x] `KnowledgeAwareTeamFactory` for enhanced teams

### 7.8. MCP Integration
- [x] `MCPProvider` class with permission-based filtering (`agents/providers/mcp.py`)
- [x] Permission flags (READ/WRITE/EXECUTE)
- [x] Prisma model for `MCPServerConfig`
- [x] API endpoints for MCP server management:
  - [x] GET/POST `/api/workspaces/:id/mcp-servers`
  - [x] GET/PATCH/DELETE `/api/workspaces/:id/mcp-servers/:serverId`
- [x] Integration with Agno's `MCPTools` and `MultiMCPTools`
- [x] Agent-side config loading supports headers/env/api keys (DB-first; avoids exposing plaintext via HTTP)
- [x] Common MCP server presets (filesystem, github, brave-search, memory)

### 7.9. Module Configuration
- [x] Prisma model for `WorkspaceModule`
- [x] API endpoints for module management:
  - [x] GET/POST `/api/workspaces/:id/modules`
  - [x] GET/PATCH/DELETE `/api/workspaces/:id/modules/:moduleId`
- [x] Core vs optional module distinction
- [x] Module-specific configuration storage

### 7.10. Frontend Management UI
- [x] Settings navigation includes Modules + MCP Integrations
- [x] `/settings/api-keys` manages workspace AI providers (BYOAI)
- [x] `/settings/modules` module grid + enable/disable + config dialog
- [x] `/settings/mcp` MCP server list + add/edit/delete dialogs
- [x] AI config preferences + usage pages accessible via in-page subnav
- [x] Agent preferences endpoint returns defaults (no 500 on empty settings)
- [x] No hydration mismatch from responsive layout conditions
- [x] Session includes `activeWorkspaceId` so workspace-scoped pages work
- [x] Workspace-scoped pages show a friendly prompt when no workspace is selected

---

## 8. Reference Documentation

| Document | Purpose |
|----------|---------|
| `docs/architecture/a2a-protocol.md` | A2A JSON-RPC specification |
| `docs/architecture/ag-ui-protocol.md` | AG-UI SSE event specification |
| `docs/architecture/agno-implementation-guide.md` | Agno framework deep dive |
| `docs/architecture/remote-coding-agent-patterns.md` | Session management patterns |

---

*Last Updated: 2025-12-14*
*Version: 2.10 - Dev Redis env alignment + realtime cookie auth fallback*
