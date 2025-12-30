"""
Frontend Context Type Models

Pydantic models for validating frontend context received via AG-UI.
These models mirror the TypeScript interfaces from DM-06.1 and use
Field aliases for camelCase compatibility.

@see docs/modules/bm-dm/epics/epic-dm-06-tech-spec.md
Epic: DM-06 | Story: DM-06.2
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# =============================================================================
# INDIVIDUAL CONTEXT MODELS
# =============================================================================


class ProjectContextModel(BaseModel):
    """
    Project context from frontend.

    Represents the currently active project the user is viewing.
    Transformed from TypeScript ProjectContext - team array becomes teamSize.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique project identifier")
    name: str = Field(..., description="Project display name")
    status: str = Field(
        ..., description="Project status: 'active' | 'on-hold' | 'completed'"
    )
    current_phase: Optional[str] = Field(
        None, alias="currentPhase", description="Current project phase name"
    )
    health_score: Optional[int] = Field(
        None,
        alias="healthScore",
        ge=0,
        le=100,
        description="Project health score (0-100)",
    )
    progress: int = Field(
        0, ge=0, le=100, description="Project progress percentage (0-100)"
    )
    tasks_total: int = Field(
        0, ge=0, alias="tasksTotal", description="Total number of tasks"
    )
    tasks_completed: int = Field(
        0, ge=0, alias="tasksCompleted", description="Number of completed tasks"
    )
    team_size: int = Field(
        0, ge=0, alias="teamSize", description="Number of team members"
    )


class SelectionContextModel(BaseModel):
    """
    Selection context from frontend.

    Represents currently selected items in the UI (tasks, documents, etc.).
    """

    model_config = ConfigDict(populate_by_name=True)

    type: str = Field(
        ..., description="Selection type: 'task' | 'project' | 'document' | 'none'"
    )
    ids: List[str] = Field(
        default_factory=list, description="IDs of selected items"
    )
    count: int = Field(0, ge=0, description="Number of selected items")
    summary: Optional[str] = Field(
        None, description="Human-readable selection summary"
    )


class RecentActionModel(BaseModel):
    """
    A single recent user action.
    """

    model_config = ConfigDict(populate_by_name=True)

    action: str = Field(..., description="Action type (e.g., 'create_task')")
    target: str = Field(..., description="Action target (e.g., task name)")
    timestamp: int = Field(..., description="Action timestamp (Unix ms)")


class ActivityContextModel(BaseModel):
    """
    Activity context from frontend.

    Tracks user activity including recent actions and navigation.
    Transformed from TypeScript - sessionDuration becomes sessionMinutes.
    """

    model_config = ConfigDict(populate_by_name=True)

    recent_actions: List[RecentActionModel] = Field(
        default_factory=list,
        alias="recentActions",
        description="Recent user actions (limited to 10)",
    )
    current_page: str = Field(
        "unknown", alias="currentPage", description="Current page path"
    )
    session_minutes: int = Field(
        0, ge=0, alias="sessionMinutes", description="Session duration in minutes"
    )


class DocumentContextModel(BaseModel):
    """
    Document context from frontend.

    Represents the document currently being edited.
    Transformed from TypeScript - cursorPosition becomes cursorLine,
    selectedText becomes hasSelection + selectionPreview.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique document identifier")
    title: str = Field(..., description="Document title")
    type: str = Field(
        ..., description="Document type: 'markdown' | 'rich-text' | 'code'"
    )
    word_count: int = Field(
        0, ge=0, alias="wordCount", description="Document word count"
    )
    last_edited: int = Field(
        0, alias="lastEdited", description="Last edit timestamp (Unix ms)"
    )
    cursor_line: Optional[int] = Field(
        None, ge=1, alias="cursorLine", description="Current cursor line number"
    )
    has_selection: bool = Field(
        False, alias="hasSelection", description="Whether text is selected"
    )
    selection_preview: Optional[str] = Field(
        None,
        alias="selectionPreview",
        max_length=100,
        description="Preview of selected text (truncated to 100 chars)",
    )


class ViewContextModel(BaseModel):
    """
    View context from frontend.

    Represents current view configuration (list, board, calendar, etc.).
    """

    model_config = ConfigDict(populate_by_name=True)

    type: str = Field(
        ..., description="View type: 'list' | 'board' | 'calendar' | 'gantt'"
    )
    filters: Dict[str, Any] = Field(
        default_factory=dict, description="Applied filter configuration"
    )
    sort_by: Optional[str] = Field(
        None, alias="sortBy", description="Sort field name"
    )
    group_by: Optional[str] = Field(
        None, alias="groupBy", description="Group field name"
    )
    visible_count: int = Field(
        0, ge=0, alias="visibleCount", description="Number of visible items"
    )
    total_count: int = Field(
        0, ge=0, alias="totalCount", description="Total number of items"
    )


# =============================================================================
# BUNDLE MODEL
# =============================================================================


class FrontendContext(BaseModel):
    """
    Complete frontend context bundle.

    Combines all context types into a single model for agent consumption.
    This is the primary model used by ContextAwareInstructions.
    """

    model_config = ConfigDict(populate_by_name=True)

    project: Optional[ProjectContextModel] = Field(
        None, description="Active project context"
    )
    selection: Optional[SelectionContextModel] = Field(
        None, description="Current selection context"
    )
    activity: Optional[ActivityContextModel] = Field(
        None, description="User activity context"
    )
    document: Optional[DocumentContextModel] = Field(
        None, description="Document editing context"
    )
    view: Optional[ViewContextModel] = Field(
        None, description="View configuration context"
    )
    workspace_id: Optional[str] = Field(
        None, alias="workspaceId", description="Current workspace ID"
    )
    user_id: Optional[str] = Field(
        None, alias="userId", description="Current user ID"
    )

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert to dictionary for instruction building.

        Returns a dictionary with each context type serialized to its
        camelCase representation for consistent formatting.

        Returns:
            Dictionary with context data suitable for instruction building
        """
        return {
            "project": (
                self.project.model_dump(by_alias=True) if self.project else None
            ),
            "selection": (
                self.selection.model_dump(by_alias=True) if self.selection else None
            ),
            "activity": (
                self.activity.model_dump(by_alias=True) if self.activity else None
            ),
            "document": (
                self.document.model_dump(by_alias=True) if self.document else None
            ),
            "view": self.view.model_dump(by_alias=True) if self.view else None,
            "workspaceId": self.workspace_id,
            "userId": self.user_id,
        }
