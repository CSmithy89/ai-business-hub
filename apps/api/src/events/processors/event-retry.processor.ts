import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../common/services/prisma.service';

/**
 * Job data structure for retry events
 */
interface RetryEventJobData {
  /** Event ID to retry */
  eventId: string;
  /** Redis stream message ID */
  streamId: string;
  /** Current retry attempt number */
  attempt: number;
}

/**
 * EventRetryProcessor
 *
 * BullMQ processor that handles scheduled retry jobs for failed events.
 * Resets event status to PENDING so EventConsumerService can reprocess it.
 *
 * Key features:
 * - Processes delayed retry jobs scheduled by EventRetryService
 * - Resets event status from FAILED to PENDING
 * - Handles race conditions (event already in DLQ)
 * - Logs retry attempts for monitoring
 *
 * @see Story 05-4: Implement Retry and Dead Letter Queue
 */
@Processor('event-retry')
export class EventRetryProcessor extends WorkerHost {
  private readonly logger = new Logger(EventRetryProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Process a retry event job
   *
   * Called by BullMQ when a delayed retry job is ready to execute.
   * Resets the event status to PENDING so EventConsumerService picks it up
   * from the Redis stream for reprocessing.
   *
   * @param job - BullMQ job with retry event data
   */
  async process(job: Job<RetryEventJobData>): Promise<void> {
    // Validate job.data exists and has required fields
    const data = job.data;
    if (!data || !data.eventId) {
      this.logger.warn({
        message: 'Invalid retry job data, skipping job',
        jobId: job.id,
        data,
      });
      return;
    }

    const { eventId, streamId, attempt } = data;

    this.logger.log({
      message: 'Processing retry job',
      jobId: job.id,
      eventId,
      streamId,
      attempt,
    });

    try {
      // Check if event already in DLQ (race condition protection)
      // This can happen if multiple handlers failed and one already moved it to DLQ
      const metadata = await this.prisma.eventMetadata.findUnique({
        where: { eventId },
      });

      if (!metadata) {
        this.logger.warn({
          message: 'Event metadata not found, skipping retry',
          eventId,
          jobId: job.id,
        });
        return;
      }

      if (metadata.status === 'DLQ') {
        this.logger.log({
          message: 'Event already in DLQ, skipping retry',
          eventId,
          jobId: job.id,
        });
        return;
      }

      // Reset status to PENDING for reprocessing
      // EventConsumerService will pick it up from the Redis stream
      await this.prisma.eventMetadata.update({
        where: { eventId },
        data: {
          status: 'PENDING',
        },
      });

      this.logger.log({
        message: 'Event retry scheduled - status reset to PENDING',
        eventId,
        attempt,
        jobId: job.id,
      });
    } catch (error) {
      this.logger.error(
        {
          message: 'Failed to process retry job',
          jobId: job.id,
          eventId,
          error: error instanceof Error ? error.message : String(error),
        },
        error instanceof Error ? error.stack : undefined,
      );

      // Rethrow to let BullMQ handle job retry logic
      throw error;
    }
  }
}
