"""
Unit tests for MCP A2A bridge.

Tests MCPToolBridge tool conversion and invocation routing.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4
"""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from mcp.a2a_bridge import MCP_TOOL_PREFIX, MCPToolBridge, create_mcp_bridge
from mcp.client import MCPClient
from mcp.config import MCPConfig, MCPServerConfig


class TestMCPToolBridge:
    """Tests for MCPToolBridge class."""

    @pytest.fixture
    def mock_client(self):
        """Create a mock MCP client with sample tools."""
        client = MagicMock(spec=MCPClient)
        client.get_available_tools.return_value = [
            {
                "name": "search",
                "description": "Search repositories",
                "_server": "github",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"},
                    },
                    "required": ["query"],
                },
            },
            {
                "name": "read_file",
                "description": "Read a file",
                "_server": "filesystem",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path"},
                        "encoding": {"type": "string", "description": "File encoding", "default": "utf-8"},
                    },
                    "required": ["path"],
                },
            },
        ]
        client.is_connected.return_value = True
        return client

    def test_get_tools_for_agent_converts_names(self, mock_client):
        """Should convert tool names to mcp_{server}_{tool} format."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        assert len(tools) == 2
        tool_names = [t["name"] for t in tools]
        assert "mcp_github_search" in tool_names
        assert "mcp_filesystem_read_file" in tool_names

    def test_get_tools_for_agent_preserves_description(self, mock_client):
        """Should preserve tool descriptions."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        github_tool = next(t for t in tools if t["name"] == "mcp_github_search")
        assert github_tool["description"] == "Search repositories"

    def test_get_tools_for_agent_converts_parameters(self, mock_client):
        """Should convert JSON Schema to parameter list."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        github_tool = next(t for t in tools if t["name"] == "mcp_github_search")
        params = github_tool["parameters"]

        assert len(params) == 1
        assert params[0]["name"] == "query"
        assert params[0]["type"] == "string"
        assert params[0]["required"] is True

    def test_get_tools_for_agent_handles_optional_params(self, mock_client):
        """Should mark optional parameters correctly."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        fs_tool = next(t for t in tools if t["name"] == "mcp_filesystem_read_file")
        params = fs_tool["parameters"]

        path_param = next(p for p in params if p["name"] == "path")
        encoding_param = next(p for p in params if p["name"] == "encoding")

        assert path_param["required"] is True
        assert encoding_param["required"] is False

    def test_get_tools_for_agent_includes_defaults(self, mock_client):
        """Should include default values when present."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        fs_tool = next(t for t in tools if t["name"] == "mcp_filesystem_read_file")
        encoding_param = next(p for p in fs_tool["parameters"] if p["name"] == "encoding")

        assert encoding_param.get("default") == "utf-8"

    def test_get_tools_for_agent_stores_mcp_metadata(self, mock_client):
        """Should store original MCP server and tool info."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        github_tool = next(t for t in tools if t["name"] == "mcp_github_search")
        assert github_tool["_mcp_server"] == "github"
        assert github_tool["_mcp_tool"] == "search"

    def test_get_tools_for_agent_skips_tools_without_name(self, mock_client):
        """Should skip tools without a name."""
        mock_client.get_available_tools.return_value = [
            {"description": "No name tool", "_server": "test", "inputSchema": {}},
            {"name": "valid", "description": "Valid tool", "_server": "test", "inputSchema": {}},
        ]
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        assert len(tools) == 1
        assert tools[0]["name"] == "mcp_test_valid"

    @pytest.mark.asyncio
    async def test_invoke_tool_parses_name_and_routes(self, mock_client):
        """Should parse tool name and call correct server."""
        mock_client.call_tool = AsyncMock(return_value={"result": "data"})
        bridge = MCPToolBridge(mock_client)

        result = await bridge.invoke_tool(
            "mcp_github_search",
            {"query": "test"},
        )

        mock_client.call_tool.assert_called_once_with(
            "github", "search", {"query": "test"}
        )
        assert result["result"] == "data"

    @pytest.mark.asyncio
    async def test_invoke_tool_raises_for_invalid_name(self, mock_client):
        """Should raise ValueError for invalid tool name."""
        bridge = MCPToolBridge(mock_client)

        with pytest.raises(ValueError, match="Invalid MCP tool name"):
            await bridge.invoke_tool("invalid_name", {})

    @pytest.mark.asyncio
    async def test_invoke_tool_raises_for_name_without_prefix(self, mock_client):
        """Should raise ValueError for name without mcp_ prefix."""
        bridge = MCPToolBridge(mock_client)

        with pytest.raises(ValueError, match="Invalid MCP tool name"):
            await bridge.invoke_tool("github_search", {})

    @pytest.mark.asyncio
    async def test_invoke_tool_raises_for_short_name(self, mock_client):
        """Should raise ValueError for name with too few parts."""
        bridge = MCPToolBridge(mock_client)

        with pytest.raises(ValueError, match="Invalid MCP tool name"):
            await bridge.invoke_tool("mcp_github", {})

    @pytest.mark.asyncio
    async def test_invoke_tool_handles_underscore_in_tool_name(self, mock_client):
        """Should handle tool names with underscores."""
        mock_client.call_tool = AsyncMock(return_value={})
        bridge = MCPToolBridge(mock_client)

        await bridge.invoke_tool(
            "mcp_github_search_repositories",
            {},
        )

        mock_client.call_tool.assert_called_once_with(
            "github", "search_repositories", {}
        )

    @pytest.mark.asyncio
    async def test_invoke_tool_handles_multiple_underscores(self, mock_client):
        """Should handle tool names with multiple underscores."""
        mock_client.call_tool = AsyncMock(return_value={})
        bridge = MCPToolBridge(mock_client)

        await bridge.invoke_tool(
            "mcp_filesystem_read_text_file",
            {},
        )

        mock_client.call_tool.assert_called_once_with(
            "filesystem", "read_text_file", {}
        )

    @pytest.mark.asyncio
    async def test_invoke_tool_raises_when_not_connected(self, mock_client):
        """Should raise RuntimeError when not connected to server."""
        mock_client.is_connected.return_value = False
        bridge = MCPToolBridge(mock_client)

        with pytest.raises(RuntimeError, match="Not connected"):
            await bridge.invoke_tool("mcp_github_search", {})

    def test_parse_tool_name(self, mock_client):
        """Should parse tool name into server and tool."""
        bridge = MCPToolBridge(mock_client)

        server, tool = bridge.parse_tool_name("mcp_github_search_repositories")

        assert server == "github"
        assert tool == "search_repositories"

    def test_parse_tool_name_raises_for_invalid(self, mock_client):
        """Should raise ValueError for invalid name."""
        bridge = MCPToolBridge(mock_client)

        with pytest.raises(ValueError):
            bridge.parse_tool_name("invalid")


class TestConvertParameters:
    """Tests for parameter conversion."""

    @pytest.fixture
    def bridge(self):
        mock_client = MagicMock(spec=MCPClient)
        return MCPToolBridge(mock_client)

    def test_converts_string_type(self, bridge):
        """Should convert string type."""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Name field"},
            },
            "required": ["name"],
        }

        params = bridge._convert_parameters(schema)

        assert params[0]["type"] == "string"
        assert params[0]["required"] is True

    def test_converts_integer_type(self, bridge):
        """Should convert integer type."""
        schema = {
            "type": "object",
            "properties": {
                "count": {"type": "integer", "description": "Count"},
            },
            "required": [],
        }

        params = bridge._convert_parameters(schema)

        assert params[0]["type"] == "integer"
        assert params[0]["required"] is False

    def test_converts_boolean_type(self, bridge):
        """Should convert boolean type."""
        schema = {
            "type": "object",
            "properties": {
                "enabled": {"type": "boolean", "description": "Enabled flag"},
            },
        }

        params = bridge._convert_parameters(schema)

        assert params[0]["type"] == "boolean"

    def test_handles_empty_schema(self, bridge):
        """Should handle empty schema."""
        params = bridge._convert_parameters({})
        assert params == []

    def test_handles_no_properties(self, bridge):
        """Should handle schema without properties."""
        schema = {"type": "object"}
        params = bridge._convert_parameters(schema)
        assert params == []

    def test_includes_enum_values(self, bridge):
        """Should include enum values when present."""
        schema = {
            "type": "object",
            "properties": {
                "format": {
                    "type": "string",
                    "description": "Output format",
                    "enum": ["json", "xml", "csv"],
                },
            },
        }

        params = bridge._convert_parameters(schema)

        assert params[0]["enum"] == ["json", "xml", "csv"]

    def test_defaults_type_to_string(self, bridge):
        """Should default to string type when not specified."""
        schema = {
            "type": "object",
            "properties": {
                "field": {"description": "Field without type"},
            },
        }

        params = bridge._convert_parameters(schema)

        assert params[0]["type"] == "string"


class TestCreateMCPBridge:
    """Tests for create_mcp_bridge factory function."""

    @pytest.mark.asyncio
    async def test_creates_bridge_with_default_config(self):
        """Should create bridge with default configuration."""
        with patch.object(MCPClient, "connect", new_callable=AsyncMock, return_value=True):
            bridge = await create_mcp_bridge(connect_enabled=False)

        assert bridge is not None
        assert isinstance(bridge.mcp_client, MCPClient)

    @pytest.mark.asyncio
    async def test_creates_bridge_with_custom_config(self):
        """Should create bridge with custom configuration."""
        config = MCPConfig(
            servers={
                "custom": MCPServerConfig(name="custom", command="cmd", enabled=True),
            }
        )

        with patch.object(MCPClient, "connect", new_callable=AsyncMock, return_value=True):
            bridge = await create_mcp_bridge(config=config, connect_enabled=False)

        assert "custom" in bridge.mcp_client.config.servers

    @pytest.mark.asyncio
    async def test_connects_to_enabled_servers(self):
        """Should connect to enabled servers when connect_enabled=True."""
        config = MCPConfig(
            servers={
                "enabled": MCPServerConfig(name="enabled", command="cmd", enabled=True),
                "disabled": MCPServerConfig(name="disabled", command="cmd", enabled=False),
            }
        )

        with patch.object(MCPClient, "connect", new_callable=AsyncMock, return_value=True) as mock_connect:
            await create_mcp_bridge(config=config, connect_enabled=True)

        # Should only attempt to connect to enabled server
        mock_connect.assert_called_once_with("enabled")

    @pytest.mark.asyncio
    async def test_handles_connection_failures(self):
        """Should handle connection failures gracefully."""
        config = MCPConfig(
            servers={
                "test": MCPServerConfig(name="test", command="cmd", enabled=True),
            }
        )

        with patch.object(MCPClient, "connect", new_callable=AsyncMock, return_value=False):
            # Should not raise, just log warning
            bridge = await create_mcp_bridge(config=config, connect_enabled=True)

        assert bridge is not None

    @pytest.mark.asyncio
    async def test_skips_connection_when_disabled(self):
        """Should not connect when connect_enabled=False."""
        config = MCPConfig(
            servers={
                "test": MCPServerConfig(name="test", command="cmd", enabled=True),
            }
        )

        with patch.object(MCPClient, "connect", new_callable=AsyncMock) as mock_connect:
            await create_mcp_bridge(config=config, connect_enabled=False)

        mock_connect.assert_not_called()


class TestMCPToolPrefixConstant:
    """Tests for MCP_TOOL_PREFIX constant."""

    def test_prefix_is_mcp(self):
        """Should have correct prefix value."""
        assert MCP_TOOL_PREFIX == "mcp"
