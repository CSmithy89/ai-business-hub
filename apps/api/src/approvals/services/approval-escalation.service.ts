import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { EventPublisherService } from '../../events';
import { ApprovalAuditService } from './approval-audit.service';
import { EventTypes, ApprovalEscalatedPayload } from '@hyvve/shared';

/**
 * ApprovalEscalationService - Handles escalation of overdue approvals
 *
 * Story 04-8: Implement Approval Escalation
 *
 * Responsibilities:
 * - Find approvals that are past their due date
 * - Determine escalation target (configured user or fallback to admin/owner)
 * - Update approval with escalation info
 * - Emit escalation event
 * - Notify escalation target (stub for now)
 *
 * Escalation Logic:
 * - Only escalate approvals with status = 'pending'
 * - Only escalate once (escalatedAt must be null)
 * - Escalation target priority:
 *   1. WorkspaceSettings.escalationTargetUserId (if set)
 *   2. First workspace member with role = 'owner'
 *   3. First workspace member with role = 'admin'
 *   4. Throw error if no valid target
 */
@Injectable()
export class ApprovalEscalationService {
  private readonly logger = new Logger(ApprovalEscalationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly auditLogger: ApprovalAuditService,
  ) {}

  /**
   * Find all overdue approvals for a workspace
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @returns Array of overdue approval items
   */
  async checkOverdueApprovals(workspaceId: string): Promise<any[]> {
    const now = new Date();

    const overdueApprovals = await this.prisma.approvalItem.findMany({
      where: {
        workspaceId,
        status: 'pending',
        dueAt: {
          lt: now, // Past due date
        },
        escalatedAt: null, // Not already escalated
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log({
      message: 'Checked for overdue approvals',
      workspaceId,
      overdueCount: overdueApprovals.length,
    });

    return overdueApprovals;
  }

  /**
   * Escalate a single approval item
   *
   * @param approvalId - Approval item ID
   * @returns Updated approval item
   */
  async escalateApproval(approvalId: string): Promise<any> {
    // Get approval with workspace info
    const approval = await this.prisma.approvalItem.findUnique({
      where: { id: approvalId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: true,
      },
    });

    if (!approval) {
      throw new NotFoundException(`Approval ${approvalId} not found`);
    }

    // Check if already escalated
    if (approval.escalatedAt) {
      this.logger.warn({
        message: 'Approval already escalated',
        approvalId,
        escalatedAt: approval.escalatedAt,
      });
      return approval;
    }

    // Check if already resolved
    if (approval.status !== 'pending') {
      this.logger.warn({
        message: 'Approval already resolved, skipping escalation',
        approvalId,
        status: approval.status,
      });
      return approval;
    }

    // Get escalation target
    const escalationTarget = await this.getEscalationTarget(
      approval.workspaceId,
    );

    // Update approval with escalation info
    const updatedApproval = await this.prisma.approvalItem.update({
      where: { id: approvalId },
      data: {
        escalatedAt: new Date(),
        escalatedToId: escalationTarget.id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit escalation event
    const escalationPayload: ApprovalEscalatedPayload = {
      approvalId: updatedApproval.id,
      type: updatedApproval.type,
      title: updatedApproval.title,
      escalatedFromId: updatedApproval.assignedToId || undefined,
      escalatedToId: escalationTarget.id,
      reason: 'Approval overdue',
      originalDueAt: updatedApproval.dueAt.toISOString(),
      newDueAt: updatedApproval.dueAt.toISOString(), // Same due date, just escalated
    };
    await this.eventPublisher.publish(
      EventTypes.APPROVAL_ESCALATED,
      escalationPayload,
      {
        tenantId: updatedApproval.workspaceId,
        userId: 'system',
        source: 'approval-escalation',
      },
    );

    // Log escalation to audit trail
    await this.auditLogger.logEscalation({
      workspaceId: updatedApproval.workspaceId,
      approvalId: updatedApproval.id,
      oldAssignedToId: updatedApproval.assignedToId,
      newEscalatedToId: escalationTarget.id,
      dueAt: updatedApproval.dueAt,
      escalatedAt: updatedApproval.escalatedAt!,
      reason: 'Approval overdue',
    });

    // Notify escalation target (stub)
    await this.notifyEscalationTarget(updatedApproval, escalationTarget);

    this.logger.log({
      message: 'Approval escalated',
      approvalId: updatedApproval.id,
      escalatedFrom: updatedApproval.assignedToId,
      escalatedTo: escalationTarget.id,
    });

    return updatedApproval;
  }

  /**
   * Get escalation target user for a workspace
   *
   * Priority:
   * 1. WorkspaceSettings.escalationTargetUserId (if set)
   * 2. First workspace member with role = 'owner'
   * 3. First workspace member with role = 'admin'
   * 4. Throw error if no valid target
   *
   * @param workspaceId - Workspace ID
   * @returns User to escalate to
   */
  async getEscalationTarget(workspaceId: string): Promise<any> {
    // Check workspace settings for configured escalation target
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (settings?.escalationTargetUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: settings.escalationTargetUserId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (targetUser) {
        this.logger.debug({
          message: 'Using configured escalation target',
          workspaceId,
          userId: targetUser.id,
        });
        return targetUser;
      }

      this.logger.warn({
        message: 'Configured escalation target not found, falling back',
        workspaceId,
        configuredUserId: settings.escalationTargetUserId,
      });
    }

    // Fallback: Find first owner
    const owner = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: 'owner',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (owner) {
      this.logger.debug({
        message: 'Using workspace owner as escalation target',
        workspaceId,
        userId: owner.user.id,
      });
      return owner.user;
    }

    // Fallback: Find first admin
    const admin = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: 'admin',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (admin) {
      this.logger.debug({
        message: 'Using workspace admin as escalation target',
        workspaceId,
        userId: admin.user.id,
      });
      return admin.user;
    }

    // No valid escalation target found
    throw new BadRequestException(
      `No valid escalation target found for workspace ${workspaceId}`,
    );
  }

  /**
   * Notify escalation target
   *
   * Story 04-8: Stub implementation - logs notification only
   * Future: Epic 05 - Real email/in-app notifications
   *
   * @param approval - Approval item
   * @param targetUser - User to notify
   */
  async notifyEscalationTarget(approval: any, targetUser: any): Promise<void> {
    // STUB: Log notification instead of sending actual email
    this.logger.log({
      message: '[STUB] Escalation notification',
      notificationType: 'email',
      recipientId: targetUser.id,
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      approvalId: approval.id,
      approvalTitle: approval.title,
      approvalType: approval.type,
      dueAt: approval.dueAt,
      escalatedAt: approval.escalatedAt,
      subject: `Action Required: Escalated Approval - ${approval.title}`,
      body: `An approval has been escalated to you:\n\nTitle: ${approval.title}\nType: ${approval.type}\nDue Date: ${approval.dueAt}\nEscalated At: ${approval.escalatedAt}\n\nPlease review and approve/reject.`,
    });

    // TODO Epic 05: Implement actual notification
    // - Send email via email service
    // - Create in-app notification
    // - Optionally send SMS for urgent items
  }

  /**
   * Process all workspaces for escalation
   *
   * Called by EscalationProcessor job
   *
   * @returns Summary of escalations processed
   */
  async processAllWorkspaces(): Promise<{
    workspacesChecked: number;
    approvalsEscalated: number;
    errors: any[];
  }> {
    const summary = {
      workspacesChecked: 0,
      approvalsEscalated: 0,
      errors: [] as any[],
    };

    // Get all workspaces with escalation enabled
    const workspaces = await this.prisma.workspaceSettings.findMany({
      where: {
        enableEscalation: true,
      },
      include: {
        workspace: true,
      },
    });

    this.logger.log({
      message: 'Starting escalation check for all workspaces',
      totalWorkspaces: workspaces.length,
    });

    // Process each workspace
    for (const settings of workspaces) {
      try {
        summary.workspacesChecked++;

        const overdueApprovals = await this.checkOverdueApprovals(
          settings.workspaceId,
        );

        for (const approval of overdueApprovals) {
          try {
            await this.escalateApproval(approval.id);
            summary.approvalsEscalated++;
          } catch (error) {
            this.logger.error({
              message: 'Failed to escalate approval',
              approvalId: approval.id,
              error: error instanceof Error ? error.message : String(error),
            });
            summary.errors.push({
              approvalId: approval.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      } catch (error) {
        this.logger.error({
          message: 'Failed to process workspace escalations',
          workspaceId: settings.workspaceId,
          error: error instanceof Error ? error.message : String(error),
        });
        summary.errors.push({
          workspaceId: settings.workspaceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.logger.log({
      message: 'Completed escalation check for all workspaces',
      summary,
    });

    return summary;
  }
}
