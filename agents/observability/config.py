"""
OpenTelemetry Configuration for HYVVE AgentOS (DM-09.1)

Provides Pydantic-based configuration for OpenTelemetry settings,
following the same patterns as agents/config.py.

DM-11.13 Update:
- Added optional metrics endpoint authentication
"""

import logging
from functools import lru_cache
from typing import Optional

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class OTelSettings(BaseSettings):
    """
    OpenTelemetry configuration loaded from environment variables.

    Configuration options:
        OTEL_ENABLED: Enable/disable tracing (default: True)
        OTEL_SERVICE_NAME: Service name for traces (default: hyvve-agentos)
        OTEL_EXPORTER_ENDPOINT: OTLP gRPC endpoint (default: http://localhost:4317)
        OTEL_EXPORTER_INSECURE: Use insecure gRPC connection (default: True for dev)
        OTEL_SAMPLING_RATE: Sampling rate 0.0-1.0 (default: 1.0 for 100%)
        OTEL_LOG_SPANS: Debug logging of spans (default: False)
        METRICS_REQUIRE_AUTH: Require authentication for /metrics endpoint
        METRICS_API_KEY: API key for metrics endpoint (required if auth enabled)

    Example:
        # In .env file:
        OTEL_ENABLED=true
        OTEL_SAMPLING_RATE=0.1  # 10% sampling in production
        OTEL_EXPORTER_INSECURE=false  # Use TLS in production

        # Optional: Protect metrics endpoint
        METRICS_REQUIRE_AUTH=true
        METRICS_API_KEY=your-secret-key
    """

    otel_enabled: bool = True
    otel_service_name: str = "hyvve-agentos"
    otel_exporter_endpoint: str = "http://localhost:4317"
    otel_exporter_insecure: bool = True  # Set to False in production for TLS
    otel_sampling_rate: float = 1.0  # 100% in dev, lower in prod
    otel_log_spans: bool = False

    # Metrics endpoint authentication (DM-11.13)
    metrics_require_auth: bool = Field(
        default=False,
        description="Require authentication for /metrics endpoint",
    )
    metrics_api_key: Optional[str] = Field(
        default=None,
        description="API key for metrics endpoint (required if metrics_require_auth=True)",
    )

    @model_validator(mode="after")
    def validate_metrics_auth_config(self) -> "OTelSettings":
        """
        Validate metrics auth configuration consistency.

        Raises ValueError if auth is enabled but key is missing, to fail fast
        at startup rather than returning 500 errors at runtime.
        """
        if self.metrics_require_auth and not self.metrics_api_key:
            raise ValueError(
                "METRICS_REQUIRE_AUTH is enabled but METRICS_API_KEY is not set. "
                "Either set METRICS_API_KEY or disable METRICS_REQUIRE_AUTH."
            )
        return self

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
