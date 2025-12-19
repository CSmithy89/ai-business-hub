import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledReportService } from './scheduled-report.service';
import { ReportService } from './report.service';

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
    this.logger.log('Running scheduled report generation job...');

    try {
      // Find all schedules that are due to run
      const dueSchedules =
        await this.scheduledReportService.findDueSchedules();

      this.logger.log(
        `Found ${dueSchedules.length} schedule(s) due for report generation`,
      );

      // Generate reports for each due schedule
      for (const schedule of dueSchedules) {
        try {
          this.logger.log(
            `Generating ${schedule.reportType} report for project ${schedule.project.name} (${schedule.projectId})`,
          );

          // Generate report using existing ReportService
          await this.reportService.generateReport(
            schedule.workspaceId,
            schedule.projectId,
            'herald_agent', // System user for scheduled reports
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
        } catch (error) {
          // Log error but continue with other schedules
          this.logger.error(
            `Failed to generate scheduled report for project ${schedule.projectId}:`,
            error,
          );
          // Don't throw - continue processing other schedules
        }
      }

      this.logger.log('Scheduled report generation job completed');
    } catch (error) {
      this.logger.error('Scheduled report cron job failed:', error);
    }
  }
}
