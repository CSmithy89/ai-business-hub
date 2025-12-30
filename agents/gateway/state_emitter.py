"""
Dashboard Gateway State Emitter

Manages agent state and emits updates via AG-UI protocol.
The emitted state is automatically synchronized to the frontend
via CopilotKit's useCoAgentStateRender.

This module provides:
- DashboardStateEmitter class for managing and emitting agent state
- Debouncing to prevent excessive frontend updates (100ms default)
- Widget-specific state setters (project status, metrics, activity, alerts)
- Bulk updates from parallel agent gather operations
- Response parsers for Navi, Pulse, Herald results

@see docs/modules/bm-dm/epics/epic-dm-04-tech-spec.md
Epic: DM-04 | Story: DM-04.3
"""

import asyncio
import logging
import time
import uuid
from typing import Any, Callable, Dict, List, Optional

from constants.dm_constants import DMConstants
from schemas.dashboard_state import (
    ActivityEntry,
    ActivityState,
    AlertEntry,
    AlertType,
    DashboardState,
    LoadingState,
    MetricEntry,
    MetricsState,
    ProjectStatus,
    ProjectStatusState,
    # DM-05.4: Task progress types
    TaskProgress,
    TaskStep,
    TaskStatus,
    TaskStepStatus,
)

logger = logging.getLogger(__name__)


class DashboardStateEmitter:
    """
    Manages dashboard state and emits updates to the frontend.

    The emitter maintains the current state and provides methods
    to update individual widgets. Each update triggers a state
    emission via the agent's state callback.

    State emissions are debounced by default (100ms) to prevent
    flooding the frontend with rapid updates. Loading states
    bypass debouncing for immediate UI feedback.

    Attributes:
        state: Read-only property returning current DashboardState

    Example:
        >>> def on_state_change(state_dict):
        ...     # Send to AG-UI stream
        ...     emit_to_frontend(state_dict)
        ...
        >>> emitter = DashboardStateEmitter(
        ...     on_state_change=on_state_change,
        ...     workspace_id="ws_123",
        ...     user_id="user_456",
        ... )
        >>> await emitter.set_loading(True, ["navi", "pulse"])
        >>> await emitter.set_project_status(
        ...     project_id="proj_alpha",
        ...     name="Project Alpha",
        ...     status=ProjectStatus.ON_TRACK,
        ...     progress=75,
        ... )
    """

    def __init__(
        self,
        on_state_change: Callable[[Dict[str, Any]], None],
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> None:
        """
        Initialize state emitter.

        Args:
            on_state_change: Callback to emit state to AG-UI. Called with
                             a camelCase dictionary representation of the state.
            workspace_id: Current workspace context for multi-tenant isolation.
            user_id: Current user context for personalization.
        """
        self._on_state_change = on_state_change
        self._state = DashboardState.create_initial(
            workspace_id=workspace_id,
            user_id=user_id,
        )
        self._debounce_task: Optional[asyncio.Task] = None
        self._pending_update = False
        self._lock = asyncio.Lock()

        logger.debug(
            f"DashboardStateEmitter initialized: workspace={workspace_id}, user={user_id}"
        )

    async def cancel_pending(self) -> None:
        """
        Cancel any pending debounced emissions.

        Call this during cleanup to prevent orphaned tasks.
        """
        if self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()
            try:
                await self._debounce_task
            except asyncio.CancelledError:
                pass
        self._debounce_task = None
        self._pending_update = False

    @property
    def state(self) -> DashboardState:
        """
        Get current state (read-only).

        Returns:
            The current DashboardState object.
        """
        return self._state

    async def _emit_debounced(self) -> None:
        """
        Emit state with debouncing to prevent flooding.

        Waits for the debounce interval (100ms by default) before
        emitting. If another update arrives during this wait,
        the pending flag ensures the latest state is emitted.
        """
        await asyncio.sleep(DMConstants.STATE.UPDATE_DEBOUNCE_MS / 1000)

        async with self._lock:
            if self._pending_update:
                self._pending_update = False
                self._emit()

    def _emit(self) -> None:
        """
        Emit current state to frontend.

        Converts state to frontend-compatible camelCase dict
        and invokes the state change callback.
        Validates state size before emission to prevent oversized payloads.
        """
        import json

        state_dict = self._state.to_frontend_dict()

        # Validate state size before emission
        state_json = json.dumps(state_dict)
        state_size = len(state_json.encode("utf-8"))
        if state_size > DMConstants.STATE.MAX_STATE_SIZE_BYTES:
            logger.warning(
                f"State size ({state_size} bytes) exceeds max "
                f"({DMConstants.STATE.MAX_STATE_SIZE_BYTES} bytes), truncating alerts"
            )
            # Truncate alerts in output only (don't mutate internal state)
            if state_dict.get("widgets", {}).get("alerts"):
                state_dict["widgets"]["alerts"] = state_dict["widgets"]["alerts"][:10]
                # Re-check size after truncation
                state_json = json.dumps(state_dict)
                state_size = len(state_json.encode("utf-8"))
                if state_size > DMConstants.STATE.MAX_STATE_SIZE_BYTES:
                    logger.error(
                        f"State still exceeds max after truncation ({state_size} bytes)"
                    )

        logger.debug(f"Emitting dashboard state: timestamp={self._state.timestamp}")
        self._on_state_change(state_dict)

    def _schedule_emit(self) -> None:
        """
        Schedule a debounced state emission.

        Updates the timestamp and cancels any existing pending task before
        scheduling a new one. This ensures every call resets the debounce
        timer and the latest state is always emitted.
        """
        self._pending_update = True
        self._state.timestamp = int(time.time() * 1000)

        # Cancel existing task to reset debounce timer on each call
        if self._debounce_task and not self._debounce_task.done():
            self._debounce_task.cancel()

        self._debounce_task = asyncio.create_task(self._emit_debounced())

    async def emit_now(self) -> None:
        """
        Force immediate state emission (bypass debounce).

        Use this for time-sensitive updates like loading states
        where immediate UI feedback is important.
        """
        async with self._lock:
            # Cancel any pending debounced emission
            if self._debounce_task and not self._debounce_task.done():
                self._debounce_task.cancel()
                try:
                    await self._debounce_task
                except asyncio.CancelledError:
                    pass
            self._pending_update = False
            self._state.timestamp = int(time.time() * 1000)
            self._emit()

    # =========================================================================
    # LOADING STATE
    # =========================================================================

    async def set_loading(
        self,
        is_loading: bool,
        agents: Optional[List[str]] = None,
    ) -> None:
        """
        Update loading state.

        Loading state changes emit immediately (bypass debounce)
        to provide instant UI feedback.

        Args:
            is_loading: Whether loading is in progress.
            agents: List of agents currently being queried.
        """
        self._state.loading = LoadingState(
            is_loading=is_loading,
            loading_agents=agents or [],
            started_at=int(time.time() * 1000) if is_loading else None,
        )
        await self.emit_now()  # Loading state emits immediately

    # =========================================================================
    # ERROR STATE
    # =========================================================================

    async def set_error(self, agent_id: str, error: Optional[str]) -> None:
        """
        Set or clear an agent error.

        Args:
            agent_id: Agent that experienced the error.
            error: Error message, or None to clear the error.
        """
        if error:
            self._state.errors[agent_id] = error
        elif agent_id in self._state.errors:
            del self._state.errors[agent_id]
        self._schedule_emit()

    async def clear_errors(self) -> None:
        """Clear all errors."""
        self._state.errors = {}
        self._schedule_emit()

    # =========================================================================
    # WIDGET STATE
    # =========================================================================

    async def set_active_project(self, project_id: Optional[str]) -> None:
        """
        Set the active/focused project.

        Args:
            project_id: The project to set as active, or None to clear.
        """
        self._state.active_project = project_id
        self._schedule_emit()

    async def set_project_status(
        self,
        project_id: str,
        name: str,
        status: ProjectStatus,
        progress: int,
        tasks_completed: int = 0,
        tasks_total: int = 0,
        summary: Optional[str] = None,
    ) -> None:
        """
        Update project status widget state.

        Args:
            project_id: Project identifier.
            name: Project display name.
            status: Current status (on-track, at-risk, behind, completed).
            progress: Progress percentage (0-100).
            tasks_completed: Number of completed tasks.
            tasks_total: Total number of tasks.
            summary: Optional text summary.
        """
        self._state.widgets.project_status = ProjectStatusState(
            project_id=project_id,
            name=name,
            status=status,
            progress=progress,
            tasks_completed=tasks_completed,
            tasks_total=tasks_total,
            last_updated=int(time.time() * 1000),
            summary=summary,
        )
        self._schedule_emit()

    async def set_metrics(
        self,
        metrics: List[Dict[str, Any]],
        title: str = "Key Metrics",
        period: Optional[str] = None,
    ) -> None:
        """
        Update metrics widget state.

        Args:
            metrics: List of metric entries. Each entry should have:
                     - id: Unique metric identifier
                     - label: Display label
                     - value: Numeric or string value
                     - unit: Optional unit suffix
                     - trend: Optional 'up', 'down', or 'neutral'
                     - change: Optional change description
                     - changePercent: Optional numeric change percentage
            title: Widget title.
            period: Time period description (e.g., "Last 7 days").
        """
        metric_entries = [MetricEntry(**m) for m in metrics]
        self._state.widgets.metrics = MetricsState(
            title=title,
            metrics=metric_entries,
            period=period,
            last_updated=int(time.time() * 1000),
        )
        self._schedule_emit()

    async def set_activity(
        self,
        activities: List[Dict[str, Any]],
        has_more: bool = False,
    ) -> None:
        """
        Update activity widget state.

        Activities are capped at MAX_ACTIVITIES to prevent state bloat.

        Args:
            activities: List of activity entries. Each entry should have:
                        - id: Unique activity identifier
                        - user: User who performed the action
                        - action: Action description
                        - timestamp: Unix timestamp in ms
                        - userAvatar: Optional avatar URL
                        - target: Optional target of the action
                        - projectId: Optional related project ID
            has_more: Whether there are more activities available.
        """
        # Cap activities to prevent state bloat
        capped_activities = activities[: DMConstants.STATE.MAX_ACTIVITIES]
        activity_entries = [ActivityEntry(**a) for a in capped_activities]

        self._state.widgets.activity = ActivityState(
            activities=activity_entries,
            has_more=has_more or len(activities) > DMConstants.STATE.MAX_ACTIVITIES,
            last_updated=int(time.time() * 1000),
        )
        self._schedule_emit()

    async def add_alert(
        self,
        alert_type: AlertType,
        title: str,
        message: str,
        alert_id: Optional[str] = None,
        dismissable: bool = True,
        action_label: Optional[str] = None,
        action_url: Optional[str] = None,
    ) -> str:
        """
        Add an alert to the state.

        Alerts are prepended (newest first) and capped at MAX_ALERTS.

        Args:
            alert_type: Alert severity type (error, warning, info, success).
            title: Alert title.
            message: Alert message body.
            alert_id: Optional custom ID (auto-generated if not provided).
            dismissable: Whether the alert can be dismissed.
            action_label: Optional action button label.
            action_url: Optional action URL.

        Returns:
            The alert ID (generated or provided).
        """
        aid = alert_id or str(uuid.uuid4())
        alert = AlertEntry(
            id=aid,
            type=alert_type,
            title=title,
            message=message,
            timestamp=int(time.time() * 1000),
            dismissable=dismissable,
            action_label=action_label,
            action_url=action_url,
        )

        # Prepend alert and limit total to MAX_ALERTS
        self._state.widgets.alerts = [alert, *self._state.widgets.alerts][
            : DMConstants.STATE.MAX_ALERTS
        ]
        self._schedule_emit()

        return aid

    async def dismiss_alert(self, alert_id: str) -> None:
        """
        Mark an alert as dismissed.

        Args:
            alert_id: The ID of the alert to dismiss.
        """
        for alert in self._state.widgets.alerts:
            if alert.id == alert_id:
                alert.dismissed = True
                break
        self._schedule_emit()

    async def clear_alerts(self) -> None:
        """Clear all alerts."""
        self._state.widgets.alerts = []
        self._schedule_emit()

    # =========================================================================
    # BULK UPDATES
    # =========================================================================

    async def update_from_gather(
        self,
        navi_result: Optional[Dict[str, Any]],
        pulse_result: Optional[Dict[str, Any]],
        herald_result: Optional[Dict[str, Any]],
        errors: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Update state from gather_dashboard_data results.

        Efficiently updates all widgets from a parallel agent gather.
        This method emits immediately after processing all results.

        Args:
            navi_result: Result from Navi agent (project status).
            pulse_result: Result from Pulse agent (health metrics).
            herald_result: Result from Herald agent (recent activity).
            errors: Any errors from failed agent calls (agent_id -> message).
        """
        # Update errors
        if errors:
            self._state.errors = errors
        else:
            self._state.errors = {}

        # Update project status from Navi
        if navi_result:
            parsed = self._parse_navi_response(navi_result)
            if parsed:
                self._state.widgets.project_status = parsed

        # Update metrics from Pulse
        if pulse_result:
            parsed = self._parse_pulse_response(pulse_result)
            if parsed:
                self._state.widgets.metrics = parsed

        # Update activity from Herald
        if herald_result:
            parsed = self._parse_herald_response(herald_result)
            if parsed:
                self._state.widgets.activity = parsed

        # Emit all changes at once (immediate, no debounce)
        await self.emit_now()

    def _parse_navi_response(
        self, result: Dict[str, Any]
    ) -> Optional[ProjectStatusState]:
        """
        Parse Navi response into ProjectStatusState.

        Args:
            result: Raw result from Navi agent call.

        Returns:
            Parsed ProjectStatusState or None if parsing fails.
        """
        try:
            # Try to extract from artifacts first (structured data)
            artifacts = result.get("artifacts", [])
            if artifacts and isinstance(artifacts[0], dict):
                data = artifacts[0]
                return ProjectStatusState(
                    project_id=data.get("project_id", "unknown"),
                    name=data.get("name", "Project"),
                    status=ProjectStatus(data.get("status", "on-track")),
                    progress=int(data.get("progress", 0)),
                    tasks_completed=int(data.get("tasks_completed", 0)),
                    tasks_total=int(data.get("tasks_total", 0)),
                    last_updated=int(time.time() * 1000),
                    summary=result.get("content"),
                )
            # Fallback: if we have content but no artifacts
            elif result.get("content"):
                return ProjectStatusState(
                    project_id=result.get("project_id", "unknown"),
                    name="Project",
                    status=ProjectStatus.ON_TRACK,
                    progress=0,
                    tasks_completed=0,
                    tasks_total=0,
                    last_updated=int(time.time() * 1000),
                    summary=result.get("content"),
                )
        except Exception as e:
            logger.warning(f"Failed to parse Navi response: {e}")
        return None

    def _parse_pulse_response(
        self, result: Dict[str, Any]
    ) -> Optional[MetricsState]:
        """
        Parse Pulse response into MetricsState.

        Args:
            result: Raw result from Pulse agent call.

        Returns:
            Parsed MetricsState or None if parsing fails.
        """
        try:
            # Try to extract metrics from various locations
            metrics_data = result.get("metrics", [])
            if not metrics_data:
                # Try artifacts
                artifacts = result.get("artifacts", [])
                if artifacts and isinstance(artifacts[0], dict):
                    metrics_data = artifacts[0].get("metrics", [])

            metrics = []
            for m in metrics_data:
                if isinstance(m, dict):
                    metrics.append(MetricEntry(**m))

            if metrics:
                return MetricsState(
                    title="Health Metrics",
                    metrics=metrics,
                    last_updated=int(time.time() * 1000),
                )
        except Exception as e:
            logger.warning(f"Failed to parse Pulse response: {e}")
        return None

    def _parse_herald_response(
        self, result: Dict[str, Any]
    ) -> Optional[ActivityState]:
        """
        Parse Herald response into ActivityState.

        Args:
            result: Raw result from Herald agent call.

        Returns:
            Parsed ActivityState or None if parsing fails.
        """
        try:
            # Try to extract activities from various locations
            activities_data = result.get("activities", [])
            if not activities_data:
                # Try artifacts
                artifacts = result.get("artifacts", [])
                if artifacts and isinstance(artifacts[0], dict):
                    activities_data = artifacts[0].get("activities", [])

            activities = []
            for a in activities_data:
                if isinstance(a, dict):
                    activities.append(ActivityEntry(**a))

            # Cap activities to prevent state bloat
            activities = activities[: DMConstants.STATE.MAX_ACTIVITIES]

            return ActivityState(
                activities=activities,
                has_more=len(activities_data) > DMConstants.STATE.MAX_ACTIVITIES,
                last_updated=int(time.time() * 1000),
            )
        except Exception as e:
            logger.warning(f"Failed to parse Herald response: {e}")
        return None

    # =========================================================================
    # TASK PROGRESS (DM-05.4)
    # =========================================================================

    async def start_task(
        self,
        task_id: str,
        task_name: str,
        steps: List[str],
        estimated_duration_ms: Optional[int] = None,
    ) -> None:
        """
        Start tracking a new long-running task.

        Creates a TaskProgress with pending steps and emits immediately
        (bypassing debounce for responsiveness).

        Args:
            task_id: Unique task identifier
            task_name: Human-readable task name
            steps: List of step names
            estimated_duration_ms: Optional estimated total duration
        """
        # Cleanup old completed tasks before adding new one
        self._cleanup_completed_tasks()

        # Check max active tasks limit
        if len(self._state.active_tasks) >= DMConstants.STATE.MAX_ACTIVE_TASKS:
            logger.warning(
                f"Max active tasks ({DMConstants.STATE.MAX_ACTIVE_TASKS}) reached, "
                f"cannot start task {task_id}"
            )
            return

        now = int(time.time() * 1000)
        task_steps = [
            TaskStep(index=i, name=name, status=TaskStepStatus.PENDING)
            for i, name in enumerate(steps)
        ]

        task = TaskProgress(
            task_id=task_id,
            task_name=task_name,
            status=TaskStatus.RUNNING,
            current_step=0,
            total_steps=len(steps),
            steps=task_steps,
            started_at=now,
            estimated_completion_ms=estimated_duration_ms,
        )

        self._state.active_tasks.append(task)
        logger.info(f"Task started: {task_id} ({task_name}) with {len(steps)} steps")
        await self.emit_now()  # Immediate emission for responsiveness

    async def update_task_step(
        self,
        task_id: str,
        step_index: int,
        status: str = "running",
        progress: Optional[int] = None,
    ) -> None:
        """
        Update progress of a task step.

        Args:
            task_id: Task identifier
            step_index: Step index to update
            status: Step status (pending, running, completed, failed)
            progress: Optional progress percentage for the step (0-100)
        """
        task = self._find_task(task_id)
        if not task:
            logger.warning(f"Task not found: {task_id}")
            return

        if step_index < 0 or step_index >= len(task.steps):
            logger.warning(f"Invalid step index {step_index} for task {task_id}")
            return

        step = task.steps[step_index]
        now = int(time.time() * 1000)

        # Update step status
        step.status = TaskStepStatus(status)

        # Set timestamps based on status
        if status == "running" and step.started_at is None:
            step.started_at = now
        elif status in ("completed", "failed"):
            step.completed_at = now

        # Set progress if provided
        if progress is not None:
            step.progress = min(100, max(0, progress))

        # Update current_step to highest running/completed step
        task.current_step = step_index

        logger.debug(f"Task {task_id} step {step_index} updated to {status}")
        await self.emit_now()  # Immediate emission for responsiveness

    async def complete_task(self, task_id: str) -> None:
        """
        Mark a task as completed successfully.

        Marks the task and all its steps as completed.
        """
        task = self._find_task(task_id)
        if not task:
            logger.warning(f"Task not found: {task_id}")
            return

        now = int(time.time() * 1000)
        task.status = TaskStatus.COMPLETED

        # Mark all steps as completed
        for step in task.steps:
            if step.status != TaskStepStatus.COMPLETED:
                step.status = TaskStepStatus.COMPLETED
                if step.completed_at is None:
                    step.completed_at = now

        logger.info(f"Task completed: {task_id}")
        await self.emit_now()  # Immediate emission for responsiveness

    async def fail_task(self, task_id: str, error: str) -> None:
        """
        Mark a task as failed with error message.

        Marks the task as failed and stores the error message.
        Any currently running step is also marked as failed.
        """
        task = self._find_task(task_id)
        if not task:
            logger.warning(f"Task not found: {task_id}")
            return

        now = int(time.time() * 1000)
        task.status = TaskStatus.FAILED
        task.error = error

        # Mark current running step as failed
        for step in task.steps:
            if step.status == TaskStepStatus.RUNNING:
                step.status = TaskStepStatus.FAILED
                step.completed_at = now
                break

        logger.warning(f"Task failed: {task_id} - {error}")
        await self.emit_now()  # Immediate emission for responsiveness

    async def cancel_task(self, task_id: str) -> None:
        """
        Cancel a running task.

        Marks the task as cancelled and stops any running steps.
        """
        task = self._find_task(task_id)
        if not task:
            logger.warning(f"Task not found: {task_id}")
            return

        now = int(time.time() * 1000)
        task.status = TaskStatus.CANCELLED

        # Stop any running steps (mark as pending, they weren't completed)
        for step in task.steps:
            if step.status == TaskStepStatus.RUNNING:
                step.status = TaskStepStatus.PENDING
                step.completed_at = now
                break

        logger.info(f"Task cancelled: {task_id}")
        await self.emit_now()  # Immediate emission for responsiveness

    def remove_task(self, task_id: str) -> None:
        """
        Remove a task from active tasks.

        Used for dismissing completed/failed/cancelled tasks from the UI.

        Args:
            task_id: Task identifier to remove
        """
        self._state.active_tasks = [
            t for t in self._state.active_tasks if t.task_id != task_id
        ]
        self._schedule_emit()

    def _find_task(self, task_id: str) -> Optional[TaskProgress]:
        """
        Find a task by ID in active_tasks.

        Args:
            task_id: Task identifier to find

        Returns:
            TaskProgress if found, None otherwise
        """
        for task in self._state.active_tasks:
            if task.task_id == task_id:
                return task
        return None

    def _cleanup_completed_tasks(
        self, retention_ms: Optional[int] = None
    ) -> None:
        """
        Remove tasks completed more than retention_ms ago.

        Called automatically when starting a new task.

        Args:
            retention_ms: Retention period in milliseconds.
                         Defaults to DMConstants.STATE.TASK_RETENTION_MS
        """
        if retention_ms is None:
            retention_ms = DMConstants.STATE.TASK_RETENTION_MS

        now = int(time.time() * 1000)
        terminal_statuses = (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED)

        self._state.active_tasks = [
            t for t in self._state.active_tasks
            if t.status not in terminal_statuses
            or (
                t.started_at is not None
                and now - t.started_at < retention_ms
            )
        ]


def create_state_emitter(
    on_state_change: Callable[[Dict[str, Any]], None],
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> DashboardStateEmitter:
    """
    Create a state emitter for the Dashboard Gateway agent.

    Factory function for creating a configured DashboardStateEmitter.

    Args:
        on_state_change: Callback to emit state to AG-UI.
        workspace_id: Current workspace context.
        user_id: Current user context.

    Returns:
        Configured DashboardStateEmitter instance.

    Example:
        >>> def emit_to_agui(state):
        ...     websocket.send(json.dumps(state))
        ...
        >>> emitter = create_state_emitter(
        ...     on_state_change=emit_to_agui,
        ...     workspace_id="ws_123",
        ...     user_id="user_456",
        ... )
    """
    return DashboardStateEmitter(
        on_state_change=on_state_change,
        workspace_id=workspace_id,
        user_id=user_id,
    )
