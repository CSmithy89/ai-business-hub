"""
Layout Tools for Generative UI

Python tools for creating generative UI layouts that agents can compose
dynamically. These tools create layout definitions that are rendered
by the frontend's GenerativeLayoutRenderer component.

Tools:
- create_single_layout(): Single widget full-width layout
- create_split_layout(): Side-by-side comparison layout
- create_wizard_layout(): Multi-step wizard layout
- create_grid_layout(): Dashboard grid layout
- select_layout_for_task(): Intelligent layout type selection

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md - Section 3.3
Epic: DM-06 | Story: DM-06.3
"""
import uuid
import time
from typing import Any, Dict, List, Literal, Optional

# =============================================================================
# TYPE DEFINITIONS
# =============================================================================

LayoutType = Literal["single", "split", "wizard", "grid"]

# =============================================================================
# LAYOUT CREATION FUNCTIONS
# =============================================================================


def create_single_layout(
    widget: str,
    data: Dict[str, Any],
    title: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a single-widget layout.

    Use this for detailed views of a single item, such as project details,
    task information, or focused data displays.

    Args:
        widget: Widget type to render (e.g., "TaskCard", "ProjectStatus")
        data: Data payload for the widget
        title: Optional title displayed above the widget

    Returns:
        Layout definition dict ready for frontend rendering

    Example:
        >>> layout = create_single_layout(
        ...     widget="TaskCard",
        ...     data={"taskId": "t-123", "title": "Fix bug", "status": "in-progress"},
        ...     title="Task Details",
        ... )
    """
    slot_id = f"slot-{uuid.uuid4().hex[:8]}"
    layout_id = f"layout-{uuid.uuid4().hex[:8]}"

    return {
        "id": layout_id,
        "type": "single",
        "config": {"type": "single"},
        "slots": [
            {
                "id": slot_id,
                "widget": widget,
                "data": data,
                "title": title,
            }
        ],
        "metadata": {
            "createdAt": int(time.time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_split_layout(
    left_widget: str,
    left_data: Dict[str, Any],
    right_widget: str,
    right_data: Dict[str, Any],
    direction: Literal["horizontal", "vertical"] = "horizontal",
    ratio: tuple = (1, 1),
    left_title: Optional[str] = None,
    right_title: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a split comparison layout.

    Use this for side-by-side comparisons, before/after views, or
    related data that benefits from parallel display.

    Args:
        left_widget: Widget type for left/top pane
        left_data: Data for left widget
        right_widget: Widget type for right/bottom pane
        right_data: Data for right widget
        direction: Split direction ("horizontal" or "vertical")
        ratio: Size ratio as (left, right) tuple, e.g., (2, 1)
        left_title: Optional title for left pane
        right_title: Optional title for right pane

    Returns:
        Layout definition dict ready for frontend rendering

    Example:
        >>> layout = create_split_layout(
        ...     left_widget="ProjectStatus",
        ...     left_data={"projectId": "p-1", "name": "Project A"},
        ...     right_widget="ProjectStatus",
        ...     right_data={"projectId": "p-2", "name": "Project B"},
        ...     direction="horizontal",
        ...     ratio=(1, 1),
        ...     left_title="Project A",
        ...     right_title="Project B",
        ... )
    """
    left_slot_id = f"slot-left-{uuid.uuid4().hex[:8]}"
    right_slot_id = f"slot-right-{uuid.uuid4().hex[:8]}"
    layout_id = f"layout-{uuid.uuid4().hex[:8]}"

    return {
        "id": layout_id,
        "type": "split",
        "config": {
            "type": "split",
            "direction": direction,
            "ratio": list(ratio),
            "resizable": False,
        },
        "slots": [
            {
                "id": left_slot_id,
                "widget": left_widget,
                "data": left_data,
                "title": left_title,
            },
            {
                "id": right_slot_id,
                "widget": right_widget,
                "data": right_data,
                "title": right_title,
            },
        ],
        "metadata": {
            "createdAt": int(time.time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_wizard_layout(
    steps: List[Dict[str, Any]],
    current_step: int = 0,
    show_progress: bool = True,
    allow_skip: bool = False,
) -> Dict[str, Any]:
    """
    Create a multi-step wizard layout.

    Use this for onboarding flows, configuration wizards, or any
    multi-step process that guides the user through sequential steps.

    Args:
        steps: List of step definitions, each containing:
               - widget: Widget type to render
               - data: Widget data payload
               - title: Optional step title
        current_step: Starting step index (0-based)
        show_progress: Whether to show progress indicator
        allow_skip: Whether steps can be skipped

    Returns:
        Layout definition dict ready for frontend rendering

    Example:
        >>> layout = create_wizard_layout(
        ...     steps=[
        ...         {"widget": "Form", "data": {"fields": ["name"]}, "title": "Basic Info"},
        ...         {"widget": "Form", "data": {"fields": ["email"]}, "title": "Contact"},
        ...         {"widget": "Summary", "data": {}, "title": "Review"},
        ...     ],
        ...     current_step=0,
        ...     show_progress=True,
        ... )
    """
    layout_id = f"layout-{uuid.uuid4().hex[:8]}"
    total_steps = len(steps)

    slots = []
    for i, step in enumerate(steps):
        slot_id = f"slot-step{i}-{uuid.uuid4().hex[:8]}"
        slots.append({
            "id": slot_id,
            "widget": step.get("widget", "Empty"),
            "data": step.get("data", {}),
            "title": step.get("title"),
        })

    return {
        "id": layout_id,
        "type": "wizard",
        "config": {
            "type": "wizard",
            "currentStep": current_step,
            "totalSteps": total_steps,
            "showProgress": show_progress,
            "allowSkip": allow_skip,
        },
        "slots": slots,
        "metadata": {
            "createdAt": int(time.time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


def create_grid_layout(
    widgets: List[Dict[str, Any]],
    columns: int = 2,
    gap: int = 4,
    min_item_width: int = 200,
) -> Dict[str, Any]:
    """
    Create a dashboard grid layout.

    Use this for overview displays, dashboard widgets, or any
    collection of items that benefit from a grid presentation.

    Args:
        widgets: List of widget definitions, each containing:
                 - widget: Widget type to render
                 - data: Widget data payload
                 - title: Optional widget title
        columns: Number of columns (responsive on smaller screens)
        gap: Gap between items in spacing units
        min_item_width: Minimum item width in pixels

    Returns:
        Layout definition dict ready for frontend rendering

    Example:
        >>> layout = create_grid_layout(
        ...     widgets=[
        ...         {"widget": "Metrics", "data": {"value": 42}, "title": "Active Tasks"},
        ...         {"widget": "Metrics", "data": {"value": 7}, "title": "Overdue"},
        ...         {"widget": "Metrics", "data": {"value": 85}, "title": "Health Score"},
        ...         {"widget": "TeamActivity", "data": {"limit": 5}, "title": "Recent Activity"},
        ...     ],
        ...     columns=2,
        ...     gap=4,
        ... )
    """
    layout_id = f"layout-{uuid.uuid4().hex[:8]}"

    slots = []
    for i, widget_def in enumerate(widgets):
        slot_id = f"slot-grid{i}-{uuid.uuid4().hex[:8]}"
        slots.append({
            "id": slot_id,
            "widget": widget_def.get("widget", "Empty"),
            "data": widget_def.get("data", {}),
            "title": widget_def.get("title"),
        })

    return {
        "id": layout_id,
        "type": "grid",
        "config": {
            "type": "grid",
            "columns": columns,
            "gap": gap,
            "minItemWidth": min_item_width,
        },
        "slots": slots,
        "metadata": {
            "createdAt": int(time.time() * 1000),
            "agentId": "dashboard_gateway",
        },
    }


# =============================================================================
# LAYOUT SELECTION
# =============================================================================


def select_layout_for_task(
    task_type: str,
    item_count: int = 1,
    context: Optional[Dict[str, Any]] = None,
) -> LayoutType:
    """
    Select appropriate layout based on task type and complexity.

    This function implements intelligent layout selection logic to
    help agents choose the best layout for a given task.

    Args:
        task_type: Type of task being performed:
                   - "compare": Comparison between items
                   - "setup", "onboard", "configure": Multi-step flows
                   - "overview": High-level dashboard view
                   - "detail": Detailed single-item view
        item_count: Number of items to display
        context: Optional additional context for selection

    Returns:
        Recommended layout type

    Layout Selection Logic:
        | Task Type | Item Count | Layout  |
        |-----------|------------|---------|
        | compare   | 2          | split   |
        | setup     | any        | wizard  |
        | onboard   | any        | wizard  |
        | configure | any        | wizard  |
        | overview  | > 2        | grid    |
        | detail    | 1          | single  |
        | default   | > 1        | grid    |
        | default   | 1          | single  |

    Example:
        >>> select_layout_for_task("compare", item_count=2)
        'split'
        >>> select_layout_for_task("setup")
        'wizard'
        >>> select_layout_for_task("overview", item_count=5)
        'grid'
    """
    task_lower = task_type.lower().strip()

    # Comparison tasks -> split layout
    if task_lower == "compare" and item_count == 2:
        return "split"

    # Multi-step flows -> wizard layout
    if task_lower in ("setup", "onboard", "configure", "wizard", "flow"):
        return "wizard"

    # Overview with multiple items -> grid layout
    if task_lower == "overview" and item_count > 2:
        return "grid"

    # Detail view -> single layout
    if task_lower == "detail":
        return "single"

    # Default logic based on item count
    if item_count > 1:
        return "grid"

    return "single"


# =============================================================================
# TOOL DEFINITIONS
# =============================================================================

# Tool schema for CopilotKit registration
LAYOUT_TOOLS = [
    {
        "name": "render_generative_layout",
        "description": (
            "Render a dynamic layout on the dashboard. Use this to compose "
            "UI layouts based on the task at hand. Choose from single (detail view), "
            "split (comparison), wizard (multi-step), or grid (overview) layouts."
        ),
        "parameters": {
            "layout_type": {
                "type": "string",
                "description": "Layout type: 'single', 'split', 'wizard', or 'grid'",
                "enum": ["single", "split", "wizard", "grid"],
                "required": True,
            },
            "config": {
                "type": "object",
                "description": "Layout-specific configuration",
                "required": True,
            },
            "slots": {
                "type": "array",
                "description": "Array of slot definitions with widget, data, and optional title",
                "required": True,
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "widget": {"type": "string"},
                        "data": {"type": "object"},
                        "title": {"type": "string"},
                    },
                },
            },
            "metadata": {
                "type": "object",
                "description": "Optional layout metadata (title, description)",
                "required": False,
            },
        },
    }
]


def get_layout_tools() -> List:
    """
    Get all layout tool functions.

    Returns:
        List of tool functions for agent registration
    """
    return [
        create_single_layout,
        create_split_layout,
        create_wizard_layout,
        create_grid_layout,
        select_layout_for_task,
    ]
