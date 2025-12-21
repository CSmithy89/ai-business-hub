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
