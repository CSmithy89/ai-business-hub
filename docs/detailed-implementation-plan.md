# HYVVE Detailed Implementation Plan & Audit

**Status:** Living Document
**Date:** 2025-12-13
**Version:** 1.5

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

**Current State (Based on `agents/` analysis):**
*   **Runtime:** FastAPI server (`AgentOS`) hosting specific agent teams (Validation, Planning, Branding).
*   **Data Access:** Agents use `PostgresStorage` for *session history* but lack integration for *business state*. Tools often return dummy data or lack DB persistence logic.
*   **Knowledge:** No RAG implementation (PgVector) found in code, despite being in docs.
*   **Configuration:** API keys and models are hardcoded. No dynamic injection mechanism (`get_user_api_key` missing).
*   **Protocols:**
    *   **A2A:** Missing implementation. No discovery (`/.well-known/agent-card.json`).
    *   **AG-UI:** Missing implementation. Endpoints return standard JSON, not SSE streams.

**Gaps Identified:**

| Component | Current Implementation | Target Requirement | Gap Severity |
|-----------|------------------------|--------------------|--------------|
| **Protocol** | Custom REST API | **A2A Protocol** (JSON-RPC 2.0 over HTTP) | 🔴 High |
| **Discovery** | None | `/.well-known/agent-card.json` | 🔴 High |
| **Streaming** | None (Blocking/Async wait) | **AG-UI** (SSE `text/event-stream`) | 🔴 High |
| **Events** | Custom JSON Schema | Standard AG-UI Events (`RUN_STARTED`, `TEXT_MESSAGE_CHUNK`, `THOUGHT_CHUNK`, `UI_RENDER_HINT`) | 🔴 High |
| **Persistence** | Placeholder/Logging only | **Shared Schema** (Prisma/SQLAlchemy) | 🔴 High |
| **RAG** | None | **PgVector** Knowledge Base with Ingestion Pipeline | 🟠 Medium |
| **Config** | Hardcoded | **Module Config API** & **User Secrets Manager** | 🟠 Medium |
| **Tooling** | Hardcoded Python functions | **MCP** (Model Context Protocol) with Permissions | 🟠 Medium |

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

**Status:** 🏗️ In Progress

#### 4.1. Protocols & Standards
*   **✅ Spec Completed:** `docs/architecture/a2a-protocol.md` (JSON-RPC, Agent Card).
*   **✅ Spec Completed:** `docs/architecture/ag-ui-protocol.md` (SSE Events, Render Hints).
*   **✅ Spec Completed:** `docs/architecture/remote-coding-agent-patterns.md` (Resumable Sessions, Safety).
*   **✅ Spec Completed:** `docs/architecture/agno-implementation-guide.md` (Deep Dive into Agno components).

#### 4.2. AG-UI Integration (Streaming)
**Objective:** Replace standard JSON responses with SSE streams.
*   **Action:** Implement `EventEncoder` and `StreamingResponse` in FastAPI.
*   **Events:** Map Agno internal events to AG-UI types:
    *   `TEXT_MESSAGE_CHUNK` (Token streaming)
    *   `TOOL_CALL_START` / `TOOL_CALL_RESULT` (Action visibility)
    *   `UI_RENDER_HINT` (For rich client-side components like charts)
    *   `THOUGHT_CHUNK` (For reasoning models like o1/Claude-3.5 - **Critical for "Thinking" UI**)
*   **Frontend:** The frontend will consume these streams using a custom hook (e.g., `useAgentStream`) that handles the `text/event-stream` response, parsing SSE data packets and updating the UI state in real-time.

#### 4.3. A2A Protocol Implementation (Interoperability)
**Objective:** Make agents discoverable and callable.
*   **Registry:** Create `AgentRegistry` class (in-memory for now, Redis later). This registry will hold `AgentCard` objects.
*   **Discovery Endpoint:** Implement `GET /.well-known/agent-card.json` which returns the agent's capabilities, description, and available tools/skills.
*   **RPC Endpoint:** Implement `POST /agent/rpc` for JSON-RPC 2.0 calls. This allows other agents to invoke tasks synchronously.
*   **Internal Routing:** The registry will allow `AgentOS` to route an internal request like `registry.get_agent("crm_agent").run("...")` without a network hop if possible, or via HTTP if distributed.

#### 4.4. Configuration & Secrets Management
**Objective:** Enable "Bring Your Own AI" and Module Config.
*   **Secrets Manager:** Create a service to fetch encrypted API keys (OpenAI, Anthropic) from the DB/Vault based on `user_id` or `workspace_id`.
    *   *Implementation:* Use `cryptography` library to encrypt keys at rest in the Postgres `user_secrets` table.
*   **Module Config API:** Endpoint to list/enable/disable modules.
    *   *Implementation:* A meta-table `module_config` storing the enabled state and version of each module per workspace.
*   **MCP Integration:** Support dynamic MCP server connections.
    *   *Permission Flags:* Implement Read/Write/Execute flags for tools (inspired by Claude Code SDK).
    *   *Dynamic Loading:* Middleware in `AgentOS` fetches user's MCP config, spawns/connects to MCP servers (or uses SSE-based MCP), and injects tools into the `Agent` context at runtime.

### Phase 2: Data & State Strategy

#### 4.5. Shared Schema Persistence
**Objective:** Agents must read/write actual business data.
*   **Action:** Define Pydantic models that mirror the Prisma schema. This ensures type safety between the Python agents and the Postgres database managed by NestJS/Prisma.
*   **Resumable Sessions:** Store `AgentSession` in Postgres to survive restarts (from `remote-coding-agent-patterns.md`).
    *   *Mechanism:* Use Agno's `PostgresStorage` but map it to our shared schema to allow the NestJS backend to also query conversation history if needed.

#### 4.6. Knowledge Base (RAG)
**Objective:** Long-term memory for business context.
*   **Action:** Initialize `PgVector` knowledge base.
*   **Ingestion Pipeline:** Implement `ReaderFactory` and `AgenticChunking` for robust document processing (from `agno-implementation-guide.md`).
    *   *Files:* PDF, CSV, Markdown processing.
    *   *Web:* Scrape and index relevant business URLs.
    *   *Integration:* The `Agent` will have a `knowledge` parameter initialized with this vector store, allowing `agent.print_response("...", search_knowledge=True)`.

### Phase 3: Module Implementation (Iterative)

#### 4.7. First Module: BM-CRM
*   **Data:** Contacts, Companies, Interactions.
*   **Agents:**
    *   `LeadScorer`: Background agent listening to Redis events (e.g., `new_contact`).
    *   `CRMAssistant`: A2A/AG-UI agent for user interaction ("Find me high value leads").
*   **Integration:** Exposes `crm.search` tool via MCP/A2A.

### Phase 4: Frontend Implementation (Management UI)

We will adapt existing `apps/web/src/app/(dashboard)/settings` structure and create new pages where missing.

#### 4.8. Module Management UI
**Location:** `apps/web/src/app/(dashboard)/settings/modules/page.tsx` (New)
*   **Features:**
    *   Grid view of available modules (CRM, Branding, Planning, etc.).
    *   Toggle switches to Enable/Disable modules per workspace.
    *   Status indicators (Active, Inactive, Error).
    *   "Configure" button for module-specific settings.

#### 4.9. AI & Keys Configuration
**Location:** `apps/web/src/app/(dashboard)/settings/ai-config` (Existing - Adapt)
*   **Adaptation:**
    *   Rename/Refine `agent-preferences` to `model-settings`.
    *   Add **"API Keys"** tab/section for securely adding OpenAI/Anthropic keys (BYOAI).
    *   Add **"MCP Integrations"** tab/section.
    *   **MCP UI:** List of connected MCP servers, "Add Connection" modal (URL + Auth Token), and connection status health check.

#### 4.10. Agent Team Configuration
**Location:** `apps/web/src/app/(dashboard)/agents/[id]/configure` (Existing - Refine)
*   **Features:**
    *   Dropdown to select Model (GPT-4, Claude 3.5) for *this specific agent*.
    *   Toggle for "Enable Tools" (e.g., Web Search, Calculator).
    *   Prompt/Persona editor (Admin only).

---

## 5. Next Steps (Immediate)

1.  **Refactor `agents/main.py`**:
    *   Remove hardcoded team endpoints.
    *   Implement generic `A2ARouter` and `AGUIStreamer`.
    *   Create `AgentRegistry`.
2.  **Implement `EventEncoder`**: Port the logic from `ag-ui-protocol.md`.
3.  **Implement `AgentRegistry`**: Create the discovery mechanism defined in `a2a-protocol.md`.

## 6. Dependency Requirements

To support the new protocols and architecture, we need to update `agents/requirements.txt`.

**New Packages Required:**
*   `sse-starlette`: For FastAPI Server-Sent Events (SSE) support (AG-UI).
*   `orjson`: High-performance JSON parsing for A2A messages.
*   `pgvector`: For RAG knowledge base integration.
*   `cryptography`: For encrypting/decrypting BYOAI API keys in the database.
*   `mcp`: The official Python SDK for Model Context Protocol.

---
*Created by BMad Master - 2025-12-13*