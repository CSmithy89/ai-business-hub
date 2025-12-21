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
  Res,
  Header,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
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
  ExportQueryDto,
} from './dto/prism-forecast.dto';
import { DashboardDataDto } from './dto/analytics-dashboard.dto';

/**
 * Analytics Controller
 *
 * Provides predictive analytics, forecasting, and risk assessment endpoints.
 * Rate limiting applied to prevent abuse of computationally expensive operations.
 */
@ApiTags('PM Analytics')
@Controller('pm/projects/:projectId/analytics')
@UseGuards(ThrottlerGuard, AuthGuard, TenantGuard, RolesGuard)
@Throttle({ long: { limit: 60, ttl: 60000 } }) // Default: 60 requests per minute
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('forecast')
  @Throttle({ medium: { limit: 10, ttl: 60000 } }) // 10 requests per minute - Monte Carlo is expensive
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
  @ApiQuery({
    name: 'window',
    required: false,
    enum: ['1w', '2w', '4w', 'sprint'],
    description: 'Time window for velocity calculation (1w, 2w, 4w, or sprint)',
  })
  @ApiResponse({
    status: 200,
    description: 'Velocity calculated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - invalid window parameter' })
  async getVelocity(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('window') window: string = '4w',
  ): Promise<VelocityMetadataDto> {
    // Validate window parameter
    const validWindows = ['1w', '2w', '4w', 'sprint'];
    if (!validWindows.includes(window)) {
      throw new BadRequestException(
        `Invalid window parameter. Valid values: ${validWindows.join(', ')}`,
      );
    }
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
    const parsedPeriods = Number.parseInt(periods, 10);
    if (Number.isNaN(parsedPeriods) || parsedPeriods <= 0) {
      throw new BadRequestException('periods must be a positive integer.');
    }

    const history = await this.analyticsService.getVelocityHistory(
      projectId,
      workspaceId,
      parsedPeriods,
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
    const parsedThreshold = Number.parseFloat(threshold);
    if (!Number.isFinite(parsedThreshold) || parsedThreshold <= 0) {
      throw new BadRequestException('threshold must be a positive number.');
    }

    const anomalies = await this.analyticsService.detectAnomalies(
      projectId,
      workspaceId,
      metricType,
      parsedThreshold,
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
    if (!targetDate) {
      throw new BadRequestException('targetDate is required (YYYY-MM-DD).');
    }

    const parsedTargetDate = new Date(targetDate);
    if (Number.isNaN(parsedTargetDate.getTime())) {
      throw new BadRequestException('Invalid targetDate. Use ISO 8601 format (YYYY-MM-DD).');
    }

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
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async detectRisks(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<{ risks: PmRiskEntryDto[] }> {
    const risks = await this.analyticsService.detectRisks(projectId, workspaceId);
    return { risks };
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
    type: Object,
  })
  async getRiskEntries(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query('status') status?: RiskStatus,
  ): Promise<{ risks: PmRiskEntryDto[] }> {
    const risks = await this.analyticsService.getRiskEntries(projectId, workspaceId, status);
    return { risks };
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
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD).');
    }

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date.');
    }

    // Enforce max 1 year range (prevent DoS)
    const maxRangeDays = 365;
    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > maxRangeDays) {
      throw new BadRequestException(`Date range cannot exceed ${maxRangeDays} days.`);
    }

    return this.analyticsService.getDashboardData(projectId, workspaceId, { start, end });
  }

  // ============================================
  // PM-08-5: SCENARIO FORECASTING & TEAM METRICS
  // ============================================

  @Post('scenario-forecast')
  @Throttle({ medium: { limit: 10, ttl: 60000 } }) // 10 requests per minute - Monte Carlo is expensive
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

  // ============================================
  // PM-08-6: ANALYTICS EXPORT ENDPOINTS
  // ============================================

  @Get('export/csv')
  @Roles('owner', 'admin', 'member')
  @Header('Content-Type', 'text/csv')
  @ApiOperation({
    summary: 'Export analytics data as CSV',
    description: 'Download analytics metrics, trends, and risk data in CSV format',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for export range (ISO 8601 format)',
    example: '2025-11-21',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for export range (ISO 8601 format)',
    example: '2025-12-21',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
    content: { 'text/csv': {} },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportCsv(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ExportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Parse date range
    const dateRange = this.parseDateRange(query.startDate, query.endDate);

    // Generate CSV content
    const csvContent = await this.analyticsService.exportCsv(
      projectId,
      workspaceId,
      dateRange,
    );

    // Get project name for filename
    const project = await this.analyticsService.getTrendDataForExport(
      projectId,
      workspaceId,
      dateRange,
    );
    const safeName = project.projectName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${safeName}-analytics-${dateStr}.csv`;

    res.set({
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    const buffer = Buffer.from(csvContent, 'utf-8');
    return new StreamableFile(buffer);
  }

  @Get('export/pdf-data')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get structured data for PDF report generation',
    description: 'Returns structured analytics data suitable for PDF rendering. Client-side or separate service handles actual PDF generation.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for export range (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for export range (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Structured report data for PDF generation',
    type: Object,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportPdfData(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ExportQueryDto,
  ): Promise<{
    title: string;
    subtitle: string;
    generatedAt: string;
    sections: Array<{
      title: string;
      content: string | Record<string, unknown>;
    }>;
  }> {
    const dateRange = this.parseDateRange(query.startDate, query.endDate);
    return this.analyticsService.exportPdfData(projectId, workspaceId, dateRange);
  }

  @Get('export/trend-data')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({
    summary: 'Get raw trend data for export',
    description: 'Retrieve aggregated trend data including velocity, scope, completion, and risk metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for trend range (ISO 8601 format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for trend range (ISO 8601 format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend data retrieved successfully',
    type: Object,
  })
  async getTrendData(
    @Param('projectId') projectId: string,
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ExportQueryDto,
  ) {
    const dateRange = this.parseDateRange(query.startDate, query.endDate);
    return this.analyticsService.getTrendDataForExport(projectId, workspaceId, dateRange);
  }

  /**
   * Helper to parse date range from query params with validation
   */
  private parseDateRange(
    startDate?: string,
    endDate?: string,
  ): { start: Date; end: Date } | undefined {
    if (!startDate && !endDate) return undefined;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Validate parsed dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (YYYY-MM-DD).');
    }

    if (start >= end) {
      throw new BadRequestException('Start date must be before end date.');
    }

    return { start, end };
  }
}
