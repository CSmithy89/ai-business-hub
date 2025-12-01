"""
BMP Planning Team - Agno Team Configuration
AI Business Hub - Business Planning Module

This module defines the Agno Team for business planning,
coordinated by Blake with specialized member agents.

Team Structure:
- Leader: Blake (Planning Orchestrator / Blueprint)
- Members: Model (BMC), Finn (Finance), Revenue (Monetization), Forecast (Growth)

Usage:
    from agents.planning.team import create_planning_team

    team = create_planning_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
    response = team.run("Create a business model canvas for...")
"""

import os
from typing import Optional
from agno.agent import Agent
from agno.team import Team
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from agno.tools.web import WebSearchTool
from agno.tools.calculator import CalculatorTool

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
    INSTRUCTIONS as FINN_INSTRUCTIONS,
    PRINCIPLES as FINN_PRINCIPLES,
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

    Coordinates business planning, synthesizes findings,
    and generates investor-ready documentation.
    """
    return Agent(
        name="Blake",
        role="Planning Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=BLAKE_INSTRUCTIONS + [
            "Coordinate planning across Business Model, Financials, Pricing, and Growth.",
            "Always reference validation findings from BMV when available.",
            "Ensure all planning elements are coherent and aligned.",
            "Generate investor-ready documentation with clear assumptions.",
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
    Create Model - Business Model Canvas Architect.

    Creates comprehensive 9-block Business Model Canvases
    with value proposition design.
    """
    return Agent(
        name="Model",
        role="Business Model Architect",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=MODEL_INSTRUCTIONS + [
            "Create comprehensive Business Model Canvases with all 9 blocks.",
            "Align customer segments with ICPs from validation.",
            "Design value propositions that address validated pain points.",
            "Ensure revenue streams match willingness-to-pay research.",
        ],
        storage=storage,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_finn_agent(
    model: Optional[str] = None,
    storage: Optional[PostgresStorage] = None,
) -> Agent:
    """
    Create Finn - Financial Analyst.

    Develops financial projections, unit economics,
    and funding strategies.
    """
    return Agent(
        name="Finn",
        role="Financial Analyst",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=FINN_INSTRUCTIONS + [
            "Create 3-5 year financial projections with 3 scenarios.",
            "Develop unit economics models (CAC, LTV, payback).",
            "All assumptions must be explicit and defensible.",
            "Connect revenue projections to TAM/SAM/SOM from validation.",
        ],
        tools=[CalculatorTool()],
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

    Designs pricing strategies and revenue models.
    """
    return Agent(
        name="Revenue",
        role="Monetization Strategist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=REVENUE_INSTRUCTIONS + [
            "Design pricing strategies based on customer value.",
            "Create tier structures with clear feature differentiation.",
            "Analyze competitive pricing with source citations.",
            "Ensure pricing supports target unit economics.",
        ],
        tools=[WebSearchTool()],
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

    Creates growth projections, scenarios, and milestone roadmaps.
    """
    return Agent(
        name="Forecast",
        role="Growth Forecaster",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=FORECAST_INSTRUCTIONS + [
            "Create 3-5 year growth forecasts with conservative/realistic/optimistic scenarios.",
            "Develop milestone roadmaps with SMART targets.",
            "Analyze market penetration realistically for new entrants.",
            "Every projection needs explicit, traceable assumptions.",
        ],
        tools=[CalculatorTool()],
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
    validation_context: Optional[dict] = None,
) -> Team:
    """
    Create the BMP Planning Team.

    Args:
        session_id: Unique session identifier for persistence
        user_id: User ID for multi-tenant isolation
        business_id: Optional business context ID
        model: Override model for all agents (default: claude-sonnet-4-20250514)
        debug_mode: Enable debug logging
        validation_context: Optional validation data from BMV module

    Returns:
        Configured Agno Team ready for planning tasks

    Example:
        team = create_planning_team(
            session_id="plan_123",
            user_id="user_456",
            business_id="biz_789",
            validation_context={
                "tam": {"value": 4200000000, "confidence": "high"},
                "sam": {"value": 840000000, "confidence": "medium"},
                "som": {"value": 42000000, "confidence": "medium"},
                "icps": [...],
                "competitors": [...],
            }
        )

        # Run planning
        response = team.run(
            "Create a business model canvas for our AI-powered vertical "
            "gardening platform targeting tech-savvy urban millennials."
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
    finn = create_finn_agent(model=model, storage=storage)
    revenue = create_revenue_agent(model=model, storage=storage)
    forecast = create_forecast_agent(model=model, storage=storage)

    # Build validation context instructions
    validation_instructions = []
    if validation_context:
        validation_instructions = [
            "## Validation Context (from BMV)",
            f"TAM: {validation_context.get('tam', 'Not available')}",
            f"SAM: {validation_context.get('sam', 'Not available')}",
            f"SOM Target: {validation_context.get('som', 'Not available')}",
            "Use this validated data as the foundation for all planning.",
        ]

    # Create team with Blake as leader
    team = Team(
        name="Planning Team",
        mode="coordinate",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=blake,
        members=[model_agent, finn, revenue, forecast],
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
            "Your goal is to create comprehensive, investor-ready business plans.",
            "Coordinate across Business Model Canvas, Financial Projections, Pricing Strategy, and Growth Forecasting.",
            "All planning must be coherent and defensible in investor meetings.",
        ] + validation_instructions,
        # Expected output format
        expected_output=(
            "A comprehensive planning deliverable including:\n"
            "1. Business Model Canvas (9 blocks with rationale)\n"
            "2. Financial Projections (3 scenarios, 3-5 years)\n"
            "3. Pricing Strategy (tiers, competitive analysis)\n"
            "4. Growth Forecast (milestones, market penetration)\n"
            "5. Unit Economics (CAC, LTV, margins)\n"
            "All with explicit assumptions and validation references."
        ),
        markdown=True,
    )

    return team


# ============================================================================
# Workflow Functions
# ============================================================================

async def run_business_model_canvas(
    team: Team,
    business_description: str,
    validation_data: Optional[dict] = None,
) -> str:
    """
    Run the Business Model Canvas workflow.

    Creates a comprehensive 9-block BMC with value proposition design.
    """
    validation_context = ""
    if validation_data:
        validation_context = f"""
        **Validation Data Available:**
        - Target Customers (ICPs): {validation_data.get('icps', 'Not provided')}
        - Market Size: TAM {validation_data.get('tam', 'N/A')}, SAM {validation_data.get('sam', 'N/A')}
        - Key Competitors: {validation_data.get('competitors', 'Not provided')}
        """

    prompt = f"""
    ## Business Model Canvas Workflow

    Create a comprehensive Business Model Canvas for this business:

    **Business Description:**
    {business_description}

    {validation_context}

    Create all 9 blocks:
    1. Customer Segments - Who are we serving? (Use ICPs from validation)
    2. Value Propositions - What value do we deliver?
    3. Channels - How do we reach customers?
    4. Customer Relationships - What type of relationship?
    5. Revenue Streams - How do we make money?
    6. Key Resources - What do we need to deliver?
    7. Key Activities - What must we do?
    8. Key Partnerships - Who helps us?
    9. Cost Structure - What does it cost?

    For each block, provide:
    - 3-7 specific items
    - Clear rationale for each item
    - Connection to validation data where applicable

    Output format:
    - Complete 9-block canvas
    - One-liner business summary
    - Competitive advantage statement
    - Confidence level for each block
    """

    response = await team.arun(prompt)
    return response.content


async def run_financial_projections(
    team: Team,
    business_description: str,
    canvas_summary: Optional[str] = None,
    pricing_data: Optional[dict] = None,
) -> str:
    """
    Run the Financial Projections workflow.

    Creates 3-5 year projections with 3 scenarios.
    """
    prompt = f"""
    ## Financial Projections Workflow

    Create comprehensive financial projections for this business:

    **Business Description:**
    {business_description}

    {f"**Business Model Summary:** {canvas_summary}" if canvas_summary else ""}

    {f"**Pricing Data:** {pricing_data}" if pricing_data else ""}

    Create projections including:

    1. **Revenue Projections** (Years 1-5)
       - Conservative, Realistic, Optimistic scenarios
       - Monthly breakdown for Year 1
       - Revenue by stream

    2. **Unit Economics**
       - Customer Acquisition Cost (CAC)
       - Lifetime Value (LTV)
       - LTV/CAC ratio
       - Payback period
       - Gross margin

    3. **Cash Flow Analysis**
       - Burn rate and runway
       - Break-even point
       - Peak cash need

    4. **Funding Requirements** (if applicable)
       - Amount needed by stage
       - Use of funds
       - Key milestones

    Requirements:
    - Show ALL assumptions explicitly
    - Use industry benchmarks where available
    - Connect to validation TAM/SAM/SOM
    - Include sensitivity analysis for key assumptions

    Output format:
    - 3 scenario projections with assumptions
    - Unit economics summary
    - Cash flow timeline
    - Funding recommendation (if applicable)
    """

    response = await team.arun(prompt)
    return response.content


async def run_pricing_strategy(
    team: Team,
    business_description: str,
    canvas_summary: Optional[str] = None,
    competitors: Optional[list] = None,
) -> str:
    """
    Run the Pricing Strategy workflow.

    Designs pricing tiers and revenue model.
    """
    prompt = f"""
    ## Pricing Strategy Workflow

    Design a pricing strategy for this business:

    **Business Description:**
    {business_description}

    {f"**Business Model:** {canvas_summary}" if canvas_summary else ""}

    {f"**Known Competitors:** {competitors}" if competitors else ""}

    Create a comprehensive pricing strategy:

    1. **Pricing Model Selection**
       - Recommended model (SaaS tiers, usage-based, etc.)
       - Rationale for selection

    2. **Tier Design**
       - 3-4 pricing tiers
       - Feature matrix
       - Price points (monthly and annual)
       - Target customer for each tier

    3. **Competitive Analysis**
       - Key competitor pricing
       - Your positioning (premium, parity, penetration)
       - Differentiation justification

    4. **Unit Economics Validation**
       - Expected ARPU by tier
       - Gross margin analysis
       - LTV/CAC compatibility

    5. **Revenue Model**
       - Primary revenue stream
       - Secondary streams
       - Expansion revenue strategy

    Requirements:
    - Cite sources for competitor pricing
    - Show value-based pricing rationale
    - Ensure pricing supports target unit economics
    """

    response = await team.arun(prompt)
    return response.content


async def run_business_plan_synthesis(
    team: Team,
    canvas: str,
    financials: str,
    pricing: str,
    growth_forecast: Optional[str] = None,
) -> str:
    """
    Run the Business Plan Synthesis workflow.

    Combines all planning elements into comprehensive plan.
    """
    prompt = f"""
    ## Business Plan Synthesis Workflow

    Synthesize all planning elements into an investor-ready business plan.

    **Business Model Canvas:**
    {canvas}

    **Financial Projections:**
    {financials}

    **Pricing Strategy:**
    {pricing}

    {f"**Growth Forecast:** {growth_forecast}" if growth_forecast else ""}

    Create a comprehensive business plan including:

    1. **Executive Summary** (1 page)
       - Problem and solution
       - Market opportunity
       - Business model
       - Financial highlights
       - Team (placeholder)
       - Ask (if applicable)

    2. **Company Overview**
       - Mission and vision
       - Value proposition
       - Competitive advantage

    3. **Market Analysis**
       - TAM/SAM/SOM summary
       - Target customer profiles
       - Competitive landscape

    4. **Business Model**
       - 9-block canvas summary
       - Revenue model
       - Key partnerships

    5. **Go-to-Market Strategy**
       - Customer acquisition strategy
       - Channels and messaging
       - Sales process

    6. **Financial Plan**
       - 5-year projections (realistic scenario)
       - Unit economics
       - Funding requirements

    7. **Milestones & Roadmap**
       - Key milestones
       - Timeline
       - Success metrics

    8. **Risk Analysis**
       - Key risks
       - Mitigation strategies

    Output format:
    - Complete business plan document
    - Executive summary highlights
    - Key talking points for investor meetings
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
            "Create a business model canvas for an AI-powered platform that helps "
            "small businesses automate 90% of their operations with just "
            "5 hours per week of human oversight."
        )

        print(response.content)

    asyncio.run(demo())
