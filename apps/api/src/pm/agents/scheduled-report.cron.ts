import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import pLimit from 'p-limit';
import { ScheduledReportService } from './scheduled-report.service';
import { ReportService } from './report.service';
import { DistributedLockService } from '../../common/services/distributed-lock.service';
import { SYSTEM_USERS, CRON_SETTINGS, RETRY_SETTINGS } from './constants';

/**
 * Retry a function with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  logger: Logger,
  context: string,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= RETRY_SETTINGS.MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < RETRY_SETTINGS.MAX_RETRIES) {
        const delay = Math.min(
          RETRY_SETTINGS.BASE_DELAY_MS *
            Math.pow(RETRY_SETTINGS.BACKOFF_MULTIPLIER, attempt),
          RETRY_SETTINGS.MAX_DELAY_MS,
        );
        logger.warn(
          `${context}: Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          lastError.message,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

@Injectable()
export class ScheduledReportCron {
  private readonly logger = new Logger(ScheduledReportCron.name);
  private readonly LOCK_KEY = 'cron:scheduled-report';
  private readonly LOCK_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours (less than 24 hour interval)

  constructor(
    private readonly scheduledReportService: ScheduledReportService,
    private readonly reportService: ReportService,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Check and run scheduled reports daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runScheduledReports(): Promise<void> {
    // Acquire distributed lock to prevent multiple instances running simultaneously
    const lock = await this.lockService.acquireLock(this.LOCK_KEY, {
      ttl: this.LOCK_TTL_MS,
    });

    if (!lock.acquired) {
      this.logger.debug('Scheduled report generation already running on another instance, skipping');
      return;
    }

    const startTime = Date.now();
    this.logger.log('Running scheduled report generation job...');

    try {
      // Find all schedules that are due to run (with batch limit)
      const dueSchedules = await this.scheduledReportService.findDueSchedules(
        CRON_SETTINGS.REPORT_GENERATION_BATCH_SIZE,
      );

      this.logger.log(
        `Found ${dueSchedules.length} schedule(s) due for report generation`,
      );

      if (dueSchedules.length === 0) {
        this.logger.log('No scheduled reports due at this time');
        return;
      }

      // Process reports in parallel with concurrency limit
      const limit = pLimit(CRON_SETTINGS.REPORT_GENERATION_CONCURRENCY);
      let successCount = 0;
      let failCount = 0;

      const results = await Promise.allSettled(
        dueSchedules.map((schedule) =>
          limit(async () => {
            try {
              this.logger.log(
                `Generating ${schedule.reportType} report for project ${schedule.project.name} (${schedule.projectId})`,
              );

              // Use retry logic with exponential backoff for transient failures
              await withRetry(
                async () => {
                  // Generate report using existing ReportService
                  await this.reportService.generateReport(
                    schedule.workspaceId,
                    schedule.projectId,
                    SYSTEM_USERS.HERALD_AGENT,
                    {
                      type: schedule.reportType,
                      stakeholderType: schedule.stakeholderType || undefined,
                    },
                  );

                  // Update schedule after successful generation
                  await this.scheduledReportService.updateScheduleAfterRun(
                    schedule.id,
                  );
                },
                this.logger,
                `Report generation for schedule ${schedule.id}`,
              );

              this.logger.log(
                `Successfully generated scheduled report for project ${schedule.projectId}`,
              );
              return { success: true, scheduleId: schedule.id };
            } catch (error) {
              this.logger.error(
                `Failed to generate scheduled report for project ${schedule.projectId} after ${RETRY_SETTINGS.MAX_RETRIES + 1} attempts:`,
                error,
              );
              return { success: false, scheduleId: schedule.id, error };
            }
          }),
        ),
      );

      // Count results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Scheduled report generation job completed: ${successCount} succeeded, ${failCount} failed, duration=${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Scheduled report cron job failed after ${duration}ms:`, error);
    } finally {
      // Always release the lock when done
      await lock.release();
    }
  }
}
