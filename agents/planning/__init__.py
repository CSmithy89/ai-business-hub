"""
BMP Planning Team - Business Planning Module
AI Business Hub

This package provides the Planning Team for business plan development.

Team Structure:
- Blake (Leader): Planning Orchestrator
- Model: Business Model Canvas Expert
- Finance: Financial Analyst
- Revenue: Monetization Strategist
- Forecast: Growth Forecaster

Usage:
    from agents.planning import create_planning_team

    team = create_planning_team(
        session_id="session_123",
        user_id="user_456",
        business_id="biz_789"
    )
"""

from .team import (
    create_planning_team,
    create_blake_agent,
    create_model_agent,
    create_finance_agent,
    create_revenue_agent,
    create_forecast_agent,
    run_business_model_canvas,
    run_financial_projections,
    run_pricing_strategy,
    run_growth_forecast,
    run_business_plan_synthesis,
)

from .tools import (
    calculate_financial_metrics,
    calculate_unit_economics,
    calculate_burn_rate,
    request_financial_approval,
    save_planning_progress,
    get_validation_context,
    generate_business_model_canvas,
)

__all__ = [
    # Team creation
    "create_planning_team",
    # Agent creation
    "create_blake_agent",
    "create_model_agent",
    "create_finance_agent",
    "create_revenue_agent",
    "create_forecast_agent",
    # Workflow functions
    "run_business_model_canvas",
    "run_financial_projections",
    "run_pricing_strategy",
    "run_growth_forecast",
    "run_business_plan_synthesis",
    # Tools
    "calculate_financial_metrics",
    "calculate_unit_economics",
    "calculate_burn_rate",
    "request_financial_approval",
    "save_planning_progress",
    "get_validation_context",
    "generate_business_model_canvas",
]
