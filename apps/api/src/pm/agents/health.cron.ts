import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';
import { HealthService } from './health.service';
import { SYSTEM_USERS } from './constants';

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
      // Get all active projects
      const activeProjects = await this.prisma.project.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          workspaceId: true,
          name: true,
        },
      });

      this.logger.log(`Found ${activeProjects.length} active projects`);

      let successCount = 0;
      let failCount = 0;

      // Run health check for each project
      for (const project of activeProjects) {
        try {
          await this.healthService.runHealthCheck(
            project.workspaceId,
            project.id,
            SYSTEM_USERS.HEALTH_CHECK,
          );
          this.logger.log(`Health check completed for project ${project.id}`);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Health check failed for project ${project.id}:`,
            error,
          );
          failCount++;
          // Continue with next project even if one fails
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
