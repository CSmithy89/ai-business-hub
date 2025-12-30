"""
Dashboard Gateway Module

The Dashboard Gateway is the primary interface between the frontend CopilotKit
and the backend agent system. It provides:

- AG-UI interface for CopilotKit streaming communication
- A2A interface for backend agent orchestration
- Widget rendering tools for visual dashboard components
- Agent routing for specialist delegation
- State emission for real-time widget updates (DM-04.3)
- HITL tools for human-in-the-loop approval workflows (DM-05.1)
- Long-running task examples for multi-step operations (DM-05.5)

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

    # HITL tools (DM-05.1)
    from gateway import get_hitl_tools, sign_contract
    hitl_tools = get_hitl_tools()  # Returns list of all HITL tools

    # Long-running tasks (DM-05.5)
    from gateway import research_competitor_landscape, bulk_data_export
    result = await research_competitor_landscape(
        competitors=["Acme", "BigCorp"],
        state_emitter=emitter,
    )
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
from .hitl_tools import (
    # HITL example tools (DM-05.1)
    sign_contract,
    delete_project,
    approve_expense,
    send_bulk_notification,
    get_hitl_tools,
    get_hitl_tool_metadata,
)
from .long_tasks import (
    # Long-running task examples (DM-05.5)
    research_competitor_landscape,
    bulk_data_export,
    get_long_task_examples,
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
    # HITL Tools (DM-05.1)
    "sign_contract",
    "delete_project",
    "approve_expense",
    "send_bulk_notification",
    "get_hitl_tools",
    "get_hitl_tool_metadata",
    # Long-running Tasks (DM-05.5)
    "research_competitor_landscape",
    "bulk_data_export",
    "get_long_task_examples",
]
