"""
Visual Identity Designer Agent (Iris)
BM-Brand - Branding Module

Iris specializes in visual brand identity including
logo systems, color palettes, and typography.

Responsibilities:
- Design logo system specifications
- Create color palette with rationale
- Define typography system
- Establish visual style guidelines
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class LogoType(Enum):
    """Types of logo designs."""
    WORDMARK = "wordmark"  # Text-based (Google, Coca-Cola)
    LETTERMARK = "lettermark"  # Initials (IBM, HBO)
    BRANDMARK = "brandmark"  # Symbol only (Apple, Nike)
    COMBINATION = "combination"  # Symbol + text (Adidas, Burger King)
    EMBLEM = "emblem"  # Text inside symbol (Starbucks, Harley-Davidson)
    MASCOT = "mascot"  # Character-based (Mailchimp, KFC)


class ColorRole(Enum):
    """Role of colors in the palette."""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    ACCENT = "accent"
    NEUTRAL = "neutral"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    BACKGROUND = "background"
    TEXT = "text"


class TypeScale(Enum):
    """Typography scale levels."""
    DISPLAY = "display"
    H1 = "h1"
    H2 = "h2"
    H3 = "h3"
    H4 = "h4"
    BODY = "body"
    SMALL = "small"
    CAPTION = "caption"


@dataclass
class ColorDefinition:
    """A single color definition."""
    name: str
    role: ColorRole
    hex: str
    rgb: Optional[str] = None
    hsl: Optional[str] = None
    cmyk: Optional[str] = None
    pantone: Optional[str] = None
    usage: Optional[str] = None
    accessibility_notes: Optional[str] = None


@dataclass
class LogoVariant:
    """A logo variant specification."""
    name: str  # "Primary", "Secondary", "Icon", "Favicon"
    description: str
    use_cases: List[str] = field(default_factory=list)
    min_size: Optional[str] = None
    clear_space: Optional[str] = None


@dataclass
class LogoSystem:
    """Complete logo system specification."""
    logo_type: LogoType
    design_rationale: str

    # Variants
    variants: List[LogoVariant] = field(default_factory=list)

    # Color usage
    full_color: bool = True
    reversed: bool = True
    black_white: bool = True

    # Guidelines
    minimum_size: Optional[str] = None
    clear_space_rule: Optional[str] = None
    dont_rules: List[str] = field(default_factory=list)

    # File formats required
    formats: List[str] = field(default_factory=list)


@dataclass
class FontDefinition:
    """A font definition."""
    name: str
    family: str
    weight: str
    style: str = "normal"
    use_case: Optional[str] = None
    fallback: Optional[str] = None
    source: Optional[str] = None  # "Google Fonts", "Adobe", "Custom"


@dataclass
class TypeStyle:
    """Typography style definition."""
    scale: TypeScale
    font: FontDefinition
    size: str
    line_height: str
    letter_spacing: Optional[str] = None
    text_transform: Optional[str] = None


@dataclass
class TypographySystem:
    """Complete typography system."""
    primary_font: FontDefinition
    secondary_font: Optional[FontDefinition] = None
    accent_font: Optional[FontDefinition] = None

    # Scale
    type_scale: List[TypeStyle] = field(default_factory=list)

    # Guidelines
    pairing_rationale: Optional[str] = None
    usage_guidelines: List[str] = field(default_factory=list)


@dataclass
class VisualIdentity:
    """Complete visual identity specification."""
    business_id: str
    brand_name: str

    # Logo
    logo_system: LogoSystem

    # Colors
    color_palette: List[ColorDefinition] = field(default_factory=list)
    color_rationale: Optional[str] = None

    # Typography
    typography: TypographySystem

    # Visual Style
    design_principles: List[str] = field(default_factory=list)
    imagery_style: Optional[str] = None
    iconography_style: Optional[str] = None
    photography_style: Optional[str] = None

    # Spacing and Grid
    spacing_system: Optional[str] = None
    grid_system: Optional[str] = None

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Iris, the Visual Identity Designer for HYVVE's Branding Module.",
    "Your expertise is creating cohesive visual brand systems that communicate brand strategy visually.",
    "",
    "## Core Responsibilities",
    "1. Design logo system specifications",
    "2. Create comprehensive color palettes",
    "3. Define typography systems",
    "4. Establish visual style guidelines",
    "",
    "## Visual Identity Framework",
    "",
    "### 1. Logo System",
    "Consider logo type based on brand strategy:",
    "- Wordmark: Good for distinctive brand names",
    "- Lettermark: Good for long names or B2B",
    "- Brandmark: Good for established or visual brands",
    "- Combination: Most versatile, common choice",
    "- Emblem: Good for traditional, prestigious brands",
    "",
    "Logo variants to specify:",
    "- Primary (full lockup)",
    "- Secondary (alternative orientation)",
    "- Icon (symbol only)",
    "- Favicon (simplified for small sizes)",
    "",
    "### 2. Color Palette",
    "Standard palette structure:",
    "- Primary: 1-2 hero colors (brand recognition)",
    "- Secondary: 1-2 supporting colors",
    "- Accent: 1-2 highlight colors",
    "- Neutrals: Grays/blacks/whites",
    "- Semantic: Success, warning, error",
    "",
    "Color selection criteria:",
    "- Aligns with brand archetype and personality",
    "- Differentiates from competitors",
    "- Works across digital and print",
    "- Passes accessibility (WCAG AA minimum)",
    "",
    "### 3. Typography",
    "Font selection criteria:",
    "- Readability across sizes",
    "- Personality alignment",
    "- Licensing for intended use",
    "- Web font availability",
    "",
    "Type scale should include:",
    "- Display/Hero sizes",
    "- Heading hierarchy (H1-H4)",
    "- Body text",
    "- Small/caption text",
    "",
    "### 4. Design Principles",
    "3-5 principles that guide all visual decisions:",
    "- How imagery should feel",
    "- Iconography style",
    "- Photography guidelines",
    "- White space philosophy",
]

PRINCIPLES = [
    "Visual identity must reflect brand strategy and archetype",
    "Colors need strategic rationale, not just aesthetics",
    "Typography must be readable and accessible",
    "Logo system must work across all applications",
    "All specifications need practical implementation details",
    "Differentiation from competitors is essential",
]
