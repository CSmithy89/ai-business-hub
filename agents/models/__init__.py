"""
AgentOS Model Providers

Provides model abstraction layer for Agno agents with CCR and BYOAI support.
"""

from .ccr_provider import (
    CCRModel,
    get_model_for_agent,
    validate_ccr_connection,
)
from .selector import (
    select_model_for_agent,
    AGENT_MODEL_PREFERENCES,
)

__all__ = [
    # CCR Provider
    "CCRModel",
    "get_model_for_agent",
    "validate_ccr_connection",
    # Model Selector
    "select_model_for_agent",
    "AGENT_MODEL_PREFERENCES",
]
