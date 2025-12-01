"""
Voice Architect Agent (Vox)
BM-Brand - Branding Module

Vox specializes in verbal identity, tone of voice,
and messaging frameworks.

Responsibilities:
- Define brand voice and tone
- Create vocabulary and language guidelines
- Develop messaging templates
- Establish communication principles
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class ToneAttribute(Enum):
    """Voice tone attributes."""
    # Formality spectrum
    FORMAL = "formal"
    PROFESSIONAL = "professional"
    CONVERSATIONAL = "conversational"
    CASUAL = "casual"

    # Energy spectrum
    ENTHUSIASTIC = "enthusiastic"
    CALM = "calm"
    URGENT = "urgent"
    REASSURING = "reassuring"

    # Personality spectrum
    PLAYFUL = "playful"
    SERIOUS = "serious"
    WITTY = "witty"
    STRAIGHTFORWARD = "straightforward"

    # Approach spectrum
    AUTHORITATIVE = "authoritative"
    HELPFUL = "helpful"
    INSPIRING = "inspiring"
    EDUCATIONAL = "educational"


class ContentType(Enum):
    """Types of content for voice application."""
    MARKETING = "marketing"
    SALES = "sales"
    SUPPORT = "support"
    PRODUCT = "product"
    SOCIAL = "social"
    INTERNAL = "internal"
    LEGAL = "legal"


@dataclass
class VoiceAttribute:
    """A single voice attribute with guidance."""
    attribute: str
    description: str
    do_examples: List[str] = field(default_factory=list)
    dont_examples: List[str] = field(default_factory=list)


@dataclass
class ToneGuideline:
    """Tone guidelines for specific context."""
    context: str  # "customer support", "marketing email", etc.
    tone_attributes: List[ToneAttribute]
    example_before: Optional[str] = None
    example_after: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class VocabularyGuideline:
    """Vocabulary and language guidelines."""
    category: str  # "preferred terms", "words to avoid", etc.
    words: List[str]
    rationale: Optional[str] = None


@dataclass
class MessagingTemplate:
    """A messaging template for specific use case."""
    name: str
    use_case: str
    template: str
    variables: List[str] = field(default_factory=list)
    example_filled: Optional[str] = None


@dataclass
class BrandVoice:
    """Complete brand voice guidelines."""
    business_id: str
    brand_name: str

    # Voice Personality
    voice_statement: str  # "We speak like a [persona] who [behavior]"
    primary_attributes: List[VoiceAttribute] = field(default_factory=list)

    # Tone Guidelines
    default_tone: List[ToneAttribute] = field(default_factory=list)
    tone_by_context: List[ToneGuideline] = field(default_factory=list)

    # Vocabulary
    vocabulary_guidelines: List[VocabularyGuideline] = field(default_factory=list)
    brand_specific_terms: dict = field(default_factory=dict)  # {"our term": "meaning"}

    # Grammar and Style
    grammar_notes: List[str] = field(default_factory=list)
    punctuation_style: Optional[str] = None
    capitalization_rules: Optional[str] = None

    # Messaging Templates
    templates: List[MessagingTemplate] = field(default_factory=list)

    # Sample Copy
    sample_headlines: List[str] = field(default_factory=list)
    sample_taglines: List[str] = field(default_factory=list)
    sample_ctas: List[str] = field(default_factory=list)

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Vox, the Voice Architect for HYVVE's Branding Module.",
    "Your expertise is creating distinctive verbal identities that resonate with target audiences.",
    "",
    "## Core Responsibilities",
    "1. Define brand voice personality and attributes",
    "2. Create tone guidelines for different contexts",
    "3. Develop vocabulary and language rules",
    "4. Build messaging templates and sample copy",
    "",
    "## Voice Development Framework",
    "",
    "### 1. Voice Personality Statement",
    "'We speak like a [persona] who [characteristic behavior].'",
    "",
    "Examples:",
    "- 'We speak like a knowledgeable friend who explains complex things simply.'",
    "- 'We speak like a confident expert who cuts through the noise.'",
    "- 'We speak like an enthusiastic coach who celebrates your wins.'",
    "",
    "### 2. Voice Attributes",
    "Choose 3-4 primary attributes that define the voice:",
    "- Each attribute needs DO and DON'T examples",
    "- Attributes should work together cohesively",
    "- Attributes must align with brand archetype",
    "",
    "### 3. Tone Modulation",
    "Voice stays constant; tone shifts by context:",
    "- Marketing: Can be more enthusiastic",
    "- Support: Should be more empathetic",
    "- Product: Should be clear and direct",
    "- Crisis: Should be calm and reassuring",
    "",
    "### 4. Vocabulary Guidelines",
    "- Preferred terms (use these)",
    "- Avoided terms (never use these)",
    "- Brand-specific terminology",
    "- Industry jargon policy",
    "",
    "### 5. Messaging Templates",
    "Create reusable templates for:",
    "- Welcome messages",
    "- Error messages",
    "- Success confirmations",
    "- Email subject lines",
    "- Social media posts",
    "- CTAs and buttons",
]

PRINCIPLES = [
    "Voice must reflect brand personality and archetype",
    "Tone shifts by context, but voice stays consistent",
    "Every guideline needs clear examples",
    "Vocabulary must be appropriate for target audience",
    "Templates should be practical and usable",
    "Voice must differentiate from competitors",
]
