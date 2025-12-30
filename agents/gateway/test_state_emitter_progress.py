"""
Unit Tests for DashboardStateEmitter Task Progress Methods

Tests the task progress tracking functionality added in DM-05.4.

@see docs/modules/bm-dm/stories/dm-05-4-realtime-progress-streaming.md
Epic: DM-05 | Story: DM-05.4
"""

import asyncio
import time
from typing import Any, Dict, List

import pytest

# Add agents directory to path for imports
import sys
from pathlib import Path

agents_dir = Path(__file__).parent.parent
sys.path.insert(0, str(agents_dir))

from gateway.state_emitter import DashboardStateEmitter
from schemas.dashboard_state import TaskStatus, TaskStepStatus


class TestDashboardStateEmitterProgress:
    """Tests for task progress methods in DashboardStateEmitter."""

    @pytest.fixture
    def emitter_and_emissions(self):
        """Create an emitter and capture emissions."""
        emissions: List[Dict[str, Any]] = []

        def on_state_change(state: Dict[str, Any]) -> None:
            emissions.append(state.copy())

        emitter = DashboardStateEmitter(
            on_state_change=on_state_change,
            workspace_id="ws_test",
            user_id="user_test",
        )
        return emitter, emissions

    @pytest.mark.asyncio
    async def test_start_task_creates_pending_steps(self, emitter_and_emissions):
        """start_task creates a task with pending steps."""
        emitter, emissions = emitter_and_emissions

        await emitter.start_task(
            task_id="task_1",
            task_name="Research Competitors",
            steps=["Gather data", "Analyze", "Report"],
        )

        assert len(emitter.state.active_tasks) == 1
        task = emitter.state.active_tasks[0]
        assert task.task_id == "task_1"
        assert task.task_name == "Research Competitors"
        assert task.status == TaskStatus.RUNNING
        assert task.total_steps == 3
        assert len(task.steps) == 3
        assert all(s.status == TaskStepStatus.PENDING for s in task.steps)
        assert task.started_at is not None

    @pytest.mark.asyncio
    async def test_start_task_with_estimated_duration(self, emitter_and_emissions):
        """start_task accepts estimated duration."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task(
            task_id="task_1",
            task_name="Test",
            steps=["Step 1"],
            estimated_duration_ms=10000,
        )

        task = emitter.state.active_tasks[0]
        assert task.estimated_completion_ms == 10000

    @pytest.mark.asyncio
    async def test_start_task_respects_max_limit(self, emitter_and_emissions):
        """start_task respects MAX_ACTIVE_TASKS limit."""
        emitter, _ = emitter_and_emissions

        # Start 10 tasks (the limit)
        for i in range(10):
            await emitter.start_task(
                task_id=f"task_{i}",
                task_name=f"Task {i}",
                steps=["Step 1"],
            )

        assert len(emitter.state.active_tasks) == 10

        # Try to start an 11th task - should be ignored
        await emitter.start_task(
            task_id="task_11",
            task_name="Task 11",
            steps=["Step 1"],
        )

        assert len(emitter.state.active_tasks) == 10
        assert all(t.task_id != "task_11" for t in emitter.state.active_tasks)

    @pytest.mark.asyncio
    async def test_update_task_step_sets_running(self, emitter_and_emissions):
        """update_task_step marks step as running."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1", "Step 2"])
        await emitter.update_task_step("task_1", 0, "running")

        task = emitter.state.active_tasks[0]
        assert task.steps[0].status == TaskStepStatus.RUNNING
        assert task.steps[0].started_at is not None
        assert task.current_step == 0

    @pytest.mark.asyncio
    async def test_update_task_step_with_progress(self, emitter_and_emissions):
        """update_task_step sets sub-step progress."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        await emitter.update_task_step("task_1", 0, "running", progress=50)

        task = emitter.state.active_tasks[0]
        assert task.steps[0].progress == 50

    @pytest.mark.asyncio
    async def test_update_task_step_clamps_progress(self, emitter_and_emissions):
        """update_task_step clamps progress to 0-100."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        await emitter.update_task_step("task_1", 0, "running", progress=150)

        task = emitter.state.active_tasks[0]
        assert task.steps[0].progress == 100

        await emitter.update_task_step("task_1", 0, "running", progress=-10)
        assert task.steps[0].progress == 0

    @pytest.mark.asyncio
    async def test_update_task_step_completed_sets_timestamp(self, emitter_and_emissions):
        """update_task_step sets completed_at when status is completed."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        await emitter.update_task_step("task_1", 0, "running")
        await emitter.update_task_step("task_1", 0, "completed")

        task = emitter.state.active_tasks[0]
        assert task.steps[0].status == TaskStepStatus.COMPLETED
        assert task.steps[0].completed_at is not None

    @pytest.mark.asyncio
    async def test_update_task_step_invalid_index(self, emitter_and_emissions):
        """update_task_step handles invalid step index gracefully."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])

        # Should not raise, just log warning
        await emitter.update_task_step("task_1", 5, "running")

        # Step 0 should still be pending
        task = emitter.state.active_tasks[0]
        assert task.steps[0].status == TaskStepStatus.PENDING

    @pytest.mark.asyncio
    async def test_update_task_step_invalid_task_id(self, emitter_and_emissions):
        """update_task_step handles invalid task ID gracefully."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])

        # Should not raise, just log warning
        await emitter.update_task_step("nonexistent", 0, "running")

        # Original task should be unchanged
        task = emitter.state.active_tasks[0]
        assert task.steps[0].status == TaskStepStatus.PENDING

    @pytest.mark.asyncio
    async def test_complete_task_marks_all_steps_done(self, emitter_and_emissions):
        """complete_task marks task and all steps as completed."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1", "Step 2", "Step 3"])
        await emitter.update_task_step("task_1", 0, "completed")
        await emitter.update_task_step("task_1", 1, "running")
        await emitter.complete_task("task_1")

        task = emitter.state.active_tasks[0]
        assert task.status == TaskStatus.COMPLETED
        assert all(s.status == TaskStepStatus.COMPLETED for s in task.steps)
        assert all(s.completed_at is not None for s in task.steps)

    @pytest.mark.asyncio
    async def test_complete_task_invalid_task_id(self, emitter_and_emissions):
        """complete_task handles invalid task ID gracefully."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])

        # Should not raise
        await emitter.complete_task("nonexistent")

        # Original task should still be running
        task = emitter.state.active_tasks[0]
        assert task.status == TaskStatus.RUNNING

    @pytest.mark.asyncio
    async def test_fail_task_sets_error(self, emitter_and_emissions):
        """fail_task marks task as failed with error."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1", "Step 2"])
        await emitter.update_task_step("task_1", 0, "completed")
        await emitter.update_task_step("task_1", 1, "running")
        await emitter.fail_task("task_1", "Network timeout")

        task = emitter.state.active_tasks[0]
        assert task.status == TaskStatus.FAILED
        assert task.error == "Network timeout"
        # Running step should be marked as failed
        assert task.steps[1].status == TaskStepStatus.FAILED

    @pytest.mark.asyncio
    async def test_cancel_task_marks_cancelled(self, emitter_and_emissions):
        """cancel_task marks task as cancelled."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1", "Step 2"])
        await emitter.update_task_step("task_1", 0, "running")
        await emitter.cancel_task("task_1")

        task = emitter.state.active_tasks[0]
        assert task.status == TaskStatus.CANCELLED
        # Running step should be marked as pending (stopped)
        assert task.steps[0].status == TaskStepStatus.PENDING

    @pytest.mark.asyncio
    async def test_progress_emits_immediately(self, emitter_and_emissions):
        """Progress updates emit immediately without debounce."""
        emitter, emissions = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])

        # Should have emitted immediately
        assert len(emissions) >= 1
        # Check the emission contains activeTasks
        assert "activeTasks" in emissions[-1]

    @pytest.mark.asyncio
    async def test_remove_task(self, emitter_and_emissions):
        """remove_task removes task from active_tasks."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        assert len(emitter.state.active_tasks) == 1

        emitter.remove_task("task_1")

        # Give time for debounced emit
        await asyncio.sleep(0.15)

        assert len(emitter.state.active_tasks) == 0

    @pytest.mark.asyncio
    async def test_cleanup_removes_old_completed_tasks(self, emitter_and_emissions):
        """_cleanup_completed_tasks removes old terminal tasks."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        await emitter.complete_task("task_1")

        # Manually set completed_at to be old enough for cleanup
        emitter.state.active_tasks[0].completed_at = int(time.time() * 1000) - 400000

        # Start a new task which triggers cleanup
        await emitter.start_task("task_2", "Test 2", ["Step 1"])

        # Old completed task should be removed
        assert len(emitter.state.active_tasks) == 1
        assert emitter.state.active_tasks[0].task_id == "task_2"

    @pytest.mark.asyncio
    async def test_cleanup_keeps_recent_completed_tasks(self, emitter_and_emissions):
        """_cleanup_completed_tasks keeps recently completed tasks."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])
        await emitter.complete_task("task_1")

        # Start another task
        await emitter.start_task("task_2", "Test 2", ["Step 1"])

        # Recently completed task should still be there
        assert len(emitter.state.active_tasks) == 2

    @pytest.mark.asyncio
    async def test_find_task(self, emitter_and_emissions):
        """_find_task returns correct task or None."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test", ["Step 1"])

        found = emitter._find_task("task_1")
        assert found is not None
        assert found.task_id == "task_1"

        not_found = emitter._find_task("nonexistent")
        assert not_found is None

    @pytest.mark.asyncio
    async def test_state_to_frontend_dict_includes_tasks(self, emitter_and_emissions):
        """to_frontend_dict includes activeTasks with camelCase keys."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Test Task", ["Step 1"])
        await emitter.update_task_step("task_1", 0, "running", progress=50)

        state_dict = emitter.state.to_frontend_dict()

        assert "activeTasks" in state_dict
        assert len(state_dict["activeTasks"]) == 1
        task = state_dict["activeTasks"][0]
        assert task["taskId"] == "task_1"
        assert task["taskName"] == "Test Task"
        assert task["currentStep"] == 0
        assert task["totalSteps"] == 1
        assert len(task["steps"]) == 1
        assert task["steps"][0]["status"] == "running"
        assert task["steps"][0]["progress"] == 50


class TestMultipleTaskProgress:
    """Tests for managing multiple concurrent tasks."""

    @pytest.fixture
    def emitter_and_emissions(self):
        """Create an emitter and capture emissions."""
        emissions: List[Dict[str, Any]] = []

        def on_state_change(state: Dict[str, Any]) -> None:
            emissions.append(state.copy())

        emitter = DashboardStateEmitter(
            on_state_change=on_state_change,
            workspace_id="ws_test",
        )
        return emitter, emissions

    @pytest.mark.asyncio
    async def test_multiple_concurrent_tasks(self, emitter_and_emissions):
        """Multiple tasks can run concurrently."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Task 1", ["Step A", "Step B"])
        await emitter.start_task("task_2", "Task 2", ["Step X", "Step Y", "Step Z"])

        assert len(emitter.state.active_tasks) == 2

        # Update different tasks
        await emitter.update_task_step("task_1", 0, "running")
        await emitter.update_task_step("task_2", 0, "completed")
        await emitter.update_task_step("task_2", 1, "running")

        task1 = emitter._find_task("task_1")
        task2 = emitter._find_task("task_2")

        assert task1.steps[0].status == TaskStepStatus.RUNNING
        assert task2.steps[0].status == TaskStepStatus.COMPLETED
        assert task2.steps[1].status == TaskStepStatus.RUNNING

    @pytest.mark.asyncio
    async def test_complete_one_task_others_unaffected(self, emitter_and_emissions):
        """Completing one task doesn't affect others."""
        emitter, _ = emitter_and_emissions

        await emitter.start_task("task_1", "Task 1", ["Step 1"])
        await emitter.start_task("task_2", "Task 2", ["Step 1"])

        await emitter.complete_task("task_1")

        task1 = emitter._find_task("task_1")
        task2 = emitter._find_task("task_2")

        assert task1.status == TaskStatus.COMPLETED
        assert task2.status == TaskStatus.RUNNING
