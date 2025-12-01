"""
LeadScorerAgent (Scout) - Lead Scoring Specialist
AI Business Hub CRM Module Agent

Scores leads based on firmographic and behavioral data
to prioritize sales efforts.

BMAD Spec: .bmad/bm-crm/agents/lead-scorer-agent.agent.yaml
"""

from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Scout"
AGENT_TITLE = "Lead Scoring Specialist + Qualification Expert"

INSTRUCTIONS = [
    "You are Scout, the lead scoring specialist.",
    "Score leads based on firmographic data (company size, industry) and behavioral signals (engagement).",
    "Always explain WHY a lead received their score.",
    "High scores (80+) mean sales-ready - be accurate to avoid wasting sales time.",
    "Recalculate scores when new data arrives.",
]

PRINCIPLES = [
    "Every score has a reason - always explain",
    "High scores mean sales-ready, not just interested",
    "False positives waste sales time - be accurate",
    "Scoring models must evolve with feedback",
]


# ============================================================================
# Scoring Model
# ============================================================================

class LeadTier(str, Enum):
    COLD = "cold"           # < 50
    WARM = "warm"           # 50-69
    HOT = "hot"             # 70-89
    SALES_READY = "sales_ready"  # 90+


class ScoringWeights:
    """Default scoring weights - can be customized per tenant."""
    FIRMOGRAPHIC = 0.40
    BEHAVIORAL = 0.35
    INTENT = 0.25


def calculate_firmographic_score(
    company_size: Optional[int],
    industry: Optional[str],
    industry_fit: str = "medium",
    budget_indicator: str = "unknown",
) -> Dict:
    """
    Calculate firmographic score component (max 40 points).
    """
    score = 0
    factors = []

    # Company size scoring
    if company_size:
        if company_size >= 1000:
            score += 20
            factors.append(f"Enterprise company ({company_size}+ employees): +20")
        elif company_size >= 201:
            score += 15
            factors.append(f"Mid-market company ({company_size} employees): +15")
        elif company_size >= 51:
            score += 10
            factors.append(f"Growing company ({company_size} employees): +10")
        else:
            score += 5
            factors.append(f"Small company ({company_size} employees): +5")

    # Industry fit scoring
    industry_scores = {"low": 0, "medium": 5, "high": 10, "ideal": 15}
    industry_pts = industry_scores.get(industry_fit.lower(), 5)
    score += industry_pts
    factors.append(f"Industry fit ({industry_fit}): +{industry_pts}")

    # Budget indicator
    budget_scores = {"unknown": 0, "low": 2, "medium": 5, "high": 10}
    budget_pts = budget_scores.get(budget_indicator.lower(), 0)
    score += budget_pts
    if budget_pts > 0:
        factors.append(f"Budget indicator ({budget_indicator}): +{budget_pts}")

    return {"score": min(score, 40), "max": 40, "factors": factors}


def calculate_behavioral_score(
    email_opens: int = 0,
    email_clicks: int = 0,
    page_views: int = 0,
    key_page_views: int = 0,
    content_downloads: int = 0,
) -> Dict:
    """
    Calculate behavioral score component (max 35 points).
    """
    score = 0
    factors = []

    # Email engagement (max 15)
    email_score = min((email_opens * 2) + (email_clicks * 5), 15)
    if email_score > 0:
        score += email_score
        factors.append(f"Email engagement ({email_opens} opens, {email_clicks} clicks): +{email_score}")

    # Website activity (max 10)
    web_score = min((page_views * 1) + (key_page_views * 3), 10)
    if web_score > 0:
        score += web_score
        factors.append(f"Website activity ({page_views} pages, {key_page_views} key pages): +{web_score}")

    # Content downloads (max 10)
    content_score = min(content_downloads * 3, 10)
    if content_score > 0:
        score += content_score
        factors.append(f"Content downloads ({content_downloads}): +{content_score}")

    return {"score": min(score, 35), "max": 35, "factors": factors}


def calculate_intent_score(
    demo_request: bool = False,
    pricing_viewed: bool = False,
    contact_form: bool = False,
    trial_signup: bool = False,
) -> Dict:
    """
    Calculate intent score component (max 25 points).
    """
    score = 0
    factors = []

    if trial_signup:
        score += 20
        factors.append("Trial signup: +20")
    if demo_request:
        score += 15
        factors.append("Demo request: +15")
    if contact_form:
        score += 10
        factors.append("Contact form submission: +10")
    if pricing_viewed:
        score += 5
        factors.append("Pricing page viewed: +5")

    return {"score": min(score, 25), "max": 25, "factors": factors}


def score_lead(
    contact_id: str,
    firmographic: Dict,
    behavioral: Dict,
    intent: Dict,
) -> Dict:
    """
    Calculate total lead score and return detailed breakdown.
    """
    firm_result = calculate_firmographic_score(**firmographic)
    behav_result = calculate_behavioral_score(**behavioral)
    intent_result = calculate_intent_score(**intent)

    total_score = firm_result["score"] + behav_result["score"] + intent_result["score"]

    # Determine tier
    if total_score >= 90:
        tier = LeadTier.SALES_READY
    elif total_score >= 70:
        tier = LeadTier.HOT
    elif total_score >= 50:
        tier = LeadTier.WARM
    else:
        tier = LeadTier.COLD

    return {
        "contact_id": contact_id,
        "total_score": total_score,
        "tier": tier.value,
        "breakdown": {
            "firmographic": firm_result,
            "behavioral": behav_result,
            "intent": intent_result,
        },
        "scored_at": datetime.now().isoformat(),
    }


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"LeadScorerAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
    
    # Example scoring
    result = score_lead(
        contact_id="contact_123",
        firmographic={"company_size": 250, "industry_fit": "high"},
        behavioral={"email_opens": 5, "email_clicks": 2, "page_views": 10},
        intent={"demo_request": True, "pricing_viewed": True},
    )
    print(f"Example Score: {result['total_score']}/100 ({result['tier']})")
