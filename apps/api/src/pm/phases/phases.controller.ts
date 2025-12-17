import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CreatePhaseDto } from './dto/create-phase.dto'
import { UpdatePhaseDto } from './dto/update-phase.dto'
import { PhasesService } from './phases.service'

@ApiTags('PM Phases')
@Controller('pm')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Post('projects/:projectId/phases')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Create a phase under a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async createPhase(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePhaseDto,
    @CurrentUser() actor: any,
  ) {
    return this.phasesService.create(workspaceId, actor.id, projectId, dto)
  }

  @Get('projects/:projectId/phases')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List phases for a project (ordered)' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async listPhases(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.phasesService.list(workspaceId, projectId)
  }

  @Patch('phases/:id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update a phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async updatePhase(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
    @CurrentUser() actor: any,
  ) {
    return this.phasesService.update(workspaceId, actor.id, id, dto)
  }
}

