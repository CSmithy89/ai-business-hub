/**
 * Metrics Tracking Infrastructure
 *
 * Centralized metrics tracking for analytics and monitoring.
 * Provides a unified interface for tracking business and performance metrics.
 *
 * Environment Variables:
 * - NEXT_PUBLIC_METRICS_ENABLED: 'true' to enable
 * - NEXT_PUBLIC_APP_ENVIRONMENT: 'development' | 'staging' | 'production'
 *
 * CR-08: Add compression metrics to analytics
 *
 * @module telemetry/metrics-tracking
 */

/**
 * Metric types for categorization
 */
export type MetricType =
  | 'compression'
  | 'storage'
  | 'performance'
  | 'api'
  | 'user_action'
  | 'system'

/**
 * Base metric interface
 */
export interface BaseMetric {
  /** Metric name (e.g., 'state_compressed', 'api_latency') */
  name: string
  /** Metric type for categorization */
  type: MetricType
  /** Timestamp when metric was recorded */
  timestamp: number
  /** Additional tags for filtering */
  tags?: Record<string, string>
}

/**
 * Gauge metric (point-in-time value)
 */
export interface GaugeMetric extends BaseMetric {
  kind: 'gauge'
  value: number
  unit?: string
}

/**
 * Counter metric (cumulative)
 */
export interface CounterMetric extends BaseMetric {
  kind: 'counter'
  value: number
}

/**
 * Distribution/histogram metric
 */
export interface DistributionMetric extends BaseMetric {
  kind: 'distribution'
  value: number
  unit?: string
}

/**
 * Event metric (for tracking occurrences)
 */
export interface EventMetric extends BaseMetric {
  kind: 'event'
  properties?: Record<string, unknown>
}

export type Metric = GaugeMetric | CounterMetric | DistributionMetric | EventMetric

/**
 * Compression-specific metrics
 */
export interface CompressionMetricData {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  wasCompressed: boolean
  savingsBytes: number
  savingsPercent: number
  storageKey?: string
}

/**
 * Metrics tracking configuration
 */
interface MetricsConfig {
  enabled: boolean
  environment: string
  sampleRate: number
  batchSize: number
}

/**
 * Metrics buffer for batching (could be sent to analytics in production)
 */
const metricsBuffer: Metric[] = []
const MAX_BUFFER_SIZE = 100

/**
 * Get current configuration from environment
 * Uses defensive parsing to handle invalid values
 */
function getConfig(): MetricsConfig {
  // Parse sample rate with fallback to 1.0 if invalid
  const parsedSampleRate = parseFloat(process.env.NEXT_PUBLIC_METRICS_SAMPLE_RATE || '1.0');
  const sampleRate = Number.isNaN(parsedSampleRate) ? 1.0 : Math.max(0, Math.min(1, parsedSampleRate));

  // Parse batch size with fallback to 10 if invalid
  // Cap at MAX_BUFFER_SIZE to ensure auto-flush can trigger before trimming
  const parsedBatchSize = parseInt(process.env.NEXT_PUBLIC_METRICS_BATCH_SIZE || '10', 10);
  const batchSize = Number.isNaN(parsedBatchSize) || parsedBatchSize < 1
    ? 10
    : Math.min(parsedBatchSize, MAX_BUFFER_SIZE);

  return {
    enabled: process.env.NEXT_PUBLIC_METRICS_ENABLED === 'true' ||
             process.env.NEXT_PUBLIC_ERROR_TRACKING_ENABLED === 'true',
    environment: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'development',
    sampleRate,
    batchSize,
  }
}

/**
 * Track a metric
 *
 * @param metric - The metric to track
 *
 * @example
 * ```typescript
 * trackMetric({
 *   kind: 'gauge',
 *   name: 'state_size',
 *   type: 'storage',
 *   value: 50000,
 *   unit: 'bytes',
 *   timestamp: Date.now(),
 * })
 * ```
 */
export function trackMetric(metric: Metric): void {
  const config = getConfig()

  // Sample rate check
  if (Math.random() > config.sampleRate) {
    return
  }

  // Add to buffer
  metricsBuffer.push(metric)

  // Log in development
  if (config.environment === 'development') {
    console.log('[Metrics]', formatMetricForLog(metric))
  }

  // Flush if buffer is full
  if (metricsBuffer.length >= config.batchSize) {
    flushMetrics()
  }

  // Prevent unbounded growth
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER_SIZE)
  }
}

/**
 * Track a simple event
 *
 * @param name - Event name
 * @param type - Metric type
 * @param properties - Optional event properties
 *
 * @example
 * ```typescript
 * trackEvent('state_sync_completed', 'storage', { source: 'websocket' })
 * ```
 */
export function trackEvent(
  name: string,
  type: MetricType,
  properties?: Record<string, unknown>
): void {
  trackMetric({
    kind: 'event',
    name,
    type,
    timestamp: Date.now(),
    properties,
  })
}

/**
 * Track a gauge value
 *
 * @param name - Metric name
 * @param type - Metric type
 * @param value - The value
 * @param unit - Optional unit (e.g., 'bytes', 'ms')
 *
 * @example
 * ```typescript
 * trackGauge('compression_ratio', 'compression', 2.5)
 * ```
 */
export function trackGauge(
  name: string,
  type: MetricType,
  value: number,
  unit?: string
): void {
  trackMetric({
    kind: 'gauge',
    name,
    type,
    value,
    unit,
    timestamp: Date.now(),
  })
}

/**
 * Track compression operation
 *
 * Convenience function for tracking compression metrics.
 *
 * @param data - Compression metrics data
 * @param operation - 'compress' or 'decompress'
 *
 * @example
 * ```typescript
 * trackCompressionMetrics({
 *   originalSize: 100000,
 *   compressedSize: 40000,
 *   compressionRatio: 2.5,
 *   wasCompressed: true,
 *   savingsBytes: 60000,
 *   savingsPercent: 60,
 *   storageKey: 'hyvve:dashboard:state',
 * }, 'compress')
 * ```
 */
export function trackCompressionMetrics(
  data: CompressionMetricData,
  operation: 'compress' | 'decompress' = 'compress'
): void {
  const config = getConfig()

  // Only track if compression actually happened
  if (!data.wasCompressed && operation === 'compress') {
    // Track that we skipped compression (still useful)
    trackEvent('compression_skipped', 'compression', {
      reason: 'below_threshold',
      originalSize: data.originalSize,
    })
    return
  }

  // Track the compression event
  trackEvent(`state_${operation}ed`, 'compression', {
    originalSize: data.originalSize,
    compressedSize: data.compressedSize,
    compressionRatio: data.compressionRatio,
    savingsBytes: data.savingsBytes,
    savingsPercent: data.savingsPercent,
    storageKey: data.storageKey,
  })

  // Track individual gauges for aggregation
  trackGauge('compression_ratio', 'compression', data.compressionRatio)
  trackGauge('compression_savings_bytes', 'compression', data.savingsBytes, 'bytes')
  trackGauge('compression_savings_percent', 'compression', data.savingsPercent, 'percent')
  trackGauge('state_original_size', 'storage', data.originalSize, 'bytes')
  trackGauge('state_compressed_size', 'storage', data.compressedSize, 'bytes')

  // Log in development with extra detail
  if (config.environment === 'development') {
    console.log(
      `[Compression Metrics] ${operation}:`,
      `${(data.originalSize / 1024).toFixed(2)}KB → ${(data.compressedSize / 1024).toFixed(2)}KB`,
      `(${data.savingsPercent.toFixed(1)}% savings, ratio: ${data.compressionRatio.toFixed(2)}x)`
    )
  }
}

/**
 * Get current metrics buffer (for debugging/testing)
 */
export function getMetricsBuffer(): ReadonlyArray<Metric> {
  return [...metricsBuffer]
}

/**
 * Clear metrics buffer
 */
export function clearMetricsBuffer(): void {
  metricsBuffer.length = 0
}

/**
 * Flush metrics to backend (placeholder for future integration)
 *
 * In production, this would send batched metrics to an analytics service
 * like Segment, Amplitude, or a custom metrics endpoint.
 */
export function flushMetrics(): void {
  const config = getConfig()

  if (metricsBuffer.length === 0) {
    return
  }

  const batch = [...metricsBuffer]
  metricsBuffer.length = 0

  // TODO: Send to analytics service
  // await fetch('/api/metrics', {
  //   method: 'POST',
  //   body: JSON.stringify({ metrics: batch }),
  // })

  if (config.environment === 'development') {
    console.log(`[Metrics] Flushed ${batch.length} metrics`)
  }

  // In production, could send to logging/analytics endpoint
  if (config.environment === 'production' && config.enabled) {
    // For now, structured log that could be picked up by log aggregators
    console.log('[Metrics Batch]', JSON.stringify({
      timestamp: Date.now(),
      count: batch.length,
      metrics: batch,
    }))
  }
}

/**
 * Format metric for console logging
 */
function formatMetricForLog(metric: Metric): string {
  const base = `${metric.type}/${metric.name}`

  switch (metric.kind) {
    case 'gauge':
      return `${base}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
    case 'counter':
      return `${base}: +${metric.value}`
    case 'distribution':
      return `${base}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
    case 'event':
      return `${base}: ${JSON.stringify(metric.properties || {})}`
    default:
      return base
  }
}

/**
 * Initialize metrics tracking (call once at app startup)
 */
export function initializeMetricsTracking(): void {
  const config = getConfig()

  if (config.environment === 'development') {
    console.log('[Metrics] Initialized', {
      enabled: config.enabled,
      environment: config.environment,
      sampleRate: config.sampleRate,
    })
  }

  // Flush metrics on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushMetrics()
    })
  }
}
