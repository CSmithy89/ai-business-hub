import { Injectable, Logger } from '@nestjs/common';
import { BaseEvent, EventTypes } from '@hyvve/shared';
import { EventSubscriber } from '../events/decorators/event-subscriber.decorator';
import { RealtimeGateway } from './realtime.gateway';
import {
  ApprovalEventPayload,
  ApprovalUpdatePayload,
  AgentStatusPayload,
  AgentRunPayload,
  AgentRunFailedPayload,
  NotificationPayload,
} from './realtime.types';

/**
 * RealtimeEventHandler - Event Bus to WebSocket Bridge
 *
 * Subscribes to Event Bus events and broadcasts them to WebSocket clients.
 * This ensures all real-time updates go through the Event Bus for consistency
 * and audit trail.
 *
 * Pattern matching:
 * - approval.* → approval WebSocket events
 * - agent.* → agent WebSocket events
 * - notification.* (future) → notification WebSocket events
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
@Injectable()
export class RealtimeEventHandler {
  private readonly logger = new Logger(RealtimeEventHandler.name);

  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  // ============================================
  // Approval Event Handlers
  // ============================================

  /**
   * Handle all approval events
   * Maps Event Bus approval events to WebSocket broadcasts
   */
  @EventSubscriber('approval.*', { priority: 50 })
  async handleApprovalEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;

    this.logger.debug({
      message: 'Processing approval event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.APPROVAL_REQUESTED:
      case EventTypes.APPROVAL_CREATED: {
        const payload = this.mapApprovalCreatedPayload(event);
        this.realtimeGateway.broadcastApprovalCreated(workspaceId, payload);
        break;
      }

      case EventTypes.APPROVAL_APPROVED:
      case EventTypes.APPROVAL_REJECTED:
      case EventTypes.APPROVAL_AUTO_APPROVED: {
        const payload = this.mapApprovalDecisionPayload(event);
        this.realtimeGateway.broadcastApprovalUpdated(workspaceId, payload);
        break;
      }

      case EventTypes.APPROVAL_ESCALATED: {
        const payload = this.mapApprovalEscalatedPayload(event);
        this.realtimeGateway.broadcastApprovalUpdated(workspaceId, payload);
        break;
      }

      case EventTypes.APPROVAL_EXPIRED: {
        const payload = this.mapApprovalExpiredPayload(event);
        this.realtimeGateway.broadcastApprovalUpdated(workspaceId, payload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled approval event type',
          eventType: event.type,
        });
    }
  }

  // ============================================
  // Agent Event Handlers
  // ============================================

  /**
   * Handle all agent events
   * Maps Event Bus agent events to WebSocket broadcasts
   */
  @EventSubscriber('agent.*', { priority: 50 })
  async handleAgentEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;

    this.logger.debug({
      message: 'Processing agent event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.AGENT_RUN_STARTED: {
        const payload = this.mapAgentRunPayload(event, 'started');
        this.realtimeGateway.broadcastAgentRunStarted(workspaceId, payload);

        // Also broadcast status change to running
        const statusPayload = this.mapAgentStatusPayload(event, 'running');
        this.realtimeGateway.broadcastAgentStatusChanged(workspaceId, statusPayload);
        break;
      }

      case EventTypes.AGENT_RUN_COMPLETED: {
        const payload = this.mapAgentRunPayload(event, 'completed');
        this.realtimeGateway.broadcastAgentRunCompleted(workspaceId, payload);

        // Also broadcast status change to idle
        const statusPayload = this.mapAgentStatusPayload(event, 'idle');
        this.realtimeGateway.broadcastAgentStatusChanged(workspaceId, statusPayload);
        break;
      }

      case EventTypes.AGENT_RUN_FAILED: {
        const payload = this.mapAgentRunFailedPayload(event);
        this.realtimeGateway.broadcastAgentRunFailed(workspaceId, payload);

        // Also broadcast status change to error
        const statusPayload = this.mapAgentStatusPayload(event, 'error');
        this.realtimeGateway.broadcastAgentStatusChanged(workspaceId, statusPayload);
        break;
      }

      case EventTypes.AGENT_CONFIRMATION_REQUESTED: {
        // Agent is waiting for confirmation - broadcast paused status
        const statusPayload = this.mapAgentStatusPayload(event, 'paused');
        statusPayload.currentTask = 'Waiting for confirmation';
        this.realtimeGateway.broadcastAgentStatusChanged(workspaceId, statusPayload);

        // Also send notification to the user
        const notification = this.mapConfirmationNotification(event);
        this.realtimeGateway.broadcastNotification(
          workspaceId,
          notification,
          event.userId,
        );
        break;
      }

      case EventTypes.AGENT_CONFIRMATION_GRANTED:
      case EventTypes.AGENT_CONFIRMATION_DENIED: {
        // Agent continues after confirmation - broadcast running status
        const status =
          event.type === EventTypes.AGENT_CONFIRMATION_GRANTED ? 'running' : 'idle';
        const statusPayload = this.mapAgentStatusPayload(event, status);
        this.realtimeGateway.broadcastAgentStatusChanged(workspaceId, statusPayload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled agent event type',
          eventType: event.type,
        });
    }
  }

  // ============================================
  // Token Limit Event Handlers
  // ============================================

  /**
   * Handle AI token limit events
   * Broadcasts warnings/errors to affected users
   */
  @EventSubscriber('ai.*', { priority: 50 })
  async handleTokenLimitEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;

    this.logger.debug({
      message: 'Processing AI event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
    });

    switch (event.type) {
      case EventTypes.TOKEN_LIMIT_WARNING: {
        const notification: NotificationPayload = {
          id: event.id,
          type: 'token_limit_warning',
          title: 'Token Limit Warning',
          message: `AI provider token usage is at ${(event.data as Record<string, number>).percentageUsed}% of daily limit`,
          severity: 'warning',
          createdAt: event.timestamp,
          read: false,
          correlationId: event.correlationId,
        };
        this.realtimeGateway.broadcastNotification(workspaceId, notification);
        break;
      }

      case EventTypes.TOKEN_LIMIT_EXCEEDED: {
        const notification: NotificationPayload = {
          id: event.id,
          type: 'token_limit_exceeded',
          title: 'Token Limit Exceeded',
          message: 'AI provider daily token limit has been reached',
          severity: 'error',
          createdAt: event.timestamp,
          read: false,
          correlationId: event.correlationId,
        };
        this.realtimeGateway.broadcastNotification(workspaceId, notification);
        break;
      }
    }
  }

  // ============================================
  // Payload Mappers
  // ============================================

  private mapApprovalCreatedPayload(event: BaseEvent): ApprovalEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.approvalId as string,
      type: data.type as string,
      title: data.title as string,
      description: data.description as string | undefined,
      confidenceScore: data.confidenceScore as number,
      recommendation: data.recommendation as 'approve' | 'review' | 'full_review',
      status: 'pending',
      assignedToId: data.assignedToId as string | undefined,
      createdAt: event.timestamp,
      dueAt: data.dueAt as string | undefined,
      sourceModule: data.sourceModule as string | undefined,
      sourceId: data.sourceId as string | undefined,
      correlationId: event.correlationId,
    };
  }

  private mapApprovalDecisionPayload(event: BaseEvent): ApprovalUpdatePayload {
    const data = event.data as Record<string, unknown>;
    const decision = data.decision as string;
    return {
      id: data.approvalId as string,
      status: decision === 'approved' ? 'approved' : 'rejected',
      decision: decision as 'approved' | 'rejected',
      decidedById: data.decidedById as string | undefined,
      decisionNotes: data.decisionNotes as string | undefined,
      decidedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapApprovalEscalatedPayload(event: BaseEvent): ApprovalUpdatePayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.approvalId as string,
      status: 'escalated',
      assignedToId: data.escalatedToId as string,
      correlationId: event.correlationId,
    };
  }

  private mapApprovalExpiredPayload(event: BaseEvent): ApprovalUpdatePayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.approvalId as string,
      status: 'expired',
      correlationId: event.correlationId,
    };
  }

  private mapAgentRunPayload(
    event: BaseEvent,
    status: 'started' | 'completed' | 'failed',
  ): AgentRunPayload {
    const data = event.data as Record<string, unknown>;
    return {
      runId: data.runId as string,
      agentId: data.agentId as string,
      agentName: data.agentName as string,
      status,
      input: data.input as Record<string, unknown> | undefined,
      output: data.output as Record<string, unknown> | undefined,
      durationMs: data.durationMs as number | undefined,
      tokensUsed: data.tokensUsed as number | undefined,
      triggeredBy: data.triggeredBy as 'user' | 'system' | 'schedule' | undefined,
      correlationId: event.correlationId,
    };
  }

  private mapAgentRunFailedPayload(event: BaseEvent): AgentRunFailedPayload {
    const data = event.data as Record<string, unknown>;
    return {
      runId: data.runId as string,
      agentId: data.agentId as string,
      agentName: data.agentName as string,
      status: 'failed',
      error: data.error as string,
      errorCode: data.errorCode as string | undefined,
      durationMs: data.durationMs as number | undefined,
      correlationId: event.correlationId,
    };
  }

  private mapAgentStatusPayload(
    event: BaseEvent,
    status: 'idle' | 'running' | 'paused' | 'error' | 'offline',
  ): AgentStatusPayload {
    const data = event.data as Record<string, unknown>;
    return {
      agentId: data.agentId as string,
      agentName: data.agentName as string,
      status,
      lastActiveAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapConfirmationNotification(event: BaseEvent): NotificationPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: event.id,
      type: 'agent_confirmation',
      title: 'Agent Confirmation Required',
      message: data.message as string,
      severity: 'warning',
      actionUrl: `/approvals?confirmation=${data.confirmationId}`,
      actionLabel: 'Review',
      createdAt: event.timestamp,
      read: false,
      correlationId: event.correlationId,
    };
  }
}
