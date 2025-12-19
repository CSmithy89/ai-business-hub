"""
Time Tracking Tools for Chrono Agent
AI Business Hub - Project Management Module

Tools for starting/stopping timers, logging time, and getting time entries.
"""

import os
import requests
from typing import Optional, List
from agno import tool


API_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')


@tool
def start_timer(
    task_id: str,
    workspace_id: str,
    description: Optional[str] = None
) -> dict:
    """
    Start a timer for a task.

    Args:
        task_id: Task ID to track time for
        workspace_id: Workspace ID for multi-tenant scoping
        description: Optional description of what you're working on

    Returns:
        Active timer details with start time
    """
    try:
        response = requests.post(
            f"{API_URL}/api/pm/agents/time/start",
            json={
                'taskId': task_id,
                'workspaceId': workspace_id,
                'description': description,
            },
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'error': str(e),
            'message': 'Failed to start timer. Please try again.',
        }


@tool
def stop_timer(
    task_id: str,
    workspace_id: str,
) -> dict:
    """
    Stop the active timer for a task.

    Args:
        task_id: Task ID with active timer
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        Completed time entry with calculated duration
    """
    try:
        response = requests.post(
            f"{API_URL}/api/pm/agents/time/stop",
            json={
                'taskId': task_id,
                'workspaceId': workspace_id,
            },
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'error': str(e),
            'message': 'Failed to stop timer. No active timer found or request failed.',
        }


@tool
def log_time(
    task_id: str,
    workspace_id: str,
    hours: float,
    description: Optional[str] = None,
    date: Optional[str] = None,
) -> dict:
    """
    Log time manually for a task.

    Args:
        task_id: Task ID to log time for
        workspace_id: Workspace ID for multi-tenant scoping
        hours: Hours to log (minimum 0.25h)
        description: Optional description of work done
        date: Optional date for the entry (ISO format YYYY-MM-DD, defaults to today)

    Returns:
        Created time entry
    """
    try:
        response = requests.post(
            f"{API_URL}/api/pm/agents/time/log",
            json={
                'taskId': task_id,
                'workspaceId': workspace_id,
                'hours': hours,
                'description': description,
                'date': date,
            },
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            'error': str(e),
            'message': 'Failed to log time. Minimum time is 0.25 hours (15 minutes).',
        }


@tool
def get_time_entries(
    task_id: str,
    workspace_id: str,
) -> List[dict]:
    """
    Get all time entries for a task.

    Args:
        task_id: Task ID to get entries for
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        List of time entries with user, duration, description, and timestamps
    """
    try:
        response = requests.get(
            f"{API_URL}/api/pm/agents/time/entries/{task_id}",
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching time entries: {e}")
        return []


@tool
def get_active_timers(
    workspace_id: str,
    project_id: Optional[str] = None,
) -> List[dict]:
    """
    Get all active timers for the workspace or project.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Optional project ID to filter by

    Returns:
        List of active timers with task details and elapsed time
    """
    try:
        params = {}
        if project_id:
            params['projectId'] = project_id

        response = requests.get(
            f"{API_URL}/api/pm/agents/time/active",
            params=params,
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching active timers: {e}")
        return []


@tool
def suggest_time_entries(
    workspace_id: str,
    project_id: str,
    user_id: str,
) -> List[dict]:
    """
    Get AI suggestions for time entries based on activity.

    Analyzes recent task activities to identify work that may not have time logged.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Project ID to analyze
        user_id: User ID to analyze activity for

    Returns:
        List of suggested time entries with task info, suggested hours, and reasoning
    """
    try:
        response = requests.post(
            f"{API_URL}/api/pm/agents/time/suggest",
            json={
                'workspaceId': workspace_id,
                'projectId': project_id,
                'userId': user_id,
            },
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching time suggestions: {e}")
        return []


@tool
def get_velocity(
    project_id: str,
    workspace_id: str,
    periods: int = 6,
) -> dict:
    """
    Get project velocity metrics over sprint periods.

    Calculates team velocity based on completed story points over 2-week sprint periods.
    Provides current velocity, average velocity, and hours per story point metrics.

    Args:
        project_id: Project ID to calculate velocity for
        workspace_id: Workspace ID for multi-tenant scoping
        periods: Number of 2-week sprint periods to analyze (default 6 = 12 weeks)

    Returns:
        Velocity metrics with current velocity, average, hours per point, and period details
    """
    try:
        response = requests.get(
            f"{API_URL}/api/pm/agents/time/velocity/{project_id}",
            params={'periods': periods},
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching velocity: {e}")
        return {
            'currentVelocity': 0,
            'avgVelocity': 0,
            'avgHoursPerPoint': 0,
            'periods': [],
        }


@tool
def get_velocity_trend(
    project_id: str,
    workspace_id: str,
    weeks: int = 12,
) -> List[dict]:
    """
    Get weekly velocity trends for a project.

    Analyzes story points completed each week over time to show velocity trends.
    Trends indicate whether velocity is going up, down, or staying stable.

    Args:
        project_id: Project ID to get trends for
        workspace_id: Workspace ID for multi-tenant scoping
        weeks: Number of weeks to analyze (default 12)

    Returns:
        List of weekly velocity data showing points completed and trend direction
    """
    try:
        response = requests.get(
            f"{API_URL}/api/pm/agents/time/velocity/{project_id}/trends",
            params={'weeks': weeks},
            headers={'X-Workspace-ID': workspace_id},
            timeout=10,
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching velocity trends: {e}")
        return []
