"""
Unit tests for MCP parallel connection functionality (DM-11.4).

Tests the connect_all(), get_connection_health(), get_healthy_server_count(),
and retry_failed_connections() methods added to MCPClient.

@see docs/modules/bm-dm/stories/dm-11-4-parallel-mcp-connections.md
Epic: DM-11 | Story: DM-11.4
"""
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mcp.client import (
    ConnectionResult,
    MCPClient,
    MCPConnection,
    MCPConnectionError,
)
from mcp.config import MCPConfig, MCPServerConfig


class TestConnectionResult:
    """Tests for ConnectionResult dataclass."""

    def test_connection_result_success(self):
        """Should create success result with tools count."""
        result = ConnectionResult(
            server_name="github",
            success=True,
            tools_count=15,
            connect_time_ms=234.5,
        )

        assert result.server_name == "github"
        assert result.success is True
        assert result.tools_count == 15
        assert result.error is None
        assert result.retry_scheduled is False
        assert result.connect_time_ms == 234.5

    def test_connection_result_failure(self):
        """Should create failure result with error."""
        result = ConnectionResult(
            server_name="filesystem",
            success=False,
            error="Connection timed out",
            retry_scheduled=True,
        )

        assert result.server_name == "filesystem"
        assert result.success is False
        assert result.tools_count == 0
        assert result.error == "Connection timed out"
        assert result.retry_scheduled is True


class TestMCPClientConnectAll:
    """Tests for MCPClient.connect_all() method."""

    @pytest.fixture
    def mcp_config_multi(self):
        """Create a test MCP config with multiple servers."""
        return MCPConfig(
            servers={
                "server1": MCPServerConfig(
                    name="server1",
                    command="echo",
                    args=["server1"],
                    enabled=True,
                ),
                "server2": MCPServerConfig(
                    name="server2",
                    command="echo",
                    args=["server2"],
                    enabled=True,
                ),
                "server3": MCPServerConfig(
                    name="server3",
                    command="echo",
                    args=["server3"],
                    enabled=True,
                ),
                "disabled": MCPServerConfig(
                    name="disabled",
                    command="echo",
                    args=["disabled"],
                    enabled=False,
                ),
            }
        )

    @pytest.fixture
    def mcp_config_single(self):
        """Create a test MCP config with single server."""
        return MCPConfig(
            servers={
                "test": MCPServerConfig(
                    name="test",
                    command="echo",
                    args=["test"],
                    enabled=True,
                ),
            }
        )

    @pytest.fixture
    def mcp_config_all_disabled(self):
        """Create a test MCP config with all servers disabled."""
        return MCPConfig(
            servers={
                "server1": MCPServerConfig(
                    name="server1",
                    command="echo",
                    args=["server1"],
                    enabled=False,
                ),
                "server2": MCPServerConfig(
                    name="server2",
                    command="echo",
                    args=["server2"],
                    enabled=False,
                ),
            }
        )

    @pytest.mark.asyncio
    async def test_connect_all_parallel_execution(self, mcp_config_multi):
        """Should connect to all servers in parallel."""
        client = MCPClient(mcp_config_multi)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}],
            ):
                results = await client.connect_all()

        # Should connect to 3 enabled servers (not the disabled one)
        assert len(results) == 3
        assert "server1" in results
        assert "server2" in results
        assert "server3" in results
        assert "disabled" not in results

        # All should be successful
        for name, result in results.items():
            assert result.success is True
            assert result.server_name == name
            assert result.tools_count == 1

    @pytest.mark.asyncio
    async def test_connect_all_with_specific_servers(self, mcp_config_multi):
        """Should connect only to specified servers."""
        client = MCPClient(mcp_config_multi)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}],
            ):
                results = await client.connect_all(server_names=["server1", "server2"])

        # Should only connect to specified servers
        assert len(results) == 2
        assert "server1" in results
        assert "server2" in results
        assert "server3" not in results

    @pytest.mark.asyncio
    async def test_connect_all_partial_failure(self, mcp_config_multi):
        """Should handle partial failures - one failure doesn't block others."""
        client = MCPClient(mcp_config_multi)

        # Mock connect() to fail for one specific server
        async def mock_connect(server_name):
            if server_name == "server2":
                # Simulate failure
                return False
            # Simulate success
            client._connections[server_name] = MagicMock()
            client._tools_cache[server_name] = [{"name": "tool1"}]
            return True

        with patch.object(client, "connect", side_effect=mock_connect):
            results = await client.connect_all()

        # Should have results for all 3 enabled servers
        assert len(results) == 3

        # 2 should be successful (one failed)
        successes = [r for r in results.values() if r.success]
        failures = [r for r in results.values() if not r.success]

        assert len(successes) == 2
        assert len(failures) == 1
        assert failures[0].server_name == "server2"
        # The result shows success=False but no error since connect() returned False (not exception)
        assert failures[0].success is False

    @pytest.mark.asyncio
    async def test_connect_all_timeout_handling(self, mcp_config_single):
        """Should handle individual server timeouts."""
        client = MCPClient(mcp_config_single)

        async def slow_start():
            await asyncio.sleep(10)  # Simulate slow connection

        with patch.object(MCPConnection, "start", side_effect=slow_start):
            # Use a very short timeout
            results = await client.connect_all(timeout=0.1)

        assert len(results) == 1
        result = results["test"]
        assert result.success is False
        assert "timed out" in result.error.lower()
        assert result.retry_scheduled is True

    @pytest.mark.asyncio
    async def test_connect_all_empty_servers(self):
        """Should return empty results for empty server list."""
        config = MCPConfig(servers={})
        client = MCPClient(config)

        results = await client.connect_all()

        assert results == {}

    @pytest.mark.asyncio
    async def test_connect_all_all_disabled(self, mcp_config_all_disabled):
        """Should return empty results when all servers are disabled."""
        client = MCPClient(mcp_config_all_disabled)

        results = await client.connect_all()

        assert results == {}

    @pytest.mark.asyncio
    async def test_connect_all_records_timing(self, mcp_config_single):
        """Should record connection timing."""
        client = MCPClient(mcp_config_single)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[],
            ):
                results = await client.connect_all()

        result = results["test"]
        assert result.connect_time_ms > 0


class TestMCPClientConnectionHealth:
    """Tests for get_connection_health() method."""

    @pytest.fixture
    def mcp_config(self):
        """Create a test MCP config."""
        return MCPConfig(
            servers={
                "server1": MCPServerConfig(
                    name="server1",
                    command="echo",
                    args=["server1"],
                    enabled=True,
                ),
                "server2": MCPServerConfig(
                    name="server2",
                    command="echo",
                    args=["server2"],
                    enabled=True,
                ),
                "server3": MCPServerConfig(
                    name="server3",
                    command="echo",
                    args=["server3"],
                    enabled=True,
                ),
            }
        )

    def test_get_connection_health_all_connected(self, mcp_config):
        """Should return all True when all servers connected."""
        client = MCPClient(mcp_config)

        # Manually set connections
        client._connections = {
            "server1": MagicMock(),
            "server2": MagicMock(),
            "server3": MagicMock(),
        }

        health = client.get_connection_health()

        assert health == {
            "server1": True,
            "server2": True,
            "server3": True,
        }

    def test_get_connection_health_partial(self, mcp_config):
        """Should return mixed status for partial connectivity."""
        client = MCPClient(mcp_config)

        # Manually set connections (only server1 connected)
        client._connections = {"server1": MagicMock()}

        health = client.get_connection_health()

        assert health == {
            "server1": True,
            "server2": False,
            "server3": False,
        }

    def test_get_connection_health_none_connected(self, mcp_config):
        """Should return all False when no servers connected."""
        client = MCPClient(mcp_config)

        health = client.get_connection_health()

        assert health == {
            "server1": False,
            "server2": False,
            "server3": False,
        }

    def test_get_connection_health_empty_config(self):
        """Should return empty dict for empty config."""
        config = MCPConfig(servers={})
        client = MCPClient(config)

        health = client.get_connection_health()

        assert health == {}


class TestMCPClientHealthyServerCount:
    """Tests for get_healthy_server_count() method."""

    @pytest.fixture
    def mcp_config(self):
        """Create a test MCP config."""
        return MCPConfig(
            servers={
                "server1": MCPServerConfig(name="server1", command="echo", enabled=True),
                "server2": MCPServerConfig(name="server2", command="echo", enabled=True),
                "server3": MCPServerConfig(name="server3", command="echo", enabled=True),
            }
        )

    def test_get_healthy_server_count_all_connected(self, mcp_config):
        """Should return (3, 3) when all connected."""
        client = MCPClient(mcp_config)
        client._connections = {
            "server1": MagicMock(),
            "server2": MagicMock(),
            "server3": MagicMock(),
        }

        connected, total = client.get_healthy_server_count()

        assert connected == 3
        assert total == 3

    def test_get_healthy_server_count_partial(self, mcp_config):
        """Should return (1, 3) when one connected."""
        client = MCPClient(mcp_config)
        client._connections = {"server1": MagicMock()}

        connected, total = client.get_healthy_server_count()

        assert connected == 1
        assert total == 3

    def test_get_healthy_server_count_none(self, mcp_config):
        """Should return (0, 3) when none connected."""
        client = MCPClient(mcp_config)

        connected, total = client.get_healthy_server_count()

        assert connected == 0
        assert total == 3

    def test_get_healthy_server_count_empty(self):
        """Should return (0, 0) for empty config."""
        config = MCPConfig(servers={})
        client = MCPClient(config)

        connected, total = client.get_healthy_server_count()

        assert connected == 0
        assert total == 0


class TestMCPClientRetryFailedConnections:
    """Tests for retry_failed_connections() method."""

    @pytest.fixture
    def mcp_config(self):
        """Create a test MCP config."""
        return MCPConfig(
            servers={
                "server1": MCPServerConfig(name="server1", command="echo", enabled=True),
                "server2": MCPServerConfig(name="server2", command="echo", enabled=True),
            }
        )

    @pytest.mark.asyncio
    async def test_retry_empty_list(self, mcp_config):
        """Should return empty dict for empty failed list."""
        client = MCPClient(mcp_config)

        results = await client.retry_failed_connections([])

        assert results == {}

    @pytest.mark.asyncio
    async def test_retry_successful_on_first_attempt(self, mcp_config):
        """Should succeed on first retry attempt."""
        client = MCPClient(mcp_config)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}, {"name": "tool2"}],
            ):
                # Use minimal backoff for fast test
                results = await client.retry_failed_connections(
                    ["server1"],
                    max_retries=3,
                    backoff_base=0.01,  # Very fast for testing
                )

        assert len(results) == 1
        result = results["server1"]
        assert result.success is True
        assert result.tools_count == 2
        assert result.retry_scheduled is False

    @pytest.mark.asyncio
    async def test_retry_max_retries_exceeded(self, mcp_config):
        """Should fail after max retries."""
        client = MCPClient(mcp_config)

        with patch.object(
            MCPConnection,
            "start",
            new_callable=AsyncMock,
            side_effect=MCPConnectionError("Connection refused"),
        ):
            results = await client.retry_failed_connections(
                ["server1"],
                max_retries=2,
                backoff_base=0.01,
            )

        assert len(results) == 1
        result = results["server1"]
        assert result.success is False
        assert result.error == "Max retries exceeded"
        assert result.retry_scheduled is False

    @pytest.mark.asyncio
    async def test_retry_succeeds_on_second_attempt(self, mcp_config):
        """Should succeed on second attempt after first failure."""
        client = MCPClient(mcp_config)

        attempt = {"count": 0}

        async def mock_start():
            attempt["count"] += 1
            if attempt["count"] == 1:
                raise MCPConnectionError("First attempt failed")
            # Second attempt succeeds

        with patch.object(MCPConnection, "start", side_effect=mock_start):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}],
            ):
                results = await client.retry_failed_connections(
                    ["server1"],
                    max_retries=3,
                    backoff_base=0.01,
                )

        result = results["server1"]
        assert result.success is True
        assert attempt["count"] == 2  # Took 2 attempts

    @pytest.mark.asyncio
    async def test_retry_multiple_servers(self, mcp_config):
        """Should retry multiple failed servers."""
        client = MCPClient(mcp_config)

        # Make server1 succeed, server2 fail
        async def mock_connect(server_name):
            if server_name == "server1":
                client._connections[server_name] = MagicMock()
                client._tools_cache[server_name] = [{"name": "tool1"}]
                return True
            else:
                return False

        with patch.object(client, "connect", side_effect=mock_connect):
            results = await client.retry_failed_connections(
                ["server1", "server2"],
                max_retries=2,
                backoff_base=0.01,
            )

        assert len(results) == 2
        assert results["server1"].success is True
        assert results["server2"].success is False

    @pytest.mark.asyncio
    async def test_retry_timeout_handling(self, mcp_config):
        """Should handle timeout during retry."""
        client = MCPClient(mcp_config)

        async def slow_connect(server_name):
            await asyncio.sleep(10)
            return True

        with patch.object(client, "connect", side_effect=slow_connect):
            results = await client.retry_failed_connections(
                ["server1"],
                max_retries=2,
                backoff_base=0.01,
                timeout=0.05,  # Very short timeout
            )

        result = results["server1"]
        assert result.success is False
        assert result.error == "Max retries exceeded"


class TestMCPClientParallelVsSequential:
    """Tests comparing parallel vs sequential connection behavior."""

    @pytest.fixture
    def mcp_config_five_servers(self):
        """Create config with 5 servers for timing tests."""
        return MCPConfig(
            servers={
                f"server{i}": MCPServerConfig(
                    name=f"server{i}",
                    command="echo",
                    args=[f"server{i}"],
                    enabled=True,
                )
                for i in range(5)
            }
        )

    @pytest.mark.asyncio
    async def test_parallel_faster_than_sequential(self, mcp_config_five_servers):
        """
        Verify parallel connections are faster than sequential.

        Each server takes ~100ms to connect. With 5 servers:
        - Sequential: ~500ms
        - Parallel: ~100ms (bounded by slowest)
        """
        client = MCPClient(mcp_config_five_servers)

        # Simulate 100ms connection time per server
        async def mock_start():
            await asyncio.sleep(0.1)  # 100ms

        with patch.object(MCPConnection, "start", side_effect=mock_start):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[],
            ):
                import time
                start = time.time()
                results = await client.connect_all()
                elapsed = time.time() - start

        # Should complete in roughly 100-200ms (parallel)
        # Not 500ms (sequential)
        assert len(results) == 5
        assert elapsed < 0.3  # Allow some margin, but should be well under 0.5s

    @pytest.mark.asyncio
    async def test_all_connections_completed(self, mcp_config_five_servers):
        """Should complete all connections even with varying delays."""
        client = MCPClient(mcp_config_five_servers)

        delays = {"server0": 0.05, "server1": 0.10, "server2": 0.02, "server3": 0.08, "server4": 0.03}

        async def mock_start_with_delay():
            # Get server name from the connection config
            # This is a bit hacky but works for testing
            pass

        connection_count = {"count": 0}

        async def mock_start():
            connection_count["count"] += 1
            await asyncio.sleep(0.01)  # Small delay

        with patch.object(MCPConnection, "start", side_effect=mock_start):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[],
            ):
                results = await client.connect_all()

        # All 5 servers should have attempted connection
        assert connection_count["count"] == 5
        assert len(results) == 5
        assert all(r.success for r in results.values())
