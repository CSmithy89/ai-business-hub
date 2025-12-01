# Business Validation Module (BMV)

**Module Code:** bmv
**Layer:** Foundation (BUILD Phase)
**Status:** Complete
**Version:** 1.0.0

---

## Overview

AI-powered business idea validation with market sizing (TAM/SAM/SOM), competitive intelligence, customer profiling, and go/no-go recommendations. Validates ideas before significant investment.

### Key Features

- **5 Specialized Agents** for different validation aspects
- **7 Workflows** for structured validation processes
- **3 Standalone Tasks** for quick operations
- **Anti-Hallucination Protocol** ensuring all claims are source-backed

## Installation

```bash
bmad install bmv
```

Or select "Business Validation Module" during BMAD installation.

## Agent Team (5)

| Agent | Name | Role |
|-------|------|------|
| **Validation Orchestrator** | Validator | Team lead - coordinates all validation activities |
| **Market Researcher** | Marco | TAM/SAM/SOM calculations and market intelligence |
| **Competitor Analyst** | Cipher | Competitive intelligence and positioning analysis |
| **Customer Profiler** | Persona | ICP development and Jobs-to-be-Done analysis |
| **Feasibility Assessor** | Risk | Risk assessment and go/no-go recommendations |

## Workflows (7)

### Core Validation Workflows

| Workflow | Purpose | Output |
|----------|---------|--------|
| `idea-intake` | Capture and structure business idea | Idea intake document |
| `market-sizing` | Calculate TAM/SAM/SOM with sources | Market sizing report |
| `competitor-mapping` | Analyze competitive landscape | Competitor analysis |
| `customer-discovery` | Define ICP and personas | Customer profile |
| `validation-synthesis` | Synthesize findings, go/no-go | Final recommendation |

### Additional Workflows

| Workflow | Purpose | Output |
|----------|---------|--------|
| `quick-validation` | 30-minute rapid sanity check | Quick scorecard |
| `export-to-planning` | Transform to BMM product brief | Planning handoff |

## Tasks (3)

| Task | Purpose |
|------|---------|
| `validate-sources.xml` | Verify all cited sources are accessible and credible |
| `calculate-tam.xml` | Quick TAM/SAM/SOM calculation |
| `risk-assessment.xml` | Systematic risk identification and scoring |

## Quick Start

### Full Validation Flow

```
# 1. Capture the idea
/bmad:bmv:workflows:idea-intake

# 2. Run validation workflows
/bmad:bmv:workflows:market-sizing
/bmad:bmv:workflows:competitor-mapping
/bmad:bmv:workflows:customer-discovery

# 3. Get final recommendation
/bmad:bmv:workflows:validation-synthesis

# 4. If GO, export to planning
/bmad:bmv:workflows:export-to-planning
```

### Quick Sanity Check

```
/bmad:bmv:workflows:quick-validation
```

## Anti-Hallucination Protocol

BMV enforces strict source verification:

- **Market size claims**: Minimum 2 independent sources required
- **Growth rates**: Must cite analyst reports or government data
- **Competitor data**: URLs required for all claims
- **Source age**: Maximum 24 months for time-sensitive data

### Confidence Levels

- **[Verified - 2+ sources]**: High confidence
- **[Single source - verify]**: Medium confidence
- **[Estimated - low confidence]**: Requires user verification

### Credibility Tiers

| Tier | Sources |
|------|---------|
| High | Gartner, Forrester, IDC, government data, SEC filings |
| Medium | TechCrunch, Forbes, company websites, G2/Capterra |
| Low | Blog posts, social media, anonymous sources |

## Module Structure

```
bmv/
├── agents/                     # 5 agent definitions (YAML)
│   ├── validation-orchestrator-agent.agent.yaml
│   ├── market-researcher-agent.agent.yaml
│   ├── competitor-analyst-agent.agent.yaml
│   ├── customer-profiler-agent.agent.yaml
│   └── feasibility-assessor-agent.agent.yaml
├── workflows/                  # 7 workflow definitions
│   ├── idea-intake/
│   ├── market-sizing/
│   ├── competitor-mapping/
│   ├── customer-discovery/
│   ├── validation-synthesis/
│   ├── quick-validation/
│   └── export-to-planning/
├── tasks/                      # 3 standalone tasks
│   ├── validate-sources.xml
│   ├── calculate-tam.xml
│   └── risk-assessment.xml
├── data/                       # Reference data files
│   ├── assumption-types.csv
│   ├── pivot-types.csv
│   └── source-credibility.csv
├── _module-installer/          # Installation config
│   └── install-config.yaml
├── config.yaml                 # Module configuration
└── README.md                   # This file
```

## Configuration

Key settings configurable during installation:

| Setting | Description | Default |
|---------|-------------|---------|
| `anti_hallucination_level` | Source verification strictness | `standard` |
| `tam_methodology` | Primary TAM calculation method | `multi` |
| `default_geographic_scope` | Default market geography | `global` |
| `tam_threshold` | Minimum TAM for GO | $1B |
| `sam_threshold` | Minimum SAM for GO | $100M |

## Integration with BMM

BMV integrates with the BMAD Method Module (BMM) for end-to-end product development:

1. **BMV validates the idea** → GO recommendation
2. **Export to Planning** creates validated product brief
3. **BMM Phase 1** begins with confidence in market opportunity

## Events

### Publishes

- `validation.session.created`
- `validation.market_sizing.completed`
- `validation.competitor_analysis.completed`
- `validation.customer_profile.completed`
- `validation.completed`

## Research Documentation

- `/docs/modules/bmv/research/BMV-RESEARCH-FINDINGS.md` - Original research
- `/docs/modules/bmv/research/BMV-EXPANDED-COMPONENTS.md` - Expanded components

---

**Module Owner:** AI Business Hub Team
**Part of:** BMAD Module System
