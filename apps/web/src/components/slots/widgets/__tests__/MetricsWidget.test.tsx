import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsWidget } from '../MetricsWidget';
import type { MetricsData } from '../../types';

const mockData: MetricsData = {
  metrics: [
    { label: 'Tasks', value: 42, change: { value: 12, direction: 'up' } },
    { label: 'Hours', value: '168h' },
    { label: 'Team', value: 8, change: { value: 5, direction: 'down' } },
  ],
};

describe('MetricsWidget', () => {
  it('renders metric values', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('168h')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders metric labels', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('renders positive change indicator with + prefix', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders negative change indicator with - prefix', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('does not render change indicator when not provided', () => {
    render(<MetricsWidget data={mockData} />);

    // The "Hours" metric has no change indicator
    const hourMetric = screen.getByTestId('metric-item-1');
    expect(hourMetric.textContent).toContain('Hours');
    expect(hourMetric.textContent).toContain('168h');
    expect(hourMetric.textContent).not.toContain('%');
  });

  it('renders title when provided', () => {
    render(<MetricsWidget data={{ ...mockData, title: 'Project Metrics' }} />);

    expect(screen.getByText('Project Metrics')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(<MetricsWidget data={mockData} />);

    // Default data has no title
    const cardHeader = screen.queryByRole('heading');
    expect(cardHeader).not.toBeInTheDocument();
  });

  it('renders empty state when no metrics', () => {
    render(<MetricsWidget data={{ metrics: [] }} />);

    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });

  it('renders empty state when metrics is undefined', () => {
    render(<MetricsWidget data={{ metrics: undefined } as unknown as MetricsData} />);

    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<MetricsWidget data={mockData} isLoading />);

    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    expect(screen.getByTestId('widget-skeleton-metrics')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByTestId('metrics-widget')).toBeInTheDocument();
  });

  it('renders each metric with test id', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByTestId('metric-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('metric-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('metric-item-2')).toBeInTheDocument();
  });

  it('renders icons when provided', () => {
    const dataWithIcons: MetricsData = {
      metrics: [
        { label: 'Tasks', value: 42, icon: 'tasks' },
        { label: 'Users', value: 8, icon: 'users' },
      ],
    };
    render(<MetricsWidget data={dataWithIcons} />);

    // Icons are rendered with aria-hidden
    const icons = screen.getByTestId('metrics-widget').querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(2);
  });

  it('uses Card component for container', () => {
    render(<MetricsWidget data={mockData} />);

    const widget = screen.getByTestId('metrics-widget');
    expect(widget).toHaveAttribute('data-card', 'true');
  });

  it('applies green color for up trend', () => {
    render(<MetricsWidget data={mockData} />);

    const upChange = screen.getByText('+12%').parentElement;
    expect(upChange?.className).toContain('green');
  });

  it('applies red color for down trend', () => {
    render(<MetricsWidget data={mockData} />);

    const downChange = screen.getByText('-5%').parentElement;
    expect(downChange?.className).toContain('red');
  });

  it('has aria-label on change indicators', () => {
    render(<MetricsWidget data={mockData} />);

    expect(screen.getByLabelText('Increased by 12%')).toBeInTheDocument();
    expect(screen.getByLabelText('Decreased by 5%')).toBeInTheDocument();
  });
});
