"""
FeasibilityAssessorAgent (Risk) - Feasibility Analyst
AI Business Hub BMV Module Agent

Identifies risks, assesses feasibility, and provides go/no-go input.

BMAD Spec: .bmad/bmv/agents/feasibility-assessor-agent.agent.yaml
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Risk"
AGENT_TITLE = "Feasibility Analyst + Risk Assessment Expert"

INSTRUCTIONS = [
    "You are Risk, the feasibility analyst.",
    "Identify and categorize risks: market, technical, financial, operational.",
    "Score risks using Impact x Probability matrix.",
    "Assess technical and financial feasibility.",
    "Every risk has a mitigation (or it's a constraint).",
    "Fatal risks are different from manageable risks.",
]

PRINCIPLES = [
    "Every risk has a mitigation (or it's a constraint)",
    "Impact x Probability = Priority",
    "Unknown unknowns are the real threat",
    "First-mover advantage is often a myth",
    "Resource constraints shape strategy",
    "Risk tolerance varies - understand the context",
    "Fatal risks are different from manageable risks",
]


# ============================================================================
# Data Models
# ============================================================================

class RiskCategory(str, Enum):
    MARKET = "market"
    COMPETITIVE = "competitive"
    TECHNICAL = "technical"
    FINANCIAL = "financial"
    OPERATIONAL = "operational"
    REGULATORY = "regulatory"


class RiskSeverity(str, Enum):
    LOW = "low"           # Score 1-6
    MEDIUM = "medium"     # Score 7-14
    HIGH = "high"         # Score 15-25
    FATAL = "fatal"       # Must resolve before proceeding


class FeasibilityRating(str, Enum):
    FEASIBLE = "feasible"
    FEASIBLE_WITH_CAVEATS = "feasible_with_caveats"
    NOT_FEASIBLE = "not_feasible"


class TechReadiness(str, Enum):
    READY = "ready"               # Technology exists and proven
    EMERGING = "emerging"         # Technology exists but maturing
    EXPERIMENTAL = "experimental" # R&D stage
    NOT_POSSIBLE = "not_possible" # Technology doesn't exist


@dataclass
class Risk:
    """Represents an identified risk."""
    name: str
    category: RiskCategory
    description: str
    trigger: str  # What would cause this risk to materialize

    # Scoring (1-5 each)
    impact: int = 3
    probability: int = 3

    # Calculated
    score: int = field(init=False)
    severity: RiskSeverity = field(init=False)

    # Mitigation
    mitigation_strategy: Optional[str] = None
    mitigation_cost: Optional[str] = None  # low, medium, high
    residual_risk: Optional[int] = None  # Score after mitigation

    def __post_init__(self):
        self.score = self.impact * self.probability
        if self.score <= 6:
            self.severity = RiskSeverity.LOW
        elif self.score <= 14:
            self.severity = RiskSeverity.MEDIUM
        elif self.score <= 25:
            if self.impact == 5:  # Critical impact
                self.severity = RiskSeverity.FATAL
            else:
                self.severity = RiskSeverity.HIGH


@dataclass
class RiskMatrix:
    """Risk matrix with all identified risks."""
    risks: List[Risk] = field(default_factory=list)

    def get_by_category(self, category: RiskCategory) -> List[Risk]:
        return [r for r in self.risks if r.category == category]

    def get_by_severity(self, severity: RiskSeverity) -> List[Risk]:
        return [r for r in self.risks if r.severity == severity]

    def get_fatal_risks(self) -> List[Risk]:
        return [r for r in self.risks if r.severity == RiskSeverity.FATAL]

    def get_top_risks(self, n: int = 5) -> List[Risk]:
        return sorted(self.risks, key=lambda r: r.score, reverse=True)[:n]

    def get_average_score(self) -> float:
        if not self.risks:
            return 0
        return sum(r.score for r in self.risks) / len(self.risks)


@dataclass
class CapabilityGap:
    """Gap in required capabilities."""
    skill: str
    current_level: str  # none, basic, intermediate, advanced
    required_level: str
    gap_severity: str  # low, medium, high
    solution: str  # hire, train, outsource, partner


@dataclass
class TechnicalFeasibility:
    """Technical feasibility assessment."""
    tech_readiness: TechReadiness
    development_complexity: str  # low, medium, high, very_high

    key_challenges: List[str] = field(default_factory=list)
    capability_gaps: List[CapabilityGap] = field(default_factory=list)
    mvp_requirements: List[str] = field(default_factory=list)
    scalability_notes: str = ""

    score: int = 5  # 1-10
    verdict: FeasibilityRating = FeasibilityRating.FEASIBLE_WITH_CAVEATS

    evidence: List[str] = field(default_factory=list)


@dataclass
class CapitalRequirement:
    """Capital requirement for a phase."""
    phase: str  # mvp, launch, scale
    amount: float
    currency: str = "USD"
    purpose: str = ""
    timeline_months: int = 0


@dataclass
class UnitEconomics:
    """Unit economics estimates."""
    cac: float  # Customer Acquisition Cost
    ltv: float  # Lifetime Value
    ltv_cac_ratio: float = field(init=False)
    payback_months: int = 0
    gross_margin_percent: float = 0

    def __post_init__(self):
        self.ltv_cac_ratio = self.ltv / self.cac if self.cac > 0 else 0


@dataclass
class FinancialFeasibility:
    """Financial feasibility assessment."""
    capital_requirements: List[CapitalRequirement] = field(default_factory=list)
    unit_economics: Optional[UnitEconomics] = None

    # Break-even
    fixed_costs_monthly: float = 0
    variable_cost_per_unit: float = 0
    price_per_unit: float = 0
    break_even_units: int = field(init=False)
    months_to_break_even: int = 0

    # Funding
    bootstrap_feasible: bool = False
    funding_required: float = 0
    runway_months: int = 0

    score: int = 5  # 1-10
    verdict: FeasibilityRating = FeasibilityRating.FEASIBLE_WITH_CAVEATS

    def __post_init__(self):
        margin = self.price_per_unit - self.variable_cost_per_unit
        if margin > 0:
            self.break_even_units = int(self.fixed_costs_monthly / margin)
        else:
            self.break_even_units = 0


@dataclass
class Barrier:
    """Barrier to entry."""
    name: str
    severity: str  # low, medium, high
    strategy_to_overcome: str


@dataclass
class Moat:
    """Potential competitive moat."""
    moat_type: str  # network_effects, switching_costs, brand, data, regulatory, cost
    feasibility: str  # low, medium, high
    time_to_build: str  # months or years


@dataclass
class BarrierAnalysis:
    """Analysis of barriers and moats."""
    entry_barriers: List[Barrier] = field(default_factory=list)
    potential_moats: List[Moat] = field(default_factory=list)

    current_defensibility: str = "low"  # low, medium, high
    potential_defensibility: str = "medium"
    time_to_defensibility: str = ""


@dataclass
class FeasibilityAssessment:
    """Complete feasibility assessment."""
    technical: TechnicalFeasibility
    financial: FinancialFeasibility
    barrier_analysis: BarrierAnalysis
    risk_matrix: RiskMatrix

    # Summary scores
    technical_score: int = 5
    financial_score: int = 5
    risk_score: int = 5  # Inverted - lower risk = higher score
    overall_score: int = field(init=False)

    # Recommendation
    verdict: str = ""  # proceed, proceed_with_caution, delay, do_not_proceed
    confidence_percent: int = 50
    key_conditions: List[str] = field(default_factory=list)

    assessed_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        self.overall_score = int(
            self.technical_score * 0.35 +
            self.financial_score * 0.35 +
            self.risk_score * 0.30
        )


# ============================================================================
# Feasibility Assessor Agent
# ============================================================================

class FeasibilityAssessorAgent:
    """
    Risk and feasibility analyst that assesses technical viability,
    financial requirements, and risks.
    """

    def __init__(self):
        self.risk_matrix = RiskMatrix()
        self.technical_assessment: Optional[TechnicalFeasibility] = None
        self.financial_assessment: Optional[FinancialFeasibility] = None

    def identify_risk(
        self,
        name: str,
        category: RiskCategory,
        description: str,
        trigger: str,
        impact: int,
        probability: int,
        mitigation: Optional[str] = None,
    ) -> Risk:
        """
        Identify and score a risk.

        Impact/Probability scale:
        1 - Minimal/Rare (<10%)
        2 - Low/Unlikely (10-25%)
        3 - Medium/Possible (25-50%)
        4 - High/Likely (50-75%)
        5 - Critical/Almost Certain (>75%)
        """
        risk = Risk(
            name=name,
            category=category,
            description=description,
            trigger=trigger,
            impact=min(max(impact, 1), 5),
            probability=min(max(probability, 1), 5),
            mitigation_strategy=mitigation,
        )

        self.risk_matrix.risks.append(risk)
        return risk

    def identify_risks_by_category(
        self,
        category: RiskCategory,
        risks: List[Dict],
    ) -> List[Risk]:
        """
        Identify multiple risks in a category.

        risks: List of {
            "name": str,
            "description": str,
            "trigger": str,
            "impact": int,
            "probability": int,
            "mitigation": str (optional)
        }
        """
        identified = []
        for r in risks:
            risk = self.identify_risk(
                name=r["name"],
                category=category,
                description=r["description"],
                trigger=r["trigger"],
                impact=r["impact"],
                probability=r["probability"],
                mitigation=r.get("mitigation"),
            )
            identified.append(risk)
        return identified

    def generate_risk_matrix_summary(self) -> Dict:
        """Generate risk matrix summary."""
        return {
            "total_risks": len(self.risk_matrix.risks),
            "fatal_risks": len(self.risk_matrix.get_fatal_risks()),
            "high_risks": len(self.risk_matrix.get_by_severity(RiskSeverity.HIGH)),
            "medium_risks": len(self.risk_matrix.get_by_severity(RiskSeverity.MEDIUM)),
            "low_risks": len(self.risk_matrix.get_by_severity(RiskSeverity.LOW)),
            "average_score": self.risk_matrix.get_average_score(),
            "top_risks": [
                {"name": r.name, "score": r.score, "severity": r.severity.value}
                for r in self.risk_matrix.get_top_risks(5)
            ],
            "by_category": {
                cat.value: len(self.risk_matrix.get_by_category(cat))
                for cat in RiskCategory
            },
        }

    def assess_technical_feasibility(
        self,
        tech_readiness: TechReadiness,
        complexity: str,
        challenges: List[str],
        capability_gaps: List[Dict],
        mvp_requirements: List[str],
        scalability_notes: str,
    ) -> TechnicalFeasibility:
        """
        Assess technical feasibility.

        capability_gaps: List of {
            "skill": str,
            "current": str,
            "required": str,
            "solution": str
        }
        """
        gaps = [
            CapabilityGap(
                skill=g["skill"],
                current_level=g["current"],
                required_level=g["required"],
                gap_severity=self._assess_gap_severity(g["current"], g["required"]),
                solution=g["solution"],
            )
            for g in capability_gaps
        ]

        # Calculate score
        score = 10

        # Deduct for tech readiness
        readiness_deductions = {
            TechReadiness.READY: 0,
            TechReadiness.EMERGING: 1,
            TechReadiness.EXPERIMENTAL: 3,
            TechReadiness.NOT_POSSIBLE: 8,
        }
        score -= readiness_deductions.get(tech_readiness, 2)

        # Deduct for complexity
        complexity_deductions = {"low": 0, "medium": 1, "high": 2, "very_high": 3}
        score -= complexity_deductions.get(complexity.lower(), 1)

        # Deduct for gaps
        high_gaps = sum(1 for g in gaps if g.gap_severity == "high")
        score -= min(high_gaps * 1, 3)

        score = max(score, 1)

        # Determine verdict
        if score >= 7:
            verdict = FeasibilityRating.FEASIBLE
        elif score >= 4:
            verdict = FeasibilityRating.FEASIBLE_WITH_CAVEATS
        else:
            verdict = FeasibilityRating.NOT_FEASIBLE

        assessment = TechnicalFeasibility(
            tech_readiness=tech_readiness,
            development_complexity=complexity,
            key_challenges=challenges,
            capability_gaps=gaps,
            mvp_requirements=mvp_requirements,
            scalability_notes=scalability_notes,
            score=score,
            verdict=verdict,
        )

        self.technical_assessment = assessment
        return assessment

    def _assess_gap_severity(self, current: str, required: str) -> str:
        """Assess severity of a capability gap."""
        levels = {"none": 0, "basic": 1, "intermediate": 2, "advanced": 3}
        current_level = levels.get(current.lower(), 0)
        required_level = levels.get(required.lower(), 2)

        gap = required_level - current_level
        if gap <= 0:
            return "low"
        elif gap == 1:
            return "low"
        elif gap == 2:
            return "medium"
        else:
            return "high"

    def assess_financial_feasibility(
        self,
        capital_requirements: List[Dict],
        cac: float,
        ltv: float,
        payback_months: int,
        gross_margin: float,
        fixed_costs_monthly: float,
        variable_cost_per_unit: float,
        price_per_unit: float,
        bootstrap_feasible: bool,
        funding_required: float,
    ) -> FinancialFeasibility:
        """
        Assess financial feasibility.

        capital_requirements: List of {
            "phase": str,
            "amount": float,
            "purpose": str,
            "timeline_months": int
        }
        """
        requirements = [
            CapitalRequirement(
                phase=r["phase"],
                amount=r["amount"],
                purpose=r["purpose"],
                timeline_months=r.get("timeline_months", 0),
            )
            for r in capital_requirements
        ]

        unit_economics = UnitEconomics(
            cac=cac,
            ltv=ltv,
            payback_months=payback_months,
            gross_margin_percent=gross_margin,
        )

        assessment = FinancialFeasibility(
            capital_requirements=requirements,
            unit_economics=unit_economics,
            fixed_costs_monthly=fixed_costs_monthly,
            variable_cost_per_unit=variable_cost_per_unit,
            price_per_unit=price_per_unit,
            bootstrap_feasible=bootstrap_feasible,
            funding_required=funding_required,
        )

        # Calculate score
        score = 5  # Base

        # LTV:CAC ratio bonus/penalty
        if unit_economics.ltv_cac_ratio >= 3:
            score += 2
        elif unit_economics.ltv_cac_ratio >= 2:
            score += 1
        elif unit_economics.ltv_cac_ratio < 1:
            score -= 2

        # Gross margin bonus/penalty
        if gross_margin >= 70:
            score += 2
        elif gross_margin >= 50:
            score += 1
        elif gross_margin < 30:
            score -= 2

        # Bootstrap feasibility bonus
        if bootstrap_feasible:
            score += 1

        assessment.score = min(max(score, 1), 10)

        # Determine verdict
        if assessment.score >= 7:
            assessment.verdict = FeasibilityRating.FEASIBLE
        elif assessment.score >= 4:
            assessment.verdict = FeasibilityRating.FEASIBLE_WITH_CAVEATS
        else:
            assessment.verdict = FeasibilityRating.NOT_FEASIBLE

        self.financial_assessment = assessment
        return assessment

    def analyze_barriers(
        self,
        entry_barriers: List[Dict],
        potential_moats: List[Dict],
    ) -> BarrierAnalysis:
        """
        Analyze barriers to entry and potential moats.

        entry_barriers: List of {"name": str, "severity": str, "strategy": str}
        potential_moats: List of {"type": str, "feasibility": str, "time": str}
        """
        barriers = [
            Barrier(
                name=b["name"],
                severity=b["severity"],
                strategy_to_overcome=b["strategy"],
            )
            for b in entry_barriers
        ]

        moats = [
            Moat(
                moat_type=m["type"],
                feasibility=m["feasibility"],
                time_to_build=m["time"],
            )
            for m in potential_moats
        ]

        # Assess defensibility
        high_barriers = sum(1 for b in barriers if b.severity == "high")
        feasible_moats = sum(1 for m in moats if m.feasibility in ["medium", "high"])

        if high_barriers >= 2:
            current_defensibility = "high"
        elif high_barriers >= 1:
            current_defensibility = "medium"
        else:
            current_defensibility = "low"

        if feasible_moats >= 2:
            potential_defensibility = "high"
        elif feasible_moats >= 1:
            potential_defensibility = "medium"
        else:
            potential_defensibility = "low"

        return BarrierAnalysis(
            entry_barriers=barriers,
            potential_moats=moats,
            current_defensibility=current_defensibility,
            potential_defensibility=potential_defensibility,
        )

    def generate_go_no_go_input(self) -> Dict:
        """
        Generate risk-based input for go/no-go decision.
        """
        fatal_risks = self.risk_matrix.get_fatal_risks()
        high_risks = self.risk_matrix.get_by_severity(RiskSeverity.HIGH)

        # Calculate scores
        technical_score = self.technical_assessment.score if self.technical_assessment else 5
        financial_score = self.financial_assessment.score if self.financial_assessment else 5

        # Risk score (inverted - fewer/lower risks = higher score)
        avg_risk = self.risk_matrix.get_average_score()
        risk_score = max(1, 10 - int(avg_risk / 2.5))  # Convert 0-25 to 10-1

        overall_score = int(
            technical_score * 0.35 +
            financial_score * 0.35 +
            risk_score * 0.30
        )

        # Determine verdict
        if fatal_risks:
            verdict = "do_not_proceed"
            confidence = 80
        elif overall_score >= 7:
            verdict = "proceed"
            confidence = 70
        elif overall_score >= 5:
            verdict = "proceed_with_caution"
            confidence = 60
        elif overall_score >= 3:
            verdict = "delay"
            confidence = 50
        else:
            verdict = "do_not_proceed"
            confidence = 70

        # Generate conditions
        conditions = []
        if fatal_risks:
            for risk in fatal_risks:
                conditions.append(f"Resolve fatal risk: {risk.name}")
        for risk in high_risks[:3]:
            if risk.mitigation_strategy:
                conditions.append(f"Mitigate: {risk.name} - {risk.mitigation_strategy}")

        return {
            "scores": {
                "technical_feasibility": technical_score,
                "financial_feasibility": financial_score,
                "risk_severity": risk_score,
                "overall": overall_score,
            },
            "fatal_risks": [r.name for r in fatal_risks],
            "critical_risks": [
                {"risk": r.name, "mitigation": r.mitigation_strategy}
                for r in high_risks[:5]
            ],
            "verdict": verdict,
            "confidence_percent": confidence,
            "key_conditions": conditions,
        }

    def create_full_assessment(
        self,
        technical: TechnicalFeasibility,
        financial: FinancialFeasibility,
        barriers: BarrierAnalysis,
    ) -> FeasibilityAssessment:
        """Create complete feasibility assessment."""
        # Calculate risk score
        avg_risk = self.risk_matrix.get_average_score()
        risk_score = max(1, 10 - int(avg_risk / 2.5))

        go_no_go = self.generate_go_no_go_input()

        return FeasibilityAssessment(
            technical=technical,
            financial=financial,
            barrier_analysis=barriers,
            risk_matrix=self.risk_matrix,
            technical_score=technical.score,
            financial_score=financial.score,
            risk_score=risk_score,
            verdict=go_no_go["verdict"],
            confidence_percent=go_no_go["confidence_percent"],
            key_conditions=go_no_go["key_conditions"],
        )


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"FeasibilityAssessorAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")

    # Example usage
    agent = FeasibilityAssessorAgent()

    # Identify some risks
    agent.identify_risk(
        name="Market timing risk",
        category=RiskCategory.MARKET,
        description="Market may not be ready for the solution",
        trigger="Low adoption rates",
        impact=4,
        probability=3,
        mitigation="Start with early adopter segment",
    )

    agent.identify_risk(
        name="Technical complexity",
        category=RiskCategory.TECHNICAL,
        description="Integration challenges with legacy systems",
        trigger="Longer development timeline",
        impact=3,
        probability=4,
        mitigation="Build abstraction layer",
    )

    # Get summary
    summary = agent.generate_risk_matrix_summary()
    print(f"Total risks: {summary['total_risks']}")
    print(f"Average risk score: {summary['average_score']:.1f}")

    # Technical feasibility
    tech = agent.assess_technical_feasibility(
        tech_readiness=TechReadiness.READY,
        complexity="medium",
        challenges=["API integration", "Data migration"],
        capability_gaps=[
            {"skill": "ML Engineering", "current": "basic", "required": "advanced", "solution": "hire"},
        ],
        mvp_requirements=["Core API", "Basic UI", "Auth"],
        scalability_notes="Can scale horizontally with standard cloud infrastructure",
    )

    print(f"Technical score: {tech.score}/10")
    print(f"Technical verdict: {tech.verdict.value}")
