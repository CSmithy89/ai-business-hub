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
import uuid

# Import registry and A2A models
from registry import registry, AgentCard

# Import AG-UI encoder
from ag_ui.encoder import EventEncoder, AGUIEventType

# Import platform agents
from platform.approval_agent import ApprovalAgent

# Import team factories
from validation.team import create_validation_team
from planning.team import create_planning_team
from branding.team import create_branding_team

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
app.add_middleware(
    TenantMiddleware,
    secret_key=_unwrap_secret(settings.better_auth_secret) or ""
)

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

async def _run_team(
    team_name: str,
    request_data: TeamRunRequest,
    req: Request,
) -> TeamRunResponse:
    """Run agent team and return JSON response."""
    config = TEAM_CONFIG.get(team_name)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown team: {team_name}")

    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    logger.info(f"{team_name}Team run: ws={workspace_id}, user={user_id}")

    try:
        session_id = request_data.session_id or f"{config['session_prefix']}_{user_id}_{int(time.time())}"
        team = config["factory"](
            session_id=session_id,
            user_id=user_id,
            business_id=request_data.business_id,
            model=request_data.model_override,
        )

        response = await asyncio.wait_for(
            team.arun(message=request_data.message),
            timeout=TEAM_EXECUTION_TIMEOUT
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
            }
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"{team_name} team timed out")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"{team_name}Team failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def _run_team_stream(
    team_name: str,
    request_data: TeamRunRequest,
    req: Request,
):
    """Run agent team with AG-UI SSE streaming."""
    config = TEAM_CONFIG.get(team_name)
    if not config:
        raise HTTPException(status_code=400, detail=f"Unknown team: {team_name}")

    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if not workspace_id or not user_id:
        raise HTTPException(status_code=401, detail="Authentication required.")

    session_id = request_data.session_id or f"{config['session_prefix']}_{user_id}_{int(time.time())}"

    async def generate():
        encoder = EventEncoder()

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
                model=request_data.model_override,
            )

            # Use streaming if available
            if hasattr(team, 'arun_stream'):
                async for chunk in team.arun_stream(message=request_data.message):
                    if hasattr(chunk, "content") and chunk.content:
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
                yield encoder.encode(AGUIEventType.TEXT_MESSAGE_CHUNK, {
                    "delta": response.content,
                    "messageId": f"msg_{session_id}"
                })

            # Send RUN_FINISHED
            yield encoder.encode(AGUIEventType.RUN_FINISHED, {
                "runId": session_id,
                "status": "success"
            })

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield encoder.encode(AGUIEventType.ERROR, {
                "code": "EXECUTION_ERROR",
                "message": str(e)
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
async def a2a_rpc(agent_id: str, request: JSONRPCRequest, req: Request):
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
    if request.jsonrpc != "2.0":
        return JSONRPCResponse(
            id=request.id,
            error=JSONRPCError(
                code=-32600,
                message="Invalid Request",
                data={"details": "jsonrpc must be '2.0'"}
            )
        )

    # Get the team/agent
    team = registry.get_team(agent_id)
    if not team:
        return JSONRPCResponse(
            id=request.id,
            error=JSONRPCError(
                code=-32601,
                message="Method not found",
                data={"details": f"Agent '{agent_id}' not registered"}
            )
        )

    # Handle methods
    if request.method == "run":
        task = request.params.get("task")
        if not task:
            return JSONRPCResponse(
                id=request.id,
                error=JSONRPCError(
                    code=-32602,
                    message="Invalid params",
                    data={"details": "Missing 'task' parameter"}
                )
            )

        try:
            # Get context from params or request state
            context = request.params.get("context", {})
            caller_id = context.get("caller_id", "anonymous")

            logger.info(f"A2A RPC: {caller_id} -> {agent_id}: {task[:50]}...")

            response = await asyncio.wait_for(
                team.arun(message=task),
                timeout=TEAM_EXECUTION_TIMEOUT
            )

            return JSONRPCResponse(
                id=request.id,
                result=JSONRPCResult(
                    content=response.content,
                    tool_calls=[],
                    artifacts=[]
                )
            )
        except asyncio.TimeoutError:
            return JSONRPCResponse(
                id=request.id,
                error=JSONRPCError(
                    code=-32000,
                    message="Execution timeout",
                    data={"timeout_seconds": TEAM_EXECUTION_TIMEOUT}
                )
            )
        except Exception as e:
            logger.error(f"A2A RPC error: {e}", exc_info=True)
            return JSONRPCResponse(
                id=request.id,
                error=JSONRPCError(
                    code=-32603,
                    message="Internal error",
                    data={"details": str(e)}
                )
            )

    elif request.method == "health":
        health = _get_team_health(agent_id)
        return JSONRPCResponse(
            id=request.id,
            result=JSONRPCResult(content=str(health))
        )

    elif request.method == "capabilities":
        card = registry.get_card(agent_id)
        return JSONRPCResponse(
            id=request.id,
            result=JSONRPCResult(content=card.model_dump_json() if card else "{}")
        )

    else:
        return JSONRPCResponse(
            id=request.id,
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
    if api_key:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Auth required")
        if auth_header.replace("Bearer ", "") != api_key:
            raise HTTPException(status_code=403, detail="Invalid API key")

    return {"sessions": [], "count": 0}


# ============================================================================
# Agent Endpoints
# ============================================================================

@app.post("/agents/approval/runs", response_model=AgentRunResponse)
@limiter.limit("10/minute")
async def run_approval_agent(request_data: AgentRunRequest, req: Request):
    """Run the ApprovalAgent."""
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)
    jwt_token = getattr(req.state, "jwt_token", None)

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
        raise HTTPException(status_code=500, detail=str(e))


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
async def run_validation_team(request_data: TeamRunRequest, req: Request):
    """Run Validation Team. Set stream=true for SSE."""
    await validate_business_ownership(req, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("validation", request_data, req)
    return await _run_team("validation", request_data, req)


@app.get("/agents/validation/health")
async def validation_team_health():
    """Validation team health check."""
    return _get_team_health("validation")


@app.post("/agents/planning/runs")
@limiter.limit("10/minute")
async def run_planning_team(request_data: TeamRunRequest, req: Request):
    """Run Planning Team. Set stream=true for SSE."""
    await validate_business_ownership(req, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("planning", request_data, req)
    return await _run_team("planning", request_data, req)


@app.get("/agents/planning/health")
async def planning_team_health():
    """Planning team health check."""
    return _get_team_health("planning")


@app.post("/agents/branding/runs")
@limiter.limit("10/minute")
async def run_branding_team(request_data: TeamRunRequest, req: Request):
    """Run Branding Team. Set stream=true for SSE."""
    await validate_business_ownership(req, request_data.business_id)
    if request_data.stream:
        return await _run_team_stream("branding", request_data, req)
    return await _run_team("branding", request_data, req)


@app.get("/agents/branding/health")
async def branding_team_health():
    """Branding team health check."""
    return _get_team_health("branding")


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
