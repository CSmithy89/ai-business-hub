import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import {
  ScheduledReportService,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './scheduled-report.service';
import { ScheduleIdParamsDto } from './dto/params.dto';

@Controller('pm/agents/reports/schedules')
@UseGuards(AuthGuard, TenantGuard)
export class ScheduledReportController {
  constructor(private scheduledReportService: ScheduledReportService) {}

  /**
   * Create a new report schedule
   * POST /pm/agents/reports/schedules
   */
  @Post()
  async createSchedule(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduledReportService.createSchedule(workspaceId, dto);
  }

  /**
   * List report schedules
   * GET /pm/agents/reports/schedules
   */
  @Get()
  async listSchedules(
    @CurrentWorkspace() workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.scheduledReportService.listSchedules(workspaceId, projectId);
  }

  /**
   * Get a single report schedule
   * GET /pm/agents/reports/schedules/:id
   */
  @Get(':id')
  async getSchedule(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ScheduleIdParamsDto,
  ) {
    return this.scheduledReportService.getSchedule(workspaceId, params.id);
  }

  /**
   * Update a report schedule
   * PUT /pm/agents/reports/schedules/:id
   */
  @Put(':id')
  async updateSchedule(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ScheduleIdParamsDto,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduledReportService.updateSchedule(
      workspaceId,
      params.id,
      dto,
    );
  }

  /**
   * Delete a report schedule
   * DELETE /pm/agents/reports/schedules/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSchedule(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ScheduleIdParamsDto,
  ): Promise<void> {
    await this.scheduledReportService.deleteSchedule(workspaceId, params.id);
  }

  /**
   * Toggle a schedule's enabled status
   * PATCH /pm/agents/reports/schedules/:id/toggle
   */
  @Patch(':id/toggle')
  async toggleSchedule(
    @CurrentWorkspace() workspaceId: string,
    @Param() params: ScheduleIdParamsDto,
    @Body('enabled') enabled: boolean,
  ) {
    return this.scheduledReportService.toggleSchedule(
      workspaceId,
      params.id,
      enabled,
    );
  }
}
