import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { EventPublisherService } from '../events';
import { ApprovalAuditService } from './services/approval-audit.service';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { ApproveItemDto } from './dto/approve-item.dto';
import { RejectItemDto } from './dto/reject-item.dto';
import { BulkApprovalDto } from './dto/bulk-approval.dto';
import { CancelApprovalDto } from './dto/cancel-approval.dto';
import { PaginatedResponse, BulkActionResult } from './dto/approval-response.dto';
import { UpdateEscalationConfigDto } from './dto/escalation-config.dto';
import {
  EventTypes,
  ApprovalDecisionPayload,
  ApprovalCancelledPayload,
} from '@hyvve/shared';

/**
 * ApprovalsService - Business logic for approval queue management
 *
 * Handles CRUD operations and approval lifecycle management:
 * - List approvals with filtering, sorting, and pagination
 * - Get single approval with full details
 * - Approve/reject approval items
 * - Bulk approve/reject operations
 *
 * Features:
 * - Multi-tenant isolation (all queries filter by workspaceId)
 * - Event emission for approval actions (stub - Epic 05)
 * - Audit logging for all decisions (Story 04-9)
 * - Partial failure handling for bulk operations
 */
@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventPublisher: EventPublisherService,
    private readonly auditLogger: ApprovalAuditService,
  ) {}

  /**
   * List approvals with filtering, sorting, and pagination
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param query - Query parameters (filters, sorting, pagination)
   * @returns Paginated list of approval items
   */
  async findAll(
    workspaceId: string,
    query: ApprovalQueryDto,
  ): Promise<PaginatedResponse<any>> {
    const {
      status,
      type,
      priority,
      assigneeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // Build where clause with tenant isolation
    const where: any = {
      workspaceId, // CRITICAL: Always filter by workspace
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assignedToId = assigneeId;
    }

    // Build order clause
    const orderBy: any = {};
    if (sortBy === 'confidenceScore') {
      orderBy.confidenceScore = sortOrder;
    } else if (sortBy === 'dueAt') {
      orderBy.dueAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Execute query with count
    const [items, total] = await Promise.all([
      this.prisma.approvalItem.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.approvalItem.count({ where }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    this.logger.log({
      message: 'Approvals listed',
      workspaceId,
      total,
      page,
      limit,
    });

    return {
      items: items.map((item) => this.mapToResponseDto(item)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get single approval with full details
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param id - Approval item ID
   * @returns Full approval item with related entities
   * @throws NotFoundException if not found or wrong workspace
   */
  async findOne(workspaceId: string, id: string): Promise<any> {
    const approval = await this.prisma.approvalItem.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Check if approval exists and belongs to workspace
    if (!approval || approval.workspaceId !== workspaceId) {
      throw new NotFoundException(
        'Approval item not found in this workspace',
      );
    }

    this.logger.log({
      message: 'Approval retrieved',
      workspaceId,
      approvalId: id,
    });

    return this.mapToResponseDto(approval);
  }

  /**
   * Approve an approval item
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param id - Approval item ID
   * @param userId - User ID making the decision
   * @param dto - Approval notes
   * @returns Updated approval item
   * @throws NotFoundException if not found
   * @throws BadRequestException if already decided
   */
  async approve(
    workspaceId: string,
    id: string,
    userId: string,
    dto: ApproveItemDto,
  ): Promise<any> {
    // Fetch and validate approval
    const approval = await this.prisma.approvalItem.findUnique({
      where: { id },
    });

    if (!approval || approval.workspaceId !== workspaceId) {
      throw new NotFoundException(
        'Approval item not found in this workspace',
      );
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve item with status: ${approval.status}`,
      );
    }

    // Update approval
    const updated = await this.prisma.approvalItem.update({
      where: { id },
      data: {
        status: 'approved',
        resolvedById: userId,
        resolvedAt: new Date(),
        resolution: {
          action: 'approved',
          notes: dto.notes,
          decidedAt: new Date(),
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit event
    const approvalPayload: ApprovalDecisionPayload = {
      approvalId: updated.id,
      type: updated.type,
      title: updated.title,
      decision: 'approved',
      decidedById: userId,
      decisionNotes: dto.notes,
      confidenceScore: updated.confidenceScore,
    };
    await this.eventPublisher.publish(
      EventTypes.APPROVAL_APPROVED,
      approvalPayload,
      {
        tenantId: workspaceId,
        userId,
        source: 'approvals',
      },
    );

    // Log to audit trail
    await this.auditLogger.logApprovalDecision({
      workspaceId,
      userId,
      approvalId: id,
      action: 'approval.approved',
      oldStatus: approval.status,
      newStatus: 'approved',
      notes: dto.notes,
      confidenceScore: approval.confidenceScore,
    });

    this.logger.log({
      message: 'Approval approved',
      workspaceId,
      approvalId: id,
      userId,
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Reject an approval item
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param id - Approval item ID
   * @param userId - User ID making the decision
   * @param dto - Rejection reason and notes
   * @returns Updated approval item
   * @throws NotFoundException if not found
   * @throws BadRequestException if already decided
   */
  async reject(
    workspaceId: string,
    id: string,
    userId: string,
    dto: RejectItemDto,
  ): Promise<any> {
    // Fetch and validate approval
    const approval = await this.prisma.approvalItem.findUnique({
      where: { id },
    });

    if (!approval || approval.workspaceId !== workspaceId) {
      throw new NotFoundException(
        'Approval item not found in this workspace',
      );
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject item with status: ${approval.status}`,
      );
    }

    // Combine reason and notes
    const decisionNotes = dto.notes
      ? `${dto.reason}\n\n${dto.notes}`
      : dto.reason;

    // Update approval
    const updated = await this.prisma.approvalItem.update({
      where: { id },
      data: {
        status: 'rejected',
        resolvedById: userId,
        resolvedAt: new Date(),
        resolution: {
          action: 'rejected',
          reason: dto.reason,
          notes: dto.notes,
          decidedAt: new Date(),
        },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit event
    const rejectPayload: ApprovalDecisionPayload = {
      approvalId: updated.id,
      type: updated.type,
      title: updated.title,
      decision: 'rejected',
      decidedById: userId,
      decisionNotes: decisionNotes,
      confidenceScore: updated.confidenceScore,
    };
    await this.eventPublisher.publish(
      EventTypes.APPROVAL_REJECTED,
      rejectPayload,
      {
        tenantId: workspaceId,
        userId,
        source: 'approvals',
      },
    );

    // Log to audit trail
    await this.auditLogger.logApprovalDecision({
      workspaceId,
      userId,
      approvalId: id,
      action: 'approval.rejected',
      oldStatus: approval.status,
      newStatus: 'rejected',
      reason: dto.reason,
      notes: dto.notes,
      confidenceScore: approval.confidenceScore,
    });

    this.logger.log({
      message: 'Approval rejected',
      workspaceId,
      approvalId: id,
      userId,
      reason: dto.reason,
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Bulk approve or reject multiple approval items
   *
   * Handles partial failures gracefully - processes all items and returns
   * successes and failures separately.
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param userId - User ID making the decisions
   * @param dto - Bulk action parameters
   * @returns Summary of successes and failures
   */
  async bulkAction(
    workspaceId: string,
    userId: string,
    dto: BulkApprovalDto,
  ): Promise<BulkActionResult> {
    const successes: string[] = [];
    const failures: { id: string; error: string }[] = [];

    // Generate bulk action correlation ID
    const bulkActionId = `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Process each approval item
    for (const id of dto.ids) {
      try {
        if (dto.action === 'approve') {
          await this.approve(workspaceId, id, userId, {
            notes: dto.notes,
          });
          // Log bulk action
          await this.auditLogger.logBulkAction({
            workspaceId,
            userId,
            approvalId: id,
            action: 'approval.bulk_approved',
            bulkActionId,
            totalItems: dto.ids.length,
            notes: dto.notes,
          });
          successes.push(id);
        } else if (dto.action === 'reject') {
          await this.reject(workspaceId, id, userId, {
            reason: dto.reason!,
            notes: dto.notes,
          });
          // Log bulk action
          await this.auditLogger.logBulkAction({
            workspaceId,
            userId,
            approvalId: id,
            action: 'approval.bulk_rejected',
            bulkActionId,
            totalItems: dto.ids.length,
            reason: dto.reason,
            notes: dto.notes,
          });
          successes.push(id);
        }
      } catch (error) {
        failures.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger.log({
      message: 'Bulk action completed',
      workspaceId,
      action: dto.action,
      bulkActionId,
      totalProcessed: dto.ids.length,
      successes: successes.length,
      failures: failures.length,
    });

    return {
      successes,
      failures,
      totalProcessed: dto.ids.length,
    };
  }

  /**
   * Cancel a pending approval item
   *
   * Permission rules:
   * - The user who created/requested the approval can cancel it
   * - Workspace admins/owners can cancel any approval
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param id - Approval item ID
   * @param userId - User ID requesting cancellation
   * @param dto - Cancellation details (optional reason)
   * @param isAdmin - Whether the user is an admin/owner
   * @returns Success response with cancellation timestamp
   * @throws NotFoundException if not found
   * @throws BadRequestException if already processed
   * @throws ForbiddenException if user lacks permission
   */
  async cancel(
    workspaceId: string,
    id: string,
    userId: string,
    dto: CancelApprovalDto,
    isAdmin: boolean = false,
  ): Promise<{ success: boolean; cancelledAt: string }> {
    // Fetch and validate approval
    const approval = await this.prisma.approvalItem.findUnique({
      where: { id },
    });

    if (!approval || approval.workspaceId !== workspaceId) {
      throw new NotFoundException(
        'Approval item not found in this workspace',
      );
    }

    if (approval.status !== 'pending') {
      throw new BadRequestException(
        `Approval cannot be cancelled - status is '${approval.status}'`,
      );
    }

    // Check permission: creator or admin can cancel
    const isCreator = approval.requestedBy === userId;
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to cancel this approval',
      );
    }

    // Update status to cancelled
    const now = new Date();
    await this.prisma.approvalItem.update({
      where: { id },
      data: {
        status: 'cancelled',
        resolvedById: userId,
        resolvedAt: now,
        resolution: {
          action: 'cancelled',
          reason: dto.reason,
          cancelledAt: now.toISOString(),
        },
      },
    });

    // Emit cancellation event
    const cancelPayload: ApprovalCancelledPayload = {
      approvalId: id,
      type: approval.type,
      title: approval.title,
      cancelledById: userId,
      reason: dto.reason,
    };
    await this.eventPublisher.publish(
      EventTypes.APPROVAL_CANCELLED,
      cancelPayload,
      {
        tenantId: workspaceId,
        userId,
        source: 'approvals',
      },
    );

    // Log to audit trail
    await this.auditLogger.logApprovalCancellation({
      workspaceId,
      userId,
      approvalId: id,
      reason: dto.reason,
    });

    this.logger.log({
      message: 'Approval cancelled',
      workspaceId,
      approvalId: id,
      userId,
      reason: dto.reason,
    });

    return {
      success: true,
      cancelledAt: now.toISOString(),
    };
  }

  /**
   * Map Prisma model to API response DTO
   *
   * Maps resolvedBy -> decidedBy and resolvedAt -> decidedAt for API consistency.
   * Extracts factors from confidenceFactors JSON field.
   *
   * @param approval - Prisma approval item
   * @returns API response DTO
   */
  private mapToResponseDto(approval: any): any {
    return {
      id: approval.id,
      workspaceId: approval.workspaceId,
      type: approval.type,
      title: approval.title,
      description: approval.description,
      previewData: approval.previewData,
      data: approval.previewData,
      confidenceScore: approval.confidenceScore,
      confidenceLevel: this.getConfidenceLevel(approval.confidenceScore),
      factors: approval.confidenceFactors || [],
      aiReasoning: approval.aiReasoning,
      status: approval.status,
      recommendation: approval.aiRecommendation,
      reviewType: this.getReviewType(approval.confidenceScore),
      priority: approval.priority,
      assignedToId: approval.assignedToId,
      dueAt: approval.dueAt,
      escalatedToId: approval.escalatedToId,
      // Map resolvedBy/resolvedAt to decidedBy/decidedAt
      decidedById: approval.resolvedById,
      decidedAt: approval.resolvedAt,
      decisionNotes: approval.resolution?.notes || approval.resolution?.reason,
      sourceModule: approval.sourceModule,
      sourceId: approval.sourceId,
      createdBy: approval.requestedBy,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      // Related entities
      assignedTo: approval.assignedTo,
      decidedBy: approval.resolvedBy, // Map resolvedBy to decidedBy
    };
  }

  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  /**
   * Determine review type based on confidence score
   *
   * @param score - Confidence score (0-100)
   * @returns Review type category
   */
  private getReviewType(score: number): string {
    if (score >= 85) {
      return 'auto';
    } else if (score >= 60) {
      return 'quick';
    } else {
      return 'full';
    }
  }

  /**
   * Get escalation configuration for workspace
   *
   * Story 04-8: Implement Approval Escalation
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @returns Escalation configuration
   */
  async getEscalationConfig(workspaceId: string): Promise<any> {
    const settings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!settings) {
      throw new NotFoundException(
        `Workspace settings not found for workspace ${workspaceId}`,
      );
    }

    return {
      enableEscalation: settings.enableEscalation,
      escalationCheckIntervalMinutes: settings.escalationCheckIntervalMinutes,
      escalationTargetUserId: settings.escalationTargetUserId,
      enableEscalationNotifications: settings.enableEscalationNotifications,
    };
  }

  /**
   * Update escalation configuration for workspace
   *
   * Story 04-8: Implement Approval Escalation
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param dto - Updated escalation configuration
   * @returns Updated escalation configuration
   */
  async updateEscalationConfig(
    workspaceId: string,
    dto: UpdateEscalationConfigDto,
  ): Promise<any> {
    // Check if settings exist
    const existingSettings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (!existingSettings) {
      throw new NotFoundException(
        `Workspace settings not found for workspace ${workspaceId}`,
      );
    }

    // Update settings
    const updatedSettings = await this.prisma.workspaceSettings.update({
      where: { workspaceId },
      data: {
        enableEscalation: dto.enableEscalation,
        escalationCheckIntervalMinutes: dto.escalationCheckIntervalMinutes,
        escalationTargetUserId: dto.escalationTargetUserId,
        enableEscalationNotifications: dto.enableEscalationNotifications,
      },
    });

    this.logger.log({
      message: 'Escalation config updated',
      workspaceId,
      changes: dto,
    });

    return {
      enableEscalation: updatedSettings.enableEscalation,
      escalationCheckIntervalMinutes: updatedSettings.escalationCheckIntervalMinutes,
      escalationTargetUserId: updatedSettings.escalationTargetUserId,
      enableEscalationNotifications: updatedSettings.enableEscalationNotifications,
    };
  }
}
