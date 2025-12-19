import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/services/prisma.service';
import { HealthService } from './health.service';

@Injectable()
export class HealthCheckCron {
  private readonly logger = new Logger(HealthCheckCron.name);

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
  ) {}

  @Cron('*/15 * * * *') // Every 15 minutes
  async runHealthChecks() {
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

      // Run health check for each project
      for (const project of activeProjects) {
        try {
          await this.healthService.runHealthCheck(
            project.workspaceId,
            project.id,
            'system', // System user for scheduled checks
          );
          this.logger.log(`Health check completed for project ${project.id}`);
        } catch (error) {
          this.logger.error(
            `Health check failed for project ${project.id}:`,
            error,
          );
          // Continue with next project even if one fails
        }
      }

      this.logger.log('Scheduled health checks completed');
    } catch (error) {
      this.logger.error('Health check cron job failed:', error);
    }
  }
}
