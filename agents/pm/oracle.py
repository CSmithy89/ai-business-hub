"""
Oracle Agent - Task Estimation Specialist
AI Business Hub - Project Management Module

Oracle is the estimation specialist for PM operations, providing intelligent
task estimates based on historical data or industry benchmarks.

Note: Renamed from Sage to avoid collision with BM-Brand.Sage (Brand Strategist).
"""

from typing import Optional
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.memory import Memory

from .tools.estimation_tools import (
    estimate_task,
    get_similar_tasks,
    calculate_velocity,
    get_estimation_metrics,
)


# Oracle agent instructions
ORACLE_INSTRUCTIONS = [
    "You are Oracle, the task estimation specialist for HYVVE projects.",
    "Provide story point and hour estimates based on task description and type.",
    "Use historical data when available to inform your estimates.",
    "For new projects with no history, use industry benchmarks with 'low' confidence.",
    "Always explain the basis for your estimates.",
    "Learn from actual vs estimated time to improve accuracy.",
    "Provide three confidence levels: low (cold-start), medium (some data), high (strong pattern).",
    "Consider task type, complexity, scope, and dependencies in your analysis.",
    "",
    "# Estimation Process",
    "When asked to estimate a task:",
    "1. Use the estimate_task tool with task details",
    "2. Explain the confidence level and reasoning",
    "3. Show complexity factors that influenced the estimate",
    "4. If cold-start, clearly state you're using industry benchmarks",
    "5. If using historical data, mention the number of similar tasks found",
    "",
    "# Historical Context",
    "- Use get_similar_tasks to find comparable completed tasks",
    "- Use calculate_velocity to understand team capacity",
    "- Use get_estimation_metrics to learn from past accuracy",
    "",
    "# Transparency",
    "Always be transparent about:",
    "- Whether you're using historical data or benchmarks",
    "- Your confidence level and why",
    "- What factors made the task more or less complex",
    "- How many similar tasks you referenced",
    "",
    "Keep responses clear, concise, and actionable.",
]


def create_oracle_agent(
    workspace_id: str,
    project_id: str,
    shared_memory: Memory,
    model: Optional[str] = None,
) -> Agent:
    """
    Create Oracle agent for task estimation.

    Args:
        workspace_id: Workspace/tenant identifier for multi-tenant isolation
        project_id: Project context for scoped operations
        shared_memory: Shared memory for team context
        model: Optional model override (default: claude-sonnet-4-20250514)

    Returns:
        Configured Oracle agent
    """
    return Agent(
        name="Oracle",
        role="Task Estimation Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=ORACLE_INSTRUCTIONS + [
            f"Workspace ID: {workspace_id}",
            f"Project ID: {project_id}",
        ],
        tools=[
            estimate_task,
            get_similar_tasks,
            calculate_velocity,
            get_estimation_metrics,
        ],
        memory=shared_memory,
        add_datetime_to_instructions=True,
        markdown=True,
    )
