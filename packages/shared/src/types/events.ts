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

  // Approval events
  APPROVAL_ITEM_CREATED: 'approval.item.created',
  APPROVAL_ITEM_APPROVED: 'approval.item.approved',
  APPROVAL_ITEM_REJECTED: 'approval.item.rejected',

  // CRM events (for future use)
  CRM_CONTACT_CREATED: 'crm.contact.created',
  CRM_CONTACT_UPDATED: 'crm.contact.updated',

  // Content events (for future use)
  CONTENT_ARTICLE_PUBLISHED: 'content.article.published',
  CONTENT_ARTICLE_SCHEDULED: 'content.article.scheduled',
} as const;

/**
 * Event type union
 */
export type EventType = typeof EventTypes[keyof typeof EventTypes];
