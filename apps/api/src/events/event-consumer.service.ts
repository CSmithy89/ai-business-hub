import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { BaseEvent } from '@hyvve/shared';
import { RedisProvider } from './redis.provider';
import { PrismaService } from '../common/services/prisma.service';
import {
  STREAMS,
  CONSUMER_GROUP,
  CONSUMER_CONFIG,
} from './constants/streams.constants';
import {
  EVENT_SUBSCRIBER_METADATA,
  EventSubscriberOptions,
} from './decorators/event-subscriber.decorator';
import { EventHandlerInfo } from './interfaces/event-handler.interface';
import { EventRetryService } from './event-retry.service';

/**
 * EventConsumerService
 *
 * Consumes events from Redis Streams using consumer groups and dispatches them
 * to registered event handlers based on pattern matching.
 *
 * Key features:
 * - Automatic handler discovery via @EventSubscriber decorator
 * - Pattern matching (exact, wildcard, match-all)
 * - Priority-based handler execution
 * - Multiple handlers per event
 * - Graceful shutdown
 * - Error handling with status tracking
 *
 * @see Story 05-3: Implement Event Subscriber
 */
@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private readonly handlers = new Map<string, EventHandlerInfo[]>();
  private running = false;
  private readonly consumerName = CONSUMER_CONFIG.NAME;

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => EventRetryService))
    private readonly eventRetryService: EventRetryService,
  ) {}

  /**
   * Initialize the consumer service
   * - Discover all event handlers
   * - Start the consumer loop
   */
  async onModuleInit() {
    this.logger.log('Initializing event consumer service...');

    try {
      await this.discoverHandlers();
      this.running = true;
      // Start consumer loop in background (don't await)
      this.consumeLoop().catch((error) => {
        this.logger.error('Fatal error in consumer loop', error);
      });

      this.logger.log(
        `Event consumer service started with consumer name: ${this.consumerName}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize event consumer service', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   * - Stop consuming new events
   * - Wait for current batch to finish processing
   */
  async onModuleDestroy() {
    this.logger.log('Stopping event consumer...');
    this.running = false;
    // Wait for current batch to finish (max 5s block + ~1s processing time)
    await this.sleep(6000);
    this.logger.log('Event consumer stopped');
  }

  /**
   * Discover all methods decorated with @EventSubscriber
   * Registers them as event handlers in the handlers Map
   */
  private async discoverHandlers(): Promise<void> {
    const providers = this.discoveryService.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) =>
          name !== 'constructor' && typeof prototype[name] === 'function',
      );

      for (const methodName of methodNames) {
        const metadata = this.reflector.get<EventSubscriberOptions>(
          EVENT_SUBSCRIBER_METADATA,
          prototype[methodName],
        );

        if (metadata) {
          this.registerHandler(instance, methodName, metadata);
        }
      }
    }

    // Log summary of discovered handlers
    let totalHandlers = 0;
    for (const [pattern, handlers] of this.handlers) {
      totalHandlers += handlers.length;
      this.logger.log(
        `Pattern '${pattern}': ${handlers.length} handler(s) registered`,
      );
    }

    this.logger.log(
      `Discovered ${totalHandlers} event handler(s) across ${this.handlers.size} pattern(s)`,
    );
  }

  /**
   * Register an event handler for a pattern
   *
   * @param instance - The service/controller instance
   * @param methodName - The handler method name
   * @param metadata - The subscriber metadata
   */
  private registerHandler(
    instance: any,
    methodName: string,
    metadata: EventSubscriberOptions,
  ): void {
    const { pattern, priority = 100, maxRetries = 3 } = metadata;

    const handlerInfo: EventHandlerInfo = {
      pattern,
      priority,
      maxRetries,
      instanceRef: instance,
      methodName,
      execute: async (event: BaseEvent) => {
        // Bind the method to the instance and call it
        return await instance[methodName](event);
      },
    };

    // Add handler to the pattern's handler list
    const existingHandlers = this.handlers.get(pattern) || [];
    existingHandlers.push(handlerInfo);
    this.handlers.set(pattern, existingHandlers);

    this.logger.debug(
      `Registered handler: ${instance.constructor.name}.${methodName} for pattern '${pattern}' (priority: ${priority})`,
    );
  }

  /**
   * Main consumer loop
   * Continuously reads events from Redis Stream and processes them
   */
  private async consumeLoop(): Promise<void> {
    const redis = this.redisProvider.getClient();
    let errorCount = 0;
    const MAX_BACKOFF_MS = 30000; // 30 seconds max backoff

    this.logger.log('Consumer loop started');

    while (this.running) {
      try {
        // XREADGROUP: Block for new events (5s timeout), read up to 10 events
        const messages = await redis.xreadgroup(
          'GROUP',
          CONSUMER_GROUP,
          this.consumerName,
          'COUNT',
          CONSUMER_CONFIG.BATCH_SIZE,
          'BLOCK',
          CONSUMER_CONFIG.BLOCK_TIMEOUT_MS,
          'STREAMS',
          STREAMS.MAIN,
          '>',
        );

        // Process messages if any were received
        if (messages && messages.length > 0) {
          for (const [stream, entries] of messages) {
            this.logger.debug(
              `Received ${entries.length} event(s) from stream ${stream}`,
            );

            for (const [streamId, fields] of entries) {
              // Parse event from Redis stream fields
              // Fields format: ['event', '<json>']
              const eventJson = fields[1];
              const event = JSON.parse(eventJson) as BaseEvent;

              await this.processEvent(streamId, event);
            }
          }
        }

        // Reset error count on successful iteration
        errorCount = 0;
      } catch (error) {
        errorCount++;
        const backoffMs = Math.min(1000 * Math.pow(2, errorCount), MAX_BACKOFF_MS);

        this.logger.error(
          `Error in consumer loop (attempt ${errorCount}), backing off for ${backoffMs}ms`,
          error instanceof Error ? error.stack : undefined,
        );

        // Exponential backoff on error to avoid busy-looping and resource exhaustion
        await this.sleep(backoffMs);
      }
    }

    this.logger.log('Consumer loop stopped');
  }

  /**
   * Process a single event
   * - Find matching handlers
   * - Execute handlers in priority order
   * - Acknowledge event on success
   * - Handle errors
   *
   * @param streamId - Redis stream message ID
   * @param event - The event to process
   */
  private async processEvent(
    streamId: string,
    event: BaseEvent,
  ): Promise<void> {
    const redis = this.redisProvider.getClient();
    const matchingHandlers = this.findMatchingHandlers(event.type);

    if (matchingHandlers.length === 0) {
      this.logger.debug(
        `No handlers found for event type '${event.type}' (eventId: ${event.id})`,
      );
      // Acknowledge event even if no handlers (avoid reprocessing)
      await redis.xack(STREAMS.MAIN, CONSUMER_GROUP, streamId);
      await this.updateEventStatus(event.id, 'COMPLETED');
      return;
    }

    this.logger.debug(
      `Processing event ${event.id} (type: ${event.type}) with ${matchingHandlers.length} handler(s)`,
    );

    // Track if at least one handler succeeded
    let anyHandlerSucceeded = false;
    const errors: Array<{ handler: EventHandlerInfo; error: Error }> = [];

    for (const handler of matchingHandlers) {
      try {
        this.logger.debug(
          `Executing handler: ${handler.instanceRef.constructor.name}.${handler.methodName} (priority: ${handler.priority})`,
        );

        await this.updateEventStatus(event.id, 'PROCESSING');
        await handler.execute(event);

        anyHandlerSucceeded = true;

        this.logger.debug(
          `Handler ${handler.instanceRef.constructor.name}.${handler.methodName} completed successfully`,
        );
      } catch (error) {
        errors.push({ handler, error: error as Error });
        this.logger.error({
          message: 'Event handler failed',
          eventId: event.id,
          eventType: event.type,
          handlerPattern: handler.pattern,
          handlerClass: handler.instanceRef.constructor.name,
          handlerMethod: handler.methodName,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Handle acknowledgment and status update
    if (errors.length === 0) {
      // All handlers succeeded
      await redis.xack(STREAMS.MAIN, CONSUMER_GROUP, streamId);
      await this.updateEventStatus(event.id, 'COMPLETED');
    } else {
      // Some or all handlers failed
      // Do NOT acknowledge - let retry service handle it
      // This prevents data loss when some handlers fail
      const errorMessages = errors
        .map((e) => (e.error instanceof Error ? e.error.message : String(e.error)))
        .join('; ');

      this.logger.warn({
        message: `${anyHandlerSucceeded ? 'Some' : 'All'} handlers failed for event`,
        eventId: event.id,
        eventType: event.type,
        successCount: matchingHandlers.length - errors.length,
        failureCount: errors.length,
        errors: errorMessages,
      });

      // Pass to retry service for retry logic
      await this.handleError(streamId, event, errors);
    }
  }

  /**
   * Find all handlers that match the event type pattern
   * Returns handlers sorted by priority (ascending)
   *
   * @param eventType - The event type to match
   * @returns Sorted array of matching handlers
   */
  private findMatchingHandlers(eventType: string): EventHandlerInfo[] {
    const results: EventHandlerInfo[] = [];

    for (const [pattern, handlers] of this.handlers) {
      if (this.matchesPattern(eventType, pattern)) {
        results.push(...handlers);
      }
    }

    // Sort by priority (ascending - lower number = higher priority)
    return results.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if an event type matches a pattern
   *
   * Pattern matching rules:
   * - '*' matches all events
   * - 'approval.*' matches all events starting with 'approval.'
   * - 'approval.item.approved' matches exactly that event type
   *
   * @param eventType - The event type to check
   * @param pattern - The pattern to match against
   * @returns True if the event type matches the pattern
   */
  private matchesPattern(eventType: string, pattern: string): boolean {
    if (pattern === '*') return true; // Match all events

    if (pattern.endsWith('.*')) {
      // Wildcard suffix pattern (e.g., 'approval.*')
      const prefix = pattern.slice(0, -2);
      return eventType.startsWith(prefix + '.');
    }

    return eventType === pattern; // Exact match
  }

  /**
   * Update event status in EventMetadata
   *
   * @param eventId - The event ID
   * @param status - The new status
   * @param error - Optional error message
   */
  private async updateEventStatus(
    eventId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DLQ',
    error?: string,
  ): Promise<void> {
    try {
      await this.prisma.eventMetadata.update({
        where: { eventId },
        data: {
          status,
          lastError: error,
          processedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });
    } catch (err) {
      // Log but don't throw - metadata update failure shouldn't break event processing
      this.logger.error(
        `Failed to update event status for eventId ${eventId}`,
        err,
      );
    }
  }

  /**
   * Handle event processing errors with retry logic
   * Integrates with EventRetryService for exponential backoff and DLQ
   *
   * @param streamId - Redis stream message ID
   * @param event - The failed event
   * @param errors - Array of handler errors
   */
  private async handleError(
    streamId: string,
    event: BaseEvent,
    errors: Array<{ handler: EventHandlerInfo; error: Error }>,
  ): Promise<void> {
    this.logger.error({
      message: 'All handlers failed for event',
      eventId: event.id,
      eventType: event.type,
      streamId,
      errorCount: errors.length,
      errors: errors.map((e) => ({
        handler: `${e.handler.instanceRef.constructor.name}.${e.handler.methodName}`,
        error: e.error.message,
      })),
    });

    // Get current metadata to check attempts
    const metadata = await this.prisma.eventMetadata.findUnique({
      where: { eventId: event.id },
    });

    const currentAttempt = metadata?.attempts ?? 0;

    // Use the first error as the representative error
    const primaryError = errors[0].error;

    // Schedule retry via EventRetryService
    // Note: DO NOT XACK the event yet - it should remain in pending
    // until retry succeeds or moves to DLQ
    await this.eventRetryService.scheduleRetry(
      streamId,
      event,
      primaryError,
      currentAttempt,
    );
  }

  /**
   * Sleep utility for backoff and graceful shutdown
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
