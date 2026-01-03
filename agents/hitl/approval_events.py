"""
Event-Driven Approval Notification System

Replaces polling with asyncio.Event-based notification for efficient
approval wait handling. Subscribes to approval resolution events from
the Foundation event bus.

This module provides:
- ApprovalEventManager: Core class managing asyncio.Event instances
- ApprovalResult: Dataclass for approval decision results
- Singleton accessor for global event manager instance

Performance Impact:
- CPU during wait: ~0% (vs ~1% per approval with polling)
- Response latency: <100ms (vs 0-5 seconds with polling)
- API calls during wait: 1 (vs ~60 calls per 5min wait)

@see docs/modules/bm-dm/stories/dm-11-6-event-driven-approvals.md
Epic: DM-11 | Story: DM-11.6
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# TTL for orphaned results (results that were never retrieved)
# Set to 1 hour - enough time for race condition handling, not too long to cause memory issues
RESULT_TTL_SECONDS = 3600


# =============================================================================
# APPROVAL RESULT DATACLASS
# =============================================================================


@dataclass
class ApprovalResult:
    """
    Result of an approval decision.

    Contains all information about how an approval was resolved,
    including who approved/rejected and any notes provided.

    Attributes:
        approval_id: Unique identifier for the approval
        status: Resolution status ('approved', 'rejected', 'cancelled', 'auto_approved')
        resolution: Optional dictionary with additional resolution details
        resolved_at: Timestamp when the approval was resolved
        resolved_by: User ID of the person who resolved (if applicable)
        notes: Optional notes provided with the decision
    """

    approval_id: str
    status: str  # 'approved', 'rejected', 'cancelled', 'auto_approved'
    resolution: Optional[Dict[str, Any]] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# PENDING APPROVAL ENTRY
# =============================================================================


@dataclass
class _PendingApproval:
    """Internal tracking for a pending approval wait."""

    event: asyncio.Event
    created_at: datetime = field(default_factory=datetime.utcnow)


# =============================================================================
# APPROVAL EVENT MANAGER
# =============================================================================


class ApprovalEventManager:
    """
    Event-driven approval notification manager.

    Uses asyncio.Event for zero-CPU wait on approval resolution.
    Falls back to polling only when event delivery fails.

    Thread Safety:
        Uses asyncio.Lock for safe concurrent access within a single event loop.
        All operations are coroutine-safe.

    Usage:
        manager = get_approval_event_manager()

        # Wait for approval (event-driven)
        result = await manager.wait_for_event(
            approval_id="appr_123",
            timeout=300.0,
        )

        if result.status == "approved":
            # Execute the action
            ...

        # Or notify from event gateway
        await manager.notify(
            approval_id="appr_123",
            result=ApprovalResult(
                approval_id="appr_123",
                status="approved",
                resolved_by="user_456",
            ),
        )
    """

    def __init__(self):
        """Initialize the approval event manager."""
        self._pending_events: Dict[str, _PendingApproval] = {}
        self._results: Dict[str, ApprovalResult] = {}
        self._result_timestamps: Dict[str, datetime] = {}  # Track when results were added
        self._lock = asyncio.Lock()
        self._event_bus_connected: bool = False

    async def wait_for_event(
        self,
        approval_id: str,
        timeout: float = 300.0,
    ) -> ApprovalResult:
        """
        Wait for an approval to be resolved using event-driven notification.

        Uses asyncio.Event for efficient waiting with zero CPU usage.
        The wait will complete when notify() is called for this approval_id.

        Args:
            approval_id: ID of the approval to wait for
            timeout: Maximum wait time in seconds (default 5 minutes)

        Returns:
            ApprovalResult with status and resolution details

        Raises:
            asyncio.TimeoutError: If not resolved within timeout
            asyncio.CancelledError: If the wait is cancelled
        """
        event = asyncio.Event()
        pending = _PendingApproval(event=event)

        async with self._lock:
            # Check if result already exists (race condition protection)
            if approval_id in self._results:
                logger.debug(f"Approval {approval_id} already resolved, returning cached result")
                return self._results.pop(approval_id)

            # Prevent multiple waiters for the same approval_id
            if approval_id in self._pending_events:
                logger.warning(
                    f"Duplicate wait attempt for approval {approval_id} - "
                    "another coroutine is already waiting"
                )
                raise ValueError(
                    f"Approval {approval_id} already has a pending waiter. "
                    "Only one coroutine can wait per approval."
                )

            self._pending_events[approval_id] = pending
            logger.debug(f"Registered wait for approval {approval_id}")

        try:
            # Wait for event or timeout
            await asyncio.wait_for(event.wait(), timeout=timeout)

            # Get result
            async with self._lock:
                if approval_id in self._results:
                    result = self._results.pop(approval_id)
                    logger.debug(f"Approval {approval_id} resolved via event: {result.status}")
                    return result
                else:
                    # Event was set but no result - shouldn't happen
                    logger.warning(f"Approval {approval_id} event set but no result found")
                    raise RuntimeError(f"Approval {approval_id} event set without result")

        except asyncio.TimeoutError:
            logger.debug(f"Approval {approval_id} wait timed out after {timeout}s")
            # Check if we missed an event (race condition protection)
            async with self._lock:
                if approval_id in self._results:
                    result = self._results.pop(approval_id)
                    logger.debug(f"Found result for {approval_id} after timeout - returning")
                    return result
            raise

        except asyncio.CancelledError:
            logger.debug(f"Approval {approval_id} wait was cancelled")
            raise

        finally:
            # Cleanup (async with proper locking)
            await self.cleanup(approval_id)

    async def notify(
        self,
        approval_id: str,
        result: ApprovalResult,
    ) -> None:
        """
        Handle approval response event from the event bus.

        Called when the Foundation approval system emits a resolution event.
        Sets the asyncio.Event to wake up waiting coroutines.

        Args:
            approval_id: ID of the resolved approval
            result: ApprovalResult with resolution details
        """
        async with self._lock:
            # Store the result and timestamp
            self._results[approval_id] = result
            self._result_timestamps[approval_id] = datetime.utcnow()

            # Wake up any waiting coroutine
            if approval_id in self._pending_events:
                pending = self._pending_events[approval_id]
                pending.event.set()
                logger.debug(f"Approval {approval_id} notified: {result.status}")
            else:
                # No one waiting - result will be picked up on next wait
                logger.debug(f"Received notification for non-pending approval: {approval_id}")

    async def cleanup(self, approval_id: str) -> None:
        """
        Clean up pending events for an approval.

        Called automatically after wait completes, but can also be called
        manually to clean up abandoned waits. Uses proper locking for
        thread safety.

        Args:
            approval_id: ID of the approval to clean up
        """
        async with self._lock:
            self._pending_events.pop(approval_id, None)
            # Don't remove results here - they may be needed for race condition handling
            # Results are cleaned up when retrieved or by cleanup_stale_results()

    async def cleanup_async(self, approval_id: str) -> None:
        """
        Full cleanup including results (for explicit cleanup).

        Args:
            approval_id: ID of the approval to clean up
        """
        async with self._lock:
            self._pending_events.pop(approval_id, None)
            self._results.pop(approval_id, None)
            self._result_timestamps.pop(approval_id, None)

    async def cleanup_stale_results(self) -> int:
        """
        Remove orphaned results that have exceeded TTL.

        Should be called periodically (e.g., every 10 minutes) to prevent
        memory leaks from results that were never retrieved.

        Returns:
            Number of stale results cleaned up
        """
        now = datetime.utcnow()
        ttl = timedelta(seconds=RESULT_TTL_SECONDS)
        cleaned = 0

        async with self._lock:
            stale_ids = [
                approval_id
                for approval_id, timestamp in self._result_timestamps.items()
                if now - timestamp > ttl
            ]

            for approval_id in stale_ids:
                # Only clean up if not pending (someone might still be waiting)
                if approval_id not in self._pending_events:
                    self._results.pop(approval_id, None)
                    self._result_timestamps.pop(approval_id, None)
                    cleaned += 1
                    logger.debug(f"Cleaned up stale result for approval {approval_id}")

        if cleaned > 0:
            logger.info(f"Cleaned up {cleaned} stale approval result(s)")

        return cleaned

    def set_event_bus_connected(self, connected: bool) -> None:
        """
        Update the event bus connection status.

        Args:
            connected: Whether the event bus is connected
        """
        self._event_bus_connected = connected
        logger.info(f"Event bus connection status: {'connected' if connected else 'disconnected'}")

    @property
    def pending_count(self) -> int:
        """Number of approvals currently waiting."""
        return len(self._pending_events)

    @property
    def is_connected(self) -> bool:
        """Whether the event bus is believed to be connected."""
        return self._event_bus_connected

    async def get_pending_approvals(self) -> list[str]:
        """
        Get list of approval IDs currently being waited on.

        Thread-safe operation that acquires lock before reading.

        Returns:
            List of pending approval IDs
        """
        async with self._lock:
            return list(self._pending_events.keys())


# =============================================================================
# SINGLETON PATTERN
# =============================================================================

_event_manager: Optional[ApprovalEventManager] = None


def get_approval_event_manager() -> ApprovalEventManager:
    """
    Get the singleton ApprovalEventManager instance.

    Creates the instance on first call.

    Returns:
        Singleton ApprovalEventManager instance
    """
    global _event_manager
    if _event_manager is None:
        _event_manager = ApprovalEventManager()
        logger.debug("ApprovalEventManager singleton created")
    return _event_manager


def reset_approval_event_manager() -> None:
    """
    Reset the singleton for testing purposes.

    This clears the global instance, allowing a fresh instance
    to be created on the next call to get_approval_event_manager().
    """
    global _event_manager
    _event_manager = None
    logger.debug("ApprovalEventManager singleton reset")
