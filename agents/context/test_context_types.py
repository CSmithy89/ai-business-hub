"""
Unit Tests for Context Type Models

Tests for Pydantic models that validate frontend context received via AG-UI.

@see docs/modules/bm-dm/stories/dm-06-2-agent-context-consumption.md
Epic: DM-06 | Story: DM-06.2
"""

import pytest

from context.context_types import (
    ActivityContextModel,
    DocumentContextModel,
    FrontendContext,
    ProjectContextModel,
    RecentActionModel,
    SelectionContextModel,
    ViewContextModel,
)


class TestProjectContextModel:
    """Tests for ProjectContextModel."""

    def test_valid_project_context_full_data(self):
        """Should validate project context with all fields."""
        data = {
            "id": "proj-123",
            "name": "Test Project",
            "status": "active",
            "currentPhase": "Development",
            "healthScore": 85,
            "progress": 75,
            "tasksTotal": 20,
            "tasksCompleted": 15,
            "teamSize": 5,
        }

        model = ProjectContextModel(**data)

        assert model.id == "proj-123"
        assert model.name == "Test Project"
        assert model.status == "active"
        assert model.current_phase == "Development"
        assert model.health_score == 85
        assert model.progress == 75
        assert model.tasks_total == 20
        assert model.tasks_completed == 15
        assert model.team_size == 5

    def test_camel_case_alias_support(self):
        """Should support camelCase aliases from frontend."""
        data = {
            "id": "proj-1",
            "name": "Test",
            "status": "active",
            "currentPhase": "Planning",
            "healthScore": 90,
            "tasksTotal": 10,
            "tasksCompleted": 5,
            "teamSize": 3,
        }

        model = ProjectContextModel(**data)

        # Access via snake_case
        assert model.current_phase == "Planning"
        assert model.health_score == 90
        assert model.tasks_total == 10
        assert model.tasks_completed == 5
        assert model.team_size == 3

    def test_minimal_project_context(self):
        """Should validate project with only required fields."""
        data = {
            "id": "proj-min",
            "name": "Minimal Project",
            "status": "on-hold",
        }

        model = ProjectContextModel(**data)

        assert model.id == "proj-min"
        assert model.name == "Minimal Project"
        assert model.status == "on-hold"
        assert model.current_phase is None
        assert model.health_score is None
        assert model.progress == 0
        assert model.tasks_total == 0

    def test_health_score_validation(self):
        """Should validate healthScore is within 0-100."""
        data = {
            "id": "proj-1",
            "name": "Test",
            "status": "active",
            "healthScore": 50,
        }

        model = ProjectContextModel(**data)
        assert model.health_score == 50

    def test_progress_validation(self):
        """Should validate progress is within 0-100."""
        data = {
            "id": "proj-1",
            "name": "Test",
            "status": "active",
            "progress": 100,
        }

        model = ProjectContextModel(**data)
        assert model.progress == 100


class TestSelectionContextModel:
    """Tests for SelectionContextModel."""

    def test_valid_selection_context(self):
        """Should validate selection context."""
        data = {
            "type": "task",
            "ids": ["t1", "t2", "t3"],
            "count": 3,
            "summary": "3 tasks selected",
        }

        model = SelectionContextModel(**data)

        assert model.type == "task"
        assert len(model.ids) == 3
        assert model.count == 3
        assert model.summary == "3 tasks selected"

    def test_empty_selection(self):
        """Should validate empty selection (none type)."""
        data = {
            "type": "none",
            "ids": [],
            "count": 0,
        }

        model = SelectionContextModel(**data)

        assert model.type == "none"
        assert model.ids == []
        assert model.count == 0
        assert model.summary is None

    def test_selection_types(self):
        """Should accept various selection types."""
        for sel_type in ["task", "project", "document", "none"]:
            data = {"type": sel_type, "ids": [], "count": 0}
            model = SelectionContextModel(**data)
            assert model.type == sel_type


class TestRecentActionModel:
    """Tests for RecentActionModel."""

    def test_valid_recent_action(self):
        """Should validate recent action."""
        data = {
            "action": "create_task",
            "target": "New Task",
            "timestamp": 1735689600000,
        }

        model = RecentActionModel(**data)

        assert model.action == "create_task"
        assert model.target == "New Task"
        assert model.timestamp == 1735689600000


class TestActivityContextModel:
    """Tests for ActivityContextModel."""

    def test_valid_activity_context(self):
        """Should validate activity context with alias support."""
        data = {
            "recentActions": [
                {"action": "click", "target": "button", "timestamp": 1735689600000}
            ],
            "currentPage": "/dashboard",
            "sessionMinutes": 15,
        }

        model = ActivityContextModel(**data)

        assert model.current_page == "/dashboard"
        assert model.session_minutes == 15
        assert len(model.recent_actions) == 1
        assert model.recent_actions[0].action == "click"

    def test_empty_activity_context(self):
        """Should validate empty activity context with defaults."""
        data = {}

        model = ActivityContextModel(**data)

        assert model.current_page == "unknown"
        assert model.session_minutes == 0
        assert model.recent_actions == []

    def test_multiple_recent_actions(self):
        """Should handle multiple recent actions."""
        data = {
            "recentActions": [
                {"action": "create_task", "target": "Task A", "timestamp": 1000},
                {"action": "update_status", "target": "Task B", "timestamp": 2000},
                {"action": "delete_task", "target": "Task C", "timestamp": 3000},
            ],
            "currentPage": "/projects/123",
            "sessionMinutes": 30,
        }

        model = ActivityContextModel(**data)

        assert len(model.recent_actions) == 3
        assert model.recent_actions[0].action == "create_task"
        assert model.recent_actions[1].action == "update_status"
        assert model.recent_actions[2].action == "delete_task"


class TestDocumentContextModel:
    """Tests for DocumentContextModel."""

    def test_valid_document_context(self):
        """Should validate document context with all fields."""
        data = {
            "id": "doc-123",
            "title": "Architecture Overview",
            "type": "markdown",
            "wordCount": 1500,
            "lastEdited": 1735689600000,
            "cursorLine": 45,
            "hasSelection": True,
            "selectionPreview": "Selected text preview",
        }

        model = DocumentContextModel(**data)

        assert model.id == "doc-123"
        assert model.title == "Architecture Overview"
        assert model.type == "markdown"
        assert model.word_count == 1500
        assert model.last_edited == 1735689600000
        assert model.cursor_line == 45
        assert model.has_selection is True
        assert model.selection_preview == "Selected text preview"

    def test_minimal_document_context(self):
        """Should validate document with only required fields."""
        data = {
            "id": "doc-min",
            "title": "Test Doc",
            "type": "code",
        }

        model = DocumentContextModel(**data)

        assert model.id == "doc-min"
        assert model.title == "Test Doc"
        assert model.type == "code"
        assert model.word_count == 0
        assert model.cursor_line is None
        assert model.has_selection is False
        assert model.selection_preview is None

    def test_document_types(self):
        """Should accept various document types."""
        for doc_type in ["markdown", "rich-text", "code"]:
            data = {"id": "d1", "title": "Test", "type": doc_type}
            model = DocumentContextModel(**data)
            assert model.type == doc_type


class TestViewContextModel:
    """Tests for ViewContextModel."""

    def test_valid_view_context(self):
        """Should validate view context with all fields."""
        data = {
            "type": "board",
            "filters": {"status": "active", "assignee": "user-1"},
            "sortBy": "priority",
            "groupBy": "status",
            "visibleCount": 10,
            "totalCount": 25,
        }

        model = ViewContextModel(**data)

        assert model.type == "board"
        assert model.filters == {"status": "active", "assignee": "user-1"}
        assert model.sort_by == "priority"
        assert model.group_by == "status"
        assert model.visible_count == 10
        assert model.total_count == 25

    def test_minimal_view_context(self):
        """Should validate view with only required fields."""
        data = {"type": "list"}

        model = ViewContextModel(**data)

        assert model.type == "list"
        assert model.filters == {}
        assert model.sort_by is None
        assert model.group_by is None
        assert model.visible_count == 0
        assert model.total_count == 0

    def test_view_types(self):
        """Should accept various view types."""
        for view_type in ["list", "board", "calendar", "gantt"]:
            data = {"type": view_type}
            model = ViewContextModel(**data)
            assert model.type == view_type


class TestFrontendContext:
    """Tests for FrontendContext bundle model."""

    def test_full_context_bundle(self):
        """Should validate full context bundle."""
        data = {
            "project": {
                "id": "p1",
                "name": "Test Project",
                "status": "active",
                "progress": 50,
            },
            "selection": {
                "type": "task",
                "ids": ["t1"],
                "count": 1,
            },
            "activity": {
                "currentPage": "/dashboard",
                "sessionMinutes": 10,
            },
            "document": {
                "id": "d1",
                "title": "Doc",
                "type": "markdown",
            },
            "view": {
                "type": "board",
            },
            "workspaceId": "ws-123",
            "userId": "user-456",
        }

        model = FrontendContext(**data)

        assert model.project is not None
        assert model.project.name == "Test Project"
        assert model.selection is not None
        assert model.selection.count == 1
        assert model.activity is not None
        assert model.activity.current_page == "/dashboard"
        assert model.document is not None
        assert model.document.title == "Doc"
        assert model.view is not None
        assert model.view.type == "board"
        assert model.workspace_id == "ws-123"
        assert model.user_id == "user-456"

    def test_partial_context_bundle(self):
        """Should validate partial context (only project)."""
        data = {
            "project": {
                "id": "p1",
                "name": "Test",
                "status": "active",
            },
        }

        model = FrontendContext(**data)

        assert model.project is not None
        assert model.project.name == "Test"
        assert model.selection is None
        assert model.activity is None
        assert model.document is None
        assert model.view is None

    def test_empty_context_bundle(self):
        """Should validate empty context bundle."""
        model = FrontendContext()

        assert model.project is None
        assert model.selection is None
        assert model.activity is None
        assert model.document is None
        assert model.view is None
        assert model.workspace_id is None
        assert model.user_id is None

    def test_to_dict_method(self):
        """Should convert to dictionary for instruction building."""
        model = FrontendContext(
            project=ProjectContextModel(
                id="p1",
                name="Test Project",
                status="active",
                progress=75,
            ),
            selection=SelectionContextModel(
                type="task",
                ids=["t1", "t2"],
                count=2,
            ),
        )

        result = model.to_dict()

        assert result["project"] is not None
        assert result["project"]["name"] == "Test Project"
        assert result["project"]["progress"] == 75
        assert result["selection"] is not None
        assert result["selection"]["type"] == "task"
        assert result["selection"]["count"] == 2
        assert result["activity"] is None
        assert result["document"] is None
        assert result["view"] is None

    def test_to_dict_camel_case_output(self):
        """Should output camelCase keys in to_dict."""
        model = FrontendContext(
            project=ProjectContextModel(
                id="p1",
                name="Test",
                status="active",
                current_phase="Development",
                health_score=85,
                tasks_total=10,
                tasks_completed=5,
                team_size=3,
            ),
        )

        result = model.to_dict()

        # Verify camelCase keys in output
        assert "currentPhase" in result["project"]
        assert "healthScore" in result["project"]
        assert "tasksTotal" in result["project"]
        assert "tasksCompleted" in result["project"]
        assert "teamSize" in result["project"]

    def test_to_dict_with_all_contexts(self):
        """Should correctly serialize all context types."""
        model = FrontendContext(
            project=ProjectContextModel(
                id="p1", name="Test", status="active"
            ),
            selection=SelectionContextModel(
                type="task", ids=["t1"], count=1
            ),
            activity=ActivityContextModel(
                current_page="/test",
                session_minutes=5,
            ),
            document=DocumentContextModel(
                id="d1", title="Doc", type="markdown"
            ),
            view=ViewContextModel(type="list"),
            workspace_id="ws-1",
            user_id="u-1",
        )

        result = model.to_dict()

        assert all(
            key in result
            for key in ["project", "selection", "activity", "document", "view"]
        )
        assert result["workspaceId"] == "ws-1"
        assert result["userId"] == "u-1"


class TestModelSerialization:
    """Tests for model serialization with aliases."""

    def test_project_model_dump_by_alias(self):
        """Should serialize ProjectContextModel with camelCase keys."""
        model = ProjectContextModel(
            id="p1",
            name="Test",
            status="active",
            current_phase="Dev",
            health_score=80,
            progress=50,
            tasks_total=10,
            tasks_completed=5,
            team_size=3,
        )

        dumped = model.model_dump(by_alias=True)

        assert "currentPhase" in dumped
        assert "healthScore" in dumped
        assert "tasksTotal" in dumped
        assert "tasksCompleted" in dumped
        assert "teamSize" in dumped
        # Verify values
        assert dumped["currentPhase"] == "Dev"
        assert dumped["healthScore"] == 80

    def test_activity_model_dump_by_alias(self):
        """Should serialize ActivityContextModel with camelCase keys."""
        model = ActivityContextModel(
            recent_actions=[],
            current_page="/test",
            session_minutes=10,
        )

        dumped = model.model_dump(by_alias=True)

        assert "recentActions" in dumped
        assert "currentPage" in dumped
        assert "sessionMinutes" in dumped

    def test_document_model_dump_by_alias(self):
        """Should serialize DocumentContextModel with camelCase keys."""
        model = DocumentContextModel(
            id="d1",
            title="Test",
            type="markdown",
            word_count=100,
            last_edited=1000,
            cursor_line=10,
            has_selection=True,
            selection_preview="text",
        )

        dumped = model.model_dump(by_alias=True)

        assert "wordCount" in dumped
        assert "lastEdited" in dumped
        assert "cursorLine" in dumped
        assert "hasSelection" in dumped
        assert "selectionPreview" in dumped

    def test_view_model_dump_by_alias(self):
        """Should serialize ViewContextModel with camelCase keys."""
        model = ViewContextModel(
            type="board",
            sort_by="name",
            group_by="status",
            visible_count=5,
            total_count=10,
        )

        dumped = model.model_dump(by_alias=True)

        assert "sortBy" in dumped
        assert "groupBy" in dumped
        assert "visibleCount" in dumped
        assert "totalCount" in dumped
