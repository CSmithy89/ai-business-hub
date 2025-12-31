"""
OpenTelemetry Tracing Configuration for HYVVE AgentOS (DM-09.1)

Configures distributed tracing with OTLP exporter to Jaeger.
Provides auto-instrumentation for FastAPI, HTTPX, and Redis.

Key features:
- W3C Trace Context for context propagation
- Configurable sampling rate for production volume control
- Graceful degradation when tracing is disabled
"""

import logging
from typing import TYPE_CHECKING

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

from agents.observability.config import get_otel_settings

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = logging.getLogger(__name__)

# Module-level provider reference for shutdown
_provider: TracerProvider | None = None


def configure_tracing() -> trace.Tracer:
    """
    Configure OpenTelemetry tracing.

    Call this once at application startup before instrumenting.
    Sets up:
    - Resource with service name and version
    - TraceIdRatioBased sampler for volume control
    - OTLP gRPC exporter to Jaeger
    - Optional console exporter for debugging

    Returns:
        trace.Tracer: Configured tracer instance

    Example:
        # In main.py startup:
        tracer = configure_tracing()
        logger.info("Tracing configured")
    """
    global _provider

    settings = get_otel_settings()

    if not settings.otel_enabled:
        logger.info("OpenTelemetry tracing disabled")
        return trace.get_tracer(__name__)

    # Create resource with service info
    resource = Resource.create({
        SERVICE_NAME: settings.otel_service_name,
        SERVICE_VERSION: "0.2.0",
        "service.instance.id": "agentos-1",
        "deployment.environment": "development",
    })

    # Configure sampler (reduce volume in production)
    sampler = TraceIdRatioBased(settings.otel_sampling_rate)

    # Create provider
    _provider = TracerProvider(
        resource=resource,
        sampler=sampler,
    )

    # Add OTLP exporter
    try:
        exporter = OTLPSpanExporter(
            endpoint=settings.otel_exporter_endpoint,
            insecure=True,  # Use TLS in production via OTEL_EXPORTER_OTLP_INSECURE=false
        )
        processor = BatchSpanProcessor(exporter)
        _provider.add_span_processor(processor)
        logger.info(
            "OpenTelemetry OTLP exporter configured",
            extra={"endpoint": settings.otel_exporter_endpoint},
        )
    except Exception as e:
        logger.warning(
            "Failed to configure OTLP exporter, traces will not be exported: %s",
            str(e),
        )

    # Add console exporter for debugging if enabled
    if settings.otel_log_spans:
        console_processor = BatchSpanProcessor(ConsoleSpanExporter())
        _provider.add_span_processor(console_processor)
        logger.info("OpenTelemetry console span exporter enabled")

    # Set global provider
    trace.set_tracer_provider(_provider)

    logger.info(
        "OpenTelemetry tracing configured",
        extra={
            "service_name": settings.otel_service_name,
            "sampling_rate": settings.otel_sampling_rate,
            "endpoint": settings.otel_exporter_endpoint,
        },
    )

    return trace.get_tracer(__name__)


def instrument_app(app: "FastAPI") -> None:
    """
    Instrument FastAPI app and HTTP clients.

    Call after configure_tracing(). Enables auto-instrumentation for:
    - FastAPI: Creates spans for all HTTP endpoints
    - HTTPX: Traces outbound HTTP calls (A2A calls)
    - Redis: Traces cache operations

    Args:
        app: FastAPI application instance

    Example:
        # In main.py after app creation:
        from observability import configure_tracing, instrument_app

        configure_tracing()
        instrument_app(app)
    """
    settings = get_otel_settings()

    if not settings.otel_enabled:
        logger.debug("OpenTelemetry disabled, skipping instrumentation")
        return

    # Auto-instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)
    logger.debug("FastAPI instrumented for tracing")

    # Auto-instrument HTTPX (A2A calls)
    HTTPXClientInstrumentor().instrument()
    logger.debug("HTTPX client instrumented for tracing")

    # Auto-instrument Redis
    try:
        RedisInstrumentor().instrument()
        logger.debug("Redis instrumented for tracing")
    except Exception as e:
        logger.warning("Redis instrumentation skipped: %s", str(e))

    logger.info("OpenTelemetry instrumentation complete")


def get_tracer(name: str = __name__) -> trace.Tracer:
    """
    Get a tracer instance for creating custom spans.

    Use this to create spans in business logic code.

    Args:
        name: Tracer name (defaults to module name)

    Returns:
        trace.Tracer: Tracer instance for creating spans

    Example:
        from observability import get_tracer

        tracer = get_tracer(__name__)

        with tracer.start_as_current_span("my_operation") as span:
            span.set_attribute("key", "value")
            # ... operation code
    """
    return trace.get_tracer(name)


def shutdown_tracing() -> None:
    """
    Shutdown tracing and flush pending spans.

    Call this on application shutdown to ensure all spans are exported.

    Example:
        # In main.py shutdown event:
        @app.on_event("shutdown")
        async def shutdown_event():
            shutdown_tracing()
    """
    global _provider

    if _provider is not None:
        try:
            _provider.shutdown()
            logger.info("OpenTelemetry tracing shutdown complete")
        except Exception as e:
            logger.warning("Error during tracing shutdown: %s", str(e))
        finally:
            _provider = None
