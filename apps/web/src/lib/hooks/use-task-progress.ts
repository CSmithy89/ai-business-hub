/**
 * Task Progress Hooks
 *
 * React hooks for subscribing to task progress from the dashboard state store.
 * These hooks provide efficient subscriptions to specific task state slices.
 *
 * @see docs/modules/bm-dm/stories/dm-05-4-realtime-progress-streaming.md
 * Epic: DM-05 | Story: DM-05.4
 */
'use client';

import { useDashboardStateStore } from '@/stores/dashboard-state-store';
import type { TaskProgress, TaskStatusValue } from '@/lib/schemas/dashboard-state';

/**
 * Get all active tasks from the store.
 *
 * @returns Array of active TaskProgress objects
 *
 * @example
 * ```tsx
 * function TaskList() {
 *   const tasks = useActiveTasks();
 *   return (
 *     <div>
 *       {tasks.map((task) => (
 *         <TaskProgressCard key={task.taskId} task={task} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActiveTasks(): TaskProgress[] {
  return useDashboardStateStore((state) => state.activeTasks ?? []);
}

/**
 * Get a specific task by ID.
 *
 * @param taskId - The task ID to find
 * @returns The TaskProgress object or null if not found
 *
 * @example
 * ```tsx
 * function TaskStatus({ taskId }: { taskId: string }) {
 *   const task = useTaskProgress(taskId);
 *   if (!task) return <div>Task not found</div>;
 *   return <div>{task.taskName}: {task.status}</div>;
 * }
 * ```
 */
export function useTaskProgress(taskId: string): TaskProgress | null {
  return useDashboardStateStore(
    (state) => state.activeTasks?.find((t) => t.taskId === taskId) ?? null
  );
}

/**
 * Check if any tasks are currently running or pending.
 *
 * @returns true if any tasks are in 'running' or 'pending' status
 *
 * @example
 * ```tsx
 * function TaskIndicator() {
 *   const hasRunning = useHasRunningTasks();
 *   return hasRunning ? <Spinner /> : null;
 * }
 * ```
 */
export function useHasRunningTasks(): boolean {
  return useDashboardStateStore((state) =>
    state.activeTasks?.some(
      (t) => t.status === 'running' || t.status === 'pending'
    ) ?? false
  );
}

/**
 * Get tasks filtered by status.
 *
 * @param status - The status to filter by
 * @returns Array of TaskProgress objects matching the status
 *
 * @example
 * ```tsx
 * function CompletedTasks() {
 *   const completed = useTasksByStatus('completed');
 *   return <div>Completed: {completed.length}</div>;
 * }
 * ```
 */
export function useTasksByStatus(status: TaskStatusValue): TaskProgress[] {
  return useDashboardStateStore(
    (state) => state.activeTasks?.filter((t) => t.status === status) ?? []
  );
}

/**
 * Get count of tasks by status.
 *
 * @returns Object with counts for each status
 *
 * @example
 * ```tsx
 * function TaskSummary() {
 *   const counts = useTaskCounts();
 *   return (
 *     <div>
 *       Running: {counts.running} | Completed: {counts.completed}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTaskCounts(): Record<TaskStatusValue, number> {
  return useDashboardStateStore((state) => {
    const tasks = state.activeTasks ?? [];
    return {
      pending: tasks.filter((t) => t.status === 'pending').length,
      running: tasks.filter((t) => t.status === 'running').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
      cancelled: tasks.filter((t) => t.status === 'cancelled').length,
    };
  });
}
