import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SavedViewsService } from '../saved-views/saved-views.service'
import { CreateSavedViewDto } from '../saved-views/dto/create-saved-view.dto'
import { UpdateSavedViewDto } from '../saved-views/dto/update-saved-view.dto'
import { ListViewsQueryDto } from './dto/list-views-query.dto'

@ApiTags('views')
@Controller('api/v1/pm/views')
export class ViewsApiController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @ApiOperation({ summary: 'List saved views' })
  @ApiResponse({ status: 200, description: 'Views retrieved successfully' })
  @ApiResponse({ status: 400, description: 'projectId is required' })
  async listViews(@Query() query: ListViewsQueryDto) {
    // TODO: Get workspaceId and userId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const userId = 'placeholder'

    // SavedViewsService requires projectId, so enforce it here
    if (!query.projectId) {
      throw new Error('projectId query parameter is required')
    }

    return this.savedViewsService.list(workspaceId, userId, query.projectId)
  }

  @Post()
  @ApiOperation({ summary: 'Create saved view' })
  @ApiResponse({ status: 201, description: 'View created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createView(@Body() dto: CreateSavedViewDto) {
    // TODO: Get workspaceId and userId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const userId = 'placeholder'

    return this.savedViewsService.create(workspaceId, userId, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saved view by ID' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 200, description: 'View retrieved successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async getView(@Param('id') id: string) {
    // TODO: Get workspaceId and userId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const userId = 'placeholder'

    return this.savedViewsService.getById(workspaceId, userId, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update saved view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 200, description: 'View updated successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async updateView(@Param('id') id: string, @Body() dto: UpdateSavedViewDto) {
    // TODO: Get workspaceId and userId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const userId = 'placeholder'

    return this.savedViewsService.update(workspaceId, userId, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete saved view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 204, description: 'View deleted successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async deleteView(@Param('id') id: string) {
    // TODO: Get workspaceId and userId from API key context (PM-11.2)
    const workspaceId = 'placeholder'
    const userId = 'placeholder'

    await this.savedViewsService.delete(workspaceId, userId, id)
  }
}
