# BMV Module Documentation

## Business Validation Module - Complete Reference Guide

**Module Code:** `bmv`
**Version:** 1.0.0
**Layer:** Foundation (BUILD Phase)
**Status:** Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Module Architecture](#module-architecture)
3. [File Structure](#file-structure)
4. [Agents](#agents)
5. [Workflows](#workflows)
6. [Tasks](#tasks)
7. [Data Files](#data-files)
8. [Anti-Hallucination Protocol](#anti-hallucination-protocol)
9. [BMAD Integration](#bmad-integration)
10. [Agno Integration](#agno-integration)
11. [Configuration](#configuration)
12. [Usage Guide](#usage-guide)
13. [Extending the Module](#extending-the-module)
14. [Research Documentation](#research-documentation)

---

## Overview

### Purpose

The Business Validation Module (BMV) provides AI-powered business idea validation before significant investment. It answers the critical question: **"Should we pursue this idea?"**

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Market Sizing** | TAM/SAM/SOM calculations using multiple methodologies |
| **Competitive Intelligence** | Deep competitor analysis with Porter's Five Forces |
| **Customer Profiling** | ICP development using Jobs-to-be-Done framework |
| **Risk Assessment** | Systematic risk identification and mitigation planning |
| **Go/No-Go Recommendations** | Evidence-based recommendations with confidence scores |

### Design Principles

1. **Anti-Hallucination First**: Every market claim requires source citations
2. **Multi-Agent Collaboration**: Specialized agents for different validation aspects
3. **Workflow-Driven**: Structured processes ensure consistency
4. **Integration Ready**: Designed to hand off to BMM planning workflows
5. **Source Transparency**: All data traceable to credible sources

---

## Module Architecture

### Layer Position

```
AI Business Hub Module Layers
─────────────────────────────────────────────────────────
GROWTH Layer      │ BMG (Growth)
OPERATE Layer     │ BMO (Operations)
LAUNCH Layer      │ BML (Launch)
─────────────────────────────────────────────────────────
BUILD Layer       │ BMP (Planning) ← receives from BMV
                  │ BMD (Development)
─────────────────────────────────────────────────────────
FOUNDATION Layer  │ BMV (Validation) ← YOU ARE HERE
                  │ BMI (Intelligence)
                  │ Orchestrator
─────────────────────────────────────────────────────────
```

### Information Flow

```
┌─────────────────┐
│   User Input    │
│ (Business Idea) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BMV Module     │
│  ┌───────────┐  │
│  │ Validator │◄─┼─── Orchestrates validation
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Market   │  │
│  │  Sizing   │──┼─── Marco agent
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │Competitor │  │
│  │ Analysis  │──┼─── Cipher agent
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ Customer  │  │
│  │ Discovery │──┼─── Persona agent
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Risk &   │  │
│  │Synthesis  │──┼─── Risk + Validator agents
│  └─────┬─────┘  │
└────────┼────────┘
         │
         ▼
┌─────────────────┐
│  GO / NO-GO     │
│  Recommendation │
└────────┬────────┘
         │ (if GO)
         ▼
┌─────────────────┐
│   BMM Module    │
│ (Product Brief) │
└─────────────────┘
```

---

## File Structure

### Complete Module Tree

```
.bmad/bmv/
├── README.md                           # Module overview
├── config.yaml                         # Module configuration
│
├── agents/                             # Agent Definitions (5)
│   ├── validation-orchestrator-agent.agent.yaml
│   ├── market-researcher-agent.agent.yaml
│   ├── competitor-analyst-agent.agent.yaml
│   ├── customer-profiler-agent.agent.yaml
│   └── feasibility-assessor-agent.agent.yaml
│
├── workflows/                          # Workflow Packages (8)
│   ├── idea-intake/
│   │   ├── workflow.yaml              # Workflow configuration
│   │   ├── instructions.md            # Step-by-step instructions
│   │   ├── template.md                # Output document template
│   │   └── checklist.md               # Validation checklist
│   │
│   ├── market-sizing/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── competitor-mapping/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── customer-discovery/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── product-fit-analysis/          # NEW: Multi-product fit analysis
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── validation-synthesis/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── quick-validation/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   └── export-to-planning/
│       ├── workflow.yaml
│       ├── instructions.md
│       ├── template.md
│       └── checklist.md
│
├── tasks/                              # Standalone Tasks (3)
│   ├── validate-sources.xml
│   ├── calculate-tam.xml
│   └── risk-assessment.xml
│
├── data/                               # Reference Data Files (3)
│   ├── assumption-types.csv
│   ├── pivot-types.csv
│   └── source-credibility.csv
│
├── templates/                          # Shared Templates (future)
│
└── _module-installer/                  # Installation Configuration
    └── install-config.yaml
```

### Research Documentation

```
docs/modules/bmv/
├── README.md                           # This file
└── research/
    ├── BMV-RESEARCH-FINDINGS.md        # Original research (1285 lines)
    └── BMV-EXPANDED-COMPONENTS.md      # Expanded components research
```

---

## Agents

### Agent Overview

| Agent | Code | Personality | Primary Role |
|-------|------|-------------|--------------|
| **Validator** | validation-orchestrator | Systematic, decisive | Coordinates validation, final synthesis |
| **Marco** | market-researcher | Analytical, thorough | TAM/SAM/SOM, market intelligence |
| **Cipher** | competitor-analyst | Strategic, observant | Competitive intelligence, positioning |
| **Persona** | customer-profiler | Empathetic, insightful | ICP, personas, Jobs-to-be-Done |
| **Risk** | feasibility-assessor | Pragmatic, cautious | Risk assessment, go/no-go criteria |

### Agent File Format

Each agent is defined in YAML format (`.agent.yaml`):

```yaml
# Example: validation-orchestrator-agent.agent.yaml
id: validation-orchestrator-agent
name: Validator
type: module  # simple | expert | module
version: 1.0.0

persona:
  role: "Validation Team Lead"
  personality: "Systematic, decisive, evidence-driven"
  communication_style: "Clear, structured, action-oriented"

capabilities:
  - Orchestrate multi-agent validation workflows
  - Synthesize findings from specialized agents
  - Make go/no-go recommendations
  - Manage validation sessions

commands:
  - name: validate
    description: "Start full validation workflow"
  - name: quick-check
    description: "Run quick validation"
  - name: synthesize
    description: "Generate final recommendation"

integrations:
  mcp_tools:
    - jina-ai
  agents:
    - market-researcher-agent
    - competitor-analyst-agent
    - customer-profiler-agent
    - feasibility-assessor-agent
```

### Agent Collaboration Pattern

```
                    ┌─────────────────────┐
                    │     Validator       │
                    │   (Orchestrator)    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │    Marco    │    │   Cipher    │    │   Persona   │
    │  (Market)   │    │(Competitor) │    │ (Customer)  │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        Risk         │
                    │  (Feasibility)      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Validator       │
                    │   (Synthesis)       │
                    └─────────────────────┘
```

---

## Workflows

### Workflow Types

| Type | Has Template | Description |
|------|--------------|-------------|
| **Document** | Yes | Produces a markdown document output |
| **Action** | No | Performs actions without document output |
| **Interactive** | Yes | Guided conversation with user input |

### Core Workflows

#### 1. idea-intake

**Purpose:** Capture and structure business ideas with clarifying questions

**Input:** Initial idea description from user

**Output:** Structured idea intake document

**Key Steps:**
1. Capture initial idea
2. Clarify the problem
3. Define the solution
4. Assess founder-market fit
5. Explore timing context
6. Identify key assumptions
7. Quick sanity check
8. Generate session ID

**Agent:** Validator

---

#### 2. market-sizing

**Purpose:** Calculate TAM/SAM/SOM with anti-hallucination compliance

**Input:** Market description, geographic scope

**Output:** Market sizing report with sources

**Key Steps:**
1. Initial market research (web search)
2. Top-down TAM calculation
3. Bottom-up TAM calculation
4. Value theory TAM (optional)
5. TAM reconciliation
6. SAM calculation with constraints
7. SOM projection (3 years)
8. Growth rate analysis
9. Source documentation

**Agent:** Marco (market-researcher)

**Anti-Hallucination:** 2+ sources required for all TAM claims

---

#### 3. competitor-mapping

**Purpose:** Deep competitive analysis with positioning map

**Input:** Product category, geographic focus

**Output:** Competitor analysis report

**Key Steps:**
1. Competitor discovery
2. Competitor profiling
3. Feature comparison matrix
4. Pricing analysis
5. Porter's Five Forces
6. Positioning map
7. Strategic recommendations

**Agent:** Cipher (competitor-analyst)

---

#### 4. customer-discovery

**Purpose:** Develop ICP and personas using Jobs-to-be-Done

**Input:** Target customer description

**Output:** Customer profile document

**Key Steps:**
1. Define customer segments
2. Research customer data
3. Jobs-to-be-Done analysis
4. Pain point mapping
5. Create personas
6. Buying process analysis
7. Willingness to pay research
8. Customer acquisition strategy

**Agent:** Persona (customer-profiler)

---

#### 5. product-fit-analysis

**Purpose:** Match validated ideas to product types and identify competitive gaps

**Input:** Validated idea document, optional market/competitor research

**Output:** Product-fit analysis with ranked product recommendations

**Key Steps:**
1. Load and review validated idea
2. Assess compatibility with 9 product types (Course, Podcast, Book, YouTube, Digital, SaaS, Physical, E-commerce, Website)
3. Score each product type on: Audience Alignment, Content Fit, Monetization, Resources, Time-to-Market
4. Research competitive gaps per product type candidate
5. Calculate gap opportunity scores
6. Analyze resource requirements and synergies
7. Create final ranked recommendations by tier
8. Generate product roadmap sequence
9. Create structured JSON handoff for BMP

**Agent:** Marco (market-researcher) + Cipher (competitor-analyst)

**Output Data:** JSON array of recommended products with fit scores, gaps, synergies

**Feeds Into:** BMP `multi-product-planning` workflow

---

#### 6. validation-synthesis

**Purpose:** Synthesize all findings into go/no-go recommendation

**Input:** All previous validation documents

**Output:** Final validation synthesis with recommendation

**Key Steps:**
1. Load all validation documents
2. Cross-document consistency check
3. Calculate validation scores (0-10 each)
4. Risk assessment
5. SWOT synthesis
6. Go/No-Go framework application
7. Generate recommendation
8. Define next steps

**Agents:** Validator + Risk

**Decision Output:** GO | CONDITIONAL GO | PIVOT | NO-GO

---

#### 7. quick-validation

**Purpose:** 30-minute rapid sanity check for early-stage ideas

**Input:** Quick idea description

**Output:** Quick validation scorecard

**Key Steps:**
1. Capture idea (5 min)
2. Competitive quick search (10 min)
3. Market existence check (5 min)
4. Founder-fit check (5 min)
5. Decision (5 min)

**Agent:** Validator

**Scoring:** 5 criteria × 1-5 points = 25 max

---

#### 8. export-to-planning

**Purpose:** Transform validated concept to BMM product brief

**Input:** Validation synthesis document

**Output:** Validated product brief for BMM

**Key Steps:**
1. Load validation data
2. Transform to product brief format
3. Add planning context
4. Generate handoff document

**Agent:** Validator

**Prerequisite:** GO or CONDITIONAL GO recommendation

---

### Workflow File Format

Each workflow has 4 files:

#### workflow.yaml
```yaml
name: workflow-name
description: "What this workflow does"
config_source: "{project-root}/.bmad/bmv/config.yaml"
installed_path: "{project-root}/.bmad/bmv/workflows/workflow-name"
template: "{installed_path}/template.md"  # or false for action workflows
instructions: "{installed_path}/instructions.md"
validation: "{installed_path}/checklist.md"
default_output_file: "{output_folder}/bmv/output-{{date}}.md"

workflow_type: document | action | interactive
interaction_mode: guided | research | analysis

inputs:
  - name: input_name
    type: text | file_path | select
    required: true | false
    description: "Input description"

agents:
  primary: agent-id
  supporting: [agent-id-1, agent-id-2]

mcp_tools:
  required: [jina-ai]
  optional: [playwright]

events:
  on_complete:
    - event.name.completed
```

#### instructions.md
```markdown
# Workflow Name Instructions

<critical>Important rules and constraints</critical>

<workflow>

<step n="1" goal="Step goal">
<action>What to do</action>
<output>Expected output</output>
</step>

<step n="2" goal="Next step">
...
</step>

</workflow>
```

#### template.md
```markdown
# Document Title

**Session ID**: {{session_id}}
**Date**: {{current_date}}

---

## Section 1

{{section_1_content}}

## Section 2

{{section_2_content}}

---

*Generated by BMV Module*
```

#### checklist.md
```markdown
# Validation Checklist

## Category 1
- [ ] Check item 1
- [ ] Check item 2

## Category 2
- [ ] Check item 3
- [ ] Check item 4

---

**Complete:** [ ] Yes [ ] No
```

---

## Tasks

### Task Overview

Tasks are standalone operations that don't require full workflow execution.

| Task | Purpose | MCP Tools |
|------|---------|-----------|
| `validate-sources` | Verify source credibility and accessibility | jina-ai |
| `calculate-tam` | Quick TAM/SAM/SOM calculation | jina-ai |
| `risk-assessment` | Systematic risk identification | none |

### Task File Format (XML)

```xml
<task id="{bmad_folder}/bmv/tasks/task-name.xml"
      name="Task Display Name"
      standalone="true"
      mcp_tools="tool1,tool2">

  <llm critical="true">
    <i>Critical instructions for the LLM</i>
  </llm>

  <purpose>
    What this task accomplishes
  </purpose>

  <inputs>
    <input name="input_name" required="true">
      Input description
    </input>
  </inputs>

  <flow>
    <step n="1" title="Step Title">
      <action>What to do</action>
    </step>
    <step n="2" title="Next Step">
      <action>Next action</action>
    </step>
  </flow>
</task>
```

---

## Data Files

### assumption-types.csv

Categorizes business assumptions for validation:

| Category | Assumption Type | Description | Test Method |
|----------|-----------------|-------------|-------------|
| desirability | problem_exists | Customers have this problem | Customer interviews |
| desirability | problem_priority | Problem is important enough | Ranking exercise |
| feasibility | tech_possible | Can build with available tech | Technical spike |
| viability | willingness_to_pay | Customers will pay target price | Price testing |

### pivot-types.csv

Lean Startup pivot types with guidance:

| Pivot Type | Description | When to Use |
|------------|-------------|-------------|
| zoom_in | Feature becomes product | One feature getting 90% of usage |
| customer_segment | Same product, different customer | Adjacent segment buying |
| value_capture | Change monetization | Revenue model not working |

### source-credibility.csv

Source credibility tiers for anti-hallucination:

| Tier | Source Types | Notes |
|------|--------------|-------|
| high | Gartner, Forrester, government data | Most authoritative |
| medium | TechCrunch, company websites, G2 | Reputable |
| low | Blog posts, social media | Needs corroboration |

---

## Anti-Hallucination Protocol

### Core Rules

1. **Minimum Sources**: 2+ independent sources for market size claims
2. **Source Age**: Maximum 24 months for time-sensitive data
3. **URL Required**: All competitor claims must have source URLs
4. **Credibility Tier**: Prefer high-tier sources for critical claims
5. **Conflict Disclosure**: When sources conflict, show ALL estimates

### Confidence Levels

| Level | Criteria | Label |
|-------|----------|-------|
| High | 2+ credible sources agree | `[Verified - 2+ sources]` |
| Medium | Single credible source | `[Single source - verify]` |
| Low | Estimated or calculated | `[Estimated - low confidence]` |

### Credibility Tiers

| Tier | Examples | Trust Level |
|------|----------|-------------|
| **High** | Gartner, Forrester, IDC, McKinsey, BCG, SEC filings, .gov, .edu | Authoritative |
| **Medium** | TechCrunch, Forbes, Bloomberg, company websites, G2, Capterra | Reputable |
| **Low** | Blog posts, social media, anonymous sources | Corroborate |

### Implementation in Workflows

```markdown
<!-- In market-sizing instructions.md -->
<critical>ANTI-HALLUCINATION PROTOCOL IS MANDATORY</critical>
<critical>Every number requires source citations</critical>

<!-- In output templates -->
**TAM**: $5.2B [Source: Gartner Market Report 2025, URL]
         $4.8B [Source: IDC Worldwide Report 2025, URL]
**Reconciled TAM**: $5.0B (average of two estimates)
**Confidence**: [Verified - 2+ sources]
```

---

## BMAD Integration

### Module Positioning

BMV is a **BMAD Module** that follows core BMAD patterns:

| BMAD Component | BMV Implementation |
|----------------|-------------------|
| Agents (YAML) | 5 agent files in `agents/` |
| Workflows | 7 workflow packages in `workflows/` |
| Tasks | 3 XML tasks in `tasks/` |
| Config | `config.yaml` + `install-config.yaml` |
| Documentation | `README.md` + research docs |

### Workflow Execution

BMV workflows use the core BMAD workflow engine:

```
{project-root}/.bmad/core/tasks/workflow.xml
```

### Slash Commands

After installation, workflows are accessible via:

```
/bmad:bmv:workflows:idea-intake
/bmad:bmv:workflows:market-sizing
/bmad:bmv:workflows:competitor-mapping
/bmad:bmv:workflows:customer-discovery
/bmad:bmv:workflows:product-fit-analysis
/bmad:bmv:workflows:validation-synthesis
/bmad:bmv:workflows:quick-validation
/bmad:bmv:workflows:export-to-planning
```

### Agent Loading

Agents are loaded via BMAD agent commands:

```
/bmad:bmv:agents:validation-orchestrator
/bmad:bmv:agents:market-researcher
/bmad:bmv:agents:competitor-analyst
/bmad:bmv:agents:customer-profiler
/bmad:bmv:agents:feasibility-assessor
```

### BMM Handoff

BMV integrates with BMM (BMAD Method Module):

1. **BMV Output**: Validated product brief
2. **BMM Input**: Product brief workflow
3. **Handoff**: `export-to-planning` workflow creates BMM-compatible artifact

---

## Agno Integration

### Agent Implementation

BMV agents can be implemented as Agno agents for production deployment.

#### Agno Agent Structure

```
agents/validation/
├── __init__.py
├── base.py                    # Base validation agent
├── orchestrator.py            # Validator agent
├── market_researcher.py       # Marco agent
├── competitor_analyst.py      # Cipher agent
├── customer_profiler.py       # Persona agent
└── feasibility_assessor.py    # Risk agent
```

#### Example Agno Implementation

```python
# agents/validation/orchestrator.py
from agno import Agent, tool
from agno.models import OpenAI

class ValidationOrchestrator(Agent):
    """Validation team lead - coordinates all validation activities"""

    name = "Validator"
    model = OpenAI(id="gpt-4o")

    instructions = """
    You are Validator, the validation team lead. Your role is to:
    1. Coordinate validation workflows
    2. Delegate to specialized agents
    3. Synthesize findings
    4. Make go/no-go recommendations

    Always enforce anti-hallucination protocol.
    """

    @tool
    def start_validation(self, idea: str) -> str:
        """Start a new validation session"""
        # Create session, delegate to agents
        pass

    @tool
    def synthesize_findings(self, session_id: str) -> str:
        """Synthesize all validation findings"""
        # Gather from all agents, create synthesis
        pass
```

### Data Models (Prisma)

From research findings, suggested database schema:

```prisma
model ValidationSession {
  id                String   @id @default(cuid())
  ideaDescription   String
  status            ValidationStatus
  overallScore      Float?
  recommendation    Recommendation?
  createdAt         DateTime @default(now())

  marketSizing      MarketSizing?
  competitorAnalysis CompetitorAnalysis?
  customerProfile   CustomerProfile?
  riskAssessment    RiskAssessment?
  sources           ValidationSource[]
}

model MarketSizing {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  tamLow          Float
  tamHigh         Float
  tamConfidence   ConfidenceLevel
  samValue        Float
  somYear1        Float
  somYear3        Float
  methodology     String

  session         ValidationSession @relation(fields: [sessionId])
  sources         ValidationSource[]
}

enum ValidationStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

enum Recommendation {
  GO
  CONDITIONAL_GO
  PIVOT
  NO_GO
}

enum ConfidenceLevel {
  HIGH
  MEDIUM
  LOW
}
```

### MCP Tool Integration

BMV uses these MCP servers:

| MCP Server | Purpose | Required |
|------------|---------|----------|
| `jina-ai` | Web search, URL reading | Yes |
| `playwright` | Screenshots, browser automation | Optional |
| `context7` | Tech documentation lookup | Optional |

---

## Configuration

### config.yaml

Module-level configuration:

```yaml
module:
  name: bmv
  display_name: Business Validation Module
  version: 1.0.0
  status: complete
  layer: foundation

agents:
  - id: validation-orchestrator-agent
    name: Validator
    status: active
  # ... other agents

workflows:
  - id: idea-intake
    name: Idea Intake Flow
    status: active
  # ... other workflows

anti_hallucination:
  market_size_claims:
    min_sources: 2
    max_age_months: 24
  confidence_levels:
    - high: "2+ corroborating sources"
    - medium: "single credible source"
    - low: "estimation or speculation"
```

### install-config.yaml

Installation-time configuration:

```yaml
code: bmv
name: "Business Validation Module"
default_selected: true

prompt:
  - "Welcome to the Business Validation Module!"
  - "AI-powered business idea validation."

# Interactive config fields
bmv_output_path:
  prompt: "Where should BMV save validation documents?"
  default: "output/bmv"
  result: "{project-root}/{value}"

anti_hallucination_level:
  prompt: "How strict should source verification be?"
  default: "standard"
  single-select:
    - value: "relaxed"
      label: "Relaxed - Single source acceptable"
    - value: "standard"
      label: "Standard - 2+ sources for market claims"
    - value: "strict"
      label: "Strict - 2+ sources for all claims"

# Static config
tam_threshold:
  result: "1000000000"  # $1B

sam_threshold:
  result: "100000000"   # $100M
```

---

## Usage Guide

### Full Validation Flow

```bash
# 1. Start with idea intake
/bmad:bmv:workflows:idea-intake
# Answer questions about your business idea

# 2. Run market sizing
/bmad:bmv:workflows:market-sizing
# Provide market description and geographic scope

# 3. Run competitor analysis
/bmad:bmv:workflows:competitor-mapping
# Provide product category

# 4. Run customer discovery
/bmad:bmv:workflows:customer-discovery
# Provide target customer description

# 5. Get final recommendation
/bmad:bmv:workflows:validation-synthesis
# Provide paths to all previous documents

# 6. If GO, export to planning
/bmad:bmv:workflows:export-to-planning
# Creates BMM-compatible product brief
```

### Quick Validation

```bash
# 30-minute sanity check
/bmad:bmv:workflows:quick-validation
# Answer 5 quick questions, get immediate verdict
```

### Standalone Tasks

```bash
# Validate sources in a document
# Run task: validate-sources.xml with document path

# Quick TAM calculation
# Run task: calculate-tam.xml with market description

# Risk assessment
# Run task: risk-assessment.xml with idea description
```

---

## Extending the Module

### Adding a New Workflow

1. Create workflow directory:
```bash
mkdir .bmad/bmv/workflows/new-workflow
```

2. Create required files:
```
new-workflow/
├── workflow.yaml
├── instructions.md
├── template.md
└── checklist.md
```

3. Update `config.yaml`:
```yaml
workflows:
  # ... existing workflows
  - id: new-workflow
    name: New Workflow Name
    status: active
    description: What it does
```

### Adding a New Agent

1. Create agent file:
```bash
touch .bmad/bmv/agents/new-agent.agent.yaml
```

2. Define agent in YAML format

3. Update `config.yaml`:
```yaml
agents:
  # ... existing agents
  - id: new-agent
    name: Agent Name
    status: active
```

### Adding a New Task

1. Create task file:
```bash
touch .bmad/bmv/tasks/new-task.xml
```

2. Define task in XML format

3. Update `config.yaml`:
```yaml
tasks:
  # ... existing tasks
  - id: new-task
    name: Task Name
    status: active
```

---

## Research Documentation

### Available Documents

| Document | Location | Description |
|----------|----------|-------------|
| Research Findings | `research/BMV-RESEARCH-FINDINGS.md` | Original comprehensive research (1285 lines) |
| Expanded Components | `research/BMV-EXPANDED-COMPONENTS.md` | Additional workflows, tools, checklists |

### Key Research Topics

- Agent personalities and roles
- Workflow designs and patterns
- Anti-hallucination protocol
- Data models (TypeScript interfaces, Prisma schema)
- Event system design
- UI component specifications
- MCP tool integrations

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2025-12-01 | Added product-fit-analysis workflow |
| | | Multi-product type matching and gap analysis |
| | | Now 8 workflows total |
| 1.0.0 | 2025-12-01 | Initial complete release |
| | | 5 agents, 7 workflows, 3 tasks |
| | | Anti-hallucination protocol |
| | | BMM integration |
| | | Full documentation |

---

## Contributing

To contribute to BMV:

1. Review existing patterns in this documentation
2. Follow BMAD conventions for agents/workflows/tasks
3. Ensure anti-hallucination compliance
4. Test with sample business ideas
5. Update documentation

---

**Module Owner:** AI Business Hub Team
**Part of:** BMAD Module System
**Last Updated:** 2025-12-01
