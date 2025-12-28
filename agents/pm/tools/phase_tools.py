"""
Phase Tools - Tools for Scope PM agent
AI Business Hub - Project Management Module

Tools for phase management, transition analysis, and checkpoint tracking.
Uses structured Pydantic output models for type-safe responses.
"""

import logging
from typing import Optional, List, Union

from agno.tools import tool

from .common import api_request, api_request_strict, AgentToolError
from .structured_outputs import (
    PhaseAnalysisOutput,
    PhaseAnalysisSummary,
    IncompleteTask,
    TaskRecommendation,
    TaskAction,
    PhaseCheckpointOutput,
    PhaseTransitionOutput,
    PhaseTransitionPreview,
    AgentErrorOutput,
)

logger = logging.getLogger(__name__)


@tool
def analyze_phase_completion(
    project_id: str,
    phase_id: str,
    workspace_id: str
) -> Union[PhaseAnalysisOutput, AgentErrorOutput]:
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
        PhaseAnalysisOutput: Phase completion analysis with task recommendations
        - phase_id: The analyzed phase ID
        - phase_name: Phase name
        - total_tasks: Total tasks in phase
        - completed_tasks: Completed tasks count
        - incomplete_tasks: List of incomplete tasks
        - recommendations: Task recommendations (complete/carry_over/cancel)
        - summary: Phase summary with readiness and blockers

    Raises:
        AgentToolError: If API call fails or response is invalid
    """
    try:
        return api_request_strict(
            "POST",
            f"/api/pm/phases/{phase_id}/analyze-completion",
            workspace_id,
            PhaseAnalysisOutput,
            json={"projectId": project_id},
        )
    except AgentToolError as e:
        logger.error(f"analyze_phase_completion failed: {e.message}")
        return AgentErrorOutput(
            error="PHASE_ANALYSIS_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def check_phase_checkpoint(
    phase_id: str,
    workspace_id: str
) -> Optional[List[PhaseCheckpointOutput]]:
    """
    Check if phase has upcoming checkpoints.

    Retrieves checkpoints that are coming up in the next 3 days for reminder purposes.
    Returns None if no upcoming checkpoints exist.

    Args:
        phase_id: ID of the phase
        workspace_id: Workspace/tenant identifier

    Returns:
        List of PhaseCheckpointOutput or None if no checkpoints found:
        - id: Checkpoint ID
        - name: Checkpoint name
        - checkpoint_date: Checkpoint date (ISO format)
        - status: "PENDING" | "COMPLETED" | "CANCELLED"
        - description: Optional description

    Note:
        Returns None for 404 (no checkpoints) - this is expected behavior
    """
    result = api_request(
        "GET",
        f"/api/pm/phases/{phase_id}/checkpoints/upcoming",
        workspace_id,
    )
    # Return None for 404 (no checkpoints found) or errors
    if isinstance(result, dict) and "error" in result:
        return None

    # Validate list of checkpoints
    try:
        if isinstance(result, list):
            return [PhaseCheckpointOutput.model_validate(cp) for cp in result]
        return None
    except Exception as e:
        logger.error(f"Checkpoint validation failed: {e}")
        return None


@tool
def suggest_phase_transition(
    phase_id: str,
    task_actions: List[dict],
    workspace_id: str
) -> Union[PhaseTransitionOutput, AgentErrorOutput]:
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
        PhaseTransitionOutput: Transition preview
        - phase_id: Current phase ID
        - phase_name: Current phase name
        - next_phase_id: Next phase ID (if exists)
        - next_phase_name: Next phase name
        - transition_preview: Details of tasks to complete/carry_over/cancel

    Raises:
        AgentToolError: If API call fails or response is invalid
    """
    try:
        return api_request_strict(
            "POST",
            f"/api/pm/phases/{phase_id}/transition-preview",
            workspace_id,
            PhaseTransitionOutput,
            json={"taskActions": task_actions},
        )
    except AgentToolError as e:
        logger.error(f"suggest_phase_transition failed: {e.message}")
        return AgentErrorOutput(
            error="TRANSITION_PREVIEW_FAILED",
            message=e.message,
            status_code=e.status_code,
            recoverable=True,
        )


@tool
def recommend_task_actions(
    phase_id: str,
    task_ids: List[str],
    workspace_id: str
) -> List[TaskRecommendation]:
    """
    Get recommended actions (complete/carry/cancel) for incomplete tasks.

    Analyzes a list of incomplete tasks and provides action recommendations for each.
    This is useful for batch processing multiple tasks during phase transition.

    Args:
        phase_id: ID of the phase containing the tasks
        task_ids: List of task IDs to get recommendations for
        workspace_id: Workspace/tenant identifier

    Returns:
        List of TaskRecommendation:
        - task_id: Task identifier
        - action: "complete" | "carry_over" | "cancel"
        - reason: Reasoning for this recommendation

    Note:
        Returns empty list if API call fails - allows graceful degradation
    """
    result = api_request(
        "POST",
        f"/api/pm/phases/{phase_id}/recommend-actions",
        workspace_id,
        json={"taskIds": task_ids},
    )
    # Return empty list if error occurred
    if isinstance(result, dict) and "error" in result:
        logger.warning(f"recommend_task_actions returned error: {result.get('error')}")
        return []

    # Validate list of recommendations
    try:
        if isinstance(result, list):
            return [TaskRecommendation.model_validate(rec) for rec in result]
        return []
    except Exception as e:
        logger.error(f"Task recommendation validation failed: {e}")
        return []
