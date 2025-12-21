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
  ScenarioForecastDto,
  TeamPerformanceMetricsDto,
  ForecastScenarioDto,
} from './dto/prism-forecast.dto';
import { DashboardDataDto } from './dto/analytics-dashboard.dto';

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

  // ============================================
  // DASHBOARD ENDPOINT (PM-08-4)
  // ============================================

  @Get('dashboard')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get analytics dashboard data',
    description: 'Retrieve comprehensive dashboard data including trends, overview metrics, anomalies, risks, and insights',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    type: String,
    description: 'Start date for trend analysis (ISO 8601 format, defaults to 4 weeks ago)',
    example: '2025-11-21',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    type: String,
    description: 'End date for trend analysis (ISO 8601 format, defaults to today)',
    example: '2025-12-21',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid date range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getDashboard(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('start') startParam?: string,
    @Query('end') endParam?: string,
  ): Promise<DashboardDataDto> {
    // Parse and validate date range
    const end = endParam ? new Date(endParam) : new Date();
    const start = startParam
      ? new Date(startParam)
      : new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000); // Default: 4 weeks ago

    // Validate date range
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format. Use ISO 8601 format (YYYY-MM-DD).');
    }

    if (start >= end) {
      throw new Error('Start date must be before end date.');
    }

    // Enforce max 1 year range (prevent DoS)
    const maxRangeDays = 365;
    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > maxRangeDays) {
      throw new Error(`Date range cannot exceed ${maxRangeDays} days.`);
    }

    return this.analyticsService.getDashboardData(projectId, workspaceId, { start, end });
  }

  // ============================================
  // PM-08-5: SCENARIO FORECASTING & TEAM METRICS
  // ============================================

  @Post('scenario-forecast')
  @Roles('owner', 'admin', 'member')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get scenario forecast with risk assessment',
    description: 'Analyze what-if scenarios by adjusting scope, team size, and velocity to predict project outcomes with risk assessment',
  })
  @ApiResponse({
    status: 200,
    description: 'Scenario forecast generated successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid scenario parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getScenarioForecast(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Body() scenario: ForecastScenarioDto,
  ): Promise<ScenarioForecastDto> {
    return this.analyticsService.getScenarioForecast(projectId, workspaceId, scenario);
  }

  @Get('team-performance')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get team performance metrics',
    description: 'Retrieve comprehensive team performance metrics including velocity, cycle time, throughput, completion rate, and capacity utilization',
  })
  @ApiResponse({
    status: 200,
    description: 'Team performance metrics retrieved successfully',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async getTeamPerformance(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<TeamPerformanceMetricsDto> {
    return this.analyticsService.getTeamPerformanceMetrics(projectId, workspaceId);
  }
}
