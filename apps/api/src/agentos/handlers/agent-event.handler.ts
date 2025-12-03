import { Injectable, Logger } from '@nestjs/common';
import { EventSubscriber } from '../../events';
import {
  EventTypes,
  BaseEvent,
  AgentRunStartedPayload,
  AgentRunCompletedPayload,
  AgentRunFailedPayload,
  AgentConfirmationPayload,
} from '@hyvve/shared';

/**
 * Agent Event Handler
 *
 * Handles agent-related events emitted by the event bus.
 * These handlers process agent lifecycle events and trigger downstream actions.
 *
 * Story: 05-5 - Define Core Platform Events
 */
@Injectable()
export class AgentEventHandler {
  private readonly logger = new Logger(AgentEventHandler.name);

  /**
   * Handle agent run started events
   *
   * Logs when an agent starts executing and tracks active runs.
   */
  @EventSubscriber(EventTypes.AGENT_RUN_STARTED)
  async handleRunStarted(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentRunStartedPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent run started event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.log({
      message: 'Agent run started',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      agentName: data.agentName,
      triggeredBy: data.triggeredBy,
    });

    // Future: Track active agent runs for dashboard
    // - Update real-time dashboard
    // - Start run timer for metrics
  }

  /**
   * Handle agent run completed events
   *
   * Updates metrics and logs successful agent completions.
   */
  @EventSubscriber(EventTypes.AGENT_RUN_COMPLETED)
  async handleRunCompleted(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentRunCompletedPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent run completed event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.log({
      message: 'Agent run completed',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      agentName: data.agentName,
      durationMs: data.durationMs,
      tokensUsed: data.tokensUsed,
    });

    // Future: Update agent metrics
    // - Track success rate
    // - Track average duration
    // - Track token usage for billing
  }

  /**
   * Handle agent run failed events
   *
   * Logs failures for monitoring and potentially triggers alerts.
   */
  @EventSubscriber(EventTypes.AGENT_RUN_FAILED)
  async handleRunFailed(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentRunFailedPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent run failed event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.error({
      message: 'Agent run failed',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      agentName: data.agentName,
      error: data.error,
      errorCode: data.errorCode,
      durationMs: data.durationMs,
    });

    // Future: Handle failure scenarios
    // - Send alert if failure rate exceeds threshold
    // - Update failure metrics
    // - Potentially retry based on error type
  }

  /**
   * Handle agent confirmation requested events
   *
   * Creates approval item for human review of agent actions.
   */
  @EventSubscriber(EventTypes.AGENT_CONFIRMATION_REQUESTED)
  async handleConfirmationRequested(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentConfirmationPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent confirmation requested event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.log({
      message: 'Agent confirmation requested - creating approval',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      confirmationId: data.confirmationId,
      toolName: data.toolName,
      confirmationMessage: data.message,
    });

    // The approval item should already be created by the service that emitted this event
    // This handler is for additional downstream processing like:
    // - Sending notifications
    // - Updating real-time dashboard
    // - Tracking pending confirmations
  }

  /**
   * Handle agent confirmation granted events
   *
   * Logs when a human grants confirmation for an agent action.
   */
  @EventSubscriber(EventTypes.AGENT_CONFIRMATION_GRANTED)
  async handleConfirmationGranted(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentConfirmationPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent confirmation granted event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.log({
      message: 'Agent confirmation granted - resuming agent',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      confirmationId: data.confirmationId,
      toolName: data.toolName,
    });

    // Future: Trigger agent to resume with confirmation
    // - Send message to AgentOS to continue execution
    // - Update confirmation status in dashboard
  }

  /**
   * Handle agent confirmation denied events
   *
   * Logs when a human denies an agent action request.
   */
  @EventSubscriber(EventTypes.AGENT_CONFIRMATION_DENIED)
  async handleConfirmationDenied(event: BaseEvent): Promise<void> {
    const data = event.data as unknown as AgentConfirmationPayload;

    if (!data) {
      this.logger.warn({
        message: 'Agent confirmation denied event missing data',
        eventId: event.id,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      return;
    }

    this.logger.log({
      message: 'Agent confirmation denied - stopping agent action',
      eventId: event.id,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      runId: data.runId,
      agentId: data.agentId,
      confirmationId: data.confirmationId,
      toolName: data.toolName,
    });

    // Future: Notify agent of denied action
    // - Send message to AgentOS to skip this action
    // - Allow agent to proceed with alternative approach
  }

  /**
   * Catch-all handler for all agent events
   *
   * Used for audit logging and metrics collection across all agent events.
   * Lower priority to run after specific handlers.
   */
  @EventSubscriber('agent.*', { priority: 200 })
  async handleAllAgentEvents(event: BaseEvent): Promise<void> {
    // Generic audit logging for all agent events
    this.logger.debug({
      message: 'Agent event received (audit)',
      eventId: event.id,
      eventType: event.type,
      correlationId: event.correlationId,
      tenantId: event.tenantId,
      userId: event.userId,
      timestamp: event.timestamp,
    });

    // Future: Store in analytics/time-series database for metrics
  }
}
