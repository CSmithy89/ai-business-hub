# BMP - Business Planning Module

## Overview

The Business Planning Module (BMP) provides AI-powered business planning through a coordinated team of specialized agents. Built on the [Agno](https://docs.agno.com) multi-agent framework, this module transforms validated business ideas into comprehensive, investor-ready business plans with financial projections.

## Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLANNING TEAM                                │
│                                                                  │
│                         Blake                                    │
│                   (Team Leader)                                  │
│              Planning Orchestrator                               │
│                    "Blueprint"                                   │
│                          │                                       │
│     ┌────────────┬───────┴───────┬────────────┐                 │
│     │            │               │            │                  │
│     ▼            ▼               ▼            ▼                  │
│   Model        Finn          Revenue      Forecast               │
│   Business     Financial     Monetization  Growth                │
│   Model        Analysis      Strategy      Forecasting           │
│   Canvas                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Personas

| Agent | Role | Specialization |
|-------|------|----------------|
| **Blake** | Team Leader | Orchestrates planning, ensures coherence, generates investor-ready documents |
| **Model** | Business Model Architect | 9-block Business Model Canvas, value proposition design |
| **Finn** | Financial Analyst | P&L projections, unit economics, funding strategies |
| **Revenue** | Monetization Strategist | Pricing strategies, revenue models, competitive pricing |
| **Forecast** | Growth Forecaster | Multi-year scenarios, milestones, market penetration |

## File Structure

```
agents/planning/
├── __init__.py                      # Module exports
├── team.py                          # Agno Team configuration
├── planning_orchestrator_agent.py   # Blake - Team leader
├── business_model_architect_agent.py # Model - BMC expert
├── financial_analyst_agent.py       # Finn - Financial projections
├── monetization_strategist_agent.py # Revenue - Pricing/monetization
├── growth_forecaster_agent.py       # Forecast - Growth scenarios
└── README.md                        # This file
```

## Usage

### Basic Usage

```python
from agents.planning import create_planning_team

# Create a planning team instance
team = create_planning_team(
    session_id="plan_session_123",
    user_id="user_456",
    business_id="biz_789",
    validation_context={
        "tam": {"value": 4200000000, "confidence": "high"},
        "sam": {"value": 840000000, "confidence": "medium"},
        "icps": [...],  # From validation
    }
)

# Run planning conversation
response = await team.arun(
    "Create a business model canvas for our AI-powered vertical "
    "gardening platform targeting urban millennials."
)

print(response.content)
```

### Workflow Functions

The module provides specialized workflow functions for structured planning:

```python
from agents.planning import (
    create_planning_team,
    run_business_model_canvas,
    run_financial_projections,
    run_pricing_strategy,
    run_business_plan_synthesis,
)

team = create_planning_team(session_id="plan_123", user_id="user_456")

# Step 1: Create Business Model Canvas
canvas = await run_business_model_canvas(
    team,
    business_description="AI vertical gardening platform...",
    validation_data={
        "icps": [...],
        "tam": {...},
        "competitors": [...]
    }
)

# Step 2: Develop Financial Projections
financials = await run_financial_projections(
    team,
    business_description="AI vertical gardening platform...",
    canvas_summary=canvas,
    pricing_data={"monthly_price": 29.99}
)

# Step 3: Design Pricing Strategy
pricing = await run_pricing_strategy(
    team,
    business_description="AI vertical gardening platform...",
    canvas_summary=canvas,
    competitors=["Bloomscape", "Gardyn"]
)

# Step 4: Synthesize Business Plan
business_plan = await run_business_plan_synthesis(
    team,
    canvas=canvas,
    financials=financials,
    pricing=pricing,
    growth_forecast=None  # Optional
)
```

## Data Models

### Business Model Canvas

```python
@dataclass
class BusinessModelCanvas:
    business_id: str
    business_model_type: BusinessModelType  # SaaS, Marketplace, etc.

    # The 9 Blocks
    key_partners: CanvasBlock
    key_activities: CanvasBlock
    key_resources: CanvasBlock
    value_propositions: CanvasBlock
    customer_relationships: CanvasBlock
    channels: CanvasBlock
    customer_segments: CanvasBlock
    cost_structure: CanvasBlock
    revenue_streams: CanvasBlock

    # Summary
    one_liner: str
    competitive_advantage: str
```

### Financial Projections

```python
@dataclass
class FinancialProjections:
    business_id: str
    scenario: ProjectionScenario  # Conservative, Realistic, Optimistic
    projection_years: int = 5

    # Core Projections
    revenue_projections: List[RevenueProjection]
    cash_flow_projections: List[CashFlowProjection]

    # Unit Economics
    unit_economics: UnitEconomics  # CAC, LTV, payback, margins

    # Funding
    funding_requirements: List[FundingRequirement]

    # Key Metrics
    break_even_month: Optional[int]
    peak_cash_need: Optional[float]
```

### Unit Economics

```python
@dataclass
class UnitEconomics:
    cac: float              # Customer Acquisition Cost
    ltv: float              # Lifetime Value
    ltv_cac_ratio: float    # Target: 3:1 or better
    arpu: float             # Average Revenue Per User
    monthly_churn_rate: float
    cac_payback_months: float  # Target: < 12 months
    gross_margin: float
    contribution_margin: float
```

## Planning Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLANNING PIPELINE                             │
└─────────────────────────────────────────────────────────────────┘

    Validation Outputs (from BMV)
    ├── TAM/SAM/SOM
    ├── ICPs
    └── Competitors
        │
        ▼
┌───────────────────┐
│ Business Model    │  ← Model creates 9-block canvas
│ Canvas            │
│   (Model)         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐   ┌───────────────────┐
│ Financial         │   │ Pricing           │
│ Projections       │   │ Strategy          │
│   (Finn)          │   │   (Revenue)       │
│                   │   │                   │
│ • 3 Scenarios     │   │ • Tier Design     │
│ • Unit Economics  │   │ • Competitive     │
│ • Cash Flow       │   │ • Revenue Model   │
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
          ┌───────────────────┐
          │ Growth Forecast   │  ← Forecast creates scenarios
          │   (Forecast)      │
          │                   │
          │ • 3-5 Year View   │
          │ • Milestones      │
          │ • Market Share    │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Business Plan     │  ← Blake synthesizes everything
          │ Synthesis         │
          │   (Blake)         │
          │                   │
          │ • Exec Summary    │
          │ • Full Plan       │
          │ • Pitch Deck      │
          └───────────────────┘
```

## Financial Modeling Standards

### Three Scenario Approach

| Scenario | Description | Probability |
|----------|-------------|-------------|
| **Conservative** | Things go slower than hoped | 50th percentile |
| **Realistic** | Reasonable execution | 70th percentile |
| **Optimistic** | Exceptional execution + tailwinds | 90th percentile |

### Growth Rate Guidelines (SaaS)

| Year | Expected Growth | Notes |
|------|-----------------|-------|
| Year 1 | 0 → First Customers | Product-market fit |
| Year 2 | 2-3x | Traction |
| Year 3 | 2-2.5x | Scaling |
| Year 4 | 1.5-2x | Expansion |
| Year 5 | 1.3-1.5x | Maturity |

### Unit Economics Benchmarks

```
LTV/CAC Ratio:      Target 3:1 or better
CAC Payback:        < 12 months for SaaS
Gross Margin:       > 60% for software
Monthly Churn:      < 5% for SMB, < 2% for Enterprise
```

## Pricing Strategy Framework

### Pricing Models

| Model | Best For | Example |
|-------|----------|---------|
| Flat Rate | Simple products | $29/mo for all features |
| Tiered | Different customer segments | Starter/Pro/Enterprise |
| Per-Seat | Collaboration tools | $10/user/month |
| Usage-Based | Variable consumption | $0.001 per API call |
| Freemium | High volume, low conversion | Free tier + paid upgrade |

### Tier Design Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICING TIERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Starter          Pro              Enterprise                   │
│   $29/mo           $99/mo           Custom                      │
│                    ▲                                            │
│                    │                                            │
│              "Obvious Choice"                                    │
│              (Most customers here)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Business Model Canvas Blocks

### The 9 Blocks Explained

```
┌─────────────────────────────────────────────────────────────────┐
│                  BUSINESS MODEL CANVAS                           │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│              │              │              │                    │
│ KEY          │ KEY          │ VALUE        │ CUSTOMER           │
│ PARTNERS     │ ACTIVITIES   │ PROPOSITIONS │ RELATIONSHIPS      │
│              │              │              │                    │
│ Who helps    │ What must    │ What value   │ What type of      │
│ us?          │ we do?       │ do we        │ relationship?     │
│              │              │ deliver?     │                    │
├──────────────┼──────────────┤              ├───────────────────┤
│              │              │              │                    │
│ KEY          │              │              │ CHANNELS           │
│ RESOURCES    │              │              │                    │
│              │              │              │ How do we reach    │
│ What do we   │              │              │ customers?         │
│ need?        │              │              │                    │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│ COST STRUCTURE                │ REVENUE STREAMS                 │
│                               │                                 │
│ What does it cost?            │ How do we make money?           │
└───────────────────────────────┴─────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Database connection for session persistence
DATABASE_URL=postgresql://user:pass@localhost:5432/hyvve

# Optional: Override default model
PLANNING_MODEL=claude-sonnet-4-20250514
```

### Team Configuration Options

```python
team = create_planning_team(
    session_id="plan_123",     # Required: Unique session ID
    user_id="user_456",        # Required: User for multi-tenancy
    business_id="biz_789",     # Optional: Business context
    model="claude-sonnet-4-20250514",  # Optional: Model override
    debug_mode=True,           # Optional: Enable debug logging
    validation_context={       # Optional: Data from BMV
        "tam": {...},
        "sam": {...},
        "som": {...},
        "icps": [...],
        "competitors": [...]
    }
)
```

## Output Format

### Business Plan Structure

```markdown
# Business Plan: [Company Name]

## 1. Executive Summary
- Problem & Solution
- Market Opportunity ($X TAM, $Y SAM)
- Business Model
- Financial Highlights (Revenue Year 3: $X)
- Ask: $X for Y% equity

## 2. Company Overview
- Mission & Vision
- Value Proposition
- Competitive Advantage

## 3. Market Analysis
- TAM/SAM/SOM Summary
- Target Customer Profiles
- Competitive Landscape

## 4. Business Model
- Revenue Model
- Pricing Strategy
- Key Partnerships

## 5. Go-to-Market Strategy
- Customer Acquisition
- Channel Strategy
- Sales Process

## 6. Financial Plan
- 5-Year Projections (Realistic Scenario)
- Unit Economics
- Funding Requirements

## 7. Milestones & Roadmap
- Year 1 Milestones
- Year 2-3 Milestones
- Success Metrics

## 8. Risk Analysis
- Key Risks
- Mitigation Strategies

## Appendix
- Detailed Financial Tables
- Customer Personas
- Competitive Analysis
```

## Integration with Validation (BMV)

The planning module receives context from validation:

```python
# Validation outputs feed planning inputs
planning_context = {
    # Market sizing
    "tam": validation_result["market_sizing"]["tam"],
    "sam": validation_result["market_sizing"]["sam"],
    "som": validation_result["market_sizing"]["som"],

    # Customer understanding
    "icps": validation_result["customer_profiles"]["icps"],
    "personas": validation_result["customer_profiles"]["personas"],
    "jtbd": validation_result["customer_profiles"]["jtbd"],

    # Competitive landscape
    "competitors": validation_result["competitor_analysis"]["competitors"],
    "positioning_gaps": validation_result["competitor_analysis"]["gaps"],

    # Validation score
    "validation_score": validation_result["validation_score"],
    "recommendation": validation_result["recommendation"],
}
```

## Handoff to Branding (BM-Brand)

After planning completes:

```python
from agents.branding import create_branding_team

branding_team = create_branding_team(
    session_id="brand_123",
    user_id="user_456",
    business_context={
        "business_name": planning_result["business_name"],
        "value_proposition": planning_result["canvas"]["value_propositions"],
        "target_audience": planning_result["canvas"]["customer_segments"],
        "positioning": planning_result["positioning"],
        "competitors": validation_result["competitors"],
    }
)
```

## Testing

```python
import pytest
from agents.planning import create_planning_team

@pytest.fixture
def planning_team():
    return create_planning_team(
        session_id="test_session",
        user_id="test_user",
        debug_mode=True,
    )

@pytest.mark.asyncio
async def test_business_model_canvas(planning_team):
    response = await planning_team.arun(
        "Create a business model canvas for a SaaS analytics platform"
    )
    assert response.content
    assert "value proposition" in response.content.lower()
```

## Related Documentation

- [Agno Implementation Guide](../../docs/architecture/agno-implementation-guide.md)
- [Business Onboarding Architecture](../../docs/architecture/business-onboarding-architecture.md)
- [BMAD BMP Specifications](../../.bmad/bmp/)
