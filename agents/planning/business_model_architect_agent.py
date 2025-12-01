"""
Business Model Architect Agent (Model)
BMP - Business Planning Module

Model specializes in Business Model Canvas creation and strategic
business model design.

Responsibilities:
- Create comprehensive Business Model Canvas
- Design value propositions
- Map customer relationships and channels
- Identify key resources, activities, and partnerships
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class BusinessModelType(Enum):
    """Types of business models."""
    SAAS = "saas"
    MARKETPLACE = "marketplace"
    E_COMMERCE = "e_commerce"
    SUBSCRIPTION = "subscription"
    FREEMIUM = "freemium"
    ADVERTISING = "advertising"
    LICENSING = "licensing"
    CONSULTING = "consulting"
    PLATFORM = "platform"
    HYBRID = "hybrid"


class CanvasBlockName(Enum):
    """Names of Business Model Canvas blocks."""
    KEY_PARTNERS = "key_partners"
    KEY_ACTIVITIES = "key_activities"
    KEY_RESOURCES = "key_resources"
    VALUE_PROPOSITIONS = "value_propositions"
    CUSTOMER_RELATIONSHIPS = "customer_relationships"
    CHANNELS = "channels"
    CUSTOMER_SEGMENTS = "customer_segments"
    COST_STRUCTURE = "cost_structure"
    REVENUE_STREAMS = "revenue_streams"


@dataclass
class ValueProposition:
    """A specific value proposition."""
    headline: str
    description: str
    target_segment: str
    pain_addressed: str
    gain_created: str
    differentiator: str
    evidence: Optional[str] = None  # From validation


@dataclass
class CustomerSegment:
    """Customer segment definition."""
    name: str
    description: str
    size: Optional[str] = None  # From SAM
    jobs_to_be_done: list = field(default_factory=list)
    pains: list = field(default_factory=list)
    gains: list = field(default_factory=list)
    willingness_to_pay: Optional[str] = None


@dataclass
class Channel:
    """Customer acquisition/delivery channel."""
    name: str
    type: str  # awareness, evaluation, purchase, delivery, after_sales
    description: str
    cost_estimate: Optional[str] = None
    effectiveness: Optional[str] = None


@dataclass
class RevenueStream:
    """Revenue stream definition."""
    name: str
    type: str  # subscription, transaction, licensing, advertising, etc.
    pricing_model: str
    target_segment: str
    estimated_percentage: Optional[float] = None  # % of total revenue


@dataclass
class CostCategory:
    """Cost structure category."""
    name: str
    type: str  # fixed or variable
    description: str
    estimated_percentage: Optional[float] = None  # % of total costs
    key_drivers: list = field(default_factory=list)


@dataclass
class CanvasBlock:
    """A single block of the Business Model Canvas."""
    name: CanvasBlockName
    items: list
    validation_notes: Optional[str] = None
    confidence: str = "medium"  # high, medium, low


@dataclass
class BusinessModelCanvas:
    """Complete Business Model Canvas."""
    business_id: str
    business_model_type: BusinessModelType

    # The 9 blocks
    key_partners: CanvasBlock
    key_activities: CanvasBlock
    key_resources: CanvasBlock
    value_propositions: CanvasBlock
    customer_relationships: CanvasBlock
    channels: CanvasBlock
    customer_segments: CanvasBlock
    cost_structure: CanvasBlock
    revenue_streams: CanvasBlock

    # Summary
    one_liner: Optional[str] = None
    competitive_advantage: Optional[str] = None

    # Metadata
    version: int = 1
    created_at: datetime = field(default_factory=datetime.utcnow)


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Model, the Business Model Architect for HYVVE's Business Planning Module.",
    "Your expertise is designing comprehensive Business Model Canvases that serve as strategic foundations.",
    "",
    "## Core Responsibilities",
    "1. Create complete 9-block Business Model Canvas",
    "2. Design compelling value propositions aligned to customer segments",
    "3. Map channels and customer relationships",
    "4. Define cost structure and revenue streams",
    "",
    "## Canvas Creation Process",
    "1. **Start with Customer Segments** - Use ICPs from validation",
    "2. **Define Value Propositions** - What problems do we solve?",
    "3. **Map Channels** - How do we reach customers?",
    "4. **Customer Relationships** - What type of relationship?",
    "5. **Revenue Streams** - How do we make money?",
    "6. **Key Resources** - What do we need to deliver?",
    "7. **Key Activities** - What must we do?",
    "8. **Key Partnerships** - Who helps us?",
    "9. **Cost Structure** - What does it cost?",
    "",
    "## Value Proposition Design",
    "For each customer segment, define:",
    "- Pains we relieve (functional, emotional, social)",
    "- Gains we create (functional, emotional, social)",
    "- Products/services that deliver",
    "- Differentiation from alternatives",
    "",
    "## Business Model Types to Consider",
    "- SaaS (recurring revenue, high margin)",
    "- Marketplace (transaction fees, network effects)",
    "- Freemium (free tier drives paid conversion)",
    "- Platform (multi-sided, ecosystem value)",
    "- Hybrid (combination of models)",
    "",
    "## Quality Criteria",
    "- Each block should have 3-7 items",
    "- Clear connections between blocks",
    "- Alignment with validation findings",
    "- Realistic assessment of capabilities",
]

PRINCIPLES = [
    "Customer segments come directly from validation ICPs",
    "Value propositions must address validated pain points",
    "Revenue streams must align with willingness-to-pay research",
    "Cost structure must support target margins",
    "Channels should match customer behavior patterns",
    "All blocks must be coherent with each other",
]
