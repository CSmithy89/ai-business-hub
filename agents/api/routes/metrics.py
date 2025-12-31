"""
Prometheus Metrics Endpoint for HYVVE AgentOS (DM-09.2)

Exposes Prometheus metrics at /metrics for scraping by Prometheus server.

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

from fastapi import APIRouter, Response

from agents.observability.metrics import get_metrics, get_content_type

router = APIRouter()


@router.get(
    "/metrics",
    summary="Prometheus Metrics",
    description="Returns Prometheus-formatted metrics for scraping.",
    response_class=Response,
    responses={
        200: {
            "description": "Prometheus metrics in text format",
            "content": {
                "text/plain": {
                    "example": "# HELP agentos_info AgentOS service information\n..."
                }
            },
        }
    },
)
async def prometheus_metrics() -> Response:
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
