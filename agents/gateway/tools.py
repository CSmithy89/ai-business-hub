"""
Dashboard Gateway Tools

Tool definitions for the Dashboard Gateway agent. These tools enable:
- Widget rendering via CopilotKit's useRenderToolCall
- Capability discovery for frontend
- Agent routing for backend orchestration
- A2A orchestration for data gathering from specialist agents

All tools are designed to be intercepted by CopilotKit on the frontend,
where tool calls are rendered as React components.
"""
import logging
from typing import Any, Dict, List, Optional

from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


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


# =============================================================================
# A2A ORCHESTRATION TOOLS
# =============================================================================
# These tools enable the Dashboard Gateway to delegate data gathering
# to specialist PM agents (Navi, Pulse, Herald) via the A2A protocol.


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
        Project status data suitable for ProjectStatus widget containing:
        - project_id: The queried project identifier
        - content: Text summary from Navi
        - raw_data: Additional artifacts from the response
        - error: Error message if the call failed

    Example:
        >>> status = await get_project_status("proj_alpha", include_tasks=True)
        >>> if "error" not in status:
        ...     render_dashboard_widget("ProjectStatus", status)
    """
    # Import here to avoid circular imports and allow lazy loading
    from a2a import get_a2a_client

    client = await get_a2a_client()

    # Build task message based on options
    task_message = f"Get status for project {project_id}"
    if include_tasks:
        task_message += " including task breakdown"
    if include_timeline:
        task_message += " with timeline milestones"

    logger.debug(f"Calling Navi for project status: {project_id}")

    result = await client.call_agent(
        agent_id="navi",
        task=task_message,
        context={"project_id": project_id},
    )

    if not result.success:
        logger.warning(f"Navi call failed for project {project_id}: {result.error}")
        return {
            "error": result.error,
            "project_id": project_id,
            "agent": "navi",
        }

    # Parse Navi's response into widget-friendly format
    return {
        "project_id": project_id,
        "content": result.content,
        "raw_data": result.artifacts,
        "tool_calls": result.tool_calls,
        "duration_ms": result.duration_ms,
    }


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
        Health data suitable for Metrics or Alert widgets containing:
        - project_id: The queried project (if applicable)
        - content: Text summary from Pulse
        - metrics: Metric artifacts from the response
        - error: Error message if the call failed

    Example:
        >>> health = await get_health_summary(project_id="proj_alpha")
        >>> if "error" not in health:
        ...     render_dashboard_widget("Metrics", health)
    """
    from a2a import get_a2a_client

    client = await get_a2a_client()

    # Build task message
    if workspace_wide:
        task_message = "Get workspace-wide health summary including all projects"
    elif project_id:
        task_message = f"Get health summary for project {project_id}"
    else:
        task_message = "Get overall health summary"

    logger.debug(f"Calling Pulse for health: workspace_wide={workspace_wide}, project={project_id}")

    result = await client.call_agent(
        agent_id="pulse",
        task=task_message,
        context={"project_id": project_id, "workspace_wide": workspace_wide},
    )

    if not result.success:
        logger.warning(f"Pulse call failed: {result.error}")
        return {
            "error": result.error,
            "project_id": project_id,
            "agent": "pulse",
        }

    return {
        "project_id": project_id,
        "content": result.content,
        "metrics": result.artifacts,
        "tool_calls": result.tool_calls,
        "duration_ms": result.duration_ms,
    }


async def get_recent_activity(
    limit: int = 10,
    project_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetch recent activity from Herald agent via A2A.

    Gets notifications, status updates, and team activity feed.

    Args:
        limit: Maximum activities to return (default 10)
        project_id: Optional filter by project

    Returns:
        Activity data suitable for TeamActivity widget containing:
        - content: Text summary from Herald
        - activities: Activity artifacts from the response
        - error: Error message if the call failed

    Example:
        >>> activity = await get_recent_activity(limit=5, project_id="proj_alpha")
        >>> if "error" not in activity:
        ...     render_dashboard_widget("TeamActivity", activity)
    """
    from a2a import get_a2a_client

    client = await get_a2a_client()

    # Build task message
    task_message = f"Get {limit} most recent activities"
    if project_id:
        task_message += f" for project {project_id}"

    logger.debug(f"Calling Herald for activity: limit={limit}, project={project_id}")

    result = await client.call_agent(
        agent_id="herald",
        task=task_message,
        context={"project_id": project_id, "limit": limit},
    )

    if not result.success:
        logger.warning(f"Herald call failed: {result.error}")
        return {
            "error": result.error,
            "activities": [],
            "agent": "herald",
        }

    return {
        "content": result.content,
        "activities": result.artifacts,
        "tool_calls": result.tool_calls,
        "duration_ms": result.duration_ms,
    }


async def gather_dashboard_data(
    project_id: Optional[str] = None,
    state_emitter: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Gather comprehensive dashboard data from multiple agents in parallel.

    Calls Navi, Pulse, and Herald simultaneously to efficiently gather
    all dashboard data in a single operation. This is more efficient than
    sequential calls when you need data from multiple agents.

    When a state_emitter is provided (DM-04.3), this function will:
    - Emit loading state before parallel calls
    - Emit widget states via update_from_gather() after results
    - Clear loading state after completion

    Args:
        project_id: Optional project focus for all agent calls
        state_emitter: Optional DashboardStateEmitter for real-time state updates.
                       When provided, state is emitted alongside the response.

    Returns:
        Combined data from all agents containing:
        - project_id: The queried project (if applicable)
        - navi: Content from Navi (project overview)
        - pulse: Content from Pulse (health metrics)
        - herald: Content from Herald (recent activity)
        - errors: Dict of agent_id to error message for any failed calls
        - duration_ms: Total time for all parallel calls

    Example:
        >>> data = await gather_dashboard_data(project_id="proj_alpha")
        >>> if not data["errors"]:
        ...     render_dashboard_widget("ProjectStatus", {"content": data["navi"]})
        ...     render_dashboard_widget("Metrics", {"content": data["pulse"]})
        ...     render_dashboard_widget("TeamActivity", {"content": data["herald"]})
        >>>
        >>> # With state emission (DM-04.3)
        >>> data = await gather_dashboard_data(
        ...     project_id="proj_alpha",
        ...     state_emitter=agent._state_emitter,
        ... )
        >>> # State is automatically emitted to frontend
    """
    from a2a import get_a2a_client

    client = await get_a2a_client()

    # Set loading state before parallel calls (DM-04.3)
    if state_emitter:
        await state_emitter.set_loading(True, ["navi", "pulse", "herald"])

    try:
        # Build parallel calls for all agents
        calls = [
            {
                "agent_id": "navi",
                "task": f"Get overview for project {project_id}" if project_id else "Get workspace overview",
                "context": {"project_id": project_id},
            },
            {
                "agent_id": "pulse",
                "task": f"Get health metrics for project {project_id}" if project_id else "Get workspace health",
                "context": {"project_id": project_id, "workspace_wide": not project_id},
            },
            {
                "agent_id": "herald",
                "task": "Get recent notifications and activity",
                "context": {"project_id": project_id, "limit": 5},
            },
        ]

        logger.info(f"Gathering dashboard data from 3 agents in parallel: project={project_id}")

        results = await client.call_agents_parallel(calls)

        # Calculate max duration across all calls
        max_duration = max(
            (r.duration_ms or 0 for r in results.values()),
            default=0
        )

        # Build response with content from each agent
        response: Dict[str, Any] = {
            "project_id": project_id,
            "navi": None,
            "pulse": None,
            "herald": None,
            "errors": {},
            "duration_ms": max_duration,
        }

        for agent_id, result in results.items():
            if result.success:
                response[agent_id] = {
                    "content": result.content,
                    "artifacts": result.artifacts,
                    "tool_calls": result.tool_calls,
                }
            else:
                response["errors"][agent_id] = result.error
                logger.warning(f"Agent {agent_id} failed in parallel gather: {result.error}")

        # Emit state update (DM-04.3)
        if state_emitter:
            await state_emitter.update_from_gather(
                navi_result=response.get("navi"),
                pulse_result=response.get("pulse"),
                herald_result=response.get("herald"),
                errors=response.get("errors") if response.get("errors") else None,
            )
    finally:
        # Always clear loading state, even on error (DM-04.3 code review fix)
        if state_emitter:
            await state_emitter.set_loading(False)

    # Log summary
    success_count = 3 - len(response["errors"])
    logger.info(f"Dashboard data gathered: {success_count}/3 agents succeeded in {max_duration:.1f}ms")

    return response


def get_all_tools() -> List:
    """
    Get all Dashboard Gateway tools.

    Returns:
        List of tool functions for agent registration, including:
        - Widget rendering tools
        - Capability discovery
        - Agent routing
        - A2A orchestration tools for data gathering
    """
    return [
        # Widget rendering
        render_dashboard_widget,
        get_dashboard_capabilities,
        route_to_agent,
        # A2A orchestration (added in DM-03.2)
        get_project_status,
        get_health_summary,
        get_recent_activity,
        gather_dashboard_data,
    ]
