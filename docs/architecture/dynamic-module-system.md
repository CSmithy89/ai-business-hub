# Dynamic Module System: The "Unified Protocol" Architecture (Agno + CopilotKit)

## 1. Executive Summary

We are upgrading the HYVVE module system to a dynamic, intelligence-driven architecture leveraging **Agno's native multi-protocol support**.

**Key Insight:** Agno natively supports both **AG-UI** (Agent-to-User) and **A2A** (Agent-to-Agent) protocols as first-class interfaces. This eliminates the need for custom adapters or bridges - we can expose our agents via standard protocols directly.

**Architecture:**
- **AG-UI Protocol** → Frontend communication via CopilotKit (Generative UI, state sync)
- **A2A Protocol** → Backend agent mesh for inter-agent coordination (Google's standard)
- **MCP Protocol** → External tool integration and universal agent access

This "Unified Protocol" approach maximizes interoperability while minimizing custom plumbing.

## 2. Core Concepts

### A. The "Slot System" (Frontend via CopilotKit + AG-UI)

Instead of a custom `ComponentRegistry` and `DynamicRenderer`, we use CopilotKit's **Generative UI** which natively understands the AG-UI protocol.

A "Slot" is simply a **Tool Definition** in the React application that the Agent can "call".

*   **Old Way:** Agent sends `UI_RENDER_HINT` event -> `DynamicRenderer` looks up component -> Renders.
*   **New Way:** Agent calls `render_widget` tool via AG-UI -> CopilotKit's `useRenderToolCall` intercepts it -> Renders the component.

### B. AG-UI Protocol (Native Agno Support)

Agno provides **first-class AG-UI support** via the `ag-ui-protocol` dependency:

```python
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI

agent_os = AgentOS(
    agents=[my_agent],
    interfaces=[AGUI(agent=my_agent)]  # Exposes /agui endpoint
)
```

CopilotKit's frontend connects to this endpoint using the official `@ag-ui/agno` adapter - no custom translation needed.

*   **Transport:** AG-UI handles SSE, text streaming, and tool call serialization/deserialization.
*   **State:** CopilotKit's `useCoAgent` hooks handle synchronizing agent state with the UI.

### C. A2A Protocol (Native Agno Support - Google Standard)

Agno provides **first-class A2A support** via the `a2a-sdk` dependency. This is Google's official Agent-to-Agent protocol:

```python
from agno.os import AgentOS
from agno.os.interfaces.a2a import A2A

agent_os = AgentOS(
    agents=[my_agent],
    interfaces=[A2A(agent=my_agent)]  # Exposes /a2a endpoint
)

# Or simplified:
agent_os = AgentOS(agents=[my_agent], a2a_interface=True)
```

**A2A Protocol Features:**
*   **AgentCards:** JSON-LD metadata describing agent capabilities
*   **Task Lifecycle:** `submitted` → `working` → `input_required` → `completed/failed`
*   **JSON-RPC 2.0:** Standard request/response and streaming
*   **Discovery:** Agents can discover each other via `/.well-known/agent.json`

*   **Discovery:** The "Dashboard Agent" uses A2A discovery to find other agents (e.g., "Brand Agent", "PM Agent").
*   **Orchestration:** The Dashboard Agent calls these sub-agents via A2A Tasks to gather data.
*   **Bridge:** The Dashboard Agent then formats this data and yields it via AG-UI to be rendered on the frontend.

### D. Multi-Interface Architecture (The Power of Agno)

**Critical Capability:** Agno's AgentOS can expose the **same agent** via multiple protocol interfaces simultaneously:

```python
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

# One agent, multiple interfaces
agent_os = AgentOS(
    agents=[dashboard_agent],
    interfaces=[
        AGUI(agent=dashboard_agent),  # /agui - for CopilotKit frontend
        A2A(agent=dashboard_agent),   # /a2a  - for other agents
    ]
)
```

This means:
- **Frontend** connects via AG-UI for rich Generative UI
- **Other agents** connect via A2A for structured task delegation
- **External tools** (Cursor, Claude Desktop) connect via MCP

### E. MCP Integration (The Universal Bridge)

CopilotKit provides first-class support for the Model Context Protocol (MCP).

1.  **Client Mode:** We can configure CopilotKit to connect to external MCP servers (GitHub, Brave). These tools become available to our agents automatically.
2.  **Server Mode:** CopilotKit can expose our internal A2A agents as MCP tools to external clients (Cursor, Claude Desktop).
3.  **A2A-MCP Bridge:** For agents that only speak A2A, we can use the `GongRzhe/A2A-MCP-Server` bridge to translate MCP ↔ A2A.

## 3. Implementation Plan

### Phase 1: Frontend Infrastructure (CopilotKit)

1.  **Install Dependencies:**
    ```bash
    pnpm add @copilotkit/react-core @copilotkit/react-ui @ag-ui/agno
    ```

2.  **Configure Runtime:**
    ```typescript
    // apps/web/src/app/providers.tsx
    import { CopilotKit } from "@copilotkit/react-core";
    import { AgnoAgent } from "@ag-ui/agno";

    export function Providers({ children }) {
      return (
        <CopilotKit
          runtimeUrl="/api/copilotkit"
          agent={new AgnoAgent({
            url: process.env.NEXT_PUBLIC_AGNO_URL + "/agui"
          })}
        >
          {children}
        </CopilotKit>
      );
    }
    ```

3.  **Implement "Slots" (Generative UI):**
    *   Create `apps/web/src/components/DashboardSlots.tsx`.
    *   Use `useRenderToolCall` to define the `render_dashboard_widget` tool.
    *   Map the `widget_type` argument to actual React components (`ProjectStatusCard`, `BrandHealthWidget`).

### Phase 2: Backend Infrastructure (Agno Multi-Interface)

1.  **Install Dependencies:**
    ```bash
    pip install agno[agui,a2a]
    # or: pip install agno ag-ui-protocol a2a-sdk
    ```

2.  **Configure AgentOS (`agents/main.py`):**
    ```python
    from agno.agent import Agent
    from agno.os import AgentOS
    from agno.os.interfaces.agui import AGUI
    from agno.os.interfaces.a2a import A2A
    from agno.team import Team

    # Define agents
    dashboard_agent = Agent(
        name="dashboard_gateway",
        description="Orchestrates dashboard widgets via A2A agents",
        # ... model, tools, etc.
    )

    # Create AgentOS with multi-interface
    agent_os = AgentOS(
        agents=[dashboard_agent],
        interfaces=[
            AGUI(agent=dashboard_agent),  # /agui endpoint
            A2A(agent=dashboard_agent),   # /a2a endpoint
        ]
    )

    # Run with FastAPI
    if __name__ == "__main__":
        agent_os.serve()  # Serves all interfaces
    ```

3.  **Endpoints Exposed:**
    - `GET /.well-known/agent.json` - A2A AgentCard discovery
    - `POST /a2a` - A2A Task endpoint (JSON-RPC 2.0)
    - `POST /agui` - AG-UI endpoint (for CopilotKit)

### Phase 3: Integration (The Dashboard Pilot)

1.  **Dashboard Agent Logic:**
    *   Update the "Dashboard Agent" to accept a user query (e.g., "Show me the project status").
    *   It uses A2A to call the PM Agent via Task creation.
    *   Instead of returning text, it yields a **Tool Call**: `render_dashboard_widget(type="ProjectStatus", data={...})`.

2.  **A2A Inter-Agent Communication:**
    ```python
    from a2a import A2AClient

    async def call_pm_agent(query: str):
        client = A2AClient("http://pm-agent:8001/a2a")
        task = await client.send_task({
            "message": {
                "role": "user",
                "parts": [{"text": query}]
            }
        })
        return await client.wait_for_completion(task.id)
    ```

3.  **Verify Flow:**
    ```
    User types "Show status" in Chat
        → CopilotKit sends to /agui endpoint
        → Dashboard Agent receives via AG-UI
        → Dashboard Agent creates A2A Task to PM Agent
        → PM Agent processes and returns result
        → Dashboard Agent yields Tool Call via AG-UI
        → Frontend useRenderToolCall renders the widget
    ```

### Phase 4: Shared State (Advanced)

1.  **Define State:**
    *   Define a shared state schema (e.g., `DashboardState`) containing a list of active widgets.

2.  **Sync State:**
    *   Use `useCoAgentStateRender` in the frontend to subscribe to `DashboardState`.
    *   When the Agent updates this state (e.g., adding a new widget), the UI updates automatically without explicit tool calls.

### Phase 5: Advanced Features (Human-in-the-Loop & Shared State)

1.  **Approval Workflows (Human-in-the-Loop):**
    *   **Goal:** Upgrade `ApprovalAgent` to use CopilotKit's HITL for secure, blocking authorizations.
    *   **Backend (AG-UI native):**
        ```python
        from agno.tools import tool

        @tool(human_in_the_loop=True)
        def sign_contract(contract_id: str) -> dict:
            """Present contract to user for signature."""
            # This automatically pauses and waits for user response
            return {"contract_id": contract_id}
        ```
    *   **Frontend:**
        ```typescript
        useHumanInTheLoop({
          name: "sign_contract",
          render: ({ args, respond }) => (
            <ContractViewer
              id={args.contract_id}
              onSign={() => respond({ signed: true })}
              onReject={() => respond({ signed: false })}
            />
          )
        });
        ```

2.  **Real-Time Feedback (Predictive State):**
    *   **Goal:** Stream intermediate progress from the backend A2A mesh to the frontend.
    *   **Mechanism (AG-UI native):**
        1.  `DashboardAgent` calls `PMAgent` via A2A Task.
        2.  `PMAgent` Task emits status updates (`working` state with message).
        3.  `DashboardAgent` forwards these via AG-UI state emissions.
        4.  Frontend `useCoAgentStateRender` updates the UI instantly.

3.  **Context Awareness (Copilot Suggestions):**
    *   **Goal:** Give agents visibility into what the user is seeing.
    *   **Implementation:**
        ```typescript
        // apps/web/src/components/ProjectView.tsx
        import { useCopilotReadable } from "@copilotkit/react-core";

        export function ProjectView({ project }) {
          useCopilotReadable({
            description: "The currently active project details",
            value: project
          });

          return <div>...</div>;
        }
        ```
    *   **Benefit:** When the user asks "How is *this* project doing?", the agent already has the context via AG-UI.

4.  **Async Task Mapping (A2A Native):**
    *   **Goal:** Handle long-running agent tasks without blocking.
    *   **Strategy (A2A built-in):**
        *   A2A Tasks are inherently async with lifecycle states
        *   `submitted` → `working` → `completed/failed`
        *   Client can poll Task status or use streaming
    *   **Benefit:** Multi-minute workflows (e.g., "Research competitor landscape") are natively supported.

## 4. Technical Specifications

### A. Frontend "Slot" Implementation
```typescript
// apps/web/src/components/Dashboard.tsx
import { useRenderToolCall } from "@copilotkit/react-core";
import { ProjectStatusWidget } from "./widgets/ProjectStatusWidget";

export function Dashboard() {
  useRenderToolCall({
    name: "render_dashboard_widget",
    description: "Render a specific widget on the dashboard.",
    parameters: [
      { name: "type", type: "string", description: "Widget type (ProjectStatus, BrandHealth)" },
      { name: "data", type: "object", description: "Data for the widget" }
    ],
    render: ({ args }) => {
      // The "Registry" Logic
      switch (args.type) {
        case "ProjectStatus":
          return <ProjectStatusWidget {...args.data} />;
        case "BrandHealth":
           return <BrandHealthWidget {...args.data} />;
        default:
          return <div className="p-4 bg-red-100">Unknown Widget: {args.type}</div>;
      }
    }
  });

  return <div className="dashboard-container">...</div>;
}
```

### B. Python Agent Implementation (Native Multi-Interface)
```python
# agents/dashboard.py
from agno.agent import Agent
from agno.tools import tool
from a2a import A2AClient

# A2A clients for inter-agent communication
pm_client = A2AClient(os.getenv("PM_AGENT_URL") + "/a2a")
brand_client = A2AClient(os.getenv("BRAND_AGENT_URL") + "/a2a")

@tool
async def get_project_status(project_id: str) -> dict:
    """Fetch project status from PM Agent via A2A."""
    task = await pm_client.send_task({
        "message": {
            "role": "user",
            "parts": [{"text": f"Get status for project {project_id}"}]
        }
    })
    result = await pm_client.wait_for_completion(task.id)
    return result.artifacts[0].data

@tool
def render_dashboard_widget(type: str, data: dict) -> dict:
    """Render a widget on the user's dashboard."""
    # This tool call is intercepted by CopilotKit frontend
    return {"type": type, "data": data}

dashboard_agent = Agent(
    name="dashboard_gateway",
    description="Orchestrates dashboard widgets by coordinating with specialist agents",
    instructions="""
    You are the Dashboard Gateway agent. When users ask for information:
    1. Use get_project_status to fetch data from the PM Agent
    2. Use render_dashboard_widget to display the results
    Always prefer visual widgets over text responses.
    """,
    tools=[get_project_status, render_dashboard_widget],
)
```

### C. AgentOS Multi-Interface Setup
```python
# agents/main.py
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A
from .dashboard import dashboard_agent
from .pm import pm_agent
from .brand import brand_agent

# Create AgentOS with all agents and interfaces
agent_os = AgentOS(
    agents=[dashboard_agent, pm_agent, brand_agent],
    interfaces=[
        # Dashboard agent: accessible from frontend AND other agents
        AGUI(agent=dashboard_agent, path="/agui"),
        A2A(agent=dashboard_agent, path="/a2a/dashboard"),

        # PM agent: only A2A (internal use)
        A2A(agent=pm_agent, path="/a2a/pm"),

        # Brand agent: only A2A (internal use)
        A2A(agent=brand_agent, path="/a2a/brand"),
    ]
)

if __name__ == "__main__":
    agent_os.serve(host="0.0.0.0", port=8000)
```

### D. A2A AgentCard (Auto-generated)
```json
{
  "@context": "https://schema.org",
  "@type": "AIAgent",
  "name": "dashboard_gateway",
  "description": "Orchestrates dashboard widgets by coordinating with specialist agents",
  "url": "http://localhost:8000/a2a/dashboard",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "get_project_status",
      "name": "Get Project Status",
      "description": "Fetch project status from PM Agent via A2A"
    },
    {
      "id": "render_dashboard_widget",
      "name": "Render Dashboard Widget",
      "description": "Render a widget on the user's dashboard"
    }
  ],
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text", "tool_calls"]
}
```

## 5. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HYVVE Platform                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (Next.js)                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │ CopilotKit  │  │   Slots     │  │   useCopilotReadable        │ │    │
│  │  │   Runtime   │  │ (Generative │  │   (Context Provider)        │ │    │
│  │  │             │  │    UI)      │  │                             │ │    │
│  │  └──────┬──────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────┼───────────────────────────────────────────────────────────┘    │
│            │ AG-UI Protocol (SSE/WebSocket)                                  │
│            ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AGNO AGENTOS                                    │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Multi-Interface Layer                      │   │    │
│  │  │   /agui ─────────────────────────────────────────────────────┼───┼────┼── Frontend
│  │  │   /a2a/dashboard ────────────────────────────────────────────┼───┼────┼── Other Agents
│  │  │   /.well-known/agent.json ───────────────────────────────────┼───┼────┼── Discovery
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                              │                                       │    │
│  │  ┌───────────────────────────┼───────────────────────────────────┐  │    │
│  │  │                  Agent Layer                                   │  │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │  │    │
│  │  │  │  Dashboard  │  │  PM Agent   │  │    Brand Agent      │   │  │    │
│  │  │  │   Agent     │◄─┼─►(A2A only) │  │    (A2A only)       │   │  │    │
│  │  │  │(AG-UI+A2A)  │  │             │  │                     │   │  │    │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              │ A2A Protocol (JSON-RPC 2.0)                   │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     EXTERNAL INTEGRATIONS                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │    │
│  │  │ MCP Servers │  │ A2A-MCP     │  │   External A2A Agents       │ │    │
│  │  │ (GitHub,    │  │ Bridge      │  │   (Claude, Cursor via MCP)  │ │    │
│  │  │  Brave)     │  │             │  │                             │ │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Protocol Legend:
  ═══════  AG-UI (Agent-to-User) - CopilotKit frontend communication
  ───────  A2A (Agent-to-Agent) - Google's inter-agent protocol
  ·······  MCP (Model Context Protocol) - External tool access
```

## 6. Benefits of Unified Protocol Approach

1.  **Zero Custom Adapters:** Agno natively speaks AG-UI and A2A - no translation layers needed.
2.  **Standards-Based:** Using Google's A2A and CopilotKit's AG-UI means future compatibility.
3.  **Multi-Interface:** Same agent accessible via different protocols for different use cases.
4.  **Battle-Tested:** Both AG-UI and A2A are production protocols with growing ecosystems.
5.  **Universal Access:** External agents (Claude, Cursor) can integrate via A2A or MCP bridge.
6.  **Discoverability:** A2A AgentCards enable automatic agent discovery and capability negotiation.

## 7. Protocol Comparison

| Feature | AG-UI | A2A | MCP |
|---------|-------|-----|-----|
| **Primary Use** | Frontend ↔ Agent | Agent ↔ Agent | Agent ↔ Tools |
| **Transport** | SSE/WebSocket | JSON-RPC 2.0/SSE | JSON-RPC 2.0 |
| **State Sync** | ✅ Native | ❌ Task-based | ❌ Stateless |
| **Generative UI** | ✅ Native | ❌ | ❌ |
| **Discovery** | ❌ | ✅ AgentCards | ✅ MCP Registry |
| **Long Tasks** | Streaming | ✅ Task Lifecycle | ❌ |
| **Agno Support** | ✅ Native | ✅ Native | Via bridge |

## 8. Phase 6: Contextual Intelligence (RAG & Knowledge)

1.  **Bidirectional Knowledge Sync:**
    *   **Goal:** Allow the agent to "read" the application state (e.g., active document, selected rows) and index it for RAG.
    *   **Implementation:**
        ```typescript
        // Frontend
        useCopilotReadable({
          description: "Active Project Metadata",
          value: projectData
        });
        ```
    *   **Backend:** The agent automatically receives this context via AG-UI in its system prompt.

2.  **Generative UI Composition:**
    *   **Goal:** Move beyond static "Widgets" to dynamic layouts.
    *   **Mechanism:** The agent can decide to render a `SplitView`, `Wizard`, or `DashboardGrid` based on the complexity of the task.
    *   **Full Potential:** The UI adapts to the *content*, not just the *data*.

## 9. The Universal Agent Mesh

With Agno's native multi-protocol support, we can build a true agent mesh:

```
                    ┌─────────────────┐
                    │   User (Web)    │
                    └────────┬────────┘
                             │ AG-UI
                             ▼
┌────────────┐      ┌─────────────────┐      ┌────────────┐
│  External  │ A2A  │    Dashboard    │ A2A  │   Brand    │
│   Agents   │◄────►│     Agent       │◄────►│   Agent    │
└────────────┘      └────────┬────────┘      └────────────┘
                             │ A2A
                             ▼
                    ┌─────────────────┐
                    │    PM Agent     │
                    └────────┬────────┘
                             │ MCP
                             ▼
                    ┌─────────────────┐
                    │ External Tools  │
                    │ (GitHub, Brave) │
                    └─────────────────┘
```

**Key Capability:** Any agent in the mesh can:
- Receive requests from the frontend (AG-UI)
- Delegate to other agents (A2A)
- Access external tools (MCP)
- Be discovered by external systems (A2A AgentCards)

## 10. Migration from Original Plan

**What Changed:**
1. ~~Custom A2A protocol~~ → **Google's A2A protocol via Agno native support**
2. ~~AgnoCopilotAdapter~~ → **Official @ag-ui/agno adapter** (no custom translation)
3. ~~CopilotKitSDK bridge~~ → **Agno's AGUI interface** (native AG-UI support)
4. ~~LangGraphAgent wrapper~~ → **Direct Agno Agent** (no LangGraph needed)

**What Stays:**
- CopilotKit for frontend Generative UI
- Slot system via `useRenderToolCall`
- Human-in-the-loop via CopilotKit
- MCP for external tool integration
- State sync via `useCoAgentStateRender`

---

*Updated: 2024-12-24*
*Version: 2.0 - Unified Protocol Architecture*
