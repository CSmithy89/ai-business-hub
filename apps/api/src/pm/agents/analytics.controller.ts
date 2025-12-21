import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { AnalyticsService } from './analytics.service';
import {
  PrismForecastDto,
  VelocityMetadataDto,
  VelocityHistoryDto,
  GenerateForecastDto,
  AnomalyDto,
  CompletionProbabilityDto,
  PmRiskEntryDto,
  UpdateRiskStatusDto,
  RiskStatus,
} from './dto/prism-forecast.dto';

/**
 * Analytics Controller
 *
 * TODO: Add rate limiting with @Throttle() decorator to prevent abuse.
 * See: https://docs.nestjs.com/security/rate-limiting
 * Recommended: 10 requests per minute for analytics endpoints
 */
@ApiTags('PM Analytics')
@Controller('pm/projects/:projectId/analytics')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('forecast')
  @Roles('owner', 'admin', 'member')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate completion forecast',
    description: 'Generate a predictive completion forecast using historical velocity data and Prism agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Forecast generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async generateForecast(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: GenerateForecastDto,
  ): Promise<PrismForecastDto> {
    return this.analyticsService.getForecast(
      projectId,
      workspaceId,
      dto.scenario,
    );
  }

  @Get('velocity')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get current velocity',
    description: 'Calculate current team velocity with trend analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Velocity calculated successfully',
  })
  async getVelocity(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('window') window: string = '4w',
  ): Promise<VelocityMetadataDto> {
    return this.analyticsService.getVelocity(projectId, workspaceId, window);
  }

  @Get('velocity-history')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get velocity history',
    description: 'Retrieve historical velocity data points for trend visualization',
  })
  @ApiResponse({
    status: 200,
    description: 'Velocity history retrieved successfully',
  })
  async getVelocityHistory(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('periods') periods: string = '12',
  ): Promise<{ history: VelocityHistoryDto[] }> {
    const history = await this.analyticsService.getVelocityHistory(
      projectId,
      workspaceId,
      parseInt(periods, 10),
    );
    return { history };
  }

  @Get('anomalies')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Detect anomalies',
    description: 'Identify statistical anomalies in project metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Anomalies detected successfully',
  })
  async detectAnomalies(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('metricType') metricType: string = 'velocity',
    @Query('threshold') threshold: string = '2.0',
  ): Promise<{ anomalies: AnomalyDto[] }> {
    const anomalies = await this.analyticsService.detectAnomalies(
      projectId,
      workspaceId,
      metricType,
      parseFloat(threshold),
    );
    return { anomalies };
  }

  @Get('completion-probability')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Analyze completion probability',
    description: 'Calculate probability of completing by a specific target date',
  })
  @ApiResponse({
    status: 200,
    description: 'Completion probability calculated successfully',
  })
  async analyzeCompletionProbability(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('targetDate') targetDate: string,
  ): Promise<CompletionProbabilityDto> {
    return this.analyticsService.analyzeCompletionProbability(
      projectId,
      workspaceId,
      targetDate,
    );
  }

  // ============================================
  // RISK DETECTION ENDPOINTS (PM-08-3)
  // ============================================

  @Get('risks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Detect project risks',
    description: 'Analyze project and detect schedule, scope, and resource risks using Prism agent',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk entries returned',
    type: [Object],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async detectRisks(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<PmRiskEntryDto[]> {
    return this.analyticsService.detectRisks(projectId, workspaceId);
  }

  @Get('risks/entries')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get risk entries',
    description: 'Retrieve existing risk entries for a project with optional status filter',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: RiskStatus,
    description: 'Filter by risk status (ACTIVE, MITIGATED, ACCEPTED, DISMISSED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk entries retrieved',
    type: [Object],
  })
  async getRiskEntries(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('status') status?: RiskStatus,
  ): Promise<PmRiskEntryDto[]> {
    return this.analyticsService.getRiskEntries(projectId, workspaceId, status);
  }

  @Patch('risks/:riskId/status')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Update risk status',
    description: 'Update the status of a risk entry (ACTIVE, MITIGATED, ACCEPTED, DISMISSED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Risk status updated',
  })
  async updateRiskStatus(
    @Param('projectId') projectId: string,
    @Param('riskId') riskId: string,
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: UpdateRiskStatusDto,
  ): Promise<PmRiskEntryDto> {
    return this.analyticsService.updateRiskStatus(riskId, projectId, workspaceId, dto.status);
  }
}
