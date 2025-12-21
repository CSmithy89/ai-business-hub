import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ConfidenceCalculatorService } from './confidence-calculator.service';
import { EventPublisherService } from '../../events';
import { ApprovalAuditService } from './approval-audit.service';
import {
  ConfidenceFactor,
  EventTypes,
  ApprovalDecisionPayload,
  ApprovalRequestedPayload,
} from '@hyvve/shared';

/**
 * Priority to due date hours mapping
 */
const PRIORITY_HOURS = {
  urgent: 4,
  high: 24,
  medium: 48,
  low: 72,
} as const;

/**
 * ApprovalRouterService - Routes approval requests based on confidence score
 *
 * Orchestrates the approval creation workflow:
 * 1. Calculate confidence using ConfidenceCalculatorService
 * 2. Determine status based on score (>85% auto, 60-85% quick, <60% full)
 * 3. Set dueAt based on priority
 * 4. Create ApprovalItem in database
 * 5. Emit approval event (approval.requested or approval.approved)
 * 6. Log routing decision
 *
 * Routing logic:
 * - score >= 85% = auto_approved (immediate execution)
 * - score 60-84% = pending with quick review (1-click approval)
 * - score < 60% = pending with full review (requires AI reasoning review)
 *
 * Features:
 * - Automatic status and review type determination
 * - Priority-based due date calculation
 * - Default approver assignment
 * - Event emission for downstream processing
 * - Audit trail logging
 */
@Injectable()
export class ApprovalRouterService {
  private readonly logger = new Logger(ApprovalRouterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly confidenceCalculator: ConfidenceCalculatorService,
    private readonly eventPublisher: EventPublisherService,
    private readonly auditLogger: ApprovalAuditService,
  ) {}

  /**
   * Route approval request based on confidence score
   *
   * @param workspaceId - Workspace ID for tenant isolation
   * @param requestedBy - User/agent ID requesting approval
   * @param type - Approval type (e.g., 'content', 'email')
   * @param title - Approval title
   * @param factors - Confidence factors for scoring
   * @param options - Optional parameters (description, preview, priority, etc.)
   * @returns Created approval item
   */
  async routeApproval(
    workspaceId: string,
    requestedBy: string,
    type: string,
    title: string,
    factors: ConfidenceFactor[],
    options?: {
      description?: string;
      previewData?: any;
      sourceModule?: string;
      sourceId?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    },
  ): Promise<any> {
    // Step 1: Calculate confidence
    const confidenceResult = await this.confidenceCalculator.calculate(
      factors,
      workspaceId,
    );

    // Step 2: Determine status and review type based on score
    const { status, reviewType } = this.determineStatusAndReviewType(
      confidenceResult.overallScore,
    );

    // Step 3: Calculate due date based on priority
    const priority = options?.priority || 'medium';
    const dueAt = this.calculateDueDate(priority);

    // Step 4: Get default approver (first admin/owner in workspace)
    const assignedToId = await this.getDefaultApprover(workspaceId);

    // Step 5: Create approval item
    const approvalItem = await this.prisma.approvalItem.create({
      data: {
        workspaceId,
        type,
        title,
        description: options?.description,
        previewData: options?.previewData as any,
        confidenceScore: Math.round(confidenceResult.overallScore),
        confidenceFactors: confidenceResult.factors as any,
        aiRecommendation: confidenceResult.recommendation,
        aiReasoning: confidenceResult.aiReasoning,
        status,
        priority,
        assignedToId,
        dueAt,
        sourceModule: options?.sourceModule,
        sourceId: options?.sourceId,
        requestedBy,
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

    // Step 6: Emit event based on status
    if (status === 'auto_approved') {
      // For auto-approved items, emit auto_approved event
      const autoApprovePayload: ApprovalDecisionPayload = {
        approvalId: approvalItem.id,
        type: approvalItem.type,
        title: approvalItem.title,
        decision: 'auto_approved',
        decidedById: 'system',
        confidenceScore: approvalItem.confidenceScore,
      };
      await this.eventPublisher.publish(
        EventTypes.APPROVAL_AUTO_APPROVED,
        autoApprovePayload,
        {
          tenantId: workspaceId,
          userId: requestedBy,
          source: 'approval-router',
        },
      );

      // Step 7a: Log auto-approval with AI reasoning
      await this.auditLogger.logAutoApproval({
        workspaceId,
        approvalId: approvalItem.id,
        type,
        confidenceScore: Math.round(confidenceResult.overallScore),
        aiReasoning: confidenceResult.aiReasoning,
        factors: confidenceResult.factors,
        threshold: 85,
      });
    } else {
      // For pending items, emit approval.requested event
      const requestedPayload: ApprovalRequestedPayload = {
        approvalId: approvalItem.id,
        type: approvalItem.type,
        title: approvalItem.title,
        confidenceScore: approvalItem.confidenceScore,
        recommendation: confidenceResult.recommendation,
        assignedToId: approvalItem.assignedToId || undefined,
        dueAt: approvalItem.dueAt.toISOString(),
        sourceModule: options?.sourceModule,
        sourceId: options?.sourceId,
      };
      await this.eventPublisher.publish(
        EventTypes.APPROVAL_REQUESTED,
        requestedPayload,
        {
          tenantId: workspaceId,
          userId: requestedBy,
          source: 'approval-router',
        },
      );

      // Step 7b: Log approval creation
      await this.auditLogger.logApprovalCreated({
        workspaceId,
        userId: requestedBy,
        approvalId: approvalItem.id,
        type,
        confidenceScore: Math.round(confidenceResult.overallScore),
        status,
        priority,
        reviewType,
        aiReasoning: confidenceResult.aiReasoning,
        factors: confidenceResult.factors,
      });
    }

    this.logger.log(
      `Approval routed: ${approvalItem.id} - Score: ${confidenceResult.overallScore} - Status: ${status} - Review: ${reviewType}`,
    );

    return this.mapToResponseDto(approvalItem, reviewType);
  }

  /**
   * Determine status and review type based on confidence score
   *
   * Thresholds:
   * - >85%: auto_approved (immediate execution)
   * - 60-85%: pending with quick review (1-click)
   * - <60%: pending with full review (AI reasoning required)
   *
   * @param score - Overall confidence score (0-100)
   * @returns Status and review type
   */
  private determineStatusAndReviewType(score: number): {
    status: string;
    reviewType: string;
  } {
    if (score > 85) {
      return { status: 'auto_approved', reviewType: 'auto' };
    } else if (score >= 60) {
      return { status: 'pending', reviewType: 'quick' };
    } else {
      return { status: 'pending', reviewType: 'full' };
    }
  }

  /**
   * Calculate due date based on priority
   *
   * Priority to Due Date Mapping:
   * - urgent: 4 hours
   * - high: 24 hours
   * - medium: 48 hours (default)
   * - low: 72 hours
   *
   * @param priority - Priority level
   * @returns Due date
   */
  private calculateDueDate(
    priority: 'low' | 'medium' | 'high' | 'urgent',
  ): Date {
    const now = new Date();
    const hours = PRIORITY_HOURS[priority];
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  /**
   * Get default approver for workspace
   *
   * Returns first admin or owner, null if none found.
   * Sorts by role to prefer owner over admin.
   *
   * @param workspaceId - Workspace ID
   * @returns User ID or null
   */
  private async getDefaultApprover(workspaceId: string): Promise<string | null> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        role: { in: ['admin', 'owner'] },
      },
      orderBy: {
        role: 'asc', // owner < admin alphabetically
      },
    });

    return member?.userId || null;
  }

  /**
   * Map approval item to response DTO
   *
   * @param approval - Prisma approval item
   * @param reviewType - Review type (auto/quick/full)
   * @returns Response DTO
   */
  private mapToResponseDto(approval: any, reviewType: string): any {
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
      reviewType,
      priority: approval.priority,
      assignedToId: approval.assignedToId,
      dueAt: approval.dueAt,
      sourceModule: approval.sourceModule,
      sourceId: approval.sourceId,
      requestedBy: approval.requestedBy,
      createdBy: approval.requestedBy,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      assignedTo: approval.assignedTo,
    };
  }

  private getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }
}
