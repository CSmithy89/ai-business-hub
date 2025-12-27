/**
 * API Scopes for External API Authentication
 * Used with API keys to control access to different parts of the platform
 */

export const API_SCOPES = {
  // PM Scopes
  PM_READ: 'pm:read',
  PM_WRITE: 'pm:write',
  PM_ADMIN: 'pm:admin',

  // KB Scopes
  KB_READ: 'kb:read',
  KB_WRITE: 'kb:write',
  KB_ADMIN: 'kb:admin',

  // Webhook Scopes
  WEBHOOK_READ: 'webhook:read',
  WEBHOOK_WRITE: 'webhook:write',
} as const

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES]

/** Array of all valid API scopes for runtime validation */
export const API_SCOPE_VALUES = Object.values(API_SCOPES) as readonly ApiScope[]

/**
 * Webhook event types that can be subscribed to
 */
export const WEBHOOK_EVENT_TYPES = {
  // Project events
  PM_PROJECT_CREATED: 'pm.project.created',
  PM_PROJECT_UPDATED: 'pm.project.updated',
  PM_PROJECT_DELETED: 'pm.project.deleted',

  // Task events
  PM_TASK_CREATED: 'pm.task.created',
  PM_TASK_UPDATED: 'pm.task.updated',
  PM_TASK_STATUS_CHANGED: 'pm.task.status_changed',
  PM_TASK_ASSIGNED: 'pm.task.assigned',
  PM_TASK_COMPLETED: 'pm.task.completed',
  PM_TASK_DELETED: 'pm.task.deleted',

  // Phase events
  PM_PHASE_CREATED: 'pm.phase.created',
  PM_PHASE_UPDATED: 'pm.phase.updated',
  PM_PHASE_TRANSITIONED: 'pm.phase.transitioned',

  // Team events
  PM_TEAM_MEMBER_ADDED: 'pm.team.member_added',
  PM_TEAM_MEMBER_UPDATED: 'pm.team.member_updated',
  PM_TEAM_MEMBER_REMOVED: 'pm.team.member_removed',

  // Checkpoint events
  PM_CHECKPOINT_CREATED: 'pm.checkpoint.created',
  PM_CHECKPOINT_COMPLETED: 'pm.checkpoint.completed',

  // KB events
  KB_PAGE_CREATED: 'kb.page.created',
  KB_PAGE_UPDATED: 'kb.page.updated',
  KB_PAGE_DELETED: 'kb.page.deleted',
} as const

export type WebhookEventType =
  (typeof WEBHOOK_EVENT_TYPES)[keyof typeof WEBHOOK_EVENT_TYPES]

/** Array of all valid webhook event types for runtime validation */
export const WEBHOOK_EVENT_TYPE_VALUES = Object.values(
  WEBHOOK_EVENT_TYPES
) as readonly WebhookEventType[]

export interface ApiKeyPermissions {
  scopes: ApiScope[]
  rateLimit?: number // Requests per hour (default: 1000)
}

/**
 * API Key list item returned from the API
 * Note: permissions.scopes is the primary data; rateLimit is a separate top-level field
 */
export interface ApiKeyListItem {
  id: string
  name: string
  keyPrefix: string
  permissions: {
    scopes: ApiScope[]
  }
  rateLimit: number
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    email: string
  }
}
