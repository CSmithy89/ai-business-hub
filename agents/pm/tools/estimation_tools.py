"""
Estimation Tools - Tools for Sage estimation agent
AI Business Hub - Project Management Module

Tools for task estimation, historical analysis, and accuracy tracking.
"""

import os
import logging
from typing import Optional, Dict, List, Any
import httpx
from agno.tools import tool

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")


@tool
def estimate_task(
    task_title: str,
    task_description: str,
    task_type: str,
    project_id: str,
    workspace_id: str,
) -> Dict[str, Any]:
    """
    Generate story point and hour estimates for a task.

    This is Sage's primary tool. It analyzes the task and returns an estimate
    with confidence level and reasoning.

    Args:
        task_title: Task title
        task_description: Detailed task description
        task_type: Type of task (FEATURE, BUG, CHORE, RESEARCH, etc.)
        project_id: Project ID for historical context
        workspace_id: Workspace/tenant ID

    Returns:
        Estimation with confidence level and reasoning
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/estimate"
        headers = {"x-workspace-id": workspace_id}
        payload = {
            "title": task_title,
            "description": task_description or "",
            "type": task_type,
            "projectId": project_id,
        }

        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    except httpx.HTTPError as e:
        logger.error(f"Failed to estimate task: {e}")
        # Return fallback estimate
        return {
            "storyPoints": 3,
            "estimatedHours": 8.0,
            "confidenceLevel": "low",
            "confidenceScore": 0.3,
            "basis": "Error occurred, using default estimate",
            "coldStart": True,
            "complexityFactors": ["Unable to analyze - using defaults"],
            "error": str(e),
        }


@tool
def get_similar_tasks(
    project_id: str,
    workspace_id: str,
    task_type: str,
    search_query: str,
    limit: int = 10,
) -> List[Dict[str, Any]]:
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
        List of similar completed tasks with estimates and actuals
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/similar"
        headers = {"x-workspace-id": workspace_id}
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
            return response.json()

    except httpx.HTTPError as e:
        logger.error(f"Failed to get similar tasks: {e}")
        return []


@tool
def calculate_velocity(
    project_id: str,
    workspace_id: str,
    sprint_count: int = 3,
) -> Dict[str, Any]:
    """
    Calculate team velocity for the project.

    Use this to understand the team's capacity and pace.
    Helps determine if estimates are realistic for sprint planning.

    Args:
        project_id: Project ID
        workspace_id: Workspace/tenant ID
        sprint_count: Number of recent sprints to analyze (default 3)

    Returns:
        Velocity metrics (points per sprint, hours per sprint)
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/velocity/{project_id}"
        headers = {"x-workspace-id": workspace_id}
        params = {"sprints": sprint_count}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)

            if response.status_code == 404:
                return {
                    "avgPointsPerSprint": None,
                    "avgHoursPerSprint": None,
                    "sprintCount": 0,
                }

            response.raise_for_status()
            return response.json()

    except httpx.HTTPError as e:
        logger.error(f"Failed to calculate velocity: {e}")
        return {
            "avgPointsPerSprint": None,
            "avgHoursPerSprint": None,
            "sprintCount": 0,
            "error": str(e),
        }


@tool
def get_estimation_metrics(
    project_id: str,
    workspace_id: str,
    task_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get historical estimation accuracy metrics.

    Use this to understand how accurate past estimates have been.
    Helps inform confidence levels and improve future estimates.

    Args:
        project_id: Project ID
        workspace_id: Workspace/tenant ID
        task_type: Optional task type to filter by

    Returns:
        Accuracy metrics (average error, accuracy percentage)
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/estimation/metrics"
        headers = {"x-workspace-id": workspace_id}
        params = {"projectId": project_id}

        if task_type:
            params["taskType"] = task_type

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)

            if response.status_code == 404:
                return {
                    "averageError": None,
                    "averageAccuracy": None,
                    "totalEstimations": 0,
                }

            response.raise_for_status()
            return response.json()

    except httpx.HTTPError as e:
        logger.error(f"Failed to get estimation metrics: {e}")
        return {
            "averageError": None,
            "averageAccuracy": None,
            "totalEstimations": 0,
            "error": str(e),
        }
