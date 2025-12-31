"""
A2A Discovery Endpoints

Implements the A2A discovery endpoints for agent discovery:
- /.well-known/agent.json - Global discovery (all agents)
- /.well-known/agents - Multi-agent listing
- /a2a/{agent_id}/.well-known/agent.json - Individual agent discovery

These endpoints are unauthenticated as they provide public metadata
about agent capabilities, not sensitive data.

Rate limiting is applied to prevent abuse (DM-08.3).
"""
import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from slowapi import Limiter
from slowapi.util import get_remote_address

from agentos.config import INTERFACE_CONFIGS, get_agentos_settings
from constants.dm_constants import DMConstants

from .agent_card import (
    build_agent_card,
    build_discovery_response,
    build_multi_agent_response,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["a2a-discovery"])

# Rate limiter for A2A discovery endpoints (DM-08.3)
# This limiter is used for decoration; enforcement uses app.state.limiter via SlowAPIMiddleware
_limiter = Limiter(key_func=get_remote_address)
_DISCOVERY_RATE_LIMIT = DMConstants.RATE_LIMITS.A2A_DISCOVERY


def _get_a2a_agents() -> Dict[str, str]:
    """
    Get all agents with A2A interfaces enabled.

    Returns:
        Dictionary mapping agent_id to A2A path
    """
    return {
        config.agent_id: config.a2a_path
        for config in INTERFACE_CONFIGS
        if config.a2a_enabled and config.a2a_path
    }


@router.get(
    "/.well-known/agent.json",
    summary="A2A Global Discovery",
    description=(
        "Returns all registered agent cards for A2A discovery. "
        "This endpoint is unauthenticated (public metadata). "
        f"Rate limited to {_DISCOVERY_RATE_LIMIT}."
    ),
    response_description="Discovery response with all agent cards",
)
@_limiter.limit(_DISCOVERY_RATE_LIMIT)
async def global_discovery(request: Request) -> Dict[str, Any]:
    """
    A2A Global Discovery Endpoint.

    Returns all registered agent cards in a single response,
    enabling external agents to discover available HYVVE agents.

    This endpoint is unauthenticated as it provides public metadata
    about agent capabilities, not sensitive data.

    Rate limited to prevent abuse (DM-08.3).
    """
    settings = get_agentos_settings()

    # Check global A2A enable flag first
    if not settings.a2a_enabled:
        raise HTTPException(
            status_code=404,
            detail="A2A protocol is disabled",
        )

    agents = _get_a2a_agents()

    if not agents:
        logger.warning("No A2A agents configured for discovery")
        return {
            "protocolVersion": (
                DMConstants.A2A.PROTOCOL_VERSION if settings.a2a_enabled else "disabled"
            ),
            "agents": [],
            "message": "No A2A agents configured",
        }

    return build_discovery_response(
        agents=agents,
        base_url=settings.base_url,
    )


@router.get(
    "/.well-known/agents",
    summary="A2A Multi-Agent Listing",
    description=(
        "Returns a simplified listing of all available agents with their A2A endpoints. "
        f"Rate limited to {_DISCOVERY_RATE_LIMIT}."
    ),
    response_description="Multi-agent listing response",
)
@_limiter.limit(_DISCOVERY_RATE_LIMIT)
async def multi_agent_listing(request: Request) -> Dict[str, Any]:
    """
    A2A Multi-Agent Listing Endpoint.

    Returns a simplified listing of available agents with their
    endpoints, useful for quick enumeration of available agents.

    Rate limited to prevent abuse (DM-08.3).
    """
    settings = get_agentos_settings()

    # Check global A2A enable flag first
    if not settings.a2a_enabled:
        raise HTTPException(
            status_code=404,
            detail="A2A protocol is disabled",
        )

    agents = _get_a2a_agents()

    return build_multi_agent_response(
        agents=agents,
        base_url=settings.base_url,
    )


@router.get(
    "/a2a/{agent_id}/.well-known/agent.json",
    summary="Individual Agent Discovery",
    description=f"Returns the AgentCard for a specific agent by ID. Rate limited to {_DISCOVERY_RATE_LIMIT}.",
    response_description="Single agent AgentCard",
)
@_limiter.limit(_DISCOVERY_RATE_LIMIT)
async def agent_discovery(request: Request, agent_id: str) -> Dict[str, Any]:
    """
    Individual Agent Discovery Endpoint.

    Returns the AgentCard for a specific agent, allowing external
    agents to discover capabilities of a single HYVVE agent.

    Args:
        request: FastAPI request (required for rate limiting)
        agent_id: The unique agent identifier

    Returns:
        AgentCard for the requested agent

    Raises:
        HTTPException 404: If agent not found or A2A not enabled

    Rate limited to prevent abuse (DM-08.3).
    """
    settings = get_agentos_settings()

    # Check global A2A enable flag first
    if not settings.a2a_enabled:
        raise HTTPException(
            status_code=404,
            detail="A2A protocol is disabled",
        )

    agents = _get_a2a_agents()

    if agent_id not in agents:
        # Check if agent exists but A2A is disabled
        all_agents = {c.agent_id for c in INTERFACE_CONFIGS}
        if agent_id in all_agents:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' exists but A2A interface is not enabled",
            )
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_id}' not found. Available agents: {list(agents.keys())}",
        )

    try:
        card = build_agent_card(
            agent_id=agent_id,
            base_url=settings.base_url,
            path=agents[agent_id],
        )
        return card.model_dump(by_alias=True)
    except ValueError as e:
        logger.error(f"Failed to build AgentCard for {agent_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate AgentCard: {str(e)}",
        )
