"""
Approval Event Gateway Unit Tests - Story DM-11.6

Tests for ApprovalEventGateway Socket.io integration.

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

from gateway.approval_events import (
    ApprovalEventGateway,
    reset_approval_event_gateway,
)
from hitl.approval_events import (
    get_approval_event_manager,
    reset_approval_event_manager,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def gateway():
    """Create a fresh ApprovalEventGateway for each test."""
    return ApprovalEventGateway(event_bus_url="ws://localhost:3001")


@pytest.fixture(autouse=True)
def reset_singletons():
    """Reset singletons before and after each test."""
    reset_approval_event_manager()
    reset_approval_event_gateway()
    yield
    reset_approval_event_manager()
    reset_approval_event_gateway()


# =============================================================================
# GATEWAY INITIALIZATION TESTS
# =============================================================================


class TestGatewayInitialization:
    """Tests for ApprovalEventGateway initialization."""

    def test_initializes_with_url(self, gateway):
        """Should initialize with event bus URL."""
        assert gateway.event_bus_url == "ws://localhost:3001"
        assert not gateway.is_connected
        assert not gateway.is_connecting

    def test_strips_trailing_slash(self):
        """Should strip trailing slash from URL."""
        gateway = ApprovalEventGateway("ws://localhost:3001/")
        assert gateway.event_bus_url == "ws://localhost:3001"

    def test_initial_health_status(self, gateway):
        """Should return proper initial health status."""
        status = gateway.get_health_status()

        assert status["connected"] is False
        assert status["connecting"] is False
        assert status["event_bus_url"] == "ws://localhost:3001"
        assert status["subscribed_workspaces"] == []
        assert status["last_event_time"] is None
        assert status["event_count"] == 0


# =============================================================================
# CONNECTION TESTS
# =============================================================================


class TestGatewayConnection:
    """Tests for gateway connection handling."""

    @pytest.mark.asyncio
    async def test_connect_sets_flags_correctly(self, gateway):
        """Should set connected flag after connection."""
        # Test initial state
        assert not gateway._connected
        assert not gateway._connecting

    @pytest.mark.asyncio
    async def test_connect_handles_import_error(self, gateway):
        """Should handle socketio import error gracefully."""
        with patch.dict("sys.modules", {"socketio": None}):
            with patch("builtins.__import__", side_effect=ImportError("No module named 'socketio'")):
                result = await gateway.connect()
                assert result is False
                assert not gateway.is_connected

    @pytest.mark.asyncio
    async def test_connect_already_connected(self, gateway):
        """Should return True if already connected."""
        gateway._connected = True

        result = await gateway.connect()

        assert result is True

    @pytest.mark.asyncio
    async def test_disconnect_cleans_up(self, gateway):
        """Should clean up on disconnect."""
        gateway._connected = True
        gateway._subscribed_workspaces = {"ws_123", "ws_456"}
        gateway._sio = MagicMock()
        gateway._sio.disconnect = AsyncMock()

        await gateway.disconnect()

        assert not gateway.is_connected
        assert gateway._sio is None
        assert len(gateway._subscribed_workspaces) == 0


# =============================================================================
# EVENT PROCESSING TESTS
# =============================================================================


class TestEventProcessing:
    """Tests for approval event processing."""

    @pytest.mark.asyncio
    async def test_process_approval_event_approved(self, gateway):
        """Should process approved event correctly."""
        event_manager = get_approval_event_manager()

        # Set up a waiter
        wait_task = asyncio.create_task(
            event_manager.wait_for_event("appr_123", timeout=1.0)
        )
        await asyncio.sleep(0.01)

        # Process event
        await gateway._process_approval_event({
            "id": "appr_123",
            "status": "approved",
            "decidedById": "user_456",
            "decisionNotes": "Approved by manager",
            "decidedAt": "2026-01-01T12:00:00Z",
        })

        result = await wait_task

        assert result.approval_id == "appr_123"
        assert result.status == "approved"
        assert result.resolved_by == "user_456"
        assert result.notes == "Approved by manager"

    @pytest.mark.asyncio
    async def test_process_approval_event_rejected(self, gateway):
        """Should process rejected event correctly."""
        event_manager = get_approval_event_manager()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event("appr_reject", timeout=1.0)
        )
        await asyncio.sleep(0.01)

        await gateway._process_approval_event({
            "id": "appr_reject",
            "status": "rejected",
            "resolvedBy": "user_789",
            "resolution": {"reason": "Does not meet policy"},
        })

        result = await wait_task

        assert result.approval_id == "appr_reject"
        assert result.status == "rejected"
        assert result.resolved_by == "user_789"

    @pytest.mark.asyncio
    async def test_process_approval_event_cancelled(self, gateway):
        """Should process cancelled event correctly."""
        event_manager = get_approval_event_manager()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event("appr_cancel", timeout=1.0)
        )
        await asyncio.sleep(0.01)

        await gateway._process_approval_event({
            "id": "appr_cancel",
            "status": "cancelled",
            "decisionNotes": "Cancelled by requester",
        })

        result = await wait_task

        assert result.approval_id == "appr_cancel"
        assert result.status == "cancelled"

    @pytest.mark.asyncio
    async def test_process_approval_event_auto_approved(self, gateway):
        """Should process auto_approved event correctly."""
        event_manager = get_approval_event_manager()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event("appr_auto", timeout=1.0)
        )
        await asyncio.sleep(0.01)

        await gateway._process_approval_event({
            "id": "appr_auto",
            "status": "auto_approved",
        })

        result = await wait_task

        assert result.approval_id == "appr_auto"
        assert result.status == "auto_approved"

    @pytest.mark.asyncio
    async def test_ignores_non_resolved_status(self, gateway):
        """Should ignore events with non-resolved status."""
        event_manager = get_approval_event_manager()

        # This should not notify anyone
        await gateway._process_approval_event({
            "id": "appr_pending",
            "status": "pending",  # Not a resolved status
        })

        # No result should be stored
        assert "appr_pending" not in event_manager._results

    @pytest.mark.asyncio
    async def test_ignores_missing_id(self, gateway):
        """Should ignore events missing approval ID."""
        # Should not raise, just log warning
        await gateway._process_approval_event({
            "status": "approved",
        })

    @pytest.mark.asyncio
    async def test_handles_approvalId_field_name(self, gateway):
        """Should handle approvalId field name (alternative naming)."""
        event_manager = get_approval_event_manager()

        wait_task = asyncio.create_task(
            event_manager.wait_for_event("appr_camel", timeout=1.0)
        )
        await asyncio.sleep(0.01)

        await gateway._process_approval_event({
            "approvalId": "appr_camel",  # Using camelCase
            "status": "approved",
        })

        result = await wait_task

        assert result.approval_id == "appr_camel"
        assert result.status == "approved"

    @pytest.mark.asyncio
    async def test_updates_event_count(self, gateway):
        """Should update event count on processing."""
        initial_count = gateway._event_count

        await gateway._process_approval_event({
            "id": "appr_count_1",
            "status": "approved",
        })

        assert gateway._event_count == initial_count + 1

        await gateway._process_approval_event({
            "id": "appr_count_2",
            "status": "rejected",
        })

        assert gateway._event_count == initial_count + 2

    @pytest.mark.asyncio
    async def test_updates_last_event_time(self, gateway):
        """Should update last event time on processing."""
        assert gateway._last_event_time is None

        await gateway._process_approval_event({
            "id": "appr_time",
            "status": "approved",
        })

        assert gateway._last_event_time is not None
        assert isinstance(gateway._last_event_time, datetime)


# =============================================================================
# WORKSPACE SUBSCRIPTION TESTS
# =============================================================================


class TestWorkspaceSubscription:
    """Tests for workspace subscription handling."""

    @pytest.mark.asyncio
    async def test_subscribe_when_not_connected(self, gateway):
        """Should return False when not connected."""
        result = await gateway.subscribe_to_workspace("ws_123")
        assert result is False

    @pytest.mark.asyncio
    async def test_subscribe_when_connected(self, gateway):
        """Should emit join event when connected."""
        gateway._connected = True
        gateway._sio = MagicMock()
        gateway._sio.emit = AsyncMock()

        result = await gateway.subscribe_to_workspace("ws_123")

        assert result is True
        assert "ws_123" in gateway._subscribed_workspaces
        gateway._sio.emit.assert_called_once_with("join", {"room": "workspace:ws_123"})

    @pytest.mark.asyncio
    async def test_unsubscribe_when_connected(self, gateway):
        """Should emit leave event when connected."""
        gateway._connected = True
        gateway._subscribed_workspaces.add("ws_123")
        gateway._sio = MagicMock()
        gateway._sio.emit = AsyncMock()

        await gateway.unsubscribe_from_workspace("ws_123")

        assert "ws_123" not in gateway._subscribed_workspaces
        gateway._sio.emit.assert_called_once_with("leave", {"room": "workspace:ws_123"})


# =============================================================================
# HEALTH STATUS TESTS
# =============================================================================


class TestHealthStatus:
    """Tests for gateway health status."""

    def test_health_status_when_connected(self, gateway):
        """Should return connected status."""
        gateway._connected = True
        gateway._subscribed_workspaces = {"ws_123", "ws_456"}
        gateway._last_event_time = datetime(2026, 1, 1, 12, 0, 0)
        gateway._event_count = 42

        status = gateway.get_health_status()

        assert status["connected"] is True
        assert set(status["subscribed_workspaces"]) == {"ws_123", "ws_456"}
        assert status["last_event_time"] == "2026-01-01T12:00:00"
        assert status["event_count"] == 42

    def test_health_status_when_disconnected(self, gateway):
        """Should return disconnected status."""
        status = gateway.get_health_status()

        assert status["connected"] is False
        assert status["subscribed_workspaces"] == []


# =============================================================================
# EVENT HANDLER TESTS
# =============================================================================


class TestEventHandlers:
    """Tests for Socket.io event handlers."""

    @pytest.mark.asyncio
    async def test_on_connect_sets_connected(self, gateway):
        """Should set connected flag on connect."""
        await gateway._on_connect()

        assert gateway._connected is True

    @pytest.mark.asyncio
    async def test_on_disconnect_clears_connected(self, gateway):
        """Should clear connected flag on disconnect."""
        gateway._connected = True

        await gateway._on_disconnect()

        assert gateway._connected is False

    @pytest.mark.asyncio
    async def test_on_connect_error_clears_flags(self, gateway):
        """Should clear flags on connect error."""
        gateway._connected = True
        gateway._connecting = True

        await gateway._on_connect_error({"error": "connection failed"})

        assert gateway._connected is False
        assert gateway._connecting is False

    @pytest.mark.asyncio
    async def test_on_connect_resubscribes_workspaces(self, gateway):
        """Should re-subscribe to workspaces on reconnect."""
        gateway._subscribed_workspaces = {"ws_123", "ws_456"}
        gateway._sio = MagicMock()
        gateway._sio.emit = AsyncMock()

        await gateway._on_connect()

        # Should have emitted join for each workspace
        assert gateway._sio.emit.call_count == 2


# =============================================================================
# SINGLETON TESTS
# =============================================================================


class TestSingleton:
    """Tests for gateway singleton pattern."""

    @pytest.mark.asyncio
    async def test_reset_clears_singleton(self):
        """Should clear singleton on reset."""
        # Just test that reset doesn't throw
        reset_approval_event_gateway()
        # Calling again shouldn't throw
        reset_approval_event_gateway()
