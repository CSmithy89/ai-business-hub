'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Fallback UI to show when error occurs */
  fallback?: ReactNode
  /** Custom error message */
  errorMessage?: string
  /** Whether to show retry button */
  showRetry?: boolean
  /** Callback when retry is clicked */
  onRetry?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Use this to wrap data-fetching components to prevent crashes from propagating.
 *
 * @example
 * <ErrorBoundary
 *   errorMessage="Failed to load approval data"
 *   onRetry={() => refetch()}
 * >
 *   <ApprovalStats />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void (async () => {
      try {
        const { captureException, addBreadcrumb } = await import('@/lib/telemetry/error-tracking')

        const message = error instanceof Error ? error.message : String(error)
        const stackRaw = errorInfo?.componentStack ?? ''
        const sanitizedStack = stackRaw.replace(/\/[^\s)]+/g, '[path]').slice(0, 500)

        addBreadcrumb({
          category: 'error-boundary',
          message,
          level: 'error',
          data: { componentStack: sanitizedStack },
        })
        const errForCapture = error instanceof Error ? error : new Error(String(error))

        captureException(errForCapture, {
          tags: { feature: 'error-boundary' },
          extra: {
            componentStack: sanitizedStack,
          },
        })
      } catch (telemetryError) {
        // Avoid throwing from the error handler itself
         
        console.error('[ErrorBoundary] failed to report error', telemetryError)
      }
    })()
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null }, () => {
      this.props.onRetry?.()
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Something went wrong</h3>
              <p className="text-sm text-red-700 mb-3">
                {this.props.errorMessage || 'An unexpected error occurred. Please try again.'}
              </p>
              {(this.props.showRetry !== false) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={this.handleRetry}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Functional wrapper for ErrorBoundary with key-based reset
 */
interface ErrorBoundaryWithResetProps extends Omit<ErrorBoundaryProps, 'onRetry'> {
  /** Key to trigger reset when changed */
  resetKey?: string | number
}

export function ErrorBoundaryWithReset({
  resetKey,
  ...props
}: ErrorBoundaryWithResetProps) {
  return <ErrorBoundary key={resetKey} {...props} />
}
