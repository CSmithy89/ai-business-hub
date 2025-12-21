import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HealthService } from './health.service';
import { ProjectIdParamsDto, ProjectRiskParamsDto } from './dto/params.dto';

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
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.runHealthCheck(workspaceId, params.projectId, userId);
  }

  @Get(':projectId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get latest health score for project' })
  async getLatestHealthScore(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.getLatestHealthScore(workspaceId, params.projectId);
  }

  @Get(':projectId/risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get active risks for project' })
  async getActiveRisks(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.getActiveRisks(workspaceId, params.projectId);
  }

  @Post(':projectId/risks/:riskId/acknowledge')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Acknowledge risk (mark as seen)' })
  async acknowledgeRisk(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Param() params: ProjectRiskParamsDto,
  ) {
    return this.healthService.acknowledgeRiskWithProject(
      workspaceId,
      params.projectId,
      params.riskId,
      userId,
    );
  }

  @Post(':projectId/risks/:riskId/resolve')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Mark risk as resolved' })
  async resolveRisk(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Param() params: ProjectRiskParamsDto,
  ) {
    return this.healthService.resolveRisk(
      workspaceId,
      params.projectId,
      params.riskId,
      userId,
    );
  }

  // Internal endpoints for agent tools
  @Post(':projectId/detect-risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Detect all project risks (for agent tools)' })
  async detectRisks(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    await this.healthService.runHealthCheck(
      workspaceId,
      params.projectId,
      userId,
    );
    const risks = await this.healthService.getActiveRisks(
      workspaceId,
      params.projectId,
    );

    return { risks };
  }

  @Post(':projectId/calculate-score')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Calculate project health score (for agent tools)',
  })
  async calculateScore(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser('sub') userId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.runHealthCheck(workspaceId, params.projectId, userId);
  }

  @Get(':projectId/team-capacity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Check team capacity (for agent tools)' })
  async checkTeamCapacity(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.checkTeamCapacity(workspaceId, params.projectId);
  }

  @Get(':projectId/velocity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Analyze velocity trend (for agent tools)' })
  async analyzeVelocity(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.analyzeVelocity(workspaceId, params.projectId);
  }

  @Get(':projectId/blocker-chains')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Detect blocker chains (for agent tools)' })
  async detectBlockerChains(
    @Param() _params: ProjectIdParamsDto,
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
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
  ) {
    return this.healthService.getOverdueTasks(workspaceId, params.projectId);
  }
}
