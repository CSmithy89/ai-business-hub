import { Controller, Get, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { VerificationService } from './verification.service'

/**
 * Controller for stale page detection and management
 * Provides endpoints to query pages needing review
 */
@ApiTags('KB Verification')
@Controller('kb/verification/stale')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class StaleController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all stale pages needing review',
    description:
      'Returns pages that meet stale criteria: expired verification, not updated in 90+ days, or low view count. Each page is annotated with reasons for staleness.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of stale pages with reasons array',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          slug: { type: 'string' },
          updatedAt: { type: 'string', format: 'date-time' },
          viewCount: { type: 'number' },
          isVerified: { type: 'boolean' },
          verifyExpires: { type: 'string', format: 'date-time', nullable: true },
          ownerId: { type: 'string' },
          reasons: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'Expired verification',
              'Not updated in 90+ days',
              'Low view count',
            ],
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async getStalPages(@CurrentUser() actor: any) {
    return this.verificationService.getStalPages(actor.workspaceId)
  }
}
