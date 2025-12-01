"""
Asset Generator Agent (Artisan)
BM-Brand - Branding Module

Artisan specializes in creating production-ready brand assets
across all required formats and applications.

Responsibilities:
- Generate asset specifications
- Create format requirements
- Define deliverable packages
- Ensure production-ready quality
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class AssetCategory(Enum):
    """Categories of brand assets."""
    LOGO = "logo"
    SOCIAL_MEDIA = "social_media"
    BUSINESS_COLLATERAL = "business_collateral"
    DIGITAL = "digital"
    MARKETING = "marketing"
    PRESENTATION = "presentation"
    PACKAGING = "packaging"
    SIGNAGE = "signage"


class AssetFormat(Enum):
    """File formats for assets."""
    # Vector
    AI = "ai"
    EPS = "eps"
    SVG = "svg"
    PDF = "pdf"

    # Raster
    PNG = "png"
    JPG = "jpg"
    WEBP = "webp"
    GIF = "gif"

    # Design
    PSD = "psd"
    FIGMA = "figma"
    SKETCH = "sketch"

    # Document
    DOCX = "docx"
    PPTX = "pptx"


class AssetStatus(Enum):
    """Status of asset creation."""
    REQUIRED = "required"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"
    OPTIONAL = "optional"
    SKIPPED = "skipped"


@dataclass
class AssetDimension:
    """Asset dimension specification."""
    width: int
    height: int
    unit: str = "px"
    dpi: Optional[int] = None


@dataclass
class AssetVariant:
    """A single asset variant."""
    name: str
    dimension: AssetDimension
    format: AssetFormat
    color_mode: str = "RGB"  # RGB, CMYK, Grayscale
    use_case: Optional[str] = None


@dataclass
class AssetSpecification:
    """Complete asset specification."""
    id: str
    name: str
    category: AssetCategory
    description: str

    # Variants
    variants: List[AssetVariant] = field(default_factory=list)

    # Production details
    bleed: Optional[str] = None
    safe_zone: Optional[str] = None
    file_naming: Optional[str] = None

    # Status
    status: AssetStatus = AssetStatus.REQUIRED
    priority: int = 1  # 1 = highest

    # Output
    output_path: Optional[str] = None


@dataclass
class SocialMediaAsset:
    """Social media specific asset."""
    platform: str  # "facebook", "instagram", "linkedin", etc.
    asset_type: str  # "profile", "cover", "post", "story"
    dimension: AssetDimension
    format: AssetFormat = AssetFormat.PNG
    notes: Optional[str] = None


@dataclass
class AssetPackage:
    """Complete asset package structure."""
    business_id: str
    brand_name: str

    # Asset inventory
    logo_assets: List[AssetSpecification] = field(default_factory=list)
    social_media_assets: List[SocialMediaAsset] = field(default_factory=list)
    business_collateral: List[AssetSpecification] = field(default_factory=list)
    digital_assets: List[AssetSpecification] = field(default_factory=list)
    presentation_assets: List[AssetSpecification] = field(default_factory=list)

    # Package structure
    folder_structure: dict = field(default_factory=dict)
    readme_content: Optional[str] = None

    # Delivery
    total_assets: int = 0
    completed_assets: int = 0
    package_url: Optional[str] = None

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Artisan, the Asset Generator for HYVVE's Branding Module.",
    "Your expertise is creating comprehensive, production-ready brand asset specifications.",
    "",
    "## Core Responsibilities",
    "1. Define all required brand assets",
    "2. Specify formats, dimensions, and variants",
    "3. Create organized package structure",
    "4. Ensure production-ready specifications",
    "",
    "## Asset Categories",
    "",
    "### 1. Logo Package",
    "Required variants:",
    "- Primary logo: AI, EPS, SVG, PNG (various sizes)",
    "- Secondary logo: Same formats",
    "- Icon/Symbol: Same formats + favicon sizes",
    "- Color versions: Full color, reversed, black, white",
    "",
    "Standard logo sizes:",
    "- Web: 200px, 400px, 800px wide",
    "- Print: Vector only (scalable)",
    "- Favicon: 16x16, 32x32, 180x180 (Apple touch)",
    "",
    "### 2. Social Media Assets",
    "Per platform requirements:",
    "- Profile picture: Platform-specific sizes",
    "- Cover/Banner: Platform-specific sizes",
    "- Post templates: Recommended sizes",
    "- Story templates: 1080x1920",
    "",
    "Platform dimensions (2024):",
    "- Facebook: Profile 180x180, Cover 820x312",
    "- Instagram: Profile 320x320, Post 1080x1080",
    "- LinkedIn: Profile 400x400, Cover 1584x396",
    "- Twitter/X: Profile 400x400, Header 1500x500",
    "- YouTube: Profile 800x800, Banner 2560x1440",
    "",
    "### 3. Business Collateral",
    "- Business card: 3.5x2\" (bleed + trim)",
    "- Letterhead: 8.5x11\" (digital template)",
    "- Envelope: #10 (9.5x4.125\")",
    "- Email signature: 600px wide HTML",
    "- Presentation template: 16:9 format",
    "",
    "### 4. Digital Assets",
    "- Open Graph images: 1200x630",
    "- Email header: 600px wide",
    "- Email footer: 600px wide",
    "- App icons: iOS and Android sizes",
    "",
    "## File Naming Convention",
    "[brand]-[asset]-[variant]-[size].[format]",
    "Example: acme-logo-primary-400w.png",
    "",
    "## Folder Structure",
    "```",
    "[brand-name]-brand-assets/",
    "├── 01-logos/",
    "│   ├── primary/",
    "│   ├── secondary/",
    "│   ├── icon/",
    "│   └── favicon/",
    "├── 02-colors/",
    "├── 03-typography/",
    "├── 04-social-media/",
    "├── 05-business-collateral/",
    "├── 06-digital/",
    "├── 07-templates/",
    "└── README.txt",
    "```",
]

PRINCIPLES = [
    "Every asset needs exact dimension specifications",
    "File formats must match use case requirements",
    "Naming conventions must be consistent",
    "Folder structure must be organized and intuitive",
    "All assets must follow brand guidelines",
    "Production-ready means immediately usable",
]
