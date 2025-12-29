"""
A2A AgentCard Generation

Implements AgentCard models and builders following Google A2A protocol
specification. AgentCards describe agent capabilities for discovery
by external agents.

Reference: https://github.com/google/a2a-protocol
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from constants.dm_constants import DMConstants


class Skill(BaseModel):
    """A2A Skill definition.

    Describes a capability or tool that an agent can perform.
    Skills are extracted from agent tool definitions.

    Attributes:
        id: Unique skill identifier (typically tool function name)
        name: Human-readable skill name
        description: Detailed description of what the skill does
        tags: Optional keywords describing the skill
        parameters: Optional JSON schema for skill parameters
        examples: Optional usage examples
    """

    id: str = Field(..., description="Unique skill identifier")
    name: str = Field(..., description="Human-readable skill name")
    description: str = Field(..., description="Skill description")
    tags: Optional[List[str]] = Field(default=None, description="Keywords describing the skill")
    parameters: Optional[Dict[str, Any]] = Field(
        default=None, description="JSON schema for skill parameters"
    )
    examples: Optional[List[str]] = Field(default=None, description="Usage examples")


class Capabilities(BaseModel):
    """A2A Agent capabilities.

    Describes the protocol capabilities supported by an agent.

    Attributes:
        streaming: Whether agent supports streaming responses
        pushNotifications: Whether agent can send push notifications
        stateTransfer: Whether agent supports state transfer between sessions
    """

    streaming: bool = Field(default=True, description="Agent supports streaming responses")
    pushNotifications: bool = Field(default=False, description="Agent supports push notifications")
    stateTransfer: bool = Field(default=False, description="Agent supports state transfer")


class Provider(BaseModel):
    """A2A Provider information.

    Identifies the organization providing the agent.

    Attributes:
        organization: Organization name
        url: Organization website URL
    """

    organization: str = Field(default="HYVVE", description="Provider organization name")
    url: Optional[str] = Field(default=None, description="Provider website URL")


class Authentication(BaseModel):
    """A2A Authentication requirements.

    Describes authentication requirements for the agent.

    Attributes:
        schemes: List of supported authentication schemes
        required: Whether authentication is required
    """

    schemes: List[str] = Field(
        default_factory=lambda: ["bearer"], description="Supported authentication schemes"
    )
    required: bool = Field(
        default=False, description="Whether authentication is required for discovery"
    )


class AgentCard(BaseModel):
    """A2A AgentCard following JSON-LD spec.

    The AgentCard is the primary discovery document for an A2A agent.
    It describes the agent's identity, capabilities, and how to
    communicate with it.

    Attributes:
        context: JSON-LD context URL
        type: JSON-LD type (always "AIAgent")
        name: Agent name/identifier
        description: Human-readable agent description
        url: A2A endpoint URL for this agent
        version: A2A protocol version supported
        capabilities: Agent capabilities
        skills: List of available skills/tools
        defaultInputModes: Supported input modes
        defaultOutputModes: Supported output modes
        provider: Provider information
        authentication: Authentication requirements
        documentationUrl: Optional link to documentation
        created: AgentCard creation timestamp
    """

    context: str = Field(
        alias="@context", default="https://schema.org", description="JSON-LD context"
    )
    type: str = Field(alias="@type", default="AIAgent", description="JSON-LD type")
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    url: str = Field(..., description="A2A endpoint URL")
    version: str = Field(
        default=DMConstants.A2A.PROTOCOL_VERSION, description="A2A protocol version"
    )
    capabilities: Capabilities = Field(default_factory=Capabilities, description="Agent capabilities")
    skills: List[Skill] = Field(default_factory=list, description="Available skills")
    defaultInputModes: List[str] = Field(default=["text"], description="Supported input modes")
    defaultOutputModes: List[str] = Field(
        default=["text", "tool_calls"], description="Supported output modes"
    )
    provider: Provider = Field(default_factory=Provider, description="Provider information")
    authentication: Authentication = Field(
        default_factory=Authentication, description="Authentication requirements"
    )
    documentationUrl: Optional[str] = Field(
        default=None, description="Link to agent documentation"
    )
    created: Optional[str] = Field(default=None, description="AgentCard creation timestamp")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "examples": [
                {
                    "@context": "https://schema.org",
                    "@type": "AIAgent",
                    "name": "dashboard_gateway",
                    "description": "Dashboard Gateway agent for HYVVE",
                    "url": "http://localhost:8000/a2a/dashboard",
                    "version": DMConstants.A2A.PROTOCOL_VERSION,
                }
            ]
        },
    }


# Agent metadata for card generation
# These define the static properties for each known agent type
AGENT_METADATA: Dict[str, Dict[str, Any]] = {
    "dashboard_gateway": {
        "name": "dashboard_gateway",
        "description": (
            "Dashboard Gateway agent for HYVVE - orchestrates dashboard widgets "
            "by coordinating with specialist agents"
        ),
        "skills": [
            Skill(
                id="render_dashboard_widget",
                name="Render Dashboard Widget",
                description=(
                    "Render a widget on the user's dashboard. "
                    "Supports ProjectStatus, TaskList, Metrics, and Alert widget types."
                ),
                tags=["dashboard", "widget", "ui"],
            ),
            Skill(
                id="get_dashboard_capabilities",
                name="Get Dashboard Capabilities",
                description="Get available dashboard capabilities including widget types and features.",
                tags=["dashboard", "capabilities"],
            ),
        ],
        "capabilities": Capabilities(
            streaming=True,
            pushNotifications=False,
            stateTransfer=False,
        ),
        "defaultOutputModes": ["text", "tool_calls"],
    },
    "navi": {
        "name": "navi",
        "description": (
            "Navi - Project Navigator agent for HYVVE PM module. "
            "Handles project context, planning, and coordination."
        ),
        "skills": [
            Skill(
                id="get_project_context",
                name="Get Project Context",
                description="Retrieve current project context and status.",
                tags=["project", "context"],
            ),
            Skill(
                id="create_task",
                name="Create Task",
                description="Create a new task in the project.",
                tags=["project", "task", "create"],
            ),
            Skill(
                id="update_task_status",
                name="Update Task Status",
                description="Update the status of an existing task.",
                tags=["project", "task", "update"],
            ),
        ],
        "capabilities": Capabilities(
            streaming=True,
            pushNotifications=False,
            stateTransfer=False,
        ),
        "defaultOutputModes": ["text", "tool_calls"],
    },
    "pulse": {
        "name": "pulse",
        "description": (
            "Pulse - Project Health Monitor agent for HYVVE PM module. "
            "Tracks metrics, deadlines, and project health."
        ),
        "skills": [
            Skill(
                id="get_project_health",
                name="Get Project Health",
                description="Get current project health metrics and status.",
                tags=["project", "health", "metrics"],
            ),
            Skill(
                id="check_deadlines",
                name="Check Deadlines",
                description="Check upcoming deadlines and at-risk items.",
                tags=["project", "deadlines", "risk"],
            ),
        ],
        "capabilities": Capabilities(
            streaming=True,
            pushNotifications=False,
            stateTransfer=False,
        ),
        "defaultOutputModes": ["text"],
    },
    "herald": {
        "name": "herald",
        "description": (
            "Herald - Communication Coordinator agent for HYVVE PM module. "
            "Manages notifications, updates, and team communication."
        ),
        "skills": [
            Skill(
                id="send_notification",
                name="Send Notification",
                description="Send a notification to team members.",
                tags=["communication", "notification"],
            ),
            Skill(
                id="generate_status_update",
                name="Generate Status Update",
                description="Generate a project status update summary.",
                tags=["communication", "status", "update"],
            ),
        ],
        "capabilities": Capabilities(
            streaming=True,
            pushNotifications=True,
            stateTransfer=False,
        ),
        "defaultOutputModes": ["text"],
    },
}


def build_agent_card(
    agent_id: str,
    base_url: str,
    path: str,
    custom_skills: Optional[List[Skill]] = None,
    custom_description: Optional[str] = None,
) -> AgentCard:
    """
    Build an A2A AgentCard for an agent.

    Uses predefined metadata from AGENT_METADATA, with optional
    overrides for skills and description.

    Args:
        agent_id: The agent identifier (must be in AGENT_METADATA)
        base_url: Base URL of the AgentOS server
        path: A2A endpoint path for this agent
        custom_skills: Optional list of skills to override defaults
        custom_description: Optional description override

    Returns:
        AgentCard with agent metadata

    Raises:
        ValueError: If agent_id not found in AGENT_METADATA
    """
    metadata = AGENT_METADATA.get(agent_id)
    if not metadata:
        raise ValueError(
            f"Unknown agent_id: {agent_id}. Known agents: {list(AGENT_METADATA.keys())}"
        )

    # Build URL ensuring no double slashes
    url = f"{base_url.rstrip('/')}{path}"

    return AgentCard(
        name=metadata["name"],
        description=custom_description or metadata["description"],
        url=url,
        skills=custom_skills or metadata.get("skills", []),
        capabilities=metadata.get("capabilities", Capabilities()),
        defaultOutputModes=metadata.get("defaultOutputModes", ["text", "tool_calls"]),
        created=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    )


def build_discovery_response(
    agents: Dict[str, str],
    base_url: str,
) -> Dict[str, Any]:
    """
    Build A2A global discovery response.

    Returns all registered agent cards in a single response
    for the /.well-known/agent.json endpoint.

    Args:
        agents: Dictionary mapping agent_id to A2A path
        base_url: Base URL of the server

    Returns:
        Discovery response with protocol version and agent cards
    """
    cards = []

    for agent_id, path in agents.items():
        try:
            card = build_agent_card(agent_id, base_url, path)
            cards.append(card.model_dump(by_alias=True))
        except ValueError:
            # Skip unknown agents (may be dynamically registered)
            continue

    return {
        "protocolVersion": DMConstants.A2A.PROTOCOL_VERSION,
        "agents": cards,
        "discoveredAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


def build_multi_agent_response(
    agents: Dict[str, str],
    base_url: str,
) -> Dict[str, Any]:
    """
    Build A2A multi-agent discovery response.

    Returns a simplified listing of available agents with
    their endpoints for the /.well-known/agents endpoint.

    Args:
        agents: Dictionary mapping agent_id to A2A path
        base_url: Base URL of the server

    Returns:
        Multi-agent response with agent listings
    """
    agent_list = []

    for agent_id, path in agents.items():
        metadata = AGENT_METADATA.get(agent_id, {})
        url = f"{base_url.rstrip('/')}{path}"

        agent_list.append(
            {
                "id": agent_id,
                "name": metadata.get("name", agent_id),
                "description": metadata.get("description", f"{agent_id} agent"),
                "url": url,
                "discoveryUrl": f"{url}/.well-known/agent.json",
            }
        )

    return {
        "protocolVersion": DMConstants.A2A.PROTOCOL_VERSION,
        "count": len(agent_list),
        "agents": agent_list,
        "discoveredAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
