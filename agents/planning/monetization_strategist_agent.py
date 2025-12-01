"""
Monetization Strategist Agent (Revenue)
BMP - Business Planning Module

Revenue specializes in pricing strategy, revenue model design,
and monetization optimization.

Responsibilities:
- Design pricing strategies and tiers
- Create revenue model architectures
- Analyze competitive pricing
- Optimize for unit economics
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class PricingModel(Enum):
    """Types of pricing models."""
    FLAT_RATE = "flat_rate"
    TIERED = "tiered"
    PER_SEAT = "per_seat"
    USAGE_BASED = "usage_based"
    FREEMIUM = "freemium"
    HYBRID = "hybrid"
    VALUE_BASED = "value_based"
    COMPETITIVE = "competitive"
    PENETRATION = "penetration"
    PREMIUM = "premium"


class PricingStrategy(Enum):
    """High-level pricing strategies."""
    PENETRATION = "penetration"  # Low price to gain market share
    SKIMMING = "skimming"  # High price, lower over time
    VALUE_BASED = "value_based"  # Price based on customer value
    COMPETITIVE = "competitive"  # Match or beat competitors
    COST_PLUS = "cost_plus"  # Cost + margin
    FREEMIUM = "freemium"  # Free base, paid premium


class BillingFrequency(Enum):
    """Billing frequency options."""
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    USAGE = "usage"


@dataclass
class PricingTier:
    """A single pricing tier."""
    name: str
    price_monthly: float
    price_annual: Optional[float] = None
    annual_discount: Optional[float] = None

    # Features
    features: list = field(default_factory=list)
    limits: dict = field(default_factory=dict)

    # Target
    target_segment: Optional[str] = None
    value_proposition: Optional[str] = None

    # Economics
    expected_percentage_of_customers: Optional[float] = None
    margin: Optional[float] = None


@dataclass
class CompetitorPricing:
    """Competitor pricing analysis."""
    competitor_name: str
    pricing_model: PricingModel
    lowest_tier_price: Optional[float] = None
    highest_tier_price: Optional[float] = None
    typical_price_point: Optional[float] = None
    key_differentiators: list = field(default_factory=list)
    source_url: Optional[str] = None


@dataclass
class PricingRecommendation:
    """Complete pricing recommendation."""
    business_id: str

    # Strategy
    primary_strategy: PricingStrategy
    pricing_model: PricingModel
    billing_frequency: BillingFrequency

    # Tiers
    tiers: List[PricingTier] = field(default_factory=list)

    # Analysis
    competitive_analysis: List[CompetitorPricing] = field(default_factory=list)
    value_anchor: Optional[str] = None  # What value justifies price
    price_sensitivity_notes: Optional[str] = None

    # Unit economics impact
    target_arpu: Optional[float] = None
    target_gross_margin: Optional[float] = None

    # Positioning
    positioning_statement: Optional[str] = None

    # Metadata
    confidence: str = "medium"
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RevenueModel:
    """Complete revenue model architecture."""
    business_id: str

    # Revenue streams
    primary_stream: str
    secondary_streams: list = field(default_factory=list)

    # Revenue composition (Year 1 target)
    stream_percentages: dict = field(default_factory=dict)

    # Growth levers
    growth_levers: list = field(default_factory=list)
    expansion_revenue_strategy: Optional[str] = None

    # Risks
    revenue_concentration_risk: Optional[str] = None
    churn_mitigation: list = field(default_factory=list)

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Revenue, the Monetization Strategist for HYVVE's Business Planning Module.",
    "Your expertise is designing pricing strategies that maximize revenue while supporting growth.",
    "",
    "## Core Responsibilities",
    "1. Design pricing strategy and tier structure",
    "2. Analyze competitive pricing landscape",
    "3. Create revenue model architecture",
    "4. Optimize for unit economics",
    "",
    "## Pricing Strategy Framework",
    "",
    "### 1. Value-Based Pricing (Recommended Default)",
    "- Start with customer value, not costs",
    "- Price = (Customer Value x Capture Rate)",
    "- Typical capture rate: 10-25% of value created",
    "",
    "### 2. Competitive Positioning",
    "- Premium: 20-50% above market leader",
    "- Parity: Within 10% of competitors",
    "- Penetration: 20-40% below to gain share",
    "",
    "### 3. Tier Design Best Practices",
    "- 3-4 tiers is optimal (avoid choice paralysis)",
    "- Feature differentiation should be clear",
    "- Middle tier should be the 'obvious choice'",
    "- Enterprise tier for custom pricing",
    "",
    "## Unit Economics Requirements",
    "- Gross margin > 60% for SaaS",
    "- Price must support target LTV/CAC ratio (3:1+)",
    "- Expansion revenue should offset churn",
    "",
    "## Pricing Psychology",
    "- Anchor with highest tier first",
    "- Use .99 endings strategically",
    "- Annual discount of 15-20% is standard",
    "- Free tier requires clear upgrade path",
    "",
    "## Revenue Model Design",
    "- Primary stream should be 70%+ of revenue",
    "- Secondary streams reduce concentration risk",
    "- Expansion revenue > new customer revenue at scale",
]

PRINCIPLES = [
    "Price based on value delivered, not cost incurred",
    "Pricing must support required unit economics",
    "Competitive analysis requires actual source URLs",
    "Tiers should guide customers to optimal choice",
    "Annual pricing discounts must be financially sound",
    "Free tiers must have clear conversion economics",
]
