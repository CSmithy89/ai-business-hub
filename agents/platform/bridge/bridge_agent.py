"""
BridgeAgent - Integration Coordination
AI Business Hub Platform Agent

This agent monitors external integrations (GitHub, Jira, Asana, Trello)
for changes and suggests sync actions. It never applies changes without
explicit user approval.

BMAD Spec: Epic PM-07 - Integrations & Bridge Agent
"""

from typing import Optional
import logging

from agno import Agent
from agno.db.postgres import PostgresDb

logger = logging.getLogger(__name__)

AGENT_NAME = "Bridge"
AGENT_TITLE = "Integration Coordination Assistant"

INSTRUCTIONS = [
    "You are Bridge, the integration coordination assistant for HYVVE AI Business Hub.",
    "Your role is to monitor external tools and suggest sync actions.",
    "",
    "Core Responsibilities:",
    "- Detect changes from connected integrations (GitHub, Jira, Asana, Trello)",
    "- Suggest task updates based on external changes",
    "- Provide clear rationale and confidence for each suggestion",
    "",
    "Constraints:",
    "- NEVER auto-apply changes",
    "- ALWAYS require explicit user approval",
    "- Provide minimal, actionable suggestions",
]

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "suggestions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "reason": {"type": "string"},
                    "confidence": {"type": "number"},
                },
                "required": ["action", "reason", "confidence"],
            },
        },
    },
    "required": ["summary", "suggestions"],
}

BridgeAgent = Agent


def create_bridge_agent(
    database_url: str,
    model: str = "gpt-4o",
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    api_base_url: str = "http://localhost:3001",
) -> Agent:
    """
    Create a tenant-isolated BridgeAgent instance.
    """
    logger.info("Creating Bridge agent for workspace=%s", workspace_id)

    db = PostgresDb(database_url=database_url)

    context = {
        "workspace_id": workspace_id,
        "user_id": user_id,
        "api_base_url": api_base_url,
    }

    agent = Agent(
        name=AGENT_NAME,
        model=model,
        instructions=INSTRUCTIONS,
        storage=db,
        context=context,
        confirm_tool_call=True,
    )

    agent.output_schema = OUTPUT_SCHEMA

    return agent
