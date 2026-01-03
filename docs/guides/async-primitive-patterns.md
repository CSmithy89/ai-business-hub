# Async Primitive Patterns Guide

When to use asyncio.Event vs asyncio.Future in HYVVE agent code.

## Quick Reference

| Primitive | Use When | Example |
|-----------|----------|---------|
| `Event` | Multiple waiters, repeatable signal | Shutdown signal |
| `Future` | Single result, one-time resolution | HITL approval response |
| `Queue` | Producer/consumer pattern | Task distribution |
| `Semaphore` | Limit concurrency | Rate limiting |

## asyncio.Event

Use for **broadcast signals** where multiple coroutines wait for the same condition.

### When to Use

- Shutdown/cancellation signals
- "Ready" notifications
- State change broadcasts
- One-to-many communication

### Example: Graceful Shutdown

```python
import asyncio

class AgentService:
    def __init__(self):
        self.shutdown_event = asyncio.Event()

    async def run(self):
        """Main service loop."""
        while not self.shutdown_event.is_set():
            await self.process_next_task()
            # Check shutdown between tasks
            try:
                await asyncio.wait_for(
                    self.shutdown_event.wait(),
                    timeout=0.1,
                )
            except asyncio.TimeoutError:
                continue  # Keep processing

    async def shutdown(self):
        """Signal all waiters to stop."""
        self.shutdown_event.set()
```

### Example: Health Check Ready

```python
class HealthChecker:
    def __init__(self):
        self.ready_event = asyncio.Event()

    async def wait_ready(self, timeout: float = 30.0):
        """Wait for health check to complete."""
        await asyncio.wait_for(self.ready_event.wait(), timeout)

    async def check_all(self):
        """Check all dependencies."""
        await self.check_database()
        await self.check_redis()
        self.ready_event.set()  # Signal ready to all waiters
```

## asyncio.Future

Use for **single-value resolution** where one result resolves one waiter.

### When to Use

- HITL approval responses
- RPC-style request/response
- One-time callbacks
- Promise-like patterns

### Example: HITL Approval

```python
import asyncio
from typing import Dict, Any

class ApprovalBridge:
    def __init__(self):
        self._pending: Dict[str, asyncio.Future] = {}

    async def request_approval(
        self,
        approval_id: str,
        timeout: float = 300.0,
    ) -> Dict[str, Any]:
        """Request approval and wait for response."""
        future: asyncio.Future = asyncio.get_event_loop().create_future()
        self._pending[approval_id] = future

        try:
            return await asyncio.wait_for(future, timeout)
        except asyncio.TimeoutError:
            del self._pending[approval_id]
            return {"status": "timeout", "approved": False}

    def resolve_approval(self, approval_id: str, result: Dict[str, Any]):
        """Resolve a pending approval."""
        future = self._pending.pop(approval_id, None)
        if future and not future.done():
            future.set_result(result)
```

### Example: A2A Response

```python
class A2AClient:
    def __init__(self):
        self._responses: Dict[str, asyncio.Future] = {}

    async def send_task(self, task_id: str, payload: dict) -> dict:
        """Send task and wait for response."""
        future = asyncio.get_event_loop().create_future()
        self._responses[task_id] = future

        await self._send_message({"task_id": task_id, **payload})

        try:
            return await asyncio.wait_for(future, timeout=60.0)
        finally:
            self._responses.pop(task_id, None)

    def _on_response(self, task_id: str, response: dict):
        """Handle incoming response."""
        future = self._responses.get(task_id)
        if future and not future.done():
            future.set_result(response)
```

## Event vs Future Comparison

### Event - Wrong Usage

```python
# BAD: Using Event for single-value response
class BadApprovalHandler:
    def __init__(self):
        self.approved_event = asyncio.Event()
        self.result = None  # Race condition!

    async def wait_approval(self):
        await self.approved_event.wait()
        return self.result  # May be stale or from wrong request

    def resolve(self, result):
        self.result = result
        self.approved_event.set()
```

### Future - Correct for Single Value

```python
# GOOD: Future for single-value response
class GoodApprovalHandler:
    async def wait_approval(self, approval_id: str) -> dict:
        future = asyncio.get_event_loop().create_future()
        self.register(approval_id, future)

        try:
            return await future  # Atomically returns the result
        finally:
            self.unregister(approval_id)
```

## asyncio.Queue

Use for **producer/consumer** patterns with backpressure.

### Example: Task Distribution

```python
import asyncio

class TaskDistributor:
    def __init__(self, max_pending: int = 100):
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=max_pending)

    async def submit(self, task: dict):
        """Submit task (blocks if queue full)."""
        await self.queue.put(task)

    async def worker(self):
        """Process tasks from queue."""
        while True:
            task = await self.queue.get()
            try:
                await self.process(task)
            finally:
                self.queue.task_done()
```

## asyncio.Semaphore

Use for **concurrency limiting**.

### Example: Parallel Health Checks

```python
import asyncio

class ParallelHealthChecker:
    def __init__(self, max_concurrent: int = 5):
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def check_agent(self, agent_url: str) -> dict:
        async with self.semaphore:
            return await self._do_health_check(agent_url)

    async def check_all(self, agents: list[str]) -> list[dict]:
        """Check all agents with limited concurrency."""
        return await asyncio.gather(
            *[self.check_agent(url) for url in agents]
        )
```

## Common Pitfalls

### 1. Not Storing Task References

```python
# BAD: Task may be garbage collected
asyncio.create_task(do_work())

# GOOD: Store reference
task = asyncio.create_task(do_work())
self.background_tasks.add(task)
task.add_done_callback(self.background_tasks.discard)
```

### 2. Ignoring Exceptions in Fire-and-Forget

```python
# BAD: Silent failures
asyncio.create_task(might_fail())

# GOOD: Handle exceptions
async def safe_wrapper(coro):
    try:
        await coro
    except Exception as e:
        logger.error(f"Background task failed: {e}")

asyncio.create_task(safe_wrapper(might_fail()))
```

### 3. Future Without Timeout

```python
# BAD: May wait forever
result = await future

# GOOD: Always use timeout
result = await asyncio.wait_for(future, timeout=30.0)
```

## Related Documentation

- [HITL Approval Flow](../architecture/diagrams/hitl-approval-flow.md)
- [A2A Request Flow](../architecture/diagrams/a2a-request-flow.md)
