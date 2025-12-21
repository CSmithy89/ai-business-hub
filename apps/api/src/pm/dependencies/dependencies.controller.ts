import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { DependenciesQueryDto } from './dto/dependencies-query.dto'
import { DependenciesService } from './dependencies.service'

@ApiTags('PM Dependencies')
@Controller('pm/dependencies')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class DependenciesController {
  constructor(private readonly dependenciesService: DependenciesService) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'List task dependencies across projects' })
  async listDependencies(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: DependenciesQueryDto,
  ) {
    return this.dependenciesService.list(workspaceId, query)
  }
}
