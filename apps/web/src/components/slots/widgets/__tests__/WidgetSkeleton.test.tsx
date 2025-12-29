import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WidgetSkeleton } from '../WidgetSkeleton';

describe('WidgetSkeleton', () => {
  it('renders default skeleton variant', () => {
    render(<WidgetSkeleton />);

    expect(screen.getByTestId('widget-skeleton-default')).toBeInTheDocument();
  });

  it('renders with default variant explicitly', () => {
    render(<WidgetSkeleton variant="default" />);

    expect(screen.getByTestId('widget-skeleton-default')).toBeInTheDocument();
  });

  it('renders compact variant', () => {
    render(<WidgetSkeleton variant="compact" />);

    expect(screen.getByTestId('widget-skeleton-compact')).toBeInTheDocument();
  });

  it('renders metrics variant with 4 skeleton items', () => {
    render(<WidgetSkeleton variant="metrics" />);

    expect(screen.getByTestId('widget-skeleton-metrics')).toBeInTheDocument();
    // Metrics variant shows 4 skeleton items
    const container = screen.getByTestId('widget-skeleton-metrics');
    const skeletonGroups = container.querySelectorAll('.space-y-2');
    expect(skeletonGroups).toHaveLength(4);
  });

  it('renders alert variant', () => {
    render(<WidgetSkeleton variant="alert" />);

    expect(screen.getByTestId('widget-skeleton-alert')).toBeInTheDocument();
  });

  it('default variant uses Card component', () => {
    render(<WidgetSkeleton variant="default" />);

    const card = screen.getByTestId('widget-skeleton-default');
    expect(card).toHaveAttribute('data-card', 'true');
  });

  it('metrics variant uses Card component', () => {
    render(<WidgetSkeleton variant="metrics" />);

    const card = screen.getByTestId('widget-skeleton-metrics');
    expect(card).toHaveAttribute('data-card', 'true');
  });

  it('alert variant renders border and rounded styling', () => {
    render(<WidgetSkeleton variant="alert" />);

    const alert = screen.getByTestId('widget-skeleton-alert');
    expect(alert.className).toContain('rounded-lg');
    expect(alert.className).toContain('border');
  });
});
