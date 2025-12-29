"""
A2A Protocol Module

Implements Google A2A protocol support including AgentCard generation,
discovery endpoints, and inter-agent communication client.

This module provides:
- AgentCard Pydantic models following A2A JSON-LD specification
- Builder functions for generating AgentCards from agent metadata
- FastAPI router with discovery endpoints
- Pre-defined metadata for known HYVVE agents
- A2A client for inter-agent RPC communication

Discovery Endpoints:
- GET /.well-known/agent.json - Global discovery (all agents)
- GET /.well-known/agents - Multi-agent listing
- GET /a2a/{agent_id}/.well-known/agent.json - Individual agent discovery

A2A Client:
- HyvveA2AClient - Async client for calling agents via A2A protocol
- A2ATaskResult - Structured response from A2A task execution
- get_a2a_client() - Singleton accessor for dashboard agent tools

Reference: https://github.com/google/a2a-protocol
"""
from .agent_card import (
    AGENT_METADATA,
    AgentCard,
    Authentication,
    Capabilities,
    Provider,
    Skill,
    build_agent_card,
    build_discovery_response,
    build_multi_agent_response,
)
from .client import (
    A2ATaskResult,
    HyvveA2AClient,
    get_a2a_client,
    get_a2a_client_sync,
)
from .discovery import router as discovery_router

__all__ = [
    # Models
    "AgentCard",
    "Capabilities",
    "Skill",
    "Provider",
    "Authentication",
    # A2A Client
    "HyvveA2AClient",
    "A2ATaskResult",
    "get_a2a_client",
    "get_a2a_client_sync",
    # Metadata
    "AGENT_METADATA",
    # Builders
    "build_agent_card",
    "build_discovery_response",
    "build_multi_agent_response",
    # Router
    "discovery_router",
]
