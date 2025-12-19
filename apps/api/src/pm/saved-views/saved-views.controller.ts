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
import { CreateSavedViewDto } from './dto/create-saved-view.dto'
import { UpdateSavedViewDto } from './dto/update-saved-view.dto'
import { SavedViewsService } from './saved-views.service'

@ApiTags('PM Saved Views')
@Controller('pm/saved-views')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List all saved views for a project' })
  @ApiResponse({ status: 200, description: 'List of saved views' })
  @ApiResponse({ status: 400, description: 'Missing projectId parameter' })
  async listSavedViews(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required')
    }
    return this.savedViewsService.list(workspaceId, user.id, projectId)
  }

  @Get('default')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get default view for a project' })
  @ApiResponse({ status: 200, description: 'Default saved view or null' })
  @ApiResponse({ status: 400, description: 'Missing projectId parameter' })
  async getDefaultView(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Query('projectId') projectId: string,
  ) {
    if (!projectId) {
      throw new BadRequestException('projectId query parameter is required')
    }
    return this.savedViewsService.getDefault(workspaceId, user.id, projectId)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a saved view by ID' })
  @ApiParam({ name: 'id', description: 'Saved view ID' })
  @ApiResponse({ status: 200, description: 'Saved view details' })
  async getSavedView(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.savedViewsService.getById(workspaceId, user.id, id)
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a new saved view' })
  @ApiResponse({ status: 201, description: 'Saved view created' })
  async createSavedView(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSavedViewDto,
  ) {
    return this.savedViewsService.create(workspaceId, user.id, dto)
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a saved view' })
  @ApiParam({ name: 'id', description: 'Saved view ID' })
  @ApiResponse({ status: 200, description: 'Saved view updated' })
  async updateSavedView(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSavedViewDto,
  ) {
    return this.savedViewsService.update(workspaceId, user.id, id, dto)
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Delete a saved view' })
  @ApiParam({ name: 'id', description: 'Saved view ID' })
  @ApiResponse({ status: 200, description: 'Saved view deleted' })
  async deleteSavedView(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.savedViewsService.delete(workspaceId, user.id, id)
  }
}
