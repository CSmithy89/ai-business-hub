import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags, ApiSecurity } from '@nestjs/swagger'
import { Request } from 'express'
import { API_SCOPES } from '@hyvve/shared'
import { TasksService } from '../tasks/tasks.service'
import { SearchQueryDto } from './dto/search-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'
import { ApiKeyGuard } from '@/common/guards/api-key.guard'
import { ScopeGuard } from '@/common/guards/scope.guard'
import { RateLimitGuard } from '@/common/guards/rate-limit.guard'
import { Scopes } from '@/common/decorators/scopes.decorator'
import { ApiAuthenticatedRequest } from '@/common/types/request-user'

@ApiTags('search')
@Controller('api/v1/pm/search')
@UseGuards(ApiKeyGuard, ScopeGuard, RateLimitGuard)
@ApiSecurity('api-key')
export class SearchApiController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @Scopes(API_SCOPES.PM_READ)
  @ApiOperation({ summary: 'Full-text search across tasks' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid API key' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient scope' })
  async search(@Query() query: SearchQueryDto, @Req() request: Request & ApiAuthenticatedRequest) {
    const workspaceId = request.workspaceId

    const { q, limit = 50, offset = 0 } = query

    // Use tasks service list with search parameter
    const serviceQuery = {
      search: q,
      page: Math.floor(offset / limit) + 1,
      limit,
    }

    const result = await this.tasksService.list(workspaceId, serviceQuery)

    // Transform to paginated response
    return new PaginatedResponse(result.data, result.meta.total, limit, offset)
  }
}
