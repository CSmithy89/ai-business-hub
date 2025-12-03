import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseEvent, EventType } from '@hyvve/shared';
import { EventPublisherService } from '../event-publisher.service';
import { EventReplayService } from '../event-replay.service';
import { STREAMS, QUEUE_EVENT_REPLAY } from '../constants/streams.constants';
import { RedisProvider } from '../redis.provider';

/**
 * Replay job data from queue
 */
interface ReplayJobData {
  jobId: string;
  startTime: string;
  endTime: string;
  eventTypes?: string[];
  tenantId?: string;
}

/**
 * Event Replay Processor
 *
 * BullMQ processor that handles event replay jobs.
 * Reads events from Redis Streams within the specified time range
 * and republishes them with a replay flag.
 *
 * Story: 05-6 - Implement Event Replay
 */
@Processor(QUEUE_EVENT_REPLAY)
export class EventReplayProcessor extends WorkerHost {
  private readonly logger = new Logger(EventReplayProcessor.name);
  private readonly redis: any;

  constructor(
    private readonly redisProvider: RedisProvider,
    @Inject(forwardRef(() => EventPublisherService))
    private readonly eventPublisher: EventPublisherService,
    @Inject(forwardRef(() => EventReplayService))
    private readonly replayService: EventReplayService,
  ) {
    super();
    this.redis = this.redisProvider.getClient();
  }

  /**
   * Process a replay job
   */
  async process(job: Job<ReplayJobData>): Promise<{ eventsReplayed: number }> {
    const { jobId, startTime, endTime, eventTypes, tenantId } = job.data;

    this.logger.log({
      message: 'Starting event replay job',
      jobId,
      startTime,
      endTime,
      eventTypes,
      tenantId,
    });

    // Mark job as running
    await this.replayService.updateJobStatus(jobId, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      // Convert ISO timestamps to Redis Stream IDs
      // Redis Stream IDs are timestamp-sequence, e.g., "1701388800000-0"
      const startId = this.timestampToStreamId(new Date(startTime));
      const endId = this.timestampToStreamId(new Date(endTime));

      // Read events from main stream within time range
      // XRANGE returns events in chronological order
      const events = await this.redis.xrange(
        STREAMS.MAIN,
        startId,
        endId,
        'COUNT',
        10000, // Limit per batch to avoid memory issues
      );

      if (!events || events.length === 0) {
        this.logger.log({
          message: 'No events found in time range',
          jobId,
          startTime,
          endTime,
        });

        await this.replayService.updateJobStatus(jobId, {
          status: 'completed',
          completedAt: new Date(),
          totalEvents: 0,
          eventsReplayed: 0,
          progress: 100,
        });

        return { eventsReplayed: 0 };
      }

      // Update total count
      await this.replayService.updateJobStatus(jobId, {
        totalEvents: events.length,
      });

      let replayed = 0;
      let errors = 0;

      for (const [streamId, fields] of events) {
        try {
          // Parse event from stream
          const eventJson = fields[1]; // fields = ['event', jsonString]
          const event = JSON.parse(eventJson) as BaseEvent;

          // Apply filters
          if (tenantId && event.tenantId !== tenantId) {
            continue;
          }
          if (eventTypes && eventTypes.length > 0 && !eventTypes.includes(event.type)) {
            continue;
          }

          // Re-publish with replay flag
          await this.eventPublisher.publish(
            event.type as EventType,
            {
              ...event.data,
              __replay: true,
              __originalEventId: event.id,
              __originalTimestamp: event.timestamp,
            },
            {
              tenantId: event.tenantId,
              userId: event.userId,
              correlationId: `replay-${jobId}`,
              source: 'replay',
            },
          );

          replayed++;

          // Update progress every 100 events
          if (replayed % 100 === 0) {
            const progress = Math.round((replayed / events.length) * 100);
            await this.replayService.updateJobStatus(jobId, {
              eventsReplayed: replayed,
              progress,
              errors,
            });

            this.logger.log({
              message: 'Replay progress',
              jobId,
              replayed,
              total: events.length,
              progress,
            });
          }
        } catch (err) {
          errors++;
          this.logger.error({
            message: 'Failed to replay event',
            jobId,
            streamId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Mark job as completed
      await this.replayService.updateJobStatus(jobId, {
        status: 'completed',
        completedAt: new Date(),
        eventsReplayed: replayed,
        progress: 100,
        errors,
      });

      this.logger.log({
        message: 'Event replay completed',
        jobId,
        eventsReplayed: replayed,
        errors,
        totalEvents: events.length,
      });

      return { eventsReplayed: replayed };
    } catch (err) {
      // Mark job as failed
      const errorMessage = err instanceof Error ? err.message : String(err);
      await this.replayService.updateJobStatus(jobId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage,
      });

      this.logger.error({
        message: 'Event replay failed',
        jobId,
        error: errorMessage,
      });

      throw err;
    }
  }

  /**
   * Convert a Date to a Redis Stream ID
   * Stream IDs are timestamp-sequence format
   */
  private timestampToStreamId(date: Date): string {
    return `${date.getTime()}-0`;
  }
}
