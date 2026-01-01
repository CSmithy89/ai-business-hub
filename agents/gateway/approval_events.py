"""
Approval Event Gateway

Handles approval event routing between the Foundation event bus
and the agent HITL system. Subscribes to approval resolution events
and dispatches them to the ApprovalEventManager.

The gateway connects to the Foundation Socket.io server and listens
for approval.updated events. When an approval is resolved, it notifies
the ApprovalEventManager which wakes any waiting coroutines.

Connection Handling:
- Auto-reconnection with exponential backoff
- Graceful degradation to polling on connection failure
- Health status tracking for monitoring

@see docs/modules/bm-dm/stories/dm-11-6-event-driven-approvals.md
Epic: DM-11 | Story: DM-11.6
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


# =============================================================================
# APPROVAL EVENT GATEWAY
# =============================================================================


class ApprovalEventGateway:
    """
    Gateway for approval events between Foundation and agents.

    Connects to the Foundation Socket.io event bus and forwards
    approval resolution events to the ApprovalEventManager.

    Usage:
        gateway = ApprovalEventGateway(event_bus_url="ws://localhost:3001")
        await gateway.connect()

        # Gateway automatically forwards events to ApprovalEventManager

        await gateway.disconnect()

    Connection States:
        - disconnected: Not connected to event bus
        - connecting: Connection in progress
        - connected: Connected and subscribed to events
        - reconnecting: Connection lost, attempting to reconnect
    """

    def __init__(self, event_bus_url: str):
        """
        Initialize the approval event gateway.

        Args:
            event_bus_url: WebSocket URL for the Foundation event bus
                          (e.g., "ws://localhost:3001" or "http://localhost:3001")
        """
        self.event_bus_url = event_bus_url.rstrip("/")
        self._sio: Optional[object] = None  # Type: socketio.AsyncClient
        self._connected: bool = False
        self._connecting: bool = False
        self._reconnect_task: Optional[asyncio.Task] = None
        self._subscribed_workspaces: set[str] = set()
        self._last_event_time: Optional[datetime] = None
        self._event_count: int = 0

    async def connect(self) -> bool:
        """
        Connect to the event bus and subscribe to approval events.

        Returns:
            True if connection successful, False otherwise
        """
        if self._connected:
            logger.debug("Already connected to approval event bus")
            return True

        if self._connecting:
            logger.debug("Connection already in progress")
            return False

        self._connecting = True

        try:
            # Import socketio here to avoid import errors if not installed
            try:
                import socketio
            except ImportError:
                logger.error(
                    "python-socketio not installed. Install with: "
                    "pip install python-socketio[asyncio_client]"
                )
                return False

            self._sio = socketio.AsyncClient(
                reconnection=True,
                reconnection_attempts=0,  # Infinite reconnection attempts
                reconnection_delay=1,
                reconnection_delay_max=30,
                logger=False,
            )

            # Register event handlers
            self._sio.on("connect", self._on_connect)
            self._sio.on("disconnect", self._on_disconnect)
            self._sio.on("connect_error", self._on_connect_error)

            # Approval events
            self._sio.on("approval.updated", self._on_approval_updated)
            self._sio.on("approval:resolved", self._on_approval_resolved)

            # Connect to the server
            logger.info(f"Connecting to approval event bus: {self.event_bus_url}")
            await self._sio.connect(
                self.event_bus_url,
                wait=True,
                wait_timeout=10,
            )

            self._connected = True
            self._connecting = False
            logger.info("Connected to approval event bus")

            # Update event manager connection status
            self._update_event_manager_status(connected=True)

            return True

        except Exception as e:
            logger.error(f"Failed to connect to event bus: {e}")
            self._connecting = False
            self._connected = False
            self._update_event_manager_status(connected=False)
            return False

    async def disconnect(self) -> None:
        """Disconnect from the event bus."""
        if self._sio is not None:
            try:
                await self._sio.disconnect()
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")
            finally:
                self._sio = None
                self._connected = False
                self._connecting = False
                self._subscribed_workspaces.clear()
                self._update_event_manager_status(connected=False)
                logger.info("Disconnected from approval event bus")

        # Cancel reconnect task if running
        if self._reconnect_task and not self._reconnect_task.done():
            self._reconnect_task.cancel()
            try:
                await self._reconnect_task
            except asyncio.CancelledError:
                pass
            self._reconnect_task = None

    async def subscribe_to_workspace(self, workspace_id: str) -> bool:
        """
        Subscribe to approval events for a specific workspace.

        Args:
            workspace_id: The workspace ID to subscribe to

        Returns:
            True if subscription successful, False otherwise
        """
        if not self._connected or self._sio is None:
            logger.warning(f"Cannot subscribe to {workspace_id}: not connected")
            return False

        try:
            room = f"workspace:{workspace_id}"
            await self._sio.emit("join", {"room": room})
            self._subscribed_workspaces.add(workspace_id)
            logger.debug(f"Subscribed to workspace: {workspace_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to subscribe to workspace {workspace_id}: {e}")
            return False

    async def unsubscribe_from_workspace(self, workspace_id: str) -> None:
        """
        Unsubscribe from approval events for a workspace.

        Args:
            workspace_id: The workspace ID to unsubscribe from
        """
        if not self._connected or self._sio is None:
            return

        try:
            room = f"workspace:{workspace_id}"
            await self._sio.emit("leave", {"room": room})
            self._subscribed_workspaces.discard(workspace_id)
            logger.debug(f"Unsubscribed from workspace: {workspace_id}")
        except Exception as e:
            logger.warning(f"Failed to unsubscribe from workspace {workspace_id}: {e}")

    # =========================================================================
    # EVENT HANDLERS
    # =========================================================================

    async def _on_connect(self) -> None:
        """Handle connection to event bus."""
        self._connected = True
        self._connecting = False
        logger.info("Approval event gateway connected")
        self._update_event_manager_status(connected=True)

        # Re-subscribe to workspaces after reconnection
        for workspace_id in list(self._subscribed_workspaces):
            try:
                room = f"workspace:{workspace_id}"
                await self._sio.emit("join", {"room": room})
                logger.debug(f"Re-subscribed to workspace: {workspace_id}")
            except Exception as e:
                logger.warning(f"Failed to re-subscribe to {workspace_id}: {e}")

    async def _on_disconnect(self) -> None:
        """Handle disconnection from event bus."""
        self._connected = False
        logger.warning("Approval event gateway disconnected")
        self._update_event_manager_status(connected=False)

    async def _on_connect_error(self, data: dict) -> None:
        """Handle connection error."""
        self._connected = False
        self._connecting = False
        logger.error(f"Approval event gateway connection error: {data}")
        self._update_event_manager_status(connected=False)

    async def _on_approval_updated(self, data: dict) -> None:
        """
        Handle approval.updated event from Foundation.

        This is the main event format from the Foundation realtime gateway.
        """
        await self._process_approval_event(data)

    async def _on_approval_resolved(self, data: dict) -> None:
        """
        Handle approval:resolved event (alternative event name).

        Some event bus configurations may use this event name.
        """
        await self._process_approval_event(data)

    async def _process_approval_event(self, data: dict) -> None:
        """
        Process an approval resolution event.

        Dispatches the event to the ApprovalEventManager to wake
        any waiting coroutines.

        Args:
            data: Event data containing approval resolution details
        """
        # Extract approval info (handle different field naming conventions)
        approval_id = data.get("id") or data.get("approvalId")
        status = data.get("status")

        if not approval_id:
            logger.warning(f"Invalid approval event - missing id: {data}")
            return

        # Only process resolved statuses
        resolved_statuses = {"approved", "rejected", "cancelled", "auto_approved"}
        if status not in resolved_statuses:
            logger.debug(f"Ignoring approval event with status: {status}")
            return

        logger.debug(f"Processing approval event: {approval_id} -> {status}")

        # Build resolution details
        resolution = data.get("resolution") or {}
        if "decision" in data:
            resolution["decision"] = data["decision"]
        if "decisionNotes" in data:
            resolution["notes"] = data["decisionNotes"]

        # Extract resolver info
        resolved_by = (
            data.get("resolvedBy")
            or data.get("decidedById")
            or data.get("decidedBy")
        )
        resolved_at_str = data.get("resolvedAt") or data.get("decidedAt")
        resolved_at = None
        if resolved_at_str:
            try:
                resolved_at = datetime.fromisoformat(resolved_at_str.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                resolved_at = datetime.utcnow()
        else:
            resolved_at = datetime.utcnow()

        notes = (
            data.get("decisionNotes")
            or (resolution.get("notes") if isinstance(resolution, dict) else None)
        )

        # Update tracking
        self._last_event_time = datetime.utcnow()
        self._event_count += 1

        # Import here to avoid circular imports
        from hitl.approval_events import ApprovalResult, get_approval_event_manager

        # Create result and notify
        result = ApprovalResult(
            approval_id=approval_id,
            status=status,
            resolution=resolution if resolution else None,
            resolved_at=resolved_at,
            resolved_by=resolved_by,
            notes=notes,
        )

        event_manager = get_approval_event_manager()
        await event_manager.notify(approval_id, result)

        logger.info(f"Approval {approval_id} resolved via event: {status}")

    # =========================================================================
    # STATUS AND HEALTH
    # =========================================================================

    def _update_event_manager_status(self, connected: bool) -> None:
        """Update the event manager's connection status."""
        try:
            from hitl.approval_events import get_approval_event_manager
            manager = get_approval_event_manager()
            manager.set_event_bus_connected(connected)
        except Exception as e:
            logger.debug(f"Could not update event manager status: {e}")

    @property
    def is_connected(self) -> bool:
        """Whether connected to the event bus."""
        return self._connected

    @property
    def is_connecting(self) -> bool:
        """Whether a connection attempt is in progress."""
        return self._connecting

    def get_health_status(self) -> dict:
        """
        Get health status of the gateway.

        Returns:
            Dictionary with health information
        """
        return {
            "connected": self._connected,
            "connecting": self._connecting,
            "event_bus_url": self.event_bus_url,
            "subscribed_workspaces": list(self._subscribed_workspaces),
            "last_event_time": (
                self._last_event_time.isoformat() if self._last_event_time else None
            ),
            "event_count": self._event_count,
        }


# =============================================================================
# SINGLETON PATTERN
# =============================================================================

_gateway: Optional[ApprovalEventGateway] = None


async def get_approval_event_gateway() -> ApprovalEventGateway:
    """
    Get the singleton approval event gateway.

    Creates and connects the gateway on first call.

    Returns:
        Connected ApprovalEventGateway instance
    """
    global _gateway
    if _gateway is None:
        from agents.config import get_settings

        settings = get_settings()
        # Derive event bus URL from API base URL
        # Convert http:// to ws:// for WebSocket connection
        api_url = settings.api_base_url
        if api_url.startswith("https://"):
            event_bus_url = api_url.replace("https://", "wss://")
        elif api_url.startswith("http://"):
            event_bus_url = api_url.replace("http://", "ws://")
        else:
            event_bus_url = f"ws://{api_url}"

        # Check if settings has event_bus_url override
        if hasattr(settings, "event_bus_url") and settings.event_bus_url:
            event_bus_url = settings.event_bus_url

        _gateway = ApprovalEventGateway(event_bus_url)
        success = await _gateway.connect()
        if not success:
            logger.warning("Failed to connect approval event gateway - polling fallback will be used")

    return _gateway


async def close_approval_event_gateway() -> None:
    """Close the singleton gateway."""
    global _gateway
    if _gateway is not None:
        await _gateway.disconnect()
        _gateway = None
        logger.info("Approval event gateway closed")


def reset_approval_event_gateway() -> None:
    """
    Reset the singleton for testing purposes.

    This clears the global instance without attempting to disconnect.
    """
    global _gateway
    _gateway = None
