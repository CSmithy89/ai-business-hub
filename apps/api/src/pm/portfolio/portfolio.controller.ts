import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../../common/decorators/current-workspace.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { PortfolioQueryDto } from './dto/portfolio-query.dto'
import { PortfolioService } from './portfolio.service'

@ApiTags('PM Portfolio')
@Controller('pm/portfolio')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Roles('owner', 'admin', 'member')
  @ApiOperation({ summary: 'Get portfolio dashboard data' })
  async getPortfolio(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: PortfolioQueryDto,
  ) {
    return this.portfolioService.getPortfolio(workspaceId, query)
  }
}
