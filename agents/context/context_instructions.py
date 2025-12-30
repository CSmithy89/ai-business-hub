"""
Context-Aware Agent Instructions

Provides instruction templates that incorporate frontend context
for more intelligent agent responses. Agents use these formatted
instructions to understand the user's current application state.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.2
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# =============================================================================
# CONSTANTS
# =============================================================================

# Maximum number of IDs to show in selection preview
MAX_SELECTION_IDS_PREVIEW = 5

# Maximum number of recent actions to include
MAX_RECENT_ACTIONS = 10

# Maximum length for selection preview text
MAX_SELECTION_PREVIEW_LENGTH = 100


# =============================================================================
# CONTEXT-AWARE INSTRUCTIONS CLASS
# =============================================================================


class ContextAwareInstructions:
    """
    Generates context-aware instructions for agents.

    This class provides static methods to format various types of frontend
    context into structured sections that are appended to the agent's
    system prompt. This enables natural language references like
    "this project" or "here" to resolve correctly.

    Usage:
        context = {"project": {...}, "selection": {...}}
        instructions = ContextAwareInstructions.build_full_instructions(context)
    """

    BASE_INSTRUCTIONS = """
You are the Dashboard Gateway agent for HYVVE. You have access to the user's
current application context, which is automatically provided to you.

CONTEXT AWARENESS GUIDELINES:
1. When the user says "this project", "this task", or "here", refer to the
   active context provided in your system prompt.
2. Use specific names and details from the context - don't ask for IDs or
   names that are already visible to you.
3. If the context includes selected items, assume the user's question relates
   to those items unless they specify otherwise.
4. Reference actual data from the context in your responses (e.g., "Project
   HYVVE Dashboard is currently at 75% completion").

CONTEXT TYPES YOU MAY RECEIVE:
- Project: Active project details (name, status, health, progress)
- Selection: Currently selected items (tasks, documents, etc.)
- Activity: Recent user actions and current page
- Document: Document being edited (title, type, cursor position)
- View: Current view configuration (filters, sorting, grouping)
- Workspace: Workspace details and enabled modules
"""

    @staticmethod
    def format_project_context(project: Optional[Dict[str, Any]]) -> str:
        """
        Format project context for agent instructions.

        Args:
            project: Project context dictionary with keys like name, id,
                    status, currentPhase, healthScore, progress, etc.

        Returns:
            Formatted string section for agent instructions
        """
        if not project:
            return "No project context available."

        lines = [
            "ACTIVE PROJECT:",
            f"  Name: {project.get('name', 'Unknown')}",
            f"  ID: {project.get('id', 'Unknown')}",
            f"  Status: {project.get('status', 'Unknown')}",
        ]

        if project.get("currentPhase"):
            lines.append(f"  Current Phase: {project['currentPhase']}")

        if project.get("healthScore") is not None:
            lines.append(f"  Health Score: {project['healthScore']}%")

        if project.get("progress") is not None:
            lines.append(f"  Progress: {project['progress']}%")

        tasks_total = project.get("tasksTotal", 0)
        tasks_completed = project.get("tasksCompleted", 0)
        if tasks_total:
            lines.append(f"  Tasks: {tasks_completed}/{tasks_total} completed")

        team_size = project.get("teamSize", 0)
        if team_size:
            lines.append(f"  Team Size: {team_size} members")

        return "\n".join(lines)

    @staticmethod
    def format_selection_context(selection: Optional[Dict[str, Any]]) -> str:
        """
        Format selection context for agent instructions.

        Args:
            selection: Selection context dictionary with keys like type,
                      ids, count, summary.

        Returns:
            Formatted string section for agent instructions
        """
        if not selection or selection.get("type") == "none":
            return "No items currently selected."

        count = selection.get("count", 0)
        if count == 0:
            return "No items currently selected."

        lines = [
            "CURRENT SELECTION:",
            f"  Type: {selection.get('type', 'Unknown')}",
            f"  Count: {count} items",
        ]

        if selection.get("summary"):
            lines.append(f"  Summary: {selection['summary']}")

        ids = selection.get("ids", [])
        if ids:
            ids_preview = ids[:MAX_SELECTION_IDS_PREVIEW]
            if len(ids) > MAX_SELECTION_IDS_PREVIEW:
                remaining = len(ids) - MAX_SELECTION_IDS_PREVIEW
                lines.append(f"  IDs: {', '.join(ids_preview)} (+{remaining} more)")
            else:
                lines.append(f"  IDs: {', '.join(ids_preview)}")

        return "\n".join(lines)

    @staticmethod
    def format_activity_context(activity: Optional[Dict[str, Any]]) -> str:
        """
        Format activity context for agent instructions.

        Args:
            activity: Activity context dictionary with keys like
                     recentActions, currentPage, sessionMinutes.

        Returns:
            Formatted string section for agent instructions
        """
        if activity is None:
            return "No activity context available."

        lines = ["USER ACTIVITY:"]

        current_page = activity.get("currentPage", "unknown")
        lines.append(f"  Current Page: {current_page}")

        session_minutes = activity.get("sessionMinutes", 0)
        if session_minutes > 0:
            lines.append(f"  Session Duration: {session_minutes} minutes")

        recent_actions = activity.get("recentActions", [])
        if recent_actions:
            # Limit to MAX_RECENT_ACTIONS
            actions_to_show = recent_actions[:MAX_RECENT_ACTIONS]
            lines.append("  Recent Actions:")
            for action in actions_to_show:
                action_type = action.get("action", "unknown")
                target = action.get("target", "")
                if target:
                    lines.append(f"    - {action_type}: {target}")
                else:
                    lines.append(f"    - {action_type}")

        return "\n".join(lines)

    @staticmethod
    def format_document_context(document: Optional[Dict[str, Any]]) -> str:
        """
        Format document context for agent instructions.

        Args:
            document: Document context dictionary with keys like id, title,
                     type, wordCount, cursorLine, hasSelection, selectionPreview.

        Returns:
            Formatted string section for agent instructions
        """
        if not document:
            return "No document context available."

        lines = [
            "ACTIVE DOCUMENT:",
            f"  Title: {document.get('title', 'Unknown')}",
            f"  Type: {document.get('type', 'Unknown')}",
        ]

        word_count = document.get("wordCount", 0)
        if word_count > 0:
            lines.append(f"  Word Count: {word_count}")

        cursor_line = document.get("cursorLine")
        if cursor_line is not None:
            lines.append(f"  Cursor Position: Line {cursor_line}")

        has_selection = document.get("hasSelection", False)
        lines.append(f"  Has Selection: {'Yes' if has_selection else 'No'}")

        selection_preview = document.get("selectionPreview")
        if selection_preview:
            # Truncate if needed
            preview = selection_preview[:MAX_SELECTION_PREVIEW_LENGTH]
            if len(selection_preview) > MAX_SELECTION_PREVIEW_LENGTH:
                preview += "..."
            lines.append(f"  Selection Preview: \"{preview}\"")

        return "\n".join(lines)

    @staticmethod
    def format_view_context(view: Optional[Dict[str, Any]]) -> str:
        """
        Format view context for agent instructions.

        Args:
            view: View context dictionary with keys like type, filters,
                 sortBy, groupBy, visibleCount, totalCount.

        Returns:
            Formatted string section for agent instructions
        """
        if not view:
            return "No view context available."

        view_type = view.get("type", "Unknown")
        visible = view.get("visibleCount", 0)
        total = view.get("totalCount", 0)

        lines = [
            "CURRENT VIEW:",
            f"  Type: {view_type}",
            f"  Showing: {visible} of {total} items",
        ]

        filters = view.get("filters", {})
        if filters:
            filter_count = len(filters)
            lines.append(f"  Filters: {filter_count} applied")

        sort_by = view.get("sortBy")
        if sort_by:
            lines.append(f"  Sort By: {sort_by}")

        group_by = view.get("groupBy")
        if group_by:
            lines.append(f"  Group By: {group_by}")

        return "\n".join(lines)

    @classmethod
    def build_full_instructions(cls, context: Dict[str, Any]) -> str:
        """
        Build full context-aware instructions from all available context.

        Combines the base instructions with formatted sections for each
        context type that is present. The result is a complete system
        prompt augmentation for the agent.

        Args:
            context: Dictionary containing optional project, selection,
                    activity, document, and view context.

        Returns:
            Complete formatted instructions string
        """
        sections = [cls.BASE_INSTRUCTIONS, "\n--- CURRENT CONTEXT ---\n"]

        # Add project context
        if context.get("project"):
            sections.append(cls.format_project_context(context["project"]))
            sections.append("")

        # Add selection context
        if context.get("selection"):
            sections.append(cls.format_selection_context(context["selection"]))
            sections.append("")

        # Add activity context
        if context.get("activity"):
            sections.append(cls.format_activity_context(context["activity"]))
            sections.append("")

        # Add document context
        if context.get("document"):
            sections.append(cls.format_document_context(context["document"]))
            sections.append("")

        # Add view context
        if context.get("view"):
            sections.append(cls.format_view_context(context["view"]))
            sections.append("")

        sections.append("--- END CONTEXT ---")

        # Add response hints
        hints = get_context_aware_response_hints(context)
        if hints:
            sections.append("\n--- RESPONSE HINTS ---")
            for hint in hints:
                sections.append(f"- {hint}")
            sections.append("--- END HINTS ---")

        return "\n".join(sections)


# =============================================================================
# RESPONSE HINTS FUNCTION
# =============================================================================


def get_context_aware_response_hints(context: Dict[str, Any]) -> List[str]:
    """
    Generate response hints based on available context.

    Response hints provide guidance to the agent about relevant
    considerations based on the current context state. These are
    suggestions, not requirements.

    Args:
        context: Dictionary containing optional project, selection,
                activity, document, and view context.

    Returns:
        List of hint strings for the agent
    """
    hints: List[str] = []

    # Project-based hints
    project = context.get("project")
    if project:
        health_score = project.get("healthScore")
        if health_score is not None and health_score < 70:
            hints.append(
                f"Project health is low ({health_score}%). "
                "Consider suggesting improvements or identifying blockers."
            )

        progress = project.get("progress", 0)
        if progress > 90:
            hints.append(
                "Project is near completion. Focus on final tasks and cleanup."
            )
        elif progress < 20:
            hints.append(
                "Project is in early stages. Focus on planning and setup tasks."
            )

    # Selection-based hints
    selection = context.get("selection")
    if selection and selection.get("count", 0) > 0:
        count = selection["count"]
        selection_type = selection.get("type", "item")
        hints.append(f"User has {count} {selection_type}(s) selected.")

    # Activity-based hints
    activity = context.get("activity")
    if activity:
        recent_actions = activity.get("recentActions", [])
        if recent_actions:
            last_action = recent_actions[0].get("action", "")

            if "create" in last_action.lower():
                hints.append(
                    "User recently created something. "
                    "Offer to help configure or expand it."
                )
            elif "delete" in last_action.lower():
                hints.append(
                    "User recently deleted something. "
                    "Be careful about assumptions about what exists."
                )

    return hints


# =============================================================================
# UTILITY FUNCTION FOR EXTERNAL USE
# =============================================================================


def generate_response_hints(context: Dict[str, Any]) -> List[str]:
    """
    Generate response hints based on context state.

    This is an alias for get_context_aware_response_hints for external use.

    Args:
        context: Dictionary containing frontend context

    Returns:
        List of hint strings for the agent
    """
    return get_context_aware_response_hints(context)
