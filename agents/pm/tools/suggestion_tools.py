"""
Suggestion Tools - Tools for Navi to create suggestions
AI Business Hub - Project Management Module

Tools for creating AI-generated suggestions that users can accept/reject.
"""

import os
import logging
from typing import Optional, Dict, Any
import httpx
from agno.tools import tool

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")


@tool
def create_task_suggestion(
    workspace_id: str,
    project_id: str,
    user_id: str,
    agent_name: str,
    title: str,
    reasoning: str,
    confidence: float,
    description: Optional[str] = None,
    phase_id: Optional[str] = None,
    priority: str = "MEDIUM",
    assignee_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Suggest creating a new task.

    Args:
        workspace_id: Workspace identifier
        project_id: Project identifier
        user_id: User ID this suggestion is for
        agent_name: Agent name (e.g., 'navi')
        title: Task title
        reasoning: AI reasoning for this suggestion
        confidence: Confidence score (0-1)
        description: Optional task description
        phase_id: Optional phase ID
        priority: Task priority (LOW, MEDIUM, HIGH, URGENT)
        assignee_id: Optional assignee user ID

    Returns:
        Created suggestion object
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/suggestions"
        headers = {
            "x-workspace-id": workspace_id,
            "Content-Type": "application/json",
        }

        payload = {
            "workspaceId": workspace_id,
            "projectId": project_id,
            "userId": user_id,
            "agentName": agent_name,
            "suggestionType": "CREATE_TASK",
            "title": f"Create task: {title}",
            "description": description,
            "reasoning": reasoning,
            "confidence": confidence,
            "priority": "high" if priority == "URGENT" else "medium",
            "actionPayload": {
                "title": title,
                "description": description,
                "phaseId": phase_id,
                "priority": priority,
                "assigneeId": assignee_id,
            },
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to create task suggestion: {e}")
        return {"error": str(e)}


@tool
def assign_task_suggestion(
    workspace_id: str,
    project_id: str,
    user_id: str,
    agent_name: str,
    task_id: str,
    task_title: str,
    assignee_id: str,
    assignee_name: str,
    reasoning: str,
    confidence: float = 0.75,
) -> Dict[str, Any]:
    """
    Suggest assigning a task to a team member.

    Args:
        workspace_id: Workspace identifier
        project_id: Project identifier
        user_id: User ID this suggestion is for
        agent_name: Agent name (e.g., 'navi')
        task_id: Task ID to assign
        task_title: Task title (for display)
        assignee_id: User ID to assign to
        assignee_name: Assignee name (for display)
        reasoning: AI reasoning for this suggestion
        confidence: Confidence score (0-1)

    Returns:
        Created suggestion object
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/suggestions"
        headers = {
            "x-workspace-id": workspace_id,
            "Content-Type": "application/json",
        }

        payload = {
            "workspaceId": workspace_id,
            "projectId": project_id,
            "userId": user_id,
            "agentName": agent_name,
            "suggestionType": "ASSIGN_TASK",
            "title": f"Assign '{task_title}' to {assignee_name}",
            "reasoning": reasoning,
            "confidence": confidence,
            "actionPayload": {
                "taskId": task_id,
                "taskTitle": task_title,
                "assigneeId": assignee_id,
                "assigneeName": assignee_name,
            },
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to create assign task suggestion: {e}")
        return {"error": str(e)}


@tool
def set_priority_suggestion(
    workspace_id: str,
    project_id: str,
    user_id: str,
    agent_name: str,
    task_id: str,
    task_title: str,
    priority: str,
    current_priority: Optional[str],
    reasoning: str,
    confidence: float = 0.8,
) -> Dict[str, Any]:
    """
    Suggest changing task priority.

    Args:
        workspace_id: Workspace identifier
        project_id: Project identifier
        user_id: User ID this suggestion is for
        agent_name: Agent name (e.g., 'navi')
        task_id: Task ID to update
        task_title: Task title (for display)
        priority: New priority (LOW, MEDIUM, HIGH, URGENT)
        current_priority: Current priority (for display)
        reasoning: AI reasoning for this suggestion
        confidence: Confidence score (0-1)

    Returns:
        Created suggestion object
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/suggestions"
        headers = {
            "x-workspace-id": workspace_id,
            "Content-Type": "application/json",
        }

        payload = {
            "workspaceId": workspace_id,
            "projectId": project_id,
            "userId": user_id,
            "agentName": agent_name,
            "suggestionType": "SET_PRIORITY",
            "title": f"Set priority of '{task_title}' to {priority}",
            "reasoning": reasoning,
            "confidence": confidence,
            "priority": "high" if priority == "URGENT" else "medium",
            "actionPayload": {
                "taskId": task_id,
                "taskTitle": task_title,
                "priority": priority,
                "currentPriority": current_priority,
            },
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to create set priority suggestion: {e}")
        return {"error": str(e)}


@tool
def move_to_phase_suggestion(
    workspace_id: str,
    project_id: str,
    user_id: str,
    agent_name: str,
    task_id: str,
    task_title: str,
    phase_id: str,
    phase_name: str,
    current_phase_id: Optional[str],
    reasoning: str,
    confidence: float = 0.7,
) -> Dict[str, Any]:
    """
    Suggest moving a task to a different phase.

    Args:
        workspace_id: Workspace identifier
        project_id: Project identifier
        user_id: User ID this suggestion is for
        agent_name: Agent name (e.g., 'navi')
        task_id: Task ID to move
        task_title: Task title (for display)
        phase_id: Target phase ID
        phase_name: Target phase name (for display)
        current_phase_id: Current phase ID
        reasoning: AI reasoning for this suggestion
        confidence: Confidence score (0-1)

    Returns:
        Created suggestion object
    """
    try:
        url = f"{API_BASE_URL}/api/pm/agents/suggestions"
        headers = {
            "x-workspace-id": workspace_id,
            "Content-Type": "application/json",
        }

        payload = {
            "workspaceId": workspace_id,
            "projectId": project_id,
            "userId": user_id,
            "agentName": agent_name,
            "suggestionType": "MOVE_PHASE",
            "title": f"Move '{task_title}' to {phase_name}",
            "reasoning": reasoning,
            "confidence": confidence,
            "actionPayload": {
                "taskId": task_id,
                "taskTitle": task_title,
                "phaseId": phase_id,
                "phaseName": phase_name,
                "currentPhaseId": current_phase_id,
            },
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        logger.error(f"Failed to create move to phase suggestion: {e}")
        return {"error": str(e)}


@tool
def get_project_context(
    workspace_id: str,
    project_id: str,
) -> Dict[str, Any]:
    """
    Get comprehensive project context for generating suggestions.

    Includes tasks, phases, team members, and project settings.

    Args:
        workspace_id: Workspace identifier
        project_id: Project identifier

    Returns:
        Project context data
    """
    try:
        url = f"{API_BASE_URL}/api/pm/projects/{project_id}"
        headers = {"x-workspace-id": workspace_id}

        with httpx.Client(timeout=10.0) as client:
            # Get project details
            response = client.get(url, headers=headers)
            response.raise_for_status()
            project = response.json()

            # Get tasks
            tasks_url = f"{API_BASE_URL}/api/pm/tasks"
            tasks_response = client.get(
                tasks_url,
                headers=headers,
                params={"projectId": project_id, "limit": 100},
            )
            tasks = tasks_response.json() if tasks_response.status_code == 200 else []

            # Get phases
            phases_url = f"{API_BASE_URL}/api/pm/phases"
            phases_response = client.get(
                phases_url,
                headers=headers,
                params={"projectId": project_id},
            )
            phases = phases_response.json() if phases_response.status_code == 200 else []

            return {
                "project": project,
                "tasks": tasks,
                "phases": phases,
            }
    except httpx.HTTPError as e:
        logger.error(f"Failed to get project context: {e}")
        return {"error": str(e)}
