"""
AI Business Hub - Platform Agents
Runtime agents for the AI Business Hub platform using Agno framework.

Agents:
- ApprovalAgent (Sentinel): Human-in-the-loop gatekeeper
- OrchestratorAgent: Request routing and coordination
- ScribeAgent: AI-powered Knowledge Base management

BMAD Specs: .bmad/orchestrator/agents/
"""

from .approval_agent import (
    ApprovalAgent,
    create_approval_agent,
    AGENT_NAME as APPROVAL_AGENT_NAME,
    INSTRUCTIONS as APPROVAL_INSTRUCTIONS,
)

from .scribe import (
    ScribeAgent,
    create_scribe_agent,
    SCRIBE_AGENT_NAME,
    SCRIBE_INSTRUCTIONS,
)

__all__ = [
    # Approval Agent
    "ApprovalAgent",
    "create_approval_agent",
    "APPROVAL_AGENT_NAME",
    "APPROVAL_INSTRUCTIONS",
    # Scribe Agent
    "ScribeAgent",
    "create_scribe_agent",
    "SCRIBE_AGENT_NAME",
    "SCRIBE_INSTRUCTIONS",
]
