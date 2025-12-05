/**
 * Two-Factor Authentication Setup Session Storage
 * Stores TOTP secrets server-side during setup process
 * In production, this should use Redis for distributed systems
 */

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

// Rate limiting storage
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5
const MAX_SESSIONS = 10000 // Prevent unbounded map growth
const MAX_RATE_LIMIT_ENTRIES = 10000

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
 */
export function recordVerificationAttempt(sessionId: string): { allowed: boolean; remainingAttempts: number } {
  const session = setupSessions.get(sessionId)
  if (!session) {
    return { allowed: false, remainingAttempts: 0 }
  }

  // Check rate limit
  const rateLimit = rateLimitMap.get(session.userId)
  const now = Date.now()

  if (rateLimit) {
    // Reset if window has passed
    if (now > rateLimit.resetAt) {
      rateLimitMap.delete(session.userId)
    } else if (rateLimit.count >= MAX_ATTEMPTS) {
      return { allowed: false, remainingAttempts: 0 }
    }
  }

  // Update rate limit (with capacity check)
  if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES && !rateLimitMap.has(session.userId)) {
    cleanupExpiredSessions()
  }
  const currentLimit = rateLimitMap.get(session.userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW }
  currentLimit.count++
  rateLimitMap.set(session.userId, currentLimit)

  // Update session
  session.verificationAttempts++
  session.lastAttemptAt = now

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - currentLimit.count,
  }
}

/**
 * Clean up expired sessions and enforce max entries (call periodically)
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [sessionId, session] of setupSessions.entries()) {
    if (now - session.createdAt > SESSION_TIMEOUT) {
      setupSessions.delete(sessionId)
    }
  }

  // Clean up expired rate limits
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetAt) {
      rateLimitMap.delete(userId)
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

  // Enforce max entries for rate limits
  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    const entries = Array.from(rateLimitMap.entries())
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt) // Oldest first
    const toRemove = entries.slice(0, rateLimitMap.size - MAX_RATE_LIMIT_ENTRIES)
    for (const [key] of toRemove) {
      rateLimitMap.delete(key)
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
