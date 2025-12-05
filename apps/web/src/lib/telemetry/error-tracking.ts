/**
 * Error Tracking Infrastructure
 *
 * Centralized error tracking and telemetry for the application.
 * Provides a unified interface for error reporting that can be
 * connected to services like Sentry, LogRocket, or custom backends.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_ERROR_TRACKING_ENABLED: 'true' to enable
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN if using Sentry
 * - NEXT_PUBLIC_APP_ENVIRONMENT: 'development' | 'staging' | 'production'
 *
 * @module telemetry/error-tracking
 */

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info'

/**
 * Error context for additional metadata
 */
export interface ErrorContext {
  /** Unique tags for filtering (e.g., epic: 'onboarding') */
  tags?: Record<string, string>
  /** Additional key-value data */
  extra?: Record<string, unknown>
  /** User information (automatically added if available) */
  user?: {
    id?: string
    email?: string
    username?: string
  }
  /** Severity level */
  level?: ErrorSeverity
  /** Module or feature where error occurred */
  module?: string
  /** Operation being performed when error occurred */
  operation?: string
  /** Request ID for correlation */
  requestId?: string
}

/**
 * Error tracking configuration
 */
interface ErrorTrackingConfig {
  /** Whether error tracking is enabled */
  enabled: boolean
  /** Current environment */
  environment: string
  /** Application version */
  release?: string
  /** Sample rate for performance monitoring (0-1) */
  sampleRate: number
}

/**
 * Get current configuration from environment
 */
function getConfig(): ErrorTrackingConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true',
    environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    sampleRate: parseFloat(process.env.NEXT_PUBLIC_ERROR_SAMPLE_RATE || '1.0'),
  }
}

/**
 * Initialize error tracking (call once at app startup)
 *
 * For Sentry integration:
 * ```typescript
 * import * as Sentry from '@sentry/nextjs'
 *
 * export function initializeErrorTracking() {
 *   if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
 *     Sentry.init({
 *       dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
 *       environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT,
 *       tracesSampleRate: 1.0,
 *     })
 *   }
 * }
 * ```
 */
export function initializeErrorTracking(): void {
  const config = getConfig()

  if (!config.enabled) {
    console.log('[ErrorTracking] Disabled in configuration')
    return
  }

  // TODO: Initialize Sentry or other error tracking service
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... })

  console.log('[ErrorTracking] Initialized', {
    environment: config.environment,
    release: config.release,
    sampleRate: config.sampleRate,
  })
}

/**
 * Capture and report an exception
 *
 * @param error - The error to capture
 * @param context - Additional context about the error
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   captureException(error, {
 *     tags: { epic: 'onboarding' },
 *     module: 'businesses',
 *     operation: 'create',
 *   })
 * }
 * ```
 */
export function captureException(error: Error | unknown, context?: ErrorContext): void {
  const config = getConfig()

  // Always log to console in development
  if (config.environment === 'development') {
    console.error('[Error]', error, context)
  }

  if (!config.enabled) {
    return
  }

  // Sample rate check for non-fatal errors
  if (context?.level !== 'fatal' && Math.random() > config.sampleRate) {
    return
  }

  // TODO: Send to error tracking service
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureException(error, {
  //   tags: context?.tags,
  //   extra: context?.extra,
  //   level: context?.level || 'error',
  //   user: context?.user,
  // })

  // For now, structured logging
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    ...context,
    environment: config.environment,
    release: config.release,
  }

  // In production, this could be sent to a logging service
  if (config.environment === 'production') {
    console.error('[ErrorTracking]', JSON.stringify(errorLog))
  }
}

/**
 * Capture a message (for non-error events)
 *
 * @param message - Message to capture
 * @param context - Additional context
 */
export function captureMessage(message: string, context?: ErrorContext): void {
  const config = getConfig()

  if (config.environment === 'development') {
    console.log('[Message]', message, context)
  }

  if (!config.enabled) {
    return
  }

  // TODO: Send to error tracking service
  // Sentry.captureMessage(message, { ...context })

  const messageLog = {
    timestamp: new Date().toISOString(),
    message,
    ...context,
    environment: config.environment,
  }

  if (config.environment !== 'development') {
    console.log('[ErrorTracking]', JSON.stringify(messageLog))
  }
}

/**
 * Set user context for error tracking
 *
 * @param user - User information
 */
export function setUser(user: ErrorContext['user'] | null): void {
  const config = getConfig()

  if (!config.enabled) {
    return
  }

  // TODO: Set user in error tracking service
  // Sentry.setUser(user)

  if (config.environment === 'development') {
    console.log('[ErrorTracking] User context set', user)
  }
}

/**
 * Add breadcrumb for debugging
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  category?: string
  message: string
  level?: ErrorSeverity
  data?: Record<string, unknown>
}): void {
  const config = getConfig()

  if (!config.enabled) {
    return
  }

  // TODO: Add breadcrumb to error tracking service
  // Sentry.addBreadcrumb(breadcrumb)

  if (config.environment === 'development') {
    console.log('[Breadcrumb]', breadcrumb)
  }
}

/**
 * Start a performance transaction span
 *
 * @param name - Transaction name
 * @param op - Operation type
 * @returns Transaction finish function
 */
export function startTransaction(
  name: string,
  op: string
): { finish: () => void; setTag: (key: string, value: string) => void } {
  const config = getConfig()
  const startTime = performance.now()

  // TODO: Start Sentry transaction
  // const transaction = Sentry.startTransaction({ name, op })

  return {
    finish: () => {
      const duration = performance.now() - startTime

      if (config.environment === 'development') {
        console.log(`[Performance] ${name} (${op}): ${duration.toFixed(2)}ms`)
      }

      // TODO: Finish Sentry transaction
      // transaction.finish()
    },
    setTag: (key: string, value: string) => {
      // TODO: Set tag on transaction
      // transaction.setTag(key, value)

      if (config.environment === 'development') {
        console.log(`[Performance Tag] ${name}: ${key}=${value}`)
      }
    },
  }
}

/**
 * Higher-order function to wrap async operations with error tracking
 *
 * @param operation - Operation name for context
 * @param module - Module name for context
 * @param fn - Function to wrap
 * @returns Wrapped function
 *
 * @example
 * ```typescript
 * const createBusiness = withErrorTracking(
 *   'create',
 *   'businesses',
 *   async (data: BusinessData) => {
 *     return await prisma.business.create({ data })
 *   }
 * )
 * ```
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  operation: string,
  module: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const transaction = startTransaction(`${module}.${operation}`, 'function')

    try {
      const result = await fn(...args)
      transaction.finish()
      return result
    } catch (error) {
      captureException(error, {
        module,
        operation,
        extra: { args: args.length > 0 ? 'provided' : 'none' },
      })
      transaction.finish()
      throw error
    }
  }) as T
}
