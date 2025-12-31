"""
Navi Agent Response Schemas

Pydantic schemas for validating Navi (project management) agent responses.

DM-08.7: Created for response parser validation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class ProjectStatus(str, Enum):
    """Project status values."""

    ON_TRACK = "on-track"
    AT_RISK = "at-risk"
    BEHIND = "behind"
    COMPLETED = "completed"


class TaskStatus(str, Enum):
    """Task status values."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    BLOCKED = "blocked"


class TaskBreakdown(BaseModel):
    """Individual task in a project breakdown."""

    task_id: str = Field(description="Unique task identifier")
    title: str = Field(description="Task title")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: Optional[str] = Field(default=None, description="Priority level")
    assignee: Optional[str] = Field(default=None, description="Assigned user")
    due_date: Optional[str] = Field(default=None, description="Due date ISO string")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")


class TimelineMilestone(BaseModel):
    """Project timeline milestone."""

    milestone_id: str = Field(description="Unique milestone identifier")
    name: str = Field(description="Milestone name")
    target_date: str = Field(description="Target date ISO string")
    status: str = Field(default="pending", description="Milestone status")
    deliverables: List[str] = Field(default_factory=list, description="Key deliverables")


class ProjectStatusData(BaseModel):
    """
    Project status data from Navi agent.

    Mirrors the frontend ProjectStatusState schema for consistency.
    """

    project_id: str = Field(description="Unique project identifier")
    name: str = Field(description="Project display name")
    status: ProjectStatus = Field(description="Current project status")
    progress: int = Field(ge=0, le=100, description="Progress percentage")
    tasks_completed: int = Field(ge=0, description="Number of completed tasks")
    tasks_total: int = Field(ge=0, description="Total number of tasks")
    summary: Optional[str] = Field(default=None, description="Text summary")

    @field_validator("progress")
    @classmethod
    def clamp_progress(cls, v: int) -> int:
        """Ensure progress is clamped to 0-100."""
        return max(0, min(100, v))


class NaviProjectResponse(BaseModel):
    """
    Complete response from Navi agent for project status.

    Used to validate raw A2A responses before state updates.
    """

    project_id: str = Field(description="Queried project identifier")
    content: Optional[str] = Field(default=None, description="Text content from Navi")
    raw_data: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional artifacts"
    )
    tool_calls: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Tool calls made by agent"
    )
    duration_ms: Optional[int] = Field(
        default=None, description="Response time in ms"
    )
    error: Optional[str] = Field(default=None, description="Error message if failed")
    agent: str = Field(default="navi", description="Agent identifier")

    # Parsed data (may be in raw_data or directly populated)
    project_status: Optional[ProjectStatusData] = Field(
        default=None, description="Parsed project status data"
    )
    tasks: Optional[List[TaskBreakdown]] = Field(
        default=None, description="Task breakdown if requested"
    )
    timeline: Optional[List[TimelineMilestone]] = Field(
        default=None, description="Timeline milestones if requested"
    )

    def to_widget_data(self) -> Dict[str, Any]:
        """
        Convert to widget-friendly format.

        Returns data suitable for rendering in ProjectStatus widget.
        """
        if self.project_status:
            return {
                "projectId": self.project_status.project_id,
                "projectName": self.project_status.name,
                "status": self.project_status.status.value.replace("-", "_"),
                "progress": self.project_status.progress,
                "tasksCompleted": self.project_status.tasks_completed,
                "tasksTotal": self.project_status.tasks_total,
            }
        return {
            "projectId": self.project_id,
            "content": self.content,
        }


def get_default_navi_response() -> Dict[str, Any]:
    """Return safe default when validation fails."""
    return {
        "project_id": "unknown",
        "content": "Unable to retrieve project status",
        "error": "Response validation failed",
    }
