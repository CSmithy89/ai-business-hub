"""
Tests for DM-02.5: Existing Agent Protocol Updates

Verifies PM agents (Navi, Vitals, Herald) A2A protocol support
and backward compatibility with existing REST endpoints.
"""

import sys
from unittest.mock import MagicMock

# Mock anthropic module and submodules before any imports
# This is necessary because agno.models.anthropic imports anthropic
anthropic_mock = MagicMock()
anthropic_mock.types = MagicMock()
anthropic_mock.lib = MagicMock()
anthropic_mock.lib.streaming = MagicMock()
anthropic_mock.lib.streaming._beta_types = MagicMock()

sys.modules["anthropic"] = anthropic_mock
sys.modules["anthropic.types"] = anthropic_mock.types
sys.modules["anthropic.lib"] = anthropic_mock.lib
sys.modules["anthropic.lib.streaming"] = anthropic_mock.lib.streaming
sys.modules["anthropic.lib.streaming._beta_types"] = anthropic_mock.lib.streaming._beta_types

import pytest
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

# Enable asyncio mode for pytest
pytest_plugins = ["anyio"]


class TestPMA2AAdapter:
    """Test suite for PMA2AAdapter class."""

    def test_adapter_creation(self):
        """Verify adapter can be created with agent and agent_id."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.name = "TestAgent"

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="test")

        assert adapter.agent == mock_agent
        assert adapter.agent_id == "test"

    def test_adapter_get_agent_info(self):
        """Verify get_agent_info returns expected structure."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.name = "Navi"
        mock_agent.role = "PM Orchestration Assistant"
        mock_agent.description = "Test description"
        mock_agent.tools = []

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        info = adapter.get_agent_info()

        assert info["agent_id"] == "navi"
        assert info["name"] == "Navi"
        assert info["role"] == "PM Orchestration Assistant"

    def test_adapter_a2a_path_property(self):
        """Verify a2a_path can be set and retrieved."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")

        assert adapter.a2a_path is None

        adapter.a2a_path = "/a2a/navi"
        assert adapter.a2a_path == "/a2a/navi"

    def test_adapter_get_capabilities_default(self):
        """Verify default capabilities for non-Herald agents."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        capabilities = adapter.get_capabilities()

        assert capabilities["streaming"] is True
        assert capabilities["pushNotifications"] is False
        assert capabilities["stateTransfer"] is False

    def test_adapter_get_capabilities_herald(self):
        """Verify Herald has pushNotifications enabled."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="herald")
        capabilities = adapter.get_capabilities()

        assert capabilities["streaming"] is True
        assert capabilities["pushNotifications"] is True
        assert capabilities["stateTransfer"] is False

    def test_adapter_get_capabilities_pulse(self):
        """Verify Pulse (Vitals) does NOT have pushNotifications."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="pulse")
        capabilities = adapter.get_capabilities()

        assert capabilities["streaming"] is True
        assert capabilities["pushNotifications"] is False
        assert capabilities["stateTransfer"] is False

    @pytest.mark.anyio
    async def test_handle_a2a_task_success(self):
        """Verify successful A2A task handling."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_response = Mock()
        mock_response.content = "Task completed successfully"
        mock_response.tool_calls = []
        mock_agent.arun = AsyncMock(return_value=mock_response)

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task("Test task message")

        assert result["status"] == "completed"
        assert result["content"] == "Task completed successfully"
        assert result["tool_calls"] == []
        assert result["artifacts"] == []

    @pytest.mark.anyio
    async def test_handle_a2a_task_with_context(self):
        """Verify A2A task with context is properly formatted."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_response = Mock()
        mock_response.content = "Response with context"
        mock_response.tool_calls = []
        mock_agent.arun = AsyncMock(return_value=mock_response)

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task(
            "Test task",
            context={"workspace_id": "ws_123", "project_id": "proj_456"}
        )

        # Verify context was included in call
        call_args = mock_agent.arun.call_args
        message = call_args.kwargs.get("message", call_args.args[0] if call_args.args else "")
        assert "ws_123" in message
        assert "proj_456" in message
        assert result["status"] == "completed"

    @pytest.mark.anyio
    async def test_handle_a2a_task_failure(self):
        """Verify A2A task handles exceptions gracefully."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.arun = AsyncMock(side_effect=Exception("Agent error"))

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")
        result = await adapter.handle_a2a_task("Test task")

        assert result["status"] == "failed"
        assert "error" in result
        assert "Agent error" in result["error"]

    def test_adapter_get_timeout_uses_dmconstants(self):
        """Verify get_timeout uses DMConstants."""
        from pm.a2a_adapter import PMA2AAdapter
        from constants.dm_constants import DMConstants

        mock_agent = Mock()
        adapter = PMA2AAdapter(agent=mock_agent, agent_id="navi")

        timeout = adapter.get_timeout()
        assert timeout == DMConstants.A2A.TASK_TIMEOUT_SECONDS


class TestCreatePmA2aAdapter:
    """Test suite for create_pm_a2a_adapter factory."""

    def test_factory_creates_adapter(self):
        """Verify factory creates adapter with correct agent_id."""
        from pm.a2a_adapter import create_pm_a2a_adapter, PMA2AAdapter

        mock_agent = Mock()
        adapter = create_pm_a2a_adapter(agent=mock_agent, agent_id="test")

        assert isinstance(adapter, PMA2AAdapter)
        assert adapter.agent_id == "test"


class TestNaviA2AAdapter:
    """Test suite for Navi agent A2A adapter factory."""

    def test_create_navi_a2a_adapter(self):
        """Verify Navi A2A adapter creation."""
        from pm.a2a_adapter import PMA2AAdapter
        from pm.navi import create_navi_a2a_adapter

        with patch("pm.navi.create_navi_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Navi"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_navi_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            assert adapter.agent_id == "navi"
            mock_create.assert_called_once()

    def test_navi_adapter_agent_id(self):
        """Verify Navi adapter uses correct agent_id."""
        from pm.navi import create_navi_a2a_adapter

        with patch("pm.navi.create_navi_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_navi_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            assert adapter.agent_id == "navi"


class TestVitalsA2AAdapter:
    """Test suite for Vitals agent A2A adapter factory."""

    def test_create_vitals_a2a_adapter(self):
        """Verify Vitals A2A adapter creation."""
        from pm.a2a_adapter import PMA2AAdapter
        from pm.vitals import create_vitals_a2a_adapter

        with patch("pm.vitals.create_vitals_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Vitals"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_vitals_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            # Uses "pulse" for config compatibility
            assert adapter.agent_id == "pulse"

    def test_vitals_adapter_uses_pulse_id(self):
        """Verify Vitals adapter uses 'pulse' agent_id for config compatibility."""
        from pm.vitals import create_vitals_a2a_adapter

        with patch("pm.vitals.create_vitals_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_vitals_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            # Agent ID should be "pulse" to match INTERFACE_CONFIGS
            assert adapter.agent_id == "pulse"


class TestHeraldA2AAdapter:
    """Test suite for Herald agent A2A adapter factory."""

    def test_create_herald_a2a_adapter(self):
        """Verify Herald A2A adapter creation."""
        from pm.a2a_adapter import PMA2AAdapter
        from pm.herald import create_herald_a2a_adapter

        with patch("pm.herald.create_herald_agent") as mock_create:
            mock_agent = Mock()
            mock_agent.name = "Herald"
            mock_create.return_value = mock_agent

            mock_memory = Mock()

            adapter = create_herald_a2a_adapter(
                workspace_id="ws_test",
                project_id="proj_test",
                shared_memory=mock_memory,
            )

            assert isinstance(adapter, PMA2AAdapter)
            assert adapter.agent_id == "herald"

    def test_herald_adapter_has_push_notifications(self):
        """Verify Herald adapter has pushNotifications capability."""
        from pm.herald import create_herald_a2a_adapter

        with patch("pm.herald.create_herald_agent") as mock_create:
            mock_agent = Mock()
            mock_create.return_value = mock_agent

            adapter = create_herald_a2a_adapter(
                workspace_id="ws",
                project_id="proj",
                shared_memory=Mock(),
            )

            capabilities = adapter.get_capabilities()
            assert capabilities["pushNotifications"] is True


class TestInterfaceConfigAlignment:
    """Test suite verifying alignment with INTERFACE_CONFIGS."""

    def test_navi_config_exists(self):
        """Verify INTERFACE_CONFIGS has navi agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("navi")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/navi"
        # Navi should NOT have AG-UI (frontend-only agents have AG-UI)
        assert config.agui_enabled is False

    def test_pulse_config_exists(self):
        """Verify INTERFACE_CONFIGS has pulse agent (maps to Vitals)."""
        from agentos.config import get_interface_config

        config = get_interface_config("pulse")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/pulse"
        assert config.agui_enabled is False

    def test_herald_config_exists(self):
        """Verify INTERFACE_CONFIGS has herald agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("herald")

        assert config is not None
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/herald"
        assert config.agui_enabled is False

    def test_pm_agents_no_agui(self):
        """Verify PM agents don't have AG-UI enabled (backend-only)."""
        from agentos.config import get_interface_config

        for agent_id in ["navi", "pulse", "herald"]:
            config = get_interface_config(agent_id)
            assert config.agui_enabled is False, f"{agent_id} should not have AG-UI"


class TestAgentMetadataAlignment:
    """Test suite verifying alignment with AGENT_METADATA for AgentCards."""

    def test_navi_metadata_exists(self):
        """Verify AGENT_METADATA has navi agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "navi" in AGENT_METADATA
        metadata = AGENT_METADATA["navi"]
        assert metadata["name"] == "navi"
        assert len(metadata["skills"]) >= 1

    def test_pulse_metadata_exists(self):
        """Verify AGENT_METADATA has pulse agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "pulse" in AGENT_METADATA
        metadata = AGENT_METADATA["pulse"]
        assert metadata["name"] == "pulse"
        assert len(metadata["skills"]) >= 1

    def test_herald_metadata_exists(self):
        """Verify AGENT_METADATA has herald agent."""
        from a2a.agent_card import AGENT_METADATA

        assert "herald" in AGENT_METADATA
        metadata = AGENT_METADATA["herald"]
        assert metadata["name"] == "herald"
        assert len(metadata["skills"]) >= 1

    def test_herald_metadata_push_notifications(self):
        """Verify Herald metadata has pushNotifications capability."""
        from a2a.agent_card import AGENT_METADATA

        herald = AGENT_METADATA["herald"]
        assert herald["capabilities"].pushNotifications is True


class TestBackwardCompatibility:
    """Test suite verifying backward compatibility with existing REST endpoints."""

    def test_navi_agent_factory_exists(self):
        """Verify create_navi_agent exists and is callable."""
        from pm.navi import create_navi_agent

        assert callable(create_navi_agent)

    def test_vitals_agent_factory_exists(self):
        """Verify create_vitals_agent exists and is callable."""
        from pm.vitals import create_vitals_agent

        assert callable(create_vitals_agent)

    def test_herald_agent_factory_exists(self):
        """Verify create_herald_agent exists and is callable."""
        from pm.herald import create_herald_agent

        assert callable(create_herald_agent)


class TestDMConstantsUsage:
    """Test suite verifying DMConstants usage (no magic numbers)."""

    def test_adapter_uses_dmconstants(self):
        """Verify A2A adapter references DMConstants."""
        # Import to ensure no hardcoded values
        from pm.a2a_adapter import DMConstants

        # Verify constants are accessible
        assert hasattr(DMConstants, "A2A")
        assert hasattr(DMConstants.A2A, "TASK_TIMEOUT_SECONDS")

    def test_dmconstants_a2a_values(self):
        """Verify DMConstants.A2A values are reasonable."""
        from constants.dm_constants import DMConstants

        assert DMConstants.A2A.TASK_TIMEOUT_SECONDS > 0
        assert DMConstants.A2A.TASK_TIMEOUT_SECONDS <= 600  # Max 10 minutes
        assert DMConstants.A2A.PROTOCOL_VERSION == "0.3.0"


class TestPMModuleExports:
    """Test suite verifying PM module exports."""

    def test_pm_a2a_adapter_exports(self):
        """Verify PM a2a_adapter module exports A2A adapter factories."""
        from pm.a2a_adapter import (
            PMA2AAdapter,
            create_pm_a2a_adapter,
        )

        assert PMA2AAdapter is not None
        assert create_pm_a2a_adapter is not None

    def test_pm_navi_a2a_exports(self):
        """Verify PM navi module exports A2A adapter factory."""
        from pm.navi import create_navi_a2a_adapter

        assert create_navi_a2a_adapter is not None

    def test_pm_vitals_a2a_exports(self):
        """Verify PM vitals module exports A2A adapter factory."""
        from pm.vitals import create_vitals_a2a_adapter

        assert create_vitals_a2a_adapter is not None

    def test_pm_herald_a2a_exports(self):
        """Verify PM herald module exports A2A adapter factory."""
        from pm.herald import create_herald_a2a_adapter

        assert create_herald_a2a_adapter is not None


class TestAdapterAgentInfoToolsExtraction:
    """Test suite for agent info tools extraction."""

    def test_get_agent_info_extracts_tools(self):
        """Verify get_agent_info extracts tool names correctly."""
        from pm.a2a_adapter import PMA2AAdapter

        def tool_one():
            pass

        def tool_two():
            pass

        mock_agent = Mock()
        mock_agent.name = "TestAgent"
        mock_agent.role = "Test Role"
        mock_agent.description = "Test Description"
        mock_agent.tools = [tool_one, tool_two]

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="test")
        info = adapter.get_agent_info()

        assert "tools" in info
        assert "tool_one" in info["tools"]
        assert "tool_two" in info["tools"]

    def test_get_agent_info_handles_no_tools(self):
        """Verify get_agent_info handles agents without tools."""
        from pm.a2a_adapter import PMA2AAdapter

        mock_agent = Mock()
        mock_agent.name = "TestAgent"
        # tools attribute doesn't exist
        del mock_agent.tools

        adapter = PMA2AAdapter(agent=mock_agent, agent_id="test")
        info = adapter.get_agent_info()

        assert "tools" in info
        assert info["tools"] == []
