"""
Observability Package for HYVVE AgentOS (DM-09.1)

Provides OpenTelemetry-based distributed tracing for debugging
multi-agent flows and performance monitoring.

Exports:
    - configure_tracing: Initialize OpenTelemetry tracer
    - instrument_app: Instrument FastAPI app and clients
    - get_tracer: Get a tracer instance for custom spans
    - traced: Decorator for automatic span creation
    - OTelSettings: Configuration model for OTel settings
    - get_otel_settings: Get cached OTel settings
"""

from agents.observability.config import OTelSettings, get_otel_settings
from agents.observability.tracing import (
    configure_tracing,
    instrument_app,
    get_tracer,
    shutdown_tracing,
)
from agents.observability.decorators import traced

__all__ = [
    "OTelSettings",
    "get_otel_settings",
    "configure_tracing",
    "instrument_app",
    "get_tracer",
    "shutdown_tracing",
    "traced",
]
