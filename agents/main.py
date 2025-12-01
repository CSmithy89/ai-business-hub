"""
HYVVE AgentOS - AI Agent Runtime

Production runtime for Agno agents with tenant isolation,
JWT authentication, and Control Plane monitoring support.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from middleware.tenant import TenantMiddleware
from config import settings
import logging

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.agentos_host,
        port=settings.agentos_port,
        log_level="info"
    )
