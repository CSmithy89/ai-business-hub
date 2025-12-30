"""
Performance tests for dashboard flow.

Establishes baseline latency metrics for:
- Single agent A2A calls
- Parallel agent calls
- Widget rendering time targets

Story: DM-03.5 - End-to-End Testing
@see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.5

Performance Targets (from tech spec):
- Single Agent Call (P95): <500ms
- Parallel 3 Agents (P95): <800ms
- Widget Render: <100ms
- Time to First Widget: <1s
- Chat Response Start: <200ms
"""

import sys
from unittest.mock import MagicMock

# Mock anthropic module before any imports
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
import time
import asyncio
from unittest.mock import AsyncMock, patch, Mock
from typing import List
from statistics import mean, stdev

# Enable asyncio mode for pytest
pytest_plugins = ["anyio"]

# Performance budget constants (in milliseconds)
SINGLE_AGENT_LATENCY_TARGET_MS = 500
PARALLEL_AGENTS_LATENCY_TARGET_MS = 800
CRITICAL_SINGLE_AGENT_MS = 1000
CRITICAL_PARALLEL_AGENTS_MS = 1500


class TestSingleAgentLatency:
    """Performance tests for single agent A2A calls."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_single_agent_call_measures_latency(self, a2a_client):
        """Single agent call should return latency measurement."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"content": "Response", "tool_calls": [], "artifacts": []},
            "id": "test",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()
            mock_http.post.return_value = mock_response
            mock_get.return_value = mock_http

            result = await a2a_client.call_agent("navi", "Test task")

            # Result should include duration measurement
            assert result.duration_ms is not None
            assert result.duration_ms >= 0

    @pytest.mark.anyio
    async def test_navi_latency_baseline(self, a2a_client):
        """Establish baseline latency for Navi agent calls."""
        latencies: List[float] = []

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"content": "Project status", "tool_calls": [], "artifacts": []},
            "id": "test",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            # Simulate realistic network latency (50-100ms)
            async def mock_post(*args, **kwargs):
                await asyncio.sleep(0.05)  # 50ms simulated latency
                return mock_response

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            # Run 5 iterations to establish baseline
            for _ in range(5):
                result = await a2a_client.call_agent("navi", "Get project status")
                if result.duration_ms:
                    latencies.append(result.duration_ms)

        if latencies:
            avg_latency = mean(latencies)
            print(f"\nNavi baseline latency: {avg_latency:.1f}ms (n={len(latencies)})")

            # Should be well under the target since we're mocking
            assert avg_latency < SINGLE_AGENT_LATENCY_TARGET_MS, (
                f"Average latency {avg_latency:.1f}ms exceeds {SINGLE_AGENT_LATENCY_TARGET_MS}ms target"
            )

    @pytest.mark.anyio
    async def test_pulse_latency_baseline(self, a2a_client):
        """Establish baseline latency for Pulse agent calls."""
        latencies: List[float] = []

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"content": "Health metrics", "tool_calls": [], "artifacts": []},
            "id": "test",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(*args, **kwargs):
                await asyncio.sleep(0.06)  # 60ms simulated latency
                return mock_response

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            for _ in range(5):
                result = await a2a_client.call_agent("pulse", "Get health summary")
                if result.duration_ms:
                    latencies.append(result.duration_ms)

        if latencies:
            avg_latency = mean(latencies)
            print(f"\nPulse baseline latency: {avg_latency:.1f}ms (n={len(latencies)})")
            assert avg_latency < SINGLE_AGENT_LATENCY_TARGET_MS

    @pytest.mark.anyio
    async def test_herald_latency_baseline(self, a2a_client):
        """Establish baseline latency for Herald agent calls."""
        latencies: List[float] = []

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"content": "Recent activity", "tool_calls": [], "artifacts": []},
            "id": "test",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(*args, **kwargs):
                await asyncio.sleep(0.04)  # 40ms simulated latency
                return mock_response

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            for _ in range(5):
                result = await a2a_client.call_agent("herald", "Get activity")
                if result.duration_ms:
                    latencies.append(result.duration_ms)

        if latencies:
            avg_latency = mean(latencies)
            print(f"\nHerald baseline latency: {avg_latency:.1f}ms (n={len(latencies)})")
            assert avg_latency < SINGLE_AGENT_LATENCY_TARGET_MS


class TestParallelAgentLatency:
    """Performance tests for parallel agent calls."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_parallel_calls_faster_than_sequential(self, a2a_client):
        """Parallel calls should be faster than sequential."""

        def create_mock_response(content: str):
            mock = Mock()
            mock.status_code = 200
            mock.json.return_value = {
                "jsonrpc": "2.0",
                "result": {"content": content, "tool_calls": [], "artifacts": []},
                "id": "test",
            }
            return mock

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(path: str, **kwargs):
                # Each agent takes ~100ms
                await asyncio.sleep(0.1)
                return create_mock_response("Response")

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            # Measure parallel call time
            start = time.monotonic()
            results = await a2a_client.call_agents_parallel(
                [
                    {"agent_id": "navi", "task": "Get status"},
                    {"agent_id": "pulse", "task": "Get health"},
                    {"agent_id": "herald", "task": "Get activity"},
                ]
            )
            parallel_time_ms = (time.monotonic() - start) * 1000

            # All calls succeeded
            assert len(results) == 3
            assert all(r.success for r in results.values())

            # Parallel should complete in ~100ms (max of all calls)
            # not ~300ms (sum of all calls)
            # Allow some overhead but should be less than 2x single call
            print(f"\nParallel 3 agents: {parallel_time_ms:.1f}ms")
            assert parallel_time_ms < 250, (
                f"Parallel calls took {parallel_time_ms:.1f}ms, expected ~100ms"
            )

    @pytest.mark.anyio
    async def test_parallel_latency_under_budget(self, a2a_client):
        """Parallel agent calls should complete under latency budget."""

        def create_mock_response(content: str):
            mock = Mock()
            mock.status_code = 200
            mock.json.return_value = {
                "jsonrpc": "2.0",
                "result": {"content": content, "tool_calls": [], "artifacts": []},
                "id": "test",
            }
            return mock

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(path: str, **kwargs):
                # Simulate ~150ms per agent (realistic with processing)
                await asyncio.sleep(0.15)
                return create_mock_response("Response")

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            start = time.monotonic()
            results = await a2a_client.call_agents_parallel(
                [
                    {"agent_id": "navi", "task": "Get status"},
                    {"agent_id": "pulse", "task": "Get health"},
                    {"agent_id": "herald", "task": "Get activity"},
                ]
            )
            elapsed_ms = (time.monotonic() - start) * 1000

            print(f"\nParallel 3 agents budget check: {elapsed_ms:.1f}ms")
            assert elapsed_ms < PARALLEL_AGENTS_LATENCY_TARGET_MS, (
                f"Parallel calls took {elapsed_ms:.1f}ms, "
                f"exceeds {PARALLEL_AGENTS_LATENCY_TARGET_MS}ms target"
            )


class TestDashboardGatherLatency:
    """Performance tests for gather_dashboard_data pattern."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_gather_dashboard_data_latency(self, a2a_client):
        """gather_dashboard_data should complete within budget."""

        def create_mock_response(agent: str):
            mock = Mock()
            mock.status_code = 200
            mock.json.return_value = {
                "jsonrpc": "2.0",
                "result": {
                    "content": f"Data from {agent}",
                    "tool_calls": [
                        {
                            "name": "render_dashboard_widget",
                            "arguments": {"type": "ProjectStatus", "data": {}},
                        }
                    ],
                    "artifacts": [],
                },
                "id": "test",
            }
            return mock

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(path: str, **kwargs):
                await asyncio.sleep(0.1)  # 100ms per agent
                if "/navi/" in path:
                    return create_mock_response("navi")
                elif "/pulse/" in path:
                    return create_mock_response("pulse")
                elif "/herald/" in path:
                    return create_mock_response("herald")
                return create_mock_response("unknown")

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            # Simulate gather_dashboard_data pattern
            start = time.monotonic()
            results = await a2a_client.call_agents_parallel(
                [
                    {"agent_id": "navi", "task": "Get workspace overview"},
                    {"agent_id": "pulse", "task": "Get workspace health"},
                    {"agent_id": "herald", "task": "Get recent notifications"},
                ]
            )
            elapsed_ms = (time.monotonic() - start) * 1000

            # All succeeded
            assert all(r.success for r in results.values())

            # Check each has widget tool calls
            for agent_id, result in results.items():
                assert len(result.tool_calls) > 0, f"{agent_id} missing tool calls"

            print(f"\nGather dashboard data: {elapsed_ms:.1f}ms")
            assert elapsed_ms < PARALLEL_AGENTS_LATENCY_TARGET_MS


class TestLatencyVariance:
    """Tests for latency consistency and variance."""

    @pytest.fixture
    def mock_settings(self):
        """Mock settings for tests."""
        mock = Mock()
        mock.agentos_port = 8001
        return mock

    @pytest.fixture
    def a2a_client(self, mock_settings):
        """Create A2A client with mocked settings."""
        with patch("a2a.client.get_settings", return_value=mock_settings):
            from a2a.client import HyvveA2AClient

            return HyvveA2AClient(base_url="http://test:8001")

    @pytest.mark.anyio
    async def test_latency_variance_is_acceptable(self, a2a_client):
        """Latency variance should be low for consistent UX."""
        latencies: List[float] = []

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "jsonrpc": "2.0",
            "result": {"content": "Response", "tool_calls": [], "artifacts": []},
            "id": "test",
        }

        with patch.object(a2a_client, "_get_client") as mock_get:
            mock_http = AsyncMock()

            async def mock_post(*args, **kwargs):
                # Add some variance (50-80ms)
                import random

                await asyncio.sleep(0.05 + random.random() * 0.03)
                return mock_response

            mock_http.post = mock_post
            mock_get.return_value = mock_http

            # Run 10 iterations
            for _ in range(10):
                result = await a2a_client.call_agent("navi", "Test")
                if result.duration_ms:
                    latencies.append(result.duration_ms)

        if len(latencies) >= 2:
            avg = mean(latencies)
            std = stdev(latencies)
            cv = (std / avg) * 100  # Coefficient of variation

            print(f"\nLatency stats: avg={avg:.1f}ms, std={std:.1f}ms, CV={cv:.1f}%")

            # Coefficient of variation should be under 50%
            # (i.e., standard deviation less than half the mean)
            assert cv < 50, f"Latency variance too high: CV={cv:.1f}%"
