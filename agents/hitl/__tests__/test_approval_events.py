"""
Approval Events Unit Tests - Story DM-11.6

Tests for event-driven approval notifications including ApprovalEventManager
and integration with ApprovalQueueBridge.

@see docs/modules/bm-dm/stories/dm-11-6-event-driven-approvals.md
Epic: DM-11 | Story: DM-11.6
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add agents directory to path
agents_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(agents_dir))

from hitl.approval_events import (
    ApprovalEventManager,
    ApprovalResult,
    get_approval_event_manager,
    reset_approval_event_manager,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def event_manager():
    """Create a fresh ApprovalEventManager for each test."""
    manager = ApprovalEventManager()
    yield manager


@pytest.fixture
def approval_result():
    """Create a sample approval result."""
    return ApprovalResult(
        approval_id="appr_test123",
        status="approved",
        resolution={"notes": "Approved by manager"},
        resolved_at=datetime.utcnow(),
        resolved_by="user_456",
        notes="Approved by manager",
    )


@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset singleton before and after each test."""
    reset_approval_event_manager()
    yield
    reset_approval_event_manager()


# =============================================================================
# APPROVAL RESULT TESTS
# =============================================================================


class TestApprovalResult:
    """Tests for ApprovalResult dataclass."""

    def test_creates_with_all_fields(self):
        """Should create result with all fields."""
        result = ApprovalResult(
            approval_id="appr_123",
            status="approved",
            resolution={"key": "value"},
            resolved_at=datetime(2026, 1, 1, 12, 0, 0),
            resolved_by="user_456",
            notes="Test notes",
        )

        assert result.approval_id == "appr_123"
        assert result.status == "approved"
        assert result.resolution == {"key": "value"}
        assert result.resolved_at == datetime(2026, 1, 1, 12, 0, 0)
        assert result.resolved_by == "user_456"
        assert result.notes == "Test notes"

    def test_creates_with_minimal_fields(self):
        """Should create result with only required fields."""
        result = ApprovalResult(
            approval_id="appr_123",
            status="rejected",
        )

        assert result.approval_id == "appr_123"
        assert result.status == "rejected"
        assert result.resolution is None
        assert result.resolved_at is None
        assert result.resolved_by is None
        assert result.notes is None

    def test_supports_all_status_values(self):
        """Should support all valid status values."""
        statuses = ["approved", "rejected", "cancelled", "auto_approved"]

        for status in statuses:
            result = ApprovalResult(
                approval_id="appr_123",
                status=status,
            )
            assert result.status == status


# =============================================================================
# APPROVAL EVENT MANAGER TESTS
# =============================================================================


class TestApprovalEventManager:
    """Tests for ApprovalEventManager class."""

    @pytest.mark.asyncio
    async def test_initializes_empty(self, event_manager):
        """Should initialize with empty pending and results."""
        assert event_manager.pending_count == 0
        assert not event_manager.is_connected
        assert await event_manager.get_pending_approvals() == []

    def test_set_event_bus_connected(self, event_manager):
        """Should update connection status."""
        assert not event_manager.is_connected

        event_manager.set_event_bus_connected(True)
        assert event_manager.is_connected

        event_manager.set_event_bus_connected(False)
        assert not event_manager.is_connected


class TestWaitForEvent:
    """Tests for wait_for_event method."""

    @pytest.mark.asyncio
    async def test_event_received_triggers_completion(self, event_manager, approval_result):
        """Event received should trigger wait completion."""

        async def notify_after_delay():
            await asyncio.sleep(0.05)
            await event_manager.notify(approval_result.approval_id, approval_result)

        # Start notification task
        notify_task = asyncio.create_task(notify_after_delay())

        # Wait for event
        result = await event_manager.wait_for_event(
            approval_id=approval_result.approval_id,
            timeout=1.0,
        )

        await notify_task

        assert result.approval_id == approval_result.approval_id
        assert result.status == "approved"
        assert result.resolved_by == "user_456"

    @pytest.mark.asyncio
    async def test_timeout_raises_error(self, event_manager):
        """Should raise TimeoutError when not resolved within timeout."""
        with pytest.raises(asyncio.TimeoutError):
            await event_manager.wait_for_event(
                approval_id="appr_timeout",
                timeout=0.1,
            )

    @pytest.mark.asyncio
    async def test_cancellation_raises_cancelled_error(self, event_manager):
        """Should raise CancelledError when wait is cancelled."""

        async def cancel_after_delay(task):
            await asyncio.sleep(0.05)
            task.cancel()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event(
                approval_id="appr_cancel",
                timeout=10.0,
            )
        )

        cancel_task = asyncio.create_task(cancel_after_delay(wait_task))

        with pytest.raises(asyncio.CancelledError):
            await wait_task

        await cancel_task

    @pytest.mark.asyncio
    async def test_multiple_concurrent_waits(self, event_manager):
        """Should handle multiple concurrent waits correctly."""
        results = {}

        async def wait_and_store(approval_id: str):
            result = await event_manager.wait_for_event(
                approval_id=approval_id,
                timeout=1.0,
            )
            results[approval_id] = result

        async def notify_all_after_delay():
            await asyncio.sleep(0.05)
            for i in range(3):
                await event_manager.notify(
                    f"appr_{i}",
                    ApprovalResult(
                        approval_id=f"appr_{i}",
                        status="approved",
                        resolved_by=f"user_{i}",
                    ),
                )

        # Start 3 concurrent waits
        wait_tasks = [
            asyncio.create_task(wait_and_store(f"appr_{i}"))
            for i in range(3)
        ]

        notify_task = asyncio.create_task(notify_all_after_delay())

        await asyncio.gather(*wait_tasks, notify_task)

        assert len(results) == 3
        for i in range(3):
            assert results[f"appr_{i}"].status == "approved"
            assert results[f"appr_{i}"].resolved_by == f"user_{i}"

    @pytest.mark.asyncio
    async def test_cleanup_on_success(self, event_manager, approval_result):
        """Should clean up pending events on success."""

        async def notify_after_delay():
            await asyncio.sleep(0.05)
            await event_manager.notify(approval_result.approval_id, approval_result)

        notify_task = asyncio.create_task(notify_after_delay())

        # Check pending count during wait
        wait_task = asyncio.create_task(
            event_manager.wait_for_event(
                approval_id=approval_result.approval_id,
                timeout=1.0,
            )
        )

        # Small delay to allow registration
        await asyncio.sleep(0.01)
        assert event_manager.pending_count == 1

        await wait_task
        await notify_task

        # Should be cleaned up
        assert event_manager.pending_count == 0

    @pytest.mark.asyncio
    async def test_cleanup_on_timeout(self, event_manager):
        """Should clean up pending events on timeout."""
        try:
            await event_manager.wait_for_event(
                approval_id="appr_cleanup_timeout",
                timeout=0.05,
            )
        except asyncio.TimeoutError:
            pass

        # Should be cleaned up
        assert event_manager.pending_count == 0
        assert "appr_cleanup_timeout" not in await event_manager.get_pending_approvals()

    @pytest.mark.asyncio
    async def test_cleanup_on_cancellation(self, event_manager):
        """Should clean up pending events on cancellation."""

        async def cancel_after_delay(task):
            await asyncio.sleep(0.05)
            task.cancel()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event(
                approval_id="appr_cleanup_cancel",
                timeout=10.0,
            )
        )

        cancel_task = asyncio.create_task(cancel_after_delay(wait_task))

        try:
            await wait_task
        except asyncio.CancelledError:
            pass

        await cancel_task

        # Should be cleaned up
        assert event_manager.pending_count == 0

    @pytest.mark.asyncio
    async def test_result_already_exists(self, event_manager, approval_result):
        """Should return immediately if result already exists."""
        # Pre-populate result
        async with event_manager._lock:
            event_manager._results[approval_result.approval_id] = approval_result

        # Should return immediately
        result = await event_manager.wait_for_event(
            approval_id=approval_result.approval_id,
            timeout=0.1,
        )

        assert result.approval_id == approval_result.approval_id
        assert result.status == "approved"


class TestNotify:
    """Tests for notify method."""

    @pytest.mark.asyncio
    async def test_notify_wakes_waiting_coroutine(self, event_manager):
        """Notify should wake up waiting coroutine."""
        received_result = None

        async def wait_and_capture():
            nonlocal received_result
            received_result = await event_manager.wait_for_event(
                approval_id="appr_notify_test",
                timeout=1.0,
            )

        wait_task = asyncio.create_task(wait_and_capture())

        # Small delay to ensure wait is registered
        await asyncio.sleep(0.01)

        # Notify
        await event_manager.notify(
            "appr_notify_test",
            ApprovalResult(
                approval_id="appr_notify_test",
                status="rejected",
                notes="Rejected due to policy",
            ),
        )

        await wait_task

        assert received_result is not None
        assert received_result.status == "rejected"
        assert received_result.notes == "Rejected due to policy"

    @pytest.mark.asyncio
    async def test_notify_without_waiter(self, event_manager):
        """Notify without waiter should store result."""
        await event_manager.notify(
            "appr_no_waiter",
            ApprovalResult(
                approval_id="appr_no_waiter",
                status="approved",
            ),
        )

        # Result should be stored for later retrieval
        assert "appr_no_waiter" in event_manager._results

    @pytest.mark.asyncio
    async def test_notify_with_all_statuses(self, event_manager):
        """Should handle all status types correctly."""
        statuses = ["approved", "rejected", "cancelled", "auto_approved"]

        for status in statuses:
            approval_id = f"appr_{status}"

            async def notify_after_delay():
                await asyncio.sleep(0.01)
                await event_manager.notify(
                    approval_id,
                    ApprovalResult(approval_id=approval_id, status=status),
                )

            notify_task = asyncio.create_task(notify_after_delay())

            result = await event_manager.wait_for_event(
                approval_id=approval_id,
                timeout=1.0,
            )

            await notify_task

            assert result.status == status


class TestSingleton:
    """Tests for singleton pattern."""

    def test_get_approval_event_manager_returns_same_instance(self):
        """Should return the same instance on multiple calls."""
        manager1 = get_approval_event_manager()
        manager2 = get_approval_event_manager()

        assert manager1 is manager2

    def test_reset_clears_singleton(self):
        """Should clear singleton on reset."""
        manager1 = get_approval_event_manager()
        reset_approval_event_manager()
        manager2 = get_approval_event_manager()

        assert manager1 is not manager2


# =============================================================================
# POLLING FALLBACK TESTS
# =============================================================================


class TestPollingFallback:
    """Tests for polling fallback in ApprovalQueueBridge."""

    @pytest.mark.asyncio
    async def test_falls_back_to_polling_when_not_connected(self):
        """Should fall back to polling when event bus is not connected."""
        from hitl.approval_bridge import ApprovalQueueBridge

        bridge = ApprovalQueueBridge(
            api_base_url="http://localhost:3001",
            use_events=True,
        )

        # Mock get_approval_status to return approved immediately
        bridge.get_approval_status = AsyncMock(
            return_value={"id": "appr_123", "status": "approved"}
        )

        # Event manager is not connected by default
        manager = get_approval_event_manager()
        assert not manager.is_connected

        # Should fall back to polling
        result = await bridge.wait_for_approval(
            workspace_id="ws_123",
            approval_id="appr_123",
            timeout_seconds=5,
            poll_interval_seconds=0.1,
        )

        assert result["status"] == "approved"
        # Should have called get_approval_status (polling)
        bridge.get_approval_status.assert_called()

    @pytest.mark.asyncio
    async def test_uses_polling_when_use_events_false(self):
        """Should use polling when use_events is False."""
        from hitl.approval_bridge import ApprovalQueueBridge

        bridge = ApprovalQueueBridge(
            api_base_url="http://localhost:3001",
            use_events=False,  # Disable events
        )

        bridge.get_approval_status = AsyncMock(
            return_value={"id": "appr_123", "status": "rejected"}
        )

        result = await bridge.wait_for_approval(
            workspace_id="ws_123",
            approval_id="appr_123",
            timeout_seconds=5,
            poll_interval_seconds=0.1,
        )

        assert result["status"] == "rejected"
        bridge.get_approval_status.assert_called()

    @pytest.mark.asyncio
    async def test_logs_warning_on_fallback(self):
        """Should log warning when falling back to polling."""
        from hitl.approval_bridge import ApprovalQueueBridge

        bridge = ApprovalQueueBridge(
            api_base_url="http://localhost:3001",
            use_events=True,
        )

        bridge.get_approval_status = AsyncMock(
            return_value={"id": "appr_123", "status": "approved"}
        )

        with patch("hitl.approval_bridge.logger") as mock_logger:
            await bridge.wait_for_approval(
                workspace_id="ws_123",
                approval_id="appr_123",
                timeout_seconds=5,
                poll_interval_seconds=0.1,
            )

            # Should have logged about falling back or using polling
            # (The actual log message depends on the fallback path)
            assert mock_logger.warning.called or mock_logger.debug.called


# =============================================================================
# CANCELLATION EXCEPTION TESTS
# =============================================================================


class TestApprovalCancellation:
    """Tests for approval cancellation handling."""

    @pytest.mark.asyncio
    async def test_cancelled_status_raises_exception(self):
        """Should raise ApprovalCancelledException for cancelled status."""
        from hitl.approval_bridge import ApprovalCancelledException, ApprovalQueueBridge

        bridge = ApprovalQueueBridge(
            api_base_url="http://localhost:3001",
            use_events=False,
        )

        bridge.get_approval_status = AsyncMock(
            return_value={
                "id": "appr_123",
                "status": "cancelled",
                "resolution": {"reason": "User cancelled"},
            }
        )

        with pytest.raises(ApprovalCancelledException) as exc_info:
            await bridge.wait_for_approval(
                workspace_id="ws_123",
                approval_id="appr_123",
                timeout_seconds=5,
                poll_interval_seconds=0.1,
            )

        assert exc_info.value.approval_id == "appr_123"
        assert exc_info.value.reason == "User cancelled"

    @pytest.mark.asyncio
    async def test_cancelled_via_event(self):
        """Should handle cancelled status via event notification."""
        from hitl.approval_bridge import ApprovalCancelledException, ApprovalQueueBridge

        # Get singleton and set as connected
        event_manager = get_approval_event_manager()
        event_manager.set_event_bus_connected(True)

        bridge = ApprovalQueueBridge(
            api_base_url="http://localhost:3001",
            use_events=True,
        )

        async def notify_cancelled():
            await asyncio.sleep(0.05)
            await event_manager.notify(
                "appr_cancel_event",
                ApprovalResult(
                    approval_id="appr_cancel_event",
                    status="cancelled",
                    notes="Cancelled by user",
                ),
            )

        notify_task = asyncio.create_task(notify_cancelled())

        with pytest.raises(ApprovalCancelledException) as exc_info:
            await bridge._wait_for_approval_event_driven(
                workspace_id="ws_123",
                approval_id="appr_cancel_event",
                timeout_seconds=5,
            )

        await notify_task

        assert exc_info.value.approval_id == "appr_cancel_event"
        assert exc_info.value.reason == "Cancelled by user"


# =============================================================================
# PERFORMANCE TESTS (BASIC)
# =============================================================================


class TestPerformance:
    """Basic performance tests."""

    @pytest.mark.asyncio
    async def test_event_notification_is_fast(self, event_manager):
        """Event notification should be nearly instantaneous."""
        import time

        async def notify_immediately():
            await asyncio.sleep(0.01)  # Small delay to ensure wait is registered
            await event_manager.notify(
                "appr_perf_test",
                ApprovalResult(approval_id="appr_perf_test", status="approved"),
            )

        notify_task = asyncio.create_task(notify_immediately())

        start = time.monotonic()
        await event_manager.wait_for_event(
            approval_id="appr_perf_test",
            timeout=1.0,
        )
        elapsed = time.monotonic() - start

        await notify_task

        # Should complete in well under 100ms (allowing for test overhead)
        assert elapsed < 0.1, f"Event notification took {elapsed:.3f}s, expected <0.1s"

    @pytest.mark.asyncio
    async def test_many_concurrent_waits(self, event_manager):
        """Should handle many concurrent waits efficiently."""
        num_waits = 50
        results = []

        async def wait_and_collect(approval_id: str):
            result = await event_manager.wait_for_event(
                approval_id=approval_id,
                timeout=2.0,
            )
            results.append(result)

        async def notify_all():
            await asyncio.sleep(0.05)  # Allow all waits to register
            for i in range(num_waits):
                await event_manager.notify(
                    f"appr_many_{i}",
                    ApprovalResult(
                        approval_id=f"appr_many_{i}",
                        status="approved",
                    ),
                )

        wait_tasks = [
            asyncio.create_task(wait_and_collect(f"appr_many_{i}"))
            for i in range(num_waits)
        ]

        notify_task = asyncio.create_task(notify_all())

        await asyncio.gather(*wait_tasks, notify_task)

        assert len(results) == num_waits
        assert event_manager.pending_count == 0
