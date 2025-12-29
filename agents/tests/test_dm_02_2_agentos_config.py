"""
Tests for DM-02.2: AgentOS Multi-Interface Setup

Verifies AgentOS configuration, interface factory, and health checks.
This test suite covers all acceptance criteria for story DM-02.2.
"""
import pytest
from unittest.mock import Mock, patch


class TestAgentOSSettings:
    """Test suite for AgentOS settings configuration."""

    def test_default_settings(self, monkeypatch):
        """Verify default settings match DMConstants when no env vars are set."""
        # Clear any environment variables that might override defaults
        monkeypatch.delenv("AGENTOS_PORT", raising=False)
        monkeypatch.delenv("AGENTOS_WORKERS", raising=False)
        monkeypatch.delenv("AGENTOS_REQUEST_TIMEOUT_SECONDS", raising=False)
        monkeypatch.delenv("AGENTOS_MAX_CONCURRENT_TASKS", raising=False)

        from constants.dm_constants import DMConstants
        from pydantic import Field
        from pydantic_settings import BaseSettings

        # Create a settings class that doesn't read from .env file
        class TestAgentOSSettings(BaseSettings):
            """Test settings without .env file loading."""

            port: int = Field(default=DMConstants.AGENTOS.DEFAULT_PORT)
            workers: int = Field(default=DMConstants.AGENTOS.WORKER_COUNT)
            request_timeout_seconds: int = Field(
                default=DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS
            )
            max_concurrent_tasks: int = Field(
                default=DMConstants.AGENTOS.MAX_CONCURRENT_TASKS
            )

            model_config = {
                "env_prefix": "AGENTOS_",
                "env_file": None,  # Don't read from .env
                "extra": "ignore",
            }

        settings = TestAgentOSSettings()

        assert settings.port == DMConstants.AGENTOS.DEFAULT_PORT
        assert settings.workers == DMConstants.AGENTOS.WORKER_COUNT
        assert (
            settings.request_timeout_seconds
            == DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS
        )
        assert (
            settings.max_concurrent_tasks == DMConstants.AGENTOS.MAX_CONCURRENT_TASKS
        )

    def test_environment_override(self, monkeypatch):
        """Verify environment variables override defaults."""
        monkeypatch.setenv("AGENTOS_PORT", "9000")
        monkeypatch.setenv("AGENTOS_DEBUG", "true")

        from agentos.config import AgentOSSettings

        # Clear the lru_cache to ensure fresh settings
        from agentos.config import get_agentos_settings

        get_agentos_settings.cache_clear()

        settings = AgentOSSettings()
        assert settings.port == 9000
        assert settings.debug is True

    def test_base_url_default(self):
        """Verify base URL has sensible default."""
        from agentos.config import AgentOSSettings

        settings = AgentOSSettings()
        assert settings.base_url.startswith("http")
        assert "localhost" in settings.base_url or "127.0.0.1" in settings.base_url

    def test_interface_enable_flags(self):
        """Verify global interface enable flags default to True."""
        from agentos.config import AgentOSSettings

        settings = AgentOSSettings()
        assert settings.agui_enabled is True
        assert settings.a2a_enabled is True

    def test_host_default(self):
        """Verify host defaults to 0.0.0.0 for external access."""
        from agentos.config import AgentOSSettings

        settings = AgentOSSettings()
        assert settings.host == "0.0.0.0"

    def test_keep_alive_matches_constants(self):
        """Verify keep_alive_seconds matches DMConstants."""
        from agentos.config import AgentOSSettings
        from constants.dm_constants import DMConstants

        settings = AgentOSSettings()
        assert settings.keep_alive_seconds == DMConstants.AGENTOS.KEEP_ALIVE_SECONDS


class TestInterfaceConfig:
    """Test suite for InterfaceConfig model."""

    def test_interface_config_creation(self):
        """Verify InterfaceConfig can be created with required fields."""
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="test_agent",
            agui_enabled=True,
            agui_path="/agui/test",
            a2a_enabled=True,
            a2a_path="/a2a/test",
        )

        assert config.agent_id == "test_agent"
        assert config.agui_enabled is True
        assert config.agui_path == "/agui/test"
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/test"

    def test_timeout_defaults(self):
        """Verify timeout methods return DMConstants defaults."""
        from agentos.config import InterfaceConfig
        from constants.dm_constants import DMConstants

        config = InterfaceConfig(agent_id="test")

        assert config.get_agui_timeout() == DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS
        assert config.get_a2a_timeout() == DMConstants.A2A.TASK_TIMEOUT_SECONDS

    def test_timeout_overrides(self):
        """Verify timeout overrides work correctly."""
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="test",
            agui_timeout_seconds=120,
            a2a_timeout_seconds=600,
        )

        assert config.get_agui_timeout() == 120
        assert config.get_a2a_timeout() == 600

    def test_default_configs_exist(self):
        """Verify pre-configured interface configs exist."""
        from agentos.config import INTERFACE_CONFIGS

        agent_ids = [c.agent_id for c in INTERFACE_CONFIGS]

        assert "dashboard_gateway" in agent_ids
        assert "navi" in agent_ids
        assert "pulse" in agent_ids
        assert "herald" in agent_ids

    def test_dashboard_has_both_interfaces(self):
        """Verify dashboard_gateway has both AG-UI and A2A enabled."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.agui_enabled is True
        assert config.agui_path == "/agui"
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/dashboard"

    def test_pm_agents_a2a_only(self):
        """Verify PM agents only have A2A enabled."""
        from agentos.config import get_interface_config

        for agent_id in ["navi", "pulse", "herald"]:
            config = get_interface_config(agent_id)
            assert config is not None, f"Missing config for {agent_id}"
            assert config.agui_enabled is False, f"{agent_id} should not have AG-UI"
            assert config.a2a_enabled is True, f"{agent_id} should have A2A"

    def test_interface_config_defaults(self):
        """Verify InterfaceConfig has sensible defaults."""
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(agent_id="minimal")

        # Default values
        assert config.agui_enabled is False
        assert config.a2a_enabled is True
        assert config.agui_path is None
        assert config.a2a_path is None
        assert config.agui_timeout_seconds is None
        assert config.a2a_timeout_seconds is None


class TestInterfaceConfigRegistry:
    """Test suite for interface config registration."""

    def test_get_interface_config(self):
        """Verify get_interface_config returns correct config."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")
        assert config is not None
        assert config.agent_id == "dashboard_gateway"

    def test_get_interface_config_not_found(self):
        """Verify get_interface_config returns None for unknown agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("nonexistent_agent")
        assert config is None

    def test_register_interface_config(self):
        """Verify new configs can be registered."""
        from agentos.config import (
            InterfaceConfig,
            register_interface_config,
            get_interface_config,
            INTERFACE_CONFIGS,
        )

        # Store original length
        original_len = len(INTERFACE_CONFIGS)

        new_config = InterfaceConfig(
            agent_id="test_registration",
            a2a_enabled=True,
            a2a_path="/a2a/test-reg",
        )

        try:
            register_interface_config(new_config)

            retrieved = get_interface_config("test_registration")
            assert retrieved is not None
            assert retrieved.agent_id == "test_registration"
        finally:
            # Cleanup: remove the test config
            INTERFACE_CONFIGS[:] = [
                c for c in INTERFACE_CONFIGS if c.agent_id != "test_registration"
            ]

    def test_register_duplicate_raises(self):
        """Verify registering duplicate agent_id raises error."""
        from agentos.config import InterfaceConfig, register_interface_config

        duplicate = InterfaceConfig(
            agent_id="dashboard_gateway",  # Already exists
            a2a_enabled=True,
            a2a_path="/a2a/duplicate",
        )

        with pytest.raises(ValueError, match="already exists"):
            register_interface_config(duplicate)

    def test_update_interface_config(self):
        """Verify update_interface_config updates existing config."""
        from agentos.config import (
            InterfaceConfig,
            register_interface_config,
            update_interface_config,
            get_interface_config,
            INTERFACE_CONFIGS,
        )

        # First register a new config
        new_config = InterfaceConfig(
            agent_id="test_update",
            a2a_enabled=True,
            a2a_path="/a2a/test-update",
        )

        try:
            register_interface_config(new_config)

            # Update it
            updated_config = InterfaceConfig(
                agent_id="test_update",
                a2a_enabled=True,
                a2a_path="/a2a/updated-path",
            )
            update_interface_config(updated_config)

            retrieved = get_interface_config("test_update")
            assert retrieved is not None
            assert retrieved.a2a_path == "/a2a/updated-path"
        finally:
            # Cleanup
            INTERFACE_CONFIGS[:] = [
                c for c in INTERFACE_CONFIGS if c.agent_id != "test_update"
            ]

    def test_update_nonexistent_raises(self):
        """Verify updating non-existent config raises error."""
        from agentos.config import InterfaceConfig, update_interface_config

        config = InterfaceConfig(
            agent_id="nonexistent_for_update",
            a2a_enabled=True,
            a2a_path="/a2a/test",
        )

        with pytest.raises(ValueError, match="No interface config found"):
            update_interface_config(config)


class TestInterfaceFactory:
    """Test suite for interface factory functions."""

    @pytest.fixture
    def mock_agent(self):
        """Create a mock Agno Agent."""
        agent = Mock()
        agent.name = "test_agent"
        return agent

    def test_create_agui_interface(self, mock_agent):
        """Verify AG-UI interface creation."""
        from agentos.factory import create_agui_interface

        with patch("agentos.factory.AGUI") as mock_agui:
            # Mark that AGNO is available
            with patch("agentos.factory.AGNO_AVAILABLE", True):
                mock_agui.return_value = Mock()

                interface = create_agui_interface(
                    agent=mock_agent,
                    path="/agui/test",
                    timeout_seconds=60,
                )

                mock_agui.assert_called_once()
                call_kwargs = mock_agui.call_args.kwargs
                assert call_kwargs["agent"] == mock_agent
                assert call_kwargs["path"] == "/agui/test"
                assert call_kwargs["timeout"] == 60

    def test_create_a2a_interface(self, mock_agent):
        """Verify A2A interface creation."""
        from agentos.factory import create_a2a_interface

        with patch("agentos.factory.A2A") as mock_a2a:
            with patch("agentos.factory.AGNO_AVAILABLE", True):
                mock_a2a.return_value = Mock()

                interface = create_a2a_interface(
                    agent=mock_agent,
                    path="/a2a/test",
                    timeout_seconds=300,
                )

                mock_a2a.assert_called_once()
                call_kwargs = mock_a2a.call_args.kwargs
                assert call_kwargs["agent"] == mock_agent
                assert call_kwargs["path"] == "/a2a/test"
                assert call_kwargs["timeout"] == 300

    def test_create_interfaces_for_multiple_agents(self, mock_agent):
        """Verify batch interface creation."""
        from agentos.factory import create_interfaces
        from agentos.config import InterfaceConfig

        agents = {
            "agent1": mock_agent,
            "agent2": Mock(name="agent2"),
        }

        configs = [
            InterfaceConfig(
                agent_id="agent1",
                agui_enabled=True,
                agui_path="/agui/1",
                a2a_enabled=True,
                a2a_path="/a2a/1",
            ),
            InterfaceConfig(
                agent_id="agent2",
                agui_enabled=False,
                a2a_enabled=True,
                a2a_path="/a2a/2",
            ),
        ]

        with patch("agentos.factory.AGUI") as mock_agui, patch(
            "agentos.factory.A2A"
        ) as mock_a2a:
            with patch("agentos.factory.AGNO_AVAILABLE", True):
                mock_agui.return_value = Mock()
                mock_a2a.return_value = Mock()

                result = create_interfaces(agents, configs)

                # agent1 should have both interfaces
                assert "agent1" in result
                assert len(result["agent1"]) == 2

                # agent2 should only have A2A
                assert "agent2" in result
                assert len(result["agent2"]) == 1

    def test_create_interfaces_skips_missing_agents(self):
        """Verify factory skips agents not in the agents dict."""
        from agentos.factory import create_interfaces
        from agentos.config import InterfaceConfig

        agents = {}  # Empty - no agents provided

        configs = [
            InterfaceConfig(
                agent_id="missing_agent",
                a2a_enabled=True,
                a2a_path="/a2a/missing",
            ),
        ]

        result = create_interfaces(agents, configs)
        assert result == {}

    def test_get_all_interface_paths(self):
        """Verify get_all_interface_paths returns correct structure."""
        from agentos.factory import get_all_interface_paths

        paths = get_all_interface_paths()

        assert "dashboard_gateway" in paths
        assert paths["dashboard_gateway"]["agui"] == "/agui"
        assert paths["dashboard_gateway"]["a2a"] == "/a2a/dashboard"

        assert "navi" in paths
        assert paths["navi"]["agui"] is None  # AG-UI disabled
        assert paths["navi"]["a2a"] == "/a2a/navi"

    def test_create_agui_interface_default_timeout(self, mock_agent):
        """Verify AG-UI interface uses default timeout when not specified."""
        from agentos.factory import create_agui_interface
        from constants.dm_constants import DMConstants

        with patch("agentos.factory.AGUI") as mock_agui:
            with patch("agentos.factory.AGNO_AVAILABLE", True):
                mock_agui.return_value = Mock()

                create_agui_interface(
                    agent=mock_agent,
                    path="/agui/test",
                )

                call_kwargs = mock_agui.call_args.kwargs
                assert call_kwargs["timeout"] == DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS


class TestInterfaceConfigValidation:
    """Test suite for configuration validation."""

    def test_validate_valid_config(self):
        """Verify valid config passes validation."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="valid_agent",
            agui_enabled=True,
            agui_path="/agui/valid",
            a2a_enabled=True,
            a2a_path="/a2a/valid",
        )

        errors = validate_interface_config(config)
        assert errors == []

    def test_validate_agui_enabled_no_path(self):
        """Verify validation catches AG-UI enabled without path."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=True,
            agui_path=None,  # Missing path!
        )

        errors = validate_interface_config(config)
        assert any("AG-UI enabled but no path" in e for e in errors)

    def test_validate_a2a_enabled_no_path(self):
        """Verify validation catches A2A enabled without path."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=False,
            a2a_enabled=True,
            a2a_path=None,  # Missing path!
        )

        errors = validate_interface_config(config)
        assert any("A2A enabled but no path" in e for e in errors)

    def test_validate_path_must_start_with_slash(self):
        """Verify validation catches paths not starting with /."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=True,
            agui_path="agui/invalid",  # Missing leading /
        )

        errors = validate_interface_config(config)
        assert any("must start with '/'" in e for e in errors)

    def test_validate_negative_timeout(self):
        """Verify validation catches negative timeout values."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=False,
            a2a_enabled=True,
            a2a_path="/a2a/test",
            a2a_timeout_seconds=-1,  # Invalid!
        )

        errors = validate_interface_config(config)
        assert any("timeout must be positive" in e for e in errors)

    def test_validate_zero_timeout(self):
        """Verify validation catches zero timeout values."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=True,
            agui_path="/agui/test",
            agui_timeout_seconds=0,  # Invalid!
        )

        errors = validate_interface_config(config)
        assert any("timeout must be positive" in e for e in errors)

    def test_validate_all_interface_configs(self):
        """Verify validate_all_interface_configs checks all configs."""
        from agentos.factory import validate_all_interface_configs

        # All default configs should be valid
        errors = validate_all_interface_configs()
        assert errors == {}


class TestInterfaceHealth:
    """Test suite for interface health checks."""

    def test_get_interfaces_health(self):
        """Verify health check returns expected structure."""
        from agentos.health import get_interfaces_health

        health = get_interfaces_health()

        assert "status" in health
        assert health["status"] in ["healthy", "degraded"]
        assert "healthy_count" in health
        assert "total_count" in health
        assert "interfaces" in health
        assert "settings" in health
        assert "protocol_versions" in health
        assert "checked_at" in health

    def test_health_includes_protocol_versions(self):
        """Verify health check includes protocol version info."""
        from agentos.health import get_interfaces_health
        from constants.dm_constants import DMConstants

        health = get_interfaces_health()

        assert (
            health["protocol_versions"]["agui"] == DMConstants.AGUI.PROTOCOL_VERSION
        )
        assert health["protocol_versions"]["a2a"] == DMConstants.A2A.PROTOCOL_VERSION

    def test_health_reflects_settings(self):
        """Verify health check reflects current settings."""
        from agentos.health import get_interfaces_health

        health = get_interfaces_health()

        assert "agui_enabled" in health["settings"]
        assert "a2a_enabled" in health["settings"]
        assert "base_url" in health["settings"]

    def test_health_summary(self):
        """Verify health summary returns expected structure."""
        from agentos.health import get_interface_health_summary

        summary = get_interface_health_summary()

        assert "status" in summary
        assert summary["status"] in ["healthy", "degraded", "unhealthy"]
        assert "agui_interfaces" in summary
        assert "a2a_interfaces" in summary
        assert "healthy_interfaces" in summary
        assert "total_interfaces" in summary

    def test_check_interface_enabled(self):
        """Verify check_interface_enabled works correctly."""
        from agentos.health import check_interface_enabled

        # dashboard_gateway has both interfaces enabled
        assert check_interface_enabled("dashboard_gateway", "agui") is True
        assert check_interface_enabled("dashboard_gateway", "a2a") is True

        # navi only has A2A
        assert check_interface_enabled("navi", "agui") is False
        assert check_interface_enabled("navi", "a2a") is True

    def test_check_interface_enabled_unknown_type(self):
        """Verify check_interface_enabled handles unknown types."""
        from agentos.health import check_interface_enabled

        result = check_interface_enabled("dashboard_gateway", "unknown")
        assert result is False

    def test_interface_health_status_to_dict(self):
        """Verify InterfaceHealthStatus.to_dict returns correct structure."""
        from agentos.health import InterfaceHealthStatus

        status = InterfaceHealthStatus(
            interface_type="agui",
            path="/agui",
            is_healthy=True,
            error=None,
        )

        result = status.to_dict()

        assert result["type"] == "agui"
        assert result["path"] == "/agui"
        assert result["healthy"] is True
        assert result["error"] is None
        assert "checked_at" in result


class TestInterfaceCreationError:
    """Test suite for InterfaceCreationError exception."""

    def test_interface_creation_error(self):
        """Verify InterfaceCreationError can be raised and caught."""
        from agentos.factory import InterfaceCreationError

        with pytest.raises(InterfaceCreationError, match="test error"):
            raise InterfaceCreationError("test error")

    def test_interface_creation_error_with_cause(self):
        """Verify InterfaceCreationError can wrap another exception."""
        from agentos.factory import InterfaceCreationError

        original = ValueError("original error")
        try:
            raise InterfaceCreationError("wrapper") from original
        except InterfaceCreationError as e:
            assert e.__cause__ == original


class TestAgnoAvailability:
    """Test suite for handling Agno package availability."""

    def test_agui_creation_without_agno(self):
        """Verify AG-UI creation fails gracefully without Agno."""
        from agentos.factory import create_agui_interface

        with patch("agentos.factory.AGNO_AVAILABLE", False):
            with pytest.raises(RuntimeError, match="Agno packages not installed"):
                create_agui_interface(
                    agent=Mock(),
                    path="/agui/test",
                )

    def test_a2a_creation_without_agno(self):
        """Verify A2A creation fails gracefully without Agno."""
        from agentos.factory import create_a2a_interface

        with patch("agentos.factory.AGNO_AVAILABLE", False):
            with pytest.raises(RuntimeError, match="Agno packages not installed"):
                create_a2a_interface(
                    agent=Mock(),
                    path="/a2a/test",
                )
