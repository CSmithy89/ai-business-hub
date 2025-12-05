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
  const sessionCookie = cookies.find((c) =>
    c.trim().startsWith('hyvve.session_token=')
  )

  if (!sessionCookie) return undefined

  return sessionCookie.split('=')[1]
}

/**
 * Request magic link to be sent to email
 *
 * @param email - Email address to send magic link
 * @param callbackURL - URL to redirect after successful sign-in (default: /dashboard)
 * @returns Promise with success/error status
 */
export async function sendMagicLink(data: {
  email: string
  callbackURL?: string
}) {
  return authClient.signIn.magicLink({
    email: data.email,
    callbackURL: data.callbackURL || '/dashboard',
  })
}
