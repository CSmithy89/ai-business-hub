# Agno & Agent Protocol Implementation Guide

**Version:** 2.1 (Updated with Agno Deep Dive)
**Date:** 2025-12-13

This guide details the architecture for the **AgentOS** runtime, enabling it to support the **Agent-to-Agent (A2A)** protocol for interoperability, **AG-UI** for streaming user interfaces, and **Model Context Protocol (MCP)** for tool integration.

---

## 1. Core Architecture: The "AgentOS"

The AgentOS is a **FastAPI** microservice acting as the runtime for all Agno agents. It does *not* hold business logic (that stays in NestJS); it holds **cognitive logic**.

### Key Components
1.  **Agno Framework:** The core agent orchestration library.
2.  **EventEncoder:** Serializes Agno events into AG-UI SSE format.
3.  **AgentCard Registry:** Dynamically generates A2A discovery manifests.
4.  **MCP Manager:** Manages connections to external tools.

---

## 2. AG-UI Integration (Streaming & UI)

AG-UI requires specific event types sent over Server-Sent Events (SSE).

### 2.1. The Event Encoder
We must implement an `EventEncoder` class that wraps Agno's streaming responses.

```python
# ag_ui/encoder.py
import json
from typing import Any

class EventEncoder:
    def encode(self, event_type: str, data: dict) -> str:
        payload = json.dumps({
            "type": event_type,
            **data
        })
        return f"data: {payload}\n\n"

# Usage in FastAPI
async def stream_generator(agent_response):
    encoder = EventEncoder()
    
    # 1. Start Run
    yield encoder.encode("RUN_STARTED", {"runId": "...", "threadId": "..."})
    
    # 2. Stream Content
    for chunk in agent_response:
        yield encoder.encode("TEXT_MESSAGE_CHUNK", {
            "delta": chunk.content,
            "messageId": "..."
        })
        
    # 3. Finish
    yield encoder.encode("RUN_FINISHED", {})
```

### 2.2. Event Mapping
Map Agno internal events to AG-UI:

| Agno Event | AG-UI Event Type |
|------------|------------------|
| `RunStart` | `RUN_STARTED` |
| `Stream` (Text) | `TEXT_MESSAGE_CHUNK` |
| `ToolCall` | `TOOL_CALL_START` / `TOOL_CALL_ARGS` |
| `ToolOutput` | `TOOL_CALL_RESULT` |
| `RunFinish` | `RUN_FINISHED` |

---

## 3. A2A Integration (Agent-to-Agent)

A2A allows agents to discover and call each other via standard HTTP JSON-RPC.

### 3.1. The Agent Card (`/.well-known/agent-card.json`)
Every agent/team must expose a card.

```json
{
  "protocolVersion": "0.3.0",
  "name": "CRM Agent",
  "description": "Manages contacts and deals.",
  "url": "https://api.hyvve.io/agents/crm",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "find_contact",
      "name": "Find Contact",
      "inputModes": ["text/plain"],
      "outputModes": ["application/json"]
    }
  ]
}
```

### 3.2. A2A Implementation Plan
1.  **Registry:** Create a global registry in `main.py` where modules register their agents.
2.  **Discovery Endpoint:** `GET /agents/{agent_id}/.well-known/agent-card.json`.
3.  **RPC Endpoint:** `POST /agents/{agent_id}/rpc` accepting standard A2A messages.

---

## 4. MCP Integration (Tools)

MCP allows us to plug in tools dynamically (e.g., Google Drive, Slack, Local FS) without rewriting agent code.

### 4.1. MCPTools Wrapper
Agno has native `MCPTools`. We will extend this to support **User-Scoped Configuration**.

```python
# agents/providers/mcp.py
from agno.tools.mcp import MCPTools

def get_user_mcp_tools(user_id: str, connection_id: str):
    # 1. Fetch encrypted config from NestJS/DB for this user
    config = fetch_connection_config(user_id, connection_id)
    
    # 2. Initialize MCP Client
    return MCPTools(
        server_command=config.command,
        server_args=config.args,
        server_env=config.env  # Inject API keys here
    )
```

### 4.2. Tool Strategy
*   **System Tools:** Core tools (DB access, Search) are initialized at startup.
*   **User Tools:** Initialized per-request using `Depends` in FastAPI to inject user context.

---

## 5. Knowledge Management (RAG)

We use **PgVector** (via Supabase) for the knowledge base.

### 5.1. Setup
```python
from agno.vectordb.pgvector import PgVector

vector_db = PgVector(
    db_url=settings.database_url,
    table_name="agent_knowledge",
    embedder=...
)
```

### 5.2. Filtering
Crucial for multi-tenancy. Always apply filters:
```agent
agent.knowledge.search(
    query="...",
    filter={
        "workspace_id": current_workspace_id,
        "access_level": "public" 
    }
)
```

### 5.3. Ingestion Pipeline
Leverage `ReaderFactory` and `ChunkingStrategyFactory` from `libs/agno/agno/knowledge` for robust document processing.
*   **Readers:** Support PDF, CSV, Website, Markdown via `agno.knowledge.reader`.
*   **Chunking:** Use `AgenticChunking` for high-quality semantic splits or `SemanticChunking` for embedding-based splits.

---

## 6. Audit & Checklist

Use this checklist to verify the implementation:

- [ ] **Dependencies:** Ensure `agno`, `fastapi`, `uvicorn`, `redis` are in `requirements.txt`.
- [ ] **Env Vars:** Check `agents/config.py` for `DATABASE_URL`, `REDIS_URL`, `OPENAI_API_KEY`.
- [ ] **Middleware:** Ensure `TenantMiddleware` is active on all agent routes.
- [ ] **AG-UI:** Verify `StreamingResponse` is used, not standard JSON.
- [ ] **A2A:** Verify `agent-card.json` is accessible for each agent.

---
*Reference for HYVVE Development Team*
