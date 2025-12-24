import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TasksService } from '../tasks/tasks.service'
import { CreateTaskDto } from '../tasks/dto/create-task.dto'
import { UpdateTaskDto } from '../tasks/dto/update-task.dto'
import { ListTasksQueryDto } from './dto/list-tasks-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'
import { AssignTaskDto } from './dto/assign-task.dto'
import { TransitionTaskDto } from './dto/transition-task.dto'

@ApiTags('tasks')
@Controller('api/v1/pm/tasks')
export class TasksApiController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
  async listTasks(@Query() query: ListTasksQueryDto) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const workspaceId = 'placeholder'

    const {
      projectId,
      phaseId,
      status,
      assigneeId,
      priority,
      type,
      dueAfter: _dueAfter,
      dueBefore: _dueBefore,
      search,
      limit = 50,
      offset = 0,
      sortBy: _sortBy,
      sortOrder: _sortOrder,
    } = query

    // Build query for service
    const serviceQuery = {
      projectId,
      phaseId,
      status,
      assigneeId,
      priority,
      type,
      search,
      page: Math.floor(offset / limit) + 1,
      limit,
    }

    const result = await this.tasksService.list(workspaceId, serviceQuery)

    // Transform to paginated response
    return new PaginatedResponse(result.data, result.meta.total, limit, offset)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createTask(@Body() dto: CreateTaskDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.tasksService.create(workspaceId, actorId, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(@Param('id') id: string) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const workspaceId = 'placeholder'

    return this.tasksService.getById(workspaceId, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.tasksService.update(workspaceId, actorId, id, dto)
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign task to user or agent' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async assignTask(@Param('id') id: string, @Body() dto: AssignTaskDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    // Update task with assignment details
    const updateDto = {
      assigneeId: dto.assigneeId,
      agentId: dto.agentId,
      assignmentType: dto.assignmentType,
    }

    return this.tasksService.update(workspaceId, actorId, id, updateDto)
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Transition task to new status' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async transitionTask(@Param('id') id: string, @Body() dto: TransitionTaskDto) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    return this.tasksService.update(workspaceId, actorId, id, { status: dto.status })
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get task activity log' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task activities retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskActivities(@Param('id') _id: string) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const _workspaceId = 'placeholder'

    // TODO: Implement getActivities method in TasksService (or fetch from task details)
    // For now, return empty array as placeholder
    return { data: [] }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async deleteTask(@Param('id') id: string) {
    // TODO: Get workspaceId and actorId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const actorId = 'placeholder'

    await this.tasksService.softDelete(workspaceId, actorId, id)
  }
}
