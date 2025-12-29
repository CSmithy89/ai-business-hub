import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TeamActivityWidget } from '../TeamActivityWidget';
import type { TeamActivityData } from '../../types';

describe('TeamActivityWidget', () => {
  const mockData: TeamActivityData = {
    activities: [
      { user: 'John Doe', action: 'completed task', target: 'Fix login bug', time: '2 hours ago' },
      { user: 'Jane Smith', action: 'created', target: 'New feature spec', time: '3 hours ago' },
      { user: 'Bob Wilson', action: 'commented on', target: 'PR #123', time: '5 hours ago' },
    ],
  };

  it('renders without crashing', () => {
    render(<TeamActivityWidget data={mockData} />);
    expect(screen.getByTestId('team-activity-widget')).toBeInTheDocument();
  });

  it('displays default title when not provided', () => {
    render(<TeamActivityWidget data={mockData} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays custom title when provided', () => {
    render(<TeamActivityWidget data={{ ...mockData, title: 'Team Updates' }} />);
    expect(screen.getByText('Team Updates')).toBeInTheDocument();
  });

  it('renders all activities', () => {
    render(<TeamActivityWidget data={mockData} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('displays user initials in avatars', () => {
    render(<TeamActivityWidget data={mockData} />);

    // Check for initials (JD for John Doe, JS for Jane Smith, BW for Bob Wilson)
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.getByText('BW')).toBeInTheDocument();
  });

  it('displays action text correctly', () => {
    render(<TeamActivityWidget data={mockData} />);

    expect(screen.getByText('completed task')).toBeInTheDocument();
    expect(screen.getByText('created')).toBeInTheDocument();
    expect(screen.getByText('commented on')).toBeInTheDocument();
  });

  it('displays targets correctly', () => {
    render(<TeamActivityWidget data={mockData} />);

    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    expect(screen.getByText('New feature spec')).toBeInTheDocument();
    expect(screen.getByText('PR #123')).toBeInTheDocument();
  });

  it('displays timestamps', () => {
    render(<TeamActivityWidget data={mockData} />);

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('3 hours ago')).toBeInTheDocument();
    expect(screen.getByText('5 hours ago')).toBeInTheDocument();
  });

  it('handles activities without target', () => {
    const dataWithoutTarget: TeamActivityData = {
      activities: [
        { user: 'Alice', action: 'logged in', time: '1 hour ago' },
      ],
    };

    render(<TeamActivityWidget data={dataWithoutTarget} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('logged in')).toBeInTheDocument();
    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(<TeamActivityWidget data={mockData} isLoading={true} />);

    expect(screen.getByTestId('widget-skeleton-default')).toBeInTheDocument();
    expect(screen.queryByTestId('team-activity-widget')).not.toBeInTheDocument();
  });

  it('shows empty state when no activities', () => {
    render(<TeamActivityWidget data={{ activities: [] }} />);

    expect(screen.getByTestId('widget-empty')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('shows empty state when activities is undefined', () => {
    render(<TeamActivityWidget data={{} as TeamActivityData} />);

    expect(screen.getByTestId('widget-empty')).toBeInTheDocument();
  });

  it('handles single word user names', () => {
    const dataWithSingleName: TeamActivityData = {
      activities: [
        { user: 'Admin', action: 'updated settings', time: 'just now' },
      ],
    };

    render(<TeamActivityWidget data={dataWithSingleName} />);

    // Should take first two letters: AD
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('renders activity items with correct test ids', () => {
    render(<TeamActivityWidget data={mockData} />);

    expect(screen.getByTestId('activity-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('activity-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-item-2')).toBeInTheDocument();
  });
});
