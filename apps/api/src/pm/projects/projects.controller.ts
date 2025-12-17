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
import { CreateProjectDto } from './dto/create-project.dto'
import { ListProjectsQueryDto } from './dto/list-projects.query.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectsService } from './projects.service'

@ApiTags('PM Projects')
@Controller('pm/projects')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async createProject(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreateProjectDto,
    @CurrentUser() actor: any,
  ) {
    if (dto.workspaceId && dto.workspaceId !== workspaceId) {
      throw new BadRequestException('workspaceId mismatch')
    }
    return this.projectsService.create(workspaceId, actor.id, dto)
  }

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List projects with filters and pagination' })
  async listProjects(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ListProjectsQueryDto,
  ) {
    return this.projectsService.list(workspaceId, query)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a project by ID (includes phases)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async getProject(@CurrentWorkspace() workspaceId: string, @Param('id') id: string) {
    return this.projectsService.getById(workspaceId, id)
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async updateProject(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() actor: any,
  ) {
    return this.projectsService.update(workspaceId, actor.id, id, dto)
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Soft delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  async deleteProject(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.projectsService.softDelete(workspaceId, actor.id, id)
  }
}

