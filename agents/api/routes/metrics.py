"""
Prometheus Metrics Endpoint for HYVVE AgentOS (DM-09.2)

Exposes Prometheus metrics at /metrics for scraping by Prometheus server.

SECURITY NOTE (DM-11.13):
    This endpoint supports optional authentication via environment variables:
    - METRICS_REQUIRE_AUTH=true  # Enable authentication
    - METRICS_API_KEY=secret     # API key for authentication

    When auth is enabled, provide credentials via:
    - Authorization: Bearer <key>
    - X-Metrics-Key: <key>

    For unauthenticated deployments, protect using:
    - Network ACLs (restrict to Prometheus server IPs)
    - API Gateway authentication
    - Kubernetes NetworkPolicy

Usage:
    # Mount the router in main.py:
    from api.routes.metrics import router as metrics_router
    app.include_router(metrics_router, tags=["metrics"])

    # Prometheus scrape config (with auth):
    scrape_configs:
      - job_name: 'agentos'
        bearer_token: '<your-metrics-api-key>'
        static_configs:
          - targets: ['agentos:8000']
        metrics_path: /metrics
        scrape_interval: 15s
"""

from fastapi import APIRouter, Depends, Request, Response

from agents.api.middleware.metrics_auth import verify_metrics_auth
from agents.observability.metrics import get_metrics, get_content_type

router = APIRouter()

# Rate limit for metrics endpoint (applied in main.py via limiter)
METRICS_RATE_LIMIT = "60/minute"


@router.get(
    "/metrics",
    summary="Prometheus Metrics",
    description="Returns Prometheus-formatted metrics for scraping. Rate limited to 60 requests/minute. Optionally protected via METRICS_REQUIRE_AUTH.",
    response_class=Response,
    dependencies=[Depends(verify_metrics_auth)],
    responses={
        200: {
            "description": "Prometheus metrics in text format",
            "content": {
                "text/plain": {
                    "example": "# HELP agentos_info AgentOS service information\n..."
                }
            },
        },
        401: {
            "description": "Unauthorized - invalid or missing API key",
        },
        429: {
            "description": "Rate limit exceeded",
        },
    },
)
async def prometheus_metrics(request: Request) -> Response:
    """
    Prometheus metrics endpoint for scraping.

    Returns all registered metrics in Prometheus text format.
    Uses a custom registry to expose only application metrics,
    excluding default Python process metrics.

    Returns:
        Response: Prometheus-formatted metrics
    """
    return Response(
        content=get_metrics(),
        media_type=get_content_type(),
    )
