"""
HYVVE AgentOS - AI Agent Runtime

Production runtime for Agno agents with tenant isolation,
JWT authentication, and Control Plane monitoring support.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from middleware.tenant import TenantMiddleware
from config import settings
from pydantic import BaseModel
from typing import Optional
import logging

# Import platform agents
from platform.approval_agent import ApprovalAgent

# Import validation team
from validation.team import create_validation_team

# Import planning team
from planning.team import create_planning_team

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="HYVVE AgentOS",
    description="AI Agent Runtime with tenant isolation and BYOAI support",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
allowed_origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://localhost:3001",  # NestJS API
]

# Add Control Plane origin if enabled
if settings.control_plane_enabled:
    allowed_origins.append("https://os.agno.com")  # Agno Control Plane

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenant middleware (JWT validation and workspace_id injection)
app.add_middleware(
    TenantMiddleware,
    secret_key=settings.better_auth_secret
)


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
    metadata: dict = {}


class TeamRunRequest(BaseModel):
    """Request model for team run endpoint."""
    message: str
    business_id: str  # Required for team context
    session_id: Optional[str] = None
    model_override: Optional[str] = None
    context: Optional[dict] = None  # For workflow handoff data


class TeamRunResponse(BaseModel):
    """Response model for team run endpoint."""
    success: bool
    content: Optional[str] = None
    session_id: str
    agent_name: Optional[str] = None  # Which agent responded
    error: Optional[str] = None
    metadata: dict = {}


# ============================================================================
# Initialize Agents
# ============================================================================

# Initialize ApprovalAgent
approval_agent = ApprovalAgent(
    database_url=settings.database_url,
    default_model="gpt-4o"
)
logger.info("ApprovalAgent initialized")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("AgentOS starting up...")
    logger.info(f"Version: 0.1.0")
    logger.info(f"Port: {settings.agentos_port}")
    logger.info(f"Database: {'configured' if settings.database_url else 'not configured'}")
    logger.info(f"Redis: {'configured' if settings.redis_url else 'not configured'}")
    logger.info(f"Control Plane: {'enabled' if settings.control_plane_enabled else 'disabled'}")
    if settings.control_plane_enabled:
        logger.info("Control Plane URL: https://os.agno.com")
        logger.info(f"Control Plane Auth: {'enabled' if settings.agno_api_key else 'disabled'}")


@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "HYVVE AgentOS",
        "version": "0.1.0",
        "status": "operational",
        "documentation": "/docs"
    }


@app.get("/health")
async def health(request: Request):
    """
    Health check endpoint

    Returns service status, version, and configuration info.
    Does not require authentication.
    """
    return {
        "status": "ok",
        "version": "0.1.0",
        "environment": {
            "database_configured": bool(settings.database_url),
            "redis_configured": bool(settings.redis_url),
            "port": str(settings.agentos_port)
        },
        "tenant_context": {
            "user_id": getattr(request.state, "user_id", None),
            "workspace_id": getattr(request.state, "workspace_id", None)
        }
    }


@app.get("/ready")
async def ready():
    """
    Readiness check endpoint

    Returns whether the service is ready to accept requests.
    """
    return {
        "ready": True,
        "version": "0.1.0"
    }


# ============================================================================
# Control Plane Endpoints
# ============================================================================

@app.get("/control-plane/health")
async def control_plane_health():
    """
    Control Plane health check endpoint

    Returns Control Plane status and session statistics.
    Does not require authentication.
    """
    if not settings.control_plane_enabled:
        raise HTTPException(
            status_code=404,
            detail="Control Plane is disabled"
        )

    # Get session count from database
    try:
        # Query agent_sessions table for count
        # Note: This is a simple implementation - in production you might want
        # to use the Agno SDK or direct database query
        session_count = 0  # Placeholder - actual count would come from DB

        return {
            "status": "ok",
            "control_plane_enabled": True,
            "session_storage": "postgresql",
            "sessions_count": session_count,
            "version": "0.1.0"
        }
    except Exception as e:
        logger.error(f"Control Plane health check failed: {str(e)}")
        return {
            "status": "degraded",
            "control_plane_enabled": True,
            "error": str(e)
        }


@app.get("/control-plane/sessions")
async def control_plane_sessions(request: Request):
    """
    List all agent sessions

    Returns a list of agent sessions with basic metadata.
    Used by Control Plane UI to display session list.

    Optional authentication via AGNO_API_KEY if configured.
    """
    if not settings.control_plane_enabled:
        raise HTTPException(
            status_code=404,
            detail="Control Plane is disabled"
        )

    # Optional API key authentication
    if settings.agno_api_key:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Provide AGNO_API_KEY as Bearer token."
            )

        token = auth_header.replace("Bearer ", "")
        if token != settings.agno_api_key:
            raise HTTPException(
                status_code=403,
                detail="Invalid API key"
            )

    try:
        # Note: In a full implementation, you would query the agent_sessions table
        # This is a placeholder that returns the structure expected by Control Plane
        sessions = []

        return {
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        logger.error(f"Failed to fetch sessions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch sessions: {str(e)}"
        )


@app.get("/control-plane/sessions/{session_id}")
async def control_plane_session_details(session_id: str, request: Request):
    """
    Get detailed information about a specific session

    Returns session metadata and full message history.
    Used by Control Plane UI to display conversation details.

    Optional authentication via AGNO_API_KEY if configured.
    """
    if not settings.control_plane_enabled:
        raise HTTPException(
            status_code=404,
            detail="Control Plane is disabled"
        )

    # Optional API key authentication
    if settings.agno_api_key:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Provide AGNO_API_KEY as Bearer token."
            )

        token = auth_header.replace("Bearer ", "")
        if token != settings.agno_api_key:
            raise HTTPException(
                status_code=403,
                detail="Invalid API key"
            )

    try:
        # Note: In a full implementation, you would query the agent_sessions table
        # and return the specific session with its messages
        # This is a placeholder structure

        session = {
            "id": session_id,
            "agent_name": "Unknown",
            "messages": [],
            "created_at": None,
            "updated_at": None
        }

        return {
            "session": session
        }
    except Exception as e:
        logger.error(f"Failed to fetch session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch session: {str(e)}"
        )


# ============================================================================
# Agent Endpoints
# ============================================================================

@app.post("/agents/approval/runs", response_model=AgentRunResponse)
async def run_approval_agent(request_data: AgentRunRequest, req: Request):
    """
    Run the ApprovalAgent with a user message.

    This endpoint creates a conversational session with the ApprovalAgent,
    which can manage approval workflows, check queue status, and execute
    approval actions.

    The agent has access to tools that communicate with the NestJS API
    to fetch and manage approvals.

    Security:
    - Requires valid JWT token (validated by TenantMiddleware)
    - Workspace context extracted from JWT
    - All tool calls use workspace-scoped permissions

    Request Body:
    - message: User's message/query for the agent
    - session_id: Optional session ID for conversation continuity
    - model_override: Optional model override (default: gpt-4o)

    Returns:
    - AgentRunResponse with agent's response and metadata
    """
    # Extract workspace context from middleware
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)
    jwt_token = getattr(req.state, "jwt_token", None)

    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Valid JWT token with workspace context needed."
        )

    logger.info(
        f"ApprovalAgent run request: workspace={workspace_id}, "
        f"user={user_id}, session={request_data.session_id}"
    )

    try:
        # Run agent
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
        logger.error(f"ApprovalAgent run failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Agent execution failed: {str(e)}"
        )


@app.get("/agents/approval/info")
async def approval_agent_info():
    """
    Get information about the ApprovalAgent.

    Returns agent metadata, capabilities, and available tools.
    Does not require authentication.
    """
    return {
        "agent": "Sentinel",
        "title": "Human-in-the-Loop Gatekeeper + Approval Workflow Manager",
        "description": "Manages approval workflows with conversational interface",
        "capabilities": [
            "Request approvals with HITL confirmation",
            "Query approval queue with filters",
            "Approve/reject pending items",
            "Get detailed approval information",
            "View queue statistics and metrics",
        ],
        "tools": [
            {
                "name": "request_approval",
                "description": "Request approval for a critical action (requires confirmation)",
                "requires_confirmation": True,
            },
            {
                "name": "get_pending_approvals",
                "description": "Get list of pending approval requests",
                "requires_confirmation": False,
            },
            {
                "name": "approve_item",
                "description": "Approve a pending approval request",
                "requires_confirmation": False,
            },
            {
                "name": "reject_item",
                "description": "Reject a pending approval request (requires reason)",
                "requires_confirmation": False,
            },
            {
                "name": "get_approval_details",
                "description": "Get detailed information about a specific approval",
                "requires_confirmation": False,
            },
            {
                "name": "get_approval_stats",
                "description": "Get approval queue statistics",
                "requires_confirmation": False,
            },
        ],
        "endpoint": "/agents/approval/runs",
        "version": "0.1.0",
    }


# ============================================================================
# Validation Team Endpoints
# ============================================================================

@app.post("/agents/validation/runs", response_model=TeamRunResponse)
async def run_validation_team(request_data: TeamRunRequest, req: Request):
    """
    Run the Validation Team (Vera + specialists).

    Validates business ideas through market sizing, competitor analysis,
    customer discovery, and feasibility assessment.

    Security:
    - Requires valid JWT token (validated by TenantMiddleware)
    - Workspace context extracted from JWT
    - All tool calls use workspace-scoped permissions

    Request Body:
    - message: User's message/query for the validation team
    - business_id: Business context identifier (required)
    - session_id: Optional session ID for conversation continuity
    - model_override: Optional model override
    - context: Optional context data for workflow handoff

    Returns:
    - TeamRunResponse with agent's response and metadata
    """
    # Extract workspace context from middleware
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Valid JWT token with workspace context needed."
        )

    logger.info(
        f"ValidationTeam run: workspace={workspace_id}, "
        f"user={user_id}, business={request_data.business_id}"
    )

    try:
        # Generate session ID if not provided
        import time
        session_id = request_data.session_id or f"val_{user_id}_{int(time.time())}"

        # Create team instance (stateless - per request)
        team = create_validation_team(
            session_id=session_id,
            user_id=user_id,
            business_id=request_data.business_id,
            model=request_data.model_override,
        )

        # Run team
        response = await team.arun(message=request_data.message)

        return TeamRunResponse(
            success=True,
            content=response.content,
            session_id=session_id,
            agent_name=getattr(response, 'agent_name', 'Vera'),
            metadata={
                "business_id": request_data.business_id,
                "team": "validation",
                "workspace_id": workspace_id,
            }
        )
    except Exception as e:
        logger.error(f"ValidationTeam run failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Validation team execution failed: {str(e)}"
        )


@app.get("/agents/validation/health")
async def validation_team_health():
    """
    Health check for validation team.

    Returns team status, leader, and member information.
    Does not require authentication.
    """
    try:
        # Quick validation that team can be created
        team = create_validation_team(
            session_id="health_check",
            user_id="system",
        )

        return {
            "status": "ok",
            "team": "validation",
            "leader": "Vera",
            "members": ["Marco", "Cipher", "Persona", "Risk"],
            "version": "0.1.0",
            "storage": "bmv_validation_sessions",
        }
    except Exception as e:
        logger.error(f"Validation health check failed: {str(e)}")
        return {
            "status": "error",
            "team": "validation",
            "error": str(e)
        }


# ============================================================================
# Planning Team Endpoints
# ============================================================================

@app.post("/agents/planning/runs", response_model=TeamRunResponse)
async def run_planning_team(request_data: TeamRunRequest, req: Request):
    """
    Run the Planning Team (Blake + specialists).

    Develops comprehensive business plans including business model canvas,
    financial projections, pricing strategy, and growth forecasts.

    Security:
    - Requires valid JWT token (validated by TenantMiddleware)
    - Workspace context extracted from JWT
    - All tool calls use workspace-scoped permissions

    Request Body:
    - message: User's message/query for the planning team
    - business_id: Business context identifier (required)
    - session_id: Optional session ID for conversation continuity
    - model_override: Optional model override
    - context: Optional context data for workflow handoff (validationData)

    Returns:
    - TeamRunResponse with agent's response and metadata
    """
    # Extract workspace context from middleware
    workspace_id = getattr(req.state, "workspace_id", None)
    user_id = getattr(req.state, "user_id", None)

    if not workspace_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Valid JWT token with workspace context needed."
        )

    logger.info(
        f"PlanningTeam run: workspace={workspace_id}, "
        f"user={user_id}, business={request_data.business_id}"
    )

    try:
        # Generate session ID if not provided
        import time
        session_id = request_data.session_id or f"plan_{user_id}_{int(time.time())}"

        # Create team instance (stateless - per request)
        team = create_planning_team(
            session_id=session_id,
            user_id=user_id,
            business_id=request_data.business_id,
            model=request_data.model_override,
        )

        # Run team
        response = await team.arun(message=request_data.message)

        return TeamRunResponse(
            success=True,
            content=response.content,
            session_id=session_id,
            agent_name=getattr(response, 'agent_name', 'Blake'),
            metadata={
                "business_id": request_data.business_id,
                "team": "planning",
                "workspace_id": workspace_id,
            }
        )
    except Exception as e:
        logger.error(f"PlanningTeam run failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Planning team execution failed: {str(e)}"
        )


@app.get("/agents/planning/health")
async def planning_team_health():
    """
    Health check for planning team.

    Returns team status, leader, and member information.
    Does not require authentication.
    """
    try:
        # Quick validation that team can be created
        team = create_planning_team(
            session_id="health_check",
            user_id="system",
        )

        return {
            "status": "ok",
            "team": "planning",
            "leader": "Blake",
            "members": ["Model", "Finance", "Revenue", "Forecast"],
            "version": "0.1.0",
            "storage": "bmp_planning_sessions",
        }
    except Exception as e:
        logger.error(f"Planning health check failed: {str(e)}")
        return {
            "status": "error",
            "team": "planning",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.agentos_host,
        port=settings.agentos_port,
        log_level="info"
    )
