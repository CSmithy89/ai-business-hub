import os from 'os';

/**
 * Redis Streams Configuration Constants
 *
 * Defines stream names, consumer group configuration, and retention policies
 * for the event bus infrastructure.
 */

/**
 * Stream names for the event bus
 */
export const STREAMS = {
  /** Main event stream for all platform events */
  MAIN: 'hyvve:events:main',
  /** Dead letter queue for failed events */
  DLQ: 'hyvve:events:dlq',
  /** Replay stream for event replay functionality (Story 05-6) */
  REPLAY: 'hyvve:events:replay',
} as const;

/**
 * Strongly-typed union of allowed stream name values to prevent typos at compile time
 */
export type StreamName = (typeof STREAMS)[keyof typeof STREAMS];

/**
 * Consumer group name for the platform
 * All instances of the API share this consumer group to distribute event processing
 */
export const CONSUMER_GROUP = 'hyvve-platform';

/**
 * Consumer configuration for event processing
 */
export const CONSUMER_CONFIG = {
  /**
   * Consumer name combining hostname and process ID for uniqueness across instances
   * Using os.hostname() for reliability and PID to prevent collisions on same host
   */
  NAME: `${os.hostname() || 'consumer'}-${process.pid}`,
  /** Block timeout in milliseconds when waiting for new events */
  BLOCK_TIMEOUT_MS: 5000,
  /** Number of events to process per batch */
  BATCH_SIZE: 10,
} as const;

/**
 * Stream retention policies
 * Note: Retention is enforced via XTRIM during writes (Story 05-2)
 */
export const RETENTION = {
  /** Main event stream retention in days */
  MAIN_STREAM_DAYS: 30,
  /** Dead letter queue retention in days (longer for audit purposes) */
  DLQ_DAYS: 90,
  /** Replay stream retention in hours (temporary storage) */
  REPLAY_HOURS: 24,
} as const;

/**
 * BullMQ Queue names for event processing
 */
export const QUEUE_EVENT_RETRY = 'event-retry';
export const QUEUE_EVENT_REPLAY = 'event-replay';

/**
 * Retry configuration for failed events
 */
export const RETRY_CONFIG = {
  /**
   * Retry delay schedule: exponential backoff
   * - 1st retry: 1 minute (60,000ms)
   * - 2nd retry: 5 minutes (300,000ms)
   * - 3rd retry: 30 minutes (1,800,000ms)
   */
  DELAYS_MS: [60_000, 300_000, 1_800_000] as const,
  /** Maximum number of retry attempts before moving to DLQ */
  MAX_RETRIES: 3,
} as const;

/**
 * Dead Letter Queue configuration
 */
export const DLQ_CONFIG = {
  /** Maximum number of events to store in DLQ (older events are trimmed) */
  MAX_SIZE: 10_000,
  /** Warning threshold (80% of max) - log warning when reached */
  WARNING_THRESHOLD: 8_000,
  /** Critical threshold (95% of max) - log error when reached */
  CRITICAL_THRESHOLD: 9_500,
} as const;

/**
 * Consumer error handling configuration
 */
export const ERROR_HANDLING_CONFIG = {
  /** Maximum backoff delay for Redis errors in milliseconds */
  MAX_BACKOFF_MS: 30_000,
  /** Maximum consecutive errors before circuit breaker trips (~10 minutes of errors) */
  MAX_CONSECUTIVE_ERRORS: 20,
  /** Base retry delay for metadata updates in milliseconds */
  METADATA_RETRY_DELAY_MS: 100,
  /** Maximum retries for metadata updates */
  METADATA_MAX_RETRIES: 3,
} as const;

/**
 * BullMQ job retention configuration
 */
export const BULLMQ_CONFIG = {
  /** Number of completed jobs to retain */
  JOBS_RETAIN_COMPLETED: 100,
  /** Number of failed jobs to retain */
  JOBS_RETAIN_FAILED: 100,
} as const;
