import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards, Req } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { API_SCOPES } from '@hyvve/shared'
import { TasksService } from '../tasks/tasks.service'
import { CreateTaskDto } from '../tasks/dto/create-task.dto'
import { UpdateTaskDto } from '../tasks/dto/update-task.dto'
import { ListTasksQueryDto } from './dto/list-tasks-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'
import { AssignTaskDto } from './dto/assign-task.dto'
import { TransitionTaskDto } from './dto/transition-task.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { RateLimitGuard } from '@/common/guards/rate-limit.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('tasks')
@Controller('api/v1/pm/tasks')
@UseGuards(ApiKeyGuard, ScopeGuard, RateLimitGuard)
@ApiSecurity('api-key')
export class TasksApiController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async listTasks(@Query() query: ListTasksQueryDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    const {
      projectId,
      phaseId,
      status,
      assigneeId,
      priority,
      type,
      dueAfter,
      dueBefore,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query

    // Build query for service
    const serviceQuery = {
      projectId,
      phaseId,
      status,
      assigneeId,
      priority,
      type,
      dueAfter,
      dueBefore,
      search,
      page: Math.floor(offset / limit) + 1,
      limit,
      sortBy,
      sortOrder,
    }

    const result = await this.tasksService.list(workspaceId, serviceQuery)

    // Transform to paginated response
    return new PaginatedResponse(result.data, result.meta.total, limit, offset)
  }

  @Post()
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({
    summary: 'Create a new task',
    description: 'Creates a new task within a project phase. Requires PM_WRITE scope.'
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    schema: {
      example: {
        id: 'cm4task123xyz',
        projectId: 'cm4abc123xyz',
        phaseId: 'cm4def456uvw',
        title: 'Implement user authentication',
        description: 'Add OAuth2 authentication with Google and GitHub providers',
        type: 'STORY',
        priority: 'HIGH',
        status: 'TODO',
        assignmentType: 'HUMAN',
        assigneeId: 'cm4user789rst',
        storyPoints: 5,
        createdAt: '2025-01-10T12:00:00Z',
        updatedAt: '2025-01-10T12:00:00Z'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data - Check required fields and data types' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope (requires PM_WRITE)' })
  async createTask(@Body() dto: CreateTaskDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.tasksService.create(workspaceId, actorId, dto)
  }

  @Get(':id')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getTask(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    return this.tasksService.getById(workspaceId, id)
  }

  @Put(':id')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.tasksService.update(workspaceId, actorId, id, dto)
  }

  @Post(':id/assign')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Assign task to user or agent' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async assignTask(@Param('id') id: string, @Body() dto: AssignTaskDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    // Update task with assignment details
    const updateDto = {
      assigneeId: dto.assigneeId,
      agentId: dto.agentId,
      assignmentType: dto.assignmentType,
    }

    return this.tasksService.update(workspaceId, actorId, id, updateDto)
  }

  @Post(':id/transition')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Transition task to new status' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async transitionTask(@Param('id') id: string, @Body() dto: TransitionTaskDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    return this.tasksService.update(workspaceId, actorId, id, { status: dto.status })
  }

  @Get(':id/activities')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Get task activity log' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task activities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getTaskActivities(@Param('id') _id: string, @Req() _request: Request & ApiAuthenticatedRequest) {
    // TODO: Implement getActivities method in TasksService (or fetch from task details)
    // For now, return empty array as placeholder
    return { data: [] }
  }

  @Delete(':id')
  @HttpCode(204)
  @Scopes(API_SCOPES.PM_ADMIN)
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async deleteTask(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const actorId = request.apiKey.createdById

    await this.tasksService.softDelete(workspaceId, actorId, id)
  }
}
