import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { LinkingService } from './linking.service'
import { LinkProjectDto, UpdateLinkDto } from './dto/link-project.dto'

@ApiTags('KB Page Linking')
@Controller('kb/pages')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class LinkingController {
  constructor(private readonly linkingService: LinkingService) {}

  @Post(':pageId/projects')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Link a page to a project' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  async linkToProject(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Body() dto: LinkProjectDto,
    @CurrentUser() actor: any,
  ) {
    return this.linkingService.linkPageToProject(
      workspaceId,
      workspaceId,
      pageId,
      actor.id,
      dto,
    )
  }

  @Delete(':pageId/projects/:projectId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Unlink a page from a project' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async unlinkFromProject(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() actor: any,
  ) {
    return this.linkingService.unlinkPageFromProject(
      workspaceId,
      workspaceId,
      pageId,
      projectId,
      actor.id,
    )
  }

  @Patch(':pageId/projects/:projectId')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Update a page-project link (e.g., set primary)' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  async updateLink(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateLinkDto,
    @CurrentUser() actor: any,
  ) {
    return this.linkingService.updateLink(
      workspaceId,
      workspaceId,
      pageId,
      projectId,
      actor.id,
      dto,
    )
  }

  @Get(':pageId/projects')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get all projects linked to a page' })
  @ApiParam({ name: 'pageId', description: 'Page ID' })
  async getLinkedProjects(
    @CurrentWorkspace() workspaceId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.linkingService.getLinkedProjects(
      workspaceId,
      workspaceId,
      pageId,
    )
  }
}
