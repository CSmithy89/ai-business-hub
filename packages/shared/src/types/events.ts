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

  // AI Provider token limit events (Epic 06)
  TOKEN_LIMIT_WARNING: 'ai.token.limit_warning',
  TOKEN_LIMIT_EXCEEDED: 'ai.token.limit_exceeded',

  // PM events (bm-pm)
  PM_PROJECT_CREATED: 'pm.project.created',
  PM_PROJECT_UPDATED: 'pm.project.updated',
  PM_PROJECT_DELETED: 'pm.project.deleted',

  PM_PHASE_CREATED: 'pm.phase.created',
  PM_PHASE_UPDATED: 'pm.phase.updated',
  PM_PHASE_TRANSITIONED: 'pm.phase.transitioned',

  PM_TEAM_MEMBER_ADDED: 'pm.team.member_added',
  PM_TEAM_MEMBER_UPDATED: 'pm.team.member_updated',
  PM_TEAM_MEMBER_REMOVED: 'pm.team.member_removed',

  // KB events (bm-pm Knowledge Base)
  KB_PAGE_CREATED: 'kb.page.created',
  KB_PAGE_UPDATED: 'kb.page.updated',
  KB_PAGE_DELETED: 'kb.page.deleted',
  KB_PAGE_RESTORED: 'kb.page.restored',
  KB_PAGE_MOVED: 'kb.page.moved',
  KB_PAGE_LINKED_TO_PROJECT: 'kb.page.linked_to_project',
  KB_PAGE_UNLINKED_FROM_PROJECT: 'kb.page.unlinked_from_project',
  KB_PAGE_FAVORITED: 'kb.page.favorited',
  KB_PAGE_UNFAVORITED: 'kb.page.unfavorited',
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
 * Token limit event payloads (Epic 06)
 */
export interface TokenLimitWarningPayload {
  providerId: string;
  provider: string;
  tokensUsed: number;
  maxTokens: number;
  percentageUsed: number;
  threshold: number; // e.g., 80
}

export interface TokenLimitExceededPayload {
  providerId: string;
  provider: string;
  tokensUsed: number;
  maxTokens: number;
  requestedTokens?: number;
}

/**
 * PM event payloads
 */
export interface PMProjectPayload {
  projectId: string;
  name: string;
  slug: string;
}

export interface PMPhasePayload {
  phaseId: string;
  projectId: string;
  name: string;
  type: string;
}

export interface PMTeamMemberPayload {
  projectId: string;
  userId: string;
  role: string;
}

/**
 * KB event payloads
 */
export interface KBPageCreatedPayload {
  pageId: string;
  workspaceId: string;
  title: string;
  slug: string;
  ownerId: string;
  parentId: string | null;
}

export interface KBPageUpdatedPayload {
  pageId: string;
  workspaceId: string;
  title: string;
  slug: string;
}

export interface KBPageDeletedPayload {
  pageId: string;
  workspaceId: string;
  title: string;
  slug: string;
}

export interface KBPageRestoredPayload {
  pageId: string;
  workspaceId: string;
  title: string;
  slug: string;
}

export interface KBPageMovedPayload {
  pageId: string;
  workspaceId: string;
  oldParentId: string | null;
  newParentId: string | null;
}

export interface KBPageLinkedPayload {
  pageId: string;
  projectId: string;
  workspaceId: string;
  isPrimary: boolean;
  linkedBy: string;
}

export interface KBPageUnlinkedPayload {
  pageId: string;
  projectId: string;
  workspaceId: string;
}

export interface KBPageFavoritedPayload {
  pageId: string;
  workspaceId: string;
  userId: string;
}

export interface KBPageUnfavoritedPayload {
  pageId: string;
  workspaceId: string;
  userId: string;
}

/**
 * Event payload type mapping for type-safe event creation
 * Maps event types to their corresponding payload types
 */
export type EventPayloadMap = {
  // Approval events
  [EventTypes.APPROVAL_REQUESTED]: ApprovalRequestedPayload;
  [EventTypes.APPROVAL_CREATED]: ApprovalRequestedPayload;
  [EventTypes.APPROVAL_APPROVED]: ApprovalDecisionPayload;
  [EventTypes.APPROVAL_REJECTED]: ApprovalDecisionPayload;
  [EventTypes.APPROVAL_AUTO_APPROVED]: ApprovalDecisionPayload;
  [EventTypes.APPROVAL_ESCALATED]: ApprovalEscalatedPayload;
  [EventTypes.APPROVAL_EXPIRED]: ApprovalExpiredPayload;

  // Agent events
  [EventTypes.AGENT_RUN_STARTED]: AgentRunStartedPayload;
  [EventTypes.AGENT_RUN_COMPLETED]: AgentRunCompletedPayload;
  [EventTypes.AGENT_RUN_FAILED]: AgentRunFailedPayload;
  [EventTypes.AGENT_CONFIRMATION_REQUESTED]: AgentConfirmationPayload;
  [EventTypes.AGENT_CONFIRMATION_GRANTED]: AgentConfirmationPayload;
  [EventTypes.AGENT_CONFIRMATION_DENIED]: AgentConfirmationPayload;

  // PM events
  [EventTypes.PM_PROJECT_CREATED]: PMProjectPayload;
  [EventTypes.PM_PROJECT_UPDATED]: PMProjectPayload;
  [EventTypes.PM_PROJECT_DELETED]: PMProjectPayload;
  [EventTypes.PM_PHASE_CREATED]: PMPhasePayload;
  [EventTypes.PM_PHASE_UPDATED]: PMPhasePayload;
  [EventTypes.PM_PHASE_TRANSITIONED]: PMPhasePayload;
  [EventTypes.PM_TEAM_MEMBER_ADDED]: PMTeamMemberPayload;
  [EventTypes.PM_TEAM_MEMBER_UPDATED]: PMTeamMemberPayload;
  [EventTypes.PM_TEAM_MEMBER_REMOVED]: PMTeamMemberPayload;

  // KB events
  [EventTypes.KB_PAGE_CREATED]: KBPageCreatedPayload;
  [EventTypes.KB_PAGE_UPDATED]: KBPageUpdatedPayload;
  [EventTypes.KB_PAGE_DELETED]: KBPageDeletedPayload;
  [EventTypes.KB_PAGE_RESTORED]: KBPageRestoredPayload;
  [EventTypes.KB_PAGE_MOVED]: KBPageMovedPayload;
  [EventTypes.KB_PAGE_LINKED_TO_PROJECT]: KBPageLinkedPayload;
  [EventTypes.KB_PAGE_UNLINKED_FROM_PROJECT]: KBPageUnlinkedPayload;
  [EventTypes.KB_PAGE_FAVORITED]: KBPageFavoritedPayload;
  [EventTypes.KB_PAGE_UNFAVORITED]: KBPageUnfavoritedPayload;

  // Generic fallback for events without specific payloads
  [EventTypes.AUTH_USER_CREATED]: Record<string, unknown>;
  [EventTypes.AUTH_USER_UPDATED]: Record<string, unknown>;
  [EventTypes.AUTH_SESSION_CREATED]: Record<string, unknown>;
  [EventTypes.AUTH_SESSION_EXPIRED]: Record<string, unknown>;
  [EventTypes.WORKSPACE_CREATED]: Record<string, unknown>;
  [EventTypes.WORKSPACE_UPDATED]: Record<string, unknown>;
  [EventTypes.WORKSPACE_MEMBER_ADDED]: Record<string, unknown>;
  [EventTypes.WORKSPACE_MEMBER_REMOVED]: Record<string, unknown>;
  [EventTypes.WORKSPACE_MEMBER_ROLE_CHANGED]: Record<string, unknown>;
  [EventTypes.PERMISSION_ROLE_CHANGED]: Record<string, unknown>;
  [EventTypes.PERMISSION_MODULE_OVERRIDE_CHANGED]: Record<string, unknown>;
  [EventTypes.CRM_CONTACT_CREATED]: Record<string, unknown>;
  [EventTypes.CRM_CONTACT_UPDATED]: Record<string, unknown>;
  [EventTypes.CRM_CONTACT_DELETED]: Record<string, unknown>;
  [EventTypes.CONTENT_ARTICLE_CREATED]: Record<string, unknown>;
  [EventTypes.CONTENT_ARTICLE_PUBLISHED]: Record<string, unknown>;
  [EventTypes.CONTENT_ARTICLE_SCHEDULED]: Record<string, unknown>;
  [EventTypes.CONTENT_ARTICLE_UNPUBLISHED]: Record<string, unknown>;

  // Token limit events
  [EventTypes.TOKEN_LIMIT_WARNING]: TokenLimitWarningPayload;
  [EventTypes.TOKEN_LIMIT_EXCEEDED]: TokenLimitExceededPayload;
};

/**
 * Type-safe event factory - creates properly typed events
 * Ensures payload matches the expected type for the given event type
 */
export function createEvent<K extends keyof EventPayloadMap>(
  type: K,
  data: EventPayloadMap[K],
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
    data: data as Record<string, unknown>,
  };
}
