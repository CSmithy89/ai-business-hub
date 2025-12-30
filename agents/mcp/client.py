"""
MCP Client

Client for connecting to and interacting with MCP (Model Context Protocol) servers.
Manages subprocess-based server connections and JSON-RPC 2.0 communication.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4

References:
- MCP Protocol: https://modelcontextprotocol.io
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
"""
import asyncio
import json
import logging
import os
from typing import Any, Dict, List, Optional

from .config import MCPConfig, MCPServerConfig

logger = logging.getLogger(__name__)


class MCPConnectionError(Exception):
    """Raised when MCP connection fails."""

    pass


class MCPProtocolError(Exception):
    """Raised when MCP protocol communication fails."""

    pass


class MCPConnection:
    """
    Connection to a single MCP server.

    Manages the subprocess lifecycle and JSON-RPC 2.0 communication
    via stdin/stdout pipes.

    Attributes:
        config: Server configuration
        _process: Async subprocess handle
        _request_id: Counter for JSON-RPC request IDs
        _read_lock: Lock for serializing read operations
        _write_lock: Lock for serializing write operations

    Example:
        >>> config = MCPServerConfig(name="test", command="uvx", args=["mcp-server-test"])
        >>> conn = MCPConnection(config)
        >>> await conn.start()
        >>> tools = await conn.list_tools()
        >>> await conn.stop()
    """

    def __init__(self, config: MCPServerConfig):
        """
        Initialize connection with server configuration.

        Args:
            config: MCP server configuration
        """
        self.config = config
        self._process: Optional[asyncio.subprocess.Process] = None
        self._request_id = 0
        self._read_lock = asyncio.Lock()
        self._write_lock = asyncio.Lock()

    async def start(self) -> None:
        """
        Start the MCP server process.

        Launches the server as an async subprocess with stdin/stdout pipes.
        Waits briefly for initialization and checks if process started successfully.

        Raises:
            MCPConnectionError: If server fails to start
        """
        if self._process is not None:
            logger.warning(f"MCP server '{self.config.name}' already running")
            return

        # Resolve environment variables (don't log values for security)
        resolved_env = self.config.resolve_env()
        env = {**os.environ, **resolved_env}

        logger.info(f"Starting MCP server '{self.config.name}': {self.config.command} {' '.join(self.config.args)}")

        try:
            self._process = await asyncio.create_subprocess_exec(
                self.config.command,
                *self.config.args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )

            # Brief wait for initialization
            await asyncio.sleep(0.3)

            # Check if process started successfully
            if self._process.returncode is not None:
                stderr = ""
                if self._process.stderr:
                    stderr_bytes = await self._process.stderr.read()
                    stderr = stderr_bytes.decode("utf-8", errors="replace")
                raise MCPConnectionError(
                    f"MCP server '{self.config.name}' failed to start: {stderr}"
                )

            logger.info(f"MCP server '{self.config.name}' started (pid={self._process.pid})")

        except FileNotFoundError as e:
            raise MCPConnectionError(
                f"MCP server command not found: {self.config.command}. "
                f"Is the MCP server package installed? Error: {e}"
            )
        except Exception as e:
            raise MCPConnectionError(f"Failed to start MCP server '{self.config.name}': {e}")

    async def stop(self) -> None:
        """
        Stop the MCP server process gracefully.

        Attempts to terminate the process, then kills it if termination times out.
        """
        if self._process is None:
            return

        logger.info(f"Stopping MCP server '{self.config.name}'")

        try:
            self._process.terminate()
            try:
                await asyncio.wait_for(self._process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                logger.warning(f"MCP server '{self.config.name}' did not terminate, killing")
                self._process.kill()
                await self._process.wait()
        except ProcessLookupError:
            # Process already exited
            pass
        finally:
            self._process = None

    async def list_tools(self) -> List[Dict[str, Any]]:
        """
        Get list of available tools from the server.

        Sends a tools/list JSON-RPC request and returns tool definitions.

        Returns:
            List of tool definitions with name, description, inputSchema

        Raises:
            MCPProtocolError: If request fails
        """
        response = await self._send_request("tools/list", {})
        return response.get("tools", [])

    async def call_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Call a tool on the MCP server.

        Args:
            name: Tool name as returned by list_tools
            arguments: Tool arguments matching the tool's inputSchema

        Returns:
            Tool result dictionary

        Raises:
            MCPProtocolError: If tool call fails
        """
        response = await self._send_request(
            "tools/call",
            {
                "name": name,
                "arguments": arguments,
            },
        )
        return response

    async def _send_request(
        self,
        method: str,
        params: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Send a JSON-RPC 2.0 request to the server.

        Args:
            method: RPC method name (e.g., "tools/list", "tools/call")
            params: Method parameters

        Returns:
            Result from the JSON-RPC response

        Raises:
            MCPProtocolError: If communication fails or server returns error
        """
        if self._process is None or self._process.stdin is None or self._process.stdout is None:
            raise MCPProtocolError("MCP server not running")

        # Check if process is still alive
        if self._process.returncode is not None:
            raise MCPProtocolError(f"MCP server '{self.config.name}' has exited unexpectedly")

        self._request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": method,
            "params": params,
        }

        try:
            # Serialize and send request
            async with self._write_lock:
                request_bytes = (json.dumps(request) + "\n").encode("utf-8")
                self._process.stdin.write(request_bytes)
                await self._process.stdin.drain()

            # Read response
            async with self._read_lock:
                response_line = await asyncio.wait_for(
                    self._process.stdout.readline(),
                    timeout=30.0,  # Use config timeout eventually
                )

            if not response_line:
                raise MCPProtocolError(f"Empty response from MCP server '{self.config.name}'")

            response = json.loads(response_line.decode("utf-8"))

            # Check for JSON-RPC error
            if "error" in response:
                error = response["error"]
                raise MCPProtocolError(
                    f"MCP server error: {error.get('message', 'Unknown error')} "
                    f"(code={error.get('code')})"
                )

            return response.get("result", {})

        except asyncio.TimeoutError:
            raise MCPProtocolError(f"Timeout waiting for response from MCP server '{self.config.name}'")
        except json.JSONDecodeError as e:
            raise MCPProtocolError(f"Invalid JSON response from MCP server: {e}")


class MCPClient:
    """
    Client for Model Context Protocol servers.

    Manages connections to multiple MCP servers and provides a unified
    interface for tool discovery and invocation.

    Features:
    - Multi-server connection management
    - Tool discovery caching
    - Connection lifecycle management
    - Unified tool invocation interface

    Attributes:
        config: MCP configuration with server definitions
        _connections: Active connections by server name
        _tools_cache: Cached tools per server for fast lookup

    Example:
        >>> config = get_default_mcp_config()
        >>> client = MCPClient(config)
        >>> await client.connect("github")
        True
        >>> tools = client.get_available_tools("github")
        >>> result = await client.call_tool("github", "search_repositories", {"query": "python"})
        >>> await client.disconnect_all()
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

        Starts the server process, discovers available tools, and caches them.

        Args:
            server_name: Name of the server to connect to

        Returns:
            True if connection successful, False otherwise
        """
        # Already connected
        if server_name in self._connections:
            logger.debug(f"Already connected to MCP server '{server_name}'")
            return True

        # Check if server exists and is enabled
        server_config = self.config.servers.get(server_name)
        if not server_config:
            logger.warning(f"MCP server '{server_name}' not found in configuration")
            return False

        if not server_config.enabled:
            logger.warning(f"MCP server '{server_name}' is disabled")
            return False

        try:
            connection = MCPConnection(server_config)
            await connection.start()
            self._connections[server_name] = connection

            # Cache available tools
            tools = await connection.list_tools()
            # Add server name to each tool for later routing
            for tool in tools:
                tool["_server"] = server_name
            self._tools_cache[server_name] = tools

            logger.info(f"Connected to MCP server '{server_name}' with {len(tools)} tools")
            return True

        except MCPConnectionError as e:
            logger.error(f"Failed to connect to MCP server '{server_name}': {e}")
            return False
        except MCPProtocolError as e:
            # Started but tool discovery failed
            logger.error(f"MCP server '{server_name}' connected but tool discovery failed: {e}")
            if server_name in self._connections:
                await self._connections[server_name].stop()
                del self._connections[server_name]
            return False

    async def disconnect(self, server_name: str) -> None:
        """
        Disconnect from an MCP server.

        Stops the server process and clears the tool cache.

        Args:
            server_name: Name of server to disconnect
        """
        if server_name in self._connections:
            await self._connections[server_name].stop()
            del self._connections[server_name]
        if server_name in self._tools_cache:
            del self._tools_cache[server_name]
        logger.info(f"Disconnected from MCP server '{server_name}'")

    async def disconnect_all(self) -> None:
        """
        Disconnect from all connected servers.

        Stops all server processes and clears all caches.
        """
        server_names = list(self._connections.keys())
        for name in server_names:
            await self.disconnect(name)

    def get_available_tools(
        self,
        server_name: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Get list of available tools from connected servers.

        Args:
            server_name: Optional server to filter by. If None, returns all tools.

        Returns:
            List of tool definitions with name, description, inputSchema, _server
        """
        if server_name:
            return self._tools_cache.get(server_name, [])

        # Return all tools from all connected servers
        all_tools: List[Dict[str, Any]] = []
        for tools in self._tools_cache.values():
            all_tools.extend(tools)
        return all_tools

    def is_connected(self, server_name: str) -> bool:
        """
        Check if connected to a specific server.

        Args:
            server_name: Server name to check

        Returns:
            True if connected
        """
        return server_name in self._connections

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
            Tool result dictionary

        Raises:
            RuntimeError: If not connected to the specified server
            MCPProtocolError: If tool call fails
        """
        connection = self._connections.get(server_name)
        if not connection:
            raise RuntimeError(f"Not connected to MCP server '{server_name}'")

        logger.debug(f"Calling MCP tool '{tool_name}' on server '{server_name}'")
        return await connection.call_tool(tool_name, arguments)

    async def __aenter__(self) -> "MCPClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit - disconnect all servers."""
        await self.disconnect_all()
