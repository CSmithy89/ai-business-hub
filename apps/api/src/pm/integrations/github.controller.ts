import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { GithubIssuesService } from './github-issues.service'
import { GithubIssuesSyncDto } from './dto/github-issues-sync.dto'

@ApiTags('PM Integrations')
@Controller('pm/integrations/github')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class GithubIntegrationsController {
  constructor(private readonly githubIssuesService: GithubIssuesService) {}

  @Post('issues/sync')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Sync GitHub issues to tasks' })
  @ApiResponse({ status: 200, description: 'Issues synced' })
  async syncIssues(
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
    @Body() dto: GithubIssuesSyncDto,
  ) {
    return this.githubIssuesService.syncIssues(workspaceId, actor.id, dto)
  }
}
