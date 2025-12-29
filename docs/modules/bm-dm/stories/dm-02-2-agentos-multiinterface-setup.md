# Story DM-02.2: AgentOS Multi-Interface Setup

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** High (critical infrastructure)
**Dependencies:** DM-02.1 (Complete - Protocol Dependencies)

---

## Overview

Configure AgentOS with multi-interface support enabling both AG-UI and A2A protocols simultaneously. This story creates the AgentOS configuration infrastructure that will serve all protocol interfaces for the Dynamic Module System.

This story establishes the multi-interface architecture required for:
- AG-UI streaming protocol (frontend communication via CopilotKit)
- A2A protocol (inter-agent and external agent communication)
- Unified agent registry serving both protocols
- Interface routing and path configuration

The interfaces created here will be used by:
- Dashboard Gateway agent (DM-02.4) - both AG-UI and A2A
- PM agents (DM-02.5) - A2A only
- Future module agents - configurable per-agent

---

## Acceptance Criteria

- [x] **AC1:** AgentOS configuration module created with multi-interface support
- [x] **AC2:** Environment variable schema defined with sensible defaults
- [x] **AC3:** Factory function creates properly configured AgentOS instance
- [x] **AC4:** AG-UI and A2A interfaces both enabled and routed correctly
- [x] **AC5:** Unit tests verify configuration and interface setup

---

## Technical Approach

### Architecture Decision

We will use **Option B from the tech spec**: Mount AGUI/A2A routers on the existing FastAPI app. This approach:

1. **Maintains backward compatibility** with existing REST endpoints
2. **Allows incremental adoption** - new interfaces don't disrupt current flows
3. **Leverages existing middleware** - authentication, CORS, rate limiting
4. **Simplifies deployment** - single FastAPI app, no separate AgentOS process

### Interface Configuration Model

Each agent can be configured with:
- AG-UI enabled/disabled (for frontend-facing agents)
- A2A enabled/disabled (for inter-agent/external communication)
- Custom paths for each interface
- Timeout overrides using DMConstants

### File Structure

```
agents/
├── agentos/                    # NEW: AgentOS configuration module
│   ├── __init__.py
│   ├── config.py               # Environment and interface configuration
│   └── factory.py              # Interface factory functions
├── constants/
│   └── dm_constants.py         # Already exists (DM-02.1)
└── main.py                     # Modified: mount interface routers
```

---

## Implementation Tasks

### Task 1: Create AgentOS Configuration Module (1.5 points)

Create the configuration module with Pydantic settings and interface configuration.

**File:** `agents/agentos/__init__.py`

```python
"""
AgentOS Configuration Module

Provides multi-interface configuration for AgentOS, enabling agents
to be accessed via AG-UI and A2A protocols simultaneously.
"""
from .config import (
    AgentOSSettings,
    InterfaceConfig,
    get_agentos_settings,
    get_interface_config,
    INTERFACE_CONFIGS,
)
from .factory import (
    create_interfaces,
    create_agui_interface,
    create_a2a_interface,
)

__all__ = [
    # Settings
    "AgentOSSettings",
    "InterfaceConfig",
    "get_agentos_settings",
    "get_interface_config",
    "INTERFACE_CONFIGS",
    # Factory
    "create_interfaces",
    "create_agui_interface",
    "create_a2a_interface",
]
```

**File:** `agents/agentos/config.py`

```python
"""
AgentOS Configuration

Environment-based configuration for AgentOS multi-interface setup.
Uses Pydantic Settings for validation and environment variable binding.
"""
from functools import lru_cache
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings

from constants.dm_constants import DMConstants


class InterfaceConfig(BaseModel):
    """Configuration for an agent interface.

    Defines which protocols an agent exposes and their endpoint paths.
    """
    agent_id: str = Field(..., description="Unique agent identifier")

    # AG-UI Configuration
    agui_enabled: bool = Field(
        default=False,
        description="Enable AG-UI interface for frontend communication"
    )
    agui_path: Optional[str] = Field(
        default=None,
        description="AG-UI endpoint path (e.g., '/agui')"
    )

    # A2A Configuration
    a2a_enabled: bool = Field(
        default=True,
        description="Enable A2A interface for inter-agent communication"
    )
    a2a_path: Optional[str] = Field(
        default=None,
        description="A2A endpoint path (e.g., '/a2a/agent-name')"
    )

    # Timeout overrides (optional)
    agui_timeout_seconds: Optional[int] = Field(
        default=None,
        description="AG-UI tool call timeout override"
    )
    a2a_timeout_seconds: Optional[int] = Field(
        default=None,
        description="A2A task timeout override"
    )

    def get_agui_timeout(self) -> int:
        """Get AG-UI timeout with fallback to default."""
        return self.agui_timeout_seconds or DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS

    def get_a2a_timeout(self) -> int:
        """Get A2A timeout with fallback to default."""
        return self.a2a_timeout_seconds or DMConstants.A2A.TASK_TIMEOUT_SECONDS


class AgentOSSettings(BaseSettings):
    """
    AgentOS environment settings.

    All settings can be overridden via environment variables with
    the AGENTOS_ prefix (e.g., AGENTOS_PORT=8001).
    """

    # Server Configuration
    port: int = Field(
        default=DMConstants.AGENTOS.DEFAULT_PORT,
        description="AgentOS server port"
    )
    host: str = Field(
        default="0.0.0.0",
        description="AgentOS server host"
    )
    workers: int = Field(
        default=DMConstants.AGENTOS.WORKER_COUNT,
        description="Number of worker processes"
    )

    # Base URL Configuration
    base_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for AgentOS (used in A2A discovery)"
    )

    # Request Handling
    request_timeout_seconds: int = Field(
        default=DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS,
        description="Default request timeout"
    )
    keep_alive_seconds: int = Field(
        default=DMConstants.AGENTOS.KEEP_ALIVE_SECONDS,
        description="Keep-alive timeout for connections"
    )
    max_concurrent_tasks: int = Field(
        default=DMConstants.AGENTOS.MAX_CONCURRENT_TASKS,
        description="Maximum concurrent tasks across all agents"
    )

    # Interface Defaults
    agui_enabled: bool = Field(
        default=True,
        description="Global AG-UI interface enable flag"
    )
    a2a_enabled: bool = Field(
        default=True,
        description="Global A2A interface enable flag"
    )

    # Development Mode
    debug: bool = Field(
        default=False,
        description="Enable debug mode with verbose logging"
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
```

---

### Task 2: Create Interface Factory Module (1.5 points)

Create factory functions for instantiating protocol interfaces.

**File:** `agents/agentos/factory.py`

```python
"""
Interface Factory

Factory functions for creating AG-UI and A2A interfaces for agents.
Handles interface instantiation with proper configuration and error handling.
"""
from typing import List, Dict, Any, Optional, Union
import logging

from agno.agent import Agent
from agno.os.interfaces.agui import AGUI
from agno.os.interfaces.a2a import A2A

from .config import (
    INTERFACE_CONFIGS,
    InterfaceConfig,
    get_agentos_settings,
)
from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class InterfaceCreationError(Exception):
    """Raised when interface creation fails."""
    pass


def create_agui_interface(
    agent: Agent,
    path: str,
    timeout_seconds: Optional[int] = None,
) -> AGUI:
    """
    Create an AG-UI interface for an agent.

    Args:
        agent: The Agno Agent instance
        path: URL path for the interface (e.g., '/agui')
        timeout_seconds: Optional timeout override

    Returns:
        Configured AGUI interface

    Raises:
        InterfaceCreationError: If interface creation fails
    """
    timeout = timeout_seconds or DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS

    try:
        interface = AGUI(
            agent=agent,
            path=path,
            timeout=timeout,
        )
        logger.info(
            f"Created AG-UI interface for agent '{agent.name}' at path '{path}'"
        )
        return interface
    except Exception as e:
        logger.error(f"Failed to create AG-UI interface: {e}")
        raise InterfaceCreationError(f"AG-UI interface creation failed: {e}") from e


def create_a2a_interface(
    agent: Agent,
    path: str,
    timeout_seconds: Optional[int] = None,
    max_concurrent: Optional[int] = None,
) -> A2A:
    """
    Create an A2A interface for an agent.

    Args:
        agent: The Agno Agent instance
        path: URL path for the interface (e.g., '/a2a/dashboard')
        timeout_seconds: Optional timeout override
        max_concurrent: Optional max concurrent tasks override

    Returns:
        Configured A2A interface

    Raises:
        InterfaceCreationError: If interface creation fails
    """
    settings = get_agentos_settings()
    timeout = timeout_seconds or DMConstants.A2A.TASK_TIMEOUT_SECONDS
    max_concurrent = max_concurrent or settings.max_concurrent_tasks

    try:
        interface = A2A(
            agent=agent,
            path=path,
            timeout=timeout,
            max_concurrent=max_concurrent,
        )
        logger.info(
            f"Created A2A interface for agent '{agent.name}' at path '{path}'"
        )
        return interface
    except Exception as e:
        logger.error(f"Failed to create A2A interface: {e}")
        raise InterfaceCreationError(f"A2A interface creation failed: {e}") from e


def create_interfaces(
    agents: Dict[str, Agent],
    configs: Optional[List[InterfaceConfig]] = None,
) -> Dict[str, List[Union[AGUI, A2A]]]:
    """
    Create interfaces for multiple agents based on configuration.

    This is the main factory function that creates all interfaces
    for a set of agents according to their interface configurations.

    Args:
        agents: Dictionary mapping agent_id to Agent instance
        configs: Optional list of InterfaceConfigs (defaults to INTERFACE_CONFIGS)

    Returns:
        Dictionary mapping agent_id to list of created interfaces

    Example:
        >>> agents = {
        ...     "dashboard_gateway": dashboard_agent,
        ...     "navi": navi_agent,
        ... }
        >>> interfaces = create_interfaces(agents)
        >>> # Returns:
        >>> # {
        >>> #     "dashboard_gateway": [AGUI(...), A2A(...)],
        >>> #     "navi": [A2A(...)],
        >>> # }
    """
    settings = get_agentos_settings()
    configs = configs or INTERFACE_CONFIGS

    result: Dict[str, List[Union[AGUI, A2A]]] = {}

    for config in configs:
        agent = agents.get(config.agent_id)
        if not agent:
            logger.warning(
                f"No agent found for interface config: {config.agent_id}"
            )
            continue

        agent_interfaces: List[Union[AGUI, A2A]] = []

        # Create AG-UI interface if enabled
        if config.agui_enabled and config.agui_path and settings.agui_enabled:
            try:
                agui = create_agui_interface(
                    agent=agent,
                    path=config.agui_path,
                    timeout_seconds=config.get_agui_timeout(),
                )
                agent_interfaces.append(agui)
            except InterfaceCreationError as e:
                logger.error(f"Skipping AG-UI for {config.agent_id}: {e}")

        # Create A2A interface if enabled
        if config.a2a_enabled and config.a2a_path and settings.a2a_enabled:
            try:
                a2a = create_a2a_interface(
                    agent=agent,
                    path=config.a2a_path,
                    timeout_seconds=config.get_a2a_timeout(),
                )
                agent_interfaces.append(a2a)
            except InterfaceCreationError as e:
                logger.error(f"Skipping A2A for {config.agent_id}: {e}")

        if agent_interfaces:
            result[config.agent_id] = agent_interfaces
            logger.info(
                f"Created {len(agent_interfaces)} interface(s) for agent '{config.agent_id}'"
            )

    return result


def get_all_interface_paths() -> Dict[str, Dict[str, Optional[str]]]:
    """
    Get all configured interface paths.

    Useful for documentation and health check endpoints.

    Returns:
        Dictionary mapping agent_id to dict of interface paths

    Example:
        >>> paths = get_all_interface_paths()
        >>> # Returns:
        >>> # {
        >>> #     "dashboard_gateway": {"agui": "/agui", "a2a": "/a2a/dashboard"},
        >>> #     "navi": {"agui": None, "a2a": "/a2a/navi"},
        >>> # }
    """
    return {
        config.agent_id: {
            "agui": config.agui_path if config.agui_enabled else None,
            "a2a": config.a2a_path if config.a2a_enabled else None,
        }
        for config in INTERFACE_CONFIGS
    }


def validate_interface_config(config: InterfaceConfig) -> List[str]:
    """
    Validate an interface configuration.

    Args:
        config: InterfaceConfig to validate

    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []

    # Validate AG-UI config
    if config.agui_enabled and not config.agui_path:
        errors.append(f"{config.agent_id}: AG-UI enabled but no path specified")

    if config.agui_path and not config.agui_path.startswith("/"):
        errors.append(f"{config.agent_id}: AG-UI path must start with '/'")

    # Validate A2A config
    if config.a2a_enabled and not config.a2a_path:
        errors.append(f"{config.agent_id}: A2A enabled but no path specified")

    if config.a2a_path and not config.a2a_path.startswith("/"):
        errors.append(f"{config.agent_id}: A2A path must start with '/'")

    # Validate timeouts
    if config.agui_timeout_seconds is not None and config.agui_timeout_seconds <= 0:
        errors.append(f"{config.agent_id}: AG-UI timeout must be positive")

    if config.a2a_timeout_seconds is not None and config.a2a_timeout_seconds <= 0:
        errors.append(f"{config.agent_id}: A2A timeout must be positive")

    return errors
```

---

### Task 3: Create Health Check Endpoint Support (0.5 points)

Add health check support for interfaces.

**File:** `agents/agentos/health.py`

```python
"""
AgentOS Health Check Support

Provides health check utilities for monitoring interface status.
"""
from typing import Dict, Any, List
from datetime import datetime
import logging

from .config import get_agentos_settings, INTERFACE_CONFIGS
from .factory import get_all_interface_paths
from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class InterfaceHealthStatus:
    """Health status for an interface."""

    def __init__(
        self,
        interface_type: str,
        path: str,
        is_healthy: bool = True,
        error: str = None,
    ):
        self.interface_type = interface_type
        self.path = path
        self.is_healthy = is_healthy
        self.error = error
        self.checked_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.interface_type,
            "path": self.path,
            "healthy": self.is_healthy,
            "error": self.error,
            "checked_at": self.checked_at.isoformat(),
        }


def get_interfaces_health() -> Dict[str, Any]:
    """
    Get health status of all configured interfaces.

    Returns:
        Dictionary with interface health information
    """
    settings = get_agentos_settings()
    paths = get_all_interface_paths()

    interfaces_status = []
    healthy_count = 0
    total_count = 0

    for agent_id, agent_paths in paths.items():
        if agent_paths.get("agui"):
            total_count += 1
            status = InterfaceHealthStatus(
                interface_type="agui",
                path=agent_paths["agui"],
                is_healthy=settings.agui_enabled,
                error=None if settings.agui_enabled else "AG-UI globally disabled",
            )
            interfaces_status.append({
                "agent_id": agent_id,
                **status.to_dict()
            })
            if status.is_healthy:
                healthy_count += 1

        if agent_paths.get("a2a"):
            total_count += 1
            status = InterfaceHealthStatus(
                interface_type="a2a",
                path=agent_paths["a2a"],
                is_healthy=settings.a2a_enabled,
                error=None if settings.a2a_enabled else "A2A globally disabled",
            )
            interfaces_status.append({
                "agent_id": agent_id,
                **status.to_dict()
            })
            if status.is_healthy:
                healthy_count += 1

    return {
        "status": "healthy" if healthy_count == total_count else "degraded",
        "healthy_count": healthy_count,
        "total_count": total_count,
        "interfaces": interfaces_status,
        "settings": {
            "agui_enabled": settings.agui_enabled,
            "a2a_enabled": settings.a2a_enabled,
            "base_url": settings.base_url,
            "debug": settings.debug,
        },
        "protocol_versions": {
            "agui": DMConstants.AGUI.PROTOCOL_VERSION,
            "a2a": DMConstants.A2A.PROTOCOL_VERSION,
        },
        "checked_at": datetime.utcnow().isoformat(),
    }
```

Update the `__init__.py` to export health functions:

**Update:** `agents/agentos/__init__.py` (add to imports and exports)

```python
from .health import get_interfaces_health, InterfaceHealthStatus
```

---

### Task 4: Create Unit Tests (1.5 points)

Create comprehensive tests for the configuration and factory modules.

**File:** `agents/tests/test_dm_02_2_agentos_config.py`

```python
"""
Tests for DM-02.2: AgentOS Multi-Interface Setup

Verifies AgentOS configuration, interface factory, and health checks.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import List

# Skip if agno packages not available (CI without venv)
pytest.importorskip("agno")


class TestAgentOSSettings:
    """Test suite for AgentOS settings configuration."""

    def test_default_settings(self):
        """Verify default settings match DMConstants."""
        from agentos.config import AgentOSSettings
        from constants.dm_constants import DMConstants

        settings = AgentOSSettings()

        assert settings.port == DMConstants.AGENTOS.DEFAULT_PORT
        assert settings.workers == DMConstants.AGENTOS.WORKER_COUNT
        assert settings.request_timeout_seconds == DMConstants.AGENTOS.REQUEST_TIMEOUT_SECONDS
        assert settings.max_concurrent_tasks == DMConstants.AGENTOS.MAX_CONCURRENT_TASKS

    def test_environment_override(self, monkeypatch):
        """Verify environment variables override defaults."""
        monkeypatch.setenv("AGENTOS_PORT", "9000")
        monkeypatch.setenv("AGENTOS_DEBUG", "true")

        from agentos.config import AgentOSSettings

        # Clear the lru_cache
        from agentos.config import get_agentos_settings
        get_agentos_settings.cache_clear()

        settings = AgentOSSettings()
        assert settings.port == 9000
        assert settings.debug is True

    def test_base_url_default(self):
        """Verify base URL has sensible default."""
        from agentos.config import AgentOSSettings

        settings = AgentOSSettings()
        assert settings.base_url.startswith("http")
        assert "localhost" in settings.base_url or "127.0.0.1" in settings.base_url

    def test_interface_enable_flags(self):
        """Verify global interface enable flags default to True."""
        from agentos.config import AgentOSSettings

        settings = AgentOSSettings()
        assert settings.agui_enabled is True
        assert settings.a2a_enabled is True


class TestInterfaceConfig:
    """Test suite for InterfaceConfig model."""

    def test_interface_config_creation(self):
        """Verify InterfaceConfig can be created with required fields."""
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="test_agent",
            agui_enabled=True,
            agui_path="/agui/test",
            a2a_enabled=True,
            a2a_path="/a2a/test",
        )

        assert config.agent_id == "test_agent"
        assert config.agui_enabled is True
        assert config.agui_path == "/agui/test"
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/test"

    def test_timeout_defaults(self):
        """Verify timeout methods return DMConstants defaults."""
        from agentos.config import InterfaceConfig
        from constants.dm_constants import DMConstants

        config = InterfaceConfig(agent_id="test")

        assert config.get_agui_timeout() == DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS
        assert config.get_a2a_timeout() == DMConstants.A2A.TASK_TIMEOUT_SECONDS

    def test_timeout_overrides(self):
        """Verify timeout overrides work correctly."""
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="test",
            agui_timeout_seconds=120,
            a2a_timeout_seconds=600,
        )

        assert config.get_agui_timeout() == 120
        assert config.get_a2a_timeout() == 600

    def test_default_configs_exist(self):
        """Verify pre-configured interface configs exist."""
        from agentos.config import INTERFACE_CONFIGS

        agent_ids = [c.agent_id for c in INTERFACE_CONFIGS]

        assert "dashboard_gateway" in agent_ids
        assert "navi" in agent_ids
        assert "pulse" in agent_ids
        assert "herald" in agent_ids

    def test_dashboard_has_both_interfaces(self):
        """Verify dashboard_gateway has both AG-UI and A2A enabled."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")

        assert config is not None
        assert config.agui_enabled is True
        assert config.agui_path == "/agui"
        assert config.a2a_enabled is True
        assert config.a2a_path == "/a2a/dashboard"

    def test_pm_agents_a2a_only(self):
        """Verify PM agents only have A2A enabled."""
        from agentos.config import get_interface_config

        for agent_id in ["navi", "pulse", "herald"]:
            config = get_interface_config(agent_id)
            assert config is not None, f"Missing config for {agent_id}"
            assert config.agui_enabled is False, f"{agent_id} should not have AG-UI"
            assert config.a2a_enabled is True, f"{agent_id} should have A2A"


class TestInterfaceConfigRegistry:
    """Test suite for interface config registration."""

    def test_get_interface_config(self):
        """Verify get_interface_config returns correct config."""
        from agentos.config import get_interface_config

        config = get_interface_config("dashboard_gateway")
        assert config is not None
        assert config.agent_id == "dashboard_gateway"

    def test_get_interface_config_not_found(self):
        """Verify get_interface_config returns None for unknown agent."""
        from agentos.config import get_interface_config

        config = get_interface_config("nonexistent_agent")
        assert config is None

    def test_register_interface_config(self):
        """Verify new configs can be registered."""
        from agentos.config import (
            InterfaceConfig,
            register_interface_config,
            get_interface_config,
            INTERFACE_CONFIGS,
        )

        # Store original length
        original_len = len(INTERFACE_CONFIGS)

        new_config = InterfaceConfig(
            agent_id="test_registration",
            a2a_enabled=True,
            a2a_path="/a2a/test-reg",
        )

        try:
            register_interface_config(new_config)

            retrieved = get_interface_config("test_registration")
            assert retrieved is not None
            assert retrieved.agent_id == "test_registration"
        finally:
            # Cleanup: remove the test config
            INTERFACE_CONFIGS[:] = [
                c for c in INTERFACE_CONFIGS
                if c.agent_id != "test_registration"
            ]

    def test_register_duplicate_raises(self):
        """Verify registering duplicate agent_id raises error."""
        from agentos.config import InterfaceConfig, register_interface_config

        duplicate = InterfaceConfig(
            agent_id="dashboard_gateway",  # Already exists
            a2a_enabled=True,
            a2a_path="/a2a/duplicate",
        )

        with pytest.raises(ValueError, match="already exists"):
            register_interface_config(duplicate)


class TestInterfaceFactory:
    """Test suite for interface factory functions."""

    @pytest.fixture
    def mock_agent(self):
        """Create a mock Agno Agent."""
        agent = Mock()
        agent.name = "test_agent"
        return agent

    def test_create_agui_interface(self, mock_agent):
        """Verify AG-UI interface creation."""
        from agentos.factory import create_agui_interface

        with patch("agentos.factory.AGUI") as mock_agui:
            mock_agui.return_value = Mock()

            interface = create_agui_interface(
                agent=mock_agent,
                path="/agui/test",
                timeout_seconds=60,
            )

            mock_agui.assert_called_once()
            call_kwargs = mock_agui.call_args.kwargs
            assert call_kwargs["agent"] == mock_agent
            assert call_kwargs["path"] == "/agui/test"
            assert call_kwargs["timeout"] == 60

    def test_create_a2a_interface(self, mock_agent):
        """Verify A2A interface creation."""
        from agentos.factory import create_a2a_interface

        with patch("agentos.factory.A2A") as mock_a2a:
            mock_a2a.return_value = Mock()

            interface = create_a2a_interface(
                agent=mock_agent,
                path="/a2a/test",
                timeout_seconds=300,
            )

            mock_a2a.assert_called_once()
            call_kwargs = mock_a2a.call_args.kwargs
            assert call_kwargs["agent"] == mock_agent
            assert call_kwargs["path"] == "/a2a/test"
            assert call_kwargs["timeout"] == 300

    def test_create_interfaces_for_multiple_agents(self, mock_agent):
        """Verify batch interface creation."""
        from agentos.factory import create_interfaces
        from agentos.config import InterfaceConfig

        agents = {
            "agent1": mock_agent,
            "agent2": Mock(name="agent2"),
        }

        configs = [
            InterfaceConfig(
                agent_id="agent1",
                agui_enabled=True,
                agui_path="/agui/1",
                a2a_enabled=True,
                a2a_path="/a2a/1",
            ),
            InterfaceConfig(
                agent_id="agent2",
                agui_enabled=False,
                a2a_enabled=True,
                a2a_path="/a2a/2",
            ),
        ]

        with patch("agentos.factory.AGUI") as mock_agui, \
             patch("agentos.factory.A2A") as mock_a2a:
            mock_agui.return_value = Mock()
            mock_a2a.return_value = Mock()

            result = create_interfaces(agents, configs)

            # agent1 should have both interfaces
            assert "agent1" in result
            assert len(result["agent1"]) == 2

            # agent2 should only have A2A
            assert "agent2" in result
            assert len(result["agent2"]) == 1

    def test_create_interfaces_skips_missing_agents(self):
        """Verify factory skips agents not in the agents dict."""
        from agentos.factory import create_interfaces
        from agentos.config import InterfaceConfig

        agents = {}  # Empty - no agents provided

        configs = [
            InterfaceConfig(
                agent_id="missing_agent",
                a2a_enabled=True,
                a2a_path="/a2a/missing",
            ),
        ]

        result = create_interfaces(agents, configs)
        assert result == {}

    def test_get_all_interface_paths(self):
        """Verify get_all_interface_paths returns correct structure."""
        from agentos.factory import get_all_interface_paths

        paths = get_all_interface_paths()

        assert "dashboard_gateway" in paths
        assert paths["dashboard_gateway"]["agui"] == "/agui"
        assert paths["dashboard_gateway"]["a2a"] == "/a2a/dashboard"

        assert "navi" in paths
        assert paths["navi"]["agui"] is None  # AG-UI disabled
        assert paths["navi"]["a2a"] == "/a2a/navi"


class TestInterfaceConfigValidation:
    """Test suite for configuration validation."""

    def test_validate_valid_config(self):
        """Verify valid config passes validation."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="valid_agent",
            agui_enabled=True,
            agui_path="/agui/valid",
            a2a_enabled=True,
            a2a_path="/a2a/valid",
        )

        errors = validate_interface_config(config)
        assert errors == []

    def test_validate_agui_enabled_no_path(self):
        """Verify validation catches AG-UI enabled without path."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=True,
            agui_path=None,  # Missing path!
        )

        errors = validate_interface_config(config)
        assert any("AG-UI enabled but no path" in e for e in errors)

    def test_validate_a2a_enabled_no_path(self):
        """Verify validation catches A2A enabled without path."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=False,
            a2a_enabled=True,
            a2a_path=None,  # Missing path!
        )

        errors = validate_interface_config(config)
        assert any("A2A enabled but no path" in e for e in errors)

    def test_validate_path_must_start_with_slash(self):
        """Verify validation catches paths not starting with /."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=True,
            agui_path="agui/invalid",  # Missing leading /
        )

        errors = validate_interface_config(config)
        assert any("must start with '/'" in e for e in errors)

    def test_validate_negative_timeout(self):
        """Verify validation catches negative timeout values."""
        from agentos.factory import validate_interface_config
        from agentos.config import InterfaceConfig

        config = InterfaceConfig(
            agent_id="invalid_agent",
            agui_enabled=False,
            a2a_enabled=True,
            a2a_path="/a2a/test",
            a2a_timeout_seconds=-1,  # Invalid!
        )

        errors = validate_interface_config(config)
        assert any("timeout must be positive" in e for e in errors)


class TestInterfaceHealth:
    """Test suite for interface health checks."""

    def test_get_interfaces_health(self):
        """Verify health check returns expected structure."""
        from agentos.health import get_interfaces_health

        health = get_interfaces_health()

        assert "status" in health
        assert health["status"] in ["healthy", "degraded"]
        assert "healthy_count" in health
        assert "total_count" in health
        assert "interfaces" in health
        assert "settings" in health
        assert "protocol_versions" in health
        assert "checked_at" in health

    def test_health_includes_protocol_versions(self):
        """Verify health check includes protocol version info."""
        from agentos.health import get_interfaces_health
        from constants.dm_constants import DMConstants

        health = get_interfaces_health()

        assert health["protocol_versions"]["agui"] == DMConstants.AGUI.PROTOCOL_VERSION
        assert health["protocol_versions"]["a2a"] == DMConstants.A2A.PROTOCOL_VERSION

    def test_health_reflects_settings(self):
        """Verify health check reflects current settings."""
        from agentos.health import get_interfaces_health

        health = get_interfaces_health()

        assert "agui_enabled" in health["settings"]
        assert "a2a_enabled" in health["settings"]
        assert "base_url" in health["settings"]
```

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `agents/agentos/__init__.py` | AgentOS configuration module init |
| `agents/agentos/config.py` | Environment settings and interface configuration |
| `agents/agentos/factory.py` | Interface factory functions |
| `agents/agentos/health.py` | Health check support |
| `agents/tests/test_dm_02_2_agentos_config.py` | Comprehensive unit tests |

### Files to Modify (Future - DM-02.4+)

| File | Change |
|------|--------|
| `agents/main.py` | Mount interface routers (when Dashboard agent is created) |

---

## Testing Requirements

### Unit Tests

| Test Class | Tests | Purpose |
|------------|-------|---------|
| `TestAgentOSSettings` | 4 | Verify settings defaults and env overrides |
| `TestInterfaceConfig` | 6 | Verify interface configuration model |
| `TestInterfaceConfigRegistry` | 4 | Verify config registration functions |
| `TestInterfaceFactory` | 5 | Verify interface factory functions |
| `TestInterfaceConfigValidation` | 5 | Verify configuration validation |
| `TestInterfaceHealth` | 3 | Verify health check functions |
| **Total** | **27** | Exceeds minimum coverage requirements |

### Integration Tests (Future - with real agents)

| Test Case | Description |
|-----------|-------------|
| `test_agui_endpoint_responds` | Verify `/agui` accepts AG-UI requests |
| `test_a2a_endpoint_responds` | Verify `/a2a/*` accepts A2A requests |
| `test_both_interfaces_same_agent` | Verify both interfaces serve same agent |

---

## Definition of Done

- [ ] `agents/agentos/__init__.py` created with exports
- [ ] `agents/agentos/config.py` created with:
  - [ ] `AgentOSSettings` Pydantic settings class
  - [ ] `InterfaceConfig` model for per-agent configuration
  - [ ] `INTERFACE_CONFIGS` default configurations for known agents
  - [ ] `get_agentos_settings()` cached settings accessor
  - [ ] `get_interface_config()` config lookup function
  - [ ] `register_interface_config()` dynamic registration
- [ ] `agents/agentos/factory.py` created with:
  - [ ] `create_agui_interface()` factory function
  - [ ] `create_a2a_interface()` factory function
  - [ ] `create_interfaces()` batch factory function
  - [ ] `validate_interface_config()` validation helper
  - [ ] `get_all_interface_paths()` path utility
- [ ] `agents/agentos/health.py` created with health check support
- [ ] Unit tests pass (`pytest agents/tests/test_dm_02_2_agentos_config.py`)
- [ ] All interface configs use DMConstants (no magic numbers)
- [ ] Environment variable schema documented in settings class
- [ ] Code follows existing patterns in codebase

---

## Technical Notes

### Environment Variables

The AgentOS settings support the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTOS_PORT` | 8000 | Server port |
| `AGENTOS_HOST` | 0.0.0.0 | Server host |
| `AGENTOS_WORKERS` | 4 | Worker count |
| `AGENTOS_BASE_URL` | http://localhost:8000 | Base URL for A2A discovery |
| `AGENTOS_REQUEST_TIMEOUT_SECONDS` | 30 | Default request timeout |
| `AGENTOS_AGUI_ENABLED` | true | Global AG-UI enable |
| `AGENTOS_A2A_ENABLED` | true | Global A2A enable |
| `AGENTOS_DEBUG` | false | Debug mode |

### Interface Path Conventions

From the tech spec, paths follow these conventions:

| Interface | Path Pattern | Example |
|-----------|--------------|---------|
| AG-UI | `/agui` or `/agui/{agent}` | `/agui` |
| A2A | `/a2a/{agent_name}` | `/a2a/dashboard`, `/a2a/navi` |
| A2A Discovery | `/.well-known/agent.json` | (DM-02.3) |

### Constants Usage

All timeout and configuration values MUST use `DMConstants`:

```python
# CORRECT - Use constants
from constants.dm_constants import DMConstants
timeout = DMConstants.A2A.TASK_TIMEOUT_SECONDS

# INCORRECT - Magic numbers
timeout = 300  # Don't do this!
```

### Backward Compatibility

This story creates the configuration infrastructure without modifying `agents/main.py`. Integration with the FastAPI app will happen in DM-02.4 when the Dashboard Gateway agent is created. This ensures:

1. Existing REST endpoints remain unaffected
2. Configuration can be tested independently
3. Interface routers are mounted only when agents are ready

### Factory Pattern Rationale

We use a factory pattern rather than direct instantiation to:

1. **Centralize configuration** - All interface creation goes through the factory
2. **Enable testing** - Factory functions can be mocked easily
3. **Support validation** - Configuration is validated before interface creation
4. **Allow extension** - New interface types can be added without changing callers

---

## References

- [Epic DM-02 Definition](../epics/epic-dm-02-agno-multiinterface.md)
- [Epic DM-02 Tech Spec](../epics/epic-dm-02-tech-spec.md)
- [Story DM-02.1: Agno Protocol Dependencies](./dm-02-1-agno-protocol-dependencies.md)
- [DM Constants](../../../../agents/constants/dm_constants.py)
- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md)
- [Agno Documentation](https://docs.agno.com)

---

*Story Created: 2025-12-30*
*Story Completed: 2025-12-30*
*Epic: DM-02 | Story: 2 of 9 | Points: 5*

---

## Implementation Notes

**Implementation Date:** 2025-12-30

### Files Created

| File | Size | Description |
|------|------|-------------|
| `agents/agentos/__init__.py` | 2,142 bytes | Module exports for all configuration, factory, and health functions |
| `agents/agentos/config.py` | 7,694 bytes | `AgentOSSettings`, `InterfaceConfig`, and configuration helpers |
| `agents/agentos/factory.py` | 9,405 bytes | Interface factory functions with error handling |
| `agents/agentos/health.py` | 6,591 bytes | Health check utilities for interface monitoring |
| `agents/tests/test_dm_02_2_agentos_config.py` | 24,713 bytes | Comprehensive unit tests (43 tests) |

### Test Results

```
======================== 43 passed in 0.66s =========================
```

### Key Implementation Details

1. **AgentOSSettings**: Pydantic settings with `AGENTOS_` prefix, all defaults from `DMConstants`
2. **InterfaceConfig**: Per-agent configuration with AG-UI/A2A enable flags, paths, timeouts
3. **INTERFACE_CONFIGS**: Default configs for dashboard_gateway (AG-UI+A2A), navi/pulse/herald (A2A only)
4. **Factory Functions**: `create_agui_interface()`, `create_a2a_interface()`, `create_interfaces()`
5. **Health Checks**: `get_interfaces_health()`, `get_interface_health_summary()`

---

## Code Review

**Review Date:** 2025-12-30
**Reviewer:** Claude Code (Senior Developer Review)

### Review Summary

Story DM-02.2 implementation fully meets all acceptance criteria. The code is clean, well-organized, and thoroughly tested with 43 passing tests.

### Strengths

1. **Excellent Code Organization**: Clean module structure with clear separation of concerns
2. **Thorough Documentation**: Every class and function has detailed docstrings
3. **Consistent DMConstants Usage**: All configuration values reference DMConstants (no magic numbers)
4. **Graceful Dependency Handling**: Factory handles missing Agno packages gracefully
5. **Robust Test Coverage**: 43 tests across 9 test classes covering all components
6. **Type Hints Throughout**: All functions have proper type annotations
7. **Proper Timezone Handling**: Uses timezone-aware datetime

### DMConstants Usage Audit

| File | Status |
|------|--------|
| `config.py` | ✅ All defaults from DMConstants |
| `factory.py` | ✅ Uses DMConstants for timeouts |
| `health.py` | ✅ Uses DMConstants for protocol versions |

### Acceptance Criteria Verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ PASS | `agentos/` module with config, factory, health |
| AC2 | ✅ PASS | `AgentOSSettings` with AGENTOS_ prefix, DMConstants defaults |
| AC3 | ✅ PASS | Factory functions create interfaces correctly |
| AC4 | ✅ PASS | Dashboard has both, PM agents have A2A only |
| AC5 | ✅ PASS | 43 tests pass, covering all components |

### Verdict

**✅ APPROVED**

The implementation is production-ready and provides a solid foundation for the multi-interface AgentOS system.
