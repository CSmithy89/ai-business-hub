"""
CompetitorAnalystAgent (Cipher) - Competitive Intelligence Specialist
AI Business Hub BMV Module Agent

Identifies competitors, analyzes positioning, and finds market gaps.

BMAD Spec: .bmad/bmv/agents/competitor-analyst-agent.agent.yaml
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Cipher"
AGENT_TITLE = "Competitive Intelligence Specialist + Positioning Expert"

INSTRUCTIONS = [
    "You are Cipher, the competitive intelligence specialist.",
    "Identify direct competitors, indirect competitors, and substitutes.",
    "Create feature matrices and positioning maps.",
    "Apply Porter's Five Forces framework.",
    "Respect competitors - they're successful for reasons.",
    "Identify gaps that are true opportunities, not just underserved areas.",
]

PRINCIPLES = [
    "Respect competitors - they're successful for reasons",
    "Direct competitors aren't the only threat",
    "Pricing is a signal, not just a number",
    "Gaps aren't always opportunities",
    "Differentiation must be defensible",
]


# ============================================================================
# Data Models
# ============================================================================

class CompetitorType(str, Enum):
    DIRECT = "direct"           # Same product, same market
    INDIRECT = "indirect"       # Different product, same problem
    POTENTIAL = "potential"     # Could enter the market
    SUBSTITUTE = "substitute"   # Different solution to same need


class ForceRating(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class Competitor:
    """Represents a competitor in the market."""
    name: str
    type: CompetitorType
    description: str
    website: Optional[str] = None
    founded: Optional[int] = None
    employees: Optional[str] = None  # Range like "50-100"
    funding: Optional[str] = None
    headquarters: Optional[str] = None
    key_differentiator: Optional[str] = None


@dataclass
class CompetitorProfile:
    """Detailed competitor profile."""
    competitor: Competitor
    products: List[str] = field(default_factory=list)
    pricing_tiers: Dict[str, float] = field(default_factory=dict)
    target_market: str = ""
    positioning: str = ""
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    recent_news: List[str] = field(default_factory=list)
    customer_reviews: Optional[Dict] = None
    sources: List[str] = field(default_factory=list)
    profiled_at: datetime = field(default_factory=datetime.now)


@dataclass
class FeatureComparison:
    """Feature comparison across competitors."""
    feature: str
    category: str  # e.g., "core", "advanced", "nice-to-have"
    your_product: str  # "yes", "no", "partial", "planned"
    competitors: Dict[str, str] = field(default_factory=dict)  # competitor -> support level


@dataclass
class PositioningMap:
    """Competitive positioning on two dimensions."""
    x_axis: str  # e.g., "Price"
    y_axis: str  # e.g., "Feature Completeness"
    positions: Dict[str, tuple] = field(default_factory=dict)  # competitor -> (x, y)
    white_space: List[str] = field(default_factory=list)
    recommended_position: Optional[tuple] = None


@dataclass
class MarketGap:
    """Identified gap in the market."""
    description: str
    gap_type: str  # "underserved_segment", "missing_feature", "price_point", "geographic"
    evidence: List[str] = field(default_factory=list)
    opportunity_size: str = "unknown"  # "small", "medium", "large"
    risk: str = "medium"  # Why hasn't anyone filled it?


@dataclass
class ForceAssessment:
    """Assessment of a single Porter's Force."""
    rating: ForceRating
    factors: List[str] = field(default_factory=list)
    evidence: List[str] = field(default_factory=list)


@dataclass
class PortersFiveForces:
    """Complete Five Forces analysis."""
    supplier_power: ForceAssessment
    buyer_power: ForceAssessment
    competitive_rivalry: ForceAssessment
    threat_of_new_entry: ForceAssessment
    threat_of_substitutes: ForceAssessment
    overall_attractiveness: ForceRating = ForceRating.MEDIUM
    summary: str = ""


# ============================================================================
# Competitor Analyst Agent
# ============================================================================

class CompetitorAnalystAgent:
    """
    Competitive intelligence specialist that maps the competitive
    landscape and identifies positioning opportunities.
    """

    def __init__(self):
        self.competitors: List[Competitor] = []
        self.profiles: List[CompetitorProfile] = []

    def categorize_competitor(
        self,
        name: str,
        description: str,
        same_product: bool,
        same_market: bool,
        could_enter: bool = False,
    ) -> Competitor:
        """
        Categorize a competitor by type.
        """
        if same_product and same_market:
            comp_type = CompetitorType.DIRECT
        elif not same_product and same_market:
            comp_type = CompetitorType.INDIRECT
        elif could_enter:
            comp_type = CompetitorType.POTENTIAL
        else:
            comp_type = CompetitorType.SUBSTITUTE

        return Competitor(
            name=name,
            type=comp_type,
            description=description,
        )

    def create_feature_matrix(
        self,
        features: List[Dict],
        competitors: List[str],
        your_product_features: Dict[str, str],
    ) -> List[FeatureComparison]:
        """
        Create feature comparison matrix.

        features: List of {"name": str, "category": str, "competitors": Dict[str, str]}
        """
        matrix = []

        for feature in features:
            comparison = FeatureComparison(
                feature=feature["name"],
                category=feature.get("category", "core"),
                your_product=your_product_features.get(feature["name"], "unknown"),
                competitors=feature.get("competitors", {}),
            )
            matrix.append(comparison)

        return matrix

    def analyze_feature_gaps(
        self,
        matrix: List[FeatureComparison],
    ) -> Dict:
        """
        Analyze feature matrix for gaps and opportunities.
        """
        must_have = []
        differentiators = []
        missing = []

        for comp in matrix:
            # Count how many competitors have this feature
            competitor_support = sum(
                1 for v in comp.competitors.values()
                if v in ["yes", "partial"]
            )
            total_competitors = len(comp.competitors)

            # If most competitors have it, it's table stakes
            if competitor_support / max(total_competitors, 1) > 0.7:
                must_have.append(comp.feature)
            # If few competitors have it, potential differentiator
            elif competitor_support / max(total_competitors, 1) < 0.3:
                if comp.your_product in ["yes", "partial", "planned"]:
                    differentiators.append(comp.feature)
            # If you don't have it but should
            if comp.your_product in ["no", "unknown"] and comp.category == "core":
                missing.append(comp.feature)

        return {
            "must_have_features": must_have,
            "potential_differentiators": differentiators,
            "missing_features": missing,
        }

    def create_positioning_map(
        self,
        x_axis: str,
        y_axis: str,
        competitor_positions: Dict[str, tuple],
        your_position: Optional[tuple] = None,
    ) -> PositioningMap:
        """
        Create 2D positioning map.

        competitor_positions: Dict of name -> (x_value, y_value) where values are 1-10
        """
        positions = competitor_positions.copy()
        if your_position:
            positions["Your Product"] = your_position

        # Find white space (areas with no competitors)
        white_space = self._find_white_space(positions)

        return PositioningMap(
            x_axis=x_axis,
            y_axis=y_axis,
            positions=positions,
            white_space=white_space,
            recommended_position=self._recommend_position(positions, white_space),
        )

    def _find_white_space(
        self,
        positions: Dict[str, tuple],
    ) -> List[str]:
        """
        Identify quadrants with no or few competitors.
        """
        quadrants = {
            "low-low": [],
            "low-high": [],
            "high-low": [],
            "high-high": [],
        }

        for name, (x, y) in positions.items():
            if name == "Your Product":
                continue
            x_level = "high" if x > 5 else "low"
            y_level = "high" if y > 5 else "low"
            quadrants[f"{x_level}-{y_level}"].append(name)

        white_space = []
        for quadrant, occupants in quadrants.items():
            if len(occupants) == 0:
                white_space.append(f"Empty quadrant: {quadrant}")
            elif len(occupants) == 1:
                white_space.append(f"Underserved quadrant: {quadrant} (only {occupants[0]})")

        return white_space

    def _recommend_position(
        self,
        positions: Dict[str, tuple],
        white_space: List[str],
    ) -> Optional[tuple]:
        """
        Recommend positioning based on white space.
        """
        # Simple heuristic: recommend first identified white space
        if white_space:
            # Parse the quadrant from first white space
            first = white_space[0].lower()
            if "low-low" in first:
                return (3, 3)
            elif "low-high" in first:
                return (3, 7)
            elif "high-low" in first:
                return (7, 3)
            elif "high-high" in first:
                return (7, 7)
        return None

    def identify_market_gaps(
        self,
        feature_analysis: Dict,
        positioning_map: PositioningMap,
        competitor_weaknesses: List[str],
    ) -> List[MarketGap]:
        """
        Identify market gaps from various analyses.
        """
        gaps = []

        # From positioning white space
        for ws in positioning_map.white_space:
            gaps.append(MarketGap(
                description=ws,
                gap_type="positioning",
                evidence=[f"Positioning analysis: {ws}"],
            ))

        # From missing features that could differentiate
        for diff in feature_analysis.get("potential_differentiators", []):
            gaps.append(MarketGap(
                description=f"Feature opportunity: {diff}",
                gap_type="missing_feature",
                evidence=["Feature matrix analysis"],
            ))

        # From common weaknesses
        weakness_counts: Dict[str, int] = {}
        for weakness in competitor_weaknesses:
            weakness_counts[weakness] = weakness_counts.get(weakness, 0) + 1

        for weakness, count in weakness_counts.items():
            if count >= 2:  # Multiple competitors share this weakness
                gaps.append(MarketGap(
                    description=f"Address common competitor weakness: {weakness}",
                    gap_type="underserved_segment",
                    evidence=[f"{count} competitors weak in this area"],
                ))

        return gaps

    def analyze_five_forces(
        self,
        supplier_factors: List[str],
        buyer_factors: List[str],
        rivalry_factors: List[str],
        entry_factors: List[str],
        substitute_factors: List[str],
    ) -> PortersFiveForces:
        """
        Apply Porter's Five Forces framework.
        """
        forces = PortersFiveForces(
            supplier_power=ForceAssessment(
                rating=self._rate_force(supplier_factors),
                factors=supplier_factors,
            ),
            buyer_power=ForceAssessment(
                rating=self._rate_force(buyer_factors),
                factors=buyer_factors,
            ),
            competitive_rivalry=ForceAssessment(
                rating=self._rate_force(rivalry_factors),
                factors=rivalry_factors,
            ),
            threat_of_new_entry=ForceAssessment(
                rating=self._rate_force(entry_factors),
                factors=entry_factors,
            ),
            threat_of_substitutes=ForceAssessment(
                rating=self._rate_force(substitute_factors),
                factors=substitute_factors,
            ),
        )

        # Calculate overall attractiveness
        high_count = sum(
            1 for f in [
                forces.supplier_power,
                forces.buyer_power,
                forces.competitive_rivalry,
                forces.threat_of_new_entry,
                forces.threat_of_substitutes,
            ]
            if f.rating == ForceRating.HIGH
        )

        if high_count >= 3:
            forces.overall_attractiveness = ForceRating.LOW  # Many threats = low attractiveness
        elif high_count <= 1:
            forces.overall_attractiveness = ForceRating.HIGH
        else:
            forces.overall_attractiveness = ForceRating.MEDIUM

        forces.summary = self._generate_forces_summary(forces)
        return forces

    def _rate_force(self, factors: List[str]) -> ForceRating:
        """
        Simple heuristic: more factors = higher force.
        In practice, this would be more nuanced.
        """
        if len(factors) >= 4:
            return ForceRating.HIGH
        elif len(factors) >= 2:
            return ForceRating.MEDIUM
        else:
            return ForceRating.LOW

    def _generate_forces_summary(self, forces: PortersFiveForces) -> str:
        """Generate summary of Five Forces analysis."""
        ratings = {
            "Supplier Power": forces.supplier_power.rating.value,
            "Buyer Power": forces.buyer_power.rating.value,
            "Competitive Rivalry": forces.competitive_rivalry.rating.value,
            "Threat of Entry": forces.threat_of_new_entry.rating.value,
            "Threat of Substitutes": forces.threat_of_substitutes.rating.value,
        }

        high_forces = [k for k, v in ratings.items() if v == "high"]
        low_forces = [k for k, v in ratings.items() if v == "low"]

        summary = f"Overall industry attractiveness: {forces.overall_attractiveness.value}. "
        if high_forces:
            summary += f"Key challenges: {', '.join(high_forces)}. "
        if low_forces:
            summary += f"Favorable factors: {', '.join(low_forces)}."

        return summary


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"CompetitorAnalystAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")

    # Example usage
    agent = CompetitorAnalystAgent()

    # Example positioning map
    pos_map = agent.create_positioning_map(
        x_axis="Price",
        y_axis="Features",
        competitor_positions={
            "Competitor A": (8, 9),
            "Competitor B": (6, 7),
            "Competitor C": (3, 4),
        },
        your_position=(5, 8),
    )

    print(f"White space identified: {pos_map.white_space}")
    print(f"Recommended position: {pos_map.recommended_position}")
