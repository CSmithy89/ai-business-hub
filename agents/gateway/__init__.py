"""
Dashboard Gateway Module

The Dashboard Gateway is the primary interface between the frontend CopilotKit
and the backend agent system. It provides:

- AG-UI interface for CopilotKit streaming communication
- A2A interface for backend agent orchestration
- Widget rendering tools for visual dashboard components
- Agent routing for specialist delegation
- State emission for real-time widget updates (DM-04.3)

Usage:
    from gateway import create_dashboard_gateway_agent, get_agent_metadata

    # Create agent instance (basic)
    agent = create_dashboard_gateway_agent(workspace_id="ws_123")

    # Create agent with state emission (DM-04.3)
    def emit_to_frontend(state):
        websocket.send(json.dumps(state))

    agent = create_dashboard_gateway_agent(
        workspace_id="ws_123",
        state_callback=emit_to_frontend,
    )

    # Mount interfaces (done in main.py)
    from agentos.factory import create_agui_interface, create_a2a_interface
    agui = create_agui_interface(agent, "/agui")
    a2a = create_a2a_interface(agent, "/a2a/dashboard")
"""
from .agent import (
    DASHBOARD_INSTRUCTIONS,
    MockAgent,
    create_dashboard_gateway_agent,
    get_agent_metadata,
)
from .state_emitter import (
    DashboardStateEmitter,
    create_state_emitter,
)
from .tools import (
    WIDGET_TYPES,
    get_all_tools,
    get_dashboard_capabilities,
    render_dashboard_widget,
    route_to_agent,
)

__all__ = [
    # Agent
    "create_dashboard_gateway_agent",
    "get_agent_metadata",
    "DASHBOARD_INSTRUCTIONS",
    "MockAgent",
    # State Emitter (DM-04.3)
    "DashboardStateEmitter",
    "create_state_emitter",
    # Tools
    "render_dashboard_widget",
    "get_dashboard_capabilities",
    "route_to_agent",
    "get_all_tools",
    "WIDGET_TYPES",
]
