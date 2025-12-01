"""
CustomerProfilerAgent (Persona) - Customer Research Specialist
AI Business Hub BMV Module Agent

Develops ideal customer profiles, personas, and jobs-to-be-done analysis.

BMAD Spec: .bmad/bmv/agents/customer-profiler-agent.agent.yaml
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Persona"
AGENT_TITLE = "Customer Research Specialist + ICP/JTBD Expert"

INSTRUCTIONS = [
    "You are Persona, the customer research specialist.",
    "Define the Ideal Customer Profile (ICP) with specificity.",
    "Create 3-5 distinct buyer personas with motivations and objections.",
    "Apply Jobs-to-be-Done framework to understand core needs.",
    "Personas need emotional truth, not just demographics.",
    "Validate willingness to pay, not just interest.",
]

PRINCIPLES = [
    "Everyone is not your customer - specificity beats breadth",
    "Personas need emotional truth, not just demographics",
    "Jobs-to-be-Done > demographics for understanding needs",
    "Willingness to pay != interest",
    "The decision maker may not be the user",
    "Pain intensity matters more than pain frequency",
]


# ============================================================================
# Data Models
# ============================================================================

class CustomerSegment(str, Enum):
    ENTERPRISE = "enterprise"
    MID_MARKET = "mid_market"
    SMB = "smb"
    STARTUP = "startup"
    CONSUMER = "consumer"
    PROSUMER = "prosumer"


class DecisionRole(str, Enum):
    DECISION_MAKER = "decision_maker"
    INFLUENCER = "influencer"
    USER = "user"
    GATEKEEPER = "gatekeeper"
    CHAMPION = "champion"


class PainIntensity(str, Enum):
    CRITICAL = "critical"     # Must solve now
    HIGH = "high"             # Actively seeking solutions
    MEDIUM = "medium"         # Acknowledges problem
    LOW = "low"               # Nice to have


@dataclass
class IdealCustomerProfile:
    """Ideal Customer Profile (ICP) definition."""
    segment: CustomerSegment
    industry: str
    company_size: str  # e.g., "10-50 employees"
    revenue_range: str  # e.g., "$1M-$10M ARR"

    # Characteristics
    key_characteristics: List[str] = field(default_factory=list)
    technology_stack: List[str] = field(default_factory=list)
    buying_triggers: List[str] = field(default_factory=list)

    # Qualification criteria
    must_have: List[str] = field(default_factory=list)
    nice_to_have: List[str] = field(default_factory=list)
    disqualifiers: List[str] = field(default_factory=list)

    # Budget
    typical_budget: Optional[str] = None
    budget_cycle: Optional[str] = None  # quarterly, annual, etc.

    confidence: int = 50  # 0-100


@dataclass
class CustomerPersona:
    """Detailed buyer persona."""
    name: str
    role: str
    segment: CustomerSegment
    decision_role: DecisionRole

    # Demographics
    age_range: str = ""
    experience_level: str = ""  # junior, mid, senior, executive

    # Psychographics
    goals: List[str] = field(default_factory=list)
    frustrations: List[str] = field(default_factory=list)
    motivations: List[str] = field(default_factory=list)
    fears: List[str] = field(default_factory=list)

    # Behaviors
    information_sources: List[str] = field(default_factory=list)
    buying_objections: List[str] = field(default_factory=list)
    success_metrics: List[str] = field(default_factory=list)

    # Quote that captures their mindset
    representative_quote: str = ""

    # Day in the life
    daily_challenges: List[str] = field(default_factory=list)


@dataclass
class Job:
    """A job in the JTBD framework."""
    description: str
    job_type: str  # functional, emotional, social
    importance: int  # 1-10
    satisfaction_current: int  # 1-10 (how well currently served)
    opportunity_score: float = 0.0  # importance + (importance - satisfaction)


@dataclass
class JTBDAnalysis:
    """Jobs-to-be-Done analysis."""
    main_job: str  # The core job
    jobs: List[Job] = field(default_factory=list)

    # Related jobs
    related_jobs: List[str] = field(default_factory=list)

    # Context
    when_triggered: List[str] = field(default_factory=list)
    desired_outcomes: List[str] = field(default_factory=list)

    # Current solutions
    current_solutions: Dict[str, str] = field(default_factory=dict)  # solution -> limitation

    # Progress forces
    push_factors: List[str] = field(default_factory=list)  # What pushes them away from current
    pull_factors: List[str] = field(default_factory=list)  # What pulls them toward new
    anxieties: List[str] = field(default_factory=list)  # What holds them back
    habits: List[str] = field(default_factory=list)  # Inertia of current behavior


@dataclass
class WillingnessToPayAssessment:
    """Assessment of customer willingness to pay."""
    segment: str
    perceived_value: str  # low, medium, high
    reference_price: Optional[float] = None  # What they compare against
    price_sensitivity: str = "medium"  # low, medium, high

    # Pricing research
    too_cheap: Optional[float] = None
    good_value: Optional[float] = None
    getting_expensive: Optional[float] = None
    too_expensive: Optional[float] = None

    # Willingness indicators
    current_spend: Optional[float] = None
    budget_available: Optional[float] = None
    switching_cost: str = "low"  # low, medium, high

    evidence: List[str] = field(default_factory=list)


@dataclass
class SegmentPrioritization:
    """Prioritized customer segments."""
    segment_name: str
    score: float

    # Scoring factors
    market_size_score: int = 0  # 1-10
    accessibility_score: int = 0  # 1-10
    pain_intensity_score: int = 0  # 1-10
    willingness_to_pay_score: int = 0  # 1-10
    competition_score: int = 0  # 1-10 (lower competition = higher score)

    rationale: str = ""
    priority: str = "medium"  # primary, secondary, tertiary, not now


# ============================================================================
# Customer Profiler Agent
# ============================================================================

class CustomerProfilerAgent:
    """
    Customer research specialist that develops ICPs, personas,
    and jobs-to-be-done analysis.
    """

    def __init__(self):
        self.icp: Optional[IdealCustomerProfile] = None
        self.personas: List[CustomerPersona] = []
        self.jtbd: Optional[JTBDAnalysis] = None

    def create_icp(
        self,
        segment: CustomerSegment,
        industry: str,
        company_size: str,
        revenue_range: str,
        characteristics: List[str],
        buying_triggers: List[str],
        must_have: List[str],
        disqualifiers: List[str],
    ) -> IdealCustomerProfile:
        """
        Create an Ideal Customer Profile.
        """
        icp = IdealCustomerProfile(
            segment=segment,
            industry=industry,
            company_size=company_size,
            revenue_range=revenue_range,
            key_characteristics=characteristics,
            buying_triggers=buying_triggers,
            must_have=must_have,
            disqualifiers=disqualifiers,
        )

        # Calculate confidence based on specificity
        icp.confidence = self._calculate_icp_confidence(icp)
        self.icp = icp
        return icp

    def _calculate_icp_confidence(self, icp: IdealCustomerProfile) -> int:
        """Calculate confidence based on ICP completeness."""
        score = 30  # Base score

        if icp.key_characteristics:
            score += min(len(icp.key_characteristics) * 5, 15)
        if icp.buying_triggers:
            score += min(len(icp.buying_triggers) * 5, 15)
        if icp.must_have:
            score += min(len(icp.must_have) * 5, 15)
        if icp.disqualifiers:
            score += min(len(icp.disqualifiers) * 3, 10)
        if icp.typical_budget:
            score += 10
        if icp.technology_stack:
            score += 5

        return min(score, 100)

    def create_persona(
        self,
        name: str,
        role: str,
        segment: CustomerSegment,
        decision_role: DecisionRole,
        goals: List[str],
        frustrations: List[str],
        motivations: List[str],
        objections: List[str],
        quote: str,
    ) -> CustomerPersona:
        """
        Create a buyer persona with emotional truth.
        """
        persona = CustomerPersona(
            name=name,
            role=role,
            segment=segment,
            decision_role=decision_role,
            goals=goals,
            frustrations=frustrations,
            motivations=motivations,
            buying_objections=objections,
            representative_quote=quote,
        )

        self.personas.append(persona)
        return persona

    def analyze_jtbd(
        self,
        main_job: str,
        functional_jobs: List[Dict],
        emotional_jobs: List[Dict],
        social_jobs: List[Dict],
        triggers: List[str],
        outcomes: List[str],
    ) -> JTBDAnalysis:
        """
        Perform Jobs-to-be-Done analysis.

        Each job dict: {"description": str, "importance": int, "satisfaction": int}
        """
        jobs = []

        for job_list, job_type in [
            (functional_jobs, "functional"),
            (emotional_jobs, "emotional"),
            (social_jobs, "social"),
        ]:
            for job in job_list:
                importance = job.get("importance", 5)
                satisfaction = job.get("satisfaction", 5)

                # Calculate opportunity score
                # High importance + low satisfaction = high opportunity
                opportunity = importance + max(importance - satisfaction, 0)

                jobs.append(Job(
                    description=job["description"],
                    job_type=job_type,
                    importance=importance,
                    satisfaction_current=satisfaction,
                    opportunity_score=opportunity,
                ))

        # Sort by opportunity score
        jobs.sort(key=lambda x: x.opportunity_score, reverse=True)

        jtbd = JTBDAnalysis(
            main_job=main_job,
            jobs=jobs,
            when_triggered=triggers,
            desired_outcomes=outcomes,
        )

        self.jtbd = jtbd
        return jtbd

    def get_top_opportunities(self, n: int = 5) -> List[Job]:
        """Get top N job opportunities based on opportunity score."""
        if not self.jtbd:
            return []
        return self.jtbd.jobs[:n]

    def assess_willingness_to_pay(
        self,
        segment: str,
        current_spend: Optional[float],
        reference_prices: List[float],
        competitor_prices: Dict[str, float],
        evidence: List[str],
    ) -> WillingnessToPayAssessment:
        """
        Assess willingness to pay for a segment.
        """
        # Calculate perceived value based on evidence
        perceived_value = "medium"
        if evidence:
            high_value_signals = ["must have", "critical", "urgent", "budget approved"]
            low_value_signals = ["nice to have", "maybe later", "not priority"]

            evidence_text = " ".join(evidence).lower()
            if any(signal in evidence_text for signal in high_value_signals):
                perceived_value = "high"
            elif any(signal in evidence_text for signal in low_value_signals):
                perceived_value = "low"

        # Calculate reference price
        reference_price = None
        if reference_prices:
            reference_price = sum(reference_prices) / len(reference_prices)
        elif competitor_prices:
            reference_price = sum(competitor_prices.values()) / len(competitor_prices)

        return WillingnessToPayAssessment(
            segment=segment,
            perceived_value=perceived_value,
            reference_price=reference_price,
            current_spend=current_spend,
            evidence=evidence,
        )

    def prioritize_segments(
        self,
        segments: List[Dict],
    ) -> List[SegmentPrioritization]:
        """
        Prioritize customer segments.

        segments: List of {
            "name": str,
            "market_size": int (1-10),
            "accessibility": int (1-10),
            "pain_intensity": int (1-10),
            "willingness_to_pay": int (1-10),
            "competition": int (1-10, lower is better),
        }
        """
        prioritized = []

        for seg in segments:
            # Weighted scoring
            score = (
                seg.get("market_size", 5) * 0.20 +
                seg.get("accessibility", 5) * 0.20 +
                seg.get("pain_intensity", 5) * 0.30 +
                seg.get("willingness_to_pay", 5) * 0.20 +
                (10 - seg.get("competition", 5)) * 0.10  # Invert competition
            )

            prioritized.append(SegmentPrioritization(
                segment_name=seg["name"],
                score=score,
                market_size_score=seg.get("market_size", 5),
                accessibility_score=seg.get("accessibility", 5),
                pain_intensity_score=seg.get("pain_intensity", 5),
                willingness_to_pay_score=seg.get("willingness_to_pay", 5),
                competition_score=seg.get("competition", 5),
            ))

        # Sort by score
        prioritized.sort(key=lambda x: x.score, reverse=True)

        # Assign priorities
        for i, seg in enumerate(prioritized):
            if i == 0:
                seg.priority = "primary"
            elif i == 1:
                seg.priority = "secondary"
            elif i == 2:
                seg.priority = "tertiary"
            else:
                seg.priority = "not now"

        return prioritized

    def generate_customer_profile_summary(self) -> Dict:
        """Generate summary of all customer research."""
        summary = {
            "icp_defined": self.icp is not None,
            "icp_confidence": self.icp.confidence if self.icp else 0,
            "personas_count": len(self.personas),
            "jtbd_analyzed": self.jtbd is not None,
            "top_jobs": [],
            "key_insights": [],
        }

        if self.jtbd:
            summary["top_jobs"] = [
                {"job": j.description, "opportunity_score": j.opportunity_score}
                for j in self.jtbd.jobs[:3]
            ]

        # Generate key insights
        if self.icp:
            summary["key_insights"].append(
                f"Target: {self.icp.segment.value} in {self.icp.industry}"
            )

        if self.personas:
            decision_makers = [
                p.name for p in self.personas
                if p.decision_role == DecisionRole.DECISION_MAKER
            ]
            if decision_makers:
                summary["key_insights"].append(
                    f"Key decision makers: {', '.join(decision_makers)}"
                )

        if self.jtbd and self.jtbd.jobs:
            top_job = self.jtbd.jobs[0]
            summary["key_insights"].append(
                f"Highest opportunity: {top_job.description} (score: {top_job.opportunity_score})"
            )

        return summary


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"CustomerProfilerAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")

    # Example usage
    agent = CustomerProfilerAgent()

    # Create ICP
    icp = agent.create_icp(
        segment=CustomerSegment.SMB,
        industry="SaaS",
        company_size="10-50 employees",
        revenue_range="$1M-$10M ARR",
        characteristics=[
            "Tech-forward mindset",
            "Growing team",
            "Pain with manual processes",
        ],
        buying_triggers=[
            "Hiring surge",
            "Process breakdown",
            "New funding round",
        ],
        must_have=[
            "Budget authority",
            "Technical capability to integrate",
        ],
        disqualifiers=[
            "No budget",
            "Already using competitor",
        ],
    )

    print(f"ICP Confidence: {icp.confidence}%")

    # Example JTBD
    jtbd = agent.analyze_jtbd(
        main_job="Manage customer relationships efficiently",
        functional_jobs=[
            {"description": "Track customer interactions", "importance": 9, "satisfaction": 4},
            {"description": "Automate follow-ups", "importance": 8, "satisfaction": 3},
        ],
        emotional_jobs=[
            {"description": "Feel in control of pipeline", "importance": 8, "satisfaction": 5},
        ],
        social_jobs=[
            {"description": "Look professional to clients", "importance": 7, "satisfaction": 6},
        ],
        triggers=["Losing deals", "Missing follow-ups"],
        outcomes=["Never miss a follow-up", "Close more deals"],
    )

    print(f"Top opportunity: {agent.get_top_opportunities(1)[0].description}")
