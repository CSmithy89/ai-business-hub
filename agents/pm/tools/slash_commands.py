"""
Slash Command Parser - Tools for handling chat slash commands
AI Business Hub - Project Management Module

Parses and handles slash commands from Navi chat interface.
"""

import os
import logging
import re
from typing import Dict, Any, Optional
import httpx
from agno.tools import tool

logger = logging.getLogger(__name__)

# Get API base URL from environment
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")


# Available slash commands mapping
AVAILABLE_COMMANDS = {
    "create-task": "Create a new task",
    "assign": "Assign a task to a team member",
    "set-priority": "Set priority for a task",
    "move-phase": "Move task to a different phase",
    "help": "Show available commands",
}


def parse_slash_command(message: str) -> Dict[str, Any]:
    """
    Parse slash command from message.

    Args:
        message: User message to parse

    Returns:
        Dictionary with:
        - is_command: bool - Whether message is a slash command
        - command: str - Command name (if is_command)
        - args: str - Command arguments (if is_command)
        - raw_message: str - Original message
    """
    if not message.startswith("/"):
        return {"is_command": False, "raw_message": message}

    parts = message[1:].split(" ", 1)
    command = parts[0].lower()
    args = parts[1] if len(parts) > 1 else ""

    return {
        "is_command": True,
        "command": command,
        "args": args,
        "raw_message": message,
    }


@tool
def create_task_from_command(
    args: str, project_id: str, workspace_id: str
) -> Dict[str, Any]:
    """
    Create a task from slash command.

    Command format: /create-task [title] --desc [description] --priority [priority]

    Example: /create-task API Review --desc Review the new API endpoints --priority HIGH

    Args:
        args: Command arguments
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier

    Returns:
        Suggestion object for task creation
    """
    # Parse title (everything before first --)
    title_match = re.match(r"^([^-]+)", args)
    title = title_match.group(1).strip() if title_match else args.strip()

    # Parse flags
    description = None
    priority = "MEDIUM"

    desc_match = re.search(r"--desc\s+([^-]+)", args)
    if desc_match:
        description = desc_match.group(1).strip()

    priority_match = re.search(r"--priority\s+(\w+)", args, re.IGNORECASE)
    if priority_match:
        priority = priority_match.group(1).upper()

    # Validate priority
    valid_priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
    if priority not in valid_priorities:
        priority = "MEDIUM"

    # Create suggestion for task creation
    suggestion = {
        "action": "CREATE_TASK",
        "payload": {
            "title": title,
            "description": description,
            "priority": priority,
            "projectId": project_id,
        },
        "confidence": 0.85,  # High confidence for explicit commands
        "reasoning": f"User requested task creation via slash command: {title}",
    }

    return suggestion


@tool
def assign_task_from_command(
    args: str, project_id: str, workspace_id: str
) -> Dict[str, Any]:
    """
    Assign a task from slash command.

    Command format: /assign [task_id or task_title] to [assignee_name]

    Example: /assign API-123 to John
    Example: /assign "API Review" to Jane

    Args:
        args: Command arguments
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier

    Returns:
        Suggestion object for task assignment or error
    """
    # Parse: [task] to [assignee]
    match = re.match(r"^(.+?)\s+to\s+(.+)$", args, re.IGNORECASE)
    if not match:
        return {
            "error": "Invalid format. Use: /assign [task] to [assignee]",
            "suggestion": "Try: /assign TASK-123 to John",
        }

    task_identifier = match.group(1).strip().strip('"')
    assignee_name = match.group(2).strip()

    try:
        # Search for task by ID or title
        url = f"{API_BASE_URL}/api/pm/tasks"
        headers = {"x-workspace-id": workspace_id}
        params = {"projectId": project_id, "search": task_identifier, "limit": 1}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            tasks = response.json()

        if not tasks:
            return {
                "error": f"Task not found: {task_identifier}",
                "suggestion": "Make sure the task ID or title is correct",
            }

        task = tasks[0]

        # Search for user by name
        user_url = f"{API_BASE_URL}/api/users/search"
        user_params = {"query": assignee_name, "workspaceId": workspace_id}

        with httpx.Client(timeout=10.0) as client:
            user_response = client.get(user_url, headers=headers, params=user_params)
            user_response.raise_for_status()
            users = user_response.json()

        if not users:
            return {
                "error": f"User not found: {assignee_name}",
                "suggestion": "Check the user name spelling",
            }

        assignee = users[0]

        # Create suggestion for assignment
        suggestion = {
            "action": "ASSIGN_TASK",
            "payload": {
                "taskId": task["id"],
                "taskTitle": task["title"],
                "assigneeId": assignee["id"],
                "assigneeName": assignee["name"],
            },
            "confidence": 0.85,
            "reasoning": f"User requested assignment of {task['title']} to {assignee['name']} via slash command",
        }

        return suggestion

    except httpx.HTTPError as e:
        logger.error(f"Failed to process assign command: {e}")
        return {
            "error": "Failed to process assignment command",
            "details": str(e),
        }


@tool
def set_priority_from_command(
    args: str, project_id: str, workspace_id: str
) -> Dict[str, Any]:
    """
    Set task priority from slash command.

    Command format: /set-priority [task] [URGENT|HIGH|MEDIUM|LOW]

    Example: /set-priority API-123 URGENT
    Example: /set-priority "API Review" HIGH

    Args:
        args: Command arguments
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier

    Returns:
        Suggestion object for priority change or error
    """
    # Parse: [task] [priority]
    match = re.match(r"^(.+?)\s+(URGENT|HIGH|MEDIUM|LOW)$", args, re.IGNORECASE)
    if not match:
        return {
            "error": "Invalid format. Use: /set-priority [task] [URGENT|HIGH|MEDIUM|LOW]",
            "suggestion": "Try: /set-priority TASK-123 HIGH",
        }

    task_identifier = match.group(1).strip().strip('"')
    priority = match.group(2).upper()

    try:
        # Search for task
        url = f"{API_BASE_URL}/api/pm/tasks"
        headers = {"x-workspace-id": workspace_id}
        params = {"projectId": project_id, "search": task_identifier, "limit": 1}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            tasks = response.json()

        if not tasks:
            return {
                "error": f"Task not found: {task_identifier}",
                "suggestion": "Make sure the task ID or title is correct",
            }

        task = tasks[0]

        # Create suggestion for priority change
        suggestion = {
            "action": "SET_PRIORITY",
            "payload": {
                "taskId": task["id"],
                "taskTitle": task["title"],
                "priority": priority,
                "currentPriority": task.get("priority", "MEDIUM"),
            },
            "confidence": 0.9,
            "reasoning": f"User requested priority change for {task['title']} to {priority} via slash command",
        }

        return suggestion

    except httpx.HTTPError as e:
        logger.error(f"Failed to process set-priority command: {e}")
        return {
            "error": "Failed to process priority command",
            "details": str(e),
        }


@tool
def move_task_to_phase_from_command(
    args: str, project_id: str, workspace_id: str
) -> Dict[str, Any]:
    """
    Move task to a different phase from slash command.

    Command format: /move-phase [task] to [phase_name]

    Example: /move-phase API-123 to In Progress
    Example: /move-phase "API Review" to Done

    Args:
        args: Command arguments
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier

    Returns:
        Suggestion object for phase move or error
    """
    # Parse: [task] to [phase]
    match = re.match(r"^(.+?)\s+to\s+(.+)$", args, re.IGNORECASE)
    if not match:
        return {
            "error": "Invalid format. Use: /move-phase [task] to [phase]",
            "suggestion": "Try: /move-phase TASK-123 to In Progress",
        }

    task_identifier = match.group(1).strip().strip('"')
    phase_name = match.group(2).strip()

    try:
        # Search for task
        task_url = f"{API_BASE_URL}/api/pm/tasks"
        headers = {"x-workspace-id": workspace_id}
        task_params = {"projectId": project_id, "search": task_identifier, "limit": 1}

        with httpx.Client(timeout=10.0) as client:
            response = client.get(task_url, headers=headers, params=task_params)
            response.raise_for_status()
            tasks = response.json()

        if not tasks:
            return {
                "error": f"Task not found: {task_identifier}",
                "suggestion": "Make sure the task ID or title is correct",
            }

        task = tasks[0]

        # Search for phase
        phase_url = f"{API_BASE_URL}/api/pm/phases"
        phase_params = {"projectId": project_id}

        with httpx.Client(timeout=10.0) as client:
            phase_response = client.get(phase_url, headers=headers, params=phase_params)
            phase_response.raise_for_status()
            phases = phase_response.json()

        # Find matching phase
        matching_phase = None
        for phase in phases:
            if phase_name.lower() in phase.get("name", "").lower():
                matching_phase = phase
                break

        if not matching_phase:
            available_phases = ", ".join([p.get("name", "") for p in phases])
            return {
                "error": f"Phase not found: {phase_name}",
                "suggestion": f"Available phases: {available_phases}",
            }

        # Create suggestion for phase move
        suggestion = {
            "action": "MOVE_TASK_PHASE",
            "payload": {
                "taskId": task["id"],
                "taskTitle": task["title"],
                "phaseId": matching_phase["id"],
                "phaseName": matching_phase["name"],
                "currentPhaseId": task.get("phaseId"),
            },
            "confidence": 0.85,
            "reasoning": f"User requested to move {task['title']} to {matching_phase['name']} phase via slash command",
        }

        return suggestion

    except httpx.HTTPError as e:
        logger.error(f"Failed to process move-phase command: {e}")
        return {
            "error": "Failed to process phase move command",
            "details": str(e),
        }


@tool
def get_available_commands() -> Dict[str, str]:
    """
    Get list of available slash commands.

    Returns:
        Dictionary mapping command names to descriptions
    """
    return AVAILABLE_COMMANDS
