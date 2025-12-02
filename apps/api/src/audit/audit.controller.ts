import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger'
import { AuthGuard } from '../common/guards/auth.guard'
import { TenantGuard } from '../common/guards/tenant.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator'
import { AuditService } from './audit.service'
import { GetAuditLogsDto } from './dto/get-audit-logs.dto'

/**
 * Controller for audit log management
 *
 * Provides read-only access to audit logs for workspace admins and owners.
 * Audit logs track all permission-related changes in the workspace.
 */
@ApiTags('Audit')
@Controller('workspaces/:workspaceId/audit-logs')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs with filtering and pagination
   *
   * Returns audit logs for the current workspace. Only accessible by
   * workspace admins and owners for security reasons.
   */
  @Get()
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              workspaceId: { type: 'string' },
              action: { type: 'string' },
              entity: { type: 'string' },
              entityId: { type: 'string', nullable: true },
              userId: { type: 'string', nullable: true },
              ipAddress: { type: 'string', nullable: true },
              userAgent: { type: 'string', nullable: true },
              oldValues: { type: 'object', nullable: true },
              newValues: { type: 'object', nullable: true },
              metadata: { type: 'object', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
        limit: { type: 'number' },
        offset: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getAuditLogs(
    @CurrentWorkspace() workspaceId: string,
    @Query() query: GetAuditLogsDto
  ) {
    return this.auditService.getAuditLogs({
      workspaceId,
      limit: query.limit,
      offset: query.offset,
      action: query.action,
      userId: query.userId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    })
  }

  /**
   * Get available action types
   *
   * Returns a list of all possible audit log action types
   * for use in filtering.
   */
  @Get('action-types')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Get available audit log action types' })
  @ApiResponse({
    status: 200,
    description: 'Action types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        actionTypes: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'role_changed',
            'member_added',
            'member_removed',
            'module_permissions_updated',
          ],
        },
      },
    },
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async getActionTypes() {
    return {
      actionTypes: this.auditService.getActionTypes(),
    }
  }
}
