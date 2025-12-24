import { Controller, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TasksService } from '../tasks/tasks.service'
import { SearchQueryDto } from './dto/search-query.dto'
import { PaginatedResponse } from './dto/paginated-response.dto'

@ApiTags('search')
@Controller('api/v1/pm/search')
export class SearchApiController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search across tasks' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(@Query() query: SearchQueryDto) {
    // TODO: Get workspaceId from API key context (PM-11.2)
    const workspaceId = 'placeholder'

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
