"""
ApprovalAgent - Human-in-the-Loop Gatekeeper
AI Business Hub Platform Agent

This agent manages approval workflows across all modules,
ensuring critical actions receive proper human authorization.

BMAD Spec: .bmad/orchestrator/agents/approval-agent.agent.yaml
"""

from typing import Optional
from datetime import datetime
import logging

from agno import Agent
from agno.db.postgres import PostgresDb

# Import approval tools
from .tools.approval_tools import (
    request_approval,
    get_pending_approvals,
    approve_item,
    reject_item,
    get_approval_details,
    get_approval_stats,
)

logger = logging.getLogger(__name__)


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Sentinel"
AGENT_TITLE = "Human-in-the-Loop Gatekeeper + Approval Workflow Manager"

INSTRUCTIONS = [
    "You are Sentinel, the approval workflow manager for HYVVE AI Business Hub.",
    "Your role is to ensure no critical action executes without proper authorization.",
    "",
    "Core Responsibilities:",
    "- Manage approval requests with clear status updates",
    "- Route approvals to appropriate approvers based on rules",
    "- Provide insights about the approval queue (what's pending, priorities, aging items)",
    "- Help users approve or reject items with proper documentation",
    "- Maintain complete audit trails for compliance",
    "",
    "Communication Style:",
    "- Be direct and clear - every message should state what needs approval, who should approve, and why",
    "- Use structured formats for clarity (bullet points, tables when appropriate)",
    "- Respect people's time - don't be verbose",
    "- For urgent items, highlight them prominently",
    "",
    "Decision Guidelines:",
    "- Never bypass approval requirements without explicit authorization",
    "- When in doubt, escalate rather than block",
    "- Require reasons for all rejections",
    "- Log every decision for audit purposes",
    "",
    "Tools Available:",
    "- request_approval: Create new approval requests (requires human confirmation)",
    "- get_pending_approvals: Check what's in the queue",
    "- approve_item: Approve a pending request",
    "- reject_item: Reject with required reason",
    "- get_approval_details: Get full context for a specific approval",
    "- get_approval_stats: Get queue statistics and metrics",
]

PRINCIPLES = [
    "No action bypasses approval without explicit authorization",
    "Clear communication of what's pending and why",
    "Timely reminders without being annoying",
    "Complete audit trails for every decision",
    "Route to the right approver, every time",
    "Speed matters - approvals should be efficient, not bureaucratic",
    "When in doubt, escalate rather than block",
]


# ============================================================================
# Agent Factory
# ============================================================================

def create_approval_agent(
    database_url: str,
    model: str = "gpt-4o",
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> Agent:
    """
    Create a tenant-isolated ApprovalAgent instance.

    Args:
        database_url: PostgreSQL connection string
        model: LLM model to use (default: gpt-4o)
        workspace_id: Workspace ID for tenant isolation
        user_id: User ID for personalization

    Returns:
        Configured ApprovalAgent instance
    """
    logger.info(f"Creating ApprovalAgent for workspace: {workspace_id}, user: {user_id}")

    # Create database connection for session storage
    db = PostgresDb(
        connection_string=database_url,
        table_name="agent_sessions",
    )

    # Create agent with tools and configuration
    agent = Agent(
        name=AGENT_NAME,
        model=model,
        description=AGENT_TITLE,
        instructions=INSTRUCTIONS,
        tools=[
            request_approval,
            get_pending_approvals,
            approve_item,
            reject_item,
            get_approval_details,
            get_approval_stats,
        ],
        db=db,
        add_history_to_context=True,
        num_history_runs=5,
        enable_user_memories=True,
        markdown=True,
        show_tool_calls=True,
        debug_mode=False,
    )

    logger.info(f"ApprovalAgent created successfully: {AGENT_NAME}")
    return agent


# ============================================================================
# Agent Wrapper for AgentOS Integration
# ============================================================================

class ApprovalAgent:
    """
    Wrapper class for ApprovalAgent to integrate with AgentOS runtime.

    Provides workspace context injection and session management.
    """

    def __init__(self, database_url: str, default_model: str = "gpt-4o"):
        """
        Initialize ApprovalAgent wrapper.

        Args:
            database_url: PostgreSQL connection string
            default_model: Default LLM model to use
        """
        self.database_url = database_url
        self.default_model = default_model
        logger.info("ApprovalAgent wrapper initialized")

    def create_session(
        self,
        workspace_id: str,
        user_id: str,
        jwt_token: Optional[str] = None,
        model_override: Optional[str] = None,
    ) -> Agent:
        """
        Create a new agent session with workspace and user context.

        Args:
            workspace_id: Workspace ID for tenant isolation
            user_id: User ID for personalization
            jwt_token: JWT token for API authentication
            model_override: Override default model

        Returns:
            Configured Agent instance with injected context
        """
        model = model_override or self.default_model

        # Create agent instance
        agent = create_approval_agent(
            database_url=self.database_url,
            model=model,
            workspace_id=workspace_id,
            user_id=user_id,
        )

        # Inject workspace context into agent's tools
        # This allows tools to access workspace_id and jwt_token
        agent.workspace_id = workspace_id
        agent.user_id = user_id
        agent.jwt_token = jwt_token

        logger.info(f"Created agent session for workspace={workspace_id}, user={user_id}")
        return agent

    async def run(
        self,
        message: str,
        workspace_id: str,
        user_id: str,
        jwt_token: Optional[str] = None,
        model_override: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> dict:
        """
        Run the agent with a user message.

        Args:
            message: User's message/query
            workspace_id: Workspace ID for tenant isolation
            user_id: User ID for personalization
            jwt_token: JWT token for API authentication
            model_override: Override default model
            session_id: Optional session ID for conversation continuity

        Returns:
            Agent response with content and metadata
        """
        try:
            # Create agent session
            agent = self.create_session(
                workspace_id=workspace_id,
                user_id=user_id,
                jwt_token=jwt_token,
                model_override=model_override,
            )

            # Run agent with message
            # Pass workspace and auth context to tools
            response = agent.run(
                message,
                session_id=session_id,
                # Tool parameters will be injected here
                tool_params={
                    "jwt_token": jwt_token,
                    "workspace_id": workspace_id,
                }
            )

            logger.info(f"Agent run completed for session={session_id}")

            return {
                "success": True,
                "content": response.content,
                "session_id": session_id,
                "metadata": {
                    "agent": AGENT_NAME,
                    "workspace_id": workspace_id,
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat(),
                }
            }

        except Exception as e:
            logger.error(f"Agent run failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "message": "Agent execution failed. Please try again or contact support.",
                "metadata": {
                    "agent": AGENT_NAME,
                    "workspace_id": workspace_id,
                    "user_id": user_id,
                    "timestamp": datetime.now().isoformat(),
                }
            }


# ============================================================================
# Entry Point for Testing
# ============================================================================

if __name__ == "__main__":
    print(f"ApprovalAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
    print(f"Instructions: {len(INSTRUCTIONS)}")
    print(f"Principles: {len(PRINCIPLES)}")
    print(f"Tools: request_approval, get_pending_approvals, approve_item, reject_item")
    print("")
    print("Usage:")
    print("  from agents.platform.approval_agent import ApprovalAgent")
    print("  agent = ApprovalAgent(database_url='postgresql://...')")
    print("  response = await agent.run(")
    print("    message='Show me pending approvals',")
    print("    workspace_id='ws_123',")
    print("    user_id='user_456',")
    print("    jwt_token='eyJ...',")
    print("  )")
