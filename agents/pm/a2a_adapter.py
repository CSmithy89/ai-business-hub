"""
A2A Protocol Adapter for PM Agents

Provides adapter class that wraps PM agents to expose them via A2A protocol
while maintaining backward compatibility with existing REST endpoints.

This adapter implements the A2A task-based communication pattern, enabling
the Dashboard Gateway and other agents to communicate with PM agents using
the standard A2A protocol.

DM-02.5 Implementation
"""

from typing import Optional, Dict, Any, List
import logging

from agno.agent import Agent

from constants.dm_constants import DMConstants

logger = logging.getLogger(__name__)


class PMA2AAdapter:
    """
    Adapter to expose PM agents via A2A protocol.

    This adapter wraps an existing PM agent (Navi, Vitals, Herald) and provides
    methods to create A2A interfaces and handle A2A task requests.

    The adapter maintains backward compatibility with existing REST endpoints
    by not modifying the underlying agent's behavior.

    Attributes:
        agent: The wrapped Agno Agent instance
        agent_id: Unique identifier for the agent (used in A2A routing)
        _a2a_path: The configured A2A endpoint path

    Example:
        >>> adapter = PMA2AAdapter(navi_agent, "navi")
        >>> info = adapter.get_agent_info()
        >>> capabilities = adapter.get_capabilities()
    """

    def __init__(self, agent: Agent, agent_id: str):
        """
        Initialize the A2A adapter.

        Args:
            agent: The Agno Agent instance to wrap
            agent_id: Unique agent identifier (e.g., "navi", "pulse", "herald")
        """
        self.agent = agent
        self.agent_id = agent_id
        self._a2a_path: Optional[str] = None
        logger.debug(f"Created PMA2AAdapter for agent: {agent_id}")

    @property
    def a2a_path(self) -> Optional[str]:
        """Get the configured A2A endpoint path."""
        return self._a2a_path

    @a2a_path.setter
    def a2a_path(self, path: str) -> None:
        """Set the A2A endpoint path."""
        self._a2a_path = path

    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get agent information for A2A discovery.

        Returns:
            Dictionary with agent metadata for AgentCard generation
        """
        return {
            "agent_id": self.agent_id,
            "name": self.agent.name,
            "role": getattr(self.agent, "role", "PM Agent"),
            "description": getattr(self.agent, "description", f"{self.agent.name} PM agent"),
            "tools": [
                getattr(t, "__name__", str(t))
                for t in getattr(self.agent, "tools", [])
            ],
            "a2a_path": self._a2a_path,
        }

    async def handle_a2a_task(
        self,
        task_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Handle an A2A task request.

        This method processes incoming A2A tasks and executes them via
        the wrapped agent's arun method.

        Args:
            task_message: The task message from the calling agent
            context: Optional execution context with additional information
                     (e.g., workspace_id, project_id, user_id)

        Returns:
            Task result with content and optional tool calls/artifacts:
            {
                "content": str,      # Agent response content
                "tool_calls": list,  # Any tool calls made (if applicable)
                "artifacts": list,   # Generated artifacts (empty for PM agents)
                "status": str,       # "completed" or "failed"
            }

        Raises:
            Exception: If agent execution fails
        """
        logger.info(f"A2A task received for {self.agent_id}: {task_message[:100]}...")

        try:
            # Build context-aware prompt if context provided
            full_message = task_message
            if context:
                context_str = ", ".join(f"{k}={v}" for k, v in context.items())
                full_message = f"[Context: {context_str}]\n\n{task_message}"

            # Execute via agent with timeout from DMConstants
            response = await self.agent.arun(message=full_message)

            # Extract response components
            content = getattr(response, "content", str(response))
            tool_calls = getattr(response, "tool_calls", [])

            logger.info(f"A2A task completed for {self.agent_id}")

            return {
                "content": content,
                "tool_calls": tool_calls,
                "artifacts": [],
                "status": "completed",
            }

        except Exception as e:
            logger.error(f"A2A task failed for {self.agent_id}: {e}")
            return {
                "content": f"Task execution failed: {str(e)}",
                "tool_calls": [],
                "artifacts": [],
                "status": "failed",
                "error": str(e),
            }

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Get agent capabilities for A2A protocol.

        Returns capabilities based on agent type:
        - Herald has pushNotifications enabled
        - All PM agents support streaming

        Returns:
            Capabilities dictionary for AgentCard
        """
        # Herald supports push notifications (for status updates)
        push_notifications = self.agent_id == "herald"

        return {
            "streaming": True,
            "pushNotifications": push_notifications,
            "stateTransfer": False,
        }

    def get_timeout(self) -> int:
        """
        Get the A2A task timeout from DMConstants.

        Returns:
            Timeout in seconds
        """
        return DMConstants.A2A.TASK_TIMEOUT_SECONDS


def create_pm_a2a_adapter(
    agent: Agent,
    agent_id: str,
) -> PMA2AAdapter:
    """
    Factory function to create a PM A2A adapter.

    Args:
        agent: The PM agent to wrap
        agent_id: Agent identifier for A2A routing

    Returns:
        Configured PMA2AAdapter instance
    """
    return PMA2AAdapter(agent=agent, agent_id=agent_id)
