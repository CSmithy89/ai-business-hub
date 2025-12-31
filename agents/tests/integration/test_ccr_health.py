"""
CCR Health Check Integration Tests

Tests CCR (Claude Code Router) health check behavior:
- Connection validation
- Health check status
- Degraded state detection
- Per-model status reporting

DM-09.7: CCR Operational Verification Tests
@see docs/modules/bm-dm/stories/dm-09-7-ccr-operational-tests.md
"""

import sys
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Setup anyio for async tests
pytest_plugins = ["anyio"]


class TestCCRConnectionValidation:
    """Tests for CCR connection validation."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_validate_connection_when_healthy(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Connection validation succeeds when CCR is healthy."""
        from services.ccr_health import CCRHealthChecker, HealthStatus

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

        state = await checker.check_health()

        assert state.status == HealthStatus.HEALTHY
        assert checker.is_healthy is True

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_validate_connection_when_unhealthy(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Connection validation detects unhealthy CCR."""
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

        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert checker.is_healthy is False
        assert state.consecutive_failures == 1

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_validate_ccr_connection_skipped_when_disabled(
        self, ccr_test_config
    ):
        """CCR validation skipped when disabled."""
        mock_settings = MagicMock()
        mock_settings.ccr_enabled = False

        with patch("agents.models.ccr_provider.get_settings", return_value=mock_settings):
            from agents.models.ccr_provider import validate_ccr_connection

            result = await validate_ccr_connection()

            # Should return True (success) when disabled
            assert result is True


class TestCCRHealthCheckStatus:
    """Tests for health check status reporting."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_health_check_returns_status(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Health check returns status, latency, and models."""
        from services.ccr_health import CCRHealthChecker, HealthStatus

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

        state = await checker.check_health()

        assert state.status == HealthStatus.HEALTHY
        assert state.last_check is not None
        assert state.uptime_seconds >= 0
        assert len(state.providers) > 0

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_health_check_to_dict_serialization(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Health check state can be serialized to dict."""
        from services.ccr_health import CCRHealthChecker

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

        await checker.check_health()
        result = checker.to_dict()

        assert "status" in result
        assert "providers" in result
        assert "uptime_seconds" in result
        assert "last_check" in result
        assert "consecutive_failures" in result
        assert "is_running" in result
        assert "circuit_state" in result

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_health_checker_properties(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Health checker exposes key properties."""
        checker, controller = mock_ccr_health_checker

        assert hasattr(checker, "is_healthy")
        assert hasattr(checker, "is_running")
        assert hasattr(checker, "circuit_is_open")
        assert hasattr(checker, "state")
        assert hasattr(checker, "ccr_url")
        assert hasattr(checker, "check_interval")


class TestCCRDegradedStateDetection:
    """Tests for degraded state detection."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_detect_degraded_when_some_providers_unavailable(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Detects degraded state when some providers are unavailable."""
        from services.ccr_health import CCRHealthChecker, HealthStatus, ProviderStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_client.get = AsyncMock(return_value=response_factory.degraded())

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert state.providers.get("claude") == ProviderStatus.UNAVAILABLE
        assert state.providers.get("deepseek") == ProviderStatus.AVAILABLE

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_detect_degraded_via_controller(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Controller can set degraded state for testing."""
        from services.ccr_health import HealthStatus, ProviderStatus

        checker, controller = mock_ccr_health_checker

        # Initially healthy
        assert checker._state.status == HealthStatus.HEALTHY

        # Set degraded
        controller.set_degraded("claude")

        assert checker._state.status == HealthStatus.DEGRADED
        assert checker._state.providers["claude"] == ProviderStatus.UNAVAILABLE
        assert checker.is_healthy is False

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_detect_rate_limited_provider(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Detects rate-limited provider status."""
        from services.ccr_health import ProviderStatus

        checker, controller = mock_ccr_health_checker

        controller.set_rate_limited("claude")

        assert checker._state.providers["claude"] == ProviderStatus.RATE_LIMITED

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_recovery_from_degraded_to_healthy(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """CCR recovers from degraded to healthy state."""
        from services.ccr_health import CCRHealthChecker, HealthStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client

        # First degraded, then healthy
        mock_client.get = AsyncMock(
            side_effect=[
                response_factory.degraded(),
                response_factory.healthy(),
            ]
        )

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        # First check - degraded
        state = await checker.check_health()
        assert state.status == HealthStatus.DEGRADED

        # Second check - healthy
        state = await checker.check_health()
        assert state.status == HealthStatus.HEALTHY


class TestCCRPerModelStatus:
    """Tests for per-model status reporting."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_per_model_status_available(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Per-model status shows available models."""
        from services.ccr_health import CCRHealthChecker, ProviderStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "healthy",
            "providers": {
                "claude": "available",
                "deepseek": "available",
                "gemini": "available",
            },
            "uptime_seconds": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        state = await checker.check_health()

        assert state.providers["claude"] == ProviderStatus.AVAILABLE
        assert state.providers["deepseek"] == ProviderStatus.AVAILABLE
        assert state.providers["gemini"] == ProviderStatus.AVAILABLE

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_per_model_status_mixed(
        self, ccr_enabled, ccr_test_config, mock_http_client
    ):
        """Per-model status handles mixed availability."""
        from services.ccr_health import CCRHealthChecker, ProviderStatus

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        mock_client, response_factory = mock_http_client
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "degraded",
            "providers": {
                "claude": "available",
                "deepseek": "unavailable",
                "gemini": "rate_limited",
            },
            "uptime_seconds": 3600,
        }
        mock_response.raise_for_status = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )
        checker._client = mock_client

        state = await checker.check_health()

        assert state.providers["claude"] == ProviderStatus.AVAILABLE
        assert state.providers["deepseek"] == ProviderStatus.UNAVAILABLE
        assert state.providers["gemini"] == ProviderStatus.RATE_LIMITED

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_get_provider_status(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """get_provider_status returns correct provider status."""
        from services.ccr_health import ProviderStatus

        checker, controller = mock_ccr_health_checker

        # All providers available by default
        assert checker.get_provider_status("claude") == ProviderStatus.AVAILABLE
        assert checker.get_provider_status("deepseek") == ProviderStatus.AVAILABLE

        # Unknown provider returns UNKNOWN
        assert checker.get_provider_status("unknown") == ProviderStatus.UNKNOWN

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_provider_status_after_controller_change(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Provider status reflects controller changes."""
        from services.ccr_health import ProviderStatus

        checker, controller = mock_ccr_health_checker

        # Set specific provider status
        controller.set_provider_status("deepseek", ProviderStatus.UNAVAILABLE)

        assert checker.get_provider_status("deepseek") == ProviderStatus.UNAVAILABLE
        assert checker.get_provider_status("claude") == ProviderStatus.AVAILABLE


class TestCCRHealthCheckerSingleton:
    """Tests for health checker singleton pattern."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_get_instance_creates_singleton(self, ccr_enabled, ccr_test_config):
        """get_instance creates a singleton."""
        from services.ccr_health import CCRHealthChecker

        # Reset singleton first
        await CCRHealthChecker.reset_instance()

        instance1 = await CCRHealthChecker.get_instance(
            ccr_url="http://localhost:3456"
        )
        instance2 = await CCRHealthChecker.get_instance()

        assert instance1 is instance2

        # Cleanup
        await CCRHealthChecker.reset_instance()

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_reset_instance_clears_singleton(
        self, ccr_enabled, ccr_test_config
    ):
        """reset_instance clears the singleton."""
        from services.ccr_health import CCRHealthChecker

        # Reset any existing singleton
        await CCRHealthChecker.reset_instance()

        instance1 = await CCRHealthChecker.get_instance(
            ccr_url="http://localhost:3456"
        )
        await CCRHealthChecker.reset_instance()
        instance2 = await CCRHealthChecker.get_instance(
            ccr_url="http://localhost:3456"
        )

        assert instance1 is not instance2

        # Cleanup
        await CCRHealthChecker.reset_instance()

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_get_instance_requires_url_first_time(
        self, ccr_enabled, ccr_test_config
    ):
        """get_instance requires URL on first call."""
        from services.ccr_health import CCRHealthChecker

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        with pytest.raises(ValueError, match="ccr_url required"):
            await CCRHealthChecker.get_instance()


class TestCCRHealthCheckerStartStop:
    """Tests for health checker start/stop functionality."""

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_start_when_disabled(self, ccr_enabled, ccr_test_config):
        """Start does nothing when disabled."""
        from services.ccr_health import CCRHealthChecker

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=False,  # Disabled
        )

        await checker.start()

        assert checker.is_running is False

    @pytest.mark.integration
    @pytest.mark.ccr
    @pytest.mark.anyio
    async def test_stop_when_not_running(self, ccr_enabled, ccr_test_config):
        """Stop is safe when not running."""
        from services.ccr_health import CCRHealthChecker

        # Reset singleton
        await CCRHealthChecker.reset_instance()

        checker = CCRHealthChecker(
            ccr_url="http://localhost:3456",
            check_interval=30,
            enabled=True,
        )

        # Should not raise
        await checker.stop()

        assert checker.is_running is False


class TestCCRCircuitBreakerIntegration:
    """Tests for circuit breaker integration with health checks."""

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_circuit_states(self, ccr_enabled, ccr_test_config):
        """Circuit breaker has expected states."""
        from services.ccr_health import CircuitState

        assert CircuitState.CLOSED.value == "closed"
        assert CircuitState.OPEN.value == "open"
        assert CircuitState.HALF_OPEN.value == "half_open"

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_circuit_breaker_in_health_state(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Circuit breaker state is part of health state."""
        from services.ccr_health import CircuitState

        checker, controller = mock_ccr_health_checker

        # Initially closed
        assert checker._state.circuit_state == CircuitState.CLOSED
        assert checker.circuit_is_open is False

        # Open circuit
        controller.set_circuit_open()
        assert checker._state.circuit_state == CircuitState.OPEN
        assert checker.circuit_is_open is True

    @pytest.mark.integration
    @pytest.mark.ccr
    def test_circuit_breaker_serialized_in_to_dict(
        self, ccr_enabled, ccr_test_config, mock_ccr_health_checker
    ):
        """Circuit breaker state is included in to_dict."""
        checker, controller = mock_ccr_health_checker

        result = checker.to_dict()

        assert "circuit_state" in result
        assert result["circuit_state"] == "closed"

        # Open circuit
        controller.set_circuit_open()
        result = checker.to_dict()

        assert result["circuit_state"] == "open"
        assert result["circuit_opened_at"] is not None
