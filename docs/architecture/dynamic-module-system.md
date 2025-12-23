# Dynamic Module System: The "Hybrid" Architecture (CopilotKit + A2A)

## 1. Executive Summary
We are upgrading the HYVVE module system to a dynamic, intelligence-driven architecture.
We will utilize **CopilotKit** as the standard protocol for **Agent-to-User (AG-UI)** communication and **Generative UI**, while retaining our custom **Agent-to-Agent (A2A)** protocol for internal service orchestration.

This "Hybrid" approach leverages CopilotKit's production-ready infrastructure for streaming, state management, and MCP integration, significantly reducing the amount of custom frontend/backend plumbing required.

## 2. Core Concepts

### A. The "Slot System" (Frontend via CopilotKit)
Instead of a custom `ComponentRegistry` and `DynamicRenderer`, we use CopilotKit's **Generative UI**.
A "Slot" is simply a **Tool Definition** in the React application that the Agent can "call".

*   **Old Way:** Agent sends `UI_RENDER_HINT` event -> `DynamicRenderer` looks up component -> Renders.
*   **New Way:** Agent calls `render_widget` tool -> CopilotKit's `useRenderToolCall` intercepts it -> Renders the component.

### B. AG-UI Protocol (Replaced by CopilotKit)
We deprecate the custom SSE protocol defined in `ag-ui-protocol.md` in favor of CopilotKit's standard protocol.
*   **Transport:** CopilotKit handles SSE, text streaming, and tool call serialization/deserialization.
*   **State:** CopilotKit's `useCoAgent` hooks handle synchronizing agent state (e.g., "Dashboard Data") with the UI.

### C. A2A Protocol (Backend Service Mesh)
We **retain** the A2A protocol (`a2a-protocol.md`) for internal agent coordination.
*   **Discovery:** The "Dashboard Agent" still uses the A2A Registry to find other agents (e.g., "Brand Agent", "PM Agent").
*   **Orchestration:** The Dashboard Agent calls these sub-agents via A2A RPC to gather data.
*   **Bridge:** The Dashboard Agent then formats this data and yields it to CopilotKit to be rendered on the frontend.

### D. MCP Integration (The Universal Bridge)
CopilotKit provides first-class support for the Model Context Protocol (MCP).
1.  **Client Mode:** We can configure CopilotKit to connect to external MCP servers (GitHub, Brave). These tools become available to our A2A agents automatically.
2.  **Server Mode:** CopilotKit can expose our internal A2A agents as MCP tools to external clients (Cursor, Claude Desktop).

## 3. Implementation Plan

### Phase 1: Frontend Infrastructure (CopilotKit)

1.  **Install Dependencies:**
    *   `@copilotkit/react-core`, `@copilotkit/react-ui`.

2.  **Configure Runtime:**
    *   Wrap the application in `<CopilotKit runtimeUrl="/api/copilotkit" />`.

3.  **Implement "Slots" (Generative UI):**
    *   Create `apps/web/src/components/DashboardSlots.tsx`.
    *   Use `useRenderToolCall` to define the `render_dashboard_widget` tool.
    *   Map the `widget_type` argument to actual React components (`ProjectStatusCard`, `BrandHealthWidget`).

### Phase 2: Backend Bridge (Python)

1.  **Install Dependencies:**
    *   `copilotkit` (Python SDK).

2.  **Create the Bridge (`agents/bridge.py`):**
    *   Initialize `CopilotKitSDK`.
    *   Create a `LangGraphAgent` (or generic `CopilotAgent`) that acts as the "Frontend Gateway".
    *   This Gateway Agent will have access to the A2A Registry to delegate tasks.

3.  **Expose Endpoint:**
    *   Add a `/copilotkit` route to `agents/main.py` using `sdk.register_fastapi_endpoint`.

### Phase 3: Integration (The Dashboard Pilot)

1.  **Dashboard Agent Logic:**
    *   Update the "Dashboard Agent" to accept a user query (e.g., "Show me the project status").
    *   It uses A2A to call the PM Agent.
    *   Instead of returning text, it yields a **Tool Call**: `render_dashboard_widget(type="ProjectStatus", data={...})`.

2.  **Verify Flow:**
    *   User types "Show status" in Chat -> CopilotKit sends to Backend -> Dashboard Agent calls PM Agent (A2A) -> Dashboard Agent returns Tool Call -> Frontend `useRenderToolCall` renders the widget.

### Phase 4: Shared State (Advanced)

1.  **Define State:**
    *   Define a shared state schema (e.g., `DashboardState`) containing a list of active widgets.

2.  **Sync State:**
    *   Use `useCoAgentStateRender` in the frontend to subscribe to `DashboardState`.
    *   When the Agent updates this state (e.g., adding a new widget), the UI updates automatically without explicit tool calls.

### Phase 5: Advanced Features (Human-in-the-Loop & Shared State)

1.  **Approval Workflows (Human-in-the-Loop):**
    *   **Goal:** Upgrade `ApprovalAgent` to use `useHumanInTheLoop` for secure, blocking authorizations.
    *   **Implementation:**
        ```python
        # agents/bridge.py
        from copilotkit import LangGraphAgent
        
        async def approval_node(state):
            # Pause execution and wait for frontend response
            result = await copilot.use_human_in_the_loop(
                name="sign_contract",
                description="Present contract to user for signature",
                parameters={"contract_id": state["contract_id"]}
            )
            
            if result["signed"]:
                return {"status": "approved"}
            return {"status": "rejected"}
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
    *   **Goal:** Stream intermediate progress from the backend A2A mesh to the frontend `dashboard_state`.
    *   **Implementation:** The A2A Bridge will subscribe to the internal agent's event stream.
    *   **Mechanism:**
        1.  `DashboardAgent` calls `PMAgent` via A2A.
        2.  `PMAgent` emits `{"type": "progress", "msg": "Scanning tickets..."}`.
        3.  `DashboardAgent` captures this and calls `copilot.emit_state("dashboard_state", {"status": "scanning"})`.
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
    *   **Benefit:** When the user asks "How is *this* project doing?", the agent already has the context of "Project Alpha".

4.  **Async Task Mapping (A2A Bridge V2):**
    *   **Goal:** Handle long-running agent tasks without blocking the MCP connection.
    *   **Strategy:**
        *   **Persistence:** Use Redis to store `task_id` -> `agent_url` mappings.
        *   **Flow:**
            1.  Bridge receives request -> Generates `task_123`.
            2.  Spawns background A2A job.
            3.  Returns `task_123` to client immediately.
            4.  Client polls or subscribes to `task_123` updates.
    *   **Benefit:** Enables multi-minute workflows (e.g., "Research competitor landscape") to run reliably via MCP.

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

### B. Python Bridge Implementation
```python
# agents/bridge.py
from copilotkit import CopilotKitSDK, LangGraphAgent
from agents.registry import registry

# The Gateway Agent
async def gateway_agent(state: dict):
    # 1. Analyze request
    user_message = state["messages"][-1].content
    
    # 2. Use A2A to find capable agents
    # (Simplified logic: In reality, use an LLM router here)
    if "project" in user_message.lower():
        pm_agent = registry.get_team("planning")
        response = await pm_agent.arun(user_message)
        
        # 3. Emit Tool Call (Conceptual)
        return {
            "tool_calls": [{
                "name": "render_dashboard_widget",
                "args": {"type": "ProjectStatus", "data": response.data}
            }]
        }

sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="dashboard_gateway",
            description="Orchestrates dashboard widgets via A2A agents",
            graph=gateway_agent 
        )
    ]
)
```

### C. The Agno-to-Copilot Adapter (Crucial for State Sync)
Since CopilotKit is optimized for LangGraph, we need an adapter to translate Agno's event stream into CopilotKit's state protocol.

```python
# agents/adapters/agno_adapter.py
class AgnoCopilotAdapter:
    def __init__(self, agno_agent):
        self.agent = agno_agent

    async def run_and_stream(self, user_input, copilot_sdk):
        # 1. Start Agno Run
        response_stream = self.agent.run_stream(user_input)
        
        # 2. Translate Stream
        async for chunk in response_stream:
            # Detect Tool Calls
            if chunk.tool_calls:
                # Emit as Copilot Tool Call
                await copilot_sdk.emit_tool_call(chunk.tool_calls)
            
            # Detect State Changes (e.g. Agent collected data)
            if chunk.extra_data:
                # Emit as Shared State Update
                await copilot_sdk.emit_state(chunk.extra_data)
            
            # Detect Text
            if chunk.content:
                yield chunk.content
```

## 5. Benefits of Hybrid Approach
1.  **Speed:** Removes the need to maintain a custom SSE/Streaming protocol (`AG-UI`).
2.  **Reliability:** Uses CopilotKit's battle-tested runtime for state sync and tool calling.
3.  **Flexibility:** Retains the decoupling of the A2A protocol for backend architecture.
4.  **Future-Proof:** "Free" access to the growing ecosystem of MCP tools via CopilotKit.
5.  **Universal Access:** Enables seamless interoperability with external AI agents (Claude, Cursor) via standard MCP interfaces.

### Phase 6: Contextual Intelligence (RAG & Knowledge)

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
    *   **Backend:** The `knowledge` agent automatically receives this context in its system prompt via the CopilotKit Runtime.

2.  **Generative UI Composition:**
    *   **Goal:** Move beyond static "Widgets" to dynamic layouts.
    *   **Mechanism:** The agent can decide to render a `SplitView`, `Wizard`, or `DashboardGrid` based on the complexity of the task.
    *   **Full Potential:** The UI adapts to the *content*, not just the *data*.

## 6. The Universal Agent Mesh (MCP)