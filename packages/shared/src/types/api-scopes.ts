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
