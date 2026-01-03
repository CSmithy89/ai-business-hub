"""
Tests for Parallel Health Checks

Tests the parallel health check implementation added in DM-11.5.
Verifies parallel execution, timeout handling, partial failures, and response timing.

@see docs/modules/bm-dm/stories/dm-11-5-parallel-health-checks.md
Epic: DM-11 | Story: DM-11.5
"""
import asyncio
import time
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from mesh.discovery import (
    DiscoveryService,
    HealthCheckResult,
    get_discovery_service,
    shutdown_discovery_service,
)
from mesh.models import AgentHealth, MeshAgentCard
from mesh.registry import get_registry, reset_registry
from mesh.router import MeshRouter, get_router, reset_router


@pytest.fixture(autouse=True)
def reset_global_state():
    """Reset global state before and after each test."""
    reset_registry()
    reset_router()
    yield
    reset_registry()
    reset_router()


@pytest.fixture
def discovery_service():
    """Create a discovery service for testing."""
    return DiscoveryService(
        discovery_urls=[],
        scan_interval=60,
        auto_register=False,
        health_check_timeout=5.0,
    )


@pytest.fixture
def mock_client():
    """Create a mock HTTP client."""
    mock = AsyncMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock.get.return_value = mock_response
    return mock


def create_external_agent(name: str, url: str = None) -> MeshAgentCard:
    """Create an external agent for testing."""
    return MeshAgentCard(
        name=name,
        description=f"External agent {name}",
        url=url or f"http://{name.lower()}:8000",
        is_external=True,
    )


class TestHealthCheckResult:
    """Tests for HealthCheckResult dataclass."""

    def test_create_healthy_result(self):
        """Should create a healthy result with defaults."""
        result = HealthCheckResult(
            agent_name="TestAgent",
            healthy=True,
            response_time_ms=50.5,
        )

        assert result.agent_name == "TestAgent"
        assert result.healthy is True
        assert result.response_time_ms == 50.5
        assert result.error is None

    def test_create_unhealthy_result(self):
        """Should create an unhealthy result with error."""
        result = HealthCheckResult(
            agent_name="FailedAgent",
            healthy=False,
            response_time_ms=100.0,
            error="Connection refused",
        )

        assert result.agent_name == "FailedAgent"
        assert result.healthy is False
        assert result.error == "Connection refused"

    def test_create_with_defaults(self):
        """Should create with default response time and no error."""
        result = HealthCheckResult(
            agent_name="MinimalAgent",
            healthy=True,
        )

        assert result.response_time_ms == 0.0
        assert result.error is None


class TestHealthCheckAllParallel:
    """Tests for parallel health_check_all() method."""

    @pytest.mark.asyncio
    async def test_parallel_execution_timing(self, discovery_service):
        """
        Should execute health checks in parallel (not sequentially).

        With 5 agents at 100ms each:
        - Sequential: ~500ms
        - Parallel: ~100ms
        """
        registry = get_registry()

        # Register 5 external agents
        for i in range(5):
            agent = create_external_agent(f"Agent{i}")
            registry.register(agent)

        # Mock HTTP client with 100ms delay per request
        async def slow_get(*args, **kwargs):
            await asyncio.sleep(0.1)  # 100ms
            mock_response = MagicMock()
            mock_response.status_code = 200
            return mock_response

        mock_client = AsyncMock()
        mock_client.get = slow_get
        discovery_service._client = mock_client

        # Time the parallel execution
        start = time.time()
        results = await discovery_service.health_check_all()
        elapsed = time.time() - start

        # Should complete in roughly 100-200ms (parallel)
        # Not 500ms+ (sequential)
        assert len(results) == 5
        assert elapsed < 0.35  # Allow margin but well under 0.5s

    @pytest.mark.asyncio
    async def test_returns_health_check_results(self, discovery_service, mock_client):
        """Should return HealthCheckResult objects for each agent."""
        registry = get_registry()
        agent = create_external_agent("TestAgent")
        registry.register(agent)

        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        assert len(results) == 1
        assert "TestAgent" in results
        result = results["TestAgent"]

        assert isinstance(result, HealthCheckResult)
        assert result.agent_name == "TestAgent"
        assert result.healthy is True
        assert result.response_time_ms > 0

    @pytest.mark.asyncio
    async def test_empty_agent_list(self, discovery_service, mock_client):
        """Should return empty dict when no external agents."""
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        assert results == {}

    @pytest.mark.asyncio
    async def test_partial_failure(self, discovery_service):
        """Should handle partial failures - some healthy, some not."""
        registry = get_registry()

        agent1 = create_external_agent("GoodAgent", "http://good-agent:8000")
        agent2 = create_external_agent("BadAgent", "http://bad-agent:8000")
        registry.register(agent1)
        registry.register(agent2)

        # Mock client that succeeds for good, fails for bad
        async def selective_get(url, *args, **kwargs):
            mock_response = MagicMock()
            # Check the URL to determine response
            if "good-agent" in url:
                mock_response.status_code = 200
                return mock_response
            else:
                raise httpx.ConnectError("Connection refused")

        mock_client = AsyncMock()
        mock_client.get = selective_get
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        assert len(results) == 2

        assert results["GoodAgent"].healthy is True
        assert results["GoodAgent"].error is None

        assert results["BadAgent"].healthy is False
        # Error contains status info (original exception logged separately)
        assert results["BadAgent"].error is not None
        assert "unhealthy" in results["BadAgent"].error.lower()

    @pytest.mark.asyncio
    async def test_all_agents_unhealthy(self, discovery_service):
        """Should handle case where all agents are unhealthy."""
        registry = get_registry()

        for i in range(3):
            agent = create_external_agent(f"Agent{i}")
            registry.register(agent)

        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.ConnectError("Connection refused")
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        assert len(results) == 3
        for result in results.values():
            assert result.healthy is False
            assert result.error is not None

    @pytest.mark.asyncio
    async def test_only_checks_external_agents(self, discovery_service, mock_client):
        """Should only check external agents, not internal ones."""
        registry = get_registry()

        external = create_external_agent("ExternalAgent")
        internal = MeshAgentCard(
            name="InternalAgent",
            description="Internal agent",
            url="http://internal:8000",
            is_external=False,
        )
        registry.register(external)
        registry.register(internal)

        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        assert len(results) == 1
        assert "ExternalAgent" in results
        assert "InternalAgent" not in results


class TestHealthCheckTimeout:
    """Tests for per-agent timeout handling."""

    @pytest.mark.asyncio
    async def test_timeout_handling(self, discovery_service):
        """Should timeout slow agents without blocking others."""
        registry = get_registry()

        slow_agent = create_external_agent("SlowAgent")
        fast_agent = create_external_agent("FastAgent")
        registry.register(slow_agent)
        registry.register(fast_agent)

        async def selective_get(*args, **kwargs):
            mock_response = MagicMock()
            if "slowagent" in args[0].lower():
                await asyncio.sleep(10)  # Would take 10s, will timeout
            mock_response.status_code = 200
            return mock_response

        mock_client = AsyncMock()
        mock_client.get = selective_get
        discovery_service._client = mock_client

        # Use short timeout
        start = time.time()
        results = await discovery_service.health_check_all(timeout=0.2)
        elapsed = time.time() - start

        # Should complete in ~200ms (timeout) not 10s
        assert elapsed < 0.5

        assert len(results) == 2
        assert results["SlowAgent"].healthy is False
        assert "Timeout" in results["SlowAgent"].error
        assert results["FastAgent"].healthy is True

    @pytest.mark.asyncio
    async def test_custom_timeout_parameter(self, discovery_service, mock_client):
        """Should respect custom timeout parameter."""
        registry = get_registry()
        agent = create_external_agent("TestAgent")
        registry.register(agent)

        discovery_service._client = mock_client

        # Call with custom timeout (this mainly tests it doesn't error)
        results = await discovery_service.health_check_all(timeout=10.0)

        assert len(results) == 1

    @pytest.mark.asyncio
    async def test_uses_instance_timeout_by_default(self):
        """Should use instance health_check_timeout when not specified."""
        # Use unique agent name to avoid test isolation issues
        service = DiscoveryService(health_check_timeout=2.5)
        registry = get_registry()

        agent = create_external_agent("TimeoutTestAgent", "http://timeout-test:8000")
        registry.register(agent)

        async def slow_get(*args, **kwargs):
            await asyncio.sleep(5)  # Longer than 2.5s timeout
            return MagicMock(status_code=200)

        mock_client = AsyncMock()
        mock_client.get = slow_get
        service._client = mock_client

        start = time.time()
        results = await service.health_check_all()  # No timeout param
        elapsed = time.time() - start

        # Should timeout at ~2.5s (allow more margin for CI)
        assert elapsed < 4.0
        assert results["TimeoutTestAgent"].healthy is False
        assert "Timeout" in results["TimeoutTestAgent"].error


class TestResponseTimeTracking:
    """Tests for response time measurement."""

    @pytest.mark.asyncio
    async def test_response_time_captured(self, discovery_service):
        """Should capture response time for each check."""
        registry = get_registry()
        agent = create_external_agent("TestAgent")
        registry.register(agent)

        async def delayed_get(*args, **kwargs):
            await asyncio.sleep(0.05)  # 50ms delay
            return MagicMock(status_code=200)

        mock_client = AsyncMock()
        mock_client.get = delayed_get
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        result = results["TestAgent"]
        # Should capture roughly 50ms (allow margin for execution overhead)
        assert result.response_time_ms >= 40
        assert result.response_time_ms < 200

    @pytest.mark.asyncio
    async def test_response_time_on_failure(self, discovery_service):
        """Should capture response time even on failure."""
        registry = get_registry()
        agent = create_external_agent("FailAgent")
        registry.register(agent)

        async def failing_get(*args, **kwargs):
            await asyncio.sleep(0.03)  # 30ms before failing
            raise httpx.ConnectError("Failed")

        mock_client = AsyncMock()
        mock_client.get = failing_get
        discovery_service._client = mock_client

        results = await discovery_service.health_check_all()

        result = results["FailAgent"]
        assert result.healthy is False
        assert result.response_time_ms >= 20  # Should have captured some time


class TestRefreshMeshHealth:
    """Tests for MeshRouter.refresh_mesh_health() method."""

    @pytest.mark.asyncio
    async def test_returns_summary(self):
        """Should return health summary with counts and ratio."""
        router = MeshRouter()
        registry = get_registry()

        # Register 3 external agents
        for i in range(3):
            agent = create_external_agent(f"Agent{i}")
            registry.register(agent)

        # Mock discovery service
        mock_results = {
            "Agent0": HealthCheckResult("Agent0", True, 50.0),
            "Agent1": HealthCheckResult("Agent1", True, 60.0),
            "Agent2": HealthCheckResult("Agent2", False, 100.0, "Failed"),
        }

        # Patch in discovery module where get_discovery_service is defined
        with patch("mesh.discovery.get_discovery_service") as mock_get_discovery:
            mock_discovery = MagicMock()
            mock_discovery.is_running = True
            mock_discovery.health_check_all = AsyncMock(return_value=mock_results)
            mock_get_discovery.return_value = mock_discovery

            result = await router.refresh_mesh_health()

        assert result["healthy_count"] == 2
        assert result["total_count"] == 3
        assert result["healthy_ratio"] == pytest.approx(2 / 3)

        assert "Agent0" in result["agents"]
        assert result["agents"]["Agent0"]["healthy"] is True
        assert result["agents"]["Agent0"]["response_time_ms"] == 50.0

    @pytest.mark.asyncio
    async def test_handles_discovery_not_running(self):
        """Should handle case when discovery service is not running."""
        router = MeshRouter()

        with patch("mesh.discovery.get_discovery_service") as mock_get_discovery:
            mock_discovery = MagicMock()
            mock_discovery.is_running = False
            mock_get_discovery.return_value = mock_discovery

            result = await router.refresh_mesh_health()

        assert result["healthy_count"] == 0
        assert result["total_count"] == 0
        assert result["healthy_ratio"] == 1.0
        assert "error" in result

    @pytest.mark.asyncio
    async def test_passes_timeout_parameter(self):
        """Should pass timeout parameter to health_check_all."""
        router = MeshRouter()

        with patch("mesh.discovery.get_discovery_service") as mock_get_discovery:
            mock_discovery = MagicMock()
            mock_discovery.is_running = True
            mock_discovery.health_check_all = AsyncMock(return_value={})
            mock_get_discovery.return_value = mock_discovery

            await router.refresh_mesh_health(timeout=3.5)

            mock_discovery.health_check_all.assert_called_once_with(timeout=3.5)

    @pytest.mark.asyncio
    async def test_empty_external_agents(self):
        """Should handle case with no external agents."""
        router = MeshRouter()

        with patch("mesh.discovery.get_discovery_service") as mock_get_discovery:
            mock_discovery = MagicMock()
            mock_discovery.is_running = True
            mock_discovery.health_check_all = AsyncMock(return_value={})
            mock_get_discovery.return_value = mock_discovery

            result = await router.refresh_mesh_health()

        assert result["healthy_count"] == 0
        assert result["total_count"] == 0
        assert result["healthy_ratio"] == 1.0  # No agents = 100% healthy


class TestParallelVsSequential:
    """
    Performance tests comparing parallel vs hypothetical sequential execution.
    """

    @pytest.mark.asyncio
    async def test_five_agents_parallel_performance(self, discovery_service):
        """
        Verify 5 agents at 100ms each complete in parallel time.

        Expected:
        - Sequential: ~500ms
        - Parallel: ~100ms (bounded by slowest)
        """
        registry = get_registry()

        # Register 5 external agents
        for i in range(5):
            agent = create_external_agent(f"Agent{i}")
            registry.register(agent)

        # Each takes 100ms
        async def mock_get(*args, **kwargs):
            await asyncio.sleep(0.1)
            return MagicMock(status_code=200)

        mock_client = AsyncMock()
        mock_client.get = mock_get
        discovery_service._client = mock_client

        start = time.time()
        results = await discovery_service.health_check_all()
        elapsed = time.time() - start

        # All should be healthy
        assert len(results) == 5
        assert all(r.healthy for r in results.values())

        # Should complete in roughly 100-200ms (parallel)
        # Not 500ms (sequential)
        assert elapsed < 0.3, f"Took {elapsed}s, expected parallel execution < 0.3s"

    @pytest.mark.asyncio
    async def test_mixed_response_times(self, discovery_service):
        """
        Verify parallel execution with varied response times.

        Slowest agent determines total time, not sum of all times.
        """
        registry = get_registry()

        # 3 agents: 50ms, 100ms, 150ms
        agent1 = create_external_agent("Fast", "http://fast:8000")
        agent2 = create_external_agent("Medium", "http://medium:8000")
        agent3 = create_external_agent("Slow", "http://slow:8000")
        registry.register(agent1)
        registry.register(agent2)
        registry.register(agent3)

        async def variable_get(url, *args, **kwargs):
            if "fast" in url:
                await asyncio.sleep(0.05)
            elif "medium" in url:
                await asyncio.sleep(0.10)
            else:
                await asyncio.sleep(0.15)
            return MagicMock(status_code=200)

        mock_client = AsyncMock()
        mock_client.get = variable_get
        discovery_service._client = mock_client

        start = time.time()
        results = await discovery_service.health_check_all()
        elapsed = time.time() - start

        assert len(results) == 3

        # Should complete in ~150ms (slowest) not 300ms (sum)
        assert elapsed < 0.25, f"Took {elapsed}s, expected ~0.15s"


class TestHealthCheckInit:
    """Tests for DiscoveryService initialization with health_check_timeout."""

    def test_default_health_check_timeout(self):
        """Should have default health_check_timeout of 5.0."""
        service = DiscoveryService()
        assert service.health_check_timeout == 5.0

    def test_custom_health_check_timeout(self):
        """Should accept custom health_check_timeout."""
        service = DiscoveryService(health_check_timeout=10.0)
        assert service.health_check_timeout == 10.0

    def test_all_parameters(self):
        """Should accept all parameters including health_check_timeout."""
        service = DiscoveryService(
            discovery_urls=["http://test:8000"],
            scan_interval=120,
            timeout=60.0,
            auto_register=False,
            health_check_timeout=3.0,
        )

        assert service.discovery_urls == ["http://test:8000"]
        assert service.scan_interval == 120
        assert service.timeout == 60.0
        assert service.auto_register is False
        assert service.health_check_timeout == 3.0
