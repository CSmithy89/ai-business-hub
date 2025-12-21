import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import pLimit from 'p-limit';
import { PrismaService } from '../../common/services/prisma.service';
import { HealthService } from './health.service';
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
export class HealthCheckCron {
  private readonly logger = new Logger(HealthCheckCron.name);

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
  ) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async runHealthChecks() {
    const startTime = Date.now();
    this.logger.log('Starting scheduled health checks');

    try {
      // Get all active projects that need health checks
      // Filter by lastHealthCheck to avoid redundant checks
      const staleThreshold = new Date(
        Date.now() - CRON_SETTINGS.HEALTH_CHECK_STALE_MINUTES * 60 * 1000,
      );

      const activeProjects = await this.prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          OR: [
            { lastHealthCheck: null },
            { lastHealthCheck: { lt: staleThreshold } },
          ],
        },
        select: {
          id: true,
          workspaceId: true,
          name: true,
        },
        take: CRON_SETTINGS.HEALTH_CHECK_BATCH_SIZE,
        orderBy: { lastHealthCheck: 'asc' }, // Oldest first
      });

      this.logger.log(`Found ${activeProjects.length} active projects needing health checks`);

      if (activeProjects.length === 0) {
        this.logger.log('No projects need health checks at this time');
        return;
      }

      // Process projects in parallel with concurrency limit
      const limit = pLimit(CRON_SETTINGS.HEALTH_CHECK_CONCURRENCY);
      let successCount = 0;
      let failCount = 0;

      const results = await Promise.allSettled(
        activeProjects.map((project) =>
          limit(async () => {
            try {
              // Use retry logic with exponential backoff for transient failures
              await withRetry(
                () =>
                  this.healthService.runHealthCheck(
                    project.workspaceId,
                    project.id,
                    SYSTEM_USERS.HEALTH_CHECK,
                  ),
                this.logger,
                `Health check for project ${project.id}`,
              );
              this.logger.log(`Health check completed for project ${project.id}`);
              return { success: true, projectId: project.id };
            } catch (error) {
              this.logger.error(
                `Health check failed for project ${project.id} after ${RETRY_SETTINGS.MAX_RETRIES + 1} attempts:`,
                error,
              );
              return { success: false, projectId: project.id, error };
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
        `Scheduled health checks completed: ${successCount} succeeded, ${failCount} failed, duration=${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Health check cron job failed after ${duration}ms:`, error);
    }
  }
}
