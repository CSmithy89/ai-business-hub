import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, UseGuards, Req, BadRequestException } from '@nestjs/common'
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { API_SCOPES } from '@hyvve/shared'
import { SavedViewsService } from '../saved-views/saved-views.service'
import { CreateSavedViewDto } from '../saved-views/dto/create-saved-view.dto'
import { UpdateSavedViewDto } from '../saved-views/dto/update-saved-view.dto'
import { ListViewsQueryDto } from './dto/list-views-query.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { RateLimitGuard } from '@/common/guards/rate-limit.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('views')
@Controller('api/v1/pm/views')
@UseGuards(ApiKeyGuard, ScopeGuard, RateLimitGuard)
@ApiSecurity('api-key')
export class ViewsApiController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Get()
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'List saved views' })
  @ApiResponse({ status: 200, description: 'Views retrieved successfully' })
  @ApiResponse({ status: 400, description: 'projectId is required' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async listViews(@Query() query: ListViewsQueryDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    // SavedViewsService requires projectId, so enforce it here
    if (!query.projectId) {
      throw new BadRequestException('projectId query parameter is required')
    }

    return this.savedViewsService.list(workspaceId, userId, query.projectId)
  }

  @Post()
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Create saved view' })
  @ApiResponse({ status: 201, description: 'View created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async createView(@Body() dto: CreateSavedViewDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    return this.savedViewsService.create(workspaceId, userId, dto)
  }

  @Get(':id')
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Get saved view by ID' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 200, description: 'View retrieved successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async getView(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    return this.savedViewsService.getById(workspaceId, userId, id)
  }

  @Put(':id')
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Update saved view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 200, description: 'View updated successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async updateView(@Param('id') id: string, @Body() dto: UpdateSavedViewDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    return this.savedViewsService.update(workspaceId, userId, id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @Scopes(API_SCOPES.PM_WRITE)
  @ApiOperation({ summary: 'Delete saved view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  @ApiResponse({ status: 204, description: 'View deleted successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async deleteView(@Param('id') id: string, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId
    const userId = request.apiKey.createdById

    await this.savedViewsService.delete(workspaceId, userId, id)
  }
}
