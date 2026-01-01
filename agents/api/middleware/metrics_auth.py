"""
Metrics Endpoint Authentication Middleware (DM-11.13)

Provides optional authentication for the /metrics endpoint.
When enabled via METRICS_REQUIRE_AUTH=true, requires either:
- Bearer token in Authorization header
- API key in X-Metrics-Key header

Configuration:
    METRICS_REQUIRE_AUTH: bool - Enable/disable auth (default: False)
    METRICS_API_KEY: str - Required key when auth is enabled

Example:
    # In .env:
    METRICS_REQUIRE_AUTH=true
    METRICS_API_KEY=your-secret-metrics-key

    # Prometheus scrape config with auth:
    scrape_configs:
      - job_name: 'agentos'
        bearer_token: 'your-secret-metrics-key'
        static_configs:
          - targets: ['agentos:8000']
"""

from fastapi import Depends, HTTPException, Request, status
from functools import lru_cache

from agents.observability.config import get_otel_settings, OTelSettings


def get_settings() -> OTelSettings:
    """Get OTel settings (for dependency injection)."""
    return get_otel_settings()


async def verify_metrics_auth(
    request: Request,
    settings: OTelSettings = Depends(get_settings),
) -> None:
    """
    Verify authentication for metrics endpoint.

    Checks if metrics auth is required and validates the API key.
    Supports both Bearer token and X-Metrics-Key header.

    Args:
        request: FastAPI request object
        settings: OTel settings with auth configuration

    Raises:
        HTTPException: 401 if auth required but key missing/invalid
        HTTPException: 500 if auth enabled but no key configured
    """
    # Auth disabled - allow all requests
    if not settings.metrics_require_auth:
        return

    # Auth enabled but no key configured - server error
    if not settings.metrics_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Metrics authentication enabled but no API key configured",
        )

    # Check Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header:
        scheme, _, token = auth_header.partition(" ")
        if scheme.lower() == "bearer" and token == settings.metrics_api_key:
            return

    # Check X-Metrics-Key header
    metrics_key = request.headers.get("X-Metrics-Key")
    if metrics_key == settings.metrics_api_key:
        return

    # No valid authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing metrics API key",
        headers={"WWW-Authenticate": "Bearer"},
    )
