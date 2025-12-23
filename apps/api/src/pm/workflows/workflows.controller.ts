import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ListWorkflowsQueryDto } from './dto/list-workflows-query.dto';
import { WorkflowsService } from './workflows.service';

@ApiTags('PM Workflows')
@Controller('pm/workflows')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created' })
  async create(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreateWorkflowDto,
    @CurrentUser() actor: any,
  ) {
    return this.workflowsService.create(workspaceId, actor.id, dto);
  }

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List workflows with filters' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved' })
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ListWorkflowsQueryDto,
  ) {
    return this.workflowsService.findAll(workspaceId, query);
  }

  @Get(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get workflow details' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow details retrieved' })
  async findOne(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.workflowsService.findOne(workspaceId, id);
  }

  @Put(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow updated' })
  async update(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowDto,
    @CurrentUser() actor: any,
  ) {
    return this.workflowsService.update(workspaceId, actor.id, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow deleted' })
  async remove(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.workflowsService.remove(workspaceId, id);
  }

  @Post(':id/activate')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Activate workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow activated' })
  async activate(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.workflowsService.activate(workspaceId, actor.id, id);
  }

  @Post(':id/pause')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Pause workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 200, description: 'Workflow paused' })
  async pause(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.workflowsService.pause(workspaceId, actor.id, id);
  }
}
