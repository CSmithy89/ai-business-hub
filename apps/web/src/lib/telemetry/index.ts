/**
 * Telemetry Module
 *
 * Exports error tracking, metrics tracking, and observability utilities.
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

export {
  initializeMetricsTracking,
  trackMetric,
  trackEvent,
  trackGauge,
  trackCompressionMetrics,
  getMetricsBuffer,
  clearMetricsBuffer,
  flushMetrics,
  type MetricType,
  type Metric,
  type GaugeMetric,
  type CounterMetric,
  type DistributionMetric,
  type EventMetric,
  type CompressionMetricData,
} from './metrics-tracking'
