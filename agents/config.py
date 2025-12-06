"""
AgentOS Configuration Management

Manages environment variables for the AgentOS runtime using Pydantic Settings.
"""

from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """AgentOS configuration settings loaded from environment variables"""

    # Database
    database_url: str

    # Redis
    redis_url: Optional[str] = None

    # Authentication
    better_auth_secret: str

    # Server
    agentos_host: str = "0.0.0.0"
    agentos_port: int = 7777

    # NestJS API (for BYOAI integration)
    api_base_url: str = "http://localhost:3001"

    # Control Plane (optional)
    control_plane_enabled: bool = True
    agno_api_key: Optional[str] = None

    # CORS
    cors_origins: list[str] = Field(
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

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
