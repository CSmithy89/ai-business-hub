"""
Herald Agent Response Schemas

Pydantic schemas for validating Herald (activity/notifications) agent responses.

DM-08.7: Created for response parser validation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ActivityType(str, Enum):
    """Activity type values."""

    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    TASK_UPDATED = "task_updated"
    COMMENT_ADDED = "comment_added"
    FILE_UPLOADED = "file_uploaded"
    MILESTONE_REACHED = "milestone_reached"
    STATUS_CHANGED = "status_changed"
    MEMBER_JOINED = "member_joined"
    MEMBER_LEFT = "member_left"
    OTHER = "other"


class ActivityEntry(BaseModel):
    """Individual activity entry from Herald agent."""

    activity_id: str = Field(description="Unique activity identifier")
    type: ActivityType = Field(default=ActivityType.OTHER, description="Activity type")
    title: str = Field(description="Activity title/summary")
    description: Optional[str] = Field(
        default=None, description="Detailed description"
    )
    actor: Optional[str] = Field(default=None, description="User who performed action")
    actor_id: Optional[str] = Field(default=None, description="Actor user ID")
    target: Optional[str] = Field(
        default=None, description="Target entity (task, project, etc.)"
    )
    target_id: Optional[str] = Field(default=None, description="Target entity ID")
    timestamp: str = Field(description="ISO timestamp of activity")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional metadata"
    )

    def get_relative_time(self) -> str:
        """Get human-readable relative time (e.g., '2 hours ago')."""
        try:
            activity_time = datetime.fromisoformat(
                self.timestamp.replace("Z", "+00:00")
            )
            now = datetime.now(activity_time.tzinfo)
            delta = now - activity_time

            if delta.days > 0:
                return f"{delta.days} day{'s' if delta.days > 1 else ''} ago"
            elif delta.seconds >= 3600:
                hours = delta.seconds // 3600
                return f"{hours} hour{'s' if hours > 1 else ''} ago"
            elif delta.seconds >= 60:
                minutes = delta.seconds // 60
                return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
            else:
                return "just now"
        except (ValueError, TypeError):
            return "unknown"


class HeraldActivityResponse(BaseModel):
    """
    Complete response from Herald agent for activity/notifications.

    Used to validate raw A2A responses before state updates.
    """

    project_id: str = Field(description="Queried project identifier")
    content: Optional[str] = Field(
        default=None, description="Text content from Herald"
    )
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
    agent: str = Field(default="herald", description="Agent identifier")

    # Parsed data
    activities: Optional[List[ActivityEntry]] = Field(
        default=None, description="Activity entries"
    )
    total_count: Optional[int] = Field(
        default=None, ge=0, description="Total activity count (for pagination)"
    )
    has_more: bool = Field(default=False, description="Whether more activities exist")
    unread_count: Optional[int] = Field(
        default=None, ge=0, description="Count of unread activities"
    )

    def to_widget_data(self) -> Dict[str, Any]:
        """
        Convert to widget-friendly format.

        Returns data suitable for rendering in TeamActivity widget.
        """
        return {
            "projectId": self.project_id,
            "activities": [
                {
                    "id": a.activity_id,
                    "type": a.type.value,
                    "title": a.title,
                    "actor": a.actor,
                    "timestamp": a.timestamp,
                    "relativeTime": a.get_relative_time(),
                }
                for a in (self.activities or [])
            ],
            "totalCount": self.total_count,
            "hasMore": self.has_more,
            "unreadCount": self.unread_count,
        }


def get_default_herald_response() -> Dict[str, Any]:
    """Return safe default when validation fails."""
    return {
        "project_id": "unknown",
        "content": "Unable to retrieve activity feed",
        "error": "Response validation failed",
        "activities": [],
    }
