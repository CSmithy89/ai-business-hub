"""
Dashboard Shared State Schemas

These Pydantic models mirror the TypeScript schemas for state
shared between the Dashboard Gateway agent and the frontend.
The schemas use Field aliases for camelCase output to ensure
cross-language compatibility with the TypeScript frontend.

@see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
Epic: DM-04 | Story: DM-04.1
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field

# =============================================================================
# STATE VERSION
# =============================================================================

# State schema version for migrations.
# Must match the TypeScript STATE_VERSION constant.
STATE_VERSION = 1


# =============================================================================
# ENUMS
# =============================================================================


class ProjectStatus(str, Enum):
    """Project status values matching TypeScript ProjectStatusEnum."""

    ON_TRACK = "on-track"
    AT_RISK = "at-risk"
    BEHIND = "behind"
    COMPLETED = "completed"


class TrendDirection(str, Enum):
    """Metric trend direction matching TypeScript TrendDirectionEnum."""

    UP = "up"
    DOWN = "down"
    NEUTRAL = "neutral"


class AlertType(str, Enum):
    """Alert severity type matching TypeScript AlertTypeEnum."""

    ERROR = "error"
    WARNING = "warning"
    INFO = "info"
    SUCCESS = "success"


# =============================================================================
# TASK PROGRESS ENUMS AND MODELS (DM-05.4)
# =============================================================================


class TaskStepStatus(str, Enum):
    """Step execution status matching TypeScript TaskStepStatusEnum."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskStatus(str, Enum):
    """Overall task status matching TypeScript TaskStatusEnum."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStep(BaseModel):
    """
    Individual step within a task.

    Tracks execution state and progress of a single step in a multi-step task.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    index: int = Field(..., ge=0, description="Step index (0-based)")
    name: str = Field(..., description="Step display name")
    status: TaskStepStatus = Field(
        default=TaskStepStatus.PENDING, description="Step execution status"
    )
    started_at: Optional[int] = Field(
        None, alias="startedAt", description="Step start timestamp (Unix ms)"
    )
    completed_at: Optional[int] = Field(
        None, alias="completedAt", description="Step completion timestamp (Unix ms)"
    )
    progress: Optional[int] = Field(
        None, ge=0, le=100, description="Sub-step progress percentage (0-100)"
    )


class TaskProgress(BaseModel):
    """
    Progress state for a long-running task.

    Tracks overall task status and individual step progress for
    real-time streaming to the frontend.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    task_id: str = Field(..., alias="taskId", description="Unique task identifier")
    task_name: str = Field(..., alias="taskName", description="Human-readable task name")
    status: TaskStatus = Field(
        default=TaskStatus.PENDING, description="Overall task status"
    )
    current_step: int = Field(
        0, ge=0, alias="currentStep", description="Index of current step"
    )
    total_steps: int = Field(
        0, ge=0, alias="totalSteps", description="Total number of steps"
    )
    steps: List[TaskStep] = Field(
        default_factory=list, description="List of task steps"
    )
    started_at: Optional[int] = Field(
        None, alias="startedAt", description="Task start timestamp (Unix ms)"
    )
    estimated_completion_ms: Optional[int] = Field(
        None, alias="estimatedCompletionMs", description="Estimated total duration in ms"
    )
    error: Optional[str] = Field(None, description="Error message if task failed")


# =============================================================================
# WIDGET STATE MODELS
# =============================================================================


class ProjectStatusState(BaseModel):
    """
    Project Status Widget State.

    Shows project progress with status indicator and task counts.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    project_id: str = Field(..., alias="projectId", description="Unique project identifier")
    name: str = Field(..., description="Project display name")
    status: ProjectStatus = Field(..., description="Current project status")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage (0-100)")
    tasks_completed: int = Field(
        ..., ge=0, alias="tasksCompleted", description="Number of completed tasks"
    )
    tasks_total: int = Field(
        ..., ge=0, alias="tasksTotal", description="Total number of tasks"
    )
    last_updated: int = Field(
        ..., alias="lastUpdated", description="Last update timestamp (Unix ms)"
    )
    summary: Optional[str] = Field(None, description="Optional text summary")


class MetricEntry(BaseModel):
    """
    Single Metric Entry.

    Represents a single metric value with optional trend indicator.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    id: str = Field(..., description="Unique metric identifier")
    label: str = Field(..., description="Metric display label")
    value: Union[int, float, str] = Field(
        ..., description="Metric value (can be number or formatted string)"
    )
    unit: Optional[str] = Field(None, description="Optional unit suffix (e.g., '%', 'hrs')")
    trend: Optional[TrendDirection] = Field(None, description="Trend direction")
    change: Optional[str] = Field(None, description="Change description (e.g., '+5%')")
    change_percent: Optional[float] = Field(
        None, alias="changePercent", description="Change percentage value"
    )


class MetricsState(BaseModel):
    """
    Metrics Widget State.

    Container for multiple metrics with period context.
    """

    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(default="Key Metrics", description="Widget title")
    metrics: List[MetricEntry] = Field(
        default_factory=list, description="Array of metric entries"
    )
    period: Optional[str] = Field(
        None, description="Time period description (e.g., 'Last 7 days')"
    )
    last_updated: int = Field(
        ..., alias="lastUpdated", description="Last update timestamp (Unix ms)"
    )


class ActivityEntry(BaseModel):
    """
    Activity Entry.

    Represents a single activity in the feed.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique activity identifier")
    user: str = Field(..., description="User who performed the action")
    user_avatar: Optional[str] = Field(None, alias="userAvatar", description="User avatar URL")
    action: str = Field(..., description="Action description")
    target: Optional[str] = Field(
        None, description="Target of the action (e.g., task name)"
    )
    timestamp: int = Field(..., description="Activity timestamp (Unix ms)")
    project_id: Optional[str] = Field(None, alias="projectId", description="Related project ID")


class ActivityState(BaseModel):
    """
    Activity Widget State.

    Container for activity feed with pagination support.
    """

    model_config = ConfigDict(populate_by_name=True)

    activities: List[ActivityEntry] = Field(
        default_factory=list, description="Array of activity entries"
    )
    has_more: bool = Field(
        default=False, alias="hasMore", description="Whether more activities are available"
    )
    last_updated: int = Field(
        ..., alias="lastUpdated", description="Last update timestamp (Unix ms)"
    )


class AlertEntry(BaseModel):
    """
    Alert Entry.

    Represents a single alert notification.
    """

    model_config = ConfigDict(populate_by_name=True, use_enum_values=True)

    id: str = Field(..., description="Unique alert identifier")
    type: AlertType = Field(..., description="Alert severity type")
    title: str = Field(..., description="Alert title")
    message: str = Field(..., description="Alert message body")
    timestamp: int = Field(..., description="Alert timestamp (Unix ms)")
    dismissable: bool = Field(default=True, description="Whether the alert can be dismissed")
    dismissed: bool = Field(default=False, description="Whether the alert has been dismissed")
    action_label: Optional[str] = Field(
        None, alias="actionLabel", description="Optional action button label"
    )
    action_url: Optional[str] = Field(None, alias="actionUrl", description="Optional action URL")


# =============================================================================
# LOADING & ERROR STATE
# =============================================================================


class LoadingState(BaseModel):
    """
    Loading State.

    Tracks loading status and which agents are being queried.
    """

    model_config = ConfigDict(populate_by_name=True)

    is_loading: bool = Field(
        default=False, alias="isLoading", description="Whether any loading is in progress"
    )
    loading_agents: List[str] = Field(
        default_factory=list,
        alias="loadingAgents",
        description="List of agents currently being queried",
    )
    started_at: Optional[int] = Field(
        None, alias="startedAt", description="Loading start timestamp (Unix ms)"
    )


# =============================================================================
# ROOT DASHBOARD STATE
# =============================================================================


class WidgetsState(BaseModel):
    """
    Widget Container State.

    Holds all widget-specific state objects.
    """

    model_config = ConfigDict(populate_by_name=True)

    project_status: Optional[ProjectStatusState] = Field(
        None, alias="projectStatus", description="Project status widget data"
    )
    metrics: Optional[MetricsState] = Field(None, description="Metrics widget data")
    activity: Optional[ActivityState] = Field(None, description="Activity feed widget data")
    alerts: List[AlertEntry] = Field(
        default_factory=list, description="Alert entries (array, not single widget)"
    )


class DashboardState(BaseModel):
    """
    Root Dashboard State.

    This is the complete state object shared between agent and frontend
    via the AG-UI protocol's state synchronization mechanism.
    """

    model_config = ConfigDict(populate_by_name=True)

    version: int = Field(default=STATE_VERSION, description="Schema version for migrations")
    timestamp: int = Field(..., description="Last update timestamp (Unix ms)")
    active_project: Optional[str] = Field(
        None, alias="activeProject", description="Currently focused project ID"
    )
    workspace_id: Optional[str] = Field(
        None, alias="workspaceId", description="Current workspace ID"
    )
    user_id: Optional[str] = Field(None, alias="userId", description="Current user ID")

    # Widget data container
    widgets: WidgetsState = Field(
        default_factory=WidgetsState, description="Widget data container"
    )

    # Loading state
    loading: LoadingState = Field(
        default_factory=LoadingState, description="Loading state"
    )

    # Error state (agentId -> error message)
    errors: Dict[str, str] = Field(
        default_factory=dict, description="Error state (agentId -> error message)"
    )

    # Active tasks for progress tracking (DM-05.4)
    active_tasks: List[TaskProgress] = Field(
        default_factory=list,
        alias="activeTasks",
        description="Currently active long-running tasks",
    )

    @classmethod
    def create_initial(
        cls,
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        active_project: Optional[str] = None,
    ) -> "DashboardState":
        """
        Create initial empty dashboard state.

        Used to initialize the state store and for tests.

        Args:
            workspace_id: Optional workspace/tenant ID
            user_id: Optional user ID
            active_project: Optional initially active project

        Returns:
            Fresh DashboardState with defaults
        """
        return cls(
            timestamp=int(datetime.utcnow().timestamp() * 1000),
            active_project=active_project,
            workspace_id=workspace_id,
            user_id=user_id,
        )

    def to_frontend_dict(self) -> Dict[str, Any]:
        """
        Convert to frontend-compatible dictionary with camelCase keys.

        This method serializes the state using the aliases defined on each field,
        ensuring the output matches the TypeScript schema exactly.

        Returns:
            Dictionary with camelCase keys suitable for frontend consumption
        """
        return self.model_dump(by_alias=True, exclude_none=True)
