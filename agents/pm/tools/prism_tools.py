"""
Prism Tools - Predictive Analytics Tools
AI Business Hub - Project Management Module

Tools for completion forecasting, velocity calculation, and anomaly detection.
"""

import logging
from typing import Dict, List, Any, Optional

from agno.tools import tool

from .common import api_request

logger = logging.getLogger(__name__)


@tool
def forecast_completion(
    project_id: str,
    workspace_id: str,
    scenario: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Predict project completion date based on velocity trend.

    Generates a statistical forecast using historical velocity data and remaining backlog.
    Provides optimistic, predicted, and pessimistic completion dates with confidence levels.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        scenario: Optional what-if scenario adjustments:
                 {"addedScope": 20, "teamSizeChange": 1}

    Returns:
        {
            "predictedDate": "2025-03-15",
            "confidence": "MED",
            "optimisticDate": "2025-03-01",
            "pessimisticDate": "2025-04-01",
            "reasoning": "Based on 8-week average velocity of 12 points/week...",
            "factors": ["Stable velocity trend", "Sufficient data"],
            "velocityAvg": 12.5,
            "dataPoints": 8
        }
    """
    try:
        endpoint = f"/api/pm/projects/{project_id}/analytics/forecast"
        payload = {"scenario": scenario} if scenario else {}

        result = api_request(
            method="POST",
            endpoint=endpoint,
            workspace_id=workspace_id,
            json=payload,
            timeout=30.0,
            fallback_data={
                "predictedDate": None,
                "confidence": "LOW",
                "reasoning": "Unable to generate forecast - service unavailable",
                "factors": ["Forecast service error"],
                "velocityAvg": 0,
                "dataPoints": 0,
            },
        )

        return result

    except Exception as e:
        logger.error(f"Error forecasting completion: {e}")
        return {
            "error": "Forecast generation failed",
            "message": str(e),
            "predictedDate": None,
            "confidence": "LOW",
            "reasoning": "Error occurred during forecast generation",
            "factors": ["System error"],
            "velocityAvg": 0,
            "dataPoints": 0,
        }


@tool
def calculate_velocity(
    project_id: str,
    workspace_id: str,
    window: str = "4w",
) -> Dict[str, Any]:
    """
    Calculate current velocity from historical data.

    Analyzes completed story points over time to calculate team velocity with trend analysis.
    Supports multiple time windows for different planning horizons.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        window: Time window ("1w", "2w", "4w", "sprint")

    Returns:
        {
            "velocity": 12.5,
            "trend": "STABLE",  # UP, DOWN, STABLE
            "confidence": "HIGH",
            "sampleSize": 8,
            "timeRange": "4w"
        }
    """
    try:
        endpoint = f"/api/pm/projects/{project_id}/analytics/velocity"
        params = {"window": window}

        result = api_request(
            method="GET",
            endpoint=endpoint,
            workspace_id=workspace_id,
            params=params,
            timeout=15.0,
            fallback_data={
                "velocity": 0,
                "trend": "STABLE",
                "confidence": "LOW",
                "sampleSize": 0,
                "timeRange": window,
            },
        )

        return result

    except Exception as e:
        logger.error(f"Error calculating velocity: {e}")
        return {
            "error": "Velocity calculation failed",
            "message": str(e),
            "velocity": 0,
            "trend": "STABLE",
            "confidence": "LOW",
            "sampleSize": 0,
            "timeRange": window,
        }


@tool
def detect_anomalies(
    project_id: str,
    workspace_id: str,
    metric_type: str = "velocity",
    threshold: float = 2.0,
) -> List[Dict[str, Any]]:
    """
    Identify statistical anomalies in project metrics.

    Uses statistical analysis to detect unusual patterns in velocity, task completion,
    or other project metrics that may indicate risks or process changes.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        metric_type: Type of metric to analyze ("velocity", "completion_rate", "cycle_time")
        threshold: Standard deviations for anomaly detection (default 2.0)

    Returns:
        [
            {
                "index": 5,
                "period": "2024-W45",
                "value": 3.2,
                "expectedRange": [8.0, 15.0],
                "severity": "HIGH",
                "description": "Velocity dropped 75% below average"
            }
        ]
    """
    try:
        endpoint = f"/api/pm/projects/{project_id}/analytics/anomalies"
        params = {
            "metricType": metric_type,
            "threshold": threshold,
        }

        result = api_request(
            method="GET",
            endpoint=endpoint,
            workspace_id=workspace_id,
            params=params,
            timeout=15.0,
            fallback_data={"anomalies": []},
        )

        # Extract anomalies array if present, otherwise return empty list
        if "anomalies" in result:
            return result["anomalies"]
        elif "error" in result:
            return []
        else:
            return result if isinstance(result, list) else []

    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        return []


@tool
def get_velocity_history(
    project_id: str,
    workspace_id: str,
    periods: int = 12,
) -> List[Dict[str, Any]]:
    """
    Get historical velocity data for trend analysis.

    Retrieves velocity data points over time for visualization and pattern detection.
    Useful for understanding team performance trends and seasonal variations.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        periods: Number of periods to retrieve (default 12)

    Returns:
        [
            {
                "period": "2024-W01",
                "completedPoints": 15,
                "totalTasks": 8,
                "completedTasks": 7,
                "startDate": "2024-01-01",
                "endDate": "2024-01-07"
            }
        ]
    """
    try:
        endpoint = f"/api/pm/projects/{project_id}/analytics/velocity-history"
        params = {"periods": periods}

        result = api_request(
            method="GET",
            endpoint=endpoint,
            workspace_id=workspace_id,
            params=params,
            timeout=15.0,
            fallback_data={"history": []},
        )

        # Extract history array if present
        if "history" in result:
            return result["history"]
        elif "error" in result:
            return []
        else:
            return result if isinstance(result, list) else []

    except Exception as e:
        logger.error(f"Error getting velocity history: {e}")
        return []


@tool
def analyze_completion_probability(
    project_id: str,
    workspace_id: str,
    target_date: str,
) -> Dict[str, Any]:
    """
    Calculate probability of completing by target date.

    Uses Monte Carlo simulation to estimate the probability of project completion
    by a specified target date based on historical velocity patterns.

    Args:
        project_id: Project identifier
        workspace_id: Workspace/tenant identifier
        target_date: Target completion date (ISO format: "2025-06-30")

    Returns:
        {
            "targetDate": "2025-06-30",
            "probability": 0.75,
            "probabilityLabel": "HIGH",
            "weeksRemaining": 12,
            "pointsRemaining": 150,
            "requiredVelocity": 12.5,
            "currentVelocity": 14.2,
            "assessment": "On track - current velocity exceeds requirement"
        }
    """
    try:
        endpoint = f"/api/pm/projects/{project_id}/analytics/completion-probability"
        params = {"targetDate": target_date}

        result = api_request(
            method="GET",
            endpoint=endpoint,
            workspace_id=workspace_id,
            params=params,
            timeout=20.0,
            fallback_data={
                "targetDate": target_date,
                "probability": 0.5,
                "probabilityLabel": "MEDIUM",
                "assessment": "Insufficient data for accurate probability estimate",
            },
        )

        return result

    except Exception as e:
        logger.error(f"Error analyzing completion probability: {e}")
        return {
            "error": "Probability analysis failed",
            "message": str(e),
            "targetDate": target_date,
            "probability": 0.5,
            "probabilityLabel": "MEDIUM",
            "assessment": "Unable to calculate probability",
        }
