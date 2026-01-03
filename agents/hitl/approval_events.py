"""
Event-Driven Approval Notification System

Replaces polling with asyncio.Future-based notification for efficient
approval wait handling. Subscribes to approval resolution events from
the Foundation event bus.

This module provides:
- ApprovalEventManager: Core class managing asyncio.Future instances
- ApprovalResult: Dataclass for approval decision results
- Singleton accessor for global event manager instance

Performance Impact:
- CPU during wait: ~0% (vs ~1% per approval with polling)
- Response latency: <100ms (vs 0-5 seconds with polling)
- API calls during wait: 1 (vs ~60 calls per 5min wait)

Race Condition Safety:
Uses asyncio.Future instead of asyncio.Event to prevent race conditions.
The Future is registered under lock before waiting, and notify() delivers
the result directly to the Future. This ensures the result is never lost
even if notify() happens before the await starts.

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
    """
    Internal tracking for a pending approval wait.

    Uses asyncio.Future instead of asyncio.Event to prevent race conditions.
    The Future receives the result directly via set_result(), ensuring the
    result is never lost even if notify() happens before the await starts.
    """

    future: asyncio.Future[ApprovalResult]
    created_at: datetime = field(default_factory=datetime.utcnow)


# =============================================================================
# APPROVAL EVENT MANAGER
# =============================================================================


class ApprovalEventManager:
    """
    Event-driven approval notification manager.

    Uses asyncio.Future for zero-CPU wait on approval resolution.
    Falls back to polling only when event delivery fails.

    Race Condition Safety:
        Uses asyncio.Future instead of asyncio.Event to prevent race conditions.
        With Event, if notify() fires between lock release and event.wait(),
        the signal is lost. With Future, notify() delivers the result directly
        to the Future via set_result(), and the awaiting coroutine receives it
        regardless of timing.

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
        self._pending_futures: Dict[str, _PendingApproval] = {}
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

        Uses asyncio.Future for efficient waiting with zero CPU usage.
        The wait will complete when notify() is called for this approval_id.
        The Future-based approach prevents race conditions by delivering
        the result directly through the Future object.

        Args:
            approval_id: ID of the approval to wait for
            timeout: Maximum wait time in seconds (default 5 minutes)

        Returns:
            ApprovalResult with status and resolution details

        Raises:
            asyncio.TimeoutError: If not resolved within timeout
            asyncio.CancelledError: If the wait is cancelled
            ValueError: If another coroutine is already waiting for this approval
        """
        future: asyncio.Future[ApprovalResult] = asyncio.get_event_loop().create_future()
        pending = _PendingApproval(future=future)

        async with self._lock:
            # Check if result already exists (from notify before wait)
            if approval_id in self._results:
                logger.debug(f"Approval {approval_id} already resolved, returning cached result")
                result = self._results.pop(approval_id)
                self._result_timestamps.pop(approval_id, None)
                return result

            # Prevent multiple waiters for the same approval_id
            if approval_id in self._pending_futures:
                logger.warning(
                    f"Duplicate wait attempt for approval {approval_id} - "
                    "another coroutine is already waiting"
                )
                raise ValueError(
                    f"Approval {approval_id} already has a pending waiter. "
                    "Only one coroutine can wait per approval."
                )

            # Register the Future BEFORE releasing the lock
            # This ensures notify() can find and set the result on this Future
            self._pending_futures[approval_id] = pending
            logger.debug(f"Registered Future wait for approval {approval_id}")

        try:
            # Wait for Future to receive result or timeout
            # Race condition safe: if notify() called after lock release but before await,
            # the result is set on the Future and await returns immediately
            result = await asyncio.wait_for(future, timeout=timeout)
            logger.debug(f"Approval {approval_id} resolved via Future: {result.status}")
            return result

        except asyncio.TimeoutError:
            logger.debug(f"Approval {approval_id} wait timed out after {timeout}s")
            raise

        except asyncio.CancelledError:
            logger.debug(f"Approval {approval_id} wait was cancelled")
            raise

        finally:
            # Cleanup the pending Future
            await self.cleanup(approval_id)

    async def notify(
        self,
        approval_id: str,
        result: ApprovalResult,
    ) -> None:
        """
        Handle approval response event from the event bus.

        Called when the Foundation approval system emits a resolution event.
        Delivers the result directly to the waiting Future, or stores it
        for later retrieval if no one is waiting yet.

        Args:
            approval_id: ID of the resolved approval
            result: ApprovalResult with resolution details
        """
        async with self._lock:
            # If someone is waiting, deliver result directly to their Future
            if approval_id in self._pending_futures:
                pending = self._pending_futures[approval_id]
                # set_result delivers the value directly to the awaiting coroutine
                # Race condition safe: works regardless of timing
                if not pending.future.done():
                    pending.future.set_result(result)
                    logger.debug(f"Approval {approval_id} delivered to Future: {result.status}")
                else:
                    logger.warning(f"Approval {approval_id} Future already done, storing result")
                    self._results[approval_id] = result
                    self._result_timestamps[approval_id] = datetime.utcnow()
            else:
                # No one waiting yet - store for when wait_for_event is called
                self._results[approval_id] = result
                self._result_timestamps[approval_id] = datetime.utcnow()
                logger.debug(f"Approval {approval_id} stored for later retrieval: {result.status}")

    async def cleanup(self, approval_id: str) -> None:
        """
        Clean up pending Futures for an approval.

        Called automatically after wait completes, but can also be called
        manually to clean up abandoned waits. Uses proper locking for
        thread safety.

        Args:
            approval_id: ID of the approval to clean up
        """
        async with self._lock:
            self._pending_futures.pop(approval_id, None)
            # Don't remove results here - they may be needed if notify() was called
            # before wait_for_event(). Results are cleaned up when retrieved or
            # by cleanup_stale_results()

    async def cleanup_async(self, approval_id: str) -> None:
        """
        Full cleanup including results (for explicit cleanup).

        Args:
            approval_id: ID of the approval to clean up
        """
        async with self._lock:
            self._pending_futures.pop(approval_id, None)
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
                if approval_id not in self._pending_futures:
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
        return len(self._pending_futures)

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
            return list(self._pending_futures.keys())


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
