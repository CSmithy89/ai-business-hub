import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/services/prisma.service';
import { DigestFrequency } from '@hyvve/shared';
import { DateTime } from 'luxon';

/**
 * DigestSchedulerService handles scheduling of digest jobs
 *
 * This service:
 * - Schedules digest jobs for all users with digestEnabled: true
 * - Groups users by timezone to minimize cron jobs
 * - Reschedules jobs when user preferences change
 */
@Injectable()
export class DigestSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(DigestSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('pm-digest') private digestQueue: Queue,
  ) {}

  /**
   * Initialize digest scheduling on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing digest scheduler...');
    await this.scheduleAllDigests();
    this.logger.log('Digest scheduler initialized');
  }

  /**
   * Schedule digest jobs for all users with digestEnabled: true
   *
   * In development: Obliterates all jobs for clean slate testing
   * In production: Only removes orphaned jobs to prevent data loss on restart
   */
  async scheduleAllDigests(): Promise<void> {
    try {
      // Query all users with digestEnabled: true
      const preferences = await this.prisma.notificationPreference.findMany({
        where: { digestEnabled: true },
      });

      this.logger.log(`Scheduling digests for ${preferences.length} users`);

      // Handle existing jobs based on environment
      if (process.env.NODE_ENV === 'development') {
        // In development, clean slate for easier testing
        await this.digestQueue.obliterate({ force: true });
        this.logger.debug('Development mode: obliterated all existing digest jobs');
      } else {
        // In production, only remove orphaned jobs (users who no longer have digest enabled)
        await this.cleanupOrphanedJobs(preferences.map((p) => p.userId));
      }

      // Schedule job for each user (skips if already exists)
      for (const pref of preferences) {
        await this.scheduleUserDigest(
          pref.userId,
          pref.quietHoursTimezone,
          pref.digestFrequency as DigestFrequency
        );
      }

      this.logger.log(`Scheduled ${preferences.length} digest jobs`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error scheduling digests: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Remove orphaned digest jobs (jobs for users who no longer have digest enabled)
   * This is safe for production multi-instance deployments
   */
  private async cleanupOrphanedJobs(validUserIds: string[]): Promise<void> {
    try {
      const existingJobs = await this.digestQueue.getRepeatableJobs();
      const validUserIdSet = new Set(validUserIds);
      let removedCount = 0;

      for (const job of existingJobs) {
        // Extract userId from job id (format: "digest-{userId}")
        const userId = job.id?.replace('digest-', '');
        if (userId && !validUserIdSet.has(userId)) {
          await this.digestQueue.removeRepeatableByKey(job.key);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        this.logger.log(`Cleaned up ${removedCount} orphaned digest jobs`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Error cleaning up orphaned jobs: ${errorMessage}`);
      // Don't throw - cleanup failure shouldn't block startup
    }
  }

  /**
   * Schedule digest job for a single user
   *
   * Note: This method checks for existing jobs to prevent race conditions
   * when called multiple times rapidly.
   */
  async scheduleUserDigest(
    userId: string,
    timezone: string,
    frequency: DigestFrequency
  ): Promise<void> {
    try {
      const jobId = `digest-${userId}`;

      // Check for existing job to prevent race condition duplicates
      const repeatableJobs = await this.digestQueue.getRepeatableJobs();
      const existingJob = repeatableJobs.find((j) => j.id === jobId);

      if (existingJob) {
        this.logger.debug(`Digest job already exists for user ${userId}, skipping`);
        return;
      }

      // Calculate cron expression for user's timezone
      const cronExpression = this.getCronExpressionForTimezone(timezone, frequency);

      // Add repeatable job
      await this.digestQueue.add(
        'process-user-digest',
        { userId },
        {
          repeat: {
            pattern: cronExpression,
          },
          jobId, // Prevents duplicates
          removeOnComplete: 100,
          removeOnFail: 500,
        }
      );

      this.logger.debug(
        `Scheduled ${frequency} digest for user ${userId} at ${cronExpression} (timezone: ${timezone})`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error scheduling digest for user ${userId}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Remove digest job for a user (when digest is disabled)
   */
  async removeUserDigest(userId: string): Promise<void> {
    try {
      // Get all repeatable jobs and find the one for this user
      const repeatableJobs = await this.digestQueue.getRepeatableJobs();
      const jobId = `digest-${userId}`;
      const job = repeatableJobs.find((j) => j.id === jobId);

      if (!job) {
        this.logger.debug(`No digest job found for user ${userId}`);
        return;
      }

      // Remove using the actual repeatable job key
      await this.digestQueue.removeRepeatableByKey(job.key);

      this.logger.debug(`Removed digest job for user ${userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Error removing digest for user ${userId}: ${errorMessage}`);
      // Don't throw - it's okay if job doesn't exist
    }
  }

  /**
   * Reschedule digest job for a user (when preferences change)
   */
  async rescheduleUserDigest(
    userId: string,
    timezone: string,
    frequency: DigestFrequency
  ): Promise<void> {
    try {
      // Remove existing job
      await this.removeUserDigest(userId);

      // Schedule new job
      await this.scheduleUserDigest(userId, timezone, frequency);

      this.logger.log(
        `Rescheduled digest for user ${userId} to ${frequency} at timezone ${timezone}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error rescheduling digest for user ${userId}: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Convert user's timezone to cron expression for 9:00 AM
   *
   * @param timezone - IANA timezone (e.g., "America/Los_Angeles")
   * @param frequency - Daily or weekly
   * @returns Cron expression (UTC-based)
   */
  getCronExpressionForTimezone(timezone: string, frequency: DigestFrequency): string {
    try {
      // Calculate UTC offset for 9 AM in user's timezone
      const userTime = DateTime.now().setZone(timezone).set({ hour: 9, minute: 0, second: 0 });

      // Validate timezone - Luxon returns invalid DateTime for bad timezones
      if (!userTime.isValid) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }

      const utcTime = userTime.toUTC();
      const utcHour = utcTime.hour;
      const utcMinute = utcTime.minute;

      if (frequency === 'daily') {
        // Daily at 9 AM user time (converted to UTC)
        return `${utcMinute} ${utcHour} * * *`;
      } else {
        // Weekly on Monday at 9 AM user time (converted to UTC)
        return `${utcMinute} ${utcHour} * * 1`;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error calculating cron expression for timezone ${timezone}: ${errorMessage}`
      );

      // Fallback to UTC 9 AM
      if (frequency === 'daily') {
        return '0 9 * * *';
      } else {
        return '0 9 * * 1';
      }
    }
  }
}
