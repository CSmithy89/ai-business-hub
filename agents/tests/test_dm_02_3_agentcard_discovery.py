"""
Tests for DM-02.3: A2A AgentCard Discovery

Verifies AgentCard models, builders, and discovery endpoints
for A2A protocol compliance.

Test Suites:
- TestAgentCardModels: Verify Pydantic model structure
- TestAgentMetadata: Verify agent metadata definitions
- TestAgentCardBuilders: Verify builder functions
- TestDiscoveryEndpoints: Verify FastAPI endpoints
- TestProtocolCompliance: Verify A2A spec compliance
"""
import asyncio
from unittest.mock import MagicMock, patch

import pytest

from constants.dm_constants import DMConstants


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
        assert skill.tags is None

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

    def test_skill_with_tags(self):
        """Verify Skill can include tags."""
        from a2a.agent_card import Skill

        skill = Skill(
            id="tagged_skill",
            name="Tagged Skill",
            description="Skill with tags",
            tags=["dashboard", "ui", "widget"],
        )

        assert skill.tags is not None
        assert len(skill.tags) == 3
        assert "dashboard" in skill.tags

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

    def test_provider_custom(self):
        """Verify Provider can be customized."""
        from a2a.agent_card import Provider

        provider = Provider(organization="Custom Org", url="https://example.com")

        assert provider.organization == "Custom Org"
        assert provider.url == "https://example.com"

    def test_authentication_defaults(self):
        """Verify Authentication has correct defaults."""
        from a2a.agent_card import Authentication

        auth = Authentication()

        assert "bearer" in auth.schemes
        assert auth.required is False

    def test_agent_card_creation(self):
        """Verify AgentCard can be created with required fields."""
        from a2a.agent_card import AgentCard

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

    def test_all_agents_have_required_fields(self):
        """Verify all agents in AGENT_METADATA have required fields."""
        from a2a.agent_card import AGENT_METADATA

        required_fields = ["name", "description", "skills", "capabilities"]

        for agent_id, metadata in AGENT_METADATA.items():
            for field in required_fields:
                assert field in metadata, f"{agent_id} missing {field}"


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
        from a2a.agent_card import Skill, build_agent_card

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

    def test_build_discovery_response_empty_agents(self):
        """Verify build_discovery_response handles empty agents dict."""
        from a2a.agent_card import build_discovery_response

        response = build_discovery_response(
            agents={},
            base_url="http://localhost:8000",
        )

        assert response["protocolVersion"] == DMConstants.A2A.PROTOCOL_VERSION
        assert len(response["agents"]) == 0
        assert "discoveredAt" in response

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
        assert "discoveredAt" in response

        # Check agent entries have required fields
        for agent in response["agents"]:
            assert "id" in agent
            assert "name" in agent
            assert "url" in agent
            assert "discoveryUrl" in agent

    def test_build_multi_agent_response_includes_unknown(self):
        """Verify build_multi_agent_response includes unknown agents with defaults."""
        from a2a.agent_card import build_multi_agent_response

        agents = {
            "dashboard_gateway": "/a2a/dashboard",
            "custom_agent": "/a2a/custom",  # Not in AGENT_METADATA
        }

        response = build_multi_agent_response(
            agents=agents,
            base_url="http://localhost:8000",
        )

        # Should include both agents
        assert response["count"] == 2

        # Find the custom agent
        custom_agent = next((a for a in response["agents"] if a["id"] == "custom_agent"), None)
        assert custom_agent is not None
        assert custom_agent["name"] == "custom_agent"
        assert "custom_agent agent" in custom_agent["description"]


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

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(global_discovery())

        assert "protocolVersion" in response
        assert "agents" in response
        assert response["protocolVersion"] == DMConstants.A2A.PROTOCOL_VERSION

    def test_multi_agent_listing_endpoint(self, mock_settings):
        """Verify multi-agent listing endpoint works."""
        from a2a.discovery import multi_agent_listing

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(multi_agent_listing())

        assert "count" in response
        assert "agents" in response

    def test_individual_agent_discovery(self, mock_settings):
        """Verify individual agent discovery works."""
        from a2a.discovery import agent_discovery

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            response = asyncio.get_event_loop().run_until_complete(
                agent_discovery("dashboard_gateway")
            )

        assert response["name"] == "dashboard_gateway"
        assert "@context" in response
        assert "@type" in response

    def test_individual_agent_not_found(self, mock_settings):
        """Verify 404 for unknown agent."""
        from fastapi import HTTPException

        from a2a.discovery import agent_discovery

        with patch("a2a.discovery.get_agentos_settings", return_value=mock_settings):
            with pytest.raises(HTTPException) as exc_info:
                asyncio.get_event_loop().run_until_complete(
                    agent_discovery("nonexistent_agent")
                )

        assert exc_info.value.status_code == 404

    def test_get_a2a_agents_filters_correctly(self):
        """Verify _get_a2a_agents filters by a2a_enabled."""
        from a2a.discovery import _get_a2a_agents

        agents = _get_a2a_agents()

        # All returned agents should have A2A enabled
        assert len(agents) >= 4  # dashboard_gateway, navi, pulse, herald
        assert "dashboard_gateway" in agents
        assert "navi" in agents


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
        assert "defaultInputModes" in data
        assert "defaultOutputModes" in data

    def test_protocol_version_matches_constants(self):
        """Verify protocol version uses DMConstants."""
        from a2a.agent_card import AgentCard

        card = AgentCard(
            name="test",
            description="test",
            url="http://test",
        )

        assert card.version == DMConstants.A2A.PROTOCOL_VERSION

    def test_discovery_response_protocol_version(self):
        """Verify discovery response includes correct protocol version."""
        from a2a.agent_card import build_discovery_response

        response = build_discovery_response(
            agents={"dashboard_gateway": "/a2a/dashboard"},
            base_url="http://localhost:8000",
        )

        assert response["protocolVersion"] == DMConstants.A2A.PROTOCOL_VERSION

    def test_capabilities_follows_a2a_spec(self):
        """Verify Capabilities model matches A2A spec field names."""
        from a2a.agent_card import Capabilities

        caps = Capabilities()
        data = caps.model_dump()

        # A2A spec uses camelCase
        assert "streaming" in data
        assert "pushNotifications" in data
        assert "stateTransfer" in data

    def test_skill_follows_a2a_spec(self):
        """Verify Skill model matches A2A spec field names."""
        from a2a.agent_card import Skill

        skill = Skill(
            id="test",
            name="Test",
            description="Test skill",
            tags=["test"],
            examples=["example"],
        )
        data = skill.model_dump()

        # A2A spec fields
        assert "id" in data
        assert "name" in data
        assert "description" in data
        assert "tags" in data
        assert "examples" in data

    def test_json_ld_context_is_schema_org(self):
        """Verify JSON-LD @context is schema.org."""
        from a2a.agent_card import AgentCard

        card = AgentCard(
            name="test",
            description="test",
            url="http://test",
        )

        data = card.model_dump(by_alias=True)
        assert data["@context"] == "https://schema.org"
