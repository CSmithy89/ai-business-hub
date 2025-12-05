"""
BMP Planning Team - Agno Team Configuration
AI Business Hub - Business Planning Module

This module defines the Agno Team for business planning,
coordinated by Blake with specialized member agents.

Team Structure:
- Leader: Blake (Planning Orchestrator)
- Members: Model (BMC), Finance (Projections), Revenue (Pricing), Forecast (Growth)

Usage:
    from agents.planning.team import create_planning_team

    team = create_planning_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
    response = team.run("Create a business model canvas for ...")
"""

import os
from typing import Optional
from agno.agent import Agent
from agno.team import Team
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from agno.tools.web import WebSearchTool
from agno.tools.file import FileTools

# Import planning-specific tools
from .tools import (
    calculate_financial_metrics,
    calculate_unit_economics,
    calculate_burn_rate,
    request_financial_approval,
    save_planning_progress,
    get_validation_context,
    generate_business_model_canvas,
)

# Import agent configurations
from .planning_orchestrator_agent import (
    INSTRUCTIONS as BLAKE_INSTRUCTIONS,
    PRINCIPLES as BLAKE_PRINCIPLES,
)
from .business_model_architect_agent import (
    INSTRUCTIONS as MODEL_INSTRUCTIONS,
    PRINCIPLES as MODEL_PRINCIPLES,
)
from .financial_analyst_agent import (
    INSTRUCTIONS as FINANCE_INSTRUCTIONS,
    PRINCIPLES as FINANCE_PRINCIPLES,
)
from .monetization_strategist_agent import (
    INSTRUCTIONS as REVENUE_INSTRUCTIONS,
    PRINCIPLES as REVENUE_PRINCIPLES,
)
from .growth_forecaster_agent import (
    INSTRUCTIONS as FORECAST_INSTRUCTIONS,
    PRINCIPLES as FORECAST_PRINCIPLES,
)


# ============================================================================
# Database Configuration
# ============================================================================

def get_postgres_url() -> str:
    """Get PostgreSQL connection URL from environment."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/hyvve"
    )


# ============================================================================
# Agent Definitions
# ============================================================================

def create_blake_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Blake - Planning Team Lead & Orchestrator.

    Coordinates the planning process, synthesizes findings,
    and generates investor-ready documents.
    """
    return Agent(
        name="Blake",
        role="Planning Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=BLAKE_INSTRUCTIONS + [
            "Coordinate planning across Business Model, Finance, Pricing, and Growth.",
            "Delegate specific tasks to appropriate team members.",
            "Synthesize findings into investor-ready business plans.",
            "Ensure all projections are defensible with clear assumptions.",
        ],
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_model_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Model - Business Model Canvas Expert.

    Creates comprehensive business model canvases
    and value propositions.
    """
    return Agent(
        name="Model",
        role="Business Model Canvas Expert",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=MODEL_INSTRUCTIONS + [
            "Create detailed Business Model Canvases.",
            "Build on validated customer segments from BMV.",
            "Ensure value propositions address real pain points.",
            "Use generate_business_model_canvas tool to structure output.",
        ],
        tools=[generate_business_model_canvas],
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_finance_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Finance - Financial Analyst.

    Builds financial projections, P&L,
    and cash flow forecasts.
    """
    return Agent(
        name="Finance",
        role="Financial Analyst",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=FINANCE_INSTRUCTIONS + [
            "Build 3-5 year financial projections.",
            "Use calculate_financial_metrics for standardized calculations.",
            "Document all assumptions clearly.",
            "Use request_financial_approval for human approval on projections.",
            "HITL approval is REQUIRED before finalizing financial plans.",
        ],
        tools=[
            calculate_financial_metrics,
            calculate_burn_rate,
            request_financial_approval,
        ],
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_revenue_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Revenue - Monetization Strategist.

    Designs pricing strategies and
    optimizes unit economics.
    """
    return Agent(
        name="Revenue",
        role="Monetization Strategist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=REVENUE_INSTRUCTIONS + [
            "Design pricing strategies based on validated willingness to pay.",
            "Use calculate_unit_economics for LTV/CAC analysis.",
            "Ensure LTV:CAC ratio supports sustainable growth.",
            "Consider multiple pricing tiers and expansion revenue.",
        ],
        tools=[calculate_unit_economics],
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_forecast_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Forecast - Growth Forecaster.

    Models growth scenarios and
    validates assumptions.
    """
    return Agent(
        name="Forecast",
        role="Growth Forecaster",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=FORECAST_INSTRUCTIONS + [
            "Model three scenarios: Conservative, Realistic, Optimistic.",
            "Challenge every growth assumption.",
            "Tie growth to specific customer acquisition strategies.",
            "Show sensitivity to key assumptions.",
        ],
        tools=[WebSearchTool()],  # For market research
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


# ============================================================================
# Team Definition
# ============================================================================

def create_planning_team(
    session_id: str,
    user_id: str,
    business_id: Optional[str] = None,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
    """
    Create the BMP Planning Team.

    Args:
        session_id: Unique session identifier for persistence
        user_id: User ID for multi-tenant isolation
        business_id: Optional business context ID
        model: Override model for all agents (default: claude-sonnet-4-20250514)
        debug_mode: Enable debug logging

    Returns:
        Configured Agno Team ready for planning tasks

    Example:
        team = create_planning_team(
            session_id="plan_123",
            user_id="user_456",
            business_id="biz_789"
        )

        # Run planning
        response = team.run(
            "Create a business model canvas for our validated SaaS idea "
            "targeting SMB operations teams."
        )
    """
    # Create storage with session context
    storage = PostgresStorage(
        table_name="bmp_planning_sessions",
        db_url=get_postgres_url(),
    )

    # Create all agents with shared storage
    blake = create_blake_agent(model=model, storage=storage)
    model_agent = create_model_agent(model=model, storage=storage)
    finance = create_finance_agent(model=model, storage=storage)
    revenue = create_revenue_agent(model=model, storage=storage)
    forecast = create_forecast_agent(model=model, storage=storage)

    # Create team with Blake as leader
    team = Team(
        name="Planning Team",
        mode="coordinate",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=blake,
        members=[model_agent, finance, revenue, forecast],
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
        storage=storage,
        # Debug settings
        debug_mode=debug_mode,
        show_members_responses=debug_mode,
        # Add business context to instructions if provided
        instructions=[
            f"Business ID: {business_id}" if business_id else "",
            "You are the Planning Team for HYVVE's Business Planning Module (BMP).",
            "Your goal is to transform validated business ideas into investor-ready plans.",
            "Build on validation findings - don't ignore what was learned.",
            "All projections must be defensible with clear assumptions.",
        ],
        # Expected output format
        expected_output=(
            "A comprehensive business plan including:\n"
            "1. Business Model Canvas (all 9 sections)\n"
            "2. Financial Projections (3-year P&L, cash flow)\n"
            "3. Pricing Strategy (tiers, unit economics)\n"
            "4. Growth Forecast (3 scenarios with assumptions)\n"
            "5. Executive Summary\n"
            "6. Funding Requirements (if applicable)"
        ),
        markdown=True,
    )

    return team


# ============================================================================
# Workflow Functions
# ============================================================================

async def run_business_model_canvas(
    team: Team,
    business_context: str,
    validation_data: Optional[dict] = None,
) -> str:
    """
    Run the Business Model Canvas workflow.

    First step in planning - creates the BMC structure.
    """
    prompt = f"""
    ## Business Model Canvas Workflow

    Create a comprehensive Business Model Canvas for:

    **Business Context:**
    {business_context}

    {f"**Validation Data:** {validation_data}" if validation_data else ""}

    Complete all 9 sections:
    1. Customer Segments
    2. Value Propositions
    3. Channels
    4. Customer Relationships
    5. Revenue Streams
    6. Key Resources
    7. Key Activities
    8. Key Partnerships
    9. Cost Structure

    Requirements:
    - Build on validated customer segments if available
    - Be specific - avoid generic descriptions
    - Consider scalability implications
    - Align revenue streams with willingness to pay
    """

    response = await team.arun(prompt)
    return response.content


async def run_financial_projections(
    team: Team,
    business_model_canvas: str,
    market_sizing: Optional[dict] = None,
) -> str:
    """
    Run the Financial Projections workflow.

    Create 3-year financial projections.
    """
    prompt = f"""
    ## Financial Projections Workflow

    Build 3-year financial projections based on:

    **Business Model Canvas:**
    {business_model_canvas}

    {f"**Market Sizing:** {market_sizing}" if market_sizing else ""}

    Create:
    1. Revenue Model
       - Revenue drivers and assumptions
       - Growth rates by year
       - Seasonality if applicable

    2. Cost Model
       - Fixed costs (team, rent, tools)
       - Variable costs (COGS, CAC)
       - Step-function costs

    3. P&L Statement (Years 1-3)
       - Revenue
       - Gross Profit
       - Operating Expenses
       - EBITDA

    4. Cash Flow Analysis
       - When do we break even?
       - Funding requirements

    Requirements:
    - Document all assumptions
    - Show three scenarios (Conservative, Realistic, Optimistic)
    - Calculate key metrics (gross margin, burn rate)
    - Request human approval before finalizing
    """

    response = await team.arun(prompt)
    return response.content


async def run_pricing_strategy(
    team: Team,
    business_context: str,
    customer_data: Optional[dict] = None,
) -> str:
    """
    Run the Pricing Strategy workflow.

    Design pricing and monetization approach.
    """
    prompt = f"""
    ## Pricing Strategy Workflow

    Design pricing strategy for:

    **Business Context:**
    {business_context}

    {f"**Customer Data:** {customer_data}" if customer_data else ""}

    Create:
    1. Revenue Model Selection
       - Subscription vs transaction vs hybrid
       - Rationale for choice

    2. Pricing Tiers
       - Free/trial tier (if applicable)
       - Entry tier
       - Growth tier
       - Enterprise tier (if applicable)

    3. Unit Economics
       - ARPU by tier
       - Expected LTV
       - Target CAC
       - LTV:CAC ratio

    4. Pricing Psychology
       - Anchoring strategy
       - Bundling opportunities
       - Expansion revenue paths

    Requirements:
    - Base pricing on validated willingness to pay
    - Ensure unit economics support growth
    - Consider competitive positioning
    """

    response = await team.arun(prompt)
    return response.content


async def run_growth_forecast(
    team: Team,
    financial_projections: str,
    pricing_strategy: str,
) -> str:
    """
    Run the Growth Forecast workflow.

    Model growth scenarios and validate assumptions.
    """
    prompt = f"""
    ## Growth Forecast Workflow

    Create growth forecast based on:

    **Financial Projections:**
    {financial_projections}

    **Pricing Strategy:**
    {pricing_strategy}

    Create:
    1. Growth Model
       - Customer acquisition channels
       - Expected conversion rates
       - Churn projections

    2. Three Scenarios (Years 1-3)
       - Conservative (70% confidence)
       - Realistic (50% confidence)
       - Optimistic (30% confidence)

    3. Assumption Validation
       - Key assumptions ranked by impact
       - Evidence supporting each assumption
       - What would prove each assumption wrong?

    4. Milestone Planning
       - Key milestones for each scenario
       - Funding requirements per milestone
       - Team growth by milestone

    Requirements:
    - Challenge every assumption
    - Show sensitivity analysis
    - Conservative scenario must still be viable
    """

    response = await team.arun(prompt)
    return response.content


async def run_business_plan_synthesis(
    team: Team,
    business_model_canvas: str,
    financial_projections: str,
    pricing_strategy: str,
    growth_forecast: str,
    validation_summary: Optional[str] = None,
) -> str:
    """
    Run the Business Plan Synthesis workflow.

    Combine all findings into comprehensive business plan.
    """
    prompt = f"""
    ## Business Plan Synthesis Workflow

    Synthesize all planning outputs into an investor-ready business plan.

    **Inputs:**

    Business Model Canvas:
    {business_model_canvas}

    Financial Projections:
    {financial_projections}

    Pricing Strategy:
    {pricing_strategy}

    Growth Forecast:
    {growth_forecast}

    {f"Validation Summary: {validation_summary}" if validation_summary else ""}

    Create:
    1. Executive Summary (1 page)
       - Problem & Solution
       - Market Opportunity
       - Business Model
       - Key Metrics
       - Ask (if fundraising)

    2. Business Plan Document Structure
       - Problem & Solution
       - Market Analysis
       - Product/Service
       - Business Model
       - Go-to-Market Strategy
       - Financial Plan
       - Team (placeholder)
       - Funding Requirements

    3. Key Metrics Dashboard
       - TAM/SAM/SOM
       - Revenue projections
       - Unit economics
       - Milestones

    Requirements:
    - Investor-ready quality
    - Clear and concise
    - All claims supported by data
    - Request approval before finalizing
    """

    response = await team.arun(prompt)
    return response.content


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import asyncio

    async def demo():
        # Create team
        team = create_planning_team(
            session_id="demo_planning_session",
            user_id="demo_user",
            debug_mode=True,
        )

        # Run quick planning
        response = await team.arun(
            "Create a business model canvas for an AI-powered platform "
            "that helps small businesses automate 90% of their operations "
            "with just 5 hours per week of human oversight."
        )

        print(response.content)

    asyncio.run(demo())
