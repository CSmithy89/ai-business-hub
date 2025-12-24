import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { API_SCOPES } from '@hyvve/shared'
import { ProjectsService } from '../projects/projects.service'
import { CreateProjectDto } from '../projects/dto/create-project.dto'
import { UpdateProjectDto } from '../projects/dto/update-project.dto'
import { ListProjectsQueryDto } from './dto/list-projects-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('projects')
@Controller('api/v1/pm/projects')
@UseGuards(ApiKeyGuard, ScopeGuard)
@ApiSecurity('api-key')
export class ProjectsApiController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'List projects with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async listProjects(@Query() query: ListProjectsQueryDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    const { status, search, limit = 50, offset = 0, sortBy: _sortBy, sortOrder: _sortOrder } = query

    // Build query for service
    const serviceQuery = {
      status,
      search,
      page: Math.floor(offset / limit) + 1,
      limit,
    }

    const result = await this.projectsService.list(workspaceId, serviceQuery)

    // Transform to paginated response
    return new PaginatedResponse(result.data, result.meta.total, limit, offset)
  }

  @Post()
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Creates a new project in the workspace. Requires PM_WRITE scope.'
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    schema: {
      example: {
        id: 'cm4proj123xyz',
        workspaceId: 'cm4ws456abc',
        businessId: 'cm4biz123xyz',
        name: 'Website Redesign Q1 2025',
        description: 'Comprehensive redesign of company website',
        type: 'WEBSITE',
        status: 'PLANNING',
        color: '#3b82f6',
        icon: 'code',
        createdAt: '2025-01-10T12:00:00Z',
        updatedAt: '2025-01-10T12:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data - Check required fields and data types' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope (requires PM_WRITE)' })
  async createProject(@Body() dto: CreateProjectDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.projectsService.create(workspaceId, actorId, dto)
  }

  @Get(':id')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getProject(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    return this.projectsService.getById(workspaceId, id)
  }

  @Put(':id')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.projectsService.update(workspaceId, actorId, id, dto)
  }

  @Delete(':id')
  @Scopes(API_SCOPES.PM_ADMIN)
  @ApiOperation({ summary: 'Delete project (soft delete)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async deleteProject(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    await this.projectsService.softDelete(workspaceId, actorId, id)
  }
}
