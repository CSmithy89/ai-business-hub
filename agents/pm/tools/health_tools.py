"""
Health Monitoring Tools for Vitals Agent
AI Business Hub - Project Management Module

Tools for detecting risks, calculating health scores, and monitoring project health.
Uses structured Pydantic output models for type-safe responses.
"""

import logging
from typing import Union

from agno import tool

from .common import api_request, api_request_strict, AgentToolError
from .structured_outputs import (
    HealthInsightOutput,
    HealthScoreFactors,
    HealthLevel,
    HealthTrend,
    RiskDetectionOutput,
    RiskEntry,
    TeamCapacityOutput,
    TeamCapacityMember,
    VelocityAnalysisOutput,
    VelocityTrend,
    BlockerChainsOutput,
    BlockerChain,
    OverdueTasksOutput,
    OverdueTask,
    DueSoonTask,
    AgentErrorOutput,
)

logger = logging.getLogger(__name__)


@tool
def detect_risks(
    workspace_id: str,
    project_id: str
) -> Union[RiskDetectionOutput, AgentErrorOutput]:
    """
    Detect all types of project risks.

    Scans for:
    - Tasks due in next 48 hours
    - Blocker chains (3+ tasks blocked by same issue)
    - Team members with >40h assigned this week
    - Velocity drop (30% below 4-week baseline)

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        RiskDetectionOutput with detected risks:
        - risks: List of RiskEntry containing:
          - type: "deadline_warning" | "blocker_chain" | "capacity_overload" | "velocity_drop"
          - severity: "info" | "warning" | "critical"
          - title: Risk title
          - description: Detailed description
          - affected_tasks: List of affected task IDs
          - affected_users: List of affected user IDs

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "POST",
            f"/api/pm/agents/health/{project_id}/detect-risks",
            workspace_id,
            RiskDetectionOutput,
        )
    except AgentToolError as e:
        logger.error(f"detect_risks failed: {e.message}")
        return AgentErrorOutput(
            error="RISK_DETECTION_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def calculate_health_score(
    workspace_id: str,
    project_id: str
) -> Union[HealthInsightOutput, AgentErrorOutput]:
    """
    Calculate project health score (0-100).

    Health factors:
    - On-time delivery (% tasks completed by due date)
    - Blocker impact (severity of blocking issues)
    - Team capacity (utilization health)
    - Velocity trend (vs 4-week baseline)

    Score levels:
    - 85-100: Excellent (green)
    - 70-84: Good (blue)
    - 50-69: Warning (yellow)
    - 0-49: Critical (red)

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        HealthInsightOutput with health analysis:
        - score: int (0-100)
        - level: EXCELLENT | GOOD | WARNING | CRITICAL
        - trend: IMPROVING | STABLE | DECLINING
        - factors: HealthScoreFactors breakdown
        - explanation: Human-readable explanation
        - suggestions: List of improvement suggestions

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "POST",
            f"/api/pm/agents/health/{project_id}/calculate-score",
            workspace_id,
            HealthInsightOutput,
        )
    except AgentToolError as e:
        logger.error(f"calculate_health_score failed: {e.message}")
        return AgentErrorOutput(
            error="HEALTH_SCORE_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def check_team_capacity(
    workspace_id: str,
    project_id: str
) -> Union[TeamCapacityOutput, AgentErrorOutput]:
    """
    Check if any team members are overloaded.

    Overload threshold: >40 hours assigned this week

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        TeamCapacityOutput with capacity info:
        - overloaded_members: List of overloaded TeamCapacityMember
          - user_id: User ID
          - user_name: User name (optional)
          - assigned_hours: Hours assigned
          - threshold: Capacity threshold (40)
          - overload_percent: Percentage over threshold
        - team_health: "healthy" | "at_capacity" | "overloaded"

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "GET",
            f"/api/pm/agents/health/{project_id}/team-capacity",
            workspace_id,
            TeamCapacityOutput,
        )
    except AgentToolError as e:
        logger.error(f"check_team_capacity failed: {e.message}")
        return AgentErrorOutput(
            error="TEAM_CAPACITY_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def analyze_velocity(
    workspace_id: str,
    project_id: str
) -> Union[VelocityAnalysisOutput, AgentErrorOutput]:
    """
    Analyze project velocity vs baseline.

    Compares current velocity (last week) to 4-week baseline.
    Velocity drop alert: >30% below baseline

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        VelocityAnalysisOutput with velocity analysis:
        - current_velocity: Current velocity
        - baseline_velocity: Baseline velocity
        - change_percent: Percentage change
        - trend: UP | STABLE | DOWN
        - alert: True if >30% drop detected

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "GET",
            f"/api/pm/agents/health/{project_id}/velocity",
            workspace_id,
            VelocityAnalysisOutput,
        )
    except AgentToolError as e:
        logger.error(f"analyze_velocity failed: {e.message}")
        return AgentErrorOutput(
            error="VELOCITY_ANALYSIS_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def detect_blocker_chains(
    workspace_id: str,
    project_id: str
) -> Union[BlockerChainsOutput, AgentErrorOutput]:
    """
    Detect blocker chains (3+ tasks blocked by same dependency).

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        BlockerChainsOutput with blocker chains:
        - chains: List of BlockerChain containing:
          - blocker_id: Blocking task ID
          - blocker_title: Blocking task title
          - blocked_tasks: List of blocked tasks
          - severity: "warning" | "critical"

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "GET",
            f"/api/pm/agents/health/{project_id}/blocker-chains",
            workspace_id,
            BlockerChainsOutput,
        )
    except AgentToolError as e:
        logger.error(f"detect_blocker_chains failed: {e.message}")
        return AgentErrorOutput(
            error="BLOCKER_CHAINS_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def get_overdue_tasks(
    workspace_id: str,
    project_id: str
) -> Union[OverdueTasksOutput, AgentErrorOutput]:
    """
    Get tasks that are overdue or due within 48 hours.

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        OverdueTasksOutput with overdue and upcoming tasks:
        - overdue: List of OverdueTask containing:
          - id: Task ID
          - title: Task title
          - due_date: Due date (ISO format)
          - days_overdue: Days overdue
          - assignee: Assignee ID
        - due_soon: List of DueSoonTask containing:
          - id: Task ID
          - title: Task title
          - due_date: Due date (ISO format)
          - hours_remaining: Hours until due
          - assignee: Assignee ID

    Raises:
        AgentToolError: If API request fails
    """
    try:
        return api_request_strict(
            "GET",
            f"/api/pm/agents/health/{project_id}/overdue-tasks",
            workspace_id,
            OverdueTasksOutput,
        )
    except AgentToolError as e:
        logger.error(f"get_overdue_tasks failed: {e.message}")
        return AgentErrorOutput(
            error="OVERDUE_TASKS_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )
