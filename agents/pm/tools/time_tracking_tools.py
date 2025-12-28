"""
Time Tracking Tools for Chrono Agent
AI Business Hub - Project Management Module

Tools for starting/stopping timers, logging time, and getting time entries.
Uses structured Pydantic output models for type-safe responses.
"""

import logging
from typing import Optional, List, Union
import httpx
from agno.tools import tool
from pydantic import ValidationError

from .common import API_BASE_URL, get_auth_headers, AgentToolError
from .structured_outputs import (
    TimeEntryOutput,
    ActiveTimerOutput,
    TimeVelocityOutput,
    VelocityPeriod,
    WeeklyVelocity,
    TimeSuggestion,
    VelocityTrend,
    AgentErrorOutput,
)

logger = logging.getLogger(__name__)


# Validation constants
MIN_HOURS = 0.25  # 15 minutes minimum
MAX_HOURS = 24.0  # 24 hours maximum per entry


@tool
def start_timer(
    task_id: str,
    workspace_id: str,
    description: Optional[str] = None
) -> Union[ActiveTimerOutput, AgentErrorOutput]:
    """
    Start a timer for a task.

    Args:
        task_id: Task ID to track time for
        workspace_id: Workspace ID for multi-tenant scoping
        description: Optional description of what you're working on

    Returns:
        ActiveTimerOutput with timer details:
        - id: Timer ID
        - task_id: Task ID
        - task_title: Task title
        - user_id: User ID
        - start_time: Timer start time (ISO format)
        - elapsed_seconds: Elapsed seconds
        - description: Timer description

    Raises:
        AgentToolError: If API call fails
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
            data = response.json()
            return ActiveTimerOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} starting timer: {e}")
        return AgentErrorOutput(
            error="TIMER_START_FAILED",
            message=f"Failed to start timer: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error starting timer: {e}")
        return AgentErrorOutput(
            error="TIMER_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Timer response validation failed: {e}")
        return AgentErrorOutput(
            error="TIMER_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )


@tool
def stop_timer(
    task_id: str,
    workspace_id: str,
) -> Union[TimeEntryOutput, AgentErrorOutput]:
    """
    Stop the active timer for a task.

    Args:
        task_id: Task ID with active timer
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        TimeEntryOutput with completed time entry:
        - id: Time entry ID
        - task_id: Task ID
        - user_id: User ID
        - hours: Hours logged
        - description: Entry description
        - date: Entry date
        - start_time: Start time
        - end_time: End time

    Raises:
        AgentToolError: If API call fails or no active timer
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
            data = response.json()
            return TimeEntryOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} stopping timer: {e}")
        return AgentErrorOutput(
            error="TIMER_STOP_FAILED",
            message=f"Failed to stop timer: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error stopping timer: {e}")
        return AgentErrorOutput(
            error="TIMER_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Timer stop response validation failed: {e}")
        return AgentErrorOutput(
            error="TIMER_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )


@tool
def log_time(
    task_id: str,
    workspace_id: str,
    hours: float,
    description: Optional[str] = None,
    date: Optional[str] = None,
) -> Union[TimeEntryOutput, AgentErrorOutput]:
    """
    Log time manually for a task.

    Args:
        task_id: Task ID to log time for
        workspace_id: Workspace ID for multi-tenant scoping
        hours: Hours to log (minimum 0.25h, maximum 24h)
        description: Optional description of work done
        date: Optional date for the entry (ISO format YYYY-MM-DD, defaults to today)

    Returns:
        TimeEntryOutput with created time entry:
        - id: Time entry ID
        - task_id: Task ID
        - user_id: User ID
        - hours: Hours logged
        - description: Entry description
        - date: Entry date

    Raises:
        AgentToolError: If API call fails or validation error
    """
    # Client-side validation for defense in depth
    if hours < MIN_HOURS:
        return AgentErrorOutput(
            error="INVALID_HOURS",
            message=f"Minimum time is {MIN_HOURS} hours (15 minutes).",
            recoverable=False,
        )
    if hours > MAX_HOURS:
        return AgentErrorOutput(
            error="INVALID_HOURS",
            message=f"Maximum time per entry is {MAX_HOURS} hours.",
            recoverable=False,
        )

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
            data = response.json()
            return TimeEntryOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} logging time: {e}")
        return AgentErrorOutput(
            error="TIME_LOG_FAILED",
            message=f"Failed to log time: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error logging time: {e}")
        return AgentErrorOutput(
            error="TIME_LOG_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Time log response validation failed: {e}")
        return AgentErrorOutput(
            error="TIME_LOG_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )


@tool
def get_time_entries(
    task_id: str,
    workspace_id: str,
) -> List[TimeEntryOutput]:
    """
    Get all time entries for a task.

    Args:
        task_id: Task ID to get entries for
        workspace_id: Workspace ID for multi-tenant scoping

    Returns:
        List of TimeEntryOutput with time entries:
        - id: Time entry ID
        - task_id: Task ID
        - user_id: User ID
        - hours: Hours logged
        - description: Entry description
        - date: Entry date
        - start_time: Start time (if timer-based)
        - end_time: End time (if timer-based)

    Note:
        Returns empty list if API call fails or no entries found
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/entries/{task_id}"
        headers = get_auth_headers(workspace_id)

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, list):
                return [TimeEntryOutput.model_validate(entry) for entry in data]
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching time entries: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching time entries: {e}")
        return []
    except ValidationError as e:
        logger.error(f"Time entries validation failed: {e}")
        return []


@tool
def get_active_timers(
    workspace_id: str,
    project_id: Optional[str] = None,
) -> List[ActiveTimerOutput]:
    """
    Get all active timers for the workspace or project.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Optional project ID to filter by

    Returns:
        List of ActiveTimerOutput with active timers:
        - id: Timer ID
        - task_id: Task ID
        - task_title: Task title
        - user_id: User ID
        - start_time: Timer start time
        - elapsed_seconds: Seconds elapsed
        - description: Timer description

    Note:
        Returns empty list if API call fails or no active timers
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
            data = response.json()

            if isinstance(data, list):
                return [ActiveTimerOutput.model_validate(timer) for timer in data]
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching active timers: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching active timers: {e}")
        return []
    except ValidationError as e:
        logger.error(f"Active timers validation failed: {e}")
        return []


@tool
def suggest_time_entries(
    workspace_id: str,
    project_id: str,
    user_id: str,
) -> List[TimeSuggestion]:
    """
    Get AI suggestions for time entries based on activity.

    Analyzes recent task activities to identify work that may not have time logged.

    Args:
        workspace_id: Workspace ID for multi-tenant scoping
        project_id: Project ID to analyze
        user_id: User ID to analyze activity for

    Returns:
        List of TimeSuggestion:
        - task_id: Task ID
        - task_title: Task title
        - suggested_hours: Suggested hours to log
        - reason: Reason for suggestion
        - confidence: Suggestion confidence (0-1)

    Note:
        Returns empty list if API call fails or no suggestions
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
            data = response.json()

            if isinstance(data, list):
                return [TimeSuggestion.model_validate(suggestion) for suggestion in data]
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching time suggestions: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching time suggestions: {e}")
        return []
    except ValidationError as e:
        logger.error(f"Time suggestions validation failed: {e}")
        return []


@tool
def get_velocity(
    project_id: str,
    workspace_id: str,
    periods: int = 6,
) -> Union[TimeVelocityOutput, AgentErrorOutput]:
    """
    Get project velocity metrics over sprint periods.

    Calculates team velocity based on completed story points over 2-week sprint periods.
    Provides current velocity, average velocity, and hours per story point metrics.

    Args:
        project_id: Project ID to calculate velocity for
        workspace_id: Workspace ID for multi-tenant scoping
        periods: Number of 2-week sprint periods to analyze (default 6 = 12 weeks)

    Returns:
        TimeVelocityOutput with velocity metrics:
        - current_velocity: Current sprint velocity
        - avg_velocity: Average velocity over periods
        - avg_hours_per_point: Average hours per story point
        - periods: List of VelocityPeriod with period details

    Raises:
        AgentToolError: If API call fails
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/velocity/{project_id}"
        headers = get_auth_headers(workspace_id)
        params = {"periods": periods}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            return TimeVelocityOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching velocity: {e}")
        return AgentErrorOutput(
            error="VELOCITY_FETCH_FAILED",
            message=f"Failed to fetch velocity: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching velocity: {e}")
        return AgentErrorOutput(
            error="VELOCITY_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Velocity response validation failed: {e}")
        return AgentErrorOutput(
            error="VELOCITY_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )


@tool
def get_velocity_trend(
    project_id: str,
    workspace_id: str,
    weeks: int = 12,
) -> List[WeeklyVelocity]:
    """
    Get weekly velocity trends for a project.

    Analyzes story points completed each week over time to show velocity trends.
    Trends indicate whether velocity is going up, down, or staying stable.

    Args:
        project_id: Project ID to get trends for
        workspace_id: Workspace ID for multi-tenant scoping
        weeks: Number of weeks to analyze (default 12)

    Returns:
        List of WeeklyVelocity:
        - week_start: Week start date
        - points_completed: Points completed that week
        - trend: UP | DOWN | STABLE

    Note:
        Returns empty list if API call fails or no trend data
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/time/velocity/{project_id}/trends"
        headers = get_auth_headers(workspace_id)
        params = {"weeks": weeks}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, list):
                return [WeeklyVelocity.model_validate(week) for week in data]
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} fetching velocity trends: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error fetching velocity trends: {e}")
        return []
    except ValidationError as e:
        logger.error(f"Velocity trends validation failed: {e}")
        return []
