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
  PMTaskEventPayload,
  PMTaskUpdatePayload,
  PMTaskDeletedPayload,
  PMTaskStatusPayload,
  PMPhaseEventPayload,
  PMPhaseTransitionPayload,
  PMProjectEventPayload,
  PMProjectDeletedPayload,
  PMTeamChangePayload,
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

      case EventTypes.APPROVAL_CANCELLED: {
        const payload = this.mapApprovalCancelledPayload(event);
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
  // PM Event Handlers
  // ============================================

  /**
   * Handle all PM task events
   * Maps Event Bus PM task events to WebSocket broadcasts
   */
  @EventSubscriber('pm.task.*', { priority: 50 })
  async handlePMTaskEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;
    const data = event.data as Record<string, unknown>;
    const projectId = data.projectId as string;

    this.logger.debug({
      message: 'Processing PM task event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      projectId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.PM_TASK_CREATED: {
        const payload = this.mapPMTaskCreatedPayload(event);
        this.realtimeGateway.broadcastPMTaskCreated(projectId, payload);
        break;
      }

      case EventTypes.PM_TASK_UPDATED: {
        const payload = this.mapPMTaskUpdatedPayload(event);
        this.realtimeGateway.broadcastPMTaskUpdated(projectId, payload);
        break;
      }

      case EventTypes.PM_TASK_DELETED: {
        const payload = this.mapPMTaskDeletedPayload(event);
        this.realtimeGateway.broadcastPMTaskDeleted(projectId, payload);
        break;
      }

      case EventTypes.PM_TASK_STATUS_CHANGED: {
        const payload = this.mapPMTaskStatusPayload(event);
        this.realtimeGateway.broadcastPMTaskStatusChanged(projectId, payload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled PM task event type',
          eventType: event.type,
        });
    }
  }

  /**
   * Handle all PM phase events
   * Maps Event Bus PM phase events to WebSocket broadcasts
   */
  @EventSubscriber('pm.phase.*', { priority: 50 })
  async handlePMPhaseEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;
    const data = event.data as Record<string, unknown>;
    const projectId = data.projectId as string;

    this.logger.debug({
      message: 'Processing PM phase event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      projectId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.PM_PHASE_CREATED: {
        const payload = this.mapPMPhaseCreatedPayload(event);
        this.realtimeGateway.broadcastPMPhaseCreated(projectId, payload);
        break;
      }

      case EventTypes.PM_PHASE_UPDATED: {
        const payload = this.mapPMPhaseUpdatedPayload(event);
        this.realtimeGateway.broadcastPMPhaseUpdated(projectId, payload);
        break;
      }

      case EventTypes.PM_PHASE_TRANSITIONED: {
        const payload = this.mapPMPhaseTransitionPayload(event);
        this.realtimeGateway.broadcastPMPhaseTransitioned(projectId, payload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled PM phase event type',
          eventType: event.type,
        });
    }
  }

  /**
   * Handle all PM project events
   * Maps Event Bus PM project events to WebSocket broadcasts
   */
  @EventSubscriber('pm.project.*', { priority: 50 })
  async handlePMProjectEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;

    this.logger.debug({
      message: 'Processing PM project event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.PM_PROJECT_CREATED: {
        const payload = this.mapPMProjectCreatedPayload(event);
        this.realtimeGateway.broadcastPMProjectCreated(workspaceId, payload);
        break;
      }

      case EventTypes.PM_PROJECT_UPDATED: {
        const payload = this.mapPMProjectUpdatedPayload(event);
        this.realtimeGateway.broadcastPMProjectUpdated(workspaceId, payload);
        break;
      }

      case EventTypes.PM_PROJECT_DELETED: {
        const payload = this.mapPMProjectDeletedPayload(event);
        this.realtimeGateway.broadcastPMProjectDeleted(workspaceId, payload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled PM project event type',
          eventType: event.type,
        });
    }
  }

  /**
   * Handle all PM team events
   * Maps Event Bus PM team events to WebSocket broadcasts
   */
  @EventSubscriber('pm.team.*', { priority: 50 })
  async handlePMTeamEvents(event: BaseEvent): Promise<void> {
    const workspaceId = event.tenantId;
    const data = event.data as Record<string, unknown>;
    const projectId = data.projectId as string;

    this.logger.debug({
      message: 'Processing PM team event for WebSocket broadcast',
      eventId: event.id,
      eventType: event.type,
      workspaceId,
      projectId,
      correlationId: event.correlationId,
    });

    switch (event.type) {
      case EventTypes.PM_TEAM_MEMBER_ADDED: {
        const payload = this.mapPMTeamChangePayload(event, 'added');
        this.realtimeGateway.broadcastPMTeamMemberAdded(projectId, payload);
        break;
      }

      case EventTypes.PM_TEAM_MEMBER_REMOVED: {
        const payload = this.mapPMTeamChangePayload(event, 'removed');
        this.realtimeGateway.broadcastPMTeamMemberRemoved(projectId, payload);
        break;
      }

      case EventTypes.PM_TEAM_MEMBER_UPDATED: {
        const payload = this.mapPMTeamChangePayload(event, 'updated');
        this.realtimeGateway.broadcastPMTeamMemberUpdated(projectId, payload);
        break;
      }

      default:
        this.logger.debug({
          message: 'Unhandled PM team event type',
          eventType: event.type,
        });
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

  private mapApprovalCancelledPayload(event: BaseEvent): ApprovalUpdatePayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.approvalId as string,
      status: 'cancelled',
      decidedById: data.cancelledById as string | undefined,
      decisionNotes: data.reason as string | undefined,
      decidedAt: event.timestamp,
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

  // ============================================
  // PM Payload Mappers
  // ============================================

  private mapPMTaskCreatedPayload(event: BaseEvent): PMTaskEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.taskId as string,
      projectId: data.projectId as string,
      phaseId: data.phaseId as string,
      taskNumber: data.taskNumber as number,
      title: data.title as string,
      description: data.description as string | undefined,
      type: data.type as string,
      priority: data.priority as string,
      status: data.status as string,
      assigneeId: data.assigneeId as string | undefined,
      agentId: data.agentId as string | undefined,
      assignmentType: data.assignmentType as string,
      dueDate: data.dueDate as string | undefined,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMTaskUpdatedPayload(event: BaseEvent): PMTaskUpdatePayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.taskId as string,
      projectId: data.projectId as string,
      phaseId: data.phaseId as string,
      taskNumber: data.taskNumber as number,
      title: data.title as string | undefined,
      description: data.description as string | undefined,
      type: data.type as string | undefined,
      priority: data.priority as string | undefined,
      status: data.status as string | undefined,
      assigneeId: data.assigneeId as string | undefined,
      agentId: data.agentId as string | undefined,
      assignmentType: data.assignmentType as string | undefined,
      dueDate: data.dueDate as string | undefined,
      updatedAt: event.timestamp,
      updatedBy: event.userId,
      correlationId: event.correlationId,
    };
  }

  private mapPMTaskDeletedPayload(event: BaseEvent): PMTaskDeletedPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.taskId as string,
      projectId: data.projectId as string,
      phaseId: data.phaseId as string,
      taskNumber: data.taskNumber as number,
      title: data.title as string,
      deletedBy: event.userId,
      deletedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMTaskStatusPayload(event: BaseEvent): PMTaskStatusPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.taskId as string,
      projectId: data.projectId as string,
      phaseId: data.phaseId as string,
      taskNumber: data.taskNumber as number,
      title: data.title as string,
      fromStatus: data.fromStatus as string,
      toStatus: data.toStatus as string,
      changedBy: event.userId,
      changedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMPhaseCreatedPayload(event: BaseEvent): PMPhaseEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.phaseId as string,
      projectId: data.projectId as string,
      phaseNumber: data.phaseNumber as number,
      name: data.name as string,
      description: data.description as string | undefined,
      status: data.status as string,
      bmadPhase: data.bmadPhase as string | undefined,
      startDate: data.startDate as string | undefined,
      endDate: data.endDate as string | undefined,
      totalTasks: (data.totalTasks as number) || 0,
      completedTasks: (data.completedTasks as number) || 0,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMPhaseUpdatedPayload(event: BaseEvent): PMPhaseEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.phaseId as string,
      projectId: data.projectId as string,
      phaseNumber: data.phaseNumber as number,
      name: data.name as string,
      description: data.description as string | undefined,
      status: data.status as string,
      bmadPhase: data.bmadPhase as string | undefined,
      startDate: data.startDate as string | undefined,
      endDate: data.endDate as string | undefined,
      totalTasks: (data.totalTasks as number) || 0,
      completedTasks: (data.completedTasks as number) || 0,
      updatedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMPhaseTransitionPayload(event: BaseEvent): PMPhaseTransitionPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.phaseId as string,
      projectId: data.projectId as string,
      phaseNumber: data.phaseNumber as number,
      name: data.name as string,
      fromStatus: data.fromStatus as string,
      toStatus: data.toStatus as string,
      transitionedBy: event.userId,
      transitionedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMProjectCreatedPayload(event: BaseEvent): PMProjectEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.projectId as string,
      workspaceId: event.tenantId,
      businessId: data.businessId as string,
      slug: data.slug as string,
      name: data.name as string,
      description: data.description as string | undefined,
      color: (data.color as string) || '#3B82F6',
      icon: (data.icon as string) || 'folder',
      type: data.type as string,
      status: data.status as string,
      startDate: data.startDate as string | undefined,
      targetDate: data.targetDate as string | undefined,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMProjectUpdatedPayload(event: BaseEvent): PMProjectEventPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.projectId as string,
      workspaceId: event.tenantId,
      businessId: data.businessId as string,
      slug: data.slug as string,
      name: data.name as string,
      description: data.description as string | undefined,
      color: (data.color as string) || '#3B82F6',
      icon: (data.icon as string) || 'folder',
      type: data.type as string,
      status: data.status as string,
      startDate: data.startDate as string | undefined,
      targetDate: data.targetDate as string | undefined,
      updatedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMProjectDeletedPayload(event: BaseEvent): PMProjectDeletedPayload {
    const data = event.data as Record<string, unknown>;
    return {
      id: data.projectId as string,
      workspaceId: event.tenantId,
      businessId: data.businessId as string,
      slug: data.slug as string,
      name: data.name as string,
      deletedBy: event.userId,
      deletedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }

  private mapPMTeamChangePayload(
    event: BaseEvent,
    action: 'added' | 'removed' | 'updated',
  ): PMTeamChangePayload {
    const data = event.data as Record<string, unknown>;
    return {
      projectId: data.projectId as string,
      userId: data.userId as string,
      role: data.role as string,
      action,
      changedBy: event.userId,
      changedAt: event.timestamp,
      correlationId: event.correlationId,
    };
  }
}
