import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { GapAnalysisQueryDto } from './dto/gap-analysis.query.dto'
import { GapAnalysisService } from './analysis.service'

@ApiTags('KB Analysis')
@Controller('kb/analysis')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class GapAnalysisController {
  constructor(private readonly analysisService: GapAnalysisService) {}

  @Get('gaps')
  @Roles('admin')
  @ApiOperation({
    summary: 'Run KB gap analysis (Admin only)',
    description:
      'Identifies missing topics, frequently asked questions without pages, and outdated content.',
  })
  @ApiResponse({ status: 200, description: 'Gap analysis results' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async getGapAnalysis(
    @CurrentUser() actor: { workspaceId: string },
    @Query() query: GapAnalysisQueryDto,
  ) {
    return this.analysisService.getGapAnalysis(actor.workspaceId, query)
  }
}
