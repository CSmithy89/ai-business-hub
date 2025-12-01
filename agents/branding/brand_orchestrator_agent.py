"""
Brand Orchestrator Agent (Bella)
BM-Brand - Branding Module

Bella coordinates all branding activities, ensuring a cohesive
brand identity system that aligns with business strategy.

Responsibilities:
- Guide users through brand development process
- Delegate to specialist agents for deep work
- Ensure brand consistency across all elements
- Synthesize brand guidelines and deliverables
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class BrandingStage(Enum):
    """Stages of the branding workflow."""
    BRAND_STRATEGY = "brand_strategy"
    BRAND_VOICE = "brand_voice"
    VISUAL_IDENTITY = "visual_identity"
    BRAND_GUIDELINES = "brand_guidelines"
    ASSET_CHECKLIST = "asset_checklist"
    ASSET_GENERATION = "asset_generation"
    BRAND_AUDIT = "brand_audit"


class BrandingStatus(Enum):
    """Status of a branding session."""
    IN_PROGRESS = "in_progress"
    PENDING_INPUT = "pending_input"
    PENDING_APPROVAL = "pending_approval"
    COMPLETE = "complete"
    ARCHIVED = "archived"


@dataclass
class BrandingSession:
    """Represents a brand development session."""
    business_id: str
    session_id: str
    current_stage: BrandingStage
    status: BrandingStatus = BrandingStatus.IN_PROGRESS

    # Brand outputs
    brand_strategy: Optional[dict] = None
    brand_voice: Optional[dict] = None
    visual_identity: Optional[dict] = None
    brand_guidelines: Optional[dict] = None
    asset_checklist: Optional[dict] = None
    generated_assets: List[dict] = field(default_factory=list)

    # Progress tracking
    completed_stages: list = field(default_factory=list)

    # Metadata
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Bella, the Brand Orchestrator for HYVVE's Branding Module.",
    "Your mission is to create cohesive, memorable brand identity systems that differentiate businesses in their markets.",
    "",
    "## Your Team",
    "You lead a team of branding specialists:",
    "- Sage: Brand strategist - positioning, archetype, core messaging",
    "- Vox: Voice architect - verbal identity, tone, messaging frameworks",
    "- Iris: Visual identity designer - logo, colors, typography",
    "- Artisan: Asset generator - production-ready deliverables",
    "- Audit: Brand auditor - quality assurance, consistency checking",
    "",
    "## Branding Principles",
    "1. **Strategy First**: Brand visuals must reflect brand strategy",
    "2. **Consistency**: All elements must work together coherently",
    "3. **Differentiation**: Brand must stand out from competitors",
    "4. **Authenticity**: Brand must feel true to the business",
    "5. **Scalability**: Brand system must work across all touchpoints",
    "",
    "## Workflow Sequence",
    "1. Brand Strategy - positioning, archetype, core messaging",
    "2. Brand Voice - tone, vocabulary, messaging templates",
    "3. Visual Identity - logo, colors, typography",
    "4. Brand Guidelines - comprehensive documentation",
    "5. Asset Checklist - identify all required assets",
    "6. Asset Generation - create production-ready files",
    "7. Brand Audit - verify consistency and quality",
    "",
    "## Communication Style",
    "- Be creative yet strategic",
    "- Explain branding concepts clearly",
    "- Always tie visual choices to strategy",
    "- Encourage user input on subjective choices",
]

PRINCIPLES = [
    "Brand strategy must precede visual decisions",
    "Every visual choice needs strategic rationale",
    "Brand voice must align with target audience",
    "Visual identity must differentiate from competitors",
    "All assets must follow brand guidelines",
    "Consistency is more important than perfection",
]


@dataclass
class BrandElement:
    """A single brand element with rationale."""
    name: str
    description: str
    strategic_rationale: str
    application_notes: Optional[str] = None


@dataclass
class BrandSystem:
    """Complete brand identity system."""
    business_id: str
    brand_name: str

    # Strategy
    positioning: Optional[dict] = None
    archetype: Optional[str] = None
    values: List[str] = field(default_factory=list)
    personality_traits: List[str] = field(default_factory=list)

    # Voice
    tone_attributes: List[str] = field(default_factory=list)
    voice_guidelines: Optional[dict] = None

    # Visual
    logo_system: Optional[dict] = None
    color_palette: Optional[dict] = None
    typography: Optional[dict] = None

    # Guidelines
    guidelines_url: Optional[str] = None

    # Assets
    asset_inventory: List[dict] = field(default_factory=list)

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)
