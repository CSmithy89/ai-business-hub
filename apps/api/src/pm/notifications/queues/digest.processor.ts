import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { DigestService } from '../digest.service';

/**
 * DigestProcessor handles processing of digest jobs from BullMQ
 *
 * This processor:
 * - Receives digest jobs from the pm:digest queue
 * - Calls DigestService to generate and send digest emails
 * - Handles job failures and retries
 */
@Injectable()
@Processor('pm:digest')
export class DigestProcessor extends WorkerHost {
  private readonly logger = new Logger(DigestProcessor.name);

  constructor(private readonly digestService: DigestService) {
    super();
  }

  /**
   * Process digest job
   *
   * @param job - BullMQ job containing userId
   */
  async process(job: Job<{ userId: string }>): Promise<void> {
    const { userId } = job.data;

    this.logger.log(`Processing digest job ${job.id} for user ${userId}`);

    try {
      // Process user digest
      await this.digestService.processUserDigest(userId);

      this.logger.log(`Completed digest job ${job.id} for user ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to process digest job ${job.id} for user ${userId}: ${errorMessage}`,
        errorStack
      );

      // Re-throw error to trigger retry
      throw error;
    }
  }
}
