"""
HITL Tool Decorators

Human-in-the-Loop tool decorators and utilities for confidence-based
approval routing. This module provides:

- @hitl_tool decorator for marking functions as requiring HITL
- Confidence calculation based on tool type and context
- Approval level determination (AUTO, QUICK, FULL)
- Utility functions for introspection

Confidence Thresholds (from Foundation architecture):
- >= 85% (AUTO): Auto-execute with audit logging only
- 60-84% (QUICK): Inline HITL via CopilotKit renderAndWaitForResponse
- < 60% (FULL): Queue to Foundation approval system for full review

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.1
"""

import functools
import logging
import time
import uuid
from enum import Enum
from typing import Any, Callable, Dict, Optional, TypeVar, cast

from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS
# =============================================================================


class ApprovalLevel(str, Enum):
    """
    Approval requirement levels based on confidence thresholds.

    These levels determine how a tool invocation is handled:
    - AUTO: Immediate execution with audit logging
    - QUICK: Inline HITL via CopilotKit (1-click approval)
    - FULL: Queue to Foundation approval system for full review
    """

    AUTO = "auto"
    QUICK = "quick"
    FULL = "full"


# =============================================================================
# PYDANTIC MODELS
# =============================================================================


class HITLConfig(BaseModel):
    """
    Configuration for HITL tool behavior.

    This model defines all settings for a tool's HITL behavior,
    including confidence thresholds, risk classification, and UI hints.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    # Confidence thresholds
    auto_threshold: int = Field(
        default=85,
        ge=0,
        le=100,
        description="Minimum confidence for auto-execution (default 85)",
    )
    quick_threshold: int = Field(
        default=60,
        ge=0,
        le=100,
        description="Minimum confidence for quick approval (default 60)",
    )

    # Tool metadata
    approval_type: str = Field(
        default="general",
        description="Type of approval (e.g., 'contract', 'financial', 'deletion')",
    )
    risk_level: str = Field(
        default="medium",
        description="Risk level: low, medium, high",
    )
    requires_reason: bool = Field(
        default=False,
        description="Whether rejection requires a reason",
    )
    timeout_seconds: int = Field(
        default=300,
        ge=1,
        description="Timeout for approval in seconds (default 5 minutes)",
    )

    # UI hints for frontend
    approve_label: str = Field(
        default="Approve",
        description="Button label for approval action",
    )
    reject_label: str = Field(
        default="Reject",
        description="Button label for rejection action",
    )
    description_template: Optional[str] = Field(
        default=None,
        description="Template for generating approval description",
    )

    @field_validator("auto_threshold")
    @classmethod
    def auto_must_be_higher_than_quick(cls, v: int, info: Any) -> int:
        """Validate that auto_threshold >= quick_threshold."""
        quick = info.data.get("quick_threshold", 60)
        if v < quick:
            raise ValueError("auto_threshold must be >= quick_threshold")
        return v


class HITLToolResult(BaseModel):
    """
    Result from HITL tool evaluation.

    This model is returned when a tool requires approval.
    It contains all information needed for the frontend to render
    the approval UI and for the approval system to process the request.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    requires_approval: bool = Field(
        ...,
        description="Whether approval is required",
    )
    approval_level: ApprovalLevel = Field(
        ...,
        description="The type of approval needed",
    )
    confidence_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Calculated confidence score (0-100)",
    )
    tool_name: str = Field(
        ...,
        description="Name of the tool requiring approval",
    )
    tool_args: Dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments passed to the tool",
    )
    config: HITLConfig = Field(
        ...,
        description="HITL configuration for this tool",
    )
    approval_id: Optional[str] = Field(
        default=None,
        description="ID if queued to Foundation approval (for FULL level)",
    )
    request_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for this HITL request",
    )

    def to_marker_dict(self) -> Dict[str, Any]:
        """
        Convert to HITL marker format for frontend detection.

        Returns a dictionary with __hitl_pending__ marker that
        the frontend can detect and handle appropriately.
        """
        return {
            "__hitl_pending__": True,
            "hitl_result": self.model_dump(by_alias=True),
        }


# =============================================================================
# BASE CONFIDENCE SCORES
# =============================================================================

# Base confidence scores by tool name
# These are starting points before context adjustments
BASE_CONFIDENCE_SCORES: Dict[str, int] = {
    "sign_contract": 50,  # High-risk financial commitment
    "delete_project": 40,  # Destructive, irreversible
    "approve_expense": 60,  # Financial but routine
    "send_notification": 80,  # Low-risk communication
    "send_bulk_notification": 70,  # Medium-risk bulk operation
    "update_task_status": 85,  # Routine operation
}

# Default score for unknown tools
DEFAULT_CONFIDENCE_SCORE = 70


# =============================================================================
# CONFIDENCE CALCULATION
# =============================================================================


def calculate_confidence(
    tool_name: str,
    args: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Calculate confidence score for a tool invocation.

    The confidence score determines which approval path is used:
    - >= 85: AUTO (immediate execution)
    - 60-84: QUICK (inline approval)
    - < 60: FULL (queue to approval system)

    Args:
        tool_name: Name of the tool being invoked
        args: Arguments passed to the tool
        context: Optional context including user_role, workspace_verified, etc.

    Returns:
        Confidence score between 0 and 100

    Example:
        >>> calculate_confidence("sign_contract", {"amount": 5000})
        50
        >>> calculate_confidence("sign_contract", {}, {"user_role": "admin"})
        60
    """
    context = context or {}

    # Get base score for tool
    score = BASE_CONFIDENCE_SCORES.get(tool_name, DEFAULT_CONFIDENCE_SCORE)

    # Apply context adjustments
    # User role bonus
    if context.get("user_role") == "admin":
        score += 10

    # Workspace verification bonus
    if context.get("workspace_verified"):
        score += 5

    # Amount-based penalty for financial tools
    amount = args.get("amount", 0)
    if isinstance(amount, (int, float)) and amount > 1000:
        score -= 15

    # Bulk operation penalty
    if "bulk" in tool_name.lower() or args.get("is_bulk"):
        score -= 10

    # Recipient count penalty for notifications
    recipient_count = args.get("recipient_count", 1)
    if isinstance(recipient_count, int) and recipient_count > 100:
        score -= 10

    # Time-sensitive bonus
    if context.get("time_sensitive"):
        score += 5

    # Clamp to valid range
    return max(0, min(100, score))


# =============================================================================
# APPROVAL LEVEL DETERMINATION
# =============================================================================


def determine_approval_level(
    confidence: int,
    config: HITLConfig,
) -> ApprovalLevel:
    """
    Determine the approval level based on confidence score and thresholds.

    Args:
        confidence: Calculated confidence score (0-100)
        config: HITL configuration with threshold values

    Returns:
        ApprovalLevel.AUTO, QUICK, or FULL

    Example:
        >>> config = HITLConfig()
        >>> determine_approval_level(90, config)
        <ApprovalLevel.AUTO: 'auto'>
        >>> determine_approval_level(70, config)
        <ApprovalLevel.QUICK: 'quick'>
        >>> determine_approval_level(50, config)
        <ApprovalLevel.FULL: 'full'>
    """
    if confidence >= config.auto_threshold:
        return ApprovalLevel.AUTO
    elif confidence >= config.quick_threshold:
        return ApprovalLevel.QUICK
    else:
        return ApprovalLevel.FULL


# =============================================================================
# AUDIT LOGGING
# =============================================================================


def _log_auto_execution(
    tool_name: str,
    args: Dict[str, Any],
    confidence: int,
    context: Optional[Dict[str, Any]] = None,
    result: Optional[Any] = None,
) -> None:
    """
    Log auto-executed tool invocations for audit trail.

    This function records when tools are auto-executed (confidence >= auto_threshold)
    for compliance and debugging purposes.

    Args:
        tool_name: Name of the executed tool
        args: Arguments passed to the tool
        confidence: Confidence score that triggered auto-execution
        context: Optional context information (user, workspace, etc.)
        result: Optional result of the tool execution
    """
    context = context or {}

    # Sanitize args for logging (remove sensitive data)
    safe_args = {k: v for k, v in args.items() if not _is_sensitive_key(k)}

    log_entry = {
        "event": "hitl_auto_execution",
        "tool_name": tool_name,
        "confidence": confidence,
        "user_id": context.get("user_id"),
        "workspace_id": context.get("workspace_id"),
        "user_role": context.get("user_role"),
        "args": safe_args,
        "timestamp": time.time(),
        "result_type": type(result).__name__ if result is not None else None,
    }

    logger.info(
        f"HITL auto-execution: {tool_name} with confidence {confidence}",
        extra={"hitl_audit": log_entry},
    )


def _is_sensitive_key(key: str) -> bool:
    """Check if a key might contain sensitive data."""
    sensitive_patterns = [
        "password",
        "secret",
        "token",
        "api_key",
        "apikey",
        "credential",
        "auth",
    ]
    key_lower = key.lower()
    return any(pattern in key_lower for pattern in sensitive_patterns)


# =============================================================================
# DECORATOR
# =============================================================================

# Type variable for preserving function signature
F = TypeVar("F", bound=Callable[..., Any])


def hitl_tool(
    approval_type: str = "general",
    risk_level: str = "medium",
    auto_threshold: int = 85,
    quick_threshold: int = 60,
    requires_reason: bool = False,
    timeout_seconds: int = 300,
    approve_label: str = "Approve",
    reject_label: str = "Reject",
    description_template: Optional[str] = None,
) -> Callable[[F], F]:
    """
    Decorator to mark a tool as requiring Human-in-the-Loop approval.

    The decorator wraps async functions to:
    1. Calculate confidence for the invocation
    2. Determine approval level based on thresholds
    3. For AUTO: Execute immediately with audit logging
    4. For QUICK/FULL: Return HITL marker for frontend/queue handling

    IMPORTANT: All decorated functions must be async.

    Args:
        approval_type: Type of approval (e.g., 'contract', 'financial')
        risk_level: Risk classification (low, medium, high)
        auto_threshold: Minimum confidence for auto-execution (default 85)
        quick_threshold: Minimum confidence for quick approval (default 60)
        requires_reason: Whether rejection requires a reason
        timeout_seconds: Approval timeout in seconds
        approve_label: Button label for approval
        reject_label: Button label for rejection
        description_template: Template for approval description

    Returns:
        Decorated async function with HITL behavior

    Example:
        >>> @hitl_tool(approval_type="contract", auto_threshold=95)
        ... async def sign_contract(contract_id: str, amount: float) -> dict:
        ...     return {"status": "signed", "contract_id": contract_id}
        ...
        >>> # With high confidence context, executes directly
        >>> result = await sign_contract(
        ...     contract_id="C123",
        ...     amount=500,
        ...     _hitl_context={"user_role": "admin", "workspace_verified": True}
        ... )
    """
    # Build config from parameters
    config = HITLConfig(
        approval_type=approval_type,
        risk_level=risk_level,
        auto_threshold=auto_threshold,
        quick_threshold=quick_threshold,
        requires_reason=requires_reason,
        timeout_seconds=timeout_seconds,
        approve_label=approve_label,
        reject_label=reject_label,
        description_template=description_template,
    )

    def decorator(func: F) -> F:
        # Store config on function for introspection
        setattr(func, "_hitl_config", config)
        setattr(func, "_is_hitl_tool", True)

        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Extract HITL context from kwargs (injected by agent system)
            hitl_context = kwargs.pop("_hitl_context", None) or {}

            # Get tool name from function
            tool_name = func.__name__

            # Calculate confidence
            confidence = calculate_confidence(tool_name, kwargs, hitl_context)

            # Determine approval level
            approval_level = determine_approval_level(confidence, config)

            logger.debug(
                f"HITL evaluation: {tool_name}, confidence={confidence}, level={approval_level.value}"
            )

            # AUTO: Execute immediately with audit logging
            if approval_level == ApprovalLevel.AUTO:
                result = await func(*args, **kwargs)
                _log_auto_execution(
                    tool_name=tool_name,
                    args=kwargs,
                    confidence=confidence,
                    context=hitl_context,
                    result=result,
                )
                return result

            # QUICK or FULL: Return HITL marker
            hitl_result = HITLToolResult(
                requires_approval=True,
                approval_level=approval_level,
                confidence_score=confidence,
                tool_name=tool_name,
                tool_args=kwargs,
                config=config,
            )

            logger.info(
                f"HITL pending: {tool_name} requires {approval_level.value} approval "
                f"(confidence={confidence})"
            )

            return hitl_result.to_marker_dict()

        return cast(F, wrapper)

    return decorator


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================


def is_hitl_tool(func: Callable[..., Any]) -> bool:
    """
    Check if a function is decorated with @hitl_tool.

    Args:
        func: Function to check

    Returns:
        True if the function is an HITL tool, False otherwise

    Example:
        >>> @hitl_tool()
        ... async def my_tool():
        ...     pass
        >>> is_hitl_tool(my_tool)
        True
    """
    return getattr(func, "_is_hitl_tool", False)


def get_hitl_config(func: Callable[..., Any]) -> Optional[HITLConfig]:
    """
    Get the HITL configuration from a decorated function.

    Args:
        func: Function decorated with @hitl_tool

    Returns:
        HITLConfig if the function is an HITL tool, None otherwise

    Example:
        >>> @hitl_tool(auto_threshold=90)
        ... async def my_tool():
        ...     pass
        >>> config = get_hitl_config(my_tool)
        >>> config.auto_threshold
        90
    """
    return getattr(func, "_hitl_config", None)


def is_hitl_pending(result: Any) -> bool:
    """
    Check if a result indicates HITL approval is pending.

    Args:
        result: Result from a tool invocation

    Returns:
        True if the result contains a HITL pending marker

    Example:
        >>> result = {"__hitl_pending__": True, "hitl_result": {...}}
        >>> is_hitl_pending(result)
        True
    """
    return isinstance(result, dict) and result.get("__hitl_pending__") is True
