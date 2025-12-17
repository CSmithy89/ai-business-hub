import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { SearchService } from './search.service'
import { SearchQueryDto } from './dto/search-query.dto'

@Controller('kb/search')
@UseGuards(AuthGuard, TenantGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name)

  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentWorkspace('id') workspaceId: string,
    @Query() query: SearchQueryDto,
  ) {
    this.logger.log(`Search request: "${query.q}" (workspace: ${workspaceId})`)

    const { results, total } = await this.searchService.search(
      tenantId,
      workspaceId,
      query,
    )

    return {
      query: query.q,
      results,
      total,
      limit: query.limit || 20,
      offset: query.offset || 0,
    }
  }
}
