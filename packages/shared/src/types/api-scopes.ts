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
