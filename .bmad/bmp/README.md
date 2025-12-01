# Business Planning Module (BMP)

**Module Code:** bmp
**Layer:** Foundation (PLAN Phase)
**Status:** Complete
**Version:** 1.0.0

---

## Overview

AI-powered business planning with Business Model Canvas creation, financial projections, pricing strategies, revenue models, growth forecasting, and comprehensive business plan generation. BMP bridges validation (BMV) and development (BMM) phases.

### Key Features

- **5 Specialized Agents** for different planning aspects
- **8 Workflows** for structured business planning processes
- **4 Standalone Tasks** for quick calculations
- **Anti-Hallucination Protocol** ensuring financial accuracy

## Installation

```bash
bmad install bmp
```

Or select "Business Planning Module" during BMAD installation.

## Agent Team (5)

| Agent | Name | Role |
|-------|------|------|
| **Planning Orchestrator** | Blueprint | Team lead - coordinates all planning activities |
| **Business Model Architect** | Canvas | Business Model Canvas and value proposition design |
| **Financial Analyst** | Ledger | Financial projections and unit economics |
| **Monetization Strategist** | Mint | Revenue models and pricing strategies |
| **Growth Forecaster** | Horizon | Growth projections and scenario planning |

## Workflows (8)

### Core Planning Workflows

| Workflow | Purpose | Output |
|----------|---------|--------|
| `business-model-canvas` | Create 9-block Business Model Canvas | Canvas document |
| `financial-projections` | Create 3-5 year financial model | P&L, Cash Flow, Unit Economics |
| `pricing-strategy` | Design pricing tiers and strategy | Pricing document |
| `revenue-model` | Design revenue model architecture | Revenue model |
| `growth-forecast` | Project growth with scenarios | Growth projections |

### Synthesis Workflows

| Workflow | Purpose | Output |
|----------|---------|--------|
| `business-plan` | Comprehensive investor-ready plan | Full business plan |
| `pitch-deck` | Pitch deck content generation | Slide content |

### Handoff Workflows

| Workflow | Purpose | Output |
|----------|---------|--------|
| `export-to-development` | Transform to BMM-compatible format | Development brief |

## Tasks (4)

| Task | Purpose |
|------|---------|
| `calculate-unit-economics.xml` | Calculate CAC, LTV, LTV:CAC, payback |
| `breakeven-analysis.xml` | Calculate breakeven point |
| `scenario-model.xml` | Generate conservative/realistic/optimistic scenarios |
| `funding-requirements.xml` | Calculate funding needs and use of funds |

## Quick Start

### Full Planning Flow

```
# 1. Start with Business Model Canvas
/bmad:bmp:workflows:business-model-canvas

# 2. Design pricing and revenue model
/bmad:bmp:workflows:pricing-strategy
/bmad:bmp:workflows:revenue-model

# 3. Create financial projections
/bmad:bmp:workflows:financial-projections

# 4. Project growth
/bmad:bmp:workflows:growth-forecast

# 5. Generate full business plan
/bmad:bmp:workflows:business-plan

# 6. Export to development
/bmad:bmp:workflows:export-to-development
```

### Quick Calculations

```
# Unit economics check
/bmad:bmp:tasks:calculate-unit-economics

# Breakeven analysis
/bmad:bmp:tasks:breakeven-analysis
```

## Integration Flow

```
BMV (Validation) → BMP (Planning) → BMM (Development)
     ↓                    ↓                    ↓
 GO/NO-GO          Business Plan         Product Build
 Decision          Financial Model       Technical Specs
```

### BMV → BMP Inputs

| From BMV | Used In BMP |
|----------|-------------|
| Market Sizing | Revenue ceiling, financial projections |
| Customer Profiles | Business model customer segments |
| Competitive Analysis | Pricing strategy, differentiation |
| Validation Score | Planning confidence |

### BMP → BMM Outputs

| From BMP | Used In BMM |
|----------|-------------|
| Development Brief | Product brief foundation |
| Feature Priorities | MVP scope definition |
| Success Metrics | KPI targets |
| Pricing Strategy | Payment integration |

## Data Files

| File | Purpose |
|------|---------|
| `revenue-models.csv` | Revenue model types and benchmarks |
| `pricing-strategies.csv` | Pricing strategy options |
| `financial-metrics.csv` | Financial metrics with benchmarks |
| `business-model-patterns.csv` | Business model patterns |

## Module Structure

```
bmp/
├── agents/                     # 5 agent definitions (YAML)
│   ├── planning-orchestrator-agent.agent.yaml
│   ├── business-model-architect-agent.agent.yaml
│   ├── financial-analyst-agent.agent.yaml
│   ├── monetization-strategist-agent.agent.yaml
│   └── growth-forecaster-agent.agent.yaml
├── workflows/                  # 8 workflow definitions
│   ├── business-model-canvas/
│   ├── financial-projections/
│   ├── pricing-strategy/
│   ├── revenue-model/
│   ├── growth-forecast/
│   ├── business-plan/
│   ├── pitch-deck/
│   └── export-to-development/
├── tasks/                      # 4 standalone tasks
│   ├── calculate-unit-economics.xml
│   ├── breakeven-analysis.xml
│   ├── scenario-model.xml
│   └── funding-requirements.xml
├── data/                       # Reference data files
│   ├── revenue-models.csv
│   ├── pricing-strategies.csv
│   ├── financial-metrics.csv
│   └── business-model-patterns.csv
├── _module-installer/          # Installation config
│   └── install-config.yaml
├── config.yaml                 # Module configuration
└── README.md                   # This file
```

## Configuration

Key settings configurable during installation:

| Setting | Description | Default |
|---------|-------------|---------|
| `projection_years` | Years for financial projections | 5 |
| `default_business_type` | Business type for benchmarks | saas |
| `scenario_mode` | Number of scenarios to generate | three |
| `default_currency` | Currency for financials | USD |
| `target_ltv_cac` | Target LTV:CAC ratio | 3:1 |
| `target_payback_months` | Target CAC payback | 12 |

## Anti-Hallucination Protocol

BMP enforces financial accuracy:

- **All assumptions documented**: No hidden assumptions in projections
- **Benchmarks require sources**: Industry benchmarks cite references
- **Ranges over point estimates**: Uncertainty acknowledged
- **Three scenarios minimum**: Conservative/realistic/optimistic

### Confidence Levels

- **[Sourced]**: Industry benchmarks with citations
- **[Benchmarked]**: Based on comparable companies
- **[Estimated]**: Requires validation
- **[Projected]**: Based on stated assumptions

## Events

### Publishes

- `planning.canvas.completed`
- `planning.financials.completed`
- `planning.business_plan.completed`
- `planning.export.ready`

### Subscribes To

- `validation.completed` (from BMV)

## Research Documentation

- `/docs/modules/bmp/research/BMP-RESEARCH-FINDINGS.md` - Complete research

---

**Module Owner:** AI Business Hub Team
**Part of:** BMAD Module System
