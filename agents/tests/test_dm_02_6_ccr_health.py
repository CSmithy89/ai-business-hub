"""
Unit tests for DM-02.6: CCR Health Check Service

Tests the CCR health checker service including:
- Initialization and singleton pattern
- Health check response handling
- Connection error handling
- DMConstants usage verification
"""

import asyncio
import sys
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Create mock httpx with proper exception classes before importing
class MockConnectError(Exception):
    """Mock httpx.ConnectError"""
    pass


class MockTimeoutException(Exception):
    """Mock httpx.TimeoutException"""
    pass


class MockHTTPStatusError(Exception):
    """Mock httpx.HTTPStatusError"""
    def __init__(self, message: str = "", response: Any = None):
        super().__init__(message)
        self.response = response or MagicMock(status_code=500)


httpx_mock = MagicMock()
httpx_mock.ConnectError = MockConnectError
httpx_mock.TimeoutException = MockTimeoutException
httpx_mock.HTTPStatusError = MockHTTPStatusError
httpx_mock.AsyncClient = MagicMock
sys.modules["httpx"] = httpx_mock

# Setup anyio for async tests
pytest_plugins = ["anyio"]


# Import after mocking
from constants.dm_constants import DMConstants
from services.ccr_health import (
    CCRHealthChecker,
    CCRHealthState,
    HealthStatus,
    ProviderStatus,
    get_ccr_health_checker,
)


class TestHealthStatus:
    """Tests for HealthStatus enum."""

    def test_health_status_values(self) -> None:
        """Verify all expected health status values exist."""
        assert HealthStatus.HEALTHY.value == "healthy"
        assert HealthStatus.UNHEALTHY.value == "unhealthy"
        assert HealthStatus.DEGRADED.value == "degraded"
        assert HealthStatus.UNKNOWN.value == "unknown"

    def test_health_status_from_string(self) -> None:
        """Verify status can be created from string."""
        assert HealthStatus("healthy") == HealthStatus.HEALTHY
        assert HealthStatus("unhealthy") == HealthStatus.UNHEALTHY


class TestProviderStatus:
    """Tests for ProviderStatus enum."""

    def test_provider_status_values(self) -> None:
        """Verify all expected provider status values exist."""
        assert ProviderStatus.AVAILABLE.value == "available"
        assert ProviderStatus.UNAVAILABLE.value == "unavailable"
        assert ProviderStatus.RATE_LIMITED.value == "rate_limited"
        assert ProviderStatus.UNKNOWN.value == "unknown"


class TestCCRHealthState:
    """Tests for CCRHealthState dataclass."""

    def test_default_state(self) -> None:
        """Verify default state values."""
        state = CCRHealthState()
        assert state.status == HealthStatus.UNKNOWN
        assert state.providers == {}
        assert state.uptime_seconds == 0
        assert state.last_check is None
        assert state.last_error is None
        assert state.consecutive_failures == 0

    def test_custom_state(self) -> None:
        """Verify custom state can be created."""
        now = datetime.now(timezone.utc)
        state = CCRHealthState(
            status=HealthStatus.HEALTHY,
            providers={"claude": ProviderStatus.AVAILABLE},
            uptime_seconds=3600,
            last_check=now,
            last_error=None,
            consecutive_failures=0,
        )
        assert state.status == HealthStatus.HEALTHY
        assert state.providers["claude"] == ProviderStatus.AVAILABLE
        assert state.uptime_seconds == 3600


class TestCCRHealthCheckerInit:
    """Tests for CCRHealthChecker initialization."""

    def test_init_with_defaults(self) -> None:
        """Verify initialization with default values."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        assert checker.ccr_url == "http://localhost:3456"
        assert checker.check_interval == DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS
        assert checker.enabled is True
        assert checker.is_running is False

    def test_init_with_custom_values(self) -> None:
        """Verify initialization with custom values."""
        checker = CCRHealthChecker(
            ccr_url="http://custom:8080/",
            check_interval=60,
            enabled=False,
        )
        assert checker.ccr_url == "http://custom:8080"  # Trailing slash stripped
        assert checker.check_interval == 60
        assert checker.enabled is False

    def test_init_uses_dm_constants(self) -> None:
        """Verify default values come from DMConstants."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        assert checker.check_interval == DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS
        assert checker.check_interval == 30  # Verify actual value


class TestCCRHealthCheckerSingleton:
    """Tests for singleton pattern."""

    @pytest.fixture(autouse=True)
    async def reset_singleton(self) -> None:
        """Reset singleton before and after each test."""
        await CCRHealthChecker.reset_instance()
        yield
        await CCRHealthChecker.reset_instance()

    @pytest.mark.anyio
    async def test_get_instance_creates_singleton(self) -> None:
        """Verify get_instance creates a singleton."""
        instance1 = await CCRHealthChecker.get_instance(ccr_url="http://localhost:3456")
        instance2 = await CCRHealthChecker.get_instance()
        assert instance1 is instance2

    @pytest.mark.anyio
    async def test_get_instance_requires_url_first_time(self) -> None:
        """Verify get_instance requires URL on first call."""
        with pytest.raises(ValueError, match="ccr_url required"):
            await CCRHealthChecker.get_instance()

    @pytest.mark.anyio
    async def test_reset_instance(self) -> None:
        """Verify reset_instance clears singleton."""
        instance1 = await CCRHealthChecker.get_instance(ccr_url="http://localhost:3456")
        await CCRHealthChecker.reset_instance()
        instance2 = await CCRHealthChecker.get_instance(ccr_url="http://localhost:3456")
        assert instance1 is not instance2


class TestCCRHealthCheckerState:
    """Tests for health state management."""

    def test_initial_state(self) -> None:
        """Verify initial state is unknown."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        assert checker.state.status == HealthStatus.UNKNOWN
        assert not checker.is_healthy

    def test_is_healthy_property(self) -> None:
        """Verify is_healthy reflects state."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        checker._state.status = HealthStatus.HEALTHY
        assert checker.is_healthy is True

        checker._state.status = HealthStatus.UNHEALTHY
        assert checker.is_healthy is False

    def test_get_provider_status(self) -> None:
        """Verify get_provider_status returns correct values."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        checker._state.providers = {
            "claude": ProviderStatus.AVAILABLE,
            "deepseek": ProviderStatus.UNAVAILABLE,
        }

        assert checker.get_provider_status("claude") == ProviderStatus.AVAILABLE
        assert checker.get_provider_status("deepseek") == ProviderStatus.UNAVAILABLE
        assert checker.get_provider_status("unknown") == ProviderStatus.UNKNOWN


class TestCCRHealthCheckerToDict:
    """Tests for serialization."""

    def test_to_dict_basic(self) -> None:
        """Verify to_dict serializes state correctly."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        result = checker.to_dict()

        assert result["status"] == "unknown"
        assert result["providers"] == {}
        assert result["uptime_seconds"] == 0
        assert result["last_check"] is None
        assert result["last_error"] is None
        assert result["consecutive_failures"] == 0
        assert result["is_running"] is False

    def test_to_dict_with_providers(self) -> None:
        """Verify to_dict includes provider status."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        checker._state.status = HealthStatus.HEALTHY
        checker._state.providers = {
            "claude": ProviderStatus.AVAILABLE,
            "gemini": ProviderStatus.RATE_LIMITED,
        }

        result = checker.to_dict()
        assert result["status"] == "healthy"
        assert result["providers"] == {
            "claude": "available",
            "gemini": "rate_limited",
        }

    def test_to_dict_with_last_check(self) -> None:
        """Verify to_dict serializes datetime."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        now = datetime(2025, 12, 30, 12, 0, 0, tzinfo=timezone.utc)
        checker._state.last_check = now

        result = checker.to_dict()
        assert result["last_check"] == "2025-12-30T12:00:00+00:00"


class TestCCRHealthCheckerCheckHealth:
    """Tests for health check functionality."""

    @pytest.mark.anyio
    async def test_check_health_success(self) -> None:
        """Verify successful health check updates state."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")

        # Create mock client
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": "healthy",
            "providers": {
                "claude": "available",
                "deepseek": "available",
            },
            "uptime_seconds": 3600,
        }
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        checker._client = mock_client

        # Perform check
        state = await checker.check_health()

        assert state.status == HealthStatus.HEALTHY
        assert state.providers["claude"] == ProviderStatus.AVAILABLE
        assert state.uptime_seconds == 3600
        assert state.consecutive_failures == 0
        assert state.last_error is None

    @pytest.mark.anyio
    async def test_check_health_connection_error(self) -> None:
        """Verify connection error is handled gracefully."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")

        # Create mock client that raises connection error
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=MockConnectError("Connection refused")
        )
        checker._client = mock_client

        # Perform check - should not raise
        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert state.consecutive_failures == 1
        assert "Connection failed" in (state.last_error or "")

    @pytest.mark.anyio
    async def test_check_health_timeout_error(self) -> None:
        """Verify timeout error is handled gracefully."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")

        # Create mock client that raises timeout
        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=MockTimeoutException("Request timed out")
        )
        checker._client = mock_client

        state = await checker.check_health()

        assert state.status == HealthStatus.DEGRADED
        assert "timeout" in (state.last_error or "").lower()

    @pytest.mark.anyio
    async def test_check_health_consecutive_failures(self) -> None:
        """Verify consecutive failures trigger unhealthy status."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(
            side_effect=MockConnectError("Connection refused")
        )
        checker._client = mock_client

        # Fail multiple times up to MAX_RETRIES
        for i in range(DMConstants.CCR.MAX_RETRIES):
            await checker.check_health()
            if i < DMConstants.CCR.MAX_RETRIES - 1:
                assert checker.state.status == HealthStatus.DEGRADED
            else:
                assert checker.state.status == HealthStatus.UNHEALTHY

        assert checker.state.consecutive_failures == DMConstants.CCR.MAX_RETRIES


class TestCCRHealthCheckerStartStop:
    """Tests for start/stop functionality."""

    @pytest.mark.anyio
    async def test_start_when_disabled(self) -> None:
        """Verify start does nothing when disabled."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456", enabled=False)
        await checker.start()
        assert not checker.is_running

    @pytest.mark.anyio
    async def test_stop_when_not_running(self) -> None:
        """Verify stop is safe when not running."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        await checker.stop()  # Should not raise
        assert not checker.is_running


class TestDMConstantsUsage:
    """Verify DMConstants are used correctly."""

    def test_default_check_interval_uses_constant(self) -> None:
        """Verify default check interval comes from DMConstants."""
        checker = CCRHealthChecker(ccr_url="http://localhost:3456")
        assert checker.check_interval == DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS

    def test_ccr_default_port_constant_exists(self) -> None:
        """Verify CCR default port constant exists."""
        assert DMConstants.CCR.DEFAULT_PORT == 3456

    def test_ccr_max_retries_constant_exists(self) -> None:
        """Verify CCR max retries constant exists."""
        assert DMConstants.CCR.MAX_RETRIES == 3

    def test_ccr_provider_timeout_constant_exists(self) -> None:
        """Verify CCR provider timeout constant exists."""
        assert DMConstants.CCR.PROVIDER_TIMEOUT_SECONDS == 60


class TestGetCCRHealthChecker:
    """Tests for convenience function."""

    @pytest.fixture(autouse=True)
    async def reset_singleton(self) -> None:
        """Reset singleton before and after each test."""
        await CCRHealthChecker.reset_instance()
        yield
        await CCRHealthChecker.reset_instance()

    @pytest.mark.anyio
    async def test_returns_none_when_not_initialized(self) -> None:
        """Verify returns None when singleton not created."""
        result = await get_ccr_health_checker()
        assert result is None

    @pytest.mark.anyio
    async def test_returns_instance_when_initialized(self) -> None:
        """Verify returns instance after initialization."""
        await CCRHealthChecker.get_instance(ccr_url="http://localhost:3456")
        result = await get_ccr_health_checker()
        assert result is not None
        assert isinstance(result, CCRHealthChecker)
