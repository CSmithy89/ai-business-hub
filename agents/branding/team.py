"""
BM-Brand Branding Team - Agno Team Configuration
AI Business Hub - Branding Module

This module defines the Agno Team for brand development,
coordinated by Bella with specialized member agents.

Team Structure:
- Leader: Bella (Brand Orchestrator)
- Members: Sage (Strategy), Vox (Voice), Iris (Visual), Artisan (Assets), Audit (QA)

Usage:
    from agents.branding.team import create_branding_team

    team = create_branding_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
    response = team.run("Create a brand strategy for...")
"""

import os
from typing import Optional
from agno.agent import Agent
from agno.team import Team
from agno.models.anthropic import Claude
from agno.db.postgres import PostgresDb
from agno.tools.duckduckgo import DuckDuckGoTools

# Import agent configurations
from .brand_orchestrator_agent import (
    INSTRUCTIONS as BELLA_INSTRUCTIONS,
    PRINCIPLES as BELLA_PRINCIPLES,
)
from .brand_strategist_agent import (
    INSTRUCTIONS as SAGE_INSTRUCTIONS,
    PRINCIPLES as SAGE_PRINCIPLES,
)
from .voice_architect_agent import (
    INSTRUCTIONS as VOX_INSTRUCTIONS,
    PRINCIPLES as VOX_PRINCIPLES,
)
from .visual_identity_designer_agent import (
    INSTRUCTIONS as IRIS_INSTRUCTIONS,
    PRINCIPLES as IRIS_PRINCIPLES,
)
from .asset_generator_agent import (
    INSTRUCTIONS as ARTISAN_INSTRUCTIONS,
    PRINCIPLES as ARTISAN_PRINCIPLES,
)
from .brand_auditor_agent import (
    INSTRUCTIONS as AUDIT_INSTRUCTIONS,
    PRINCIPLES as AUDIT_PRINCIPLES,
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

def create_bella_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Bella - Branding Team Lead & Orchestrator.

    Coordinates brand development and ensures
    cohesive brand identity systems.
    """
    return Agent(
        name="Bella",
        role="Brand Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=BELLA_INSTRUCTIONS + [
            "Coordinate branding across Strategy, Voice, Visual Identity, and Asset Generation.",
            "Ensure all brand elements are cohesive and aligned with strategy.",
            "Guide users through brand development with creative expertise.",
            "Synthesize brand guidelines that are practical and usable.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_sage_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Sage - Brand Strategist.

    Develops brand positioning, archetype,
    and core messaging strategy.
    """
    return Agent(
        name="Sage",
        role="Brand Strategist",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=SAGE_INSTRUCTIONS + [
            "Define brand positioning that differentiates from competitors.",
            "Select brand archetype that aligns with business strategy.",
            "Create core values that are specific and actionable.",
            "Develop messaging pillars with supporting proof points.",
        ],
        tools=[DuckDuckGoTools()],  # For competitor research
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_vox_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Vox - Voice Architect.

    Designs verbal identity, tone guidelines,
    and messaging frameworks.
    """
    return Agent(
        name="Vox",
        role="Voice Architect",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=VOX_INSTRUCTIONS + [
            "Create distinctive voice that reflects brand personality.",
            "Define tone guidelines for different contexts.",
            "Build vocabulary and language rules.",
            "Develop practical messaging templates.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_iris_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Iris - Visual Identity Designer.

    Creates visual brand identity including
    logo systems, colors, and typography.
    """
    return Agent(
        name="Iris",
        role="Visual Identity Designer",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=IRIS_INSTRUCTIONS + [
            "Design logo systems with strategic rationale.",
            "Create color palettes that align with brand archetype.",
            "Define typography systems for readability and personality.",
            "Establish visual principles that guide all design decisions.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_artisan_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Artisan - Asset Generator.

    Creates specifications for production-ready
    brand assets across all applications.
    """
    return Agent(
        name="Artisan",
        role="Asset Generator",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=ARTISAN_INSTRUCTIONS + [
            "Specify all required brand assets with exact dimensions.",
            "Define file formats appropriate for each use case.",
            "Create organized package structure.",
            "Ensure production-ready specifications.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


def create_audit_agent(
    model: Optional[str] = None,
    db: Optional[PostgresDb] = None,
) -> Agent:
    """
    Create Audit - Brand Auditor.

    Verifies brand quality, consistency,
    and compliance with guidelines.
    """
    return Agent(
        name="Audit",
        role="Brand Auditor",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=AUDIT_INSTRUCTIONS + [
            "Verify brand consistency across all elements.",
            "Check alignment with documented guidelines.",
            "Identify gaps and inconsistencies objectively.",
            "Provide actionable recommendations with priorities.",
        ],
        db=db,
        add_datetime_to_instructions=True,
        markdown=True,
    )


# ============================================================================
# Team Definition
# ============================================================================

def create_branding_team(
    session_id: str,
    user_id: str,
    business_id: Optional[str] = None,
    model: Optional[str] = None,
    debug_mode: bool = False,
    business_context: Optional[dict] = None,
) -> Team:
    """
    Create the BM-Brand Branding Team.

    Args:
        session_id: Unique session identifier for persistence
        user_id: User ID for multi-tenant isolation
        business_id: Optional business context ID
        model: Override model for all agents (default: claude-sonnet-4-20250514)
        debug_mode: Enable debug logging
        business_context: Optional context from validation/planning

    Returns:
        Configured Agno Team ready for branding tasks

    Example:
        team = create_branding_team(
            session_id="brand_123",
            user_id="user_456",
            business_id="biz_789",
            business_context={
                "business_name": "GreenThumb AI",
                "target_audience": "Tech-savvy urban millennials",
                "competitors": ["Bloomscape", "Gardyn", "Click & Grow"],
                "values": ["Innovation", "Sustainability", "Simplicity"],
            }
        )

        # Run branding
        response = team.run(
            "Create a brand strategy for our AI-powered vertical "
            "gardening platform targeting tech-savvy urban millennials."
        )
    """
    # Create storage with session context
    storage = PostgresDb(
        session_table="bmb_branding_sessions",
        db_url=get_postgres_url(),
    )

    # Create all agents with shared storage
    bella = create_bella_agent(model=model, db=storage)
    sage = create_sage_agent(model=model, db=storage)
    vox = create_vox_agent(model=model, db=storage)
    iris = create_iris_agent(model=model, db=storage)
    artisan = create_artisan_agent(model=model, db=storage)
    audit = create_audit_agent(model=model, db=storage)

    # Build business context instructions
    context_instructions = []
    if business_context:
        context_instructions = [
            "## Business Context",
            f"Business Name: {business_context.get('business_name', 'Not provided')}",
            f"Target Audience: {business_context.get('target_audience', 'Not provided')}",
            f"Key Competitors: {business_context.get('competitors', 'Not provided')}",
            f"Core Values: {business_context.get('values', 'Not provided')}",
            "Use this context as foundation for all branding decisions.",
        ]

    # Create team with Bella as leader
    team = Team(
        name="Branding Team",
        mode="coordinate",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        leader=bella,
        members=[sage, vox, iris, artisan, audit],
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
            "You are the Branding Team for HYVVE's Branding Module (BM-Brand).",
            "Your goal is to create cohesive, memorable brand identity systems.",
            "Coordinate across Brand Strategy, Voice, Visual Identity, Asset Generation, and Quality Audit.",
            "All branding must be strategic, consistent, and production-ready.",
        ] + context_instructions,
        # Expected output format
        expected_output=(
            "A comprehensive brand identity system including:\n"
            "1. Brand Strategy (positioning, archetype, values, messaging)\n"
            "2. Brand Voice (tone, vocabulary, templates)\n"
            "3. Visual Identity (logo, colors, typography)\n"
            "4. Brand Guidelines (comprehensive documentation)\n"
            "5. Asset Specifications (production-ready deliverables)\n"
            "6. Quality Audit (consistency verification)\n"
            "All with strategic rationale and practical application guidance."
        ),
        markdown=True,
    )

    return team


# ============================================================================
# Workflow Functions
# ============================================================================

async def run_brand_strategy(
    team: Team,
    business_description: str,
    competitors: Optional[list] = None,
    target_audience: Optional[str] = None,
) -> str:
    """
    Run the Brand Strategy workflow.

    Develops positioning, archetype, and core messaging.
    """
    prompt = f"""
    ## Brand Strategy Workflow

    Develop a comprehensive brand strategy for this business:

    **Business Description:**
    {business_description}

    {f"**Target Audience:** {target_audience}" if target_audience else ""}

    {f"**Known Competitors:** {competitors}" if competitors else ""}

    Create a complete brand strategy including:

    1. **Brand Positioning**
       - Positioning statement (For [target], [brand] is the [category] that [differentiation] because [reason])
       - Positioning strategy (leader, challenger, niche, disruptor, etc.)
       - Competitive differentiation analysis

    2. **Brand Archetype**
       - Primary archetype selection with rationale
       - Secondary archetype (if applicable)
       - Archetype expression guidelines

    3. **Brand Values**
       - 3-5 core values
       - Behavioral definitions for each
       - How values show up in practice

    4. **Brand Personality**
       - Personality traits (5-7)
       - Personality spectrum (e.g., "serious vs. playful")

    5. **Core Messaging**
       - Tagline options (3-5)
       - Elevator pitch
       - Messaging pillars (3-4)
       - Brand promise

    Output format:
    - Complete brand strategy document
    - Strategic rationale for each decision
    - Alignment with business goals
    """

    response = await team.arun(prompt)
    return response.content


async def run_brand_voice(
    team: Team,
    brand_strategy: str,
    examples: Optional[list] = None,
) -> str:
    """
    Run the Brand Voice workflow.

    Creates verbal identity and messaging frameworks.
    """
    prompt = f"""
    ## Brand Voice Workflow

    Create comprehensive brand voice guidelines based on this strategy:

    **Brand Strategy:**
    {brand_strategy}

    {f"**Example Content to Match:** {examples}" if examples else ""}

    Develop complete voice guidelines including:

    1. **Voice Personality Statement**
       - "We speak like a [persona] who [behavior]"
       - Voice character description

    2. **Voice Attributes**
       - 3-4 primary attributes
       - DO and DON'T examples for each

    3. **Tone Guidelines**
       - Default tone attributes
       - Tone modulation by context:
         - Marketing communications
         - Customer support
         - Product UI
         - Social media
         - Crisis communication

    4. **Vocabulary Guidelines**
       - Preferred terms
       - Terms to avoid
       - Brand-specific terminology
       - Industry jargon policy

    5. **Grammar and Style**
       - Capitalization rules
       - Punctuation preferences
       - Contractions policy
       - Emoji usage

    6. **Messaging Templates**
       - Welcome message template
       - Error message template
       - Success message template
       - Email subject line patterns
       - CTA button text patterns

    Output format:
    - Complete voice guidelines
    - Practical examples throughout
    - Ready-to-use templates
    """

    response = await team.arun(prompt)
    return response.content


async def run_visual_identity(
    team: Team,
    brand_strategy: str,
    brand_name: str,
    industry: Optional[str] = None,
) -> str:
    """
    Run the Visual Identity workflow.

    Creates logo system, colors, and typography specifications.
    """
    prompt = f"""
    ## Visual Identity Workflow

    Design a complete visual identity system for:

    **Brand Name:** {brand_name}

    **Brand Strategy:**
    {brand_strategy}

    {f"**Industry:** {industry}" if industry else ""}

    Create comprehensive visual identity specifications:

    1. **Logo System**
       - Recommended logo type (wordmark, combination, etc.) with rationale
       - Logo variants needed:
         - Primary logo
         - Secondary logo
         - Icon/symbol
         - Favicon
       - Color versions (full color, reversed, B&W)
       - Minimum size and clear space rules
       - Usage don'ts

    2. **Color Palette**
       - Primary colors (1-2) with hex codes
       - Secondary colors (1-2) with hex codes
       - Accent colors with hex codes
       - Neutral palette
       - Semantic colors (success, warning, error)
       - Color usage rationale tied to brand archetype
       - Accessibility notes (contrast ratios)

    3. **Typography**
       - Primary typeface with rationale
       - Secondary typeface (if needed)
       - Type scale (display through caption)
       - Font weights and styles
       - Pairing rationale
       - Web font sources

    4. **Design Principles**
       - 3-5 guiding principles
       - Imagery style guidelines
       - Iconography style
       - White space philosophy

    Output format:
    - Complete visual identity specifications
    - Strategic rationale for each decision
    - Practical implementation details
    """

    response = await team.arun(prompt)
    return response.content


async def run_brand_guidelines(
    team: Team,
    brand_strategy: str,
    brand_voice: str,
    visual_identity: str,
) -> str:
    """
    Run the Brand Guidelines workflow.

    Creates comprehensive brand documentation.
    """
    prompt = f"""
    ## Brand Guidelines Workflow

    Create comprehensive brand guidelines documentation.

    **Brand Strategy:**
    {brand_strategy}

    **Brand Voice:**
    {brand_voice}

    **Visual Identity:**
    {visual_identity}

    Create a complete brand guidelines document including:

    1. **Introduction**
       - Brand story
       - Mission and vision
       - Brand promise

    2. **Brand Strategy Summary**
       - Positioning statement
       - Brand archetype
       - Core values
       - Personality traits

    3. **Logo Guidelines**
       - Logo variations
       - Clear space rules
       - Minimum sizes
       - Color variations
       - Incorrect usage examples

    4. **Color System**
       - Complete color palette
       - Usage guidelines
       - Accessibility requirements

    5. **Typography System**
       - Font specifications
       - Type hierarchy
       - Usage examples

    6. **Voice and Tone**
       - Voice attributes
       - Tone by context
       - Writing guidelines
       - Templates

    7. **Photography and Imagery**
       - Style guidelines
       - Dos and don'ts

    8. **Applications**
       - Business cards
       - Letterhead
       - Email signatures
       - Social media
       - Presentations

    Output format:
    - Complete brand guidelines document
    - Organized by section
    - Ready for PDF generation
    """

    response = await team.arun(prompt)
    return response.content


async def run_asset_generation(
    team: Team,
    visual_identity: str,
    brand_name: str,
) -> str:
    """
    Run the Asset Generation workflow.

    Creates specifications for all required brand assets.
    """
    prompt = f"""
    ## Asset Generation Workflow

    Create comprehensive asset specifications for:

    **Brand Name:** {brand_name}

    **Visual Identity:**
    {visual_identity}

    Define all required brand assets with specifications:

    1. **Logo Package**
       - Primary logo: formats, sizes, naming
       - Secondary logo: formats, sizes, naming
       - Icon: formats, sizes, naming
       - Favicon: all required sizes
       - Color variants for each

    2. **Social Media Assets**
       - Facebook: profile, cover, post template
       - Instagram: profile, post, story templates
       - LinkedIn: profile, cover, post template
       - Twitter/X: profile, header
       - YouTube: profile, banner, thumbnail template

    3. **Business Collateral**
       - Business card specifications
       - Letterhead template
       - Envelope design
       - Email signature (HTML)

    4. **Digital Assets**
       - Open Graph images
       - Email header/footer
       - Presentation template
       - App icons (if applicable)

    5. **Package Structure**
       - Folder organization
       - File naming convention
       - README content

    Output format:
    - Complete asset checklist with specifications
    - Exact dimensions for each asset
    - File formats required
    - Organized package structure
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
        team = create_branding_team(
            session_id="demo_branding_session",
            user_id="demo_user",
            debug_mode=True,
        )

        # Run quick branding
        response = await team.arun(
            "Create a brand strategy for an AI-powered platform that helps "
            "small businesses automate 90% of their operations with just "
            "5 hours per week of human oversight. The brand name is HYVVE."
        )

        print(response.content)

    asyncio.run(demo())
