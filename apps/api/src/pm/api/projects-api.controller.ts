import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ProjectsService } from '../projects/projects.service'
import { CreateProjectDto } from '../projects/dto/create-project.dto'
import { UpdateProjectDto } from '../projects/dto/update-project.dto'
import { ListProjectsQueryDto } from './dto/list-projects-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'

@ApiTags('projects')
@Controller('api/v1/pm/projects')
export class ProjectsApiController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  async listProjects(@Query() query: ListProjectsQueryDto) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    // For now, this endpoint structure is ready but will need authentication
    const workspaceId = 'placeholder' // Will be replaced with API key workspaceId

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
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createProject(@Body() dto: CreateProjectDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.projectsService.create(workspaceId, actorId, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProject(@Param('id') id: string) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const workspaceId = 'placeholder'

    return this.projectsService.getById(workspaceId, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.projectsService.update(workspaceId, actorId, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (soft delete)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 204, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async deleteProject(@Param('id') id: string) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    await this.projectsService.softDelete(workspaceId, actorId, id)
  }
}
