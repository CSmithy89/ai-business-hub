import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskListWidget } from '../TaskListWidget';
import type { TaskListData } from '../../types';

const mockData: TaskListData = {
  tasks: [
    { id: '1', title: 'Task 1', status: 'done', priority: 'high' },
    { id: '2', title: 'Task 2', status: 'in_progress', priority: 'medium' },
    { id: '3', title: 'Task 3', status: 'todo', priority: 'low' },
  ],
};

describe('TaskListWidget', () => {
  it('renders all tasks', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByText('3 total')).toBeInTheDocument();
  });

  it('renders default title when not provided', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<TaskListWidget data={{ ...mockData, title: 'My Tasks' }} />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
  });

  it('respects limit prop', () => {
    render(<TaskListWidget data={{ ...mockData, limit: 2 }} />);

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
  });

  it('shows more tasks indicator when limit is exceeded', () => {
    render(<TaskListWidget data={{ ...mockData, limit: 2 }} />);

    expect(screen.getByText('+1 more tasks')).toBeInTheDocument();
  });

  it('does not show more indicator when all tasks fit within limit', () => {
    render(<TaskListWidget data={{ ...mockData, limit: 5 }} />);

    expect(screen.queryByText(/more tasks/)).not.toBeInTheDocument();
  });

  it('renders priority badges', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    render(<TaskListWidget data={{ tasks: [] }} />);

    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
  });

  it('renders empty state when tasks is undefined', () => {
    render(<TaskListWidget data={{ tasks: undefined } as unknown as TaskListData} />);

    expect(screen.getByText('No tasks to display')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<TaskListWidget data={mockData} isLoading />);

    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('widget-skeleton-default')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByTestId('task-list-widget')).toBeInTheDocument();
  });

  it('renders each task with test id', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.getByTestId('task-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('task-item-3')).toBeInTheDocument();
  });

  it('renders task list with aria role and label', () => {
    render(<TaskListWidget data={mockData} />);

    const list = screen.getByRole('list', { name: 'Task list' });
    expect(list).toBeInTheDocument();
  });

  it('applies strikethrough styling to done tasks', () => {
    render(<TaskListWidget data={mockData} />);

    const doneTask = screen.getByText('Task 1');
    expect(doneTask.className).toContain('line-through');
  });

  it('does not apply strikethrough to non-done tasks', () => {
    render(<TaskListWidget data={mockData} />);

    const inProgressTask = screen.getByText('Task 2');
    expect(inProgressTask.className).not.toContain('line-through');
  });

  it('renders assignee when provided', () => {
    const dataWithAssignee: TaskListData = {
      tasks: [
        { id: '1', title: 'Task 1', status: 'todo', priority: 'high', assignee: 'John Doe' },
      ],
    };
    render(<TaskListWidget data={dataWithAssignee} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not render assignee when not provided', () => {
    render(<TaskListWidget data={mockData} />);

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });
});
