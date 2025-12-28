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
import atexit
from contextlib import contextmanager
from typing import Any, Dict, Optional, TypeVar, Type, Generator

import httpx
from pydantic import BaseModel, ValidationError

# Configure structured logging for agent operations
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
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

# Connection pool configuration for performance
# These settings optimize HTTP connection reuse across agent tool calls
_HTTP_POOL_LIMITS = httpx.Limits(
    max_keepalive_connections=10,  # Max idle connections to keep
    max_connections=20,  # Max total connections
    keepalive_expiry=30.0,  # Keep idle connections for 30 seconds
)

# Shared HTTP client with connection pooling (lazy initialization)
_shared_client: Optional[httpx.Client] = None


def _get_shared_client() -> httpx.Client:
    """Get or create the shared HTTP client with connection pooling.

    This client maintains a connection pool for efficient HTTP/1.1 keep-alive
    connections to the API server. Using a shared client significantly reduces
    connection overhead for sequential agent tool calls.
    """
    global _shared_client
    if _shared_client is None:
        _shared_client = httpx.Client(
            timeout=DEFAULT_TIMEOUT,
            limits=_HTTP_POOL_LIMITS,
            http2=False,  # API is HTTP/1.1
        )
        # Register cleanup on interpreter shutdown
        atexit.register(_cleanup_shared_client)
        logger.debug("Initialized shared HTTP client with connection pool")
    return _shared_client


def _cleanup_shared_client() -> None:
    """Clean up the shared HTTP client on shutdown."""
    global _shared_client
    if _shared_client is not None:
        try:
            _shared_client.close()
            logger.debug("Closed shared HTTP client")
        except Exception as e:
            logger.warning(f"Error closing HTTP client: {e}")
        _shared_client = None


@contextmanager
def get_http_client(timeout: float = DEFAULT_TIMEOUT) -> Generator[httpx.Client, None, None]:
    """Get an HTTP client for API calls.

    Uses the shared connection-pooled client by default for standard timeouts.
    Creates a temporary client for custom timeouts to avoid thread-safety issues.
    Falls back to a temporary client if the shared client is not available.

    Args:
        timeout: Request timeout in seconds

    Yields:
        httpx.Client configured for API calls
    """
    # Use temporary client for non-default timeouts to avoid thread-safety issues
    # (mutating shared client timeout creates race conditions in concurrent use)
    if timeout != DEFAULT_TIMEOUT:
        with httpx.Client(timeout=httpx.Timeout(timeout)) as temp_client:
            yield temp_client
        return

    try:
        client = _get_shared_client()
        yield client
    except Exception:
        # Fallback to temporary client if shared client fails
        with httpx.Client(timeout=httpx.Timeout(timeout)) as temp_client:
            yield temp_client


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
        with get_http_client(timeout=timeout) as client:
            logger.debug(
                "API request",
                extra={
                    "method": method.upper(),
                    "endpoint": endpoint,
                    "workspace_id": workspace_id,
                }
            )
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
        # Don't log response body to avoid leaking sensitive data
        logger.error(
            "API request failed",
            extra={
                "method": method.upper(),
                "endpoint": endpoint,
                "status_code": e.response.status_code,
            }
        )
        raise AgentToolError(
            message=f"API request failed with status {e.response.status_code}",
            status_code=e.response.status_code,
            tool_name=endpoint,
        )
    except httpx.RequestError as e:
        logger.error(
            "API network error",
            extra={"method": method.upper(), "endpoint": endpoint, "error_type": type(e).__name__}
        )
        raise AgentToolError(
            message="Network error occurred",
            tool_name=endpoint,
        )
    except ValidationError as e:
        logger.error(
            "Response validation failed",
            extra={"method": method.upper(), "endpoint": endpoint, "error_count": len(e.errors())}
        )
        raise AgentToolError(
            message="Invalid response format from API",
            tool_name=endpoint,
        )
    except Exception:
        logger.exception(
            "Unexpected error in API call",
            extra={"method": method.upper(), "endpoint": endpoint}
        )
        raise AgentToolError(
            message="An unexpected error occurred",
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
        with get_http_client(timeout=timeout) as client:
            logger.debug(
                "API request",
                extra={
                    "method": method.upper(),
                    "endpoint": endpoint,
                    "workspace_id": workspace_id,
                }
            )
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
        # Don't log response body to avoid leaking sensitive data
        logger.error(
            "API request failed",
            extra={
                "method": method.upper(),
                "endpoint": endpoint,
                "status_code": e.response.status_code,
            }
        )
        return ApiError(
            status_code=e.response.status_code,
            message=f"Request failed with status {e.response.status_code}",
            fallback_data=fallback_data,
        ).to_dict()
    except httpx.RequestError:
        logger.error(
            "API network error",
            extra={"method": method.upper(), "endpoint": endpoint}
        )
        return ApiError(
            status_code=None,
            message="Network error occurred",
            fallback_data=fallback_data,
        ).to_dict()
    except Exception:
        logger.exception(
            "Unexpected error in API call",
            extra={"method": method.upper(), "endpoint": endpoint}
        )
        return ApiError(
            status_code=None,
            message="An unexpected error occurred",
            fallback_data=fallback_data,
        ).to_dict()
