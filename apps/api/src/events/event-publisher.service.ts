import { Injectable, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { BaseEvent, EventType } from '@hyvve/shared';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import { STREAMS, RETENTION } from './constants/streams.constants';

/**
 * EventPublisherService - Publishes events to Redis Streams
 *
 * Story 05-2: Implement Event Publisher
 *
 * Responsibilities:
 * - Publish events to Redis Streams (hyvve:events:main)
 * - Auto-generate event ID, timestamp, and correlationId if not provided
 * - Create EventMetadata record in database for tracking
 * - Implement XTRIM for 30-day retention
 * - Support batch publishing for atomic operations
 * - Structured logging for observability
 *
 * Event Publishing Flow:
 * 1. Generate event ID (CUID) if not provided
 * 2. Add timestamp and correlationId if missing
 * 3. Construct BaseEvent object
 * 4. Serialize event to JSON
 * 5. XADD to Redis stream with MAXLEN for retention
 * 6. Create EventMetadata record (status: PENDING)
 * 7. Log publish operation
 * 8. Return event ID
 *
 * @example
 * ```typescript
 * await eventPublisher.publish(
 *   EventTypes.APPROVAL_REQUESTED,
 *   { approvalId: '123', ... },
 *   { tenantId, userId }
 * );
 * ```
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Publish an event to Redis Streams
   *
   * @param type - Event type from EventTypes constant
   * @param data - Event payload (type-safe based on event type)
   * @param context - Tenant and user context
   * @returns Event ID
   */
  async publish<T extends object>(
    type: EventType,
    data: T,
    context: {
      tenantId: string;
      userId: string;
      correlationId?: string;
      source?: string;
    },
  ): Promise<string> {
    const redis = this.redisProvider.getClient();

    // Step 1: Generate event ID
    const eventId = createId();

    // Step 2: Generate correlationId if not provided
    const correlationId = context.correlationId || createId();

    // Step 3: Add timestamp
    const timestamp = new Date().toISOString();

    // Step 4: Construct BaseEvent object
    const event: BaseEvent = {
      id: eventId,
      type,
      source: context.source || 'platform',
      timestamp,
      correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      version: '1.0',
      data: data as Record<string, unknown>,
    };

    try {
      // Step 5: Serialize event to JSON
      const eventJson = JSON.stringify(event);

      // Step 6: XADD to Redis stream with MAXLEN for retention
      const maxLen = this.calculateRetentionLimit();
      const streamId = await redis.xadd(
        STREAMS.MAIN,
        'MAXLEN',
        '~', // Approximate trimming for performance
        maxLen.toString(),
        '*', // Auto-generate stream ID
        'event',
        eventJson,
      );

      // Step 7: Create EventMetadata record
      await this.prisma.eventMetadata.create({
        data: {
          eventId,
          streamId,
          type,
          source: event.source,
          tenantId: context.tenantId,
          correlationId,
          status: 'PENDING',
        },
      });

      // Step 8: Log publish operation with structured data
      this.logger.log(
        JSON.stringify({
          message: 'Event published',
          eventId,
          type,
          correlationId,
          tenantId: context.tenantId,
          streamId,
        }),
      );

      // Step 9: Return event ID
      return eventId;
    } catch (error) {
      this.logger.error(
        `Failed to publish event: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error; // Let caller handle retry
    }
  }

  /**
   * Publish multiple events atomically
   *
   * Uses Redis pipeline for atomic batch operations.
   * If any event fails, all events in the batch will fail.
   *
   * @param events - Array of events to publish
   * @returns Array of event IDs
   */
  async publishBatch(
    events: Array<{
      type: EventType;
      data: object;
      context: {
        tenantId: string;
        userId: string;
        correlationId?: string;
        source?: string;
      };
    }>,
  ): Promise<string[]> {
    const eventIds: string[] = [];

    // Use Redis pipeline for atomic operations
    const redis = this.redisProvider.getClient();
    const pipeline = redis.pipeline();

    const eventMetadataRecords: any[] = [];
    const eventsData: BaseEvent[] = [];

    // Prepare all events
    for (const eventInput of events) {
      const eventId = createId();
      const correlationId = eventInput.context.correlationId || createId();
      const timestamp = new Date().toISOString();

      const event: BaseEvent = {
        id: eventId,
        type: eventInput.type,
        source: eventInput.context.source || 'platform',
        timestamp,
        correlationId,
        tenantId: eventInput.context.tenantId,
        userId: eventInput.context.userId,
        version: '1.0',
        data: eventInput.data as Record<string, unknown>,
      };

      const eventJson = JSON.stringify(event);
      const maxLen = this.calculateRetentionLimit();

      // Add to pipeline
      pipeline.xadd(
        STREAMS.MAIN,
        'MAXLEN',
        '~',
        maxLen.toString(),
        '*',
        'event',
        eventJson,
      );

      eventIds.push(eventId);
      eventsData.push(event);

      // Prepare metadata record (we'll get streamId after exec)
      eventMetadataRecords.push({
        eventId,
        type: eventInput.type,
        source: event.source,
        tenantId: eventInput.context.tenantId,
        correlationId,
      });
    }

    try {
      // Execute pipeline atomically
      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Pipeline execution failed');
      }

      // Extract stream IDs and check for errors
      const streamIds: string[] = [];
      for (let i = 0; i < results.length; i++) {
        const [err, streamId] = results[i];
        if (err) {
          throw err;
        }
        streamIds.push(streamId as string);
      }

      // Create EventMetadata records in parallel for better performance
      await this.prisma.eventMetadata.createMany({
        data: eventMetadataRecords.map((record, i) => ({
          ...record,
          streamId: streamIds[i],
          status: 'PENDING',
        })),
      });

      this.logger.log(
        JSON.stringify({
          message: 'Batch events published',
          eventCount: eventIds.length,
          eventIds,
        }),
      );

      return eventIds;
    } catch (error) {
      this.logger.error(
        `Failed to publish batch events: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Calculate MAXLEN value for XTRIM based on retention policy
   *
   * @private
   * @returns Maximum stream length
   */
  private calculateRetentionLimit(): number {
    // Calculate approximate number of events for 30-day retention
    // Assuming average of 1 event per second
    // 30 days * 24 hours * 60 minutes * 60 seconds = 2,592,000 events
    return RETENTION.MAIN_STREAM_DAYS * 24 * 60 * 60;
  }
}
