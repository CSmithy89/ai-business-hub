import { Controller, Get, Param, UseGuards, Logger } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PresenceService } from '../../realtime/presence.service';
import { PrismaService } from '../../common/services/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PresenceResponse } from '@hyvve/shared';

/**
 * PresenceController - REST API endpoints for presence queries
 *
 * Provides HTTP endpoints to query active users for projects and tasks.
 * WebSocket events provide real-time updates, these endpoints are for
 * initial queries and fallback when WebSocket is unavailable.
 *
 * @see Story PM-06.2: Presence Indicators
 */
@Controller('pm/presence')
@UseGuards(AuthGuard)
export class PresenceController {
  private readonly logger = new Logger(PresenceController.name);

  constructor(
    private readonly presenceService: PresenceService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get active users for a project
   *
   * @param projectId - Project ID
   * @returns Active users with location data
   */
  @Get('projects/:projectId')
  async getProjectPresence(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { id: string; workspaceId: string },
  ): Promise<PresenceResponse> {
    try {
      // SECURITY: Verify user has access to project via team membership
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          team: {
            projectId,
            project: {
              workspaceId: user.workspaceId,
              deletedAt: null,
            },
          },
        },
      });

      if (!teamMember) {
        this.logger.warn({
          message: 'User does not have access to project',
          userId: user.id,
          projectId,
        });
        return { users: [], total: 0 };
      }

      // Get active users from presence service
      const users = await this.presenceService.getProjectPresence(projectId);

      return {
        users,
        total: users.length,
      };
    } catch (error) {
      this.logger.error('Failed to get project presence', {
        projectId,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return empty list on error (graceful degradation)
      return { users: [], total: 0 };
    }
  }

  /**
   * Get active users for a task (optional, for future use)
   *
   * @param taskId - Task ID
   * @returns Active users viewing this task
   */
  @Get('tasks/:taskId')
  async getTaskPresence(
    @Param('taskId') taskId: string,
    @CurrentUser() user: { id: string; workspaceId: string },
  ): Promise<PresenceResponse> {
    try {
      // Get task to get project ID
      const task = await this.prisma.task.findFirst({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!task) {
        this.logger.warn({
          message: 'Task not found',
          userId: user.id,
          taskId,
        });
        return { users: [], total: 0 };
      }

      // Verify user has access to project via team membership
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          team: {
            projectId: task.projectId,
            project: {
              workspaceId: user.workspaceId,
              deletedAt: null,
            },
          },
        },
      });

      if (!teamMember) {
        this.logger.warn({
          message: 'User does not have access to task',
          userId: user.id,
          taskId,
        });
        return { users: [], total: 0 };
      }

      // Get active users for this task
      const users = await this.presenceService.getTaskPresence(taskId);

      return {
        users,
        total: users.length,
      };
    } catch (error) {
      this.logger.error('Failed to get task presence', {
        taskId,
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Return empty list on error (graceful degradation)
      return { users: [], total: 0 };
    }
  }
}
