"""
A2A Client for Inter-Agent Communication

Implements the HYVVE A2A client wrapper for calling PM agents (Navi, Pulse, Herald)
from the Dashboard Gateway agent via the Google A2A protocol.

Features:
- Connection pooling via httpx for efficient HTTP communication
- HTTP/2 support when h2 package is installed (optional)
- JSON-RPC 2.0 format for A2A task execution
- Parallel agent calls with asyncio.gather
- Structured A2ATaskResult responses
- Timeout handling with configurable values from DMConstants

Reference: https://github.com/google/a2a-protocol
"""
import asyncio
import json
import logging
import secrets
import threading
import time
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

import httpx
from pydantic import BaseModel, Field

# Check if HTTP/2 support is available (requires h2 package)
try:
    import h2  # noqa: F401

    HTTP2_AVAILABLE = True
except ImportError:
    HTTP2_AVAILABLE = False

from config import get_settings
from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class A2ATaskResult(BaseModel):
    """
    Result from an A2A task execution.

    Represents the structured response from calling an agent via A2A protocol.

    Attributes:
        content: Text content from the agent's response
        tool_calls: List of tool calls made by the agent
        artifacts: Additional data artifacts returned
        success: Whether the task completed successfully
        error: Error message if success is False
        agent_id: The agent that produced this result
        duration_ms: Time taken for the A2A call in milliseconds
    """

    content: str = Field(default="", description="Text content from agent response")
    tool_calls: List[Dict[str, Any]] = Field(
        default_factory=list, description="Tool calls made by the agent"
    )
    artifacts: List[Dict[str, Any]] = Field(
        default_factory=list, description="Additional data artifacts"
    )
    success: bool = Field(default=True, description="Whether task completed successfully")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    agent_id: Optional[str] = Field(default=None, description="Agent that produced this result")
    duration_ms: Optional[float] = Field(
        default=None, description="A2A call duration in milliseconds"
    )


class HyvveA2AClient:
    """
    A2A client for HYVVE inter-agent communication.

    Provides async methods to call PM agents via A2A protocol,
    with connection pooling, retry logic, and structured responses.

    The client uses httpx for async HTTP with connection pooling,
    supporting HTTP/2 for efficient multiplexed requests.

    Usage:
        client = HyvveA2AClient()
        result = await client.call_agent("navi", "Get project status")

        # Or parallel calls
        results = await client.call_agents_parallel([
            {"agent_id": "navi", "task": "Get status"},
            {"agent_id": "pulse", "task": "Get health"},
        ])

    Note:
        Use get_a2a_client() for singleton access in agent tools.
    """

    # Agent endpoint paths - maps agent IDs to their A2A RPC paths
    # These correspond to the A2A adapters created in DM-02.5
    AGENT_PATHS: Dict[str, str] = {
        "navi": "/a2a/navi",
        "pulse": "/a2a/pulse",
        "herald": "/a2a/herald",
        "dashboard": "/a2a/dashboard",
    }

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[int] = None,
    ):
        """
        Initialize A2A client.

        Args:
            base_url: AgentOS base URL. Defaults to localhost with configured port.
            timeout: Default timeout for requests in seconds.
                     Defaults to DMConstants.A2A.TASK_TIMEOUT_SECONDS.
        """
        settings = get_settings()
        self.base_url = base_url or f"http://localhost:{settings.agentos_port}"
        self.timeout = timeout or DMConstants.A2A.TASK_TIMEOUT_SECONDS
        self._client: Optional[httpx.AsyncClient] = None
        self._client_lock = asyncio.Lock()

    async def _get_client(self) -> httpx.AsyncClient:
        """
        Get or create HTTP client with connection pooling.

        Uses a lock to ensure thread-safe lazy initialization of the
        shared httpx client. The client is configured with:
        - Connection pooling sized for concurrent dashboard calls
        - Keepalive connections for reduced latency
        - Configurable timeout from DMConstants

        Returns:
            Configured httpx.AsyncClient instance
        """
        if self._client is None:
            async with self._client_lock:
                # Double-check after acquiring lock
                if self._client is None:
                    self._client = httpx.AsyncClient(
                        base_url=self.base_url,
                        timeout=httpx.Timeout(
                            connect=DMConstants.A2A.HTTP_CONNECT_TIMEOUT,
                            read=float(self.timeout),
                            write=DMConstants.A2A.HTTP_WRITE_TIMEOUT,
                            pool=DMConstants.A2A.HTTP_POOL_TIMEOUT,
                        ),
                        limits=httpx.Limits(
                            max_connections=DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS * 2,
                            max_keepalive_connections=DMConstants.DASHBOARD.CONCURRENT_AGENT_CALLS,
                        ),
                        http2=HTTP2_AVAILABLE,  # Enable HTTP/2 if h2 package available
                    )
                    if HTTP2_AVAILABLE:
                        logger.debug("A2A client initialized with HTTP/2 support")
                    else:
                        logger.debug(
                            "A2A client initialized with HTTP/1.1 (install h2 for HTTP/2)"
                        )
        return self._client

    def _generate_request_id(self, agent_id: str) -> str:
        """
        Generate unique request ID for JSON-RPC call.

        Args:
            agent_id: Target agent identifier

        Returns:
            Unique request ID string with timestamp and random nonce
        """
        timestamp = int(time.time() * 1000)
        nonce = secrets.token_hex(4)  # 8 char hex string for uniqueness
        return f"a2a-{agent_id}-{timestamp}-{nonce}"

    async def call_agent(
        self,
        agent_id: str,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        caller_id: str = "dashboard_gateway",
        timeout: Optional[int] = None,
    ) -> A2ATaskResult:
        """
        Call a PM agent via A2A RPC.

        Sends a JSON-RPC 2.0 request to the specified agent's A2A endpoint
        and returns a structured result.

        Args:
            agent_id: Target agent (navi, pulse, herald, dashboard)
            task: Task message to send to the agent
            context: Additional context for the task (project_id, filters, etc.)
            caller_id: Identifier of the calling agent for tracing
            timeout: Override default timeout for this call

        Returns:
            A2ATaskResult with content, tool_calls, artifacts, and status

        Example:
            result = await client.call_agent(
                agent_id="navi",
                task="Get status for project Alpha",
                context={"project_id": "alpha"},
            )
            if result.success:
                print(result.content)
        """
        start_time = time.monotonic()

        # Validate agent_id
        path = self.AGENT_PATHS.get(agent_id)
        if not path:
            logger.warning(f"Unknown agent requested: {agent_id}")
            return A2ATaskResult(
                content="",
                success=False,
                error=f"Unknown agent: {agent_id}. Available: {list(self.AGENT_PATHS.keys())}",
                agent_id=agent_id,
            )

        try:
            client = await self._get_client()

            # Build JSON-RPC 2.0 request
            request_id = self._generate_request_id(agent_id)
            rpc_request = {
                "jsonrpc": "2.0",
                "method": "run",
                "params": {
                    "task": task,
                    "context": {
                        **(context or {}),
                        "caller_id": caller_id,
                    },
                },
                "id": request_id,
            }

            logger.debug(f"A2A call to {agent_id}: {task[:100]}...")

            # Make the request with timeout
            effective_timeout = timeout or self.timeout
            response = await asyncio.wait_for(
                client.post(
                    f"{path}/rpc",
                    json=rpc_request,
                    headers={
                        "Content-Type": "application/json",
                        "X-A2A-Caller": caller_id,
                        "X-Request-ID": request_id,
                    },
                ),
                timeout=effective_timeout,
            )

            duration_ms = (time.monotonic() - start_time) * 1000

            # Handle HTTP errors
            if response.status_code != 200:
                max_len = DMConstants.A2A.ERROR_TEXT_MAX_LENGTH
                raw_text = response.text
                if len(raw_text) > max_len:
                    error_text = raw_text[:max_len] + "... (truncated)"
                else:
                    error_text = raw_text
                logger.error(
                    f"A2A call to {agent_id} failed with HTTP {response.status_code}: {error_text}"
                )
                return A2ATaskResult(
                    content="",
                    success=False,
                    error=f"HTTP {response.status_code}: {error_text}",
                    agent_id=agent_id,
                    duration_ms=duration_ms,
                )

            try:
                data = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"A2A call to {agent_id} returned invalid JSON: {e}")
                return A2ATaskResult(
                    content="",
                    success=False,
                    error=f"Invalid JSON response from {agent_id}: {str(e)}",
                    agent_id=agent_id,
                    duration_ms=duration_ms,
                )

            # Handle JSON-RPC error response
            if "error" in data and data["error"]:
                error_msg = data["error"].get("message", "Unknown JSON-RPC error")
                error_code = data["error"].get("code", -1)
                logger.warning(f"A2A JSON-RPC error from {agent_id}: [{error_code}] {error_msg}")
                return A2ATaskResult(
                    content="",
                    success=False,
                    error=f"[{error_code}] {error_msg}",
                    agent_id=agent_id,
                    duration_ms=duration_ms,
                )

            # Extract successful result
            result = data.get("result", {})

            logger.debug(f"A2A call to {agent_id} completed in {duration_ms:.1f}ms")

            return A2ATaskResult(
                content=result.get("content", ""),
                tool_calls=result.get("tool_calls", []),
                artifacts=result.get("artifacts", []),
                success=True,
                agent_id=agent_id,
                duration_ms=duration_ms,
            )

        except asyncio.TimeoutError:
            duration_ms = (time.monotonic() - start_time) * 1000
            logger.warning(f"A2A call to {agent_id} timed out after {duration_ms:.1f}ms")
            return A2ATaskResult(
                content="",
                success=False,
                error=f"Timeout calling {agent_id} after {effective_timeout}s",
                agent_id=agent_id,
                duration_ms=duration_ms,
            )

        except httpx.ConnectError as e:
            duration_ms = (time.monotonic() - start_time) * 1000
            logger.error(f"A2A connection to {agent_id} failed: {e}")
            return A2ATaskResult(
                content="",
                success=False,
                error=f"Connection failed to {agent_id}: {str(e)}",
                agent_id=agent_id,
                duration_ms=duration_ms,
            )

        except Exception as e:
            duration_ms = (time.monotonic() - start_time) * 1000
            logger.exception(f"A2A call to {agent_id} failed unexpectedly")
            return A2ATaskResult(
                content="",
                success=False,
                error=f"Unexpected error calling {agent_id}: {str(e)}",
                agent_id=agent_id,
                duration_ms=duration_ms,
            )

    async def call_agents_parallel(
        self,
        calls: List[Dict[str, Any]],
        caller_id: str = "dashboard_gateway",
    ) -> Dict[str, A2ATaskResult]:
        """
        Call multiple agents in parallel.

        Executes multiple A2A calls concurrently using asyncio.gather,
        which is more efficient than sequential calls when gathering
        data from multiple agents.

        Args:
            calls: List of call specifications, each containing:
                - agent_id (required): Target agent
                - task (required): Task message
                - context (optional): Additional context dict
                - timeout (optional): Per-call timeout override
            caller_id: Identifier of the calling agent for all calls

        Returns:
            Dict mapping agent_id to A2ATaskResult

        Example:
            results = await client.call_agents_parallel([
                {"agent_id": "navi", "task": "Get project overview"},
                {"agent_id": "pulse", "task": "Get health metrics"},
                {"agent_id": "herald", "task": "Get recent activity"},
            ])

            for agent_id, result in results.items():
                if result.success:
                    print(f"{agent_id}: {result.content}")
        """
        if not calls:
            return {}

        # Build parallel tasks
        tasks = []
        agent_ids = []

        for call in calls:
            agent_id = call.get("agent_id")
            if not agent_id:
                logger.warning("Skipping call with missing agent_id")
                continue

            agent_ids.append(agent_id)
            tasks.append(
                self.call_agent(
                    agent_id=agent_id,
                    task=call.get("task", ""),
                    context=call.get("context"),
                    caller_id=caller_id,
                    timeout=call.get("timeout"),
                )
            )

        if not tasks:
            return {}

        # Execute all calls in parallel
        # Using return_exceptions=True ensures all calls complete even if some fail
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Build result dictionary, converting any exceptions to error results
        output: Dict[str, A2ATaskResult] = {}
        for agent_id, result in zip(agent_ids, results):
            if isinstance(result, A2ATaskResult):
                output[agent_id] = result
            elif isinstance(result, Exception):
                logger.error(f"Parallel call to {agent_id} raised exception: {result}")
                output[agent_id] = A2ATaskResult(
                    content="",
                    success=False,
                    error=str(result),
                    agent_id=agent_id,
                )
            else:
                # Unexpected result type
                output[agent_id] = A2ATaskResult(
                    content="",
                    success=False,
                    error=f"Unexpected result type: {type(result)}",
                    agent_id=agent_id,
                )

        return output

    async def close(self) -> None:
        """
        Close the HTTP client and release connections.

        Should be called when the client is no longer needed to
        properly clean up connection pool resources.
        """
        if self._client:
            await self._client.aclose()
            self._client = None
            logger.debug("A2A client connection pool closed")

    @asynccontextmanager
    async def session(self):
        """
        Context manager for auto-cleanup of client resources.

        Usage:
            async with HyvveA2AClient().session() as client:
                result = await client.call_agent("navi", "Get status")
        """
        try:
            yield self
        finally:
            await self.close()


# Singleton instance for Dashboard Gateway
_a2a_client: Optional[HyvveA2AClient] = None
_client_lock = asyncio.Lock()
_sync_lock = threading.Lock()


async def get_a2a_client() -> HyvveA2AClient:
    """
    Get the singleton A2A client instance.

    Uses a lock to ensure thread-safe singleton initialization.
    The singleton pattern avoids creating multiple connection pools
    when multiple tools need to make A2A calls.

    Returns:
        Shared HyvveA2AClient instance

    Example:
        client = await get_a2a_client()
        result = await client.call_agent("navi", "Get project status")
    """
    global _a2a_client

    if _a2a_client is None:
        async with _client_lock:
            # Double-check after acquiring lock
            if _a2a_client is None:
                _a2a_client = HyvveA2AClient()
                logger.info("A2A client singleton initialized")

    return _a2a_client


def get_a2a_client_sync() -> HyvveA2AClient:
    """
    Get the singleton A2A client instance (synchronous version).

    For use in contexts where async is not available.
    Uses threading.Lock for thread-safe initialization.
    For async contexts, prefer get_a2a_client().

    Returns:
        Shared HyvveA2AClient instance
    """
    global _a2a_client

    if _a2a_client is None:
        with _sync_lock:
            # Double-check after acquiring lock
            if _a2a_client is None:
                _a2a_client = HyvveA2AClient()
                logger.info("A2A client singleton initialized (sync)")

    return _a2a_client


async def close_a2a_client() -> None:
    """
    Close and clean up the singleton A2A client.

    Should be called during application shutdown to properly
    release connection pool resources. Safe to call even if
    no client was ever created.

    Example:
        # In FastAPI shutdown event
        @app.on_event("shutdown")
        async def shutdown():
            await close_a2a_client()
    """
    global _a2a_client

    if _a2a_client is not None:
        await _a2a_client.close()
        _a2a_client = None
        logger.info("A2A client singleton closed")
