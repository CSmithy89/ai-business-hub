"""
Blake - Planning Team Lead & Orchestrator
BMP Planning Module - AI Business Hub

Blake coordinates the Planning Team, guiding users through business model
development, financial planning, and strategy synthesis.

Personality: Strategic, methodical, investor-focused, encouraging
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Blake"
AGENT_TITLE = "Planning Team Lead + Strategy Synthesizer"

INSTRUCTIONS = [
    "You are Blake, the Planning Team Lead for HYVVE's Business Planning Module.",
    "Your role is to guide entrepreneurs from validated idea to investor-ready business plan.",
    "",
    "## Your Team",
    "- Model: Business Model Canvas expert - creates value propositions and BMC",
    "- Finance: Financial Analyst - builds projections, P&L, cash flow",
    "- Revenue: Monetization Strategist - pricing, revenue models, unit economics",
    "- Forecast: Growth Forecaster - scenarios, assumptions, growth modeling",
    "",
    "## Your Responsibilities",
    "1. Orchestrate planning workflows in logical sequence",
    "2. Delegate specific tasks to appropriate team members",
    "3. Synthesize findings into coherent business strategy",
    "4. Ensure financial projections are realistic and defensible",
    "5. Prepare investor-ready documentation",
    "",
    "## Planning Workflow Sequence",
    "1. Business Model Canvas (Model leads)",
    "2. Financial Projections (Finance leads)",
    "3. Pricing Strategy (Revenue leads)",
    "4. Growth Forecast (Forecast leads)",
    "5. Business Plan Synthesis (You lead)",
    "6. Pitch Deck (Collaborative)",
    "",
    "## Key Principles",
    "- Build on validation data - don't ignore what was learned",
    "- Financial projections must be defensible with clear assumptions",
    "- Three scenarios: Conservative, Realistic, Optimistic",
    "- Every number needs a rationale",
    "- Investor-ready means detailed enough to answer follow-up questions",
]

PRINCIPLES = [
    "Build on validated data - incorporate market sizing and customer insights",
    "Financial projections must be defensible with stated assumptions",
    "Present three scenarios: Conservative (70% confidence), Realistic (50%), Optimistic (30%)",
    "Every number needs a clear rationale",
    "Investor-ready means detailed enough to withstand due diligence",
    "Focus on unit economics - they reveal business health",
    "Cash flow is king - profitability means nothing without cash",
    "Growth assumptions must tie to customer acquisition strategy",
]


# ============================================================================
# Data Models
# ============================================================================

class PlanningStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class PlanningStage(str, Enum):
    BUSINESS_MODEL_CANVAS = "business_model_canvas"
    FINANCIAL_PROJECTIONS = "financial_projections"
    PRICING_STRATEGY = "pricing_strategy"
    GROWTH_FORECAST = "growth_forecast"
    BUSINESS_PLAN = "business_plan"
    PITCH_DECK = "pitch_deck"


@dataclass
class BusinessModelCanvas:
    """Structured Business Model Canvas."""
    customer_segments: List[str] = field(default_factory=list)
    value_propositions: List[str] = field(default_factory=list)
    channels: List[str] = field(default_factory=list)
    customer_relationships: List[str] = field(default_factory=list)
    revenue_streams: List[str] = field(default_factory=list)
    key_resources: List[str] = field(default_factory=list)
    key_activities: List[str] = field(default_factory=list)
    key_partnerships: List[str] = field(default_factory=list)
    cost_structure: List[str] = field(default_factory=list)


@dataclass
class FinancialProjection:
    """3-year financial projection."""
    year: int
    revenue: float
    gross_profit: float
    operating_expenses: float
    ebitda: float
    assumptions: List[str] = field(default_factory=list)


@dataclass
class PlanningSession:
    """Tracks a planning session through all stages."""
    id: str
    tenant_id: str
    user_id: str
    business_id: str
    status: PlanningStatus = PlanningStatus.DRAFT
    current_stage: PlanningStage = PlanningStage.BUSINESS_MODEL_CANVAS

    # From validation
    validation_score: Optional[int] = None
    market_sizing: Optional[Dict] = None
    customer_profiles: Optional[Dict] = None

    # Stage results
    business_model_canvas: Optional[BusinessModelCanvas] = None
    financial_projections: Optional[List[FinancialProjection]] = None
    pricing_strategy: Optional[Dict] = None
    growth_forecast: Optional[Dict] = None
    business_plan: Optional[Dict] = None

    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"PlanningOrchestratorAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
