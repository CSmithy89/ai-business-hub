"""
AgentOS Health Check Support

Provides health check utilities for monitoring interface status.
This module enables monitoring of AG-UI and A2A interface health
across all configured agents.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import logging

from .config import INTERFACE_CONFIGS, get_agentos_settings
from .factory import get_all_interface_paths
from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class InterfaceHealthStatus:
    """Health status for an interface.

    Represents the health status of a single interface (AG-UI or A2A)
    with details about its configuration and any errors.

    Attributes:
        interface_type: Type of interface ('agui' or 'a2a')
        path: Endpoint path for the interface
        is_healthy: Whether the interface is considered healthy
        error: Error message if interface is unhealthy
        checked_at: Timestamp when health was checked
    """

    def __init__(
        self,
        interface_type: str,
        path: str,
        is_healthy: bool = True,
        error: Optional[str] = None,
    ):
        """Initialize interface health status.

        Args:
            interface_type: Type of interface ('agui' or 'a2a')
            path: Endpoint path for the interface
            is_healthy: Whether the interface is considered healthy
            error: Error message if interface is unhealthy
        """
        self.interface_type = interface_type
        self.path = path
        self.is_healthy = is_healthy
        self.error = error
        self.checked_at = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert health status to dictionary.

        Returns:
            Dictionary representation of the health status
        """
        return {
            "type": self.interface_type,
            "path": self.path,
            "healthy": self.is_healthy,
            "error": self.error,
            "checked_at": self.checked_at.isoformat(),
        }


def get_interfaces_health() -> Dict[str, Any]:
    """
    Get health status of all configured interfaces.

    Checks the health of all AG-UI and A2A interfaces based on
    their configuration and global enable flags.

    Returns:
        Dictionary with interface health information including:
        - status: Overall health status ('healthy' or 'degraded')
        - healthy_count: Number of healthy interfaces
        - total_count: Total number of interfaces
        - interfaces: List of individual interface health statuses
        - settings: Current AgentOS settings
        - protocol_versions: Protocol version information
        - checked_at: Timestamp of health check
    """
    settings = get_agentos_settings()
    paths = get_all_interface_paths()

    interfaces_status: List[Dict[str, Any]] = []
    healthy_count = 0
    total_count = 0

    for agent_id, agent_paths in paths.items():
        if agent_paths.get("agui"):
            total_count += 1
            status = InterfaceHealthStatus(
                interface_type="agui",
                path=agent_paths["agui"],
                is_healthy=settings.agui_enabled,
                error=None if settings.agui_enabled else "AG-UI globally disabled",
            )
            interfaces_status.append({"agent_id": agent_id, **status.to_dict()})
            if status.is_healthy:
                healthy_count += 1

        if agent_paths.get("a2a"):
            total_count += 1
            status = InterfaceHealthStatus(
                interface_type="a2a",
                path=agent_paths["a2a"],
                is_healthy=settings.a2a_enabled,
                error=None if settings.a2a_enabled else "A2A globally disabled",
            )
            interfaces_status.append({"agent_id": agent_id, **status.to_dict()})
            if status.is_healthy:
                healthy_count += 1

    return {
        "status": "healthy" if healthy_count == total_count else "degraded",
        "healthy_count": healthy_count,
        "total_count": total_count,
        "interfaces": interfaces_status,
        "settings": {
            "agui_enabled": settings.agui_enabled,
            "a2a_enabled": settings.a2a_enabled,
            "base_url": settings.base_url,
            "debug": settings.debug,
        },
        "protocol_versions": {
            "agui": DMConstants.AGUI.PROTOCOL_VERSION,
            "a2a": DMConstants.A2A.PROTOCOL_VERSION,
        },
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


def get_interface_health_summary() -> Dict[str, Any]:
    """
    Get a brief summary of interface health.

    Returns a simplified health summary suitable for quick status checks.

    Returns:
        Dictionary with summary health information:
        - status: Overall status ('healthy', 'degraded', 'unhealthy')
        - agui_interfaces: Count of AG-UI interfaces
        - a2a_interfaces: Count of A2A interfaces
        - healthy_interfaces: Count of healthy interfaces
    """
    paths = get_all_interface_paths()
    settings = get_agentos_settings()

    agui_count = sum(1 for p in paths.values() if p.get("agui"))
    a2a_count = sum(1 for p in paths.values() if p.get("a2a"))

    healthy_agui = agui_count if settings.agui_enabled else 0
    healthy_a2a = a2a_count if settings.a2a_enabled else 0
    healthy_total = healthy_agui + healthy_a2a
    total = agui_count + a2a_count

    if healthy_total == total:
        status = "healthy"
    elif healthy_total > 0:
        status = "degraded"
    else:
        status = "unhealthy"

    return {
        "status": status,
        "agui_interfaces": agui_count,
        "a2a_interfaces": a2a_count,
        "healthy_interfaces": healthy_total,
        "total_interfaces": total,
    }


def check_interface_enabled(agent_id: str, interface_type: str) -> bool:
    """
    Check if a specific interface is enabled for an agent.

    Args:
        agent_id: The agent identifier
        interface_type: Type of interface ('agui' or 'a2a')

    Returns:
        True if the interface is enabled, False otherwise
    """
    settings = get_agentos_settings()
    paths = get_all_interface_paths()

    agent_paths = paths.get(agent_id, {})

    if interface_type == "agui":
        return bool(agent_paths.get("agui")) and settings.agui_enabled
    elif interface_type == "a2a":
        return bool(agent_paths.get("a2a")) and settings.a2a_enabled
    else:
        logger.warning(f"Unknown interface type: {interface_type}")
        return False
