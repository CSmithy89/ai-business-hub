import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { HealthService } from './health.service';

@Controller('pm/agents/health')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiTags('PM Agents - Health')
@ApiBearerAuth()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Post(':projectId/check')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Trigger health check for project' })
  async triggerHealthCheck(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    return this.healthService.runHealthCheck(workspaceId, projectId, userId);
  }

  @Get(':projectId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get latest health score for project' })
  async getLatestHealthScore(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    return this.healthService.getLatestHealthScore(workspaceId, projectId);
  }

  @Get(':projectId/risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get active risks for project' })
  async getActiveRisks(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    return this.healthService.getActiveRisks(workspaceId, projectId);
  }

  @Post(':projectId/risks/:riskId/acknowledge')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Acknowledge risk (mark as seen)' })
  async acknowledgeRisk(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('riskId') riskId: string,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;
    return this.healthService.acknowledgeRisk(workspaceId, riskId, userId);
  }

  @Post(':projectId/risks/:riskId/resolve')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Mark risk as resolved' })
  async resolveRisk(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('riskId') riskId: string,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;
    return this.healthService.resolveRisk(workspaceId, riskId, userId);
  }

  // Internal endpoints for agent tools
  @Post(':projectId/detect-risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Detect all project risks (for agent tools)' })
  async detectRisks(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    await this.healthService.runHealthCheck(
      workspaceId,
      projectId,
      userId,
    );
    const risks = await this.healthService.getActiveRisks(
      workspaceId,
      projectId,
    );

    return { risks };
  }

  @Post(':projectId/calculate-score')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Calculate project health score (for agent tools)',
  })
  async calculateScore(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    const userId = req.user.id;

    return this.healthService.runHealthCheck(workspaceId, projectId, userId);
  }

  @Get(':projectId/team-capacity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Check team capacity (for agent tools)' })
  async checkTeamCapacity(
    @Request() _req: any,
    @Param('projectId') projectId: string,
  ) {

    // Get all tasks for the project
    const tasks = await this.healthService['prisma'].task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
    });

    // Calculate team workload
    const teamWorkload = new Map<string, { hours: number; userId: string }>();
    tasks.forEach((task: any) => {
      if (
        task.assigneeId &&
        task.estimatedHours &&
        task.status !== 'DONE'
      ) {
        const current = teamWorkload.get(task.assigneeId) || {
          hours: 0,
          userId: task.assigneeId,
        };
        teamWorkload.set(task.assigneeId, {
          hours: current.hours + task.estimatedHours,
          userId: task.assigneeId,
        });
      }
    });

    // Find overloaded members (>40h)
    const overloadedMembers = Array.from(teamWorkload.entries())
      .filter(([, data]) => data.hours > 40)
      .map(([memberId, data]) => ({
        userId: memberId,
        assignedHours: data.hours,
        threshold: 40,
        overloadPercent: ((data.hours - 40) / 40) * 100,
      }));

    const teamHealth =
      overloadedMembers.length > 0
        ? 'overloaded'
        : Array.from(teamWorkload.values()).some((d) => d.hours >= 35)
          ? 'at_capacity'
          : 'healthy';

    return {
      overloadedMembers,
      teamHealth,
    };
  }

  @Get(':projectId/velocity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Analyze velocity trend (for agent tools)' })
  async analyzeVelocity(
    @Request() _req: any,
    @Param('projectId') projectId: string,
  ) {
    const tasks = await this.healthService['prisma'].task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(
      now.getTime() - 28 * 24 * 60 * 60 * 1000,
    );

    const completedLast7Days = tasks.filter(
      (t: any) =>
        t.completedAt &&
        new Date(t.completedAt) >= sevenDaysAgo &&
        new Date(t.completedAt) <= now,
    ).length;

    const completedLast28Days = tasks.filter(
      (t: any) =>
        t.completedAt &&
        new Date(t.completedAt) >= twentyEightDaysAgo &&
        new Date(t.completedAt) <= now,
    ).length;

    const currentVelocity = completedLast7Days;
    const baselineVelocity = completedLast28Days / 4;

    const changePercent =
      baselineVelocity > 0
        ? ((currentVelocity - baselineVelocity) / baselineVelocity) * 100
        : 0;

    const trend =
      changePercent > 10 ? 'up' : changePercent < -10 ? 'down' : 'stable';
    const alert = changePercent < -30;

    return {
      currentVelocity,
      baselineVelocity,
      changePercent,
      trend,
      alert,
    };
  }

  @Get(':projectId/blocker-chains')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Detect blocker chains (for agent tools)' })
  async detectBlockerChains(
    @Request() _req: any,
    @Param('projectId') _projectId: string,
  ) {
    // For now, return empty chains - would need to implement task dependencies
    return {
      chains: [],
    };
  }

  @Get(':projectId/overdue-tasks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get overdue and due-soon tasks (for agent tools)' })
  async getOverdueTasks(
    @Request() _req: any,
    @Param('projectId') projectId: string,
  ) {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const tasks = await this.healthService['prisma'].task.findMany({
      where: {
        projectId,
        deletedAt: null,
        dueDate: { not: null },
        status: { not: 'DONE' },
      },
    });

    const overdue = tasks
      .filter((t: any) => t.dueDate && new Date(t.dueDate) < now)
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        daysOverdue: Math.floor(
          (now.getTime() - new Date(t.dueDate).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
        assigneeId: t.assigneeId || null,
      }));

    const dueSoon = tasks
      .filter(
        (t: any) =>
          t.dueDate &&
          new Date(t.dueDate) >= now &&
          new Date(t.dueDate) <= in48Hours,
      )
      .map((t: any) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        hoursRemaining:
          (new Date(t.dueDate).getTime() - now.getTime()) / (60 * 60 * 1000),
        assigneeId: t.assigneeId || null,
      }));

    return {
      overdue,
      dueSoon,
    };
  }
}
