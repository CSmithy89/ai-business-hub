import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectStatusWidget } from '../ProjectStatusWidget';
import type { ProjectStatusData } from '../../types';

const mockData: ProjectStatusData = {
  projectId: 'proj_123',
  projectName: 'Test Project',
  status: 'on_track',
  progress: 75,
  tasksCompleted: 15,
  tasksTotal: 20,
  dueDate: '2025-01-15',
};

describe('ProjectStatusWidget', () => {
  it('renders project name', () => {
    render(<ProjectStatusWidget data={mockData} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<ProjectStatusWidget data={mockData} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(<ProjectStatusWidget data={mockData} />);

    expect(screen.getByText('15/20')).toBeInTheDocument();
  });

  it('renders On Track status badge', () => {
    render(<ProjectStatusWidget data={mockData} />);

    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders At Risk status badge', () => {
    render(<ProjectStatusWidget data={{ ...mockData, status: 'at_risk' }} />);

    expect(screen.getByText('At Risk')).toBeInTheDocument();
  });

  it('renders Behind status badge', () => {
    render(<ProjectStatusWidget data={{ ...mockData, status: 'behind' }} />);

    expect(screen.getByText('Behind')).toBeInTheDocument();
  });

  it('renders formatted due date', () => {
    render(<ProjectStatusWidget data={mockData} />);

    // Date should be formatted as "Jan 15, 2025"
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
  });

  it('does not render due date when not provided', () => {
    const dataWithoutDueDate = { ...mockData, dueDate: undefined };
    render(<ProjectStatusWidget data={dataWithoutDueDate} />);

    expect(screen.queryByText('Jan 15, 2025')).not.toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<ProjectStatusWidget data={mockData} isLoading />);

    expect(screen.queryByText('Test Project')).not.toBeInTheDocument();
    expect(screen.getByTestId('widget-skeleton-default')).toBeInTheDocument();
  });

  it('renders empty state when data is empty', () => {
    render(<ProjectStatusWidget data={{} as ProjectStatusData} />);

    expect(screen.getByText('No project data available')).toBeInTheDocument();
  });

  it('renders empty state when projectName is missing', () => {
    render(
      <ProjectStatusWidget
        data={{ ...mockData, projectName: '' } as ProjectStatusData}
      />
    );

    expect(screen.getByText('No project data available')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<ProjectStatusWidget data={mockData} />);

    expect(screen.getByTestId('project-status-widget')).toBeInTheDocument();
  });

  it('clamps progress to 100 when exceeding', () => {
    render(<ProjectStatusWidget data={{ ...mockData, progress: 150 }} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps progress to 0 when negative', () => {
    render(<ProjectStatusWidget data={{ ...mockData, progress: -10 }} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders progress bar with aria-label', () => {
    render(<ProjectStatusWidget data={mockData} />);

    // Check for the progress element with accessibility label
    const progressLabel = screen.getByLabelText('Project progress: 75%');
    expect(progressLabel).toBeInTheDocument();
  });

  it('uses Card component for container', () => {
    render(<ProjectStatusWidget data={mockData} />);

    const widget = screen.getByTestId('project-status-widget');
    expect(widget).toHaveAttribute('data-card', 'true');
  });
});
