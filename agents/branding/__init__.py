"""
BM-Brand - Branding Module
AI Business Hub - Branding Agent Team

This module provides the Branding Team for creating comprehensive
brand identity systems including strategy, voice, visual identity,
and asset generation.

Team Structure:
- Leader: Bella (Brand Orchestrator)
- Members: Sage (Strategy), Vox (Voice), Iris (Visual), Artisan (Assets), Audit (QA)
"""

from .team import (
    create_branding_team,
    run_brand_strategy,
    run_brand_voice,
    run_visual_identity,
    run_brand_guidelines,
    run_asset_generation,
)

__all__ = [
    "create_branding_team",
    "run_brand_strategy",
    "run_brand_voice",
    "run_visual_identity",
    "run_brand_guidelines",
    "run_asset_generation",
]
