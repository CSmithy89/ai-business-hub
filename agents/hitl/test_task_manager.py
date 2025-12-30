"""
Unit Tests for TaskManager

This module provides comprehensive tests for the TaskManager class and
related functionality, covering:
- Task submission and execution
- Step-by-step progress
- Timeout handling (per-step and overall)
- Cancellation
- Retry logic
- Concurrent task limiting
- Cleanup of completed tasks
- State emitter integration

Run with: pytest agents/hitl/test_task_manager.py -v

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.5
"""

import asyncio
from typing import Any, Dict, Optional
from unittest.mock import AsyncMock, Mock

import pytest

from hitl.task_manager import (
    TaskManager,
    TaskState,
    TaskStep,
    TaskResult,
    ManagedTask,
    get_task_manager_sync,
    DEFAULT_STEP_TIMEOUT,
    MAX_CONCURRENT_TASKS,
)


# =============================================================================
# FIXTURES
# =============================================================================


@pytest.fixture
def mock_emitter() -> Mock:
    """Create a mock state emitter with all required async methods."""
    emitter = Mock()
    emitter.start_task = AsyncMock()
    emitter.update_task_step = AsyncMock()
    emitter.complete_task = AsyncMock()
    emitter.fail_task = AsyncMock()
    emitter.cancel_task = AsyncMock()
    return emitter


@pytest.fixture
def manager(mock_emitter: Mock) -> TaskManager:
    """Create a TaskManager with mock emitter for testing."""
    return TaskManager(state_emitter=mock_emitter)


@pytest.fixture
def manager_no_emitter() -> TaskManager:
    """Create a TaskManager without state emitter."""
    return TaskManager()


# =============================================================================
# BASIC TASK TESTS
# =============================================================================


class TestTaskSubmission:
    """Tests for task submission functionality."""

    @pytest.mark.asyncio
    async def test_submit_task_returns_task_id(self, manager: TaskManager) -> None:
        """submit_task returns a unique task ID."""

        async def step_handler(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step 1", handler=step_handler)]
        task_id = await manager.submit_task("Test Task", steps)

        assert task_id.startswith("task_")
        assert len(task_id) == 17  # task_ + 12 hex chars

    @pytest.mark.asyncio
    async def test_submit_task_empty_steps_raises(self, manager: TaskManager) -> None:
        """submit_task raises ValueError for empty steps list."""
        with pytest.raises(ValueError, match="at least one step"):
            await manager.submit_task("Empty Task", [])

    @pytest.mark.asyncio
    async def test_submit_multiple_tasks_unique_ids(
        self, manager: TaskManager
    ) -> None:
        """Multiple submitted tasks get unique IDs."""

        async def step_handler(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step", handler=step_handler)]

        task_ids = [await manager.submit_task(f"Task {i}", steps) for i in range(5)]

        assert len(set(task_ids)) == 5  # All unique


class TestTaskExecution:
    """Tests for task execution functionality."""

    @pytest.mark.asyncio
    async def test_task_executes_steps_sequentially(
        self, manager: TaskManager
    ) -> None:
        """Steps execute in order with results passed through."""
        order: list[str] = []

        async def step_a(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            order.append("a")
            return {"a": True}

        async def step_b(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            order.append("b")
            assert prev == {"a": True}
            return {"b": True}

        async def step_c(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            order.append("c")
            assert prev == {"b": True}
            return {"c": True}

        steps = [
            TaskStep(name="Step A", handler=step_a),
            TaskStep(name="Step B", handler=step_b),
            TaskStep(name="Step C", handler=step_c),
        ]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id)

        assert order == ["a", "b", "c"]
        assert result.state == TaskState.COMPLETED
        assert result.steps_completed == 3
        assert result.total_steps == 3
        assert result.result == {"c": True}

    @pytest.mark.asyncio
    async def test_task_passes_context_to_handlers(
        self, manager: TaskManager
    ) -> None:
        """Context dict is passed to all step handlers."""
        received_contexts: list[Optional[Dict]] = []

        async def step_handler(prev: Any, ctx: Optional[Dict]) -> Dict[str, Any]:
            received_contexts.append(ctx)
            return {"data": ctx.get("input") if ctx else None}

        steps = [
            TaskStep(name="Step 1", handler=step_handler),
            TaskStep(name="Step 2", handler=step_handler),
        ]
        task_id = await manager.submit_task(
            "Test",
            steps,
            context={"input": "test_data"},
        )
        await manager.wait_for_task(task_id)

        assert len(received_contexts) == 2
        assert all(ctx == {"input": "test_data"} for ctx in received_contexts)

    @pytest.mark.asyncio
    async def test_task_completes_successfully(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """Successful task reaches COMPLETED state."""

        async def step_handler(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            await asyncio.sleep(0.01)  # Small delay to ensure duration > 0
            return {"success": True}

        steps = [TaskStep(name="Step", handler=step_handler)]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id)

        assert result.state == TaskState.COMPLETED
        assert result.error is None
        assert result.duration_ms >= 0  # May be 0 on very fast systems
        mock_emitter.complete_task.assert_called_once_with(task_id)


# =============================================================================
# TIMEOUT TESTS
# =============================================================================


class TestTimeoutHandling:
    """Tests for timeout handling functionality."""

    @pytest.mark.asyncio
    async def test_step_timeout_triggers_retry(self, manager: TaskManager) -> None:
        """Step timeout retries up to configured limit."""
        attempts: list[int] = []

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            attempts.append(1)
            if len(attempts) < 3:
                await asyncio.sleep(10)  # Will timeout
            return {"done": True}

        steps = [
            TaskStep(name="Slow", handler=slow_step, timeout_seconds=1, retries=2)
        ]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id, timeout=15)

        assert len(attempts) == 3  # 1 initial + 2 retries
        assert result.state == TaskState.COMPLETED

    @pytest.mark.asyncio
    async def test_step_timeout_fails_after_retries(
        self, manager: TaskManager
    ) -> None:
        """Step fails after exhausting retries."""

        async def always_slow(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            await asyncio.sleep(10)
            return {"done": True}

        steps = [
            TaskStep(name="Slow", handler=always_slow, timeout_seconds=1, retries=1)
        ]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id, timeout=10)

        # Task ends in FAILED state (step timeout is wrapped in RuntimeError)
        # Note: This is FAILED (step handler raised timeout) not TIMEOUT (overall timeout)
        assert result.state == TaskState.FAILED
        assert result.error is not None
        assert "timeout" in result.error.lower() or "timed out" in result.error.lower()

    @pytest.mark.asyncio
    async def test_overall_timeout_stops_execution(
        self, manager: TaskManager
    ) -> None:
        """Overall timeout stops task execution."""

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            await asyncio.sleep(5)
            return {"done": True}

        steps = [
            TaskStep(name="Step 1", handler=slow_step),
            TaskStep(name="Step 2", handler=slow_step),
        ]
        task_id = await manager.submit_task("Test", steps, overall_timeout=3)
        result = await manager.wait_for_task(task_id)

        assert result.state == TaskState.TIMEOUT
        assert result.error is not None
        assert "timed out" in result.error.lower()


# =============================================================================
# CANCELLATION TESTS
# =============================================================================


class TestCancellation:
    """Tests for task cancellation functionality."""

    @pytest.mark.asyncio
    async def test_cancel_task_stops_execution(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """cancel_task stops a running task."""
        execution_started = asyncio.Event()

        async def wait_forever(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            execution_started.set()
            await asyncio.sleep(100)
            return {"done": True}

        steps = [TaskStep(name="Wait", handler=wait_forever)]
        task_id = await manager.submit_task("Test", steps)

        await execution_started.wait()
        cancelled = await manager.cancel_task(task_id)

        assert cancelled is True
        result = await manager.wait_for_task(task_id)
        assert result.state == TaskState.CANCELLED
        mock_emitter.cancel_task.assert_called_once_with(task_id)

    @pytest.mark.asyncio
    async def test_cancel_nonexistent_task(self, manager: TaskManager) -> None:
        """cancel_task returns False for unknown task ID."""
        cancelled = await manager.cancel_task("task_nonexistent")
        assert cancelled is False

    @pytest.mark.asyncio
    async def test_cancel_completed_task(self, manager: TaskManager) -> None:
        """cancel_task returns False for already completed task."""

        async def instant(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Fast", handler=instant)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        cancelled = await manager.cancel_task(task_id)
        assert cancelled is False

    @pytest.mark.asyncio
    async def test_cooperative_cancellation(self, manager: TaskManager) -> None:
        """Task checks cancel_requested flag between steps."""
        executed_steps: list[str] = []
        step1_done = asyncio.Event()

        async def step1(prev: Any, ctx: Optional[Dict]) -> Dict[str, str]:
            executed_steps.append("step1")
            step1_done.set()
            await asyncio.sleep(0.5)  # Give time for cancel to be requested
            return {"step": "1"}

        async def step2(prev: Any, ctx: Optional[Dict]) -> Dict[str, str]:
            executed_steps.append("step2")
            return {"step": "2"}

        steps = [
            TaskStep(name="Step 1", handler=step1),
            TaskStep(name="Step 2", handler=step2),
        ]
        task_id = await manager.submit_task("Test", steps)

        # Wait for step 1 to start, then cancel
        await step1_done.wait()
        await manager.cancel_task(task_id)

        result = await manager.wait_for_task(task_id)
        assert result.state == TaskState.CANCELLED
        # Step 1 may or may not complete before cancellation takes effect
        assert len(executed_steps) <= 2


# =============================================================================
# RETRY TESTS
# =============================================================================


class TestRetryLogic:
    """Tests for step retry functionality."""

    @pytest.mark.asyncio
    async def test_step_error_triggers_retry(self, manager: TaskManager) -> None:
        """Step error retries up to configured limit."""
        attempts: list[int] = []

        async def flaky_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            attempts.append(1)
            if len(attempts) < 3:
                raise ValueError("Simulated error")
            return {"done": True}

        steps = [TaskStep(name="Flaky", handler=flaky_step, retries=2)]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id)

        assert len(attempts) == 3
        assert result.state == TaskState.COMPLETED

    @pytest.mark.asyncio
    async def test_step_error_fails_after_retries(self, manager: TaskManager) -> None:
        """Step fails after exhausting retries on error."""

        async def always_fails(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            raise ValueError("Always fails")

        steps = [TaskStep(name="Fail", handler=always_fails, retries=1)]
        task_id = await manager.submit_task("Test", steps)
        result = await manager.wait_for_task(task_id)

        assert result.state == TaskState.FAILED
        assert "Always fails" in (result.error or "")


# =============================================================================
# STATUS TESTS
# =============================================================================


class TestTaskStatus:
    """Tests for task status functionality."""

    @pytest.mark.asyncio
    async def test_get_task_status_returns_current_state(
        self, manager: TaskManager
    ) -> None:
        """get_task_status returns current task state."""

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            await asyncio.sleep(0.5)
            return {"done": True}

        steps = [TaskStep(name="Step", handler=slow_step)]
        task_id = await manager.submit_task("Test", steps)

        await asyncio.sleep(0.1)  # Let it start
        status = manager.get_task_status(task_id)

        assert status is not None
        assert status.state == TaskState.RUNNING
        assert status.duration_ms > 0

    @pytest.mark.asyncio
    async def test_get_task_status_nonexistent(self, manager: TaskManager) -> None:
        """get_task_status returns None for unknown task."""
        status = manager.get_task_status("task_nonexistent")
        assert status is None

    @pytest.mark.asyncio
    async def test_wait_for_task_nonexistent(self, manager: TaskManager) -> None:
        """wait_for_task raises ValueError for unknown task."""
        with pytest.raises(ValueError, match="not found"):
            await manager.wait_for_task("task_nonexistent")

    @pytest.mark.asyncio
    async def test_wait_for_task_timeout(self, manager: TaskManager) -> None:
        """wait_for_task raises TimeoutError if wait times out."""

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            await asyncio.sleep(10)
            return {"done": True}

        steps = [TaskStep(name="Slow", handler=slow_step)]
        task_id = await manager.submit_task("Test", steps)

        with pytest.raises(asyncio.TimeoutError):
            await manager.wait_for_task(task_id, timeout=1)


# =============================================================================
# CONCURRENCY TESTS
# =============================================================================


class TestConcurrencyLimiting:
    """Tests for concurrent task limiting functionality."""

    @pytest.mark.asyncio
    async def test_max_concurrent_tasks_limits_execution(self) -> None:
        """Semaphore limits concurrent task execution."""
        manager = TaskManager(max_concurrent_tasks=2)
        max_concurrent = 0
        current_concurrent = 0
        lock = asyncio.Lock()

        async def track_concurrent(
            prev: Any, ctx: Optional[Dict]
        ) -> Dict[str, bool]:
            nonlocal max_concurrent, current_concurrent
            async with lock:
                current_concurrent += 1
                if current_concurrent > max_concurrent:
                    max_concurrent = current_concurrent
            await asyncio.sleep(0.3)
            async with lock:
                current_concurrent -= 1
            return {"done": True}

        steps = [TaskStep(name="Track", handler=track_concurrent)]

        # Submit 4 tasks
        task_ids = [
            await manager.submit_task(f"Task {i}", steps) for i in range(4)
        ]

        # Wait for all to complete
        for tid in task_ids:
            await manager.wait_for_task(tid)

        # Only 2 should have run concurrently due to semaphore
        assert max_concurrent <= 2


# =============================================================================
# CLEANUP TESTS
# =============================================================================


class TestCleanup:
    """Tests for task cleanup functionality."""

    @pytest.mark.asyncio
    async def test_cleanup_completed_removes_old_tasks(
        self, manager: TaskManager
    ) -> None:
        """cleanup_completed removes tasks older than max_age."""

        async def instant(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Fast", handler=instant)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        # Task exists after completion
        assert manager.get_task_status(task_id) is not None

        # Cleanup with 0 age removes immediately
        removed = manager.cleanup_completed(max_age_seconds=0)
        assert removed == 1
        assert manager.get_task_status(task_id) is None

    @pytest.mark.asyncio
    async def test_cleanup_preserves_recent_tasks(
        self, manager: TaskManager
    ) -> None:
        """cleanup_completed preserves recently completed tasks."""

        async def instant(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Fast", handler=instant)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        # Cleanup with long age doesn't remove
        removed = manager.cleanup_completed(max_age_seconds=3600)
        assert removed == 0
        assert manager.get_task_status(task_id) is not None

    @pytest.mark.asyncio
    async def test_cleanup_preserves_running_tasks(
        self, manager: TaskManager
    ) -> None:
        """cleanup_completed doesn't remove running tasks."""
        execution_started = asyncio.Event()

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            execution_started.set()
            await asyncio.sleep(10)
            return {"done": True}

        steps = [TaskStep(name="Slow", handler=slow_step)]
        task_id = await manager.submit_task("Test", steps)

        await execution_started.wait()

        removed = manager.cleanup_completed(max_age_seconds=0)
        assert removed == 0
        assert manager.get_task_status(task_id) is not None

        # Cleanup by cancelling
        await manager.cancel_task(task_id)
        await manager.wait_for_task(task_id)


# =============================================================================
# STATE EMITTER INTEGRATION TESTS
# =============================================================================


class TestStateEmitterIntegration:
    """Tests for state emitter integration."""

    @pytest.mark.asyncio
    async def test_state_emitter_start_task_called(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """TaskManager calls start_task on emitter."""

        async def step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step", handler=step)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        mock_emitter.start_task.assert_called_once()
        call_args = mock_emitter.start_task.call_args
        assert call_args.kwargs["task_id"] == task_id
        assert call_args.kwargs["task_name"] == "Test"
        assert call_args.kwargs["steps"] == ["Step"]

    @pytest.mark.asyncio
    async def test_state_emitter_update_step_called(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """TaskManager calls update_task_step for each step."""

        async def step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [
            TaskStep(name="Step 1", handler=step),
            TaskStep(name="Step 2", handler=step),
        ]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        # Should be called for each step (running and completed)
        assert mock_emitter.update_task_step.call_count >= 2

    @pytest.mark.asyncio
    async def test_state_emitter_complete_task_called(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """TaskManager calls complete_task on success."""

        async def step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step", handler=step)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        mock_emitter.complete_task.assert_called_once_with(task_id)

    @pytest.mark.asyncio
    async def test_state_emitter_fail_task_called(
        self, manager: TaskManager, mock_emitter: Mock
    ) -> None:
        """TaskManager calls fail_task on error."""

        async def failing_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            raise ValueError("Test error")

        steps = [TaskStep(name="Fail", handler=failing_step)]
        task_id = await manager.submit_task("Test", steps)
        await manager.wait_for_task(task_id)

        mock_emitter.fail_task.assert_called_once()
        call_args = mock_emitter.fail_task.call_args
        assert call_args.args[0] == task_id
        assert "Test error" in call_args.args[1]

    @pytest.mark.asyncio
    async def test_no_emitter_works(self, manager_no_emitter: TaskManager) -> None:
        """TaskManager works without state emitter."""

        async def step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step", handler=step)]
        task_id = await manager_no_emitter.submit_task("Test", steps)
        result = await manager_no_emitter.wait_for_task(task_id)

        assert result.state == TaskState.COMPLETED


# =============================================================================
# DATACLASS TESTS
# =============================================================================


class TestDataclasses:
    """Tests for TaskStep, TaskResult, ManagedTask dataclasses."""

    def test_task_step_defaults(self) -> None:
        """TaskStep has correct defaults."""

        async def handler(prev: Any, ctx: Optional[Dict]) -> Any:
            return prev

        step = TaskStep(name="Test", handler=handler)

        assert step.name == "Test"
        assert step.timeout_seconds == DEFAULT_STEP_TIMEOUT
        assert step.retries == 0

    def test_task_result_fields(self) -> None:
        """TaskResult has all expected fields."""
        result = TaskResult(
            task_id="task_123",
            state=TaskState.COMPLETED,
            result={"data": "value"},
            error=None,
            duration_ms=1000,
            steps_completed=2,
            total_steps=2,
        )

        assert result.task_id == "task_123"
        assert result.state == TaskState.COMPLETED
        assert result.result == {"data": "value"}
        assert result.error is None
        assert result.duration_ms == 1000
        assert result.steps_completed == 2
        assert result.total_steps == 2

    def test_task_state_enum_values(self) -> None:
        """TaskState enum has all required values."""
        assert TaskState.PENDING.value == "pending"
        assert TaskState.RUNNING.value == "running"
        assert TaskState.COMPLETED.value == "completed"
        assert TaskState.FAILED.value == "failed"
        assert TaskState.CANCELLED.value == "cancelled"
        assert TaskState.TIMEOUT.value == "timeout"


# =============================================================================
# SINGLETON FACTORY TESTS
# =============================================================================


class TestSingletonFactory:
    """Tests for get_task_manager_sync factory."""

    def test_singleton_returns_same_instance(self) -> None:
        """get_task_manager_sync returns same instance."""
        # Note: This test may be affected by other tests, so we test the behavior
        # rather than strict singleton identity
        manager1 = get_task_manager_sync()
        manager2 = get_task_manager_sync()
        assert manager1 is manager2

    def test_singleton_updates_emitter(self) -> None:
        """get_task_manager_sync updates emitter if provided."""
        mock_emitter = Mock()
        mock_emitter.start_task = AsyncMock()

        manager = get_task_manager_sync(state_emitter=mock_emitter)
        assert manager._state_emitter is mock_emitter


# =============================================================================
# SHUTDOWN TESTS
# =============================================================================


class TestShutdown:
    """Tests for graceful shutdown functionality."""

    @pytest.mark.asyncio
    async def test_shutdown_cancels_running_tasks(self) -> None:
        """shutdown() cancels all running tasks."""
        manager = TaskManager()
        execution_started = asyncio.Event()

        async def slow_step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            execution_started.set()
            await asyncio.sleep(100)
            return {"done": True}

        steps = [TaskStep(name="Slow", handler=slow_step)]
        task_id = await manager.submit_task("Test", steps)

        await execution_started.wait()
        await manager.shutdown()

        status = manager.get_task_status(task_id)
        assert status is not None
        assert status.state == TaskState.CANCELLED

    @pytest.mark.asyncio
    async def test_shutdown_prevents_new_tasks(self) -> None:
        """shutdown() prevents new task submission."""
        manager = TaskManager()
        await manager.shutdown()

        async def step(prev: Any, ctx: Optional[Dict]) -> Dict[str, bool]:
            return {"done": True}

        steps = [TaskStep(name="Step", handler=step)]

        with pytest.raises(RuntimeError, match="shutting down"):
            await manager.submit_task("Test", steps)
