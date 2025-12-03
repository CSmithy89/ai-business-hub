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
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      // Validate dates before converting to stream IDs
      if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid start date: ${startTime}`);
      }
      if (isNaN(endDate.getTime())) {
        throw new Error(`Invalid end date: ${endTime}`);
      }

      const startId = this.timestampToStreamId(startDate);
      const endId = this.timestampToStreamId(endDate);

      // Read events from main stream within time range with pagination
      // Process in batches to handle large datasets
      const BATCH_SIZE = 1000;
      let currentStartId = startId;
      let allEvents: Array<[string, string[]]> = [];

      // Paginate through XRANGE results
      let hasMoreData = true;
      while (hasMoreData) {
        const batch = await this.redis.xrange(
          STREAMS.MAIN,
          currentStartId,
          endId,
          'COUNT',
          BATCH_SIZE,
        );

        if (!batch || batch.length === 0) {
          hasMoreData = false;
          continue;
        }

        allEvents = allEvents.concat(batch);

        // If we got fewer results than BATCH_SIZE, we've reached the end
        if (batch.length < BATCH_SIZE) {
          hasMoreData = false;
          continue;
        }

        // Move to next batch (use last ID + 1 for exclusive range)
        const lastId = batch[batch.length - 1][0];
        // Increment stream ID by 1 (split timestamp-sequence, increment sequence)
        const [timestamp, sequence] = lastId.split('-');
        currentStartId = `${timestamp}-${parseInt(sequence, 10) + 1}`;
      }

      const events = allEvents;

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
    const ts = date.getTime();
    if (isNaN(ts)) {
      throw new Error(`Invalid date provided for stream ID conversion: ${date}`);
    }
    return `${ts}-0`;
  }
}
