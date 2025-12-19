"""
Time Tracking Tools for Chrono Agent
AI Business Hub - Project Management Module

Tools for starting/stopping timers, logging time, and getting time entries.
"""

import logging
from typing import Optional, List, Dict, Any
import httpx
from agno.tools import tool

from .common import API_BASE_URL, get_auth_headers

logger = logging.getLogger(__name__)


@tool
def start_timer(
    task_id: str,
    workspace_id: str,
    description: Optional[str] = None
) -> Dict[str, Any]:
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
        url = f"{API_BASE_URL}/api/pm/agents/time/start"
        headers = get_auth_headers(workspace_id)
        payload = {
            "taskId": task_id,
            "workspaceId": workspace_id,
            "description": description,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} starting timer: {e}")
        return {
            "error": f"Failed to start timer (HTTP {e.response.status_code})",
            "message": "Please try again.",
            "statusCode": e.response.status_code,
        }
    except httpx.HTTPError as e:
        logger.error(f"Network error starting timer: {e}")
        return {
            "error": "Network error",
            "message": "Failed to start timer. Please try again.",
        }


@tool
def stop_timer(
    task_id: str,
    workspace_id: str,
) -> Dict[str, Any]:
    """
    Stop the active timer for a task.

    Args:
        task_id: Task ID with active timer
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        Completed time entry with calculated duration
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/stop"
        headers = get_auth_headers(workspace_id)
        payload = {
            "taskId": task_id,
            "workspaceId": workspace_id,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} stopping timer: {e}")
        return {
            "error": f"Failed to stop timer (HTTP {e.response.status_code})",
            "message": "No active timer found or request failed.",
            "statusCode": e.response.status_code,
        }
    except httpx.HTTPError as e:
        logger.error(f"Network error stopping timer: {e}")
        return {
            "error": "Network error",
            "message": "Failed to stop timer. No active timer found or request failed.",
        }


@tool
def log_time(
    task_id: str,
    workspace_id: str,
    hours: float,
    description: Optional[str] = None,
    date: Optional[str] = None,
) -> Dict[str, Any]:
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
        url = f"{API_BASE_URL}/api/pm/agents/time/log"
        headers = get_auth_headers(workspace_id)
        payload = {
            "taskId": task_id,
            "workspaceId": workspace_id,
            "hours": hours,
            "description": description,
            "date": date,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} logging time: {e}")
        return {
            "error": f"Failed to log time (HTTP {e.response.status_code})",
            "message": "Minimum time is 0.25 hours (15 minutes).",
            "statusCode": e.response.status_code,
        }
    except httpx.HTTPError as e:
        logger.error(f"Network error logging time: {e}")
        return {
            "error": "Network error",
            "message": "Failed to log time. Minimum time is 0.25 hours (15 minutes).",
        }


@tool
def get_time_entries(
    task_id: str,
    workspace_id: str,
) -> List[Dict[str, Any]]:
    """
    Get all time entries for a task.

    Args:
        task_id: Task ID to get entries for
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        List of time entries with user, duration, description, and timestamps
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/entries/{task_id}"
        headers = get_auth_headers(workspace_id)

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching time entries: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching time entries: {e}")
        return []


@tool
def get_active_timers(
    workspace_id: str,
    project_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Get all active timers for the workspace or project.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Optional project ID to filter by

    Returns:
        List of active timers with task details and elapsed time
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/active"
        headers = get_auth_headers(workspace_id)
        params = {}
        if project_id:
            params["projectId"] = project_id

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching active timers: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching active timers: {e}")
        return []


@tool
def suggest_time_entries(
    workspace_id: str,
    project_id: str,
    user_id: str,
) -> List[Dict[str, Any]]:
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
        url = f"{API_BASE_URL}/api/pm/agents/time/suggest"
        headers = get_auth_headers(workspace_id)
        payload = {
            "workspaceId": workspace_id,
            "projectId": project_id,
            "userId": user_id,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching time suggestions: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching time suggestions: {e}")
        return []


@tool
def get_velocity(
    project_id: str,
    workspace_id: str,
    periods: int = 6,
) -> Dict[str, Any]:
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
        url = f"{API_BASE_URL}/api/pm/agents/time/velocity/{project_id}"
        headers = get_auth_headers(workspace_id)
        params = {"periods": periods}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching velocity: {e}")
        return {
            "currentVelocity": 0,
            "avgVelocity": 0,
            "avgHoursPerPoint": 0,
            "periods": [],
            "error": f"HTTP {e.response.status_code}",
        }
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching velocity: {e}")
        return {
            "currentVelocity": 0,
            "avgVelocity": 0,
            "avgHoursPerPoint": 0,
            "periods": [],
            "error": "Network error",
        }


@tool
def get_velocity_trend(
    project_id: str,
    workspace_id: str,
    weeks: int = 12,
) -> List[Dict[str, Any]]:
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
        url = f"{API_BASE_URL}/api/pm/agents/time/velocity/{project_id}/trends"
        headers = get_auth_headers(workspace_id)
        params = {"weeks": weeks}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching velocity trends: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching velocity trends: {e}")
        return []
