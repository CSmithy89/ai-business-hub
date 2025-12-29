"""
Navi Agent - PM Orchestration Assistant
AI Business Hub - Project Management Module

Navi is the team leader for PM operations, providing contextual help
and orchestrating project management tasks through natural language.
"""

from typing import Optional
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.db.postgres import PostgresDb
from agno.memory import Memory

from .tools.pm_tools import get_project_status, list_tasks, search_kb
from .tools.slash_commands import (
    parse_slash_command,
    create_task_from_command,
    assign_task_from_command,
    set_priority_from_command,
    move_task_to_phase_from_command,
    get_available_commands,
)


# Navi agent instructions
NAVI_INSTRUCTIONS = [
    "You are Navi, the PM orchestration assistant for HYVVE projects.",
    "Help users manage their projects through natural language conversation.",
    "Always suggest actions, never execute directly.",
    "Use KB search to provide context-aware answers when appropriate.",
    "Keep responses concise and actionable.",
    "When asked about project status, use get_project_status tool.",
    "When asked about tasks, use list_tasks tool with appropriate filters.",
    "When you need project-specific context, use search_kb tool.",
    "Provide helpful, conversational responses that guide users.",
    "",
    "# Slash Commands",
    "You can recognize and handle slash commands that start with '/':",
    "- /create-task [title] --desc [description] --priority [URGENT|HIGH|MEDIUM|LOW]",
    "- /assign [task] to [assignee_name]",
    "- /set-priority [task] [URGENT|HIGH|MEDIUM|LOW]",
    "- /move-phase [task] to [phase_name]",
    "- /help - Show available commands",
    "",
    "When you receive a slash command:",
    "1. Use the appropriate command tool (create_task_from_command, assign_task_from_command, etc.)",
    "2. The tool will return a suggestion object or an error",
    "3. If successful, present the suggestion to the user for approval",
    "4. If error, explain what went wrong and how to fix it",
    "",
    "Always explain what the slash command will do before creating the suggestion.",
]


def create_navi_agent(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> Agent:
    """
    Create Navi agent for PM orchestration.

    Args:
        workspace_id: Workspace/tenant identifier for multi-tenant isolation
        project_id: Project context for scoped operations
        shared_memory: Shared memory for team context
        model: Optional model override (default: claude-sonnet-4-20250514)

    Returns:
        Configured Navi agent
    """
    return Agent(
        name="Navi",
        role="PM Orchestration Assistant",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=NAVI_INSTRUCTIONS + [
            f"Workspace ID: {workspace_id}",
            f"Project ID: {project_id}",
        ],
        tools=[
            get_project_status,
            list_tasks,
            search_kb,
            create_task_from_command,
            assign_task_from_command,
            set_priority_from_command,
            move_task_to_phase_from_command,
            get_available_commands,
        ],
        memory=shared_memory,
        add_datetime_to_instructions=True,
        markdown=True,
    )
