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
    return this.healthService.acknowledgeRiskWithProject(
      workspaceId,
      projectId,
      riskId,
      userId,
    );
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
    return this.healthService.resolveRisk(
      workspaceId,
      projectId,
      riskId,
      userId,
    );
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
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    return this.healthService.checkTeamCapacity(workspaceId, projectId);
  }

  @Get(':projectId/velocity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Analyze velocity trend (for agent tools)' })
  async analyzeVelocity(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    return this.healthService.analyzeVelocity(workspaceId, projectId);
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
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = req.workspaceId;
    return this.healthService.getOverdueTasks(workspaceId, projectId);
  }
}
