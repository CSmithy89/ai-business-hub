import { Body, Controller, Get, Param, Post, Put, UseGuards, Req } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { PhaseStatus } from '@prisma/client'
import { API_SCOPES } from '@hyvve/shared'
import { PhasesService } from '../phases/phases.service'
import { CreatePhaseDto } from '../phases/dto/create-phase.dto'
import { UpdatePhaseDto } from '../phases/dto/update-phase.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { RateLimitGuard } from '@/common/guards/rate-limit.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('phases')
@Controller('api/v1/pm')
@UseGuards(ApiKeyGuard, ScopeGuard, RateLimitGuard)
@ApiSecurity('api-key')
export class PhasesApiController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get('projects/:projectId/phases')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'List phases for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Phases retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async listPhases(@Param('projectId') projectId: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    return this.phasesService.list(workspaceId, projectId)
  }

  @Post('projects/:projectId/phases')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Create a new phase' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Phase created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async createPhase(@Param('projectId') projectId: string, @Body() dto: CreatePhaseDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.phasesService.create(workspaceId, actorId, projectId, dto)
  }

  @Put('phases/:id')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Update phase' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase updated successfully' })
  @ApiResponse({ status: 404, description: 'Phase not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.phasesService.update(workspaceId, actorId, id, dto)
  }

  @Post('phases/:id/start')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Start a phase (transition status to CURRENT)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase started successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phase transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async startPhase(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    // Use update method to transition phase status to CURRENT
    return this.phasesService.update(workspaceId, actorId, id, { status: PhaseStatus.CURRENT })
  }

  @Post('phases/:id/complete')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Complete a phase (transition status to COMPLETED)' })
  @ApiParam({ name: 'id', description: 'Phase ID' })
  @ApiResponse({ status: 200, description: 'Phase completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phase transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async completePhase(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    // Use update method to transition phase status to COMPLETED
    return this.phasesService.update(workspaceId, actorId, id, { status: PhaseStatus.COMPLETED })
  }
}
