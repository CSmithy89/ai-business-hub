"""
AgentOS Configuration Management

Manages environment variables for the AgentOS runtime using Pydantic Settings.
"""

from functools import lru_cache
from typing import Optional

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings

from agents.constants.dm_constants import DMConstants


class Settings(BaseSettings):
    """AgentOS configuration settings loaded from environment variables"""

    # Database
    database_url: str

    # Redis
    redis_url: Optional[str] = None

    # Authentication
    better_auth_secret: SecretStr

    # AI provider key encryption (shared with Nest/Next)
    encryption_master_key: Optional[SecretStr] = None

    # Server
    agentos_host: str = "0.0.0.0"
    agentos_port: int = 7777

    # NestJS API (for BYOAI integration)
    api_base_url: str = "http://localhost:3001"

    # Event Bus URL for approval notifications (DM-11.6)
    # If not set, derived from api_base_url by converting http:// to ws://
    event_bus_url: Optional[str] = None

    # Control Plane (optional)
    control_plane_enabled: bool = True
    agno_api_key: Optional[SecretStr] = None

    # CCR (Claude Code Router) Configuration
    ccr_enabled: bool = False
    ccr_url: str = f"http://localhost:{DMConstants.CCR.DEFAULT_PORT}"
    ccr_health_check_interval: int = DMConstants.CCR.HEALTH_CHECK_INTERVAL_SECONDS

    # CORS
    cors_origins: list[str] | str = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:3001",
        ]
    )
    cors_allow_methods: list[str] = Field(
        default_factory=lambda: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )
    cors_allow_headers: list[str] = Field(default_factory=lambda: ["Authorization", "Content-Type"])
    control_plane_origin: str = "https://os.agno.com"

    @field_validator("better_auth_secret")
    @classmethod
    def _ensure_auth_secret(cls, v: SecretStr) -> SecretStr:
        value = v.get_secret_value()
        if not value or not value.strip():
            raise ValueError("BETTER_AUTH_SECRET must be set")
        return v

    @field_validator("encryption_master_key", mode="before")
    @classmethod
    def _normalize_encryption_master_key(cls, v: object) -> object:
        """
        Treat empty/whitespace-only ENCRYPTION_MASTER_KEY as unset.

        This avoids subtle runtime failures where crypto appears "configured" but
        decryption fails due to an empty secret.
        """
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> "Settings":
    """
    Lazy settings factory to avoid eager validation at import time.
    """
    return Settings()
