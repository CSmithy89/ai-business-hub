"""
Universal Agent Mesh

Provides agent mesh infrastructure for the HYVVE Dynamic Module System.
Enables agent discovery, registration, health monitoring, and intelligent
routing across the agent mesh.

@see docs/modules/bm-dm/stories/dm-06-5-universal-agent-mesh.md
Epic: DM-06 | Story: DM-06.5

Components:
- models: Core data models (AgentCapability, AgentHealth, MeshAgentCard, etc.)
- registry: Central agent registry with health tracking and subscriptions
- discovery: A2A protocol discovery service for external agents
- router: Intelligent request routing based on capabilities and health

Usage:
    from mesh import get_registry, get_router, get_discovery_service

    # Register an agent
    registry = get_registry()
    registry.register(agent_card)

    # Find and route to an agent
    router = get_router()
    agent = router.find_agent_for_task("planning", preferred_module="pm")

    # Discover external agents
    discovery = get_discovery_service()
    await discovery.start()
    await discovery.discover_agent("http://external-agent:8000")

References:
- A2A Protocol: https://github.com/google/a2a-protocol
- MCP Protocol: https://modelcontextprotocol.io
"""

# Models
from .models import (
    AgentCapability,
    AgentCapabilityType,
    AgentEndpoint,
    AgentHealth,
    MeshAgentCard,
)

# Registry
from .registry import (
    AgentRegistry,
    RegistryEvent,
    get_registry,
    reset_registry,
)

# Discovery
from .discovery import (
    AgentNotFoundError,
    DiscoveryError,
    DiscoveryService,
    HealthCheckResult,
    InvalidAgentCardError,
    configure_discovery_service,
    get_discovery_service,
    shutdown_discovery_service,
)

# Router
from .router import (
    MeshRouter,
    NoAgentFoundError,
    RoutingError,
    get_router,
    reset_router,
)

__all__ = [
    # Models
    "AgentCapability",
    "AgentCapabilityType",
    "AgentEndpoint",
    "AgentHealth",
    "MeshAgentCard",
    # Registry
    "AgentRegistry",
    "RegistryEvent",
    "get_registry",
    "reset_registry",
    # Discovery
    "DiscoveryService",
    "DiscoveryError",
    "AgentNotFoundError",
    "HealthCheckResult",
    "InvalidAgentCardError",
    "get_discovery_service",
    "configure_discovery_service",
    "shutdown_discovery_service",
    # Router
    "MeshRouter",
    "RoutingError",
    "NoAgentFoundError",
    "get_router",
    "reset_router",
]
