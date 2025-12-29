"""
Approval Agent Schemas
Pydantic models for approval workflows
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class ApprovalStatus(str, Enum):
    """Status of an approval request."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ApprovalRequest(BaseModel):
    """An approval request waiting for human decision."""
    id: str = Field(description="Unique approval request ID")
    action_type: str = Field(description="Type of action requiring approval")
    description: str = Field(description="Human-readable description")
    resource_id: str = Field(description="ID of resource being acted upon")
    resource_type: str = Field(description="Type of resource")
    status: ApprovalStatus = Field(default=ApprovalStatus.PENDING)
    requester_id: Optional[str] = Field(default=None, description="Who requested")
    approver_id: Optional[str] = Field(default=None, description="Assigned approver")
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = Field(default=None)


class ApprovalDecision(BaseModel):
    """A decision on an approval request."""
    request_id: str = Field(description="ID of the approval request")
    decision: Literal["approved", "rejected"] = Field(description="The decision")
    decided_by: str = Field(description="Who made the decision")
    reason: Optional[str] = Field(default=None, description="Reason for rejection")
    decided_at: datetime = Field(default_factory=datetime.now)


class ApprovalRule(BaseModel):
    """A rule for automatic approval routing."""
    id: str = Field(description="Rule ID")
    name: str = Field(description="Rule name")
    condition_type: str = Field(description="Type of condition")
    condition_value: str = Field(description="Condition threshold/value")
    approver_role: str = Field(description="Role that should approve")
    priority: int = Field(default=0, description="Rule priority")
    is_active: bool = Field(default=True)


class ApprovalStats(BaseModel):
    """Statistics about approval workflows."""
    total_pending: int = Field(description="Total pending approvals")
    avg_approval_time_hours: float = Field(description="Average time to approve")
    approval_rate: float = Field(description="Percentage approved vs rejected")
    overdue_count: int = Field(description="Approvals past SLA")
