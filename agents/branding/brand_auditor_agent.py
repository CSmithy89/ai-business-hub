"""
Brand Auditor Agent (Audit)
BM-Brand - Branding Module

Audit specializes in quality assurance, consistency checking,
and brand compliance verification.

Responsibilities:
- Verify brand consistency across all elements
- Check alignment with brand guidelines
- Identify gaps and inconsistencies
- Provide quality scores and recommendations
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List
from datetime import datetime


# ============================================================================
# Data Models
# ============================================================================

class AuditArea(Enum):
    """Areas of brand audit."""
    STRATEGY_ALIGNMENT = "strategy_alignment"
    VISUAL_CONSISTENCY = "visual_consistency"
    VOICE_CONSISTENCY = "voice_consistency"
    ASSET_COMPLETENESS = "asset_completeness"
    GUIDELINE_COMPLIANCE = "guideline_compliance"
    COMPETITOR_DIFFERENTIATION = "competitor_differentiation"
    ACCESSIBILITY = "accessibility"


class AuditSeverity(Enum):
    """Severity of audit findings."""
    CRITICAL = "critical"  # Must fix before launch
    MAJOR = "major"  # Should fix before launch
    MINOR = "minor"  # Can fix post-launch
    SUGGESTION = "suggestion"  # Nice to have


class AuditStatus(Enum):
    """Status of audit check."""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    NOT_APPLICABLE = "not_applicable"


@dataclass
class AuditCheck:
    """A single audit check."""
    id: str
    name: str
    area: AuditArea
    description: str
    status: AuditStatus
    severity: Optional[AuditSeverity] = None
    finding: Optional[str] = None
    recommendation: Optional[str] = None


@dataclass
class AuditSection:
    """A section of the audit report."""
    area: AuditArea
    score: float  # 0-100
    checks: List[AuditCheck] = field(default_factory=list)
    summary: Optional[str] = None
    priority_actions: List[str] = field(default_factory=list)


@dataclass
class ConsistencyCheck:
    """Check for consistency between brand elements."""
    element_1: str
    element_2: str
    alignment_score: float
    issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class AccessibilityCheck:
    """Accessibility compliance check."""
    check_name: str
    wcag_level: str  # "A", "AA", "AAA"
    status: AuditStatus
    color_contrast_ratio: Optional[float] = None
    finding: Optional[str] = None


@dataclass
class BrandAuditReport:
    """Complete brand audit report."""
    business_id: str
    brand_name: str
    audit_date: datetime = field(default_factory=datetime.utcnow)

    # Overall score
    overall_score: float = 0.0
    overall_status: AuditStatus = AuditStatus.WARNING

    # Section scores
    sections: List[AuditSection] = field(default_factory=list)

    # Consistency checks
    consistency_checks: List[ConsistencyCheck] = field(default_factory=list)

    # Accessibility
    accessibility_checks: List[AccessibilityCheck] = field(default_factory=list)

    # Summary
    executive_summary: Optional[str] = None
    critical_issues: List[str] = field(default_factory=list)
    major_issues: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)

    # Action items
    priority_actions: List[str] = field(default_factory=list)

    # Metadata
    version: int = 1


# ============================================================================
# Agent Configuration
# ============================================================================

INSTRUCTIONS = [
    "You are Audit, the Brand Auditor for HYVVE's Branding Module.",
    "Your expertise is ensuring brand quality, consistency, and compliance.",
    "",
    "## Core Responsibilities",
    "1. Verify brand consistency across all elements",
    "2. Check alignment with brand guidelines",
    "3. Identify gaps and inconsistencies",
    "4. Provide quality scores and recommendations",
    "",
    "## Audit Framework",
    "",
    "### 1. Strategy Alignment Audit",
    "Check that all elements reflect brand strategy:",
    "- Does visual identity reflect the archetype?",
    "- Does voice align with personality traits?",
    "- Does positioning come through in messaging?",
    "- Are values evident in guidelines?",
    "",
    "### 2. Visual Consistency Audit",
    "- Logo usage follows guidelines",
    "- Colors used correctly",
    "- Typography applied consistently",
    "- Design principles followed",
    "",
    "### 3. Voice Consistency Audit",
    "- Tone matches guidelines by context",
    "- Vocabulary follows rules",
    "- Messaging aligns with pillars",
    "- Templates used correctly",
    "",
    "### 4. Asset Completeness Audit",
    "- All required assets present",
    "- Correct formats provided",
    "- File naming follows convention",
    "- Package structure complete",
    "",
    "### 5. Accessibility Audit",
    "- Color contrast meets WCAG AA (4.5:1 text, 3:1 large)",
    "- Typography is readable",
    "- Alt text guidelines provided",
    "",
    "### 6. Competitor Differentiation",
    "- Visual identity distinct from competitors",
    "- Voice is differentiated",
    "- Positioning is unique",
    "",
    "## Scoring System",
    "- 90-100: Excellent - ready for launch",
    "- 80-89: Good - minor issues",
    "- 70-79: Acceptable - some work needed",
    "- 60-69: Needs improvement",
    "- Below 60: Significant rework required",
    "",
    "## Severity Levels",
    "- Critical: Must fix before launch (brand-breaking)",
    "- Major: Should fix before launch (noticeable issues)",
    "- Minor: Can fix post-launch (small inconsistencies)",
    "- Suggestion: Nice-to-have improvements",
]

PRINCIPLES = [
    "Audit objectively against documented guidelines",
    "Every finding needs specific evidence",
    "Recommendations must be actionable",
    "Prioritize issues by business impact",
    "Acknowledge strengths, not just issues",
    "Accessibility is not optional",
]
