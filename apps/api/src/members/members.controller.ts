import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Req,
} from '@nestjs/common'
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
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { CurrentWorkspace } from '../common/decorators/current-workspace.decorator'
import { MembersService } from './members.service'
import { UpdateModulePermissionsDto } from './dto/update-module-permissions.dto'
import {
  validateCompleteOverrides,
  validatePermissionValues,
} from '@hyvve/shared'
import { AuditService } from '../audit/audit.service'
import { Request } from 'express'

/**
 * Controller for workspace member management
 *
 * Endpoints:
 * - GET /workspaces/:workspaceId/members - List all members
 * - GET /workspaces/:workspaceId/members/:memberId - Get member details
 * - PATCH /workspaces/:workspaceId/members/:memberId/module-permissions - Update module permissions
 */
@ApiTags('Members')
@Controller('workspaces/:workspaceId/members')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class MembersController {
  private readonly logger = new Logger(MembersController.name)

  constructor(
    private readonly membersService: MembersService,
    private readonly auditService: AuditService
  ) {}

  /**
   * List all members in a workspace
   */
  @Get()
  @ApiOperation({ summary: 'List all workspace members' })
  @ApiResponse({ status: 200, description: 'Members list retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a workspace member' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  async listMembers(
    @CurrentWorkspace() workspaceId: string,
    @Query('q') query?: string,
  ) {
    return this.membersService.listMembers(workspaceId, query)
  }

  /**
   * Get member details
   */
  @Get(':memberId')
  @ApiOperation({ summary: 'Get member details' })
  @ApiResponse({ status: 200, description: 'Member details retrieved' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async getMember(
    @CurrentWorkspace() workspaceId: string,
    @Param('memberId') memberId: string
  ) {
    return this.membersService.getMember(workspaceId, memberId)
  }

  /**
   * Update member module permissions
   *
   * Allows workspace admins/owners to grant module-level permission overrides.
   * Supports two patterns:
   * 1. Role elevation: { "bm-crm": { "role": "admin" } }
   * 2. Specific permissions: { "bmc": { "permissions": ["records:view"] } }
   */
  @Patch(':memberId/module-permissions')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update member module permissions' })
  @ApiResponse({ status: 200, description: 'Module permissions updated' })
  @ApiResponse({ status: 400, description: 'Invalid module permissions structure' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  async updateModulePermissions(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateModulePermissionsDto,
    @CurrentWorkspace() workspaceId: string,
    @CurrentUser() actor: any,
    @Req() req: Request
  ) {
    // Validate module permissions structure
    if (dto.modulePermissions) {
      // Use comprehensive validation
      const validationResult = validateCompleteOverrides(dto.modulePermissions)

      if (!validationResult.valid) {
        this.logger.warn(
          `Invalid module permissions structure: ${validationResult.errors?.join(', ')}`
        )
        throw new BadRequestException(
          validationResult.errors?.[0] || 'Invalid module permissions structure'
        )
      }

      // Additional validation: check permission values in specific permissions
      for (const [moduleId, override] of Object.entries(dto.modulePermissions)) {
        if (override.permissions) {
          if (!validatePermissionValues(override.permissions)) {
            throw new BadRequestException(
              `Invalid permission values in module ${moduleId}`
            )
          }
        }
      }
    }

    // Update member permissions
    const result = await this.membersService.updateModulePermissions(
      workspaceId,
      memberId,
      dto
    )

    // Log the permission change using AuditService
    // Validate user exists before accessing (Prisma includes user in query)
    const memberWithUser = result.member as typeof result.member & {
      user?: { id: string; email: string; name: string | null; image: string | null }
    }
    if (!memberWithUser.user) {
      throw new InternalServerErrorException('Failed to fetch user details for audit log')
    }
    await this.auditService.logPermissionOverrideChange({
      workspaceId,
      actorId: actor.id,
      targetMemberId: memberId,
      targetMemberEmail: memberWithUser.user.email,
      targetMemberRole: memberWithUser.role,
      oldPermissions: result.previousPermissions,
      newPermissions: memberWithUser.modulePermissions,
      ipAddress: req.ip,
      userAgent: Array.isArray(req.headers['user-agent'])
        ? req.headers['user-agent'].join(', ')
        : req.headers['user-agent'],
    })

    return result.member
  }
}
