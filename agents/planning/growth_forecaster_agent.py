"""
Growth Forecaster Agent (Forecast)
BMP - Business Planning Module

Forecast specializes in growth projections, scenario planning,
and milestone roadmap creation.

Responsibilities:
- Create multi-year growth scenarios
- Develop milestone roadmaps
- Analyze market penetration
- Model scaling assumptions
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class GrowthStage(Enum):
    """Business growth stages."""
    PRE_LAUNCH = "pre_launch"
    LAUNCH = "launch"
    TRACTION = "traction"
    SCALING = "scaling"
    EXPANSION = "expansion"
    MATURITY = "maturity"


class ScenarioType(Enum):
    """Growth scenario types."""
    CONSERVATIVE = "conservative"
    REALISTIC = "realistic"
    OPTIMISTIC = "optimistic"


class GrowthDriver(Enum):
    """Primary growth drivers."""
    PRODUCT_LED = "product_led"
    SALES_LED = "sales_led"
    MARKETING_LED = "marketing_led"
    PARTNERSHIP_LED = "partnership_led"
    VIRAL = "viral"
    HYBRID = "hybrid"


@dataclass
class GrowthAssumption:
    """A single growth assumption."""
    name: str
    value: str
    rationale: str
    source: Optional[str] = None
    sensitivity: str = "medium"  # high, medium, low - how much it affects outcomes


@dataclass
class GrowthMilestone:
    """A growth milestone with targets."""
    name: str
    target_date: str  # "Month 6", "Year 1", etc.
    metrics: dict  # {"mrr": 10000, "customers": 100, etc.}
    dependencies: list = field(default_factory=list)
    confidence: str = "medium"


@dataclass
class ScenarioProjection:
    """Projection for a specific scenario."""
    scenario: ScenarioType
    year: int

    # Customer metrics
    customers_start: int
    customers_end: int
    customer_growth_rate: float

    # Revenue metrics
    mrr_start: float
    mrr_end: float
    arr: float
    revenue_growth_rate: float

    # Market metrics
    market_share: float
    sam_penetration: float

    # Team metrics
    team_size: int

    # Key assumptions
    assumptions: List[GrowthAssumption] = field(default_factory=list)


@dataclass
class MarketPenetration:
    """Market penetration analysis."""
    business_id: str

    # Market sizing (from validation)
    tam: float
    sam: float
    som_year_1: float
    som_year_3: float
    som_year_5: float

    # Penetration rates
    sam_penetration_year_1: float
    sam_penetration_year_3: float
    sam_penetration_year_5: float

    # Benchmark comparison
    industry_average_penetration: Optional[float] = None
    top_performer_penetration: Optional[float] = None

    # Analysis
    penetration_barriers: list = field(default_factory=list)
    penetration_accelerators: list = field(default_factory=list)


@dataclass
class GrowthForecast:
    """Complete growth forecast package."""
    business_id: str

    # Current state
    current_stage: GrowthStage
    primary_growth_driver: GrowthDriver

    # Projections by scenario
    conservative_projections: List[ScenarioProjection] = field(default_factory=list)
    realistic_projections: List[ScenarioProjection] = field(default_factory=list)
    optimistic_projections: List[ScenarioProjection] = field(default_factory=list)

    # Market penetration
    market_penetration: Optional[MarketPenetration] = None

    # Milestones
    milestones: List[GrowthMilestone] = field(default_factory=list)

    # Key assumptions
    key_assumptions: List[GrowthAssumption] = field(default_factory=list)

    # Risks and mitigations
    growth_risks: list = field(default_factory=list)
    mitigation_strategies: list = field(default_factory=list)

    # Metadata
    forecast_horizon_years: int = 5
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Forecast, the Growth Forecaster for HYVVE's Business Planning Module.",
    "Your expertise is creating realistic growth projections and milestone roadmaps.",
    "",
    "## Core Responsibilities",
    "1. Create 3-5 year growth forecasts with scenarios",
    "2. Develop milestone roadmaps with clear targets",
    "3. Analyze market penetration potential",
    "4. Model scaling assumptions and dependencies",
    "",
    "## Growth Forecasting Framework",
    "",
    "### 1. Scenario Design",
    "- **Conservative**: 50th percentile outcome, things go slower than hoped",
    "- **Realistic**: 70th percentile, reasonable execution",
    "- **Optimistic**: 90th percentile, exceptional execution + market tailwinds",
    "",
    "### 2. Growth Rate Guidelines (SaaS)",
    "Year 1: 0 to first customers (product-market fit)",
    "Year 2: 2-3x growth (traction)",
    "Year 3: 2-2.5x growth (scaling)",
    "Year 4: 1.5-2x growth (expansion)",
    "Year 5: 1.3-1.5x growth (maturity)",
    "",
    "### 3. Market Penetration Reality Check",
    "- Year 1 SOM should be < 1% of SAM (usually 0.1-0.5%)",
    "- Year 3 SOM should be 1-5% of SAM",
    "- Year 5 SOM rarely exceeds 10% of SAM for new entrants",
    "",
    "## Milestone Design",
    "- Milestones should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)",
    "- Include leading indicators, not just lagging",
    "- Tie milestones to funding stages if applicable",
    "",
    "## Growth Driver Analysis",
    "- Product-Led: Focus on activation, retention, referral metrics",
    "- Sales-Led: Focus on pipeline, close rates, sales cycle",
    "- Marketing-Led: Focus on CAC, attribution, brand awareness",
    "- Viral: Focus on K-factor, invite rates, network effects",
    "",
    "## Assumption Transparency",
    "- Every projection needs explicit assumptions",
    "- Sensitivity analysis for high-impact assumptions",
    "- Source benchmarks when available",
]

PRINCIPLES = [
    "Conservative scenarios should be genuinely conservative",
    "Optimistic scenarios should be achievable, not fantasy",
    "Market penetration must be realistic for new entrants",
    "Milestones must be specific and measurable",
    "Assumptions must be explicit and traceable",
    "Growth rates should decline as business matures",
]
