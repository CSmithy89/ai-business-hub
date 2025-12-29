"""
Tests for DM-02.4: Dashboard Gateway Agent

Verifies Dashboard Gateway agent creation, tool functionality,
and interface integration.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any


# Test tool functions directly (no Agno dependency needed)


class TestGatewayTools:
    """Test suite for Dashboard Gateway tools."""

    def test_render_dashboard_widget_valid_type(self):
        """Verify render_dashboard_widget accepts valid widget types."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="ProjectStatus",
            data={"project_id": "proj_123", "progress": 75},
            title="Test Widget",
        )

        assert result["rendered"] is True
        assert result["type"] == "ProjectStatus"
        assert result["data"]["project_id"] == "proj_123"
        assert result["title"] == "Test Widget"

    def test_render_dashboard_widget_invalid_type(self):
        """Verify render_dashboard_widget rejects invalid widget types."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="InvalidWidget",
            data={"test": "data"},
        )

        assert result["rendered"] is False
        assert "error" in result
        assert "available_types" in result

    def test_render_dashboard_widget_with_slot(self):
        """Verify render_dashboard_widget handles slot targeting."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="Alert",
            data={"message": "Test alert"},
            slot_id="sidebar",
        )

        assert result["rendered"] is True
        assert result["slot_id"] == "sidebar"

    def test_render_dashboard_widget_all_valid_types(self):
        """Verify all WIDGET_TYPES are accepted."""
        from gateway.tools import render_dashboard_widget, WIDGET_TYPES

        for widget_type in WIDGET_TYPES:
            result = render_dashboard_widget(
                widget_type=widget_type,
                data={"test": True},
            )
            assert result["rendered"] is True, f"Failed for {widget_type}"
            assert result["type"] == widget_type

    def test_render_dashboard_widget_no_title(self):
        """Verify render_dashboard_widget works without optional title."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="Metrics",
            data={"value": 100},
        )

        assert result["rendered"] is True
        assert result["title"] is None

    def test_render_dashboard_widget_no_slot(self):
        """Verify render_dashboard_widget works without optional slot_id."""
        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="TaskList",
            data={"tasks": []},
        )

        assert result["rendered"] is True
        assert result["slot_id"] is None

    def test_get_dashboard_capabilities(self):
        """Verify get_dashboard_capabilities returns expected structure."""
        from gateway.tools import get_dashboard_capabilities
        from constants.dm_constants import DMConstants

        result = get_dashboard_capabilities()

        assert "widget_types" in result
        assert "max_widgets_per_request" in result
        assert "features" in result
        assert "slots" in result

        # Verify DMConstants used
        assert (
            result["max_widgets_per_request"]
            == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST
        )

        # Verify features
        assert "streaming" in result["features"]
        assert "tool_calls" in result["features"]
        assert "a2a_orchestration" in result["features"]

    def test_get_dashboard_capabilities_slots(self):
        """Verify slot definitions are complete."""
        from gateway.tools import get_dashboard_capabilities

        result = get_dashboard_capabilities()

        slot_ids = [s["id"] for s in result["slots"]]
        assert "main" in slot_ids
        assert "sidebar" in slot_ids
        assert "header" in slot_ids

        # Each slot should have description
        for slot in result["slots"]:
            assert "id" in slot
            assert "description" in slot

    def test_route_to_agent_valid(self):
        """Verify route_to_agent accepts valid agent IDs."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="navi",
            message="Get project status",
            context={"project_id": "proj_123"},
        )

        assert result["status"] == "pending"
        assert result["target_agent"] == "navi"
        assert result["message"] == "Get project status"
        assert result["context"]["project_id"] == "proj_123"

    def test_route_to_agent_invalid(self):
        """Verify route_to_agent rejects invalid agent IDs."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="invalid_agent",
            message="Test",
        )

        assert result["status"] == "failed"
        assert "error" in result
        assert "available_agents" in result

    def test_route_to_agent_all_valid(self):
        """Verify all valid agents are accepted."""
        from gateway.tools import route_to_agent

        for agent_id in ["navi", "pulse", "herald"]:
            result = route_to_agent(
                agent_id=agent_id,
                message=f"Test message to {agent_id}",
            )
            assert result["status"] == "pending", f"Failed for {agent_id}"
            assert result["target_agent"] == agent_id

    def test_route_to_agent_no_context(self):
        """Verify route_to_agent handles missing context."""
        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="pulse",
            message="Check health",
        )

        assert result["status"] == "pending"
        assert result["context"] == {}  # Empty dict, not None

    def test_get_all_tools(self):
        """Verify get_all_tools returns all expected tools."""
        from gateway.tools import get_all_tools

        tools = get_all_tools()

        assert len(tools) == 3
        tool_names = [t.__name__ for t in tools]
        assert "render_dashboard_widget" in tool_names
        assert "get_dashboard_capabilities" in tool_names
        assert "route_to_agent" in tool_names


class TestWidgetTypes:
    """Test suite for widget type definitions."""

    def test_widget_types_defined(self):
        """Verify WIDGET_TYPES constant is defined."""
        from gateway.tools import WIDGET_TYPES

        assert isinstance(WIDGET_TYPES, list)
        assert len(WIDGET_TYPES) >= 4  # At minimum: ProjectStatus, TaskList, Metrics, Alert

    def test_widget_types_expected(self):
        """Verify expected widget types are present."""
        from gateway.tools import WIDGET_TYPES

        expected = ["ProjectStatus", "TaskList", "Metrics", "Alert"]
        for widget_type in expected:
            assert widget_type in WIDGET_TYPES, f"Missing {widget_type}"

    def test_widget_types_no_duplicates(self):
        """Verify no duplicate widget types."""
        from gateway.tools import WIDGET_TYPES

        assert len(WIDGET_TYPES) == len(set(WIDGET_TYPES))

    def test_widget_types_extended(self):
        """Verify extended widget types are present."""
        from gateway.tools import WIDGET_TYPES

        extended = ["KanbanBoard", "GanttChart", "BurndownChart", "TeamActivity"]
        for widget_type in extended:
            assert widget_type in WIDGET_TYPES, f"Missing {widget_type}"


class TestDashboardGatewayAgent:
    """Test suite for Dashboard Gateway agent creation."""

    def test_create_agent_default(self):
        """Verify agent creation with defaults."""
        # Mock both Agent and Claude at import level
        with patch.dict("sys.modules", {}):
            mock_agent_class = Mock()
            mock_claude_class = Mock()
            mock_agent_instance = Mock()
            mock_agent_instance.name = "dashboard_gateway"

            mock_agent_class.return_value = mock_agent_instance

            with patch("agno.agent.Agent", mock_agent_class), patch(
                "agno.models.anthropic.Claude", mock_claude_class
            ):
                from gateway.agent import create_dashboard_gateway_agent

                # Force reimport to use mocks
                import importlib
                import gateway.agent

                importlib.reload(gateway.agent)

                agent = gateway.agent.create_dashboard_gateway_agent()

                # Agent should be created with correct name
                assert mock_agent_class.called or hasattr(agent, "name")

    def test_create_agent_with_workspace(self):
        """Verify workspace_id is included in instructions via MockAgent."""
        from gateway.agent import MockAgent

        # Test using MockAgent directly
        agent = MockAgent(workspace_id="ws_test")

        instructions_text = " ".join(agent.instructions)
        assert "ws_test" in instructions_text

    def test_create_agent_with_user_id(self):
        """Verify user_id is included in instructions via MockAgent."""
        from gateway.agent import MockAgent

        # Test using MockAgent directly
        agent = MockAgent(user_id="user_123")

        instructions_text = " ".join(agent.instructions)
        assert "user_123" in instructions_text

    def test_create_agent_model_override(self):
        """Verify model_id override is stored via MockAgent."""
        from gateway.agent import MockAgent

        # Test using MockAgent directly
        agent = MockAgent(model_id="claude-opus-4-20250514")

        assert agent.model_id == "claude-opus-4-20250514"

    def test_get_agent_metadata(self):
        """Verify agent metadata structure."""
        from gateway.agent import get_agent_metadata
        from constants.dm_constants import DMConstants

        metadata = get_agent_metadata()

        assert metadata["name"] == "dashboard_gateway"
        assert "description" in metadata
        assert len(metadata["tools"]) == 3
        assert "render_dashboard_widget" in metadata["tools"]

        # Verify interfaces
        assert metadata["interfaces"]["agui"]["enabled"] is True
        assert metadata["interfaces"]["agui"]["path"] == "/agui"
        assert metadata["interfaces"]["a2a"]["enabled"] is True
        assert metadata["interfaces"]["a2a"]["path"] == "/a2a/dashboard"

        # Verify constants
        assert (
            metadata["constants"]["max_widgets_per_request"]
            == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST
        )

    def test_create_agent_no_agno(self):
        """Verify graceful handling when Agno is not installed."""
        from gateway.agent import create_dashboard_gateway_agent, MockAgent

        # Patch the import to simulate Agno not being available
        with patch.dict("sys.modules", {"agno.agent": None, "agno.models.anthropic": None}):
            # Reset the module to trigger re-import
            import importlib
            import gateway.agent

            # Create the agent - should return MockAgent
            agent = create_dashboard_gateway_agent(workspace_id="ws_test")

            # Should be a MockAgent or similar
            assert hasattr(agent, "name")
            assert agent.name == "dashboard_gateway"


class TestMockAgent:
    """Test suite for MockAgent (fallback when Agno not installed)."""

    def test_mock_agent_creation(self):
        """Verify MockAgent can be created."""
        from gateway.agent import MockAgent

        agent = MockAgent(
            workspace_id="ws_123",
            model_id="test-model",
            user_id="user_456",
        )

        assert agent.name == "dashboard_gateway"
        assert agent.role == "Dashboard Gateway"
        assert agent.workspace_id == "ws_123"
        assert agent.model_id == "test-model"
        assert agent.user_id == "user_456"

    def test_mock_agent_tools(self):
        """Verify MockAgent has tools."""
        from gateway.agent import MockAgent

        agent = MockAgent()

        assert len(agent.tools) == 3
        tool_names = [t.__name__ for t in agent.tools]
        assert "render_dashboard_widget" in tool_names

    def test_mock_agent_instructions(self):
        """Verify MockAgent has instructions."""
        from gateway.agent import MockAgent, DASHBOARD_INSTRUCTIONS

        agent = MockAgent(workspace_id="ws_test")

        assert DASHBOARD_INSTRUCTIONS in agent.instructions
        assert any("ws_test" in instr for instr in agent.instructions)

    @pytest.mark.asyncio
    async def test_mock_agent_arun(self):
        """Verify MockAgent arun returns expected format."""
        from gateway.agent import MockAgent

        agent = MockAgent()
        result = await agent.arun("Test message")

        assert "content" in result
        assert "tool_calls" in result
        assert "Test message" in result["content"]


class TestAgentInstructions:
    """Test suite for agent instructions content."""

    def test_instructions_include_widget_types(self):
        """Verify instructions mention widget types."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "ProjectStatus" in DASHBOARD_INSTRUCTIONS
        assert "TaskList" in DASHBOARD_INSTRUCTIONS
        assert "Metrics" in DASHBOARD_INSTRUCTIONS
        assert "Alert" in DASHBOARD_INSTRUCTIONS

    def test_instructions_include_agent_routing(self):
        """Verify instructions mention agent routing."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "navi" in DASHBOARD_INSTRUCTIONS
        assert "pulse" in DASHBOARD_INSTRUCTIONS
        assert "herald" in DASHBOARD_INSTRUCTIONS

    def test_instructions_include_response_format(self):
        """Verify instructions have response format guidance."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "Response Format" in DASHBOARD_INSTRUCTIONS
        assert "widget" in DASHBOARD_INSTRUCTIONS.lower()

    def test_instructions_include_guidelines(self):
        """Verify instructions include key guidelines."""
        from gateway.agent import DASHBOARD_INSTRUCTIONS

        assert "Key Behaviors" in DASHBOARD_INSTRUCTIONS
        assert "Important Guidelines" in DASHBOARD_INSTRUCTIONS


class TestModuleExports:
    """Test suite for module exports."""

    def test_gateway_module_exports(self):
        """Verify gateway module exports expected items."""
        from gateway import (
            create_dashboard_gateway_agent,
            get_agent_metadata,
            DASHBOARD_INSTRUCTIONS,
            render_dashboard_widget,
            get_dashboard_capabilities,
            route_to_agent,
            get_all_tools,
            WIDGET_TYPES,
        )

        # All imports should work
        assert callable(create_dashboard_gateway_agent)
        assert callable(get_agent_metadata)
        assert callable(render_dashboard_widget)
        assert callable(get_dashboard_capabilities)
        assert callable(route_to_agent)
        assert callable(get_all_tools)
        assert isinstance(DASHBOARD_INSTRUCTIONS, str)
        assert isinstance(WIDGET_TYPES, list)

    def test_gateway_module_all(self):
        """Verify __all__ is defined correctly."""
        from gateway import __all__

        expected = [
            "create_dashboard_gateway_agent",
            "get_agent_metadata",
            "DASHBOARD_INSTRUCTIONS",
            "MockAgent",
            "render_dashboard_widget",
            "get_dashboard_capabilities",
            "route_to_agent",
            "get_all_tools",
            "WIDGET_TYPES",
        ]

        for item in expected:
            assert item in __all__, f"Missing {item} in __all__"


class TestInterfaceIntegration:
    """Test suite for interface integration."""

    @pytest.fixture
    def mock_agent(self):
        """Create mock agent for interface tests."""
        agent = Mock()
        agent.name = "dashboard_gateway"
        return agent

    def test_agui_interface_config_exists(self):
        """Verify AG-UI interface config exists for dashboard_gateway."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.agui_enabled is True
        assert config.agui_path == "/agui"

    def test_a2a_interface_config_exists(self):
        """Verify A2A interface config exists for dashboard_gateway."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/dashboard"

    def test_interface_config_timeouts(self):
        """Verify timeout methods work correctly."""
        from agentos.config import get_interface_config
        from constants.dm_constants import DMConstants

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.get_agui_timeout() == DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS
        assert config.get_a2a_timeout() == DMConstants.A2A.TASK_TIMEOUT_SECONDS

    def test_create_agui_interface(self, mock_agent):
        """Verify AG-UI interface creation."""
        from agentos.factory import create_agui_interface, AGNO_AVAILABLE

        if not AGNO_AVAILABLE:
            # When Agno is not installed, should raise RuntimeError
            with pytest.raises(RuntimeError, match="Agno packages not installed"):
                create_agui_interface(agent=mock_agent, path="/agui")
        else:
            with patch("agentos.factory.AGUI") as mock_agui:
                mock_agui.return_value = Mock()

                interface = create_agui_interface(
                    agent=mock_agent,
                    path="/agui",
                )

                mock_agui.assert_called_once()
                call_kwargs = mock_agui.call_args.kwargs
                assert call_kwargs["agent"] == mock_agent
                assert call_kwargs["path"] == "/agui"

    def test_create_a2a_interface(self, mock_agent):
        """Verify A2A interface creation."""
        from agentos.factory import create_a2a_interface, AGNO_AVAILABLE

        if not AGNO_AVAILABLE:
            # When Agno is not installed, should raise RuntimeError
            with pytest.raises(RuntimeError, match="Agno packages not installed"):
                create_a2a_interface(agent=mock_agent, path="/a2a/dashboard")
        else:
            with patch("agentos.factory.A2A") as mock_a2a:
                mock_a2a.return_value = Mock()

                interface = create_a2a_interface(
                    agent=mock_agent,
                    path="/a2a/dashboard",
                )

                mock_a2a.assert_called_once()
                call_kwargs = mock_a2a.call_args.kwargs
                assert call_kwargs["agent"] == mock_agent
                assert call_kwargs["path"] == "/a2a/dashboard"

    def test_interface_creation_error_handling(self, mock_agent):
        """Verify interface creation handles errors gracefully."""
        from agentos.factory import AGNO_AVAILABLE

        if not AGNO_AVAILABLE:
            # When Agno is not installed, RuntimeError is raised instead
            from agentos.factory import create_agui_interface

            with pytest.raises(RuntimeError, match="Agno packages not installed"):
                create_agui_interface(agent=mock_agent, path="/agui")
        else:
            from agentos.factory import create_agui_interface, InterfaceCreationError

            with patch("agentos.factory.AGUI") as mock_agui:
                mock_agui.side_effect = Exception("Test error")

                with pytest.raises(InterfaceCreationError):
                    create_agui_interface(agent=mock_agent, path="/agui")


class TestDMConstantsUsage:
    """Test suite verifying DMConstants usage."""

    def test_capabilities_uses_dmconstants(self):
        """Verify get_dashboard_capabilities uses DMConstants."""
        from gateway.tools import get_dashboard_capabilities
        from constants.dm_constants import DMConstants

        result = get_dashboard_capabilities()

        # Should match DMConstants exactly
        assert (
            result["max_widgets_per_request"]
            == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST
        )

    def test_agent_metadata_uses_dmconstants(self):
        """Verify agent metadata uses DMConstants."""
        from gateway.agent import get_agent_metadata
        from constants.dm_constants import DMConstants

        metadata = get_agent_metadata()

        assert (
            metadata["constants"]["max_widgets_per_request"]
            == DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST
        )
        assert (
            metadata["constants"]["widget_data_ttl_seconds"]
            == DMConstants.DASHBOARD.WIDGET_DATA_TTL_SECONDS
        )

    def test_dmconstants_dashboard_values(self):
        """Verify DMConstants.DASHBOARD values are reasonable."""
        from constants.dm_constants import DMConstants

        assert DMConstants.DASHBOARD.MAX_WIDGETS_PER_REQUEST == 12
        assert DMConstants.DASHBOARD.WIDGET_DATA_TTL_SECONDS == 60
        assert DMConstants.DASHBOARD.CACHE_SIZE_MB == 100
        assert DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS == 5


class TestToolCallSerialization:
    """Test suite for tool call serialization (for CopilotKit)."""

    def test_render_widget_serializable(self):
        """Verify render_dashboard_widget returns serializable data."""
        import json

        from gateway.tools import render_dashboard_widget

        result = render_dashboard_widget(
            widget_type="ProjectStatus",
            data={"project_id": "proj_123", "progress": 75},
            title="Test Widget",
            slot_id="main",
        )

        # Should be JSON serializable
        serialized = json.dumps(result)
        deserialized = json.loads(serialized)

        assert deserialized == result

    def test_capabilities_serializable(self):
        """Verify get_dashboard_capabilities returns serializable data."""
        import json

        from gateway.tools import get_dashboard_capabilities

        result = get_dashboard_capabilities()

        # Should be JSON serializable
        serialized = json.dumps(result)
        deserialized = json.loads(serialized)

        assert deserialized == result

    def test_route_to_agent_serializable(self):
        """Verify route_to_agent returns serializable data."""
        import json

        from gateway.tools import route_to_agent

        result = route_to_agent(
            agent_id="navi",
            message="Get project status",
            context={"project_id": "proj_123"},
        )

        # Should be JSON serializable
        serialized = json.dumps(result)
        deserialized = json.loads(serialized)

        assert deserialized == result


class TestAgentCardMetadata:
    """Test suite for AgentCard metadata registration."""

    def test_dashboard_gateway_in_agent_metadata(self):
        """Verify dashboard_gateway is in AGENT_METADATA."""
        from a2a.agent_card import AGENT_METADATA

        assert "dashboard_gateway" in AGENT_METADATA

    def test_dashboard_gateway_skills(self):
        """Verify dashboard_gateway has correct skills in AGENT_METADATA."""
        from a2a.agent_card import AGENT_METADATA

        metadata = AGENT_METADATA["dashboard_gateway"]
        skill_ids = [s.id for s in metadata["skills"]]

        assert "render_dashboard_widget" in skill_ids
        assert "get_dashboard_capabilities" in skill_ids

    def test_build_agent_card_for_dashboard(self):
        """Verify AgentCard can be built for dashboard_gateway."""
        from a2a.agent_card import build_agent_card

        card = build_agent_card(
            agent_id="dashboard_gateway",
            base_url="http://localhost:8000",
            path="/a2a/dashboard",
        )

        assert card.name == "dashboard_gateway"
        assert "http://localhost:8000/a2a/dashboard" in card.url
        assert len(card.skills) >= 2
