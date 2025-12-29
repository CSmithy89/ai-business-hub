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
