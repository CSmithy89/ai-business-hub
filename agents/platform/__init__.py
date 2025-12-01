"""
AI Business Hub - Platform Agents
Runtime agents for the AI Business Hub platform using Agno framework.

Agents:
- ApprovalAgent (Sentinel): Human-in-the-loop gatekeeper
- OrchestratorAgent: Request routing and coordination
- (More to come)

BMAD Specs: .bmad/orchestrator/agents/
"""

from .approval_agent import AGENT_NAME as APPROVAL_AGENT_NAME
from .approval_agent import INSTRUCTIONS as APPROVAL_INSTRUCTIONS

__all__ = [
    "APPROVAL_AGENT_NAME",
    "APPROVAL_INSTRUCTIONS",
]
