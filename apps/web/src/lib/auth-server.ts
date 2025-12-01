/**
 * Server-side authentication utilities
 * For use in API routes and server components
 */

import { headers } from 'next/headers'
import { auth } from './auth'
import { prisma } from '@hyvve/db'

/**
 * Helper to extract activeWorkspaceId from session with proper typing
 */
function getActiveWorkspaceId(session: unknown): string | null {
  const sessionObj = session as Record<string, unknown>
  const workspaceId = sessionObj?.activeWorkspaceId
  return typeof workspaceId === 'string' ? workspaceId : null
}

/**
 * Session data returned from getSession
 */
export interface ServerSession {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    emailVerified: boolean
  }
  session: {
    id: string
    token: string
    expiresAt: Date
    activeWorkspaceId: string | null
  }
}

/**
 * Get the current session from server context
 * Use this in API routes and server components
 *
 * @returns Session data or null if not authenticated
 */
export async function getSession(): Promise<ServerSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user || !session?.session) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        emailVerified: session.user.emailVerified,
      },
      session: {
        id: session.session.id,
        token: session.session.token,
        expiresAt: session.session.expiresAt,
        activeWorkspaceId: getActiveWorkspaceId(session.session),
      },
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes that require authentication
 *
 * @returns Session data
 * @throws Error with status 401 if not authenticated
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized', { cause: { status: 401 } })
  }

  return session
}

/**
 * Update the active workspace ID in the user's session
 *
 * @param sessionId - The session ID to update
 * @param workspaceId - The new active workspace ID
 */
export async function updateSessionWorkspace(
  sessionId: string,
  workspaceId: string
): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { activeWorkspaceId: workspaceId },
    })
  } catch (error) {
    console.error('Error updating session workspace:', error)
    throw new Error('Failed to update session workspace')
  }
}

/**
 * Clear the active workspace from the user's session
 *
 * @param sessionId - The session ID to update
 */
export async function clearSessionWorkspace(sessionId: string): Promise<void> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { activeWorkspaceId: null },
    })
  } catch (error) {
    console.error('Error clearing session workspace:', error)
    throw new Error('Failed to clear session workspace')
  }
}
