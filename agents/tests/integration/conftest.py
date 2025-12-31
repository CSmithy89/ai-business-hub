"""
Integration Test Fixtures for CCR (Claude Code Router)

Provides pytest fixtures for CCR integration testing:
- ccr_enabled: Skip tests when CCR not enabled
- ccr_test_config: Test configuration with workspace and limits
- mock_ccr_health_checker: Mock health checker for testing
- mock_ccr_usage_tracker: Mock usage tracker for quota testing

DM-09.7: CCR Operational Verification Tests
@see docs/modules/bm-dm/stories/dm-09-7-ccr-operational-tests.md
"""

import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock opentelemetry OTLP exporter before any CCR imports
# This prevents import errors when opentelemetry-exporter-otlp-proto-grpc is not installed
mock_otlp = MagicMock()
mock_otlp.OTLPSpanExporter = MagicMock
sys.modules["opentelemetry.exporter.otlp.proto.grpc.trace_exporter"] = mock_otlp
sys.modules["opentelemetry.exporter.otlp.proto.grpc"] = MagicMock()
sys.modules["opentelemetry.exporter.otlp.proto"] = MagicMock()
sys.modules["opentelemetry.exporter.otlp"] = MagicMock()

# Mock prometheus_client before any observability imports
prometheus_mock = MagicMock()
prometheus_mock.Counter = MagicMock(return_value=MagicMock())
prometheus_mock.Histogram = MagicMock(return_value=MagicMock())
prometheus_mock.Gauge = MagicMock(return_value=MagicMock())
prometheus_mock.REGISTRY = MagicMock()
prometheus_mock.generate_latest = MagicMock(return_value=b"")
prometheus_mock.CONTENT_TYPE_LATEST = "text/plain"
sys.modules["prometheus_client"] = prometheus_mock

# Mock observability modules to prevent import chain issues
mock_metrics = MagicMock()
mock_metrics.record_ccr_request = MagicMock()
mock_metrics.record_agent_request = MagicMock()
sys.modules["agents.observability.metrics"] = mock_metrics

# Mock httpx before importing CCR modules
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

# Mock agno.models
agno_models_mock = MagicMock()


class MockOpenAIChat:
    """Mock OpenAIChat for testing."""

    def __init__(
        self, id: str = "auto", base_url: str = "", api_key: str = "", **kwargs: Any
    ):
        self.id = id
        self.base_url = base_url
        self.api_key = api_key
        self.kwargs = kwargs
        self._routing_metadata = None


class MockClaude:
    """Mock Claude for testing."""

    def __init__(self, id: str = "claude-sonnet-4-20250514", **kwargs: Any):
        self.id = id
        self.kwargs = kwargs
        self._routing_metadata = None


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

# Note: anyio is auto-discovered via pytest-anyio plugin


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (may require external services)"
    )
    config.addinivalue_line(
        "markers", "ccr: mark test as CCR-related (requires CCR_ENABLED)"
    )


@pytest.fixture
def ccr_enabled():
    """
    Fixture to skip tests when CCR is not enabled.

    Checks CCR_ENABLED environment variable.
    For integration tests, we mock CCR behavior so tests can run without
    actual CCR service.

    Example:
        @pytest.mark.integration
        def test_ccr_routing(ccr_enabled):
            # Test will be skipped if CCR_ENABLED != "true"
            # For mocked tests, we always proceed
            ...
    """
    ccr_enabled_env = os.environ.get("CCR_ENABLED", "true").lower() == "true"
    if not ccr_enabled_env:
        pytest.skip("CCR not enabled (set CCR_ENABLED=true)")
    return True


@pytest.fixture
def ccr_test_config() -> Dict[str, Any]:
    """
    Test configuration for CCR integration tests.

    Provides default values for testing:
    - workspace_id: Unique test workspace
    - daily_limit: Token limit for quota tests
    - models: Available models for routing
    - providers: Provider configuration

    Returns:
        Dict with test configuration
    """
    return {
        "workspace_id": "test-workspace-001",
        "tenant_id": "test-tenant-001",
        "daily_limit": 100000,  # 100k tokens for testing
        "warning_threshold": 0.8,
        "critical_threshold": 0.95,
        "models": {
            "reasoning": "claude-opus-4-20250514",
            "code_generation": "claude-sonnet-4-20250514",
            "long_context": "gemini-1.5-pro",
            "general": "claude-sonnet-4-20250514",
        },
        "providers": {
            "claude": {"status": "available", "priority": 1},
            "deepseek": {"status": "available", "priority": 2},
            "gemini": {"status": "available", "priority": 3},
        },
        "fallback_chain": ["claude", "deepseek", "gemini"],
        "ccr_url": "http://localhost:3456",
    }


@pytest.fixture
def mock_ccr_health_checker():
    """
    Mock CCR health checker for testing.

    Provides a configurable mock that can simulate:
    - Healthy CCR service
    - Degraded/unhealthy states
    - Provider-specific status
    - Circuit breaker states

    Returns:
        Tuple of (mock_checker, state_controller)

    Example:
        def test_health_check(mock_ccr_health_checker):
            checker, controller = mock_ccr_health_checker
            controller.set_healthy()
            assert checker.is_healthy is True

            controller.set_degraded("claude")
            assert checker.state.status == HealthStatus.DEGRADED
    """
    from constants.dm_constants import DMConstants
    from services.ccr_health import (
        CCRHealthState,
        CircuitState,
        HealthStatus,
        ProviderStatus,
    )

    mock_checker = MagicMock()
    state = CCRHealthState(
        status=HealthStatus.HEALTHY,
        providers={
            "claude": ProviderStatus.AVAILABLE,
            "deepseek": ProviderStatus.AVAILABLE,
            "gemini": ProviderStatus.AVAILABLE,
        },
        uptime_seconds=3600,
        last_check=datetime.now(timezone.utc),
        consecutive_failures=0,
        circuit_state=CircuitState.CLOSED,
    )

    mock_checker._state = state
    mock_checker.state = state
    mock_checker.is_healthy = True
    mock_checker.is_running = True
    mock_checker.circuit_is_open = False
    mock_checker.ccr_url = "http://localhost:3456"
    mock_checker.check_interval = DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS

    # Configure async methods
    mock_checker.check_health = AsyncMock(return_value=state)
    mock_checker.start = AsyncMock()
    mock_checker.stop = AsyncMock()

    # Add get_provider_status method
    def _get_provider_status(provider: str) -> ProviderStatus:
        return mock_checker._state.providers.get(provider, ProviderStatus.UNKNOWN)

    mock_checker.get_provider_status = _get_provider_status

    # Add to_dict method
    def _to_dict():
        return {
            "status": mock_checker._state.status.value,
            "providers": {k: v.value for k, v in mock_checker._state.providers.items()},
            "uptime_seconds": mock_checker._state.uptime_seconds,
            "last_check": (
                mock_checker._state.last_check.isoformat()
                if mock_checker._state.last_check
                else None
            ),
            "last_error": mock_checker._state.last_error,
            "consecutive_failures": mock_checker._state.consecutive_failures,
            "is_running": mock_checker.is_running,
            "circuit_state": mock_checker._state.circuit_state.value,
            "circuit_opened_at": (
                mock_checker._state.circuit_opened_at.isoformat()
                if getattr(mock_checker._state, "circuit_opened_at", None)
                else None
            ),
        }

    mock_checker.to_dict = _to_dict

    # State controller for test manipulation
    class StateController:
        def __init__(self, checker: MagicMock):
            self._checker = checker

        def set_healthy(self):
            self._checker._state.status = HealthStatus.HEALTHY
            self._checker.is_healthy = True
            self._checker._state.circuit_state = CircuitState.CLOSED
            self._checker.circuit_is_open = False
            for provider in self._checker._state.providers:
                self._checker._state.providers[provider] = ProviderStatus.AVAILABLE

        def set_unhealthy(self, error: str = "Connection failed"):
            self._checker._state.status = HealthStatus.UNHEALTHY
            self._checker.is_healthy = False
            self._checker._state.last_error = error
            self._checker._state.consecutive_failures = DMConstants.CCR.MAX_RETRIES

        def set_degraded(self, failed_provider: str = "claude"):
            self._checker._state.status = HealthStatus.DEGRADED
            self._checker.is_healthy = False
            self._checker._state.providers[failed_provider] = ProviderStatus.UNAVAILABLE
            self._checker._state.consecutive_failures = 1

        def set_circuit_open(self):
            self._checker._state.circuit_state = CircuitState.OPEN
            self._checker.circuit_is_open = True
            self._checker._state.circuit_opened_at = datetime.now(timezone.utc)

        def set_provider_status(self, provider: str, status: ProviderStatus):
            self._checker._state.providers[provider] = status

        def set_rate_limited(self, provider: str):
            self._checker._state.providers[provider] = ProviderStatus.RATE_LIMITED

    controller = StateController(mock_checker)

    return mock_checker, controller


@pytest.fixture
def mock_ccr_usage_tracker():
    """
    Mock CCR usage tracker for quota testing.

    Provides a configurable mock that can simulate:
    - Usage tracking by provider/task type
    - Quota status and alerts
    - Warning/critical thresholds

    Returns:
        Tuple of (mock_tracker, usage_controller)

    Example:
        def test_quota(mock_ccr_usage_tracker):
            tracker, controller = mock_ccr_usage_tracker
            controller.set_usage(80000, 100000)  # 80% used
            status = tracker.get_quota_status()
            assert status.alert_level == AlertLevel.WARNING
    """
    from constants.dm_constants import DMConstants
    from services.ccr_usage import AlertLevel, QuotaStatus, UsageMetrics

    mock_tracker = MagicMock()
    metrics = UsageMetrics(
        total_requests=0,
        requests_by_provider={},
        requests_by_task_type={},
        estimated_tokens=0,
        fallback_count=0,
        last_reset=datetime.now(timezone.utc),
    )

    mock_tracker._metrics = metrics
    mock_tracker.metrics = metrics
    mock_tracker.daily_token_limit = 100000
    mock_tracker._warning_threshold = DMConstants.CCR.QUOTA_WARNING_THRESHOLD
    mock_tracker._critical_threshold = DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD

    def _get_quota_status():
        used = mock_tracker._metrics.estimated_tokens
        limit = mock_tracker.daily_token_limit
        remaining = max(0, limit - used)
        percentage = used / limit if limit > 0 else 0.0

        if percentage >= DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD:
            alert_level = AlertLevel.CRITICAL
            alert_message = f"CCR quota critical: {percentage * 100:.1f}% used"
        elif percentage >= DMConstants.CCR.QUOTA_WARNING_THRESHOLD:
            alert_level = AlertLevel.WARNING
            alert_message = f"CCR quota warning: {percentage * 100:.1f}% used"
        else:
            alert_level = AlertLevel.INFO
            alert_message = None

        return QuotaStatus(
            used=used,
            limit=limit,
            remaining=remaining,
            percentage=percentage,
            alert_level=alert_level,
            alert_message=alert_message,
        )

    mock_tracker.get_quota_status = _get_quota_status

    def _record_request(
        provider: str,
        task_type: str,
        estimated_tokens: int = 0,
        is_fallback: bool = False,
        input_tokens: int = 0,
        output_tokens: int = 0,
    ):
        mock_tracker._metrics.total_requests += 1
        if provider not in mock_tracker._metrics.requests_by_provider:
            mock_tracker._metrics.requests_by_provider[provider] = 0
        mock_tracker._metrics.requests_by_provider[provider] += 1

        if task_type not in mock_tracker._metrics.requests_by_task_type:
            mock_tracker._metrics.requests_by_task_type[task_type] = 0
        mock_tracker._metrics.requests_by_task_type[task_type] += 1

        total_tokens = (input_tokens + output_tokens) or estimated_tokens
        mock_tracker._metrics.estimated_tokens += total_tokens

        if is_fallback:
            mock_tracker._metrics.fallback_count += 1

    mock_tracker.record_request = _record_request

    def _reset_daily():
        mock_tracker._metrics = UsageMetrics(last_reset=datetime.now(timezone.utc))

    mock_tracker.reset_daily = _reset_daily

    # Usage controller for test manipulation
    class UsageController:
        def __init__(self, tracker: MagicMock):
            self._tracker = tracker

        def set_usage(self, used: int, limit: int):
            self._tracker._metrics.estimated_tokens = used
            self._tracker.daily_token_limit = limit

        def exhaust_quota(self):
            """Set quota to fully exhausted."""
            limit = self._tracker.daily_token_limit
            self._tracker._metrics.estimated_tokens = limit

        def set_warning_level(self):
            """Set usage to 80% (warning threshold)."""
            limit = self._tracker.daily_token_limit
            self._tracker._metrics.estimated_tokens = int(
                limit * DMConstants.CCR.QUOTA_WARNING_THRESHOLD
            )

        def set_critical_level(self):
            """Set usage to 95% (critical threshold)."""
            limit = self._tracker.daily_token_limit
            self._tracker._metrics.estimated_tokens = int(
                limit * DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD
            )

        def reset(self):
            self._tracker.reset_daily()

    controller = UsageController(mock_tracker)

    return mock_tracker, controller


@pytest.fixture
def mock_settings():
    """
    Mock settings for CCR integration tests.

    Returns:
        MagicMock with CCR-related settings
    """
    settings = MagicMock()
    settings.ccr_enabled = True
    settings.ccr_url = "http://localhost:3456"
    settings.ccr_health_check_interval = 30
    settings.agentos_port = 8001
    return settings


@pytest.fixture
def mock_http_client():
    """
    Mock HTTP client for CCR API calls.

    Returns:
        Tuple of (mock_client, response_factory)
    """
    mock_client = AsyncMock()

    def create_response(
        status: str = "healthy",
        providers: Optional[Dict[str, str]] = None,
        status_code: int = 200,
    ):
        response = MagicMock()
        response.status_code = status_code
        response.json.return_value = {
            "status": status,
            "providers": providers or {"claude": "available", "deepseek": "available"},
            "uptime_seconds": 3600,
        }
        response.raise_for_status = MagicMock()
        if status_code >= 400:
            response.raise_for_status.side_effect = MockHTTPStatusError(
                f"HTTP {status_code}", response
            )
        return response

    mock_client.get = AsyncMock(return_value=create_response())
    mock_client.post = AsyncMock(return_value=create_response())

    class ResponseFactory:
        @staticmethod
        def healthy():
            return create_response("healthy", {"claude": "available", "deepseek": "available"})

        @staticmethod
        def degraded():
            return create_response(
                "degraded", {"claude": "unavailable", "deepseek": "available"}
            )

        @staticmethod
        def unhealthy():
            return create_response("unhealthy", {"claude": "unavailable", "deepseek": "unavailable"})

        @staticmethod
        def error(status_code: int = 500):
            return create_response("error", status_code=status_code)

    return mock_client, ResponseFactory


# Re-export fixtures from DM-08.4
from tests.fixtures import (
    async_context_manager,
    async_mock_factory,
    mock_redis,
    mock_redis_pipeline,
)
