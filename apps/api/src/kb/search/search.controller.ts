import { Body, Controller, Get, Post, Query, UseGuards, Logger, HttpException, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { SearchService } from './search.service'
import { SearchQueryDto } from './dto/search-query.dto'
import { SemanticSearchDto } from './dto/semantic-search.dto'

type SearchRateLimitBucket = {
  count: number
  resetAt: number
}

@Controller('kb/search')
@UseGuards(AuthGuard, TenantGuard)
export class SearchController {
  private readonly logger = new Logger(SearchController.name)
  private readonly rateLimitBuckets = new Map<string, SearchRateLimitBucket>()

  private readonly rateLimitWindowMs = 60_000
  private readonly maxRequestsPerWindow = 30

  constructor(private readonly searchService: SearchService) {}

  private enforceRateLimit(key: string): void {
    const now = Date.now()
    const existing = this.rateLimitBuckets.get(key)

    if (!existing || existing.resetAt <= now) {
      this.rateLimitBuckets.set(key, { count: 1, resetAt: now + this.rateLimitWindowMs })
      return
    }

    if (existing.count >= this.maxRequestsPerWindow) {
      throw new HttpException(
        'Search rate limit exceeded. Please try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    existing.count += 1

    if (this.rateLimitBuckets.size > 10_000) {
      for (const [bucketKey, bucket] of this.rateLimitBuckets.entries()) {
        if (bucket.resetAt <= now) this.rateLimitBuckets.delete(bucketKey)
      }
    }
  }

  @Get()
  async search(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Query() query: SearchQueryDto,
  ) {
    const tenantId = user.tenantId
    this.enforceRateLimit(`${user.id}:${workspaceId}`)
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

  @Post('semantic')
  async semanticSearch(
    @CurrentUser() user: { tenantId: string; id: string },
    @CurrentWorkspace() workspaceId: string,
    @Body() body: SemanticSearchDto,
  ) {
    const tenantId = user.tenantId
    this.enforceRateLimit(`${user.id}:${workspaceId}`)
    this.logger.log(`Semantic search request: "${body.q}" (workspace: ${workspaceId})`)

    const { results, total } = await this.searchService.semanticSearch(
      tenantId,
      workspaceId,
      body,
    )

    return {
      query: body.q,
      results,
      total,
      limit: body.limit || 10,
      offset: body.offset || 0,
    }
  }
}
