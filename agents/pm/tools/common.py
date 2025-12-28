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
from typing import Any, Dict, Optional, TypeVar, Type

import httpx
from pydantic import BaseModel, ValidationError

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

# Default timeout for API requests (seconds)
DEFAULT_TIMEOUT = 30.0


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


class ApiError:
    """Standardized API error response."""

    def __init__(
        self,
        status_code: Optional[int],
        message: str,
        fallback_data: Optional[Dict[str, Any]] = None,
    ):
        self.status_code = status_code
        self.message = message
        self.fallback_data = fallback_data or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for tool return value."""
        result = {
            "error": f"HTTP {self.status_code}" if self.status_code else "Request failed",
            "message": self.message,
        }
        result.update(self.fallback_data)
        return result


class AgentToolError(Exception):
    """Exception raised when an agent tool fails.

    This provides explicit error handling instead of silent fallback defaults.
    Use this to propagate errors up to the agent for proper handling.
    """

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        tool_name: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.tool_name = tool_name
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for error reporting."""
        return {
            "error": True,
            "message": self.message,
            "status_code": self.status_code,
            "tool_name": self.tool_name,
        }


# Type variable for Pydantic model responses
T = TypeVar("T", bound=BaseModel)


def api_request_strict(
    method: str,
    endpoint: str,
    workspace_id: str,
    response_model: Type[T],
    *,
    json: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> T:
    """Make an authenticated API request with strict validation.

    Unlike api_request(), this function:
    - Raises AgentToolError on HTTP failures (no silent fallbacks)
    - Validates response against a Pydantic model
    - Returns typed, validated data

    Args:
        method: HTTP method (GET, POST, PUT, DELETE, PATCH)
        endpoint: API endpoint path (will be prefixed with API_BASE_URL)
        workspace_id: Workspace/tenant identifier for auth
        response_model: Pydantic model class to validate response against
        json: Optional JSON body for POST/PUT requests
        params: Optional query parameters
        timeout: Request timeout in seconds (default: 30)

    Returns:
        Validated Pydantic model instance

    Raises:
        AgentToolError: On HTTP errors or validation failures
    """
    url = f"{API_BASE_URL}{endpoint}"
    headers = get_auth_headers(workspace_id)

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.request(
                method=method.upper(),
                url=url,
                headers=headers,
                json=json,
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            # Validate response against Pydantic model
            return response_model.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"API request failed: {method} {endpoint} - {e.response.status_code}")
        raise AgentToolError(
            message=f"API request failed: {str(e)}",
            status_code=e.response.status_code,
            tool_name=endpoint,
        )
    except httpx.RequestError as e:
        logger.error(f"API request error: {method} {endpoint} - {str(e)}")
        raise AgentToolError(
            message=f"Network error: {str(e)}",
            tool_name=endpoint,
        )
    except ValidationError as e:
        logger.error(f"Response validation failed: {method} {endpoint} - {str(e)}")
        raise AgentToolError(
            message=f"Invalid response format: {str(e)}",
            tool_name=endpoint,
        )
    except Exception as e:
        logger.error(f"Unexpected error: {method} {endpoint} - {str(e)}")
        raise AgentToolError(
            message=f"Unexpected error: {str(e)}",
            tool_name=endpoint,
        )


def api_request(
    method: str,
    endpoint: str,
    workspace_id: str,
    *,
    json: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None,
    timeout: float = DEFAULT_TIMEOUT,
    fallback_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Make an authenticated API request with standardized error handling.

    Args:
        method: HTTP method (GET, POST, PUT, DELETE, PATCH)
        endpoint: API endpoint path (will be prefixed with API_BASE_URL)
        workspace_id: Workspace/tenant identifier for auth
        json: Optional JSON body for POST/PUT requests
        params: Optional query parameters
        timeout: Request timeout in seconds (default: 30)
        fallback_data: Data to include in error response (e.g., {"risks": []})

    Returns:
        API response data on success, or error dict with fallback_data on failure:
        {
            "error": "HTTP 500" | "Request failed",
            "message": str,
            **fallback_data
        }

    Example:
        >>> result = api_request(
        ...     "POST",
        ...     "/api/pm/agents/health/proj123/detect-risks",
        ...     "workspace123",
        ...     fallback_data={"risks": []}
        ... )
    """
    url = f"{API_BASE_URL}{endpoint}"
    headers = get_auth_headers(workspace_id)

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.request(
                method=method.upper(),
                url=url,
                headers=headers,
                json=json,
                params=params,
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"API request failed: {method} {endpoint} - {e.response.status_code}")
        return ApiError(
            status_code=e.response.status_code,
            message=str(e),
            fallback_data=fallback_data,
        ).to_dict()
    except httpx.RequestError as e:
        logger.error(f"API request error: {method} {endpoint} - {str(e)}")
        return ApiError(
            status_code=None,
            message=str(e),
            fallback_data=fallback_data,
        ).to_dict()
    except Exception as e:
        logger.error(f"Unexpected error: {method} {endpoint} - {str(e)}")
        return ApiError(
            status_code=None,
            message=str(e),
            fallback_data=fallback_data,
        ).to_dict()
