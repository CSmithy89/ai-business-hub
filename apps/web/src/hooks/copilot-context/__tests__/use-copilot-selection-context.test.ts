/**
 * Unit Tests for useCopilotSelectionContext Hook - Story DM-01.5
 *
 * Tests the selection context hook that provides task selection info to CopilotKit agents.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock CopilotKit
const mockUseCopilotReadable = vi.fn();

vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: (options: { description: string; value: unknown }) => {
    mockUseCopilotReadable(options);
  },
}));

// Import the hook AFTER mocks are set up
import { useCopilotSelectionContext } from '../use-copilot-selection-context';
import type { SelectedTaskSummary } from '../types';

// Helper to create mock task summaries
function createMockTask(
  overrides: Partial<SelectedTaskSummary> = {}
): SelectedTaskSummary {
  return {
    id: 'task_123',
    title: 'Test Task',
    status: 'TODO',
    priority: 'MEDIUM',
    type: 'TASK',
    ...overrides,
  };
}

describe('useCopilotSelectionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('provides empty selection context', () => {
    renderHook(() => useCopilotSelectionContext([], []));

    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(1);
    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value).toEqual({
      count: 0,
      taskIds: [],
      tasks: [],
    });
    expect(call.description).toBe('No tasks are currently selected.');
  });

  it('provides single selection context', () => {
    const task = createMockTask({
      id: 'task_1',
      title: 'My Task',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'BUG',
    });

    renderHook(() => useCopilotSelectionContext(['task_1'], [task]));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value).toEqual({
      count: 1,
      taskIds: ['task_1'],
      tasks: [task],
    });
    expect(call.description).toContain('One task selected');
    expect(call.description).toContain('My Task');
    expect(call.description).toContain('IN_PROGRESS');
    expect(call.description).toContain('HIGH');
  });

  it('provides multi-selection context', () => {
    const tasks = [
      createMockTask({ id: 'task_1', title: 'Task 1', status: 'TODO' }),
      createMockTask({ id: 'task_2', title: 'Task 2', status: 'IN_PROGRESS' }),
      createMockTask({ id: 'task_3', title: 'Task 3', status: 'TODO' }),
    ];

    renderHook(() =>
      useCopilotSelectionContext(['task_1', 'task_2', 'task_3'], tasks)
    );

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value.count).toBe(3);
    expect(call.value.taskIds).toEqual(['task_1', 'task_2', 'task_3']);
    expect(call.value.tasks).toEqual(tasks);
    expect(call.description).toContain('3 tasks selected');
  });

  it('generates status summary correctly', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'TODO' }),
      createMockTask({ id: '2', status: 'TODO' }),
      createMockTask({ id: '3', status: 'IN_PROGRESS' }),
      createMockTask({ id: '4', status: 'DONE' }),
    ];

    renderHook(() =>
      useCopilotSelectionContext(['1', '2', '3', '4'], tasks)
    );

    const call = mockUseCopilotReadable.mock.calls[0][0];

    // Status breakdown should be in description
    expect(call.description).toContain('TODO');
    expect(call.description).toContain('IN_PROGRESS');
    expect(call.description).toContain('DONE');
    expect(call.description).toContain('2'); // 2 TODO tasks
    expect(call.description).toContain('1'); // 1 IN_PROGRESS, 1 DONE
  });

  it('lists task titles for small selections', () => {
    const tasks = [
      createMockTask({ id: '1', title: 'First Task' }),
      createMockTask({ id: '2', title: 'Second Task' }),
    ];

    renderHook(() => useCopilotSelectionContext(['1', '2'], tasks));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.description).toContain('First Task');
    expect(call.description).toContain('Second Task');
  });

  it('summarizes task titles for large selections', () => {
    const tasks = [
      createMockTask({ id: '1', title: 'Task Alpha' }),
      createMockTask({ id: '2', title: 'Task Beta' }),
      createMockTask({ id: '3', title: 'Task Gamma' }),
      createMockTask({ id: '4', title: 'Task Delta' }),
      createMockTask({ id: '5', title: 'Task Epsilon' }),
    ];

    renderHook(() =>
      useCopilotSelectionContext(['1', '2', '3', '4', '5'], tasks)
    );

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.description).toContain('Task Alpha');
    expect(call.description).toContain('Task Beta');
    expect(call.description).toContain('and 3 more');
    // Should not list all 5 task titles
    expect(call.description).not.toContain('Task Epsilon');
  });

  it('handles missing task summary gracefully', () => {
    // Pass IDs but empty task array
    renderHook(() => useCopilotSelectionContext(['task_1'], []));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.value.count).toBe(1);
    // Should not throw, but description may be less informative
    expect(call.description).toContain('task');
  });

  it('includes type information for single selection', () => {
    const task = createMockTask({ type: 'BUG' });

    renderHook(() => useCopilotSelectionContext(['task_1'], [task]));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    expect(call.description).toContain('BUG');
  });

  it('provides guidance for using the context', () => {
    const task = createMockTask();

    renderHook(() => useCopilotSelectionContext(['task_1'], [task]));

    const call = mockUseCopilotReadable.mock.calls[0][0];

    // Description should guide agent on when to use this context
    expect(call.description).toContain('this task');
  });

  it('updates value reactively (simulated via re-render)', () => {
    const initialTasks = [createMockTask({ id: 'task_1' })];

    const { rerender } = renderHook(
      ({ ids, tasks }) => useCopilotSelectionContext(ids, tasks),
      {
        initialProps: {
          ids: ['task_1'],
          tasks: initialTasks,
        },
      }
    );

    expect(mockUseCopilotReadable.mock.calls[0][0].value.count).toBe(1);

    // Add another task
    const updatedTasks = [
      ...initialTasks,
      createMockTask({ id: 'task_2' }),
    ];

    rerender({
      ids: ['task_1', 'task_2'],
      tasks: updatedTasks,
    });

    // Should have been called again with updated value
    expect(mockUseCopilotReadable).toHaveBeenCalledTimes(2);
    expect(mockUseCopilotReadable.mock.calls[1][0].value.count).toBe(2);
  });
});
