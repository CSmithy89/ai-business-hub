import { Injectable, Logger } from '@nestjs/common';
import { EventSubscriber } from '../../events';
import {
  EventTypes,
  BaseEvent,
  ApprovalDecisionPayload,
  ApprovalEscalatedPayload,
  ApprovalRequestedPayload,
  ApprovalExpiredPayload,
} from '@hyvve/shared';

/**
 * Approval Event Handler
 *
 * Handles approval-related events emitted by the event bus.
 * These handlers trigger downstream actions in response to approval lifecycle events.
 *
 * Story: 05-5 - Define Core Platform Events
 */
@Injectable()
export class ApprovalEventHandler {
  private readonly logger = new Logger(ApprovalEventHandler.name);

  /**
   * Handle approval approved events
   *
   * Triggers execution of the approved action or notifies relevant parties.
   */
  @EventSubscriber(EventTypes.APPROVAL_APPROVED)
  async handleApproved(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalDecisionPayload;

    this.logger.log({
      message: 'Approval approved - triggering execution',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      decidedById: data.decidedById,
      confidenceScore: data.confidenceScore,
    });

    // Future: Trigger downstream action execution
    // - Execute the approved agent action
    // - Send notifications to relevant parties
    // - Update related entities
  }

  /**
   * Handle auto-approved events
   *
   * For high-confidence items that were automatically approved without human review.
   */
  @EventSubscriber(EventTypes.APPROVAL_AUTO_APPROVED)
  async handleAutoApproved(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalDecisionPayload;

    this.logger.log({
      message: 'Approval auto-approved - high confidence execution',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      confidenceScore: data.confidenceScore,
    });

    // Future: Auto-trigger action execution without manual intervention
  }

  /**
   * Handle approval rejected events
   *
   * Notifies the originating agent/service that the action was rejected.
   */
  @EventSubscriber(EventTypes.APPROVAL_REJECTED)
  async handleRejected(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalDecisionPayload;

    this.logger.log({
      message: 'Approval rejected - notifying source',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      decidedById: data.decidedById,
      decisionNotes: data.decisionNotes,
    });

    // Future: Notify originating agent of rejection
    // - Send rejection notification
    // - Update agent run status if applicable
  }

  /**
   * Handle approval escalated events
   *
   * Sends notification to the escalation target.
   */
  @EventSubscriber(EventTypes.APPROVAL_ESCALATED)
  async handleEscalated(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalEscalatedPayload;

    this.logger.log({
      message: 'Approval escalated - notifying target',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      escalatedFromId: data.escalatedFromId,
      escalatedToId: data.escalatedToId,
      reason: data.reason,
      newDueAt: data.newDueAt,
    });

    // Future: Send notification to escalation target
    // - Email notification
    // - In-app notification
    // - Push notification
  }

  /**
   * Handle approval expired events
   *
   * Notifies stakeholders when an approval expires without action.
   */
  @EventSubscriber(EventTypes.APPROVAL_EXPIRED)
  async handleExpired(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalExpiredPayload;

    this.logger.log({
      message: 'Approval expired - triggering follow-up',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      dueAt: data.dueAt,
      assignedToId: data.assignedToId,
    });

    // Future: Auto-escalate or notify management
  }

  /**
   * Handle approval created events
   *
   * Log when new approval items are created for audit purposes.
   */
  @EventSubscriber(EventTypes.APPROVAL_CREATED)
  async handleCreated(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalRequestedPayload;

    this.logger.log({
      message: 'Approval created',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      title: data.title,
      confidenceScore: data.confidenceScore,
      recommendation: data.recommendation,
      assignedToId: data.assignedToId,
      dueAt: data.dueAt,
    });
  }

  /**
   * Handle approval requested events
   *
   * Sends notification when approval is requested from a specific user.
   */
  @EventSubscriber(EventTypes.APPROVAL_REQUESTED)
  async handleRequested(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as ApprovalRequestedPayload;

    this.logger.log({
      message: 'Approval requested - notifying assignee',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      approvalId: data.approvalId,
      approvalType: data.type,
      title: data.title,
      assignedToId: data.assignedToId,
      dueAt: data.dueAt,
    });

    // Future: Send notification to assigned user
    // - Email notification
    // - In-app notification
    // - Push notification
  }
}
