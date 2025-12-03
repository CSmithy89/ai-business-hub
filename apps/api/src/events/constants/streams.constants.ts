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
