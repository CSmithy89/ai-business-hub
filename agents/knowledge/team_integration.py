"""
Team Integration

Helpers for integrating knowledge bases into Agno agent teams.
Provides utilities to add RAG capabilities to existing teams.
"""

import logging
from typing import Optional, Any

from agno.agent import Agent
from agno.team import Team
from agno.knowledge.knowledge import Knowledge

from .factory import get_workspace_knowledge

logger = logging.getLogger(__name__)


async def create_agent_with_knowledge(
    agent: Agent,
    workspace_id: str,
    jwt_token: Optional[str] = None,
    search_knowledge: bool = True,
    add_to_context: bool = False,
) -> Agent:
    """
    Enhance an agent with workspace knowledge base.

    Args:
        agent: Existing Agno agent
        workspace_id: Workspace ID for knowledge isolation
        jwt_token: JWT token for BYOAI embeddings
        search_knowledge: Enable agent to search knowledge (agentic RAG)
        add_to_context: Add knowledge directly to context (traditional RAG)

    Returns:
        Agent configured with knowledge base

    Example:
        agent = Agent(name="Assistant", model=model)
        agent = await create_agent_with_knowledge(
            agent=agent,
            workspace_id="ws_123",
            jwt_token=token,
        )
    """
    try:
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        # Configure agent with knowledge
        agent.knowledge = knowledge
        agent.search_knowledge = search_knowledge
        agent.add_knowledge_to_context = add_to_context

        logger.info(
            f"Agent '{agent.name}' enhanced with knowledge "
            f"(search={search_knowledge}, context={add_to_context})"
        )

        return agent
    except Exception as e:
        logger.warning(f"Failed to add knowledge to agent: {e}")
        return agent


async def enhance_team_with_knowledge(
    team: Team,
    workspace_id: str,
    jwt_token: Optional[str] = None,
    agent_names: Optional[list] = None,
) -> Team:
    """
    Enhance team members with workspace knowledge.

    Args:
        team: Existing Agno team
        workspace_id: Workspace ID
        jwt_token: JWT token
        agent_names: Optional list of agent names to enhance (all if None)

    Returns:
        Team with knowledge-enhanced agents

    Example:
        team = create_validation_team(...)
        team = await enhance_team_with_knowledge(
            team=team,
            workspace_id="ws_123",
            jwt_token=token,
            agent_names=["Vera", "Marco"],  # Only enhance these agents
        )
    """
    try:
        knowledge = await get_workspace_knowledge(
            workspace_id=workspace_id,
            jwt_token=jwt_token,
        )

        # Get team members to enhance
        members = team.members if hasattr(team, 'members') else []
        enhanced_count = 0

        for agent in members:
            # Check if we should enhance this agent
            if agent_names and agent.name not in agent_names:
                continue

            agent.knowledge = knowledge
            agent.search_knowledge = True
            enhanced_count += 1

        logger.info(
            f"Enhanced {enhanced_count} agents in team with knowledge"
        )

        return team
    except Exception as e:
        logger.warning(f"Failed to enhance team with knowledge: {e}")
        return team


class KnowledgeAwareTeamFactory:
    """
    Factory for creating knowledge-aware teams.

    Wraps existing team factories to automatically add knowledge capabilities.

    Usage:
        factory = KnowledgeAwareTeamFactory(
            workspace_id="ws_123",
            jwt_token=token,
        )

        # Create knowledge-aware validation team
        team = await factory.create_team(
            team_factory=create_validation_team,
            session_id="val_123",
            user_id="user_456",
            business_id="biz_789",
        )
    """

    def __init__(
        self,
        workspace_id: str,
        jwt_token: Optional[str] = None,
    ):
        self.workspace_id = workspace_id
        self.jwt_token = jwt_token
        self._knowledge: Optional[Knowledge] = None

    async def get_knowledge(self) -> Knowledge:
        """Get or create knowledge base."""
        if self._knowledge is None:
            self._knowledge = await get_workspace_knowledge(
                workspace_id=self.workspace_id,
                jwt_token=self.jwt_token,
            )
        return self._knowledge

    async def create_team(
        self,
        team_factory: callable,
        enhance_agents: bool = True,
        **factory_kwargs,
    ) -> Team:
        """
        Create a team with knowledge capabilities.

        Args:
            team_factory: Factory function (e.g., create_validation_team)
            enhance_agents: Whether to enhance agents with knowledge
            **factory_kwargs: Arguments to pass to team factory

        Returns:
            Knowledge-enhanced team
        """
        # Create the base team
        team = team_factory(**factory_kwargs)

        # Enhance with knowledge if requested
        if enhance_agents:
            team = await enhance_team_with_knowledge(
                team=team,
                workspace_id=self.workspace_id,
                jwt_token=self.jwt_token,
            )

        return team
