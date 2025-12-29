'use client';

/**
 * Widget Error Boundary Component
 *
 * Catches errors in widget rendering and displays a fallback UI.
 * This is a React class component since error boundaries require
 * getDerivedStateFromError and componentDidCatch lifecycle methods.
 *
 * Features:
 * - Catches render errors in widget components
 * - Logs errors with widget type context
 * - Provides retry mechanism via state reset
 * - Shows WidgetErrorFallback on error
 *
 * Limitations (React Error Boundary):
 * - Cannot catch event handler errors
 * - Cannot catch async errors (promises)
 * - Cannot catch server-side rendering errors
 * - Cannot catch errors in the error boundary itself
 *
 * @see docs/modules/bm-dm/stories/dm-01-2-slot-system-foundation.md
 */

import React from 'react';
import { WidgetErrorFallback } from './WidgetErrorFallback';
import type { WidgetErrorBoundaryProps } from './types';

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<WidgetErrorBoundaryProps, State> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error with widget context for debugging
    console.error('[Widget Error]', {
      error,
      componentStack: errorInfo.componentStack,
      widgetType: this.props.widgetType,
    });
  }

  handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({ hasError: false, error: undefined });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          error={this.state.error}
          widgetType={this.props.widgetType}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
