"""
HITL (Human-in-the-Loop) Module

This module provides infrastructure for confidence-based approval routing
and long-running task management in the HYVVE agent system.

Features:
- HITL decorators for confidence-based approval routing
- Approval queue bridge for queuing low-confidence actions
- TaskManager for long-running task lifecycle management

Approval Paths:
- AUTO (>= 85%): Immediate execution with audit logging
- QUICK (60-84%): Inline CopilotKit approval (1-click)
- FULL (< 60%): Queue to Foundation approval system

Usage - HITL Tools:
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

Usage - Task Manager (DM-05.5):
    from hitl import get_task_manager_sync, TaskStep, TaskState

    # Get singleton task manager
    manager = get_task_manager_sync(state_emitter=emitter)

    # Define task steps
    async def step_one(prev_result, context):
        return {"data": "processed"}

    steps = [
        TaskStep(name="Step One", handler=step_one, timeout_seconds=30),
        TaskStep(name="Step Two", handler=step_two, timeout_seconds=60, retries=2),
    ]

    # Submit and wait for task
    task_id = await manager.submit_task(
        name="My Long Task",
        steps=steps,
        context={"input": "data"},
        overall_timeout=300,
    )
    result = await manager.wait_for_task(task_id)

    # Or cancel if needed
    await manager.cancel_task(task_id)

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Stories: DM-05.1, DM-05.3, DM-05.5
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
    # Exception
    ApprovalCancelledException,
    # Singleton accessors
    get_approval_bridge,
    close_approval_bridge,
    # Constants
    PRIORITY_HOURS,
    RISK_TO_PRIORITY,
)

from .approval_events import (
    # Event Manager class
    ApprovalEventManager,
    # Result dataclass
    ApprovalResult,
    # Singleton accessors
    get_approval_event_manager,
    reset_approval_event_manager,
)

from .task_manager import (
    # Core class
    TaskManager,
    # Enums
    TaskState,
    # Dataclasses
    TaskStep,
    TaskResult,
    ManagedTask,
    # Singleton accessors
    get_task_manager,
    get_task_manager_sync,
    close_task_manager,
    # Constants
    MAX_CONCURRENT_TASKS,
    DEFAULT_STEP_TIMEOUT,
    DEFAULT_CLEANUP_AGE,
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
    "ApprovalCancelledException",
    "get_approval_bridge",
    "close_approval_bridge",
    "PRIORITY_HOURS",
    "RISK_TO_PRIORITY",
    # Approval Event Manager (DM-11.6)
    "ApprovalEventManager",
    "ApprovalResult",
    "get_approval_event_manager",
    "reset_approval_event_manager",
    # Task Manager (DM-05.5)
    "TaskManager",
    "TaskState",
    "TaskStep",
    "TaskResult",
    "ManagedTask",
    "get_task_manager",
    "get_task_manager_sync",
    "close_task_manager",
    "MAX_CONCURRENT_TASKS",
    "DEFAULT_STEP_TIMEOUT",
    "DEFAULT_CLEANUP_AGE",
]
