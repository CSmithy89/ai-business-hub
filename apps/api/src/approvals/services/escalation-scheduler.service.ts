import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * EscalationSchedulerService - Manages the recurring escalation job
 *
 * Story 04-8: Implement Approval Escalation
 *
 * Responsibilities:
 * - Register recurring job on module initialization
 * - Configure job schedule (every 15 minutes by default)
 * - Provide manual trigger capability for testing
 *
 * Job Configuration:
 * - Job name: 'check-escalations'
 * - Schedule: Every 15 minutes (*/15 * * * *)
 * - Repeat: true
 * - Remove on complete: keep last 10
 * - Remove on fail: keep last 50
 */
@Injectable()
export class EscalationSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(EscalationSchedulerService.name);

  constructor(
    @InjectQueue('approval-escalation')
    private readonly escalationQueue: Queue,
  ) {}

  /**
   * Initialize recurring job on module startup
   */
  async onModuleInit() {
    try {
      // Add recurring job (every 15 minutes)
      await this.escalationQueue.add(
        'check-escalations',
        {}, // No job data needed
        {
          repeat: {
            pattern: '*/15 * * * *', // Every 15 minutes
          },
          removeOnComplete: {
            count: 10, // Keep last 10 completed jobs
          },
          removeOnFail: {
            count: 50, // Keep last 50 failed jobs for debugging
          },
        },
      );

      this.logger.log({
        message: 'Escalation recurring job registered',
        schedule: 'Every 15 minutes',
        pattern: '*/15 * * * *',
      });
    } catch (error) {
      this.logger.error({
        message: 'Failed to register escalation job',
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - allow app to start even if job registration fails
    }
  }

  /**
   * Manually trigger escalation check (for testing)
   *
   * @returns Job information
   */
  async triggerManually(): Promise<any> {
    try {
      const job = await this.escalationQueue.add(
        'check-escalations-manual',
        { manual: true },
        {
          priority: 1, // High priority for manual triggers
        },
      );

      this.logger.log({
        message: 'Manual escalation check triggered',
        jobId: job.id,
      });

      return {
        jobId: job.id,
        status: 'queued',
        message: 'Escalation check triggered manually',
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to trigger manual escalation check',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get queue status and job counts
   *
   * @returns Queue statistics
   */
  async getQueueStatus(): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.escalationQueue.getWaitingCount(),
      this.escalationQueue.getActiveCount(),
      this.escalationQueue.getCompletedCount(),
      this.escalationQueue.getFailedCount(),
      this.escalationQueue.getDelayedCount(),
    ]);

    return {
      queueName: 'approval-escalation',
      counts: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
