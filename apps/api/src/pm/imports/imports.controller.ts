import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { ImportsService } from './imports.service'
import { StartCsvImportDto } from './dto/start-csv-import.dto'
import { StartJiraImportDto } from './dto/start-jira-import.dto'

@ApiTags('PM Imports')
@Controller('pm/imports')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('csv/start')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Start a CSV import' })
  @ApiResponse({ status: 201, description: 'Import job created' })
  async startCsvImport(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
    @Body() dto: StartCsvImportDto,
  ) {
    return this.importsService.startCsvImport(workspaceId, actor.id, dto)
  }

  @Post('jira/start')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Start a Jira import' })
  @ApiResponse({ status: 201, description: 'Jira import job created' })
  async startJiraImport(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
    @Body() dto: StartJiraImportDto,
  ) {
    return this.importsService.startJiraImport(workspaceId, actor.id, dto)
  }

  @Get(':id/status')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get CSV import status' })
  @ApiParam({ name: 'id', description: 'Import job ID' })
  async getImportStatus(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.importsService.getImportStatus(workspaceId, id)
  }

  @Get(':id/errors')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get CSV import errors' })
  @ApiParam({ name: 'id', description: 'Import job ID' })
  async getImportErrors(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.importsService.getImportErrors(workspaceId, id)
  }
}
