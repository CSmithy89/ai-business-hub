"""
Planning Orchestrator Agent (Blake / Blueprint)
BMP - Business Planning Module

Blake coordinates business planning activities, ensuring comprehensive
coverage of business model, financials, pricing, and growth forecasting.

Responsibilities:
- Guide users through business planning process
- Delegate to specialist agents for deep analysis
- Synthesize findings into investor-ready documentation
- Ensure all planning elements are aligned and consistent
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class PlanningStage(Enum):
    """Stages of the planning workflow."""
    BUSINESS_MODEL_CANVAS = "business_model_canvas"
    FINANCIAL_PROJECTIONS = "financial_projections"
    PRICING_STRATEGY = "pricing_strategy"
    REVENUE_MODEL = "revenue_model"
    GROWTH_FORECAST = "growth_forecast"
    BUSINESS_PLAN = "business_plan"
    PITCH_DECK = "pitch_deck"


class PlanningStatus(Enum):
    """Status of a planning session."""
    IN_PROGRESS = "in_progress"
    PENDING_INPUT = "pending_input"
    COMPLETE = "complete"
    ARCHIVED = "archived"


@dataclass
class PlanningSession:
    """Represents a business planning session."""
    business_id: str
    session_id: str
    current_stage: PlanningStage
    status: PlanningStatus = PlanningStatus.IN_PROGRESS

    # Inputs from validation
    validation_score: Optional[float] = None
    market_sizing: Optional[dict] = None
    competitors: Optional[list] = None
    icps: Optional[list] = None

    # Planning outputs
    canvas: Optional[dict] = None
    financials: Optional[dict] = None
    pricing: Optional[dict] = None
    growth_forecast: Optional[dict] = None
    business_plan_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None

    # Progress tracking
    completed_stages: list = field(default_factory=list)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Blake (also known as Blueprint), the Planning Team Lead for HYVVE's Business Planning Module.",
    "Your mission is to transform validated business ideas into comprehensive, investor-ready business plans.",
    "",
    "## Your Team",
    "You lead a team of planning specialists:",
    "- Model: Business Model Canvas architect - creates the 9-block strategic foundation",
    "- Finn: Financial analyst - develops projections, unit economics, and funding strategies",
    "- Revenue: Monetization strategist - designs pricing and revenue models",
    "- Forecast: Growth planner - creates scenarios and milestone roadmaps",
    "",
    "## Planning Principles",
    "1. **Build on Validation**: Always reference the validation findings from BMV",
    "2. **Financial Rigor**: All projections must show assumptions and sensitivity analysis",
    "3. **Investor-Ready**: Documents should meet professional standards",
    "4. **Scenario Thinking**: Include conservative, realistic, and optimistic scenarios",
    "5. **Coherence**: All elements must align - canvas, financials, pricing, growth",
    "",
    "## Workflow Sequence",
    "1. Review validation inputs (TAM/SAM/SOM, competitors, ICPs)",
    "2. Business Model Canvas - strategic foundation",
    "3. Financial Projections - P&L, cash flow, balance sheet",
    "4. Pricing Strategy - positioning and revenue model",
    "5. Growth Forecast - 3-5 year scenarios",
    "6. Business Plan Synthesis - comprehensive document",
    "7. Pitch Deck Generation - presentation content",
    "",
    "## Communication Style",
    "- Be structured and professional",
    "- Explain financial concepts clearly for non-experts",
    "- Always show your work - assumptions drive credibility",
    "- Be honest about uncertainties in projections",
]

PRINCIPLES = [
    "Assumptions must be explicit and traceable to validation data",
    "Financial projections require 3 scenarios minimum",
    "Revenue models must connect to ICP willingness-to-pay",
    "Growth forecasts must include market share calculations",
    "Business plans follow standard investor expectations",
    "All numbers should be defensible in investor meetings",
]


@dataclass
class BusinessModelCanvasBlock:
    """A single block of the Business Model Canvas."""
    name: str
    content: list
    validation_notes: Optional[str] = None


@dataclass
class BusinessModelCanvas:
    """Complete Business Model Canvas structure."""
    key_partners: BusinessModelCanvasBlock
    key_activities: BusinessModelCanvasBlock
    key_resources: BusinessModelCanvasBlock
    value_propositions: BusinessModelCanvasBlock
    customer_relationships: BusinessModelCanvasBlock
    channels: BusinessModelCanvasBlock
    customer_segments: BusinessModelCanvasBlock
    cost_structure: BusinessModelCanvasBlock
    revenue_streams: BusinessModelCanvasBlock

    business_id: str
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)
