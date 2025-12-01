"""
AgentOS Placeholder - Story 00-5
Full implementation will be completed in Story 00-7

This is a minimal FastAPI application that provides a health check endpoint.
Full AgentOS features to be implemented in Story 00-7:
- Agno framework integration
- SQLAlchemy ORM for database access
- Tenant middleware for workspace_id extraction from JWT
- Control Plane connection (os.agno.com)
- Agent execution and monitoring
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="HYVVE AgentOS",
    description="AI Agent Runtime - Placeholder",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "HYVVE AgentOS",
        "status": "placeholder",
        "message": "Full implementation in Story 00-7"
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "ok",
        "version": "0.1.0-placeholder",
        "message": "AgentOS placeholder - will be implemented in Story 00-7",
        "environment": {
            "database_configured": bool(os.getenv("DATABASE_URL")),
            "redis_configured": bool(os.getenv("REDIS_URL")),
            "port": os.getenv("AGENTOS_PORT", "7777")
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENTOS_PORT", "7777"))
    uvicorn.run(app, host="0.0.0.0", port=port)
