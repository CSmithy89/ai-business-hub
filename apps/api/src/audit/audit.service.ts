import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../common/services/prisma.service'

export interface AuditLogParams {
  workspaceId: string
  actorId: string
  ipAddress?: string
  userAgent?: string
}

export interface RoleChangeParams extends AuditLogParams {
  targetMemberId: string
  oldRole: string
  newRole: string
}

export interface MemberAddedParams extends AuditLogParams {
  newMemberId: string
  role: string
  invitationId?: string
}

export interface MemberRemovedParams extends AuditLogParams {
  removedMemberId: string
  removedMemberEmail: string
  removedMemberRole: string
}

export interface PermissionOverrideChangeParams extends AuditLogParams {
  targetMemberId: string
  targetMemberEmail: string
  targetMemberRole: string
  oldPermissions: any
  newPermissions: any
}

export interface GetAuditLogsParams {
  workspaceId: string
  limit?: number
  offset?: number
  action?: string
  userId?: string
  startDate?: Date
  endDate?: Date
}

/**
 * AuditService - Centralized audit logging for permission changes
 *
 * Tracks all permission-related changes in the system including:
 * - Role changes (member → admin, etc.)
 * - Member additions/removals
 * - Module permission override changes
 *
 * All audit logs include:
 * - Actor (who made the change)
 * - Target (who/what was affected)
 * - Before/after values
 * - Timestamp
 * - Optional IP address and user agent
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a role change (e.g., member → admin)
   */
  async logRoleChange(params: RoleChangeParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'role_changed',
          entity: 'workspace_member',
          entityId: params.targetMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: { role: params.oldRole },
          newValues: { role: params.newRole },
          metadata: {
            changeType: 'role',
            description: `Role changed from ${params.oldRole} to ${params.newRole}`,
          },
        },
      })

      this.logger.log(
        `Role change logged: Member ${params.targetMemberId} changed from ${params.oldRole} to ${params.newRole} by ${params.actorId}`
      )
    } catch (error) {
      // Audit logging failure should not block operations but should be logged
      this.logger.error('Failed to create role change audit log:', error)
    }
  }

  /**
   * Log a new member being added to the workspace
   */
  async logMemberAdded(params: MemberAddedParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'member_added',
          entity: 'workspace_member',
          entityId: params.newMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: null,
          newValues: { role: params.role },
          metadata: {
            changeType: 'member_added',
            invitationId: params.invitationId,
            description: `New member added with role ${params.role}`,
          },
        },
      })

      this.logger.log(
        `Member addition logged: Member ${params.newMemberId} added with role ${params.role} by ${params.actorId}`
      )
    } catch (error) {
      this.logger.error('Failed to create member addition audit log:', error)
    }
  }

  /**
   * Log a member being removed from the workspace
   */
  async logMemberRemoved(params: MemberRemovedParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'member_removed',
          entity: 'workspace_member',
          entityId: params.removedMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: {
            email: params.removedMemberEmail,
            role: params.removedMemberRole,
          },
          newValues: null,
          metadata: {
            changeType: 'member_removed',
            description: `Member ${params.removedMemberEmail} (${params.removedMemberRole}) removed`,
          },
        },
      })

      this.logger.log(
        `Member removal logged: Member ${params.removedMemberId} removed by ${params.actorId}`
      )
    } catch (error) {
      this.logger.error('Failed to create member removal audit log:', error)
    }
  }

  /**
   * Log module permission override changes
   */
  async logPermissionOverrideChange(
    params: PermissionOverrideChangeParams
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'module_permissions_updated',
          entity: 'workspace_member',
          entityId: params.targetMemberId,
          userId: params.actorId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: { modulePermissions: params.oldPermissions },
          newValues: { modulePermissions: params.newPermissions },
          metadata: {
            changeType: 'module_permissions',
            memberEmail: params.targetMemberEmail,
            memberRole: params.targetMemberRole,
            description: 'Module permission overrides updated',
          },
        },
      })

      this.logger.log(
        `Permission override change logged: Member ${params.targetMemberId} permissions updated by ${params.actorId}`
      )
    } catch (error) {
      this.logger.error('Failed to create permission override audit log:', error)
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(params: GetAuditLogsParams) {
    const {
      workspaceId,
      limit = 50,
      offset = 0,
      action,
      userId,
      startDate,
      endDate,
    } = params

    const where: any = {
      workspaceId,
    }

    if (action) {
      where.action = action
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      limit,
      offset,
    }
  }

  /**
   * Get available action types for filtering
   */
  getActionTypes(): string[] {
    return [
      'role_changed',
      'member_added',
      'member_removed',
      'module_permissions_updated',
      'member_invited',
    ]
  }
}
