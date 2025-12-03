import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DiscoveryModule } from '@nestjs/core';
import { EventsController } from './events.controller';
import { RedisProvider } from './redis.provider';
import { EventPublisherService } from './event-publisher.service';
import { EventConsumerService } from './event-consumer.service';
import { EventRetryService } from './event-retry.service';
import { EventRetryProcessor } from './processors/event-retry.processor';
import { PrismaService } from '../common/services/prisma.service';
import { STREAMS, CONSUMER_GROUP } from './constants/streams.constants';

/**
 * EventsModule - Event Bus Infrastructure
 *
 * Provides Redis Streams-based event bus for cross-module communication.
 * This module sets up the foundational infrastructure for the event system:
 *
 * - Redis Streams for event storage and delivery
 * - Consumer groups for distributed event processing
 * - EventPublisherService for publishing events (Story 05-2)
 * - EventConsumerService for consuming events (Story 05-3)
 * - EventRetryService for retry logic and DLQ (Story 05-4)
 * - Health check endpoints for monitoring
 *
 * Future stories will add:
 * - EventReplayService (Story 05-6)
 *
 * @see Story 05-1: Set Up Redis Streams Infrastructure
 * @see Story 05-2: Implement Event Publisher
 * @see Story 05-3: Implement Event Subscriber
 */
@Module({
  imports: [
    // Register BullMQ queue for event retry processing (Story 05-4)
    BullModule.registerQueue({
      name: 'event-retry',
    }),
    // DiscoveryModule provides DiscoveryService for handler discovery
    DiscoveryModule,
  ],
  controllers: [EventsController],
  providers: [
    RedisProvider,
    EventPublisherService,
    EventConsumerService,
    EventRetryService,
    EventRetryProcessor,
    PrismaService,
  ],
  exports: [
    RedisProvider,
    EventPublisherService,
    EventConsumerService,
    EventRetryService,
  ],
})
export class EventsModule implements OnModuleInit {
  private readonly logger = new Logger(EventsModule.name);

  constructor(private readonly redisProvider: RedisProvider) {}

  /**
   * Initialize Redis Streams and consumer groups on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing event bus infrastructure...');

    try {
      await this.setupStreams();
      this.logger.log('Event bus infrastructure initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize event bus infrastructure', error);
      // Don't throw - allow app to start even if event bus fails
      // Health check endpoint will report unhealthy status
    }
  }

  /**
   * Set up Redis Streams and consumer groups
   * @private
   */
  private async setupStreams(): Promise<void> {
    const redis = this.redisProvider.getClient();

    // Setup main event stream
    await this.createConsumerGroup(redis, STREAMS.MAIN, CONSUMER_GROUP);

    // Setup dead letter queue stream
    await this.createConsumerGroup(redis, STREAMS.DLQ, CONSUMER_GROUP);

    this.logger.log(
      `Consumer groups created for streams: ${STREAMS.MAIN}, ${STREAMS.DLQ}`,
    );
  }

  /**
   * Create a consumer group for a stream
   * Handles BUSYGROUP error (group already exists) gracefully
   *
   * @param redis - Redis client
   * @param streamName - Name of the stream
   * @param groupName - Name of the consumer group
   * @private
   */
  private async createConsumerGroup(
    redis: any,
    streamName: string,
    groupName: string,
  ): Promise<void> {
    try {
      // XGROUP CREATE with MKSTREAM flag:
      // - Creates stream if it doesn't exist
      // - Creates consumer group starting from ID '0' (process future events only)
      await redis.xgroup('CREATE', streamName, groupName, '0', 'MKSTREAM');
      this.logger.log(`Created consumer group '${groupName}' for ${streamName}`);
    } catch (error) {
      // BUSYGROUP error means the consumer group already exists
      // This is expected on subsequent startups - not an error
      if (
        error instanceof Error &&
        error.message &&
        error.message.includes('BUSYGROUP')
      ) {
        this.logger.log(
          `Consumer group '${groupName}' already exists for ${streamName}`,
        );
      } else {
        // Unexpected error - log and re-throw
        this.logger.error(
          `Failed to create consumer group '${groupName}' for ${streamName}`,
          error,
        );
        throw error;
      }
    }
  }
}
