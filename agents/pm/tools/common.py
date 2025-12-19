"""
Common utilities for PM Agent tools
AI Business Hub - Project Management Module

Shared utilities including authentication and API configuration.

Required Environment Variables
==============================

API_BASE_URL (required):
    Base URL for the NestJS API server.
    Example: "http://localhost:3001" (development)
             "https://api.hyvve.app" (production)

AGENT_SERVICE_TOKEN (required for authenticated endpoints):
    Service authentication token for agent-to-API calls.
    Must match the AGENT_SERVICE_TOKEN configured in the NestJS API.
    This token is validated by ServiceAuthGuard on the API side.
    Generate with: openssl rand -hex 32

DATABASE_URL (required for agent memory):
    PostgreSQL connection URL for agent memory persistence.
    Format: postgresql://user:password@host:port/database
    Example: "postgresql://postgres:password@localhost:5432/hyvve"

Optional Environment Variables
=============================

ANTHROPIC_API_KEY:
    API key for Claude models (required if using Claude).

OPENAI_API_KEY:
    API key for OpenAI models (optional fallback).
"""

import os
import logging
from typing import Dict

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL")
if not API_BASE_URL:
    raise ValueError(
        "API_BASE_URL environment variable must be set. "
        "Example: http://localhost:3001"
    )

# Service token for agent-to-API calls (internal service auth)
# This must match the AGENT_SERVICE_TOKEN in the NestJS API environment
AGENT_SERVICE_TOKEN = os.getenv("AGENT_SERVICE_TOKEN")


def get_auth_headers(workspace_id: str) -> Dict[str, str]:
    """Build headers for authenticated API calls.

    Args:
        workspace_id: Workspace/tenant identifier

    Returns:
        Dict with required headers including auth if available
    """
    headers = {
        "x-workspace-id": workspace_id,
        "Content-Type": "application/json",
    }

    # Add service auth token if available (for internal agent calls)
    if AGENT_SERVICE_TOKEN:
        headers["Authorization"] = f"Bearer {AGENT_SERVICE_TOKEN}"
    else:
        logger.warning("AGENT_SERVICE_TOKEN not set - API calls may fail auth")

    return headers
