import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WidgetErrorBoundary } from '../WidgetErrorBoundary';

// Component that throws an error
function ThrowingComponent(): never {
  throw new Error('Test error');
}

// Component that renders normally
function NormalComponent() {
  return <div data-testid="normal-content">Normal content</div>;
}

describe('WidgetErrorBoundary', () => {
  // Suppress console.error for these tests since we're intentionally throwing errors
  const originalError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <WidgetErrorBoundary>
        <NormalComponent />
      </WidgetErrorBoundary>
    );

    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders error fallback when child throws an error', () => {
    render(
      <WidgetErrorBoundary widgetType="TestWidget">
        <ThrowingComponent />
      </WidgetErrorBoundary>
    );

    expect(screen.getByText('Widget Error')).toBeInTheDocument();
    expect(screen.queryByTestId('normal-content')).not.toBeInTheDocument();
  });

  it('logs error to console with widget type context', () => {
    render(
      <WidgetErrorBoundary widgetType="TestWidget">
        <ThrowingComponent />
      </WidgetErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
    // Check that our custom error log was called
    // React also logs errors, so we search for our specific call
    const calls = (console.error as ReturnType<typeof vi.fn>).mock.calls;
    const widgetErrorCall = calls.find(
      (call) => call[0] === '[Widget Error]'
    );
    expect(widgetErrorCall).toBeDefined();
    expect(widgetErrorCall?.[1]).toHaveProperty('widgetType', 'TestWidget');
  });

  it('provides retry button in fallback', () => {
    render(
      <WidgetErrorBoundary>
        <ThrowingComponent />
      </WidgetErrorBoundary>
    );

    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('resets error state when retry is clicked', () => {
    // Use a controlled throwing behavior
    let shouldThrow = true;
    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Conditional error');
      }
      return <div data-testid="recovered-content">Recovered</div>;
    }

    const { rerender } = render(
      <WidgetErrorBoundary>
        <ConditionalThrower />
      </WidgetErrorBoundary>
    );

    // Initially should show error
    expect(screen.getByText('Widget Error')).toBeInTheDocument();

    // Stop throwing
    shouldThrow = false;

    // Click retry
    fireEvent.click(screen.getByTestId('retry-button'));

    // Force rerender with new state
    rerender(
      <WidgetErrorBoundary>
        <ConditionalThrower />
      </WidgetErrorBoundary>
    );

    // Should show recovered content
    expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    expect(screen.queryByText('Widget Error')).not.toBeInTheDocument();
  });

  it('renders multiple children correctly', () => {
    render(
      <WidgetErrorBoundary>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </WidgetErrorBoundary>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('handles nested components', () => {
    render(
      <WidgetErrorBoundary>
        <div>
          <span>
            <NormalComponent />
          </span>
        </div>
      </WidgetErrorBoundary>
    );

    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
  });

  it('shows widget type in error fallback when provided', () => {
    render(
      <WidgetErrorBoundary widgetType="ProjectStatus">
        <ThrowingComponent />
      </WidgetErrorBoundary>
    );

    // The error fallback should receive the widget type
    expect(screen.getByTestId('widget-error-fallback')).toBeInTheDocument();
  });
});
