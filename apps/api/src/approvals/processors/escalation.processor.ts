import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ApprovalEscalationService } from '../services/approval-escalation.service';

/**
 * EscalationProcessor - BullMQ processor for scheduled escalation checks
 *
 * Story 04-8: Implement Approval Escalation
 *
 * Processes recurring job to check for and escalate overdue approvals.
 * Runs every 15 minutes (configurable via workspace settings).
 *
 * Job Flow:
 * 1. BullMQ triggers job based on cron schedule (every 15 min)
 * 2. Processor calls ApprovalEscalationService.processAllWorkspaces()
 * 3. Service checks all workspaces with escalation enabled
 * 4. For each workspace, finds and escalates overdue approvals
 * 5. Returns summary of escalations
 *
 * Error Handling:
 * - Errors are logged but don't stop processing of other workspaces
 * - Partial failure handling (some approvals may fail while others succeed)
 * - Job completes even if some escalations fail
 */
@Processor('approval-escalation')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(
    private readonly escalationService: ApprovalEscalationService,
  ) {
    super();
  }

  /**
   * Process escalation check job
   *
   * @param job - BullMQ job
   * @returns Summary of escalations
   */
  async process(job: Job<any>): Promise<any> {
    this.logger.log({
      message: 'Starting approval escalation job',
      jobId: job.id,
      jobName: job.name,
      timestamp: new Date().toISOString(),
    });

    try {
      // Process all workspaces
      const summary = await this.escalationService.processAllWorkspaces();

      this.logger.log({
        message: 'Completed approval escalation job',
        jobId: job.id,
        summary,
      });

      return summary;
    } catch (error) {
      this.logger.error({
        message: 'Escalation job failed',
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw to mark job as failed (BullMQ will retry based on settings)
      throw error;
    }
  }
}
