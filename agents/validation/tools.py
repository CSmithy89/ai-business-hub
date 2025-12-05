"""
BMV Validation Tools - HITL Integration
AI Business Hub - Business Validation Module

Tools for validation workflows including HITL approval requests.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

from agno.tools import tool

logger = logging.getLogger(__name__)


# ============================================================================
# Anti-Hallucination Source Tracking
# ============================================================================

@tool
async def record_source(
    claim: str,
    source_name: str,
    source_url: Optional[str] = None,
    source_date: Optional[str] = None,
    confidence: str = "medium",
    business_id: Optional[str] = None,
) -> Dict:
    """
    Record a source citation for anti-hallucination tracking.

    All market claims, competitor data, and financial figures MUST be
    recorded with this tool to ensure traceability.

    Args:
        claim: The claim or data point being cited
        source_name: Name of the source (e.g., "Gartner CRM Report 2024")
        source_url: URL to the source if available
        source_date: Date of the source (e.g., "2024-03" or "2024-03-15")
        confidence: Confidence level - "high", "medium", "low"
        business_id: Business ID for this validation session

    Returns:
        Source record with ID

    Example:
        await record_source(
            claim="CRM market size is $65.59 billion in 2024",
            source_name="Grand View Research",
            source_url="https://www.grandviewresearch.com/industry-analysis/customer-relationship-management-crm-market",
            source_date="2024-01",
            confidence="high"
        )
    """
    source_record = {
        "id": f"src_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "claim": claim,
        "source_name": source_name,
        "source_url": source_url,
        "source_date": source_date,
        "confidence": confidence,
        "business_id": business_id,
        "recorded_at": datetime.now().isoformat(),
        "verification_status": "pending",
    }

    logger.info(f"Source recorded: {source_record['id']} - {source_name}")
    return source_record


@tool
async def verify_sources(
    claim_type: str,
    sources: List[Dict],
) -> Dict:
    """
    Verify that a claim has sufficient sources.

    Market claims require at least 2 independent sources.
    Single-source claims must be marked with lower confidence.

    Args:
        claim_type: Type of claim - "market_size", "competitor", "pricing", "customer"
        sources: List of source records for this claim

    Returns:
        Verification result with confidence adjustment

    Example:
        result = await verify_sources(
            claim_type="market_size",
            sources=[source1, source2]
        )
    """
    min_sources = {
        "market_size": 2,
        "competitor": 1,
        "pricing": 1,
        "customer": 1,
        "tam": 2,
        "sam": 2,
        "som": 1,
    }

    required = min_sources.get(claim_type, 1)
    actual = len(sources)

    if actual >= required:
        status = "verified"
        confidence = "high" if actual >= 2 else "medium"
    else:
        status = "insufficient_sources"
        confidence = "low"

    return {
        "claim_type": claim_type,
        "sources_required": required,
        "sources_provided": actual,
        "status": status,
        "confidence_level": confidence,
        "recommendation": (
            f"[Verified] Multiple independent sources"
            if actual >= 2
            else f"[Single Source] Consider finding additional sources"
            if actual == 1
            else f"[No Sources] This claim needs source citations"
        ),
    }


# ============================================================================
# HITL Approval Tools
# ============================================================================

@tool(requires_confirmation=True)
async def request_validation_approval(
    recommendation: str,
    validation_score: int,
    business_id: str,
    rationale: str,
    key_strengths: List[str],
    key_risks: List[str],
    conditions: Optional[List[str]] = None,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Request human approval for a validation recommendation.

    This is a HITL (Human-in-the-Loop) checkpoint that pauses execution
    and requires explicit human approval before proceeding.

    Args:
        recommendation: "GO", "CONDITIONAL", "PIVOT", or "NO_GO"
        validation_score: Score 0-100
        business_id: ID of the business being validated
        rationale: Summary explanation for the recommendation
        key_strengths: Top 3 strengths identified
        key_risks: Top 3 risks identified
        conditions: Required conditions (for CONDITIONAL recommendation)
        jwt_token: JWT for authentication
        workspace_id: Workspace ID for multi-tenancy

    Returns:
        Approval request details

    Example:
        await request_validation_approval(
            recommendation="CONDITIONAL",
            validation_score=72,
            business_id="biz_123",
            rationale="Strong market opportunity with manageable competition",
            key_strengths=["Growing market", "Clear pain points", "Experienced team"],
            key_risks=["Strong incumbents", "Capital intensive", "Long sales cycle"],
            conditions=["Validate pricing with 10 prospects", "Secure technical co-founder"]
        )
    """
    # Map recommendation to urgency
    urgency_map = {
        "GO": "normal",
        "CONDITIONAL": "normal",
        "PIVOT": "high",
        "NO_GO": "high",
    }

    approval_request = {
        "id": f"val_apr_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "type": "validation_decision",
        "business_id": business_id,
        "recommendation": recommendation,
        "validation_score": validation_score,
        "rationale": rationale,
        "key_strengths": key_strengths,
        "key_risks": key_risks,
        "conditions": conditions or [],
        "urgency": urgency_map.get(recommendation, "normal"),
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "workspace_id": workspace_id,
    }

    logger.info(
        f"Validation approval requested: {approval_request['id']} - "
        f"{recommendation} (score: {validation_score})"
    )

    return approval_request


@tool
async def get_validation_decision_status(
    approval_id: str,
    jwt_token: Optional[str] = None,
    workspace_id: Optional[str] = None,
) -> Dict:
    """
    Check the status of a validation approval request.

    Args:
        approval_id: ID of the approval request
        jwt_token: JWT for authentication
        workspace_id: Workspace ID

    Returns:
        Current status of the approval request
    """
    # In production, this would query the NestJS API
    return {
        "id": approval_id,
        "status": "pending",  # pending, approved, rejected
        "decision_at": None,
        "decided_by": None,
        "notes": None,
    }


# ============================================================================
# Validation Data Tools
# ============================================================================

@tool
async def save_validation_progress(
    business_id: str,
    workflow: str,
    data: Dict[str, Any],
    completed: bool = False,
) -> Dict:
    """
    Save validation workflow progress to the database.

    Args:
        business_id: Business being validated
        workflow: Workflow name (idea_intake, market_sizing, etc.)
        data: Extracted/analyzed data from the workflow
        completed: Whether the workflow is complete

    Returns:
        Save confirmation with session ID
    """
    progress_record = {
        "business_id": business_id,
        "workflow": workflow,
        "data": data,
        "completed": completed,
        "saved_at": datetime.now().isoformat(),
    }

    logger.info(f"Validation progress saved: {workflow} for {business_id}")
    return progress_record


@tool
async def get_validation_context(
    business_id: str,
) -> Dict:
    """
    Get existing validation context for a business.

    Retrieves previously captured data from completed workflows
    to inform current analysis.

    Args:
        business_id: Business ID to get context for

    Returns:
        Validation context including completed workflows and data
    """
    # In production, this would fetch from database
    return {
        "business_id": business_id,
        "completed_workflows": [],
        "idea_description": None,
        "market_sizing": None,
        "competitors": None,
        "customer_profiles": None,
    }


# ============================================================================
# Export all tools
# ============================================================================

__all__ = [
    "record_source",
    "verify_sources",
    "request_validation_approval",
    "get_validation_decision_status",
    "save_validation_progress",
    "get_validation_context",
]
