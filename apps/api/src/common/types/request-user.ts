/**
 * RequestUser - User object attached to request by AuthGuard
 *
 * This type represents the authenticated user data extracted from
 * the session and attached to the request context.
 *
 * @see AuthGuard for the source of this data
 */
export interface RequestUser {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: boolean
  sessionId: string
  activeWorkspaceId: string | null
}

/**
 * ApiKeyInfo - API key data attached to request by ApiKeyGuard
 */
export interface ApiKeyInfo {
  id: string
  name: string
  workspaceId: string
  createdById: string
  permissions: {
    scopes: string[]
    rateLimit?: number
  }
}

/**
 * ApiAuthenticatedRequest - Request with API key context
 *
 * Used by API controllers that are protected by ApiKeyGuard
 * @see ApiKeyGuard for the source of this data
 */
export interface ApiAuthenticatedRequest {
  workspaceId: string
  apiKey: ApiKeyInfo
}
