import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createId } from '@paralleldrive/cuid2';
import { BaseEvent } from '@hyvve/shared';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { STREAMS, CONSUMER_GROUP } from './constants/streams.constants';

/**
 * EventRetryService
 *
 * Manages retry scheduling and dead letter queue operations for failed events.
 * Implements exponential backoff retry logic and provides admin DLQ management.
 *
 * Key features:
 * - Exponential backoff retry delays (1min, 5min, 30min)
 * - Move events to DLQ after max retries (3 attempts)
 * - Track retry attempts and errors in EventMetadata
 * - Manual retry from DLQ for admin intervention
 *
 * @see Story 05-4: Implement Retry and Dead Letter Queue
 */
@Injectable()
export class EventRetryService {
  private readonly logger = new Logger(EventRetryService.name);

  /**
   * Retry delay schedule: exponential backoff
   * - 1st retry: 1 minute (60,000ms)
   * - 2nd retry: 5 minutes (300,000ms)
   * - 3rd retry: 30 minutes (1,800,000ms)
   */
  private readonly RETRY_DELAYS = [60_000, 300_000, 1_800_000]; // 1m, 5m, 30m

  /** Maximum number of retry attempts before moving to DLQ */
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectQueue('event-retry') private retryQueue: Queue,
    private readonly redisProvider: RedisProvider,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Schedule retry for a failed event
   *
   * Updates EventMetadata with attempt count and error details,
   * then either schedules a delayed retry job or moves event to DLQ
   * if max retries reached.
   *
   * @param streamId - Redis stream message ID
   * @param event - The event that failed
   * @param error - The error that occurred
   * @param currentAttempt - Current attempt number (0-indexed)
   */
  async scheduleRetry(
    streamId: string,
    event: BaseEvent,
    error: Error,
    currentAttempt: number,
  ): Promise<void> {
    try {
      const nextAttempt = currentAttempt + 1;

      // Update EventMetadata with error and attempt count
      await this.prisma.eventMetadata.update({
        where: { eventId: event.id },
        data: {
          attempts: nextAttempt,
          lastError: error.message,
          status: 'FAILED', // Will become PENDING when retry job runs
        },
      });

      // Check if max retries reached
      if (currentAttempt >= this.MAX_RETRIES) {
        this.logger.warn({
          message: 'Max retries reached, moving to DLQ',
          eventId: event.id,
          eventType: event.type,
          attempts: currentAttempt,
        });

        await this.moveToDLQ(event, error, streamId);
        return;
      }

      // Calculate delay for next retry
      const delay =
        this.RETRY_DELAYS[currentAttempt] ?? this.RETRY_DELAYS[2]; // Default to last delay

      // Schedule delayed retry job
      await this.retryQueue.add(
        'retry-event',
        {
          eventId: event.id,
          streamId,
          attempt: nextAttempt,
        },
        {
          delay,
          jobId: `retry-${event.id}-${nextAttempt}`, // Unique job ID to prevent duplicates
        },
      );

      this.logger.log({
        message: 'Retry scheduled',
        eventId: event.id,
        eventType: event.type,
        attempt: nextAttempt,
        delayMs: delay,
        error: error.message,
        correlationId: event.correlationId,
      });
    } catch (err) {
      this.logger.error(
        {
          message: 'Failed to schedule retry',
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        },
        err instanceof Error ? err.stack : undefined,
      );
      // Don't throw - allow event to be acknowledged to prevent infinite loop
    }
  }

  /**
   * Move event to dead letter queue after max retries
   *
   * Adds event to DLQ Redis Stream with full error context,
   * updates EventMetadata status to 'DLQ', and acknowledges
   * the event from the main stream.
   *
   * @param event - The event to move to DLQ
   * @param error - The final error
   * @param streamId - Redis stream message ID to acknowledge
   */
  private async moveToDLQ(
    event: BaseEvent,
    error: Error,
    streamId: string,
  ): Promise<void> {
    try {
      const redis = this.redisProvider.getClient();

      // Add event to DLQ stream with error context
      await redis.xadd(
        STREAMS.DLQ,
        '*', // Auto-generate ID
        'event',
        JSON.stringify(event),
        'error',
        error.message,
        'errorStack',
        error.stack || 'N/A',
        'movedAt',
        new Date().toISOString(),
        'attempts',
        String(this.MAX_RETRIES),
      );

      // Update EventMetadata status to DLQ
      await this.prisma.eventMetadata.update({
        where: { eventId: event.id },
        data: {
          status: 'DLQ',
          lastError: error.message,
        },
      });

      // Acknowledge event from main stream (remove from pending)
      await redis.xack(STREAMS.MAIN, CONSUMER_GROUP, streamId);

      this.logger.error({
        message: 'Event moved to DLQ',
        eventId: event.id,
        eventType: event.type,
        tenantId: event.tenantId,
        error: error.message,
        errorStack: error.stack || 'N/A',
        attempts: this.MAX_RETRIES,
        correlationId: event.correlationId,
      });
    } catch (err) {
      this.logger.error(
        {
          message: 'Failed to move event to DLQ',
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        },
        err instanceof Error ? err.stack : undefined,
      );
      // Don't throw - log alert for manual intervention
    }
  }

  /**
   * Reprocess an event from DLQ (admin retry)
   *
   * Finds the event in the DLQ stream, resets its metadata,
   * re-publishes it to the main stream with a new event ID,
   * and deletes it from the DLQ.
   *
   * @param eventId - The event ID to retry
   * @returns New event ID assigned for reprocessing
   * @throws NotFoundException if event not found in DLQ
   */
  async retryFromDLQ(eventId: string): Promise<string> {
    const redis = this.redisProvider.getClient();

    try {
      // Find event in DLQ stream
      const events = await redis.xrange(STREAMS.DLQ, '-', '+');

      const eventEntry = events.find(([_, fields]: [string, string[]]) => {
        try {
          const event = JSON.parse(fields[1]) as BaseEvent;
          return event.id === eventId;
        } catch {
          return false;
        }
      });

      if (!eventEntry) {
        throw new NotFoundException(
          `Event ${eventId} not found in dead letter queue`,
        );
      }

      const [dlqStreamId, fields] = eventEntry;
      const originalEvent = JSON.parse(fields[1]) as BaseEvent;

      // Generate new event ID for fresh retry cycle
      const newEventId = createId();
      const newEvent: BaseEvent = {
        ...originalEvent,
        id: newEventId,
        timestamp: new Date().toISOString(),
      };

      // Create new EventMetadata with reset attempts
      await this.prisma.eventMetadata.create({
        data: {
          eventId: newEventId,
          streamId: '0-0', // Will be updated when added to stream
          type: newEvent.type,
          source: newEvent.source,
          tenantId: newEvent.tenantId,
          correlationId: newEvent.correlationId,
          status: 'PENDING',
          attempts: 0,
          lastError: null,
        },
      });

      // Re-publish to main stream
      const newStreamId = await redis.xadd(
        STREAMS.MAIN,
        '*',
        'event',
        JSON.stringify(newEvent),
      );

      // Update streamId in metadata
      await this.prisma.eventMetadata.update({
        where: { eventId: newEventId },
        data: { streamId: newStreamId },
      });

      // Delete from DLQ stream
      await redis.xdel(STREAMS.DLQ, dlqStreamId);

      // Update original event metadata for audit trail
      await this.prisma.eventMetadata.update({
        where: { eventId: originalEvent.id },
        data: {
          lastError: `Retried from DLQ as event ${newEventId}`,
        },
      });

      this.logger.log({
        message: 'Event retried from DLQ',
        originalEventId: originalEvent.id,
        newEventId,
        eventType: newEvent.type,
      });

      return newEventId;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        {
          message: 'Failed to retry event from DLQ',
          eventId,
          error: error instanceof Error ? error.message : String(error),
        },
        error instanceof Error ? error.stack : undefined,
      );

      throw new Error(`Failed to retry event from DLQ: ${error}`);
    }
  }
}
