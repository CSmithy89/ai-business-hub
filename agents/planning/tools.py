"""
BMP Planning Team Tools - Custom Tools for Business Planning
AI Business Hub - Business Planning Module

Tools for financial calculations, approval workflows, and document generation.
"""

from typing import Optional
from agno.tools import tool


# ============================================================================
# Financial Calculation Tools
# ============================================================================

@tool
def calculate_financial_metrics(
    revenue_year_1: float,
    revenue_year_2: float,
    revenue_year_3: float,
    gross_margin_percent: float,
    operating_expenses_percent: float,
) -> dict:
    """
    Calculate key financial metrics from revenue projections.

    Args:
        revenue_year_1: Projected revenue for year 1
        revenue_year_2: Projected revenue for year 2
        revenue_year_3: Projected revenue for year 3
        gross_margin_percent: Gross margin as percentage (e.g., 70 for 70%)
        operating_expenses_percent: Operating expenses as % of revenue

    Returns:
        Dictionary with calculated financial metrics
    """
    gross_margin = gross_margin_percent / 100
    opex_ratio = operating_expenses_percent / 100

    # Calculate metrics for each year
    years = [revenue_year_1, revenue_year_2, revenue_year_3]
    results = []

    for i, revenue in enumerate(years, 1):
        gross_profit = revenue * gross_margin
        opex = revenue * opex_ratio
        ebitda = gross_profit - opex
        ebitda_margin = (ebitda / revenue * 100) if revenue > 0 else 0

        results.append({
            "year": i,
            "revenue": round(revenue, 2),
            "gross_profit": round(gross_profit, 2),
            "operating_expenses": round(opex, 2),
            "ebitda": round(ebitda, 2),
            "ebitda_margin_percent": round(ebitda_margin, 1),
        })

    # Calculate growth rates
    yoy_growth_1_2 = ((revenue_year_2 - revenue_year_1) / revenue_year_1 * 100) if revenue_year_1 > 0 else 0
    yoy_growth_2_3 = ((revenue_year_3 - revenue_year_2) / revenue_year_2 * 100) if revenue_year_2 > 0 else 0
    cagr = (((revenue_year_3 / revenue_year_1) ** (1/2)) - 1) * 100 if revenue_year_1 > 0 else 0

    return {
        "yearly_metrics": results,
        "growth_rates": {
            "year_1_to_2_percent": round(yoy_growth_1_2, 1),
            "year_2_to_3_percent": round(yoy_growth_2_3, 1),
            "cagr_percent": round(cagr, 1),
        },
        "total_3_year_revenue": round(sum(years), 2),
        "average_gross_margin_percent": gross_margin_percent,
    }


@tool
def calculate_unit_economics(
    average_revenue_per_user: float,
    customer_acquisition_cost: float,
    gross_margin_percent: float,
    monthly_churn_rate_percent: float,
) -> dict:
    """
    Calculate unit economics metrics (LTV, CAC, LTV:CAC ratio).

    Args:
        average_revenue_per_user: Monthly ARPU
        customer_acquisition_cost: Cost to acquire one customer
        gross_margin_percent: Gross margin percentage
        monthly_churn_rate_percent: Monthly customer churn rate

    Returns:
        Dictionary with unit economics metrics
    """
    gross_margin = gross_margin_percent / 100
    monthly_churn = monthly_churn_rate_percent / 100

    # Calculate average customer lifetime (in months)
    avg_lifetime_months = (1 / monthly_churn) if monthly_churn > 0 else 120  # Cap at 10 years
    avg_lifetime_months = min(avg_lifetime_months, 120)

    # Calculate LTV
    monthly_gross_profit = average_revenue_per_user * gross_margin
    ltv = monthly_gross_profit * avg_lifetime_months

    # Calculate ratios
    ltv_cac_ratio = (ltv / customer_acquisition_cost) if customer_acquisition_cost > 0 else 0
    cac_payback_months = (customer_acquisition_cost / monthly_gross_profit) if monthly_gross_profit > 0 else 0

    # Health assessment
    if ltv_cac_ratio >= 3:
        health = "healthy"
        assessment = "Strong unit economics - sustainable growth possible"
    elif ltv_cac_ratio >= 1:
        health = "marginal"
        assessment = "Unit economics need improvement - focus on retention or reducing CAC"
    else:
        health = "unhealthy"
        assessment = "Negative unit economics - business model needs revision"

    return {
        "arpu_monthly": round(average_revenue_per_user, 2),
        "cac": round(customer_acquisition_cost, 2),
        "ltv": round(ltv, 2),
        "ltv_cac_ratio": round(ltv_cac_ratio, 2),
        "cac_payback_months": round(cac_payback_months, 1),
        "avg_customer_lifetime_months": round(avg_lifetime_months, 1),
        "monthly_churn_percent": monthly_churn_rate_percent,
        "health": health,
        "assessment": assessment,
    }


@tool
def calculate_burn_rate(
    monthly_revenue: float,
    monthly_expenses: float,
    cash_on_hand: float,
) -> dict:
    """
    Calculate burn rate and runway.

    Args:
        monthly_revenue: Current monthly revenue
        monthly_expenses: Current monthly expenses
        cash_on_hand: Current cash balance

    Returns:
        Dictionary with burn rate and runway metrics
    """
    gross_burn = monthly_expenses
    net_burn = monthly_expenses - monthly_revenue

    if net_burn > 0:
        runway_months = cash_on_hand / net_burn
        status = "burning"
    elif net_burn < 0:
        runway_months = float('inf')
        status = "profitable"
        net_burn = abs(net_burn)  # Show as positive cash flow
    else:
        runway_months = float('inf')
        status = "break_even"

    # Runway assessment
    if runway_months == float('inf'):
        runway_assessment = "Indefinite runway - cash flow positive"
    elif runway_months >= 18:
        runway_assessment = "Healthy runway (18+ months)"
    elif runway_months >= 12:
        runway_assessment = "Adequate runway (12-18 months) - begin fundraising planning"
    elif runway_months >= 6:
        runway_assessment = "Limited runway (6-12 months) - actively fundraise"
    else:
        runway_assessment = "Critical runway (<6 months) - urgent action needed"

    return {
        "gross_burn_monthly": round(gross_burn, 2),
        "net_burn_monthly": round(net_burn, 2),
        "cash_on_hand": round(cash_on_hand, 2),
        "runway_months": round(runway_months, 1) if runway_months != float('inf') else "infinite",
        "status": status,
        "assessment": runway_assessment,
    }


# ============================================================================
# HITL Approval Tools
# ============================================================================

@tool
def request_financial_approval(
    approval_type: str,
    summary: str,
    key_metrics: dict,
    confidence: str,
    risks: Optional[list] = None,
) -> dict:
    """
    Request human-in-the-loop approval for financial projections.

    Args:
        approval_type: Type of approval (e.g., 'financial_projections', 'pricing_strategy')
        summary: Brief summary of what needs approval
        key_metrics: Dictionary of key financial metrics
        confidence: Confidence level ('high', 'medium', 'low')
        risks: List of identified risks

    Returns:
        Approval request with status
    """
    # In production, this would integrate with the approval queue system
    return {
        "approval_requested": True,
        "approval_type": approval_type,
        "summary": summary,
        "key_metrics": key_metrics,
        "confidence": confidence,
        "risks": risks or [],
        "status": "pending_approval",
        "message": (
            f"Financial approval requested for {approval_type}. "
            "Human review required before proceeding."
        ),
    }


@tool
def save_planning_progress(
    business_id: str,
    workflow: str,
    data: dict,
    status: str,
) -> dict:
    """
    Save planning progress to the database.

    Args:
        business_id: Business identifier
        workflow: Current workflow name
        data: Data to save
        status: Status of the workflow

    Returns:
        Confirmation of save operation
    """
    # In production, this would save to the database
    return {
        "saved": True,
        "business_id": business_id,
        "workflow": workflow,
        "status": status,
        "message": f"Progress saved for {workflow}",
    }


@tool
def get_validation_context(
    business_id: str,
) -> dict:
    """
    Retrieve validated data from the BMV session.

    Args:
        business_id: Business identifier

    Returns:
        Validation context including market sizing, competitors, and customer data
    """
    # In production, this would fetch from the database
    # For now, return a placeholder indicating the integration point
    return {
        "business_id": business_id,
        "validation_status": "completed",
        "message": "Retrieve validation data from ValidationSession",
        "expected_data": {
            "market_sizing": "TAM/SAM/SOM data",
            "competitors": "Competitor analysis",
            "customer_profiles": "ICP and personas",
            "validation_score": "Overall score",
            "recommendation": "GO/CONDITIONAL_GO/PIVOT/NO_GO",
        },
    }


# ============================================================================
# Document Generation Tools
# ============================================================================

@tool
def generate_business_model_canvas(
    customer_segments: list,
    value_propositions: list,
    channels: list,
    customer_relationships: list,
    revenue_streams: list,
    key_resources: list,
    key_activities: list,
    key_partnerships: list,
    cost_structure: list,
) -> dict:
    """
    Generate a structured Business Model Canvas.

    Args:
        customer_segments: Target customer segments
        value_propositions: Unique value propositions
        channels: Distribution and communication channels
        customer_relationships: Types of customer relationships
        revenue_streams: How the business makes money
        key_resources: Critical resources needed
        key_activities: Critical activities to perform
        key_partnerships: Strategic partnerships
        cost_structure: Main cost drivers

    Returns:
        Structured Business Model Canvas
    """
    canvas = {
        "customer_segments": customer_segments,
        "value_propositions": value_propositions,
        "channels": channels,
        "customer_relationships": customer_relationships,
        "revenue_streams": revenue_streams,
        "key_resources": key_resources,
        "key_activities": key_activities,
        "key_partnerships": key_partnerships,
        "cost_structure": cost_structure,
        "generated_at": "timestamp",
        "version": "1.0",
    }

    # Calculate completeness score
    filled_sections = sum(1 for section in canvas.values() if section and len(section) > 0)
    completeness = (filled_sections / 9) * 100  # 9 BMC sections

    return {
        "canvas": canvas,
        "completeness_percent": round(completeness, 1),
        "status": "complete" if completeness == 100 else "draft",
    }
