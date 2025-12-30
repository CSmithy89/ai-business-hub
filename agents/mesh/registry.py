"""
Agent Registry

Central registry for agent discovery and management in the Universal Agent Mesh.
Maintains a catalog of all available agents (internal and external) and provides
discovery, health checking, and routing capabilities.

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from .models import AgentHealth, MeshAgentCard

logger = logging.getLogger(__name__)


class RegistryEvent:
    """Event type constants for registry notifications."""

    REGISTER = "register"
    UNREGISTER = "unregister"
    HEALTH_UPDATE = "health_update"


class AgentRegistry:
    """
    Central registry for agent discovery and management.

    Maintains a catalog of all available agents (internal and external)
    and provides discovery, health checking, and routing capabilities.

    Features:
    - Agent registration and unregistration with notifications
    - Health status tracking per agent
    - Filtering by module, capability, and health status
    - Subscription system for registry change notifications
    - Thread-safe operations

    Usage:
        registry = AgentRegistry()
        registry.register(agent_card)

        # Query agents
        pm_agents = registry.list_by_module("pm")
        healthy = registry.list_healthy()

        # Subscribe to changes
        queue = registry.subscribe()
        async for event in queue:
            print(f"Registry changed: {event}")
    """

    def __init__(self) -> None:
        """Initialize an empty agent registry."""
        self._agents: Dict[str, MeshAgentCard] = {}
        self._health_status: Dict[str, AgentHealth] = {}
        self._subscribers: Set[asyncio.Queue] = set()
        self._lock = threading.RLock()

    def register(self, agent: MeshAgentCard) -> None:
        """
        Register an agent in the registry.

        Adds the agent to the registry with healthy status by default.
        Notifies all subscribers of the registration.

        Args:
            agent: The MeshAgentCard to register

        Note:
            If an agent with the same name already exists, it will be updated.
        """
        with self._lock:
            is_update = agent.name in self._agents
            self._agents[agent.name] = agent
            self._health_status[agent.name] = AgentHealth.HEALTHY
            agent.health = AgentHealth.HEALTHY

            action = "updated" if is_update else "registered"
            logger.info(f"Agent {action}: {agent.name} (module={agent.module})")

            self._notify_sync(RegistryEvent.REGISTER, agent.name)

    def unregister(self, agent_name: str) -> bool:
        """
        Remove an agent from the registry.

        Notifies all subscribers of the removal.

        Args:
            agent_name: Name of the agent to remove

        Returns:
            True if agent was found and removed, False otherwise
        """
        with self._lock:
            if agent_name not in self._agents:
                logger.warning(f"Cannot unregister unknown agent: {agent_name}")
                return False

            del self._agents[agent_name]
            self._health_status.pop(agent_name, None)

            logger.info(f"Agent unregistered: {agent_name}")
            self._notify_sync(RegistryEvent.UNREGISTER, agent_name)
            return True

    def get(self, agent_name: str) -> Optional[MeshAgentCard]:
        """
        Get an agent by name.

        Updates the agent's last_seen timestamp when accessed.

        Args:
            agent_name: Name of the agent to retrieve

        Returns:
            The MeshAgentCard if found, None otherwise
        """
        with self._lock:
            agent = self._agents.get(agent_name)
            if agent:
                agent.update_last_seen()
            return agent

    def list_all(self) -> List[MeshAgentCard]:
        """
        List all registered agents.

        Returns:
            List of all MeshAgentCards in the registry
        """
        with self._lock:
            return list(self._agents.values())

    def list_by_module(self, module: str) -> List[MeshAgentCard]:
        """
        List agents for a specific module.

        Args:
            module: Module name to filter by (e.g., "pm", "kb", "crm")

        Returns:
            List of agents belonging to the specified module
        """
        with self._lock:
            return [
                agent for agent in self._agents.values()
                if agent.module == module
            ]

    def list_by_capability(self, capability_id: str) -> List[MeshAgentCard]:
        """
        List agents with a specific capability.

        Args:
            capability_id: The capability ID to filter by

        Returns:
            List of agents that have the specified capability
        """
        with self._lock:
            return [
                agent for agent in self._agents.values()
                if agent.has_capability(capability_id)
            ]

    def list_healthy(self) -> List[MeshAgentCard]:
        """
        List all healthy agents.

        Returns:
            List of agents with HEALTHY status
        """
        with self._lock:
            return [
                agent for agent in self._agents.values()
                if self._health_status.get(agent.name) == AgentHealth.HEALTHY
            ]

    def list_external(self) -> List[MeshAgentCard]:
        """
        List all external agents.

        Returns:
            List of agents marked as external
        """
        with self._lock:
            return [
                agent for agent in self._agents.values()
                if agent.is_external
            ]

    def list_internal(self) -> List[MeshAgentCard]:
        """
        List all internal agents.

        Returns:
            List of agents not marked as external
        """
        with self._lock:
            return [
                agent for agent in self._agents.values()
                if not agent.is_external
            ]

    def update_health(self, agent_name: str, healthy: bool) -> bool:
        """
        Update agent health status.

        Args:
            agent_name: Name of the agent
            healthy: True for HEALTHY, False for UNHEALTHY

        Returns:
            True if agent was found and updated, False otherwise
        """
        with self._lock:
            if agent_name not in self._agents:
                logger.warning(f"Cannot update health for unknown agent: {agent_name}")
                return False

            new_status = AgentHealth.HEALTHY if healthy else AgentHealth.UNHEALTHY
            old_status = self._health_status.get(agent_name, AgentHealth.UNKNOWN)

            if old_status != new_status:
                self._health_status[agent_name] = new_status
                self._agents[agent_name].health = new_status
                logger.info(f"Agent health updated: {agent_name} -> {new_status.value}")
                self._notify_sync(RegistryEvent.HEALTH_UPDATE, agent_name)

            return True

    def set_health(self, agent_name: str, health: AgentHealth) -> bool:
        """
        Set agent health to a specific status.

        Args:
            agent_name: Name of the agent
            health: The AgentHealth status to set

        Returns:
            True if agent was found and updated, False otherwise
        """
        with self._lock:
            if agent_name not in self._agents:
                logger.warning(f"Cannot set health for unknown agent: {agent_name}")
                return False

            old_status = self._health_status.get(agent_name, AgentHealth.UNKNOWN)

            if old_status != health:
                self._health_status[agent_name] = health
                self._agents[agent_name].health = health
                logger.info(f"Agent health set: {agent_name} -> {health.value}")
                self._notify_sync(RegistryEvent.HEALTH_UPDATE, agent_name)

            return True

    def is_healthy(self, agent_name: str) -> bool:
        """
        Check if an agent is healthy.

        Args:
            agent_name: Name of the agent to check

        Returns:
            True if agent exists and is healthy, False otherwise
        """
        with self._lock:
            return self._health_status.get(agent_name) == AgentHealth.HEALTHY

    def get_health(self, agent_name: str) -> AgentHealth:
        """
        Get the health status of an agent.

        Args:
            agent_name: Name of the agent

        Returns:
            The AgentHealth status, or UNKNOWN if agent not found
        """
        with self._lock:
            return self._health_status.get(agent_name, AgentHealth.UNKNOWN)

    def subscribe(self) -> asyncio.Queue:
        """
        Subscribe to registry changes.

        Returns an async queue that will receive events when agents
        are registered, unregistered, or have health status changes.

        Event format:
            {
                "action": "register" | "unregister" | "health_update",
                "agent": "agent_name",
                "timestamp": "2025-01-01T00:00:00Z"
            }

        Returns:
            asyncio.Queue for receiving change events
        """
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        with self._lock:
            self._subscribers.add(queue)
        logger.debug(f"New registry subscriber (total: {len(self._subscribers)})")
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        """
        Unsubscribe from registry changes.

        Args:
            queue: The queue returned from subscribe()
        """
        with self._lock:
            self._subscribers.discard(queue)
        logger.debug(f"Registry subscriber removed (total: {len(self._subscribers)})")

    def _notify_sync(self, action: str, agent_name: str) -> None:
        """
        Notify subscribers of a registry change (synchronous version).

        Args:
            action: The action type (register, unregister, health_update)
            agent_name: Name of the affected agent
        """
        event = {
            "action": action,
            "agent": agent_name,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # Skip if queue is full (subscriber not consuming fast enough)
                logger.warning(f"Subscriber queue full, dropping event for {agent_name}")

    async def _notify_async(self, action: str, agent_name: str) -> None:
        """
        Notify subscribers of a registry change (async version).

        Args:
            action: The action type (register, unregister, health_update)
            agent_name: Name of the affected agent
        """
        self._notify_sync(action, agent_name)

    def count(self) -> int:
        """
        Get the total number of registered agents.

        Returns:
            Number of agents in the registry
        """
        with self._lock:
            return len(self._agents)

    def contains(self, agent_name: str) -> bool:
        """
        Check if an agent is registered.

        Args:
            agent_name: Name of the agent to check

        Returns:
            True if agent is registered, False otherwise
        """
        with self._lock:
            return agent_name in self._agents

    def clear(self) -> None:
        """
        Clear all agents from the registry.

        Does not notify subscribers of individual removals.
        """
        with self._lock:
            count = len(self._agents)
            self._agents.clear()
            self._health_status.clear()
            logger.info(f"Registry cleared ({count} agents removed)")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get registry statistics.

        Returns:
            Dict with registry statistics
        """
        with self._lock:
            healthy_count = sum(
                1 for status in self._health_status.values()
                if status == AgentHealth.HEALTHY
            )
            external_count = sum(
                1 for agent in self._agents.values()
                if agent.is_external
            )

            modules: Dict[str, int] = {}
            for agent in self._agents.values():
                if agent.module:
                    modules[agent.module] = modules.get(agent.module, 0) + 1

            return {
                "total": len(self._agents),
                "healthy": healthy_count,
                "unhealthy": len(self._agents) - healthy_count,
                "external": external_count,
                "internal": len(self._agents) - external_count,
                "modules": modules,
                "subscribers": len(self._subscribers),
            }


# =============================================================================
# GLOBAL SINGLETON
# =============================================================================

_registry: Optional[AgentRegistry] = None
_registry_lock = threading.Lock()


def get_registry() -> AgentRegistry:
    """
    Get the global agent registry singleton.

    Thread-safe singleton accessor. Creates the registry on first access.

    Returns:
        The global AgentRegistry instance

    Example:
        registry = get_registry()
        registry.register(agent_card)
    """
    global _registry

    if _registry is None:
        with _registry_lock:
            # Double-check after acquiring lock
            if _registry is None:
                _registry = AgentRegistry()
                logger.info("Global agent registry initialized")

    return _registry


def reset_registry() -> None:
    """
    Reset the global registry singleton.

    Primarily useful for testing. Clears and recreates the global registry.
    """
    global _registry

    with _registry_lock:
        if _registry is not None:
            _registry.clear()
        _registry = None
        logger.info("Global agent registry reset")
