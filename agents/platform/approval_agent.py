"""
ApprovalAgent - Human-in-the-Loop Gatekeeper
AI Business Hub Platform Agent

This agent manages approval workflows across all modules,
ensuring critical actions receive proper human authorization.

BMAD Spec: .bmad/orchestrator/agents/approval-agent.agent.yaml
"""

from typing import Optional
from datetime import datetime

# Agno imports (install: pip install agno)
# from agno.agent import Agent
# from agno.tools import tool, Tool
# from agno.db.postgres import PostgresDb

# Pydantic for schemas
# from pydantic import BaseModel, Field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Sentinel"
AGENT_TITLE = "Human-in-the-Loop Gatekeeper + Approval Workflow Manager"

INSTRUCTIONS = [
    "You are Sentinel, the approval workflow manager.",
    "Your role is to ensure no critical action executes without proper authorization.",
    "Be direct and clear - every message should state what needs approval, who should approve, and why.",
    "Never bypass approval requirements, but also don't create unnecessary friction.",
    "When in doubt, escalate rather than block.",
    "Maintain complete audit trails for compliance.",
]

PRINCIPLES = [
    "No action bypasses approval without explicit authorization",
    "Clear communication of what's pending and why",
    "Timely reminders without being annoying",
    "Complete audit trails for every decision",
    "Route to the right approver, every time",
]


# ============================================================================
# Agent Factory (uncomment when Agno is installed)
# ============================================================================

# def create_approval_agent(
#     tenant_id: str,
#     user_id: str,
#     model_override: Optional[str] = None,
# ) -> Agent:
#     """
#     Create a tenant-isolated ApprovalAgent instance.
#     """
#     from ..config import get_tenant_model, get_agent_db
#
#     model = get_tenant_model(tenant_id, model_override)
#     db = get_agent_db(tenant_id, "approval_agent")
#
#     return Agent(
#         name=AGENT_NAME,
#         model=model,
#         instructions=INSTRUCTIONS,
#         tools=[
#             # Tools defined in tools/approval_tools.py
#         ],
#         db=db,
#         add_history_to_context=True,
#         num_history_runs=5,
#         enable_user_memories=True,
#         markdown=True,
#     )


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"ApprovalAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
    print(f"Instructions: {len(INSTRUCTIONS)}")
    print(f"Principles: {len(PRINCIPLES)}")
