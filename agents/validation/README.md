# BMV - Business Validation Module

## Overview

The Business Validation Module (BMV) provides AI-powered business idea validation through a coordinated team of specialized agents. Built on the [Agno](https://docs.agno.com) multi-agent framework, this module helps users validate business ideas with rigorous market analysis, competitive intelligence, and feasibility assessment.

## Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION TEAM                               │
│                                                                  │
│                         Vera                                     │
│                   (Team Leader)                                  │
│              Validation Orchestrator                             │
│                          │                                       │
│     ┌────────────┬───────┴───────┬────────────┐                 │
│     │            │               │            │                  │
│     ▼            ▼               ▼            ▼                  │
│  Marco       Cipher          Persona       Risk                  │
│  Market      Competitor      Customer      Feasibility           │
│  Research    Analysis        Profiling     Assessment            │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Personas

| Agent | Role | Specialization |
|-------|------|----------------|
| **Vera** | Team Leader | Orchestrates validation, synthesizes findings, provides go/no-go recommendations |
| **Marco** | Market Researcher | TAM/SAM/SOM calculations using top-down, bottom-up, and value theory methods |
| **Cipher** | Competitor Analyst | Competitive intelligence, Porter's Five Forces, positioning maps |
| **Persona** | Customer Profiler | Ideal Customer Profiles (ICPs), buyer personas, Jobs-to-be-Done analysis |
| **Risk** | Feasibility Assessor | Risk assessment, technical/financial feasibility, mitigation strategies |

## File Structure

```
agents/validation/
├── __init__.py                      # Module exports
├── team.py                          # Agno Team configuration
├── validation_orchestrator_agent.py # Vera - Team leader
├── market_researcher_agent.py       # Marco - Market sizing
├── competitor_analyst_agent.py      # Cipher - Competitive intel
├── customer_profiler_agent.py       # Persona - Customer research
├── feasibility_assessor_agent.py    # Risk - Feasibility analysis
└── README.md                        # This file
```

## Usage

### Basic Usage

```python
from agents.validation import create_validation_team

# Create a validation team instance
team = create_validation_team(
    session_id="val_session_123",
    user_id="user_456",
    business_id="biz_789",
    debug_mode=False,
)

# Run a validation conversation
response = await team.arun(
    "Validate this business idea: An AI-powered vertical gardening "
    "management platform for urban apartments targeting tech-savvy "
    "millennials who want fresh produce but lack outdoor space."
)

print(response.content)
```

### Workflow Functions

The module provides specialized workflow functions for structured validation:

```python
from agents.validation import (
    create_validation_team,
    run_idea_intake,
    run_market_sizing,
    run_competitor_analysis,
    run_customer_discovery,
    run_validation_synthesis,
)

team = create_validation_team(session_id="val_123", user_id="user_456")

# Step 1: Capture and structure the business idea
idea = await run_idea_intake(
    team,
    idea_description="AI vertical gardening platform...",
    context="Looking to validate before seeking seed funding"
)

# Step 2: Calculate market size
market = await run_market_sizing(team, idea_summary=idea)

# Step 3: Analyze competitors
competitors = await run_competitor_analysis(
    team,
    idea_summary=idea,
    known_competitors=["Bloomscape", "Gardyn", "Click & Grow"]
)

# Step 4: Develop customer profiles
customers = await run_customer_discovery(
    team,
    idea_summary=idea,
    target_market="Urban millennials with apartments"
)

# Step 5: Synthesize into go/no-go recommendation
result = await run_validation_synthesis(
    team,
    market_sizing=market,
    competitor_analysis=competitors,
    customer_discovery=customers,
)
```

## Data Models

### Validation Session

```python
@dataclass
class ValidationSession:
    business_id: str
    session_id: str
    current_stage: ValidationStage
    status: ValidationStatus

    # Stage outputs
    idea_intake: Optional[dict]
    market_sizing: Optional[dict]
    competitor_analysis: Optional[dict]
    customer_profiles: Optional[dict]
    feasibility_assessment: Optional[dict]

    # Final outputs
    validation_score: Optional[float]
    recommendation: Optional[GoNoGoRecommendation]
```

### Market Sizing

```python
@dataclass
class MarketSizing:
    tam: TAMCalculation  # Total Addressable Market
    sam: SAMCalculation  # Serviceable Available Market
    som: SOMCalculation  # Serviceable Obtainable Market

    methodology: str
    sources: List[DataSource]
    confidence: ConfidenceLevel
```

### Go/No-Go Recommendation

```python
class GoNoGoRecommendation(Enum):
    GO = "go"                    # Proceed with confidence
    CONDITIONAL_GO = "conditional_go"  # Proceed with conditions
    PIVOT = "pivot"              # Major changes needed
    NO_GO = "no_go"              # Do not proceed
```

## Validation Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   VALIDATION PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘

    User Input
        │
        ▼
┌───────────────┐
│  Idea Intake  │  ← Vera captures and structures the business idea
│   (Vera)      │
└───────┬───────┘
        │
        ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Market Sizing │   │  Competitor   │   │   Customer    │
│   (Marco)     │   │   Mapping     │   │  Discovery    │
│               │   │   (Cipher)    │   │   (Persona)   │
│ TAM/SAM/SOM   │   │ Porter's 5    │   │ ICP & JTBD    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                  ┌───────────────┐
                  │  Validation   │  ← Risk + Vera synthesize findings
                  │  Synthesis    │
                  │   (Risk)      │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   Go/No-Go    │
                  │Recommendation │
                  │  Score: X/100 │
                  └───────────────┘
```

## Anti-Hallucination Measures

The validation team implements strict anti-hallucination principles:

### Market Research (Marco)
- **Source Requirements**: Market size claims require 2+ independent sources
- **Recency**: Sources must be < 24 months old
- **Confidence Marking**: All claims marked as `[Verified]`, `[Single Source]`, or `[Estimated]`
- **Range Estimates**: Use ranges instead of point estimates when uncertain

### Competitive Analysis (Cipher)
- **Source URLs**: All competitor claims must have source URLs
- **Feature Verification**: Features must be verifiable on competitor websites
- **Funding Data**: Investment data must cite Crunchbase, PitchBook, or press releases

### Customer Research (Persona)
- **Evidence-Based**: ICPs built from validation data, not assumptions
- **Willingness to Pay**: Must validate actual willingness, not just interest
- **Job Quotes**: Persona quotes must be realistic, not idealized

## Configuration

### Environment Variables

```bash
# Database connection for session persistence
DATABASE_URL=postgresql://user:pass@localhost:5432/hyvve

# Optional: Override default model
VALIDATION_MODEL=claude-sonnet-4-20250514
```

### Team Configuration Options

```python
team = create_validation_team(
    session_id="val_123",      # Required: Unique session ID
    user_id="user_456",        # Required: User for multi-tenancy
    business_id="biz_789",     # Optional: Business context
    model="claude-sonnet-4-20250514",  # Optional: Model override
    debug_mode=True,           # Optional: Enable debug logging
)
```

## Integration with HYVVE Platform

### Session Persistence

The team uses PostgreSQL storage for:
- Conversation history
- Workflow state
- Validation outputs

```sql
-- Auto-created by Agno PostgresStorage
CREATE TABLE bmv_validation_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Multi-Tenancy

Sessions are isolated by:
- `session_id`: Unique validation session
- `user_id`: User performing validation
- `business_id`: Business being validated (optional)

### Handoff to Planning (BMP)

After validation completes with GO or CONDITIONAL_GO:

```python
from agents.planning import create_planning_team

# Validation outputs become planning inputs
planning_team = create_planning_team(
    session_id="plan_123",
    user_id="user_456",
    validation_context={
        "tam": validation_result["market_sizing"]["tam"],
        "sam": validation_result["market_sizing"]["sam"],
        "som": validation_result["market_sizing"]["som"],
        "icps": validation_result["customer_profiles"]["icps"],
        "competitors": validation_result["competitor_analysis"]["competitors"],
    }
)
```

## Output Format

### Validation Report Structure

```markdown
# Business Validation Report

## Executive Summary
- Validation Score: 78/100
- Recommendation: CONDITIONAL GO
- Confidence: Medium

## Market Analysis
### TAM: $4.2B (High Confidence)
- Sources: [Gartner 2024], [Grand View Research 2024]
- Methodology: Top-down from smart home market

### SAM: $840M (Medium Confidence)
- Constraints: US urban markets, apartment dwellers
- Source: Census + market research

### SOM Year 1: $42M (Target)
- Assumptions: 5% SAM penetration, 2 competitor conversions

## Competitive Landscape
[Feature matrix, positioning map, gaps identified]

## Customer Profile
[ICP definition, 3 personas, JTBD analysis]

## Risk Assessment
[Risk matrix, mitigation strategies]

## Recommendation
GO with conditions:
1. Validate pricing with 50 potential customers
2. Secure partnership with hardware manufacturer
3. Complete MVP before Q2
```

## Testing

```python
import pytest
from agents.validation import create_validation_team

@pytest.fixture
def validation_team():
    return create_validation_team(
        session_id="test_session",
        user_id="test_user",
        debug_mode=True,
    )

@pytest.mark.asyncio
async def test_idea_intake(validation_team):
    response = await validation_team.arun(
        "I want to validate an idea for an AI writing assistant"
    )
    assert response.content
    assert "problem" in response.content.lower() or "solution" in response.content.lower()
```

## Related Documentation

- [Agno Implementation Guide](../../docs/architecture/agno-implementation-guide.md)
- [Business Onboarding Architecture](../../docs/architecture/business-onboarding-architecture.md)
- [BMAD BMV Specifications](../../.bmad/bmv/)
