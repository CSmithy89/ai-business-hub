"""
Navi Agent - PM Orchestration Assistant
AI Business Hub - Project Management Module

Navi is the team leader for PM operations, providing contextual help
and orchestrating project management tasks through natural language.
"""

from typing import Optional
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from agno.memory import Memory

from .tools.pm_tools import get_project_status, list_tasks, search_kb


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
        ],
        memory=shared_memory,
        add_datetime_to_instructions=True,
        markdown=True,
    )
