"""
OpenTelemetry Configuration for HYVVE AgentOS (DM-09.1)

Provides Pydantic-based configuration for OpenTelemetry settings,
following the same patterns as agents/config.py.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings


class OTelSettings(BaseSettings):
    """
    OpenTelemetry configuration loaded from environment variables.

    Configuration options:
        OTEL_ENABLED: Enable/disable tracing (default: True)
        OTEL_SERVICE_NAME: Service name for traces (default: hyvve-agentos)
        OTEL_EXPORTER_ENDPOINT: OTLP gRPC endpoint (default: http://localhost:4317)
        OTEL_SAMPLING_RATE: Sampling rate 0.0-1.0 (default: 1.0 for 100%)
        OTEL_LOG_SPANS: Debug logging of spans (default: False)

    Example:
        # In .env file:
        OTEL_ENABLED=true
        OTEL_SAMPLING_RATE=0.1  # 10% sampling in production
    """

    otel_enabled: bool = True
    otel_service_name: str = "hyvve-agentos"
    otel_exporter_endpoint: str = "http://localhost:4317"
    otel_sampling_rate: float = 1.0  # 100% in dev, lower in prod
    otel_log_spans: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_otel_settings() -> OTelSettings:
    """
    Get cached OTel settings.

    Uses lru_cache for singleton behavior, matching the pattern
    in agents/config.py.

    Returns:
        OTelSettings: Cached settings instance
    """
    return OTelSettings()
