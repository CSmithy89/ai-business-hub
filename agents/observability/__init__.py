"""
Observability Package for HYVVE AgentOS (DM-09.1, DM-09.2)

Provides OpenTelemetry-based distributed tracing and Prometheus metrics
for debugging multi-agent flows and performance monitoring.

DM-09.1 Tracing Exports:
    - configure_tracing: Initialize OpenTelemetry tracer
    - instrument_app: Instrument FastAPI app and clients
    - get_tracer: Get a tracer instance for custom spans
    - shutdown_tracing: Shutdown tracing gracefully
    - traced: Decorator for automatic span creation
    - OTelSettings: Configuration model for OTel settings
    - get_otel_settings: Get cached OTel settings

DM-09.2 Metrics Exports:
    - REGISTRY: Custom Prometheus registry
    - A2A_REQUEST_DURATION: Histogram for A2A request duration
    - A2A_REQUEST_COUNT: Counter for A2A requests
    - A2A_ACTIVE_TASKS: Gauge for active A2A tasks
    - A2A_RESPONSE_SIZE: Histogram for A2A response sizes
    - CACHE_OPERATIONS: Counter for cache operations
    - CACHE_LATENCY: Histogram for cache latency
    - RATE_LIMIT_HITS: Counter for rate limit events
    - CCR_REQUESTS: Counter for CCR routing requests
    - CCR_LATENCY: Histogram for CCR request latency
    - CCR_TOKENS: Counter for CCR token usage
    - RequestTimer: Context manager for timing requests
    - get_metrics: Generate Prometheus metrics output
    - get_content_type: Get Prometheus content type
    - record_a2a_request: Helper to record A2A metrics
    - record_rate_limit_hit: Helper to record rate limit metrics
    - record_ccr_request: Helper to record CCR metrics
    - record_cache_operation: Helper to record cache metrics
"""

# DM-09.1: OpenTelemetry Tracing
from agents.observability.config import OTelSettings, get_otel_settings
from agents.observability.tracing import (
    configure_tracing,
    instrument_app,
    get_tracer,
    shutdown_tracing,
)
from agents.observability.decorators import traced

# DM-09.2: Prometheus Metrics
from agents.observability.metrics import (
    REGISTRY,
    A2A_REQUEST_DURATION,
    A2A_REQUEST_COUNT,
    A2A_ACTIVE_TASKS,
    A2A_RESPONSE_SIZE,
    CACHE_OPERATIONS,
    CACHE_LATENCY,
    RATE_LIMIT_HITS,
    CCR_REQUESTS,
    CCR_LATENCY,
    CCR_TOKENS,
    RequestTimer,
    get_metrics,
    get_content_type,
    record_a2a_request,
    record_rate_limit_hit,
    record_ccr_request,
    record_cache_operation,
)

__all__ = [
    # DM-09.1: Tracing
    "OTelSettings",
    "get_otel_settings",
    "configure_tracing",
    "instrument_app",
    "get_tracer",
    "shutdown_tracing",
    "traced",
    # DM-09.2: Metrics
    "REGISTRY",
    "A2A_REQUEST_DURATION",
    "A2A_REQUEST_COUNT",
    "A2A_ACTIVE_TASKS",
    "A2A_RESPONSE_SIZE",
    "CACHE_OPERATIONS",
    "CACHE_LATENCY",
    "RATE_LIMIT_HITS",
    "CCR_REQUESTS",
    "CCR_LATENCY",
    "CCR_TOKENS",
    "RequestTimer",
    "get_metrics",
    "get_content_type",
    "record_a2a_request",
    "record_rate_limit_hit",
    "record_ccr_request",
    "record_cache_operation",
]
