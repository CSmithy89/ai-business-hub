import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PhaseStatus } from '@prisma/client'
import { PhasesService } from '../phases/phases.service'
import { CreatePhaseDto } from '../phases/dto/create-phase.dto'
import { UpdatePhaseDto } from '../phases/dto/update-phase.dto'

@ApiTags('phases')
@Controller('api/v1/pm')
export class PhasesApiController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get('projects/:projectId/phases')
  @ApiOperation({ summary: 'List phases for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Phases retrieved successfully' })
  async listPhases(@Param('projectId') projectId: string) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const workspaceId = 'placeholder'

    return this.phasesService.list(workspaceId, projectId)
  }

  @Post('projects/:projectId/phases')
  @ApiOperation({ summary: 'Create a new phase' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Phase created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createPhase(@Param('projectId') projectId: string, @Body() dto: CreatePhaseDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.phasesService.create(workspaceId, actorId, projectId, dto)
  }

  @Put('phases/:id')
  @ApiOperation({ summary: 'Update phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase updated successfully' })
  @ApiResponse({ status: 404, description: 'Phase not found' })
  async updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.phasesService.update(workspaceId, actorId, id, dto)
  }

  @Post('phases/:id/start')
  @ApiOperation({ summary: 'Start a phase (transition status to CURRENT)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phase transition' })
  async startPhase(@Param('id') id: string) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    // Use update method to transition phase status to CURRENT
    return this.phasesService.update(workspaceId, actorId, id, { status: PhaseStatus.CURRENT })
  }

  @Post('phases/:id/complete')
  @ApiOperation({ summary: 'Complete a phase (transition status to COMPLETED)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phase transition' })
  async completePhase(@Param('id') id: string) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    // Use update method to transition phase status to COMPLETED
    return this.phasesService.update(workspaceId, actorId, id, { status: PhaseStatus.COMPLETED })
  }
}
