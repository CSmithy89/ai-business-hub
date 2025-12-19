"""
Phase Tools - Tools for Scope PM agent
AI Business Hub - Project Management Module

Tools for phase management, transition analysis, and checkpoint tracking.
"""

import os
import logging
from typing import Optional, Dict, List, Any
import httpx
from agno.tools import tool

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL")
if not API_BASE_URL:
    raise ValueError("API_BASE_URL environment variable must be set")

# Service token for agent-to-API calls (internal service auth)
AGENT_SERVICE_TOKEN = os.getenv("AGENT_SERVICE_TOKEN")


def get_auth_headers(workspace_id: str) -> Dict[str, str]:
    """Build headers for authenticated API calls.

    Args:
        workspace_id: Workspace/tenant identifier

    Returns:
        Dict with required headers including auth if available
    """
    headers = {"x-workspace-id": workspace_id}

    # Add service auth token if available (for internal agent calls)
    if AGENT_SERVICE_TOKEN:
        headers["Authorization"] = f"Bearer {AGENT_SERVICE_TOKEN}"
    else:
        logger.warning("AGENT_SERVICE_TOKEN not set - API calls may fail auth")

    return headers


@tool
def analyze_phase_completion(
    project_id: str,
    phase_id: str,
    workspace_id: str
) -> Dict[str, Any]:
    """
    Analyze phase for completion readiness and provide task recommendations.

    This tool analyzes a phase to determine if it's ready for completion. It examines
    all incomplete tasks and provides recommendations for each one: complete, carry over,
    or cancel. It also generates a summary with blockers and next phase preview.

    Args:
        project_id: ID of the project
        phase_id: ID of the phase to analyze
        workspace_id: Workspace/tenant identifier

    Returns:
        Phase completion analysis with task recommendations:
        {
            "phaseId": string,
            "phaseName": string,
            "totalTasks": number,
            "completedTasks": number,
            "incompleteTasks": [...],
            "recommendations": [...],
            "summary": {
                "readyForCompletion": boolean,
                "blockers": [...],
                "nextPhasePreview": string
            }
        }

    Raises:
        httpx.HTTPStatusError: If API call fails
    """
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{API_BASE_URL}/api/pm/phases/{phase_id}/analyze-completion",
                json={"projectId": project_id},
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to analyze phase completion: {e.response.text}")
        return {
            "error": f"Failed to analyze phase: {e.response.status_code}",
            "message": e.response.text
        }
    except Exception as e:
        logger.error(f"Error analyzing phase completion: {str(e)}")
        return {
            "error": "Failed to analyze phase",
            "message": str(e)
        }


@tool
def check_phase_checkpoint(
    phase_id: str,
    workspace_id: str
) -> Optional[Dict[str, Any]]:
    """
    Check if phase has upcoming checkpoints.

    Retrieves checkpoints that are coming up in the next 3 days for reminder purposes.
    Returns None if no upcoming checkpoints exist.

    Args:
        phase_id: ID of the phase
        workspace_id: Workspace/tenant identifier

    Returns:
        List of upcoming checkpoints or None if no checkpoints found:
        [
            {
                "id": string,
                "name": string,
                "checkpointDate": string (ISO),
                "status": "PENDING" | "COMPLETED" | "CANCELLED",
                "description": string (optional)
            }
        ]

    Raises:
        httpx.HTTPStatusError: If API call fails (except 404)
    """
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.get(
                f"{API_BASE_URL}/api/pm/phases/{phase_id}/checkpoints/upcoming",
                headers=get_auth_headers(workspace_id)
            )

            # Return None if no checkpoints found (404)
            if response.status_code == 404:
                return None

            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        logger.error(f"Failed to check phase checkpoint: {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Error checking phase checkpoint: {str(e)}")
        return None


@tool
def suggest_phase_transition(
    phase_id: str,
    task_actions: List[Dict[str, str]],
    workspace_id: str
) -> Dict[str, Any]:
    """
    Suggest phase transition with recommended task actions.

    This tool prepares a phase transition suggestion based on task action recommendations.
    It returns a preview of what will happen when the transition is executed, but does
    NOT execute the transition (human approval required).

    Args:
        phase_id: ID of the phase to transition
        task_actions: List of task action recommendations:
            [
                {
                    "taskId": string,
                    "action": "complete" | "carry_over" | "cancel",
                    "targetPhaseId": string (optional, for carry_over)
                }
            ]
        workspace_id: Workspace/tenant identifier

    Returns:
        Transition preview:
        {
            "phaseId": string,
            "phaseName": string,
            "nextPhaseId": string,
            "nextPhaseName": string,
            "transitionPreview": {
                "tasksToComplete": number,
                "tasksToCarryOver": number,
                "tasksToCancel": number,
                "affectedTasks": [...]
            }
        }

    Raises:
        httpx.HTTPStatusError: If API call fails
    """
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{API_BASE_URL}/api/pm/phases/{phase_id}/transition-preview",
                json={"taskActions": task_actions},
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to suggest phase transition: {e.response.text}")
        return {
            "error": f"Failed to preview transition: {e.response.status_code}",
            "message": e.response.text
        }
    except Exception as e:
        logger.error(f"Error suggesting phase transition: {str(e)}")
        return {
            "error": "Failed to preview transition",
            "message": str(e)
        }


@tool
def recommend_task_actions(
    phase_id: str,
    task_ids: List[str],
    workspace_id: str
) -> List[Dict[str, Any]]:
    """
    Get recommended actions (complete/carry/cancel) for incomplete tasks.

    Analyzes a list of incomplete tasks and provides action recommendations for each.
    This is useful for batch processing multiple tasks during phase transition.

    Args:
        phase_id: ID of the phase containing the tasks
        task_ids: List of task IDs to get recommendations for
        workspace_id: Workspace/tenant identifier

    Returns:
        List of task recommendations:
        [
            {
                "taskId": string,
                "taskTitle": string,
                "action": "complete" | "carry_over" | "cancel",
                "reasoning": string,
                "confidence": "low" | "medium" | "high"
            }
        ]

    Raises:
        httpx.HTTPStatusError: If API call fails
    """
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                f"{API_BASE_URL}/api/pm/phases/{phase_id}/recommend-actions",
                json={"taskIds": task_ids},
                headers=get_auth_headers(workspace_id)
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to recommend task actions: {e.response.text}")
        return []
    except Exception as e:
        logger.error(f"Error recommending task actions: {str(e)}")
        return []
