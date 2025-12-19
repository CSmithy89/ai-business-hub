"""
Common utilities for PM Agent tools
AI Business Hub - Project Management Module

Shared utilities including authentication and API configuration.
"""

import os
import logging
from typing import Dict

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL")
if not API_BASE_URL:
    raise ValueError("API_BASE_URL environment variable must be set")

# Service token for agent-to-API calls (internal service auth)
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
