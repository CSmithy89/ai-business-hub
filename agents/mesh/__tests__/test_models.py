"""
Tests for Agent Mesh Models

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
from datetime import datetime, timezone

import pytest

from mesh.models import (
    AgentCapability,
    AgentCapabilityType,
    AgentEndpoint,
    AgentHealth,
    MeshAgentCard,
)


class TestAgentCapabilityType:
    """Tests for AgentCapabilityType enum."""

    def test_enum_values(self):
        """Should have all expected capability types."""
        assert AgentCapabilityType.PROJECT_MANAGEMENT == "project_management"
        assert AgentCapabilityType.KNOWLEDGE_BASE == "knowledge_base"
        assert AgentCapabilityType.CRM == "crm"
        assert AgentCapabilityType.CONTENT == "content"
        assert AgentCapabilityType.CUSTOM == "custom"


class TestAgentHealth:
    """Tests for AgentHealth enum."""

    def test_health_values(self):
        """Should have all expected health statuses."""
        assert AgentHealth.HEALTHY == "healthy"
        assert AgentHealth.DEGRADED == "degraded"
        assert AgentHealth.UNHEALTHY == "unhealthy"
        assert AgentHealth.UNKNOWN == "unknown"


class TestAgentCapability:
    """Tests for AgentCapability model."""

    def test_creates_capability_with_defaults(self):
        """Should create capability with default modes."""
        cap = AgentCapability(
            id="search",
            name="Search",
            description="Search capability",
        )

        assert cap.id == "search"
        assert cap.name == "Search"
        assert cap.description == "Search capability"
        assert cap.input_modes == ["text"]
        assert cap.output_modes == ["text"]
        assert cap.tags is None

    def test_creates_capability_with_custom_modes(self):
        """Should create capability with custom modes."""
        cap = AgentCapability(
            id="image_gen",
            name="Image Generation",
            description="Generate images from text",
            input_modes=["text"],
            output_modes=["image", "text"],
            tags=["ai", "image"],
        )

        assert cap.output_modes == ["image", "text"]
        assert cap.tags == ["ai", "image"]

    def test_capability_alias_fields(self):
        """Should support camelCase aliases."""
        cap = AgentCapability(
            id="test",
            name="Test",
            description="Test capability",
            inputModes=["text", "audio"],
            outputModes=["text"],
        )

        assert cap.input_modes == ["text", "audio"]

    def test_to_dict(self):
        """Should convert to dictionary with camelCase keys."""
        cap = AgentCapability(
            id="test",
            name="Test",
            description="Test capability",
            input_modes=["text"],
            output_modes=["text", "json"],
            tags=["test"],
        )

        result = cap.to_dict()

        assert result["id"] == "test"
        assert result["inputModes"] == ["text"]
        assert result["outputModes"] == ["text", "json"]
        assert result["tags"] == ["test"]


class TestAgentEndpoint:
    """Tests for AgentEndpoint model."""

    def test_creates_endpoint(self):
        """Should create endpoint with URL."""
        endpoint = AgentEndpoint(url="http://localhost:8000")

        assert endpoint.url == "http://localhost:8000"
        assert endpoint.path == ""

    def test_full_url_without_path(self):
        """Should return base URL when no path specified."""
        endpoint = AgentEndpoint(url="http://localhost:8000/")

        assert endpoint.full_url == "http://localhost:8000"

    def test_full_url_with_path(self):
        """Should return combined URL with path."""
        endpoint = AgentEndpoint(
            url="http://localhost:8000",
            path="/a2a/navi",
        )

        assert endpoint.full_url == "http://localhost:8000/a2a/navi"

    def test_to_dict(self):
        """Should convert to dictionary."""
        endpoint = AgentEndpoint(
            url="http://localhost:8000",
            path="/a2a/navi",
        )

        result = endpoint.to_dict()

        assert result["url"] == "http://localhost:8000"
        assert result["path"] == "/a2a/navi"
        assert result["fullUrl"] == "http://localhost:8000/a2a/navi"


class TestMeshAgentCard:
    """Tests for MeshAgentCard model."""

    def test_creates_agent_card_with_required_fields(self):
        """Should create agent card with required fields."""
        card = MeshAgentCard(
            name="TestAgent",
            description="A test agent",
            url="http://localhost:8000",
        )

        assert card.name == "TestAgent"
        assert card.description == "A test agent"
        assert card.url == "http://localhost:8000"
        assert card.version == "1.0.0"
        assert card.is_external is False
        assert card.module is None
        assert card.health == AgentHealth.UNKNOWN
        assert card.skills == []

    def test_creates_agent_card_with_all_fields(self):
        """Should create agent card with all fields."""
        card = MeshAgentCard(
            name="PMAgent",
            description="Project Management agent",
            url="http://localhost:8001/a2a/navi",
            version="2.0.0",
            capabilities={"streaming": True},
            skills=[
                AgentCapability(
                    id="planning",
                    name="Planning",
                    description="Project planning",
                )
            ],
            default_input_modes=["text", "json"],
            default_output_modes=["text"],
            is_external=False,
            module="pm",
            health=AgentHealth.HEALTHY,
            metadata={"priority": 1},
        )

        assert card.name == "PMAgent"
        assert card.version == "2.0.0"
        assert card.capabilities == {"streaming": True}
        assert len(card.skills) == 1
        assert card.module == "pm"
        assert card.health == AgentHealth.HEALTHY
        assert card.metadata == {"priority": 1}

    def test_default_timestamps(self):
        """Should set default timestamps."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
        )

        assert card.created_at is not None
        assert card.last_seen is not None
        assert isinstance(card.created_at, datetime)

    def test_to_json_ld(self):
        """Should convert to JSON-LD format."""
        card = MeshAgentCard(
            name="TestAgent",
            description="A test agent",
            url="http://localhost:8000",
            skills=[
                AgentCapability(
                    id="search",
                    name="Search",
                    description="Search capability",
                )
            ],
        )

        json_ld = card.to_json_ld()

        assert json_ld["@context"] == "https://schema.org"
        assert json_ld["@type"] == "AIAgent"
        assert json_ld["name"] == "TestAgent"
        assert json_ld["description"] == "A test agent"
        assert json_ld["url"] == "http://localhost:8000"
        assert json_ld["version"] == "1.0.0"
        assert len(json_ld["skills"]) == 1
        assert json_ld["skills"][0]["id"] == "search"
        assert json_ld["defaultInputModes"] == ["text"]
        assert json_ld["defaultOutputModes"] == ["text"]

    def test_to_dict(self):
        """Should convert to dictionary with camelCase keys."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
            module="pm",
            is_external=True,
            health=AgentHealth.HEALTHY,
        )

        result = card.to_dict()

        assert result["name"] == "TestAgent"
        assert result["isExternal"] is True
        assert result["module"] == "pm"
        assert result["health"] == "healthy"
        assert "createdAt" in result
        assert "lastSeen" in result

    def test_update_last_seen(self):
        """Should update last_seen timestamp."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
        )

        old_last_seen = card.last_seen
        card.update_last_seen()

        assert card.last_seen >= old_last_seen

    def test_has_capability_true(self):
        """Should return True when agent has capability."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
            skills=[
                AgentCapability(id="search", name="Search", description="Search"),
                AgentCapability(id="planning", name="Planning", description="Planning"),
            ],
        )

        assert card.has_capability("search") is True
        assert card.has_capability("planning") is True

    def test_has_capability_false(self):
        """Should return False when agent lacks capability."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
            skills=[
                AgentCapability(id="search", name="Search", description="Search"),
            ],
        )

        assert card.has_capability("planning") is False
        assert card.has_capability("unknown") is False

    def test_get_endpoint(self):
        """Should return AgentEndpoint for the card."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000/a2a/test",
        )

        endpoint = card.get_endpoint()

        assert isinstance(endpoint, AgentEndpoint)
        assert endpoint.url == "http://localhost:8000/a2a/test"

    def test_serialize_datetime(self):
        """Should serialize datetime to ISO format."""
        fixed_time = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
            created_at=fixed_time,
            last_seen=fixed_time,
        )

        result = card.to_dict()

        assert result["createdAt"] == "2025-01-01T12:00:00Z"
        assert result["lastSeen"] == "2025-01-01T12:00:00Z"

    def test_alias_fields(self):
        """Should support camelCase aliases for creation."""
        card = MeshAgentCard(
            name="TestAgent",
            description="Test",
            url="http://localhost:8000",
            defaultInputModes=["text", "json"],
            defaultOutputModes=["text"],
            isExternal=True,
        )

        assert card.default_input_modes == ["text", "json"]
        assert card.default_output_modes == ["text"]
        assert card.is_external is True
