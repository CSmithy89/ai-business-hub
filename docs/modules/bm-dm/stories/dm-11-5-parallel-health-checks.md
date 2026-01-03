# Story DM-11.5: Parallel Health Checks

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 3
**Priority:** Medium

---

## Problem Statement

Agent mesh health checks run sequentially, slowing status updates. When the discovery service checks health for multiple external agents, each check waits for the previous one to complete. This sequential approach adds unnecessary latency to mesh status updates, particularly when agents are independent and could be checked simultaneously.

## Root Cause

From code review of `agents/mesh/discovery.py`:
- The `health_check_all()` method checks agents one at a time via a sequential loop
- No parallel execution mechanism exists for health checks
- Each check includes HTTP request, response validation, and registry update
- Total health check time = sum of all individual check times

## Gap Addressed

**REC-12:** Parallel health checks in mesh (use asyncio.gather)

## Current State (from DM-06)

```python
# Sequential - slow
async def health_check_all(self) -> Dict[str, AgentHealth]:
    registry = get_registry()
    external_agents = registry.list_external()

    results: Dict[str, AgentHealth] = {}
    for agent in external_agents:
        health = await self.check_agent_health(agent.name)  # One at a time
        results[agent.name] = health

    return results
```

The current implementation in `DiscoveryService.health_check_all()` iterates through agents sequentially. When multiple agents need health checks, the caller must wait for each check to complete before starting the next one.

## Implementation Plan

### 1. Refactor health_check_all() for Parallel Execution

Update `agents/mesh/discovery.py`:
```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class HealthCheckResult:
    """Result of a single agent health check."""
    agent_name: str
    health: AgentHealth
    response_time_ms: float = 0.0
    error: Optional[str] = None


async def health_check_all(
    self,
    timeout: float = 5.0,
) -> Dict[str, HealthCheckResult]:
    """
    Check health of all external agents in parallel.

    Args:
        timeout: Timeout per health check in seconds.

    Returns:
        Dict mapping agent names to their health check results.
    """
    registry = get_registry()
    external_agents = registry.list_external()

    if not external_agents:
        return {}

    async def check_with_timeout(agent: MeshAgentCard) -> HealthCheckResult:
        start_time = time.time()
        try:
            health = await asyncio.wait_for(
                self.check_agent_health(agent.name),
                timeout=timeout
            )
            elapsed_ms = (time.time() - start_time) * 1000
            return HealthCheckResult(
                agent_name=agent.name,
                health=health,
                response_time_ms=elapsed_ms
            )
        except asyncio.TimeoutError:
            logger.warning(
                f"Health check for '{agent.name}' timed out after {timeout}s"
            )
            registry.update_health(agent.name, False)
            return HealthCheckResult(
                agent_name=agent.name,
                health=AgentHealth.UNHEALTHY,
                error=f"Timeout after {timeout}s"
            )
        except Exception as e:
            logger.warning(f"Health check for '{agent.name}' failed: {e}")
            registry.update_health(agent.name, False)
            return HealthCheckResult(
                agent_name=agent.name,
                health=AgentHealth.UNHEALTHY,
                error=str(e)
            )

    # Execute all health checks in parallel
    tasks = [check_with_timeout(agent) for agent in external_agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Process results
    health_status: Dict[str, HealthCheckResult] = {}
    for result in results:
        if isinstance(result, Exception):
            # Should not happen due to try/except in check_with_timeout,
            # but handle defensively
            logger.error(f"Unexpected exception in health check: {result}")
            continue
        health_status[result.agent_name] = result

    # Log summary
    healthy = sum(1 for r in health_status.values() if r.health == AgentHealth.HEALTHY)
    total = len(health_status)
    avg_time = sum(r.response_time_ms for r in health_status.values()) / total if total > 0 else 0
    logger.info(
        f"Parallel health check complete: {healthy}/{total} healthy, "
        f"avg response: {avg_time:.1f}ms"
    )

    return health_status
```

### 2. Add Configurable Per-Agent Timeout

Add timeout configuration to `DiscoveryService`:
```python
class DiscoveryService:
    def __init__(
        self,
        discovery_urls: Optional[List[str]] = None,
        scan_interval: int = 300,
        timeout: float = DEFAULT_TIMEOUT,
        health_check_timeout: float = 5.0,  # New: per-agent timeout
        auto_register: bool = True,
    ):
        self.discovery_urls = discovery_urls or []
        self.scan_interval = scan_interval
        self.timeout = timeout
        self.health_check_timeout = health_check_timeout  # Store it
        self.auto_register = auto_register
        # ... rest of init
```

### 3. Update MeshRouter to Use Parallel Health Checks

Add method to `agents/mesh/router.py` for refreshing mesh health:
```python
async def refresh_mesh_health(
    self,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """
    Refresh health status of all agents in parallel.

    Args:
        timeout: Timeout per agent health check.

    Returns:
        Dict with health check summary and individual results.
    """
    from .discovery import get_discovery_service

    discovery = get_discovery_service()
    results = await discovery.health_check_all(timeout=timeout)

    healthy = sum(1 for r in results.values() if r.health == AgentHealth.HEALTHY)
    total = len(results)

    return {
        "healthy_count": healthy,
        "total_count": total,
        "healthy_ratio": healthy / total if total > 0 else 1.0,
        "agents": {
            name: {
                "health": result.health.value,
                "response_time_ms": result.response_time_ms,
                "error": result.error,
            }
            for name, result in results.items()
        },
    }
```

### 4. Graceful Handling of Partial Failures

The implementation already handles partial failures via:
- Individual `asyncio.TimeoutError` handling per agent
- Exception catching that doesn't affect other agents
- Registry updates even for failed checks
- Summary logging of overall health status

## Files to Create

| File | Description |
|------|-------------|
| `agents/mesh/__tests__/test_parallel_health.py` | Unit tests for parallel health check logic |

## Files to Modify

| File | Changes |
|------|---------|
| `agents/mesh/discovery.py` | Add `HealthCheckResult` dataclass, refactor `health_check_all()` for parallel execution, add `health_check_timeout` parameter |
| `agents/mesh/router.py` | Add `refresh_mesh_health()` method |
| `agents/mesh/__init__.py` | Export `HealthCheckResult` |

## API Design

### HealthCheckResult Dataclass

```python
@dataclass
class HealthCheckResult:
    """Result of a single agent health check."""
    agent_name: str
    health: AgentHealth
    response_time_ms: float = 0.0
    error: Optional[str] = None
```

### health_check_all() Method

```python
async def health_check_all(
    self,
    timeout: float = 5.0,
) -> Dict[str, HealthCheckResult]:
    """
    Check health of all external agents in parallel.

    Args:
        timeout: Per-agent health check timeout in seconds.

    Returns:
        Dictionary mapping agent name to HealthCheckResult.
    """
```

### refresh_mesh_health() Method

```python
async def refresh_mesh_health(
    self,
    timeout: float = 5.0,
) -> Dict[str, Any]:
    """
    Refresh health status of all agents in parallel.

    Returns:
        Dict with summary and per-agent health results.
    """
```

## Performance Impact

| Metric | Before (Sequential) | After (Parallel) | Improvement |
|--------|--------------------:|:-----------------|:------------|
| 3 agents @ 200ms each | ~600ms | ~200ms | 3x faster |
| 5 agents @ 200ms each | ~1000ms | ~200ms | 5x faster |
| 10 agents @ 200ms each | ~2000ms | ~200ms | 10x faster |

The improvement scales linearly with agent count since all health checks happen concurrently.

## Acceptance Criteria

- [x] AC1: Health checks run in parallel - All agents checked concurrently via `asyncio.gather()`
- [x] AC2: Individual timeouts don't block others - One agent timing out doesn't prevent other agents from being checked
- [x] AC3: Mesh status update time reduced - Measured improvement matches expected parallelization
- [x] AC4: Graceful handling of partial failures - Failed checks logged with error details, other agents still checked
- [x] AC5: Timeout per agent configurable - `health_check_timeout` parameter added to DiscoveryService and `timeout` param to `health_check_all()`

## Technical Notes

### Thread Safety

The `DiscoveryService` uses internal state that is accessed during health checks. Since all operations are async and run on a single event loop, no additional locking is needed. The registry updates via `update_health()` already use thread-safe locking.

### Timeout Handling

Each health check has its own timeout wrapper:
```python
await asyncio.wait_for(self.check_agent_health(name), timeout=timeout)
```

This ensures that a slow or hung agent doesn't delay the overall health check beyond the timeout threshold.

### Graceful Degradation

The platform functions correctly with partial agent availability:
- Failed health checks are logged with descriptive errors
- Registry is updated to reflect unhealthy status
- Other agents continue to receive health checks
- Summary statistics show healthy/total ratio

### Memory Considerations

Parallel health checks spawn multiple concurrent HTTP requests. For configurations with many external agents, this could temporarily increase memory usage. The implementation limits concurrency implicitly through `asyncio.gather()`.

### Response Time Tracking

The `HealthCheckResult` includes `response_time_ms` to enable:
- Latency monitoring and alerting
- Slow agent detection
- Performance trend analysis

## Test Requirements

### Unit Tests

1. **Parallel Execution Tests** (`test_parallel_health.py`)
   - All agents checked in parallel (mock timing verification)
   - Individual agent timeout doesn't affect others
   - Failed agent doesn't block successful ones
   - Empty agent list returns empty results
   - All agents unhealthy returns correct status

2. **Timeout Tests**
   - Custom timeout is respected
   - Timeout error is captured in HealthCheckResult
   - Registry updated on timeout

3. **Response Time Tests**
   - Response time is captured accurately
   - Response time logged in summary

4. **Integration Tests**
   - `refresh_mesh_health()` returns correct summary
   - Health status reflected in routing decisions

### Integration Tests

1. **End-to-End Health Check**
   - Start discovery service with multiple agents
   - Trigger parallel health check
   - Verify timing is near single-agent time (not sum)

2. **Partial Failure Scenario**
   - Configure one agent to be unreachable
   - Verify other agents still checked successfully
   - Verify failed agent marked unhealthy

## Dependencies

- **DM-06** (Contextual Intelligence) - Provides the base mesh infrastructure
- **DM-08** (Quality Hardening) - Error handling patterns
- **DM-11.4** (Parallel MCP Connections) - Similar pattern for reference

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md) - Full technical specification
- [DM-06.5 Universal Agent Mesh](./dm-06-5-universal-agent-mesh.md) - Original mesh implementation
- [DM-11.4 Parallel MCP Connections](./dm-11-4-parallel-mcp-connections.md) - Similar parallel pattern
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - REC-12
- [Python asyncio.gather documentation](https://docs.python.org/3/library/asyncio-task.html#asyncio.gather)

---

## Implementation Checklist

- [x] Add `HealthCheckResult` dataclass to `discovery.py`
- [x] Refactor `health_check_all()` for parallel execution
- [x] Add `health_check_timeout` parameter to `DiscoveryService.__init__()`
- [x] Add `refresh_mesh_health()` method to `MeshRouter`
- [x] Export `HealthCheckResult` from `mesh/__init__.py`
- [x] Write unit tests for parallel health checks
- [x] Write unit tests for timeout handling
- [x] Write unit tests for response time tracking
- [x] Write integration test for end-to-end flow
- [x] Update documentation with new API

---

## Code Review Notes

**Reviewer:** Senior Developer
**Review Date:** 2026-01-01
**Status:** APPROVED

### Summary

The implementation of parallel health checks is well-designed, follows Python async best practices, and meets all acceptance criteria. Code is clean, well-documented, properly tested, and provides significant performance improvements.

### Files Reviewed

| File | Lines | Assessment |
|------|-------|------------|
| `agents/mesh/discovery.py` | 662 | Excellent |
| `agents/mesh/router.py` | 540 | Excellent |
| `agents/mesh/__init__.py` | 104 | Excellent |
| `agents/mesh/__tests__/test_parallel_health.py` | 582 | Excellent |

### Code Quality Highlights

1. **Async Patterns (Excellent)**
   - Proper use of `asyncio.gather()` for concurrent execution
   - Individual timeout wrapping with `asyncio.wait_for()` prevents blocking
   - Defensive handling of `return_exceptions=True` in gather

2. **Error Handling (Excellent)**
   - Three-tier handling: timeout, general exception, unexpected exception
   - Registry updated to reflect unhealthy status on any failure
   - Error messages captured in `HealthCheckResult.error` for debugging

3. **Logging (Excellent)**
   - Debug-level for individual agent results
   - Info-level summary with healthy/total, avg response time, total elapsed
   - Warning for timeouts and failures

4. **API Design (Excellent)**
   - Clean `HealthCheckResult` dataclass with appropriate defaults
   - Clear parameters with sensible defaults
   - Comprehensive docstrings with examples

### Test Coverage

- **23 tests** covering all critical paths
- Tests verify actual parallel execution timing (not just mocking)
- Edge cases: empty agents, all unhealthy, partial failures
- Performance tests verify O(max) time complexity vs O(sum)

### Performance Verification

| Scenario | Before (Sequential) | After (Parallel) | Improvement |
|----------|--------------------:|:-----------------|:------------|
| 5 agents @ 100ms | ~500ms | ~100-150ms | 3-5x faster |
| 10 agents @ 200ms | ~2000ms | ~200-250ms | 8-10x faster |

### Recommendation

**APPROVED** - Production-ready implementation with comprehensive test coverage.

---

*Story Created: 2026-01-01*
*Story Completed: 2026-01-01*
*Epic: DM-11 | Story: 5 of 10 | Points: 3*
