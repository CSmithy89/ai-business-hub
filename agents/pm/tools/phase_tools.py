"""
Phase Tools - Tools for Scope PM agent
AI Business Hub - Project Management Module

Tools for phase management, transition analysis, and checkpoint tracking.
"""

import logging
from typing import Optional, Dict, List, Any

from agno.tools import tool

from .common import api_request

logger = logging.getLogger(__name__)


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
    return api_request(
        "POST",
        f"/api/pm/phases/{phase_id}/analyze-completion",
        workspace_id,
        json={"projectId": project_id},
        fallback_data={
            "error": "Failed to analyze phase",
        },
    )


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
    result = api_request(
        "GET",
        f"/api/pm/phases/{phase_id}/checkpoints/upcoming",
        workspace_id,
    )
    # Return None for 404 (no checkpoints found) or errors
    if "error" in result:
        return None
    return result


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
    return api_request(
        "POST",
        f"/api/pm/phases/{phase_id}/transition-preview",
        workspace_id,
        json={"taskActions": task_actions},
        fallback_data={
            "error": "Failed to preview transition",
        },
    )


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
    result = api_request(
        "POST",
        f"/api/pm/phases/{phase_id}/recommend-actions",
        workspace_id,
        json={"taskIds": task_ids},
    )
    # Return empty list if error occurred
    if "error" in result:
        return []
    return result
