import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { KbAiService } from './ai.service'
import { KbAskDto } from './dto/kb-ask.dto'

@ApiTags('KB AI')
@Controller('kb')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class KbAskController {
  constructor(private readonly kbAiService: KbAiService) {}

  @Post('ask')
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Answer a KB question using RAG context' })
  @ApiResponse({ status: 200, description: 'Answer generated' })
  async askQuestion(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Body() body: KbAskDto,
  ) {
    const tenantId = user.tenantId
    const result = await this.kbAiService.askQuestion(tenantId, workspaceId, body)

    return {
      ...result,
      status: HttpStatus.OK,
    }
  }
}
