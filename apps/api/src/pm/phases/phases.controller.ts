import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
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
import { PhaseTransitionDto } from './dto/phase-transition.dto'
import { PhasesService } from './phases.service'
import { PhaseService } from '../agents/phase.service'
import { CheckpointService } from '../agents/checkpoint.service'
import { CreateCheckpointDto, UpdateCheckpointDto } from '../agents/dto/checkpoint.dto'
import type { Request } from 'express'

@ApiTags('PM Phases')
@Controller('pm')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PhasesController {
  constructor(
    private readonly phasesService: PhasesService,
    private readonly phaseService: PhaseService,
    private readonly checkpointService: CheckpointService,
  ) {}

  @Post('projects/:projectId/phases')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a phase under a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async createPhase(
    @CurrentWorkspace() workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreatePhaseDto,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.phasesService.assertProjectLead(workspaceId, actor.id, projectId)
    }
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
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async updatePhase(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePhaseDto,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.phasesService.assertPhaseProjectLead(workspaceId, actor.id, id)
    }
    return this.phasesService.update(workspaceId, actor.id, id, dto)
  }

  @Post('phases/:id/analyze-completion')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Analyze phase for completion readiness (Scope agent)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async analyzePhaseCompletion(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.phasesService.assertPhaseProjectLead(workspaceId, actor.id, id)
    }
    return this.phaseService.analyzePhaseCompletion(
      workspaceId,
      id,
      actor.id,
    )
  }

  @Post('phases/:id/transition')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Execute phase transition with task actions' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async transitionPhase(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Body() dto: PhaseTransitionDto,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.phasesService.assertPhaseProjectLead(workspaceId, actor.id, id)
    }
    return this.phaseService.executePhaseTransition(
      workspaceId,
      id,
      actor.id,
      dto,
    )
  }

  @Get('phases/:id/checkpoints/upcoming')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get upcoming checkpoints for phase (next 3 days)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async getUpcomingCheckpoints(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    const checkpoints = await this.phaseService.getUpcomingCheckpoints(
      workspaceId,
      id,
    )

    // Return 404 if no upcoming checkpoints (per story spec)
    if (checkpoints.length === 0) {
      throw new NotFoundException('No upcoming checkpoints')
    }

    return checkpoints
  }

  @Get('phases/:id/checkpoints')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List checkpoints for a phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async listCheckpoints(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') phaseId: string,
  ) {
    return this.checkpointService.listCheckpoints(workspaceId, phaseId)
  }

  @Post('phases/:id/checkpoints')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a checkpoint for a phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  async createCheckpoint(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Param('id') phaseId: string,
    @Body() dto: CreateCheckpointDto,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      await this.phasesService.assertPhaseProjectLead(workspaceId, user.id, phaseId)
    }
    return this.checkpointService.createCheckpoint(
      workspaceId,
      phaseId,
      user.id,
      dto,
    )
  }

  @Patch('phases/:id/checkpoints/:checkpointId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a checkpoint' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiParam({ name: 'checkpointId', description: 'Checkpoint ID' })
  async updateCheckpoint(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Param('id') phaseId: string,
    @Param('checkpointId') checkpointId: string,
    @Body() dto: UpdateCheckpointDto,
    @Req() req: Request,
  ) {
    const memberRole = (req as unknown as { memberRole?: string }).memberRole
    if (memberRole === 'member') {
      // Verify checkpoint belongs to the phase and user has access
      const checkpoints = await this.checkpointService.listCheckpoints(workspaceId, phaseId);
      const checkpointData = checkpoints.find(c => c.id === checkpointId);
      if (!checkpointData) {
        throw new NotFoundException('Checkpoint not found in this phase');
      }
      await this.phasesService.assertPhaseProjectLead(workspaceId, user.id, checkpointData.phaseId)
    }
    return this.checkpointService.updateCheckpoint(
      workspaceId,
      checkpointId,
      user.id,
      dto,
    )
  }
}
