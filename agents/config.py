"""
AgentOS Configuration Management

Manages environment variables for the AgentOS runtime using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


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

    # Control Plane (optional)
    control_plane_api_key: Optional[str] = None
    control_plane_url: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
