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
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { ReportService, GenerateReportDto } from './report.service';

@Controller('pm/agents/reports')
@UseGuards(AuthGuard)
export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * Generate a new report
   * POST /pm/agents/reports/:projectId/generate
   */
  @Post(':projectId/generate')
  async generateReport(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: GenerateReportDto,
  ) {
    return this.reportService.generateReport(
      workspaceId,
      projectId,
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
    @Param('projectId') projectId: string,
    @Query('type') type?: ReportType,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reportService.getReportHistory(
      workspaceId,
      projectId,
      type,
      limit || 10,
    );
  }

  /**
   * Get a specific report by ID
   * GET /pm/agents/reports/:projectId/:reportId
   */
  @Get(':projectId/:reportId')
  async getReport(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Param('reportId') reportId: string,
  ) {
    return this.reportService.getReport(workspaceId, projectId, reportId);
  }
}
