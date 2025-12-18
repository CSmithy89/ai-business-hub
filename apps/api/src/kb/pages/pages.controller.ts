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
import { CreatePageDto } from './dto/create-page.dto'
import { ListPagesQueryDto } from './dto/list-pages.query.dto'
import { UpdatePageDto } from './dto/update-page.dto'
import { PagesService } from './pages.service'
import { KB_ERROR } from '../kb.errors'

/**
 * KB Pages Controller
 *
 * IMPORTANT: This controller currently assumes a 1:1 relationship between tenantId and workspaceId.
 * This is acceptable for MVP where each tenant has exactly one workspace, but will need to be
 * refactored when multi-workspace support is added. At that point, workspaceId should be derived
 * from user context or request parameters rather than directly using tenantId.
 */
@ApiTags('KB Pages')
@Controller('kb/pages')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a KB page' })
  @ApiResponse({ status: 201, description: 'Page created' })
  async createPage(
    @CurrentWorkspace() workspaceId: string,
    @Body() dto: CreatePageDto,
    @CurrentUser() actor: any,
  ) {
    if (dto.workspaceId && dto.workspaceId !== workspaceId) {
      throw new BadRequestException(KB_ERROR.WORKSPACE_ID_MISMATCH)
    }
    return this.pagesService.create(workspaceId, workspaceId, actor.id, dto)
  }

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List KB pages (tree or flat)' })
  async listPages(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: ListPagesQueryDto,
  ) {
    return this.pagesService.list(workspaceId, workspaceId, query)
  }

  // Note: These routes must be defined before :id to prevent "me" from matching as an ID
  @Get('me/recent')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get recently viewed pages' })
  async getRecentPages(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10
    // Handle NaN or invalid values by defaulting to 10
    const limitNum = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 10 : parsedLimit
    return this.pagesService.getRecentPages(workspaceId, workspaceId, actor.id, limitNum)
  }

  @Get('me/favorites')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get favorited pages' })
  async getFavorites(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.getFavorites(workspaceId, workspaceId, actor.id)
  }

  @Get(':id/related')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get related pages suggestions' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async getRelatedPages(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 8
    const limitNum = Number.isNaN(parsedLimit) || parsedLimit <= 0 ? 8 : parsedLimit
    return this.pagesService.getRelatedPages(workspaceId, workspaceId, id, limitNum)
  }

  @Get(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a page by ID' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async getPage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.findOne(workspaceId, workspaceId, id, actor.id)
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a page' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async updatePage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() actor: any,
  ) {
    const result = await this.pagesService.update(workspaceId, workspaceId, actor.id, id, dto)

    // Extract mentions if requested
    if (dto.processMentions && dto.content) {
      await this.pagesService
        .extractAndStoreMentions(id, dto.content, workspaceId, workspaceId, actor.id)
        .catch((error) => {
          // Log but don't fail the update if mention processing fails
          console.error('Failed to process mentions:', error)
        })
    }

    return result
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Soft delete a page' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async deletePage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.remove(workspaceId, workspaceId, actor.id, id)
  }

  @Post(':id/restore')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Restore a soft-deleted page' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async restorePage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.restore(workspaceId, workspaceId, actor.id, id)
  }

  @Post(':id/favorite')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Add page to favorites' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async favoritePage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.toggleFavorite(workspaceId, workspaceId, actor.id, id, true)
  }

  @Delete(':id/favorite')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Remove page from favorites' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  async unfavoritePage(
    @CurrentWorkspace() workspaceId: string,
    @Param('id') id: string,
    @CurrentUser() actor: any,
  ) {
    return this.pagesService.toggleFavorite(workspaceId, workspaceId, actor.id, id, false)
  }
}
