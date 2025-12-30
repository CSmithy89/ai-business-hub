"""
Unit Tests for Context-Aware Instructions

Tests for ContextAwareInstructions class and response hints generation.

@see docs/modules/bm-dm/stories/dm-06-2-agent-context-consumption.md
Epic: DM-06 | Story: DM-06.2
"""

import pytest

from context.context_instructions import (
    ContextAwareInstructions,
    generate_response_hints,
    get_context_aware_response_hints,
)


class TestContextAwareInstructions:
    """Tests for ContextAwareInstructions class."""

    def test_base_instructions_constant(self):
        """Should have BASE_INSTRUCTIONS constant defined."""
        assert hasattr(ContextAwareInstructions, "BASE_INSTRUCTIONS")
        assert "CONTEXT AWARENESS GUIDELINES" in ContextAwareInstructions.BASE_INSTRUCTIONS
        assert "this project" in ContextAwareInstructions.BASE_INSTRUCTIONS

    def test_format_project_context_with_full_data(self):
        """Should format all project fields correctly."""
        project = {
            "name": "HYVVE Dashboard",
            "id": "proj-123",
            "status": "active",
            "currentPhase": "Development",
            "healthScore": 85,
            "progress": 75,
            "tasksTotal": 20,
            "tasksCompleted": 15,
            "teamSize": 5,
        }

        result = ContextAwareInstructions.format_project_context(project)

        assert "HYVVE Dashboard" in result
        assert "proj-123" in result
        assert "active" in result
        assert "Development" in result
        assert "85%" in result  # healthScore
        assert "75%" in result  # progress
        assert "15/20" in result  # tasks
        assert "5 members" in result  # teamSize

    def test_format_project_context_with_none(self):
        """Should handle None project gracefully."""
        result = ContextAwareInstructions.format_project_context(None)
        assert "No project context" in result

    def test_format_project_context_minimal(self):
        """Should handle project with minimal fields."""
        project = {
            "name": "Minimal Project",
            "id": "proj-min",
            "status": "on-hold",
        }

        result = ContextAwareInstructions.format_project_context(project)

        assert "Minimal Project" in result
        assert "proj-min" in result
        assert "on-hold" in result
        assert "Health Score" not in result  # Not present
        assert "Progress" not in result  # Not present (default 0 not shown)

    def test_format_selection_context_with_items(self):
        """Should format selection with ID preview limited to 5."""
        selection = {
            "type": "task",
            "count": 7,
            "ids": ["t1", "t2", "t3", "t4", "t5", "t6", "t7"],
            "summary": "7 tasks in To Do column",
        }

        result = ContextAwareInstructions.format_selection_context(selection)

        assert "task" in result
        assert "7 items" in result
        assert "+2 more" in result  # 7 - 5 = 2
        assert "7 tasks in To Do column" in result
        assert "t1" in result
        assert "t5" in result
        # t6 and t7 should not appear individually
        assert "t6, t7" not in result

    def test_format_selection_context_under_limit(self):
        """Should show all IDs when under limit."""
        selection = {
            "type": "document",
            "count": 3,
            "ids": ["d1", "d2", "d3"],
        }

        result = ContextAwareInstructions.format_selection_context(selection)

        assert "document" in result
        assert "3 items" in result
        assert "d1" in result
        assert "d2" in result
        assert "d3" in result
        assert "+0 more" not in result
        assert "more" not in result

    def test_format_selection_context_with_none_type(self):
        """Should handle 'none' selection type."""
        selection = {"type": "none", "count": 0, "ids": []}

        result = ContextAwareInstructions.format_selection_context(selection)

        assert "No items" in result

    def test_format_selection_context_with_none(self):
        """Should handle None selection gracefully."""
        result = ContextAwareInstructions.format_selection_context(None)
        assert "No items" in result

    def test_format_selection_context_zero_count(self):
        """Should handle zero count."""
        selection = {"type": "task", "count": 0, "ids": []}

        result = ContextAwareInstructions.format_selection_context(selection)

        assert "No items" in result

    def test_format_activity_context(self):
        """Should format activity with recent actions."""
        activity = {
            "currentPage": "/projects/proj-123",
            "sessionMinutes": 15,
            "recentActions": [
                {"action": "create_task", "target": "Task A", "timestamp": 1000},
                {"action": "update_status", "target": "Task B", "timestamp": 2000},
            ],
        }

        result = ContextAwareInstructions.format_activity_context(activity)

        assert "/projects/proj-123" in result
        assert "15 minutes" in result
        assert "create_task" in result
        assert "Task A" in result
        assert "update_status" in result

    def test_format_activity_context_with_none(self):
        """Should handle None activity gracefully."""
        result = ContextAwareInstructions.format_activity_context(None)
        assert "No activity context" in result

    def test_format_activity_context_empty(self):
        """Should handle empty activity context with defaults."""
        activity = {}

        result = ContextAwareInstructions.format_activity_context(activity)

        # Empty dict should still format with defaults
        assert "USER ACTIVITY" in result
        assert "Current Page: unknown" in result

    def test_format_activity_context_many_actions(self):
        """Should limit recent actions to 10."""
        activity = {
            "currentPage": "/test",
            "sessionMinutes": 5,
            "recentActions": [
                {"action": f"action_{i}", "target": f"target_{i}", "timestamp": i}
                for i in range(15)
            ],
        }

        result = ContextAwareInstructions.format_activity_context(activity)

        # Should include first 10 actions
        assert "action_0" in result
        assert "action_9" in result
        # Should not include actions beyond 10
        assert "action_10" not in result
        assert "action_14" not in result

    def test_format_document_context(self):
        """Should format document with cursor position."""
        document = {
            "title": "Architecture Overview",
            "type": "markdown",
            "wordCount": 1500,
            "cursorLine": 45,
            "hasSelection": True,
            "selectionPreview": "This is the selected text for the preview test",
        }

        result = ContextAwareInstructions.format_document_context(document)

        assert "Architecture Overview" in result
        assert "markdown" in result
        assert "1500" in result
        assert "Line 45" in result
        assert "Has Selection: Yes" in result
        assert "This is the selected text" in result

    def test_format_document_context_with_none(self):
        """Should handle None document gracefully."""
        result = ContextAwareInstructions.format_document_context(None)
        assert "No document context" in result

    def test_format_document_context_no_selection(self):
        """Should format document without selection."""
        document = {
            "title": "Test Doc",
            "type": "code",
            "hasSelection": False,
        }

        result = ContextAwareInstructions.format_document_context(document)

        assert "Has Selection: No" in result
        assert "Selection Preview" not in result

    def test_format_document_context_long_selection_preview(self):
        """Should truncate long selection previews."""
        long_text = "a" * 150
        document = {
            "title": "Test",
            "type": "markdown",
            "hasSelection": True,
            "selectionPreview": long_text,
        }

        result = ContextAwareInstructions.format_document_context(document)

        # Should be truncated to 100 chars plus "..."
        assert "a" * 100 in result
        assert "..." in result

    def test_format_view_context(self):
        """Should format view with filters and sorting."""
        view = {
            "type": "board",
            "filters": {"status": "active", "assignee": "user-1"},
            "sortBy": "priority",
            "groupBy": "status",
            "visibleCount": 10,
            "totalCount": 25,
        }

        result = ContextAwareInstructions.format_view_context(view)

        assert "board" in result
        assert "10 of 25" in result
        assert "2 applied" in result  # 2 filters
        assert "priority" in result
        assert "status" in result

    def test_format_view_context_with_none(self):
        """Should handle None view gracefully."""
        result = ContextAwareInstructions.format_view_context(None)
        assert "No view context" in result

    def test_format_view_context_no_filters(self):
        """Should format view without filters."""
        view = {
            "type": "list",
            "filters": {},
            "visibleCount": 5,
            "totalCount": 5,
        }

        result = ContextAwareInstructions.format_view_context(view)

        assert "list" in result
        assert "5 of 5" in result
        assert "applied" not in result

    def test_build_full_instructions(self):
        """Should combine all context types into full instructions."""
        context = {
            "project": {
                "name": "Test Project",
                "id": "p1",
                "status": "active",
                "progress": 50,
            },
            "selection": {"type": "none", "count": 0, "ids": []},
        }

        result = ContextAwareInstructions.build_full_instructions(context)

        assert "CONTEXT AWARENESS GUIDELINES" in result
        assert "--- CURRENT CONTEXT ---" in result
        assert "ACTIVE PROJECT" in result
        assert "Test Project" in result
        assert "--- END CONTEXT ---" in result

    def test_build_full_instructions_empty_context(self):
        """Should handle empty context."""
        context = {}

        result = ContextAwareInstructions.build_full_instructions(context)

        assert "CONTEXT AWARENESS GUIDELINES" in result
        assert "--- CURRENT CONTEXT ---" in result
        assert "--- END CONTEXT ---" in result

    def test_build_full_instructions_all_context_types(self):
        """Should include all context types when present."""
        context = {
            "project": {"name": "Test", "id": "p1", "status": "active"},
            "selection": {"type": "task", "count": 2, "ids": ["t1", "t2"]},
            "activity": {"currentPage": "/test", "sessionMinutes": 5},
            "document": {"title": "Doc", "type": "markdown"},
            "view": {"type": "board", "visibleCount": 10, "totalCount": 20},
        }

        result = ContextAwareInstructions.build_full_instructions(context)

        assert "ACTIVE PROJECT" in result
        assert "CURRENT SELECTION" in result
        assert "USER ACTIVITY" in result
        assert "ACTIVE DOCUMENT" in result
        assert "CURRENT VIEW" in result

    def test_build_full_instructions_includes_hints(self):
        """Should include response hints when applicable."""
        context = {
            "project": {
                "name": "At Risk Project",
                "id": "p1",
                "status": "active",
                "healthScore": 50,  # Low health
            },
        }

        result = ContextAwareInstructions.build_full_instructions(context)

        assert "--- RESPONSE HINTS ---" in result
        assert "health is low" in result.lower()


class TestResponseHints:
    """Tests for get_context_aware_response_hints function."""

    def test_low_health_hint(self):
        """Should generate hint for low project health."""
        context = {
            "project": {"healthScore": 60, "progress": 50},
        }

        hints = get_context_aware_response_hints(context)

        assert any("health is low" in h.lower() for h in hints)
        assert any("60%" in h for h in hints)

    def test_low_health_threshold(self):
        """Should trigger at exactly 69% health."""
        context = {
            "project": {"healthScore": 69, "progress": 50},
        }

        hints = get_context_aware_response_hints(context)

        assert any("health is low" in h.lower() for h in hints)

    def test_healthy_project_no_hint(self):
        """Should not generate health hint for 70%+ health."""
        context = {
            "project": {"healthScore": 70, "progress": 50},
        }

        hints = get_context_aware_response_hints(context)

        assert not any("health is low" in h.lower() for h in hints)

    def test_near_completion_hint(self):
        """Should generate hint for projects near completion."""
        context = {
            "project": {"healthScore": 90, "progress": 95},
        }

        hints = get_context_aware_response_hints(context)

        assert any("near completion" in h.lower() for h in hints)

    def test_near_completion_threshold(self):
        """Should trigger at exactly 91% progress."""
        context = {
            "project": {"healthScore": 80, "progress": 91},
        }

        hints = get_context_aware_response_hints(context)

        assert any("near completion" in h.lower() for h in hints)

    def test_early_stage_hint(self):
        """Should generate hint for early-stage projects."""
        context = {
            "project": {"healthScore": 90, "progress": 10},
        }

        hints = get_context_aware_response_hints(context)

        assert any("early stages" in h.lower() for h in hints)

    def test_early_stage_threshold(self):
        """Should trigger at exactly 19% progress."""
        context = {
            "project": {"healthScore": 90, "progress": 19},
        }

        hints = get_context_aware_response_hints(context)

        assert any("early stages" in h.lower() for h in hints)

    def test_no_early_stage_hint_at_20(self):
        """Should not trigger early stage hint at 20% progress."""
        context = {
            "project": {"healthScore": 90, "progress": 20},
        }

        hints = get_context_aware_response_hints(context)

        assert not any("early stages" in h.lower() for h in hints)

    def test_selection_hint(self):
        """Should generate hint when items are selected."""
        context = {
            "selection": {"type": "task", "count": 3},
        }

        hints = get_context_aware_response_hints(context)

        assert any("3" in h and "task" in h for h in hints)

    def test_selection_hint_different_types(self):
        """Should include selection type in hint."""
        for sel_type in ["task", "document", "project"]:
            context = {
                "selection": {"type": sel_type, "count": 2},
            }

            hints = get_context_aware_response_hints(context)

            assert any(sel_type in h for h in hints)

    def test_no_selection_hint_zero_count(self):
        """Should not generate hint for zero selections."""
        context = {
            "selection": {"type": "task", "count": 0},
        }

        hints = get_context_aware_response_hints(context)

        assert not any("selected" in h.lower() for h in hints)

    def test_recent_create_action_hint(self):
        """Should generate hint after create action."""
        context = {
            "activity": {
                "recentActions": [
                    {"action": "create_task", "target": "New Task", "timestamp": 1000},
                ],
            },
        }

        hints = get_context_aware_response_hints(context)

        assert any("created" in h.lower() for h in hints)

    def test_recent_delete_action_hint(self):
        """Should generate hint after delete action."""
        context = {
            "activity": {
                "recentActions": [
                    {"action": "delete_task", "target": "Old Task", "timestamp": 1000},
                ],
            },
        }

        hints = get_context_aware_response_hints(context)

        assert any("deleted" in h.lower() for h in hints)

    def test_empty_context_returns_empty_hints(self):
        """Should return empty list for empty context."""
        hints = get_context_aware_response_hints({})
        assert hints == []

    def test_multiple_hints(self):
        """Should return multiple hints when applicable."""
        context = {
            "project": {
                "healthScore": 50,  # Low health
                "progress": 95,  # Near completion
            },
            "selection": {"type": "task", "count": 5},
        }

        hints = get_context_aware_response_hints(context)

        # Should have health, completion, and selection hints
        assert len(hints) >= 3
        assert any("health" in h.lower() for h in hints)
        assert any("completion" in h.lower() for h in hints)
        assert any("selected" in h.lower() for h in hints)

    def test_no_activity_hints_without_recent_actions(self):
        """Should not generate activity hints without recent actions."""
        context = {
            "activity": {
                "recentActions": [],
                "currentPage": "/test",
            },
        }

        hints = get_context_aware_response_hints(context)

        assert not any("created" in h.lower() for h in hints)
        assert not any("deleted" in h.lower() for h in hints)


class TestGenerateResponseHintsAlias:
    """Tests for generate_response_hints alias function."""

    def test_generate_response_hints_alias(self):
        """Should be an alias for get_context_aware_response_hints."""
        context = {
            "project": {"healthScore": 50, "progress": 50},
        }

        result1 = get_context_aware_response_hints(context)
        result2 = generate_response_hints(context)

        assert result1 == result2

    def test_generate_response_hints_empty(self):
        """Should return empty list for empty context."""
        hints = generate_response_hints({})
        assert hints == []
