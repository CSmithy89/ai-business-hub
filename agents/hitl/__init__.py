"""
HITL (Human-in-the-Loop) Module

This module provides infrastructure for confidence-based approval routing
in the HYVVE agent system. It enables tools to be decorated with HITL
markers that route actions through different approval paths based on
calculated confidence scores.

Approval Paths:
- AUTO (>= 85%): Immediate execution with audit logging
- QUICK (60-84%): Inline CopilotKit approval (1-click)
- FULL (< 60%): Queue to Foundation approval system

Usage:
    from hitl import hitl_tool, ApprovalLevel, HITLConfig

    @hitl_tool(
        approval_type="contract",
        risk_level="high",
        auto_threshold=95,
        quick_threshold=70,
    )
    async def sign_contract(contract_id: str, amount: float) -> dict:
        return {"status": "signed", "contract_id": contract_id}

    # Check if a function is an HITL tool
    if is_hitl_tool(sign_contract):
        config = get_hitl_config(sign_contract)
        print(f"Auto threshold: {config.auto_threshold}")

    # Check if a result requires approval
    result = await sign_contract(contract_id="C123", amount=5000)
    if is_hitl_pending(result):
        # Handle approval UI
        hitl_result = result["hitl_result"]

    # For low-confidence actions, use ApprovalQueueBridge (DM-05.3)
    from hitl import get_approval_bridge

    if hitl_result.approval_level == "full":
        bridge = get_approval_bridge()
        approval = await bridge.create_from_hitl_result(
            workspace_id="ws_123",
            hitl_result=hitl_result,
        )
        print(f"Queued for approval: {approval['id']}")

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Stories: DM-05.1, DM-05.3
"""

from .decorators import (
    # Core decorator
    hitl_tool,
    # Enums
    ApprovalLevel,
    # Pydantic models
    HITLConfig,
    HITLToolResult,
    # Core functions
    calculate_confidence,
    determine_approval_level,
    # Utility functions
    is_hitl_tool,
    get_hitl_config,
    is_hitl_pending,
    # Constants
    BASE_CONFIDENCE_SCORES,
    DEFAULT_CONFIDENCE_SCORE,
)

from .approval_bridge import (
    # Bridge class
    ApprovalQueueBridge,
    # Singleton accessors
    get_approval_bridge,
    close_approval_bridge,
    # Constants
    PRIORITY_HOURS,
    RISK_TO_PRIORITY,
)

__all__ = [
    # Core decorator
    "hitl_tool",
    # Enums
    "ApprovalLevel",
    # Pydantic models
    "HITLConfig",
    "HITLToolResult",
    # Core functions
    "calculate_confidence",
    "determine_approval_level",
    # Utility functions
    "is_hitl_tool",
    "get_hitl_config",
    "is_hitl_pending",
    # Constants
    "BASE_CONFIDENCE_SCORES",
    "DEFAULT_CONFIDENCE_SCORE",
    # Approval Queue Bridge (DM-05.3)
    "ApprovalQueueBridge",
    "get_approval_bridge",
    "close_approval_bridge",
    "PRIORITY_HOURS",
    "RISK_TO_PRIORITY",
]
