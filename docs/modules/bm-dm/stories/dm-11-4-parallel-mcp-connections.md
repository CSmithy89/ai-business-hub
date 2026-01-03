# Story DM-11.4: Parallel MCP Server Connections

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 3
**Priority:** Medium

---

## Problem Statement

MCP servers connect sequentially on startup, slowing agent initialization. When the platform needs to connect to multiple MCP servers (e.g., GitHub, Semgrep, Playwright), each connection waits for the previous one to complete. This sequential approach adds unnecessary latency to agent startup time, particularly when servers are independent and could connect simultaneously.

## Root Cause

From code review of `agents/mcp/client.py`:
- The `MCPClient` class connects to servers one at a time via individual `await connect()` calls
- No parallel connection mechanism exists
- Each connection includes subprocess startup, initialization wait, and tool discovery
- Total startup time = sum of all individual connection times (~500ms per server)

## Gap Addressed

**REC-11:** Parallel MCP connections for faster startup

## Current State (from DM-06)

```python
# Sequential - slow (~1500ms for 3 servers)
for server in mcp_servers:
    await client.connect(server)  # Each waits for previous
```

The current implementation in `MCPClient.connect()` handles one server at a time. When multiple servers need to be connected, the caller must either:
1. Loop through servers sequentially
2. Or manually manage parallel connections

## Implementation Plan

### 1. Add Parallel Connection Method to MCPClient

Extend `agents/mcp/client.py`:
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ConnectionResult:
    """Result of a single MCP server connection attempt."""
    server_name: str
    success: bool
    tools_count: int = 0
    error: Optional[str] = None
    retry_scheduled: bool = False


async def connect_all(
    self,
    server_names: Optional[List[str]] = None,
    timeout: float = 10.0,
) -> Dict[str, ConnectionResult]:
    """
    Connect to multiple MCP servers in parallel.

    Args:
        server_names: List of server names to connect. If None, connects all enabled servers.
        timeout: Timeout per server connection in seconds.

    Returns:
        Dictionary mapping server names to their connection results.
    """
    # Determine which servers to connect
    if server_names is None:
        server_names = [
            name for name, config in self.config.servers.items()
            if config.enabled
        ]

    # Create connection tasks with timeout wrapper
    async def connect_with_timeout(name: str) -> ConnectionResult:
        try:
            success = await asyncio.wait_for(
                self.connect(name),
                timeout=timeout
            )
            tools_count = len(self._tools_cache.get(name, []))
            return ConnectionResult(
                server_name=name,
                success=success,
                tools_count=tools_count
            )
        except asyncio.TimeoutError:
            logger.error(f"Connection to MCP server '{name}' timed out after {timeout}s")
            return ConnectionResult(
                server_name=name,
                success=False,
                error=f"Connection timed out after {timeout}s",
                retry_scheduled=True
            )
        except Exception as e:
            logger.error(f"Failed to connect to MCP server '{name}': {e}")
            return ConnectionResult(
                server_name=name,
                success=False,
                error=str(e),
                retry_scheduled=True
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
            connection_status[name] = ConnectionResult(
                server_name=name,
                success=False,
                error=str(result),
                retry_scheduled=True
            )
        else:
            connection_status[name] = result

    # Log summary
    successful = sum(1 for r in connection_status.values() if r.success)
    total = len(connection_status)
    logger.info(
        f"Parallel MCP connection complete: {successful}/{total} servers connected"
    )

    return connection_status
```

### 2. Add Health Status Reporting

Add method to report partial connectivity:
```python
def get_connection_health(self) -> Dict[str, bool]:
    """
    Get health status of all configured servers.

    Returns:
        Dictionary mapping server names to connection status (True = connected).
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
    """
    total = len(self.config.servers)
    connected = len(self._connections)
    return (connected, total)
```

### 3. Add Background Retry for Failed Connections

Add retry mechanism for failed connections:
```python
async def retry_failed_connections(
    self,
    failed_servers: List[str],
    max_retries: int = 3,
    backoff_base: float = 2.0,
) -> Dict[str, ConnectionResult]:
    """
    Retry connecting to failed servers with exponential backoff.

    Args:
        failed_servers: List of server names that failed initial connection.
        max_retries: Maximum retry attempts per server.
        backoff_base: Base for exponential backoff calculation.

    Returns:
        Dictionary mapping server names to final connection results.
    """
    results: Dict[str, ConnectionResult] = {}

    for name in failed_servers:
        for attempt in range(max_retries):
            delay = backoff_base ** attempt
            logger.info(
                f"Retrying MCP server '{name}' connection "
                f"(attempt {attempt + 1}/{max_retries}) in {delay:.1f}s"
            )
            await asyncio.sleep(delay)

            try:
                success = await asyncio.wait_for(
                    self.connect(name),
                    timeout=10.0
                )
                if success:
                    results[name] = ConnectionResult(
                        server_name=name,
                        success=True,
                        tools_count=len(self._tools_cache.get(name, []))
                    )
                    break
            except Exception as e:
                logger.warning(
                    f"Retry {attempt + 1} for MCP server '{name}' failed: {e}"
                )

        if name not in results:
            results[name] = ConnectionResult(
                server_name=name,
                success=False,
                error="Max retries exceeded",
                retry_scheduled=False
            )

    return results
```

### 4. Update Startup Integration

Update `agents/main.py` to use parallel connections:
```python
async def initialize_mcp_connections(client: MCPClient) -> None:
    """Initialize all MCP server connections in parallel."""
    logger.info("Starting parallel MCP server connections...")
    start_time = time.time()

    # Connect all enabled servers in parallel
    results = await client.connect_all()

    # Log timing
    elapsed = time.time() - start_time
    logger.info(f"MCP connection phase completed in {elapsed:.2f}s")

    # Identify failed connections
    failed = [name for name, result in results.items() if not result.success]

    if failed:
        logger.warning(f"Failed to connect to MCP servers: {failed}")

        # Schedule background retries (non-blocking)
        asyncio.create_task(
            retry_failed_and_log(client, failed)
        )


async def retry_failed_and_log(client: MCPClient, failed: List[str]) -> None:
    """Background task to retry failed connections."""
    results = await client.retry_failed_connections(failed)

    for name, result in results.items():
        if result.success:
            logger.info(f"Background retry succeeded for MCP server '{name}'")
        else:
            logger.error(
                f"MCP server '{name}' remains disconnected after retries"
            )
```

## Files to Create

| File | Description |
|------|-------------|
| `agents/mcp/__tests__/test_parallel_connections.py` | Unit tests for parallel connection logic |

## Files to Modify

| File | Changes |
|------|---------|
| `agents/mcp/client.py` | Add `connect_all()`, `get_connection_health()`, `retry_failed_connections()` methods |
| `agents/main.py` | Update startup to use parallel MCP connections |

## API Design

### ConnectionResult Dataclass

```python
@dataclass
class ConnectionResult:
    """Result of a single MCP server connection attempt."""
    server_name: str
    success: bool
    tools_count: int = 0
    error: Optional[str] = None
    retry_scheduled: bool = False
```

### connect_all() Method

```python
async def connect_all(
    self,
    server_names: Optional[List[str]] = None,
    timeout: float = 10.0,
) -> Dict[str, ConnectionResult]:
    """
    Connect to multiple MCP servers in parallel.

    Args:
        server_names: List of server names to connect. If None, connects all enabled.
        timeout: Per-server connection timeout in seconds.

    Returns:
        Dictionary mapping server name to ConnectionResult.
    """
```

### Health Endpoint Integration

The connection health status should be exposed via the existing health endpoint:

```python
# In health check response
{
    "status": "healthy",
    "mcp": {
        "connected": 3,
        "total": 4,
        "servers": {
            "github": true,
            "semgrep": true,
            "playwright": true,
            "filesystem": false
        }
    }
}
```

## Performance Impact

| Metric | Before (Sequential) | After (Parallel) | Improvement |
|--------|--------------------:|:-----------------|:------------|
| 3 servers @ 500ms each | ~1500ms | ~500ms | 3x faster |
| 5 servers @ 500ms each | ~2500ms | ~500ms | 5x faster |
| 10 servers @ 500ms each | ~5000ms | ~500ms | 10x faster |

The improvement scales linearly with server count since all connections happen concurrently.

## Acceptance Criteria

- [x] AC1: MCP connections happen in parallel - All enabled servers connect concurrently via `asyncio.gather()`
- [x] AC2: Startup time reduced by ~Nx (N = server count) - Measured improvement matches expected parallelization
- [x] AC3: Individual failures don't block others - One server timing out doesn't prevent other servers from connecting
- [x] AC4: Failed connections logged with retry - Failed connections are logged with error details and scheduled for background retry
- [x] AC5: Health check reflects partial connectivity - Health endpoint shows which servers are connected vs disconnected

## Technical Notes

### Thread Safety

The `MCPClient` class uses internal dictionaries (`_connections`, `_tools_cache`) that are modified during connection. Since all operations are async and run on a single event loop, no additional locking is needed for the dictionaries themselves.

### Timeout Handling

Each connection has its own timeout wrapper:
```python
await asyncio.wait_for(self.connect(name), timeout=timeout)
```

This ensures that a slow or hung server connection doesn't delay the overall startup beyond the timeout threshold.

### Graceful Degradation

The platform should function with partial MCP connectivity:
- Core functionality works without any MCP servers
- Features requiring specific MCP tools show appropriate "not available" state
- Dashboard health indicators show partial connectivity status

### Memory Considerations

Parallel connections spawn multiple subprocesses simultaneously. For configurations with many MCP servers, this could temporarily increase memory usage. The implementation limits concurrency implicitly through `asyncio.gather()`.

## Test Requirements

### Unit Tests

1. **Parallel Connection Tests** (`test_parallel_connections.py`)
   - All servers connect in parallel (mock timing verification)
   - Individual server timeout doesn't affect others
   - Failed server doesn't block successful ones
   - Empty server list returns empty results
   - All servers disabled returns empty results

2. **Health Status Tests**
   - `get_connection_health()` returns accurate status
   - `get_healthy_server_count()` returns correct tuple
   - Status updates after connection/disconnection

3. **Retry Logic Tests**
   - Exponential backoff timing is correct
   - Max retries limit is respected
   - Successful retry updates connection state
   - Failed retries report final error

### Integration Tests

1. **Startup Performance**
   - Measure actual startup time with parallel vs sequential
   - Verify timing improvement matches expected ratio

2. **Partial Connectivity**
   - Start with one server misconfigured
   - Verify other servers connect successfully
   - Verify health check reflects partial state

## Dependencies

- **DM-06** (MCP Integration) - Provides the base `MCPClient` and `MCPConnection` classes
- **DM-08** (Quality Hardening) - Caching and rate limiting patterns
- **DM-09** (Observability) - OpenTelemetry tracing for connection metrics

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md) - Full technical specification
- [DM-06 MCP Integration](./dm-06-4-mcp-tool-integration.md) - Original MCP implementation
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - REC-11
- [Python asyncio.gather documentation](https://docs.python.org/3/library/asyncio-task.html#asyncio.gather)

---

## Implementation Checklist

- [x] Add `ConnectionResult` dataclass to `client.py`
- [x] Implement `connect_all()` method with parallel execution
- [x] Implement `get_connection_health()` method
- [x] Implement `get_healthy_server_count()` method
- [x] Implement `retry_failed_connections()` method
- [x] Update `agents/main.py` startup sequence
- [x] Add health endpoint integration for MCP status
- [x] Write unit tests for parallel connections
- [x] Write unit tests for health status methods
- [x] Write unit tests for retry logic
- [x] Write integration test for startup performance
- [x] Update documentation with new API

---

## Code Review Notes

**Reviewed:** 2026-01-01
**Reviewer:** Senior Developer (AI-Assisted)
**Verdict:** APPROVED

### Summary

The implementation is production-ready with excellent code quality, comprehensive test coverage, and full acceptance criteria compliance.

### Code Quality Assessment

| Category | Rating |
|----------|--------|
| Async Patterns | Excellent |
| Error Handling | Excellent |
| Logging | Excellent |
| Test Coverage | Excellent |
| Performance | Excellent |

### Key Strengths

1. **Proper async patterns**: Uses `asyncio.gather(*tasks, return_exceptions=True)` correctly to prevent task cancellation on individual failures.

2. **Comprehensive error handling**: Individual connection failures are captured in `ConnectionResult` with descriptive error messages and timing metrics.

3. **Excellent logging**: Appropriate log levels (INFO/WARNING/ERROR) with timing information for operational visibility.

4. **Thorough test coverage**: 7 test classes covering all critical paths including edge cases (empty servers, all disabled, timeouts, partial failures).

5. **Clean integration**: Startup integration includes background retry via `asyncio.create_task()` and graceful shutdown cleanup.

### Files Reviewed

| File | Status |
|------|--------|
| `agents/mcp/client.py` | PASS |
| `agents/mcp/__init__.py` | PASS |
| `agents/main.py` | PASS |
| `agents/mcp/__tests__/test_parallel_connections.py` | PASS |

### Minor Suggestions (Non-Blocking)

1. The `connect_time_ms` field is a nice enhancement over the spec - consider documenting it in the API section.

2. The `tuple[int, int]` return type (Python 3.9+) is fine for this codebase but `Tuple[int, int]` from typing would be more backwards compatible if needed.
