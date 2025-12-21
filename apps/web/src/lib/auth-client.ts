'use client'

import { createAuthClient } from 'better-auth/react'
import { magicLinkClient } from 'better-auth/client/plugins'

/**
 * Better Auth client for React components
 *
 * This client provides type-safe methods for authentication:
 * - signUp.email() - Register with email/password
 * - signIn.email() - Sign in with email/password
 * - signIn.social() - OAuth sign in
 * - signIn.magicLink() - Request magic link
 * - signOut() - Sign out
 * - useSession() - Get current session
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [
    magicLinkClient(),
  ],
})

/**
 * Sign up with email and password
 *
 * @param data - Registration data
 * @returns Promise with user data or error
 */
export async function signUp(data: {
  email: string
  password: string
  name: string
}) {
  return authClient.signUp.email({
    email: data.email,
    password: data.password,
    name: data.name,
  })
}

/**
 * Sign in with email and password
 *
 * @param data - Sign in credentials
 * @returns Promise with session data or error
 */
export async function signIn(data: {
  email: string
  password: string
  rememberMe?: boolean
}) {
  return authClient.signIn.email({
    email: data.email,
    password: data.password,
    rememberMe: data.rememberMe,
  })
}

/**
 * Sign out current user
 */
export async function signOut() {
  return authClient.signOut()
}

/**
 * Get current session hook
 * Use in React components to access session data
 */
export const useSession = authClient.useSession

type SessionLike =
  | {
      token?: string
      accessToken?: string
      activeWorkspaceId?: string | null
      session?: {
        token?: string
        accessToken?: string
        activeWorkspaceId?: string | null
        session?: {
          token?: string
          accessToken?: string
          activeWorkspaceId?: string | null
        }
      }
    }
  | null
  | undefined

export function getSessionToken(session: unknown): string | undefined {
  const typed = session as SessionLike
  return (
    typed?.token ??
    typed?.accessToken ??
    typed?.session?.token ??
    typed?.session?.accessToken ??
    typed?.session?.session?.token ??
    typed?.session?.session?.accessToken ??
    undefined
  )
}

export function getActiveWorkspaceId(session: unknown): string | undefined {
  const typed = session as SessionLike
  return (
    typed?.session?.activeWorkspaceId ??
    typed?.activeWorkspaceId ??
    typed?.session?.session?.activeWorkspaceId ??
    undefined
  )
}

/**
 * Session interface from better-auth
 */
export interface Session {
  id: string
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  activeWorkspaceId?: string | null
  createdAt: Date
  updatedAt: Date
}

/**
 * List all active sessions for the current user
 *
 * @returns Promise with array of session objects
 */
export async function listSessions(): Promise<Session[]> {
  try {
    const response = await authClient.listSessions()
    return response.data || []
  } catch (error) {
    console.error('Error listing sessions:', error)
    throw error
  }
}

/**
 * Revoke a specific session by token
 *
 * @param token - Session token to revoke
 * @returns Promise with revocation result
 */
export async function revokeSession({ token }: { token: string }) {
  try {
    return await authClient.revokeSession({ token })
  } catch (error) {
    console.error('Error revoking session:', error)
    throw error
  }
}

/**
 * Revoke all sessions except the current one
 *
 * @returns Promise with number of revoked sessions
 */
export async function revokeOtherSessions() {
  try {
    return await authClient.revokeOtherSessions()
  } catch (error) {
    console.error('Error revoking other sessions:', error)
    throw error
  }
}

/**
 * Get current session token from cookies
 * Used to identify which session is the current one
 *
 * @returns Current session token or undefined
 */
export function getCurrentSessionToken(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const cookies = document.cookie.split(';')

  const getCookie = (name: string): string | undefined => {
    const match = cookies.find((c) => c.trim().startsWith(`${name}=`))
    if (!match) return undefined
    const rawValue = match.trim().slice(name.length + 1)
    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }

  // Prefer session data cookie (non-HttpOnly) when present.
  // Better Auth commonly stores the HttpOnly token cookie, so reading
  // `hyvve.session_token` via `document.cookie` may fail.
  const sessionData = getCookie('hyvve.session_data')
  if (sessionData) {
    try {
      const normalized = sessionData.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
      const json = JSON.parse(atob(padded)) as {
        session?: { session?: { token?: string }; token?: string }
      }
      const token = json.session?.session?.token ?? json.session?.token
      if (token) return token
    } catch {
      // ignore and fall through
    }
  }

  // Fallback: direct token cookie (may be HttpOnly and unavailable client-side)
  return getCookie('hyvve.session_token')
}

/**
 * Request magic link to be sent to email
 *
 * @param email - Email address to send magic link
 * @param callbackURL - URL to redirect after successful sign-in (default: /businesses)
 * @returns Promise with success/error status
 *
 * Story: 15.15 - Update Sign-In Flow Redirect Logic
 */
export async function sendMagicLink(data: {
  email: string
  callbackURL?: string
}) {
  return authClient.signIn.magicLink({
    email: data.email,
    callbackURL: data.callbackURL || '/businesses',
  })
}
