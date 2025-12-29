"""
HYVVE AgentOS - AI Agent Runtime

Production runtime for Agno agents with tenant isolation,
JWT authentication, A2A protocol, and AG-UI streaming support.

Version: 0.2.0
Protocols: A2A v0.3.0, AG-UI v0.1.0
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from middleware.tenant import TenantMiddleware
from middleware.rate_limit import init_rate_limiting, NoopLimiter
from middleware.business_validator import validate_business_ownership
from config import get_settings
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List, Union
import logging
import time
import asyncio
import json
import uuid
import hmac
import os

# Import registry and A2A models
from registry import registry, AgentCard

# Import AG-UI encoder
from ag_ui.encoder import EventEncoder, AGUIEventType

# Import BYOAI provider integration
from providers import resolve_and_create_model, get_provider_resolver, ResolvedProvider
from providers.byoai_client import BYOAIClient

# Import platform agents
from core_platform.approval_agent import ApprovalAgent

# Import team factories
from validation.team import create_validation_team
from planning.team import create_planning_team
from branding.team import create_branding_team

# Import Dashboard Gateway Agent
from gateway import create_dashboard_gateway_agent, get_agent_metadata

# Import PM agent A2A adapter factories (DM-02.5)
from pm import (
    PMA2AAdapter,
    create_navi_a2a_adapter,
    create_vitals_a2a_adapter,
    create_herald_a2a_adapter,
)
from agno.memory import Memory

# Import AgentOS multi-interface support
from agentos import (
    create_agui_interface,
    create_a2a_interface,
    get_interface_config,
    get_agentos_settings,
)

# Import A2A discovery router
from a2a.discovery import router as discovery_router

# Import CCR model provider (DM-02.7)
from models.ccr_provider import validate_ccr_connection

# Import CCR usage tracker (DM-02.9)
from services.ccr_usage import get_ccr_usage_tracker

# ============================================================================
# Configuration (must be at top before usage)
# ============================================================================

settings = get_settings()


def _unwrap_secret(secret) -> str | None:
    """Safely unwrap Pydantic SecretStr or return string as-is."""
    try:
        return secret.get_secret_value()  # type: ignore[attr-defined]
    except AttributeError:
        return secret


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="HYVVE AgentOS",
    description="AI Agent Runtime with A2A protocol and AG-UI streaming",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
origins_setting = settings.cors_origins
if isinstance(origins_setting, str):
    allowed_origins = [origins_setting]
else:
    allowed_origins = list(origins_setting or [])

# Add Control Plane origin if enabled
if settings.control_plane_enabled and settings.control_plane_origin:
    if settings.control_plane_origin not in allowed_origins:
        allowed_origins.append(settings.control_plane_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Tenant middleware (JWT validation and workspace_id injection)
_auth_secret = _unwrap_secret(settings.better_auth_secret)
if not _auth_secret:
    raise RuntimeError("BETTER_AUTH_SECRET is required for JWT validation")

app.add_middleware(TenantMiddleware, secret_key=_auth_secret)

# Rate limiting
try:
    limiter = init_rate_limiting(app, settings.redis_url, default_rate="10/minute")
except Exception as exc:
    logger.error("Rate limiting init failed: %s", exc, exc_info=True)
    limiter = NoopLimiter()
    app.state.limiter = limiter


# ============================================================================
# Request/Response Models
# ============================================================================

class AgentRunRequest(BaseModel):
    """Request model for agent run endpoint."""
    message: str
    session_id: Optional[str] = None
    model_override: Optional[str] = None


class AgentRunResponse(BaseModel):
    """Response model for agent run endpoint."""
    success: bool
    content: Optional[str] = None
    session_id: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


class TeamRunRequest(BaseModel):
    """Request model for team run endpoint."""
    message: str
    business_id: str
    session_id: Optional[str] = None
    model_override: Optional[str] = None
    context: Optional[dict] = None
    stream: bool = False  # Enable SSE streaming


class TeamRunResponse(BaseModel):
    """Response model for team run endpoint."""
    success: bool
    content: Optional[str] = None
    session_id: str
    agent_name: Optional[str] = None
    error: Optional[str] = None
    metadata: dict = Field(default_factory=dict)


# ============================================================================
# A2A Protocol Models (JSON-RPC 2.0)
# ============================================================================

class JSONRPCRequest(BaseModel):
    """JSON-RPC 2.0 Request format for A2A protocol."""
    jsonrpc: str = "2.0"
    method: str
    params: Dict[str, Any] = Field(default_factory=dict)
    id: Union[str, int, None] = None


class JSONRPCResult(BaseModel):
    """Successful JSON-RPC result."""
    content: str
    tool_calls: List[Dict[str, Any]] = []
    artifacts: List[Dict[str, Any]] = []


class JSONRPCError(BaseModel):
    """JSON-RPC error object."""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None


class JSONRPCResponse(BaseModel):
    """JSON-RPC 2.0 Response format for A2A protocol."""
    jsonrpc: str = "2.0"
    result: Optional[JSONRPCResult] = None
    error: Optional[JSONRPCError] = None
    id: Union[str, int, None] = None


# ============================================================================
# Team Configuration
# ============================================================================

TEAM_CONFIG: Dict[str, Dict[str, Any]] = {
    "validation": {
        "factory": create_validation_team,
        "leader": "Vera",
        "members": ["Marco", "Cipher", "Persona", "Risk"],
        "storage": "bmv_validation_sessions",
        "session_prefix": "val",
        "description": "Business validation and market research team",
    },
    "planning": {
        "factory": create_planning_team,
        "leader": "Blake",
        "members": ["Model", "Finn", "Revenue", "Forecast"],
        "storage": "bmp_planning_sessions",
        "session_prefix": "plan",
        "description": "Business planning and financial modeling team",
    },
    "branding": {
        "factory": create_branding_team,
        "leader": "Bella",
        "members": ["Sage", "Vox", "Iris", "Artisan", "Audit"],
        "storage": "bm_brand_sessions",
        "session_prefix": "brand",
        "description": "Brand strategy and visual identity team",
    },
}

TEAM_EXECUTION_TIMEOUT = 120


# ============================================================================
# Team Execution Helpers
# ============================================================================

async def _iterate_stream_with_timeout(stream: Any, timeout_seconds: int):
    """
    Iterate an async stream with a total timeout.

    This protects streaming execution paths from hanging indefinitely.
    """
    iterator = stream.__aiter__() if hasattr(stream, "__aiter__") else stream
    start = time.monotonic()

    while True:
        remaining = timeout_seconds - (time.monotonic() - start)
        if remaining <= 0:
            raise asyncio.TimeoutError

        try:
            chunk = await asyncio.wait_for(iterator.__anext__(), timeout=remaining)  # type: ignore[attr-defined]
        except StopAsyncIteration:
            return

        yield chunk

async def _resolve_provider_for_team(
    workspace_id: str,
    jwt_token: Optional[str],
    model_override: Optional[str],
) -> Optional[ResolvedProvider]:
    """
    Resolve the provider configuration for a team execution.

    Resolution order:
    1. If model_override is specified, still resolve full provider for limits
    2. If workspace has BYOAI configured, resolve via provider
    3. Fall back to None (team will use default)

    Args:
        workspace_id: Workspace ID for tenant context
        jwt_token: JWT token for API authentication
        model_override: Explicit model override from request

    Returns:
        ResolvedProvider with full configuration including token limits
    """
    # Try BYOAI resolution if we have auth context
    if jwt_token and workspace_id:
        try:
            resolver = get_provider_resolver(
                settings.api_base_url,
                database_url=settings.database_url,
                encryption_master_key_base64=(
                    settings.encryption_master_key.get_secret_value()
                    if settings.encryption_master_key
                    else None
                ),
            )
            resolved = await resolver.resolve_provider(
                workspace_id=workspace_id,
                jwt_token=jwt_token,
                preferred_model=model_override,
                check_limits=True,
            )
            if resolved:
                logger.info(
                    f"BYOAI resolved: {resolved.provider_type}/{resolved.model_id} "
                    f"(remaining: {resolved.remaining_tokens} tokens)"
                )
                return resolved
        except Exception as e:
            logger.warning(f"BYOAI resolution failed, using default: {e}")

    # Fall back to None
    return None


# Minimum tokens required to start an agent run
MIN_TOKENS_REQUIRED = 1000


class TokenLimitExceededError(Exception):
    """Raised when token limit is exceeded."""
    def __init__(self, remaining: int, required: int):
        self.remaining = remaining
        self.required = required
        super().__init__(
            f"Token limit exceeded. Remaining: {remaining}, Required: {required}"
        )


def _check_token_limit(resolved: Optional[ResolvedProvider]) -> None:
    """
    Check if token limit allows the request.

    Args:
        resolved: Resolved provider with token limit info

    Raises:
        TokenLimitExceededError: If remaining tokens below minimum
    """
    if resolved is None:
        return  # No limit enforcement for default provider

    if resolved.max_tokens_per_day == 0:
        return  # Unlimited

    if resolved.remaining_tokens < MIN_TOKENS_REQUIRED:
        raise TokenLimitExceededError(
            remaining=resolved.remaining_tokens,
            required=MIN_TOKENS_REQUIRED
        )


async def _record_usage(
    resolved: Optional[ResolvedProvider],
    workspace_id: str,
    jwt_token: str,
    input_tokens: int,
    output_tokens: int,
    agent_name: Optional[str] = None,
    request_id: Optional[str] = None,
) -> None:
    """
    Record token usage after a completion.

    Args:
        resolved: Resolved provider
        workspace_id: Workspace ID
        jwt_token: JWT token
        input_tokens: Input tokens used
        output_tokens: Output tokens used
        agent_name: Optional agent name
        request_id: Optional request ID
    """
    if resolved is None:
        return  # No recording for default provider

    try:
        client = BYOAIClient(api_base_url=settings.api_base_url)
        await client.record_token_usage(
            workspace_id=workspace_id,
            provider_id=resolved.provider_id,
            jwt_token=jwt_token,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model=resolved.model_id,
            agent_name=agent_name,
            request_id=request_id,
        )
        await client.close()
        logger.debug(
            f"Recorded usage: {input_tokens + output_tokens} tokens for {agent_name}"
        )
    except Exception as e:
        logger.warning(f"Failed to record token usage: {e}")


async def _run_team(
    team_name: str,
    request_data: TeamRunRequest,
    request: Request,
) -> TeamRunResponse:
    """Run agent team and return JSON response."""
    config = TEAM_CONFIG.get(team_name)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown team: {team_name}")

    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    logger.info(f"{team_name}Team run: ws={workspace_id}, user={user_id}")

    try:
        # Resolve provider with full configuration
        resolved = await _resolve_provider_for_team(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
            model_override=request_data.model_override,
        )

        # Check token limits before execution
        _check_token_limit(resolved)

        session_id = request_data.session_id or f"{config['session_prefix']}_{uuid.uuid4().hex[:12]}"
        team = config["factory"](
            session_id=session_id,
            user_id=user_id,
            business_id=request_data.business_id,
            model=resolved.model_id if resolved else None,
        )

        response = await asyncio.wait_for(
            team.arun(message=request_data.message),
            timeout=TEAM_EXECUTION_TIMEOUT
        )

        # Record token usage (estimate if not available from response)
        # Most LLM responses have usage info in the response object
        input_tokens = getattr(response, 'input_tokens', 0) or len(request_data.message) // 4
        output_tokens = getattr(response, 'output_tokens', 0) or len(response.content or "") // 4

        if jwt_token:
            await _record_usage(
                resolved=resolved,
                workspace_id=workspace_id,
                jwt_token=jwt_token,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                agent_name=config['leader'],
                request_id=session_id,
            )

        return TeamRunResponse(
            success=True,
            content=response.content,
            session_id=session_id,
            agent_name=getattr(response, 'agent_name', config['leader']),
            metadata={
                "business_id": request_data.business_id,
                "team": team_name,
                "workspace_id": workspace_id,
                "tokens_used": input_tokens + output_tokens,
            }
        )
    except TokenLimitExceededError as e:
        raise HTTPException(
            status_code=429,
            detail=f"Token limit exceeded. Remaining: {e.remaining} tokens"
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"{team_name} team timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"{team_name}Team failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Team execution failed")


async def _run_team_stream(
    team_name: str,
    request_data: TeamRunRequest,
    request: Request,
):
    """Run agent team with AG-UI SSE streaming."""
    config = TEAM_CONFIG.get(team_name)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown team: {team_name}")

    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    # Resolve provider with full configuration before starting stream
    resolved = await _resolve_provider_for_team(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        model_override=request_data.model_override,
    )

    # Check token limits before execution
    try:
        _check_token_limit(resolved)
    except TokenLimitExceededError as e:
        raise HTTPException(
            status_code=429,
            detail=f"Token limit exceeded. Remaining: {e.remaining} tokens"
        )

    session_id = request_data.session_id or f"{config['session_prefix']}_{uuid.uuid4().hex[:12]}"

    async def generate():
        encoder = EventEncoder()
        total_tokens = 0  # Track tokens for usage recording

        # Send RUN_STARTED
        yield encoder.encode(AGUIEventType.RUN_STARTED, {
            "runId": session_id,
            "agentId": team_name,
            "timestamp": int(time.time())
        })

        try:
            team = config["factory"](
                session_id=session_id,
                user_id=user_id,
                business_id=request_data.business_id,
                model=resolved.model_id if resolved else None,
            )

            accumulated_content = ""

            # Use streaming if available
            if hasattr(team, 'arun_stream'):
                stream = team.arun_stream(message=request_data.message)
                async for chunk in _iterate_stream_with_timeout(stream, TEAM_EXECUTION_TIMEOUT):
                    if hasattr(chunk, "content") and chunk.content:
                        accumulated_content += chunk.content
                        yield encoder.encode(AGUIEventType.TEXT_MESSAGE_CHUNK, {
                            "delta": chunk.content,
                            "messageId": f"msg_{session_id}"
                        })
            else:
                # Fallback to non-streaming
                response = await asyncio.wait_for(
                    team.arun(message=request_data.message),
                    timeout=TEAM_EXECUTION_TIMEOUT
                )
                accumulated_content = response.content or ""
                yield encoder.encode(AGUIEventType.TEXT_MESSAGE_CHUNK, {
                    "delta": accumulated_content,
                    "messageId": f"msg_{session_id}"
                })

            # Estimate token usage
            input_tokens = len(request_data.message) // 4
            output_tokens = len(accumulated_content) // 4
            total_tokens = input_tokens + output_tokens

            # Send RUN_FINISHED with token info
            yield encoder.encode(AGUIEventType.RUN_FINISHED, {
                "runId": session_id,
                "status": "success",
                "tokensUsed": total_tokens
            })

            # Record usage after successful completion
            if jwt_token and resolved:
                await _record_usage(
                    resolved=resolved,
                    workspace_id=workspace_id,
                    jwt_token=jwt_token,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    agent_name=config['leader'],
                    request_id=session_id,
                )

        except asyncio.TimeoutError:
            logger.warning("Team stream timed out (team=%s, session=%s)", team_name, session_id)
            yield encoder.encode(AGUIEventType.ERROR, {
                "code": "EXECUTION_TIMEOUT",
                "message": "Execution timed out.",
                "timeoutSeconds": TEAM_EXECUTION_TIMEOUT,
            })
        except Exception as e:
            logger.error("Stream error (team=%s, session=%s): %s", team_name, session_id, type(e).__name__, exc_info=True)
            is_production = os.getenv("NODE_ENV") == "production" or os.getenv("ENV") == "production" or os.getenv("ENVIRONMENT") == "production"
            yield encoder.encode(AGUIEventType.ERROR, {
                "code": "EXECUTION_ERROR",
                "message": "An internal streaming error occurred." if is_production else str(e),
            })

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


def _get_team_health(team_name: str) -> dict:
    """Health check for a team."""
    config = TEAM_CONFIG.get(team_name)
    if not config:
        return {"status": "error", "error": f"Unknown team: {team_name}"}

    try:
        config["factory"](session_id="health_check", user_id="system")
        return {
            "status": "ok",
            "team": team_name,
            "leader": config["leader"],
            "members": config["members"],
            "version": "0.2.0",
        }
    except Exception as e:
        return {"status": "error", "team": team_name, "error": str(e)}


# ============================================================================
# Initialize Agents & Registry
# ============================================================================

approval_agent = ApprovalAgent(
    database_url=settings.database_url,
    default_model="gpt-4o"
)
logger.info("ApprovalAgent initialized")


@app.on_event("startup")
async def startup_event():
    """Initialize services and register agents on startup."""
    logger.info("AgentOS starting up...")
    logger.info(f"Version: 0.2.0")
    logger.info(f"Protocols: A2A v0.3.0, AG-UI v0.1.0")

    # Register teams in the A2A registry
    for team_name, config in TEAM_CONFIG.items():
        try:
            # Create a reference team for registration
            team = config["factory"](session_id="registry", user_id="system")
            registry.register_team(team, override_id=team_name)
            logger.info(f"Registered team in A2A registry: {team_name}")
        except Exception as e:
            logger.warning(f"Could not register team {team_name}: {e}")

    logger.info(f"Registry contains {len(registry.list_cards())} agents/teams")
    logger.info(f"Database: {'configured' if settings.database_url else 'not configured'}")
    logger.info(f"Redis: {'configured' if settings.redis_url else 'not configured'}")

    # Validate CCR connection if enabled (DM-02.7)
    if settings.ccr_enabled:
        ccr_ok = await validate_ccr_connection()
        if ccr_ok:
            logger.info("CCR connection validated - using CCR for model routing")
        else:
            logger.warning("CCR not available, using BYOAI fallback")
    else:
        logger.info("CCR disabled, using BYOAI for model routing")

    # Initialize Dashboard Gateway Agent
    await startup_dashboard_gateway()

    # Initialize PM Agent A2A interfaces (DM-02.5)
    await startup_pm_agents_a2a()


# =============================================================================
# Dashboard Gateway Agent Setup
# =============================================================================

# Global reference to the dashboard agent (created on startup)
_dashboard_agent = None
_dashboard_interfaces = {}


def get_dashboard_agent():
    """Get the Dashboard Gateway agent instance."""
    global _dashboard_agent
    if _dashboard_agent is None:
        raise RuntimeError("Dashboard agent not initialized. Wait for startup.")
    return _dashboard_agent


async def startup_dashboard_gateway():
    """
    Initialize Dashboard Gateway agent and mount interfaces on startup.

    This creates the agent instance and mounts both AG-UI and A2A routers
    according to the INTERFACE_CONFIGS from agentos/config.py.
    """
    global _dashboard_agent, _dashboard_interfaces

    agentos_settings = get_agentos_settings()
    config = get_interface_config("dashboard_gateway")

    if not config:
        logger.warning("No interface config found for dashboard_gateway")
        return

    # Create the Dashboard Gateway agent
    _dashboard_agent = create_dashboard_gateway_agent(
        workspace_id="system",  # Default workspace, overridden per-request
    )
    logger.info("Dashboard Gateway agent created")

    # Mount AG-UI interface if enabled
    if config.agui_enabled and config.agui_path and agentos_settings.agui_enabled:
        try:
            agui_interface = create_agui_interface(
                agent=_dashboard_agent,
                path=config.agui_path,
                timeout_seconds=config.get_agui_timeout(),
            )
            _dashboard_interfaces["agui"] = agui_interface
            # Mount the router if interface has a router attribute
            if hasattr(agui_interface, "router"):
                app.include_router(
                    agui_interface.router,
                    tags=["ag-ui"],
                )
            logger.info(f"AG-UI interface mounted at {config.agui_path}")
        except Exception as e:
            logger.error(f"Failed to mount AG-UI interface: {e}")

    # Mount A2A interface if enabled
    if config.a2a_enabled and config.a2a_path and agentos_settings.a2a_enabled:
        try:
            a2a_interface = create_a2a_interface(
                agent=_dashboard_agent,
                path=config.a2a_path,
                timeout_seconds=config.get_a2a_timeout(),
            )
            _dashboard_interfaces["a2a"] = a2a_interface
            # Mount the router if interface has a router attribute
            if hasattr(a2a_interface, "router"):
                app.include_router(
                    a2a_interface.router,
                    tags=["a2a"],
                )
            logger.info(f"A2A interface mounted at {config.a2a_path}")
        except Exception as e:
            logger.error(f"Failed to mount A2A interface: {e}")


# Mount A2A discovery endpoints (from DM-02.3)
app.include_router(discovery_router)
logger.info("A2A discovery endpoints mounted")


# =============================================================================
# PM Agent A2A Setup (DM-02.5)
# =============================================================================

# Global reference to PM agent A2A adapters
_pm_adapters: Dict[str, PMA2AAdapter] = {}


async def startup_pm_agents_a2a():
    """
    Initialize PM agent A2A interfaces on startup.

    Creates A2A adapters for Navi, Vitals, and Herald agents
    and stores them for A2A task routing according to INTERFACE_CONFIGS.

    Note: This does NOT create new agent instances per-request - it creates
    shared adapter instances that can handle A2A tasks. The actual agent
    instances are created with workspace/project context per-request in
    the existing REST endpoints.

    For A2A, we use a "system" context that the Dashboard Gateway will
    override with proper workspace/project context when routing requests.
    """
    global _pm_adapters

    agentos_settings = get_agentos_settings()

    # Skip if A2A is globally disabled
    if not agentos_settings.a2a_enabled:
        logger.info("A2A globally disabled, skipping PM agent A2A setup")
        return

    # Create shared memory for PM team (system context)
    # In production, this would be replaced with proper per-workspace memory
    shared_memory = Memory()

    # PM agent configurations
    pm_agents = [
        {
            "config_id": "navi",
            "adapter_factory": create_navi_a2a_adapter,
        },
        {
            "config_id": "pulse",  # Maps to Vitals implementation
            "adapter_factory": create_vitals_a2a_adapter,
        },
        {
            "config_id": "herald",
            "adapter_factory": create_herald_a2a_adapter,
        },
    ]

    for pm_config in pm_agents:
        config_id = pm_config["config_id"]
        config = get_interface_config(config_id)

        if not config or not config.a2a_enabled:
            logger.debug(f"Skipping {config_id} - A2A not enabled in config")
            continue

        try:
            # Create adapter with system context
            adapter = pm_config["adapter_factory"](
                workspace_id="system",
                project_id="system",
                shared_memory=shared_memory,
            )

            # Set the A2A path on the adapter
            adapter.a2a_path = config.a2a_path

            _pm_adapters[config_id] = adapter

            logger.info(f"PM agent A2A adapter created: {config_id} -> {config.a2a_path}")

        except Exception as e:
            logger.error(f"Failed to create A2A adapter for {config_id}: {e}")

    logger.info(f"PM agent A2A setup complete: {len(_pm_adapters)} adapters created")


def get_pm_adapter(agent_id: str) -> Optional[PMA2AAdapter]:
    """
    Get a PM agent A2A adapter by agent ID.

    Args:
        agent_id: The agent identifier (navi, pulse, herald)

    Returns:
        The PMA2AAdapter instance or None if not found
    """
    return _pm_adapters.get(agent_id)


# =============================================================================
# Dashboard Gateway Health Endpoint
# =============================================================================


@app.get(
    "/agents/dashboard/health",
    tags=["health"],
    summary="Dashboard Gateway Health",
)
async def dashboard_gateway_health():
    """
    Health check endpoint for the Dashboard Gateway agent.

    Returns agent status, mounted interfaces, and metadata.
    """
    global _dashboard_agent, _dashboard_interfaces

    if _dashboard_agent is None:
        return {
            "status": "not_initialized",
            "agent": None,
            "interfaces": {},
        }

    metadata = get_agent_metadata()

    return {
        "status": "healthy",
        "agent": {
            "name": metadata["name"],
            "description": metadata["description"],
            "tools": metadata["tools"],
        },
        "interfaces": {
            name: {
                "mounted": True,
                "path": getattr(iface, "path", "unknown") if hasattr(iface, "path") else "unknown",
            }
            for name, iface in _dashboard_interfaces.items()
        },
        "widget_types": metadata["widget_types"],
    }


# =============================================================================
# PM Agent A2A Health Endpoint (DM-02.5)
# =============================================================================


@app.get(
    "/agents/pm/a2a/status",
    tags=["health", "a2a"],
    summary="PM Agents A2A Status",
)
async def pm_agents_a2a_status():
    """
    Get A2A status for PM agents.

    Returns which PM agents have A2A adapters registered and their paths.
    """
    return {
        "status": "enabled" if _pm_adapters else "disabled",
        "adapters": {
            agent_id: {
                "registered": True,
                "info": adapter.get_agent_info(),
                "capabilities": adapter.get_capabilities(),
            }
            for agent_id, adapter in _pm_adapters.items()
        },
        "count": len(_pm_adapters),
    }


# =============================================================================
# CCR Metrics Endpoint (DM-02.9)
# =============================================================================


@app.get(
    "/ccr/metrics",
    tags=["ccr", "metrics"],
    summary="CCR Usage Metrics",
)
async def ccr_metrics():
    """
    Get CCR usage metrics and quota status.

    Returns aggregated usage data including:
    - Total requests by provider
    - Requests by task type
    - Estimated token usage
    - Quota status with alert levels
    """
    if not settings.ccr_enabled:
        return {
            "status": "disabled",
            "message": "CCR is not enabled",
        }

    tracker = get_ccr_usage_tracker()
    return {
        "status": "enabled",
        **tracker.get_metrics_summary(),
    }


# ============================================================================
# Core Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "HYVVE AgentOS",
        "version": "0.2.0",
        "protocols": {
            "a2a": "0.3.0",
            "ag_ui": "0.1.0"
        },
        "status": "operational",
        "documentation": "/docs"
    }


@app.get("/health")
async def health(request: Request):
    """Health check endpoint."""
    return {
        "status": "ok",
        "version": "0.2.0",
        "registered_agents": len(registry.list_cards()),
        "environment": {
            "database_configured": bool(settings.database_url),
            "redis_configured": bool(settings.redis_url),
        },
        "tenant_context": {
            "user_id": getattr(request.state, "user_id", None),
            "workspace_id": getattr(request.state, "workspace_id", None)
        }
    }


@app.get("/ready")
async def ready():
    """Readiness check endpoint."""
    return {"ready": True, "version": "0.2.0"}


# ============================================================================
# A2A Protocol Endpoints
# ============================================================================

@app.get("/.well-known/agent-card.json")
async def a2a_discovery():
    """
    A2A Discovery Endpoint.

    Returns all registered agent cards for discovery.
    Ref: docs/architecture/a2a-protocol.md
    """
    cards = registry.list_cards()
    return {
        "protocolVersion": "0.3.0",
        "agents": [card.model_dump() for card in cards]
    }


@app.get("/a2a/{agent_id}/.well-known/agent-card.json")
async def a2a_agent_card(agent_id: str):
    """
    Get specific agent card by ID.

    Args:
        agent_id: The agent/team identifier
    """
    card = registry.get_card(agent_id)
    if not card:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return card.model_dump()


@app.post("/a2a/{agent_id}/rpc")
@limiter.limit("20/minute")
async def a2a_rpc(agent_id: str, rpc_request: JSONRPCRequest, request: Request):
    """
    A2A JSON-RPC 2.0 Endpoint.

    Allows other agents to invoke tasks via standard JSON-RPC.
    Ref: docs/architecture/a2a-protocol.md

    Methods:
        - run: Execute a task with the agent
        - health: Check agent health
        - capabilities: Get agent capabilities
    """
    # Validate JSON-RPC version
    if rpc_request.jsonrpc != "2.0":
        return JSONRPCResponse(
            id=rpc_request.id,
            error=JSONRPCError(
                code=-32600,
                message="Invalid Request",
                data={"details": "jsonrpc must be '2.0'"}
            )
        )

    # SECURITY: Enforce tenant isolation / authentication for A2A calls.
    # Do not allow unauthenticated callers to execute agent tasks.
    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)
    if not workspace_id or not user_id:
        return JSONRPCResponse(
            id=rpc_request.id,
            error=JSONRPCError(
                code=-32600,
                message="Authentication required",
                data={"details": "Missing workspace context"},
            ),
        )

    # Get the team/agent
    team = registry.get_team(agent_id)
    if not team:
        return JSONRPCResponse(
            id=rpc_request.id,
            error=JSONRPCError(
                code=-32601,
                message="Method not found",
                data={"details": f"Agent '{agent_id}' not registered"}
            )
        )

    # Handle methods
    if rpc_request.method == "run":
        task = rpc_request.params.get("task")
        if not task:
            return JSONRPCResponse(
                id=rpc_request.id,
                error=JSONRPCError(
                    code=-32602,
                    message="Invalid params",
                    data={"details": "Missing 'task' parameter"}
                )
            )

        try:
            # Get context from params or request state
            context = rpc_request.params.get("context", {})
            caller_id = context.get("caller_id", "anonymous")

            logger.info(f"A2A RPC: {caller_id} -> {agent_id}: {task[:50]}...")

            response = await asyncio.wait_for(
                team.arun(message=task),
                timeout=TEAM_EXECUTION_TIMEOUT
            )

            return JSONRPCResponse(
                id=rpc_request.id,
                result=JSONRPCResult(
                    content=response.content,
                    tool_calls=[],
                    artifacts=[]
                )
            )
        except asyncio.TimeoutError:
            return JSONRPCResponse(
                id=rpc_request.id,
                error=JSONRPCError(
                    code=-32000,
                    message="Execution timeout",
                    data={"timeout_seconds": TEAM_EXECUTION_TIMEOUT}
                )
            )
        except Exception as e:
            logger.error(f"A2A RPC error: {e}", exc_info=True)
            return JSONRPCResponse(
                id=rpc_request.id,
                error=JSONRPCError(
                    code=-32603,
                    message="Internal error",
                    data={"details": str(e)}
                )
            )

    elif rpc_request.method == "health":
        health = _get_team_health(agent_id)
        return JSONRPCResponse(
            id=rpc_request.id,
            result=JSONRPCResult(content=json.dumps(health))
        )

    elif rpc_request.method == "capabilities":
        card = registry.get_card(agent_id)
        return JSONRPCResponse(
            id=rpc_request.id,
            result=JSONRPCResult(content=card.model_dump_json() if card else "{}")
        )

    else:
        return JSONRPCResponse(
            id=rpc_request.id,
            error=JSONRPCError(
                code=-32601,
                message="Method not found",
                data={"available_methods": ["run", "health", "capabilities"]}
            )
        )


# ============================================================================
# Control Plane Endpoints
# ============================================================================

@app.get("/control-plane/health")
async def control_plane_health():
    """Control Plane health check."""
    if not settings.control_plane_enabled:
        raise HTTPException(status_code=404, detail="Control Plane disabled")

    return {
        "status": "ok",
        "control_plane_enabled": True,
        "session_storage": "postgresql",
        "version": "0.2.0"
    }


@app.get("/control-plane/sessions")
async def control_plane_sessions(request: Request):
    """List agent sessions (placeholder)."""
    if not settings.control_plane_enabled:
        raise HTTPException(status_code=404, detail="Control Plane disabled")

    api_key = _unwrap_secret(settings.agno_api_key)
    if not api_key and (os.getenv("NODE_ENV") == "production"):
        raise HTTPException(status_code=401, detail="Auth required")
    if api_key:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Auth required")
        provided = auth_header.replace("Bearer ", "")
        if not hmac.compare_digest(provided, api_key):
            raise HTTPException(status_code=403, detail="Invalid API key")

    return {"sessions": [], "count": 0}


# ============================================================================
# Agent Endpoints
# ============================================================================

@app.post("/agents/approval/runs", response_model=AgentRunResponse)
@limiter.limit("10/minute")
async def run_approval_agent(request_data: AgentRunRequest, request: Request):
    """Run the ApprovalAgent."""
    workspace_id = getattr(request.state, "workspace_id", None)
    user_id = getattr(request.state, "user_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        response = await approval_agent.run(
            message=request_data.message,
            workspace_id=workspace_id,
            user_id=user_id,
            jwt_token=jwt_token,
            model_override=request_data.model_override,
            session_id=request_data.session_id,
        )
        return AgentRunResponse(**response)
    except Exception as e:
        logger.error(f"ApprovalAgent failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Agent execution failed")


@app.get("/agents/approval/info")
async def approval_agent_info():
    """Get ApprovalAgent information."""
    return {
        "agent": "Sentinel",
        "title": "Human-in-the-Loop Gatekeeper",
        "description": "Manages approval workflows",
        "capabilities": [
            "Request approvals",
            "Query approval queue",
            "Approve/reject items",
            "View statistics",
        ],
        "endpoint": "/agents/approval/runs",
        "version": "0.2.0",
    }


# ============================================================================
# Team Endpoints (with AG-UI streaming support)
# ============================================================================

@app.post("/agents/validation/runs")
@limiter.limit("10/minute")
async def run_validation_team(request_data: TeamRunRequest, request: Request):
    """Run Validation Team. Set stream=true for SSE."""
    await validate_business_ownership(request, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("validation", request_data, request)
    return await _run_team("validation", request_data, request)


@app.get("/agents/validation/health")
async def validation_team_health():
    """Validation team health check."""
    return _get_team_health("validation")


@app.post("/agents/planning/runs")
@limiter.limit("10/minute")
async def run_planning_team(request_data: TeamRunRequest, request: Request):
    """Run Planning Team. Set stream=true for SSE."""
    await validate_business_ownership(request, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("planning", request_data, request)
    return await _run_team("planning", request_data, request)


@app.get("/agents/planning/health")
async def planning_team_health():
    """Planning team health check."""
    return _get_team_health("planning")


@app.post("/agents/branding/runs")
@limiter.limit("10/minute")
async def run_branding_team(request_data: TeamRunRequest, request: Request):
    """Run Branding Team. Set stream=true for SSE."""
    await validate_business_ownership(request, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("branding", request_data, request)
    return await _run_team("branding", request_data, request)


@app.get("/agents/branding/health")
async def branding_team_health():
    """Branding team health check."""
    return _get_team_health("branding")


# ============================================================================
# Knowledge Base Endpoints (RAG)
# ============================================================================

# Import knowledge module
from knowledge import (
    ingest_document,
    ingest_url,
    ingest_text,
    search_knowledge,
    DocumentMetadata,
    get_workspace_knowledge,
)


class IngestDocumentRequest(BaseModel):
    """Request for document ingestion."""
    source: str = Field(..., description="URL or file path to ingest")
    title: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IngestTextRequest(BaseModel):
    """Request for text ingestion."""
    text: str = Field(..., description="Text content to ingest")
    title: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class SearchKnowledgeRequest(BaseModel):
    """Request for knowledge search."""
    query: str = Field(..., description="Search query")
    limit: int = Field(default=5, ge=1, le=20)
    filters: Dict[str, Any] = Field(default_factory=dict)


@app.post("/knowledge/ingest")
@limiter.limit("20/minute")
async def ingest_knowledge_document(
    request_data: IngestDocumentRequest,
    request: Request,
):
    """
    Ingest a document into the workspace knowledge base.

    Supports: PDF, CSV, Markdown, DOCX, PPTX, JSON, URLs, YouTube, ArXiv
    """
    workspace_id = getattr(request.state, "workspace_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Build metadata
    metadata = DocumentMetadata(
        title=request_data.title,
        category=request_data.category,
        tags=request_data.tags,
        custom=request_data.metadata,
    )

    result = await ingest_document(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        source=request_data.source,
        metadata=metadata,
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=result.error)

    return result.to_dict()


@app.post("/knowledge/ingest/text")
@limiter.limit("30/minute")
async def ingest_knowledge_text(
    request_data: IngestTextRequest,
    request: Request,
):
    """Ingest raw text into the workspace knowledge base."""
    workspace_id = getattr(request.state, "workspace_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    metadata = DocumentMetadata(
        title=request_data.title,
        category=request_data.category,
        tags=request_data.tags,
    )

    result = await ingest_text(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        text=request_data.text,
        title=request_data.title,
        metadata=metadata,
    )

    if not result.success:
        raise HTTPException(status_code=400, detail=result.error)

    return result.to_dict()


@app.post("/knowledge/search")
@limiter.limit("60/minute")
async def search_workspace_knowledge(
    request_data: SearchKnowledgeRequest,
    request: Request,
):
    """
    Search the workspace knowledge base.

    Returns relevant documents based on semantic similarity.
    """
    workspace_id = getattr(request.state, "workspace_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    results = await search_knowledge(
        workspace_id=workspace_id,
        jwt_token=jwt_token,
        query=request_data.query,
        limit=request_data.limit,
        filters=request_data.filters,
    )

    return {
        "query": request_data.query,
        "results": results,
        "count": len(results),
    }


@app.get("/knowledge/status")
async def knowledge_status(request: Request):
    """Get knowledge base status for the workspace."""
    workspace_id = getattr(request.state, "workspace_id", None)
    jwt_token = getattr(request.state, "jwt_token", None)

    if not workspace_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        return {
            "status": "active",
            "workspace_id": workspace_id,
            "vector_db": "pgvector",
            "search_type": "hybrid",
        }
    except Exception as e:
        return {
            "status": "error",
            "workspace_id": workspace_id,
            "error": str(e),
        }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.agentos_host,
        port=settings.agentos_port,
        log_level="info"
    )
