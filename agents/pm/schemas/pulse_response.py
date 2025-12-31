"""
Pulse Agent Response Schemas

Pydantic schemas for validating Pulse (health/metrics) agent responses.

DM-08.7: Created for response parser validation.
"""

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class HealthStatus(str, Enum):
    """Health status values."""

    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class TrendDirection(str, Enum):
    """Trend direction for metrics."""

    UP = "up"
    DOWN = "down"
    STABLE = "stable"


class HealthMetric(BaseModel):
    """Individual health metric from Pulse agent."""

    metric_id: str = Field(description="Unique metric identifier")
    name: str = Field(description="Metric display name")
    value: float = Field(description="Current metric value")
    unit: Optional[str] = Field(default=None, description="Unit of measurement")
    status: HealthStatus = Field(
        default=HealthStatus.UNKNOWN, description="Health status"
    )
    trend: Optional[TrendDirection] = Field(
        default=None, description="Trend direction"
    )
    threshold_warning: Optional[float] = Field(
        default=None, description="Warning threshold"
    )
    threshold_critical: Optional[float] = Field(
        default=None, description="Critical threshold"
    )

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float) -> float:
        """Ensure value is a valid number."""
        if v != v:  # NaN check
            return 0.0
        return v


class RiskIndicator(BaseModel):
    """Risk indicator from Pulse agent."""

    risk_id: str = Field(description="Unique risk identifier")
    title: str = Field(description="Risk title")
    severity: str = Field(default="medium", description="Risk severity level")
    probability: float = Field(
        ge=0.0, le=1.0, description="Probability of occurrence (0-1)"
    )
    impact: str = Field(default="medium", description="Potential impact level")
    description: Optional[str] = Field(default=None, description="Risk description")
    mitigation: Optional[str] = Field(
        default=None, description="Suggested mitigation"
    )
    affected_areas: List[str] = Field(
        default_factory=list, description="Areas affected by this risk"
    )


class PulseHealthResponse(BaseModel):
    """
    Complete response from Pulse agent for health/metrics.

    Used to validate raw A2A responses before state updates.
    """

    project_id: str = Field(description="Queried project identifier")
    content: Optional[str] = Field(default=None, description="Text content from Pulse")
    raw_data: Optional[Dict[str, Any]] = Field(
        default=None, description="Additional artifacts"
    )
    tool_calls: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Tool calls made by agent"
    )
    duration_ms: Optional[int] = Field(
        default=None, description="Response time in ms"
    )
    error: Optional[str] = Field(default=None, description="Error message if failed")
    agent: str = Field(default="pulse", description="Agent identifier")

    # Parsed data
    overall_health: HealthStatus = Field(
        default=HealthStatus.UNKNOWN, description="Overall project health"
    )
    health_score: Optional[int] = Field(
        default=None, ge=0, le=100, description="Health score percentage"
    )
    metrics: Optional[List[HealthMetric]] = Field(
        default=None, description="Health metrics if requested"
    )
    risks: Optional[List[RiskIndicator]] = Field(
        default=None, description="Risk indicators if requested"
    )

    def to_widget_data(self) -> Dict[str, Any]:
        """
        Convert to widget-friendly format.

        Returns data suitable for rendering in Metrics widget.
        """
        return {
            "projectId": self.project_id,
            "overallHealth": self.overall_health.value,
            "healthScore": self.health_score,
            "metrics": [
                {
                    "id": m.metric_id,
                    "name": m.name,
                    "value": m.value,
                    "unit": m.unit,
                    "status": m.status.value,
                    "trend": m.trend.value if m.trend else None,
                }
                for m in (self.metrics or [])
            ],
            "riskCount": len(self.risks) if self.risks else 0,
        }


def get_default_pulse_response() -> Dict[str, Any]:
    """Return safe default when validation fails."""
    return {
        "project_id": "unknown",
        "content": "Unable to retrieve health metrics",
        "error": "Response validation failed",
        "overall_health": "unknown",
    }
