"""
Agent Mesh Models

Defines core data models for the Universal Agent Mesh:
- AgentCapability: Describes what an agent can do
- AgentHealth: Health status enumeration
- AgentEndpoint: Agent connection information
- MeshAgentCard: Extended A2A AgentCard for mesh registration

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_serializer


class AgentCapabilityType(str, Enum):
    """Standard capability types for agent classification."""

    PROJECT_MANAGEMENT = "project_management"
    KNOWLEDGE_BASE = "knowledge_base"
    CONTENT = "content"
    CRM = "crm"
    BRANDING = "branding"
    PLANNING = "planning"
    ANALYTICS = "analytics"
    COMMUNICATION = "communication"
    INTEGRATION = "integration"
    ORCHESTRATION = "orchestration"
    CUSTOM = "custom"


class AgentHealth(str, Enum):
    """Agent health status."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


class AgentCapability(BaseModel):
    """
    Agent capability definition.

    Describes a specific capability or skill that an agent can perform.
    Used for capability-based routing and discovery.

    Attributes:
        id: Unique capability identifier
        name: Human-readable capability name
        description: Detailed description of the capability
        input_modes: Supported input modes (default: ["text"])
        output_modes: Supported output modes (default: ["text"])
        tags: Optional keywords for categorization
    """

    id: str = Field(..., description="Unique capability identifier")
    name: str = Field(..., description="Human-readable capability name")
    description: str = Field(..., description="Capability description")
    input_modes: List[str] = Field(
        default_factory=lambda: ["text"],
        alias="inputModes",
        description="Supported input modes",
    )
    output_modes: List[str] = Field(
        default_factory=lambda: ["text"],
        alias="outputModes",
        description="Supported output modes",
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="Keywords for categorization",
    )

    model_config = {"populate_by_name": True}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with camelCase keys."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "inputModes": self.input_modes,
            "outputModes": self.output_modes,
            "tags": self.tags,
        }


class AgentEndpoint(BaseModel):
    """
    Agent endpoint connection information.

    Contains the URL and path information needed to connect to an agent.

    Attributes:
        url: Base URL of the agent
        path: A2A endpoint path (e.g., "/a2a/navi")
        full_url: Computed full URL for A2A calls
    """

    url: str = Field(..., description="Base URL of the agent")
    path: str = Field(default="", description="A2A endpoint path")

    @property
    def full_url(self) -> str:
        """Get the full A2A endpoint URL."""
        base = self.url.rstrip("/")
        if self.path:
            return f"{base}{self.path}"
        return base

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "url": self.url,
            "path": self.path,
            "fullUrl": self.full_url,
        }


class MeshAgentCard(BaseModel):
    """
    Extended A2A AgentCard for mesh registration.

    Combines the standard A2A AgentCard fields with mesh-specific
    metadata for registry management, health tracking, and routing.

    Attributes:
        name: Agent name/identifier
        description: Human-readable agent description
        url: A2A endpoint URL
        version: Agent version
        capabilities: Protocol capabilities dict
        skills: List of agent capabilities/skills
        default_input_modes: Supported input modes
        default_output_modes: Supported output modes
        created_at: Registration timestamp
        last_seen: Last activity timestamp
        is_external: Whether agent is external to HYVVE
        module: Module the agent belongs to (pm, kb, crm, etc.)
        health: Current health status
        metadata: Additional metadata
    """

    name: str = Field(..., description="Agent name/identifier")
    description: str = Field(..., description="Agent description")
    url: str = Field(..., description="A2A endpoint URL")
    version: str = Field(default="1.0.0", description="Agent version")
    capabilities: Dict[str, Any] = Field(
        default_factory=dict,
        description="Protocol capabilities (streaming, pushNotifications, etc.)",
    )
    skills: List[AgentCapability] = Field(
        default_factory=list,
        description="Agent skills/capabilities",
    )
    default_input_modes: List[str] = Field(
        default_factory=lambda: ["text"],
        alias="defaultInputModes",
        description="Supported input modes",
    )
    default_output_modes: List[str] = Field(
        default_factory=lambda: ["text"],
        alias="defaultOutputModes",
        description="Supported output modes",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        alias="createdAt",
        description="Registration timestamp",
    )
    last_seen: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        alias="lastSeen",
        description="Last activity timestamp",
    )
    is_external: bool = Field(
        default=False,
        alias="isExternal",
        description="Whether agent is external",
    )
    module: Optional[str] = Field(
        default=None,
        description="Module the agent belongs to",
    )
    health: AgentHealth = Field(
        default=AgentHealth.UNKNOWN,
        description="Current health status",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata",
    )

    model_config = {"populate_by_name": True}

    @field_serializer("created_at", "last_seen")
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat().replace("+00:00", "Z")

    @field_serializer("health")
    def serialize_health(self, value: AgentHealth) -> str:
        """Serialize health enum to string."""
        return value.value

    def to_json_ld(self) -> Dict[str, Any]:
        """
        Convert to JSON-LD format for A2A discovery.

        Returns the AgentCard in the standard A2A JSON-LD format
        suitable for the /.well-known/agent.json endpoint.

        Returns:
            Dict with JSON-LD structure
        """
        return {
            "@context": "https://schema.org",
            "@type": "AIAgent",
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "version": self.version,
            "capabilities": self.capabilities,
            "skills": [
                {
                    "id": skill.id,
                    "name": skill.name,
                    "description": skill.description,
                    "inputModes": skill.input_modes,
                    "outputModes": skill.output_modes,
                }
                for skill in self.skills
            ],
            "defaultInputModes": self.default_input_modes,
            "defaultOutputModes": self.default_output_modes,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with camelCase keys."""
        return {
            "name": self.name,
            "description": self.description,
            "url": self.url,
            "version": self.version,
            "capabilities": self.capabilities,
            "skills": [s.to_dict() for s in self.skills],
            "defaultInputModes": self.default_input_modes,
            "defaultOutputModes": self.default_output_modes,
            "createdAt": self.serialize_datetime(self.created_at),
            "lastSeen": self.serialize_datetime(self.last_seen),
            "isExternal": self.is_external,
            "module": self.module,
            "health": self.health.value,
            "metadata": self.metadata,
        }

    def update_last_seen(self) -> None:
        """Update the last_seen timestamp to now."""
        self.last_seen = datetime.now(timezone.utc)

    def has_capability(self, capability_id: str) -> bool:
        """
        Check if the agent has a specific capability.

        Args:
            capability_id: The capability ID to check for

        Returns:
            True if agent has the capability
        """
        return any(skill.id == capability_id for skill in self.skills)

    def get_endpoint(self) -> AgentEndpoint:
        """Get the endpoint information for this agent."""
        return AgentEndpoint(url=self.url)
