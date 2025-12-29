import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorWidget } from '../ErrorWidget';

describe('ErrorWidget', () => {
  it('renders without crashing', () => {
    render(<ErrorWidget message="Test error" />);
    expect(screen.getByTestId('error-widget')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<ErrorWidget message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays generic title when no widgetType provided', () => {
    render(<ErrorWidget message="Error occurred" />);
    expect(screen.getByText('Widget Error')).toBeInTheDocument();
  });

  it('displays widget-specific title when widgetType provided', () => {
    render(<ErrorWidget message="Error occurred" widgetType="ProjectStatus" />);
    expect(screen.getByText('ProjectStatus Error')).toBeInTheDocument();
  });

  it('displays available widget types when provided', () => {
    const availableTypes = ['ProjectStatus', 'TaskList', 'Metrics'];
    render(
      <ErrorWidget
        message="Unknown widget type"
        availableTypes={availableTypes}
      />
    );

    expect(screen.getByText(/Available types:/)).toBeInTheDocument();
    expect(screen.getByText(/ProjectStatus, TaskList, Metrics/)).toBeInTheDocument();
  });

  it('does not show available types when not provided', () => {
    render(<ErrorWidget message="Error occurred" />);
    expect(screen.queryByText(/Available types:/)).not.toBeInTheDocument();
  });

  it('does not show available types when empty array', () => {
    render(<ErrorWidget message="Error occurred" availableTypes={[]} />);
    expect(screen.queryByText(/Available types:/)).not.toBeInTheDocument();
  });

  it('shows retry button when onRetry provided', () => {
    const handleRetry = vi.fn();
    render(<ErrorWidget message="Error occurred" onRetry={handleRetry} />);

    expect(screen.getByTestId('error-widget-retry')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('does not show retry button when onRetry not provided', () => {
    render(<ErrorWidget message="Error occurred" />);
    expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorWidget message="Error occurred" onRetry={handleRetry} />);

    fireEvent.click(screen.getByTestId('error-widget-retry'));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('has destructive variant styling', () => {
    render(<ErrorWidget message="Error occurred" />);

    const alert = screen.getByTestId('error-widget');
    expect(alert).toHaveClass('border-destructive/50');
  });

  it('displays complex error messages correctly', () => {
    const complexMessage = 'Failed to fetch data from Navi agent: Connection timeout after 30s';
    render(<ErrorWidget message={complexMessage} />);
    expect(screen.getByText(complexMessage)).toBeInTheDocument();
  });

  it('handles long widget type names', () => {
    render(
      <ErrorWidget
        message="Error occurred"
        widgetType="SuperLongWidgetTypeName"
      />
    );
    expect(screen.getByText('SuperLongWidgetTypeName Error')).toBeInTheDocument();
  });
});
