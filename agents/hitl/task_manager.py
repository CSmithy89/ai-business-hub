"""
TaskManager for Long-Running Task Support

This module provides infrastructure for managing long-running agent operations
with timeout handling, cancellation support, and background task execution.

Features:
- Step-by-step task execution with progress tracking
- Per-step and overall timeout handling
- Graceful cancellation with cooperative flag
- Automatic retry for failed steps
- Integration with DashboardStateEmitter for real-time UI updates
- Semaphore-based concurrency limiting
- Task result caching for retrieval after completion

Usage:
    from hitl import get_task_manager, TaskStep, TaskState

    # Get singleton task manager (with optional state emitter)
    manager = get_task_manager(state_emitter=emitter)

    # Define task steps
    async def step_one(prev_result, context):
        return {"data": "processed"}

    steps = [
        TaskStep(name="Step One", handler=step_one, timeout_seconds=30),
        TaskStep(name="Step Two", handler=step_two, timeout_seconds=60, retries=2),
    ]

    # Submit and wait for task
    task_id = await manager.submit_task(
        name="My Long Task",
        steps=steps,
        context={"input": "data"},
        overall_timeout=300,
    )
    result = await manager.wait_for_task(task_id)

    # Or cancel if needed
    await manager.cancel_task(task_id)

    # Cleanup old completed tasks
    removed = manager.cleanup_completed(max_age_seconds=3600)

@see docs/modules/bm-dm/epics/epic-dm-05-tech-spec.md
Epic: DM-05 | Story: DM-05.5
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Coroutine, Dict, List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from gateway.state_emitter import DashboardStateEmitter

logger = logging.getLogger(__name__)

# =============================================================================
# CONSTANTS
# =============================================================================

# Maximum concurrent task execution (default)
MAX_CONCURRENT_TASKS = 5

# Default step timeout in seconds
DEFAULT_STEP_TIMEOUT = 60

# Default task result retention in seconds (1 hour)
DEFAULT_CLEANUP_AGE = 3600


# =============================================================================
# ENUMS
# =============================================================================


class TaskState(str, Enum):
    """Task execution state."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


# =============================================================================
# DATACLASSES
# =============================================================================


# Type alias for step handler signature
StepHandler = Callable[[Any, Optional[Dict[str, Any]]], Coroutine[Any, Any, Any]]


@dataclass(slots=True)
class TaskStep:
    """
    Definition of a task step.

    Each step represents a discrete unit of work within a long-running task.
    Steps are executed sequentially, with results passed to the next step.

    Attributes:
        name: Human-readable step name for progress display
        handler: Async function (prev_result, context) -> result
        timeout_seconds: Maximum time allowed for this step
        retries: Number of retry attempts on failure/timeout
    """

    name: str
    handler: StepHandler
    timeout_seconds: int = DEFAULT_STEP_TIMEOUT
    retries: int = 0


@dataclass(slots=True)
class TaskResult:
    """
    Result of a task execution.

    Captures the final or current state of a task, including any error
    information and timing metrics.

    Attributes:
        task_id: Unique task identifier
        state: Final or current task state
        result: Result data from the last completed step
        error: Error message if task failed
        duration_ms: Elapsed time in milliseconds
        steps_completed: Number of steps that completed successfully
        total_steps: Total number of steps in the task
    """

    task_id: str
    state: TaskState
    result: Any = None
    error: Optional[str] = None
    duration_ms: int = 0
    steps_completed: int = 0
    total_steps: int = 0


@dataclass
class ManagedTask:
    """
    A task being managed by the TaskManager.

    Tracks the full lifecycle state of a task including the asyncio task
    reference for cancellation support.

    Attributes:
        task_id: Unique task identifier
        name: Human-readable task name
        steps: List of TaskStep definitions
        context: Optional context dict passed to step handlers
        state: Current task state
        current_step: Index of the step currently executing (or last completed)
        started_at: Unix timestamp when task started (seconds)
        completed_at: Unix timestamp when task completed (seconds)
        error: Error message if task failed
        result: Result from last completed step
        cancel_requested: Flag for cooperative cancellation
        asyncio_task: Reference to the asyncio Task for cancellation
        overall_timeout: Optional overall timeout in seconds
    """

    task_id: str
    name: str
    steps: List[TaskStep]
    context: Optional[Dict[str, Any]] = None
    state: TaskState = TaskState.PENDING
    current_step: int = 0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    error: Optional[str] = None
    result: Any = None
    cancel_requested: bool = False
    asyncio_task: Optional[asyncio.Task[TaskResult]] = field(default=None, repr=False)
    overall_timeout: Optional[int] = None


# =============================================================================
# TASK MANAGER
# =============================================================================


class TaskManager:
    """
    Manages long-running tasks with progress tracking.

    The TaskManager provides:
    - Background task execution with asyncio
    - Step-by-step progress tracking
    - Per-step and overall timeout handling
    - Retry logic for failed steps
    - Cooperative cancellation
    - Integration with DashboardStateEmitter for UI updates
    - Semaphore-based concurrency limiting

    Thread Safety:
        TaskManager is designed for single-threaded async use within one
        event loop. All public methods are async or synchronous but thread-safe
        for the task dictionary access.
    """

    def __init__(
        self,
        state_emitter: Optional[DashboardStateEmitter] = None,
        default_step_timeout: int = DEFAULT_STEP_TIMEOUT,
        max_concurrent_tasks: int = MAX_CONCURRENT_TASKS,
    ) -> None:
        """
        Initialize task manager.

        Args:
            state_emitter: Optional state emitter for progress updates to UI
            default_step_timeout: Default timeout for steps without explicit timeout
            max_concurrent_tasks: Maximum number of tasks that can run concurrently
        """
        self._state_emitter = state_emitter
        self._default_timeout = default_step_timeout
        self._max_concurrent = max_concurrent_tasks
        self._tasks: Dict[str, ManagedTask] = {}
        self._semaphore = asyncio.Semaphore(max_concurrent_tasks)
        self._lock = asyncio.Lock()
        self._shutdown_requested = False

    def _generate_task_id(self) -> str:
        """Generate a unique task ID."""
        # Format: task_ + 12 hex characters
        return f"task_{uuid.uuid4().hex[:12]}"

    def _estimate_duration(self, task: ManagedTask) -> int:
        """
        Calculate estimated task duration from step timeouts.

        Returns half of the total step timeouts as an average estimate.

        Args:
            task: The task to estimate duration for

        Returns:
            Estimated duration in milliseconds
        """
        total_timeout_seconds = sum(step.timeout_seconds for step in task.steps)
        # Return half as average estimate (steps usually complete faster than timeout)
        return (total_timeout_seconds * 1000) // 2

    async def submit_task(
        self,
        name: str,
        steps: List[TaskStep],
        context: Optional[Dict[str, Any]] = None,
        overall_timeout: Optional[int] = None,
    ) -> str:
        """
        Submit a new long-running task for background execution.

        The task is immediately added to the task registry and execution
        begins in the background. The returned task_id can be used to
        check status, wait for completion, or cancel the task.

        Args:
            name: Human-readable task name for display
            steps: List of TaskStep definitions to execute
            context: Optional context dict passed to all step handlers
            overall_timeout: Optional overall timeout in seconds

        Returns:
            Unique task_id for tracking this task

        Raises:
            ValueError: If steps list is empty
        """
        if not steps:
            raise ValueError("Task must have at least one step")

        if self._shutdown_requested:
            raise RuntimeError("TaskManager is shutting down")

        task_id = self._generate_task_id()

        task = ManagedTask(
            task_id=task_id,
            name=name,
            steps=steps,
            context=context,
            state=TaskState.PENDING,
            overall_timeout=overall_timeout,
        )

        async with self._lock:
            self._tasks[task_id] = task

        # Create and store the asyncio task
        asyncio_task = asyncio.create_task(
            self._execute_task(task),
            name=f"task-{task_id}",
        )
        task.asyncio_task = asyncio_task

        logger.info(
            f"Task submitted: {task_id} ({name}) with {len(steps)} steps"
        )

        return task_id

    async def _execute_task(self, task: ManagedTask) -> TaskResult:
        """
        Execute a task with overall timeout and exception handling.

        Acquires the semaphore for concurrency control, then executes
        all steps sequentially. Handles timeout, cancellation, and
        exceptions, updating task state and emitting progress updates.

        Args:
            task: The ManagedTask to execute

        Returns:
            TaskResult with final state and result/error
        """
        async with self._semaphore:
            task.state = TaskState.RUNNING
            task.started_at = time.time()

            # Notify state emitter of task start
            if self._state_emitter:
                try:
                    await self._state_emitter.start_task(
                        task_id=task.task_id,
                        task_name=task.name,
                        steps=[s.name for s in task.steps],
                        estimated_duration_ms=self._estimate_duration(task),
                    )
                except Exception as e:
                    logger.warning(f"Failed to emit task start: {e}")

            try:
                # Execute with overall timeout if specified
                if task.overall_timeout:
                    await asyncio.wait_for(
                        self._execute_steps(task),
                        timeout=task.overall_timeout,
                    )
                else:
                    await self._execute_steps(task)

                # Success
                task.state = TaskState.COMPLETED
                task.completed_at = time.time()

                if self._state_emitter:
                    try:
                        await self._state_emitter.complete_task(task.task_id)
                    except Exception as e:
                        logger.warning(f"Failed to emit task completion: {e}")

                logger.info(f"Task completed: {task.task_id}")

            except asyncio.CancelledError:
                task.state = TaskState.CANCELLED
                task.completed_at = time.time()
                task.error = "Task was cancelled"

                if self._state_emitter:
                    try:
                        await self._state_emitter.cancel_task(task.task_id)
                    except Exception as e:
                        logger.warning(f"Failed to emit task cancellation: {e}")

                logger.info(f"Task cancelled: {task.task_id}")

            except asyncio.TimeoutError:
                task.state = TaskState.TIMEOUT
                task.completed_at = time.time()
                task.error = f"Task timed out after {task.overall_timeout}s"

                if self._state_emitter:
                    try:
                        await self._state_emitter.fail_task(
                            task.task_id, task.error
                        )
                    except Exception as e:
                        logger.warning(f"Failed to emit task timeout: {e}")

                logger.warning(f"Task timed out: {task.task_id}")

            except Exception as e:
                task.state = TaskState.FAILED
                task.completed_at = time.time()
                task.error = str(e)

                if self._state_emitter:
                    try:
                        await self._state_emitter.fail_task(task.task_id, str(e))
                    except Exception as emit_err:
                        logger.warning(f"Failed to emit task failure: {emit_err}")

                logger.exception(f"Task failed: {task.task_id} - {e}")

            return self._create_result(task)

    async def _execute_steps(self, task: ManagedTask) -> None:
        """
        Execute task steps sequentially with per-step timeout and retries.

        Each step receives the result of the previous step (or None for first)
        and the task context. Progress is emitted before and after each step.

        Args:
            task: The ManagedTask containing steps to execute

        Raises:
            asyncio.CancelledError: If cancellation was requested
            asyncio.TimeoutError: If step times out after all retries
            Exception: If step fails after all retries
        """
        result: Any = None

        for i, step in enumerate(task.steps):
            # Check for cancellation before each step
            if task.cancel_requested:
                raise asyncio.CancelledError()

            task.current_step = i

            # Emit step start
            if self._state_emitter:
                try:
                    await self._state_emitter.update_task_step(
                        task_id=task.task_id,
                        step_index=i,
                        status="running",
                    )
                except Exception as e:
                    logger.warning(f"Failed to emit step start: {e}")

            # Execute step with retries
            attempts = 0
            max_attempts = step.retries + 1
            last_error: Optional[Exception] = None

            while attempts < max_attempts:
                attempts += 1
                try:
                    result = await asyncio.wait_for(
                        step.handler(result, task.context),
                        timeout=step.timeout_seconds,
                    )
                    # Step succeeded
                    last_error = None
                    break

                except asyncio.TimeoutError:
                    last_error = asyncio.TimeoutError(
                        f"Step '{step.name}' timed out after {step.timeout_seconds}s"
                    )
                    if attempts < max_attempts:
                        logger.warning(
                            f"Step '{step.name}' timed out, retry {attempts}/{step.retries}"
                        )
                    else:
                        logger.error(
                            f"Step '{step.name}' failed after {max_attempts} attempts"
                        )

                except asyncio.CancelledError:
                    # Don't retry on cancellation
                    raise

                except Exception as e:
                    last_error = e
                    if attempts < max_attempts:
                        logger.warning(
                            f"Step '{step.name}' failed ({e}), retry {attempts}/{step.retries}"
                        )
                    else:
                        logger.error(
                            f"Step '{step.name}' failed after {max_attempts} attempts: {e}"
                        )

            # If we exhausted retries, raise the last error
            if last_error is not None:
                # Emit step failure
                if self._state_emitter:
                    try:
                        await self._state_emitter.update_task_step(
                            task_id=task.task_id,
                            step_index=i,
                            status="failed",
                        )
                    except Exception as e:
                        logger.warning(f"Failed to emit step failure: {e}")
                # Wrap TimeoutError in a regular exception to distinguish from overall timeout
                if isinstance(last_error, asyncio.TimeoutError):
                    raise RuntimeError(str(last_error)) from last_error
                raise last_error

            # Emit step completion
            if self._state_emitter:
                try:
                    await self._state_emitter.update_task_step(
                        task_id=task.task_id,
                        step_index=i,
                        status="completed",
                    )
                except Exception as e:
                    logger.warning(f"Failed to emit step completion: {e}")

        # Store final result
        task.result = result

    async def cancel_task(self, task_id: str) -> bool:
        """
        Request cancellation of a running task.

        Sets the cancel_requested flag for cooperative cancellation and
        cancels the asyncio task for immediate effect. Only tasks in
        PENDING or RUNNING state can be cancelled.

        Args:
            task_id: The task ID to cancel

        Returns:
            True if cancellation was requested, False if task not found
            or already in terminal state
        """
        async with self._lock:
            task = self._tasks.get(task_id)

        if not task:
            logger.warning(f"Cannot cancel task {task_id}: not found")
            return False

        if task.state not in (TaskState.PENDING, TaskState.RUNNING):
            logger.warning(
                f"Cannot cancel task {task_id}: already in state {task.state.value}"
            )
            return False

        # Set cooperative cancellation flag
        task.cancel_requested = True

        # Cancel the asyncio task directly for immediate effect
        if task.asyncio_task and not task.asyncio_task.done():
            task.asyncio_task.cancel()

        logger.info(f"Cancellation requested for task: {task_id}")
        return True

    def get_task_status(self, task_id: str) -> Optional[TaskResult]:
        """
        Get current status of a task.

        Returns a TaskResult snapshot of the task's current state,
        or None if the task is not found.

        Args:
            task_id: The task ID to query

        Returns:
            TaskResult with current state, or None if not found
        """
        task = self._tasks.get(task_id)
        if not task:
            return None
        return self._create_result(task)

    def _create_result(self, task: ManagedTask) -> TaskResult:
        """
        Create a TaskResult from a ManagedTask.

        Args:
            task: The ManagedTask to convert

        Returns:
            TaskResult with current state snapshot
        """
        # Calculate duration
        if task.started_at:
            end_time = task.completed_at or time.time()
            duration_ms = int((end_time - task.started_at) * 1000)
        else:
            duration_ms = 0

        # Count completed steps
        if task.state == TaskState.COMPLETED:
            steps_completed = len(task.steps)
        elif task.state in (TaskState.FAILED, TaskState.TIMEOUT, TaskState.CANCELLED):
            steps_completed = task.current_step
        elif task.state == TaskState.RUNNING:
            # Current step is in progress, so completed = current
            steps_completed = task.current_step
        else:
            steps_completed = 0

        return TaskResult(
            task_id=task.task_id,
            state=task.state,
            result=task.result,
            error=task.error,
            duration_ms=duration_ms,
            steps_completed=steps_completed,
            total_steps=len(task.steps),
        )

    async def wait_for_task(
        self,
        task_id: str,
        timeout: Optional[int] = None,
    ) -> TaskResult:
        """
        Wait for a task to complete.

        Blocks until the task reaches a terminal state (COMPLETED, FAILED,
        CANCELLED, or TIMEOUT) or the wait timeout is reached.

        Args:
            task_id: The task ID to wait for
            timeout: Optional wait timeout in seconds

        Returns:
            TaskResult with final state

        Raises:
            ValueError: If task is not found
            asyncio.TimeoutError: If wait timeout is reached before task completes
        """
        task = self._tasks.get(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        if task.asyncio_task is None:
            # Task hasn't started yet or already completed
            return self._create_result(task)

        try:
            if timeout:
                await asyncio.wait_for(
                    asyncio.shield(task.asyncio_task),
                    timeout=timeout,
                )
            else:
                await task.asyncio_task
        except asyncio.CancelledError:
            # Task was cancelled, get final result
            pass
        except asyncio.TimeoutError:
            raise

        return self._create_result(task)

    def cleanup_completed(self, max_age_seconds: int = DEFAULT_CLEANUP_AGE) -> int:
        """
        Remove old completed tasks from memory.

        Tasks in terminal states (COMPLETED, FAILED, CANCELLED, TIMEOUT)
        that completed more than max_age_seconds ago are removed.

        Args:
            max_age_seconds: Maximum age in seconds before removal

        Returns:
            Number of tasks removed
        """
        now = time.time()
        terminal_states = (
            TaskState.COMPLETED,
            TaskState.FAILED,
            TaskState.CANCELLED,
            TaskState.TIMEOUT,
        )

        to_remove: List[str] = []

        for task_id, task in self._tasks.items():
            if task.state in terminal_states and task.completed_at:
                age = now - task.completed_at
                if age > max_age_seconds:
                    to_remove.append(task_id)

        for task_id in to_remove:
            del self._tasks[task_id]

        if to_remove:
            logger.info(f"Cleaned up {len(to_remove)} completed tasks")

        return len(to_remove)

    async def shutdown(self) -> None:
        """
        Gracefully shutdown the task manager.

        Cancels all running tasks and waits for them to complete.
        After shutdown, no new tasks can be submitted.
        """
        self._shutdown_requested = True
        logger.info("TaskManager shutdown requested")

        # Cancel all running tasks
        running_tasks: List[asyncio.Task[TaskResult]] = []
        for task in self._tasks.values():
            if (
                task.state in (TaskState.PENDING, TaskState.RUNNING)
                and task.asyncio_task
                and not task.asyncio_task.done()
            ):
                task.cancel_requested = True
                task.asyncio_task.cancel()
                running_tasks.append(task.asyncio_task)

        # Wait for all tasks to complete
        if running_tasks:
            await asyncio.gather(*running_tasks, return_exceptions=True)

        logger.info("TaskManager shutdown complete")


# =============================================================================
# SINGLETON FACTORY
# =============================================================================

_task_manager: Optional[TaskManager] = None
_manager_lock = asyncio.Lock()


async def get_task_manager(
    state_emitter: Optional[DashboardStateEmitter] = None,
) -> TaskManager:
    """
    Get the singleton TaskManager instance.

    Creates the TaskManager on first call. If a state_emitter is provided
    and the manager already exists, updates the state_emitter reference.

    Args:
        state_emitter: Optional state emitter for progress updates

    Returns:
        The singleton TaskManager instance
    """
    global _task_manager

    async with _manager_lock:
        if _task_manager is None:
            _task_manager = TaskManager(state_emitter=state_emitter)
            logger.info("TaskManager singleton created")
        elif state_emitter is not None:
            # Update emitter if provided
            _task_manager._state_emitter = state_emitter

    return _task_manager


def get_task_manager_sync(
    state_emitter: Optional[DashboardStateEmitter] = None,
) -> TaskManager:
    """
    Get the singleton TaskManager instance (synchronous version).

    This is a non-async variant for use in contexts where async is not
    available. Note: This doesn't handle the race condition as well as
    the async version in highly concurrent scenarios.

    Args:
        state_emitter: Optional state emitter for progress updates

    Returns:
        The singleton TaskManager instance
    """
    global _task_manager

    if _task_manager is None:
        _task_manager = TaskManager(state_emitter=state_emitter)
        logger.info("TaskManager singleton created (sync)")
    elif state_emitter is not None:
        _task_manager._state_emitter = state_emitter

    return _task_manager


async def close_task_manager() -> None:
    """
    Close the singleton TaskManager instance.

    Shuts down the manager gracefully and clears the singleton reference.
    """
    global _task_manager

    async with _manager_lock:
        if _task_manager is not None:
            await _task_manager.shutdown()
            _task_manager = None
            logger.info("TaskManager singleton closed")
