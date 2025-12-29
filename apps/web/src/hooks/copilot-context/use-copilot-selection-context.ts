'use client';

/**
 * CopilotKit Selection Context Hook - Story DM-01.5
 *
 * Provides task selection context to CopilotKit agents
 * using the useCopilotReadable hook. This enables agents to
 * understand which tasks the user has selected for bulk operations.
 *
 * @see https://docs.copilotkit.ai/reference/hooks/useCopilotReadable
 * Epic: DM-01 | Story: DM-01.5
 */

import { useCopilotReadable } from '@copilotkit/react-core';
import type { SelectionContext, SelectedTaskSummary } from './types';

/**
 * Generates a human-readable summary of status distribution
 *
 * @param tasks - Array of selected task summaries
 * @returns String like "3 TODO, 2 IN_PROGRESS, 1 DONE"
 */
function getStatusSummary(tasks: SelectedTaskSummary[]): string {
  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ');
}

/**
 * Provides task selection context to CopilotKit agents.
 *
 * This hook tracks which tasks the user has selected in list/kanban views
 * and shares this information with AI agents, enabling them to perform
 * bulk operations or provide assistance for the selected items.
 *
 * Usage: Call in task list or kanban components when selection is tracked.
 *
 * @param selectedIds - Array of selected task IDs
 * @param taskSummaries - Array of task summary objects for selected tasks
 *
 * @example
 * ```tsx
 * // In task list component
 * const [selectedIds, setSelectedIds] = useState<string[]>([]);
 *
 * // Map full task data to summaries for selected tasks
 * const selectedTasks = tasks
 *   .filter((t) => selectedIds.includes(t.id))
 *   .map((t) => ({
 *     id: t.id,
 *     title: t.title,
 *     status: t.status,
 *     priority: t.priority,
 *     type: t.type,
 *   }));
 *
 * useCopilotSelectionContext(selectedIds, selectedTasks);
 * ```
 */
export function useCopilotSelectionContext(
  selectedIds: string[],
  taskSummaries: SelectedTaskSummary[]
): void {
  const count = selectedIds.length;

  const context: SelectionContext = {
    count,
    taskIds: selectedIds,
    tasks: taskSummaries,
  };

  // Build a human-readable description based on selection state
  let description: string;

  if (count === 0) {
    description = 'No tasks are currently selected.';
  } else if (count === 1) {
    const task = taskSummaries[0];
    if (task) {
      description = `One task selected: "${task.title}" (${task.status}, ${task.priority} priority, type: ${task.type}). Use this context when the user asks about "this task", "the selected task", or wants to perform an action on the selection.`;
    } else {
      description =
        'One task is selected, but task details are not available.';
    }
  } else {
    const statusSummary = getStatusSummary(taskSummaries);
    const titles =
      taskSummaries.length <= 3
        ? taskSummaries.map((t) => `"${t.title}"`).join(', ')
        : `"${taskSummaries[0]?.title}", "${taskSummaries[1]?.title}", and ${count - 2} more`;

    description = `${count} tasks selected: ${titles}. Status breakdown: ${statusSummary}. Use this context for bulk operations or when the user asks about "these tasks", "selected tasks", or "the selection".`;
  }

  useCopilotReadable({
    description,
    value: context,
  });
}
