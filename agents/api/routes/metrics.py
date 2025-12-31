"""
Prometheus Metrics Endpoint for HYVVE AgentOS (DM-09.2)

Exposes Prometheus metrics at /metrics for scraping by Prometheus server.

SECURITY NOTE:
    This endpoint is rate-limited but does not require authentication.
    In production, protect this endpoint using one of:
    - Network ACLs (restrict to Prometheus server IPs)
    - API Gateway authentication
    - Kubernetes NetworkPolicy

Usage:
    # Mount the router in main.py:
    from api.routes.metrics import router as metrics_router
    app.include_router(metrics_router, tags=["metrics"])

    # Prometheus scrape config:
    scrape_configs:
      - job_name: 'agentos'
        static_configs:
          - targets: ['agentos:8000']
        metrics_path: /metrics
        scrape_interval: 15s
"""

from fastapi import APIRouter, Request, Response

from agents.observability.metrics import get_metrics, get_content_type

router = APIRouter()

# Rate limit for metrics endpoint (applied in main.py via limiter)
METRICS_RATE_LIMIT = "60/minute"


@router.get(
    "/metrics",
    summary="Prometheus Metrics",
    description="Returns Prometheus-formatted metrics for scraping. Rate limited to 60 requests/minute.",
    response_class=Response,
    responses={
        200: {
            "description": "Prometheus metrics in text format",
            "content": {
                "text/plain": {
                    "example": "# HELP agentos_info AgentOS service information\n..."
                }
            },
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
