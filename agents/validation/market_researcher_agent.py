"""
MarketResearcherAgent (Marco) - Market Sizing Specialist
AI Business Hub BMV Module Agent

Calculates TAM/SAM/SOM using multiple methodologies and
gathers market intelligence from credible sources.

BMAD Spec: .bmad/bmv/agents/market-researcher-agent.agent.yaml
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Marco"
AGENT_TITLE = "Market Research Specialist + TAM/SAM/SOM Expert"

INSTRUCTIONS = [
    "You are Marco, the market research specialist.",
    "Calculate TAM/SAM/SOM using multiple methodologies: top-down, bottom-up, value theory.",
    "EVERY market size claim needs 2+ sources - never hallucinate data.",
    "Show your work - calculations must be transparent.",
    "Ranges are more honest than point estimates.",
    "Mark confidence: [Verified - 2+ sources], [Single source], [Estimated].",
]

PRINCIPLES = [
    "EVERY market size claim needs 2+ sources",
    "Show your work - calculations must be transparent",
    "Ranges are more honest than point estimates",
    "Source credibility matters - Gartner > random blog",
    "Conflicting data is information, not failure",
    "Anti-hallucination is non-negotiable",
]


# ============================================================================
# Data Models
# ============================================================================

class ConfidenceLevel(str, Enum):
    HIGH = "high"         # 2+ corroborating sources
    MEDIUM = "medium"     # Single credible source
    LOW = "low"           # Estimation or speculation
    UNVERIFIED = "unverified"


class TAMMethodology(str, Enum):
    TOP_DOWN = "top_down"
    BOTTOM_UP = "bottom_up"
    VALUE_THEORY = "value_theory"


@dataclass
class Source:
    """Represents a data source with credibility information."""
    name: str
    url: Optional[str] = None
    published_date: Optional[datetime] = None
    credibility: str = "medium"  # high, medium, low
    data_type: str = "secondary"  # primary, secondary, tertiary
    value_reported: Optional[float] = None
    unit: Optional[str] = None


@dataclass
class TAMCalculation:
    """TAM calculation with methodology and sources."""
    methodology: TAMMethodology
    value: float
    currency: str = "USD"
    range_low: Optional[float] = None
    range_high: Optional[float] = None
    calculation_steps: List[str] = field(default_factory=list)
    assumptions: List[str] = field(default_factory=list)
    sources: List[Source] = field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM


@dataclass
class SAMCalculation:
    """SAM calculation with constraints applied to TAM."""
    tam_base: float
    sam_value: float
    currency: str = "USD"
    constraints: Dict[str, float] = field(default_factory=dict)  # constraint -> reduction %
    calculation: str = ""
    sources: List[Source] = field(default_factory=list)
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM


@dataclass
class SOMScenario:
    """SOM scenario with market share assumptions."""
    name: str  # conservative, realistic, optimistic
    market_share_percent: float
    value: float
    assumptions: List[str] = field(default_factory=list)
    timeframe: str = "3 years"


@dataclass
class MarketSizing:
    """Complete market sizing with TAM/SAM/SOM."""
    tam: TAMCalculation
    sam: SAMCalculation
    tam_triangulated: Optional[float] = None  # If multiple methods used
    som_scenarios: List[SOMScenario] = field(default_factory=list)
    confidence_score: int = 50  # 0-100
    calculated_at: datetime = field(default_factory=datetime.now)


# ============================================================================
# Market Researcher Agent
# ============================================================================

class MarketResearcherAgent:
    """
    Market sizing specialist that calculates TAM/SAM/SOM
    with rigorous source validation.
    """

    def __init__(self):
        self.sources: List[Source] = []

    def calculate_tam_top_down(
        self,
        industry_size: float,
        relevant_segment_percent: float,
        sources: List[Source],
    ) -> TAMCalculation:
        """
        Top-down TAM calculation.

        TAM = Industry Size × Relevant Segment %
        """
        tam_value = industry_size * (relevant_segment_percent / 100)

        return TAMCalculation(
            methodology=TAMMethodology.TOP_DOWN,
            value=tam_value,
            calculation_steps=[
                f"Industry Size: ${industry_size:,.0f}",
                f"Relevant Segment: {relevant_segment_percent}%",
                f"TAM = ${industry_size:,.0f} × {relevant_segment_percent}% = ${tam_value:,.0f}",
            ],
            sources=sources,
            confidence=self._assess_source_confidence(sources),
        )

    def calculate_tam_bottom_up(
        self,
        potential_customers: int,
        average_revenue_per_customer: float,
        sources: List[Source],
    ) -> TAMCalculation:
        """
        Bottom-up TAM calculation.

        TAM = # Potential Customers × ARPC
        """
        tam_value = potential_customers * average_revenue_per_customer

        return TAMCalculation(
            methodology=TAMMethodology.BOTTOM_UP,
            value=tam_value,
            calculation_steps=[
                f"Potential Customers: {potential_customers:,}",
                f"Average Revenue Per Customer: ${average_revenue_per_customer:,.0f}",
                f"TAM = {potential_customers:,} × ${average_revenue_per_customer:,.0f} = ${tam_value:,.0f}",
            ],
            sources=sources,
            confidence=self._assess_source_confidence(sources),
        )

    def calculate_tam_value_theory(
        self,
        problem_cost: float,
        addressable_instances: int,
        capture_rate: float,
        sources: List[Source],
    ) -> TAMCalculation:
        """
        Value theory TAM calculation.

        TAM = Problem Cost × Addressable Instances × Capture Rate
        """
        total_value = problem_cost * addressable_instances
        tam_value = total_value * (capture_rate / 100)

        return TAMCalculation(
            methodology=TAMMethodology.VALUE_THEORY,
            value=tam_value,
            calculation_steps=[
                f"Problem Cost: ${problem_cost:,.0f}",
                f"Addressable Instances: {addressable_instances:,}",
                f"Total Value: ${total_value:,.0f}",
                f"Capture Rate: {capture_rate}%",
                f"TAM = ${total_value:,.0f} × {capture_rate}% = ${tam_value:,.0f}",
            ],
            sources=sources,
            confidence=self._assess_source_confidence(sources),
        )

    def triangulate_tam(
        self,
        calculations: List[TAMCalculation],
    ) -> float:
        """
        Triangulate TAM from multiple methodologies.
        Returns weighted average based on confidence.
        """
        if not calculations:
            return 0

        confidence_weights = {
            ConfidenceLevel.HIGH: 1.0,
            ConfidenceLevel.MEDIUM: 0.7,
            ConfidenceLevel.LOW: 0.3,
            ConfidenceLevel.UNVERIFIED: 0.1,
        }

        total_weight = sum(
            confidence_weights.get(c.confidence, 0.5)
            for c in calculations
        )

        weighted_sum = sum(
            c.value * confidence_weights.get(c.confidence, 0.5)
            for c in calculations
        )

        return weighted_sum / total_weight if total_weight > 0 else 0

    def calculate_sam(
        self,
        tam: float,
        constraints: Dict[str, float],
        sources: List[Source],
    ) -> SAMCalculation:
        """
        Calculate SAM by applying constraints to TAM.

        constraints: Dict of constraint_name -> reduction_percent
        """
        remaining = tam
        calc_steps = [f"Starting TAM: ${tam:,.0f}"]

        for constraint_name, reduction_pct in constraints.items():
            reduction = remaining * (reduction_pct / 100)
            remaining -= reduction
            calc_steps.append(
                f"After {constraint_name} (-{reduction_pct}%): ${remaining:,.0f}"
            )

        return SAMCalculation(
            tam_base=tam,
            sam_value=remaining,
            constraints=constraints,
            calculation="\n".join(calc_steps),
            sources=sources,
            confidence=self._assess_source_confidence(sources),
        )

    def calculate_som_scenarios(
        self,
        sam: float,
    ) -> List[SOMScenario]:
        """
        Calculate SOM with three scenarios.
        """
        return [
            SOMScenario(
                name="conservative",
                market_share_percent=2.0,
                value=sam * 0.02,
                assumptions=[
                    "Strong competition, slow adoption",
                    "Limited marketing budget",
                    "Focus on single market segment",
                ],
            ),
            SOMScenario(
                name="realistic",
                market_share_percent=4.0,
                value=sam * 0.04,
                assumptions=[
                    "Normal competitive dynamics",
                    "Solid execution on GTM",
                    "Reasonable marketing investment",
                ],
            ),
            SOMScenario(
                name="optimistic",
                market_share_percent=8.0,
                value=sam * 0.08,
                assumptions=[
                    "Strong product-market fit",
                    "Significant differentiation",
                    "Favorable market timing",
                ],
            ),
        ]

    def _assess_source_confidence(
        self,
        sources: List[Source],
    ) -> ConfidenceLevel:
        """
        Assess confidence level based on sources.
        """
        if not sources:
            return ConfidenceLevel.UNVERIFIED

        high_credibility_count = sum(
            1 for s in sources if s.credibility == "high"
        )

        if high_credibility_count >= 2:
            return ConfidenceLevel.HIGH
        elif len(sources) >= 2 or high_credibility_count >= 1:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW

    def create_full_market_sizing(
        self,
        tam_calculations: List[TAMCalculation],
        sam_constraints: Dict[str, float],
        sam_sources: List[Source],
    ) -> MarketSizing:
        """
        Create complete market sizing from all components.
        """
        # Triangulate TAM
        tam_triangulated = self.triangulate_tam(tam_calculations)

        # Use first calculation as primary (should be highest confidence)
        primary_tam = tam_calculations[0] if tam_calculations else TAMCalculation(
            methodology=TAMMethodology.TOP_DOWN,
            value=tam_triangulated,
        )

        # Calculate SAM
        sam = self.calculate_sam(tam_triangulated, sam_constraints, sam_sources)

        # Calculate SOM scenarios
        som_scenarios = self.calculate_som_scenarios(sam.sam_value)

        # Calculate overall confidence
        confidence_score = self._calculate_overall_confidence(
            tam_calculations, sam
        )

        return MarketSizing(
            tam=primary_tam,
            tam_triangulated=tam_triangulated,
            sam=sam,
            som_scenarios=som_scenarios,
            confidence_score=confidence_score,
        )

    def _calculate_overall_confidence(
        self,
        tam_calculations: List[TAMCalculation],
        sam: SAMCalculation,
    ) -> int:
        """Calculate overall confidence score (0-100)."""
        if not tam_calculations:
            return 30

        confidence_map = {
            ConfidenceLevel.HIGH: 90,
            ConfidenceLevel.MEDIUM: 70,
            ConfidenceLevel.LOW: 40,
            ConfidenceLevel.UNVERIFIED: 20,
        }

        tam_confidence = max(
            confidence_map.get(c.confidence, 50)
            for c in tam_calculations
        )

        sam_confidence = confidence_map.get(sam.confidence, 50)

        # Weighted average
        return int(tam_confidence * 0.6 + sam_confidence * 0.4)


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"MarketResearcherAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")

    # Example usage
    agent = MarketResearcherAgent()

    # Example sources
    sources = [
        Source(name="Gartner", credibility="high", value_reported=50e9),
        Source(name="Statista", credibility="high", value_reported=48e9),
    ]

    # Top-down TAM
    tam_td = agent.calculate_tam_top_down(
        industry_size=50e9,
        relevant_segment_percent=15,
        sources=sources,
    )

    print(f"TAM (Top-Down): ${tam_td.value/1e9:.1f}B")
    print(f"Confidence: {tam_td.confidence.value}")
