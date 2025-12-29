"""
Brand Strategist Agent (Sage)
BM-Brand - Branding Module

Sage specializes in brand positioning, archetype development,
and core messaging strategy.

Responsibilities:
- Define brand positioning and differentiation
- Identify brand archetype
- Develop core messaging framework
- Create brand values and personality
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class BrandArchetype(Enum):
    """The 12 Jungian brand archetypes."""
    INNOCENT = "innocent"  # Safety, optimism, happiness
    SAGE = "sage"  # Wisdom, knowledge, truth
    EXPLORER = "explorer"  # Freedom, discovery, adventure
    OUTLAW = "outlaw"  # Liberation, revolution, disruption
    MAGICIAN = "magician"  # Transformation, vision, innovation
    HERO = "hero"  # Mastery, courage, achievement
    LOVER = "lover"  # Intimacy, passion, appreciation
    JESTER = "jester"  # Joy, humor, lightness
    EVERYMAN = "everyman"  # Belonging, authenticity, equality
    CAREGIVER = "caregiver"  # Service, compassion, generosity
    RULER = "ruler"  # Control, success, responsibility
    CREATOR = "creator"  # Innovation, self-expression, vision


class PositioningStrategy(Enum):
    """Brand positioning strategies."""
    CATEGORY_LEADER = "category_leader"
    CHALLENGER = "challenger"
    NICHE_SPECIALIST = "niche_specialist"
    DISRUPTOR = "disruptor"
    PREMIUM = "premium"
    VALUE = "value"
    INNOVATION_LEADER = "innovation_leader"


@dataclass
class PositioningStatement:
    """Brand positioning statement."""
    target_audience: str
    category: str
    differentiation: str
    reason_to_believe: str

    # Full statement
    statement: Optional[str] = None  # "For [target], [brand] is the [category] that [differentiation] because [reason]"


@dataclass
class CompetitorPositioning:
    """Competitor positioning analysis."""
    competitor_name: str
    positioning: str
    archetype: Optional[BrandArchetype] = None
    strengths: list = field(default_factory=list)
    gaps: list = field(default_factory=list)


@dataclass
class BrandValue:
    """A core brand value."""
    name: str
    description: str
    behaviors: list = field(default_factory=list)  # How this value shows up
    anti_behaviors: list = field(default_factory=list)  # What this value isn't


@dataclass
class MessagingPillar:
    """A key messaging pillar."""
    pillar_name: str
    key_message: str
    supporting_points: list = field(default_factory=list)
    proof_points: list = field(default_factory=list)


@dataclass
class BrandStrategy:
    """Complete brand strategy."""
    business_id: str
    brand_name: str

    # Positioning
    positioning: PositioningStatement
    positioning_strategy: PositioningStrategy

    # Archetype (non-default field must come before defaults)
    primary_archetype: BrandArchetype

    # Fields with defaults
    competitor_positioning: List[CompetitorPositioning] = field(default_factory=list)
    secondary_archetype: Optional[BrandArchetype] = None
    archetype_rationale: Optional[str] = None

    # Values and Personality
    values: List[BrandValue] = field(default_factory=list)
    personality_traits: List[str] = field(default_factory=list)

    # Messaging
    tagline: Optional[str] = None
    tagline_alternatives: List[str] = field(default_factory=list)
    elevator_pitch: Optional[str] = None
    messaging_pillars: List[MessagingPillar] = field(default_factory=list)

    # Brand Promise
    brand_promise: Optional[str] = None

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Sage, the Brand Strategist for HYVVE's Branding Module.",
    "Your expertise is crafting brand positioning and strategic foundations that differentiate businesses.",
    "",
    "## Core Responsibilities",
    "1. Define brand positioning and differentiation",
    "2. Identify the right brand archetype",
    "3. Develop core values and personality",
    "4. Create messaging framework and pillars",
    "",
    "## Brand Strategy Framework",
    "",
    "### 1. Positioning Statement",
    "For [TARGET AUDIENCE], [BRAND] is the [CATEGORY] that [KEY DIFFERENTIATION] because [REASON TO BELIEVE].",
    "",
    "Example: 'For busy professionals, Slack is the messaging platform that makes work communication effortless because it organizes conversations into channels.'",
    "",
    "### 2. Brand Archetype Selection",
    "The 12 archetypes and their traits:",
    "- Innocent: Optimistic, pure, simple (Coca-Cola, Dove)",
    "- Sage: Wise, knowledgeable, trusted (Google, BBC)",
    "- Explorer: Adventurous, independent, pioneering (Jeep, REI)",
    "- Outlaw: Rebellious, disruptive, bold (Harley-Davidson, Virgin)",
    "- Magician: Transformative, visionary, innovative (Apple, Disney)",
    "- Hero: Courageous, determined, inspiring (Nike, BMW)",
    "- Lover: Passionate, intimate, sensual (Chanel, Victoria's Secret)",
    "- Jester: Playful, humorous, fun (Old Spice, M&Ms)",
    "- Everyman: Authentic, relatable, down-to-earth (IKEA, Target)",
    "- Caregiver: Nurturing, compassionate, supportive (Johnson & Johnson, TOMS)",
    "- Ruler: Authoritative, prestigious, leading (Mercedes, Rolex)",
    "- Creator: Innovative, artistic, expressive (Adobe, LEGO)",
    "",
    "### 3. Brand Values",
    "- 3-5 core values maximum",
    "- Each value needs behavioral definition",
    "- Values must differentiate, not be generic",
    "",
    "### 4. Messaging Pillars",
    "- 3-4 key messages that support positioning",
    "- Each pillar has proof points",
    "- Pillars should cover different aspects of value prop",
]

PRINCIPLES = [
    "Positioning must be clear, unique, and defensible",
    "Archetype choice should align with target audience expectations",
    "Values must be specific and actionable, not generic",
    "Messaging pillars need proof points to be credible",
    "Strategy must connect to validation findings",
    "Every strategic choice needs clear rationale",
]
