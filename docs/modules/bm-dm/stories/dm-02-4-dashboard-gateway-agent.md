# Story DM-02.4: Dashboard Gateway Agent

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 8
**Status:** done
**Priority:** High (core integration story)
**Dependencies:** DM-02.2 (Complete - AgentOS Multi-Interface Setup), DM-02.3 (Complete - A2A AgentCard Discovery)

---

## Overview

Create the Dashboard Gateway Agent - the primary interface between the frontend CopilotKit and the backend agent system. This agent handles AG-UI streaming for frontend communication and A2A for orchestrating other agents.

The Dashboard Gateway is the cornerstone of the Dynamic Module System, serving as the single entry point for all frontend agent interactions while enabling backend agent coordination. It is the only agent with both AG-UI (for CopilotKit) and A2A (for backend agents) interfaces enabled.

This story delivers:
- Dashboard Gateway agent with Agno Agent class and tool definitions
- AG-UI interface integration for CopilotKit streaming
- A2A interface integration for agent orchestration
- Interface routers mounted on the existing FastAPI app in `main.py`
- Gateway-specific tools: `render_dashboard_widget`, `get_dashboard_capabilities`, `route_to_agent`
- Unit tests verifying agent creation and interface integration

The Dashboard Gateway created here will be used by:
- CopilotKit frontend (via AG-UI at `/agui`)
- PM agents and future module agents (via A2A at `/a2a/dashboard`)
- Widget rendering pipeline (DM-03)

---

## Acceptance Criteria

- [ ] **AC1:** Dashboard Gateway Agent created with proper tool definitions using Agno Agent class
- [ ] **AC2:** AG-UI interface integrated for CopilotKit streaming at `/agui` endpoint
- [ ] **AC3:** A2A interface integrated for agent orchestration at `/a2a/dashboard` endpoint
- [ ] **AC4:** Interfaces mounted on existing FastAPI app in `agents/main.py`
- [ ] **AC5:** Gateway tools implemented: `render_dashboard_widget`, `get_dashboard_capabilities`, `route_to_agent`
- [ ] **AC6:** Unit tests verify agent creation, tool functionality, and interface integration

---

## Technical Approach

### Architecture Decision

The Dashboard Gateway is the integration point that brings together:
1. **AG-UI Protocol** - For streaming communication with CopilotKit frontend
2. **A2A Protocol** - For orchestrating backend specialist agents (Navi, Pulse, Herald)
3. **Tool-Based Widget Rendering** - Tool calls are intercepted by CopilotKit's `useRenderToolCall`

### Agent Design

From the tech spec (Section 3.4), the Dashboard Gateway:
- Uses Agno's `Agent` class with tool definitions
- Has both AG-UI and A2A interfaces enabled (per INTERFACE_CONFIGS)
- Renders widgets via tool calls that CopilotKit intercepts
- Coordinates with PM agents via A2A for data gathering

### File Structure

```
agents/
├── gateway/                        # NEW: Gateway agent module
│   ├── __init__.py
│   ├── agent.py                    # Dashboard Gateway agent definition
│   └── tools.py                    # Gateway tool definitions
├── agentos/
│   ├── config.py                   # Existing - INTERFACE_CONFIGS (dashboard_gateway)
│   └── factory.py                  # Existing - interface factory
├── a2a/
│   └── discovery.py                # Existing - discovery router
├── constants/
│   └── dm_constants.py             # Existing - DMConstants.DASHBOARD
└── main.py                         # Modified - mount AGUI/A2A routers
```

---

## Implementation Tasks

### Task 1: Create Gateway Tools Module (2 points)

Define the tools that the Dashboard Gateway agent will use. These tools follow the Agno `@tool` decorator pattern.

**File:** `agents/gateway/tools.py`

```python
"""
Dashboard Gateway Tools

Tool definitions for the Dashboard Gateway agent. These tools enable:
- Widget rendering via CopilotKit's useRenderToolCall
- Capability discovery for frontend
- Agent routing for backend orchestration

All tools are designed to be intercepted by CopilotKit on the frontend,
where tool calls are rendered as React components.
"""
from typing import Optional, Dict, Any, List
from agno.tools import tool

from constants.dm_constants import DMConstants


# Widget types that can be rendered
# These correspond to React components registered in the frontend widget registry
WIDGET_TYPES = [
    "ProjectStatus",
    "TaskList",
    "Metrics",
    "Alert",
    "KanbanBoard",
    "GanttChart",
    "BurndownChart",
    "TeamActivity",
]


@tool
def render_dashboard_widget(
    widget_type: str,
    data: Dict[str, Any],
    title: Optional[str] = None,
    slot_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Render a widget on the user's dashboard.

    This tool call is intercepted by CopilotKit's useRenderToolCall
    on the frontend and rendered as a React component from the widget registry.

    Args:
        widget_type: Widget type identifier. One of: ProjectStatus, TaskList,
                     Metrics, Alert, KanbanBoard, GanttChart, BurndownChart, TeamActivity
        data: Widget-specific data payload that will be passed to the React component
        title: Optional widget title override (uses default if not provided)
        slot_id: Optional slot identifier for targeted placement (e.g., "main", "sidebar")

    Returns:
        Widget specification for frontend rendering including:
        - type: The widget type identifier
        - data: The data payload
        - title: The display title
        - slot_id: Target slot for placement
        - rendered: Boolean indicating successful tool execution

    Example:
        >>> render_dashboard_widget(
        ...     widget_type="ProjectStatus",
        ...     data={"project_id": "proj_123", "status": "on_track", "progress": 75},
        ...     title="Project Alpha Status"
        ... )
    """
    if widget_type not in WIDGET_TYPES:
        return {
            "error": f"Unknown widget type: {widget_type}",
            "available_types": WIDGET_TYPES,
            "rendered": False,
        }

    return {
        "type": widget_type,
        "data": data,
        "title": title,
        "slot_id": slot_id,
        "rendered": True,
    }


@tool
def get_dashboard_capabilities() -> Dict[str, Any]:
    """
    Get available dashboard capabilities.

    Returns information about what the dashboard can do, including
    available widget types, features, and configuration limits.
    This is useful for agents to understand what visualizations
    are available before making render decisions.

    Returns:
        Dictionary containing:
        - widget_types: List of available widget type identifiers
        - max_widgets_per_request: Maximum widgets that can be rendered per request
        - features: List of enabled dashboard features
        - slots: Available slot targets for widget placement
    """
    return {
        "widget_types": WIDGET_TYPES,
        "max_widgets_per_request": DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST,
        "features": [
            "streaming",
            "tool_calls",
            "a2a_orchestration",
            "slot_targeting",
            "widget_caching",
        ],
        "slots": [
            {"id": "main", "description": "Primary content area"},
            {"id": "sidebar", "description": "Sidebar panel"},
            {"id": "header", "description": "Header notification area"},
        ],
    }


@tool
def route_to_agent(
    agent_id: str,
    message: str,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Route a request to a specialist agent via A2A protocol.

    This tool enables the Dashboard Gateway to orchestrate other agents,
    delegating specialized tasks to the appropriate agent (e.g., Navi for
    project context, Pulse for health metrics, Herald for notifications).

    Note: Actual A2A communication is handled by the agent runtime.
    This tool returns the routing intent for the orchestration layer.

    Args:
        agent_id: Target agent identifier. One of: navi, pulse, herald
        message: The message/task to send to the agent
        context: Optional context dictionary with additional information
                 (e.g., workspace_id, project_id, user preferences)

    Returns:
        Routing specification containing:
        - target_agent: The agent_id being routed to
        - message: The message to send
        - context: Any additional context
        - status: "pending" indicating routing intent

    Example:
        >>> route_to_agent(
        ...     agent_id="navi",
        ...     message="Get current status for Project Alpha",
        ...     context={"project_id": "proj_123"}
        ... )
    """
    valid_agents = ["navi", "pulse", "herald"]

    if agent_id not in valid_agents:
        return {
            "error": f"Unknown agent: {agent_id}",
            "available_agents": valid_agents,
            "status": "failed",
        }

    return {
        "target_agent": agent_id,
        "message": message,
        "context": context or {},
        "status": "pending",
    }


def get_all_tools() -> List:
    """
    Get all Dashboard Gateway tools.

    Returns:
        List of tool functions for agent registration
    """
    return [
        render_dashboard_widget,
        get_dashboard_capabilities,
        route_to_agent,
    ]
```

---

### Task 2: Create Dashboard Gateway Agent (3 points)

Create the Dashboard Gateway agent using Agno's Agent class.

**File:** `agents/gateway/agent.py`

```python
"""
Dashboard Gateway Agent

The Dashboard Gateway is the primary interface between the frontend CopilotKit
and the backend agent system. It orchestrates dashboard widgets by coordinating
with specialist agents and rendering visual components.

Key Responsibilities:
1. UNDERSTAND user requests about their workspace, projects, or business
2. ORCHESTRATE data gathering from specialist agents via A2A
3. RENDER visual widgets on the user's dashboard

This agent has BOTH interfaces enabled:
- AG-UI: For CopilotKit frontend streaming (at /agui)
- A2A: For backend agent orchestration (at /a2a/dashboard)
"""
from typing import Optional, Dict, Any
import logging

from agno.agent import Agent
from agno.models.anthropic import Claude

from constants.dm_constants import DMConstants
from .tools import get_all_tools, WIDGET_TYPES

logger = logging.getLogger(__name__)


# Dashboard agent system instructions
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
- For complex requests, gather data from specialist agents first using route_to_agent

## Widget Types Available

- ProjectStatus: Show project progress, status, health indicators
- TaskList: Show lists of tasks with filters, priorities, assignments
- Metrics: Show numerical KPIs with trends and comparisons
- Alert: Show important notifications or warnings
- KanbanBoard: Show task boards with columns and cards
- GanttChart: Show timeline views of project schedules
- BurndownChart: Show sprint progress over time
- TeamActivity: Show recent team member activities

## Agent Routing

You can route to specialist agents for data:
- navi: Project context, planning, task management
- pulse: Project health, metrics, deadlines, risk analysis
- herald: Notifications, communication, status updates

## Response Format

1. Brief acknowledgment of the request (1-2 sentences max)
2. One or more widget renders using render_dashboard_widget
3. Optional follow-up suggestion or question

## Example Interactions

User: "How is Project Alpha doing?"
You: "Here's the current status for Project Alpha:"
[render ProjectStatus widget]
"Would you like to see the task breakdown as well?"

User: "Show me my tasks"
You: "Here are your current tasks:"
[render TaskList widget with user's tasks]

User: "What's at risk this sprint?"
You: "Let me check with Pulse for risk analysis."
[route_to_agent to pulse for risk data]
[render Alert widget with risk items]
[render Metrics widget with sprint health]

## Important Guidelines

- Do NOT produce long text responses - use widgets instead
- Always include relevant data in widget payloads
- Use appropriate widget types for the information being displayed
- When uncertain about data, route to the appropriate specialist agent
- Respect max_widgets_per_request limit from get_dashboard_capabilities
"""


def create_dashboard_gateway_agent(
    workspace_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Agent:
    """
    Create a Dashboard Gateway agent instance.

    The Dashboard Gateway is configured with:
    - AG-UI interface for CopilotKit streaming
    - A2A interface for backend agent orchestration
    - Tool definitions for widget rendering and agent routing

    Args:
        workspace_id: Optional workspace/tenant identifier for context.
                      Will be injected into instructions for multi-tenant isolation.
        model_id: Optional model identifier override.
                  Defaults to Claude Sonnet for cost-effective reasoning.
        user_id: Optional user identifier for personalization.

    Returns:
        Configured Dashboard Gateway Agent instance ready for interface mounting.

    Example:
        >>> agent = create_dashboard_gateway_agent(
        ...     workspace_id="ws_123",
        ...     user_id="user_456"
        ... )
        >>> # Agent is ready to be mounted via AGUI and A2A interfaces
    """
    # Build context-aware instructions
    instructions = [DASHBOARD_INSTRUCTIONS]

    if workspace_id:
        instructions.append(f"\nCurrent Workspace: {workspace_id}")

    if user_id:
        instructions.append(f"Current User: {user_id}")

    # Add available widget types for reference
    instructions.append(f"\nAvailable Widget Types: {', '.join(WIDGET_TYPES)}")

    agent = Agent(
        name="dashboard_gateway",
        role="Dashboard Gateway",
        description="Orchestrates dashboard widgets by coordinating with specialist agents and rendering visual components for the HYVVE platform",
        model=Claude(id=model_id or "claude-sonnet-4-20250514"),
        instructions=instructions,
        tools=get_all_tools(),
        add_datetime_to_instructions=True,
        markdown=True,
        show_tool_calls=True,
    )

    logger.info(
        f"Created Dashboard Gateway agent (workspace={workspace_id}, model={model_id or 'default'})"
    )

    return agent


def get_agent_metadata() -> Dict[str, Any]:
    """
    Get metadata about the Dashboard Gateway agent.

    Useful for registration, discovery, and health checks.

    Returns:
        Dictionary with agent metadata including:
        - name: Agent identifier
        - description: Human-readable description
        - tools: List of available tool names
        - interfaces: Enabled protocol interfaces
        - widget_types: Available widget types
    """
    return {
        "name": "dashboard_gateway",
        "description": "Dashboard Gateway agent for HYVVE - orchestrates dashboard widgets",
        "tools": [
            "render_dashboard_widget",
            "get_dashboard_capabilities",
            "route_to_agent",
        ],
        "interfaces": {
            "agui": {
                "enabled": True,
                "path": "/agui",
            },
            "a2a": {
                "enabled": True,
                "path": "/a2a/dashboard",
            },
        },
        "widget_types": WIDGET_TYPES,
        "constants": {
            "max_widgets_per_request": DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST,
            "widget_data_ttl_seconds": DMConstants.DASHBOARD.WIDGET_DATA_TTL_SECONDS,
        },
    }
```

---

### Task 3: Create Gateway Module Init (0.5 points)

Create the gateway module initialization with exports.

**File:** `agents/gateway/__init__.py`

```python
"""
Dashboard Gateway Module

The Dashboard Gateway is the primary interface between the frontend CopilotKit
and the backend agent system. It provides:

- AG-UI interface for CopilotKit streaming communication
- A2A interface for backend agent orchestration
- Widget rendering tools for visual dashboard components
- Agent routing for specialist delegation

Usage:
    from gateway import create_dashboard_gateway_agent, get_agent_metadata

    # Create agent instance
    agent = create_dashboard_gateway_agent(workspace_id="ws_123")

    # Mount interfaces (done in main.py)
    from agentos.factory import create_agui_interface, create_a2a_interface
    agui = create_agui_interface(agent, "/agui")
    a2a = create_a2a_interface(agent, "/a2a/dashboard")
"""
from .agent import (
    create_dashboard_gateway_agent,
    get_agent_metadata,
    DASHBOARD_INSTRUCTIONS,
)
from .tools import (
    render_dashboard_widget,
    get_dashboard_capabilities,
    route_to_agent,
    get_all_tools,
    WIDGET_TYPES,
)

__all__ = [
    # Agent
    "create_dashboard_gateway_agent",
    "get_agent_metadata",
    "DASHBOARD_INSTRUCTIONS",
    # Tools
    "render_dashboard_widget",
    "get_dashboard_capabilities",
    "route_to_agent",
    "get_all_tools",
    "WIDGET_TYPES",
]
```

---

### Task 4: Mount Interfaces on FastAPI App (1.5 points)

Update `agents/main.py` to mount the AG-UI and A2A interface routers.

**File:** `agents/main.py` (modifications to add)

```python
# Add to imports section:
from gateway import create_dashboard_gateway_agent, get_agent_metadata
from agentos import (
    create_agui_interface,
    create_a2a_interface,
    get_interface_config,
    get_agentos_settings,
)
from a2a.discovery import router as discovery_router

# Add after app creation and before existing routes:

# =============================================================================
# Dashboard Gateway Agent Setup
# =============================================================================

# Global reference to the dashboard agent (created on startup)
_dashboard_agent = None
_dashboard_interfaces = {}


def get_dashboard_agent():
    """Get the Dashboard Gateway agent instance."""
    global _dashboard_agent
    if _dashboard_agent is None:
        raise RuntimeError("Dashboard agent not initialized. Wait for startup.")
    return _dashboard_agent


@app.on_event("startup")
async def startup_dashboard_gateway():
    """
    Initialize Dashboard Gateway agent and mount interfaces on startup.

    This creates the agent instance and mounts both AG-UI and A2A routers
    according to the INTERFACE_CONFIGS from agentos/config.py.
    """
    global _dashboard_agent, _dashboard_interfaces

    settings = get_agentos_settings()
    config = get_interface_config("dashboard_gateway")

    if not config:
        logger.warning("No interface config found for dashboard_gateway")
        return

    # Create the Dashboard Gateway agent
    _dashboard_agent = create_dashboard_gateway_agent(
        workspace_id="system",  # Default workspace, overridden per-request
    )
    logger.info("Dashboard Gateway agent created")

    # Mount AG-UI interface if enabled
    if config.agui_enabled and config.agui_path and settings.agui_enabled:
        try:
            agui_interface = create_agui_interface(
                agent=_dashboard_agent,
                path=config.agui_path,
                timeout_seconds=config.get_agui_timeout(),
            )
            _dashboard_interfaces["agui"] = agui_interface
            # Mount the router
            app.include_router(
                agui_interface.router,
                tags=["ag-ui"],
            )
            logger.info(f"AG-UI interface mounted at {config.agui_path}")
        except Exception as e:
            logger.error(f"Failed to mount AG-UI interface: {e}")

    # Mount A2A interface if enabled
    if config.a2a_enabled and config.a2a_path and settings.a2a_enabled:
        try:
            a2a_interface = create_a2a_interface(
                agent=_dashboard_agent,
                path=config.a2a_path,
                timeout_seconds=config.get_a2a_timeout(),
            )
            _dashboard_interfaces["a2a"] = a2a_interface
            # Mount the router
            app.include_router(
                a2a_interface.router,
                tags=["a2a"],
            )
            logger.info(f"A2A interface mounted at {config.a2a_path}")
        except Exception as e:
            logger.error(f"Failed to mount A2A interface: {e}")


# Mount A2A discovery endpoints (from DM-02.3)
app.include_router(discovery_router)
logger.info("A2A discovery endpoints mounted")


# =============================================================================
# Dashboard Gateway Health Endpoint
# =============================================================================

@app.get(
    "/agents/dashboard/health",
    tags=["health"],
    summary="Dashboard Gateway Health",
)
async def dashboard_gateway_health():
    """
    Health check endpoint for the Dashboard Gateway agent.

    Returns agent status, mounted interfaces, and metadata.
    """
    global _dashboard_agent, _dashboard_interfaces

    if _dashboard_agent is None:
        return {
            "status": "not_initialized",
            "agent": None,
            "interfaces": {},
        }

    metadata = get_agent_metadata()

    return {
        "status": "healthy",
        "agent": {
            "name": metadata["name"],
            "description": metadata["description"],
            "tools": metadata["tools"],
        },
        "interfaces": {
            name: {
                "mounted": True,
                "path": iface.path if hasattr(iface, "path") else "unknown",
            }
            for name, iface in _dashboard_interfaces.items()
        },
        "widget_types": metadata["widget_types"],
    }
```

---

### Task 5: Create Unit Tests (1 point)

Create comprehensive tests for the Dashboard Gateway agent and interface integration.

**File:** `agents/tests/test_dm_02_4_dashboard_gateway.py`

```python
"""
Tests for DM-02.4: Dashboard Gateway Agent

Verifies Dashboard Gateway agent creation, tool functionality,
and interface integration.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any

# Test tool functions directly (no Agno dependency needed)


class TestGatewayTools:
    """Test suite for Dashboard Gateway tools."""

    def test_render_dashboard_widget_valid_type(self):
        """Verify render_dashboard_widget accepts valid widget types."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="ProjectStatus",
            data={"project_id": "proj_123", "progress": 75},
            title="Test Widget",
        )

        assert result["rendered"] is True
        assert result["type"] == "ProjectStatus"
        assert result["data"]["project_id"] == "proj_123"
        assert result["title"] == "Test Widget"

    def test_render_dashboard_widget_invalid_type(self):
        """Verify render_dashboard_widget rejects invalid widget types."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="InvalidWidget",
            data={"test": "data"},
        )

        assert result["rendered"] is False
        assert "error" in result
        assert "available_types" in result

    def test_render_dashboard_widget_with_slot(self):
        """Verify render_dashboard_widget handles slot targeting."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="Alert",
            data={"message": "Test alert"},
            slot_id="sidebar",
        )

        assert result["rendered"] is True
        assert result["slot_id"] == "sidebar"

    def test_render_dashboard_widget_all_valid_types(self):
        """Verify all WIDGET_TYPES are accepted."""
        from gateway.tools import render_dashboard_widget, WIDGET_TYPES

        for widget_type in WIDGET_TYPES:
            result = render_dashboard_widget(
                widget_type=widget_type,
                data={"test": True},
            )
            assert result["rendered"] is True, f"Failed for {widget_type}"
            assert result["type"] == widget_type

    def test_get_dashboard_capabilities(self):
        """Verify get_dashboard_capabilities returns expected structure."""
        from gateway.tools import get_dashboard_capabilities
        from constants.dm_constants import DMConstants

        result = get_dashboard_capabilities()

        assert "widget_types" in result
        assert "max_widgets_per_request" in result
        assert "features" in result
        assert "slots" in result

        # Verify DMConstants used
        assert result["max_widgets_per_request"] == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST

        # Verify features
        assert "streaming" in result["features"]
        assert "tool_calls" in result["features"]
        assert "a2a_orchestration" in result["features"]

    def test_get_dashboard_capabilities_slots(self):
        """Verify slot definitions are complete."""
        from gateway.tools import get_dashboard_capabilities

        result = get_dashboard_capabilities()

        slot_ids = [s["id"] for s in result["slots"]]
        assert "main" in slot_ids
        assert "sidebar" in slot_ids
        assert "header" in slot_ids

        # Each slot should have description
        for slot in result["slots"]:
            assert "id" in slot
            assert "description" in slot

    def test_route_to_agent_valid(self):
        """Verify route_to_agent accepts valid agent IDs."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="navi",
            message="Get project status",
            context={"project_id": "proj_123"},
        )

        assert result["status"] == "pending"
        assert result["target_agent"] == "navi"
        assert result["message"] == "Get project status"
        assert result["context"]["project_id"] == "proj_123"

    def test_route_to_agent_invalid(self):
        """Verify route_to_agent rejects invalid agent IDs."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="invalid_agent",
            message="Test",
        )

        assert result["status"] == "failed"
        assert "error" in result
        assert "available_agents" in result

    def test_route_to_agent_all_valid(self):
        """Verify all valid agents are accepted."""
        from gateway.tools import route_to_agent

        for agent_id in ["navi", "pulse", "herald"]:
            result = route_to_agent(
                agent_id=agent_id,
                message=f"Test message to {agent_id}",
            )
            assert result["status"] == "pending", f"Failed for {agent_id}"
            assert result["target_agent"] == agent_id

    def test_route_to_agent_no_context(self):
        """Verify route_to_agent handles missing context."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="pulse",
            message="Check health",
        )

        assert result["status"] == "pending"
        assert result["context"] == {}  # Empty dict, not None

    def test_get_all_tools(self):
        """Verify get_all_tools returns all expected tools."""
        from gateway.tools import get_all_tools

        tools = get_all_tools()

        assert len(tools) == 3
        tool_names = [t.__name__ for t in tools]
        assert "render_dashboard_widget" in tool_names
        assert "get_dashboard_capabilities" in tool_names
        assert "route_to_agent" in tool_names


class TestWidgetTypes:
    """Test suite for widget type definitions."""

    def test_widget_types_defined(self):
        """Verify WIDGET_TYPES constant is defined."""
        from gateway.tools import WIDGET_TYPES

        assert isinstance(WIDGET_TYPES, list)
        assert len(WIDGET_TYPES) >= 4  # At minimum: ProjectStatus, TaskList, Metrics, Alert

    def test_widget_types_expected(self):
        """Verify expected widget types are present."""
        from gateway.tools import WIDGET_TYPES

        expected = ["ProjectStatus", "TaskList", "Metrics", "Alert"]
        for widget_type in expected:
            assert widget_type in WIDGET_TYPES, f"Missing {widget_type}"

    def test_widget_types_no_duplicates(self):
        """Verify no duplicate widget types."""
        from gateway.tools import WIDGET_TYPES

        assert len(WIDGET_TYPES) == len(set(WIDGET_TYPES))


class TestDashboardGatewayAgent:
    """Test suite for Dashboard Gateway agent creation."""

    def test_create_agent_default(self):
        """Verify agent creation with defaults."""
        from gateway.agent import create_dashboard_gateway_agent

        with patch("gateway.agent.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            agent = create_dashboard_gateway_agent()

            mock_agent.assert_called_once()
            call_kwargs = mock_agent.call_args.kwargs
            assert call_kwargs["name"] == "dashboard_gateway"
            assert call_kwargs["role"] == "Dashboard Gateway"
            assert len(call_kwargs["tools"]) == 3

    def test_create_agent_with_workspace(self):
        """Verify workspace_id is included in instructions."""
        from gateway.agent import create_dashboard_gateway_agent

        with patch("gateway.agent.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            agent = create_dashboard_gateway_agent(workspace_id="ws_test")

            call_kwargs = mock_agent.call_args.kwargs
            instructions_text = " ".join(call_kwargs["instructions"])
            assert "ws_test" in instructions_text

    def test_create_agent_with_user_id(self):
        """Verify user_id is included in instructions."""
        from gateway.agent import create_dashboard_gateway_agent

        with patch("gateway.agent.Agent") as mock_agent:
            mock_agent.return_value = Mock()

            agent = create_dashboard_gateway_agent(user_id="user_123")

            call_kwargs = mock_agent.call_args.kwargs
            instructions_text = " ".join(call_kwargs["instructions"])
            assert "user_123" in instructions_text

    def test_create_agent_model_override(self):
        """Verify model_id override works."""
        from gateway.agent import create_dashboard_gateway_agent

        with patch("gateway.agent.Agent") as mock_agent, \
             patch("gateway.agent.Claude") as mock_claude:
            mock_agent.return_value = Mock()
            mock_claude.return_value = Mock()

            agent = create_dashboard_gateway_agent(model_id="claude-opus-4-20250514")

            mock_claude.assert_called_with(id="claude-opus-4-20250514")

    def test_get_agent_metadata(self):
        """Verify agent metadata structure."""
        from gateway.agent import get_agent_metadata
        from constants.dm_constants import DMConstants

        metadata = get_agent_metadata()

        assert metadata["name"] == "dashboard_gateway"
        assert "description" in metadata
        assert len(metadata["tools"]) == 3
        assert "render_dashboard_widget" in metadata["tools"]

        # Verify interfaces
        assert metadata["interfaces"]["agui"]["enabled"] is True
        assert metadata["interfaces"]["agui"]["path"] == "/agui"
        assert metadata["interfaces"]["a2a"]["enabled"] is True
        assert metadata["interfaces"]["a2a"]["path"] == "/a2a/dashboard"

        # Verify constants
        assert metadata["constants"]["max_widgets_per_request"] == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST


class TestAgentInstructions:
    """Test suite for agent instructions content."""

    def test_instructions_include_widget_types(self):
        """Verify instructions mention widget types."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "ProjectStatus" in DASHBOARD_INSTRUCTIONS
        assert "TaskList" in DASHBOARD_INSTRUCTIONS
        assert "Metrics" in DASHBOARD_INSTRUCTIONS
        assert "Alert" in DASHBOARD_INSTRUCTIONS

    def test_instructions_include_agent_routing(self):
        """Verify instructions mention agent routing."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "navi" in DASHBOARD_INSTRUCTIONS
        assert "pulse" in DASHBOARD_INSTRUCTIONS
        assert "herald" in DASHBOARD_INSTRUCTIONS

    def test_instructions_include_response_format(self):
        """Verify instructions have response format guidance."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "Response Format" in DASHBOARD_INSTRUCTIONS
        assert "widget" in DASHBOARD_INSTRUCTIONS.lower()


class TestModuleExports:
    """Test suite for module exports."""

    def test_gateway_module_exports(self):
        """Verify gateway module exports expected items."""
        from gateway import (
            create_dashboard_gateway_agent,
            get_agent_metadata,
            DASHBOARD_INSTRUCTIONS,
            render_dashboard_widget,
            get_dashboard_capabilities,
            route_to_agent,
            get_all_tools,
            WIDGET_TYPES,
        )

        # All imports should work
        assert callable(create_dashboard_gateway_agent)
        assert callable(get_agent_metadata)
        assert callable(render_dashboard_widget)
        assert callable(get_dashboard_capabilities)
        assert callable(route_to_agent)
        assert callable(get_all_tools)
        assert isinstance(DASHBOARD_INSTRUCTIONS, str)
        assert isinstance(WIDGET_TYPES, list)


class TestInterfaceIntegration:
    """Test suite for interface integration."""

    @pytest.fixture
    def mock_agent(self):
        """Create mock agent for interface tests."""
        agent = Mock()
        agent.name = "dashboard_gateway"
        return agent

    def test_agui_interface_config_exists(self):
        """Verify AG-UI interface config exists for dashboard_gateway."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.agui_enabled is True
        assert config.agui_path == "/agui"

    def test_a2a_interface_config_exists(self):
        """Verify A2A interface config exists for dashboard_gateway."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/dashboard"

    def test_create_agui_interface(self, mock_agent):
        """Verify AG-UI interface creation."""
        from agentos.factory import create_agui_interface

        with patch("agentos.factory.AGUI") as mock_agui:
            mock_agui.return_value = Mock()

            interface = create_agui_interface(
                agent=mock_agent,
                path="/agui",
            )

            mock_agui.assert_called_once()
            call_kwargs = mock_agui.call_args.kwargs
            assert call_kwargs["agent"] == mock_agent
            assert call_kwargs["path"] == "/agui"

    def test_create_a2a_interface(self, mock_agent):
        """Verify A2A interface creation."""
        from agentos.factory import create_a2a_interface

        with patch("agentos.factory.A2A") as mock_a2a:
            mock_a2a.return_value = Mock()

            interface = create_a2a_interface(
                agent=mock_agent,
                path="/a2a/dashboard",
            )

            mock_a2a.assert_called_once()
            call_kwargs = mock_a2a.call_args.kwargs
            assert call_kwargs["agent"] == mock_agent
            assert call_kwargs["path"] == "/a2a/dashboard"


class TestDMConstantsUsage:
    """Test suite verifying DMConstants usage."""

    def test_capabilities_uses_dmconstants(self):
        """Verify get_dashboard_capabilities uses DMConstants."""
        from gateway.tools import get_dashboard_capabilities
        from constants.dm_constants import DMConstants

        result = get_dashboard_capabilities()

        # Should match DMConstants exactly
        assert result["max_widgets_per_request"] == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST

    def test_agent_metadata_uses_dmconstants(self):
        """Verify agent metadata uses DMConstants."""
        from gateway.agent import get_agent_metadata
        from constants.dm_constants import DMConstants

        metadata = get_agent_metadata()

        assert metadata["constants"]["max_widgets_per_request"] == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST
        assert metadata["constants"]["widget_data_ttl_seconds"] == DMConstants.DASHBOARD.WIDGET_DATA_TTL_SECONDS
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `agents/gateway/__init__.py` | Gateway module init with exports |
| `agents/gateway/agent.py` | Dashboard Gateway agent definition |
| `agents/gateway/tools.py` | Gateway tool definitions |
| `agents/tests/test_dm_02_4_dashboard_gateway.py` | Comprehensive unit tests |

### Files to Modify

| File | Change |
|------|--------|
| `agents/main.py` | Mount AG-UI and A2A interface routers, add health endpoint |

---

## Testing Requirements

### Unit Tests

| Test Class | Tests | Purpose |
|------------|-------|---------|
| `TestGatewayTools` | 11 | Verify tool functions work correctly |
| `TestWidgetTypes` | 3 | Verify widget type constants |
| `TestDashboardGatewayAgent` | 5 | Verify agent creation |
| `TestAgentInstructions` | 3 | Verify instructions content |
| `TestModuleExports` | 1 | Verify module exports |
| `TestInterfaceIntegration` | 4 | Verify interface configs and creation |
| `TestDMConstantsUsage` | 2 | Verify DMConstants usage |
| **Total** | **29** | Exceeds minimum coverage requirements |

### Integration Tests (Future - with running server)

| Test Case | Description |
|-----------|-------------|
| `test_agui_endpoint_responds` | Verify `/agui` accepts AG-UI requests |
| `test_a2a_endpoint_responds` | Verify `/a2a/dashboard` accepts A2A requests |
| `test_widget_tool_call_serialized` | Verify tool calls are properly serialized |
| `test_discovery_includes_dashboard` | Verify `/.well-known/agent.json` includes dashboard_gateway |

---

## Definition of Done

- [ ] `agents/gateway/__init__.py` created with exports
- [ ] `agents/gateway/tools.py` created with:
  - [ ] `WIDGET_TYPES` constant with all widget type identifiers
  - [ ] `render_dashboard_widget()` tool function
  - [ ] `get_dashboard_capabilities()` tool function
  - [ ] `route_to_agent()` tool function
  - [ ] `get_all_tools()` helper function
- [ ] `agents/gateway/agent.py` created with:
  - [ ] `DASHBOARD_INSTRUCTIONS` constant with agent system prompt
  - [ ] `create_dashboard_gateway_agent()` factory function
  - [ ] `get_agent_metadata()` metadata function
- [ ] `agents/main.py` updated with:
  - [ ] Dashboard Gateway agent initialization on startup
  - [ ] AG-UI interface mounted at `/agui`
  - [ ] A2A interface mounted at `/a2a/dashboard`
  - [ ] A2A discovery router mounted
  - [ ] Dashboard health endpoint at `/agents/dashboard/health`
- [ ] Unit tests pass (`pytest agents/tests/test_dm_02_4_dashboard_gateway.py`)
- [ ] All configuration values use DMConstants (no magic numbers)
- [ ] Agent accessible via both AG-UI and A2A interfaces
- [ ] Tool calls properly structured for CopilotKit interception

---

## Technical Notes

### Tool Call Serialization

When the Dashboard Gateway calls `render_dashboard_widget`, the tool call is serialized as part of the AG-UI stream. CopilotKit's `useRenderToolCall` hook intercepts these tool calls on the frontend and renders the corresponding React component from the widget registry.

```
Frontend (CopilotKit) <-- AG-UI stream -- Dashboard Gateway
     |                                          |
     v                                          v
useRenderToolCall                    render_dashboard_widget tool call
     |                                          |
     v                                          |
Widget Registry                                 |
     |                                          |
     v                                          |
<ProjectStatusWidget data={...} />              |
```

### Agent Routing via A2A

When the Dashboard Gateway needs data from specialist agents (Navi, Pulse, Herald), it uses the `route_to_agent` tool to express routing intent. The actual A2A communication will be implemented in DM-03 (Dashboard Agent Integration).

### Interface Mounting Strategy

We mount interfaces on the existing FastAPI app rather than using a separate AgentOS process. This:
1. Maintains backward compatibility with existing REST endpoints
2. Allows using existing middleware (auth, CORS, rate limiting)
3. Simplifies deployment (single process)

### DMConstants Usage

All configuration values MUST reference DMConstants:

```python
# CORRECT
from constants.dm_constants import DMConstants
max_widgets = DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST

# INCORRECT
max_widgets = 12  # Magic number!
```

---

## References

- [Epic DM-02 Definition](../epics/epic-dm-02-agno-multiinterface.md)
- [Epic DM-02 Tech Spec](../epics/epic-dm-02-tech-spec.md) - Section 3.4
- [Story DM-02.2: AgentOS Multi-Interface Setup](./dm-02-2-agentos-multiinterface-setup.md)
- [Story DM-02.3: A2A AgentCard Discovery](./dm-02-3-a2a-agentcard-discovery.md)
- [AgentOS Config](../../../../agents/agentos/config.py) - INTERFACE_CONFIGS
- [A2A Discovery](../../../../agents/a2a/discovery.py) - Discovery endpoints
- [DM Constants](../../../../agents/constants/dm_constants.py)
- [Agno Documentation](https://docs.agno.com)

---

*Story Created: 2025-12-30*
*Story Completed: 2025-12-30*
*Epic: DM-02 | Story: 4 of 9 | Points: 8*

---

## Implementation Notes

**Implementation Date:** 2025-12-30

### Files Created

| File | Size | Description |
|------|------|-------------|
| `agents/gateway/__init__.py` | 1,307 bytes | Module exports |
| `agents/gateway/tools.py` | 5,594 bytes | Gateway tools (render_widget, get_capabilities, route_to_agent) |
| `agents/gateway/agent.py` | 8,692 bytes | Dashboard Gateway Agent with MockAgent fallback |
| `agents/tests/test_dm_02_4_dashboard_gateway.py` | 24,580 bytes | Unit tests (48 tests) |

### Files Modified

| File | Change |
|------|--------|
| `agents/main.py` | Mounted AG-UI and A2A interfaces, added startup handler |

### Test Results

```
======================== 48 passed =========================
```

### Key Implementation Details

1. **Gateway Tools**: render_dashboard_widget, get_dashboard_capabilities, route_to_agent
2. **MockAgent Fallback**: Graceful handling when Agno not installed
3. **Interface Mounting**: AG-UI at /agui, A2A at /a2a/dashboard
4. **Backward Compatible**: Existing REST endpoints unchanged

---

## Code Review

**Review Date:** 2025-12-30
**Reviewer:** Claude Code (Senior Developer Review)

### Review Summary

Story DM-02.4 implementation is well-structured, follows Python best practices, and meets all acceptance criteria with 48 passing tests.

### Strengths

1. **Clean Code Quality**: Consistent formatting, comprehensive docstrings
2. **DMConstants Usage**: No magic numbers - all values from constants
3. **Graceful Fallback**: MockAgent for testing without Agno installed
4. **CopilotKit Compatible**: Tools return JSON-serializable data
5. **Backward Compatible**: Existing endpoints unchanged
6. **Comprehensive Tests**: 48 tests across 12 test classes

### Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ PASS | Agent with 3 tools via Agno Agent class |
| AC2 | ✅ PASS | AG-UI mounted at /agui |
| AC3 | ✅ PASS | A2A mounted at /a2a/dashboard |
| AC4 | ✅ PASS | Interfaces on FastAPI app via startup handler |
| AC5 | ✅ PASS | All 3 gateway tools implemented |
| AC6 | ✅ PASS | 48 tests verify functionality |

### Verdict

**✅ APPROVED**

Excellent implementation of the core integration story. Clean architecture and comprehensive testing.
