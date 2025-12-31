"""
Prometheus Metrics for HYVVE AgentOS (DM-09.2)

Provides Prometheus metrics exposition for monitoring and alerting.
Uses a custom registry to avoid exposing default Python process metrics.

Metric categories:
- A2A Request Metrics: Duration, count, active tasks, response size
- Cache Metrics: Operations, latency
- Rate Limit Metrics: Enforcement events
- CCR Metrics: Requests, latency, token usage

Usage:
    from observability.metrics import (
        A2A_REQUEST_DURATION,
        A2A_REQUEST_COUNT,
        RequestTimer,
        get_metrics,
    )

    # Record a request using context manager
    with RequestTimer(A2A_REQUEST_DURATION, agent="navi", operation="query"):
        result = await do_query()

    # Or record metrics directly
    A2A_REQUEST_COUNT.labels(agent="navi", operation="query", status="success").inc()
"""

import time
from typing import Optional

from prometheus_client import (
    CollectorRegistry,
    Counter,
    Gauge,
    Histogram,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
)


# ============================================================================
# Custom Registry
# ============================================================================

# Create a custom registry to avoid default Python process metrics
# This keeps /metrics output focused on application metrics
REGISTRY = CollectorRegistry()


# ============================================================================
# Service Info
# ============================================================================

AGENTOS_INFO = Info(
    "agentos",
    "AgentOS service information",
    registry=REGISTRY,
)

# Set service info at module load
AGENTOS_INFO.info({
    "version": "0.2.0",
    "protocols": "a2a_0.3.0,agui_0.1.0",
    "service": "hyvve-agentos",
})


# ============================================================================
# A2A Request Metrics
# ============================================================================

A2A_REQUEST_DURATION = Histogram(
    "a2a_request_duration_seconds",
    "A2A request duration in seconds",
    labelnames=["agent", "operation", "status"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    registry=REGISTRY,
)

A2A_REQUEST_COUNT = Counter(
    "a2a_requests_total",
    "Total A2A requests",
    labelnames=["agent", "operation", "status"],
    registry=REGISTRY,
)

A2A_ACTIVE_TASKS = Gauge(
    "a2a_active_tasks",
    "Currently active A2A tasks",
    labelnames=["agent"],
    registry=REGISTRY,
)

A2A_RESPONSE_SIZE = Histogram(
    "a2a_response_size_bytes",
    "A2A response size in bytes",
    labelnames=["agent"],
    buckets=(100, 500, 1000, 5000, 10000, 50000, 100000),
    registry=REGISTRY,
)


# ============================================================================
# Cache Metrics
# ============================================================================

CACHE_OPERATIONS = Counter(
    "cache_operations_total",
    "Cache operations",
    labelnames=["operation", "result"],  # operation: get/set, result: hit/miss
    registry=REGISTRY,
)

CACHE_LATENCY = Histogram(
    "cache_latency_seconds",
    "Cache operation latency",
    labelnames=["operation"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1),
    registry=REGISTRY,
)


# ============================================================================
# Rate Limit Metrics
# ============================================================================

RATE_LIMIT_HITS = Counter(
    "rate_limit_hits_total",
    "Rate limit enforcement events",
    labelnames=["endpoint", "result"],  # result: allowed/denied
    registry=REGISTRY,
)


# ============================================================================
# CCR Metrics
# ============================================================================

CCR_REQUESTS = Counter(
    "ccr_requests_total",
    "CCR routing requests",
    labelnames=["provider", "task_type", "status"],
    registry=REGISTRY,
)

CCR_LATENCY = Histogram(
    "ccr_request_duration_seconds",
    "CCR request duration in seconds",
    labelnames=["provider"],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=REGISTRY,
)

CCR_TOKENS = Counter(
    "ccr_tokens_total",
    "CCR tokens used",
    labelnames=["provider", "direction"],  # direction: input/output
    registry=REGISTRY,
)


# ============================================================================
# Helper Functions
# ============================================================================


def get_metrics() -> bytes:
    """
    Generate Prometheus metrics output.

    Returns:
        bytes: Prometheus text format metrics
    """
    return generate_latest(REGISTRY)


def get_content_type() -> str:
    """
    Get Prometheus content type header.

    Returns:
        str: Content-Type header value for Prometheus
    """
    return CONTENT_TYPE_LATEST


# ============================================================================
# RequestTimer Context Manager
# ============================================================================


class RequestTimer:
    """
    Context manager for timing requests and recording metrics.

    Automatically records duration to a histogram and sets status based
    on whether an exception occurred (only if the histogram has a 'status' label).

    Attributes:
        histogram: The Histogram metric to record duration to
        labels: Label values (excluding status which is auto-set if present)
        start_time: Start time from perf_counter
        has_status_label: Whether the histogram expects a 'status' label

    Example:
        # With status label (A2A_REQUEST_DURATION has status in labelnames)
        with RequestTimer(A2A_REQUEST_DURATION, agent="navi", operation="query"):
            result = await do_query()

        # Without status label (CCR_LATENCY only has provider)
        async with RequestTimer(CCR_LATENCY, provider="claude"):
            response = await call_provider()

    Note:
        The 'status' label is only added if the histogram declares it
        in its labelnames. This prevents runtime errors from label mismatches.
    """

    def __init__(
        self,
        histogram: Histogram,
        **labels,
    ):
        """
        Initialize the request timer.

        Args:
            histogram: Histogram metric to record duration to
            **labels: Label values for the metric (status auto-added if declared)
        """
        self.histogram = histogram
        self.labels = labels
        self.start_time: Optional[float] = None
        # Check if histogram expects a 'status' label
        self.has_status_label = "status" in histogram._labelnames

    def __enter__(self) -> "RequestTimer":
        """Start timing the request."""
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """
        Stop timing and record the duration.

        Sets status to 'error' if an exception occurred, 'success' otherwise.
        Only adds status label if the histogram declares it.
        """
        if self.start_time is None:
            return

        duration = time.perf_counter() - self.start_time

        if self.has_status_label:
            status = "error" if exc_type else "success"
            self.histogram.labels(**self.labels, status=status).observe(duration)
        else:
            self.histogram.labels(**self.labels).observe(duration)

    async def __aenter__(self) -> "RequestTimer":
        """Async context manager entry - start timing."""
        self.start_time = time.perf_counter()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit - record duration."""
        if self.start_time is None:
            return

        duration = time.perf_counter() - self.start_time

        if self.has_status_label:
            status = "error" if exc_type else "success"
            self.histogram.labels(**self.labels, status=status).observe(duration)
        else:
            self.histogram.labels(**self.labels).observe(duration)


# ============================================================================
# Metric Recording Helpers
# ============================================================================


def record_a2a_request(
    agent: str,
    operation: str,
    status: str,
    duration_seconds: float,
    response_size_bytes: Optional[int] = None,
) -> None:
    """
    Record an A2A request completion.

    Args:
        agent: Agent name (e.g., "navi", "pulse", "herald")
        operation: Operation type (e.g., "query", "run", "health")
        status: Request status ("success" or "error")
        duration_seconds: Request duration in seconds
        response_size_bytes: Optional response size in bytes
    """
    A2A_REQUEST_DURATION.labels(
        agent=agent, operation=operation, status=status
    ).observe(duration_seconds)

    A2A_REQUEST_COUNT.labels(
        agent=agent, operation=operation, status=status
    ).inc()

    if response_size_bytes is not None:
        A2A_RESPONSE_SIZE.labels(agent=agent).observe(response_size_bytes)


def record_rate_limit_hit(
    endpoint: str,
    result: str,
) -> None:
    """
    Record a rate limit enforcement event.

    Args:
        endpoint: API endpoint path
        result: "allowed" or "denied"
    """
    RATE_LIMIT_HITS.labels(endpoint=endpoint, result=result).inc()


def record_ccr_request(
    provider: str,
    task_type: str,
    status: str,
    duration_seconds: Optional[float] = None,
    input_tokens: int = 0,
    output_tokens: int = 0,
) -> None:
    """
    Record a CCR routing request.

    Args:
        provider: Provider name (e.g., "claude", "deepseek", "gemini")
        task_type: Task type routed to
        status: Request status ("success" or "error")
        duration_seconds: Optional request duration in seconds
        input_tokens: Number of input tokens used
        output_tokens: Number of output tokens used
    """
    CCR_REQUESTS.labels(
        provider=provider, task_type=task_type, status=status
    ).inc()

    if duration_seconds is not None:
        CCR_LATENCY.labels(provider=provider).observe(duration_seconds)

    if input_tokens > 0:
        CCR_TOKENS.labels(provider=provider, direction="input").inc(input_tokens)

    if output_tokens > 0:
        CCR_TOKENS.labels(provider=provider, direction="output").inc(output_tokens)


def record_cache_operation(
    operation: str,
    result: str,
    duration_seconds: Optional[float] = None,
) -> None:
    """
    Record a cache operation.

    Args:
        operation: Cache operation ("get", "set", "delete")
        result: Operation result ("hit", "miss", "success", "error")
        duration_seconds: Optional operation duration in seconds
    """
    CACHE_OPERATIONS.labels(operation=operation, result=result).inc()

    if duration_seconds is not None:
        CACHE_LATENCY.labels(operation=operation).observe(duration_seconds)
