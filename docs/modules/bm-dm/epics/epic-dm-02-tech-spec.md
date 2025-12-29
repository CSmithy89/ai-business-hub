# Epic DM-02: Agno Multi-Interface Backend - Technical Specification

## 1. Executive Summary

### What DM-02 Delivers

Epic DM-02 establishes the **backend infrastructure** for the Dynamic Module System, enabling AgentOS to expose agents via multiple protocols simultaneously. This epic is the backend counterpart to DM-01, completing the full-stack Generative UI capability.

**Key Deliverables:**
- Agno AG-UI and A2A protocol installation and configuration
- Multi-interface AgentOS exposing `/agui` and `/a2a` endpoints
- A2A AgentCard discovery via `/.well-known/agent.json`
- Dashboard Gateway agent with `render_dashboard_widget` tool
- Existing PM agent updates for A2A compatibility
- CCR (Claude Code Router) installation and integration
- Task-based routing and usage monitoring

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| `agno[agui,a2a]` | Latest | Core Agno framework with protocol support |
| `ag-ui-protocol` | ^0.1.x | AG-UI streaming protocol |
| `a2a-sdk` | ^0.3.x | Google A2A protocol SDK |
| CCR (ccr-custom) | Latest | Model routing and fallback management |
| FastAPI | ^0.110.x | HTTP server framework |
| Pydantic | ^2.x | Request/response validation |

### Integration Points with Existing Codebase

1. **AgentOS (`agents/main.py`)**
   - Update to use Agno's native multi-interface support
   - Add AGUI and A2A interface configurations
   - Integrate CCR as model provider option

2. **Existing PM Agents (`agents/pm/`)**
   - Add A2A interface compatibility to Navi, Pulse, Herald
   - Maintain backward compatibility with current REST endpoints

3. **Provider System (`agents/providers/`)**
   - Add CCR provider wrapper for model routing
   - Implement hybrid mode (CCR vs BYOAI selection)

4. **Configuration (`agents/config.py`)**
   - Add CCR-related settings
   - Add A2A protocol configuration

---

## 2. Architecture Decisions

### 2.1 AgentOS Multi-Interface Configuration

Agno's AgentOS can expose the same agent via multiple protocol interfaces simultaneously. We leverage this to provide:

- **AG-UI** for CopilotKit frontend communication (streaming, tool calls)
- **A2A** for inter-agent and external agent communication (JSON-RPC 2.0)

**Pattern:**
```python
# agents/main.py (conceptual update)
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

agent_os = AgentOS(
    agents=[dashboard_agent, navi_agent, pulse_agent, herald_agent],
    interfaces=[
        # Dashboard: accessible from frontend AND other agents
        AGUI(agent=dashboard_agent, path="/agui"),
        A2A(agent=dashboard_agent, path="/a2a/dashboard"),

        # PM Agents: A2A for inter-agent communication
        A2A(agent=navi_agent, path="/a2a/navi"),
        A2A(agent=pulse_agent, path="/a2a/pulse"),
        A2A(agent=herald_agent, path="/a2a/herald"),
    ]
)
```

**Rationale:**
- Single codebase, multiple access patterns
- Dashboard agent gets both interfaces for frontend and backend orchestration
- PM agents only need A2A (they're called by Dashboard, not directly by frontend)

### 2.2 A2A Protocol Integration Patterns

The A2A protocol follows Google's official specification with JSON-RPC 2.0 transport:

**Task Lifecycle:**
```
submitted -> working -> input_required -> completed/failed/cancelled
```

**AgentCard Discovery:**
```
GET /.well-known/agent.json
```
Returns JSON-LD metadata describing agent capabilities, skills, and endpoints.

**Task Execution:**
```
POST /a2a/{agent_id}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "message": { "role": "user", "parts": [{"text": "..."}] }
  },
  "id": "task-123"
}
```

### 2.3 CCR Routing Architecture

CCR sits between AgentOS and model providers, enabling intelligent routing:

```
AgentOS (Agno)
       |
       v
CCR (localhost:3456)
       |
       +-- Claude CLI Subscription
       +-- DeepSeek API
       +-- Gemini CLI Subscription
       +-- OpenRouter (fallback)
```

**Routing Rules:**
| Task Type | Primary Provider | Fallback |
|-----------|-----------------|----------|
| Reasoning | Claude | Gemini |
| Code Generation | DeepSeek | Claude |
| Long Context | Gemini | Claude |
| General | Claude | DeepSeek |

### 2.4 Authentication & Authorization Model

**A2A Endpoints:**
- Service-to-service authentication via JWT tokens
- Workspace isolation enforced at middleware level
- Same TenantMiddleware as existing REST endpoints

**AGUI Endpoints:**
- Inherits BYOAI authentication from existing system
- User context passed from CopilotKit via AG-UI protocol

**CCR Proxy:**
- Local-only access (localhost:3456)
- No external authentication required
- Agent-level permissions based on configuration

---

## 3. Story-by-Story Technical Breakdown

### 3.1 Story DM-02.1: Agno Protocol Dependencies (2 points)

**Objective:** Install and configure Agno protocol support packages.

**Implementation Tasks:**

1. **Update `agents/pyproject.toml`:**
   ```toml
   [project]
   dependencies = [
       "agno[agui,a2a]>=0.3.0",
       # OR individual packages:
       # "agno>=0.3.0",
       # "ag-ui-protocol>=0.1.0",
       # "a2a-sdk>=0.3.0",
   ]
   ```

2. **Create verification script (`agents/scripts/verify_protocols.py`):**
   ```python
   """Verify protocol package installation."""

   def verify_imports():
       from agno.os import AgentOS
       from agno.os.interfaces.agui import AGUI
       from agno.os.interfaces.a2a import A2A
       from ag_ui.encoder import EventEncoder
       from a2a import A2AClient
       print("All protocol imports successful")
       return True

   if __name__ == "__main__":
       verify_imports()
   ```

3. **Update `agents/requirements.txt`** (if used alongside pyproject.toml):
   ```txt
   agno[agui,a2a]>=0.3.0
   ```

**Files to Create:**
- `agents/scripts/verify_protocols.py`

**Files to Modify:**
- `agents/pyproject.toml`
- `agents/requirements.txt` (if exists)

**Test Requirements:**
- Unit: Import test passes
- Integration: Version compatibility check with existing Agno code

**Definition of Done:**
- [ ] All protocol packages installed via `pip install -e ".[dev]"`
- [ ] Imports work without errors in Python REPL
- [ ] Version compatibility verified with existing `agents/main.py`
- [ ] Development environment documentation updated

---

### 3.2 Story DM-02.2: AgentOS Multi-Interface Setup (5 points)

**Objective:** Configure AgentOS to expose multiple interfaces for Dashboard agent.

**Implementation Tasks:**

1. **Create interface configuration (`agents/interfaces/config.py`):**
   ```python
   """Interface configuration for AgentOS."""
   from typing import List, Optional
   from pydantic import BaseModel

   from agents.constants.dm_constants import DMConstants


   class InterfaceConfig(BaseModel):
       """Configuration for an agent interface."""
       agent_id: str
       agui_enabled: bool = False
       agui_path: Optional[str] = None
       a2a_enabled: bool = True
       a2a_path: Optional[str] = None


   # Default interface configurations
   INTERFACE_CONFIGS: List[InterfaceConfig] = [
       InterfaceConfig(
           agent_id="dashboard_gateway",
           agui_enabled=True,
           agui_path="/agui",
           a2a_enabled=True,
           a2a_path="/a2a/dashboard",
       ),
       InterfaceConfig(
           agent_id="navi",
           a2a_enabled=True,
           a2a_path="/a2a/navi",
       ),
       InterfaceConfig(
           agent_id="pulse",
           a2a_enabled=True,
           a2a_path="/a2a/pulse",
       ),
       InterfaceConfig(
           agent_id="herald",
           a2a_enabled=True,
           a2a_path="/a2a/herald",
       ),
   ]


   def get_interface_config(agent_id: str) -> Optional[InterfaceConfig]:
       """Get interface configuration for an agent."""
       for config in INTERFACE_CONFIGS:
           if config.agent_id == agent_id:
               return config
       return None
   ```

2. **Create interface factory (`agents/interfaces/factory.py`):**
   ```python
   """Factory for creating agent interfaces."""
   from typing import List
   from agno.agent import Agent
   from agno.os.interfaces.agui import AGUI
   from agno.os.interfaces.a2a import A2A

   from .config import INTERFACE_CONFIGS, InterfaceConfig
   from agents.constants.dm_constants import DMConstants


   def create_interfaces(agents: dict[str, Agent]) -> List:
       """
       Create interfaces for all configured agents.

       Args:
           agents: Dictionary mapping agent_id to Agent instance

       Returns:
           List of interface instances
       """
       interfaces = []

       for config in INTERFACE_CONFIGS:
           agent = agents.get(config.agent_id)
           if not agent:
               continue

           if config.agui_enabled and config.agui_path:
               interfaces.append(
                   AGUI(
                       agent=agent,
                       path=config.agui_path,
                       timeout=DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS,
                   )
               )

           if config.a2a_enabled and config.a2a_path:
               interfaces.append(
                   A2A(
                       agent=agent,
                       path=config.a2a_path,
                       timeout=DMConstants.A2A.TASK_TIMEOUT_SECONDS,
                   )
               )

       return interfaces
   ```

3. **Update `agents/main.py` with multi-interface support:**
   ```python
   # Add to main.py after existing imports
   from interfaces.factory import create_interfaces
   from interfaces.config import INTERFACE_CONFIGS

   # In startup_event or main initialization:
   # Note: This shows the pattern - actual integration depends on
   # whether we use AgentOS.serve() or keep FastAPI app

   # Option A: Full AgentOS migration
   # agent_os = AgentOS(
   #     agents=[dashboard_agent, navi_agent, pulse_agent, herald_agent],
   #     interfaces=create_interfaces({...})
   # )

   # Option B: Mount AGUI/A2A routers on existing FastAPI app
   # (Preferred for backward compatibility)
   from agno.os.interfaces.agui import create_agui_router
   from agno.os.interfaces.a2a import create_a2a_router

   # Mount AGUI for dashboard
   agui_router = create_agui_router(dashboard_agent, path="/agui")
   app.include_router(agui_router)

   # Mount A2A for all agents
   for config in INTERFACE_CONFIGS:
       if config.a2a_enabled:
           a2a_router = create_a2a_router(
               agent=agents.get(config.agent_id),
               path=config.a2a_path
           )
           app.include_router(a2a_router)
   ```

**Files to Create:**
- `agents/interfaces/__init__.py`
- `agents/interfaces/config.py`
- `agents/interfaces/factory.py`

**Files to Modify:**
- `agents/main.py`

**Test Requirements:**
- Unit: Interface factory creates correct interface types
- Integration: `/agui` endpoint responds to AG-UI requests
- Integration: `/a2a/*` endpoints respond to A2A requests
- E2E: Both interfaces serve same agent correctly

**Definition of Done:**
- [ ] AgentOS starts with both AGUI and A2A interfaces
- [ ] `/agui` endpoint responds to AG-UI protocol requests
- [ ] `/a2a/dashboard` endpoint responds to A2A requests
- [ ] Both interfaces reference the same Dashboard agent instance
- [ ] Existing REST endpoints continue to work

---

### 3.3 Story DM-02.3: A2A AgentCard Discovery (3 points)

**Objective:** Implement A2A discovery endpoints returning valid AgentCards.

**Implementation Tasks:**

1. **Create AgentCard builder (`agents/a2a/agent_card.py`):**
   ```python
   """A2A AgentCard generation."""
   from typing import List, Optional, Dict, Any
   from pydantic import BaseModel, Field
   from agno.agent import Agent

   from agents.constants.dm_constants import DMConstants


   class Skill(BaseModel):
       """A2A Skill definition."""
       id: str
       name: str
       description: str
       parameters: Optional[Dict[str, Any]] = None


   class Capabilities(BaseModel):
       """A2A Agent capabilities."""
       streaming: bool = True
       pushNotifications: bool = False
       stateTransfer: bool = False


   class AgentCard(BaseModel):
       """A2A AgentCard following JSON-LD spec."""
       context: str = Field(alias="@context", default="https://schema.org")
       type: str = Field(alias="@type", default="AIAgent")
       name: str
       description: str
       url: str
       version: str = "0.2.0"
       capabilities: Capabilities = Field(default_factory=Capabilities)
       skills: List[Skill] = Field(default_factory=list)
       defaultInputModes: List[str] = Field(default=["text"])
       defaultOutputModes: List[str] = Field(default=["text", "tool_calls"])

       class Config:
           populate_by_name = True


   def build_agent_card(
       agent: Agent,
       base_url: str,
       path: str,
   ) -> AgentCard:
       """
       Build an A2A AgentCard from an Agno Agent.

       Args:
           agent: The Agno agent
           base_url: Base URL of the AgentOS server
           path: A2A endpoint path for this agent

       Returns:
           AgentCard with agent metadata
       """
       # Extract skills from agent tools
       skills = []
       if hasattr(agent, 'tools') and agent.tools:
           for tool in agent.tools:
               skill = Skill(
                   id=tool.__name__ if hasattr(tool, '__name__') else str(tool),
                   name=getattr(tool, 'name', tool.__name__),
                   description=getattr(tool, '__doc__', 'No description'),
               )
               skills.append(skill)

       return AgentCard(
           name=agent.name,
           description=agent.description or f"{agent.name} agent",
           url=f"{base_url}{path}",
           skills=skills,
           capabilities=Capabilities(
               streaming=True,
               pushNotifications=False,
           ),
       )


   def build_discovery_response(
       agents: Dict[str, Agent],
       base_url: str,
       paths: Dict[str, str],
   ) -> Dict[str, Any]:
       """
       Build full A2A discovery response.

       Args:
           agents: Dictionary of agent_id -> Agent
           base_url: Base URL of the server
           paths: Dictionary of agent_id -> A2A path

       Returns:
           Discovery response with all agent cards
       """
       cards = []
       for agent_id, agent in agents.items():
           if agent_id in paths:
               card = build_agent_card(agent, base_url, paths[agent_id])
               cards.append(card.model_dump(by_alias=True))

       return {
           "protocolVersion": DMConstants.A2A.PROTOCOL_VERSION,
           "agents": cards,
       }
   ```

2. **Update discovery endpoints in `agents/main.py`:**
   ```python
   from a2a.agent_card import build_discovery_response, build_agent_card

   # Global discovery endpoint
   @app.get("/.well-known/agent.json")
   async def a2a_global_discovery():
       """
       A2A Global Discovery Endpoint.

       Returns all registered agent cards for discovery.
       """
       return build_discovery_response(
           agents=registered_agents,
           base_url=settings.agentos_base_url,
           paths=agent_a2a_paths,
       )

   # Individual agent discovery
   @app.get("/a2a/{agent_id}/.well-known/agent.json")
   async def a2a_agent_discovery(agent_id: str):
       """
       Get specific agent card by ID.
       """
       agent = registered_agents.get(agent_id)
       if not agent:
           raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")

       path = agent_a2a_paths.get(agent_id)
       if not path:
           raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' has no A2A endpoint")

       card = build_agent_card(agent, settings.agentos_base_url, path)
       return card.model_dump(by_alias=True)
   ```

**Files to Create:**
- `agents/a2a/__init__.py`
- `agents/a2a/agent_card.py`

**Files to Modify:**
- `agents/main.py`

**Test Requirements:**
- Unit: AgentCard builder produces valid JSON-LD
- Unit: Skills extracted correctly from agent tools
- Integration: `/.well-known/agent.json` returns valid response
- Integration: Individual agent discovery works

**Definition of Done:**
- [ ] `/.well-known/agent.json` returns valid JSON-LD AgentCards
- [ ] All agent skills listed correctly from tool definitions
- [ ] Capabilities accurately describe agent features
- [ ] External agents can discover via endpoint (verified with A2A client)

---

### 3.4 Story DM-02.4: Dashboard Gateway Agent (8 points)

**Objective:** Create the Dashboard Gateway agent with multi-protocol support.

**Implementation Tasks:**

1. **Create Dashboard agent (`agents/dashboard/agent.py`):**
   ```python
   """
   Dashboard Gateway Agent

   Orchestrates dashboard widgets by coordinating with specialist agents.
   Accessible via AG-UI (frontend) and A2A (backend agents).
   """
   from typing import Optional, Dict, Any, List
   from agno.agent import Agent
   from agno.models.anthropic import Claude
   from agno.tools import tool
   from pydantic import BaseModel, Field

   from agents.constants.dm_constants import DMConstants


   # Widget types that can be rendered
   WIDGET_TYPES = ["ProjectStatus", "TaskList", "Metrics", "Alert"]


   class WidgetData(BaseModel):
       """Base schema for widget data."""
       type: str = Field(..., description="Widget type identifier")
       data: Dict[str, Any] = Field(default_factory=dict, description="Widget payload")


   @tool
   def render_dashboard_widget(
       widget_type: str,
       data: Dict[str, Any],
       title: Optional[str] = None,
   ) -> Dict[str, Any]:
       """
       Render a widget on the user's dashboard.

       This tool call is intercepted by CopilotKit's useRenderToolCall
       on the frontend and rendered as a React component.

       Args:
           widget_type: One of ProjectStatus, TaskList, Metrics, Alert
           data: Widget-specific data payload
           title: Optional widget title override

       Returns:
           Widget specification for frontend rendering
       """
       if widget_type not in WIDGET_TYPES:
           return {
               "error": f"Unknown widget type: {widget_type}",
               "available_types": WIDGET_TYPES,
           }

       return {
           "type": widget_type,
           "data": data,
           "title": title,
           "rendered": True,
       }


   @tool
   def get_dashboard_capabilities() -> Dict[str, Any]:
       """
       Get available dashboard capabilities.

       Returns:
           Dictionary of available widget types and features
       """
       return {
           "widget_types": WIDGET_TYPES,
           "max_widgets_per_request": DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST,
           "features": ["streaming", "tool_calls", "a2a_orchestration"],
       }


   # Dashboard agent instructions
   DASHBOARD_INSTRUCTIONS = """
   You are the Dashboard Gateway agent for HYVVE. Your primary role is to:

   1. UNDERSTAND user requests about their workspace, projects, or business
   2. ORCHESTRATE data gathering from specialist agents via A2A
   3. RENDER visual widgets on the user's dashboard

   ## Key Behaviors

   - When users ask for information, prefer rendering WIDGETS over text responses
   - Use render_dashboard_widget to display data visually
   - Keep conversational responses minimal - let the widgets do the talking
   - Always confirm what widgets you're rendering

   ## Widget Types Available

   - ProjectStatus: Show project progress, status, health
   - TaskList: Show lists of tasks with filters
   - Metrics: Show numerical KPIs with trends
   - Alert: Show important notifications or warnings

   ## Response Format

   1. Brief acknowledgment of the request
   2. One or more widget renders
   3. Optional follow-up suggestion

   Example:
   User: "How is Project Alpha doing?"
   You: "Here's the current status for Project Alpha:"
   [render ProjectStatus widget]
   "Would you like to see the task breakdown as well?"
   """


   def create_dashboard_agent(
       workspace_id: str,
       model: Optional[str] = None,
   ) -> Agent:
       """
       Create Dashboard Gateway agent.

       Args:
           workspace_id: Workspace/tenant identifier
           model: Optional model override

       Returns:
           Configured Dashboard Gateway agent
       """
       return Agent(
           name="dashboard_gateway",
           role="Dashboard Gateway",
           description="Orchestrates dashboard widgets by coordinating with specialist agents",
           model=Claude(id=model or "claude-sonnet-4-20250514"),
           instructions=[DASHBOARD_INSTRUCTIONS, f"Workspace: {workspace_id}"],
           tools=[render_dashboard_widget, get_dashboard_capabilities],
           add_datetime_to_instructions=True,
           markdown=True,
       )
   ```

2. **Create Dashboard module init (`agents/dashboard/__init__.py`):**
   ```python
   """Dashboard Gateway Agent module."""
   from .agent import create_dashboard_agent, render_dashboard_widget

   __all__ = ["create_dashboard_agent", "render_dashboard_widget"]
   ```

3. **Register Dashboard agent in `agents/main.py`:**
   ```python
   from dashboard import create_dashboard_agent

   # In startup_event or initialization:
   dashboard_agent = create_dashboard_agent(
       workspace_id="system",  # Will be overridden per-request
       model=None,  # Use default
   )

   # Register for A2A discovery
   registry.register_agent(dashboard_agent, override_id="dashboard_gateway")
   ```

**Files to Create:**
- `agents/dashboard/__init__.py`
- `agents/dashboard/agent.py`

**Files to Modify:**
- `agents/main.py`

**Test Requirements:**
- Unit: Dashboard agent initializes correctly
- Unit: render_dashboard_widget returns proper structure
- Integration: Agent accessible via AG-UI endpoint
- Integration: Agent accessible via A2A endpoint
- E2E: Widget data serialized correctly for frontend

**Definition of Done:**
- [ ] Dashboard agent created with correct tools
- [ ] Agent accessible via AG-UI (`/agui`)
- [ ] Agent accessible via A2A (`/a2a/dashboard`)
- [ ] Tool calls properly serialized for CopilotKit
- [ ] Agent handles both text and tool responses correctly

---

### 3.5 Story DM-02.5: Existing Agent Protocol Updates (8 points)

**Objective:** Update existing PM agents for A2A compatibility.

**Implementation Tasks:**

1. **Create A2A adapter for PM agents (`agents/pm/a2a_adapter.py`):**
   ```python
   """A2A protocol adapter for PM agents."""
   from typing import Optional, Dict, Any
   from agno.agent import Agent
   from agno.os.interfaces.a2a import A2AInterface

   from agents.constants.dm_constants import DMConstants


   class PMA2AAdapter:
       """
       Adapter to expose PM agents via A2A protocol.

       This maintains backward compatibility with existing REST endpoints
       while adding A2A interface support.
       """

       def __init__(self, agent: Agent, agent_id: str):
           self.agent = agent
           self.agent_id = agent_id
           self._a2a_interface: Optional[A2AInterface] = None

       def create_a2a_interface(self, path: str) -> A2AInterface:
           """
           Create A2A interface for this agent.

           Args:
               path: A2A endpoint path (e.g., "/a2a/navi")

           Returns:
               Configured A2A interface
           """
           self._a2a_interface = A2AInterface(
               agent=self.agent,
               path=path,
               timeout=DMConstants.A2A.TASK_TIMEOUT_SECONDS,
               max_concurrent=DMConstants.AGENTOS.MAX_CONCURRENT_TASKS,
           )
           return self._a2a_interface

       async def handle_a2a_task(
           self,
           task_message: str,
           context: Optional[Dict[str, Any]] = None,
       ) -> Dict[str, Any]:
           """
           Handle an A2A task request.

           Args:
               task_message: The task message from caller
               context: Optional execution context

           Returns:
               Task result with content and artifacts
           """
           # Execute via agent.arun
           response = await self.agent.arun(message=task_message)

           return {
               "content": response.content,
               "tool_calls": getattr(response, 'tool_calls', []),
               "artifacts": [],
           }
   ```

2. **Update Navi agent (`agents/pm/navi.py`):**
   ```python
   # Add to existing imports
   from .a2a_adapter import PMA2AAdapter

   # Add after create_navi_agent function:
   def create_navi_a2a_adapter(
       workspace_id: str,
       project_id: str,
       shared_memory: Memory,
       model: Optional[str] = None,
   ) -> PMA2AAdapter:
       """
       Create Navi agent with A2A adapter.

       Args:
           workspace_id: Workspace identifier
           project_id: Project context
           shared_memory: Shared memory
           model: Optional model override

       Returns:
           A2A adapter wrapping Navi agent
       """
       agent = create_navi_agent(workspace_id, project_id, shared_memory, model)
       return PMA2AAdapter(agent, "navi")
   ```

3. **Apply similar updates to Pulse and Herald agents.**

4. **Update team registry in `agents/main.py`:**
   ```python
   # Update startup_event to register PM agents for A2A
   from pm.navi import create_navi_a2a_adapter
   from pm.pulse import create_pulse_a2a_adapter
   from pm.herald import create_herald_a2a_adapter

   # Create A2A adapters for PM agents
   navi_adapter = create_navi_a2a_adapter(...)
   pulse_adapter = create_pulse_a2a_adapter(...)
   herald_adapter = create_herald_a2a_adapter(...)

   # Register A2A interfaces
   app.include_router(navi_adapter.create_a2a_interface("/a2a/navi").router)
   app.include_router(pulse_adapter.create_a2a_interface("/a2a/pulse").router)
   app.include_router(herald_adapter.create_a2a_interface("/a2a/herald").router)
   ```

**Files to Create:**
- `agents/pm/a2a_adapter.py`

**Files to Modify:**
- `agents/pm/navi.py`
- `agents/pm/pulse.py` (similar pattern)
- `agents/pm/herald.py` (similar pattern)
- `agents/main.py`

**Test Requirements:**
- Unit: A2A adapter wraps agent correctly
- Integration: PM agents respond to A2A Tasks
- Integration: Existing REST endpoints still work
- E2E: Agent responses properly formatted for A2A

**Definition of Done:**
- [ ] Navi, Pulse, Herald respond to A2A Tasks
- [ ] Existing REST endpoints unchanged
- [ ] A2A responses properly formatted
- [ ] No breaking changes to current PM workflows

---

### 3.6 Story DM-02.6: CCR Installation & Configuration (5 points)

**Objective:** Install and configure Claude Code Router for intelligent model routing.

**Implementation Tasks:**

1. **Create CCR setup documentation (`docs/guides/ccr-setup.md`):**
   ```markdown
   # CCR Setup Guide

   ## Prerequisites
   - Node.js 20+
   - Active CLI subscriptions (Claude, Gemini, etc.)

   ## Installation

   1. Clone CCR-custom:
   ```bash
   git clone https://github.com/VisionCraft3r/ccr-custom.git ~/.ccr
   cd ~/.ccr
   npm install
   ```

   2. Configure `~/.claude-code-router/config.json`:
   ```json
   {
     "port": 3456,
     "providers": {...},
     "routing": {...},
     "fallbacks": {...}
   }
   ```

   3. Start CCR:
   ```bash
   npm start
   ```
   ```

2. **Create CCR configuration template (`agents/config/ccr_config_template.json`):**
   ```json
   {
     "port": 3456,
     "providers": {
       "claude": {
         "type": "claude-cli",
         "base_url": "subscription"
       },
       "deepseek": {
         "type": "openai-compatible",
         "base_url": "https://api.deepseek.com/v1",
         "api_key_env": "DEEPSEEK_API_KEY"
       },
       "gemini": {
         "type": "gemini-cli",
         "base_url": "subscription"
       },
       "openrouter": {
         "type": "openai-compatible",
         "base_url": "https://openrouter.ai/api/v1",
         "api_key_env": "OPENROUTER_API_KEY"
       }
     },
     "routing": {
       "reasoning": "claude",
       "code_generation": "deepseek",
       "long_context": "gemini",
       "default": "claude"
     },
     "fallbacks": {
       "claude": ["deepseek", "gemini"],
       "deepseek": ["claude", "gemini"],
       "gemini": ["claude", "deepseek"]
     },
     "health_check": {
       "enabled": true,
       "interval_seconds": 30
     }
   }
   ```

3. **Create CCR health check service (`agents/services/ccr_health.py`):**
   ```python
   """CCR health monitoring service."""
   import asyncio
   import httpx
   from typing import Optional, Dict, Any
   import logging

   from agents.constants.dm_constants import DMConstants

   logger = logging.getLogger(__name__)


   class CCRHealthChecker:
       """Health checker for CCR service."""

       def __init__(self, ccr_url: str = None):
           self.ccr_url = ccr_url or f"http://localhost:{DMConstants.CCR.DEFAULT_PORT}"
           self._client: Optional[httpx.AsyncClient] = None
           self._is_healthy: bool = False
           self._last_check: Optional[Dict[str, Any]] = None

       async def check_health(self) -> Dict[str, Any]:
           """
           Check CCR health status.

           Returns:
               Health status with provider information
           """
           try:
               if not self._client:
                   self._client = httpx.AsyncClient(timeout=10.0)

               response = await self._client.get(f"{self.ccr_url}/health")

               if response.status_code == 200:
                   self._is_healthy = True
                   self._last_check = response.json()
                   return {
                       "status": "healthy",
                       "ccr_url": self.ccr_url,
                       **self._last_check,
                   }
               else:
                   self._is_healthy = False
                   return {
                       "status": "unhealthy",
                       "error": f"HTTP {response.status_code}",
                   }
           except Exception as e:
               self._is_healthy = False
               logger.warning(f"CCR health check failed: {e}")
               return {
                   "status": "unreachable",
                   "error": str(e),
               }

       @property
       def is_healthy(self) -> bool:
           return self._is_healthy

       async def close(self):
           if self._client:
               await self._client.aclose()


   # Singleton instance
   ccr_health = CCRHealthChecker()
   ```

4. **Add CCR settings to `agents/config.py`:**
   ```python
   # Add to Settings class
   ccr_enabled: bool = Field(default=False, env="CCR_ENABLED")
   ccr_url: str = Field(default="http://localhost:3456", env="CCR_URL")
   ccr_health_check_interval: int = Field(default=30, env="CCR_HEALTH_CHECK_INTERVAL")
   ```

**Files to Create:**
- `docs/guides/ccr-setup.md`
- `agents/config/ccr_config_template.json`
- `agents/services/ccr_health.py`

**Files to Modify:**
- `agents/config.py`

**Test Requirements:**
- Unit: Health checker handles connection errors gracefully
- Integration: CCR starts on configured port
- Integration: Health endpoint responds correctly
- Manual: Fallback chains trigger on simulated failure

**Definition of Done:**
- [ ] CCR starts successfully on configured port (default 3456)
- [ ] Provider connections verified via health endpoint
- [ ] Fallback chains documented and testable
- [ ] Health endpoint responds with provider status

---

### 3.7 Story DM-02.7: CCR-Agno Integration (5 points)

**Objective:** Integrate Agno agents with CCR routing layer.

**Implementation Tasks:**

1. **Create CCR model provider (`agents/models/ccr_provider.py`):**
   ```python
   """CCR model provider for Agno agents."""
   from typing import Optional, Dict, Any
   from agno.models.openai import OpenAIChat
   from agno.models.base import Model

   from agents.constants.dm_constants import DMConstants
   from agents.services.ccr_health import ccr_health
   from agents.config import get_settings

   settings = get_settings()


   class CCRModel(OpenAIChat):
       """
       Model that routes through CCR.

       CCR provides OpenAI-compatible API, so we extend OpenAIChat.
       """

       def __init__(
           self,
           model_id: str = "auto",
           task_type: Optional[str] = None,
           **kwargs,
       ):
           """
           Initialize CCR model.

           Args:
               model_id: Model to request, or "auto" for CCR routing
               task_type: Hint for CCR routing (reasoning, code, etc.)
               **kwargs: Additional OpenAI parameters
           """
           super().__init__(
               id=model_id,
               base_url=f"{settings.ccr_url}/v1",
               api_key="ccr-platform",  # CCR doesn't need real key
               **kwargs,
           )
           self.task_type = task_type

       def get_headers(self) -> Dict[str, str]:
           """Add CCR-specific headers for routing."""
           headers = super().get_headers() if hasattr(super(), 'get_headers') else {}
           if self.task_type:
               headers["X-CCR-Task-Type"] = self.task_type
           return headers


   def get_model_for_agent(
       agent_id: str,
       user_config: Optional[Dict[str, Any]] = None,
       task_type: Optional[str] = None,
   ) -> Model:
       """
       Get appropriate model for an agent.

       Implements hybrid mode: CCR vs BYOAI based on configuration.

       Args:
           agent_id: Agent identifier
           user_config: User's BYOAI configuration
           task_type: Task type hint for routing

       Returns:
           Configured model instance
       """
       # Check if CCR is enabled and healthy
       use_ccr = (
           settings.ccr_enabled
           and ccr_health.is_healthy
           and (not user_config or user_config.get("use_platform_subscription", False))
       )

       if use_ccr:
           return CCRModel(
               model_id="auto",
               task_type=task_type,
           )
       else:
           # Fall back to BYOAI
           from agents.providers import resolve_and_create_model
           return resolve_and_create_model(user_config)


   async def validate_ccr_connection() -> bool:
       """
       Validate CCR is available before agent startup.

       Returns:
           True if CCR is reachable
       """
       if not settings.ccr_enabled:
           return True  # Not using CCR, skip validation

       health = await ccr_health.check_health()
       return health.get("status") == "healthy"
   ```

2. **Create model selection utility (`agents/models/selector.py`):**
   ```python
   """Agent model selection logic."""
   from typing import Optional, Dict, Any
   from agno.models.base import Model

   from .ccr_provider import get_model_for_agent
   from agents.config import get_settings

   settings = get_settings()

   # Agent-specific model preferences
   AGENT_MODEL_PREFERENCES = {
       "dashboard_gateway": {"task_type": "reasoning"},
       "navi": {"task_type": "reasoning"},
       "sage": {"task_type": "code_generation"},
       "pulse": {"task_type": "reasoning"},
       "chrono": {"task_type": "reasoning"},
   }


   def select_model_for_agent(
       agent_id: str,
       user_config: Optional[Dict[str, Any]] = None,
       model_override: Optional[str] = None,
   ) -> Model:
       """
       Select the best model for an agent.

       Selection priority:
       1. Explicit model override
       2. User's BYOAI configuration
       3. CCR routing based on agent preferences
       4. Default model

       Args:
           agent_id: Agent identifier
           user_config: User's BYOAI configuration
           model_override: Explicit model override

       Returns:
           Selected model instance
       """
       prefs = AGENT_MODEL_PREFERENCES.get(agent_id, {})

       return get_model_for_agent(
           agent_id=agent_id,
           user_config=user_config,
           task_type=prefs.get("task_type"),
       )
   ```

3. **Update agent startup in `agents/main.py`:**
   ```python
   from models.ccr_provider import validate_ccr_connection

   @app.on_event("startup")
   async def startup_event():
       # ... existing startup code ...

       # Validate CCR if enabled
       if settings.ccr_enabled:
           ccr_ok = await validate_ccr_connection()
           if ccr_ok:
               logger.info("CCR connection validated")
           else:
               logger.warning("CCR not available, using BYOAI fallback")
   ```

**Files to Create:**
- `agents/models/__init__.py`
- `agents/models/ccr_provider.py`
- `agents/models/selector.py`

**Files to Modify:**
- `agents/main.py`

**Test Requirements:**
- Unit: CCR model initialization works
- Unit: Hybrid mode selects correct model source
- Integration: Agents can route through CCR
- Integration: BYOAI fallback works when CCR unavailable

**Definition of Done:**
- [ ] Agents can route requests through CCR
- [ ] Hybrid mode allows per-agent BYOAI or CCR selection
- [ ] CCR failures trigger automatic BYOAI fallback
- [ ] Agent startup validates CCR connection

---

### 3.8 Story DM-02.8: CCR Task-Based Routing (5 points)

**Objective:** Configure intelligent task-based routing through CCR.

**Implementation Tasks:**

1. **Create routing configuration (`agents/models/routing_config.py`):**
   ```python
   """CCR routing configuration."""
   from typing import Dict, Any, List
   from pydantic import BaseModel, Field

   from agents.constants.dm_constants import DMConstants


   class RoutingRule(BaseModel):
       """A CCR routing rule."""
       task_type: str
       primary_provider: str
       fallback_providers: List[str] = Field(default_factory=list)
       conditions: Dict[str, Any] = Field(default_factory=dict)


   class TransformerConfig(BaseModel):
       """Request/response transformer configuration."""
       provider: str
       request_transforms: List[str] = Field(default_factory=list)
       response_transforms: List[str] = Field(default_factory=list)


   # Default routing rules
   DEFAULT_ROUTING_RULES: List[RoutingRule] = [
       RoutingRule(
           task_type="reasoning",
           primary_provider="claude",
           fallback_providers=["deepseek", "gemini"],
       ),
       RoutingRule(
           task_type="code_generation",
           primary_provider="deepseek",
           fallback_providers=["claude", "gemini"],
       ),
       RoutingRule(
           task_type="long_context",
           primary_provider="gemini",
           fallback_providers=["claude", "deepseek"],
       ),
       RoutingRule(
           task_type="default",
           primary_provider="claude",
           fallback_providers=["deepseek", "gemini"],
       ),
   ]

   # Agent-specific routing overrides
   AGENT_ROUTING_OVERRIDES: Dict[str, str] = {
       "navi": "claude",       # Always use Claude for PM orchestration
       "sage": "deepseek",     # Use DeepSeek for code-heavy tasks
       "chrono": "claude",     # Use Claude for timeline reasoning
   }


   def get_routing_rule(task_type: str) -> RoutingRule:
       """Get routing rule for a task type."""
       for rule in DEFAULT_ROUTING_RULES:
           if rule.task_type == task_type:
               return rule
       return DEFAULT_ROUTING_RULES[-1]  # Default rule


   def get_agent_provider(agent_id: str) -> str:
       """Get preferred provider for an agent."""
       return AGENT_ROUTING_OVERRIDES.get(agent_id, "claude")
   ```

2. **Create routing decision logger (`agents/services/routing_logger.py`):**
   ```python
   """Logging for CCR routing decisions."""
   import logging
   from typing import Optional, Dict, Any
   from datetime import datetime
   import structlog

   logger = structlog.get_logger()


   def log_routing_decision(
       agent_id: str,
       task_type: str,
       selected_provider: str,
       fallback_triggered: bool = False,
       reason: Optional[str] = None,
   ):
       """
       Log a CCR routing decision for debugging.

       Args:
           agent_id: Agent making the request
           task_type: Type of task
           selected_provider: Provider that was selected
           fallback_triggered: Whether fallback was used
           reason: Optional reason for decision
       """
       logger.info(
           "ccr_routing_decision",
           agent_id=agent_id,
           task_type=task_type,
           provider=selected_provider,
           fallback=fallback_triggered,
           reason=reason,
           timestamp=datetime.utcnow().isoformat(),
       )


   def log_routing_failure(
       agent_id: str,
       provider: str,
       error: str,
       fallback_to: Optional[str] = None,
   ):
       """
       Log a routing failure.

       Args:
           agent_id: Agent that experienced failure
           provider: Provider that failed
           error: Error message
           fallback_to: Provider being used as fallback
       """
       logger.warning(
           "ccr_routing_failure",
           agent_id=agent_id,
           provider=provider,
           error=error,
           fallback_to=fallback_to,
           timestamp=datetime.utcnow().isoformat(),
       )
   ```

3. **Update CCR model with routing awareness:**
   ```python
   # Add to agents/models/ccr_provider.py
   from agents.services.routing_logger import log_routing_decision
   from agents.models.routing_config import get_routing_rule, get_agent_provider

   class CCRModel(OpenAIChat):
       # ... existing code ...

       def _log_routing(self, response_headers: Dict[str, str]):
           """Log routing decision from CCR response."""
           provider = response_headers.get("X-CCR-Provider")
           fallback = response_headers.get("X-CCR-Fallback", "false") == "true"

           if provider:
               log_routing_decision(
                   agent_id=self._agent_id,
                   task_type=self.task_type or "default",
                   selected_provider=provider,
                   fallback_triggered=fallback,
               )
   ```

**Files to Create:**
- `agents/models/routing_config.py`
- `agents/services/routing_logger.py`

**Files to Modify:**
- `agents/models/ccr_provider.py`

**Test Requirements:**
- Unit: Routing rules resolve correctly
- Unit: Agent overrides apply properly
- Integration: Tasks route to expected providers
- Integration: Routing decisions logged correctly

**Definition of Done:**
- [ ] Tasks route to appropriate providers by type
- [ ] Per-agent model overrides work
- [ ] Transformers correctly adapt request/response formats (if used)
- [ ] Routing decisions logged for debugging

---

### 3.9 Story DM-02.9: CCR Usage Monitoring & Alerts (5 points)

**Objective:** Implement usage tracking and quota notifications for CCR.

**Implementation Tasks:**

1. **Create usage tracking service (`agents/services/ccr_usage.py`):**
   ```python
   """CCR usage tracking and quota monitoring."""
   from typing import Dict, Any, Optional
   from datetime import datetime, timedelta
   from pydantic import BaseModel, Field
   import logging

   from agents.constants.dm_constants import DMConstants

   logger = logging.getLogger(__name__)


   class ProviderUsage(BaseModel):
       """Usage statistics for a provider."""
       provider: str
       calls_today: int = 0
       calls_this_month: int = 0
       tokens_today: int = 0
       tokens_this_month: int = 0
       last_call: Optional[datetime] = None
       quota_limit: Optional[int] = None
       quota_used: float = 0.0  # 0.0 to 1.0


   class UsageAlert(BaseModel):
       """Usage alert notification."""
       provider: str
       alert_type: str  # "warning", "critical"
       threshold: float
       current_usage: float
       message: str
       created_at: datetime = Field(default_factory=datetime.utcnow)


   class CCRUsageTracker:
       """
       Tracks CCR usage across providers.

       Note: In production, this would persist to database.
       This implementation uses in-memory storage for demo.
       """

       def __init__(self):
           self._usage: Dict[str, ProviderUsage] = {}
           self._alerts: list[UsageAlert] = []

       def record_call(
           self,
           provider: str,
           tokens: int = 0,
           success: bool = True,
       ):
           """
           Record an API call.

           Args:
               provider: Provider name
               tokens: Tokens used (if known)
               success: Whether call succeeded
           """
           if provider not in self._usage:
               self._usage[provider] = ProviderUsage(provider=provider)

           usage = self._usage[provider]
           usage.calls_today += 1
           usage.calls_this_month += 1
           usage.tokens_today += tokens
           usage.tokens_this_month += tokens
           usage.last_call = datetime.utcnow()

           # Update quota percentage
           if usage.quota_limit:
               usage.quota_used = usage.calls_this_month / usage.quota_limit

           # Check thresholds
           self._check_thresholds(provider)

       def _check_thresholds(self, provider: str):
           """Check usage thresholds and create alerts."""
           usage = self._usage.get(provider)
           if not usage or not usage.quota_limit:
               return

           # Warning threshold
           if usage.quota_used >= DMConstants.CCR.QUOTA_WARNING_THRESHOLD:
               self._create_alert(
                   provider=provider,
                   alert_type="warning",
                   threshold=DMConstants.CCR.QUOTA_WARNING_THRESHOLD,
                   current=usage.quota_used,
               )

           # Critical threshold
           if usage.quota_used >= DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD:
               self._create_alert(
                   provider=provider,
                   alert_type="critical",
                   threshold=DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD,
                   current=usage.quota_used,
               )

       def _create_alert(
           self,
           provider: str,
           alert_type: str,
           threshold: float,
           current: float,
       ):
           """Create a usage alert."""
           alert = UsageAlert(
               provider=provider,
               alert_type=alert_type,
               threshold=threshold,
               current_usage=current,
               message=f"{provider} usage at {current:.1%} (threshold: {threshold:.0%})",
           )
           self._alerts.append(alert)
           logger.warning(f"CCR Usage Alert: {alert.message}")

       def get_usage(self, provider: Optional[str] = None) -> Dict[str, Any]:
           """Get usage statistics."""
           if provider:
               usage = self._usage.get(provider)
               return usage.model_dump() if usage else {}
           return {p: u.model_dump() for p, u in self._usage.items()}

       def get_alerts(self, since: Optional[datetime] = None) -> list[UsageAlert]:
           """Get recent alerts."""
           if since:
               return [a for a in self._alerts if a.created_at >= since]
           return self._alerts.copy()


   # Singleton instance
   usage_tracker = CCRUsageTracker()
   ```

2. **Create metrics endpoint (`agents/endpoints/metrics.py`):**
   ```python
   """CCR metrics endpoints."""
   from fastapi import APIRouter, Query
   from typing import Optional
   from datetime import datetime, timedelta

   from agents.services.ccr_usage import usage_tracker
   from agents.services.ccr_health import ccr_health

   router = APIRouter(prefix="/metrics", tags=["metrics"])


   @router.get("/ccr/usage")
   async def get_ccr_usage(provider: Optional[str] = None):
       """Get CCR usage statistics."""
       return {
           "usage": usage_tracker.get_usage(provider),
           "timestamp": datetime.utcnow().isoformat(),
       }


   @router.get("/ccr/alerts")
   async def get_ccr_alerts(
       hours: int = Query(default=24, ge=1, le=168),
   ):
       """Get CCR usage alerts from last N hours."""
       since = datetime.utcnow() - timedelta(hours=hours)
       alerts = usage_tracker.get_alerts(since)
       return {
           "alerts": [a.model_dump() for a in alerts],
           "count": len(alerts),
           "period_hours": hours,
       }


   @router.get("/ccr/status")
   async def get_ccr_status():
       """Get combined CCR status."""
       health = await ccr_health.check_health()
       usage = usage_tracker.get_usage()

       return {
           "health": health,
           "usage": usage,
           "timestamp": datetime.utcnow().isoformat(),
       }
   ```

3. **Add metrics router to `agents/main.py`:**
   ```python
   from endpoints.metrics import router as metrics_router

   app.include_router(metrics_router)
   ```

**Files to Create:**
- `agents/services/ccr_usage.py`
- `agents/endpoints/__init__.py`
- `agents/endpoints/metrics.py`

**Files to Modify:**
- `agents/main.py`

**Test Requirements:**
- Unit: Usage tracking increments correctly
- Unit: Alerts trigger at correct thresholds
- Integration: Metrics endpoint returns valid data
- Integration: Alerts accessible via API

**Definition of Done:**
- [ ] API calls tracked per provider
- [ ] Alerts trigger at configurable thresholds (80%, 95%)
- [ ] Notifications logged (webhook integration future work)
- [ ] Usage data available via `/metrics/ccr/usage` endpoint

---

## 4. Constants Reference

All magic numbers MUST be defined in `agents/constants/dm_constants.py`:

```python
# agents/constants/dm_constants.py

class DMConstants:
    """Dynamic Module System constants - no magic numbers in code."""

    # AgentOS Configuration
    class AGENTOS:
        DEFAULT_PORT = 8000
        WORKER_COUNT = 4
        REQUEST_TIMEOUT_SECONDS = 30
        KEEP_ALIVE_SECONDS = 65
        MAX_CONCURRENT_TASKS = 100

    # A2A Protocol
    class A2A:
        PROTOCOL_VERSION = "0.3.0"
        TASK_TIMEOUT_SECONDS = 300
        MAX_TASK_QUEUE_SIZE = 1000
        AGENT_DISCOVERY_CACHE_TTL_SECONDS = 300
        HEARTBEAT_INTERVAL_SECONDS = 30
        MAX_MESSAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

    # AG-UI Protocol
    class AGUI:
        PROTOCOL_VERSION = "0.1.0"
        STREAM_CHUNK_SIZE_BYTES = 4096
        MAX_STREAM_DURATION_SECONDS = 600
        TOOL_CALL_TIMEOUT_SECONDS = 60
        MAX_TOOL_CALLS_PER_REQUEST = 50

    # CCR Configuration
    class CCR:
        DEFAULT_PORT = 3456
        HEALTH_CHECK_INTERVAL_SECONDS = 30
        PROVIDER_TIMEOUT_SECONDS = 60
        MAX_RETRIES = 3
        RETRY_BACKOFF_MULTIPLIER = 2.0
        QUOTA_WARNING_THRESHOLD = 0.8
        QUOTA_CRITICAL_THRESHOLD = 0.95

    # Dashboard Agent
    class DASHBOARD:
        MAX_WIDGETS_PER_REQUEST = 12
        WIDGET_DATA_TTL_SECONDS = 60
        CACHE_SIZE_MB = 100
        CONCURRENT_AGENT_CALLS = 5

    # Performance Targets
    class PERFORMANCE:
        P50_RESPONSE_TARGET_MS = 200
        P95_RESPONSE_TARGET_MS = 500
        P99_RESPONSE_TARGET_MS = 1000
        MAX_MEMORY_MB = 512
```

**File Location:** `agents/constants/dm_constants.py`

---

## 5. Testing Strategy

### 5.1 Unit Test Requirements

| Story | Test Focus | Minimum Coverage |
|-------|------------|------------------|
| DM-02.1 | Protocol imports | 100% |
| DM-02.2 | Interface factory, config | 85% |
| DM-02.3 | AgentCard generation | 90% |
| DM-02.4 | Dashboard agent, tools | 85% |
| DM-02.5 | A2A adapters | 80% |
| DM-02.6 | Health checker | 85% |
| DM-02.7 | CCR provider, model selection | 85% |
| DM-02.8 | Routing rules | 90% |
| DM-02.9 | Usage tracking, alerts | 85% |

**Test File Locations:**
```
agents/tests/
├── test_interfaces/
│   ├── test_config.py
│   └── test_factory.py
├── test_a2a/
│   └── test_agent_card.py
├── test_dashboard/
│   └── test_agent.py
├── test_models/
│   ├── test_ccr_provider.py
│   └── test_routing.py
├── test_services/
│   ├── test_ccr_health.py
│   └── test_ccr_usage.py
└── test_pm/
    └── test_a2a_adapter.py
```

### 5.2 Integration Test Approach

**Focus Areas:**
1. Multi-interface AgentOS starts correctly
2. AG-UI endpoint accepts streaming requests
3. A2A endpoint accepts JSON-RPC requests
4. AgentCard discovery returns valid responses
5. CCR routing decisions match expectations

**Mock Strategy:**
```python
# tests/mocks/ccr_mock.py
class MockCCRServer:
    """Mock CCR server for testing."""

    def __init__(self, port: int = 3456):
        self.port = port
        self.calls = []

    async def handle_completion(self, request):
        self.calls.append(request)
        return MockCompletion(content="Mock response")
```

### 5.3 Load Testing

**Scenarios:**
| Scenario | Concurrent Users | Duration | Target |
|----------|-----------------|----------|--------|
| A2A Tasks | 50 | 5 min | P95 < 500ms |
| AG-UI Streams | 20 | 5 min | TTFB < 100ms |
| Mixed Load | 30/15 | 10 min | No errors |

**Tool:** Locust or k6

### 5.4 Contract Tests

**A2A Protocol Compliance:**
```python
# tests/contract/test_a2a_compliance.py
def test_agent_card_schema():
    """Verify AgentCard matches A2A spec."""
    response = client.get("/.well-known/agent.json")
    schema = load_a2a_schema()
    validate(response.json(), schema)

def test_task_lifecycle():
    """Verify task state transitions."""
    task = create_task()
    assert task.status == "submitted"
    await task.wait()
    assert task.status in ["completed", "failed"]
```

---

## 6. Migration Notes

### 6.1 Impact on Existing Agents

| Agent | Changes Required | Backward Compatible |
|-------|-----------------|---------------------|
| ApprovalAgent | None | Yes |
| ValidationTeam | Add A2A registration | Yes |
| PlanningTeam | Add A2A registration | Yes |
| BrandingTeam | Add A2A registration | Yes |
| PM Agents | Add A2A adapter | Yes |

### 6.2 Backward Compatibility Requirements

1. **Existing REST endpoints MUST continue working:**
   - `/agents/approval/runs`
   - `/agents/validation/runs`
   - `/agents/planning/runs`
   - `/agents/branding/runs`

2. **Existing team execution logic unchanged:**
   - BYOAI provider resolution
   - Token limit enforcement
   - Rate limiting

3. **Configuration migration:**
   - New CCR settings are optional (default: disabled)
   - Existing `.env` continues working

### 6.3 Rollback Plan

If issues discovered post-deployment:

1. Set `CCR_ENABLED=false` to disable CCR
2. A2A endpoints can be disabled via feature flag
3. AG-UI endpoint can be disabled without affecting REST

---

## 7. Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **A2A Task Latency (P50)** | <200ms | <500ms | Task completion time |
| **A2A Task Latency (P95)** | <500ms | <1000ms | Task completion time |
| **AG-UI Time to First Token** | <100ms | <300ms | Stream start |
| **AgentCard Discovery** | <50ms | <100ms | JSON response time |
| **Memory per Agent** | <100MB | <200MB | Heap measurement |
| **Concurrent Tasks** | >50 | >20 | Load test |

---

## 8. Observability Requirements

### 8.1 Structured Logging

```python
import structlog

logger = structlog.get_logger()

# Required log fields for A2A tasks
logger.info(
    "a2a_task_completed",
    task_id=task.id,
    agent=agent.name,
    duration_ms=duration,
    status="success",
)
```

### 8.2 Prometheus Metrics

```python
from prometheus_client import Counter, Histogram

a2a_tasks_total = Counter(
    "dm_a2a_tasks_total",
    "Total A2A tasks",
    ["agent", "status"]
)

a2a_task_duration = Histogram(
    "dm_a2a_task_duration_seconds",
    "A2A task duration",
    ["agent"]
)

ccr_routing_total = Counter(
    "dm_ccr_routing_total",
    "CCR routing decisions",
    ["provider", "fallback"]
)
```

---

## 9. Risk Mitigation

### 9.1 Protocol Version Compatibility

**Risk:** Agno, AG-UI, A2A versions may have breaking changes.

**Mitigation:**
- Pin specific versions in pyproject.toml
- Test protocol handshake on startup
- Log protocol versions in health endpoint

### 9.2 Performance Overhead

**Risk:** Multiple interfaces may add latency.

**Mitigation:**
- Interface selection happens once at startup
- Routing overhead is minimal (header-based)
- Load test before production deployment

### 9.3 CCR Availability

**Risk:** CCR service may be unavailable.

**Mitigation:**
- Health check validates CCR before use
- Automatic fallback to BYOAI
- Graceful degradation (agents work without CCR)

### 9.4 N+1 Query Prevention

**Risk:** Dashboard aggregation may cause N+1 patterns.

**Mitigation:**
```python
# BAD - N+1 query pattern
for widget in widgets:
    data = await fetch_widget_data(widget.id)

# GOOD - Batch fetch
widget_ids = [w.id for w in widgets]
data_map = await fetch_widget_data_batch(widget_ids)
```

**Code Review Checklist:** Verify no database calls inside loops.

---

## 10. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| All agents accessible via A2A | Discovery returns all cards | Pass |
| Dashboard accessible via AG-UI | Stream test passes | Pass |
| A2A discovery working | External agent can discover | Pass |
| CCR routing functional | Requests route correctly | Pass |
| CCR monitoring active | Metrics endpoint returns data | Pass |
| No regressions | Existing tests pass | Pass |
| Performance targets met | Load test results | Pass |

---

## 11. References

- [Epic DM-02 Definition](./epic-dm-02-agno-multiinterface.md)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Remote Coding Agent Patterns (CCR)](../../architecture/remote-coding-agent-patterns.md)
- [Epic DM-01 Tech Spec](./epic-dm-01-tech-spec.md)
- [Agno Documentation](https://docs.agno.com)
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)
- [CCR-Custom Fork](https://github.com/VisionCraft3r/ccr-custom)

---

*Generated: 2025-12-29*
*Epic: DM-02 | Phase: 2 | Stories: 9 | Points: 51*
