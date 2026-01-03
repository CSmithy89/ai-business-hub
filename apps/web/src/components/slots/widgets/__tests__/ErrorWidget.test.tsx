import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ErrorWidget } from '../ErrorWidget';

describe('ErrorWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =============================================================================
  // BASIC RENDERING TESTS
  // =============================================================================

  describe('basic rendering', () => {
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

  // =============================================================================
  // AVAILABLE TYPES TESTS
  // =============================================================================

  describe('available types', () => {
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
  });

  // =============================================================================
  // RETRY BUTTON TESTS (BASIC)
  // =============================================================================

  describe('retry button (basic)', () => {
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

    it('calls onRetry when retry button clicked', async () => {
      const handleRetry = vi.fn();
      render(<ErrorWidget message="Error occurred" onRetry={handleRetry} />);

      await act(async () => {
        fireEvent.click(screen.getByTestId('error-widget-retry'));
      });

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  // =============================================================================
  // RETRY COUNT TESTS (DM-11.10)
  // =============================================================================

  describe('retry count and limits', () => {
    it('shows retry button when retryCount is 0 (default)', () => {
      const handleRetry = vi.fn();
      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      expect(screen.getByTestId('error-widget-retry')).toBeInTheDocument();
      // Should show "Retry" without count on first attempt
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('shows retry count when retryCount > 0', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={1}
          maxRetries={3}
        />
      );

      expect(screen.getByText('Retry (1/3)')).toBeInTheDocument();
    });

    it('shows retry count at second retry', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={2}
          maxRetries={3}
        />
      );

      expect(screen.getByText('Retry (2/3)')).toBeInTheDocument();
    });

    it('hides retry button and shows exhausted message when max retries exceeded', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={3}
          maxRetries={3}
        />
      );

      expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-widget-retries-exhausted')).toBeInTheDocument();
      expect(screen.getByText(/Maximum retries \(3\) exceeded/)).toBeInTheDocument();
    });

    it('respects custom maxRetries value', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={5}
          maxRetries={5}
        />
      );

      expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
      expect(screen.getByText(/Maximum retries \(5\) exceeded/)).toBeInTheDocument();
    });

    it('shows retry button when retryCount equals maxRetries - 1', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={2}
          maxRetries={3}
        />
      );

      expect(screen.getByTestId('error-widget-retry')).toBeInTheDocument();
    });

    it('does not show exhausted message when no onRetry provided', () => {
      render(<ErrorWidget message="Error" retryCount={5} maxRetries={3} />);

      expect(screen.queryByTestId('error-widget-retries-exhausted')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // LOADING STATE TESTS (DM-11.10)
  // =============================================================================

  describe('loading state during retry', () => {
    it('shows loading spinner during async retry', async () => {
      vi.useRealTimers(); // Use real timers for async tests

      let resolveRetry: () => void;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });
      const handleRetry = vi.fn(() => retryPromise);

      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      // Click retry
      fireEvent.click(screen.getByTestId('error-widget-retry'));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('error-widget-retry-spinner')).toBeInTheDocument();
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveRetry!();
      await waitFor(() => {
        expect(screen.queryByTestId('error-widget-retry-spinner')).not.toBeInTheDocument();
      });
    });

    it('disables retry button during loading', async () => {
      vi.useRealTimers();

      let resolveRetry: () => void;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });
      const handleRetry = vi.fn(() => retryPromise);

      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      const retryButton = screen.getByTestId('error-widget-retry');
      expect(retryButton).not.toBeDisabled();

      // Click retry
      fireEvent.click(retryButton);

      // Should be disabled during loading
      await waitFor(() => {
        expect(retryButton).toBeDisabled();
      });

      // Resolve
      resolveRetry!();
      await waitFor(() => {
        expect(retryButton).not.toBeDisabled();
      });
    });

    it('resets loading state on retry error', async () => {
      vi.useRealTimers();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handleRetry = vi.fn(() => Promise.reject(new Error('Retry failed')));

      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      const retryButton = screen.getByTestId('error-widget-retry');
      fireEvent.click(retryButton);

      // Should show loading
      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      // Should reset after error
      await waitFor(() => {
        expect(screen.queryByTestId('error-widget-retry-spinner')).not.toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorWidget] Retry failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('prevents multiple clicks during loading', async () => {
      vi.useRealTimers();

      let resolveRetry: () => void;
      const retryPromise = new Promise<void>((resolve) => {
        resolveRetry = resolve;
      });
      const handleRetry = vi.fn(() => retryPromise);

      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      const retryButton = screen.getByTestId('error-widget-retry');

      // Click multiple times
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      // Should only call once
      expect(handleRetry).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveRetry!();
      await waitFor(() => {
        expect(screen.queryByTestId('error-widget-retry-spinner')).not.toBeInTheDocument();
      });
    });

    it('handles sync onRetry callback', async () => {
      vi.useRealTimers();

      const handleRetry = vi.fn();
      render(<ErrorWidget message="Error" onRetry={handleRetry} />);

      fireEvent.click(screen.getByTestId('error-widget-retry'));

      // Sync callbacks should work too
      await waitFor(() => {
        expect(handleRetry).toHaveBeenCalledTimes(1);
      });

      // Should not show spinner after sync callback
      expect(screen.queryByTestId('error-widget-retry-spinner')).not.toBeInTheDocument();
    });
  });

  // =============================================================================
  // EDGE CASES
  // =============================================================================

  describe('edge cases', () => {
    it('handles undefined retryCount', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          maxRetries={3}
        />
      );

      // Should use default of 0 and show button
      expect(screen.getByTestId('error-widget-retry')).toBeInTheDocument();
    });

    it('handles undefined maxRetries', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={4}
        />
      );

      // Default maxRetries is 3, so retryCount=4 should be exhausted
      expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-widget-retries-exhausted')).toBeInTheDocument();
    });

    it('handles maxRetries of 0 (no retries allowed)', () => {
      const handleRetry = vi.fn();
      render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={0}
          maxRetries={0}
        />
      );

      // No retries allowed - should show exhausted immediately
      expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-widget-retries-exhausted')).toBeInTheDocument();
    });

    it('handles maxRetries of 1', () => {
      const handleRetry = vi.fn();
      const { rerender } = render(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={0}
          maxRetries={1}
        />
      );

      // First attempt - should show button
      expect(screen.getByTestId('error-widget-retry')).toBeInTheDocument();

      // After one retry
      rerender(
        <ErrorWidget
          message="Error"
          onRetry={handleRetry}
          retryCount={1}
          maxRetries={1}
        />
      );

      // Should be exhausted
      expect(screen.queryByTestId('error-widget-retry')).not.toBeInTheDocument();
      expect(screen.getByTestId('error-widget-retries-exhausted')).toBeInTheDocument();
    });
  });
});
