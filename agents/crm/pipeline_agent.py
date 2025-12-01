"""
PipelineAgent (Flow) - Pipeline Automation Specialist
AI Business Hub CRM Module Agent

Manages deal stages and suggests automations when deals progress.

BMAD Spec: .bmad/bm-crm/agents/pipeline-agent.agent.yaml
"""

from typing import Optional, Dict, List
from datetime import datetime, timedelta
from enum import Enum


# ============================================================================
# Agent Configuration
# ============================================================================

AGENT_NAME = "Flow"
AGENT_TITLE = "Pipeline Automation Specialist + Deal Progression Expert"

INSTRUCTIONS = [
    "You are Flow, the pipeline automation specialist.",
    "Help deals move through the pipeline by suggesting relevant automations.",
    "ALWAYS ask before executing automations - never auto-execute.",
    "Identify stuck deals early and recommend actions.",
    "Speed matters but respect that humans make final decisions.",
]

PRINCIPLES = [
    "Suggest automations, never execute without approval",
    "Stalled deals need attention - flag them early",
    "Every stage change is an opportunity to help",
    "Learn from won and lost deals",
]


# ============================================================================
# Pipeline Stages
# ============================================================================

class DealStage(str, Enum):
    LEAD = "lead"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


# Stage probabilities for forecasting
STAGE_PROBABILITIES = {
    DealStage.LEAD: 0.10,
    DealStage.QUALIFIED: 0.25,
    DealStage.PROPOSAL: 0.50,
    DealStage.NEGOTIATION: 0.75,
    DealStage.WON: 1.00,
    DealStage.LOST: 0.00,
}


# ============================================================================
# Automation Suggestions
# ============================================================================

STAGE_AUTOMATIONS = {
    ("lead", "qualified"): [
        {"id": "followup_email", "name": "Send personalized follow-up email", "impact": "Increases response rate by 40%"},
        {"id": "schedule_call", "name": "Schedule discovery call", "impact": "Moves to proposal 2x faster"},
        {"id": "notify_rep", "name": "Notify assigned sales rep", "impact": "Ensures timely follow-up"},
    ],
    ("qualified", "proposal"): [
        {"id": "generate_proposal", "name": "Generate proposal draft", "impact": "Saves 2 hours per deal"},
        {"id": "schedule_review", "name": "Schedule proposal review meeting", "impact": "Keeps momentum"},
        {"id": "alert_manager", "name": "Alert manager (high-value)", "impact": "Executive involvement increases close rate"},
    ],
    ("proposal", "negotiation"): [
        {"id": "negotiation_timeline", "name": "Set up negotiation timeline", "impact": "Creates urgency"},
        {"id": "objection_resources", "name": "Prepare objection handling resources", "impact": "Addresses concerns proactively"},
        {"id": "checkin_calls", "name": "Schedule check-in calls", "impact": "Maintains engagement"},
    ],
    ("negotiation", "won"): [
        {"id": "send_contract", "name": "Send contract for signature", "impact": "Closes deal faster"},
        {"id": "onboarding_tasks", "name": "Create onboarding tasks", "impact": "Smooth customer transition"},
        {"id": "notify_cs", "name": "Notify customer success team", "impact": "Ensures warm handoff"},
        {"id": "update_forecast", "name": "Update revenue forecasts", "impact": "Accurate reporting"},
    ],
    ("any", "lost"): [
        {"id": "feedback_request", "name": "Send feedback request", "impact": "Learn from losses"},
        {"id": "reengage_90", "name": "Schedule re-engagement (90 days)", "impact": "30% reopen rate"},
        {"id": "log_reason", "name": "Log loss reason for analysis", "impact": "Improve process"},
    ],
}


def get_automations_for_transition(
    from_stage: str,
    to_stage: str,
) -> List[Dict]:
    """
    Get suggested automations for a stage transition.
    
    Args:
        from_stage: Current stage
        to_stage: Target stage
    
    Returns:
        List of suggested automations
    """
    key = (from_stage.lower(), to_stage.lower())
    
    # Check for specific transition
    if key in STAGE_AUTOMATIONS:
        return STAGE_AUTOMATIONS[key]
    
    # Check for "any to lost" pattern
    if to_stage.lower() == "lost":
        return STAGE_AUTOMATIONS.get(("any", "lost"), [])
    
    return []


# ============================================================================
# Pipeline Health
# ============================================================================

def identify_stuck_deals(
    deals: List[Dict],
    stage_threshold_days: int = 14,
    activity_threshold_days: int = 7,
) -> List[Dict]:
    """
    Identify deals that are stuck and need attention.
    
    Args:
        deals: List of deal dictionaries
        stage_threshold_days: Days in same stage to be considered stuck
        activity_threshold_days: Days without activity to flag
    
    Returns:
        List of stuck deals with recommendations
    """
    stuck = []
    now = datetime.now()
    
    for deal in deals:
        days_in_stage = (now - deal.get("stage_changed_at", now)).days
        days_since_activity = (now - deal.get("last_activity_at", now)).days
        
        is_stuck = (
            days_in_stage > stage_threshold_days or
            days_since_activity > activity_threshold_days
        )
        
        if is_stuck and deal.get("stage") not in ["won", "lost"]:
            stuck.append({
                "deal_id": deal.get("id"),
                "name": deal.get("name"),
                "stage": deal.get("stage"),
                "days_in_stage": days_in_stage,
                "days_since_activity": days_since_activity,
                "value": deal.get("value", 0),
                "recommendation": _get_stuck_recommendation(deal, days_in_stage, days_since_activity),
            })
    
    # Sort by value descending (prioritize high-value stuck deals)
    stuck.sort(key=lambda x: x["value"], reverse=True)
    return stuck


def _get_stuck_recommendation(deal: Dict, days_in_stage: int, days_since_activity: int) -> str:
    """Generate recommendation for a stuck deal."""
    if days_since_activity > 14:
        return "Re-engage with phone call - email may not be reaching them"
    elif days_in_stage > 21:
        return "Escalate to manager - may need executive involvement"
    elif days_since_activity > 7:
        return "Send check-in email with new value proposition"
    else:
        return "Schedule follow-up call to address potential blockers"


def calculate_pipeline_health(deals: List[Dict]) -> Dict:
    """
    Calculate overall pipeline health metrics.
    
    Args:
        deals: List of all deals
    
    Returns:
        Health metrics dictionary
    """
    active_deals = [d for d in deals if d.get("stage") not in ["won", "lost"]]
    stuck_deals = identify_stuck_deals(active_deals)
    
    total_value = sum(d.get("value", 0) for d in active_deals)
    weighted_value = sum(
        d.get("value", 0) * STAGE_PROBABILITIES.get(DealStage(d.get("stage", "lead")), 0)
        for d in active_deals
    )
    
    return {
        "total_deals": len(active_deals),
        "total_value": total_value,
        "weighted_forecast": weighted_value,
        "stuck_deals_count": len(stuck_deals),
        "stuck_deals_value": sum(d["value"] for d in stuck_deals),
        "health_score": max(0, 100 - (len(stuck_deals) * 10)),  # Penalize for stuck deals
    }


# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    print(f"PipelineAgent: {AGENT_NAME}")
    print(f"Title: {AGENT_TITLE}")
    
    # Example automation suggestions
    automations = get_automations_for_transition("qualified", "proposal")
    print(f"\nAutomations for Qualified → Proposal:")
    for a in automations:
        print(f"  - {a['name']}: {a['impact']}")
