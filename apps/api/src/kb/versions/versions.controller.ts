import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CreateVersionDto } from './dto/create-version.dto'
import { ListVersionsQueryDto } from './dto/list-versions.query.dto'
import { VersionsService } from './versions.service'

/**
 * KB Page Versions Controller
 *
 * Handles version history for KB pages:
 * - List all versions for a page
 * - Get specific version content
 * - Create manual version snapshot
 * - Restore page to previous version
 */
@ApiTags('KB Versions')
@Controller('kb/pages/:pageId/versions')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List all versions for a page' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of versions to return (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of versions to skip (default: 0)' })
  @ApiResponse({ status: 200, description: 'List of page versions' })
  async listVersions(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Query() query: ListVersionsQueryDto,
  ) {
    return this.versionsService.listVersions(
      workspaceId,
      workspaceId,
      pageId,
      query.limit,
      query.offset,
    )
  }

  @Post()
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Create a manual version snapshot' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiResponse({ status: 201, description: 'Version created' })
  async createVersion(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() actor: any,
  ) {
    // Get current page content
    const page = await this.versionsService['prisma'].knowledgePage.findFirst({
      where: { id: pageId, tenantId: workspaceId, workspaceId, deletedAt: null },
      select: { content: true },
    })

    if (!page) {
      throw new BadRequestException('Page not found')
    }

    return this.versionsService.createVersion(
      workspaceId,
      workspaceId,
      pageId,
      actor.id,
      page.content,
      dto.changeNote,
    )
  }

  @Get(':version')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get a specific version by version number' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({ status: 200, description: 'Version details' })
  async getVersion(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('version', ParseIntPipe) version: number,
  ) {
    return this.versionsService.getVersion(workspaceId, workspaceId, pageId, version)
  }

  @Post(':version/restore')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Restore page to a specific version' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiParam({ name: 'version', description: 'Version number to restore' })
  @ApiResponse({ status: 200, description: 'Page restored to version' })
  async restoreVersion(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() actor: any,
  ) {
    return this.versionsService.restoreVersion(
      workspaceId,
      workspaceId,
      pageId,
      version,
      actor.id,
    )
  }
}
