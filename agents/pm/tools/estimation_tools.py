"""
Estimation Tools - Tools for Oracle estimation agent
AI Business Hub - Project Management Module

Tools for task estimation, historical analysis, and accuracy tracking.
Uses structured Pydantic output models for type-safe responses.
"""

import logging
from typing import Optional, List, Union
import httpx
from agno.tools import tool
from pydantic import ValidationError

from .common import API_BASE_URL, get_auth_headers, AgentToolError
from .structured_outputs import (
    EstimationOutput,
    ConfidenceLevel,
    VelocityMetricsOutput,
    EstimationMetricsOutput,
    SimilarTaskRef,
    AgentErrorOutput,
)

logger = logging.getLogger(__name__)


@tool
def estimate_task(
    task_title: str,
    task_description: str,
    task_type: str,
    project_id: str,
    workspace_id: str,
) -> Union[EstimationOutput, AgentErrorOutput]:
    """
    Generate story point and hour estimates for a task.

    This is Oracle's primary tool. It analyzes the task and returns an estimate
    with confidence level and reasoning.

    Args:
        task_title: Task title
        task_description: Detailed task description
        task_type: Type of task (FEATURE, BUG, CHORE, RESEARCH, etc.)
        project_id: Project ID for historical context
        workspace_id: Workspace/tenant ID

    Returns:
        EstimationOutput with estimate details:
        - story_points: Fibonacci story points (1-21)
        - estimated_hours: Estimated hours
        - confidence_level: LOW | MEDIUM | HIGH
        - confidence_score: 0-1 confidence score
        - basis: Reasoning for the estimate
        - cold_start: Whether using cold-start defaults
        - similar_tasks: IDs of similar tasks used
        - complexity_factors: Factors affecting complexity

    Raises:
        AgentToolError: If API call fails
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/estimate"
        headers = get_auth_headers(workspace_id)
        payload = {
            "title": task_title,
            "description": task_description or "",
            "type": task_type,
            "projectId": project_id,
        }

        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            # Validate response with Pydantic
            return EstimationOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} estimating task: {e}")
        return AgentErrorOutput(
            error="ESTIMATION_FAILED",
            message=f"API request failed: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error estimating task: {e}")
        return AgentErrorOutput(
            error="ESTIMATION_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Estimation response validation failed: {e}")
        return AgentErrorOutput(
            error="ESTIMATION_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )


@tool
def get_similar_tasks(
    project_id: str,
    workspace_id: str,
    task_type: str,
    search_query: str,
    limit: int = 10,
) -> List[SimilarTaskRef]:
    """
    Find similar historical tasks for estimation reference.

    Use this to find completed tasks that are similar to the one being estimated.
    This helps improve estimation accuracy by learning from the past.

    Args:
        project_id: Project ID
        workspace_id: Workspace/tenant ID
        task_type: Type of task to search for (FEATURE, BUG, etc.)
        search_query: Search query (task title or description keywords)
        limit: Maximum number of tasks to return (default 10)

    Returns:
        List of SimilarTaskRef:
        - id: Task ID
        - title: Task title
        - story_points: Story points (if assigned)
        - estimated_hours: Estimated hours
        - actual_hours: Actual hours spent

    Note:
        Returns empty list if API call fails or no similar tasks found
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/similar"
        headers = get_auth_headers(workspace_id)
        payload = {
            "projectId": project_id,
            "taskType": task_type,
            "query": search_query,
            "limit": limit,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)

            if response.status_code == 404:
                return []

            response.raise_for_status()
            data = response.json()

            # Validate list of similar tasks
            if isinstance(data, list):
                return [SimilarTaskRef.model_validate(task) for task in data]
            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} getting similar tasks: {e}")
        return []
    except httpx.HTTPError as e:
        logger.error(f"Network error getting similar tasks: {e}")
        return []
    except ValidationError as e:
        logger.error(f"Similar tasks validation failed: {e}")
        return []


@tool
def calculate_velocity(
    project_id: str,
    workspace_id: str,
    sprint_count: int = 3,
) -> Union[VelocityMetricsOutput, AgentErrorOutput]:
    """
    Calculate team velocity for the project.

    Use this to understand the team's capacity and pace.
    Helps determine if estimates are realistic for sprint planning.

    Args:
        project_id: Project ID
        workspace_id: Workspace/tenant ID
        sprint_count: Number of recent sprints to analyze (default 3)

    Returns:
        VelocityMetricsOutput:
        - avg_points_per_sprint: Average points completed per sprint
        - avg_hours_per_sprint: Average hours logged per sprint
        - sprint_count: Number of sprints analyzed

    Raises:
        AgentToolError: If API call fails
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/velocity/{project_id}"
        headers = get_auth_headers(workspace_id)
        params = {"sprints": sprint_count}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)

            if response.status_code == 404:
                # Valid case - no sprint data yet
                return VelocityMetricsOutput(
                    avg_points_per_sprint=None,
                    avg_hours_per_sprint=None,
                    sprint_count=0,
                )

            response.raise_for_status()
            data = response.json()
            return VelocityMetricsOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} calculating velocity: {e}")
        return AgentErrorOutput(
            error="VELOCITY_CALCULATION_FAILED",
            message=f"API request failed: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error calculating velocity: {e}")
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
def get_estimation_metrics(
    project_id: str,
    workspace_id: str,
    task_type: Optional[str] = None,
) -> Union[EstimationMetricsOutput, AgentErrorOutput]:
    """
    Get historical estimation accuracy metrics.

    Use this to understand how accurate past estimates have been.
    Helps inform confidence levels and improve future estimates.

    Args:
        project_id: Project ID
        workspace_id: Workspace/tenant ID
        task_type: Optional task type to filter by

    Returns:
        EstimationMetricsOutput:
        - average_error: Average estimation error
        - average_accuracy: Average accuracy percentage
        - total_estimations: Total number of estimations made

    Raises:
        AgentToolError: If API call fails
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/metrics"
        headers = get_auth_headers(workspace_id)
        params = {"projectId": project_id}

        if task_type:
            params["taskType"] = task_type

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)

            if response.status_code == 404:
                # Valid case - no metrics yet
                return EstimationMetricsOutput(
                    average_error=None,
                    average_accuracy=None,
                    total_estimations=0,
                )

            response.raise_for_status()
            data = response.json()
            return EstimationMetricsOutput.model_validate(data)

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP {e.response.status_code} getting estimation metrics: {e}")
        return AgentErrorOutput(
            error="METRICS_FETCH_FAILED",
            message=f"API request failed: HTTP {e.response.status_code}",
            status_code=e.response.status_code,
            recoverable=True,
        )
    except httpx.HTTPError as e:
        logger.error(f"Network error getting estimation metrics: {e}")
        return AgentErrorOutput(
            error="METRICS_NETWORK_ERROR",
            message=f"Network error: {str(e)}",
            recoverable=True,
        )
    except ValidationError as e:
        logger.error(f"Metrics response validation failed: {e}")
        return AgentErrorOutput(
            error="METRICS_VALIDATION_ERROR",
            message=f"Invalid response format: {str(e)}",
            recoverable=True,
        )
