/**
 * Event bus type definitions
 * Used for Redis Streams event-driven architecture
 */

/**
 * Base event structure for Redis Streams event bus
 * All events should extend this interface
 */
export interface BaseEvent {
  /** Unique event ID */
  id: string;
  /** Event type (format: module.entity.action, e.g., 'crm.contact.created') */
  type: string;
  /** Service that emitted the event */
  source: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Request correlation ID for tracing */
  correlationId?: string;
  /** Workspace ID for multi-tenancy */
  tenantId: string;
  /** User ID who triggered the event */
  userId: string;
  /** Event schema version */
  version: string;
  /** Event payload */
  data: Record<string, unknown>;
}

/**
 * Event handler metadata
 */
export interface EventHandler {
  /** Handler name */
  name: string;
  /** Event type pattern (supports wildcards) */
  eventType: string;
  /** Service/module that owns the handler */
  service: string;
  /** Priority for handler execution order */
  priority?: number;
}

/**
 * Event subscription
 */
export interface EventSubscription {
  /** Subscription ID */
  id: string;
  /** Event type pattern */
  eventType: string;
  /** Consumer service */
  consumer: string;
  /** Consumer group for distributed processing */
  consumerGroup?: string;
  /** Active status */
  isActive: boolean;
}

/**
 * Common event type patterns
 * Naming convention: {module}.{entity}.{action}
 */
export const EventTypes = {
  // Auth events
  AUTH_USER_CREATED: 'auth.user.created',
  AUTH_USER_UPDATED: 'auth.user.updated',
  AUTH_SESSION_CREATED: 'auth.session.created',
  AUTH_SESSION_EXPIRED: 'auth.session.expired',

  // Workspace events
  WORKSPACE_CREATED: 'workspace.workspace.created',
  WORKSPACE_UPDATED: 'workspace.workspace.updated',
  WORKSPACE_MEMBER_ADDED: 'workspace.member.added',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member.removed',
  WORKSPACE_MEMBER_ROLE_CHANGED: 'workspace.member.role_changed',

  // Approval events (Epic 04)
  APPROVAL_REQUESTED: 'approval.item.requested',
  APPROVAL_CREATED: 'approval.item.created',
  APPROVAL_APPROVED: 'approval.item.approved',
  APPROVAL_REJECTED: 'approval.item.rejected',
  APPROVAL_ESCALATED: 'approval.item.escalated',
  APPROVAL_EXPIRED: 'approval.item.expired',
  APPROVAL_AUTO_APPROVED: 'approval.item.auto_approved',

  // Agent events (Epic 04 - AgentOS)
  AGENT_RUN_STARTED: 'agent.run.started',
  AGENT_RUN_COMPLETED: 'agent.run.completed',
  AGENT_RUN_FAILED: 'agent.run.failed',
  AGENT_CONFIRMATION_REQUESTED: 'agent.confirmation.requested',
  AGENT_CONFIRMATION_GRANTED: 'agent.confirmation.granted',
  AGENT_CONFIRMATION_DENIED: 'agent.confirmation.denied',

  // Permission events (Epic 03)
  PERMISSION_ROLE_CHANGED: 'permission.role.changed',
  PERMISSION_MODULE_OVERRIDE_CHANGED: 'permission.module_override.changed',

  // CRM events (for future use)
  CRM_CONTACT_CREATED: 'crm.contact.created',
  CRM_CONTACT_UPDATED: 'crm.contact.updated',
  CRM_CONTACT_DELETED: 'crm.contact.deleted',

  // Content events (for future use)
  CONTENT_ARTICLE_CREATED: 'content.article.created',
  CONTENT_ARTICLE_PUBLISHED: 'content.article.published',
  CONTENT_ARTICLE_SCHEDULED: 'content.article.scheduled',
  CONTENT_ARTICLE_UNPUBLISHED: 'content.article.unpublished',
} as const;

/**
 * Event type union
 */
export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// ============================================
// Typed Event Payloads
// ============================================

/**
 * Approval event payloads
 */
export interface ApprovalRequestedPayload {
  approvalId: string;
  type: string;
  title: string;
  confidenceScore: number;
  recommendation: 'approve' | 'review' | 'full_review';
  assignedToId?: string;
  dueAt: string;
  sourceModule?: string;
  sourceId?: string;
}

export interface ApprovalDecisionPayload {
  approvalId: string;
  type: string;
  title: string;
  decision: 'approved' | 'rejected' | 'auto_approved';
  decidedById?: string;
  decisionNotes?: string;
  confidenceScore: number;
}

export interface ApprovalEscalatedPayload {
  approvalId: string;
  type: string;
  title: string;
  escalatedFromId?: string;
  escalatedToId: string;
  reason: string;
  originalDueAt: string;
  newDueAt: string;
}

export interface ApprovalExpiredPayload {
  approvalId: string;
  type: string;
  title: string;
  dueAt: string;
  assignedToId?: string;
}

/**
 * Agent event payloads
 */
export interface AgentRunStartedPayload {
  runId: string;
  agentId: string;
  agentName: string;
  input: Record<string, unknown>;
  triggeredBy: 'user' | 'system' | 'schedule';
}

export interface AgentRunCompletedPayload {
  runId: string;
  agentId: string;
  agentName: string;
  output: Record<string, unknown>;
  durationMs: number;
  tokensUsed?: number;
}

export interface AgentRunFailedPayload {
  runId: string;
  agentId: string;
  agentName: string;
  error: string;
  errorCode?: string;
  durationMs: number;
}

export interface AgentConfirmationPayload {
  runId: string;
  agentId: string;
  confirmationId: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  message: string;
}

/**
 * Typed event factory - creates properly typed events
 */
export function createEvent<T extends Record<string, unknown>>(
  type: EventType,
  data: T,
  context: {
    tenantId: string;
    userId: string;
    correlationId?: string;
    source?: string;
  }
): BaseEvent {
  return {
    id:
      typeof globalThis !== 'undefined' &&
      globalThis.crypto &&
      typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    source: context.source ?? 'platform',
    timestamp: new Date().toISOString(),
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    version: '1.0',
    data,
  };
}
