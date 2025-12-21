import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { KbAiService } from './ai.service'
import { KbDraftDto } from './dto/kb-draft.dto'
import { KbSummaryDto } from './dto/kb-summary.dto'

@ApiTags('KB AI')
@Controller('kb/ai')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class KbAiController {
  constructor(private readonly kbAiService: KbAiService) {}

  @Post('draft')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Generate an AI draft for a KB page' })
  @ApiResponse({ status: 200, description: 'Draft generated' })
  async createDraft(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Body() body: KbDraftDto,
  ) {
    const tenantId = user.tenantId
    const draft = await this.kbAiService.generateDraft(tenantId, workspaceId, body)

    return {
      draft,
      status: HttpStatus.OK,
    }
  }

  @Post('summary')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Summarize a KB page' })
  @ApiResponse({ status: 200, description: 'Summary generated' })
  async summarizePage(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Body() body: KbSummaryDto,
  ) {
    const tenantId = user.tenantId
    const summary = await this.kbAiService.summarizePage(tenantId, workspaceId, body.pageId)

    return {
      summary,
      status: HttpStatus.OK,
    }
  }
}
