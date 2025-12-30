/**
 * DashboardGrid Component Tests - Story DM-03.5
 *
 * Tests for the responsive grid layout component that displays agent-driven widgets.
 *
 * @see docs/modules/bm-dm/stories/dm-03-5-end-to-end-testing.md
 * @see docs/modules/bm-dm/epics/epic-dm-03-tech-spec.md - Section 3.4
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardGrid } from '../DashboardGrid';

describe('DashboardGrid', () => {
  it('renders children correctly', () => {
    render(
      <DashboardGrid>
        <div data-testid="child-widget">Test Widget</div>
      </DashboardGrid>
    );

    expect(screen.getByTestId('child-widget')).toBeInTheDocument();
    expect(screen.getByText('Test Widget')).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <DashboardGrid>
        <div data-testid="widget-1">Widget 1</div>
        <div data-testid="widget-2">Widget 2</div>
        <div data-testid="widget-3">Widget 3</div>
      </DashboardGrid>
    );

    expect(screen.getByTestId('widget-1')).toBeInTheDocument();
    expect(screen.getByTestId('widget-2')).toBeInTheDocument();
    expect(screen.getByTestId('widget-3')).toBeInTheDocument();
  });

  it('has correct test id', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    expect(screen.getByTestId('dashboard-grid')).toBeInTheDocument();
  });

  it('has region role for accessibility', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid).toHaveAttribute('role', 'region');
  });

  it('has aria-label for accessibility', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid).toHaveAttribute('aria-label', 'Dashboard widgets');
  });

  it('applies grid layout classes', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('gap-4');
  });

  it('applies responsive column classes', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    // Mobile: 1 column
    expect(grid.className).toContain('grid-cols-1');
    // Tablet: 2 columns
    expect(grid.className).toContain('sm:grid-cols-2');
    // Desktop: 3 columns
    expect(grid.className).toContain('lg:grid-cols-3');
  });

  it('applies auto-rows class for dynamic heights', () => {
    render(
      <DashboardGrid>
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid.className).toContain('auto-rows-auto');
  });

  it('accepts and applies additional className', () => {
    render(
      <DashboardGrid className="custom-class">
        <div>Content</div>
      </DashboardGrid>
    );

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid.className).toContain('custom-class');
    // Should still have base classes
    expect(grid.className).toContain('grid');
  });

  it('renders empty when no children provided', () => {
    render(<DashboardGrid>{null}</DashboardGrid>);

    const grid = screen.getByTestId('dashboard-grid');
    expect(grid).toBeInTheDocument();
    expect(grid.children.length).toBe(0);
  });
});
