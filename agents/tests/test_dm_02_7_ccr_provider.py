"""
Unit tests for DM-02.7: CCR-Agno Integration

Tests the CCR model provider and selector including:
- CCRModel initialization
- Hybrid mode selection logic
- CCR validation
- Agent model preferences
"""

import sys
from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock httpx before importing ccr modules
class MockConnectError(Exception):
    pass


class MockTimeoutException(Exception):
    pass


httpx_mock = MagicMock()
httpx_mock.ConnectError = MockConnectError
httpx_mock.TimeoutException = MockTimeoutException
httpx_mock.AsyncClient = MagicMock
sys.modules["httpx"] = httpx_mock

# Mock agno.models before importing
agno_models_mock = MagicMock()


class MockOpenAIChat:
    """Mock OpenAIChat for testing."""

    def __init__(self, id: str = "auto", base_url: str = "", api_key: str = "", **kwargs: Any):
        self.id = id
        self.base_url = base_url
        self.api_key = api_key
        self.kwargs = kwargs


class MockClaude:
    """Mock Claude for testing."""

    def __init__(self, id: str = "claude-sonnet-4-20250514", **kwargs: Any):
        self.id = id
        self.kwargs = kwargs


agno_models_mock.openai = MagicMock()
agno_models_mock.openai.OpenAIChat = MockOpenAIChat
agno_models_mock.anthropic = MagicMock()
agno_models_mock.anthropic.Claude = MockClaude
agno_models_mock.base = MagicMock()
agno_models_mock.base.Model = object
sys.modules["agno"] = MagicMock()
sys.modules["agno.models"] = agno_models_mock
sys.modules["agno.models.openai"] = agno_models_mock.openai
sys.modules["agno.models.anthropic"] = agno_models_mock.anthropic
sys.modules["agno.models.base"] = agno_models_mock.base

# Setup anyio for async tests
pytest_plugins = ["anyio"]

# Now import our modules
from constants.dm_constants import DMConstants
from models.selector import (
    AGENT_MODEL_PREFERENCES,
    get_agent_task_type,
    get_all_agent_preferences,
)


class TestAgentModelPreferences:
    """Tests for agent model preferences."""

    def test_preferences_exist_for_key_agents(self) -> None:
        """Verify preferences defined for major agents."""
        key_agents = ["dashboard_gateway", "navi", "sage", "pulse", "herald"]
        for agent_id in key_agents:
            assert agent_id in AGENT_MODEL_PREFERENCES, f"Missing preferences for {agent_id}"

    def test_dashboard_gateway_uses_reasoning(self) -> None:
        """Verify dashboard gateway prefers reasoning."""
        prefs = AGENT_MODEL_PREFERENCES.get("dashboard_gateway", {})
        assert prefs.get("task_type") == "reasoning"

    def test_navi_uses_reasoning(self) -> None:
        """Verify navi prefers reasoning."""
        prefs = AGENT_MODEL_PREFERENCES.get("navi", {})
        assert prefs.get("task_type") == "reasoning"

    def test_sage_uses_code_generation(self) -> None:
        """Verify sage prefers code generation."""
        prefs = AGENT_MODEL_PREFERENCES.get("sage", {})
        assert prefs.get("task_type") == "code_generation"

    def test_scribe_uses_long_context(self) -> None:
        """Verify scribe prefers long context."""
        prefs = AGENT_MODEL_PREFERENCES.get("scribe", {})
        assert prefs.get("task_type") == "long_context"

    def test_all_preferences_have_description(self) -> None:
        """Verify all preferences have descriptions."""
        for agent_id, prefs in AGENT_MODEL_PREFERENCES.items():
            assert "description" in prefs, f"Missing description for {agent_id}"


class TestGetAgentTaskType:
    """Tests for get_agent_task_type function."""

    def test_known_agent_returns_task_type(self) -> None:
        """Verify known agents return their task type."""
        assert get_agent_task_type("dashboard_gateway") == "reasoning"
        assert get_agent_task_type("sage") == "code_generation"
        assert get_agent_task_type("scribe") == "long_context"

    def test_unknown_agent_returns_default(self) -> None:
        """Verify unknown agents return 'default'."""
        assert get_agent_task_type("unknown_agent") == "default"
        assert get_agent_task_type("") == "default"


class TestGetAllAgentPreferences:
    """Tests for get_all_agent_preferences function."""

    def test_returns_copy(self) -> None:
        """Verify returns a copy, not the original."""
        prefs1 = get_all_agent_preferences()
        prefs2 = get_all_agent_preferences()

        # Modify one, ensure other unchanged
        prefs1["test_agent"] = {"task_type": "test"}
        assert "test_agent" not in prefs2
        assert "test_agent" not in AGENT_MODEL_PREFERENCES

    def test_contains_all_preferences(self) -> None:
        """Verify all preferences are returned."""
        prefs = get_all_agent_preferences()
        assert len(prefs) == len(AGENT_MODEL_PREFERENCES)
        for agent_id in AGENT_MODEL_PREFERENCES:
            assert agent_id in prefs


class TestDMConstantsUsage:
    """Verify DMConstants are used correctly."""

    def test_ccr_default_port_exists(self) -> None:
        """Verify CCR default port constant exists."""
        assert DMConstants.CCR.DEFAULT_PORT == 3456

    def test_ccr_health_check_interval_exists(self) -> None:
        """Verify CCR health check interval exists."""
        assert DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS == 30

    def test_ccr_provider_timeout_exists(self) -> None:
        """Verify CCR provider timeout exists."""
        assert DMConstants.CCR.PROVIDER_TIMEOUT_SECONDS == 60


class TestCCRModelInit:
    """Tests for CCRModel initialization."""

    def test_ccr_model_init_with_defaults(self) -> None:
        """Verify CCRModel can be initialized with defaults."""
        # Patch settings
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                ccr_url="http://localhost:3456",
            )
            # Patch AGNO_AVAILABLE
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                with patch("agents.models.ccr_provider.OpenAIChat", MockOpenAIChat):
                    from agents.models.ccr_provider import CCRModel

                    # Create instance
                    model = CCRModel()

                    assert model.id == "auto"
                    assert model.task_type is None
                    assert model._agent_id is None

    def test_ccr_model_init_with_task_type(self) -> None:
        """Verify CCRModel can be initialized with task type."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                ccr_url="http://localhost:3456",
            )
            with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                with patch("agents.models.ccr_provider.OpenAIChat", MockOpenAIChat):
                    from agents.models.ccr_provider import CCRModel

                    model = CCRModel(
                        task_type="reasoning",
                        agent_id="navi",
                    )

                    assert model.task_type == "reasoning"
                    assert model._agent_id == "navi"


class TestShouldUseCCR:
    """Tests for _should_use_ccr function."""

    def test_ccr_disabled_returns_false(self) -> None:
        """Verify returns False when CCR disabled."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(ccr_enabled=False)

            from agents.models.ccr_provider import _should_use_ccr

            assert _should_use_ccr() is False

    def test_ccr_enabled_but_unhealthy_returns_false(self) -> None:
        """Verify returns False when CCR unhealthy."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(ccr_enabled=True)

            with patch("agents.models.ccr_provider._get_health_checker_sync") as mock_health:
                mock_checker = MagicMock()
                mock_checker.is_healthy = False
                mock_health.return_value = mock_checker

                from agents.models.ccr_provider import _should_use_ccr

                assert _should_use_ccr() is False

    def test_user_prefers_byoai_returns_false(self) -> None:
        """Verify returns False when user prefers BYOAI."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(ccr_enabled=True)

            with patch("agents.models.ccr_provider._get_health_checker_sync") as mock_health:
                mock_checker = MagicMock()
                mock_checker.is_healthy = True
                mock_health.return_value = mock_checker

                from agents.models.ccr_provider import _should_use_ccr

                user_config = {"use_platform_subscription": False}
                assert _should_use_ccr(user_config) is False


class TestValidateCCRConnection:
    """Tests for validate_ccr_connection function."""

    @pytest.mark.anyio
    async def test_validation_skipped_when_disabled(self) -> None:
        """Verify validation skipped when CCR disabled."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(ccr_enabled=False)

            from agents.models.ccr_provider import validate_ccr_connection

            result = await validate_ccr_connection()
            assert result is True  # Skipped = success

    @pytest.mark.anyio
    async def test_validation_succeeds_when_healthy(self) -> None:
        """Verify validation succeeds when CCR healthy."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                ccr_enabled=True,
                ccr_url="http://localhost:3456",
                ccr_health_check_interval=30,
            )

            # Mock health checker
            mock_health_state = MagicMock()
            mock_health_state.status = MagicMock()
            mock_health_state.status.value = "healthy"
            mock_health_state.providers = {}

            mock_checker = AsyncMock()
            mock_checker.check_health = AsyncMock(return_value=mock_health_state)

            # Patch at the import location in the services module
            with patch("agents.services.ccr_health.CCRHealthChecker") as MockChecker:
                MockChecker.get_instance = AsyncMock(return_value=mock_checker)

                from agents.models.ccr_provider import validate_ccr_connection

                result = await validate_ccr_connection()
                assert result is True

    @pytest.mark.anyio
    async def test_validation_fails_when_unhealthy(self) -> None:
        """Verify validation fails when CCR unhealthy."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                ccr_enabled=True,
                ccr_url="http://localhost:3456",
                ccr_health_check_interval=30,
            )

            mock_health_state = MagicMock()
            mock_health_state.status = MagicMock()
            mock_health_state.status.value = "unhealthy"
            mock_health_state.last_error = "Connection refused"

            mock_checker = AsyncMock()
            mock_checker.check_health = AsyncMock(return_value=mock_health_state)

            with patch("agents.services.ccr_health.CCRHealthChecker") as MockChecker:
                MockChecker.get_instance = AsyncMock(return_value=mock_checker)

                from agents.models.ccr_provider import validate_ccr_connection

                result = await validate_ccr_connection()
                assert result is False


class TestGetModelForAgent:
    """Tests for get_model_for_agent function."""

    def test_returns_ccr_model_when_ccr_enabled(self) -> None:
        """Verify returns CCRModel when CCR enabled and healthy."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(
                ccr_enabled=True,
                ccr_url="http://localhost:3456",
            )

            with patch("agents.models.ccr_provider._should_use_ccr", return_value=True):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    with patch("agents.models.ccr_provider.OpenAIChat", MockOpenAIChat):
                        from agents.models.ccr_provider import get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="navi",
                            task_type="reasoning",
                        )

                        # Should be a CCRModel (extends OpenAIChat)
                        assert hasattr(model, "id")
                        assert model.id == "auto"

    def test_returns_byoai_model_when_ccr_disabled(self) -> None:
        """Verify returns BYOAI model when CCR disabled."""
        with patch("agents.models.ccr_provider.get_settings") as mock_settings:
            mock_settings.return_value = MagicMock(ccr_enabled=False)

            with patch("agents.models.ccr_provider._should_use_ccr", return_value=False):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    # Patch the Claude import inside _create_byoai_model
                    with patch.dict(sys.modules, {"agno.models.anthropic": MagicMock(Claude=MockClaude)}):
                        from agents.models.ccr_provider import get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="navi",
                            user_config=None,
                        )

                        # Should fallback to Claude
                        assert hasattr(model, "id")


class TestSelectModelForAgent:
    """Tests for select_model_for_agent function."""

    def test_returns_none_with_model_override(self) -> None:
        """Verify returns None when model override provided."""
        from agents.models.selector import select_model_for_agent

        result = select_model_for_agent(
            agent_id="navi",
            model_override="gpt-4o",
        )

        assert result is None

    def test_uses_agent_preferences(self) -> None:
        """Verify agent preferences are passed to get_model_for_agent."""
        with patch("agents.models.selector.get_model_for_agent") as mock_get:
            mock_get.return_value = MagicMock()

            from agents.models.selector import select_model_for_agent

            select_model_for_agent(agent_id="sage")

            mock_get.assert_called_once()
            call_kwargs = mock_get.call_args[1]
            assert call_kwargs["task_type"] == "code_generation"

    def test_task_type_override(self) -> None:
        """Verify task type override is used."""
        with patch("agents.models.selector.get_model_for_agent") as mock_get:
            mock_get.return_value = MagicMock()

            from agents.models.selector import select_model_for_agent

            select_model_for_agent(
                agent_id="navi",
                task_type_override="long_context",
            )

            mock_get.assert_called_once()
            call_kwargs = mock_get.call_args[1]
            assert call_kwargs["task_type"] == "long_context"
