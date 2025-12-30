"""
Context Module

Provides context-aware agent instructions and type models for
frontend context consumption. This module enables agents to
understand and reference the user's current application state.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.2
"""

from .context_instructions import (
    ContextAwareInstructions,
    generate_response_hints,
    get_context_aware_response_hints,
)
from .context_types import (
    ActivityContextModel,
    DocumentContextModel,
    FrontendContext,
    ProjectContextModel,
    RecentActionModel,
    SelectionContextModel,
    ViewContextModel,
)

__all__ = [
    # Instructions
    "ContextAwareInstructions",
    "get_context_aware_response_hints",
    "generate_response_hints",
    # Context Type Models
    "ProjectContextModel",
    "SelectionContextModel",
    "ActivityContextModel",
    "DocumentContextModel",
    "ViewContextModel",
    "RecentActionModel",
    # Bundle Model
    "FrontendContext",
]
