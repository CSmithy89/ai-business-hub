"""
Agent Schemas Module

Pydantic models for data validation and serialization across
the agent system. These schemas ensure type safety and
cross-language compatibility with the TypeScript frontend.
"""

from .dashboard_state import (
    # Enums
    AlertType,
    ProjectStatus,
    TrendDirection,
    # Widget State Models
    ActivityEntry,
    ActivityState,
    AlertEntry,
    # Root State Models
    DashboardState,
    LoadingState,
    MetricEntry,
    MetricsState,
    ProjectStatusState,
    # Constants
    STATE_VERSION,
    WidgetsState,
)

__all__ = [
    # Constants
    "STATE_VERSION",
    # Enums
    "ProjectStatus",
    "TrendDirection",
    "AlertType",
    # Widget State Models
    "ProjectStatusState",
    "MetricEntry",
    "MetricsState",
    "ActivityEntry",
    "ActivityState",
    "AlertEntry",
    "LoadingState",
    # Root State Models
    "WidgetsState",
    "DashboardState",
]
