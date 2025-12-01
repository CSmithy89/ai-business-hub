"""
Financial Analyst Agent (Finn)
BMP - Business Planning Module

Finn specializes in financial projections, unit economics analysis,
and funding strategy development.

Responsibilities:
- Create 3-5 year financial projections
- Develop unit economics models
- Analyze funding requirements
- Build sensitivity analyses
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class ProjectionScenario(Enum):
    """Financial projection scenarios."""
    CONSERVATIVE = "conservative"
    REALISTIC = "realistic"
    OPTIMISTIC = "optimistic"


class FundingStage(Enum):
    """Startup funding stages."""
    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    GROWTH = "growth"
    BOOTSTRAPPED = "bootstrapped"


@dataclass
class RevenueProjection:
    """Monthly/annual revenue projection."""
    period: str  # "M1", "Y1", etc.
    revenue: float
    cogs: float
    gross_profit: float
    gross_margin: float

    # Breakdown
    revenue_by_stream: dict = field(default_factory=dict)

    # Assumptions
    assumptions: list = field(default_factory=list)


@dataclass
class CashFlowProjection:
    """Cash flow projection for a period."""
    period: str

    # Operating activities
    cash_from_operations: float

    # Investing activities
    capex: float

    # Financing activities
    funding_received: float
    debt_payments: float

    # Net position
    net_cash_flow: float
    ending_cash: float

    # Runway
    runway_months: Optional[int] = None


@dataclass
class UnitEconomics:
    """Unit economics analysis."""
    # Customer metrics
    cac: float  # Customer Acquisition Cost
    ltv: float  # Lifetime Value
    ltv_cac_ratio: float

    # Revenue metrics
    arpu: float  # Average Revenue Per User
    arpa: float  # Average Revenue Per Account

    # Churn metrics
    monthly_churn_rate: float
    customer_lifetime_months: float

    # Payback
    cac_payback_months: float

    # Margins
    gross_margin: float
    contribution_margin: float

    # Assumptions
    assumptions: dict = field(default_factory=dict)


@dataclass
class FundingRequirement:
    """Funding requirement analysis."""
    stage: FundingStage
    amount_needed: float
    use_of_funds: dict

    # Milestones
    pre_money_valuation: Optional[float] = None
    runway_months: int = 18
    key_milestones: list = field(default_factory=list)

    # Dilution
    equity_offered: Optional[float] = None


@dataclass
class FinancialProjections:
    """Complete financial projections package."""
    business_id: str
    scenario: ProjectionScenario

    # Time horizon
    projection_years: int = 5

    # Core projections
    revenue_projections: List[RevenueProjection] = field(default_factory=list)
    cash_flow_projections: List[CashFlowProjection] = field(default_factory=list)

    # Unit economics
    unit_economics: Optional[UnitEconomics] = None

    # Funding
    funding_requirements: List[FundingRequirement] = field(default_factory=list)

    # Key metrics summary
    break_even_month: Optional[int] = None
    peak_cash_need: Optional[float] = None

    # Assumptions
    key_assumptions: dict = field(default_factory=dict)

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Finn, the Financial Analyst for HYVVE's Business Planning Module.",
    "Your expertise is creating investor-grade financial projections and analysis.",
    "",
    "## Core Responsibilities",
    "1. Build 3-5 year financial projections (P&L, Cash Flow)",
    "2. Develop unit economics models (CAC, LTV, payback)",
    "3. Analyze funding requirements and use of funds",
    "4. Create sensitivity analyses for key assumptions",
    "",
    "## Financial Modeling Standards",
    "- Always model 3 scenarios: Conservative, Realistic, Optimistic",
    "- Show ALL assumptions explicitly - hidden assumptions kill credibility",
    "- Use industry benchmarks when available, cite sources",
    "- Connect revenue to TAM/SAM/SOM from validation",
    "- Model customer acquisition costs based on channel strategies",
    "",
    "## Key Metrics to Include",
    "- Monthly Recurring Revenue (MRR) / Annual (ARR)",
    "- Gross Margin and Contribution Margin",
    "- Customer Acquisition Cost (CAC)",
    "- Lifetime Value (LTV) and LTV/CAC ratio",
    "- Burn rate and runway",
    "- Break-even point",
    "",
    "## Unit Economics Rules",
    "- LTV/CAC should target 3:1 or better",
    "- CAC payback should be < 12 months for SaaS",
    "- Gross margins should support business model",
    "- Churn rates must be realistic for market segment",
    "",
    "## Projection Best Practices",
    "- Year 1: Monthly detail, clear ramp assumptions",
    "- Years 2-3: Quarterly, with growth rate assumptions",
    "- Years 4-5: Annual, with market share context",
    "- Always include break-even analysis",
    "- Show peak cash need and runway calculations",
]

PRINCIPLES = [
    "Never hide assumptions - transparency builds investor trust",
    "All projections must tie back to validation data",
    "Conservative scenarios should be genuinely conservative",
    "Unit economics must work before scaling makes sense",
    "Funding asks should be tied to specific milestones",
    "Financial models are communication tools, not just spreadsheets",
]
