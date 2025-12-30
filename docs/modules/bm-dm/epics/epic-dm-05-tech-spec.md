# Epic DM-05: Advanced HITL & Streaming - Technical Specification

## 1. Executive Summary

### What DM-05 Delivers

Epic DM-05 implements **Human-in-the-Loop (HITL)** capabilities and **real-time progress streaming** for long-running agent tasks. This builds on the shared state infrastructure (DM-04) by adding:

1. **HITL Tool Definitions** - Backend tools decorated with `human_in_the_loop=True` that pause for user approval
2. **Frontend HITL Handlers** - React components using CopilotKit's `renderAndWaitForResponse` for approval UIs
3. **Approval Workflow Integration** - Bridge between CopilotKit HITL and Foundation's confidence-based approval queue
4. **Real-Time Progress Streaming** - Progressive state emissions showing task step completion
5. **Long-Running Task Support** - Async task patterns with timeout handling and cancellation

**Key Insight:** CopilotKit provides native HITL support via `useCopilotAction` with `renderAndWaitForResponse`. This epic integrates this with HYVVE's existing Foundation approval system, enabling confidence-based routing where high-confidence actions auto-execute while lower-confidence actions pause for human approval.

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| CopilotKit | ^1.x | `useCopilotAction` with `renderAndWaitForResponse` |
| Agno | ^0.3.x | Agent tool decoration with HITL markers |
| Foundation Approval | - | Confidence-based routing and audit logging |
| Zustand | ^4.x | Progress state management |
| AG-UI Protocol | ^0.1.x | State streaming for progress updates |

### Integration Points with Existing Codebase

1. **Foundation Approval System (`apps/api/src/approvals/`)**
   - Existing confidence routing (>85% auto-execute, 60-85% quick review, <60% full review)
   - Approval queue with audit logging
   - Event emission on approval/rejection
   - **This epic integrates**, doesn't duplicate, this system

2. **Dashboard State Emitter (`agents/gateway/state_emitter.py`)**
   - Created in DM-04 with loading state support
   - This epic extends with progress step tracking

3. **CopilotKit Hooks (`apps/web/src/lib/state/`)**
   - Created in DM-04 with `useAgentStateSync`
   - This epic adds HITL action handlers

4. **Approval Components (`apps/web/src/components/approval/`)**
   - Existing `ApprovalDetailModal`, `ApprovalActions`, `ConfidenceIndicator`
   - This epic reuses these for inline HITL rendering

### Relationship to Phase 5

From `docs/architecture/dynamic-module-system.md`, Phase 5 specifies:

> **Approval Workflows (Human-in-the-Loop):**
> - Upgrade `ApprovalAgent` to use CopilotKit's HITL for secure, blocking authorizations
> - Backend: Use `@tool(human_in_the_loop=True)` decorator
> - Frontend: Use `useHumanInTheLoop` to render approval UI

This epic implements exactly this specification, with the refinement that CopilotKit's current API uses `useCopilotAction` with `renderAndWaitForResponse` rather than a separate `useHumanInTheLoop` hook.

---

## 2. Architecture Decisions

### 2.1 HITL Flow Architecture

The HITL system integrates CopilotKit's native capabilities with Foundation's approval queue:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            HITL FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Request                                                                │
│       │                                                                      │
│       v                                                                      │
│  ┌──────────────────┐                                                        │
│  │  Dashboard Agent │                                                        │
│  │                  │                                                        │
│  │  Evaluates       │                                                        │
│  │  confidence      │                                                        │
│  └────────┬─────────┘                                                        │
│           │                                                                  │
│           v                                                                  │
│    ┌──────────────────────────────────────────┐                             │
│    │       CONFIDENCE CHECK                    │                             │
│    └──────────┬───────────────┬───────────────┘                             │
│               │               │                                              │
│    ≥85%       │    60-84%     │     <60%                                     │
│    (High)     │   (Medium)    │     (Low)                                    │
│               │               │                                              │
│       v       v               v                                              │
│  ┌─────────┐ ┌────────────┐ ┌──────────────┐                                │
│  │  AUTO   │ │  INLINE    │ │   FULL       │                                │
│  │ EXECUTE │ │  HITL      │ │   REVIEW     │                                │
│  │         │ │  (Quick)   │ │   QUEUE      │                                │
│  └────┬────┘ └─────┬──────┘ └──────┬───────┘                                │
│       │            │               │                                         │
│       │      ┌─────v──────┐  ┌─────v──────┐                                 │
│       │      │ renderAnd  │  │ Foundation │                                 │
│       │      │ WaitFor    │  │ Approval   │                                 │
│       │      │ Response   │  │ Queue      │                                 │
│       │      └─────┬──────┘  └─────┬──────┘                                 │
│       │            │               │                                         │
│       │      User Approves   User Reviews                                   │
│       │      or Rejects      in Queue                                       │
│       │            │               │                                         │
│       v            v               v                                         │
│  ┌──────────────────────────────────────────┐                               │
│  │            ACTION EXECUTION               │                               │
│  │    (with audit logging in both paths)     │                               │
│  └──────────────────────────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Decision:** We route based on confidence:
- **High (≥85%):** Auto-execute with logging only
- **Medium (60-84%):** Inline HITL via CopilotKit `renderAndWaitForResponse` (quick approval)
- **Low (<60%):** Queue to Foundation approval system (full review)

This ensures:
- User isn't interrupted for routine operations
- Risky actions get appropriate review level
- All actions are audit logged regardless of path

### 2.2 CopilotKit HITL Pattern

CopilotKit's HITL uses `useCopilotAction` with `renderAndWaitForResponse`:

```typescript
useCopilotAction({
  name: "sign_contract",
  parameters: [
    { name: "contractId", type: "string", required: true },
    { name: "amount", type: "number", required: true },
  ],
  // HITL: This renders UI and waits for user response
  renderAndWaitForResponse: ({ args, respond, status }) => (
    <ContractApprovalCard
      contractId={args.contractId}
      amount={args.amount}
      isExecuting={status === "executing"}
      onApprove={() => respond?.({ approved: true })}
      onReject={() => respond?.({ approved: false, reason: "User rejected" })}
    />
  ),
  // Handler receives user response
  handler: async ({ contractId, amount }, response) => {
    if (!response?.approved) {
      return `Contract signing cancelled: ${response?.reason || "User rejected"}`;
    }
    // Execute the action
    const result = await signContract(contractId, amount);
    return `Contract ${contractId} signed for $${amount}`;
  },
});
```

**Rationale:**
- Native CopilotKit pattern - no custom infrastructure needed
- `respond` callback controls execution flow
- Status tracking for loading states
- Handler receives user decision

### 2.3 Integration with Foundation Approval System

For low-confidence actions requiring full review, we integrate with the existing Foundation approval queue:

```typescript
// In agent tool implementation
async function executeWithApproval(
  action: string,
  data: any,
  confidence: number,
  workspaceId: string,
  userId: string
): Promise<ApprovalResult> {
  // High confidence: auto-execute
  if (confidence >= 85) {
    return { approved: true, method: 'auto' };
  }

  // Medium confidence: inline HITL (handled by CopilotKit)
  if (confidence >= 60) {
    return { approved: 'pending_hitl', method: 'inline' };
  }

  // Low confidence: queue to Foundation approval system
  const approvalItem = await createApprovalItem({
    workspaceId,
    type: action,
    title: `${action} requires approval`,
    data,
    confidenceScore: confidence,
    requestedBy: 'dashboard_gateway',
    priority: confidence < 40 ? 3 : 2,
  });

  return {
    approved: 'pending_queue',
    method: 'queue',
    approvalId: approvalItem.id,
  };
}
```

**Why Not Duplicate:**
- Foundation approval has audit logging, escalation, bulk actions
- Already multi-tenant with RLS
- Has event emission on approve/reject
- Includes confidence breakdown UI components

### 2.4 Progress Streaming Architecture

Long-running tasks emit progress updates via AG-UI state:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROGRESS STREAMING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend Agent                      Frontend                     │
│  ┌────────────────┐                ┌────────────────┐           │
│  │ Long Task      │                │ useCoAgent     │           │
│  │                │   AG-UI SSE    │ StateRender    │           │
│  │ Step 1 ────────┼───────────────>│ ────────────── │           │
│  │ "Analyzing..." │                │ Show Step 1   │           │
│  │                │                │                │           │
│  │ Step 2 ────────┼───────────────>│ ────────────── │           │
│  │ "Fetching..."  │                │ Show Step 2   │           │
│  │                │                │                │           │
│  │ Step 3 ────────┼───────────────>│ ────────────── │           │
│  │ "Processing..." │               │ Show Step 3   │           │
│  │                │                │                │           │
│  │ Complete ──────┼───────────────>│ ────────────── │           │
│  │                │                │ Show Result   │           │
│  └────────────────┘                └────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**State Schema for Progress:**

```typescript
interface TaskProgress {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  steps: TaskStep[];
  startedAt: number;
  estimatedCompletionMs?: number;
  error?: string;
}

interface TaskStep {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  progress?: number; // 0-100 for sub-step progress
}
```

---

## 3. Story-by-Story Technical Breakdown

### 3.1 Story DM-05.1: HITL Tool Definition (8 points)

**Objective:** Create backend tool definitions with HITL markers for approval workflows.

**Implementation Tasks:**

1. **Create HITL tool decorator and utilities (`agents/hitl/decorators.py`):**

```python
"""
Human-in-the-Loop Tool Decorators

Provides decorators and utilities for marking agent tools as requiring
human approval before execution.

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.1
"""
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union
import logging

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ApprovalLevel(str, Enum):
    """Approval requirement levels based on confidence thresholds."""
    AUTO = "auto"           # ≥85%: Auto-execute with logging
    QUICK = "quick"         # 60-84%: Inline HITL (CopilotKit renderAndWaitForResponse)
    FULL = "full"           # <60%: Queue to Foundation approval system


class HITLConfig(BaseModel):
    """Configuration for HITL tool behavior."""
    # Confidence thresholds
    auto_threshold: int = Field(default=85, ge=0, le=100)
    quick_threshold: int = Field(default=60, ge=0, le=100)

    # Tool metadata
    approval_type: str = Field(default="general")  # e.g., 'contract', 'payment', 'deletion'
    risk_level: str = Field(default="medium")      # low, medium, high
    requires_reason: bool = Field(default=False)   # Require rejection reason

    # UI hints
    approve_label: str = Field(default="Approve")
    reject_label: str = Field(default="Reject")
    description_template: Optional[str] = None     # Template for approval description


class HITLToolResult(BaseModel):
    """Result from HITL tool evaluation."""
    requires_approval: bool
    approval_level: ApprovalLevel
    confidence_score: int
    tool_name: str
    tool_args: Dict[str, Any]
    config: HITLConfig
    # Populated if queued to Foundation approval
    approval_id: Optional[str] = None


def calculate_confidence(
    tool_name: str,
    args: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Calculate confidence score for a tool invocation.

    This is a simplified implementation. In production, this would:
    - Consider historical accuracy for this tool
    - Evaluate data completeness of args
    - Check business rules compliance
    - Factor in time sensitivity
    - Consider value/risk impact

    Args:
        tool_name: Name of the tool being invoked
        args: Tool arguments
        context: Optional additional context (user, workspace, etc.)

    Returns:
        Confidence score 0-100
    """
    # Base confidence by tool type
    base_scores = {
        "sign_contract": 50,      # Higher risk, lower base
        "delete_project": 40,     # Destructive action
        "send_notification": 80,  # Lower risk
        "update_task_status": 85, # Routine action
        "approve_expense": 60,    # Financial action
    }

    score = base_scores.get(tool_name, 70)

    # Adjust based on args (simplified)
    # In production: check completeness, validate against rules, etc.
    if context:
        # User role adjustments
        if context.get("user_role") == "admin":
            score += 10
        # Workspace trust level
        if context.get("workspace_verified"):
            score += 5

    return min(100, max(0, score))


def determine_approval_level(
    confidence: int,
    config: HITLConfig,
) -> ApprovalLevel:
    """
    Determine approval level based on confidence score.

    Args:
        confidence: Confidence score 0-100
        config: HITL configuration with thresholds

    Returns:
        Appropriate ApprovalLevel
    """
    if confidence >= config.auto_threshold:
        return ApprovalLevel.AUTO
    elif confidence >= config.quick_threshold:
        return ApprovalLevel.QUICK
    else:
        return ApprovalLevel.FULL


F = TypeVar('F', bound=Callable[..., Any])


def hitl_tool(
    *,
    approval_type: str = "general",
    risk_level: str = "medium",
    auto_threshold: int = 85,
    quick_threshold: int = 60,
    requires_reason: bool = False,
    approve_label: str = "Approve",
    reject_label: str = "Reject",
    description_template: Optional[str] = None,
) -> Callable[[F], F]:
    """
    Decorator to mark a tool as requiring human-in-the-loop approval.

    The decorator:
    1. Calculates confidence for the tool invocation
    2. Determines approval level (auto/quick/full)
    3. For quick: Returns HITL marker for CopilotKit frontend
    4. For full: Queues to Foundation approval system
    5. For auto: Executes directly with logging

    Args:
        approval_type: Type of approval (contract, payment, deletion, etc.)
        risk_level: Risk level (low, medium, high)
        auto_threshold: Confidence threshold for auto-execution (default 85)
        quick_threshold: Confidence threshold for inline HITL (default 60)
        requires_reason: Whether rejection requires a reason
        approve_label: Label for approve button
        reject_label: Label for reject button
        description_template: Template for approval description

    Returns:
        Decorated function with HITL behavior

    Example:
        >>> @hitl_tool(
        ...     approval_type="contract",
        ...     risk_level="high",
        ...     auto_threshold=95,
        ...     description_template="Sign contract {contract_id} for ${amount}"
        ... )
        >>> async def sign_contract(contract_id: str, amount: float) -> dict:
        ...     # Implementation
        ...     pass
    """
    config = HITLConfig(
        approval_type=approval_type,
        risk_level=risk_level,
        auto_threshold=auto_threshold,
        quick_threshold=quick_threshold,
        requires_reason=requires_reason,
        approve_label=approve_label,
        reject_label=reject_label,
        description_template=description_template,
    )

    def decorator(func: F) -> F:
        # Store config on function for introspection
        func._hitl_config = config
        func._is_hitl_tool = True

        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Extract context from kwargs if provided
            context = kwargs.pop('_hitl_context', None)

            # Calculate confidence
            confidence = calculate_confidence(
                tool_name=func.__name__,
                args=kwargs,
                context=context,
            )

            # Determine approval level
            level = determine_approval_level(confidence, config)

            logger.info(
                f"HITL tool '{func.__name__}' invoked: "
                f"confidence={confidence}, level={level}"
            )

            # Create HITL result for frontend consumption
            hitl_result = HITLToolResult(
                requires_approval=level != ApprovalLevel.AUTO,
                approval_level=level,
                confidence_score=confidence,
                tool_name=func.__name__,
                tool_args=kwargs,
                config=config,
            )

            # AUTO: Execute directly
            if level == ApprovalLevel.AUTO:
                logger.info(f"Auto-executing '{func.__name__}' (confidence={confidence})")
                result = await func(*args, **kwargs)
                # Log for audit
                await _log_auto_execution(func.__name__, kwargs, result, confidence)
                return result

            # QUICK/FULL: Return HITL marker for frontend/queue handling
            # The actual execution will happen after approval
            return {
                "__hitl_pending__": True,
                "hitl_result": hitl_result.model_dump(),
            }

        return wrapper

    return decorator


async def _log_auto_execution(
    tool_name: str,
    args: Dict[str, Any],
    result: Any,
    confidence: int,
) -> None:
    """Log auto-executed tool for audit trail."""
    logger.info(
        f"HITL auto-execution logged: tool={tool_name}, "
        f"confidence={confidence}, result_type={type(result).__name__}"
    )
    # In production: emit event to audit system
    # await emit_audit_event(...)


def is_hitl_tool(func: Callable) -> bool:
    """Check if a function is decorated as a HITL tool."""
    return getattr(func, '_is_hitl_tool', False)


def get_hitl_config(func: Callable) -> Optional[HITLConfig]:
    """Get HITL configuration from a decorated function."""
    return getattr(func, '_hitl_config', None)
```

2. **Create HITL tool examples (`agents/gateway/hitl_tools.py`):**

```python
"""
Dashboard Gateway HITL Tools

Tools that require human-in-the-loop approval for execution.
These tools are used for high-risk or sensitive operations.

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.1
"""
from typing import Any, Dict, Optional
import logging

from hitl.decorators import hitl_tool

logger = logging.getLogger(__name__)


@hitl_tool(
    approval_type="contract",
    risk_level="high",
    auto_threshold=95,  # Only auto-approve at very high confidence
    quick_threshold=70,
    requires_reason=True,
    approve_label="Sign Contract",
    reject_label="Decline",
    description_template="Sign contract '{contract_id}' for ${amount:,.2f}",
)
async def sign_contract(
    contract_id: str,
    amount: float,
    terms: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sign a contract with the specified terms.

    This is a high-risk action that typically requires human approval.

    Args:
        contract_id: The contract identifier
        amount: Contract value in dollars
        terms: Optional contract terms summary

    Returns:
        Contract signing confirmation with timestamp
    """
    logger.info(f"Executing contract signing: {contract_id} for ${amount}")

    # Actual implementation would call contract service
    return {
        "contract_id": contract_id,
        "amount": amount,
        "status": "signed",
        "signed_at": "2025-01-15T10:30:00Z",
        "confirmation_code": f"CONF-{contract_id[:8]}",
    }


@hitl_tool(
    approval_type="deletion",
    risk_level="high",
    auto_threshold=90,
    quick_threshold=60,
    requires_reason=True,
    approve_label="Delete Project",
    reject_label="Cancel",
    description_template="Permanently delete project '{project_id}' ({project_name})",
)
async def delete_project(
    project_id: str,
    project_name: str,
    confirm_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Permanently delete a project and all associated data.

    This is a destructive action that cannot be undone.

    Args:
        project_id: The project identifier
        project_name: Project name for confirmation
        confirm_name: User must type project name to confirm

    Returns:
        Deletion confirmation
    """
    if confirm_name and confirm_name != project_name:
        return {
            "error": "Project name confirmation does not match",
            "status": "failed",
        }

    logger.info(f"Executing project deletion: {project_id}")

    # Actual implementation would call project service
    return {
        "project_id": project_id,
        "status": "deleted",
        "deleted_at": "2025-01-15T10:30:00Z",
    }


@hitl_tool(
    approval_type="financial",
    risk_level="medium",
    auto_threshold=85,
    quick_threshold=65,
    requires_reason=False,
    approve_label="Approve Expense",
    reject_label="Deny",
    description_template="Approve expense of ${amount:,.2f} for '{description}'",
)
async def approve_expense(
    expense_id: str,
    amount: float,
    description: str,
    category: str,
) -> Dict[str, Any]:
    """
    Approve an expense request.

    Args:
        expense_id: The expense identifier
        amount: Expense amount in dollars
        description: Expense description
        category: Expense category

    Returns:
        Expense approval confirmation
    """
    logger.info(f"Executing expense approval: {expense_id} for ${amount}")

    return {
        "expense_id": expense_id,
        "amount": amount,
        "status": "approved",
        "approved_at": "2025-01-15T10:30:00Z",
    }


@hitl_tool(
    approval_type="notification",
    risk_level="low",
    auto_threshold=80,
    quick_threshold=50,
    requires_reason=False,
    approve_label="Send",
    reject_label="Cancel",
    description_template="Send notification to {recipient_count} recipients: '{subject}'",
)
async def send_bulk_notification(
    subject: str,
    body: str,
    recipient_ids: list[str],
    priority: str = "normal",
) -> Dict[str, Any]:
    """
    Send a bulk notification to multiple users.

    Args:
        subject: Notification subject
        body: Notification body
        recipient_ids: List of recipient user IDs
        priority: Notification priority (low, normal, high)

    Returns:
        Notification sending confirmation
    """
    logger.info(f"Executing bulk notification: {len(recipient_ids)} recipients")

    return {
        "notification_id": "notif_12345",
        "recipients_count": len(recipient_ids),
        "status": "sent",
        "sent_at": "2025-01-15T10:30:00Z",
    }


def get_hitl_tools() -> list:
    """Get all HITL tools for registration."""
    return [
        sign_contract,
        delete_project,
        approve_expense,
        send_bulk_notification,
    ]
```

3. **Create HITL module init (`agents/hitl/__init__.py`):**

```python
"""Human-in-the-Loop module for agent approval workflows."""
from .decorators import (
    hitl_tool,
    HITLConfig,
    HITLToolResult,
    ApprovalLevel,
    calculate_confidence,
    determine_approval_level,
    is_hitl_tool,
    get_hitl_config,
)

__all__ = [
    "hitl_tool",
    "HITLConfig",
    "HITLToolResult",
    "ApprovalLevel",
    "calculate_confidence",
    "determine_approval_level",
    "is_hitl_tool",
    "get_hitl_config",
]
```

**Files to Create:**
- `agents/hitl/__init__.py`
- `agents/hitl/decorators.py`
- `agents/gateway/hitl_tools.py`

**Files to Modify:**
- `agents/gateway/__init__.py` (export HITL tools)
- `agents/gateway/tools.py` (register HITL tools)

**Test Requirements:**
- Unit: Confidence calculation works correctly
- Unit: Approval level determination matches thresholds
- Unit: HITL decorator preserves function signature
- Unit: Auto-execution logs correctly
- Integration: HITL markers returned for medium/low confidence

**Definition of Done:**
- [ ] `@hitl_tool` decorator implemented with configurable thresholds
- [ ] Confidence calculation function works
- [ ] Example HITL tools created (sign_contract, delete_project, etc.)
- [ ] Auto-execution path with audit logging
- [ ] Unit tests pass with >85% coverage

---

### 3.2 Story DM-05.2: Frontend HITL Handlers (8 points)

**Objective:** Implement React components for rendering HITL approval UI using CopilotKit.

**Implementation Tasks:**

1. **Create HITL action hook (`apps/web/src/lib/hitl/use-hitl-actions.ts`):**

```typescript
/**
 * HITL Action Hooks
 *
 * React hooks for handling Human-in-the-Loop actions via CopilotKit.
 * Integrates with CopilotKit's useCopilotAction and renderAndWaitForResponse.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { useCopilotAction } from '@copilotkit/react-core';
import { ReactNode } from 'react';

export type ApprovalLevel = 'auto' | 'quick' | 'full';

export interface HITLConfig {
  approvalType: string;
  riskLevel: 'low' | 'medium' | 'high';
  autoThreshold: number;
  quickThreshold: number;
  requiresReason: boolean;
  approveLabel: string;
  rejectLabel: string;
  descriptionTemplate?: string;
}

export interface HITLResponse {
  approved: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface HITLActionArgs {
  toolName: string;
  toolArgs: Record<string, unknown>;
  confidenceScore: number;
  approvalLevel: ApprovalLevel;
  config: HITLConfig;
}

export interface HITLRenderProps {
  args: HITLActionArgs;
  status: 'executing' | 'complete';
  respond?: (response: HITLResponse) => void;
}

/**
 * Hook to register a HITL action handler.
 *
 * This hook wraps CopilotKit's useCopilotAction with HITL-specific rendering.
 *
 * @param name - Action name (must match backend tool name)
 * @param renderApproval - Function to render approval UI
 * @param onExecute - Callback when action is approved and executed
 *
 * @example
 * ```tsx
 * useHITLAction({
 *   name: 'sign_contract',
 *   renderApproval: ({ args, respond, status }) => (
 *     <ContractApprovalCard
 *       contractId={args.toolArgs.contractId}
 *       amount={args.toolArgs.amount}
 *       onApprove={() => respond?.({ approved: true })}
 *       onReject={(reason) => respond?.({ approved: false, reason })}
 *       disabled={status !== 'executing'}
 *     />
 *   ),
 *   onExecute: (result) => {
 *     toast.success('Contract signed successfully');
 *   },
 * });
 * ```
 */
export function useHITLAction({
  name,
  renderApproval,
  onExecute,
}: {
  name: string;
  renderApproval: (props: HITLRenderProps) => ReactNode;
  onExecute?: (result: unknown) => void;
}) {
  useCopilotAction({
    name: `hitl_${name}`,
    description: `Human-in-the-loop approval for ${name}`,
    parameters: [
      { name: 'toolName', type: 'string', required: true },
      { name: 'toolArgs', type: 'object', required: true },
      { name: 'confidenceScore', type: 'number', required: true },
      { name: 'approvalLevel', type: 'string', required: true },
      { name: 'config', type: 'object', required: true },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const hitlArgs: HITLActionArgs = {
        toolName: args.toolName as string,
        toolArgs: args.toolArgs as Record<string, unknown>,
        confidenceScore: args.confidenceScore as number,
        approvalLevel: args.approvalLevel as ApprovalLevel,
        config: args.config as HITLConfig,
      };

      return renderApproval({
        args: hitlArgs,
        status,
        respond: respond
          ? (response: HITLResponse) => {
              respond(response);
            }
          : undefined,
      });
    },
    handler: async (args, response: HITLResponse | undefined) => {
      if (!response?.approved) {
        return {
          status: 'rejected',
          reason: response?.reason || 'User rejected',
        };
      }

      // Execute the original action
      // The actual execution happens on the backend
      onExecute?.({ status: 'approved', ...response });

      return {
        status: 'approved',
        metadata: response.metadata,
      };
    },
  });
}

/**
 * Hook to register multiple HITL action handlers.
 *
 * Convenience hook for registering handlers for multiple tools.
 */
export function useHITLActions(
  actions: Array<{
    name: string;
    renderApproval: (props: HITLRenderProps) => ReactNode;
    onExecute?: (result: unknown) => void;
  }>
) {
  actions.forEach((action) => {
    // Each action needs its own hook call
    // In practice, you'd call this hook multiple times in the component
  });
}
```

2. **Create generic HITL approval card (`apps/web/src/components/hitl/HITLApprovalCard.tsx`):**

```typescript
/**
 * HITL Approval Card Component
 *
 * Generic approval card for Human-in-the-Loop actions.
 * Supports configurable labels, risk indicators, and reason input.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { ConfidenceIndicator } from '@/components/approval/confidence-indicator';
import type { HITLActionArgs, HITLResponse } from '@/lib/hitl/use-hitl-actions';

interface HITLApprovalCardProps {
  args: HITLActionArgs;
  isExecuting: boolean;
  onApprove: (metadata?: Record<string, unknown>) => void;
  onReject: (reason?: string) => void;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Additional content to render in the card body */
  children?: React.ReactNode;
}

const riskIcons = {
  low: Info,
  medium: AlertTriangle,
  high: XCircle,
};

const riskColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

/**
 * Generic HITL Approval Card
 *
 * Renders an approval UI for any HITL action with:
 * - Risk level indicator
 * - Confidence score
 * - Approve/Reject buttons
 * - Optional rejection reason input
 */
export function HITLApprovalCard({
  args,
  isExecuting,
  onApprove,
  onReject,
  title,
  description,
  children,
}: HITLApprovalCardProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const { toolName, toolArgs, confidenceScore, config } = args;

  // Generate description from template if provided
  const displayDescription =
    description ||
    (config.descriptionTemplate
      ? formatTemplate(config.descriptionTemplate, toolArgs)
      : `Action: ${toolName}`);

  const displayTitle = title || `${config.approvalType} Approval Required`;

  const RiskIcon = riskIcons[config.riskLevel];

  const handleReject = () => {
    if (config.requiresReason && !showReasonInput) {
      setShowReasonInput(true);
      return;
    }
    onReject(rejectReason || undefined);
  };

  const handleApprove = () => {
    onApprove();
  };

  return (
    <Card className="w-full max-w-md border-2 animate-in slide-in-from-bottom-4 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className={riskColors[config.riskLevel]}>
            <RiskIcon className="h-3 w-3 mr-1" />
            {config.riskLevel.charAt(0).toUpperCase() + config.riskLevel.slice(1)} Risk
          </Badge>
          <ConfidenceIndicator
            score={confidenceScore}
            level={confidenceScore >= 85 ? 'high' : confidenceScore >= 60 ? 'medium' : 'low'}
            size="sm"
          />
        </div>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription>{displayDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tool Arguments Preview */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Details</p>
          <dl className="space-y-1 text-sm">
            {Object.entries(toolArgs).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground">{formatKey(key)}:</dt>
                <dd className="font-medium">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Custom content */}
        {children}

        {/* Rejection reason input */}
        {showReasonInput && (
          <div className="space-y-2">
            <label htmlFor="reject-reason" className="text-sm font-medium">
              Reason for rejection {config.requiresReason && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              id="reject-reason"
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReject}
          disabled={isExecuting || (showReasonInput && config.requiresReason && !rejectReason)}
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-2" />
          {config.rejectLabel}
        </Button>
        <Button
          onClick={handleApprove}
          disabled={isExecuting}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {config.approveLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (typeof value === 'number') {
    // Format currency-like numbers
    if (value >= 100) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `${value.length} items`;
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatTemplate(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, key, format) => {
    const value = args[key];
    if (value === undefined) return match;

    if (format && typeof value === 'number') {
      // Handle number formatting like {amount:,.2f}
      if (format.includes(',')) {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      }
    }

    return String(value);
  });
}
```

3. **Create specific HITL approval components (`apps/web/src/components/hitl/ContractApprovalCard.tsx`):**

```typescript
/**
 * Contract Approval Card
 *
 * Specialized approval card for contract signing actions.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { HITLApprovalCard } from './HITLApprovalCard';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign } from 'lucide-react';
import type { HITLActionArgs } from '@/lib/hitl/use-hitl-actions';

interface ContractApprovalCardProps {
  args: HITLActionArgs;
  isExecuting: boolean;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}

export function ContractApprovalCard({
  args,
  isExecuting,
  onApprove,
  onReject,
}: ContractApprovalCardProps) {
  const { contractId, amount, terms } = args.toolArgs as {
    contractId: string;
    amount: number;
    terms?: string;
  };

  return (
    <HITLApprovalCard
      args={args}
      isExecuting={isExecuting}
      onApprove={onApprove}
      onReject={onReject}
      title="Contract Signature Required"
      description={`Review and sign contract ${contractId}`}
    >
      {/* Contract-specific content */}
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Contract #{contractId}</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(amount)}
          </span>
        </div>

        {terms && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Terms Summary:</p>
            <p>{terms}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Badge variant="outline">Legal Review: Complete</Badge>
          <Badge variant="outline">Finance: Approved</Badge>
        </div>
      </div>
    </HITLApprovalCard>
  );
}
```

4. **Create HITL actions registration (`apps/web/src/components/hitl/HITLActionRegistration.tsx`):**

```typescript
/**
 * HITL Action Registration
 *
 * Component that registers all HITL action handlers.
 * Include this component in your CopilotKit provider tree.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.2
 */
'use client';

import { useCopilotAction } from '@copilotkit/react-core';
import { HITLApprovalCard } from './HITLApprovalCard';
import { ContractApprovalCard } from './ContractApprovalCard';
import type { HITLActionArgs, HITLResponse } from '@/lib/hitl/use-hitl-actions';
import { toast } from 'sonner';

/**
 * Registers all HITL action handlers with CopilotKit.
 *
 * This component should be rendered once within the CopilotKit provider.
 */
export function HITLActionRegistration() {
  // Contract signing HITL
  useCopilotAction({
    name: 'hitl_sign_contract',
    description: 'Human-in-the-loop approval for contract signing',
    parameters: [
      { name: 'toolName', type: 'string', required: true },
      { name: 'toolArgs', type: 'object', required: true },
      { name: 'confidenceScore', type: 'number', required: true },
      { name: 'approvalLevel', type: 'string', required: true },
      { name: 'config', type: 'object', required: true },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const hitlArgs = args as unknown as HITLActionArgs;
      return (
        <ContractApprovalCard
          args={hitlArgs}
          isExecuting={status === 'executing'}
          onApprove={() => respond?.({ approved: true })}
          onReject={(reason) => respond?.({ approved: false, reason })}
        />
      );
    },
    handler: async (args, response: HITLResponse | undefined) => {
      if (!response?.approved) {
        toast.error('Contract signing cancelled');
        return { status: 'rejected', reason: response?.reason };
      }
      toast.success('Contract signed successfully');
      return { status: 'approved' };
    },
  });

  // Project deletion HITL
  useCopilotAction({
    name: 'hitl_delete_project',
    description: 'Human-in-the-loop approval for project deletion',
    parameters: [
      { name: 'toolName', type: 'string', required: true },
      { name: 'toolArgs', type: 'object', required: true },
      { name: 'confidenceScore', type: 'number', required: true },
      { name: 'approvalLevel', type: 'string', required: true },
      { name: 'config', type: 'object', required: true },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const hitlArgs = args as unknown as HITLActionArgs;
      return (
        <HITLApprovalCard
          args={hitlArgs}
          isExecuting={status === 'executing'}
          onApprove={() => respond?.({ approved: true })}
          onReject={(reason) => respond?.({ approved: false, reason })}
          title="Confirm Project Deletion"
          description="This action cannot be undone. All project data will be permanently deleted."
        />
      );
    },
    handler: async (args, response: HITLResponse | undefined) => {
      if (!response?.approved) {
        toast.info('Project deletion cancelled');
        return { status: 'rejected', reason: response?.reason };
      }
      toast.success('Project deleted');
      return { status: 'approved' };
    },
  });

  // Generic HITL handler for any tool
  useCopilotAction({
    name: 'hitl_generic',
    description: 'Generic human-in-the-loop approval',
    parameters: [
      { name: 'toolName', type: 'string', required: true },
      { name: 'toolArgs', type: 'object', required: true },
      { name: 'confidenceScore', type: 'number', required: true },
      { name: 'approvalLevel', type: 'string', required: true },
      { name: 'config', type: 'object', required: true },
    ],
    renderAndWaitForResponse: ({ args, respond, status }) => {
      const hitlArgs = args as unknown as HITLActionArgs;
      return (
        <HITLApprovalCard
          args={hitlArgs}
          isExecuting={status === 'executing'}
          onApprove={() => respond?.({ approved: true })}
          onReject={(reason) => respond?.({ approved: false, reason })}
        />
      );
    },
    handler: async (args, response: HITLResponse | undefined) => {
      if (!response?.approved) {
        toast.info('Action cancelled');
        return { status: 'rejected', reason: response?.reason };
      }
      toast.success('Action approved');
      return { status: 'approved' };
    },
  });

  // This component doesn't render anything visible
  return null;
}
```

5. **Create module exports (`apps/web/src/components/hitl/index.ts`):**

```typescript
/**
 * HITL Components Module
 *
 * Human-in-the-Loop UI components for agent approval workflows.
 */

export { HITLApprovalCard } from './HITLApprovalCard';
export { ContractApprovalCard } from './ContractApprovalCard';
export { HITLActionRegistration } from './HITLActionRegistration';
export { useHITLAction, type HITLActionArgs, type HITLResponse, type HITLRenderProps } from '@/lib/hitl/use-hitl-actions';
```

**Files to Create:**
- `apps/web/src/lib/hitl/use-hitl-actions.ts`
- `apps/web/src/components/hitl/HITLApprovalCard.tsx`
- `apps/web/src/components/hitl/ContractApprovalCard.tsx`
- `apps/web/src/components/hitl/HITLActionRegistration.tsx`
- `apps/web/src/components/hitl/index.ts`

**Files to Modify:**
- `apps/web/src/components/copilot/CopilotProvider.tsx` (include HITLActionRegistration)

**Test Requirements:**
- Unit: HITLApprovalCard renders with all prop variations
- Unit: ContractApprovalCard shows contract details
- Unit: Approve/Reject callbacks work correctly
- Integration: CopilotKit action registration works
- Visual: Storybook stories for approval cards

**Definition of Done:**
- [ ] `useHITLAction` hook implemented
- [ ] Generic `HITLApprovalCard` component
- [ ] Specialized approval cards (Contract, Delete)
- [ ] `HITLActionRegistration` component
- [ ] Unit tests pass

---

### 3.3 Story DM-05.3: Approval Workflow Integration (7 points)

**Objective:** Bridge HITL with Foundation's approval queue for low-confidence actions.

**Implementation Tasks:**

1. **Create approval queue bridge (`agents/hitl/approval_bridge.py`):**

```python
"""
Approval Queue Bridge

Bridges HITL with Foundation's approval system for low-confidence actions.
Creates approval items in the Foundation queue and handles async resolution.

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.3
"""
import logging
from typing import Any, Dict, Optional
from datetime import datetime, timedelta
import httpx

from .decorators import HITLConfig, ApprovalLevel

logger = logging.getLogger(__name__)


class ApprovalQueueBridge:
    """
    Bridge between agent HITL and Foundation approval queue.

    For low-confidence actions (ApprovalLevel.FULL), this bridge:
    1. Creates an approval item in Foundation's queue
    2. Returns the approval ID for tracking
    3. Provides methods to check approval status
    4. Handles the final execution when approved
    """

    def __init__(
        self,
        api_base_url: str,
        api_key: Optional[str] = None,
    ):
        """
        Initialize the approval bridge.

        Args:
            api_base_url: Base URL for the HYVVE API
            api_key: Optional API key for authentication
        """
        self.api_base_url = api_base_url.rstrip('/')
        self.api_key = api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            headers = {}
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'
            self._client = httpx.AsyncClient(
                base_url=self.api_base_url,
                headers=headers,
                timeout=30.0,
            )
        return self._client

    async def create_approval_item(
        self,
        workspace_id: str,
        tool_name: str,
        tool_args: Dict[str, Any],
        confidence_score: int,
        config: HITLConfig,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create an approval item in the Foundation queue.

        Args:
            workspace_id: Workspace/tenant ID
            tool_name: Name of the tool requiring approval
            tool_args: Tool arguments for review
            confidence_score: Calculated confidence score
            config: HITL configuration
            user_id: Optional user ID for assignment

        Returns:
            Created approval item with ID
        """
        client = await self._get_client()

        # Build approval item payload
        # Map HITL config to Foundation approval format
        approval_data = {
            'workspaceId': workspace_id,
            'type': config.approval_type,
            'title': self._generate_title(tool_name, tool_args, config),
            'description': self._generate_description(tool_name, tool_args, config),
            'previewData': {
                'toolName': tool_name,
                'toolArgs': tool_args,
                'hitlConfig': {
                    'approvalType': config.approval_type,
                    'riskLevel': config.risk_level,
                    'requiresReason': config.requires_reason,
                },
            },
            'confidenceScore': confidence_score,
            'confidenceFactors': self._generate_confidence_factors(
                tool_name, tool_args, confidence_score
            ),
            'aiRecommendation': 'full_review',  # Always full review for queued items
            'priority': self._calculate_priority(config.risk_level, confidence_score),
            'requestedBy': 'dashboard_gateway',
            'sourceModule': 'hitl',
            'sourceId': tool_name,
            # Optional: set due date for time-sensitive items
            'dueAt': self._calculate_due_date(config.risk_level),
        }

        if user_id:
            approval_data['assignedToId'] = user_id

        try:
            response = await client.post(
                '/api/v1/approvals',
                json=approval_data,
            )
            response.raise_for_status()
            result = response.json()

            logger.info(
                f"Created approval item {result['id']} for {tool_name} "
                f"(confidence={confidence_score})"
            )

            return result

        except httpx.HTTPError as e:
            logger.error(f"Failed to create approval item: {e}")
            raise

    async def get_approval_status(
        self,
        workspace_id: str,
        approval_id: str,
    ) -> Dict[str, Any]:
        """
        Check status of an approval item.

        Args:
            workspace_id: Workspace/tenant ID
            approval_id: Approval item ID

        Returns:
            Approval item with current status
        """
        client = await self._get_client()

        try:
            response = await client.get(
                f'/api/v1/approvals/{approval_id}',
                headers={'X-Workspace-Id': workspace_id},
            )
            response.raise_for_status()
            return response.json()

        except httpx.HTTPError as e:
            logger.error(f"Failed to get approval status: {e}")
            raise

    async def wait_for_approval(
        self,
        workspace_id: str,
        approval_id: str,
        timeout_seconds: int = 3600,  # 1 hour default
        poll_interval_seconds: int = 5,
    ) -> Dict[str, Any]:
        """
        Wait for an approval to be resolved.

        This is a polling implementation. In production, consider
        using WebSocket subscription for real-time updates.

        Args:
            workspace_id: Workspace/tenant ID
            approval_id: Approval item ID
            timeout_seconds: Maximum time to wait
            poll_interval_seconds: Polling interval

        Returns:
            Final approval item with decision

        Raises:
            TimeoutError: If approval not resolved within timeout
        """
        import asyncio

        start_time = datetime.utcnow()

        while True:
            status = await self.get_approval_status(workspace_id, approval_id)

            if status['status'] in ('approved', 'rejected', 'auto_approved'):
                return status

            elapsed = (datetime.utcnow() - start_time).total_seconds()
            if elapsed >= timeout_seconds:
                raise TimeoutError(
                    f"Approval {approval_id} not resolved within {timeout_seconds}s"
                )

            await asyncio.sleep(poll_interval_seconds)

    def _generate_title(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        config: HITLConfig,
    ) -> str:
        """Generate approval item title."""
        if config.description_template:
            try:
                return config.description_template.format(**tool_args)
            except KeyError:
                pass

        # Fallback title
        title_map = {
            'sign_contract': f"Contract Signing: {tool_args.get('contractId', 'Unknown')}",
            'delete_project': f"Project Deletion: {tool_args.get('projectName', 'Unknown')}",
            'approve_expense': f"Expense Approval: ${tool_args.get('amount', 0):,.2f}",
        }
        return title_map.get(tool_name, f"{config.approval_type.title()} Approval Required")

    def _generate_description(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        config: HITLConfig,
    ) -> str:
        """Generate approval item description."""
        desc_parts = [f"Action: {tool_name}"]

        if config.risk_level == 'high':
            desc_parts.append("This is a HIGH RISK action that requires careful review.")

        desc_parts.append("\nParameters:")
        for key, value in tool_args.items():
            desc_parts.append(f"  - {key}: {value}")

        return "\n".join(desc_parts)

    def _generate_confidence_factors(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        confidence_score: int,
    ) -> list:
        """Generate confidence factors for the approval item."""
        # Simplified factors - in production, these would come from
        # the actual confidence calculation
        factors = [
            {
                'factor': 'historical_accuracy',
                'score': min(100, confidence_score + 10),
                'weight': 0.3,
                'explanation': 'Based on historical success rate for this action type',
            },
            {
                'factor': 'data_completeness',
                'score': confidence_score,
                'weight': 0.25,
                'explanation': 'All required parameters provided',
            },
            {
                'factor': 'business_rules',
                'score': max(0, confidence_score - 10),
                'weight': 0.25,
                'explanation': 'Action complies with business rules',
                'concerning': confidence_score < 50,
            },
            {
                'factor': 'value_impact',
                'score': max(0, confidence_score - 20),
                'weight': 0.2,
                'explanation': 'Potential impact assessment',
                'concerning': confidence_score < 40,
            },
        ]
        return factors

    def _calculate_priority(self, risk_level: str, confidence_score: int) -> int:
        """Calculate approval priority (1=low, 2=medium, 3=high)."""
        if risk_level == 'high' or confidence_score < 30:
            return 3
        if risk_level == 'medium' or confidence_score < 50:
            return 2
        return 1

    def _calculate_due_date(self, risk_level: str) -> Optional[str]:
        """Calculate due date based on risk level."""
        due_hours = {
            'high': 4,    # 4 hours for high risk
            'medium': 24, # 24 hours for medium
            'low': 72,    # 72 hours for low
        }
        hours = due_hours.get(risk_level, 24)
        due = datetime.utcnow() + timedelta(hours=hours)
        return due.isoformat() + 'Z'

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None


# Singleton instance
_bridge: Optional[ApprovalQueueBridge] = None


def get_approval_bridge() -> ApprovalQueueBridge:
    """Get the singleton approval bridge instance."""
    global _bridge
    if _bridge is None:
        from config import get_settings
        settings = get_settings()
        _bridge = ApprovalQueueBridge(
            api_base_url=settings.api_base_url,
            api_key=settings.internal_api_key,
        )
    return _bridge
```

2. **Create frontend approval queue hook (`apps/web/src/lib/hitl/use-approval-queue.ts`):**

```typescript
/**
 * Approval Queue Hook
 *
 * Hook for creating and tracking approval items in the Foundation queue.
 * Used when HITL actions have low confidence and require full review.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.3
 */
'use client';

import { useState, useCallback } from 'react';
import { useWorkspace } from '@/hooks/use-workspace';
import type { ApprovalItem } from '@hyvve/shared';
import type { HITLActionArgs } from './use-hitl-actions';

interface UseApprovalQueueOptions {
  /** Callback when approval is created */
  onCreated?: (approval: ApprovalItem) => void;
  /** Callback when approval is resolved */
  onResolved?: (approval: ApprovalItem) => void;
}

interface CreateApprovalParams {
  toolName: string;
  toolArgs: Record<string, unknown>;
  confidenceScore: number;
  config: {
    approvalType: string;
    riskLevel: string;
    requiresReason: boolean;
    descriptionTemplate?: string;
  };
}

/**
 * Hook for interacting with the Foundation approval queue.
 *
 * @example
 * ```tsx
 * const { createApproval, pendingApprovals, isCreating } = useApprovalQueue({
 *   onResolved: (approval) => {
 *     if (approval.status === 'approved') {
 *       // Execute the action
 *     }
 *   },
 * });
 * ```
 */
export function useApprovalQueue(options: UseApprovalQueueOptions = {}) {
  const { onCreated, onResolved } = options;
  const { workspace } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<Map<string, ApprovalItem>>(
    new Map()
  );

  /**
   * Create an approval item in the queue.
   */
  const createApproval = useCallback(
    async (params: CreateApprovalParams): Promise<ApprovalItem> => {
      if (!workspace?.id) {
        throw new Error('No workspace selected');
      }

      setIsCreating(true);

      try {
        const response = await fetch('/api/v1/approvals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId: workspace.id,
            type: params.config.approvalType,
            title: generateTitle(params),
            description: generateDescription(params),
            previewData: {
              toolName: params.toolName,
              toolArgs: params.toolArgs,
              hitlConfig: params.config,
            },
            confidenceScore: params.confidenceScore,
            aiRecommendation: 'full_review',
            priority: calculatePriority(params.config.riskLevel, params.confidenceScore),
            requestedBy: 'dashboard_gateway',
            sourceModule: 'hitl',
            sourceId: params.toolName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create approval');
        }

        const approval: ApprovalItem = await response.json();

        // Track pending approval
        setPendingApprovals((prev) => new Map(prev).set(approval.id, approval));

        onCreated?.(approval);

        return approval;
      } finally {
        setIsCreating(false);
      }
    },
    [workspace, onCreated]
  );

  /**
   * Check status of a pending approval.
   */
  const checkApprovalStatus = useCallback(
    async (approvalId: string): Promise<ApprovalItem | null> => {
      if (!workspace?.id) return null;

      try {
        const response = await fetch(`/api/v1/approvals/${approvalId}`, {
          headers: {
            'X-Workspace-Id': workspace.id,
          },
        });

        if (!response.ok) return null;

        const approval: ApprovalItem = await response.json();

        // Update pending approvals
        if (approval.status !== 'pending') {
          setPendingApprovals((prev) => {
            const next = new Map(prev);
            next.delete(approvalId);
            return next;
          });
          onResolved?.(approval);
        }

        return approval;
      } catch {
        return null;
      }
    },
    [workspace, onResolved]
  );

  /**
   * Cancel a pending approval.
   */
  const cancelApproval = useCallback(
    async (approvalId: string): Promise<boolean> => {
      // Implementation would call API to cancel
      setPendingApprovals((prev) => {
        const next = new Map(prev);
        next.delete(approvalId);
        return next;
      });
      return true;
    },
    []
  );

  return {
    createApproval,
    checkApprovalStatus,
    cancelApproval,
    pendingApprovals: Array.from(pendingApprovals.values()),
    isCreating,
  };
}

// Helper functions
function generateTitle(params: CreateApprovalParams): string {
  const { toolName, toolArgs, config } = params;

  if (config.descriptionTemplate) {
    try {
      return config.descriptionTemplate.replace(
        /\{(\w+)\}/g,
        (_, key) => String(toolArgs[key] || key)
      );
    } catch {
      // Fall through to default
    }
  }

  return `${config.approvalType} Approval Required: ${toolName}`;
}

function generateDescription(params: CreateApprovalParams): string {
  const { toolName, toolArgs, config } = params;
  const lines = [`Action: ${toolName}`];

  if (config.riskLevel === 'high') {
    lines.push('This is a HIGH RISK action that requires careful review.');
  }

  lines.push('\nParameters:');
  Object.entries(toolArgs).forEach(([key, value]) => {
    lines.push(`  - ${key}: ${String(value)}`);
  });

  return lines.join('\n');
}

function calculatePriority(riskLevel: string, confidenceScore: number): number {
  if (riskLevel === 'high' || confidenceScore < 30) return 3;
  if (riskLevel === 'medium' || confidenceScore < 50) return 2;
  return 1;
}
```

**Files to Create:**
- `agents/hitl/approval_bridge.py`
- `apps/web/src/lib/hitl/use-approval-queue.ts`

**Files to Modify:**
- `agents/hitl/__init__.py` (export bridge)
- `apps/web/src/components/hitl/index.ts` (export hook)

**Test Requirements:**
- Unit: Approval bridge creates items correctly
- Unit: Priority calculation works
- Unit: Due date calculation works
- Integration: Items appear in Foundation queue
- Integration: Status polling works

**Definition of Done:**
- [ ] `ApprovalQueueBridge` creates Foundation approval items
- [ ] `useApprovalQueue` hook for frontend
- [ ] Confidence factors generated correctly
- [ ] Priority and due dates calculated
- [ ] Integration tests pass

---

### 3.4 Story DM-05.4: Realtime Progress Streaming (5 points)

**Objective:** Implement progress streaming for long-running agent tasks.

**Implementation Tasks:**

1. **Extend state schema with progress (`agents/schemas/dashboard_state.py` - add):**

```python
# Add to existing dashboard_state.py

class TaskStepStatus(str, Enum):
    """Status of a task step."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStep(BaseModel):
    """Individual step in a long-running task."""
    index: int
    name: str
    status: TaskStepStatus = TaskStepStatus.PENDING
    started_at: Optional[int] = Field(None, alias="startedAt")
    completed_at: Optional[int] = Field(None, alias="completedAt")
    progress: Optional[int] = Field(None, ge=0, le=100)  # Sub-step progress

    class Config:
        populate_by_name = True
        use_enum_values = True


class TaskStatus(str, Enum):
    """Status of a long-running task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskProgress(BaseModel):
    """Progress state for a long-running task."""
    task_id: str = Field(..., alias="taskId")
    task_name: str = Field(..., alias="taskName")
    status: TaskStatus = TaskStatus.PENDING
    current_step: int = Field(0, alias="currentStep")
    total_steps: int = Field(0, alias="totalSteps")
    steps: List[TaskStep] = Field(default_factory=list)
    started_at: Optional[int] = Field(None, alias="startedAt")
    estimated_completion_ms: Optional[int] = Field(None, alias="estimatedCompletionMs")
    error: Optional[str] = None

    class Config:
        populate_by_name = True
        use_enum_values = True


# Update DashboardState to include task progress
class DashboardState(BaseModel):
    # ... existing fields ...

    # Task progress (DM-05.4)
    active_tasks: List[TaskProgress] = Field(default_factory=list, alias="activeTasks")
```

2. **Extend state emitter with progress methods (`agents/gateway/state_emitter.py` - add):**

```python
# Add to existing DashboardStateEmitter class

async def start_task(
    self,
    task_id: str,
    task_name: str,
    steps: List[str],
    estimated_duration_ms: Optional[int] = None,
) -> None:
    """
    Start tracking a long-running task.

    Args:
        task_id: Unique task identifier
        task_name: Human-readable task name
        steps: List of step names
        estimated_duration_ms: Optional estimated duration
    """
    from schemas.dashboard_state import TaskProgress, TaskStep, TaskStatus, TaskStepStatus

    task = TaskProgress(
        task_id=task_id,
        task_name=task_name,
        status=TaskStatus.RUNNING,
        current_step=0,
        total_steps=len(steps),
        steps=[
            TaskStep(index=i, name=step, status=TaskStepStatus.PENDING)
            for i, step in enumerate(steps)
        ],
        started_at=int(time.time() * 1000),
        estimated_completion_ms=estimated_duration_ms,
    )

    # Add to active tasks
    self._state.active_tasks = [
        t for t in self._state.active_tasks if t.task_id != task_id
    ]
    self._state.active_tasks.append(task)

    await self.emit_now()


async def update_task_step(
    self,
    task_id: str,
    step_index: int,
    status: str = "running",
    progress: Optional[int] = None,
) -> None:
    """
    Update progress of a task step.

    Args:
        task_id: Task identifier
        step_index: Step index to update
        status: Step status (pending, running, completed, failed)
        progress: Optional progress percentage for the step
    """
    from schemas.dashboard_state import TaskStepStatus

    for task in self._state.active_tasks:
        if task.task_id == task_id:
            if 0 <= step_index < len(task.steps):
                step = task.steps[step_index]
                step.status = TaskStepStatus(status)

                if status == "running":
                    step.started_at = int(time.time() * 1000)
                    task.current_step = step_index
                elif status == "completed":
                    step.completed_at = int(time.time() * 1000)

                if progress is not None:
                    step.progress = progress
            break

    await self.emit_now()


async def complete_task(
    self,
    task_id: str,
    success: bool = True,
    error: Optional[str] = None,
) -> None:
    """
    Mark a task as completed.

    Args:
        task_id: Task identifier
        success: Whether task completed successfully
        error: Error message if failed
    """
    from schemas.dashboard_state import TaskStatus, TaskStepStatus

    for task in self._state.active_tasks:
        if task.task_id == task_id:
            if success:
                task.status = TaskStatus.COMPLETED
                # Mark remaining steps as completed
                for step in task.steps:
                    if step.status != TaskStepStatus.COMPLETED:
                        step.status = TaskStepStatus.COMPLETED
                        step.completed_at = int(time.time() * 1000)
            else:
                task.status = TaskStatus.FAILED
                task.error = error
            break

    await self.emit_now()


async def cancel_task(self, task_id: str) -> None:
    """Cancel a running task."""
    from schemas.dashboard_state import TaskStatus

    for task in self._state.active_tasks:
        if task.task_id == task_id:
            task.status = TaskStatus.CANCELLED
            break

    await self.emit_now()


async def clear_completed_tasks(self) -> None:
    """Remove completed/failed/cancelled tasks from active list."""
    from schemas.dashboard_state import TaskStatus

    self._state.active_tasks = [
        t for t in self._state.active_tasks
        if t.status in (TaskStatus.PENDING, TaskStatus.RUNNING)
    ]
    self._schedule_emit()
```

3. **Create frontend progress component (`apps/web/src/components/progress/TaskProgressCard.tsx`):**

```typescript
/**
 * Task Progress Card Component
 *
 * Displays progress of long-running agent tasks with step-by-step updates.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.4
 */
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Check, Circle, Loader2, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStep {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  progress?: number;
}

interface TaskProgress {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  steps: TaskStep[];
  startedAt?: number;
  estimatedCompletionMs?: number;
  error?: string;
}

interface TaskProgressCardProps {
  task: TaskProgress;
  onCancel?: (taskId: string) => void;
  onDismiss?: (taskId: string) => void;
}

const stepIcons = {
  pending: Circle,
  running: Loader2,
  completed: Check,
  failed: X,
};

const stepColors = {
  pending: 'text-muted-foreground',
  running: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

/**
 * Task Progress Card
 *
 * Shows real-time progress of a long-running task with:
 * - Overall progress bar
 * - Step-by-step status
 * - Estimated time remaining
 * - Cancel/dismiss actions
 */
export function TaskProgressCard({
  task,
  onCancel,
  onDismiss,
}: TaskProgressCardProps) {
  const { taskName, status, currentStep, totalSteps, steps, error } = task;

  // Calculate overall progress percentage
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Calculate time elapsed and estimate remaining
  const elapsedMs = task.startedAt ? Date.now() - task.startedAt : 0;
  const estimatedRemainingMs =
    task.estimatedCompletionMs && elapsedMs > 0
      ? Math.max(0, task.estimatedCompletionMs - elapsedMs)
      : null;

  const isActive = status === 'running' || status === 'pending';
  const isComplete = status === 'completed';
  const isFailed = status === 'failed' || status === 'cancelled';

  return (
    <Card
      className={cn(
        'w-full transition-all duration-300',
        isComplete && 'border-green-200 bg-green-50/50',
        isFailed && 'border-red-200 bg-red-50/50'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{taskName}</CardTitle>
          <div className="flex items-center gap-2">
            {isActive && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(task.taskId)}
              >
                Cancel
              </Button>
            )}
            {!isActive && onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(task.taskId)}
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step) => {
            const Icon = stepIcons[step.status];
            return (
              <div
                key={step.index}
                className={cn(
                  'flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors',
                  step.status === 'running' && 'bg-blue-50'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    stepColors[step.status],
                    step.status === 'running' && 'animate-spin'
                  )}
                />
                <span
                  className={cn(
                    'text-sm flex-1',
                    step.status === 'completed' && 'text-muted-foreground line-through',
                    step.status === 'running' && 'font-medium'
                  )}
                >
                  {step.name}
                </span>
                {step.progress !== undefined && step.status === 'running' && (
                  <span className="text-xs text-muted-foreground">
                    {step.progress}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time Estimate */}
        {estimatedRemainingMs !== null && isActive && (
          <p className="text-xs text-muted-foreground">
            Estimated time remaining: {formatDuration(estimatedRemainingMs)}
          </p>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            <XCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
            <Check className="h-4 w-4" />
            <span>Task completed successfully</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
```

4. **Create progress state hook (`apps/web/src/lib/state/use-task-progress.ts`):**

```typescript
/**
 * Task Progress Hook
 *
 * Subscribe to task progress updates from the agent state.
 *
 * @see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
 * Epic: DM-05 | Story: DM-05.4
 */
'use client';

import { useDashboardState } from './use-dashboard-state';

export interface TaskProgress {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    index: number;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: number;
    completedAt?: number;
    progress?: number;
  }>;
  startedAt?: number;
  estimatedCompletionMs?: number;
  error?: string;
}

/**
 * Hook to get all active tasks.
 */
export function useActiveTasks(): TaskProgress[] {
  return useDashboardState((state) => state.activeTasks || []);
}

/**
 * Hook to get a specific task by ID.
 */
export function useTaskProgress(taskId: string): TaskProgress | null {
  const tasks = useActiveTasks();
  return tasks.find((t) => t.taskId === taskId) || null;
}

/**
 * Hook to check if any tasks are running.
 */
export function useHasRunningTasks(): boolean {
  const tasks = useActiveTasks();
  return tasks.some((t) => t.status === 'running' || t.status === 'pending');
}
```

**Files to Create:**
- `apps/web/src/components/progress/TaskProgressCard.tsx`
- `apps/web/src/components/progress/index.ts`
- `apps/web/src/lib/state/use-task-progress.ts`

**Files to Modify:**
- `agents/schemas/dashboard_state.py` (add task progress types)
- `agents/gateway/state_emitter.py` (add progress methods)
- `apps/web/src/lib/state/dashboard-state.types.ts` (add TypeScript types)
- `apps/web/src/lib/state/index.ts` (export progress hooks)

**Test Requirements:**
- Unit: Progress state updates correctly
- Unit: TaskProgressCard renders all states
- Unit: Duration formatting works
- Integration: Progress streams to frontend
- E2E: User sees real-time step updates

**Definition of Done:**
- [ ] Task progress schema in Python and TypeScript
- [ ] State emitter progress methods
- [ ] `TaskProgressCard` component
- [ ] `useActiveTasks` and `useTaskProgress` hooks
- [ ] Unit tests pass

---

### 3.5 Story DM-05.5: Long Running Task Support (6 points)

**Objective:** Implement patterns for handling long-running async tasks.

**Implementation Tasks:**

1. **Create async task manager (`agents/hitl/task_manager.py`):**

```python
"""
Long-Running Task Manager

Manages lifecycle of long-running agent tasks with timeout handling,
cancellation support, and progress reporting.

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.5
"""
import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar('T')


class TaskState(str, Enum):
    """Task execution state."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


@dataclass
class TaskStep:
    """Definition of a task step."""
    name: str
    handler: Callable[..., Any]
    timeout_seconds: int = 60
    retries: int = 0


@dataclass
class TaskResult:
    """Result of a task execution."""
    task_id: str
    state: TaskState
    result: Any = None
    error: Optional[str] = None
    duration_ms: int = 0
    steps_completed: int = 0
    total_steps: int = 0


@dataclass
class ManagedTask:
    """A task being managed by the TaskManager."""
    task_id: str
    name: str
    steps: List[TaskStep]
    state: TaskState = TaskState.PENDING
    current_step: int = 0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: Optional[str] = None
    result: Any = None
    cancel_requested: bool = False
    asyncio_task: Optional[asyncio.Task] = field(default=None, repr=False)


class TaskManager:
    """
    Manages long-running tasks with progress tracking.

    Features:
    - Step-by-step execution with progress callbacks
    - Timeout handling per step and overall
    - Cancellation support
    - Automatic retry for failed steps
    - Integration with state emitter for UI updates
    """

    def __init__(
        self,
        state_emitter: Optional[Any] = None,  # DashboardStateEmitter
        default_step_timeout: int = 60,
        max_concurrent_tasks: int = 5,
    ):
        """
        Initialize task manager.

        Args:
            state_emitter: Optional state emitter for progress updates
            default_step_timeout: Default timeout for steps in seconds
            max_concurrent_tasks: Maximum concurrent tasks
        """
        self._state_emitter = state_emitter
        self._default_timeout = default_step_timeout
        self._max_concurrent = max_concurrent_tasks
        self._tasks: Dict[str, ManagedTask] = {}
        self._semaphore = asyncio.Semaphore(max_concurrent_tasks)

    async def submit_task(
        self,
        name: str,
        steps: List[TaskStep],
        context: Optional[Dict[str, Any]] = None,
        overall_timeout: Optional[int] = None,
    ) -> str:
        """
        Submit a new long-running task.

        Args:
            name: Human-readable task name
            steps: List of TaskStep definitions
            context: Optional context passed to step handlers
            overall_timeout: Optional overall timeout in seconds

        Returns:
            Task ID for tracking
        """
        task_id = f"task_{uuid.uuid4().hex[:12]}"

        task = ManagedTask(
            task_id=task_id,
            name=name,
            steps=steps,
        )
        self._tasks[task_id] = task

        # Start task execution
        task.asyncio_task = asyncio.create_task(
            self._execute_task(task, context, overall_timeout)
        )

        logger.info(f"Submitted task {task_id}: {name} ({len(steps)} steps)")

        return task_id

    async def _execute_task(
        self,
        task: ManagedTask,
        context: Optional[Dict[str, Any]],
        overall_timeout: Optional[int],
    ) -> TaskResult:
        """Execute a task step by step."""
        async with self._semaphore:
            task.state = TaskState.RUNNING
            task.started_at = time.time()

            # Notify state emitter
            if self._state_emitter:
                await self._state_emitter.start_task(
                    task_id=task.task_id,
                    task_name=task.name,
                    steps=[s.name for s in task.steps],
                    estimated_duration_ms=self._estimate_duration(task),
                )

            try:
                # Execute with overall timeout
                if overall_timeout:
                    result = await asyncio.wait_for(
                        self._execute_steps(task, context),
                        timeout=overall_timeout,
                    )
                else:
                    result = await self._execute_steps(task, context)

                task.state = TaskState.COMPLETED
                task.result = result

            except asyncio.CancelledError:
                task.state = TaskState.CANCELLED
                logger.info(f"Task {task.task_id} was cancelled")

            except asyncio.TimeoutError:
                task.state = TaskState.TIMEOUT
                task.error = f"Task timed out after {overall_timeout}s"
                logger.warning(f"Task {task.task_id} timed out")

            except Exception as e:
                task.state = TaskState.FAILED
                task.error = str(e)
                logger.error(f"Task {task.task_id} failed: {e}")

            finally:
                task.completed_at = time.time()

                # Notify state emitter
                if self._state_emitter:
                    await self._state_emitter.complete_task(
                        task_id=task.task_id,
                        success=task.state == TaskState.COMPLETED,
                        error=task.error,
                    )

            return TaskResult(
                task_id=task.task_id,
                state=task.state,
                result=task.result,
                error=task.error,
                duration_ms=int((task.completed_at - task.started_at) * 1000),
                steps_completed=task.current_step,
                total_steps=len(task.steps),
            )

    async def _execute_steps(
        self,
        task: ManagedTask,
        context: Optional[Dict[str, Any]],
    ) -> Any:
        """Execute task steps sequentially."""
        result = None

        for i, step in enumerate(task.steps):
            # Check for cancellation
            if task.cancel_requested:
                raise asyncio.CancelledError()

            task.current_step = i

            # Notify state emitter
            if self._state_emitter:
                await self._state_emitter.update_task_step(
                    task_id=task.task_id,
                    step_index=i,
                    status="running",
                )

            # Execute step with timeout and retries
            attempts = 0
            while attempts <= step.retries:
                try:
                    timeout = step.timeout_seconds or self._default_timeout
                    result = await asyncio.wait_for(
                        step.handler(result, context),
                        timeout=timeout,
                    )
                    break  # Success

                except asyncio.TimeoutError:
                    attempts += 1
                    if attempts > step.retries:
                        raise
                    logger.warning(
                        f"Step {step.name} timed out, retrying "
                        f"({attempts}/{step.retries})"
                    )

                except Exception:
                    attempts += 1
                    if attempts > step.retries:
                        raise
                    logger.warning(
                        f"Step {step.name} failed, retrying "
                        f"({attempts}/{step.retries})"
                    )

            # Mark step complete
            if self._state_emitter:
                await self._state_emitter.update_task_step(
                    task_id=task.task_id,
                    step_index=i,
                    status="completed",
                )

        return result

    def _estimate_duration(self, task: ManagedTask) -> int:
        """Estimate task duration in milliseconds."""
        total = sum(
            (s.timeout_seconds or self._default_timeout)
            for s in task.steps
        )
        # Assume average is half the timeout
        return int(total * 500)

    async def cancel_task(self, task_id: str) -> bool:
        """
        Request cancellation of a running task.

        Args:
            task_id: Task to cancel

        Returns:
            True if cancellation was requested
        """
        task = self._tasks.get(task_id)
        if not task:
            return False

        if task.state not in (TaskState.PENDING, TaskState.RUNNING):
            return False

        task.cancel_requested = True

        if task.asyncio_task and not task.asyncio_task.done():
            task.asyncio_task.cancel()

        if self._state_emitter:
            await self._state_emitter.cancel_task(task_id)

        logger.info(f"Cancellation requested for task {task_id}")
        return True

    def get_task_status(self, task_id: str) -> Optional[TaskResult]:
        """Get current status of a task."""
        task = self._tasks.get(task_id)
        if not task:
            return None

        duration = 0
        if task.started_at:
            end = task.completed_at or time.time()
            duration = int((end - task.started_at) * 1000)

        return TaskResult(
            task_id=task.task_id,
            state=task.state,
            result=task.result,
            error=task.error,
            duration_ms=duration,
            steps_completed=task.current_step,
            total_steps=len(task.steps),
        )

    async def wait_for_task(
        self,
        task_id: str,
        timeout: Optional[int] = None,
    ) -> TaskResult:
        """
        Wait for a task to complete.

        Args:
            task_id: Task to wait for
            timeout: Optional timeout in seconds

        Returns:
            Final task result
        """
        task = self._tasks.get(task_id)
        if not task:
            raise ValueError(f"Unknown task: {task_id}")

        if task.asyncio_task:
            try:
                if timeout:
                    await asyncio.wait_for(task.asyncio_task, timeout=timeout)
                else:
                    await task.asyncio_task
            except (asyncio.CancelledError, asyncio.TimeoutError):
                pass

        return self.get_task_status(task_id)

    def cleanup_completed(self, max_age_seconds: int = 3600) -> int:
        """
        Remove old completed tasks from memory.

        Args:
            max_age_seconds: Maximum age of completed tasks to keep

        Returns:
            Number of tasks cleaned up
        """
        now = time.time()
        to_remove = []

        for task_id, task in self._tasks.items():
            if task.state not in (TaskState.PENDING, TaskState.RUNNING):
                if task.completed_at and (now - task.completed_at) > max_age_seconds:
                    to_remove.append(task_id)

        for task_id in to_remove:
            del self._tasks[task_id]

        return len(to_remove)


# Singleton instance
_task_manager: Optional[TaskManager] = None


def get_task_manager(state_emitter: Optional[Any] = None) -> TaskManager:
    """Get the singleton task manager instance."""
    global _task_manager
    if _task_manager is None:
        _task_manager = TaskManager(state_emitter=state_emitter)
    elif state_emitter and not _task_manager._state_emitter:
        _task_manager._state_emitter = state_emitter
    return _task_manager
```

2. **Create example long-running task (`agents/gateway/long_tasks.py`):**

```python
"""
Long-Running Task Examples

Example implementations of long-running tasks using the TaskManager.

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.5
"""
import asyncio
from typing import Any, Dict, Optional

from hitl.task_manager import TaskManager, TaskStep, get_task_manager


async def research_competitor_landscape(
    competitors: list[str],
    state_emitter: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Long-running task: Research competitor landscape.

    This is an example of a multi-step task that might take several minutes.

    Args:
        competitors: List of competitor names to research
        state_emitter: Optional state emitter for progress updates

    Returns:
        Research results
    """
    manager = get_task_manager(state_emitter)

    # Define task steps
    async def gather_data(prev_result: Any, context: Optional[Dict]) -> Dict:
        """Step 1: Gather competitor data from various sources."""
        await asyncio.sleep(2)  # Simulate API calls
        return {"competitors": context.get("competitors", []), "data": {}}

    async def analyze_strengths(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 2: Analyze competitive strengths."""
        await asyncio.sleep(3)  # Simulate analysis
        prev_result["strengths"] = {c: ["strength1", "strength2"] for c in prev_result["competitors"]}
        return prev_result

    async def analyze_weaknesses(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 3: Analyze competitive weaknesses."""
        await asyncio.sleep(2)  # Simulate analysis
        prev_result["weaknesses"] = {c: ["weakness1"] for c in prev_result["competitors"]}
        return prev_result

    async def generate_report(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 4: Generate comprehensive report."""
        await asyncio.sleep(1)  # Simulate report generation
        prev_result["report_generated"] = True
        return prev_result

    steps = [
        TaskStep(name="Gathering competitor data", handler=gather_data, timeout_seconds=30),
        TaskStep(name="Analyzing strengths", handler=analyze_strengths, timeout_seconds=60),
        TaskStep(name="Analyzing weaknesses", handler=analyze_weaknesses, timeout_seconds=60),
        TaskStep(name="Generating report", handler=generate_report, timeout_seconds=30),
    ]

    # Submit task
    task_id = await manager.submit_task(
        name="Competitor Landscape Research",
        steps=steps,
        context={"competitors": competitors},
        overall_timeout=300,  # 5 minute overall timeout
    )

    # Wait for completion
    result = await manager.wait_for_task(task_id)

    return {
        "task_id": task_id,
        "state": result.state.value,
        "result": result.result,
        "error": result.error,
        "duration_ms": result.duration_ms,
    }


async def bulk_data_export(
    export_type: str,
    filters: Dict[str, Any],
    state_emitter: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Long-running task: Bulk data export.

    Example of a task with variable step count based on data volume.
    """
    manager = get_task_manager(state_emitter)

    async def prepare_export(prev_result: Any, context: Optional[Dict]) -> Dict:
        """Step 1: Prepare export configuration."""
        await asyncio.sleep(1)
        return {"export_type": context.get("export_type"), "record_count": 1000}

    async def fetch_records(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 2: Fetch records in batches."""
        # Simulate fetching records
        for i in range(0, 100, 10):
            await asyncio.sleep(0.5)
        prev_result["records_fetched"] = True
        return prev_result

    async def transform_data(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 3: Transform data for export."""
        await asyncio.sleep(2)
        prev_result["transformed"] = True
        return prev_result

    async def generate_file(prev_result: Dict, context: Optional[Dict]) -> Dict:
        """Step 4: Generate export file."""
        await asyncio.sleep(1)
        prev_result["file_url"] = "/exports/export_12345.csv"
        return prev_result

    steps = [
        TaskStep(name="Preparing export", handler=prepare_export, timeout_seconds=30),
        TaskStep(name="Fetching records", handler=fetch_records, timeout_seconds=120, retries=2),
        TaskStep(name="Transforming data", handler=transform_data, timeout_seconds=60),
        TaskStep(name="Generating file", handler=generate_file, timeout_seconds=30),
    ]

    task_id = await manager.submit_task(
        name=f"Data Export: {export_type}",
        steps=steps,
        context={"export_type": export_type, "filters": filters},
        overall_timeout=600,  # 10 minute timeout
    )

    result = await manager.wait_for_task(task_id)

    return {
        "task_id": task_id,
        "state": result.state.value,
        "file_url": result.result.get("file_url") if result.result else None,
        "error": result.error,
    }
```

**Files to Create:**
- `agents/hitl/task_manager.py`
- `agents/gateway/long_tasks.py`

**Files to Modify:**
- `agents/hitl/__init__.py` (export TaskManager)
- `agents/gateway/__init__.py` (export long task functions)

**Test Requirements:**
- Unit: TaskManager handles step execution
- Unit: Timeout handling works
- Unit: Cancellation stops execution
- Unit: Retry logic works
- Integration: Progress updates stream to frontend
- E2E: Long task completes with visible progress

**Definition of Done:**
- [ ] `TaskManager` class implemented
- [ ] Step-by-step execution with progress
- [ ] Timeout handling per step and overall
- [ ] Cancellation support
- [ ] Example long-running tasks
- [ ] Unit tests pass with >85% coverage

---

## 4. API Contracts

### 4.1 HITL Tool Response Schema

```typescript
interface HITLToolResponse {
  __hitl_pending__: true;
  hitl_result: {
    requires_approval: boolean;
    approval_level: 'auto' | 'quick' | 'full';
    confidence_score: number;
    tool_name: string;
    tool_args: Record<string, unknown>;
    config: {
      approval_type: string;
      risk_level: 'low' | 'medium' | 'high';
      auto_threshold: number;
      quick_threshold: number;
      requires_reason: boolean;
      approve_label: string;
      reject_label: string;
      description_template?: string;
    };
    approval_id?: string; // If queued to Foundation
  };
}
```

### 4.2 HITL Response Schema (Frontend to Backend)

```typescript
interface HITLResponse {
  approved: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}
```

### 4.3 Task Progress Schema

```typescript
interface TaskProgress {
  taskId: string;
  taskName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  steps: TaskStep[];
  startedAt?: number;
  estimatedCompletionMs?: number;
  error?: string;
}

interface TaskStep {
  index: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  progress?: number;
}
```

---

## 5. Testing Strategy

### 5.1 Unit Test Requirements

| Story | Test Focus | Minimum Coverage |
|-------|------------|------------------|
| DM-05.1 | HITL decorators, confidence calculation | 85% |
| DM-05.2 | HITL components, approval cards | 80% |
| DM-05.3 | Approval bridge, queue integration | 85% |
| DM-05.4 | Progress streaming, state updates | 80% |
| DM-05.5 | Task manager, timeout/cancellation | 90% |

### 5.2 Integration Test Scenarios

1. **HITL Flow Tests:**
   - High confidence action auto-executes
   - Medium confidence shows inline HITL
   - Low confidence queues to Foundation
   - User approval triggers execution
   - User rejection cancels action

2. **Progress Streaming Tests:**
   - Task progress updates appear in real-time
   - Step completion updates correctly
   - Error states display properly
   - Cancellation stops progress

### 5.3 E2E Test Cases

```typescript
test.describe('HITL Workflows', () => {
  test('inline HITL approval flow', async ({ page }) => {
    // Trigger medium-confidence action
    await page.goto('/dashboard');
    await page.getByPlaceholder('Ask about').fill('Sign contract ABC for $5000');
    await page.keyboard.press('Enter');

    // Wait for HITL card
    await expect(page.getByText('Contract Signature Required')).toBeVisible({
      timeout: 10000,
    });

    // Approve
    await page.getByRole('button', { name: 'Sign Contract' }).click();

    // Verify execution
    await expect(page.getByText('Contract signed successfully')).toBeVisible();
  });

  test('long-running task with progress', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByPlaceholder('Ask about').fill('Research competitor landscape');
    await page.keyboard.press('Enter');

    // Wait for progress card
    await expect(page.getByText('Competitor Landscape Research')).toBeVisible({
      timeout: 5000,
    });

    // Verify steps update
    await expect(page.getByText('Gathering competitor data')).toBeVisible();
    await expect(page.getByText(/Step 1 of/)).toBeVisible();

    // Wait for completion (with longer timeout)
    await expect(page.getByText('Task completed successfully')).toBeVisible({
      timeout: 60000,
    });
  });
});
```

---

## 6. Performance Budgets

| Metric | Target | Critical | Measurement |
|--------|--------|----------|-------------|
| **HITL Card Render** | <100ms | <200ms | React render time |
| **Approval Queue Creation** | <500ms | <1000ms | API round-trip |
| **Progress Update Latency** | <100ms | <200ms | State to UI |
| **Step Emission** | <50ms | <100ms | Backend to SSE |
| **Task Cancellation** | <200ms | <500ms | Request to stop |

---

## 7. Risk Mitigation

### 7.1 HITL Response Timeout

**Risk:** User doesn't respond to HITL prompt.

**Mitigation:**
- Auto-timeout after configurable duration (default 5 minutes)
- Show countdown timer on HITL cards
- Queue to Foundation if timeout in inline HITL
- Log timeout as "no response" in audit

### 7.2 Progress Stream Disconnection

**Risk:** SSE connection drops during long task.

**Mitigation:**
- Frontend reconnects automatically
- State sync on reconnection
- Task continues regardless of frontend state
- Can poll for status as fallback

### 7.3 Task Manager Memory Leak

**Risk:** Completed tasks accumulate in memory.

**Mitigation:**
- Auto-cleanup of completed tasks (default 1 hour)
- Maximum task limit
- Periodic cleanup job
- Task history in database for persistence

### 7.4 Confidence Calculation Accuracy

**Risk:** Incorrect confidence leads to wrong approval level.

**Mitigation:**
- Conservative thresholds (err on side of human review)
- Configurable per-tool thresholds
- Audit logging for analysis
- Feedback loop for threshold tuning

---

## 8. Dependencies & Integrations

### 8.1 DM-04 Dependencies

| Component | Status | Usage in DM-05 |
|-----------|--------|----------------|
| State Emitter | Complete | Extended with progress methods |
| Zustand Store | Complete | Extended with task progress |
| useAgentStateSync | Complete | Reused for progress sync |
| Dashboard State Schema | Complete | Extended with TaskProgress |

### 8.2 Foundation Approval Dependencies

| Component | Status | Usage in DM-05 |
|-----------|--------|----------------|
| ApprovalsService | Complete | Create items for full review |
| ApprovalItem type | Complete | Schema for queued items |
| Approval components | Complete | Reused in HITL cards |
| Event emission | Complete | Audit logging |

### 8.3 CopilotKit Dependencies

| Feature | Version | Usage |
|---------|---------|-------|
| useCopilotAction | ^1.x | HITL action registration |
| renderAndWaitForResponse | ^1.x | Blocking approval UI |
| useCoAgentStateRender | ^1.x | Progress streaming |

---

## 9. Success Criteria

| Criteria | Measurement | Target |
|----------|-------------|--------|
| HITL inline approval works | User can approve/reject | Pass |
| Queue integration works | Items appear in Foundation | Pass |
| Progress streaming works | Steps update in real-time | Pass |
| Cancellation stops tasks | Task terminates cleanly | Pass |
| Confidence routing correct | Actions route to right level | Pass |
| Performance targets met | Latency measurements | All pass |
| Test coverage | Unit + Integration | >80% |

---

## 10. Implementation Order

1. **DM-05.1: HITL Tool Definition** (8 points)
   - Foundation: Backend HITL infrastructure
   - No frontend dependency

2. **DM-05.2: Frontend HITL Handlers** (8 points)
   - Depends on: DM-05.1
   - Frontend HITL components

3. **DM-05.4: Realtime Progress Streaming** (5 points)
   - Parallel with DM-05.2
   - Extends DM-04 state infrastructure

4. **DM-05.3: Approval Workflow Integration** (7 points)
   - Depends on: DM-05.1, DM-05.2
   - Bridges HITL with Foundation

5. **DM-05.5: Long Running Task Support** (6 points)
   - Depends on: DM-05.4
   - Complete task management

---

## 11. References

- [Dynamic Module System Architecture](../../architecture/dynamic-module-system.md) - Phase 5 specification
- [Epic DM-04 Tech Spec](./epic-dm-04-tech-spec.md) - State infrastructure
- [CopilotKit HITL Documentation](https://docs.copilotkit.ai) - renderAndWaitForResponse
- [Foundation Approval System](../../../../packages/shared/src/types/approval.ts) - ApprovalItem types
- [Foundation Approval Service](../../../../apps/api/src/approvals/approvals.service.ts) - Queue implementation

---

*Generated: 2025-12-30*
*Epic: DM-05 | Phase: 5 | Stories: 5 | Points: 34*
