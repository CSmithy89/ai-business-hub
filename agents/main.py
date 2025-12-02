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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:3001",  # NestJS API
    ],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.agentos_host,
        port=settings.agentos_port,
        log_level="info"
    )
