"""
Dashboard Gateway Tools

Tool definitions for the Dashboard Gateway agent. These tools enable:
- Widget rendering via CopilotKit's useRenderToolCall
- Capability discovery for frontend
- Agent routing for backend orchestration

All tools are designed to be intercepted by CopilotKit on the frontend,
where tool calls are rendered as React components.
"""
from typing import Any, Dict, List, Optional

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
