/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Prevents entire application from crashing due to component errors.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 *
 * Epic: 07 - UI Shell
 * Technical Debt: Add error boundaries to dashboard layout
 */

'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback UI to render when an error occurs */
  fallback?: ReactNode;
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Return fallback UI or default error message
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-4 text-[rgb(var(--color-text-secondary))]">
            <div className="text-center">
              <span className="material-symbols-rounded text-4xl text-[rgb(var(--color-error))]">
                error
              </span>
              <p className="mt-2 text-sm">Something went wrong</p>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-2 text-xs text-[rgb(var(--color-primary))] hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Specialized error fallback components for different layout sections
 */

export function SidebarErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-[rgb(var(--color-text-secondary))]">
      <span className="material-symbols-rounded text-2xl text-[rgb(var(--color-error))]">
        error
      </span>
      <p className="mt-2 text-xs">Navigation unavailable</p>
    </div>
  );
}

export function ChatPanelErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-[rgb(var(--color-text-secondary))]">
      <span className="material-symbols-rounded text-2xl text-[rgb(var(--color-error))]">
        chat_error
      </span>
      <p className="mt-2 text-xs">Chat unavailable</p>
    </div>
  );
}

export function HeaderErrorFallback() {
  return (
    <div className="flex h-[60px] w-full items-center justify-center bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))]">
      <p className="text-xs">Header unavailable</p>
    </div>
  );
}

export function MainContentErrorFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-[rgb(var(--color-text-secondary))]">
      <span className="material-symbols-rounded text-5xl text-[rgb(var(--color-error))]">
        error_outline
      </span>
      <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm">
        An error occurred while loading this page.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-[rgb(var(--color-primary))] px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Reload page
      </button>
    </div>
  );
}
