import { Body, Controller, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { RagQueryDto } from './dto/rag-query.dto'
import { RagService } from './rag.service'

@Controller('kb/rag')
@UseGuards(AuthGuard, TenantGuard)
export class RagController {
  private readonly logger = new Logger(RagController.name)

  constructor(private readonly ragService: RagService) {}

  @Post('query')
  async query(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Body() body: RagQueryDto,
  ) {
    const tenantId = user.tenantId

    this.logger.log(`RAG query request (workspace: ${workspaceId})`)

    const result = await this.ragService.query(tenantId, workspaceId, body)

    return {
      query: body.q,
      ...result,
      status: HttpStatus.OK,
    }
  }
}

