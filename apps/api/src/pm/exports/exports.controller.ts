import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { ExportTasksQueryDto } from './dto/export-tasks.query.dto'
import { ExportsService } from './exports.service'

@ApiTags('PM Exports')
@Controller('pm/exports')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('tasks')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Export tasks to CSV' })
  @ApiResponse({ status: 200, description: 'CSV export stream' })
  async exportTasks(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ExportTasksQueryDto,
  ) {
    const { stream } = await this.exportsService.exportTasks(workspaceId, query)

    const filename = `tasks-export-${new Date().toISOString().slice(0, 10)}.csv`

    // Use platform-agnostic StreamableFile options instead of Express Response headers
    return new StreamableFile(stream, {
      type: 'text/csv',
      disposition: `attachment; filename="${filename}"`,
    })
  }
}
