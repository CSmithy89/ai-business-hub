"""
Agent Model Selection Logic

Provides intelligent model selection based on agent type, task type,
and user configuration. Implements hybrid CCR/BYOAI mode.
"""

import copy
import logging
from typing import Any, Dict, Optional

from .ccr_provider import get_model_for_agent

logger = logging.getLogger(__name__)


# Agent-specific model preferences
# Maps agent_id to task_type for CCR routing
AGENT_MODEL_PREFERENCES: Dict[str, Dict[str, str]] = {
    # Dashboard Gateway: Orchestration and reasoning
    "dashboard_gateway": {
        "task_type": "reasoning",
        "description": "Dashboard orchestration requires complex reasoning",
    },
    # PM Agents
    "navi": {
        "task_type": "reasoning",
        "description": "PM orchestration needs strategic thinking",
    },
    "sage": {
        "task_type": "code_generation",
        "description": "Code analysis benefits from code-specialized models",
    },
    "pulse": {
        "task_type": "reasoning",
        "description": "Health monitoring requires analytical reasoning",
    },
    "chrono": {
        "task_type": "reasoning",
        "description": "Timeline planning needs reasoning about sequences",
    },
    "herald": {
        "task_type": "reasoning",
        "description": "Status communication requires clear reasoning",
    },
    # Knowledge Base Agents
    "scribe": {
        "task_type": "long_context",
        "description": "Document processing needs long context windows",
    },
    # Validation Agents
    "validator": {
        "task_type": "reasoning",
        "description": "Validation requires careful reasoning",
    },
    # Planning Agents
    "strategist": {
        "task_type": "reasoning",
        "description": "Strategic planning needs deep reasoning",
    },
    # Branding Agents
    "brand_curator": {
        "task_type": "reasoning",
        "description": "Brand consistency needs reasoning about identity",
    },
}


def select_model_for_agent(
    agent_id: str,
    user_config: Optional[Dict[str, Any]] = None,
    model_override: Optional[str] = None,
    task_type_override: Optional[str] = None,
) -> Any:
    """
    Select the best model for an agent.

    Selection priority:
    1. Explicit model override (returns None to use agent default)
    2. User's BYOAI configuration
    3. CCR routing based on agent preferences
    4. Default model

    Args:
        agent_id: Agent identifier (e.g., "navi", "dashboard_gateway")
        user_config: User's BYOAI configuration
        model_override: Explicit model override (bypasses selection)
        task_type_override: Override task type for routing

    Returns:
        Selected model instance

    Example:
        model = select_model_for_agent(
            agent_id="navi",
            user_config=user_byoai_config,
        )
        agent = Agent(model=model)
    """
    # If explicit model override, log and return None
    # (caller should use the override directly)
    if model_override:
        logger.debug(
            "Model override provided, using specified model",
            extra={
                "agent_id": agent_id,
                "model_override": model_override,
            },
        )
        # Return None to signal caller to use their specified model
        return None

    # Get agent preferences
    prefs = AGENT_MODEL_PREFERENCES.get(agent_id, {})
    task_type = task_type_override or prefs.get("task_type", "default")

    logger.debug(
        "Selecting model for agent",
        extra={
            "agent_id": agent_id,
            "task_type": task_type,
            "has_user_config": user_config is not None,
        },
    )

    return get_model_for_agent(
        agent_id=agent_id,
        user_config=user_config,
        task_type=task_type,
    )


def get_agent_task_type(agent_id: str) -> str:
    """
    Get the preferred task type for an agent.

    Args:
        agent_id: Agent identifier

    Returns:
        Task type string (e.g., "reasoning", "code_generation")
    """
    prefs = AGENT_MODEL_PREFERENCES.get(agent_id, {})
    return prefs.get("task_type", "default")


def get_all_agent_preferences() -> Dict[str, Dict[str, str]]:
    """
    Get all agent model preferences.

    Returns:
        Deep copy of dictionary mapping agent_id -> preferences,
        safe to modify without affecting original.
    """
    # Use deepcopy to prevent callers from modifying nested dictionaries
    return copy.deepcopy(AGENT_MODEL_PREFERENCES)
