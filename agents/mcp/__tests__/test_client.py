"""
Unit tests for MCP client and connection classes.

Tests MCPConnection subprocess management and MCPClient connection pooling.
Uses mocks to avoid actually spawning MCP server processes.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
import asyncio
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mcp.client import (
    MCPClient,
    MCPConnection,
    MCPConnectionError,
    MCPProtocolError,
)
from mcp.config import MCPConfig, MCPServerConfig


class TestMCPConnection:
    """Tests for MCPConnection class."""

    @pytest.fixture
    def server_config(self):
        """Create a basic server config for tests."""
        return MCPServerConfig(
            name="test",
            command="echo",
            args=["test"],
        )

    @pytest.mark.asyncio
    async def test_start_launches_subprocess(self, server_config):
        """Should launch subprocess on start."""
        conn = MCPConnection(server_config)

        # Mock asyncio.create_subprocess_exec
        mock_process = AsyncMock()
        mock_process.returncode = None
        mock_process.pid = 12345
        mock_process.stdin = AsyncMock()
        mock_process.stdout = AsyncMock()
        mock_process.stderr = AsyncMock()

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                await conn.start()

        assert conn._process is not None
        assert conn._process.pid == 12345

    @pytest.mark.asyncio
    async def test_start_raises_on_immediate_exit(self, server_config):
        """Should raise MCPConnectionError if process exits immediately."""
        conn = MCPConnection(server_config)

        # Mock process that exits immediately
        mock_process = AsyncMock()
        mock_process.returncode = 1  # Non-None = exited
        mock_process.stderr = AsyncMock()
        mock_process.stderr.read = AsyncMock(return_value=b"error message")

        with patch("asyncio.create_subprocess_exec", return_value=mock_process):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                with pytest.raises(MCPConnectionError, match="failed to start"):
                    await conn.start()

    @pytest.mark.asyncio
    async def test_start_raises_on_command_not_found(self, server_config):
        """Should raise MCPConnectionError if command not found."""
        conn = MCPConnection(server_config)

        with patch("asyncio.create_subprocess_exec", side_effect=FileNotFoundError()):
            with pytest.raises(MCPConnectionError, match="not found"):
                await conn.start()

    @pytest.mark.asyncio
    async def test_stop_terminates_process(self, server_config):
        """Should terminate subprocess on stop."""
        conn = MCPConnection(server_config)

        # Set up mock process
        mock_process = AsyncMock()
        mock_process.returncode = None
        mock_process.wait = AsyncMock()
        conn._process = mock_process

        await conn.stop()

        mock_process.terminate.assert_called_once()
        assert conn._process is None

    @pytest.mark.asyncio
    async def test_stop_kills_on_timeout(self, server_config):
        """Should kill process if terminate times out."""
        conn = MCPConnection(server_config)

        # Set up mock process that doesn't terminate
        mock_process = MagicMock()
        mock_process.returncode = None
        # terminate is not async
        mock_process.terminate = MagicMock()
        # wait is async and will timeout
        mock_process.wait = AsyncMock()
        # kill is not async
        mock_process.kill = MagicMock()
        conn._process = mock_process

        with patch("asyncio.wait_for", side_effect=asyncio.TimeoutError()):
            await conn.stop()

        mock_process.kill.assert_called_once()

    @pytest.mark.asyncio
    async def test_stop_handles_already_exited(self, server_config):
        """Should handle ProcessLookupError gracefully."""
        conn = MCPConnection(server_config)

        mock_process = AsyncMock()
        mock_process.terminate = MagicMock(side_effect=ProcessLookupError())
        conn._process = mock_process

        # Should not raise
        await conn.stop()
        assert conn._process is None

    @pytest.mark.asyncio
    async def test_stop_when_not_running(self, server_config):
        """Should handle stop when process is None."""
        conn = MCPConnection(server_config)
        conn._process = None

        # Should not raise
        await conn.stop()

    @pytest.mark.asyncio
    async def test_list_tools_sends_json_rpc(self, server_config):
        """Should send tools/list JSON-RPC request."""
        conn = MCPConnection(server_config)

        # Set up mock process
        mock_stdin = AsyncMock()
        mock_stdout = AsyncMock()
        mock_stdout.readline = AsyncMock(
            return_value=json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "result": {"tools": [{"name": "test_tool"}]},
            }).encode() + b"\n"
        )

        mock_process = AsyncMock()
        mock_process.returncode = None
        mock_process.stdin = mock_stdin
        mock_process.stdout = mock_stdout
        conn._process = mock_process

        with patch("asyncio.wait_for", new_callable=lambda: AsyncMock(return_value=mock_stdout.readline.return_value)):
            tools = await conn.list_tools()

        assert len(tools) == 1
        assert tools[0]["name"] == "test_tool"

    @pytest.mark.asyncio
    async def test_call_tool_sends_json_rpc(self, server_config):
        """Should send tools/call JSON-RPC request."""
        conn = MCPConnection(server_config)

        # Set up mock process
        mock_stdin = AsyncMock()
        mock_stdout = AsyncMock()
        mock_stdout.readline = AsyncMock(
            return_value=json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "result": {"content": "success"},
            }).encode() + b"\n"
        )

        mock_process = AsyncMock()
        mock_process.returncode = None
        mock_process.stdin = mock_stdin
        mock_process.stdout = mock_stdout
        conn._process = mock_process

        with patch("asyncio.wait_for", new_callable=lambda: AsyncMock(return_value=mock_stdout.readline.return_value)):
            result = await conn.call_tool("test_tool", {"arg": "value"})

        assert result["content"] == "success"

    @pytest.mark.asyncio
    async def test_send_request_raises_when_not_running(self, server_config):
        """Should raise MCPProtocolError when process not running."""
        conn = MCPConnection(server_config)
        conn._process = None

        with pytest.raises(MCPProtocolError, match="not running"):
            await conn._send_request("test", {})

    @pytest.mark.asyncio
    async def test_send_request_raises_on_json_rpc_error(self, server_config):
        """Should raise MCPProtocolError on JSON-RPC error response."""
        conn = MCPConnection(server_config)

        mock_stdin = AsyncMock()
        mock_stdout = AsyncMock()
        mock_stdout.readline = AsyncMock(
            return_value=json.dumps({
                "jsonrpc": "2.0",
                "id": 1,
                "error": {"code": -32600, "message": "Invalid Request"},
            }).encode() + b"\n"
        )

        mock_process = AsyncMock()
        mock_process.returncode = None
        mock_process.stdin = mock_stdin
        mock_process.stdout = mock_stdout
        conn._process = mock_process

        with patch("asyncio.wait_for", new_callable=lambda: AsyncMock(return_value=mock_stdout.readline.return_value)):
            with pytest.raises(MCPProtocolError, match="Invalid Request"):
                await conn._send_request("test", {})


class TestMCPClient:
    """Tests for MCPClient class."""

    @pytest.fixture
    def mcp_config(self):
        """Create a test MCP config."""
        return MCPConfig(
            servers={
                "test": MCPServerConfig(
                    name="test",
                    command="echo",
                    args=["test"],
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

    @pytest.mark.asyncio
    async def test_connect_starts_connection(self, mcp_config):
        """Should start connection and cache tools."""
        client = MCPClient(mcp_config)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1", "description": "Test tool"}],
            ):
                result = await client.connect("test")

        assert result is True
        assert "test" in client._connections
        assert "test" in client._tools_cache
        assert len(client._tools_cache["test"]) == 1

    @pytest.mark.asyncio
    async def test_connect_returns_false_for_unknown_server(self, mcp_config):
        """Should return False for unknown server."""
        client = MCPClient(mcp_config)
        result = await client.connect("unknown")

        assert result is False
        assert "unknown" not in client._connections

    @pytest.mark.asyncio
    async def test_connect_returns_false_for_disabled_server(self, mcp_config):
        """Should return False for disabled server."""
        client = MCPClient(mcp_config)
        result = await client.connect("disabled")

        assert result is False
        assert "disabled" not in client._connections

    @pytest.mark.asyncio
    async def test_connect_returns_true_if_already_connected(self, mcp_config):
        """Should return True if already connected."""
        client = MCPClient(mcp_config)
        client._connections["test"] = MagicMock()

        result = await client.connect("test")

        assert result is True

    @pytest.mark.asyncio
    async def test_connect_returns_false_on_connection_error(self, mcp_config):
        """Should return False if connection fails."""
        client = MCPClient(mcp_config)

        with patch.object(
            MCPConnection,
            "start",
            new_callable=AsyncMock,
            side_effect=MCPConnectionError("Failed"),
        ):
            result = await client.connect("test")

        assert result is False
        assert "test" not in client._connections

    @pytest.mark.asyncio
    async def test_disconnect_stops_connection(self, mcp_config):
        """Should stop connection and clear cache."""
        client = MCPClient(mcp_config)

        mock_conn = MagicMock()
        mock_conn.stop = AsyncMock()
        client._connections["test"] = mock_conn
        client._tools_cache["test"] = [{"name": "tool1"}]

        await client.disconnect("test")

        mock_conn.stop.assert_called_once()
        assert "test" not in client._connections
        assert "test" not in client._tools_cache

    @pytest.mark.asyncio
    async def test_disconnect_handles_unknown_server(self, mcp_config):
        """Should handle disconnect for server not connected."""
        client = MCPClient(mcp_config)

        # Should not raise
        await client.disconnect("unknown")

    @pytest.mark.asyncio
    async def test_disconnect_all_stops_all(self, mcp_config):
        """Should stop all connections."""
        client = MCPClient(mcp_config)

        mock_conn1 = MagicMock()
        mock_conn1.stop = AsyncMock()
        mock_conn2 = MagicMock()
        mock_conn2.stop = AsyncMock()

        client._connections = {"server1": mock_conn1, "server2": mock_conn2}
        client._tools_cache = {"server1": [], "server2": []}

        await client.disconnect_all()

        assert len(client._connections) == 0
        assert len(client._tools_cache) == 0

    def test_get_available_tools_all_servers(self, mcp_config):
        """Should return tools from all servers."""
        client = MCPClient(mcp_config)
        client._tools_cache = {
            "server1": [{"name": "tool1", "_server": "server1"}],
            "server2": [{"name": "tool2", "_server": "server2"}],
        }

        tools = client.get_available_tools()

        assert len(tools) == 2
        tool_names = [t["name"] for t in tools]
        assert "tool1" in tool_names
        assert "tool2" in tool_names

    def test_get_available_tools_single_server(self, mcp_config):
        """Should filter tools by server."""
        client = MCPClient(mcp_config)
        client._tools_cache = {
            "server1": [{"name": "tool1"}],
            "server2": [{"name": "tool2"}],
        }

        tools = client.get_available_tools("server1")

        assert len(tools) == 1
        assert tools[0]["name"] == "tool1"

    def test_get_available_tools_empty_for_unknown_server(self, mcp_config):
        """Should return empty list for unknown server."""
        client = MCPClient(mcp_config)
        client._tools_cache = {"server1": [{"name": "tool1"}]}

        tools = client.get_available_tools("unknown")

        assert tools == []

    def test_is_connected(self, mcp_config):
        """Should check connection status."""
        client = MCPClient(mcp_config)
        client._connections["test"] = MagicMock()

        assert client.is_connected("test") is True
        assert client.is_connected("unknown") is False

    @pytest.mark.asyncio
    async def test_call_tool_routes_correctly(self, mcp_config):
        """Should route tool call to correct server."""
        client = MCPClient(mcp_config)

        mock_conn = MagicMock()
        mock_conn.call_tool = AsyncMock(return_value={"result": "success"})
        client._connections["test"] = mock_conn

        result = await client.call_tool("test", "test_tool", {"arg": "value"})

        mock_conn.call_tool.assert_called_once_with("test_tool", {"arg": "value"})
        assert result["result"] == "success"

    @pytest.mark.asyncio
    async def test_call_tool_raises_when_not_connected(self, mcp_config):
        """Should raise RuntimeError when not connected."""
        client = MCPClient(mcp_config)

        with pytest.raises(RuntimeError, match="Not connected"):
            await client.call_tool("unknown", "tool", {})

    @pytest.mark.asyncio
    async def test_context_manager(self, mcp_config):
        """Should support async context manager."""
        client = MCPClient(mcp_config)

        with patch.object(client, "disconnect_all", new_callable=AsyncMock) as mock_disconnect:
            async with client as c:
                assert c is client

            mock_disconnect.assert_called_once()


class TestMCPClientToolCaching:
    """Tests for tool caching behavior."""

    @pytest.fixture
    def mcp_config(self):
        return MCPConfig(
            servers={
                "test": MCPServerConfig(name="test", command="echo", enabled=True),
            }
        )

    @pytest.mark.asyncio
    async def test_tools_cached_with_server_metadata(self, mcp_config):
        """Should add _server metadata to cached tools."""
        client = MCPClient(mcp_config)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection,
                "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}],
            ):
                await client.connect("test")

        tools = client._tools_cache["test"]
        assert tools[0]["_server"] == "test"

    @pytest.mark.asyncio
    async def test_cache_cleared_on_disconnect(self, mcp_config):
        """Should clear cache when disconnecting."""
        client = MCPClient(mcp_config)
        client._connections["test"] = MagicMock(stop=AsyncMock())
        client._tools_cache["test"] = [{"name": "tool1"}]

        await client.disconnect("test")

        assert "test" not in client._tools_cache
