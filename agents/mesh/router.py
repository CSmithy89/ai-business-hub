"""
Mesh Router

Routes requests to agents in the Universal Agent Mesh. Provides intelligent
routing based on agent capabilities, health status, module preference,
and load balancing strategies.

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5
"""
import asyncio
import logging
from typing import Any, Dict, List, Optional

from .models import AgentHealth, MeshAgentCard
from .registry import get_registry

logger = logging.getLogger(__name__)


class RoutingError(Exception):
    """Base exception for routing errors."""

    pass


class NoAgentFoundError(RoutingError):
    """Raised when no suitable agent can be found for a task."""

    pass


class MeshRouter:
    """
    Routes requests to agents in the mesh.

    Provides intelligent routing based on:
    - Agent capabilities and skills
    - Agent health status
    - Module preference
    - Internal vs external preference
    - Load balancing strategies

    Routing Priority:
    1. Preferred module (if specified)
    2. Capability match
    3. Health filter (only healthy agents)
    4. Internal preference (internal > external)
    5. Fallback to any healthy agent

    Usage:
        router = MeshRouter()

        # Find best agent for a task
        agent = router.find_agent_for_task("planning", preferred_module="pm")

        # Route a request
        result = await router.route_request(
            task_type="planning",
            message="Create project plan",
            preferred_module="pm",
        )

        # Broadcast to multiple agents
        results = await router.broadcast_request(
            message="Get status update",
            module_filter="pm",
        )
    """

    def __init__(self) -> None:
        """Initialize the mesh router."""
        self._round_robin_index: Dict[str, int] = {}

    @property
    def registry(self):
        """Get the agent registry."""
        return get_registry()

    def find_agent_for_task(
        self,
        task_type: str,
        preferred_module: Optional[str] = None,
    ) -> Optional[MeshAgentCard]:
        """
        Find the best agent for a task.

        Uses the following priority order:
        1. Check preferred module for agents with matching capability
        2. Check all modules for agents with matching capability
        3. Check preferred module for any healthy agent
        4. Fallback to any healthy agent

        Internal agents are always preferred over external agents.

        Args:
            task_type: The type of task (used as capability ID)
            preferred_module: Module to prefer (e.g., "pm", "kb", "crm")

        Returns:
            The best matching MeshAgentCard, or None if no suitable agent found
        """
        candidates: List[MeshAgentCard] = []

        # Step 1: Check preferred module for capability match
        if preferred_module:
            module_agents = self.registry.list_by_module(preferred_module)
            healthy_module = [
                a for a in module_agents
                if self.registry.is_healthy(a.name)
            ]

            # First check for capability match
            with_capability = [
                a for a in healthy_module
                if a.has_capability(task_type)
            ]
            if with_capability:
                candidates = with_capability

        # Step 2: Check all agents for capability match
        if not candidates:
            capability_agents = self.registry.list_by_capability(task_type)
            healthy_capability = [
                a for a in capability_agents
                if self.registry.is_healthy(a.name)
            ]
            if healthy_capability:
                candidates = healthy_capability

        # Step 3: If preferred module specified, use any healthy agent from that module
        if not candidates and preferred_module:
            module_agents = self.registry.list_by_module(preferred_module)
            healthy_module = [
                a for a in module_agents
                if self.registry.is_healthy(a.name)
            ]
            if healthy_module:
                candidates = healthy_module

        # Step 4: Fallback to any healthy agent
        if not candidates:
            candidates = self.registry.list_healthy()

        if not candidates:
            logger.warning(f"No agent found for task: {task_type}")
            return None

        # Prefer internal agents over external
        internal = [a for a in candidates if not a.is_external]
        if internal:
            return self._select_agent(internal, task_type)

        return self._select_agent(candidates, task_type)

    def _select_agent(
        self,
        candidates: List[MeshAgentCard],
        key: str,
    ) -> MeshAgentCard:
        """
        Select an agent from candidates using round-robin.

        Args:
            candidates: List of candidate agents
            key: Key for tracking round-robin state

        Returns:
            Selected agent
        """
        if not candidates:
            raise ValueError("No candidates to select from")

        if len(candidates) == 1:
            return candidates[0]

        # Round-robin selection
        index = self._round_robin_index.get(key, 0)
        selected = candidates[index % len(candidates)]
        self._round_robin_index[key] = index + 1

        return selected

    def find_agents_for_broadcast(
        self,
        module_filter: Optional[str] = None,
        capability_filter: Optional[str] = None,
        include_external: bool = True,
    ) -> List[MeshAgentCard]:
        """
        Find agents for a broadcast request.

        Args:
            module_filter: Filter by module (optional)
            capability_filter: Filter by capability (optional)
            include_external: Whether to include external agents

        Returns:
            List of matching healthy agents
        """
        if module_filter:
            agents = self.registry.list_by_module(module_filter)
        elif capability_filter:
            agents = self.registry.list_by_capability(capability_filter)
        else:
            agents = self.registry.list_all()

        # Filter by health
        healthy = [a for a in agents if self.registry.is_healthy(a.name)]

        # Optionally filter external agents
        if not include_external:
            healthy = [a for a in healthy if not a.is_external]

        return healthy

    async def route_request(
        self,
        task_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        preferred_module: Optional[str] = None,
        caller_id: str = "mesh_router",
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Route a request to an appropriate agent via A2A.

        Finds the best agent for the task and sends the request
        using the A2A client.

        Args:
            task_type: Type of task to route
            message: Message to send to the agent
            context: Additional context for the request
            preferred_module: Preferred module for routing
            caller_id: Identifier of the caller
            timeout: Request timeout in seconds

        Returns:
            Dict with agent name and response, or error information

        Example:
            result = await router.route_request(
                task_type="planning",
                message="Create a project plan for Q1",
                preferred_module="pm",
            )

            if "error" in result:
                print(f"Error: {result['error']}")
            else:
                print(f"Response from {result['agent']}: {result['response']}")
        """
        agent = self.find_agent_for_task(task_type, preferred_module)

        if not agent:
            return {
                "error": f"No agent found for task type: {task_type}",
                "task_type": task_type,
                "preferred_module": preferred_module,
            }

        try:
            # Import A2A client lazily to avoid circular imports
            from a2a.client import get_a2a_client

            client = await get_a2a_client()
            result = await client.call_agent(
                agent_id=agent.name,
                task=message,
                context=context,
                caller_id=caller_id,
                timeout=timeout,
            )

            return {
                "agent": agent.name,
                "module": agent.module,
                "response": result.model_dump(),
                "success": result.success,
            }

        except ImportError:
            # A2A client not available, return agent info only
            logger.warning("A2A client not available for routing")
            return {
                "agent": agent.name,
                "module": agent.module,
                "url": agent.url,
                "error": "A2A client not available",
            }

        except Exception as e:
            logger.error(f"Error routing request to {agent.name}: {e}")
            return {
                "agent": agent.name,
                "error": str(e),
            }

    async def broadcast_request(
        self,
        message: str,
        module_filter: Optional[str] = None,
        capability_filter: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        caller_id: str = "mesh_router",
        include_external: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Broadcast a request to multiple agents in parallel.

        Sends the same message to all matching agents and collects responses.

        Args:
            message: Message to broadcast
            module_filter: Filter by module (optional)
            capability_filter: Filter by capability (optional)
            context: Additional context for the request
            caller_id: Identifier of the caller
            include_external: Whether to include external agents

        Returns:
            List of dicts with agent names and responses

        Example:
            results = await router.broadcast_request(
                message="Get status update",
                module_filter="pm",
            )

            for result in results:
                print(f"{result['agent']}: {result.get('response', result.get('error'))}")
        """
        agents = self.find_agents_for_broadcast(
            module_filter=module_filter,
            capability_filter=capability_filter,
            include_external=include_external,
        )

        if not agents:
            logger.warning(
                f"No agents found for broadcast "
                f"(module={module_filter}, capability={capability_filter})"
            )
            return []

        try:
            # Import A2A client lazily
            from a2a.client import get_a2a_client

            client = await get_a2a_client()

            # Build parallel calls
            calls = [
                {
                    "agent_id": agent.name,
                    "task": message,
                    "context": context,
                }
                for agent in agents
            ]

            results = await client.call_agents_parallel(calls, caller_id=caller_id)

            # Format results
            output = []
            for agent in agents:
                result = results.get(agent.name)
                if result:
                    output.append({
                        "agent": agent.name,
                        "module": agent.module,
                        "response": result.model_dump(),
                        "success": result.success,
                    })
                else:
                    output.append({
                        "agent": agent.name,
                        "module": agent.module,
                        "error": "No response received",
                    })

            return output

        except ImportError:
            # A2A client not available, return agent info only
            logger.warning("A2A client not available for broadcast")
            return [
                {
                    "agent": agent.name,
                    "module": agent.module,
                    "url": agent.url,
                    "error": "A2A client not available",
                }
                for agent in agents
            ]

        except Exception as e:
            logger.error(f"Error broadcasting request: {e}")
            return [
                {
                    "agent": agent.name,
                    "error": str(e),
                }
                for agent in agents
            ]

    def get_routing_info(self, task_type: str) -> Dict[str, Any]:
        """
        Get routing information without making a request.

        Useful for debugging and understanding routing decisions.

        Args:
            task_type: Type of task to route

        Returns:
            Dict with routing analysis information
        """
        registry = self.registry

        # Get all relevant agents
        capability_agents = registry.list_by_capability(task_type)
        healthy_agents = registry.list_healthy()
        all_agents = registry.list_all()

        # Find best match
        best_agent = self.find_agent_for_task(task_type)

        return {
            "task_type": task_type,
            "total_agents": len(all_agents),
            "healthy_agents": len(healthy_agents),
            "capability_matches": len(capability_agents),
            "selected_agent": best_agent.name if best_agent else None,
            "selected_module": best_agent.module if best_agent else None,
            "is_external": best_agent.is_external if best_agent else None,
            "agents_by_module": registry.get_stats().get("modules", {}),
        }


# =============================================================================
# GLOBAL SINGLETON
# =============================================================================

_router: Optional[MeshRouter] = None


def get_router() -> MeshRouter:
    """
    Get the global mesh router singleton.

    Creates a MeshRouter on first access.

    Returns:
        The global MeshRouter instance
    """
    global _router

    if _router is None:
        _router = MeshRouter()
        logger.info("Global mesh router initialized")

    return _router


def reset_router() -> None:
    """
    Reset the global router singleton.

    Primarily useful for testing.
    """
    global _router
    _router = None
    logger.info("Global mesh router reset")
