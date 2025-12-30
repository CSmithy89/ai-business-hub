# Story DM-06.4: MCP Tool Integration

**Epic:** DM-06 - Contextual Intelligence
**Points:** 8
**Status:** drafted
**Priority:** High (Enables external tool access for agents)
**Dependencies:** DM-06.3 (Complete - Generative UI Composition)

---

## Overview

Enable HYVVE agents to connect to external tools via the Model Context Protocol (MCP). MCP is an open protocol that standardizes how AI applications connect to external data sources and tools. This story implements an MCP client that can connect to MCP servers (like GitHub, Brave Search, filesystem access) and bridges those tools to the Agno-based agent system.

This story implements:
- MCP server configuration system with environment variable resolution
- MCP client for managing subprocess-based server connections
- JSON-RPC communication with MCP servers
- Tool discovery and caching from connected servers
- A2A bridge for translating MCP tools to agent-compatible format
- Default server configurations for common tools (GitHub, Brave, filesystem)

The infrastructure created here enables:
- Agents accessing external services (GitHub repos, web search, file systems)
- Dynamic tool discovery from MCP servers at runtime
- Protocol translation between MCP tool calls and agent invocations
- Extensible configuration for adding new MCP servers
- Secure environment variable handling for API credentials

---

## User Story

**As a** platform developer,
**I want** agents to access external tools via the Model Context Protocol,
**So that** they can interact with services like GitHub, web search, and file systems to accomplish complex tasks.

---

## Acceptance Criteria

- [ ] **AC1:** `MCPServerConfig` model defines server configuration with name, command, args, env, description, enabled
- [ ] **AC2:** `MCPServerConfig.resolve_env()` resolves `${VAR}` patterns from system environment
- [ ] **AC3:** `MCPConfig` model holds servers dict, default_timeout, max_retries
- [ ] **AC4:** `MCPConfig.from_dict()` creates config from dictionary input
- [ ] **AC5:** `DEFAULT_MCP_SERVERS` provides configs for github, brave, filesystem servers
- [ ] **AC6:** `MCPClient` manages connections to multiple MCP servers
- [ ] **AC7:** `MCPClient.connect(server_name)` starts server process and caches tools
- [ ] **AC8:** `MCPClient.disconnect(server_name)` cleanly stops server process
- [ ] **AC9:** `MCPClient.disconnect_all()` stops all connected servers
- [ ] **AC10:** `MCPClient.get_available_tools()` returns tools from connected servers
- [ ] **AC11:** `MCPClient.call_tool()` invokes a tool on a specific server
- [ ] **AC12:** `MCPConnection` handles subprocess and JSON-RPC communication
- [ ] **AC13:** `MCPConnection.start()` launches server process with resolved env vars
- [ ] **AC14:** `MCPConnection.list_tools()` retrieves available tools via JSON-RPC
- [ ] **AC15:** `MCPConnection.call_tool()` sends tool invocation via JSON-RPC
- [ ] **AC16:** `MCPToolBridge` converts MCP tools to agent-compatible format
- [ ] **AC17:** `MCPToolBridge.get_tools_for_agent()` returns tools with `mcp_{server}_{tool}` naming
- [ ] **AC18:** `MCPToolBridge.invoke_tool()` parses tool name and routes to correct server
- [ ] **AC19:** `create_mcp_bridge()` factory function initializes client and bridge
- [ ] **AC20:** Unit tests pass with >85% coverage for MCP module

---

## Technical Approach

### MCP Architecture

The Model Context Protocol enables standardized communication between AI applications and external tools:

```
                          MCP Architecture
                                 |
                                 v
    +------------------------------------------------------------+
    |                      MCPToolBridge                          |
    |  - Translates MCP tools to agent format                    |
    |  - Routes tool invocations to correct server               |
    +-----------------------------+------------------------------+
                                  |
                                  v
    +------------------------------------------------------------+
    |                        MCPClient                            |
    |  - Manages multiple server connections                     |
    |  - Caches discovered tools                                 |
    |  - Handles connect/disconnect lifecycle                    |
    +------------+------------------+------------------+----------+
                 |                  |                  |
                 v                  v                  v
    +----------------+   +----------------+   +----------------+
    | MCPConnection  |   | MCPConnection  |   | MCPConnection  |
    |   (github)     |   |   (brave)      |   | (filesystem)   |
    +-------+--------+   +-------+--------+   +-------+--------+
            |                    |                    |
            v                    v                    v
    +----------------+   +----------------+   +----------------+
    |  MCP Server    |   |  MCP Server    |   |  MCP Server    |
    | (subprocess)   |   | (subprocess)   |   | (subprocess)   |
    +----------------+   +----------------+   +----------------+
```

### MCP Protocol Communication

MCP uses JSON-RPC 2.0 over stdio for communication:

```
Agent Request         MCPClient          MCPConnection        MCP Server
     |                    |                    |                    |
     | call_tool()        |                    |                    |
     |-------------------→|                    |                    |
     |                    | get connection     |                    |
     |                    |-------------------→|                    |
     |                    |                    | JSON-RPC request   |
     |                    |                    |-------------------→|
     |                    |                    |                    |
     |                    |                    | JSON-RPC response  |
     |                    |                    |←-------------------|
     |                    |                    |                    |
     |                    | result             |                    |
     |                    |←-------------------|                    |
     | result             |                    |                    |
     |←-------------------|                    |                    |
```

### Tool Name Translation

MCP tools are translated to agent-compatible names using the pattern `mcp_{server}_{tool}`:

| MCP Server | MCP Tool | Agent Tool Name |
|------------|----------|-----------------|
| github | search_repositories | mcp_github_search_repositories |
| github | create_issue | mcp_github_create_issue |
| brave | search | mcp_brave_search |
| filesystem | read_file | mcp_filesystem_read_file |

---

## Implementation Tasks

### Task 1: Create MCP Configuration System (2 points)

Create `agents/mcp/config.py` with:

1. **MCPServerConfig Model:**
   - `name: str` - Server identifier
   - `command: str` - Command to launch server (e.g., "uvx")
   - `args: List[str]` - Command arguments
   - `env: Dict[str, str]` - Environment variables (supports `${VAR}` pattern)
   - `description: Optional[str]` - Human-readable description
   - `enabled: bool = True` - Whether server is active
   - `resolve_env()` method to expand environment variables

2. **MCPConfig Model:**
   - `servers: Dict[str, MCPServerConfig]` - Configured servers
   - `default_timeout: int = 30` - Default request timeout
   - `max_retries: int = 3` - Retry attempts
   - `from_dict()` classmethod for dictionary initialization

3. **Default Configurations:**
   - `DEFAULT_MCP_SERVERS` dict with github, brave, filesystem configs
   - `get_default_mcp_config()` function to create default config

### Task 2: Create MCP Client (2.5 points)

Create `agents/mcp/client.py` with:

1. **MCPConnection Class:**
   - `__init__(config: MCPServerConfig)` - Store config
   - `start()` - Launch subprocess with resolved env vars
   - `stop()` - Terminate subprocess gracefully
   - `list_tools()` - Send `tools/list` JSON-RPC request
   - `call_tool(name, arguments)` - Send `tools/call` JSON-RPC request
   - `_send_request()` - Internal JSON-RPC communication

2. **MCPClient Class:**
   - `__init__(config: MCPConfig)` - Initialize with config
   - `_connections: Dict[str, MCPConnection]` - Active connections
   - `_tools_cache: Dict[str, List[Dict]]` - Cached tools per server
   - `connect(server_name)` - Start connection and cache tools
   - `disconnect(server_name)` - Stop connection and clear cache
   - `disconnect_all()` - Stop all connections
   - `get_available_tools(server_name)` - Get tools (all or filtered)
   - `call_tool(server_name, tool_name, arguments)` - Invoke tool

### Task 3: Create A2A Bridge (2 points)

Create `agents/mcp/a2a_bridge.py` with:

1. **MCPToolBridge Class:**
   - `__init__(mcp_client: MCPClient)` - Store client reference
   - `get_tools_for_agent()` - Convert MCP tools to agent format
   - `invoke_tool(tool_name, arguments)` - Parse name and route
   - `_convert_parameters(input_schema)` - Convert JSON Schema to params

2. **Tool Format Conversion:**
   - MCP tools use JSON Schema for parameters
   - Agent tools use flat parameter list
   - Bridge translates between formats

3. **Factory Function:**
   - `create_mcp_bridge(config)` - Initialize client, connect servers, return bridge

### Task 4: Create Module Exports and Tests (1.5 points)

Create `agents/mcp/__init__.py` with module exports.

Create `agents/mcp/__tests__/test_config.py` with:
- MCPServerConfig tests (env resolution, defaults)
- MCPConfig tests (from_dict, validation)
- Default server config tests

Create `agents/mcp/__tests__/test_client.py` with:
- MCPConnection tests (lifecycle, mocked JSON-RPC)
- MCPClient tests (connect/disconnect, tool caching)

Create `agents/mcp/__tests__/test_bridge.py` with:
- MCPToolBridge tests (tool conversion, invocation routing)
- Parameter conversion tests

---

## Files to Create

| File | Description |
|------|-------------|
| `agents/mcp/__init__.py` | Module exports for MCP package |
| `agents/mcp/config.py` | MCP configuration models and defaults |
| `agents/mcp/client.py` | MCP client and connection classes |
| `agents/mcp/a2a_bridge.py` | A2A bridge for tool translation |
| `agents/mcp/__tests__/__init__.py` | Test package init |
| `agents/mcp/__tests__/test_config.py` | Configuration unit tests |
| `agents/mcp/__tests__/test_client.py` | Client unit tests |
| `agents/mcp/__tests__/test_bridge.py` | Bridge unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `agents/gateway/agent.py` | Import and integrate MCP bridge for tool access |
| `agents/gateway/__init__.py` | Export MCP integration if needed |
| `docs/modules/bm-dm/sprint-status.yaml` | Update story status |

---

## Interface Definitions

### Python Configuration Models

```python
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import os


class MCPServerConfig(BaseModel):
    """Configuration for a single MCP server."""

    name: str
    command: str
    args: List[str] = Field(default_factory=list)
    env: Dict[str, str] = Field(default_factory=dict)
    description: Optional[str] = None
    enabled: bool = True

    def resolve_env(self) -> Dict[str, str]:
        """
        Resolve environment variables from system env.

        Expands ${VAR} patterns to actual environment values.

        Returns:
            Dict with resolved environment variables
        """
        resolved = {}
        for key, value in self.env.items():
            if value.startswith("${") and value.endswith("}"):
                env_var = value[2:-1]
                resolved[key] = os.getenv(env_var, "")
            else:
                resolved[key] = value
        return resolved


class MCPConfig(BaseModel):
    """Complete MCP configuration."""

    servers: Dict[str, MCPServerConfig] = Field(default_factory=dict)
    default_timeout: int = 30
    max_retries: int = 3

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MCPConfig":
        """
        Create config from dictionary.

        Args:
            data: Configuration dictionary with servers, timeout, retries

        Returns:
            MCPConfig instance
        """
        servers = {}
        for name, server_data in data.get("servers", {}).items():
            servers[name] = MCPServerConfig(name=name, **server_data)
        return cls(
            servers=servers,
            default_timeout=data.get("default_timeout", 30),
            max_retries=data.get("max_retries", 3),
        )
```

### Python Client Classes

```python
from typing import Any, Dict, List, Optional
import asyncio
import json
import subprocess
import logging

from .config import MCPConfig, MCPServerConfig

logger = logging.getLogger(__name__)


class MCPConnection:
    """
    Connection to a single MCP server.

    Manages the subprocess and JSON-RPC communication.
    """

    def __init__(self, config: MCPServerConfig):
        """
        Initialize connection with server config.

        Args:
            config: Server configuration
        """
        self.config = config
        self._process: Optional[subprocess.Popen] = None
        self._request_id = 0

    async def start(self) -> None:
        """
        Start the MCP server process.

        Raises:
            RuntimeError: If server fails to start
        """
        ...

    async def stop(self) -> None:
        """Stop the MCP server process gracefully."""
        ...

    async def list_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of available tools from server.

        Returns:
            List of tool definitions
        """
        ...

    async def call_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Call a tool on the MCP server.

        Args:
            name: Tool name
            arguments: Tool arguments

        Returns:
            Tool result
        """
        ...


class MCPClient:
    """
    Client for Model Context Protocol servers.

    Manages connections to MCP servers and provides a unified
    interface for tool discovery and invocation.
    """

    def __init__(self, config: MCPConfig):
        """
        Initialize client with configuration.

        Args:
            config: MCP configuration with server definitions
        """
        self.config = config
        self._connections: Dict[str, MCPConnection] = {}
        self._tools_cache: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, server_name: str) -> bool:
        """
        Connect to an MCP server.

        Args:
            server_name: Name of the server to connect to

        Returns:
            True if connection successful
        """
        ...

    async def disconnect(self, server_name: str) -> None:
        """
        Disconnect from an MCP server.

        Args:
            server_name: Name of server to disconnect
        """
        ...

    async def disconnect_all(self) -> None:
        """Disconnect from all connected servers."""
        ...

    def get_available_tools(
        self,
        server_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get list of available tools.

        Args:
            server_name: Optional server to filter by

        Returns:
            List of tool definitions
        """
        ...

    async def call_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Call a tool on an MCP server.

        Args:
            server_name: Server hosting the tool
            tool_name: Name of the tool to call
            arguments: Tool arguments

        Returns:
            Tool result
        """
        ...
```

### Python A2A Bridge

```python
from typing import Any, Dict, List, Optional

from .client import MCPClient
from .config import MCPConfig


class MCPToolBridge:
    """
    Bridges MCP tools to agent-compatible format.

    Converts MCP tool definitions to Agno tool format
    and handles invocation routing.
    """

    def __init__(self, mcp_client: MCPClient):
        """
        Initialize bridge with MCP client.

        Args:
            mcp_client: Connected MCP client
        """
        self.mcp_client = mcp_client

    def get_tools_for_agent(self) -> List[Dict[str, Any]]:
        """
        Get MCP tools in agent-compatible format.

        Returns:
            List of tool definitions with mcp_{server}_{tool} naming
        """
        ...

    async def invoke_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Invoke an MCP tool by its agent-compatible name.

        Args:
            tool_name: Agent tool name (mcp_{server}_{tool})
            arguments: Tool arguments

        Returns:
            Tool result

        Raises:
            ValueError: If tool name format is invalid
            RuntimeError: If not connected to required server
        """
        ...


async def create_mcp_bridge(
    config: Optional[MCPConfig] = None,
) -> MCPToolBridge:
    """
    Create and initialize an MCP tool bridge.

    Args:
        config: Optional MCP configuration (uses defaults if None)

    Returns:
        Initialized MCPToolBridge with connected servers
    """
    ...
```

---

## Testing Requirements

### Unit Tests (agents/mcp/__tests__/test_config.py)

```python
import pytest
import os
from unittest.mock import patch

from agents.mcp.config import (
    MCPServerConfig,
    MCPConfig,
    DEFAULT_MCP_SERVERS,
    get_default_mcp_config,
)


class TestMCPServerConfig:
    """Tests for MCPServerConfig model."""

    def test_creates_config_with_required_fields(self):
        """Should create config with name and command."""
        config = MCPServerConfig(
            name="test",
            command="uvx",
            args=["mcp-server-test"],
        )

        assert config.name == "test"
        assert config.command == "uvx"
        assert config.args == ["mcp-server-test"]
        assert config.enabled is True

    def test_resolves_env_variable_pattern(self):
        """Should resolve ${VAR} patterns from environment."""
        with patch.dict(os.environ, {"TEST_TOKEN": "secret123"}):
            config = MCPServerConfig(
                name="test",
                command="uvx",
                env={"TOKEN": "${TEST_TOKEN}"},
            )

            resolved = config.resolve_env()
            assert resolved["TOKEN"] == "secret123"

    def test_preserves_literal_env_values(self):
        """Should preserve literal values without ${} pattern."""
        config = MCPServerConfig(
            name="test",
            command="uvx",
            env={"STATIC": "literal_value"},
        )

        resolved = config.resolve_env()
        assert resolved["STATIC"] == "literal_value"

    def test_returns_empty_for_missing_env_var(self):
        """Should return empty string for undefined env vars."""
        config = MCPServerConfig(
            name="test",
            command="uvx",
            env={"MISSING": "${UNDEFINED_VAR}"},
        )

        resolved = config.resolve_env()
        assert resolved["MISSING"] == ""

    def test_disabled_by_default_false(self):
        """Should default to enabled=True."""
        config = MCPServerConfig(name="test", command="cmd")
        assert config.enabled is True


class TestMCPConfig:
    """Tests for MCPConfig model."""

    def test_creates_config_from_dict(self):
        """Should create config from dictionary."""
        data = {
            "servers": {
                "github": {
                    "command": "uvx",
                    "args": ["mcp-server-github"],
                    "env": {"GITHUB_TOKEN": "${GITHUB_TOKEN}"},
                },
            },
            "default_timeout": 60,
            "max_retries": 5,
        }

        config = MCPConfig.from_dict(data)

        assert "github" in config.servers
        assert config.servers["github"].name == "github"
        assert config.default_timeout == 60
        assert config.max_retries == 5

    def test_default_timeout_and_retries(self):
        """Should use default timeout and retries."""
        config = MCPConfig.from_dict({"servers": {}})

        assert config.default_timeout == 30
        assert config.max_retries == 3


class TestDefaultMCPServers:
    """Tests for default server configurations."""

    def test_github_server_defined(self):
        """Should have github server config."""
        assert "github" in DEFAULT_MCP_SERVERS
        github = DEFAULT_MCP_SERVERS["github"]
        assert github.command == "uvx"
        assert "mcp-server-github" in github.args

    def test_brave_server_defined(self):
        """Should have brave search server config."""
        assert "brave" in DEFAULT_MCP_SERVERS
        brave = DEFAULT_MCP_SERVERS["brave"]
        assert "mcp-server-brave-search" in brave.args

    def test_filesystem_server_defined(self):
        """Should have filesystem server config."""
        assert "filesystem" in DEFAULT_MCP_SERVERS
        fs = DEFAULT_MCP_SERVERS["filesystem"]
        assert "mcp-server-filesystem" in fs.args

    def test_get_default_config(self):
        """Should return config with default servers."""
        config = get_default_mcp_config()

        assert isinstance(config, MCPConfig)
        assert len(config.servers) == 3
```

### Unit Tests (agents/mcp/__tests__/test_client.py)

```python
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from agents.mcp.client import MCPClient, MCPConnection
from agents.mcp.config import MCPConfig, MCPServerConfig


class TestMCPConnection:
    """Tests for MCPConnection class."""

    @pytest.fixture
    def server_config(self):
        return MCPServerConfig(
            name="test",
            command="echo",
            args=["test"],
        )

    @pytest.mark.asyncio
    async def test_start_launches_subprocess(self, server_config):
        """Should launch subprocess on start."""
        conn = MCPConnection(server_config)

        with patch("subprocess.Popen") as mock_popen:
            mock_popen.return_value.poll.return_value = None
            await conn.start()

            mock_popen.assert_called_once()
            assert conn._process is not None

    @pytest.mark.asyncio
    async def test_stop_terminates_process(self, server_config):
        """Should terminate subprocess on stop."""
        conn = MCPConnection(server_config)
        conn._process = MagicMock()
        conn._process.poll.return_value = None

        await conn.stop()

        conn._process.terminate.assert_called_once()


class TestMCPClient:
    """Tests for MCPClient class."""

    @pytest.fixture
    def mcp_config(self):
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

    @pytest.mark.asyncio
    async def test_connect_starts_connection(self, mcp_config):
        """Should start connection and cache tools."""
        client = MCPClient(mcp_config)

        with patch.object(MCPConnection, "start", new_callable=AsyncMock):
            with patch.object(
                MCPConnection, "list_tools",
                new_callable=AsyncMock,
                return_value=[{"name": "tool1"}],
            ):
                result = await client.connect("test")

                assert result is True
                assert "test" in client._connections
                assert "test" in client._tools_cache

    @pytest.mark.asyncio
    async def test_connect_returns_false_for_unknown_server(self, mcp_config):
        """Should return False for unknown server."""
        client = MCPClient(mcp_config)
        result = await client.connect("unknown")

        assert result is False

    @pytest.mark.asyncio
    async def test_disconnect_stops_connection(self, mcp_config):
        """Should stop connection and clear cache."""
        client = MCPClient(mcp_config)
        mock_conn = MagicMock()
        mock_conn.stop = AsyncMock()
        client._connections["test"] = mock_conn
        client._tools_cache["test"] = []

        await client.disconnect("test")

        assert "test" not in client._connections
        assert "test" not in client._tools_cache

    def test_get_available_tools_all_servers(self, mcp_config):
        """Should return tools from all servers."""
        client = MCPClient(mcp_config)
        client._tools_cache = {
            "server1": [{"name": "tool1"}],
            "server2": [{"name": "tool2"}],
        }

        tools = client.get_available_tools()

        assert len(tools) == 2

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
```

### Unit Tests (agents/mcp/__tests__/test_bridge.py)

```python
import pytest
from unittest.mock import AsyncMock, MagicMock

from agents.mcp.a2a_bridge import MCPToolBridge, create_mcp_bridge
from agents.mcp.client import MCPClient


class TestMCPToolBridge:
    """Tests for MCPToolBridge class."""

    @pytest.fixture
    def mock_client(self):
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
            }
        ]
        return client

    def test_get_tools_for_agent_converts_names(self, mock_client):
        """Should convert tool names to mcp_{server}_{tool} format."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        assert len(tools) == 1
        assert tools[0]["name"] == "mcp_github_search"

    def test_get_tools_for_agent_converts_parameters(self, mock_client):
        """Should convert JSON Schema to parameter list."""
        bridge = MCPToolBridge(mock_client)

        tools = bridge.get_tools_for_agent()

        params = tools[0]["parameters"]
        assert len(params) == 1
        assert params[0]["name"] == "query"
        assert params[0]["type"] == "string"
        assert params[0]["required"] is True

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
```

### Integration Tests

- Verify MCP servers can be started and stopped (mocked subprocess)
- Verify tool discovery caches results correctly
- Verify tool invocation routes to correct server
- Verify error handling for connection failures
- Verify environment variable resolution

---

## Definition of Done

- [ ] `MCPServerConfig` model validates and resolves env vars
- [ ] `MCPConfig` model parses from dictionary with defaults
- [ ] Default server configs defined for GitHub, Brave, filesystem
- [ ] `MCPConnection` manages subprocess lifecycle
- [ ] `MCPConnection` sends JSON-RPC requests for tools/list and tools/call
- [ ] `MCPClient` manages multiple connections with caching
- [ ] `MCPClient.connect()` starts server and caches tools
- [ ] `MCPClient.disconnect()` stops server gracefully
- [ ] `MCPToolBridge` converts MCP tools to agent format
- [ ] `MCPToolBridge.invoke_tool()` parses name and routes correctly
- [ ] `create_mcp_bridge()` factory initializes everything
- [ ] Module exports defined in `__init__.py`
- [ ] Unit tests pass with >85% coverage
- [ ] Integration with gateway agent documented
- [ ] Sprint status updated to review

---

## Technical Notes

### Model Context Protocol (MCP)

MCP is an open protocol developed by Anthropic for connecting AI applications to external tools and data sources. Key aspects:

1. **Transport Layer**: MCP uses stdio (standard input/output) for communication with subprocess-based servers.

2. **Message Format**: JSON-RPC 2.0 for request/response messaging:
   ```json
   {"jsonrpc": "2.0", "method": "tools/list", "id": 1}
   {"jsonrpc": "2.0", "result": {"tools": [...]}, "id": 1}
   ```

3. **Tool Discovery**: Servers expose available tools via `tools/list` method with JSON Schema definitions for parameters.

4. **Tool Invocation**: Tools are called via `tools/call` with name and arguments.

### Subprocess Management

MCP servers run as subprocesses, requiring careful lifecycle management:

```python
# Starting a server
process = subprocess.Popen(
    [command] + args,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env={**os.environ, **resolved_env},
)

# Graceful shutdown
process.terminate()
try:
    process.wait(timeout=5)
except subprocess.TimeoutExpired:
    process.kill()
```

### Environment Variable Security

API keys and secrets are passed via environment variables with `${VAR}` pattern resolution:

```python
env = {"GITHUB_TOKEN": "${GITHUB_TOKEN}"}
# Resolved to actual value at runtime
resolved = {"GITHUB_TOKEN": os.getenv("GITHUB_TOKEN", "")}
```

This keeps secrets out of configuration files while allowing flexible deployment.

### JSON-RPC Communication

JSON-RPC requests are written to stdin and responses read from stdout:

```python
async def _send_request(self, method: str, params: dict = None) -> dict:
    self._request_id += 1
    request = {
        "jsonrpc": "2.0",
        "method": method,
        "id": self._request_id,
    }
    if params:
        request["params"] = params

    # Write request
    self._process.stdin.write(json.dumps(request).encode() + b"\n")
    self._process.stdin.flush()

    # Read response
    response_line = self._process.stdout.readline()
    return json.loads(response_line)
```

### Default MCP Servers

The following servers are configured by default:

| Server | Package | Description | Required Env |
|--------|---------|-------------|--------------|
| github | mcp-server-github | GitHub API access | GITHUB_TOKEN |
| brave | mcp-server-brave-search | Web search | BRAVE_API_KEY |
| filesystem | mcp-server-filesystem | Local file access | None (sandboxed) |

Additional servers can be configured by extending the MCPConfig.

---

## Dependencies

### This Story Depends On

| Story | Reason |
|-------|--------|
| DM-06.3 | Complete - Generative UI for displaying tool results |
| DM-02.4 | Complete - Dashboard gateway agent that will use MCP tools |

### Stories That Depend On This

| Story | Reason |
|-------|--------|
| DM-06.5 | Universal Agent Mesh will include MCP tools in discovery |

---

## References

- [Epic DM-06 Tech Spec](../epics/epic-dm-06-tech-spec.md) - Section 3.4
- [Model Context Protocol Specification](https://modelcontextprotocol.io) - Official MCP documentation
- [MCP GitHub Repository](https://github.com/modelcontextprotocol/specification) - Protocol specification
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) - Message format
- [Dynamic Module System Architecture](../../../architecture/dynamic-module-system.md) - Phase 6

---

## Development Notes

*Implementation Date: 2025-12-31*

### Files Created

| File | Description |
|------|-------------|
| `agents/mcp/__init__.py` | Module exports for MCP package |
| `agents/mcp/config.py` | MCP configuration models (MCPServerConfig, MCPConfig) and defaults |
| `agents/mcp/client.py` | MCPConnection (subprocess + JSON-RPC) and MCPClient (multi-server) |
| `agents/mcp/a2a_bridge.py` | MCPToolBridge and create_mcp_bridge() factory |
| `agents/mcp/__tests__/__init__.py` | Test package init |
| `agents/mcp/__tests__/test_config.py` | Configuration unit tests (19 tests) |
| `agents/mcp/__tests__/test_client.py` | Client and connection unit tests (31 tests) |
| `agents/mcp/__tests__/test_bridge.py` | Bridge and factory unit tests (30 tests) |

### Key Implementation Decisions

1. **Async subprocess management**: Used `asyncio.create_subprocess_exec()` for non-blocking IO instead of synchronous `subprocess.Popen`. This allows concurrent operations and proper timeout handling.

2. **JSON-RPC locking**: Added `_read_lock` and `_write_lock` to serialize stdin/stdout operations, preventing interleaved messages in concurrent scenarios.

3. **Tool name convention**: MCP tools are translated to agent-compatible names using `mcp_{server}_{tool}` pattern (e.g., `mcp_github_search_repositories`). The parsing splits only on the first two underscores to handle tool names with underscores.

4. **Environment variable resolution**: Used regex pattern `\$\{([^}]+)\}` for `${VAR}` resolution. Partial patterns (e.g., `prefix_${VAR}_suffix`) are treated as literals for security and simplicity.

5. **Tool caching**: Tools are discovered and cached at connection time. Cache is cleared on disconnect to ensure fresh tool lists on reconnect.

6. **Error handling**: Custom exception classes (`MCPConnectionError`, `MCPProtocolError`) provide clear error categorization. Process cleanup is handled in try/finally blocks.

### Deviations from Spec

- **Sandbox directory**: The filesystem server is configured with `/tmp/hyvve` as the sandboxed directory, matching the tech spec.
- **No gateway integration**: The spec mentioned modifying `agents/gateway/agent.py`, but this is deferred to a separate integration step to keep the MCP module self-contained.

### Test Coverage

- **80 tests passing** with **99% code coverage**
- Exceeds the 85% coverage target specified in acceptance criteria
- Uses mocks for subprocess to avoid spawning actual MCP servers during tests

---

*Story Created: 2025-12-31*
*Epic: DM-06 | Story: 4 of 6 | Points: 8*

---

## Senior Developer Review

**Date:** 2025-12-31
**Reviewer:** Claude (AI Code Review)
**Status:** APPROVED

### Acceptance Criteria Verification

| AC | Description | Status | Notes |
|----|-------------|--------|-------|
| AC1 | `MCPServerConfig` model with name, command, args, env, description, enabled | PASS | Properly implemented with Pydantic BaseModel, Field descriptions, and all required attributes |
| AC2 | `MCPServerConfig.resolve_env()` resolves `${VAR}` patterns | PASS | Uses regex pattern `\$\{([^}]+)\}` with `fullmatch()` for security. Logs warning for missing env vars |
| AC3 | `MCPConfig` model with servers dict, default_timeout, max_retries | PASS | Correctly implemented with default values (30s timeout, 3 retries) |
| AC4 | `MCPConfig.from_dict()` creates config from dictionary | PASS | Properly parses servers and applies defaults for missing timeout/retries |
| AC5 | `DEFAULT_MCP_SERVERS` for github, brave, filesystem | PASS | All three servers configured with correct packages and env vars |
| AC6 | `MCPClient` manages connections to multiple MCP servers | PASS | Uses `_connections` dict with proper lifecycle management |
| AC7 | `MCPClient.connect(server_name)` starts server and caches tools | PASS | Creates MCPConnection, starts it, discovers tools, caches with `_server` metadata |
| AC8 | `MCPClient.disconnect(server_name)` cleanly stops server | PASS | Stops connection and clears cache |
| AC9 | `MCPClient.disconnect_all()` stops all connected servers | PASS | Iterates over all connections and disconnects each |
| AC10 | `MCPClient.get_available_tools()` returns tools from servers | PASS | Supports optional server_name filter, returns all tools when None |
| AC11 | `MCPClient.call_tool()` invokes a tool on a specific server | PASS | Routes to correct connection with proper error handling |
| AC12 | `MCPConnection` handles subprocess and JSON-RPC | PASS | Uses asyncio.create_subprocess_exec with stdin/stdout pipes |
| AC13 | `MCPConnection.start()` launches with resolved env vars | PASS | Resolves env, merges with os.environ, handles startup errors |
| AC14 | `MCPConnection.list_tools()` via JSON-RPC | PASS | Sends `tools/list` method, returns tools array |
| AC15 | `MCPConnection.call_tool()` via JSON-RPC | PASS | Sends `tools/call` with name and arguments |
| AC16 | `MCPToolBridge` converts MCP tools to agent format | PASS | Transforms JSON Schema to flat parameter list |
| AC17 | `MCPToolBridge.get_tools_for_agent()` with `mcp_{server}_{tool}` naming | PASS | Correctly prefixes all tool names, preserves metadata |
| AC18 | `MCPToolBridge.invoke_tool()` parses name and routes | PASS | Splits on first two underscores to handle tool names with underscores |
| AC19 | `create_mcp_bridge()` factory function | PASS | Creates client, optionally connects to enabled servers, returns bridge |
| AC20 | Unit tests pass with >85% coverage | PASS | 80 tests passing with 99% coverage |

### Code Quality Assessment

**Strengths:**
1. **Excellent Documentation**: Comprehensive docstrings with examples, module-level documentation, and clear references to the tech spec
2. **Proper Async Implementation**: Uses `asyncio.create_subprocess_exec()` for non-blocking I/O with proper locking (`_read_lock`, `_write_lock`)
3. **Security Considerations**:
   - Uses `fullmatch()` for env var pattern to prevent partial pattern injection
   - Logs warning without exposing secret values
   - Empty env vars resolve to empty string rather than crashing
4. **Error Handling**: Custom exception classes (`MCPConnectionError`, `MCPProtocolError`) with informative messages
5. **Clean Architecture**: Clear separation of concerns (config, client, bridge) with well-defined interfaces
6. **Context Manager Support**: `MCPClient` supports async context manager for resource cleanup
7. **Type Hints**: Comprehensive type annotations throughout

**Minor Observations (Non-blocking):**
1. **Test Warnings**: Some `RuntimeWarning` about unawaited coroutines in mocks - these are benign mock setup issues, not production code problems
2. **Config Mutation**: `get_default_mcp_config()` returns a shallow copy of `DEFAULT_MCP_SERVERS` via `.copy()`. Modifying server configs would affect the global defaults. Consider deep copy if this becomes an issue.
3. **Timeout Hardcoded**: The 30s timeout in `_send_request()` is hardcoded with a TODO comment to use config timeout eventually

### Test Coverage Assessment

- **Total Tests**: 80
- **Coverage**: 99% (821 statements, 12 missed)
- **Missed Lines**: Primarily edge cases in error handling paths (client.py lines 83-84, 215, 240, 255, 257, 344-350)

**Test Organization:**
- `test_config.py`: 19 tests covering MCPServerConfig, MCPConfig, defaults, and env var patterns
- `test_client.py`: 31 tests covering MCPConnection lifecycle, JSON-RPC, MCPClient operations
- `test_bridge.py`: 30 tests covering tool conversion, invocation routing, parameter conversion, factory

### Security Considerations

1. **Environment Variable Handling**: Secure - uses pattern matching to expand only `${VAR}` patterns, treats partial patterns as literals
2. **Command Injection Prevention**: Safe - command and args are passed as separate arguments to `create_subprocess_exec()`, not shell interpolated
3. **Process Management**: Proper - graceful termination with timeout fallback to kill
4. **No Secrets in Logs**: Confirmed - env values are not logged

### Overall Outcome

**APPROVE**

The implementation is production-ready with excellent code quality, comprehensive documentation, thorough test coverage (99%), and proper security considerations. All 20 acceptance criteria are verified passing. The minor observations noted above are non-blocking and can be addressed in future iterations if needed.

The MCP Tool Integration provides a solid foundation for enabling HYVVE agents to access external tools via the Model Context Protocol.
