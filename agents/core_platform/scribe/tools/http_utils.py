"""
HTTP Utilities for Scribe Agent Tools.
Provides shared functionality for API requests with rate limiting,
exception handling, and authentication.
"""

import os
import logging
from typing import Optional, Any
import httpx
from tenacity import (
    retry,
    wait_exponential,
    stop_after_attempt,
    retry_if_exception_type,
)

logger = logging.getLogger(__name__)

# Configuration from environment with sensible defaults
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3001")
DEFAULT_TIMEOUT = 30.0
MAX_RETRIES = 3


def build_headers(
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
) -> dict:
    """Build HTTP headers with authentication and workspace context."""
    headers = {}
    if workspace_id:
        headers["X-Workspace-Id"] = workspace_id
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"
    return headers


class APIError(Exception):
    """Custom exception for API errors with structured response."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _should_retry(exception: Exception) -> bool:
    """Determine if an exception should trigger a retry."""
    if isinstance(exception, httpx.TimeoutException):
        return True
    if isinstance(exception, httpx.ConnectError):
        return True
    if isinstance(exception, httpx.HTTPStatusError):
        # Retry on 429 (rate limit) and 5xx errors
        return exception.response.status_code in (429, 500, 502, 503, 504)
    return False


@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(MAX_RETRIES),
    retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    reraise=True,
)
async def make_api_request(
    method: str,
    endpoint: str,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT,
    json: Optional[dict] = None,
    params: Optional[dict] = None,
) -> dict:
    """
    Make an API request with rate limiting, retries, and exception handling.

    Args:
        method: HTTP method (GET, POST, PATCH, DELETE)
        endpoint: API endpoint path (e.g., "/api/kb/pages")
        workspace_id: Workspace ID for header
        api_token: API token for authentication
        api_base_url: Override default API base URL
        timeout: Request timeout in seconds
        json: JSON body for POST/PATCH requests
        params: Query parameters for GET requests

    Returns:
        dict with 'success', 'data'/'error', and optional metadata

    Raises:
        APIError: On non-retryable failures after exhausting retries
    """
    base_url = api_base_url or API_BASE_URL
    url = f"{base_url}{endpoint}"
    headers = build_headers(workspace_id, api_token)

    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method.upper(),
                url=url,
                headers=headers,
                json=json,
                params=params,
                timeout=timeout,
            )

            # Check for HTTP errors
            if response.status_code >= 400:
                error_text = response.text
                logger.warning(
                    f"API request failed: {method} {endpoint} - {response.status_code}: {error_text}"
                )
                return {
                    "success": False,
                    "error": f"API error ({response.status_code}): {error_text}",
                    "status_code": response.status_code,
                }

            # Parse successful response
            try:
                data = response.json()
            except Exception:
                data = {"raw": response.text}

            return {
                "success": True,
                "data": data,
                "status_code": response.status_code,
            }

    except httpx.TimeoutException as e:
        logger.error(f"Request timeout: {method} {endpoint} - {e}")
        return {
            "success": False,
            "error": f"Request timeout after {timeout}s",
        }

    except httpx.ConnectError as e:
        logger.error(f"Connection error: {method} {endpoint} - {e}")
        return {
            "success": False,
            "error": f"Failed to connect to API: {e}",
        }

    except httpx.RequestError as e:
        logger.error(f"Request error: {method} {endpoint} - {e}")
        return {
            "success": False,
            "error": f"Request failed: {e}",
        }

    except Exception as e:
        logger.exception(f"Unexpected error: {method} {endpoint}")
        return {
            "success": False,
            "error": f"Unexpected error: {e}",
        }


# Convenience methods
async def api_get(
    endpoint: str,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT,
    params: Optional[dict] = None,
) -> dict:
    """Make a GET request to the API."""
    return await make_api_request(
        method="GET",
        endpoint=endpoint,
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
        timeout=timeout,
        params=params,
    )


async def api_post(
    endpoint: str,
    json: Optional[dict] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> dict:
    """Make a POST request to the API."""
    return await make_api_request(
        method="POST",
        endpoint=endpoint,
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
        timeout=timeout,
        json=json,
    )


async def api_patch(
    endpoint: str,
    json: Optional[dict] = None,
    workspace_id: Optional[str] = None,
    api_token: Optional[str] = None,
    api_base_url: Optional[str] = None,
    timeout: float = DEFAULT_TIMEOUT,
) -> dict:
    """Make a PATCH request to the API."""
    return await make_api_request(
        method="PATCH",
        endpoint=endpoint,
        workspace_id=workspace_id,
        api_token=api_token,
        api_base_url=api_base_url,
        timeout=timeout,
        json=json,
    )
