import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { BulkUpdateTasksDto } from './dto/bulk-update-tasks.dto'
import { CreateTaskDto } from './dto/create-task.dto'
import { ListTasksQueryDto } from './dto/list-tasks.query.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { TasksService } from './tasks.service'

@ApiTags('PM Tasks')
@Controller('pm/tasks')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  async createTask(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() actor: any,
  ) {
    if (dto.workspaceId && dto.workspaceId !== workspaceId) {
      throw new BadRequestException('workspaceId mismatch')
    }
    return this.tasksService.create(workspaceId, actor.id, dto)
  }

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List tasks with filters and pagination' })
  async listTasks(@CurrentWorkspace() workspaceId: string, @Query() query: ListTasksQueryDto) {
    return this.tasksService.list(workspaceId, query)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async getTask(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.tasksService.getById(workspaceId, id)
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async updateTask(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.update(workspaceId, actor.id, id, dto)
  }

  @Patch('bulk')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Bulk update tasks (status, assignee, phase)' })
  async bulkUpdate(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: BulkUpdateTasksDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.bulkUpdate(workspaceId, actor.id, dto)
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Soft delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async deleteTask(@CurrentWorkspace() workspaceId: string, @Param('id') id: string, @CurrentUser() actor: any) {
    return this.tasksService.softDelete(workspaceId, actor.id, id)
  }
}

