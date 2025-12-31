"""
CCR Fallback Behavior Integration Tests

Tests CCR (Claude Code Router) fallback behavior:
- Fallback on primary model failure
- Fallback chain exhaustion
- Context preservation through fallback
- Timeout handling triggers fallback

DM-09.7: CCR Operational Verification Tests
@see docs/modules/bm-dm/stories/dm-09-7-ccr-operational-tests.md
"""

import asyncio
import sys
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Setup anyio for async tests
pytest_plugins = ["anyio"]


class TestCCRFallbackOnPrimaryFailure:
    """Tests for CCR fallback when primary model fails."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_fallback_on_ccr_unhealthy(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """Unhealthy CCR triggers fallback to BYOAI."""
        checker, controller = mock_ccr_health_checker
        controller.set_unhealthy("CCR service unavailable")

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                from agents.models.ccr_provider import _should_use_ccr_with_reason

                use_ccr, reason = _should_use_ccr_with_reason()

                assert use_ccr is False
                assert reason == "ccr_unhealthy"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_fallback_on_circuit_breaker_open(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """Open circuit breaker triggers fallback to BYOAI."""
        checker, controller = mock_ccr_health_checker
        controller.set_circuit_open()

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                from agents.models.ccr_provider import _should_use_ccr_with_reason

                use_ccr, reason = _should_use_ccr_with_reason()

                assert use_ccr is False
                assert reason == "circuit_breaker_open"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_fallback_returns_byoai_model(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """Fallback returns BYOAI model with fallback metadata."""
        checker, controller = mock_ccr_health_checker
        controller.set_unhealthy()

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    # Mock Claude model creation
                    mock_claude = MagicMock()
                    mock_claude.id = "claude-sonnet-4-20250514"

                    with patch(
                        "agents.models.ccr_provider._create_byoai_model",
                        return_value=mock_claude,
                    ):
                        from agents.models.ccr_provider import get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="navi",
                            task_type="reasoning",
                        )

                        # Should return BYOAI model
                        assert model.id == "claude-sonnet-4-20250514"
                        # Should have fallback metadata
                        assert model._routing_metadata.source == "byoai"
                        assert model._routing_metadata.fallback_reason == "ccr_unhealthy"


class TestCCRFallbackChainExhaustion:
    """Tests for fallback chain exhaustion handling."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_consecutive_failures_open_circuit(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Consecutive failures open circuit breaker."""
        from constants.dm_constants import DMConstants
        from services.ccr_health import CCRHealthChecker, CircuitState, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client

        # Simulate connection failures
        mock_client.get = AsyncMock(
            side_effect=Exception("Connection refused")
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # Perform multiple health checks to trigger circuit breaker
        for _ in range(DMConstants.CCR.MAX_RETRIES):
            await checker.check_health()

        # Circuit should be open after max retries
        assert checker.state.status == HealthStatus.UNHEALTHY
        assert checker.state.circuit_state == CircuitState.OPEN
        assert checker.state.consecutive_failures == DMConstants.CCR.MAX_RETRIES

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_circuit_half_open_after_timeout(
        self, ccr_enabled, ccr_test_config
    ):
        """Circuit breaker transitions to half-open after timeout."""
        from datetime import datetime, timedelta, timezone

        from constants.dm_constants import DMConstants
        from services.ccr_health import CCRHealthChecker, CircuitState, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )

        # Manually set circuit to open with expired timeout
        checker._state.circuit_state = CircuitState.OPEN
        checker._state.circuit_opened_at = datetime.now(timezone.utc) - timedelta(
            seconds=DMConstants.CCR.CIRCUIT_BREAKER_TIMEOUT_SECONDS + 1
        )

        # _should_attempt_check should return True and transition to HALF_OPEN
        should_check = checker._should_attempt_check()

        assert should_check is True
        assert checker._state.circuit_state == CircuitState.HALF_OPEN

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_successful_check_closes_circuit(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Successful health check closes circuit breaker."""
        from services.ccr_health import CCRHealthChecker, CircuitState, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_client.get = AsyncMock(return_value=response_factory.healthy())

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # Set circuit to HALF_OPEN
        checker._state.circuit_state = CircuitState.HALF_OPEN

        # Perform successful health check
        await checker.check_health()

        # Circuit should be closed
        assert checker.state.status == HealthStatus.HEALTHY
        assert checker.state.circuit_state == CircuitState.CLOSED
        assert checker.state.consecutive_failures == 0


class TestCCRContextPreservation:
    """Tests for context preservation through fallback."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_task_type_preserved_in_fallback(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """Task type is preserved when falling back to BYOAI."""
        checker, controller = mock_ccr_health_checker
        controller.set_unhealthy()

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    mock_claude = MagicMock()
                    mock_claude.id = "claude-sonnet-4-20250514"

                    with patch(
                        "agents.models.ccr_provider._create_byoai_model",
                        return_value=mock_claude,
                    ):
                        from agents.models.ccr_provider import get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="sage",
                            task_type="code_generation",
                        )

                        # Task type should be preserved in metadata
                        assert model._routing_metadata.task_type == "code_generation"
                        assert model._routing_metadata.agent_id == "sage"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_agent_id_preserved_in_fallback(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """Agent ID is preserved when falling back to BYOAI."""
        checker, controller = mock_ccr_health_checker
        controller.set_unhealthy()

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    mock_claude = MagicMock()
                    mock_claude.id = "claude-sonnet-4-20250514"

                    with patch(
                        "agents.models.ccr_provider._create_byoai_model",
                        return_value=mock_claude,
                    ):
                        from agents.models.ccr_provider import get_model_for_agent

                        model = get_model_for_agent(
                            agent_id="scribe",
                            task_type="long_context",
                        )

                        # Agent ID should be preserved in metadata
                        assert model._routing_metadata.agent_id == "scribe"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_user_config_preserved_in_fallback(
        self, ccr_enabled, ccr_test_config, mock_settings, mock_ccr_health_checker
    ):
        """User config is used when falling back to BYOAI."""
        checker, controller = mock_ccr_health_checker
        controller.set_unhealthy()

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            with patch(
                "agents.models.ccr_provider._get_health_checker_sync",
                return_value=checker,
            ):
                with patch("agents.models.ccr_provider.AGNO_AVAILABLE", True):
                    # Track what config was passed to _create_byoai_model
                    create_model_calls = []

                    def mock_create_byoai(config):
                        create_model_calls.append(config)
                        mock_model = MagicMock()
                        mock_model.id = config.get("model_id", "claude-sonnet-4-20250514")
                        return mock_model

                    with patch(
                        "agents.models.ccr_provider._create_byoai_model",
                        side_effect=mock_create_byoai,
                    ):
                        from agents.models.ccr_provider import get_model_for_agent

                        user_config = {
                            "provider_type": "claude",
                            "model_id": "claude-opus-4-20250514",
                            "api_key": "test-key",
                        }

                        model = get_model_for_agent(
                            agent_id="navi",
                            user_config=user_config,
                            task_type="reasoning",
                        )

                        # User config should have been passed to model creation
                        assert len(create_model_calls) == 1
                        assert create_model_calls[0] == user_config


class TestCCRTimeoutHandling:
    """Tests for CCR timeout handling."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_timeout_triggers_degraded_status(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Timeout during health check triggers degraded status."""
        # Import the mock exception from conftest
        from tests.integration.conftest import MockTimeoutException

        from services.ccr_health import CCRHealthChecker, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_client.get = AsyncMock(
            side_effect=MockTimeoutException("Request timed out")
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # Perform health check
        await checker.check_health()

        # Should be degraded after first failure
        assert checker.state.status == HealthStatus.DEGRADED
        assert checker.state.consecutive_failures == 1
        # Error message contains the timeout description
        assert "timed out" in (checker.state.last_error or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_connection_error_handled_gracefully(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Connection errors are handled gracefully."""
        # Import the mock exception from conftest
        from tests.integration.conftest import MockConnectError

        from services.ccr_health import CCRHealthChecker, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_client.get = AsyncMock(
            side_effect=MockConnectError("Connection refused")
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # Should not raise - handled gracefully
        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert state.consecutive_failures == 1
        # Error message contains connection error description
        assert "connection refused" in (state.last_error or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_http_error_handled_gracefully(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """HTTP errors are handled gracefully."""
        # Import the mock exception from conftest
        from tests.integration.conftest import MockHTTPStatusError

        from services.ccr_health import CCRHealthChecker, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_response = MagicMock()
        mock_response.status_code = 503
        mock_client.get = AsyncMock(
            side_effect=MockHTTPStatusError("Service Unavailable", mock_response)
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # Should not raise - handled gracefully
        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert state.consecutive_failures == 1
        # Error message contains HTTP error description
        assert "service unavailable" in (state.last_error or "").lower()

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_recovery_after_transient_failure(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Service recovers after transient failure."""
        # Import the mock exception from conftest
        from tests.integration.conftest import MockConnectError

        from services.ccr_health import CCRHealthChecker, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client

        # First call fails, second succeeds
        mock_client.get = AsyncMock(
            side_effect=[
                MockConnectError("Connection refused"),
                response_factory.healthy(),
            ]
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # First check - fails
        await checker.check_health()
        assert checker.state.status == HealthStatus.DEGRADED
        assert checker.state.consecutive_failures == 1

        # Second check - succeeds
        await checker.check_health()
        assert checker.state.status == HealthStatus.HEALTHY
        assert checker.state.consecutive_failures == 0
        assert checker.state.last_error is None
