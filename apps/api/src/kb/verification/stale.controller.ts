import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { AuthGuard } from '../../common/guards/auth.guard'
import { TenantGuard } from '../../common/guards/tenant.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { VerificationService } from './verification.service'
import { BulkVerifyDto } from './dto/bulk-verify.dto'
import { BulkDeleteDto } from './dto/bulk-delete.dto'

/**
 * Controller for stale page detection and management
 * Provides endpoints to query pages needing review
 */
@ApiTags('KB Verification')
@Controller('kb/verification')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class StaleController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('stale')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get all stale pages needing review (Admin only)',
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
          owner: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              avatarUrl: { type: 'string', nullable: true },
            },
          },
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
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async getStalPages(@CurrentUser() actor: any) {
    return this.verificationService.getStalPages(actor.workspaceId)
  }

  @Post('bulk-verify')
  @Roles('admin')
  @ApiOperation({
    summary: 'Bulk verify multiple pages (Admin only)',
    description:
      'Verifies multiple pages at once with the same expiration period. Uses Promise.allSettled to handle partial failures gracefully.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk verification results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of pages successfully verified' },
        failed: { type: 'number', description: 'Number of pages that failed to verify' },
        results: {
          type: 'array',
          description: 'Detailed results for each page',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input (e.g., too many pages)' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async bulkVerify(
    @Body() dto: BulkVerifyDto,
    @CurrentUser() actor: any,
  ) {
    return this.verificationService.bulkVerify(
      dto.pageIds,
      actor.userId,
      dto.expiresIn,
    )
  }

  @Post('bulk-delete')
  @Roles('admin')
  @ApiOperation({
    summary: 'Bulk delete multiple pages (Admin only)',
    description:
      'Soft-deletes multiple pages at once. Uses Promise.allSettled to handle partial failures gracefully.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk deletion results',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number', description: 'Number of pages successfully deleted' },
        failed: { type: 'number', description: 'Number of pages that failed to delete' },
        results: {
          type: 'array',
          description: 'Detailed results for each page',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input (e.g., too many pages)' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async bulkDelete(
    @Body() dto: BulkDeleteDto,
    @CurrentUser() actor: any,
  ) {
    return this.verificationService.bulkDelete(
      dto.pageIds,
      actor.tenantId,
      actor.workspaceId,
      actor.userId,
    )
  }
}
