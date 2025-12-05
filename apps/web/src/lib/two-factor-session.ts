/**
 * Two-Factor Authentication Setup Session Storage
 * Stores TOTP secrets server-side during setup process
 * In production, this should use Redis for distributed systems
 */

import { checkTwoFactorRateLimit } from '@/lib/utils/rate-limit'

interface SetupSession {
  secret: string
  userId: string
  createdAt: number
  verificationAttempts: number
  lastAttemptAt: number
}

// In-memory storage for development
// In production, replace with Redis for scalability
const setupSessions = new Map<string, SetupSession>()

const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const MAX_SESSIONS = 10000 // Prevent unbounded map growth

/**
 * Create a new 2FA setup session
 */
export function createSetupSession(userId: string, secret: string): string {
  // Ensure capacity before adding
  if (setupSessions.size >= MAX_SESSIONS) {
    cleanupExpiredSessions()
  }
  const sessionId = generateSessionId()
  setupSessions.set(sessionId, {
    secret,
    userId,
    createdAt: Date.now(),
    verificationAttempts: 0,
    lastAttemptAt: 0,
  })
  return sessionId
}

/**
 * Get a setup session
 */
export function getSetupSession(sessionId: string): SetupSession | null {
  const session = setupSessions.get(sessionId)
  if (!session) return null

  // Check if session has expired
  if (Date.now() - session.createdAt > SESSION_TIMEOUT) {
    setupSessions.delete(sessionId)
    return null
  }

  return session
}

/**
 * Delete a setup session
 */
export function deleteSetupSession(sessionId: string): void {
  setupSessions.delete(sessionId)
}

/**
 * Record a verification attempt and check rate limit
 * Uses the unified rate limiter (Redis in production, in-memory fallback)
 */
export async function recordVerificationAttempt(sessionId: string): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const session = setupSessions.get(sessionId)
  if (!session) {
    return { allowed: false, remainingAttempts: 0 }
  }

  // Check rate limit using unified rate limiter
  const rateLimitResult = await checkTwoFactorRateLimit(session.userId)
  const now = Date.now()

  if (rateLimitResult.isRateLimited) {
    return { allowed: false, remainingAttempts: 0 }
  }

  // Update session
  session.verificationAttempts++
  session.lastAttemptAt = now

  return {
    allowed: true,
    remainingAttempts: rateLimitResult.remaining,
  }
}

/**
 * Clean up expired sessions and enforce max entries (call periodically)
 * Note: Rate limiting is now handled by the unified rate limiter in @/lib/utils/rate-limit
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sessionId, session] of setupSessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      setupSessions.delete(sessionId)
    }
  }

  // Enforce max entries for sessions
  if (setupSessions.size > MAX_SESSIONS) {
    const entries = Array.from(setupSessions.entries())
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt) // Oldest first
    const toRemove = entries.slice(0, setupSessions.size - MAX_SESSIONS)
    for (const [key] of toRemove) {
      setupSessions.delete(key)
    }
  }
}

/**
 * Generate a secure session ID
 */
function generateSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Cleanup expired sessions every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000)
