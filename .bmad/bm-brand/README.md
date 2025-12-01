# Brand Identity Module (BM-Brand) - Complete Documentation

**Module Code:** bm-brand
**Version:** 1.0.0
**Layer:** Foundation (BRAND Phase)
**Author:** AI Business Hub Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Integration Flow](#integration-flow)
4. [Agents](#agents)
5. [Workflows](#workflows)
6. [Tasks](#tasks)
7. [Data Files](#data-files)
8. [Configuration](#configuration)
9. [Usage Guide](#usage-guide)
10. [Anti-Hallucination Protocol](#anti-hallucination-protocol)

---

## Overview

The Brand Identity Module (BM-Brand) is a comprehensive AI-powered branding system that transforms validated business concepts into complete brand identity systems. It serves as the critical bridge between the Business Planning Module (BMP) and subsequent implementation modules.

### Purpose

BM-Brand helps users:
- Develop strategic brand positioning and archetype selection
- Create comprehensive voice and tone guidelines
- Design visual identity systems (logo specs, colors, typography)
- Generate complete brand guidelines documentation
- Plan and generate brand asset deliverables
- Conduct brand health audits and assessments

### Key Capabilities

| Capability | Description |
|------------|-------------|
| Brand Strategy | Archetype selection, positioning, personas, messaging framework |
| Voice Development | Voice attributes, tone spectrum, writing guidelines, vocabulary |
| Visual Identity | Logo specifications, color palette, typography, imagery direction |
| Brand Guidelines | Comprehensive documentation compilation |
| Asset Management | Checklist, specifications, generation guidance |
| Brand Audit | Health assessment, consistency checks, recommendations |

---

## Architecture

### Module Structure

```
.bmad/bm-brand/
├── agents/                              # 6 specialized agents
│   ├── brand-orchestrator-agent.agent.yaml
│   ├── brand-strategist-agent.agent.yaml
│   ├── voice-architect-agent.agent.yaml
│   ├── visual-identity-designer-agent.agent.yaml
│   ├── asset-generator-agent.agent.yaml
│   └── brand-auditor-agent.agent.yaml
│
├── workflows/                           # 7 workflow definitions
│   ├── brand-strategy/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   ├── brand-voice/
│   ├── visual-identity/
│   ├── brand-guidelines/
│   ├── asset-checklist/
│   ├── asset-generation/
│   └── brand-audit/
│
├── tasks/                               # 4 utility tasks
│   ├── color-converter.xml
│   ├── archetype-matcher.xml
│   ├── contrast-checker.xml
│   └── type-scale-generator.xml
│
├── data/                                # Reference data
│   ├── brand-archetypes.csv
│   ├── color-psychology.csv
│   ├── social-media-dimensions.csv
│   ├── file-format-specifications.csv
│   └── typography-scale-ratios.csv
│
├── _module-installer/
│   └── install-config.yaml
│
└── README.md
```

### Design Principles

1. **Research-Based**: All branding decisions grounded in established frameworks (Jungian archetypes, color psychology)
2. **Systematic Approach**: Structured workflows ensure comprehensive coverage
3. **Integration-Ready**: Designed for seamless handoff to downstream modules
4. **Quality-Focused**: Built-in validation checklists prevent incomplete outputs
5. **Anti-Hallucination**: Strict protocols ensure factual, grounded outputs

---

## Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI BUSINESS HUB PIPELINE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   BMV    │────▶│   BMP    │────▶│ BM-BRAND │────▶│  BM-PM   │
│ Validate │     │   Plan   │     │  Brand   │     │ Manage   │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                      │                │
                      ▼                ▼
              Business Context   Brand Identity
              - Name             - Archetype
              - Positioning      - Voice Guidelines
              - Target Audience  - Visual Identity
              - Value Prop       - Brand Guidelines
                                 - Asset Specs
```

### Receives from BMP

| Data | Usage |
|------|-------|
| business_name | Brand naming context |
| business_description | Brand story foundation |
| target_audience | Persona development |
| value_proposition | Positioning foundation |
| positioning | Competitive differentiation |

### Provides to BM-PM

| Data | Usage |
|------|-------|
| brand_guidelines | Project documentation |
| visual_specifications | Design requirements |
| voice_guidelines | Content standards |
| asset_specifications | Deliverable requirements |

---

## Agents

### 1. Brand Orchestrator

**ID**: `brand-orchestrator`
**Type**: Orchestrator
**Purpose**: Coordinates all branding workflows and ensures consistency

**Responsibilities**:
- Guide users through optimal workflow sequence
- Ensure cross-workflow consistency
- Validate outputs before handoff
- Manage workflow dependencies

---

### 2. Brand Strategist

**ID**: `brand-strategist`
**Type**: Specialist
**Purpose**: Develops brand positioning, archetype, and messaging

**Capabilities**:
- 12 Jungian archetype analysis and selection
- Competitive brand positioning
- Target persona development
- Positioning statement creation
- Messaging framework development
- Tagline development

---

### 3. Voice Architect

**ID**: `voice-architect`
**Type**: Specialist
**Purpose**: Develops verbal identity and communication guidelines

**Capabilities**:
- Voice attribute definition
- Tone spectrum development
- Writing guidelines creation
- Vocabulary standards
- Content type guidelines
- Before/after examples

---

### 4. Visual Identity Designer

**ID**: `visual-identity-designer`
**Type**: Specialist
**Purpose**: Develops visual identity system specifications

**Capabilities**:
- Logo system specification
- Color palette development (HEX, RGB, CMYK, Pantone)
- Typography system selection
- Imagery direction
- Iconography guidelines
- Visual element specifications

---

### 5. Asset Generator

**ID**: `asset-generator`
**Type**: Specialist
**Purpose**: Creates brand asset deliverables

**Capabilities**:
- Logo package specification
- Social media asset sizing
- Business collateral specs
- Digital asset requirements
- File format specifications
- Asset package organization

---

### 6. Brand Auditor

**ID**: `brand-auditor`
**Type**: Specialist
**Purpose**: Conducts brand health assessments

**Capabilities**:
- Visual consistency audits
- Verbal consistency audits
- Touchpoint analysis
- Competitive position assessment
- Health scoring
- Recommendation generation

---

## Workflows

### Recommended Sequence

```
1. brand-strategy     ─┬─▶ 2. brand-voice
                       │
                       └─▶ 3. visual-identity
                               │
                               ▼
                          4. brand-guidelines
                               │
                               ▼
                          5. asset-checklist
                               │
                               ▼
                          6. asset-generation

[Periodic] 7. brand-audit
```

### 1. Brand Strategy (brand-strategy)

**Duration**: 60-90 minutes
**Agent**: Brand Strategist

**Steps**:
1. Analyze business context from BMP
2. Conduct competitive brand analysis
3. Select primary/secondary archetype
4. Develop target personas
5. Craft positioning statement
6. Build messaging framework
7. Validate strategy consistency

**Outputs**:
- brand-strategy-document.md
- archetype-profile.md
- persona-cards.md
- positioning-statement.md
- messaging-framework.md

---

### 2. Brand Voice (brand-voice)

**Duration**: 45-60 minutes
**Agent**: Voice Architect

**Steps**:
1. Analyze brand strategy outputs
2. Define 3-4 voice attributes
3. Create tone spectrum
4. Develop writing guidelines
5. Build vocabulary lists
6. Create content type guidelines
7. Validate voice system

**Outputs**:
- brand-voice-guidelines.md
- voice-attributes.md
- tone-spectrum.md
- writing-style-guide.md
- vocabulary-lists.md

---

### 3. Visual Identity (visual-identity)

**Duration**: 60-90 minutes
**Agent**: Visual Identity Designer

**Steps**:
1. Analyze brand strategy
2. Design logo system
3. Develop color palette
4. Select typography system
5. Define imagery direction
6. Create visual elements
7. Validate visual identity

**Outputs**:
- visual-identity-guide.md
- logo-specifications.md
- color-palette.md
- typography-guide.md
- imagery-guidelines.md

---

### 4. Brand Guidelines (brand-guidelines)

**Duration**: 30-45 minutes
**Agent**: Brand Orchestrator

**Steps**:
1. Gather all brand components
2. Structure guidelines document
3. Compile strategy section
4. Compile visual section
5. Compile verbal section
6. Add application guidelines
7. Create quick reference

**Outputs**:
- brand-guidelines.md
- quick-reference-card.md

---

### 5. Asset Checklist (asset-checklist)

**Duration**: 20-30 minutes
**Agent**: Asset Generator

**Steps**:
1. Analyze business needs
2. Define logo assets
3. Define social media assets
4. Define collateral assets
5. Define digital assets
6. Prioritize assets
7. Define specifications

**Outputs**:
- asset-checklist.md
- priority-matrix.md
- file-specifications.md

---

### 6. Asset Generation (asset-generation)

**Duration**: 60-120 minutes
**Agent**: Asset Generator

**Steps**:
1. Setup folder structure
2. Generate logo assets
3. Generate social media assets
4. Generate collateral assets
5. Generate digital assets
6. Apply messaging
7. Quality check
8. Package for delivery

**Outputs**:
- asset-package-manifest.md
- organized asset folders
- README.txt

---

### 7. Brand Audit (brand-audit)

**Duration**: 45-60 minutes
**Agent**: Brand Auditor

**Steps**:
1. Gather audit materials
2. Visual consistency audit
3. Verbal consistency audit
4. Touchpoint analysis
5. Competitive position analysis
6. Calculate health scores
7. Generate recommendations

**Outputs**:
- brand-audit-report.md
- health-scorecard.md
- action-plan.md

---

## Tasks

### 1. Color Converter

**ID**: `color-converter`
**Purpose**: Convert colors between HEX, RGB, CMYK, HSL formats

### 2. Archetype Matcher

**ID**: `archetype-matcher`
**Purpose**: Analyze brand attributes to recommend suitable archetypes

### 3. Contrast Checker

**ID**: `contrast-checker`
**Purpose**: Verify WCAG color contrast accessibility compliance

### 4. Type Scale Generator

**ID**: `type-scale-generator`
**Purpose**: Generate modular typography scales

---

## Data Files

| File | Description |
|------|-------------|
| brand-archetypes.csv | 12 Jungian archetypes with characteristics |
| color-psychology.csv | Color associations and psychology |
| social-media-dimensions.csv | Platform-specific asset sizes |
| file-format-specifications.csv | File format technical specs |
| typography-scale-ratios.csv | Type scale ratios reference |

---

## Configuration

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| business_name | string | Business name for branding |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| brand_output_path | string | docs/brand | Brand document outputs |
| asset_output_path | string | docs/brand/assets | Asset file outputs |

---

## Usage Guide

### Starting a New Brand Project

1. **Ensure BMP Completion**
   - Business plan should be complete
   - Target audience defined
   - Positioning established

2. **Run Brand Strategy**
   ```
   /bm-brand:brand-strategy
   ```

3. **Develop Identity (parallel)**
   ```
   /bm-brand:brand-voice
   /bm-brand:visual-identity
   ```

4. **Compile Guidelines**
   ```
   /bm-brand:brand-guidelines
   ```

5. **Generate Assets**
   ```
   /bm-brand:asset-checklist
   /bm-brand:asset-generation
   ```

### Conducting a Brand Audit

```
/bm-brand:brand-audit
```

Provide:
- Current brand guidelines
- Samples from all touchpoints
- Competitor information (optional)

---

## Anti-Hallucination Protocol

BM-Brand implements strict anti-hallucination measures:

### Strategy Workflow
- Archetype selection requires documented scoring rationale
- Personas based on provided audience data only
- Positioning references identified competitors only

### Voice Workflow
- Voice attributes derive from archetype characteristics
- All guidelines include specific examples
- Tone contexts based on real communication needs

### Visual Workflow
- Color specifications use accurate codes
- Typography selections are available fonts
- File formats follow industry standards

### Audit Workflow
- All findings cite specific evidence
- Scores use standardized criteria
- Competitive analysis uses real competitors

### General Principles
- Do not invent market data or statistics
- Flag assumptions explicitly
- Use conservative estimates when uncertain
- Reference provided inputs, not invented details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release |

---

*Generated by AI Business Hub - BM-Brand Module*
*Part of Pipeline: BMV → BMP → BM-Brand → BM-PM → BME*
