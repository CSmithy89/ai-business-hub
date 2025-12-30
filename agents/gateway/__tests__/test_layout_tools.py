"""
Layout Tools Unit Tests - Story DM-06.3

Tests for Python layout creation tools and layout selection logic.

@see docs/modules/bm-dm/stories/dm-06-3-generative-ui-composition.md
Epic: DM-06 | Story: DM-06.3
"""
import pytest

# Import must use sys.path adjustment since this is a nested test file
import sys
from pathlib import Path

# Add agents directory to path
agents_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(agents_dir))

from gateway.layout_tools import (
    create_single_layout,
    create_split_layout,
    create_wizard_layout,
    create_grid_layout,
    select_layout_for_task,
    get_layout_tools,
    LAYOUT_TOOLS,
)


# =============================================================================
# CREATE SINGLE LAYOUT TESTS
# =============================================================================


class TestCreateSingleLayout:
    """Tests for create_single_layout function."""

    def test_creates_layout_with_single_slot(self):
        """Should create layout with one slot."""
        layout = create_single_layout(
            widget="TaskCard",
            data={"taskId": "t-123"},
            title="Task Details",
        )

        assert layout["type"] == "single"
        assert layout["config"]["type"] == "single"
        assert len(layout["slots"]) == 1
        assert layout["slots"][0]["widget"] == "TaskCard"
        assert layout["slots"][0]["data"]["taskId"] == "t-123"
        assert layout["slots"][0]["title"] == "Task Details"

    def test_generates_unique_ids(self):
        """Should generate unique IDs for layout and slot."""
        layout1 = create_single_layout("Widget", {})
        layout2 = create_single_layout("Widget", {})

        assert layout1["id"] != layout2["id"]
        assert layout1["slots"][0]["id"] != layout2["slots"][0]["id"]

    def test_includes_metadata(self):
        """Should include creation metadata."""
        layout = create_single_layout("Widget", {})

        assert "metadata" in layout
        assert "createdAt" in layout["metadata"]
        assert layout["metadata"]["agentId"] == "dashboard_gateway"

    def test_metadata_created_at_is_timestamp(self):
        """Should have timestamp in milliseconds."""
        layout = create_single_layout("Widget", {})

        # Should be a reasonable timestamp (after 2020)
        assert layout["metadata"]["createdAt"] > 1577836800000

    def test_handles_empty_data(self):
        """Should handle empty data dict."""
        layout = create_single_layout("Widget", {})

        assert layout["slots"][0]["data"] == {}

    def test_handles_complex_data(self):
        """Should handle complex nested data."""
        complex_data = {
            "project": {
                "id": "p-123",
                "name": "Test Project",
                "tasks": [{"id": "t-1"}, {"id": "t-2"}],
            },
            "metrics": {"progress": 75, "health": "good"},
        }

        layout = create_single_layout("Dashboard", complex_data)

        assert layout["slots"][0]["data"] == complex_data

    def test_title_is_optional(self):
        """Should work without title."""
        layout = create_single_layout("Widget", {"value": 42})

        assert layout["slots"][0]["title"] is None


# =============================================================================
# CREATE SPLIT LAYOUT TESTS
# =============================================================================


class TestCreateSplitLayout:
    """Tests for create_split_layout function."""

    def test_creates_horizontal_split(self):
        """Should create horizontal split layout."""
        layout = create_split_layout(
            left_widget="Chart",
            left_data={"type": "pie"},
            right_widget="Table",
            right_data={"rows": 10},
            direction="horizontal",
            ratio=(2, 1),
        )

        assert layout["type"] == "split"
        assert layout["config"]["direction"] == "horizontal"
        assert layout["config"]["ratio"] == [2, 1]
        assert len(layout["slots"]) == 2

    def test_creates_vertical_split(self):
        """Should create vertical split layout."""
        layout = create_split_layout(
            left_widget="Header",
            left_data={},
            right_widget="Content",
            right_data={},
            direction="vertical",
        )

        assert layout["config"]["direction"] == "vertical"

    def test_default_direction_horizontal(self):
        """Should default to horizontal direction."""
        layout = create_split_layout("A", {}, "B", {})
        assert layout["config"]["direction"] == "horizontal"

    def test_default_ratio_equal(self):
        """Should default to 1:1 ratio."""
        layout = create_split_layout("A", {}, "B", {})
        assert layout["config"]["ratio"] == [1, 1]

    def test_left_slot_is_first(self):
        """Should have left slot as first in array."""
        layout = create_split_layout(
            left_widget="LeftWidget",
            left_data={"side": "left"},
            right_widget="RightWidget",
            right_data={"side": "right"},
        )

        assert layout["slots"][0]["widget"] == "LeftWidget"
        assert layout["slots"][0]["data"]["side"] == "left"
        assert layout["slots"][1]["widget"] == "RightWidget"
        assert layout["slots"][1]["data"]["side"] == "right"

    def test_includes_slot_titles(self):
        """Should include titles for both slots."""
        layout = create_split_layout(
            "A",
            {},
            "B",
            {},
            left_title="Left Title",
            right_title="Right Title",
        )

        assert layout["slots"][0]["title"] == "Left Title"
        assert layout["slots"][1]["title"] == "Right Title"

    def test_ratio_as_tuple_converted_to_list(self):
        """Should convert tuple ratio to list for JSON serialization."""
        layout = create_split_layout("A", {}, "B", {}, ratio=(3, 2))

        assert layout["config"]["ratio"] == [3, 2]
        assert isinstance(layout["config"]["ratio"], list)

    def test_resizable_defaults_to_false(self):
        """Should default resizable to False."""
        layout = create_split_layout("A", {}, "B", {})
        assert layout["config"]["resizable"] is False


# =============================================================================
# CREATE WIZARD LAYOUT TESTS
# =============================================================================


class TestCreateWizardLayout:
    """Tests for create_wizard_layout function."""

    def test_creates_wizard_with_steps(self):
        """Should create wizard with multiple steps."""
        steps = [
            {"widget": "Form", "data": {"fields": ["name"]}, "title": "Basic Info"},
            {"widget": "Form", "data": {"fields": ["email"]}, "title": "Contact"},
            {"widget": "Summary", "data": {}, "title": "Review"},
        ]

        layout = create_wizard_layout(steps)

        assert layout["type"] == "wizard"
        assert layout["config"]["totalSteps"] == 3
        assert layout["config"]["currentStep"] == 0
        assert layout["config"]["showProgress"] is True
        assert len(layout["slots"]) == 3

    def test_custom_start_step(self):
        """Should support custom starting step."""
        steps = [{"widget": "A"}, {"widget": "B"}]
        layout = create_wizard_layout(steps, current_step=1)

        assert layout["config"]["currentStep"] == 1

    def test_allow_skip_option(self):
        """Should support allow skip option."""
        layout = create_wizard_layout([{"widget": "A"}], allow_skip=True)
        assert layout["config"]["allowSkip"] is True

    def test_hide_progress_option(self):
        """Should support hiding progress."""
        layout = create_wizard_layout([{"widget": "A"}], show_progress=False)
        assert layout["config"]["showProgress"] is False

    def test_step_titles_preserved(self):
        """Should preserve step titles in slots."""
        steps = [
            {"widget": "W1", "title": "Step One"},
            {"widget": "W2", "title": "Step Two"},
        ]
        layout = create_wizard_layout(steps)

        assert layout["slots"][0]["title"] == "Step One"
        assert layout["slots"][1]["title"] == "Step Two"

    def test_handles_missing_step_fields(self):
        """Should handle steps with missing optional fields."""
        steps = [
            {"widget": "W1"},  # No data or title
            {"widget": "W2", "data": {}},  # No title
        ]
        layout = create_wizard_layout(steps)

        assert layout["slots"][0]["widget"] == "W1"
        assert layout["slots"][0]["data"] == {}
        assert layout["slots"][0]["title"] is None

    def test_empty_wizard_allowed(self):
        """Should allow creating wizard with no steps."""
        layout = create_wizard_layout([])

        assert layout["type"] == "wizard"
        assert layout["config"]["totalSteps"] == 0
        assert layout["slots"] == []


# =============================================================================
# CREATE GRID LAYOUT TESTS
# =============================================================================


class TestCreateGridLayout:
    """Tests for create_grid_layout function."""

    def test_creates_grid_with_widgets(self):
        """Should create grid with multiple widgets."""
        widgets = [
            {"widget": "Card", "data": {"title": "A"}},
            {"widget": "Card", "data": {"title": "B"}},
            {"widget": "Card", "data": {"title": "C"}},
            {"widget": "Card", "data": {"title": "D"}},
        ]

        layout = create_grid_layout(widgets, columns=2)

        assert layout["type"] == "grid"
        assert layout["config"]["columns"] == 2
        assert len(layout["slots"]) == 4

    def test_custom_gap_and_min_width(self):
        """Should support custom gap and min width."""
        layout = create_grid_layout([], columns=3, gap=8, min_item_width=300)

        assert layout["config"]["gap"] == 8
        assert layout["config"]["minItemWidth"] == 300

    def test_default_columns(self):
        """Should default to 2 columns."""
        layout = create_grid_layout([])
        assert layout["config"]["columns"] == 2

    def test_default_gap(self):
        """Should default to gap of 4."""
        layout = create_grid_layout([])
        assert layout["config"]["gap"] == 4

    def test_default_min_item_width(self):
        """Should default to minItemWidth of 200."""
        layout = create_grid_layout([])
        assert layout["config"]["minItemWidth"] == 200

    def test_preserves_widget_titles(self):
        """Should preserve widget titles in slots."""
        widgets = [
            {"widget": "W1", "title": "Widget 1"},
            {"widget": "W2", "title": "Widget 2"},
        ]
        layout = create_grid_layout(widgets)

        assert layout["slots"][0]["title"] == "Widget 1"
        assert layout["slots"][1]["title"] == "Widget 2"

    def test_handles_missing_widget_fields(self):
        """Should handle widgets with missing optional fields."""
        widgets = [
            {"widget": "W1"},  # No data or title
        ]
        layout = create_grid_layout(widgets)

        assert layout["slots"][0]["widget"] == "W1"
        assert layout["slots"][0]["data"] == {}
        assert layout["slots"][0]["title"] is None


# =============================================================================
# SELECT LAYOUT FOR TASK TESTS
# =============================================================================


class TestSelectLayoutForTask:
    """Tests for select_layout_for_task function."""

    def test_compare_task_selects_split(self):
        """Should select split for compare with 2 items."""
        result = select_layout_for_task("compare", item_count=2)
        assert result == "split"

    def test_setup_task_selects_wizard(self):
        """Should select wizard for setup tasks."""
        assert select_layout_for_task("setup") == "wizard"
        assert select_layout_for_task("onboard") == "wizard"
        assert select_layout_for_task("configure") == "wizard"

    def test_overview_many_items_selects_grid(self):
        """Should select grid for overview with many items."""
        result = select_layout_for_task("overview", item_count=5)
        assert result == "grid"

    def test_detail_selects_single(self):
        """Should select single for detail view."""
        result = select_layout_for_task("detail")
        assert result == "single"

    def test_single_item_defaults_to_single(self):
        """Should default to single for 1 item."""
        result = select_layout_for_task("unknown", item_count=1)
        assert result == "single"

    def test_multiple_items_defaults_to_grid(self):
        """Should default to grid for multiple items."""
        result = select_layout_for_task("unknown", item_count=5)
        assert result == "grid"

    def test_case_insensitive(self):
        """Should be case insensitive."""
        assert select_layout_for_task("COMPARE", item_count=2) == "split"
        assert select_layout_for_task("Setup") == "wizard"
        assert select_layout_for_task("DETAIL") == "single"

    def test_handles_whitespace(self):
        """Should handle leading/trailing whitespace."""
        assert select_layout_for_task("  compare  ", item_count=2) == "split"
        assert select_layout_for_task(" setup ") == "wizard"

    def test_compare_with_non_2_items_not_split(self):
        """Should not select split for compare with non-2 items."""
        result = select_layout_for_task("compare", item_count=3)
        assert result == "grid"

    def test_wizard_task_type(self):
        """Should select wizard for 'wizard' task type."""
        result = select_layout_for_task("wizard")
        assert result == "wizard"

    def test_flow_task_type(self):
        """Should select wizard for 'flow' task type."""
        result = select_layout_for_task("flow")
        assert result == "wizard"


# =============================================================================
# LAYOUT TOOLS TESTS
# =============================================================================


class TestLayoutToolDefinitions:
    """Tests for LAYOUT_TOOLS definitions."""

    def test_render_tool_defined(self):
        """Should define render_generative_layout tool."""
        tool = next(
            (t for t in LAYOUT_TOOLS if t["name"] == "render_generative_layout"),
            None,
        )
        assert tool is not None

    def test_tool_has_required_parameters(self):
        """Should have layout_type, config, slots parameters."""
        tool = next(t for t in LAYOUT_TOOLS if t["name"] == "render_generative_layout")

        params = tool["parameters"]
        assert "layout_type" in params
        assert "config" in params
        assert "slots" in params

    def test_layout_type_has_enum(self):
        """Should have enum for layout_type values."""
        tool = next(t for t in LAYOUT_TOOLS if t["name"] == "render_generative_layout")

        layout_type_param = tool["parameters"]["layout_type"]
        assert "enum" in layout_type_param
        assert layout_type_param["enum"] == ["single", "split", "wizard", "grid"]

    def test_tool_has_description(self):
        """Should have a description."""
        tool = next(t for t in LAYOUT_TOOLS if t["name"] == "render_generative_layout")
        assert "description" in tool
        assert len(tool["description"]) > 0


class TestGetLayoutTools:
    """Tests for get_layout_tools function."""

    def test_returns_list_of_functions(self):
        """Should return list of tool functions."""
        tools = get_layout_tools()

        assert isinstance(tools, list)
        assert len(tools) == 5

    def test_includes_all_layout_functions(self):
        """Should include all layout creation functions."""
        tools = get_layout_tools()
        tool_names = [t.__name__ for t in tools]

        assert "create_single_layout" in tool_names
        assert "create_split_layout" in tool_names
        assert "create_wizard_layout" in tool_names
        assert "create_grid_layout" in tool_names
        assert "select_layout_for_task" in tool_names
