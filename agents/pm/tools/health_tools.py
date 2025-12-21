"""
Health Monitoring Tools for Pulse Agent
AI Business Hub - Project Management Module

Tools for detecting risks, calculating health scores, and monitoring project health.
"""

from agno import tool
from typing import Dict, Any

from .common import api_request


@tool
def detect_risks(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
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
        Dict with detected risks:
        {
            "risks": [
                {
                    "type": "deadline_warning" | "blocker_chain" | "capacity_overload" | "velocity_drop",
                    "severity": "info" | "warning" | "critical",
                    "title": str,
                    "description": str,
                    "affectedTasks": [str],
                    "affectedUsers": [str]
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "POST",
        f"/api/pm/agents/health/{project_id}/detect-risks",
        workspace_id,
        fallback_data={"risks": []},
    )


@tool
def calculate_health_score(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
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
        Dict with health score:
        {
            "score": int (0-100),
            "level": "excellent" | "good" | "warning" | "critical",
            "trend": "improving" | "stable" | "declining",
            "factors": {
                "onTimeDelivery": float (0-1),
                "blockerImpact": float (0-1),
                "teamCapacity": float (0-1),
                "velocityTrend": float (0-1)
            },
            "explanation": str,
            "suggestions": [str]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "POST",
        f"/api/pm/agents/health/{project_id}/calculate-score",
        workspace_id,
        fallback_data={
            "score": 50,
            "level": "warning",
            "trend": "stable",
        },
    )


@tool
def check_team_capacity(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
    """
    Check if any team members are overloaded.

    Overload threshold: >40 hours assigned this week

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with capacity info:
        {
            "overloadedMembers": [
                {
                    "userId": str,
                    "userName": str,
                    "assignedHours": float,
                    "threshold": 40,
                    "overloadPercent": float
                }
            ],
            "teamHealth": "healthy" | "at_capacity" | "overloaded"
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "GET",
        f"/api/pm/agents/health/{project_id}/team-capacity",
        workspace_id,
        fallback_data={
            "overloadedMembers": [],
            "teamHealth": "healthy",
        },
    )


@tool
def analyze_velocity(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
    """
    Analyze project velocity vs baseline.

    Compares current velocity (last week) to 4-week baseline.
    Velocity drop alert: >30% below baseline

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with velocity analysis:
        {
            "currentVelocity": float,
            "baselineVelocity": float,
            "changePercent": float,
            "trend": "up" | "stable" | "down",
            "alert": bool (true if >30% drop)
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "GET",
        f"/api/pm/agents/health/{project_id}/velocity",
        workspace_id,
        fallback_data={
            "currentVelocity": 0,
            "baselineVelocity": 0,
            "trend": "stable",
            "alert": False,
        },
    )


@tool
def detect_blocker_chains(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
    """
    Detect blocker chains (3+ tasks blocked by same dependency).

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with blocker chains:
        {
            "chains": [
                {
                    "blockerId": str,
                    "blockerTitle": str,
                    "blockedTasks": [
                        {
                            "id": str,
                            "title": str,
                            "assignee": str
                        }
                    ],
                    "severity": "warning" | "critical"
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "GET",
        f"/api/pm/agents/health/{project_id}/blocker-chains",
        workspace_id,
        fallback_data={"chains": []},
    )


@tool
def get_overdue_tasks(
    workspace_id: str,
    project_id: str
) -> Dict[str, Any]:
    """
    Get tasks that are overdue or due within 48 hours.

    Args:
        workspace_id: Workspace identifier
        project_id: Project to analyze

    Returns:
        Dict with overdue and upcoming tasks:
        {
            "overdue": [
                {
                    "id": str,
                    "title": str,
                    "dueDate": str,
                    "daysOverdue": int,
                    "assignee": str
                }
            ],
            "dueSoon": [
                {
                    "id": str,
                    "title": str,
                    "dueDate": str,
                    "hoursRemaining": float,
                    "assignee": str
                }
            ]
        }

    Raises:
        httpx.HTTPStatusError: If API request fails
    """
    return api_request(
        "GET",
        f"/api/pm/agents/health/{project_id}/overdue-tasks",
        workspace_id,
        fallback_data={
            "overdue": [],
            "dueSoon": [],
        },
    )
