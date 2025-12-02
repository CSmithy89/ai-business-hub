import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Parameters for logging approval creation
 */
export interface LogApprovalCreatedParams {
  workspaceId: string;
  userId: string; // requestedBy
  approvalId: string;
  type: string;
  confidenceScore: number;
  status: string;
  priority: string;
  reviewType: string;
  aiReasoning?: string;
  factors?: any[];
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging approval decisions (approve/reject)
 */
export interface LogApprovalDecisionParams {
  workspaceId: string;
  userId: string; // decidedBy
  approvalId: string;
  action: 'approval.approved' | 'approval.rejected';
  oldStatus: string;
  newStatus: string;
  notes?: string;
  reason?: string;
  confidenceScore: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging auto-approval
 */
export interface LogAutoApprovalParams {
  workspaceId: string;
  approvalId: string;
  type: string;
  confidenceScore: number;
  aiReasoning?: string;
  factors?: any[];
  threshold: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging escalation
 */
export interface LogEscalationParams {
  workspaceId: string;
  approvalId: string;
  oldAssignedToId: string | null;
  newEscalatedToId: string;
  dueAt: Date;
  escalatedAt: Date;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging bulk actions
 */
export interface LogBulkActionParams {
  workspaceId: string;
  userId: string;
  approvalId: string;
  action: 'approval.bulk_approved' | 'approval.bulk_rejected';
  bulkActionId: string; // Correlation ID for batch
  totalItems: number;
  notes?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * ApprovalAuditService - Approval-specific audit logging
 *
 * Story 04-9: Implement Approval Audit Trail
 *
 * Wrapper around Prisma AuditLog for approval-specific logging.
 * Provides structured logging methods for all approval actions:
 * - Creation (with confidence scores)
 * - Decisions (approve/reject with before/after)
 * - Auto-approvals (with AI reasoning)
 * - Escalations (with target changes)
 * - Bulk actions (with batch correlation)
 *
 * All logs include:
 * - Actor (user or "system")
 * - Timestamp
 * - Before/after state (where applicable)
 * - Metadata (AI reasoning, confidence, notes, etc.)
 *
 * Action naming convention: approval.<action>
 */
@Injectable()
export class ApprovalAuditService {
  private readonly logger = new Logger(ApprovalAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log approval creation
   *
   * Called when ApprovalRouterService creates a new approval item.
   *
   * @param params - Creation parameters
   */
  async logApprovalCreated(params: LogApprovalCreatedParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'approval.created',
          entity: 'approval_item',
          entityId: params.approvalId,
          userId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: Prisma.JsonNull,
          newValues: {
            status: params.status,
            confidenceScore: params.confidenceScore,
            type: params.type,
            priority: params.priority,
            reviewType: params.reviewType,
          },
          metadata: {
            aiReasoning: params.aiReasoning,
            factors: params.factors,
            reviewType: params.reviewType,
            description: `Approval created with ${params.confidenceScore}% confidence`,
          },
        },
      });

      this.logger.log({
        message: 'Approval creation logged',
        approvalId: params.approvalId,
        confidenceScore: params.confidenceScore,
        status: params.status,
      });
    } catch (error) {
      // Audit logging failure should not block operations
      this.logger.error('Failed to log approval creation:', error);
    }
  }

  /**
   * Log approval decision (approve or reject)
   *
   * Called when user manually approves or rejects an approval.
   * Captures before/after status and decision notes.
   *
   * @param params - Decision parameters
   */
  async logApprovalDecision(params: LogApprovalDecisionParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: params.action,
          entity: 'approval_item',
          entityId: params.approvalId,
          userId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: {
            status: params.oldStatus,
          },
          newValues: {
            status: params.newStatus,
            decidedAt: new Date(),
          },
          metadata: {
            notes: params.notes,
            reason: params.reason,
            confidenceScore: params.confidenceScore,
            description:
              params.action === 'approval.approved'
                ? 'Approval manually approved'
                : 'Approval manually rejected',
          },
        },
      });

      this.logger.log({
        message: 'Approval decision logged',
        approvalId: params.approvalId,
        action: params.action,
        userId: params.userId,
      });
    } catch (error) {
      this.logger.error('Failed to log approval decision:', error);
    }
  }

  /**
   * Log auto-approval
   *
   * Called when ApprovalRouterService auto-approves a high-confidence item.
   * Uses userId="system" to indicate automated action.
   * Includes AI reasoning and confidence factors in metadata.
   *
   * @param params - Auto-approval parameters
   */
  async logAutoApproval(params: LogAutoApprovalParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'approval.auto_approved',
          entity: 'approval_item',
          entityId: params.approvalId,
          userId: 'system', // Automated action
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: Prisma.JsonNull,
          newValues: {
            status: 'auto_approved',
            confidenceScore: params.confidenceScore,
            autoApprovedAt: new Date(),
          },
          metadata: {
            aiReasoning: params.aiReasoning,
            factors: params.factors,
            threshold: params.threshold,
            type: params.type,
            description: `Auto-approved with ${params.confidenceScore}% confidence (threshold: ${params.threshold}%)`,
          },
        },
      });

      this.logger.log({
        message: 'Auto-approval logged',
        approvalId: params.approvalId,
        confidenceScore: params.confidenceScore,
        threshold: params.threshold,
      });
    } catch (error) {
      this.logger.error('Failed to log auto-approval:', error);
    }
  }

  /**
   * Log approval escalation
   *
   * Called when ApprovalEscalationService escalates an overdue approval.
   * Captures assignment change and escalation timestamp.
   *
   * @param params - Escalation parameters
   */
  async logEscalation(params: LogEscalationParams): Promise<void> {
    try {
      const overdueBy = Math.floor(
        (params.escalatedAt.getTime() - params.dueAt.getTime()) / (1000 * 60)
      ); // minutes

      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: 'approval.escalated',
          entity: 'approval_item',
          entityId: params.approvalId,
          userId: 'system', // Automated escalation
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: {
            assignedToId: params.oldAssignedToId,
          },
          newValues: {
            escalatedToId: params.newEscalatedToId,
            escalatedAt: params.escalatedAt,
          },
          metadata: {
            dueAt: params.dueAt,
            overdueBy: `${overdueBy} minutes`,
            reason: params.reason || 'past_due',
            description: `Escalated ${overdueBy} minutes after due date`,
          },
        },
      });

      this.logger.log({
        message: 'Escalation logged',
        approvalId: params.approvalId,
        escalatedTo: params.newEscalatedToId,
        overdueBy: `${overdueBy} minutes`,
      });
    } catch (error) {
      this.logger.error('Failed to log escalation:', error);
    }
  }

  /**
   * Log bulk action (bulk approve or bulk reject)
   *
   * Called when user performs bulk action on multiple approvals.
   * Uses bulkActionId to correlate all items in the batch.
   *
   * @param params - Bulk action parameters
   */
  async logBulkAction(params: LogBulkActionParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: params.workspaceId,
          action: params.action,
          entity: 'approval_item',
          entityId: params.approvalId,
          userId: params.userId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          oldValues: {
            status: 'pending',
          },
          newValues: {
            status:
              params.action === 'approval.bulk_approved'
                ? 'approved'
                : 'rejected',
            decidedAt: new Date(),
          },
          metadata: {
            bulkActionId: params.bulkActionId,
            totalItems: params.totalItems,
            notes: params.notes,
            reason: params.reason,
            description: `Part of bulk ${params.action === 'approval.bulk_approved' ? 'approval' : 'rejection'} (${params.totalItems} items)`,
          },
        },
      });

      this.logger.log({
        message: 'Bulk action logged',
        approvalId: params.approvalId,
        bulkActionId: params.bulkActionId,
        action: params.action,
      });
    } catch (error) {
      this.logger.error('Failed to log bulk action:', error);
    }
  }

  /**
   * Get audit logs for a specific approval item
   *
   * Returns chronological history of all actions on an approval.
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param approvalId - Approval item ID
   * @param limit - Max number of logs to return (default: 50)
   * @returns Array of audit logs
   */
  async getApprovalAuditLogs(
    workspaceId: string,
    approvalId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const logs = await this.prisma.auditLog.findMany({
        where: {
          workspaceId,
          entity: 'approval_item',
          entityId: approvalId,
        },
        orderBy: {
          createdAt: 'asc', // Chronological order
        },
        take: limit,
      });

      this.logger.log({
        message: 'Retrieved approval audit logs',
        approvalId,
        count: logs.length,
      });

      return logs;
    } catch (error) {
      this.logger.error('Failed to retrieve approval audit logs:', error);
      throw error;
    }
  }
}
