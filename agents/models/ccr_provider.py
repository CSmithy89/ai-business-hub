"""
CCR Model Provider for Agno Agents

Provides model routing through Claude Code Router (CCR) for intelligent
provider selection based on task type.

CCR exposes an OpenAI-compatible API, so we extend the OpenAI model class
and add CCR-specific headers for routing hints.
"""

import logging
from typing import Any, Dict, Optional

from agents.config import get_settings
from agents.constants.dm_constants import DMConstants
from agents.services.ccr_health import get_ccr_health_checker

# Lazy import to avoid circular dependency
try:
    from agno.models.openai import OpenAIChat
    from agno.models.base import Model

    AGNO_AVAILABLE = True
except ImportError:
    AGNO_AVAILABLE = False
    OpenAIChat = object  # type: ignore
    Model = object  # type: ignore


logger = logging.getLogger(__name__)


class CCRModel(OpenAIChat):  # type: ignore[misc]
    """
    Model that routes through CCR.

    CCR provides OpenAI-compatible API, so we extend OpenAIChat.
    Task type hints are passed via X-CCR-Task-Type header.

    Supports auto-classification: if task_type is None, it will be
    inferred from message content when get_request_headers is called
    with a message context.
    """

    def __init__(
        self,
        model_id: str = "auto",
        task_type: Optional[str] = None,
        agent_id: Optional[str] = None,
        auto_classify: bool = True,
        **kwargs: Any,
    ):
        """
        Initialize CCR model.

        Args:
            model_id: Model to request, or "auto" for CCR routing
            task_type: Hint for CCR routing (reasoning, code_generation, etc.)
            agent_id: Agent identifier for logging
            auto_classify: Auto-classify task type from message content
            **kwargs: Additional OpenAI parameters
        """
        if not AGNO_AVAILABLE:
            raise RuntimeError(
                "Agno is not installed. Install with: pip install agno"
            )

        settings = get_settings()

        super().__init__(
            id=model_id,
            base_url=f"{settings.ccr_url}/v1",
            api_key="ccr-platform",  # CCR doesn't need real key
            **kwargs,
        )
        self.task_type = task_type
        self._agent_id = agent_id
        self._ccr_url = settings.ccr_url
        self._auto_classify = auto_classify
        self._last_message: Optional[str] = None

        logger.debug(
            "CCRModel initialized",
            extra={
                "model_id": model_id,
                "task_type": task_type,
                "agent_id": agent_id,
                "auto_classify": auto_classify,
                "ccr_url": settings.ccr_url,
            },
        )

    def classify_message(self, message: str) -> str:
        """
        Classify a message to determine task type for CCR routing.

        Args:
            message: The message content to classify

        Returns:
            Task type string for CCR routing
        """
        from agents.models.task_classifier import get_task_type_for_agent

        task_type = get_task_type_for_agent(
            agent_id=self._agent_id or "unknown",
            message=message,
        )
        return task_type.value

    def set_message_context(self, message: str) -> None:
        """
        Set message context for auto-classification.

        Call this before making a request to enable auto-classification.

        Args:
            message: The message content for classification
        """
        self._last_message = message

    def get_request_headers(self) -> Dict[str, str]:
        """
        Get headers for CCR request.

        If task_type is not set and auto_classify is enabled,
        uses last_message to classify the task type.

        Returns:
            Headers dict with CCR-specific routing hints
        """
        headers: Dict[str, str] = {}

        # Determine task type (explicit or auto-classified)
        task_type = self.task_type
        if not task_type and self._auto_classify and self._last_message:
            task_type = self.classify_message(self._last_message)

        # Add task type hint for CCR routing
        if task_type:
            headers["X-CCR-Task-Type"] = task_type

        # Add agent identifier for tracking
        if self._agent_id:
            headers["X-CCR-Agent-Id"] = self._agent_id

        return headers


def get_model_for_agent(
    agent_id: str,
    user_config: Optional[Dict[str, Any]] = None,
    task_type: Optional[str] = None,
) -> Any:
    """
    Get appropriate model for an agent.

    Implements hybrid mode: CCR vs BYOAI based on configuration.

    Selection priority:
    1. User's BYOAI configuration (if provided and use_platform_subscription=False)
    2. CCR routing (if enabled and healthy)
    3. BYOAI fallback

    Args:
        agent_id: Agent identifier
        user_config: User's BYOAI configuration dict
        task_type: Task type hint for routing

    Returns:
        Configured model instance

    Raises:
        RuntimeError: If neither CCR nor BYOAI available
    """
    settings = get_settings()

    # Determine if we should use CCR
    use_ccr = _should_use_ccr(user_config)

    if use_ccr:
        logger.info(
            "Using CCR model for agent",
            extra={
                "agent_id": agent_id,
                "task_type": task_type,
            },
        )
        return CCRModel(
            model_id="auto",
            task_type=task_type,
            agent_id=agent_id,
        )
    else:
        # Fall back to BYOAI
        logger.info(
            "Using BYOAI model for agent",
            extra={"agent_id": agent_id},
        )
        return _create_byoai_model(user_config)


def _should_use_ccr(user_config: Optional[Dict[str, Any]] = None) -> bool:
    """
    Determine if CCR should be used based on configuration.

    Args:
        user_config: User's BYOAI configuration

    Returns:
        True if CCR should be used
    """
    settings = get_settings()

    # CCR must be enabled
    if not settings.ccr_enabled:
        return False

    # Check CCR health (sync check of cached state)
    health_checker = _get_health_checker_sync()
    if health_checker and not health_checker.is_healthy:
        logger.warning("CCR unhealthy, falling back to BYOAI")
        return False

    # Check user preference
    if user_config:
        # If user explicitly wants to use their own keys, don't use CCR
        use_platform = user_config.get("use_platform_subscription", True)
        if not use_platform:
            return False

    return True


def _get_health_checker_sync() -> Any:
    """
    Get CCR health checker synchronously (for cached state only).

    Returns:
        CCRHealthChecker instance or None
    """
    from agents.services.ccr_health import CCRHealthChecker

    return CCRHealthChecker._instance


def _create_byoai_model(user_config: Optional[Dict[str, Any]] = None) -> Any:
    """
    Create a BYOAI model from user configuration.

    Args:
        user_config: User's BYOAI configuration

    Returns:
        Agno model instance
    """
    if not AGNO_AVAILABLE:
        raise RuntimeError(
            "Agno is not installed. Install with: pip install agno"
        )

    from agno.models.anthropic import Claude

    # Default to Claude if no config
    if not user_config:
        return Claude(id="claude-sonnet-4-20250514")

    # Use BYOAI provider system
    from agents.providers import create_agno_model, ResolvedProvider

    # Convert user_config to ResolvedProvider
    resolved = ResolvedProvider(
        provider_id=user_config.get("provider_id", "default"),
        provider_type=user_config.get("provider_type", "claude"),
        model_id=user_config.get("model_id", "claude-sonnet-4-20250514"),
        model_class=user_config.get("model_class", "Claude"),
        api_key=user_config.get("api_key"),
        is_valid=True,
    )

    return create_agno_model(resolved)


async def validate_ccr_connection() -> bool:
    """
    Validate CCR is available before agent startup.

    This should be called during application startup when CCR is enabled.

    Returns:
        True if CCR is reachable
    """
    settings = get_settings()

    if not settings.ccr_enabled:
        logger.info("CCR is disabled, skipping validation")
        return True

    from agents.services.ccr_health import CCRHealthChecker

    try:
        # Initialize health checker
        checker = await CCRHealthChecker.get_instance(
            ccr_url=settings.ccr_url,
            check_interval=settings.ccr_health_check_interval,
            enabled=True,
        )

        # Perform initial health check
        health = await checker.check_health()

        if health.status.value == "healthy":
            logger.info(
                "CCR connection validated",
                extra={
                    "ccr_url": settings.ccr_url,
                    "providers": health.providers,
                },
            )
            return True
        else:
            logger.warning(
                "CCR not healthy",
                extra={
                    "status": health.status.value,
                    "error": health.last_error,
                },
            )
            return False

    except Exception as e:
        logger.error(
            "CCR validation failed",
            extra={"error": str(e)},
        )
        return False
