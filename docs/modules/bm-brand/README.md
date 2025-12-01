# BM-Brand Module Documentation

## Brand Identity Module - Complete Reference Guide

**Module Code:** `bm-brand`
**Version:** 1.0.0
**Layer:** Foundation (BRAND Phase)
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
10. [Configuration](#configuration)
11. [Usage Guide](#usage-guide)
12. [Extending the Module](#extending-the-module)

---

## Overview

### Purpose

The Brand Identity Module (BM-Brand) provides AI-powered brand identity development, transforming validated business concepts into comprehensive brand systems. It answers the critical question: **"How should this brand look, sound, and feel?"**

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Brand Strategy** | Archetype selection, positioning, persona development, messaging framework |
| **Voice Development** | Voice attributes, tone spectrum, writing guidelines, vocabulary standards |
| **Visual Identity** | Logo specifications, color palette, typography, imagery direction |
| **Brand Guidelines** | Comprehensive documentation compilation for all stakeholders |
| **Asset Management** | Checklist, specifications, and generation guidance for all brand deliverables |
| **Brand Audit** | Health assessment, consistency checks, competitive analysis |

### Design Principles

1. **Research-Based**: All branding decisions grounded in established frameworks (12 Jungian archetypes, color psychology)
2. **Multi-Agent Collaboration**: Specialized agents for strategy, voice, visual, and assets
3. **Workflow-Driven**: Structured processes ensure comprehensive coverage
4. **Integration Ready**: Designed to receive from BMP and hand off to BM-PM
5. **Anti-Hallucination**: Strict protocols ensure factual, grounded outputs

---

## Module Architecture

### Layer Position

```
AI Business Hub Module Layers
─────────────────────────────────────────────────────────
GROWTH Layer      │ BME (Execution)
OPERATE Layer     │ BMO (Operations)
LAUNCH Layer      │ BML (Launch)
─────────────────────────────────────────────────────────
BUILD Layer       │ BM-PM (Project Management) ← receives from BM-Brand
                  │ BMM (BMAD Method)
─────────────────────────────────────────────────────────
FOUNDATION Layer  │ BMP (Planning) ← feeds BM-Brand
                  │ BM-Brand (Branding) ← YOU ARE HERE
                  │ BMV (Validation)
─────────────────────────────────────────────────────────
```

### Information Flow

```
┌─────────────────┐
│   BMP Module    │
│ (Business Plan) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           BM-Brand Module               │
│  ┌─────────────────────────────────┐    │
│  │      Brand Orchestrator         │◄───┼─── Coordinates all workflows
│  └───────────────┬─────────────────┘    │
│                  │                      │
│  ┌───────────────▼─────────────────┐    │
│  │       Brand Strategy            │    │
│  │  (Archetype, Positioning)       │────┼─── Brand Strategist agent
│  └───────────────┬─────────────────┘    │
│                  │                      │
│         ┌───────┴───────┐               │
│         ▼               ▼               │
│  ┌──────────────┐ ┌──────────────┐      │
│  │ Brand Voice  │ │   Visual     │      │
│  │ (Tone, Copy) │ │  Identity    │      │
│  └──────┬───────┘ └──────┬───────┘      │
│         │                │              │
│         └───────┬────────┘              │
│                 ▼                       │
│  ┌──────────────────────────────┐       │
│  │      Brand Guidelines        │       │
│  │   (Comprehensive Docs)       │───────┼─── Compilation
│  └───────────────┬──────────────┘       │
│                  │                      │
│  ┌───────────────▼──────────────┐       │
│  │   Asset Checklist & Generation│      │
│  │   (All Brand Deliverables)    │──────┼─── Asset Generator agent
│  └───────────────┬──────────────┘       │
└──────────────────┼──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Brand Guidelines + Asset Package      │
│   → Handoff to BM-PM                    │
└─────────────────────────────────────────┘
```

---

## File Structure

### Complete Module Tree

```
.bmad/bm-brand/
├── README.md                           # Module overview
│
├── agents/                             # Agent Definitions (6)
│   ├── brand-orchestrator-agent.agent.yaml
│   ├── brand-strategist-agent.agent.yaml
│   ├── voice-architect-agent.agent.yaml
│   ├── visual-identity-designer-agent.agent.yaml
│   ├── asset-generator-agent.agent.yaml
│   └── brand-auditor-agent.agent.yaml
│
├── workflows/                          # Workflow Packages (7)
│   ├── brand-strategy/
│   │   ├── workflow.yaml              # Workflow configuration
│   │   ├── instructions.md            # Step-by-step instructions
│   │   ├── template.md                # Output document template
│   │   └── checklist.md               # Validation checklist
│   │
│   ├── brand-voice/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── visual-identity/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── brand-guidelines/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── asset-checklist/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   ├── asset-generation/
│   │   ├── workflow.yaml
│   │   ├── instructions.md
│   │   ├── template.md
│   │   └── checklist.md
│   │
│   └── brand-audit/
│       ├── workflow.yaml
│       ├── instructions.md
│       ├── template.md
│       └── checklist.md
│
├── tasks/                              # Utility Tasks (4)
│   ├── color-converter.xml
│   ├── archetype-matcher.xml
│   ├── contrast-checker.xml
│   └── type-scale-generator.xml
│
├── data/                               # Reference Data (5)
│   ├── brand-archetypes.csv
│   ├── color-psychology.csv
│   ├── social-media-dimensions.csv
│   ├── file-format-specifications.csv
│   └── typography-scale-ratios.csv
│
└── _module-installer/
    └── install-config.yaml
```

---

## Agents

### Agent Summary Table

| Agent | ID | Type | Purpose |
|-------|-----|------|---------|
| Brand Orchestrator | `brand-orchestrator` | Orchestrator | Coordinates all branding workflows |
| Brand Strategist | `brand-strategist` | Specialist | Positioning, archetypes, messaging |
| Voice Architect | `voice-architect` | Specialist | Voice, tone, writing guidelines |
| Visual Identity Designer | `visual-identity-designer` | Specialist | Logo, colors, typography |
| Asset Generator | `asset-generator` | Specialist | Asset creation and packaging |
| Brand Auditor | `brand-auditor` | Specialist | Brand health assessments |

### Agent Details

#### 1. Brand Orchestrator

**File:** `agents/brand-orchestrator-agent.agent.yaml`

**Purpose:** Master coordinator for all brand identity workflows

**Responsibilities:**
- Guide users through optimal workflow sequence
- Ensure cross-workflow consistency
- Validate outputs before handoff
- Manage workflow dependencies

**Recommended Workflow Sequence:**
1. brand-strategy
2. brand-voice (parallel with visual-identity)
3. visual-identity (parallel with brand-voice)
4. brand-guidelines
5. asset-checklist
6. asset-generation

---

#### 2. Brand Strategist

**File:** `agents/brand-strategist-agent.agent.yaml`

**Purpose:** Develops brand positioning, archetype selection, and messaging framework

**Capabilities:**
- 12 Jungian archetype analysis and selection
- Competitive brand positioning with perceptual mapping
- Target persona development (demographics, psychographics)
- Positioning statement creation
- Messaging framework with proof points
- Tagline and elevator pitch development

**Key Frameworks:**
- Jungian Archetypes (Innocent, Sage, Explorer, Ruler, Creator, Caregiver, Magician, Hero, Rebel, Lover, Jester, Regular Guy)
- Positioning Ladder (Attributes → Benefits → Values → Personality)
- Value Proposition Canvas

---

#### 3. Voice Architect

**File:** `agents/voice-architect-agent.agent.yaml`

**Purpose:** Develops verbal identity and communication guidelines

**Capabilities:**
- Voice attribute definition (3-4 core attributes)
- Tone spectrum development (celebratory, educational, supportive, urgent, etc.)
- Writing guidelines (sentence structure, punctuation, capitalization)
- Vocabulary standards (power words, words to avoid)
- Content type guidelines (website, email, social, error messages)

**Key Concepts:**
- Voice = WHO you are (consistent personality)
- Tone = HOW you adapt (contextual adjustments)

---

#### 4. Visual Identity Designer

**File:** `agents/visual-identity-designer-agent.agent.yaml`

**Purpose:** Develops visual identity system specifications

**Capabilities:**
- Logo system design (types, variations, clear space, minimum sizes)
- Color palette (primary, secondary, accent, extended, semantic)
- Color specifications (HEX, RGB, CMYK, Pantone, HSL)
- Typography system (primary, secondary, type scale)
- Imagery direction (photography, illustration, iconography)
- Visual elements (patterns, graphic devices, spacing)

**Logo Types Covered:**
- Wordmark, Lettermark, Brandmark, Combination, Emblem

---

#### 5. Asset Generator

**File:** `agents/asset-generator-agent.agent.yaml`

**Purpose:** Creates comprehensive brand asset deliverables

**Capabilities:**
- Logo package specifications (all formats and sizes)
- Social media assets (platform-specific dimensions)
- Business collateral (cards, letterhead, presentations)
- Digital assets (favicons, OG images, email signatures)
- File format specifications and naming conventions
- Asset package organization

**Platforms Covered:**
- Facebook, Instagram, LinkedIn, Twitter/X, YouTube, TikTok, Pinterest

---

#### 6. Brand Auditor

**File:** `agents/brand-auditor-agent.agent.yaml`

**Purpose:** Conducts brand health assessments and audits

**Capabilities:**
- Visual consistency audits
- Verbal consistency audits
- Touchpoint analysis and scoring
- Competitive position assessment
- Health scoring (0-100 scale)
- Prioritized recommendations

**Audit Frequency Recommendations:**
- Full audit: Annually
- Visual audit: Quarterly
- Touchpoint spot-check: Monthly

---

## Workflows

### Workflow Summary Table

| Workflow | Duration | Agent | Primary Output |
|----------|----------|-------|----------------|
| brand-strategy | 60-90 min | Brand Strategist | brand-strategy-document.md |
| brand-voice | 45-60 min | Voice Architect | brand-voice-guidelines.md |
| visual-identity | 60-90 min | Visual Identity Designer | visual-identity-guide.md |
| brand-guidelines | 30-45 min | Brand Orchestrator | brand-guidelines.md |
| asset-checklist | 20-30 min | Asset Generator | asset-checklist.md |
| asset-generation | 60-120 min | Asset Generator | asset-package-manifest.md |
| brand-audit | 45-60 min | Brand Auditor | brand-audit-report.md |

### Workflow Details

#### 1. Brand Strategy (`brand-strategy`)

**Purpose:** Establish strategic brand foundation

**Steps:**
1. Analyze business context from BMP
2. Conduct competitive brand analysis
3. Select primary/secondary archetype
4. Develop target personas
5. Craft positioning statement
6. Build messaging framework
7. Validate strategy consistency

**Outputs:**
- `brand-strategy-document.md` - Comprehensive strategy
- `archetype-profile.md` - Archetype characteristics
- `persona-cards.md` - Target audience profiles
- `positioning-statement.md` - Market positioning
- `messaging-framework.md` - Key messages and proof points

---

#### 2. Brand Voice (`brand-voice`)

**Purpose:** Develop verbal identity system

**Steps:**
1. Analyze brand strategy outputs
2. Define 3-4 voice attributes
3. Create tone spectrum
4. Develop writing guidelines
5. Build vocabulary lists
6. Create content type guidelines
7. Validate voice system

**Outputs:**
- `brand-voice-guidelines.md` - Complete voice system
- `voice-attributes.md` - Attribute definitions
- `tone-spectrum.md` - Context-based tone guidance
- `writing-style-guide.md` - Writing rules
- `vocabulary-lists.md` - Words to use/avoid

---

#### 3. Visual Identity (`visual-identity`)

**Purpose:** Develop visual identity specifications

**Steps:**
1. Analyze brand strategy
2. Design logo system
3. Develop color palette
4. Select typography system
5. Define imagery direction
6. Create visual elements
7. Validate visual identity

**Outputs:**
- `visual-identity-guide.md` - Complete visual system
- `logo-specifications.md` - Logo usage rules
- `color-palette.md` - Color specifications
- `typography-guide.md` - Font system
- `imagery-guidelines.md` - Photography/illustration direction

---

#### 4. Brand Guidelines (`brand-guidelines`)

**Purpose:** Compile comprehensive brand documentation

**Steps:**
1. Gather all brand components
2. Structure guidelines document
3. Compile strategy section
4. Compile visual section
5. Compile verbal section
6. Add application guidelines
7. Create quick reference

**Outputs:**
- `brand-guidelines.md` - Master brand document
- `quick-reference-card.md` - One-page summary

---

#### 5. Asset Checklist (`asset-checklist`)

**Purpose:** Audit required brand assets

**Steps:**
1. Analyze business needs
2. Define logo assets
3. Define social media assets
4. Define collateral assets
5. Define digital assets
6. Prioritize assets
7. Define specifications

**Outputs:**
- `asset-checklist.md` - Complete inventory
- `priority-matrix.md` - Asset prioritization
- `file-specifications.md` - Technical specs

---

#### 6. Asset Generation (`asset-generation`)

**Purpose:** Create brand asset deliverables

**Steps:**
1. Setup folder structure
2. Generate logo assets
3. Generate social media assets
4. Generate collateral assets
5. Generate digital assets
6. Apply messaging
7. Quality check
8. Package for delivery

**Outputs:**
- `asset-package-manifest.md` - Delivery inventory
- Organized asset folder structure
- `README.txt` - Package instructions

---

#### 7. Brand Audit (`brand-audit`)

**Purpose:** Assess brand health and consistency

**Steps:**
1. Gather audit materials
2. Visual consistency audit
3. Verbal consistency audit
4. Touchpoint analysis
5. Competitive position analysis
6. Calculate health scores
7. Generate recommendations

**Outputs:**
- `brand-audit-report.md` - Complete assessment
- `health-scorecard.md` - Quantified scores
- `action-plan.md` - Prioritized improvements

---

## Tasks

### Task Summary

| Task | ID | Purpose |
|------|-----|---------|
| Color Converter | `color-converter` | Convert between HEX, RGB, CMYK, HSL |
| Archetype Matcher | `archetype-matcher` | Match brand values to archetypes |
| Contrast Checker | `contrast-checker` | WCAG accessibility verification |
| Type Scale Generator | `type-scale-generator` | Generate modular type scales |

---

## Data Files

### Reference Data

| File | Description | Records |
|------|-------------|---------|
| `brand-archetypes.csv` | 12 Jungian archetypes with characteristics | 12 |
| `color-psychology.csv` | Color associations by industry/archetype | 13 |
| `social-media-dimensions.csv` | Platform asset dimensions | 30+ |
| `file-format-specifications.csv` | File format technical specs | 20 |
| `typography-scale-ratios.csv` | Type scale ratios | 12 |

### Brand Archetypes Reference

| Archetype | Core Desire | Voice | Colors |
|-----------|-------------|-------|--------|
| Innocent | Safety | Optimistic, simple | Pastels, white |
| Sage | Truth | Wise, analytical | Navy, gray, gold |
| Explorer | Freedom | Adventurous, bold | Earth tones, green |
| Ruler | Control | Commanding, refined | Black, gold, purple |
| Creator | Innovation | Imaginative, visionary | Vibrant, unconventional |
| Caregiver | Service | Warm, reassuring | Warm tones |
| Magician | Power | Mystical, inspiring | Purple, deep blue |
| Hero | Mastery | Confident, bold | Red, blue, black |
| Rebel | Liberation | Provocative, brave | Black, red |
| Lover | Intimacy | Passionate, empathetic | Red, pink |
| Jester | Enjoyment | Fun, irreverent | Bright, playful |
| Regular Guy | Belonging | Friendly, authentic | Down-to-earth |

---

## Anti-Hallucination Protocol

### Core Principles

BM-Brand implements strict anti-hallucination measures across all workflows:

1. **Strategy Grounding**
   - Archetype selection requires documented scoring rationale
   - Personas based on provided audience data only
   - Positioning references identified competitors only

2. **Voice Grounding**
   - Voice attributes derive from archetype characteristics
   - All guidelines include specific examples
   - Tone contexts based on real communication needs

3. **Visual Grounding**
   - Color specifications use accurate, convertible codes
   - Typography selections are available fonts
   - File formats follow industry standards

4. **Audit Grounding**
   - All findings cite specific evidence
   - Scores use standardized criteria
   - Competitive analysis uses real competitors

### Implementation

Each workflow includes:
- `<critical>` tags marking anti-hallucination requirements
- Validation checklists verifying factual grounding
- "Do not invent" reminders for data-dependent sections

---

## BMAD Integration

### Pipeline Position

```
BMV → BMP → BM-Brand → BM-PM → BME
         ↑              ↓
    Receives        Provides
```

### Data Received from BMP

| Data | Usage in BM-Brand |
|------|-------------------|
| business_name | Brand naming context |
| business_description | Brand story foundation |
| target_audience | Persona development |
| value_proposition | Positioning foundation |
| positioning | Competitive differentiation |

### Data Provided to BM-PM

| Data | Usage in BM-PM |
|------|----------------|
| brand_guidelines | Project documentation |
| visual_specifications | Design requirements |
| voice_guidelines | Content standards |
| asset_specifications | Deliverable requirements |

---

## Configuration

### Installation Configuration

Located in `_module-installer/install-config.yaml`

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
   ```
   - Business plan complete
   - Target audience defined
   - Positioning established
   ```

2. **Run Brand Strategy**
   ```
   /bm-brand:brand-strategy
   ```

3. **Develop Identity (can run in parallel)**
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

### Running a Brand Audit

```
/bm-brand:brand-audit
```

Provide:
- Current brand guidelines
- Samples from all touchpoints
- Competitor information (optional)

---

## Extending the Module

### Adding New Archetypes

1. Add entry to `data/brand-archetypes.csv`
2. Update Brand Strategist agent archetype mapping
3. Add visual/voice associations

### Adding New Platforms

1. Add dimensions to `data/social-media-dimensions.csv`
2. Update Asset Generator agent platform coverage
3. Add to asset-checklist workflow

### Creating Custom Tasks

1. Create XML task file in `tasks/`
2. Define inputs, instructions, and outputs
3. Reference data files as needed

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024 | Initial release - Complete branding system |

---

*Generated by AI Business Hub*
*Module: BM-Brand (Brand Identity)*
*Pipeline: BMV → BMP → BM-Brand → BM-PM → BME*
