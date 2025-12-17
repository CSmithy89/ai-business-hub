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
import { CreateTaskCommentDto } from './dto/create-task-comment.dto'
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto'
import { CreateTaskRelationDto } from './dto/create-task-relation.dto'
import { ListTasksQueryDto } from './dto/list-tasks.query.dto'
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { UpsertTaskLabelDto } from './dto/upsert-task-label.dto'
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

  @Post(':id/relations')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a task relation (and inverse where applicable)' })
  @ApiParam({ name: 'id', description: 'Task ID (source)' })
  async createRelation(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateTaskRelationDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.createRelation(workspaceId, actor.id, id, dto)
  }

  @Delete(':id/relations/:relationId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Remove a task relation (and inverse where applicable)' })
  @ApiParam({ name: 'id', description: 'Task ID (source)' })
  @ApiParam({ name: 'relationId', description: 'TaskRelation ID' })
  async deleteRelation(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Param('relationId') relationId: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.deleteRelation(workspaceId, actor.id, id, relationId)
  }

  @Post(':id/comments')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async createComment(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateTaskCommentDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.createComment(workspaceId, actor.id, id, dto)
  }

  @Patch(':id/comments/:commentId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Edit a task comment (author only)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'TaskComment ID' })
  async updateComment(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateTaskCommentDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.updateComment(workspaceId, actor.id, id, commentId, dto)
  }

  @Delete(':id/comments/:commentId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Delete a task comment (author only)' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'TaskComment ID' })
  async deleteComment(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.deleteComment(workspaceId, actor.id, id, commentId)
  }

  @Post(':id/attachments')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Attach a file to a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async createAttachment(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateTaskAttachmentDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.createAttachment(workspaceId, actor.id, id, dto)
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Remove a task attachment' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'attachmentId', description: 'TaskAttachment ID' })
  async deleteAttachment(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.deleteAttachment(workspaceId, actor.id, id, attachmentId)
  }

  @Post(':id/labels')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add or update a task label' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  async upsertLabel(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpsertTaskLabelDto,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.upsertLabel(workspaceId, actor.id, id, dto)
  }

  @Delete(':id/labels/:labelId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Remove a task label' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'labelId', description: 'TaskLabel ID' })
  async deleteLabel(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Param('labelId') labelId: string,
    @CurrentUser() actor: any,
  ) {
    return this.tasksService.deleteLabel(workspaceId, actor.id, id, labelId)
  }
}
