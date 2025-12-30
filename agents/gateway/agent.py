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
import logging
from typing import Any, Dict, Optional

from constants.dm_constants import DMConstants

from .tools import WIDGET_TYPES, get_all_tools

logger = logging.getLogger(__name__)


# Dashboard agent system instructions
DASHBOARD_INSTRUCTIONS = """
You are the Dashboard Gateway agent for HYVVE. Your primary role is to:

1. UNDERSTAND user requests about their workspace, projects, or business
2. ORCHESTRATE data gathering from specialist agents via A2A
3. RENDER visual widgets on the user's dashboard

## Orchestration Flow

When a user asks a question, follow this pattern:
1. Determine which specialist agents have the data (Navi, Pulse, Herald)
2. Call the appropriate A2A tools to gather data
3. Render widgets with the gathered data
4. Provide a brief summary

## A2A Tools for Data Gathering

Use these tools to delegate data gathering to specialist agents:

- **get_project_status(project_id, include_tasks?, include_timeline?)**:
  Call Navi for project context, planning, progress, and task breakdown

- **get_health_summary(project_id?, workspace_wide?)**:
  Call Pulse for metrics, risks, deadlines, and health indicators

- **get_recent_activity(limit?, project_id?)**:
  Call Herald for notifications, team updates, and activity feed

- **gather_dashboard_data(project_id?)**:
  Call ALL agents in parallel for comprehensive dashboard view
  Use this when you need data from multiple sources efficiently

## Widget Rendering

After gathering data, use render_dashboard_widget to display:

- **ProjectStatus**: For project overviews from Navi (progress, status, health)
- **TaskList**: For task breakdowns (filters, priorities, assignments)
- **Metrics**: For health data from Pulse (KPIs, trends, comparisons)
- **Alert**: For warnings and risks from Pulse (important notifications)
- **TeamActivity**: For activity feed from Herald (recent updates)
- **KanbanBoard**: For task boards with columns and cards
- **GanttChart**: For timeline views of project schedules
- **BurndownChart**: For sprint progress over time

## Example Orchestration Flows

### Single Project Query
User: "How is Project Alpha doing?"

1. Call get_project_status(project_id="alpha")
2. Call get_health_summary(project_id="alpha")
3. Render ProjectStatus widget with Navi data
4. Render Metrics widget with Pulse data
5. Say: "Here's the current status for Project Alpha"

### Workspace Overview
User: "Give me a workspace overview"

1. Call gather_dashboard_data() - this calls all 3 agents in parallel
2. Render ProjectStatus widget with Navi's workspace data
3. Render Metrics widget with Pulse's health data
4. Render TeamActivity widget with Herald's activity
5. Say: "Here's your workspace overview"

### Risk Analysis
User: "What's at risk this sprint?"

1. Call get_health_summary(workspace_wide=True)
2. Render Alert widget for any at-risk items
3. Render Metrics widget with sprint health
4. Say: "Here's your risk analysis"

### Activity Feed
User: "Show me recent team activity"

1. Call get_recent_activity(limit=10)
2. Render TeamActivity widget with Herald's data
3. Say: "Here's what your team has been up to"

## Error Handling

If an agent call fails:
- Still render widgets with available data from other agents
- Show Alert widget for the error with type="warning"
- Suggest retry or alternative query
- Log which agent failed for debugging

Example error handling:
```
data = gather_dashboard_data(project_id="alpha")
if data["errors"]:
    # Still show successful agent data
    if data["navi"]:
        render_dashboard_widget("ProjectStatus", data["navi"])
    # Show error for failed agents
    for agent, error in data["errors"].items():
        render_dashboard_widget("Alert", {
            "type": "warning",
            "title": f"{agent.capitalize()} Unavailable",
            "message": error
        })
```

## Response Format

1. Brief acknowledgment of the request (1-2 sentences max)
2. One or more widget renders using render_dashboard_widget
3. Optional follow-up suggestion or question

## Important Guidelines

- Do NOT produce long text responses - use widgets instead
- ALWAYS use A2A tools (get_project_status, get_health_summary, etc.) to gather data
- Do NOT make up data - always fetch from specialist agents
- Use gather_dashboard_data for comprehensive views (more efficient than sequential calls)
- Handle partial failures gracefully - show what data is available
- Always include relevant data in widget payloads
- Use appropriate widget types for the information being displayed
- Respect max_widgets_per_request limit from get_dashboard_capabilities
"""


def create_dashboard_gateway_agent(
    workspace_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
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
        Returns a mock agent if Agno is not installed.

    Example:
        >>> agent = create_dashboard_gateway_agent(
        ...     workspace_id="ws_123",
        ...     user_id="user_456"
        ... )
        >>> # Agent is ready to be mounted via AGUI and A2A interfaces
    """
    # Handle optional Agno imports gracefully
    try:
        from agno.agent import Agent
        from agno.models.anthropic import Claude

        AGNO_AVAILABLE = True
    except ImportError:
        AGNO_AVAILABLE = False

    if not AGNO_AVAILABLE:
        logger.warning(
            "Agno packages not installed. Dashboard Gateway using mock agent. "
            "Install with: pip install agno[agui,a2a]"
        )
        # Return a mock agent for testing
        return _create_mock_agent(workspace_id, model_id, user_id)

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
        description=(
            "Orchestrates dashboard widgets by coordinating with specialist agents "
            "and rendering visual components for the HYVVE platform"
        ),
        model=Claude(id=model_id or "claude-sonnet-4-20250514"),
        instructions=instructions,
        tools=get_all_tools(),
        add_datetime_to_instructions=True,
        markdown=True,
        show_tool_calls=True,
    )

    logger.info(
        f"Created Dashboard Gateway agent "
        f"(workspace={workspace_id}, model={model_id or 'default'})"
    )

    return agent


class MockAgent:
    """Mock agent for testing when Agno is not installed."""

    def __init__(
        self,
        workspace_id: Optional[str] = None,
        model_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ):
        self.name = "dashboard_gateway"
        self.role = "Dashboard Gateway"
        self.description = (
            "Orchestrates dashboard widgets by coordinating with specialist agents "
            "and rendering visual components for the HYVVE platform"
        )
        self.workspace_id = workspace_id
        self.model_id = model_id or "claude-sonnet-4-20250514"
        self.user_id = user_id
        self.tools = get_all_tools()
        self.instructions = [DASHBOARD_INSTRUCTIONS]

        if workspace_id:
            self.instructions.append(f"\nCurrent Workspace: {workspace_id}")
        if user_id:
            self.instructions.append(f"Current User: {user_id}")

    async def arun(self, message: str) -> Dict[str, Any]:
        """Mock run method for testing."""
        return {
            "content": f"Mock response for: {message}",
            "tool_calls": [],
        }


def _create_mock_agent(
    workspace_id: Optional[str] = None,
    model_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> MockAgent:
    """Create a mock agent for testing when Agno is not installed."""
    return MockAgent(
        workspace_id=workspace_id,
        model_id=model_id,
        user_id=user_id,
    )


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
            # Widget rendering tools
            "render_dashboard_widget",
            "get_dashboard_capabilities",
            "route_to_agent",
            # A2A orchestration tools (added in DM-03.2)
            "get_project_status",
            "get_health_summary",
            "get_recent_activity",
            "gather_dashboard_data",
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
        # A2A orchestration capabilities (added in DM-03.2)
        "orchestration": {
            "delegated_agents": ["navi", "pulse", "herald"],
            "parallel_calls": True,
            "max_concurrent_calls": DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS,
        },
    }
