import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import pLimit from 'p-limit';
import { ScheduledReportService } from './scheduled-report.service';
import { ReportService } from './report.service';
import { SYSTEM_USERS, CRON_SETTINGS } from './constants';

@Injectable()
export class ScheduledReportCron {
  private readonly logger = new Logger(ScheduledReportCron.name);

  constructor(
    private readonly scheduledReportService: ScheduledReportService,
    private readonly reportService: ReportService,
  ) {}

  /**
   * Check and run scheduled reports daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runScheduledReports(): Promise<void> {
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

              this.logger.log(
                `Successfully generated scheduled report for project ${schedule.projectId}`,
              );
              return { success: true, scheduleId: schedule.id };
            } catch (error) {
              this.logger.error(
                `Failed to generate scheduled report for project ${schedule.projectId}:`,
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
    }
  }
}
