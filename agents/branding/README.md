# BM-Brand - Branding Module

## Overview

The Branding Module (BM-Brand) provides AI-powered brand development through a coordinated team of specialized agents. Built on the [Agno](https://docs.agno.com) multi-agent framework, this module creates cohesive brand identity systems including strategy, verbal identity, visual identity, and production-ready assets.

## Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      BRANDING TEAM                               │
│                                                                  │
│                         Bella                                    │
│                   (Team Leader)                                  │
│               Brand Orchestrator                                 │
│                          │                                       │
│     ┌──────────┬─────────┼─────────┬──────────┬──────────┐      │
│     │          │         │         │          │          │      │
│     ▼          ▼         ▼         ▼          ▼          ▼      │
│   Sage       Vox       Iris    Artisan     Audit                │
│   Brand      Voice     Visual   Asset       Brand               │
│   Strategy   Arch.     Identity Generator   Auditor             │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Personas

| Agent | Role | Specialization |
|-------|------|----------------|
| **Bella** | Team Leader | Orchestrates branding, ensures cohesion, synthesizes guidelines |
| **Sage** | Brand Strategist | Positioning, archetype selection, values, messaging pillars |
| **Vox** | Voice Architect | Tone of voice, vocabulary, messaging templates |
| **Iris** | Visual Identity Designer | Logo system, color palette, typography |
| **Artisan** | Asset Generator | Production-ready asset specifications |
| **Audit** | Brand Auditor | Quality assurance, consistency checking |

## File Structure

```
agents/branding/
├── __init__.py                      # Module exports
├── team.py                          # Agno Team configuration
├── brand_orchestrator_agent.py      # Bella - Team leader
├── brand_strategist_agent.py        # Sage - Strategy/positioning
├── voice_architect_agent.py         # Vox - Verbal identity
├── visual_identity_designer_agent.py # Iris - Visual design
├── asset_generator_agent.py         # Artisan - Asset specs
├── brand_auditor_agent.py           # Audit - QA
└── README.md                        # This file
```

## Usage

### Basic Usage

```python
from agents.branding import create_branding_team

# Create a branding team instance
team = create_branding_team(
    session_id="brand_session_123",
    user_id="user_456",
    business_id="biz_789",
    business_context={
        "business_name": "GreenThumb AI",
        "target_audience": "Tech-savvy urban millennials",
        "competitors": ["Bloomscape", "Gardyn", "Click & Grow"],
        "values": ["Innovation", "Sustainability", "Simplicity"],
    }
)

# Run branding conversation
response = await team.arun(
    "Create a brand strategy for our AI-powered vertical gardening "
    "platform. We want to feel innovative yet approachable."
)

print(response.content)
```

### Workflow Functions

The module provides specialized workflow functions for structured brand development:

```python
from agents.branding import (
    create_branding_team,
    run_brand_strategy,
    run_brand_voice,
    run_visual_identity,
    run_brand_guidelines,
    run_asset_generation,
)

team = create_branding_team(session_id="brand_123", user_id="user_456")

# Step 1: Develop Brand Strategy
strategy = await run_brand_strategy(
    team,
    business_description="AI vertical gardening platform...",
    competitors=["Bloomscape", "Gardyn"],
    target_audience="Urban millennials in apartments"
)

# Step 2: Create Brand Voice
voice = await run_brand_voice(
    team,
    brand_strategy=strategy,
    examples=["Welcome to smarter gardening", "Grow more, worry less"]
)

# Step 3: Design Visual Identity
visual = await run_visual_identity(
    team,
    brand_strategy=strategy,
    brand_name="GreenThumb AI",
    industry="Smart home / AgTech"
)

# Step 4: Compile Brand Guidelines
guidelines = await run_brand_guidelines(
    team,
    brand_strategy=strategy,
    brand_voice=voice,
    visual_identity=visual,
)

# Step 5: Generate Asset Specifications
assets = await run_asset_generation(
    team,
    visual_identity=visual,
    brand_name="GreenThumb AI",
)
```

## Data Models

### Brand Strategy

```python
@dataclass
class BrandStrategy:
    business_id: str
    brand_name: str

    # Positioning
    positioning: PositioningStatement
    positioning_strategy: PositioningStrategy

    # Archetype
    primary_archetype: BrandArchetype
    secondary_archetype: Optional[BrandArchetype]

    # Values & Personality
    values: List[BrandValue]  # 3-5 core values
    personality_traits: List[str]  # 5-7 traits

    # Messaging
    tagline: str
    elevator_pitch: str
    messaging_pillars: List[MessagingPillar]
    brand_promise: str
```

### Brand Archetype

```python
class BrandArchetype(Enum):
    INNOCENT = "innocent"    # Coca-Cola, Dove
    SAGE = "sage"           # Google, BBC
    EXPLORER = "explorer"   # Jeep, REI
    OUTLAW = "outlaw"       # Harley-Davidson, Virgin
    MAGICIAN = "magician"   # Apple, Disney
    HERO = "hero"           # Nike, BMW
    LOVER = "lover"         # Chanel, Victoria's Secret
    JESTER = "jester"       # Old Spice, M&Ms
    EVERYMAN = "everyman"   # IKEA, Target
    CAREGIVER = "caregiver" # Johnson & Johnson, TOMS
    RULER = "ruler"         # Mercedes, Rolex
    CREATOR = "creator"     # Adobe, LEGO
```

### Visual Identity

```python
@dataclass
class VisualIdentity:
    business_id: str
    brand_name: str

    # Logo
    logo_system: LogoSystem

    # Colors
    color_palette: List[ColorDefinition]
    color_rationale: str

    # Typography
    typography: TypographySystem

    # Style
    design_principles: List[str]
    imagery_style: str
    iconography_style: str
```

## Branding Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRANDING PIPELINE                             │
└─────────────────────────────────────────────────────────────────┘

    Planning/Validation Outputs
    ├── Target Audience
    ├── Competitors
    └── Value Proposition
        │
        ▼
┌───────────────────┐
│ Brand Strategy    │  ← Sage defines positioning and archetype
│   (Sage)          │
│                   │
│ • Positioning     │
│ • Archetype       │
│ • Values          │
│ • Messaging       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐   ┌───────────────────┐
│ Brand Voice       │   │ Visual Identity   │
│   (Vox)           │   │   (Iris)          │
│                   │   │                   │
│ • Tone            │   │ • Logo System     │
│ • Vocabulary      │   │ • Colors          │
│ • Templates       │   │ • Typography      │
└─────────┬─────────┘   └─────────┬─────────┘
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
          ┌───────────────────┐
          │ Brand Guidelines  │  ← Bella compiles everything
          │   (Bella)         │
          │                   │
          │ • Full Document   │
          │ • Usage Rules     │
          │ • Examples        │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Asset Generation  │  ← Artisan specs deliverables
          │   (Artisan)       │
          │                   │
          │ • Logo Files      │
          │ • Social Assets   │
          │ • Templates       │
          └─────────┬─────────┘
                    │
                    ▼
          ┌───────────────────┐
          │ Brand Audit       │  ← Audit verifies quality
          │   (Audit)         │
          │                   │
          │ • Consistency     │
          │ • Completeness    │
          │ • Score: X/100    │
          └───────────────────┘
```

## Brand Strategy Framework

### Positioning Statement Template

```
For [TARGET AUDIENCE],
[BRAND] is the [CATEGORY]
that [KEY DIFFERENTIATION]
because [REASON TO BELIEVE].
```

**Example:**
> For tech-savvy urban millennials who want fresh produce,
> GreenThumb AI is the smart gardening platform
> that makes growing food effortless in any apartment
> because our AI monitors and optimizes growing conditions 24/7.

### The 12 Brand Archetypes

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRAND ARCHETYPES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INDEPENDENCE                    MASTERY                         │
│  ┌──────────┐                   ┌──────────┐                    │
│  │ INNOCENT │ ──────────────── │  SAGE    │                    │
│  │ Optimism │                   │ Knowledge│                    │
│  └──────────┘                   └──────────┘                    │
│       │                              │                          │
│       │         ┌──────────┐         │                          │
│       └──────── │ EXPLORER │ ────────┘                          │
│                 │Adventure │                                     │
│                 └──────────┘                                     │
│                                                                  │
│  CHANGE                          STABILITY                       │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ OUTLAW   │   │ MAGICIAN │   │  HERO    │   │  RULER   │     │
│  │Rebellion │   │Transform │   │ Courage  │   │ Control  │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                  │
│  BELONGING                       SERVICE                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ LOVER    │   │ JESTER   │   │EVERYMAN  │   │CAREGIVER │     │
│  │ Passion  │   │  Joy     │   │Belonging │   │Nurturing │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│                                                                  │
│  CREATION                                                        │
│  ┌──────────┐                                                   │
│  │ CREATOR  │                                                   │
│  │Innovation│                                                   │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Voice Architecture

### Voice vs. Tone

```
VOICE = Consistent brand personality (WHO we are)
TONE = Contextual adaptation (HOW we speak in different situations)

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   VOICE (constant)                                               │
│   "Knowledgeable, friendly, empowering"                         │
│                                                                  │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┐     │
│   │             │             │             │             │     │
│   │  Marketing  │   Support   │   Product   │   Crisis    │     │
│   │  TONE       │   TONE      │   TONE      │   TONE      │     │
│   │             │             │             │             │     │
│   │ Enthusiastic│ Empathetic  │ Clear       │ Calm        │     │
│   │ Inspiring   │ Patient     │ Direct      │ Reassuring  │     │
│   │             │             │             │             │     │
│   └─────────────┴─────────────┴─────────────┴─────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Voice Attribute Structure

| Attribute | We Are | We Are Not | Example DO | Example DON'T |
|-----------|--------|------------|------------|---------------|
| Knowledgeable | Expert but accessible | Academic or condescending | "Here's what the data shows..." | "As you should know..." |
| Friendly | Warm and approachable | Overly casual or unprofessional | "We're here to help!" | "Hey dude, sup?" |
| Empowering | Confidence-building | Patronizing | "You've got this!" | "Even you can do it!" |

## Visual Identity System

### Color Palette Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLOR PALETTE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PRIMARY          SECONDARY        ACCENT                       │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│   │          │    │          │    │          │                  │
│   │ #2D5016  │    │ #8BC34A  │    │ #FF9800  │                  │
│   │          │    │          │    │          │                  │
│   └──────────┘    └──────────┘    └──────────┘                  │
│   Hero color      Supporting      Highlights                     │
│                                                                  │
│   NEUTRALS                         SEMANTIC                      │
│   ┌──────────┐ ┌──────────┐       ┌──────────┐ ┌──────────┐    │
│   │ #1A1A1A  │ │ #F5F5F5  │       │ #4CAF50  │ │ #F44336  │    │
│   │ Dark     │ │ Light    │       │ Success  │ │ Error    │    │
│   └──────────┘ └──────────┘       └──────────┘ └──────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Typography System

```
┌─────────────────────────────────────────────────────────────────┐
│                    TYPOGRAPHY                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PRIMARY: Inter (Headlines, UI)                                 │
│   ├── Display: 48px / Bold                                      │
│   ├── H1: 36px / Semibold                                       │
│   ├── H2: 28px / Semibold                                       │
│   ├── H3: 22px / Medium                                         │
│   └── H4: 18px / Medium                                         │
│                                                                  │
│   SECONDARY: Source Serif Pro (Long-form content)               │
│   ├── Body: 16px / Regular / 1.6 line-height                    │
│   ├── Small: 14px / Regular                                     │
│   └── Caption: 12px / Regular                                   │
│                                                                  │
│   Pairing Rationale:                                            │
│   Sans-serif for modern, clean UI; serif for readable content   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Asset Specifications

### Logo Package

| Asset | Formats | Sizes | Color Versions |
|-------|---------|-------|----------------|
| Primary Logo | AI, EPS, SVG, PNG | Vector, 200px, 400px, 800px | Full, Reversed, B&W |
| Secondary Logo | AI, EPS, SVG, PNG | Vector, 200px, 400px | Full, Reversed, B&W |
| Icon/Symbol | AI, EPS, SVG, PNG | Vector, 64px, 128px, 256px | Full, Reversed, B&W |
| Favicon | ICO, PNG | 16px, 32px, 180px | Full color |

### Social Media Assets

| Platform | Profile | Cover/Banner | Post Template |
|----------|---------|--------------|---------------|
| Facebook | 180×180 | 820×312 | 1200×630 |
| Instagram | 320×320 | N/A | 1080×1080 |
| LinkedIn | 400×400 | 1584×396 | 1200×627 |
| Twitter/X | 400×400 | 1500×500 | 1200×675 |
| YouTube | 800×800 | 2560×1440 | 1280×720 |

### Folder Structure

```
greenthumb-brand-assets/
├── 01-logos/
│   ├── primary/
│   │   ├── greenthumb-logo-primary-full-color.svg
│   │   ├── greenthumb-logo-primary-full-color.png
│   │   ├── greenthumb-logo-primary-reversed.svg
│   │   └── greenthumb-logo-primary-bw.svg
│   ├── secondary/
│   ├── icon/
│   └── favicon/
├── 02-colors/
│   └── color-palette.pdf
├── 03-typography/
│   └── font-files/
├── 04-social-media/
│   ├── facebook/
│   ├── instagram/
│   ├── linkedin/
│   └── twitter/
├── 05-business-collateral/
│   ├── business-card.ai
│   ├── letterhead.docx
│   └── email-signature.html
├── 06-digital/
│   ├── og-image.png
│   └── email-header.png
├── 07-templates/
│   └── presentation.pptx
└── README.txt
```

## Brand Audit Scoring

### Audit Areas

| Area | Weight | Criteria |
|------|--------|----------|
| Strategy Alignment | 20% | Do visuals/voice reflect strategy? |
| Visual Consistency | 25% | Logo, colors, typography usage |
| Voice Consistency | 20% | Tone, vocabulary, messaging |
| Asset Completeness | 15% | All required assets present? |
| Accessibility | 10% | WCAG AA compliance |
| Differentiation | 10% | Distinct from competitors? |

### Score Interpretation

| Score | Rating | Meaning |
|-------|--------|---------|
| 90-100 | Excellent | Ready for launch |
| 80-89 | Good | Minor issues to address |
| 70-79 | Acceptable | Some work needed |
| 60-69 | Needs Work | Significant improvements required |
| <60 | Poor | Major rework required |

## Configuration

### Environment Variables

```bash
# Database connection for session persistence
DATABASE_URL=postgresql://user:pass@localhost:5432/hyvve

# Optional: Override default model
BRANDING_MODEL=claude-sonnet-4-20250514
```

### Team Configuration Options

```python
team = create_branding_team(
    session_id="brand_123",    # Required: Unique session ID
    user_id="user_456",        # Required: User for multi-tenancy
    business_id="biz_789",     # Optional: Business context
    model="claude-sonnet-4-20250514",  # Optional: Model override
    debug_mode=True,           # Optional: Enable debug logging
    business_context={         # Optional: Context from validation/planning
        "business_name": "GreenThumb AI",
        "target_audience": "Urban millennials",
        "competitors": [...],
        "values": [...],
    }
)
```

## Integration with Planning (BMP)

The branding module receives context from planning:

```python
branding_context = {
    "business_name": planning_result["business_name"],
    "value_proposition": planning_result["canvas"]["value_propositions"],
    "customer_segments": planning_result["canvas"]["customer_segments"],
    "positioning": planning_result["positioning"],
    "industry": planning_result["industry"],
    "competitors": validation_result["competitor_analysis"]["competitors"],
}
```

## Testing

```python
import pytest
from agents.branding import create_branding_team

@pytest.fixture
def branding_team():
    return create_branding_team(
        session_id="test_session",
        user_id="test_user",
        debug_mode=True,
    )

@pytest.mark.asyncio
async def test_brand_strategy(branding_team):
    response = await branding_team.arun(
        "Create a brand strategy for a sustainable fashion marketplace"
    )
    assert response.content
    assert "archetype" in response.content.lower() or "positioning" in response.content.lower()
```

## Related Documentation

- [Agno Implementation Guide](../../docs/architecture/agno-implementation-guide.md)
- [Business Onboarding Architecture](../../docs/architecture/business-onboarding-architecture.md)
- [BMAD BM-Brand Specifications](../../.bmad/bm-brand/)
