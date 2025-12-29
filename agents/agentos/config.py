"""
AgentOS Configuration

Environment-based configuration for AgentOS multi-interface setup.
Uses Pydantic Settings for validation and environment variable binding.

All settings can be overridden via environment variables with the AGENTOS_ prefix.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

from constants.dm_constants import DMConstants


class InterfaceConfig(BaseModel):
    """Configuration for an agent interface.

    Defines which protocols an agent exposes and their endpoint paths.
    Each agent can have AG-UI (for frontend communication) and/or A2A
    (for inter-agent communication) interfaces enabled.

    Attributes:
        agent_id: Unique agent identifier
        agui_enabled: Enable AG-UI interface for frontend communication
        agui_path: AG-UI endpoint path (e.g., '/agui')
        a2a_enabled: Enable A2A interface for inter-agent communication
        a2a_path: A2A endpoint path (e.g., '/a2a/agent-name')
        agui_timeout_seconds: AG-UI tool call timeout override
        a2a_timeout_seconds: A2A task timeout override
    """

    agent_id: str = Field(..., description="Unique agent identifier")

    # AG-UI Configuration
    agui_enabled: bool = Field(
        default=False,
        description="Enable AG-UI interface for frontend communication",
    )
    agui_path: Optional[str] = Field(
        default=None,
        description="AG-UI endpoint path (e.g., '/agui')",
    )

    # A2A Configuration
    a2a_enabled: bool = Field(
        default=True,
        description="Enable A2A interface for inter-agent communication",
    )
    a2a_path: Optional[str] = Field(
        default=None,
        description="A2A endpoint path (e.g., '/a2a/agent-name')",
    )

    # Timeout overrides (optional)
    agui_timeout_seconds: Optional[int] = Field(
        default=None,
        description="AG-UI tool call timeout override",
    )
    a2a_timeout_seconds: Optional[int] = Field(
        default=None,
        description="A2A task timeout override",
    )

    def get_agui_timeout(self) -> int:
        """Get AG-UI timeout with fallback to default.

        Returns:
            Timeout in seconds, using override if set, otherwise DMConstants default.
        """
        # Use explicit None check to allow 0 as a valid timeout override
        if self.agui_timeout_seconds is not None:
            return self.agui_timeout_seconds
        return DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS

    def get_a2a_timeout(self) -> int:
        """Get A2A timeout with fallback to default.

        Returns:
            Timeout in seconds, using override if set, otherwise DMConstants default.
        """
        # Use explicit None check to allow 0 as a valid timeout override
        if self.a2a_timeout_seconds is not None:
            return self.a2a_timeout_seconds
        return DMConstants.A2A.TASK_TIMEOUT_SECONDS


class AgentOSSettings(BaseSettings):
    """
    AgentOS environment settings.

    All settings can be overridden via environment variables with
    the AGENTOS_ prefix (e.g., AGENTOS_PORT=8001).

    Environment Variables:
        AGENTOS_PORT: Server port (default: 8000)
        AGENTOS_HOST: Server host (default: 0.0.0.0)
        AGENTOS_WORKERS: Number of worker processes (default: 4)
        AGENTOS_BASE_URL: Base URL for A2A discovery (default: http://localhost:8000)
        AGENTOS_REQUEST_TIMEOUT_SECONDS: Default request timeout (default: 30)
        AGENTOS_KEEP_ALIVE_SECONDS: Keep-alive timeout (default: 65)
        AGENTOS_MAX_CONCURRENT_TASKS: Maximum concurrent tasks (default: 100)
        AGENTOS_AGUI_ENABLED: Global AG-UI enable flag (default: true)
        AGENTOS_A2A_ENABLED: Global A2A enable flag (default: true)
        AGENTOS_DEBUG: Debug mode (default: false)
    """

    # Server Configuration
    port: int = Field(
        default=DMConstants.AGENTOS.DEFAULT_PORT,
        description="AgentOS server port",
    )
    host: str = Field(
        default="0.0.0.0",
        description="AgentOS server host",
    )
    workers: int = Field(
        default=DMConstants.AGENTOS.WORKER_COUNT,
        description="Number of worker processes",
    )

    # Base URL Configuration
    base_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for AgentOS (used in A2A discovery)",
    )

    # Request Handling
    request_timeout_seconds: int = Field(
        default=DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS,
        description="Default request timeout",
    )
    keep_alive_seconds: int = Field(
        default=DMConstants.AGENTOS.KEEP_ALIVE_SECONDS,
        description="Keep-alive timeout for connections",
    )
    max_concurrent_tasks: int = Field(
        default=DMConstants.AGENTOS.MAX_CONCURRENT_TASKS,
        description="Maximum concurrent tasks across all agents",
    )

    # Interface Defaults
    agui_enabled: bool = Field(
        default=True,
        description="Global AG-UI interface enable flag",
    )
    a2a_enabled: bool = Field(
        default=True,
        description="Global A2A interface enable flag",
    )

    # Development Mode
    debug: bool = Field(
        default=False,
        description="Enable debug mode with verbose logging",
    )

    model_config = {
        "env_prefix": "AGENTOS_",
        "env_file": ".env",
        "extra": "ignore",
    }


# Default interface configurations for known agents
# These are the pre-configured interfaces from the tech spec
INTERFACE_CONFIGS: List[InterfaceConfig] = [
    InterfaceConfig(
        agent_id="dashboard_gateway",
        agui_enabled=True,
        agui_path="/agui",
        a2a_enabled=True,
        a2a_path="/a2a/dashboard",
    ),
    InterfaceConfig(
        agent_id="navi",
        agui_enabled=False,
        a2a_enabled=True,
        a2a_path="/a2a/navi",
    ),
    InterfaceConfig(
        agent_id="pulse",
        agui_enabled=False,
        a2a_enabled=True,
        a2a_path="/a2a/pulse",
    ),
    InterfaceConfig(
        agent_id="herald",
        agui_enabled=False,
        a2a_enabled=True,
        a2a_path="/a2a/herald",
    ),
]


@lru_cache()
def get_agentos_settings() -> AgentOSSettings:
    """
    Get cached AgentOS settings.

    Uses lru_cache to ensure settings are only loaded once
    and shared across the application.

    Returns:
        AgentOSSettings instance with environment overrides applied
    """
    return AgentOSSettings()


def get_interface_config(agent_id: str) -> Optional[InterfaceConfig]:
    """
    Get interface configuration for a specific agent.

    Args:
        agent_id: The unique agent identifier

    Returns:
        InterfaceConfig if found, None otherwise
    """
    for config in INTERFACE_CONFIGS:
        if config.agent_id == agent_id:
            return config
    return None


def register_interface_config(config: InterfaceConfig) -> None:
    """
    Register a new interface configuration.

    Allows dynamic registration of agent interface configurations
    at runtime (useful for module-specific agents).

    Args:
        config: InterfaceConfig to register

    Raises:
        ValueError: If agent_id already registered
    """
    existing = get_interface_config(config.agent_id)
    if existing:
        raise ValueError(f"Interface config already exists for agent: {config.agent_id}")
    INTERFACE_CONFIGS.append(config)


def update_interface_config(config: InterfaceConfig) -> None:
    """
    Update an existing interface configuration.

    Args:
        config: InterfaceConfig with updated values

    Raises:
        ValueError: If agent_id not found
    """
    for i, existing in enumerate(INTERFACE_CONFIGS):
        if existing.agent_id == config.agent_id:
            INTERFACE_CONFIGS[i] = config
            return
    raise ValueError(f"No interface config found for agent: {config.agent_id}")
