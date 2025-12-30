"""
HITL Tools for Dashboard Gateway

Example tools demonstrating Human-in-the-Loop patterns for common
high-risk operations. These tools are decorated with @hitl_tool to
enable confidence-based approval routing.

Tool Risk Classifications:
- sign_contract: HIGH - Financial commitments, requires strong approval
- delete_project: HIGH - Destructive action, irreversible
- approve_expense: MEDIUM - Financial but routine
- send_bulk_notification: LOW - Communication, higher volume risk

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.1
"""

import logging
from typing import Any, Dict, List, Optional

from hitl import hitl_tool

logger = logging.getLogger(__name__)


# =============================================================================
# HIGH-RISK TOOLS
# =============================================================================


@hitl_tool(
    approval_type="contract",
    risk_level="high",
    auto_threshold=95,
    quick_threshold=70,
    requires_reason=True,
    timeout_seconds=600,
    approve_label="Sign Contract",
    reject_label="Cancel",
    description_template="Sign contract {contract_id} for ${amount}",
)
async def sign_contract(
    contract_id: str,
    amount: float,
    signatory_name: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sign a contract on behalf of the organization.

    This is a high-stakes action that commits the organization to a
    legal agreement. Requires strong approval due to financial and
    legal implications.

    Args:
        contract_id: Unique identifier for the contract
        amount: Contract value in dollars
        signatory_name: Optional name of the signatory
        notes: Optional notes for the signature

    Returns:
        Dictionary with signature confirmation details

    Example:
        >>> result = await sign_contract(
        ...     contract_id="C-2024-001",
        ...     amount=50000,
        ...     signatory_name="John Doe",
        ...     _hitl_context={"user_role": "admin"}
        ... )
    """
    logger.info(f"Signing contract {contract_id} for ${amount}")

    # Simulate contract signing logic
    return {
        "status": "signed",
        "contract_id": contract_id,
        "amount": amount,
        "signatory": signatory_name or "System",
        "timestamp": "2024-01-15T10:30:00Z",
        "confirmation_number": f"SIG-{contract_id[-8:]}",
    }


@hitl_tool(
    approval_type="deletion",
    risk_level="high",
    auto_threshold=90,
    quick_threshold=60,
    requires_reason=True,
    timeout_seconds=300,
    approve_label="Confirm Delete",
    reject_label="Cancel",
    description_template="Delete project '{project_name}' and all associated data",
)
async def delete_project(
    project_id: str,
    project_name: str,
    archive_first: bool = True,
    notify_team: bool = True,
) -> Dict[str, Any]:
    """
    Delete a project and all associated data.

    This is a destructive, irreversible action. The project and all
    its tasks, files, and history will be permanently removed.
    Optionally archives data before deletion.

    Args:
        project_id: Unique identifier for the project
        project_name: Project display name (for confirmation)
        archive_first: Whether to archive before deletion (recommended)
        notify_team: Whether to notify team members

    Returns:
        Dictionary with deletion confirmation

    Example:
        >>> result = await delete_project(
        ...     project_id="proj_123",
        ...     project_name="Legacy System",
        ...     archive_first=True,
        ...     _hitl_context={"user_role": "admin"}
        ... )
    """
    logger.info(f"Deleting project {project_id}: {project_name}")

    archive_id = None
    if archive_first:
        archive_id = f"ARCHIVE-{project_id}"
        logger.info(f"Created archive: {archive_id}")

    if notify_team:
        logger.info(f"Notifying team members of project deletion")

    return {
        "status": "deleted",
        "project_id": project_id,
        "project_name": project_name,
        "archived": archive_first,
        "archive_id": archive_id,
        "team_notified": notify_team,
        "deleted_at": "2024-01-15T10:35:00Z",
    }


# =============================================================================
# MEDIUM-RISK TOOLS
# =============================================================================


@hitl_tool(
    approval_type="financial",
    risk_level="medium",
    auto_threshold=85,
    quick_threshold=65,
    requires_reason=False,
    timeout_seconds=300,
    approve_label="Approve Expense",
    reject_label="Reject",
    description_template="Approve expense of ${amount} for '{description}'",
)
async def approve_expense(
    expense_id: str,
    amount: float,
    description: str,
    category: str = "general",
    requester_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Approve an expense reimbursement or purchase request.

    Medium-risk financial action. Small expenses may be auto-approved,
    while larger amounts require manual confirmation.

    Args:
        expense_id: Unique identifier for the expense
        amount: Expense amount in dollars
        description: Description of the expense
        category: Expense category (e.g., travel, equipment)
        requester_id: ID of the person requesting reimbursement

    Returns:
        Dictionary with approval confirmation

    Example:
        >>> result = await approve_expense(
        ...     expense_id="EXP-001",
        ...     amount=150,
        ...     description="Team lunch",
        ...     category="meals",
        ...     _hitl_context={"user_role": "manager"}
        ... )
    """
    logger.info(f"Approving expense {expense_id}: ${amount}")

    return {
        "status": "approved",
        "expense_id": expense_id,
        "amount": amount,
        "description": description,
        "category": category,
        "requester_id": requester_id,
        "approved_at": "2024-01-15T10:40:00Z",
        "payment_eta": "2024-01-20",
    }


# =============================================================================
# LOW-RISK TOOLS
# =============================================================================


@hitl_tool(
    approval_type="communication",
    risk_level="low",
    auto_threshold=80,
    quick_threshold=50,
    requires_reason=False,
    timeout_seconds=120,
    approve_label="Send Notifications",
    reject_label="Cancel",
    description_template="Send notification to {recipient_count} recipients",
)
async def send_bulk_notification(
    subject: str,
    message: str,
    recipient_ids: List[str],
    notification_type: str = "info",
    priority: str = "normal",
) -> Dict[str, Any]:
    """
    Send a notification to multiple recipients.

    Lower-risk communication action. Confidence decreases with
    larger recipient counts to ensure bulk messages are reviewed.

    Args:
        subject: Notification subject line
        message: Notification message body
        recipient_ids: List of user IDs to notify
        notification_type: Type of notification (info, warning, action)
        priority: Priority level (low, normal, high, urgent)

    Returns:
        Dictionary with send confirmation

    Example:
        >>> result = await send_bulk_notification(
        ...     subject="Project Update",
        ...     message="Sprint 5 has started",
        ...     recipient_ids=["user_1", "user_2", "user_3"],
        ...     notification_type="info",
        ...     _hitl_context={"user_id": "sender_123"}
        ... )
    """
    recipient_count = len(recipient_ids)
    logger.info(f"Sending bulk notification to {recipient_count} recipients")

    return {
        "status": "sent",
        "subject": subject,
        "recipient_count": recipient_count,
        "notification_type": notification_type,
        "priority": priority,
        "sent_at": "2024-01-15T10:45:00Z",
        "delivery_status": "queued",
    }


# =============================================================================
# TOOL REGISTRY
# =============================================================================


def get_hitl_tools() -> List:
    """
    Get all HITL tools for registration with the Dashboard Gateway.

    Returns:
        List of HITL tool functions

    Example:
        >>> tools = get_hitl_tools()
        >>> for tool in tools:
        ...     print(f"{tool.__name__}: {is_hitl_tool(tool)}")
        sign_contract: True
        delete_project: True
        approve_expense: True
        send_bulk_notification: True
    """
    return [
        sign_contract,
        delete_project,
        approve_expense,
        send_bulk_notification,
    ]


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================


def get_hitl_tool_metadata() -> Dict[str, Dict[str, Any]]:
    """
    Get metadata for all HITL tools.

    Returns a dictionary mapping tool names to their HITL configurations,
    useful for documentation or admin interfaces.

    Returns:
        Dictionary of tool name to configuration metadata

    Example:
        >>> metadata = get_hitl_tool_metadata()
        >>> metadata["sign_contract"]["risk_level"]
        'high'
    """
    from hitl import get_hitl_config

    tools = get_hitl_tools()
    metadata = {}

    for tool in tools:
        config = get_hitl_config(tool)
        if config:
            metadata[tool.__name__] = {
                "approval_type": config.approval_type,
                "risk_level": config.risk_level,
                "auto_threshold": config.auto_threshold,
                "quick_threshold": config.quick_threshold,
                "requires_reason": config.requires_reason,
                "timeout_seconds": config.timeout_seconds,
                "approve_label": config.approve_label,
                "reject_label": config.reject_label,
            }

    return metadata
