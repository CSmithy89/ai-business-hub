# A2A (Agent-to-Agent) Protocol Specification

**Status:** Draft
**Protocol Version:** 0.3.0
**Target Framework:** Agno + AgentOS

---

## 1. Overview

The **Agent-to-Agent (A2A)** protocol defines a standardized mechanism for autonomous agents to discover, communicate, and collaborate with each other. It enables a decentralized "Modular Monolith" architecture where agents are encapsulated within modules but can invoke capabilities from other agents across the system.

### Key Concepts

*   **Agent Card:** A JSON manifest describing an agent's identity, capabilities, and interface.
*   **Discovery:** A mechanism to find Agent Cards (e.g., a well-known endpoint or registry).
*   **JSON-RPC 2.0:** The communication format for requests and responses.
*   **Capabilities:** Flags indicating supported features (streaming, events, etc.).

---

## 2. Agent Card Schema

Every A2A-compliant agent MUST expose an Agent Card. This is typically served at `GET /.well-known/agent-card.json` relative to the agent's base URL.

### Schema Definition

```json
{
  "protocolVersion": "0.3.0",
  "id": "agent-unique-id",
  "name": "Agent Name",
  "description": "Human-readable description of what the agent does.",
  "version": "1.0.0",
  "endpoints": {
    "rpc": "/rpc",
    "ws": "/ws"
  },
  "capabilities": {
    "streaming": true,
    "events": true,
    "files": false
  },
  "skills": [
    {
      "name": "search_contacts",
      "description": "Search for CRM contacts by name or email.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        },
        "required": ["query"]
      }
    }
  ]
}
```

### Python Implementation (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class AgentSkill(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON Schema

class AgentEndpoints(BaseModel):
    rpc: str = "/rpc"
    ws: Optional[str] = None

class AgentCapabilities(BaseModel):
    streaming: bool = False
    events: bool = False
    files: bool = False

class AgentCard(BaseModel):
    protocolVersion: str = "0.3.0"
    id: str
    name: str
    description: str
    version: str = "1.0.0"
    endpoints: AgentEndpoints = Field(default_factory=AgentEndpoints)
    capabilities: AgentCapabilities = Field(default_factory=AgentCapabilities)
    skills: List[AgentSkill] = []
```

---

## 3. Communication Protocol (JSON-RPC 2.0)

A2A uses JSON-RPC 2.0 over HTTP POST for synchronous task execution.

### Request Format

**POST** to `agent_url + card.endpoints.rpc`

```json
{
  "jsonrpc": "2.0",
  "method": "run",
  "params": {
    "task": "Find email for John Doe",
    "context": {
      "request_id": "req_123",
      "caller_id": "caller_agent_id"
    }
  },
  "id": 1
}
```

### Response Format (Success)

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": "John Doe's email is john@example.com",
    "tool_calls": [],
    "artifacts": []
  },
  "id": 1
}
```

### Response Format (Error)

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request",
    "data": { "details": "Missing required field 'task'" }
  },
  "id": 1
}
```

---

## 4. Implementation in AgentOS

### 4.1 Discovery Registry

The AgentOS runtime maintains a registry of local agents. In a monolithic deployment, this is an in-memory dictionary. In a distributed deployment, this could be Redis.

**`agents/registry.py` (Draft Interface)**

```python
class AgentRegistry:
    def __init__(self):
        self._agents: Dict[str, Agent] = {}
        self._cards: Dict[str, AgentCard] = {}

    def register(self, agent: Agent, card: AgentCard):
        self._agents[agent.id] = agent
        self._cards[agent.id] = card

    def get_agent(self, agent_id: str) -> Optional[Agent]:
        return self._agents.get(agent_id)

    def get_card(self, agent_id: str) -> Optional[AgentCard]:
        return self._cards.get(agent_id)

    def list_cards(self) -> List[AgentCard]:
        return list(self._cards.values())
```

### 4.2 A2A Router

We need a generic router in `main.py` that handles A2A requests for *any* registered agent.

```python
# In main.py or agents/routers/a2a.py

@router.post("/a2a/{agent_id}/rpc")
async def handle_a2a_rpc(agent_id: str, request: JSONRPCRequest):
    agent = registry.get_agent(agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
        
    # Map 'run' method to agent execution
    if request.method == "run":
        response = await agent.arun(request.params["task"])
        return JSONRPCResponse(
            id=request.id,
            result={"content": response.content}
        )
    
    # ... handle other methods ...
```

---

## 5. Security

A2A communication MUST be authenticated.

*   **Internal (Monolith):** Trusted calls between modules within the same process/network. Can use a shared secret or be implicit if in-memory.
*   **External (Distributed):** Uses Bearer tokens. The caller agent must present a valid token signed by the platform Authority.

**Headers:**
```
Authorization: Bearer <jwt_token>
X-Agent-ID: <caller_agent_id>
```

---

## 6. Future Extensions

*   **Streaming RPC:** Using JSON-RPC over WebSocket for real-time task updates.
*   **Events:** Async event publishing (e.g., `contact_created`) via Webhooks or Message Bus (Redis/NATS).

---

## 7. CopilotKit Bridge Integration

While A2A handles internal agent-to-agent communication, **CopilotKit** acts as the gateway between the frontend and the A2A network.

### 7.1 The "Gateway Agent" Pattern

A specialized "Gateway Agent" is registered with CopilotKit. This agent has access to the `AgentRegistry` and uses A2A RPC to delegate user requests to the appropriate internal agents.

**Conceptual Implementation:**

```python
# agents/bridge.py
from copilotkit import CopilotKitSDK, LangGraphAgent
from agents.registry import registry

async def dashboard_gateway(state: dict):
    user_input = state["messages"][-1].content
    
    # 1. Discovery via A2A
    # Find agents supporting the user's intent
    cards = registry.list_cards()
    
    # 2. Orchestration via A2A RPC
    # Call the 'pm' agent for project queries
    pm_team = registry.get_team("planning")
    response = await pm_team.arun(user_input)
    
    # 3. Return to CopilotKit
    return {"messages": [AIMessage(content=response.content)]}

sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(name="dashboard", graph=dashboard_gateway)
    ]
)
```

### 7.2 Benefits

1.  **Unified Frontend:** The frontend only needs to talk to one CopilotKit endpoint.
2.  **Decoupled Backend:** Internal A2A agents can be updated, added, or moved without changing the frontend configuration.
3.  **Security:** CopilotKit handles JWT validation and session management, while A2A handles tenant isolation between internal services.
