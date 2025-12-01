"""
ValidationOrchestratorAgent (Validator) - Validation Team Lead
AI Business Hub BMV Module Agent

Coordinates the entire validation process, synthesizes findings
from all agents, and generates go/no-go recommendations.

BMAD Spec: .bmad/bmv/agents/validation-orchestrator-agent.agent.yaml
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Validator"
AGENT_TITLE = "Validation Team Lead + Synthesis Expert"

INSTRUCTIONS = [
    "You are Validator, the validation team lead.",
    "Coordinate validation across Market, Competitor, Customer, and Feasibility agents.",
    "Synthesize findings into actionable go/no-go recommendations.",
    "Validation reduces risk - it doesn't eliminate it.",
    "Every recommendation needs supporting evidence.",
    "Acknowledge what we don't know - uncertainty is information.",
]

PRINCIPLES = [
    "Validation reduces risk, doesn't eliminate it",
    "Every recommendation needs supporting evidence",
    "Synthesize, don't just summarize",
    "Acknowledge what we don't know",
    "Focus on actionable insights",
    "Confidence scores must be honest",
]


# ============================================================================
# Data Models
# ============================================================================

class ValidationStatus(str, Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    AWAITING_INPUT = "awaiting_input"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class ValidationStage(str, Enum):
    IDEA_INTAKE = "idea_intake"
    MARKET_SIZING = "market_sizing"
    COMPETITOR_MAPPING = "competitor_mapping"
    CUSTOMER_DISCOVERY = "customer_discovery"
    VALIDATION_SYNTHESIS = "validation_synthesis"


class RecommendationType(str, Enum):
    GO = "go"
    NO_GO = "no_go"
    CONDITIONAL_GO = "conditional_go"
    PIVOT = "pivot"


@dataclass
class IdeaInput:
    """Structured business idea input."""
    name: str
    description: str
    category: str
    target_market: Optional[str] = None
    geographic_scope: Optional[List[str]] = None
    known_competitors: Optional[List[str]] = None
    validation_context: Optional[str] = None  # fundraising, launch, pivot
    biggest_uncertainty: Optional[str] = None


@dataclass
class GoNoGoRecommendation:
    """Final recommendation with supporting evidence."""
    decision: RecommendationType
    confidence_score: int  # 0-100
    summary: str
    key_strengths: List[str]
    key_risks: List[str]
    conditions: Optional[List[str]] = None  # For conditional_go
    pivot_suggestions: Optional[List[str]] = None  # For pivot
    next_steps: List[str] = field(default_factory=list)

    def is_positive(self) -> bool:
        return self.decision in [RecommendationType.GO, RecommendationType.CONDITIONAL_GO]


@dataclass
class ValidationSession:
    """Tracks a validation session through all stages."""
    id: str
    tenant_id: str
    user_id: str
    idea_input: IdeaInput
    status: ValidationStatus = ValidationStatus.DRAFT
    current_stage: ValidationStage = ValidationStage.IDEA_INTAKE

    # Stage results (populated as stages complete)
    market_sizing_result: Optional[Dict] = None
    competitor_analysis_result: Optional[Dict] = None
    customer_profile_result: Optional[Dict] = None
    feasibility_result: Optional[Dict] = None

    # Final outputs
    recommendation: Optional[GoNoGoRecommendation] = None
    final_report: Optional[Dict] = None

    # Timestamps
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# ============================================================================
# Orchestrator Agent
# ============================================================================

class ValidationOrchestratorAgent:
    """
    Coordinates the validation process across all specialized agents.

    Workflow:
    1. idea_intake: Gather and structure business idea
    2. market_sizing: Calculate TAM/SAM/SOM (Market Researcher)
    3. competitor_mapping: Analyze competitors (Competitor Analyst)
    4. customer_discovery: Develop ICP/personas (Customer Profiler)
    5. validation_synthesis: Combine all findings, generate recommendation
    """

    def __init__(self, session: ValidationSession):
        self.session = session

    def start_validation(self, idea_input: IdeaInput) -> ValidationSession:
        """Initialize a new validation session."""
        self.session.idea_input = idea_input
        self.session.status = ValidationStatus.IN_PROGRESS
        self.session.current_stage = ValidationStage.IDEA_INTAKE
        self.session.updated_at = datetime.now()
        return self.session

    def advance_stage(self) -> ValidationStage:
        """Advance to the next validation stage."""
        stage_order = [
            ValidationStage.IDEA_INTAKE,
            ValidationStage.MARKET_SIZING,
            ValidationStage.COMPETITOR_MAPPING,
            ValidationStage.CUSTOMER_DISCOVERY,
            ValidationStage.VALIDATION_SYNTHESIS,
        ]

        current_idx = stage_order.index(self.session.current_stage)
        if current_idx < len(stage_order) - 1:
            self.session.current_stage = stage_order[current_idx + 1]
            self.session.updated_at = datetime.now()

        return self.session.current_stage

    def record_stage_result(self, stage: ValidationStage, result: Dict) -> None:
        """Record the result of a completed stage."""
        if stage == ValidationStage.MARKET_SIZING:
            self.session.market_sizing_result = result
        elif stage == ValidationStage.COMPETITOR_MAPPING:
            self.session.competitor_analysis_result = result
        elif stage == ValidationStage.CUSTOMER_DISCOVERY:
            self.session.customer_profile_result = result
        elif stage == ValidationStage.VALIDATION_SYNTHESIS:
            self.session.feasibility_result = result

        self.session.updated_at = datetime.now()

    def calculate_overall_confidence(self) -> int:
        """
        Calculate overall confidence score from stage results.

        Formula:
        (market_confidence × 0.30) +
        (competitor_confidence × 0.20) +
        (customer_confidence × 0.25) +
        (feasibility_confidence × 0.25)
        """
        weights = {
            "market": 0.30,
            "competitor": 0.20,
            "customer": 0.25,
            "feasibility": 0.25,
        }

        scores = {
            "market": self._extract_confidence(self.session.market_sizing_result),
            "competitor": self._extract_confidence(self.session.competitor_analysis_result),
            "customer": self._extract_confidence(self.session.customer_profile_result),
            "feasibility": self._extract_confidence(self.session.feasibility_result),
        }

        total = sum(scores[k] * weights[k] for k in weights)
        return int(total)

    def _extract_confidence(self, result: Optional[Dict]) -> int:
        """Extract confidence score from stage result."""
        if not result:
            return 50  # Default middle confidence if no data
        return result.get("confidence_score", 50)

    def generate_recommendation(self) -> GoNoGoRecommendation:
        """
        Generate final go/no-go recommendation based on all findings.
        """
        confidence = self.calculate_overall_confidence()

        # Check for fatal risks
        fatal_risks = self._get_fatal_risks()

        # Determine decision
        if fatal_risks:
            decision = RecommendationType.NO_GO
        elif confidence >= 70:
            decision = RecommendationType.GO
        elif confidence >= 50:
            decision = RecommendationType.CONDITIONAL_GO
        elif self._has_pivot_potential():
            decision = RecommendationType.PIVOT
        else:
            decision = RecommendationType.NO_GO

        recommendation = GoNoGoRecommendation(
            decision=decision,
            confidence_score=confidence,
            summary=self._generate_summary(decision, confidence),
            key_strengths=self._extract_strengths(),
            key_risks=self._extract_risks(),
            conditions=self._get_conditions() if decision == RecommendationType.CONDITIONAL_GO else None,
            pivot_suggestions=self._get_pivot_suggestions() if decision == RecommendationType.PIVOT else None,
            next_steps=self._generate_next_steps(decision),
        )

        self.session.recommendation = recommendation
        self.session.status = ValidationStatus.COMPLETED
        self.session.completed_at = datetime.now()

        return recommendation

    def _get_fatal_risks(self) -> List[str]:
        """Get any fatal/blocking risks from feasibility assessment."""
        if not self.session.feasibility_result:
            return []
        return self.session.feasibility_result.get("fatal_risks", [])

    def _has_pivot_potential(self) -> bool:
        """Check if findings suggest a viable pivot direction."""
        if not self.session.competitor_analysis_result:
            return False
        gaps = self.session.competitor_analysis_result.get("market_gaps", [])
        return len(gaps) > 0

    def _generate_summary(self, decision: RecommendationType, confidence: int) -> str:
        """Generate executive summary based on decision."""
        idea_name = self.session.idea_input.name

        summaries = {
            RecommendationType.GO: f"'{idea_name}' shows strong market potential with manageable risks. Recommend proceeding to planning phase.",
            RecommendationType.CONDITIONAL_GO: f"'{idea_name}' has potential but requires addressing key conditions before full commitment.",
            RecommendationType.PIVOT: f"'{idea_name}' in current form is unlikely to succeed, but market analysis reveals viable pivot opportunities.",
            RecommendationType.NO_GO: f"'{idea_name}' faces significant obstacles that make success unlikely. Recommend not proceeding.",
        }

        return summaries.get(decision, "")

    def _extract_strengths(self) -> List[str]:
        """Extract key strengths from all stage results."""
        strengths = []

        # From market sizing
        if self.session.market_sizing_result:
            tam = self.session.market_sizing_result.get("tam_value", 0)
            if tam > 1_000_000_000:  # $1B+
                strengths.append(f"Large addressable market (TAM: ${tam/1e9:.1f}B)")

        # From competitor analysis
        if self.session.competitor_analysis_result:
            gaps = self.session.competitor_analysis_result.get("market_gaps", [])
            if gaps:
                strengths.append(f"Identified {len(gaps)} market gaps for differentiation")

        # From customer profiling
        if self.session.customer_profile_result:
            icp_clarity = self.session.customer_profile_result.get("icp_clarity", "")
            if icp_clarity == "high":
                strengths.append("Clear, well-defined target customer profile")

        return strengths[:5]  # Top 5 strengths

    def _extract_risks(self) -> List[str]:
        """Extract key risks from all stage results."""
        risks = []

        if self.session.feasibility_result:
            top_risks = self.session.feasibility_result.get("top_risks", [])
            risks.extend(top_risks[:3])

        return risks[:5]  # Top 5 risks

    def _get_conditions(self) -> List[str]:
        """Get conditions for conditional go recommendation."""
        conditions = []

        if self.session.feasibility_result:
            conditions = self.session.feasibility_result.get("conditions", [])

        return conditions

    def _get_pivot_suggestions(self) -> List[str]:
        """Get pivot suggestions from analysis."""
        suggestions = []

        if self.session.competitor_analysis_result:
            gaps = self.session.competitor_analysis_result.get("market_gaps", [])
            for gap in gaps[:3]:
                suggestions.append(f"Consider pivoting to address: {gap}")

        return suggestions

    def _generate_next_steps(self, decision: RecommendationType) -> List[str]:
        """Generate recommended next steps based on decision."""
        steps_map = {
            RecommendationType.GO: [
                "Proceed to business planning (BMP module)",
                "Develop detailed go-to-market strategy",
                "Begin MVP development planning",
            ],
            RecommendationType.CONDITIONAL_GO: [
                "Address identified conditions",
                "Conduct additional research on uncertain areas",
                "Revisit validation after conditions are met",
            ],
            RecommendationType.PIVOT: [
                "Explore identified pivot opportunities",
                "Re-run validation on pivot direction",
                "Consider market gaps as new focus areas",
            ],
            RecommendationType.NO_GO: [
                "Document learnings for future reference",
                "Consider if any components are salvageable",
                "Explore alternative business ideas",
            ],
        }

        return steps_map.get(decision, [])


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"ValidationOrchestratorAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")

    # Example usage
    idea = IdeaInput(
        name="SustainableGrow",
        description="AI-powered vertical gardening management for urban homes",
        category="AgTech / Smart Home",
        target_market="B2C",
        geographic_scope=["North America", "Europe"],
    )

    session = ValidationSession(
        id="session_123",
        tenant_id="tenant_456",
        user_id="user_789",
        idea_input=idea,
    )

    orchestrator = ValidationOrchestratorAgent(session)
    orchestrator.start_validation(idea)

    print(f"Session Status: {session.status.value}")
    print(f"Current Stage: {session.current_stage.value}")
