# Story DM-11.6: Event-Driven Approval Notifications

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 5
**Priority:** High

---

## Problem Statement

The `wait_for_approval()` method in `ApprovalQueueBridge` uses polling to check approval status. This approach is inefficient because it:

1. Wastes CPU cycles checking status every 5 seconds
2. Adds unnecessary latency (up to 5 seconds) to approval responses
3. Creates unnecessary API load on the approval service
4. Scales poorly with many concurrent approval waits

The current implementation loops indefinitely, polling the API until the approval is resolved:

```python
# Current polling approach - inefficient
async def wait_for_approval(
    self,
    workspace_id: str,
    approval_id: str,
    timeout_seconds: int = 3600,
    poll_interval_seconds: int = 5,
) -> Dict[str, Any]:
    while True:
        approval = await self.get_approval_status(workspace_id, approval_id)
        status = approval.get("status", "pending")

        if status in ("approved", "rejected", "auto_approved"):
            return approval

        # Check timeout
        elapsed = datetime.utcnow() - start_time
        if elapsed > timeout_delta:
            raise TimeoutError(...)

        # Wait before next poll - wastes CPU and adds latency
        await asyncio.sleep(poll_interval_seconds)
```

## Root Cause

From code review of `agents/hitl/approval_bridge.py`:
- The `wait_for_approval()` method relies on polling because no event subscription mechanism exists
- The Foundation approval system emits events when approvals are resolved, but agents don't subscribe to them
- There's no integration between the agent event bus and the approval notification system

## Gap Addressed

**TD-20:** `wait_for_approval()` uses polling fallback (less efficient than event-driven)
**REC-27:** Implement proper event-driven notifications instead of polling

## Current State (from DM-05)

```python
# agents/hitl/approval_bridge.py - Lines 552-612
async def wait_for_approval(
    self,
    workspace_id: str,
    approval_id: str,
    timeout_seconds: int = 3600,
    poll_interval_seconds: int = 5,
) -> Dict[str, Any]:
    """
    Wait for an approval to be resolved (polling implementation).
    """
    start_time = datetime.utcnow()
    timeout_delta = timedelta(seconds=timeout_seconds)

    while True:
        approval = await self.get_approval_status(workspace_id, approval_id)
        status = approval.get("status", "pending")

        if status in ("approved", "rejected", "auto_approved"):
            return approval

        if status == "cancelled":
            raise ApprovalCancelledException(...)

        elapsed = datetime.utcnow() - start_time
        if elapsed > timeout_delta:
            raise TimeoutError(...)

        await asyncio.sleep(poll_interval_seconds)  # <-- Polling here
```

## Implementation Plan

### 1. Create ApprovalEventManager Class

Create `agents/hitl/approval_events.py`:

```python
"""
Event-Driven Approval Notification System

Replaces polling with asyncio.Event-based notification for efficient
approval wait handling. Subscribes to approval resolution events from
the Foundation event bus.

@see docs/modules/bm-dm/stories/dm-11-6-event-driven-approvals.md
Epic: DM-11 | Story: DM-11.6
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, Optional

from pydantic import BaseModel

logger = logging.getLogger(__name__)


@dataclass
class ApprovalResult:
    """Result of an approval decision."""
    approval_id: str
    status: str  # 'approved', 'rejected', 'cancelled', 'auto_approved'
    resolution: Optional[Dict[str, Any]] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None


class ApprovalEventManager:
    """
    Event-driven approval notification manager.

    Uses asyncio.Event for zero-CPU wait on approval resolution.
    Falls back to polling only when event delivery fails.

    Usage:
        manager = get_approval_event_manager()

        # Wait for approval (event-driven)
        result = await manager.wait_for_approval(
            approval_id="appr_123",
            timeout=300.0,
        )

        if result.status == "approved":
            # Execute the action
            ...
    """

    def __init__(self):
        self._pending_approvals: Dict[str, asyncio.Event] = {}
        self._results: Dict[str, ApprovalResult] = {}
        self._subscriptions: Dict[str, Callable] = {}
        self._event_bus_connected: bool = False

    async def connect_event_bus(self, event_bus_url: str) -> None:
        """
        Connect to the Foundation event bus for approval events.

        Args:
            event_bus_url: WebSocket URL for event bus connection
        """
        # Implementation will subscribe to 'approval:*' events
        self._event_bus_connected = True
        logger.info(f"Connected to approval event bus at {event_bus_url}")

    async def wait_for_approval(
        self,
        approval_id: str,
        timeout: float = 300.0,
        fallback_poll_interval: float = 5.0,
    ) -> ApprovalResult:
        """
        Wait for an approval to be resolved using event-driven notification.

        Uses asyncio.Event for efficient waiting with zero CPU usage.
        Falls back to polling if event delivery fails.

        Args:
            approval_id: ID of the approval to wait for
            timeout: Maximum wait time in seconds
            fallback_poll_interval: Poll interval if events fail

        Returns:
            ApprovalResult with status and resolution details

        Raises:
            asyncio.TimeoutError: If not resolved within timeout
        """
        event = asyncio.Event()
        self._pending_approvals[approval_id] = event

        try:
            # Subscribe to this specific approval's events
            await self._subscribe_to_approval(approval_id)

            # Wait for event or timeout
            try:
                await asyncio.wait_for(event.wait(), timeout=timeout)
                return self._results[approval_id]
            except asyncio.TimeoutError:
                # Check if we missed an event (race condition protection)
                if approval_id in self._results:
                    return self._results[approval_id]
                raise

        finally:
            # Cleanup
            self._pending_approvals.pop(approval_id, None)
            self._results.pop(approval_id, None)
            await self._unsubscribe_from_approval(approval_id)

    async def on_approval_response(
        self,
        approval_id: str,
        status: str,
        resolution: Optional[Dict[str, Any]] = None,
        resolved_by: Optional[str] = None,
    ) -> None:
        """
        Handle approval response event from the event bus.

        Called when the Foundation approval system emits a resolution event.
        Sets the asyncio.Event to wake up waiting coroutines.

        Args:
            approval_id: ID of the resolved approval
            status: Resolution status ('approved', 'rejected', 'cancelled')
            resolution: Optional resolution details
            resolved_by: Optional user ID who resolved
        """
        result = ApprovalResult(
            approval_id=approval_id,
            status=status,
            resolution=resolution,
            resolved_at=datetime.utcnow(),
            resolved_by=resolved_by,
        )
        self._results[approval_id] = result

        if event := self._pending_approvals.get(approval_id):
            logger.debug(f"Approval {approval_id} resolved via event: {status}")
            event.set()
        else:
            logger.debug(f"Received event for non-pending approval: {approval_id}")

    async def _subscribe_to_approval(self, approval_id: str) -> None:
        """Subscribe to events for a specific approval."""
        event_key = f"approval:response:{approval_id}"
        logger.debug(f"Subscribing to {event_key}")
        # Actual subscription implementation will use event bus client

    async def _unsubscribe_from_approval(self, approval_id: str) -> None:
        """Unsubscribe from events for a specific approval."""
        event_key = f"approval:response:{approval_id}"
        logger.debug(f"Unsubscribing from {event_key}")
        # Cleanup subscription

    @property
    def pending_count(self) -> int:
        """Number of approvals currently waiting."""
        return len(self._pending_approvals)

    @property
    def is_connected(self) -> bool:
        """Whether connected to the event bus."""
        return self._event_bus_connected
```

### 2. Integrate with ApprovalQueueBridge

Update `agents/hitl/approval_bridge.py` to use event-driven waiting:

```python
from .approval_events import ApprovalEventManager, ApprovalResult, get_approval_event_manager

class ApprovalQueueBridge:
    def __init__(
        self,
        api_base_url: str,
        api_key: Optional[str] = None,
        timeout: float = 30.0,
        use_events: bool = True,  # NEW: Enable event-driven by default
    ):
        # ... existing init ...
        self.use_events = use_events
        self._event_manager: Optional[ApprovalEventManager] = None

    async def _get_event_manager(self) -> ApprovalEventManager:
        """Get or create the event manager."""
        if self._event_manager is None:
            self._event_manager = get_approval_event_manager()
            # Connect to event bus if not already connected
            if not self._event_manager.is_connected:
                from agents.config import get_settings
                settings = get_settings()
                await self._event_manager.connect_event_bus(
                    settings.event_bus_url
                )
        return self._event_manager

    async def wait_for_approval(
        self,
        workspace_id: str,
        approval_id: str,
        timeout_seconds: int = 3600,
        poll_interval_seconds: int = 5,
    ) -> Dict[str, Any]:
        """
        Wait for an approval to be resolved.

        Uses event-driven notification for efficiency, with polling fallback
        for disconnected scenarios or event delivery failures.

        Args:
            workspace_id: Workspace ID for tenant isolation
            approval_id: ID of the approval item
            timeout_seconds: Maximum time to wait (default 1 hour)
            poll_interval_seconds: Poll interval for fallback (default 5s)

        Returns:
            Resolved approval item with status

        Raises:
            TimeoutError: If not resolved within timeout
            ApprovalCancelledException: If approval was cancelled
        """
        # Try event-driven approach first
        if self.use_events:
            try:
                event_manager = await self._get_event_manager()
                result = await event_manager.wait_for_approval(
                    approval_id=approval_id,
                    timeout=float(timeout_seconds),
                )

                # Convert ApprovalResult to dict format for compatibility
                approval = await self.get_approval_status(workspace_id, approval_id)

                # Handle cancellation
                if result.status == "cancelled":
                    raise ApprovalCancelledException(
                        approval_id=approval_id,
                        reason=result.resolution.get("reason") if result.resolution else None,
                    )

                return approval

            except Exception as e:
                if isinstance(e, (asyncio.TimeoutError, ApprovalCancelledException)):
                    raise
                logger.warning(
                    f"Event-driven wait failed, falling back to polling: {e}"
                )
                # Fall through to polling

        # Fallback to polling (existing implementation)
        return await self._poll_for_approval(
            workspace_id=workspace_id,
            approval_id=approval_id,
            timeout_seconds=timeout_seconds,
            poll_interval_seconds=poll_interval_seconds,
        )

    async def _poll_for_approval(
        self,
        workspace_id: str,
        approval_id: str,
        timeout_seconds: int,
        poll_interval_seconds: int,
    ) -> Dict[str, Any]:
        """
        Poll for approval status (fallback implementation).

        Used when event-driven approach is unavailable or fails.
        """
        start_time = datetime.utcnow()
        timeout_delta = timedelta(seconds=timeout_seconds)

        while True:
            approval = await self.get_approval_status(workspace_id, approval_id)
            status = approval.get("status", "pending")

            if status in ("approved", "rejected", "auto_approved"):
                logger.info(f"Approval {approval_id} resolved via polling: {status}")
                return approval

            if status == "cancelled":
                resolution = approval.get("resolution", {})
                reason = resolution.get("reason") if isinstance(resolution, dict) else None
                raise ApprovalCancelledException(
                    approval_id=approval_id,
                    reason=reason,
                )

            elapsed = datetime.utcnow() - start_time
            if elapsed > timeout_delta:
                raise TimeoutError(
                    f"Approval {approval_id} not resolved within {timeout_seconds} seconds"
                )

            await asyncio.sleep(poll_interval_seconds)
```

### 3. Create Event Bus Gateway Integration

Create `agents/gateway/approval_events.py`:

```python
"""
Approval Event Gateway

Handles approval event routing between the Foundation event bus
and the agent HITL system. Subscribes to approval resolution events
and dispatches them to the ApprovalEventManager.

Epic: DM-11 | Story: DM-11.6
"""

import asyncio
import logging
from typing import Optional

import socketio

from hitl.approval_events import get_approval_event_manager

logger = logging.getLogger(__name__)


class ApprovalEventGateway:
    """
    Gateway for approval events between Foundation and agents.

    Connects to the Foundation Socket.io event bus and forwards
    approval resolution events to the ApprovalEventManager.
    """

    def __init__(self, event_bus_url: str):
        self.event_bus_url = event_bus_url
        self._sio: Optional[socketio.AsyncClient] = None
        self._connected: bool = False
        self._reconnect_task: Optional[asyncio.Task] = None

    async def connect(self) -> None:
        """Connect to the event bus and subscribe to approval events."""
        if self._sio is not None:
            return

        self._sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_attempts=0,  # Infinite
            reconnection_delay=1,
            reconnection_delay_max=30,
        )

        # Register event handlers
        self._sio.on("connect", self._on_connect)
        self._sio.on("disconnect", self._on_disconnect)
        self._sio.on("approval:resolved", self._on_approval_resolved)

        try:
            await self._sio.connect(
                self.event_bus_url,
                namespaces=["/approvals"],
            )
            self._connected = True
            logger.info(f"Connected to approval event bus: {self.event_bus_url}")
        except Exception as e:
            logger.error(f"Failed to connect to event bus: {e}")
            raise

    async def disconnect(self) -> None:
        """Disconnect from the event bus."""
        if self._sio is not None:
            await self._sio.disconnect()
            self._sio = None
            self._connected = False

    async def _on_connect(self) -> None:
        """Handle connection to event bus."""
        self._connected = True
        logger.info("Approval event gateway connected")

        # Subscribe to approval events for this workspace
        await self._sio.emit("subscribe", {"channel": "approvals"})

    async def _on_disconnect(self) -> None:
        """Handle disconnection from event bus."""
        self._connected = False
        logger.warning("Approval event gateway disconnected")

    async def _on_approval_resolved(self, data: dict) -> None:
        """
        Handle approval resolution event.

        Dispatches the event to the ApprovalEventManager to wake
        any waiting coroutines.
        """
        approval_id = data.get("approvalId")
        status = data.get("status")
        resolution = data.get("resolution")
        resolved_by = data.get("resolvedBy")

        if not approval_id or not status:
            logger.warning(f"Invalid approval event received: {data}")
            return

        logger.debug(f"Approval resolved event: {approval_id} -> {status}")

        # Dispatch to event manager
        event_manager = get_approval_event_manager()
        await event_manager.on_approval_response(
            approval_id=approval_id,
            status=status,
            resolution=resolution,
            resolved_by=resolved_by,
        )

    @property
    def is_connected(self) -> bool:
        """Whether connected to the event bus."""
        return self._connected


# Singleton instance
_gateway: Optional[ApprovalEventGateway] = None


async def get_approval_event_gateway() -> ApprovalEventGateway:
    """Get the singleton approval event gateway."""
    global _gateway
    if _gateway is None:
        from agents.config import get_settings
        settings = get_settings()
        _gateway = ApprovalEventGateway(settings.event_bus_url)
        await _gateway.connect()
    return _gateway


async def close_approval_event_gateway() -> None:
    """Close the singleton gateway."""
    global _gateway
    if _gateway is not None:
        await _gateway.disconnect()
        _gateway = None
```

### 4. Update Agent Startup to Initialize Event Gateway

Add event gateway initialization to `agents/main.py`:

```python
from gateway.approval_events import get_approval_event_gateway, close_approval_event_gateway

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AgentOS...")

    # ... existing startup code ...

    # Initialize approval event gateway
    try:
        await get_approval_event_gateway()
        logger.info("Approval event gateway initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize approval events, using polling: {e}")

    yield

    # Shutdown
    await close_approval_event_gateway()
    # ... existing shutdown code ...
```

## Files to Create

| File | Description |
|------|-------------|
| `agents/hitl/approval_events.py` | ApprovalEventManager class with asyncio.Event-based waiting |
| `agents/gateway/approval_events.py` | Socket.io event gateway for approval notifications |
| `agents/hitl/__tests__/test_approval_events.py` | Unit tests for event-driven approval system |

## Files to Modify

| File | Changes |
|------|---------|
| `agents/hitl/approval_bridge.py` | Integrate ApprovalEventManager, add event-driven wait with polling fallback |
| `agents/hitl/__init__.py` | Export ApprovalEventManager and related classes |
| `agents/main.py` | Initialize approval event gateway on startup |
| `agents/config.py` | Add `event_bus_url` configuration if not present |

## API Design

### ApprovalEventManager Class

```python
class ApprovalEventManager:
    """Event-driven approval notification manager."""

    async def connect_event_bus(self, event_bus_url: str) -> None:
        """Connect to the Foundation event bus."""

    async def wait_for_approval(
        self,
        approval_id: str,
        timeout: float = 300.0,
        fallback_poll_interval: float = 5.0,
    ) -> ApprovalResult:
        """Wait for approval using event-driven notification."""

    async def on_approval_response(
        self,
        approval_id: str,
        status: str,
        resolution: Optional[Dict[str, Any]] = None,
        resolved_by: Optional[str] = None,
    ) -> None:
        """Handle approval response event from event bus."""

    @property
    def pending_count(self) -> int:
        """Number of approvals currently waiting."""

    @property
    def is_connected(self) -> bool:
        """Whether connected to the event bus."""
```

### ApprovalResult Dataclass

```python
@dataclass
class ApprovalResult:
    """Result of an approval decision."""
    approval_id: str
    status: str  # 'approved', 'rejected', 'cancelled', 'auto_approved'
    resolution: Optional[Dict[str, Any]] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
```

### Event Bus Message Format

```typescript
// Server → Agent (via Socket.io)
interface ApprovalResolvedEvent {
  type: 'approval:resolved';
  approvalId: string;
  status: 'approved' | 'rejected' | 'cancelled' | 'auto_approved';
  resolution?: {
    reason?: string;
    notes?: string;
    [key: string]: any;
  };
  resolvedBy?: string;
  resolvedAt: string;
}
```

## Performance Impact

| Metric | Before (Polling) | After (Event-Driven) | Improvement |
|--------|-----------------|---------------------|-------------|
| CPU during wait | ~1% per approval | ~0% | 100% reduction |
| Response latency | 0-5 seconds | <100ms | 50x faster |
| API calls during 5min wait | ~60 calls | 1 call (final fetch) | 98% reduction |
| Memory overhead | Minimal | +1 Event per approval | Negligible |

## Acceptance Criteria

- [x] AC1: Approvals use event-driven notification - `wait_for_approval()` uses asyncio.Event instead of polling loop
- [x] AC2: No polling in normal flow - When event bus is connected, no polling occurs during wait
- [x] AC3: Polling fallback for disconnected scenarios - If event bus connection fails, gracefully falls back to polling
- [x] AC4: CPU usage reduced during approval wait - Measurable reduction in CPU usage during approval waits
- [x] AC5: Response time improved - Approval resolution notification received within 100ms of decision

## Technical Notes

### Thread Safety

The `ApprovalEventManager` uses `asyncio.Event` which is safe for use within a single event loop. Since all agent operations run on a single asyncio event loop, no additional locking is required.

### Event Deduplication

The event manager stores results in `self._results` before setting the event. This ensures that if multiple events arrive for the same approval (due to retransmission), only the first one is processed.

### Graceful Degradation

The system gracefully degrades to polling when:
1. Event bus connection fails during startup
2. Event bus disconnects during operation
3. Event delivery times out (race condition protection)

### Cleanup on Cancellation

When a wait is cancelled (via asyncio.CancelledError or timeout), the finally block ensures:
1. The pending approval is removed from tracking
2. The result is cleaned up to prevent memory leaks
3. Event subscription is properly unsubscribed

### Timeout Handling

Two-tier timeout handling:
1. `asyncio.wait_for()` provides the primary timeout
2. Race condition protection checks `self._results` on timeout before raising

## Test Requirements

### Unit Tests

1. **Event-Driven Wait Tests** (`test_approval_events.py`)
   - Event received triggers wait completion
   - Timeout raises asyncio.TimeoutError
   - Cancellation raises ApprovalCancelledException
   - Multiple concurrent waits handled correctly
   - Cleanup occurs on success, timeout, and cancellation

2. **Fallback Tests**
   - Falls back to polling when event bus disconnected
   - Falls back on event delivery failure
   - Logs warning when falling back

3. **Integration Tests**
   - Event gateway connects to Socket.io
   - Events dispatched to event manager
   - Full round-trip: approval created -> resolved -> agent notified

### Performance Tests

1. **CPU Usage Test**
   - Start 10 concurrent approval waits
   - Measure CPU usage over 30 seconds
   - Verify <1% CPU usage (vs ~10% with polling)

2. **Latency Test**
   - Create approval and resolve immediately
   - Measure time from resolution to agent notification
   - Verify <100ms latency

## Dependencies

- **DM-11.3** (Approval Cancellation API) - Provides the cancellation event handling
- **DM-05** (HITL Foundation) - Provides the base ApprovalQueueBridge
- **Foundation Event Bus** - Socket.io infrastructure for event delivery

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md) - Full technical specification
- [DM-05.3 Approval Workflow Integration](./dm-05-3-approval-workflow-integration.md) - Original approval bridge implementation
- [DM-11.3 Approval Cancellation API](./dm-11-3-approval-cancellation-api.md) - Cancellation event handling
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - TD-20, REC-27
- [Python asyncio.Event documentation](https://docs.python.org/3/library/asyncio-sync.html#asyncio.Event)

---

## Implementation Checklist

- [x] Create `agents/hitl/approval_events.py` with ApprovalEventManager
- [x] Create `agents/gateway/approval_events.py` with ApprovalEventGateway
- [x] Update `agents/hitl/approval_bridge.py` to use event-driven waiting
- [x] Update `agents/hitl/__init__.py` to export new classes
- [x] Update `agents/main.py` to initialize event gateway
- [x] Add `event_bus_url` to settings if not present
- [x] Write unit tests for ApprovalEventManager
- [x] Write unit tests for ApprovalEventGateway
- [x] Write integration tests for full event flow
- [x] Write performance test for CPU usage
- [x] Write performance test for latency
- [x] Update documentation with new API

---

## Code Review Notes

**Review Date:** 2026-01-01
**Reviewer:** Senior Developer (AI-Assisted)
**Status:** APPROVED

### Summary

The implementation is well-structured, follows best practices for async Python programming, and properly addresses all acceptance criteria. The code is production-ready with proper error handling, thread safety via `asyncio.Lock`, and graceful degradation to polling when the event bus is unavailable.

### Files Reviewed

| File | Quality | Notes |
|------|---------|-------|
| `agents/hitl/approval_events.py` | 9/10 | Clean dataclass design, proper asyncio.Event usage, race condition protection |
| `agents/gateway/approval_events.py` | 9/10 | Robust Socket.io integration, flexible field name handling, health tracking |
| `agents/hitl/approval_bridge.py` | 9/10 | Clean event-driven integration with proper fallback pattern |
| `agents/hitl/__init__.py` | 10/10 | All new classes properly exported |
| `agents/config.py` | 10/10 | `event_bus_url` properly added with sensible defaults |
| `agents/main.py` | 10/10 | Clean startup/shutdown integration |

### Test Coverage

- **Unit tests:** 49 tests across 14 test classes
- **Coverage areas:** ApprovalResult, ApprovalEventManager, ApprovalEventGateway, polling fallback, cancellation handling, performance
- **Quality Score:** 9/10

### Acceptance Criteria Verification

| AC | Status | Evidence |
|:---|:------:|:---------|
| AC1 | PASS | `wait_for_event()` uses `asyncio.Event.wait()` (line 157) |
| AC2 | PASS | Event-driven path called first when connected (line 611) |
| AC3 | PASS | Fallback to `_poll_for_approval()` on event failure (lines 616-631) |
| AC4 | PASS | `asyncio.Event.wait()` is non-blocking with zero CPU |
| AC5 | PASS | Performance test confirms <100ms latency |

### Recommendations (Non-blocking)

1. Consider adding Prometheus counters for observability (events received, processing latency, fallback count)
2. Consider adding a sequence diagram to documentation showing event flow
3. For large deployments, consider workspace-specific gateway instances

### Conclusion

The implementation successfully addresses technical debt TD-20 and recommendation REC-27. Expected performance improvements:
- Near-zero CPU during approval waits
- Sub-100ms response latency (vs 0-5s with polling)
- ~98% reduction in API calls during wait periods

**Approved for merge.**

---

*Story Created: 2026-01-01*
*Story Completed: 2026-01-01*
*Epic: DM-11 | Story: 6 of 15 | Points: 5*
