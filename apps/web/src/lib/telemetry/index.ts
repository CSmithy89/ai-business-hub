/**
 * Telemetry Module
 *
 * Exports error tracking and observability utilities.
 *
 * @module telemetry
 */

export {
  initializeErrorTracking,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  withErrorTracking,
  type ErrorSeverity,
  type ErrorContext,
} from './error-tracking'
