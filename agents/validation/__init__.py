"""
BMV (Business Validation) Module Agents
AI Business Hub - Validation Layer

This module provides AI agents for business idea validation:
- Market sizing (TAM/SAM/SOM)
- Competitive intelligence
- Customer profiling
- Feasibility assessment
- Go/no-go recommendations

Team Structure:
- Leader: Vera (Validation Orchestrator)
- Members: Marco (Market), Cipher (Competitors), Persona (Customers), Risk (Feasibility)

Usage:
    from agents.validation import create_validation_team

    team = create_validation_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
    response = team.run("Validate this business idea: ...")
"""

# Agno Team exports
from .team import (
    create_validation_team,
    run_idea_intake,
    run_market_sizing,
    run_competitor_analysis,
    run_customer_discovery,
    run_validation_synthesis,
)

# Legacy agent classes (for data models)
from .validation_orchestrator_agent import (
    ValidationSession,
    ValidationStatus,
    GoNoGoRecommendation,
)
from .market_researcher_agent import (
    TAMCalculation,
    MarketSizing,
    ConfidenceLevel,
)
from .competitor_analyst_agent import (
    Competitor,
    CompetitorProfile,
    PositioningMap,
)
from .customer_profiler_agent import (
    IdealCustomerProfile,
    CustomerPersona,
    JTBDAnalysis,
)
from .feasibility_assessor_agent import (
    Risk,
    RiskMatrix,
    FeasibilityAssessment,
)

__all__ = [
    # Agno Team
    "create_validation_team",
    "run_idea_intake",
    "run_market_sizing",
    "run_competitor_analysis",
    "run_customer_discovery",
    "run_validation_synthesis",
    # Data Models - Orchestrator
    "ValidationSession",
    "ValidationStatus",
    "GoNoGoRecommendation",
    # Data Models - Market Research
    "TAMCalculation",
    "MarketSizing",
    "ConfidenceLevel",
    # Data Models - Competitor Analysis
    "Competitor",
    "CompetitorProfile",
    "PositioningMap",
    # Data Models - Customer Profiling
    "IdealCustomerProfile",
    "CustomerPersona",
    "JTBDAnalysis",
    # Data Models - Feasibility Assessment
    "Risk",
    "RiskMatrix",
    "FeasibilityAssessment",
]
