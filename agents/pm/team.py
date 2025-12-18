"""
PM Team - Agno Team Configuration
AI Business Hub - Project Management Module

This module defines the Agno Team for project management,
coordinated by Navi as team leader.

Team Structure:
- Leader: Navi (PM Orchestration Assistant)
- Members: [] (Sage and Chrono added in later stories)

Usage:
    from agents.pm.team import create_pm_team

    team = create_pm_team(
        session_id="project_123_session",
        user_id="user_456",
        workspace_id="workspace_789",
        project_id="project_123"
    )
    response = team.run("What tasks are due today?")
"""

import os
from typing import Optional
from agno.team import Team
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from agno.memory import Memory

from .navi import create_navi_agent
from .sage import create_sage_agent


def get_postgres_url() -> str:
    """Get PostgreSQL connection URL from environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/hyvve"
    )


def create_pm_team(
    session_id: str,
    user_id: str,
    workspace_id: str,
    project_id: str,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
    """
    Create the PM Agent Team.

    Args:
        session_id: Unique session identifier for persistence
        user_id: User ID for multi-tenant isolation
        workspace_id: Workspace/tenant ID for data scoping
        project_id: Project context for operations
        model: Override model for all agents (default: claude-sonnet-4-20250514)
        debug_mode: Enable debug logging

    Returns:
        Configured Agno Team ready for PM tasks

    Example:
        team = create_pm_team(
            session_id="proj_123_session",
            user_id="user_456",
            workspace_id="ws_789",
            project_id="proj_123"
        )

        # Ask Navi a question
        response = team.run("What tasks are due today?")
    """
    # Create shared memory for team context
    # Each workspace gets its own memory table for isolation
    shared_memory = Memory(
        db=PostgresStorage(
            table_name=f"pm_agent_memory_{workspace_id}",
            schema="agent_memory",
            db_url=get_postgres_url(),
        ),
        namespace=f"project:{project_id}"
    )

    # Create Navi agent (team leader)
    navi = create_navi_agent(
        workspace_id=workspace_id,
        project_id=project_id,
        shared_memory=shared_memory,
        model=model,
    )

    # Create Sage agent (estimation specialist)
    sage = create_sage_agent(
        workspace_id=workspace_id,
        project_id=project_id,
        shared_memory=shared_memory,
        model=model,
    )

    # Create team with Navi as leader
    # Chrono will be added in PM-04.7
    team = Team(
        name="PM Team",
        mode="coordinate",  # Leader coordinates member agents
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=navi,
        members=[sage],  # Sage added in PM-04.5, Chrono pending PM-04.7
        # Leader delegates to specific members, not all at once
        delegate_task_to_all_members=False,
        # Leader responds directly after synthesis
        respond_directly=True,
        # Share context between team members
        share_member_interactions=True,
        # Enable memory for multi-turn conversations
        enable_agentic_context=True,
        # Session management
        session_id=session_id,
        user_id=user_id,
        # Storage for team-level persistence
        storage=shared_memory.db,
        # Debug settings
        debug_mode=debug_mode,
        show_members_responses=debug_mode,
        # Team instructions
        instructions=[
            "You are the PM Team for HYVVE's Core-PM module.",
            "Your goal is to help users manage their projects effectively.",
            "Always suggest actions, never auto-execute (suggestion_mode: True).",
            "Use Knowledge Base search for context when appropriate (kb_rag_enabled: True).",
        ],
        # Expected output format
        expected_output=(
            "Helpful, conversational responses that:\n"
            "1. Answer the user's question clearly\n"
            "2. Provide relevant project/task information\n"
            "3. Suggest next actions when appropriate\n"
            "4. Include context from KB when relevant"
        ),
        markdown=True,
    )

    return team
