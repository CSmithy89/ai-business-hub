"""
Base Agent Response Schemas

Common base classes and utilities for agent response validation.

DM-08.7: Created for response parser validation.
"""

import logging
from typing import Any, Callable, Dict, Optional, TypeVar

from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class AgentError(BaseModel):
    """Error information from an agent response."""

    code: str = Field(default="UNKNOWN_ERROR", description="Error code")
    message: str = Field(description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional error details"
    )


class AgentResponse(BaseModel):
    """
    Base response wrapper for all agent responses.

    Provides common fields for error handling and metadata.
    """

    success: bool = Field(default=True, description="Whether the agent call succeeded")
    content: Optional[str] = Field(default=None, description="Text content from agent")
    error: Optional[AgentError] = Field(default=None, description="Error if failed")
    duration_ms: Optional[int] = Field(
        default=None, description="Response time in milliseconds"
    )
    agent_id: str = Field(description="ID of the responding agent")


def parse_agent_response(
    raw_data: Dict[str, Any],
    schema_class: type[T],
    agent_id: str,
    default_factory: Optional[Callable[[], Dict[str, Any]]] = None,
) -> T | Dict[str, Any]:
    """
    Parse and validate an agent response using a Pydantic schema.

    Args:
        raw_data: Raw response data from agent
        schema_class: Pydantic model class to validate against
        agent_id: Agent identifier for logging
        default_factory: Optional factory to create safe defaults on failure

    Returns:
        Validated response object or default value on failure

    Example:
        >>> data = {"project_id": "123", "status": "on-track"}
        >>> result = parse_agent_response(data, NaviProjectResponse, "navi")
    """
    try:
        validated = schema_class(**raw_data)
        return validated
    except ValidationError as e:
        logger.warning(
            f"[{agent_id}] Response validation failed: {e.error_count()} errors",
            extra={
                "agent_id": agent_id,
                "errors": e.errors(),
                "raw_data_keys": list(raw_data.keys()),
            },
        )
        if default_factory:
            return default_factory()
        # Return raw data with error flag for graceful degradation
        return {
            **raw_data,
            "_validation_error": True,
            "_validation_errors": e.errors(),
        }
