"""
API Middleware for HYVVE AgentOS

This package contains middleware and dependencies for FastAPI routes.
"""

from agents.api.middleware.metrics_auth import verify_metrics_auth

__all__ = ["verify_metrics_auth"]
