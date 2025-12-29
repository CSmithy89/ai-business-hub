"""
BMV Validation Team - Agno Team Configuration
AI Business Hub - Business Validation Module

This module defines the Agno Team for business validation,
coordinated by Vera with specialized member agents.

Team Structure:
- Leader: Vera (Validation Orchestrator)
- Members: Marco (Market), Cipher (Competitors), Persona (Customers), Risk (Feasibility)

Usage:
    from agents.validation.team import create_validation_team

    team = create_validation_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
    response = team.run("Validate this business idea: ...")
"""

import os
from typing import Optional, Dict, Any
from agno.agent import Agent
from agno.team import Team
from agno.models.anthropic import Claude
from agno.db.postgres import PostgresDb
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.file import FileTools

# Import validation-specific tools
from .tools import (
    record_source,
    verify_sources,
    request_validation_approval,
    save_validation_progress,
    get_validation_context,
)

# Import agent configurations
from .validation_orchestrator_agent import (
    INSTRUCTIONS as VERA_INSTRUCTIONS,
    PRINCIPLES as VERA_PRINCIPLES,
)
from .market_researcher_agent import (
    INSTRUCTIONS as MARCO_INSTRUCTIONS,
    PRINCIPLES as MARCO_PRINCIPLES,
)
from .competitor_analyst_agent import (
    INSTRUCTIONS as CIPHER_INSTRUCTIONS,
    PRINCIPLES as CIPHER_PRINCIPLES,
)
from .customer_profiler_agent import (
    INSTRUCTIONS as PERSONA_INSTRUCTIONS,
    PRINCIPLES as PERSONA_PRINCIPLES,
)
from .feasibility_assessor_agent import (
    INSTRUCTIONS as RISK_INSTRUCTIONS,
    PRINCIPLES as RISK_PRINCIPLES,
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

def create_vera_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Vera - Validation Team Lead & Orchestrator.

    Coordinates the validation process, synthesizes findings,
    and generates go/no-go recommendations.
    """
    return Agent(
        name="Vera",
        role="Validation Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=VERA_INSTRUCTIONS + [
            "Coordinate validation across Market, Competitor, Customer, and Feasibility analysis.",
            "Delegate specific research tasks to appropriate team members.",
            "Synthesize findings into actionable go/no-go recommendations.",
            "Present confidence scores honestly - uncertainty is information.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_marco_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Marco - Market Research Specialist.

    Calculates TAM/SAM/SOM using multiple methodologies
    with rigorous source validation.
    """
    return Agent(
        name="Marco",
        role="Market Research Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=MARCO_INSTRUCTIONS + [
            "Calculate TAM/SAM/SOM using top-down, bottom-up, and value theory methods.",
            "ALWAYS cite sources - market claims require 2+ independent sources.",
            "Use the record_source tool to track every source you cite.",
            "Use verify_sources to ensure claims meet minimum source requirements.",
            "Use ranges instead of point estimates when uncertain.",
            "Mark confidence levels: [Verified], [Single Source], [Estimated].",
            "Sources must be from reputable providers (Gartner, Forrester, govt data).",
            "Sources older than 24 months should be marked as potentially outdated.",
        ],
        tools=[DuckDuckGoTools(), record_source, verify_sources],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_cipher_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Cipher - Competitive Intelligence Specialist.

    Identifies competitors, analyzes positioning,
    and finds market gaps.
    """
    return Agent(
        name="Cipher",
        role="Competitive Intelligence Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=CIPHER_INSTRUCTIONS + [
            "Identify direct, indirect, and potential competitors.",
            "Create feature matrices and positioning maps.",
            "Apply Porter's Five Forces framework.",
            "Find gaps that are true opportunities, not just underserved areas.",
            "Use record_source for all competitor claims (pricing, features, market share).",
            "Include competitor website URLs as sources.",
            "Distinguish between verified facts and competitive intelligence estimates.",
        ],
        tools=[DuckDuckGoTools(), record_source],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_persona_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Persona - Customer Research Specialist.

    Develops ICPs, buyer personas, and JTBD analysis.
    """
    return Agent(
        name="Persona",
        role="Customer Research Specialist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=PERSONA_INSTRUCTIONS + [
            "Define Ideal Customer Profiles with specificity - everyone is not your customer.",
            "Create 3-5 distinct buyer personas with emotional truth.",
            "Apply Jobs-to-be-Done framework to understand core needs.",
            "Validate willingness to pay, not just interest.",
        ],
        tools=[DuckDuckGoTools()],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_risk_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Risk - Feasibility Analyst.

    Identifies risks, assesses feasibility,
    and provides go/no-go input.
    """
    return Agent(
        name="Risk",
        role="Feasibility Analyst",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=RISK_INSTRUCTIONS + [
            "Identify and categorize risks: market, technical, financial, operational.",
            "Score risks using Impact x Probability matrix.",
            "Distinguish fatal risks from manageable risks.",
            "Every risk needs a mitigation strategy or it's a constraint.",
            "Use request_validation_approval for go/no-go recommendations.",
            "HITL approval is REQUIRED before finalizing any recommendation.",
            "Present confidence honestly - uncertainty is valuable information.",
        ],
        tools=[request_validation_approval],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


# ============================================================================
# Team Definition
# ============================================================================

def create_validation_team(
    session_id: str,
    user_id: str,
    business_id: Optional[str] = None,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
    """
    Create the BMV Validation Team.

    Args:
        session_id: Unique session identifier for persistence
        user_id: User ID for multi-tenant isolation
        business_id: Optional business context ID
        model: Override model for all agents (default: claude-sonnet-4-20250514)
        debug_mode: Enable debug logging

    Returns:
        Configured Agno Team ready for validation tasks

    Example:
        team = create_validation_team(
            session_id="val_123",
            user_id="user_456",
            business_id="biz_789"
        )

        # Run validation
        response = team.run(
            "Validate this business idea: AI-powered vertical gardening "
            "management for urban homes targeting tech-savvy millennials."
        )
    """
    # Create storage with session context
    storage = PostgresDb(
        session_table="bmv_validation_sessions",
        db_url=get_postgres_url(),
    )

    # Create all agents with shared storage
    vera = create_vera_agent(model=model, db=storage)
    marco = create_marco_agent(model=model, db=storage)
    cipher = create_cipher_agent(model=model, db=storage)
    persona = create_persona_agent(model=model, db=storage)
    risk = create_risk_agent(model=model, db=storage)

    # Create team with Vera as leader
    team = Team(
        name="Validation Team",
        mode="coordinate",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=vera,
        members=[marco, cipher, persona, risk],
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
        db=storage,
        # Debug settings
        debug_mode=debug_mode,
        show_members_responses=debug_mode,
        # Add business context to instructions if provided
        instructions=[
            f"Business ID: {business_id}" if business_id else "",
            "You are the Validation Team for HYVVE's Business Validation Module (BMV).",
            "Your goal is to validate business ideas through rigorous analysis.",
            "Coordinate across market sizing, competitive analysis, customer research, and risk assessment.",
            "Provide honest, evidence-based recommendations.",
        ],
        # Expected output format
        expected_output=(
            "A comprehensive validation report including:\n"
            "1. Market Sizing (TAM/SAM/SOM with sources)\n"
            "2. Competitive Landscape (direct/indirect competitors, positioning)\n"
            "3. Customer Profile (ICP, personas, JTBD)\n"
            "4. Risk Assessment (risk matrix, feasibility scores)\n"
            "5. Go/No-Go Recommendation with confidence score"
        ),
        markdown=True,
    )

    return team


# ============================================================================
# Workflow Functions
# ============================================================================

async def run_idea_intake(
    team: Team,
    idea_description: str,
    context: Optional[str] = None,
) -> str:
    """
    Run the Idea Intake workflow.

    First step in validation - captures and structures the business idea.
    """
    prompt = f"""
    ## Idea Intake Workflow

    Please capture and structure this business idea:

    **Idea Description:**
    {idea_description}

    {f"**Additional Context:** {context}" if context else ""}

    Extract and organize:
    1. Business name (if mentioned) or suggest one
    2. Problem being solved
    3. Proposed solution
    4. Target market (initial)
    5. Known competitors (if any)
    6. Biggest uncertainty
    7. Validation context (fundraising, launch, pivot)

    Ask clarifying questions if needed.
    """

    response = await team.arun(prompt)
    return response.content


async def run_market_sizing(
    team: Team,
    idea_summary: str,
) -> str:
    """
    Run the Market Sizing workflow.

    Calculate TAM/SAM/SOM with methodology and sources.
    """
    prompt = f"""
    ## Market Sizing Workflow

    Calculate the market size for this business:

    {idea_summary}

    Perform:
    1. TAM calculation (top-down and/or bottom-up)
    2. SAM calculation with constraints
    3. SOM scenarios (conservative, realistic, optimistic)

    Requirements:
    - Cite at least 2 sources for major claims
    - Show calculation methodology
    - Use ranges where uncertain
    - Mark confidence levels

    Output format:
    - TAM: $X (sources, methodology)
    - SAM: $Y (constraints applied)
    - SOM: $Z range (assumptions)
    - Confidence: High/Medium/Low
    """

    response = await team.arun(prompt)
    return response.content


async def run_competitor_analysis(
    team: Team,
    idea_summary: str,
    known_competitors: Optional[list] = None,
) -> str:
    """
    Run the Competitor Analysis workflow.

    Identify and analyze competitive landscape.
    """
    competitors_str = ", ".join(known_competitors) if known_competitors else "None identified yet"

    prompt = f"""
    ## Competitor Analysis Workflow

    Analyze the competitive landscape for:

    {idea_summary}

    Known competitors: {competitors_str}

    Perform:
    1. Identify direct competitors (same product, same market)
    2. Identify indirect competitors (different product, same problem)
    3. Identify substitutes
    4. Create feature comparison matrix
    5. Build positioning map (2D)
    6. Apply Porter's Five Forces
    7. Identify market gaps and opportunities

    Output format:
    - Competitor profiles (top 5)
    - Feature matrix
    - Positioning analysis
    - Market gaps identified
    - Differentiation opportunities
    """

    response = await team.arun(prompt)
    return response.content


async def run_customer_discovery(
    team: Team,
    idea_summary: str,
    target_market: Optional[str] = None,
) -> str:
    """
    Run the Customer Discovery workflow.

    Develop ICP, personas, and JTBD analysis.
    """
    prompt = f"""
    ## Customer Discovery Workflow

    Develop customer understanding for:

    {idea_summary}

    {f"Initial target market: {target_market}" if target_market else ""}

    Perform:
    1. Define Ideal Customer Profile (ICP)
       - Segment, industry, company size, characteristics
       - Must-haves and disqualifiers
    2. Create 3 buyer personas with emotional truth
       - Demographics, goals, frustrations, objections
    3. Jobs-to-be-Done analysis
       - Functional, emotional, social jobs
       - Opportunity scores
    4. Willingness to pay assessment
    5. Segment prioritization

    Output format:
    - ICP definition with confidence score
    - 3 personas with representative quotes
    - Top 5 job opportunities
    - Recommended primary segment
    """

    response = await team.arun(prompt)
    return response.content


async def run_validation_synthesis(
    team: Team,
    market_sizing: str,
    competitor_analysis: str,
    customer_discovery: str,
) -> str:
    """
    Run the Validation Synthesis workflow.

    Combine all findings into go/no-go recommendation.
    """
    prompt = f"""
    ## Validation Synthesis Workflow

    Synthesize all validation findings into a final recommendation.

    **Market Sizing Results:**
    {market_sizing}

    **Competitor Analysis Results:**
    {competitor_analysis}

    **Customer Discovery Results:**
    {customer_discovery}

    Perform:
    1. Risk identification and scoring
    2. Technical feasibility assessment
    3. Financial feasibility assessment
    4. Calculate overall confidence score
    5. Generate go/no-go recommendation

    Output format:
    - Validation Score: X/100
    - Recommendation: GO / CONDITIONAL GO / PIVOT / NO GO
    - Key Strengths (top 3)
    - Key Risks (top 3)
    - Conditions (if conditional)
    - Next Steps
    - Confidence Level
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
        team = create_validation_team(
            session_id="demo_session",
            user_id="demo_user",
            debug_mode=True,
        )

        # Run quick validation
        response = await team.arun(
            "Validate this business idea: An AI-powered platform that helps "
            "small businesses automate 90% of their operations with just "
            "5 hours per week of human oversight."
        )

        print(response.content)

    asyncio.run(demo())
