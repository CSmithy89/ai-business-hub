import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { ReportService, GenerateReportDto } from './report.service';
import { ProjectIdParamsDto, ProjectReportParamsDto } from './dto/params.dto';

@Controller('pm/agents/reports')
@UseGuards(ThrottlerGuard, AuthGuard)
@Throttle({ long: { limit: 30, ttl: 60000 } }) // Default: 30 requests per minute
export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * Generate a new report
   * POST /pm/agents/reports/:projectId/generate
   */
  @Post(':projectId/generate')
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 reports per minute (expensive operation)
  async generateReport(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportService.generateReport(
      workspaceId,
      params.projectId,
      userId,
      dto,
    );
  }

  /**
   * Get report history for a project
   * GET /pm/agents/reports/:projectId
   */
  @Get(':projectId')
  async getReportHistory(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectIdParamsDto,
    @Query('type') type?: ReportType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reportService.getReportHistory(
      workspaceId,
      params.projectId,
      type,
      limit ?? 10,
    );
  }

  /**
   * Get a specific report by ID
   * GET /pm/agents/reports/:projectId/:reportId
   */
  @Get(':projectId/:reportId')
  async getReport(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ProjectReportParamsDto,
  ) {
    return this.reportService.getReport(workspaceId, params.projectId, params.reportId);
  }
}
