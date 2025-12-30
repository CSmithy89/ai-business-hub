/**
 * TaskProgressCard Component Tests
 *
 * Tests for the TaskProgressCard component rendering and interactions.
 *
 * @see docs/modules/bm-dm/stories/dm-05-4-realtime-progress-streaming.md
 * Epic: DM-05 | Story: DM-05.4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskProgressCard } from '../TaskProgressCard';
import type { TaskProgress } from '@/lib/schemas/dashboard-state';

describe('TaskProgressCard', () => {
  const createMockTask = (overrides: Partial<TaskProgress> = {}): TaskProgress => ({
    taskId: 'task_1',
    taskName: 'Research Competitors',
    status: 'running',
    currentStep: 1,
    totalSteps: 3,
    steps: [
      { index: 0, name: 'Gather data', status: 'completed', completedAt: Date.now() - 1000 },
      { index: 1, name: 'Analyze data', status: 'running', startedAt: Date.now() - 500, progress: 50 },
      { index: 2, name: 'Generate report', status: 'pending' },
    ],
    startedAt: Date.now() - 5000,
    estimatedCompletionMs: 10000,
    ...overrides,
  });

  it('renders task name and status badge', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Research Competitors')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders with pending status', () => {
    const task = createMockTask({ status: 'pending' });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders with completed status', () => {
    const task = createMockTask({ status: 'completed' });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders with failed status', () => {
    const task = createMockTask({ status: 'failed' });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders with cancelled status', () => {
    const task = createMockTask({ status: 'cancelled' });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('shows progress percentage', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    // With 1 completed step and 1 running at 50%, weighted progress is ~50%
    expect(screen.getByText(/\d+%/)).toBeInTheDocument();
  });

  it('shows step count', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
  });

  it('renders step list with step names', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('Gather data')).toBeInTheDocument();
    expect(screen.getByText('Analyze data')).toBeInTheDocument();
    expect(screen.getByText('Generate report')).toBeInTheDocument();
  });

  it('shows step progress for running step', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    // The running step shows 50% progress
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('hides steps when showSteps is false', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} showSteps={false} />);

    expect(screen.queryByText('Gather data')).not.toBeInTheDocument();
    expect(screen.queryByText('Analyze data')).not.toBeInTheDocument();
    expect(screen.queryByText('Generate report')).not.toBeInTheDocument();
  });

  it('shows cancel button for running tasks', () => {
    const task = createMockTask();
    const onCancel = vi.fn();
    render(<TaskProgressCard task={task} onCancel={onCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    expect(cancelBtn).toBeInTheDocument();

    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledWith('task_1');
  });

  it('shows cancel button for pending tasks', () => {
    const task = createMockTask({ status: 'pending' });
    const onCancel = vi.fn();
    render(<TaskProgressCard task={task} onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not show cancel button when onCancel is not provided', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows dismiss button for completed tasks', () => {
    const task = createMockTask({ status: 'completed' });
    const onDismiss = vi.fn();
    render(<TaskProgressCard task={task} onDismiss={onDismiss} />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissBtn).toBeInTheDocument();

    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledWith('task_1');
  });

  it('shows dismiss button for failed tasks', () => {
    const task = createMockTask({ status: 'failed' });
    const onDismiss = vi.fn();
    render(<TaskProgressCard task={task} onDismiss={onDismiss} />);

    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('shows dismiss button for cancelled tasks', () => {
    const task = createMockTask({ status: 'cancelled' });
    const onDismiss = vi.fn();
    render(<TaskProgressCard task={task} onDismiss={onDismiss} />);

    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('does not show dismiss button for running tasks', () => {
    const task = createMockTask();
    const onDismiss = vi.fn();
    render(<TaskProgressCard task={task} onDismiss={onDismiss} />);

    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('shows error message for failed tasks', () => {
    const task = createMockTask({ status: 'failed', error: 'API timeout' });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('API timeout')).toBeInTheDocument();
  });

  it('does not show error message when no error', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('shows elapsed time', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    // Should show elapsed time (e.g., "5s elapsed")
    expect(screen.getByText(/elapsed/i)).toBeInTheDocument();
  });

  it('shows estimated time remaining', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    // Should show remaining time
    expect(screen.getByText(/remaining/i)).toBeInTheDocument();
  });

  it('does not show remaining time for completed tasks', () => {
    const task = createMockTask({ status: 'completed' });
    render(<TaskProgressCard task={task} />);

    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
  });

  it('handles missing optional callbacks', () => {
    const task = createMockTask();

    // Should not throw
    expect(() => render(<TaskProgressCard task={task} />)).not.toThrow();
  });

  it('applies custom className', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} className="custom-class" />);

    const card = screen.getByTestId('task-progress-card');
    expect(card).toHaveClass('custom-class');
  });

  it('has correct data-testid', () => {
    const task = createMockTask();
    render(<TaskProgressCard task={task} />);

    expect(screen.getByTestId('task-progress-card')).toBeInTheDocument();
  });

  it('handles empty steps array', () => {
    const task = createMockTask({ steps: [], totalSteps: 0, currentStep: 0 });
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText(/Step 1 of 0/)).toBeInTheDocument();
  });

  it('handles task without estimated completion', () => {
    const task = createMockTask({ estimatedCompletionMs: undefined });
    render(<TaskProgressCard task={task} />);

    // Should not show remaining time
    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
  });

  it('handles task without started time', () => {
    const task = createMockTask({ startedAt: undefined });
    render(<TaskProgressCard task={task} />);

    // Should not show elapsed time
    expect(screen.queryByText(/elapsed/i)).not.toBeInTheDocument();
  });
});

describe('TaskProgressCard progress calculation', () => {
  it('calculates 0% for no completed steps', () => {
    const task: TaskProgress = {
      taskId: 'task_1',
      taskName: 'Test',
      status: 'running',
      currentStep: 0,
      totalSteps: 3,
      steps: [
        { index: 0, name: 'Step 1', status: 'pending' },
        { index: 1, name: 'Step 2', status: 'pending' },
        { index: 2, name: 'Step 3', status: 'pending' },
      ],
    };
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('calculates 100% for all completed steps', () => {
    const task: TaskProgress = {
      taskId: 'task_1',
      taskName: 'Test',
      status: 'completed',
      currentStep: 2,
      totalSteps: 3,
      steps: [
        { index: 0, name: 'Step 1', status: 'completed' },
        { index: 1, name: 'Step 2', status: 'completed' },
        { index: 2, name: 'Step 3', status: 'completed' },
      ],
    };
    render(<TaskProgressCard task={task} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('includes sub-step progress in calculation', () => {
    const task: TaskProgress = {
      taskId: 'task_1',
      taskName: 'Test',
      status: 'running',
      currentStep: 1,
      totalSteps: 2,
      steps: [
        { index: 0, name: 'Step 1', status: 'completed' },
        { index: 1, name: 'Step 2', status: 'running', progress: 50 },
      ],
    };
    render(<TaskProgressCard task={task} />);

    // (100 + 50) / 2 = 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
