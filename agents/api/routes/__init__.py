"""
API Routes Package for HYVVE AgentOS

Contains route definitions for API endpoints.
"""

from agents.api.routes.metrics import router as metrics_router

__all__ = ["metrics_router"]
