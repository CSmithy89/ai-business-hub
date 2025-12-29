# Epic DM-03: Dashboard Agent Integration - Technical Specification

## 1. Executive Summary

### What DM-03 Delivers

Epic DM-03 completes the **end-to-end integration** between the Dashboard Gateway agent and the frontend Slot system, proving out the full AG-UI to A2A to UI flow. This epic is the integration layer that connects DM-01 (frontend) and DM-02 (backend) into a working system.

**Key Deliverables:**
- A2A client utilities for inter-agent communication
- Dashboard agent orchestration logic with PM agent delegation
- Widget rendering pipeline connecting agent tools to frontend components
- Dedicated dashboard page with CopilotKit integration
- Comprehensive end-to-end testing

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| `a2a-sdk` | ^0.3.x | A2A client for inter-agent communication |
| CopilotKit | ^1.x | Frontend Generative UI framework |
| `ag-ui-protocol` | ^0.1.x | AG-UI streaming protocol |
| Playwright | ^1.40.x | E2E testing framework |
| Vitest | ^1.x | Unit/integration testing |

### Integration Points with Existing Codebase

1. **Dashboard Gateway Agent (`agents/gateway/agent.py`)**
   - Already created in DM-02 with `render_dashboard_widget` and `route_to_agent` tools
   - This epic adds orchestration logic to actually call PM agents via A2A

2. **PM Agent A2A Adapters (`agents/pm/`)**
   - Navi, Vitals (Pulse), Herald adapters created in DM-02.5
   - This epic creates A2A client to invoke them from Dashboard Gateway

3. **Frontend Slot System (`apps/web/src/components/slots/`)**
   - DashboardSlots component created in DM-01
   - This epic connects tool call data to widget rendering

4. **CopilotKit Integration (`apps/web/src/lib/copilotkit/`)**
   - Provider and hooks created in DM-01
   - This epic creates the dashboard page using these components

---

## 2. Architecture Decisions

### 2.1 A2A Client Architecture

The Dashboard Gateway needs to call PM agents via A2A protocol. We use a thin client wrapper over the a2a-sdk:

**Pattern:**
```python
# agents/a2a/client.py
from a2a import A2AClient
from typing import Dict, Any, Optional
import asyncio

class HyvveA2AClient:
    """
    A2A client wrapper for HYVVE agent communication.

    Provides:
    - Connection pooling for PM agents
    - Retry logic with exponential backoff
    - Structured response handling
    - Error propagation for dashboard display
    """

    def __init__(self, base_url: str = None):
        self.base_url = base_url or "http://localhost:8000"
        self._clients: Dict[str, A2AClient] = {}

    async def call_agent(
        self,
        agent_id: str,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        timeout: int = 60,
    ) -> Dict[str, Any]:
        """
        Call a PM agent via A2A and return structured result.
        """
        # Get or create client for this agent
        client = self._get_client(agent_id)

        # Send task via A2A RPC
        result = await client.rpc(
            method="run",
            params={"task": task, "context": context or {}},
            timeout=timeout,
        )

        return result
```

**Rationale:**
- Thin wrapper keeps dependencies minimal
- Connection pooling avoids per-request overhead
- Structured responses enable error widgets

### 2.2 Dashboard Orchestration Pattern

The Dashboard Gateway orchestrates PM agents to gather data, then renders widgets:

```
User: "How is Project Alpha doing?"
    |
    v
Dashboard Gateway receives via AG-UI
    |
    +-- Calls Navi via A2A for project context
    |
    +-- Calls Pulse via A2A for health metrics
    |
    v
Dashboard Gateway yields:
    - render_dashboard_widget(type="ProjectStatus", data={...})
    - render_dashboard_widget(type="Metrics", data={...})
    |
    v
Frontend useRenderToolCall intercepts and renders widgets
```

**Key Insight:** The Dashboard Gateway acts as an orchestrator, NOT a data owner. It delegates to specialist agents and formats their responses as widgets.

### 2.3 Widget Rendering Pipeline

The widget rendering flow connects backend tools to frontend components:

```
Backend (Python)                    Frontend (React)
-----------------                   -----------------
@tool                               useRenderToolCall({
def render_dashboard_widget(            name: "render_dashboard_widget",
    widget_type: str,                   render: ({ args }) => {
    data: dict,                             switch(args.type) {
) -> dict:                                      case "ProjectStatus":
    return {                                        return <ProjectStatusWidget {...args.data} />
        "type": widget_type,                    ...
        "data": data,                       }
    }                                   }
                                    })
```

**State Management:**
- Widget data flows through AG-UI tool calls (no separate state sync needed for DM-03)
- Loading states shown while Dashboard Gateway processes
- Error widgets displayed for failed renders

### 2.4 Dashboard Page Architecture

The dashboard page integrates CopilotKit chat with a widget grid:

```typescript
// apps/web/src/app/(dashboard)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="dashboard-container">
      {/* Widget Grid - populated by agent tool calls */}
      <DashboardGrid>
        <DashboardSlots /> {/* Intercepts render_dashboard_widget calls */}
      </DashboardGrid>

      {/* Chat Interface - sends requests to Dashboard Gateway */}
      <DashboardChat />
    </div>
  )
}
```

---

## 3. Story-by-Story Technical Breakdown

### 3.1 Story DM-03.1: A2A Client Setup (5 points)

**Objective:** Implement A2A client for inter-agent communication.

**Implementation Tasks:**

1. **Create A2A client wrapper (`agents/a2a/client.py`):**
   ```python
   """A2A client for inter-agent communication."""
   from typing import Dict, Any, Optional, List
   import asyncio
   import httpx
   import logging
   from pydantic import BaseModel

   from constants.dm_constants import DMConstants
   from config import get_settings

   logger = logging.getLogger(__name__)
   settings = get_settings()


   class A2ATaskResult(BaseModel):
       """Result from an A2A task execution."""
       content: str
       tool_calls: List[Dict[str, Any]] = []
       artifacts: List[Dict[str, Any]] = []
       success: bool = True
       error: Optional[str] = None


   class HyvveA2AClient:
       """
       A2A client for HYVVE inter-agent communication.

       Provides async methods to call PM agents via A2A protocol,
       with connection pooling, retry logic, and structured responses.
       """

       # Agent endpoint paths (from DM-02 interface configs)
       AGENT_PATHS = {
           "navi": "/a2a/navi",
           "pulse": "/a2a/pulse",
           "herald": "/a2a/herald",
           "dashboard": "/a2a/dashboard",
       }

       def __init__(
           self,
           base_url: Optional[str] = None,
           timeout: int = None,
       ):
           """
           Initialize A2A client.

           Args:
               base_url: AgentOS base URL (default: from settings)
               timeout: Default timeout for requests
           """
           self.base_url = base_url or f"http://localhost:{settings.agentos_port}"
           self.timeout = timeout or DMConstants.A2A.TASK_TIMEOUT_SECONDS
           self._client: Optional[httpx.AsyncClient] = None

       async def _get_client(self) -> httpx.AsyncClient:
           """Get or create HTTP client with connection pooling."""
           if self._client is None:
               self._client = httpx.AsyncClient(
                   base_url=self.base_url,
                   timeout=httpx.Timeout(self.timeout),
                   limits=httpx.Limits(
                       max_connections=DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS * 2,
                       max_keepalive_connections=DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS,
                   ),
               )
           return self._client

       async def call_agent(
           self,
           agent_id: str,
           task: str,
           context: Optional[Dict[str, Any]] = None,
           caller_id: str = "dashboard_gateway",
           timeout: Optional[int] = None,
       ) -> A2ATaskResult:
           """
           Call a PM agent via A2A RPC.

           Args:
               agent_id: Target agent (navi, pulse, herald)
               task: Task message to send
               context: Additional context for the task
               caller_id: Identifier of the calling agent
               timeout: Override default timeout

           Returns:
               A2ATaskResult with content, tool_calls, and status
           """
           path = self.AGENT_PATHS.get(agent_id)
           if not path:
               return A2ATaskResult(
                   content="",
                   success=False,
                   error=f"Unknown agent: {agent_id}",
               )

           client = await self._get_client()

           # Build JSON-RPC request
           rpc_request = {
               "jsonrpc": "2.0",
               "method": "run",
               "params": {
                   "task": task,
                   "context": {
                       **(context or {}),
                       "caller_id": caller_id,
                   },
               },
               "id": f"a2a-{agent_id}-{asyncio.get_event_loop().time()}",
           }

           try:
               response = await asyncio.wait_for(
                   client.post(
                       f"{path}/rpc",
                       json=rpc_request,
                   ),
                   timeout=timeout or self.timeout,
               )

               if response.status_code != 200:
                   return A2ATaskResult(
                       content="",
                       success=False,
                       error=f"HTTP {response.status_code}: {response.text}",
                   )

               data = response.json()

               # Handle JSON-RPC error
               if "error" in data and data["error"]:
                   return A2ATaskResult(
                       content="",
                       success=False,
                       error=data["error"].get("message", "Unknown error"),
                   )

               # Extract result
               result = data.get("result", {})
               return A2ATaskResult(
                   content=result.get("content", ""),
                   tool_calls=result.get("tool_calls", []),
                   artifacts=result.get("artifacts", []),
                   success=True,
               )

           except asyncio.TimeoutError:
               logger.warning(f"A2A call to {agent_id} timed out")
               return A2ATaskResult(
                   content="",
                   success=False,
                   error=f"Timeout calling {agent_id}",
               )
           except Exception as e:
               logger.error(f"A2A call to {agent_id} failed: {e}")
               return A2ATaskResult(
                   content="",
                   success=False,
                   error=str(e),
               )

       async def call_agents_parallel(
           self,
           calls: List[Dict[str, Any]],
       ) -> Dict[str, A2ATaskResult]:
           """
           Call multiple agents in parallel.

           Args:
               calls: List of {agent_id, task, context} dicts

           Returns:
               Dict mapping agent_id to result
           """
           tasks = []
           agent_ids = []

           for call in calls:
               agent_ids.append(call["agent_id"])
               tasks.append(
                   self.call_agent(
                       agent_id=call["agent_id"],
                       task=call["task"],
                       context=call.get("context"),
                   )
               )

           results = await asyncio.gather(*tasks, return_exceptions=True)

           return {
               agent_id: (
                   result if isinstance(result, A2ATaskResult)
                   else A2ATaskResult(content="", success=False, error=str(result))
               )
               for agent_id, result in zip(agent_ids, results)
           }

       async def close(self):
           """Close the HTTP client."""
           if self._client:
               await self._client.aclose()
               self._client = None


   # Singleton instance for Dashboard Gateway
   _a2a_client: Optional[HyvveA2AClient] = None


   def get_a2a_client() -> HyvveA2AClient:
       """Get the singleton A2A client instance."""
       global _a2a_client
       if _a2a_client is None:
           _a2a_client = HyvveA2AClient()
       return _a2a_client
   ```

2. **Create A2A module init (`agents/a2a/__init__.py`):**
   ```python
   """A2A inter-agent communication module."""
   from .client import (
       HyvveA2AClient,
       A2ATaskResult,
       get_a2a_client,
   )

   __all__ = [
       "HyvveA2AClient",
       "A2ATaskResult",
       "get_a2a_client",
   ]
   ```

3. **Add tests (`agents/tests/test_a2a/test_client.py`):**
   ```python
   """Tests for A2A client."""
   import pytest
   from unittest.mock import AsyncMock, patch

   from a2a.client import HyvveA2AClient, A2ATaskResult


   class TestHyvveA2AClient:
       @pytest.fixture
       def client(self):
           return HyvveA2AClient(base_url="http://test:8000")

       @pytest.mark.asyncio
       async def test_call_agent_unknown(self, client):
           """Unknown agent returns error result."""
           result = await client.call_agent("unknown", "test task")
           assert not result.success
           assert "Unknown agent" in result.error

       @pytest.mark.asyncio
       async def test_call_agent_success(self, client):
           """Successful call returns content."""
           with patch.object(client, "_get_client") as mock_get:
               mock_client = AsyncMock()
               mock_client.post.return_value.status_code = 200
               mock_client.post.return_value.json.return_value = {
                   "jsonrpc": "2.0",
                   "result": {"content": "Project status: On track"},
                   "id": "test-1",
               }
               mock_get.return_value = mock_client

               result = await client.call_agent("navi", "Get project status")

               assert result.success
               assert "On track" in result.content
   ```

**Files to Create:**
- `agents/a2a/client.py`
- `agents/a2a/__init__.py` (update existing)
- `agents/tests/test_a2a/test_client.py`

**Files to Modify:**
- `agents/a2a/__init__.py` (add new exports)

**Test Requirements:**
- Unit: Client handles unknown agents
- Unit: Client parses successful responses
- Unit: Client handles timeouts gracefully
- Unit: Parallel calls work correctly
- Integration: Client connects to running AgentOS

**Definition of Done:**
- [ ] A2A client connects to PM agents
- [ ] Tasks created and tracked successfully
- [ ] Streaming responses processed
- [ ] Error handling for failed tasks
- [ ] Unit tests pass with >85% coverage

---

### 3.2 Story DM-03.2: Dashboard Agent Orchestration (8 points)

**Objective:** Implement dashboard agent logic for data gathering via A2A.

**Implementation Tasks:**

1. **Update Dashboard Gateway tools (`agents/gateway/tools.py`):**
   ```python
   # Add to existing tools.py after existing imports
   from a2a import get_a2a_client, A2ATaskResult


   @tool
   async def get_project_status(
       project_id: str,
       include_tasks: bool = False,
       include_timeline: bool = False,
   ) -> Dict[str, Any]:
       """
       Fetch project status from Navi agent via A2A.

       This tool delegates to the Navi PM agent to get comprehensive
       project information including progress, health, and optionally tasks.

       Args:
           project_id: The project identifier to query
           include_tasks: Include task breakdown in response
           include_timeline: Include timeline/milestone data

       Returns:
           Project status data suitable for ProjectStatus widget
       """
       client = get_a2a_client()

       task_message = f"Get status for project {project_id}"
       if include_tasks:
           task_message += " including task breakdown"
       if include_timeline:
           task_message += " with timeline milestones"

       result = await client.call_agent(
           agent_id="navi",
           task=task_message,
           context={"project_id": project_id},
       )

       if not result.success:
           return {
               "error": result.error,
               "project_id": project_id,
           }

       # Parse Navi's response into widget-friendly format
       # The actual parsing depends on Navi's response structure
       return {
           "project_id": project_id,
           "content": result.content,
           "raw_data": result.artifacts,
       }


   @tool
   async def get_health_summary(
       project_id: Optional[str] = None,
       workspace_wide: bool = False,
   ) -> Dict[str, Any]:
       """
       Fetch health metrics from Pulse agent via A2A.

       Gets risk analysis, deadline tracking, and health indicators
       for a specific project or workspace-wide.

       Args:
           project_id: Optional project to focus on
           workspace_wide: Get metrics for entire workspace

       Returns:
           Health data suitable for Metrics or Alert widgets
       """
       client = get_a2a_client()

       if workspace_wide:
           task_message = "Get workspace-wide health summary"
       else:
           task_message = f"Get health summary for project {project_id}"

       result = await client.call_agent(
           agent_id="pulse",
           task=task_message,
           context={"project_id": project_id},
       )

       if not result.success:
           return {
               "error": result.error,
               "project_id": project_id,
           }

       return {
           "project_id": project_id,
           "content": result.content,
           "metrics": result.artifacts,
       }


   @tool
   async def get_recent_activity(
       limit: int = 10,
       project_id: Optional[str] = None,
   ) -> Dict[str, Any]:
       """
       Fetch recent activity from Herald agent via A2A.

       Gets notifications, status updates, and team activity feed.

       Args:
           limit: Maximum activities to return
           project_id: Optional filter by project

       Returns:
           Activity data suitable for TeamActivity widget
       """
       client = get_a2a_client()

       task_message = f"Get {limit} most recent activities"
       if project_id:
           task_message += f" for project {project_id}"

       result = await client.call_agent(
           agent_id="herald",
           task=task_message,
           context={"project_id": project_id, "limit": limit},
       )

       if not result.success:
           return {
               "error": result.error,
               "activities": [],
           }

       return {
           "content": result.content,
           "activities": result.artifacts,
       }


   @tool
   async def gather_dashboard_data(
       project_id: Optional[str] = None,
   ) -> Dict[str, Any]:
       """
       Gather comprehensive dashboard data from multiple agents.

       Calls Navi, Pulse, and Herald in parallel to get all
       dashboard data efficiently.

       Args:
           project_id: Optional project focus

       Returns:
           Combined data from all agents
       """
       client = get_a2a_client()

       # Build parallel calls
       calls = [
           {
               "agent_id": "navi",
               "task": f"Get overview for project {project_id}" if project_id else "Get workspace overview",
               "context": {"project_id": project_id},
           },
           {
               "agent_id": "pulse",
               "task": f"Get health metrics for project {project_id}" if project_id else "Get workspace health",
               "context": {"project_id": project_id},
           },
           {
               "agent_id": "herald",
               "task": "Get recent notifications",
               "context": {"project_id": project_id, "limit": 5},
           },
       ]

       results = await client.call_agents_parallel(calls)

       return {
           "project_id": project_id,
           "navi": results.get("navi", {}).content if results.get("navi") else None,
           "pulse": results.get("pulse", {}).content if results.get("pulse") else None,
           "herald": results.get("herald", {}).content if results.get("herald") else None,
           "errors": {
               agent: r.error
               for agent, r in results.items()
               if not r.success
           },
       }


   # Update get_all_tools to include new tools
   def get_all_tools() -> list:
       """Get all Dashboard Gateway tools."""
       return [
           render_dashboard_widget,
           get_dashboard_capabilities,
           route_to_agent,
           # New A2A orchestration tools
           get_project_status,
           get_health_summary,
           get_recent_activity,
           gather_dashboard_data,
       ]
   ```

2. **Update Dashboard agent instructions (`agents/gateway/agent.py`):**
   ```python
   # Update DASHBOARD_INSTRUCTIONS to include orchestration guidance

   DASHBOARD_INSTRUCTIONS = """
   You are the Dashboard Gateway agent for HYVVE. Your primary role is to:

   1. UNDERSTAND user requests about their workspace, projects, or business
   2. ORCHESTRATE data gathering from specialist agents via A2A
   3. RENDER visual widgets on the user's dashboard

   ## Orchestration Flow

   When a user asks a question:
   1. Determine which specialist agents have the data (Navi, Pulse, Herald)
   2. Call the appropriate A2A tools to gather data
   3. Render widgets with the gathered data
   4. Provide a brief summary

   ## A2A Tools for Data Gathering

   - get_project_status: Call Navi for project context, planning, progress
   - get_health_summary: Call Pulse for metrics, risks, deadlines
   - get_recent_activity: Call Herald for notifications, team updates
   - gather_dashboard_data: Call all agents in parallel for comprehensive view

   ## Widget Rendering

   After gathering data, use render_dashboard_widget to display:
   - ProjectStatus: For project overviews from Navi
   - Metrics: For health data from Pulse
   - Alert: For warnings and risks from Pulse
   - TeamActivity: For activity feed from Herald

   ## Example Flow

   User: "How is Project Alpha doing?"

   1. Call get_project_status(project_id="alpha")
   2. Call get_health_summary(project_id="alpha")
   3. Render ProjectStatus widget with Navi data
   4. Render Metrics widget with Pulse data
   5. Say: "Here's the current status for Project Alpha"

   ## Error Handling

   If an agent call fails:
   - Still render widgets with available data
   - Show Alert widget for the error
   - Suggest retry or alternative query

   [... rest of existing instructions ...]
   """
   ```

**Files to Modify:**
- `agents/gateway/tools.py`
- `agents/gateway/agent.py`

**Test Requirements:**
- Unit: Each A2A tool returns expected structure
- Unit: Parallel gathering works correctly
- Integration: Dashboard agent can call PM agents
- Integration: Tool calls properly formatted for frontend

**Definition of Done:**
- [ ] Dashboard agent delegates to specialist agents
- [ ] A2A Tasks complete successfully
- [ ] Data aggregated from multiple agents
- [ ] Proper error handling for agent failures
- [ ] Integration tests pass

---

### 3.3 Story DM-03.3: Widget Rendering Pipeline (8 points)

**Objective:** Connect agent tool calls to frontend widget rendering.

**Implementation Tasks:**

1. **Update DashboardSlots component (`apps/web/src/components/slots/DashboardSlots.tsx`):**
   ```typescript
   "use client";

   import { useRenderToolCall } from "@copilotkit/react-core";
   import { useState, useCallback } from "react";

   // Import widget components
   import { ProjectStatusWidget } from "@/components/widgets/ProjectStatusWidget";
   import { TaskListWidget } from "@/components/widgets/TaskListWidget";
   import { MetricsWidget } from "@/components/widgets/MetricsWidget";
   import { AlertWidget } from "@/components/widgets/AlertWidget";
   import { TeamActivityWidget } from "@/components/widgets/TeamActivityWidget";
   import { LoadingWidget } from "@/components/widgets/LoadingWidget";
   import { ErrorWidget } from "@/components/widgets/ErrorWidget";

   // Widget type to component mapping
   const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
     ProjectStatus: ProjectStatusWidget,
     TaskList: TaskListWidget,
     Metrics: MetricsWidget,
     Alert: AlertWidget,
     TeamActivity: TeamActivityWidget,
     KanbanBoard: () => <div>Kanban (coming soon)</div>,
     GanttChart: () => <div>Gantt (coming soon)</div>,
     BurndownChart: () => <div>Burndown (coming soon)</div>,
   };

   interface RenderedWidget {
     id: string;
     type: string;
     data: any;
     title?: string;
     timestamp: number;
   }

   export function DashboardSlots() {
     const [widgets, setWidgets] = useState<RenderedWidget[]>([]);
     const [isLoading, setIsLoading] = useState(false);

     // Handle render_dashboard_widget tool calls from Dashboard Gateway
     useRenderToolCall({
       name: "render_dashboard_widget",
       description: "Render a widget on the user's dashboard",
       parameters: [
         {
           name: "widget_type",
           type: "string",
           description: "Type of widget to render",
           required: true,
         },
         {
           name: "data",
           type: "object",
           description: "Widget data payload",
           required: true,
         },
         {
           name: "title",
           type: "string",
           description: "Optional widget title",
           required: false,
         },
       ],
       render: ({ args, status }) => {
         // Show loading state while tool is executing
         if (status === "pending") {
           return <LoadingWidget type={args.widget_type} />;
         }

         // Get widget component
         const WidgetComponent = WIDGET_REGISTRY[args.widget_type];

         if (!WidgetComponent) {
           return (
             <ErrorWidget
               message={`Unknown widget type: ${args.widget_type}`}
               availableTypes={Object.keys(WIDGET_REGISTRY)}
             />
           );
         }

         // Handle error in data
         if (args.data?.error) {
           return (
             <ErrorWidget
               message={args.data.error}
               widgetType={args.widget_type}
             />
           );
         }

         // Render the widget
         return (
           <div className="widget-container animate-in fade-in-50 duration-300">
             {args.title && (
               <h3 className="text-sm font-medium text-muted-foreground mb-2">
                 {args.title}
               </h3>
             )}
             <WidgetComponent {...args.data} />
           </div>
         );
       },
     });

     // Handle loading state changes
     useRenderToolCall({
       name: "gather_dashboard_data",
       render: ({ status }) => {
         if (status === "pending") {
           return (
             <div className="flex items-center gap-2 text-muted-foreground">
               <span className="animate-spin">⏳</span>
               <span>Gathering data from agents...</span>
             </div>
           );
         }
         return null;
       },
     });

     return (
       <div className="dashboard-slots">
         {isLoading && (
           <div className="loading-indicator">
             Processing your request...
           </div>
         )}
         {/* Widgets are rendered inline by useRenderToolCall */}
       </div>
     );
   }
   ```

2. **Create widget components (`apps/web/src/components/widgets/`):**

   **ProjectStatusWidget.tsx:**
   ```typescript
   import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
   import { Progress } from "@/components/ui/progress";
   import { Badge } from "@/components/ui/badge";

   interface ProjectStatusProps {
     project_id: string;
     name?: string;
     status?: "on-track" | "at-risk" | "behind" | "completed";
     progress?: number;
     content?: string;
     tasks_completed?: number;
     tasks_total?: number;
   }

   export function ProjectStatusWidget({
     project_id,
     name,
     status = "on-track",
     progress = 0,
     content,
     tasks_completed = 0,
     tasks_total = 0,
   }: ProjectStatusProps) {
     const statusColors = {
       "on-track": "bg-green-500",
       "at-risk": "bg-yellow-500",
       "behind": "bg-red-500",
       "completed": "bg-blue-500",
     };

     return (
       <Card>
         <CardHeader className="pb-2">
           <div className="flex items-center justify-between">
             <CardTitle className="text-lg">{name || project_id}</CardTitle>
             <Badge className={statusColors[status]}>
               {status.replace("-", " ")}
             </Badge>
           </div>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div>
               <div className="flex justify-between text-sm mb-1">
                 <span>Progress</span>
                 <span>{progress}%</span>
               </div>
               <Progress value={progress} />
             </div>

             {tasks_total > 0 && (
               <div className="text-sm text-muted-foreground">
                 {tasks_completed} of {tasks_total} tasks completed
               </div>
             )}

             {content && (
               <p className="text-sm">{content}</p>
             )}
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

   **MetricsWidget.tsx:**
   ```typescript
   import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
   import { TrendingUp, TrendingDown, Minus } from "lucide-react";

   interface Metric {
     label: string;
     value: number | string;
     trend?: "up" | "down" | "neutral";
     change?: string;
   }

   interface MetricsProps {
     title?: string;
     metrics?: Metric[];
     content?: string;
   }

   export function MetricsWidget({
     title = "Key Metrics",
     metrics = [],
     content,
   }: MetricsProps) {
     const TrendIcon = {
       up: TrendingUp,
       down: TrendingDown,
       neutral: Minus,
     };

     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-lg">{title}</CardTitle>
         </CardHeader>
         <CardContent>
           {metrics.length > 0 ? (
             <div className="grid grid-cols-2 gap-4">
               {metrics.map((metric, idx) => {
                 const Icon = TrendIcon[metric.trend || "neutral"];
                 return (
                   <div key={idx} className="space-y-1">
                     <p className="text-sm text-muted-foreground">
                       {metric.label}
                     </p>
                     <div className="flex items-center gap-2">
                       <span className="text-2xl font-bold">{metric.value}</span>
                       {metric.trend && (
                         <Icon
                           className={`h-4 w-4 ${
                             metric.trend === "up"
                               ? "text-green-500"
                               : metric.trend === "down"
                               ? "text-red-500"
                               : "text-gray-500"
                           }`}
                         />
                       )}
                     </div>
                     {metric.change && (
                       <p className="text-xs text-muted-foreground">
                         {metric.change}
                       </p>
                     )}
                   </div>
                 );
               })}
             </div>
           ) : content ? (
             <p className="text-sm">{content}</p>
           ) : (
             <p className="text-sm text-muted-foreground">No metrics available</p>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

   **AlertWidget.tsx:**
   ```typescript
   import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
   import { AlertCircle, AlertTriangle, Info, CheckCircle } from "lucide-react";

   interface AlertWidgetProps {
     type?: "error" | "warning" | "info" | "success";
     title?: string;
     message: string;
     actions?: { label: string; onClick?: () => void }[];
   }

   export function AlertWidget({
     type = "info",
     title,
     message,
     actions,
   }: AlertWidgetProps) {
     const icons = {
       error: AlertCircle,
       warning: AlertTriangle,
       info: Info,
       success: CheckCircle,
     };
     const Icon = icons[type];

     const variants = {
       error: "destructive",
       warning: "default",
       info: "default",
       success: "default",
     } as const;

     return (
       <Alert variant={variants[type]}>
         <Icon className="h-4 w-4" />
         {title && <AlertTitle>{title}</AlertTitle>}
         <AlertDescription>{message}</AlertDescription>
       </Alert>
     );
   }
   ```

   **TeamActivityWidget.tsx:**
   ```typescript
   import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
   import { Avatar, AvatarFallback } from "@/components/ui/avatar";

   interface Activity {
     user: string;
     action: string;
     target?: string;
     time: string;
   }

   interface TeamActivityProps {
     activities?: Activity[];
     content?: string;
   }

   export function TeamActivityWidget({
     activities = [],
     content,
   }: TeamActivityProps) {
     return (
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-lg">Recent Activity</CardTitle>
         </CardHeader>
         <CardContent>
           {activities.length > 0 ? (
             <div className="space-y-3">
               {activities.map((activity, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                   <Avatar className="h-8 w-8">
                     <AvatarFallback>
                       {activity.user.slice(0, 2).toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                   <div className="flex-1 text-sm">
                     <p>
                       <span className="font-medium">{activity.user}</span>{" "}
                       {activity.action}
                       {activity.target && (
                         <span className="font-medium"> {activity.target}</span>
                       )}
                     </p>
                     <p className="text-xs text-muted-foreground">
                       {activity.time}
                     </p>
                   </div>
                 </div>
               ))}
             </div>
           ) : content ? (
             <p className="text-sm">{content}</p>
           ) : (
             <p className="text-sm text-muted-foreground">No recent activity</p>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

   **LoadingWidget.tsx:**
   ```typescript
   import { Card, CardContent } from "@/components/ui/card";
   import { Skeleton } from "@/components/ui/skeleton";

   interface LoadingWidgetProps {
     type?: string;
   }

   export function LoadingWidget({ type }: LoadingWidgetProps) {
     return (
       <Card>
         <CardContent className="pt-6">
           <div className="space-y-3">
             <Skeleton className="h-4 w-3/4" />
             <Skeleton className="h-4 w-1/2" />
             <Skeleton className="h-20 w-full" />
           </div>
           {type && (
             <p className="text-xs text-muted-foreground mt-2">
               Loading {type}...
             </p>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

   **ErrorWidget.tsx:**
   ```typescript
   import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
   import { AlertCircle } from "lucide-react";

   interface ErrorWidgetProps {
     message: string;
     widgetType?: string;
     availableTypes?: string[];
   }

   export function ErrorWidget({
     message,
     widgetType,
     availableTypes,
   }: ErrorWidgetProps) {
     return (
       <Alert variant="destructive">
         <AlertCircle className="h-4 w-4" />
         <AlertTitle>Widget Error</AlertTitle>
         <AlertDescription>
           {message}
           {availableTypes && (
             <p className="mt-2 text-xs">
               Available: {availableTypes.join(", ")}
             </p>
           )}
         </AlertDescription>
       </Alert>
     );
   }
   ```

3. **Create widgets barrel export (`apps/web/src/components/widgets/index.ts`):**
   ```typescript
   export { ProjectStatusWidget } from "./ProjectStatusWidget";
   export { TaskListWidget } from "./TaskListWidget";
   export { MetricsWidget } from "./MetricsWidget";
   export { AlertWidget } from "./AlertWidget";
   export { TeamActivityWidget } from "./TeamActivityWidget";
   export { LoadingWidget } from "./LoadingWidget";
   export { ErrorWidget } from "./ErrorWidget";
   ```

**Files to Create:**
- `apps/web/src/components/widgets/ProjectStatusWidget.tsx`
- `apps/web/src/components/widgets/MetricsWidget.tsx`
- `apps/web/src/components/widgets/AlertWidget.tsx`
- `apps/web/src/components/widgets/TeamActivityWidget.tsx`
- `apps/web/src/components/widgets/LoadingWidget.tsx`
- `apps/web/src/components/widgets/ErrorWidget.tsx`
- `apps/web/src/components/widgets/index.ts`

**Files to Modify:**
- `apps/web/src/components/slots/DashboardSlots.tsx`

**Test Requirements:**
- Unit: Each widget renders correctly with props
- Unit: Error states display properly
- Unit: Loading states animate
- Integration: Tool calls render widgets
- Visual: Storybook stories for each widget

**Definition of Done:**
- [ ] Agent tool calls render widgets
- [ ] Widget data matches agent response
- [ ] Loading indicators during processing
- [ ] Error widgets for failed renders
- [ ] Unit tests pass

---

### 3.4 Story DM-03.4: Dashboard Page Integration (8 points)

**Objective:** Create dedicated dashboard page with agent-driven widgets.

**Implementation Tasks:**

1. **Create dashboard page (`apps/web/src/app/(dashboard)/dashboard/page.tsx`):**
   ```typescript
   "use client";

   import { Suspense } from "react";
   import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
   import { DashboardChat } from "@/components/dashboard/DashboardChat";
   import { DashboardSlots } from "@/components/slots/DashboardSlots";
   import { CopilotProvider } from "@/lib/copilotkit/provider";
   import { Skeleton } from "@/components/ui/skeleton";

   export default function DashboardPage() {
     return (
       <CopilotProvider>
         <div className="flex h-full">
           {/* Main content area with widget grid */}
           <main className="flex-1 overflow-auto p-6">
             <header className="mb-6">
               <h1 className="text-2xl font-bold">Dashboard</h1>
               <p className="text-muted-foreground">
                 Ask me anything about your projects and workspace
               </p>
             </header>

             <Suspense fallback={<DashboardSkeleton />}>
               <DashboardGrid>
                 <DashboardSlots />
               </DashboardGrid>
             </Suspense>
           </main>

           {/* Chat sidebar */}
           <aside className="w-96 border-l bg-muted/10">
             <DashboardChat />
           </aside>
         </div>
       </CopilotProvider>
     );
   }

   function DashboardSkeleton() {
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {[1, 2, 3].map((i) => (
           <div key={i} className="p-4 border rounded-lg">
             <Skeleton className="h-6 w-1/2 mb-4" />
             <Skeleton className="h-24 w-full" />
           </div>
         ))}
       </div>
     );
   }
   ```

2. **Create DashboardGrid component (`apps/web/src/components/dashboard/DashboardGrid.tsx`):**
   ```typescript
   "use client";

   import { ReactNode } from "react";

   interface DashboardGridProps {
     children: ReactNode;
   }

   export function DashboardGrid({ children }: DashboardGridProps) {
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {children}
       </div>
     );
   }
   ```

3. **Create DashboardChat component (`apps/web/src/components/dashboard/DashboardChat.tsx`):**
   ```typescript
   "use client";

   import { CopilotChat } from "@copilotkit/react-ui";
   import { useCopilotContext } from "@copilotkit/react-core";

   export function DashboardChat() {
     // Quick action suggestions
     const suggestions = [
       "Show me project status",
       "What's at risk this week?",
       "Show recent team activity",
       "Get workspace overview",
     ];

     return (
       <div className="flex flex-col h-full">
         <header className="p-4 border-b">
           <h2 className="font-semibold">Dashboard Assistant</h2>
           <p className="text-sm text-muted-foreground">
             Powered by Dashboard Gateway
           </p>
         </header>

         <div className="flex-1 overflow-hidden">
           <CopilotChat
             className="h-full"
             instructions="You are helping the user understand their workspace through visual widgets."
             labels={{
               title: "Dashboard",
               initial: "What would you like to see?",
               placeholder: "Ask about projects, metrics, or activity...",
             }}
           />
         </div>

         <footer className="p-4 border-t">
           <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
           <div className="flex flex-wrap gap-2">
             {suggestions.map((suggestion) => (
               <QuickActionButton key={suggestion} text={suggestion} />
             ))}
           </div>
         </footer>
       </div>
     );
   }

   function QuickActionButton({ text }: { text: string }) {
     const { sendMessage } = useCopilotContext();

     return (
       <button
         onClick={() => sendMessage(text)}
         className="px-2 py-1 text-xs bg-muted rounded-md hover:bg-muted/80 transition-colors"
       >
         {text}
       </button>
     );
   }
   ```

4. **Update layout for dashboard route (`apps/web/src/app/(dashboard)/layout.tsx`):**
   ```typescript
   import { ReactNode } from "react";
   import { AppSidebar } from "@/components/layout/AppSidebar";
   import { Header } from "@/components/layout/Header";

   export default function DashboardLayout({ children }: { children: ReactNode }) {
     return (
       <div className="flex h-screen">
         <AppSidebar />
         <div className="flex-1 flex flex-col overflow-hidden">
           <Header />
           <div className="flex-1 overflow-auto">{children}</div>
         </div>
       </div>
     );
   }
   ```

5. **Add navigation link to dashboard:**
   ```typescript
   // In apps/web/src/components/layout/AppSidebar.tsx
   // Add to navigation items:
   {
     name: "Dashboard",
     href: "/dashboard",
     icon: LayoutDashboard,
   },
   ```

**Files to Create:**
- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `apps/web/src/components/dashboard/DashboardGrid.tsx`
- `apps/web/src/components/dashboard/DashboardChat.tsx`

**Files to Modify:**
- `apps/web/src/app/(dashboard)/layout.tsx` (if needed)
- `apps/web/src/components/layout/AppSidebar.tsx`

**Test Requirements:**
- Unit: Page renders without errors
- Unit: Chat interface accepts input
- Unit: Grid displays widgets
- Integration: CopilotKit connects to backend
- Visual: Responsive layout works

**Definition of Done:**
- [ ] Dashboard page renders agent widgets
- [ ] Chat queries trigger widget updates
- [ ] Grid layout responsive
- [ ] Widget preferences saved per user
- [ ] Navigation accessible from sidebar

---

### 3.5 Story DM-03.5: End-to-End Testing (5 points)

**Objective:** Comprehensive testing of the full flow.

**Implementation Tasks:**

1. **Create E2E test suite (`apps/web/e2e/dashboard.spec.ts`):**
   ```typescript
   import { test, expect } from "@playwright/test";

   test.describe("Dashboard Integration", () => {
     test.beforeEach(async ({ page }) => {
       // Login and navigate to dashboard
       await page.goto("/login");
       // ... login flow ...
       await page.goto("/dashboard");
     });

     test("shows dashboard page with chat", async ({ page }) => {
       await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
       await expect(page.getByText("Dashboard Assistant")).toBeVisible();
     });

     test("chat input accepts messages", async ({ page }) => {
       const input = page.getByPlaceholder("Ask about projects");
       await input.fill("Show me project status");
       await input.press("Enter");

       // Wait for response
       await expect(page.getByText("Here's the current status")).toBeVisible({
         timeout: 10000,
       });
     });

     test("widgets render from agent responses", async ({ page }) => {
       const input = page.getByPlaceholder("Ask about projects");
       await input.fill("Show me project status for Alpha");
       await input.press("Enter");

       // Wait for widget to render
       await expect(page.getByTestId("widget-project-status")).toBeVisible({
         timeout: 10000,
       });
     });

     test("quick actions trigger queries", async ({ page }) => {
       await page.getByText("Show recent team activity").click();

       // Wait for activity widget
       await expect(page.getByText("Recent Activity")).toBeVisible({
         timeout: 10000,
       });
     });

     test("error states display properly", async ({ page }) => {
       // Force an error by asking about non-existent project
       const input = page.getByPlaceholder("Ask about projects");
       await input.fill("Show status for non-existent-project-xyz");
       await input.press("Enter");

       // Should show error gracefully
       await expect(page.getByText(/error|not found/i)).toBeVisible({
         timeout: 10000,
       });
     });

     test("loading states show during processing", async ({ page }) => {
       const input = page.getByPlaceholder("Ask about projects");
       await input.fill("Get workspace overview");
       await input.press("Enter");

       // Loading indicator should appear
       await expect(page.getByText(/loading|processing/i)).toBeVisible();

       // Then results should appear
       await expect(page.getByTestId(/widget-/)).toBeVisible({
         timeout: 15000,
       });
     });
   });
   ```

2. **Create A2A integration tests (`agents/tests/integration/test_a2a_flow.py`):**
   ```python
   """Integration tests for A2A communication flow."""
   import pytest
   import asyncio
   from httpx import AsyncClient

   from main import app


   @pytest.fixture
   async def client():
       async with AsyncClient(app=app, base_url="http://test") as ac:
           yield ac


   class TestA2AFlow:
       @pytest.mark.asyncio
       async def test_dashboard_calls_navi(self, client):
           """Dashboard Gateway can call Navi via A2A."""
           # First ensure agents are registered
           discovery = await client.get("/.well-known/agent-card.json")
           assert discovery.status_code == 200
           agents = discovery.json()["agents"]
           assert any(a["name"] == "dashboard_gateway" for a in agents)

           # Call dashboard via A2A RPC
           response = await client.post(
               "/a2a/dashboard/rpc",
               json={
                   "jsonrpc": "2.0",
                   "method": "run",
                   "params": {"task": "Get project status"},
                   "id": "test-1",
               },
               headers={"Authorization": "Bearer test-token"},
           )
           assert response.status_code == 200
           result = response.json()
           assert "result" in result

       @pytest.mark.asyncio
       async def test_parallel_agent_calls(self, client):
           """Dashboard can call multiple agents in parallel."""
           # This tests the gather_dashboard_data flow
           response = await client.post(
               "/a2a/dashboard/rpc",
               json={
                   "jsonrpc": "2.0",
                   "method": "run",
                   "params": {"task": "Get workspace overview"},
                   "id": "test-2",
               },
               headers={"Authorization": "Bearer test-token"},
           )
           assert response.status_code == 200

       @pytest.mark.asyncio
       async def test_widget_tool_calls(self, client):
           """Dashboard returns widget tool calls."""
           response = await client.post(
               "/a2a/dashboard/rpc",
               json={
                   "jsonrpc": "2.0",
                   "method": "run",
                   "params": {"task": "Show project status for Alpha"},
                   "id": "test-3",
               },
               headers={"Authorization": "Bearer test-token"},
           )
           assert response.status_code == 200
           result = response.json()
           # Should contain tool_calls for render_dashboard_widget
           assert "result" in result
   ```

3. **Create widget component tests (`apps/web/src/components/widgets/__tests__/`):**
   ```typescript
   // ProjectStatusWidget.test.tsx
   import { render, screen } from "@testing-library/react";
   import { ProjectStatusWidget } from "../ProjectStatusWidget";

   describe("ProjectStatusWidget", () => {
     it("renders project name", () => {
       render(<ProjectStatusWidget project_id="alpha" name="Project Alpha" />);
       expect(screen.getByText("Project Alpha")).toBeInTheDocument();
     });

     it("shows progress bar", () => {
       render(<ProjectStatusWidget project_id="alpha" progress={75} />);
       const progress = screen.getByRole("progressbar");
       expect(progress).toHaveAttribute("aria-valuenow", "75");
     });

     it("displays status badge", () => {
       render(<ProjectStatusWidget project_id="alpha" status="at-risk" />);
       expect(screen.getByText("at risk")).toBeInTheDocument();
     });

     it("shows task count", () => {
       render(
         <ProjectStatusWidget
           project_id="alpha"
           tasks_completed={5}
           tasks_total={10}
         />
       );
       expect(screen.getByText("5 of 10 tasks completed")).toBeInTheDocument();
     });
   });
   ```

4. **Create performance benchmark (`agents/tests/performance/test_dashboard_latency.py`):**
   ```python
   """Performance tests for dashboard flow."""
   import pytest
   import asyncio
   import time
   from statistics import mean, stdev

   from a2a import get_a2a_client


   class TestDashboardPerformance:
       @pytest.mark.asyncio
       async def test_single_agent_latency(self):
           """Single agent call should be under 500ms."""
           client = get_a2a_client()

           latencies = []
           for _ in range(5):
               start = time.monotonic()
               await client.call_agent("navi", "Get project status")
               latencies.append((time.monotonic() - start) * 1000)

           avg = mean(latencies)
           assert avg < 500, f"Average latency {avg}ms exceeds 500ms target"

       @pytest.mark.asyncio
       async def test_parallel_agents_latency(self):
           """Parallel agent calls should complete under 1s."""
           client = get_a2a_client()

           start = time.monotonic()
           await client.call_agents_parallel([
               {"agent_id": "navi", "task": "Get status"},
               {"agent_id": "pulse", "task": "Get health"},
               {"agent_id": "herald", "task": "Get activity"},
           ])
           elapsed = (time.monotonic() - start) * 1000

           assert elapsed < 1000, f"Parallel calls took {elapsed}ms, exceeds 1s target"
   ```

**Files to Create:**
- `apps/web/e2e/dashboard.spec.ts`
- `agents/tests/integration/test_a2a_flow.py`
- `apps/web/src/components/widgets/__tests__/ProjectStatusWidget.test.tsx`
- `apps/web/src/components/widgets/__tests__/MetricsWidget.test.tsx`
- `apps/web/src/components/widgets/__tests__/AlertWidget.test.tsx`
- `agents/tests/performance/test_dashboard_latency.py`

**Test Requirements:**
- E2E: Dashboard page loads and accepts input
- E2E: Widgets render from agent responses
- E2E: Error handling works gracefully
- Integration: A2A calls succeed
- Unit: Widget components render correctly
- Performance: Latency targets met

**Definition of Done:**
- [ ] E2E tests cover happy path
- [ ] A2A communication tested
- [ ] Widget rendering tested
- [ ] Performance baseline established
- [ ] All tests pass in CI

---

## 4. Dependencies & Integrations

### 4.1 DM-01 Dependencies (Frontend)
| Component | Status | Usage in DM-03 |
|-----------|--------|----------------|
| CopilotKit Provider | ✅ Complete | Dashboard page wraps with provider |
| DashboardSlots | ✅ Complete | Updated with full widget rendering |
| useCopilotChat | ✅ Complete | Used in DashboardChat component |
| Widget Registry | ✅ Complete | Extended with all widget types |

### 4.2 DM-02 Dependencies (Backend)
| Component | Status | Usage in DM-03 |
|-----------|--------|----------------|
| Dashboard Gateway Agent | ✅ Complete | Extended with orchestration tools |
| PM Agent A2A Adapters | ✅ Complete | Called via A2A client |
| AG-UI Interface | ✅ Complete | Streams responses to frontend |
| A2A Discovery | ✅ Complete | Enables agent-to-agent calls |

### 4.3 External Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @copilotkit/react-core | ^1.x | useRenderToolCall hook |
| @copilotkit/react-ui | ^1.x | CopilotChat component |
| @playwright/test | ^1.40.x | E2E testing |
| httpx | ^0.27.x | Async HTTP client for A2A |

---

## 5. Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **Single Agent Call (P95)** | <500ms | <1000ms | A2A round-trip |
| **Parallel 3 Agents (P95)** | <800ms | <1500ms | Total gather time |
| **Widget Render** | <100ms | <200ms | React render time |
| **Time to First Widget** | <1s | <2s | User query to widget |
| **Chat Response Start** | <200ms | <500ms | AG-UI TTFT |

---

## 6. Risk Mitigation

### 6.1 Latency Risk
**Risk:** Multiple A2A hops may add unacceptable delay.

**Mitigation:**
- Parallel agent calls via `gather_dashboard_data`
- Connection pooling in A2A client
- Performance tests validate targets
- Consider caching for repeated queries

### 6.2 Error Propagation Risk
**Risk:** Errors from sub-agents need clear handling.

**Mitigation:**
- Each A2A call returns structured `A2ATaskResult`
- Dashboard renders error widgets gracefully
- Partial data still shown (if Navi fails, show Pulse data)
- Error widgets include actionable suggestions

### 6.3 State Consistency Risk
**Risk:** Widget data may become stale.

**Mitigation:**
- Widgets show timestamp of data
- Refresh action available per widget
- DM-04 (Shared State) will add real-time sync

---

## 7. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| Full flow works E2E | User query → widgets rendered | Pass |
| Average response time | Dashboard query completion | <3 seconds |
| All PM agents accessible | A2A calls succeed | Pass |
| Dashboard usable for daily workflows | User testing | Pass |
| E2E tests green | Playwright suite | 100% |
| Widget render tests | Vitest suite | 100% |
| Performance targets | Latency benchmarks | All pass |

---

## 8. References

- [Epic DM-03 Definition](./epic-dm-03-dashboard-integration.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Epic DM-01 Tech Spec](./epic-dm-01-tech-spec.md) (Frontend)
- [Epic DM-02 Tech Spec](./epic-dm-02-tech-spec.md) (Backend)
- [A2A Protocol Specification](https://github.com/google/a2a-protocol)
- [CopilotKit Documentation](https://docs.copilotkit.ai)

---

*Generated: 2025-12-30*
*Epic: DM-03 | Phase: 3 | Stories: 5 | Points: 34*
