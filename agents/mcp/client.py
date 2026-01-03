"""
MCP Client

Client for connecting to and interacting with MCP (Model Context Protocol) servers.
Manages subprocess-based server connections and JSON-RPC 2.0 communication.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.4

DM-11.4: Added parallel connection support with connect_all(), health status methods,
and retry logic with exponential backoff.

References:
- MCP Protocol: https://modelcontextprotocol.io
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
"""
import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .config import MCPConfig, MCPServerConfig

logger = logging.getLogger(__name__)


# ============================================================================
# DM-11.4: Parallel Connection Support
# ============================================================================

# Maximum concurrent MCP connections to prevent file descriptor exhaustion
# CR-06: Backpressure for parallel connections
MAX_CONCURRENT_MCP_CONNECTIONS = 10


@dataclass
class ConnectionResult:
    """
    Result of a single MCP server connection attempt.

    Provides structured information about connection success/failure,
    timing, and error details for logging and health reporting.

    Attributes:
        server_name: Name of the MCP server
        success: Whether connection was successful
        tools_count: Number of tools discovered (0 if failed)
        error: Error message if connection failed
        retry_scheduled: Whether retry is scheduled for this server
        connect_time_ms: Time taken to connect in milliseconds

    Example:
        >>> result = ConnectionResult(
        ...     server_name="github",
        ...     success=True,
        ...     tools_count=15,
        ...     connect_time_ms=234.5,
        ... )
    """
    server_name: str
    success: bool
    tools_count: int = 0
    error: Optional[str] = None
    retry_scheduled: bool = False
    connect_time_ms: float = 0.0


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
        _request_lock: Lock for serializing entire request-response cycles

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
        # Single lock for entire request-response cycle to prevent response mixing
        self._request_lock = asyncio.Lock()

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
            # Use single lock for entire request-response cycle to prevent
            # concurrent requests from mixing up their responses
            async with self._request_lock:
                # Serialize and send request
                request_bytes = (json.dumps(request) + "\n").encode("utf-8")
                self._process.stdin.write(request_bytes)
                await self._process.stdin.drain()

                # Read response
                response_line = await asyncio.wait_for(
                    self._process.stdout.readline(),
                    timeout=30.0,  # Use config timeout eventually
                )

            if not response_line:
                raise MCPProtocolError(f"Empty response from MCP server '{self.config.name}'")

            response = json.loads(response_line.decode("utf-8"))

            # Verify response ID matches request ID (defensive check)
            response_id = response.get("id")
            if response_id != self._request_id:
                logger.warning(
                    f"Response ID mismatch: expected {self._request_id}, got {response_id}"
                )

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

    # =========================================================================
    # DM-11.4: Parallel Connection Support
    # =========================================================================

    async def connect_all(
        self,
        server_names: Optional[List[str]] = None,
        timeout: float = 30.0,
    ) -> Dict[str, ConnectionResult]:
        """
        Connect to multiple MCP servers in parallel.

        Uses asyncio.gather to connect to all servers concurrently,
        significantly reducing startup time compared to sequential connections.

        Args:
            server_names: List of server names to connect. If None, connects
                         all enabled servers from the configuration.
            timeout: Per-server connection timeout in seconds. Default 30s.

        Returns:
            Dictionary mapping server names to their ConnectionResult.

        Example:
            >>> client = MCPClient(config)
            >>> results = await client.connect_all()
            >>> for name, result in results.items():
            ...     if result.success:
            ...         print(f"{name}: {result.tools_count} tools")
            ...     else:
            ...         print(f"{name}: FAILED - {result.error}")
        """
        # Determine which servers to connect
        if server_names is None:
            server_names = [
                name for name, config in self.config.servers.items()
                if config.enabled
            ]

        if not server_names:
            logger.info("No servers to connect (all disabled or empty list)")
            return {}

        logger.info(f"Starting parallel MCP connections for {len(server_names)} servers...")
        overall_start = time.time()

        # Semaphore for backpressure - prevents file descriptor exhaustion
        # CR-06: Limit concurrent connections
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_MCP_CONNECTIONS)

        # Create connection task with timeout and semaphore wrapper
        async def connect_with_timeout(name: str) -> ConnectionResult:
            """Connect to a single server with timeout, backpressure, and error handling."""
            # Acquire semaphore to limit concurrent connections (CR-06)
            async with semaphore:
                start_time = time.time()
                try:
                    success = await asyncio.wait_for(
                        self.connect(name),
                        timeout=timeout
                    )
                    elapsed_ms = (time.time() - start_time) * 1000
                    tools_count = len(self._tools_cache.get(name, []))

                    if success:
                        logger.info(
                            f"MCP server '{name}' connected: {tools_count} tools "
                            f"({elapsed_ms:.1f}ms)"
                        )
                    else:
                        logger.warning(
                            f"MCP server '{name}' connection returned False "
                            f"({elapsed_ms:.1f}ms)"
                        )

                    return ConnectionResult(
                        server_name=name,
                        success=success,
                        tools_count=tools_count if success else 0,
                        connect_time_ms=elapsed_ms,
                    )
                except asyncio.TimeoutError:
                    elapsed_ms = (time.time() - start_time) * 1000
                    error_msg = f"Connection timed out after {timeout}s"
                    logger.error(f"MCP server '{name}': {error_msg}")
                    return ConnectionResult(
                        server_name=name,
                        success=False,
                        error=error_msg,
                        retry_scheduled=True,
                        connect_time_ms=elapsed_ms,
                    )
                except Exception as e:
                    elapsed_ms = (time.time() - start_time) * 1000
                    error_msg = str(e)
                    logger.error(f"MCP server '{name}' failed: {error_msg}")
                    return ConnectionResult(
                        server_name=name,
                        success=False,
                        error=error_msg,
                        retry_scheduled=True,
                        connect_time_ms=elapsed_ms,
                    )

        # Execute all connections in parallel
        tasks = [connect_with_timeout(name) for name in server_names]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        connection_status: Dict[str, ConnectionResult] = {}
        for name, result in zip(server_names, results):
            if isinstance(result, Exception):
                # Should not happen due to try/except in connect_with_timeout,
                # but handle defensively
                logger.error(f"Unexpected exception for MCP server '{name}': {result}")
                connection_status[name] = ConnectionResult(
                    server_name=name,
                    success=False,
                    error=str(result),
                    retry_scheduled=True,
                )
            else:
                connection_status[name] = result

        # Log summary
        successful = sum(1 for r in connection_status.values() if r.success)
        total = len(connection_status)
        overall_elapsed = (time.time() - overall_start) * 1000
        logger.info(
            f"Parallel MCP connection complete: {successful}/{total} servers "
            f"connected ({overall_elapsed:.1f}ms total)"
        )

        return connection_status

    def get_connection_health(self) -> Dict[str, bool]:
        """
        Get health status of all configured servers.

        Returns:
            Dictionary mapping server names to connection status (True = connected).

        Example:
            >>> health = client.get_connection_health()
            >>> # {'github': True, 'semgrep': True, 'filesystem': False}
        """
        return {
            name: name in self._connections
            for name in self.config.servers.keys()
        }

    def get_healthy_server_count(self) -> tuple[int, int]:
        """
        Get count of healthy vs total servers.

        Returns:
            Tuple of (connected_count, total_count).

        Example:
            >>> connected, total = client.get_healthy_server_count()
            >>> print(f"{connected}/{total} MCP servers connected")
        """
        total = len(self.config.servers)
        connected = len(self._connections)
        return (connected, total)

    async def retry_failed_connections(
        self,
        failed_servers: List[str],
        max_retries: int = 3,
        backoff_base: float = 2.0,
        timeout: float = 30.0,
    ) -> Dict[str, ConnectionResult]:
        """
        Retry connecting to failed servers with exponential backoff.

        Attempts to reconnect to servers that failed during initial connection.
        Uses exponential backoff between retries to avoid overwhelming resources.

        Args:
            failed_servers: List of server names that failed initial connection.
            max_retries: Maximum retry attempts per server. Default 3.
            backoff_base: Base for exponential backoff calculation. Default 2.0.
                         Delay = backoff_base ^ attempt (e.g., 1s, 2s, 4s).
            timeout: Per-connection timeout in seconds. Default 30s.

        Returns:
            Dictionary mapping server names to final ConnectionResult.

        Example:
            >>> # After connect_all(), retry failed ones
            >>> failed = [name for name, r in results.items() if not r.success]
            >>> retry_results = await client.retry_failed_connections(failed)
        """
        if not failed_servers:
            return {}

        logger.info(f"Starting retry for {len(failed_servers)} failed MCP servers")
        results: Dict[str, ConnectionResult] = {}

        for name in failed_servers:
            final_result: Optional[ConnectionResult] = None

            for attempt in range(max_retries):
                delay = backoff_base ** attempt
                logger.info(
                    f"Retrying MCP server '{name}' connection "
                    f"(attempt {attempt + 1}/{max_retries}) in {delay:.1f}s"
                )
                await asyncio.sleep(delay)

                start_time = time.time()
                try:
                    success = await asyncio.wait_for(
                        self.connect(name),
                        timeout=timeout
                    )
                    elapsed_ms = (time.time() - start_time) * 1000

                    if success:
                        tools_count = len(self._tools_cache.get(name, []))
                        logger.info(
                            f"Retry succeeded for MCP server '{name}': "
                            f"{tools_count} tools ({elapsed_ms:.1f}ms)"
                        )
                        final_result = ConnectionResult(
                            server_name=name,
                            success=True,
                            tools_count=tools_count,
                            connect_time_ms=elapsed_ms,
                        )
                        break
                    else:
                        logger.warning(
                            f"Retry {attempt + 1} for MCP server '{name}' "
                            f"returned False"
                        )
                except asyncio.TimeoutError:
                    logger.warning(
                        f"Retry {attempt + 1} for MCP server '{name}' timed out"
                    )
                except Exception as e:
                    logger.warning(
                        f"Retry {attempt + 1} for MCP server '{name}' failed: {e}"
                    )

            # If no successful result, create final failure result
            if final_result is None:
                final_result = ConnectionResult(
                    server_name=name,
                    success=False,
                    error="Max retries exceeded",
                    retry_scheduled=False,  # No more retries scheduled
                )
                logger.error(
                    f"MCP server '{name}' remains disconnected after "
                    f"{max_retries} retries"
                )

            results[name] = final_result

        # Log summary
        successful = sum(1 for r in results.values() if r.success)
        logger.info(
            f"Retry complete: {successful}/{len(results)} servers recovered"
        )

        return results

    async def __aenter__(self) -> "MCPClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit - disconnect all servers."""
        await self.disconnect_all()
