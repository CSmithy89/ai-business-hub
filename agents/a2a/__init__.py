"""
A2A Protocol Module

Implements Google A2A protocol support including AgentCard generation
and discovery endpoints for agent-to-agent communication.

This module provides:
- AgentCard Pydantic models following A2A JSON-LD specification
- Builder functions for generating AgentCards from agent metadata
- FastAPI router with discovery endpoints
- Pre-defined metadata for known HYVVE agents

Discovery Endpoints:
- GET /.well-known/agent.json - Global discovery (all agents)
- GET /.well-known/agents - Multi-agent listing
- GET /a2a/{agent_id}/.well-known/agent.json - Individual agent discovery

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
from .discovery import router as discovery_router

__all__ = [
    # Models
    "AgentCard",
    "Capabilities",
    "Skill",
    "Provider",
    "Authentication",
    # Metadata
    "AGENT_METADATA",
    # Builders
    "build_agent_card",
    "build_discovery_response",
    "build_multi_agent_response",
    # Router
    "discovery_router",
]
