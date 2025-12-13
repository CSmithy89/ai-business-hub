# HYVVE Detailed Implementation Plan & Audit

**Status:** Living Document
**Date:** 2025-12-13
**Version:** 2.0
**Last Audit:** 2025-12-13

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
**Location:** `apps/web/src/app/(dashboard)/settings/modules/page.tsx` (New)
*   Grid view of available modules
*   Toggle switches to Enable/Disable modules per workspace
*   Status indicators (Active, Inactive, Error)
*   "Configure" button for module-specific settings

#### 4.9. AI & Keys Configuration
**Location:** `apps/web/src/app/(dashboard)/settings/ai-config` (Existing - Adapt)
*   Add **"API Keys"** tab for BYOAI configuration
*   Add **"MCP Integrations"** tab
*   MCP UI: List of servers, "Add Connection" modal, health status

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

### 5.2. Short-Term (New Implementation)

| Task | Description | Effort |
|------|-------------|--------|
| Integrate BYOAI into team factories | Use ProviderConfig for model selection | 4 hours |
| Create `useAgentStream` hook | Frontend SSE consumer | 4 hours |
| Add JSON-RPC request/response models | Pydantic models for A2A | 2 hours |

### 5.3. Medium-Term (New Features)

| Task | Description | Effort |
|------|-------------|--------|
| PgVector setup | RAG knowledge base | 1 day |
| MCP provider integration | Dynamic tool loading | 2 days |
| Module config API | Enable/disable modules | 1 day |

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
- [x] TenantMiddleware active on routes
- [x] Rate limiting configured
- [ ] Redis connection for distributed registry (optional)

### 7.2. AG-UI Protocol
- [x] `EventEncoder` class exists
- [x] `THOUGHT_CHUNK` event type added
- [x] `UI_RENDER_HINT` event type added
- [x] `TOOL_CALL_ARGS` event type added
- [x] `StreamingResponse` used in endpoints
- [x] Tool call detection implemented

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
- [ ] Token limit enforcement in agent runs
- [ ] Usage recording after completions

### 7.5. Dependencies
- [x] `sse-starlette` in requirements.txt
- [x] `orjson` in requirements.txt
- [x] `pgvector` in requirements.txt
- [x] `cryptography` in requirements.txt
- [ ] `mcp` in requirements.txt (commented, enable when needed)

---

## 8. Reference Documentation

| Document | Purpose |
|----------|---------|
| `docs/architecture/a2a-protocol.md` | A2A JSON-RPC specification |
| `docs/architecture/ag-ui-protocol.md` | AG-UI SSE event specification |
| `docs/architecture/agno-implementation-guide.md` | Agno framework deep dive |
| `docs/architecture/remote-coding-agent-patterns.md` | Session management patterns |

---

*Last Updated: 2025-12-13 by Claude Code Audit*
*Version: 2.0*
