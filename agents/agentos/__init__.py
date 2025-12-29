"""
AgentOS Configuration Module

Provides multi-interface configuration for AgentOS, enabling agents
to be accessed via AG-UI and A2A protocols simultaneously.

This module exports all configuration, factory, and health check
functionality for the AgentOS multi-interface system.

Key Components:
    - AgentOSSettings: Global AgentOS configuration from environment
    - InterfaceConfig: Per-agent interface configuration model
    - Factory functions for creating AG-UI and A2A interfaces
    - Health check utilities for monitoring interface status

Usage:
    >>> from agentos import (
    ...     AgentOSSettings,
    ...     InterfaceConfig,
    ...     create_interfaces,
    ...     get_interfaces_health,
    ... )
    >>> settings = get_agentos_settings()
    >>> print(f"AgentOS running on port {settings.port}")

Environment Variables:
    All AgentOS settings can be configured via environment variables
    with the AGENTOS_ prefix (e.g., AGENTOS_PORT, AGENTOS_DEBUG).
"""
from .config import (
    AgentOSSettings,
    InterfaceConfig,
    INTERFACE_CONFIGS,
    get_agentos_settings,
    get_interface_config,
    register_interface_config,
    update_interface_config,
)
from .factory import (
    InterfaceCreationError,
    create_agui_interface,
    create_a2a_interface,
    create_interfaces,
    get_all_interface_paths,
    validate_interface_config,
    validate_all_interface_configs,
)
from .health import (
    InterfaceHealthStatus,
    get_interfaces_health,
    get_interface_health_summary,
    check_interface_enabled,
)

__all__ = [
    # Settings
    "AgentOSSettings",
    "InterfaceConfig",
    "INTERFACE_CONFIGS",
    "get_agentos_settings",
    "get_interface_config",
    "register_interface_config",
    "update_interface_config",
    # Factory
    "InterfaceCreationError",
    "create_agui_interface",
    "create_a2a_interface",
    "create_interfaces",
    "get_all_interface_paths",
    "validate_interface_config",
    "validate_all_interface_configs",
    # Health
    "InterfaceHealthStatus",
    "get_interfaces_health",
    "get_interface_health_summary",
    "check_interface_enabled",
]
