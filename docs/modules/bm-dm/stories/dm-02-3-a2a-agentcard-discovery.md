# Story DM-02.3: A2A AgentCard Discovery

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 3
**Status:** done
**Priority:** High (A2A protocol compliance)
**Dependencies:** DM-02.2 (Complete - AgentOS Multi-Interface Setup)

---

## Overview

Implement Google A2A protocol AgentCard generation and discovery endpoints for agent-to-agent communication. AgentCards describe agent capabilities and how to communicate with them, enabling external agents to discover and interact with HYVVE agents.

This story implements the A2A discovery mechanism required for:
- External agents discovering HYVVE agents via `/.well-known/agent.json`
- Multi-agent discovery for listing all available agents at `/.well-known/agents`
- Individual agent discovery at `/a2a/{agent_id}/.well-known/agent.json`
- Skill and capability declarations following A2A specification

The AgentCard infrastructure created here will be used by:
- Dashboard Gateway agent (DM-02.4) - discoverable via A2A
- PM agents (DM-02.5) - discoverable for inter-agent coordination
- Future external integrations using A2A protocol

---

## Acceptance Criteria

- [ ] **AC1:** AgentCard Pydantic models created matching Google A2A spec
- [ ] **AC2:** AgentCard generation functions implemented for all agent types (dashboard_gateway, navi, pulse, herald)
- [ ] **AC3:** `/.well-known/agent.json` discovery endpoint implemented returning all agent cards
- [ ] **AC4:** `/.well-known/agents` multi-agent discovery endpoint implemented
- [ ] **AC5:** Unit tests verify AgentCard schema compliance and endpoint responses

---

## Technical Approach

### A2A Protocol Compliance

The A2A protocol follows Google's official specification with JSON-LD format for AgentCards:

**AgentCard Structure:**
```json
{
  "@context": "https://schema.org",
  "@type": "AIAgent",
  "name": "dashboard_gateway",
  "description": "Dashboard Gateway agent for HYVVE",
  "url": "http://localhost:8000/a2a/dashboard",
  "version": "0.2.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false,
    "stateTransfer": false
  },
  "skills": [
    {
      "id": "render_dashboard_widget",
      "name": "Render Dashboard Widget",
      "description": "Render a widget on the user's dashboard"
    }
  ],
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text", "tool_calls"]
}
```

### Discovery Endpoints

| Endpoint | Purpose | Auth |
|----------|---------|------|
| `GET /.well-known/agent.json` | Global discovery (all agents) | None (public) |
| `GET /.well-known/agents` | Multi-agent listing with metadata | None (public) |
| `GET /a2a/{agent_id}/.well-known/agent.json` | Individual agent discovery | None (public) |

### File Structure

```
agents/
├── a2a/                        # NEW: A2A protocol module
│   ├── __init__.py
│   └── agent_card.py           # AgentCard models and builders
├── agentos/
│   ├── config.py               # Existing - INTERFACE_CONFIGS
│   └── factory.py              # Existing - interface factory
├── constants/
│   └── dm_constants.py         # Existing - protocol versions
└── main.py                     # Modified - mount discovery endpoints
```

---

## Implementation Tasks

### Task 1: Create A2A Module with AgentCard Models (1.5 points)

Create the AgentCard Pydantic models following the A2A JSON-LD specification.

**File:** `agents/a2a/__init__.py`

```python
"""
A2A Protocol Module

Implements Google A2A protocol support including AgentCard generation
and discovery endpoints for agent-to-agent communication.
"""
from .agent_card import (
    AgentCard,
    Capabilities,
    Skill,
    Provider,
    Authentication,
    build_agent_card,
    build_discovery_response,
    build_multi_agent_response,
)

__all__ = [
    # Models
    "AgentCard",
    "Capabilities",
    "Skill",
    "Provider",
    "Authentication",
    # Builders
    "build_agent_card",
    "build_discovery_response",
    "build_multi_agent_response",
]
```

**File:** `agents/a2a/agent_card.py`

```python
"""
A2A AgentCard Generation

Implements AgentCard models and builders following Google A2A protocol
specification. AgentCards describe agent capabilities for discovery
by external agents.

Reference: https://github.com/google/a2a-protocol
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

from constants.dm_constants import DMConstants


class Skill(BaseModel):
    """A2A Skill definition.

    Describes a capability or tool that an agent can perform.
    Skills are extracted from agent tool definitions.

    Attributes:
        id: Unique skill identifier (typically tool function name)
        name: Human-readable skill name
        description: Detailed description of what the skill does
        parameters: Optional JSON schema for skill parameters
        examples: Optional usage examples
    """
    id: str = Field(..., description="Unique skill identifier")
    name: str = Field(..., description="Human-readable skill name")
    description: str = Field(..., description="Skill description")
    parameters: Optional[Dict[str, Any]] = Field(
        default=None,
        description="JSON schema for skill parameters"
    )
    examples: Optional[List[str]] = Field(
        default=None,
        description="Usage examples"
    )


class Capabilities(BaseModel):
    """A2A Agent capabilities.

    Describes the protocol capabilities supported by an agent.

    Attributes:
        streaming: Whether agent supports streaming responses
        pushNotifications: Whether agent can send push notifications
        stateTransfer: Whether agent supports state transfer between sessions
    """
    streaming: bool = Field(
        default=True,
        description="Agent supports streaming responses"
    )
    pushNotifications: bool = Field(
        default=False,
        description="Agent supports push notifications"
    )
    stateTransfer: bool = Field(
        default=False,
        description="Agent supports state transfer"
    )


class Provider(BaseModel):
    """A2A Provider information.

    Identifies the organization providing the agent.

    Attributes:
        organization: Organization name
        url: Organization website URL
    """
    organization: str = Field(
        default="HYVVE",
        description="Provider organization name"
    )
    url: Optional[str] = Field(
        default=None,
        description="Provider website URL"
    )


class Authentication(BaseModel):
    """A2A Authentication requirements.

    Describes authentication requirements for the agent.

    Attributes:
        schemes: List of supported authentication schemes
        required: Whether authentication is required
    """
    schemes: List[str] = Field(
        default_factory=lambda: ["bearer"],
        description="Supported authentication schemes"
    )
    required: bool = Field(
        default=False,
        description="Whether authentication is required for discovery"
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
        alias="@context",
        default="https://schema.org",
        description="JSON-LD context"
    )
    type: str = Field(
        alias="@type",
        default="AIAgent",
        description="JSON-LD type"
    )
    name: str = Field(..., description="Agent name")
    description: str = Field(..., description="Agent description")
    url: str = Field(..., description="A2A endpoint URL")
    version: str = Field(
        default=DMConstants.A2A.PROTOCOL_VERSION,
        description="A2A protocol version"
    )
    capabilities: Capabilities = Field(
        default_factory=Capabilities,
        description="Agent capabilities"
    )
    skills: List[Skill] = Field(
        default_factory=list,
        description="Available skills"
    )
    defaultInputModes: List[str] = Field(
        default=["text"],
        description="Supported input modes"
    )
    defaultOutputModes: List[str] = Field(
        default=["text", "tool_calls"],
        description="Supported output modes"
    )
    provider: Provider = Field(
        default_factory=Provider,
        description="Provider information"
    )
    authentication: Authentication = Field(
        default_factory=Authentication,
        description="Authentication requirements"
    )
    documentationUrl: Optional[str] = Field(
        default=None,
        description="Link to agent documentation"
    )
    created: Optional[str] = Field(
        default=None,
        description="AgentCard creation timestamp"
    )

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
                    "version": "0.3.0",
                }
            ]
        }
    }


# Agent metadata for card generation
# These define the static properties for each known agent type
AGENT_METADATA: Dict[str, Dict[str, Any]] = {
    "dashboard_gateway": {
        "name": "dashboard_gateway",
        "description": "Dashboard Gateway agent for HYVVE - orchestrates dashboard widgets by coordinating with specialist agents",
        "skills": [
            Skill(
                id="render_dashboard_widget",
                name="Render Dashboard Widget",
                description="Render a widget on the user's dashboard. Supports ProjectStatus, TaskList, Metrics, and Alert widget types.",
            ),
            Skill(
                id="get_dashboard_capabilities",
                name="Get Dashboard Capabilities",
                description="Get available dashboard capabilities including widget types and features.",
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
        "description": "Navi - Project Navigator agent for HYVVE PM module. Handles project context, planning, and coordination.",
        "skills": [
            Skill(
                id="get_project_context",
                name="Get Project Context",
                description="Retrieve current project context and status.",
            ),
            Skill(
                id="create_task",
                name="Create Task",
                description="Create a new task in the project.",
            ),
            Skill(
                id="update_task_status",
                name="Update Task Status",
                description="Update the status of an existing task.",
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
        "description": "Pulse - Project Health Monitor agent for HYVVE PM module. Tracks metrics, deadlines, and project health.",
        "skills": [
            Skill(
                id="get_project_health",
                name="Get Project Health",
                description="Get current project health metrics and status.",
            ),
            Skill(
                id="check_deadlines",
                name="Check Deadlines",
                description="Check upcoming deadlines and at-risk items.",
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
        "description": "Herald - Communication Coordinator agent for HYVVE PM module. Manages notifications, updates, and team communication.",
        "skills": [
            Skill(
                id="send_notification",
                name="Send Notification",
                description="Send a notification to team members.",
            ),
            Skill(
                id="generate_status_update",
                name="Generate Status Update",
                description="Generate a project status update summary.",
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
        raise ValueError(f"Unknown agent_id: {agent_id}. Known agents: {list(AGENT_METADATA.keys())}")

    # Build URL ensuring no double slashes
    url = f"{base_url.rstrip('/')}{path}"

    return AgentCard(
        name=metadata["name"],
        description=custom_description or metadata["description"],
        url=url,
        skills=custom_skills or metadata.get("skills", []),
        capabilities=metadata.get("capabilities", Capabilities()),
        defaultOutputModes=metadata.get("defaultOutputModes", ["text", "tool_calls"]),
        created=datetime.utcnow().isoformat() + "Z",
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
        "discoveredAt": datetime.utcnow().isoformat() + "Z",
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

        agent_list.append({
            "id": agent_id,
            "name": metadata.get("name", agent_id),
            "description": metadata.get("description", f"{agent_id} agent"),
            "url": url,
            "discoveryUrl": f"{url}/.well-known/agent.json",
        })

    return {
        "protocolVersion": DMConstants.A2A.PROTOCOL_VERSION,
        "count": len(agent_list),
        "agents": agent_list,
        "discoveredAt": datetime.utcnow().isoformat() + "Z",
    }
```

---

### Task 2: Create Discovery Endpoints (1 point)

Create FastAPI router for A2A discovery endpoints.

**File:** `agents/a2a/discovery.py`

```python
"""
A2A Discovery Endpoints

Implements the A2A discovery endpoints for agent discovery:
- /.well-known/agent.json - Global discovery (all agents)
- /.well-known/agents - Multi-agent listing
- /a2a/{agent_id}/.well-known/agent.json - Individual agent discovery
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
import logging

from .agent_card import (
    build_agent_card,
    build_discovery_response,
    build_multi_agent_response,
)
from agentos.config import (
    get_agentos_settings,
    INTERFACE_CONFIGS,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["a2a-discovery"])


def _get_a2a_agents() -> dict[str, str]:
    """
    Get all agents with A2A interfaces enabled.

    Returns:
        Dictionary mapping agent_id to A2A path
    """
    return {
        config.agent_id: config.a2a_path
        for config in INTERFACE_CONFIGS
        if config.a2a_enabled and config.a2a_path
    }


@router.get(
    "/.well-known/agent.json",
    summary="A2A Global Discovery",
    description="Returns all registered agent cards for A2A discovery. This endpoint is unauthenticated (public metadata).",
    response_description="Discovery response with all agent cards",
)
async def global_discovery():
    """
    A2A Global Discovery Endpoint.

    Returns all registered agent cards in a single response,
    enabling external agents to discover available HYVVE agents.

    This endpoint is unauthenticated as it provides public metadata
    about agent capabilities, not sensitive data.
    """
    settings = get_agentos_settings()
    agents = _get_a2a_agents()

    if not agents:
        logger.warning("No A2A agents configured for discovery")
        return {
            "protocolVersion": settings.a2a_enabled and "0.3.0" or "disabled",
            "agents": [],
            "message": "No A2A agents configured",
        }

    return build_discovery_response(
        agents=agents,
        base_url=settings.base_url,
    )


@router.get(
    "/.well-known/agents",
    summary="A2A Multi-Agent Listing",
    description="Returns a simplified listing of all available agents with their A2A endpoints.",
    response_description="Multi-agent listing response",
)
async def multi_agent_listing():
    """
    A2A Multi-Agent Listing Endpoint.

    Returns a simplified listing of available agents with their
    endpoints, useful for quick enumeration of available agents.
    """
    settings = get_agentos_settings()
    agents = _get_a2a_agents()

    return build_multi_agent_response(
        agents=agents,
        base_url=settings.base_url,
    )


@router.get(
    "/a2a/{agent_id}/.well-known/agent.json",
    summary="Individual Agent Discovery",
    description="Returns the AgentCard for a specific agent by ID.",
    response_description="Single agent AgentCard",
)
async def agent_discovery(agent_id: str):
    """
    Individual Agent Discovery Endpoint.

    Returns the AgentCard for a specific agent, allowing external
    agents to discover capabilities of a single HYVVE agent.

    Args:
        agent_id: The unique agent identifier

    Returns:
        AgentCard for the requested agent

    Raises:
        HTTPException 404: If agent not found or A2A not enabled
    """
    settings = get_agentos_settings()
    agents = _get_a2a_agents()

    if agent_id not in agents:
        # Check if agent exists but A2A is disabled
        all_agents = {c.agent_id for c in INTERFACE_CONFIGS}
        if agent_id in all_agents:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' exists but A2A interface is not enabled",
            )
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_id}' not found. Available agents: {list(agents.keys())}",
        )

    try:
        card = build_agent_card(
            agent_id=agent_id,
            base_url=settings.base_url,
            path=agents[agent_id],
        )
        return card.model_dump(by_alias=True)
    except ValueError as e:
        logger.error(f"Failed to build AgentCard for {agent_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AgentCard: {str(e)}",
        )
```

Update the module `__init__.py` to export the router:

**Update:** `agents/a2a/__init__.py` (add to imports and exports)

```python
from .discovery import router as discovery_router
```

---

### Task 3: Create Unit Tests (0.5 points)

Create comprehensive tests for AgentCard models and discovery endpoints.

**File:** `agents/tests/test_dm_02_3_agentcard_discovery.py`

```python
"""
Tests for DM-02.3: A2A AgentCard Discovery

Verifies AgentCard models, builders, and discovery endpoints.
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime

# Test AgentCard models
class TestAgentCardModels:
    """Test suite for AgentCard Pydantic models."""

    def test_skill_creation(self):
        """Verify Skill model can be created with required fields."""
        from a2a.agent_card import Skill

        skill = Skill(
            id="test_skill",
            name="Test Skill",
            description="A test skill for verification",
        )

        assert skill.id == "test_skill"
        assert skill.name == "Test Skill"
        assert skill.description == "A test skill for verification"
        assert skill.parameters is None
        assert skill.examples is None

    def test_skill_with_parameters(self):
        """Verify Skill can include parameters schema."""
        from a2a.agent_card import Skill

        skill = Skill(
            id="parameterized_skill",
            name="Parameterized Skill",
            description="Skill with parameters",
            parameters={
                "type": "object",
                "properties": {
                    "widget_type": {"type": "string"},
                },
            },
        )

        assert skill.parameters is not None
        assert "properties" in skill.parameters

    def test_capabilities_defaults(self):
        """Verify Capabilities has correct defaults."""
        from a2a.agent_card import Capabilities

        caps = Capabilities()

        assert caps.streaming is True
        assert caps.pushNotifications is False
        assert caps.stateTransfer is False

    def test_capabilities_override(self):
        """Verify Capabilities can be overridden."""
        from a2a.agent_card import Capabilities

        caps = Capabilities(
            streaming=False,
            pushNotifications=True,
            stateTransfer=True,
        )

        assert caps.streaming is False
        assert caps.pushNotifications is True
        assert caps.stateTransfer is True

    def test_provider_defaults(self):
        """Verify Provider has HYVVE defaults."""
        from a2a.agent_card import Provider

        provider = Provider()

        assert provider.organization == "HYVVE"
        assert provider.url is None

    def test_authentication_defaults(self):
        """Verify Authentication has correct defaults."""
        from a2a.agent_card import Authentication

        auth = Authentication()

        assert "bearer" in auth.schemes
        assert auth.required is False

    def test_agent_card_creation(self):
        """Verify AgentCard can be created with required fields."""
        from a2a.agent_card import AgentCard
        from constants.dm_constants import DMConstants

        card = AgentCard(
            name="test_agent",
            description="Test agent for verification",
            url="http://localhost:8000/a2a/test",
        )

        assert card.name == "test_agent"
        assert card.description == "Test agent for verification"
        assert card.url == "http://localhost:8000/a2a/test"
        assert card.version == DMConstants.A2A.PROTOCOL_VERSION

    def test_agent_card_json_ld_aliases(self):
        """Verify AgentCard JSON-LD aliases work correctly."""
        from a2a.agent_card import AgentCard

        card = AgentCard(
            name="test_agent",
            description="Test agent",
            url="http://localhost:8000/a2a/test",
        )

        # Dump with aliases
        data = card.model_dump(by_alias=True)

        assert "@context" in data
        assert data["@context"] == "https://schema.org"
        assert "@type" in data
        assert data["@type"] == "AIAgent"

    def test_agent_card_default_modes(self):
        """Verify AgentCard has correct default input/output modes."""
        from a2a.agent_card import AgentCard

        card = AgentCard(
            name="test_agent",
            description="Test",
            url="http://localhost:8000/a2a/test",
        )

        assert "text" in card.defaultInputModes
        assert "text" in card.defaultOutputModes
        assert "tool_calls" in card.defaultOutputModes


class TestAgentMetadata:
    """Test suite for agent metadata definitions."""

    def test_agent_metadata_exists(self):
        """Verify AGENT_METADATA contains expected agents."""
        from a2a.agent_card import AGENT_METADATA

        assert "dashboard_gateway" in AGENT_METADATA
        assert "navi" in AGENT_METADATA
        assert "pulse" in AGENT_METADATA
        assert "herald" in AGENT_METADATA

    def test_dashboard_gateway_metadata(self):
        """Verify dashboard_gateway metadata is complete."""
        from a2a.agent_card import AGENT_METADATA

        dashboard = AGENT_METADATA["dashboard_gateway"]

        assert dashboard["name"] == "dashboard_gateway"
        assert "Dashboard Gateway" in dashboard["description"]
        assert len(dashboard["skills"]) >= 2
        assert dashboard["capabilities"].streaming is True

    def test_pm_agents_have_skills(self):
        """Verify PM agents have defined skills."""
        from a2a.agent_card import AGENT_METADATA

        for agent_id in ["navi", "pulse", "herald"]:
            metadata = AGENT_METADATA[agent_id]
            assert len(metadata["skills"]) >= 1, f"{agent_id} should have skills"

    def test_herald_has_push_notifications(self):
        """Verify Herald agent supports push notifications."""
        from a2a.agent_card import AGENT_METADATA

        herald = AGENT_METADATA["herald"]
        assert herald["capabilities"].pushNotifications is True


class TestAgentCardBuilders:
    """Test suite for AgentCard builder functions."""

    def test_build_agent_card_known_agent(self):
        """Verify build_agent_card works for known agents."""
        from a2a.agent_card import build_agent_card

        card = build_agent_card(
            agent_id="dashboard_gateway",
            base_url="http://localhost:8000",
            path="/a2a/dashboard",
        )

        assert card.name == "dashboard_gateway"
        assert card.url == "http://localhost:8000/a2a/dashboard"
        assert len(card.skills) >= 2
        assert card.created is not None

    def test_build_agent_card_unknown_agent(self):
        """Verify build_agent_card raises for unknown agents."""
        from a2a.agent_card import build_agent_card

        with pytest.raises(ValueError, match="Unknown agent_id"):
            build_agent_card(
                agent_id="nonexistent_agent",
                base_url="http://localhost:8000",
                path="/a2a/nonexistent",
            )

    def test_build_agent_card_custom_skills(self):
        """Verify build_agent_card accepts custom skills."""
        from a2a.agent_card import build_agent_card, Skill

        custom_skills = [
            Skill(id="custom", name="Custom", description="Custom skill"),
        ]

        card = build_agent_card(
            agent_id="dashboard_gateway",
            base_url="http://localhost:8000",
            path="/a2a/dashboard",
            custom_skills=custom_skills,
        )

        assert len(card.skills) == 1
        assert card.skills[0].id == "custom"

    def test_build_agent_card_custom_description(self):
        """Verify build_agent_card accepts custom description."""
        from a2a.agent_card import build_agent_card

        card = build_agent_card(
            agent_id="dashboard_gateway",
            base_url="http://localhost:8000",
            path="/a2a/dashboard",
            custom_description="Custom description for testing",
        )

        assert card.description == "Custom description for testing"

    def test_build_agent_card_url_normalization(self):
        """Verify build_agent_card normalizes URLs correctly."""
        from a2a.agent_card import build_agent_card

        # Base URL with trailing slash
        card1 = build_agent_card(
            agent_id="navi",
            base_url="http://localhost:8000/",
            path="/a2a/navi",
        )

        # Base URL without trailing slash
        card2 = build_agent_card(
            agent_id="navi",
            base_url="http://localhost:8000",
            path="/a2a/navi",
        )

        assert card1.url == card2.url
        assert "//a2a" not in card1.url  # No double slashes

    def test_build_discovery_response(self):
        """Verify build_discovery_response returns valid structure."""
        from a2a.agent_card import build_discovery_response
        from constants.dm_constants import DMConstants

        agents = {
            "dashboard_gateway": "/a2a/dashboard",
            "navi": "/a2a/navi",
        }

        response = build_discovery_response(
            agents=agents,
            base_url="http://localhost:8000",
        )

        assert response["protocolVersion"] == DMConstants.A2A.PROTOCOL_VERSION
        assert len(response["agents"]) == 2
        assert "discoveredAt" in response

    def test_build_discovery_response_skips_unknown(self):
        """Verify build_discovery_response skips unknown agents."""
        from a2a.agent_card import build_discovery_response

        agents = {
            "dashboard_gateway": "/a2a/dashboard",
            "unknown_agent": "/a2a/unknown",  # Not in AGENT_METADATA
        }

        response = build_discovery_response(
            agents=agents,
            base_url="http://localhost:8000",
        )

        # Should only include dashboard_gateway
        assert len(response["agents"]) == 1
        assert response["agents"][0]["name"] == "dashboard_gateway"

    def test_build_multi_agent_response(self):
        """Verify build_multi_agent_response returns valid structure."""
        from a2a.agent_card import build_multi_agent_response

        agents = {
            "dashboard_gateway": "/a2a/dashboard",
            "navi": "/a2a/navi",
        }

        response = build_multi_agent_response(
            agents=agents,
            base_url="http://localhost:8000",
        )

        assert response["count"] == 2
        assert len(response["agents"]) == 2

        # Check agent entries have required fields
        for agent in response["agents"]:
            assert "id" in agent
            assert "name" in agent
            assert "url" in agent
            assert "discoveryUrl" in agent


class TestDiscoveryEndpoints:
    """Test suite for A2A discovery endpoints."""

    @pytest.fixture
    def mock_settings(self):
        """Mock AgentOS settings."""
        settings = MagicMock()
        settings.base_url = "http://localhost:8000"
        settings.a2a_enabled = True
        return settings

    def test_global_discovery_endpoint(self, mock_settings):
        """Verify global discovery endpoint returns all agents."""
        from a2a.discovery import global_discovery
        import asyncio

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(global_discovery())

        assert "protocolVersion" in response
        assert "agents" in response

    def test_multi_agent_listing_endpoint(self, mock_settings):
        """Verify multi-agent listing endpoint works."""
        from a2a.discovery import multi_agent_listing
        import asyncio

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(multi_agent_listing())

        assert "count" in response
        assert "agents" in response

    def test_individual_agent_discovery(self, mock_settings):
        """Verify individual agent discovery works."""
        from a2a.discovery import agent_discovery
        import asyncio

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(
                agent_discovery("dashboard_gateway")
            )

        assert response["name"] == "dashboard_gateway"
        assert "@context" in response

    def test_individual_agent_not_found(self, mock_settings):
        """Verify 404 for unknown agent."""
        from a2a.discovery import agent_discovery
        from fastapi import HTTPException
        import asyncio

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                asyncio.get_event_loop().run_until_complete(
                    agent_discovery("nonexistent_agent")
                )

        assert exc_info.value.status_code == 404


class TestProtocolCompliance:
    """Test suite for A2A protocol compliance."""

    def test_agent_card_schema_compliance(self):
        """Verify AgentCard output matches A2A spec."""
        from a2a.agent_card import build_agent_card

        card = build_agent_card(
            agent_id="dashboard_gateway",
            base_url="http://localhost:8000",
            path="/a2a/dashboard",
        )

        data = card.model_dump(by_alias=True)

        # Required A2A spec fields
        assert "@context" in data
        assert "@type" in data
        assert data["@type"] == "AIAgent"
        assert "name" in data
        assert "description" in data
        assert "url" in data
        assert "version" in data
        assert "capabilities" in data
        assert "skills" in data

    def test_protocol_version_matches_constants(self):
        """Verify protocol version uses DMConstants."""
        from a2a.agent_card import AgentCard
        from constants.dm_constants import DMConstants

        card = AgentCard(
            name="test",
            description="test",
            url="http://test",
        )

        assert card.version == DMConstants.A2A.PROTOCOL_VERSION

    def test_discovery_response_protocol_version(self):
        """Verify discovery response includes correct protocol version."""
        from a2a.agent_card import build_discovery_response
        from constants.dm_constants import DMConstants

        response = build_discovery_response(
            agents={"dashboard_gateway": "/a2a/dashboard"},
            base_url="http://localhost:8000",
        )

        assert response["protocolVersion"] == DMConstants.A2A.PROTOCOL_VERSION
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `agents/a2a/__init__.py` | A2A module init with exports |
| `agents/a2a/agent_card.py` | AgentCard models and builder functions |
| `agents/a2a/discovery.py` | FastAPI router for discovery endpoints |
| `agents/tests/test_dm_02_3_agentcard_discovery.py` | Comprehensive unit tests |

### Files to Modify (Integration - DM-02.4)

| File | Change |
|------|--------|
| `agents/main.py` | Mount discovery router (deferred to DM-02.4 with Dashboard agent) |

---

## Testing Requirements

### Unit Tests

| Test Class | Tests | Purpose |
|------------|-------|---------|
| `TestAgentCardModels` | 9 | Verify Pydantic model structure |
| `TestAgentMetadata` | 4 | Verify agent metadata definitions |
| `TestAgentCardBuilders` | 8 | Verify builder functions |
| `TestDiscoveryEndpoints` | 4 | Verify FastAPI endpoints |
| `TestProtocolCompliance` | 3 | Verify A2A spec compliance |
| **Total** | **28** | Exceeds minimum coverage requirements |

### Integration Tests (Future - with mounted router)

| Test Case | Description |
|-----------|-------------|
| `test_well_known_agent_json_accessible` | Verify `/.well-known/agent.json` responds |
| `test_well_known_agents_accessible` | Verify `/.well-known/agents` responds |
| `test_external_discovery_works` | Verify external A2A client can discover |

---

## Definition of Done

- [ ] `agents/a2a/__init__.py` created with exports
- [ ] `agents/a2a/agent_card.py` created with:
  - [ ] `Skill` Pydantic model
  - [ ] `Capabilities` Pydantic model
  - [ ] `Provider` Pydantic model
  - [ ] `Authentication` Pydantic model
  - [ ] `AgentCard` Pydantic model with JSON-LD aliases
  - [ ] `AGENT_METADATA` definitions for all known agents
  - [ ] `build_agent_card()` builder function
  - [ ] `build_discovery_response()` for global discovery
  - [ ] `build_multi_agent_response()` for multi-agent listing
- [ ] `agents/a2a/discovery.py` created with:
  - [ ] `GET /.well-known/agent.json` endpoint
  - [ ] `GET /.well-known/agents` endpoint
  - [ ] `GET /a2a/{agent_id}/.well-known/agent.json` endpoint
- [ ] Unit tests pass (`pytest agents/tests/test_dm_02_3_agentcard_discovery.py`)
- [ ] All AgentCards use DMConstants.A2A.PROTOCOL_VERSION
- [ ] AgentCard JSON-LD structure matches A2A specification
- [ ] Discovery endpoints are unauthenticated (public metadata)

---

## Technical Notes

### A2A Protocol Version

The A2A protocol version is defined in `DMConstants.A2A.PROTOCOL_VERSION` and must be used consistently:

```python
from constants.dm_constants import DMConstants

# Use this everywhere
version = DMConstants.A2A.PROTOCOL_VERSION  # "0.3.0"
```

### JSON-LD Aliases

Pydantic's `Field(alias="@context")` enables JSON-LD compliant output. Always use `model_dump(by_alias=True)` when serializing for A2A responses:

```python
card = AgentCard(...)
json_response = card.model_dump(by_alias=True)  # Includes @context, @type
```

### Discovery Endpoint Security

Discovery endpoints are intentionally unauthenticated because:
1. They return public metadata only (no sensitive data)
2. A2A protocol expects discoverable agents
3. External agents need to discover capabilities before authentication

### Agent Metadata Extension

To add new agents, extend `AGENT_METADATA` in `agent_card.py`:

```python
AGENT_METADATA["new_agent"] = {
    "name": "new_agent",
    "description": "New agent description",
    "skills": [Skill(...)],
    "capabilities": Capabilities(...),
}
```

### Integration Notes

The discovery router will be mounted in `agents/main.py` when the Dashboard Gateway agent is created (DM-02.4):

```python
from a2a.discovery import router as discovery_router

app.include_router(discovery_router)
```

---

## References

- [Epic DM-02 Definition](../epics/epic-dm-02-agno-multiinterface.md)
- [Epic DM-02 Tech Spec](../epics/epic-dm-02-tech-spec.md) - Section 3.3
- [Story DM-02.2: AgentOS Multi-Interface Setup](./dm-02-2-agentos-multiinterface-setup.md)
- [DM Constants](../../../../agents/constants/dm_constants.py)
- [AgentOS Config](../../../../agents/agentos/config.py) - INTERFACE_CONFIGS
- [A2A Protocol Spec](https://github.com/google/a2a-protocol)
- [Google A2A Protocol Documentation](https://google.github.io/a2a/)

---

*Story Created: 2025-12-30*
*Story Completed: 2025-12-30*
*Epic: DM-02 | Story: 3 of 9 | Points: 3*

---

## Implementation Notes

**Implementation Date:** 2025-12-30

### Files Created

| File | Size | Description |
|------|------|-------------|
| `agents/a2a/__init__.py` | 1,210 bytes | A2A module exports |
| `agents/a2a/agent_card.py` | 13,715 bytes | AgentCard Pydantic models and builders |
| `agents/a2a/discovery.py` | 4,580 bytes | FastAPI discovery endpoints |
| `agents/tests/test_dm_02_3_agentcard_discovery.py` | 18,952 bytes | Unit tests (37 tests) |

### Test Results

```
======================== 37 passed =========================
```

### Key Implementation Details

1. **AgentCard Models**: JSON-LD compliant with @context/@type aliases
2. **AGENT_METADATA**: Definitions for dashboard_gateway, navi, pulse, herald
3. **Builder Functions**: `build_agent_card()`, `build_discovery_response()`, `build_multi_agent_response()`
4. **Discovery Endpoints**: Unauthenticated per A2A spec

---

## Code Review

**Review Date:** 2025-12-30
**Reviewer:** Claude Code (Senior Developer Review)

### Review Summary

Story DM-02.3 implementation fully meets all acceptance criteria with 37 passing tests.

### Strengths

1. **Correct JSON-LD Format**: `@context` and `@type` aliases properly implemented
2. **DMConstants Usage**: All version references use `DMConstants.A2A.PROTOCOL_VERSION`
3. **Comprehensive Tests**: 37 tests (exceeds 28 minimum)
4. **Clean Documentation**: All classes and functions have docstrings
5. **Proper Error Handling**: 404 responses distinguish "not found" vs "not enabled"
6. **Security Correct**: Discovery endpoints properly unauthenticated

### Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ PASS | AgentCard, Skill, Capabilities, Provider, Authentication models |
| AC2 | ✅ PASS | AGENT_METADATA with 4 agent definitions |
| AC3 | ✅ PASS | `GET /.well-known/agent.json` endpoint |
| AC4 | ✅ PASS | `GET /.well-known/agents` endpoint |
| AC5 | ✅ PASS | TestProtocolCompliance with 6 tests |

### Verdict

**✅ APPROVED**

Excellent implementation with proper A2A protocol compliance and comprehensive testing.
