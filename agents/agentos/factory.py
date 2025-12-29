"""
Interface Factory

Factory functions for creating AG-UI and A2A interfaces for agents.
Handles interface instantiation with proper configuration and error handling.

This module provides a factory pattern for creating protocol interfaces,
which centralizes configuration and enables easy testing through mocking.
"""
from typing import Dict, List, Optional, Union
import logging

from .config import (
    INTERFACE_CONFIGS,
    InterfaceConfig,
    get_agentos_settings,
)
from constants.dm_constants import DMConstants

# Handle optional Agno imports gracefully
try:
    from agno.agent import Agent
    from agno.os.interfaces.agui import AGUI
    from agno.os.interfaces.a2a import A2A

    AGNO_AVAILABLE = True
except ImportError:
    # Create placeholder types for when Agno is not installed
    Agent = object  # type: ignore
    AGUI = object  # type: ignore
    A2A = object  # type: ignore
    AGNO_AVAILABLE = False

logger = logging.getLogger(__name__)


class InterfaceCreationError(Exception):
    """Raised when interface creation fails.

    This exception is raised when an interface cannot be created due to
    configuration errors, missing dependencies, or initialization failures.
    """

    pass


def create_agui_interface(
    agent: "Agent",
    path: str,
    timeout_seconds: Optional[int] = None,
) -> "AGUI":
    """
    Create an AG-UI interface for an agent.

    AG-UI interfaces enable frontend communication with agents via
    CopilotKit's streaming protocol.

    Args:
        agent: The Agno Agent instance
        path: URL path for the interface (e.g., '/agui')
        timeout_seconds: Optional timeout override for tool calls

    Returns:
        Configured AGUI interface

    Raises:
        InterfaceCreationError: If interface creation fails
        RuntimeError: If Agno packages are not installed
    """
    if not AGNO_AVAILABLE:
        raise RuntimeError(
            "Agno packages not installed. Install with: pip install agno[agui,a2a]"
        )

    timeout = timeout_seconds or DMConstants.AGUI.TOOL_CALL_TIMEOUT_SECONDS

    try:
        interface = AGUI(
            agent=agent,
            path=path,
            timeout=timeout,
        )
        logger.info(
            f"Created AG-UI interface for agent '{getattr(agent, 'name', 'unknown')}' "
            f"at path '{path}'"
        )
        return interface
    except Exception as e:
        logger.error(f"Failed to create AG-UI interface: {e}")
        raise InterfaceCreationError(f"AG-UI interface creation failed: {e}") from e


def create_a2a_interface(
    agent: "Agent",
    path: str,
    timeout_seconds: Optional[int] = None,
    max_concurrent: Optional[int] = None,
) -> "A2A":
    """
    Create an A2A interface for an agent.

    A2A interfaces enable inter-agent and external agent communication
    using the A2A protocol (JSON-RPC 2.0).

    Args:
        agent: The Agno Agent instance
        path: URL path for the interface (e.g., '/a2a/dashboard')
        timeout_seconds: Optional timeout override for tasks
        max_concurrent: Optional max concurrent tasks override

    Returns:
        Configured A2A interface

    Raises:
        InterfaceCreationError: If interface creation fails
        RuntimeError: If Agno packages are not installed
    """
    if not AGNO_AVAILABLE:
        raise RuntimeError(
            "Agno packages not installed. Install with: pip install agno[agui,a2a]"
        )

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
            f"Created A2A interface for agent '{getattr(agent, 'name', 'unknown')}' "
            f"at path '{path}'"
        )
        return interface
    except Exception as e:
        logger.error(f"Failed to create A2A interface: {e}")
        raise InterfaceCreationError(f"A2A interface creation failed: {e}") from e


def create_interfaces(
    agents: Dict[str, "Agent"],
    configs: Optional[List[InterfaceConfig]] = None,
) -> Dict[str, List[Union["AGUI", "A2A"]]]:
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

    result: Dict[str, List[Union["AGUI", "A2A"]]] = {}

    for config in configs:
        agent = agents.get(config.agent_id)
        if not agent:
            logger.warning(f"No agent found for interface config: {config.agent_id}")
            continue

        agent_interfaces: List[Union["AGUI", "A2A"]] = []

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

    Checks for common configuration errors such as:
    - Interface enabled without path specified
    - Paths not starting with '/'
    - Invalid timeout values

    Args:
        config: InterfaceConfig to validate

    Returns:
        List of validation error messages (empty if valid)
    """
    errors: List[str] = []

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


def validate_all_interface_configs() -> Dict[str, List[str]]:
    """
    Validate all registered interface configurations.

    Returns:
        Dictionary mapping agent_id to list of validation errors
        (only includes agents with errors)
    """
    errors: Dict[str, List[str]] = {}
    for config in INTERFACE_CONFIGS:
        config_errors = validate_interface_config(config)
        if config_errors:
            errors[config.agent_id] = config_errors
    return errors
