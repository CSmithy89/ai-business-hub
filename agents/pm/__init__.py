"""
PM (Project Management) Module

This module provides PM agents for project orchestration, health monitoring,
and automated reporting. All agents support A2A protocol for inter-agent
communication via the Dashboard Gateway.

Agents:
    - Navi: PM orchestration assistant (team leader)
    - Vitals: Health monitoring specialist (config: "pulse")
    - Herald: Automated reporting specialist (pushNotifications enabled)

A2A Adapter Pattern (DM-02.5):
    Each agent has a corresponding A2A adapter factory:
    - create_navi_a2a_adapter() -> PMA2AAdapter
    - create_vitals_a2a_adapter() -> PMA2AAdapter (agent_id="pulse")
    - create_herald_a2a_adapter() -> PMA2AAdapter
"""

# A2A Adapter
from .a2a_adapter import PMA2AAdapter, create_pm_a2a_adapter

# Agent factories
from .navi import create_navi_agent, create_navi_a2a_adapter
from .vitals import create_vitals_agent, create_vitals_a2a_adapter
from .herald import create_herald_agent, create_herald_a2a_adapter

# Team factory
from .team import create_pm_team

__all__ = [
    # A2A Adapter
    "PMA2AAdapter",
    "create_pm_a2a_adapter",
    # Agent factories
    "create_navi_agent",
    "create_navi_a2a_adapter",
    "create_vitals_agent",
    "create_vitals_a2a_adapter",
    "create_herald_agent",
    "create_herald_a2a_adapter",
    # Team factory
    "create_pm_team",
]
