"""
Structured Output Models for PM Agent Tools
AI Business Hub - Project Management Module

Pydantic models for validating agent tool responses.
These models ensure structured, type-safe outputs and replace
hardcoded fallback defaults with explicit validation.

Corresponding NestJS Zod schemas are defined in:
apps/api/src/pm/agents/schemas/agent-responses.schema.ts
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


# ==============================================================================
# Enums
# ==============================================================================


class TaskAction(str, Enum):
    """Valid actions for task recommendations."""

    COMPLETE = "complete"
    CARRY_OVER = "carry_over"
    CANCEL = "cancel"


class HealthLevel(str, Enum):
    """Health score levels (matches Prisma HealthLevel enum)."""

    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class HealthTrend(str, Enum):
    """Health trend directions (matches Prisma HealthTrend enum)."""

    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"


class ConfidenceLevel(str, Enum):
    """Confidence levels for estimates."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class VelocityTrend(str, Enum):
    """Velocity trend directions."""

    UP = "up"
    DOWN = "down"
    STABLE = "stable"


# ==============================================================================
# Phase Analysis Models (Scope Agent)
# ==============================================================================


class TaskRecommendation(BaseModel):
    """Recommendation for a specific task during phase analysis."""

    task_id: str = Field(min_length=1, max_length=100, description="Task identifier")
    action: TaskAction = Field(description="Recommended action for the task")
    reason: str = Field(max_length=500, description="Reasoning for this recommendation")


class PhaseAnalysisSummary(BaseModel):
    """Summary of phase completion readiness."""

    ready_for_completion: bool = Field(
        description="Whether the phase is ready to transition"
    )
    blockers: List[str] = Field(
        default_factory=list, max_length=20, description="List of blockers"
    )
    next_phase_preview: str = Field(
        max_length=200, description="Preview of the next phase"
    )
    estimated_time_to_complete: Optional[str] = Field(
        default=None, max_length=50, description="Estimated time to complete"
    )


class IncompleteTask(BaseModel):
    """Task that is incomplete during phase analysis."""

    id: str = Field(description="Task ID")
    title: str = Field(max_length=500, description="Task title")
    status: str = Field(description="Current task status")
    task_number: int = Field(ge=0, description="Task number in sequence")


class PhaseAnalysisOutput(BaseModel):
    """Structured output for phase completion analysis (Scope agent)."""

    phase_id: str = Field(description="The analyzed phase ID")
    phase_name: str = Field(max_length=200, description="Phase name")
    total_tasks: int = Field(ge=0, description="Total tasks in phase")
    completed_tasks: int = Field(ge=0, description="Completed tasks count")
    incomplete_tasks: List[IncompleteTask] = Field(
        default_factory=list, description="List of incomplete tasks"
    )
    recommendations: List[TaskRecommendation] = Field(
        default_factory=list, max_length=100, description="Task recommendations"
    )
    summary: PhaseAnalysisSummary = Field(description="Phase summary")


class PhaseCheckpointOutput(BaseModel):
    """Structured output for phase checkpoint data."""

    id: str = Field(description="Checkpoint ID")
    name: str = Field(max_length=200, description="Checkpoint name")
    checkpoint_date: str = Field(description="Checkpoint date (ISO format)")
    status: str = Field(description="Checkpoint status")
    description: Optional[str] = Field(
        default=None, max_length=1000, description="Checkpoint description"
    )


class PhaseTransitionPreview(BaseModel):
    """Preview of a phase transition."""

    tasks_to_complete: int = Field(ge=0)
    tasks_to_carry_over: int = Field(ge=0)
    tasks_to_cancel: int = Field(ge=0)
    affected_tasks: List[dict] = Field(default_factory=list)


class PhaseTransitionOutput(BaseModel):
    """Structured output for phase transition preview."""

    phase_id: str = Field(description="Current phase ID")
    phase_name: str = Field(max_length=200, description="Current phase name")
    next_phase_id: Optional[str] = Field(
        default=None, description="Next phase ID (if exists)"
    )
    next_phase_name: Optional[str] = Field(
        default=None, max_length=200, description="Next phase name"
    )
    transition_preview: PhaseTransitionPreview = Field(
        description="Transition preview details"
    )


# ==============================================================================
# Health Monitoring Models (Vitals Agent)
# ==============================================================================


class HealthFactor(BaseModel):
    """A factor contributing to health score."""

    name: str = Field(max_length=100, description="Factor name")
    score: float = Field(ge=0.0, le=1.0, description="Factor score (0-1)")
    description: Optional[str] = Field(
        default=None, max_length=500, description="Factor description"
    )


class RiskEntry(BaseModel):
    """A detected project risk."""

    type: str = Field(description="Risk type identifier")
    severity: Literal["info", "warning", "critical"] = Field(description="Risk severity")
    title: str = Field(max_length=200, description="Risk title")
    description: str = Field(max_length=1000, description="Risk description")
    affected_tasks: List[str] = Field(default_factory=list, description="Affected task IDs")
    affected_users: List[str] = Field(default_factory=list, description="Affected user IDs")


class HealthScoreFactors(BaseModel):
    """Breakdown of health score factors."""

    on_time_delivery: float = Field(ge=0.0, le=1.0, description="On-time delivery score")
    blocker_impact: float = Field(ge=0.0, le=1.0, description="Blocker impact score")
    team_capacity: float = Field(ge=0.0, le=1.0, description="Team capacity score")
    velocity_trend: float = Field(ge=0.0, le=1.0, description="Velocity trend score")


class HealthInsightOutput(BaseModel):
    """Structured output for health check insights (Vitals agent)."""

    score: int = Field(ge=0, le=100, description="Health score (0-100)")
    level: HealthLevel = Field(description="Health level")
    trend: HealthTrend = Field(description="Health trend")
    factors: HealthScoreFactors = Field(description="Health factor breakdown")
    explanation: str = Field(max_length=1000, description="Health explanation")
    suggestions: List[str] = Field(
        default_factory=list, max_length=10, description="Improvement suggestions"
    )


class RiskDetectionOutput(BaseModel):
    """Structured output for risk detection."""

    risks: List[RiskEntry] = Field(default_factory=list, description="Detected risks")


class TeamCapacityMember(BaseModel):
    """Team member capacity info."""

    user_id: str = Field(description="User ID")
    user_name: Optional[str] = Field(default=None, description="User name")
    assigned_hours: float = Field(ge=0, description="Assigned hours")
    threshold: int = Field(default=40, description="Capacity threshold")
    overload_percent: float = Field(ge=0, description="Overload percentage")


class TeamCapacityOutput(BaseModel):
    """Structured output for team capacity check."""

    overloaded_members: List[TeamCapacityMember] = Field(
        default_factory=list, description="Overloaded team members"
    )
    team_health: Literal["healthy", "at_capacity", "overloaded"] = Field(
        description="Overall team health status"
    )


class VelocityAnalysisOutput(BaseModel):
    """Structured output for velocity analysis."""

    current_velocity: float = Field(ge=0, description="Current velocity")
    baseline_velocity: float = Field(ge=0, description="Baseline velocity")
    change_percent: float = Field(description="Percentage change")
    trend: VelocityTrend = Field(description="Velocity trend direction")
    alert: bool = Field(description="Whether a velocity alert should be triggered")


class BlockerChain(BaseModel):
    """A chain of blocked tasks."""

    blocker_id: str = Field(description="Blocking task ID")
    blocker_title: str = Field(max_length=500, description="Blocking task title")
    blocked_tasks: List[dict] = Field(description="Tasks blocked by this blocker")
    severity: Literal["warning", "critical"] = Field(description="Chain severity")


class BlockerChainsOutput(BaseModel):
    """Structured output for blocker chain detection."""

    chains: List[BlockerChain] = Field(
        default_factory=list, description="Detected blocker chains"
    )


class OverdueTask(BaseModel):
    """An overdue task."""

    id: str = Field(description="Task ID")
    title: str = Field(max_length=500, description="Task title")
    due_date: str = Field(description="Due date (ISO format)")
    days_overdue: int = Field(ge=0, description="Days overdue")
    assignee: Optional[str] = Field(default=None, description="Assignee ID")


class DueSoonTask(BaseModel):
    """A task due soon."""

    id: str = Field(description="Task ID")
    title: str = Field(max_length=500, description="Task title")
    due_date: str = Field(description="Due date (ISO format)")
    hours_remaining: float = Field(ge=0, description="Hours remaining until due")
    assignee: Optional[str] = Field(default=None, description="Assignee ID")


class OverdueTasksOutput(BaseModel):
    """Structured output for overdue tasks detection."""

    overdue: List[OverdueTask] = Field(
        default_factory=list, description="Overdue tasks"
    )
    due_soon: List[DueSoonTask] = Field(
        default_factory=list, description="Tasks due soon"
    )


# ==============================================================================
# Estimation Models (Oracle Agent)
# ==============================================================================


class SimilarTaskRef(BaseModel):
    """Reference to a similar task used in estimation."""

    id: str = Field(description="Task ID")
    title: str = Field(max_length=500, description="Task title")
    story_points: Optional[int] = Field(default=None, ge=0, le=21)
    estimated_hours: Optional[float] = Field(default=None, ge=0)
    actual_hours: Optional[float] = Field(default=None, ge=0)


class EstimationOutput(BaseModel):
    """Structured output for task estimation (Oracle agent)."""

    story_points: int = Field(ge=1, le=21, description="Story points (Fibonacci scale)")
    estimated_hours: float = Field(ge=0, description="Estimated hours")
    confidence_level: ConfidenceLevel = Field(description="Confidence level")
    confidence_score: float = Field(
        ge=0.0, le=1.0, description="Confidence score (0-1)"
    )
    basis: str = Field(max_length=500, description="Basis for the estimate")
    cold_start: bool = Field(description="Whether this is a cold-start estimate")
    similar_tasks: List[str] = Field(
        default_factory=list, max_length=10, description="Similar task IDs"
    )
    complexity_factors: List[str] = Field(
        default_factory=list, max_length=10, description="Complexity factors"
    )


class VelocityMetricsOutput(BaseModel):
    """Structured output for velocity metrics."""

    avg_points_per_sprint: Optional[float] = Field(
        default=None, ge=0, description="Average points per sprint"
    )
    avg_hours_per_sprint: Optional[float] = Field(
        default=None, ge=0, description="Average hours per sprint"
    )
    sprint_count: int = Field(ge=0, description="Number of sprints analyzed")


class EstimationMetricsOutput(BaseModel):
    """Structured output for estimation accuracy metrics."""

    average_error: Optional[float] = Field(
        default=None, ge=0, description="Average estimation error"
    )
    average_accuracy: Optional[float] = Field(
        default=None, description="Average estimation accuracy"
    )
    total_estimations: int = Field(ge=0, description="Total estimations made")


# ==============================================================================
# Time Tracking Models (Chrono Agent)
# ==============================================================================


class TimeEntryOutput(BaseModel):
    """Structured output for a time entry."""

    id: str = Field(description="Time entry ID")
    task_id: str = Field(description="Task ID")
    user_id: str = Field(description="User ID")
    hours: float = Field(ge=0.25, le=24, description="Hours logged")
    description: Optional[str] = Field(
        default=None, max_length=500, description="Entry description"
    )
    date: str = Field(description="Entry date (ISO format)")
    start_time: Optional[str] = Field(default=None, description="Start time (if timer)")
    end_time: Optional[str] = Field(default=None, description="End time (if timer)")


class ActiveTimerOutput(BaseModel):
    """Structured output for an active timer."""

    id: str = Field(description="Timer ID")
    task_id: str = Field(description="Task ID")
    task_title: str = Field(max_length=500, description="Task title")
    user_id: str = Field(description="User ID")
    start_time: str = Field(description="Timer start time (ISO format)")
    elapsed_seconds: int = Field(ge=0, description="Elapsed seconds")
    description: Optional[str] = Field(default=None, max_length=500)


class VelocityPeriod(BaseModel):
    """A velocity period (sprint)."""

    period_start: str = Field(description="Period start date")
    period_end: str = Field(description="Period end date")
    points_completed: int = Field(ge=0, description="Points completed")
    hours_logged: float = Field(ge=0, description="Hours logged")


class TimeVelocityOutput(BaseModel):
    """Structured output for time-based velocity metrics."""

    current_velocity: float = Field(ge=0, description="Current velocity")
    avg_velocity: float = Field(ge=0, description="Average velocity")
    avg_hours_per_point: float = Field(ge=0, description="Average hours per point")
    periods: List[VelocityPeriod] = Field(
        default_factory=list, description="Velocity by period"
    )


class WeeklyVelocity(BaseModel):
    """Weekly velocity data point."""

    week_start: str = Field(description="Week start date")
    points_completed: int = Field(ge=0, description="Points completed")
    trend: VelocityTrend = Field(description="Trend vs previous week")


class TimeSuggestion(BaseModel):
    """A suggested time entry."""

    task_id: str = Field(description="Task ID")
    task_title: str = Field(max_length=500, description="Task title")
    suggested_hours: float = Field(ge=0.25, le=24, description="Suggested hours")
    reason: str = Field(max_length=500, description="Reason for suggestion")
    confidence: float = Field(ge=0.0, le=1.0, description="Suggestion confidence")


# ==============================================================================
# Error Output Model
# ==============================================================================


class AgentErrorOutput(BaseModel):
    """Structured error response when tool execution fails."""

    error: str = Field(description="Error type/code")
    message: str = Field(max_length=1000, description="Error message")
    status_code: Optional[int] = Field(default=None, description="HTTP status code if applicable")
    recoverable: bool = Field(default=True, description="Whether the error is recoverable")
