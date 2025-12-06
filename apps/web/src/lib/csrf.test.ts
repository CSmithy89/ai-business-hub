/**
 * CSRF Protection Tests
 *
 * Story: 10.6 - CSRF Protection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  generateCSRFToken,
  verifyCSRFToken,
  isCSRFExemptRoute,
  isSafeMethod,
  generateRandomToken,
  CSRF_EXEMPT_ROUTES,
} from './csrf'

describe('CSRF Protection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.BETTER_AUTH_SECRET = 'test-secret-that-is-at-least-32-characters-long'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('generateCSRFToken', () => {
    it('should generate a token for valid session ID', () => {
      const sessionId = 'test-session-id-123'
      const token = generateCSRFToken(sessionId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // SHA-256 hex is 64 chars
    })

    it('should generate deterministic tokens', () => {
      const sessionId = 'test-session-id-123'
      const token1 = generateCSRFToken(sessionId)
      const token2 = generateCSRFToken(sessionId)

      expect(token1).toBe(token2)
    })

    it('should generate different tokens for different sessions', () => {
      const token1 = generateCSRFToken('session-1')
      const token2 = generateCSRFToken('session-2')

      expect(token1).not.toBe(token2)
    })

    it('should throw error for empty session ID', () => {
      expect(() => generateCSRFToken('')).toThrow('Session ID is required')
    })

    it('should throw error when no secret is configured', () => {
      delete process.env.BETTER_AUTH_SECRET
      delete process.env.CSRF_SECRET

      expect(() => generateCSRFToken('session-id')).toThrow(
        'CSRF protection requires CSRF_SECRET or BETTER_AUTH_SECRET'
      )
    })

    it('should use CSRF_SECRET when available', () => {
      process.env.CSRF_SECRET = 'different-csrf-secret-that-is-32-chars-long'

      const tokenWithCSRFSecret = generateCSRFToken('session-1')

      // Reset to auth secret
      delete process.env.CSRF_SECRET
      const tokenWithAuthSecret = generateCSRFToken('session-1')

      expect(tokenWithCSRFSecret).not.toBe(tokenWithAuthSecret)
    })
  })

  describe('verifyCSRFToken', () => {
    it('should return true for valid token', () => {
      const sessionId = 'test-session-id'
      const token = generateCSRFToken(sessionId)

      const isValid = verifyCSRFToken(token, sessionId)

      expect(isValid).toBe(true)
    })

    it('should return false for invalid token', () => {
      const sessionId = 'test-session-id'
      const invalidToken = 'invalid-token-that-does-not-match'

      const isValid = verifyCSRFToken(invalidToken, sessionId)

      expect(isValid).toBe(false)
    })

    it('should return false for wrong session ID', () => {
      const token = generateCSRFToken('session-1')

      const isValid = verifyCSRFToken(token, 'session-2')

      expect(isValid).toBe(false)
    })

    it('should return false for empty token', () => {
      expect(verifyCSRFToken('', 'session-id')).toBe(false)
    })

    it('should return false for empty session ID', () => {
      expect(verifyCSRFToken('some-token', '')).toBe(false)
    })

    it('should return false for null inputs', () => {
      expect(verifyCSRFToken(null as any, 'session-id')).toBe(false)
      expect(verifyCSRFToken('token', null as any)).toBe(false)
    })

    it('should use constant-time comparison (timing-safe)', () => {
      const sessionId = 'test-session'
      const validToken = generateCSRFToken(sessionId)

      // Create an almost-valid token (same length, different content)
      const almostValid = validToken.substring(0, 60) + 'xxxx'

      // Both should return false, but timing shouldn't leak info
      expect(verifyCSRFToken(almostValid, sessionId)).toBe(false)
      expect(verifyCSRFToken('completely-wrong', sessionId)).toBe(false)
    })
  })

  describe('generateRandomToken', () => {
    it('should generate a random token', () => {
      const token = generateRandomToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should generate unique tokens', () => {
      const token1 = generateRandomToken()
      const token2 = generateRandomToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('isSafeMethod', () => {
    it('should return true for GET', () => {
      expect(isSafeMethod('GET')).toBe(true)
      expect(isSafeMethod('get')).toBe(true)
    })

    it('should return true for HEAD', () => {
      expect(isSafeMethod('HEAD')).toBe(true)
      expect(isSafeMethod('head')).toBe(true)
    })

    it('should return true for OPTIONS', () => {
      expect(isSafeMethod('OPTIONS')).toBe(true)
      expect(isSafeMethod('options')).toBe(true)
    })

    it('should return false for POST', () => {
      expect(isSafeMethod('POST')).toBe(false)
    })

    it('should return false for PUT', () => {
      expect(isSafeMethod('PUT')).toBe(false)
    })

    it('should return false for DELETE', () => {
      expect(isSafeMethod('DELETE')).toBe(false)
    })

    it('should return false for PATCH', () => {
      expect(isSafeMethod('PATCH')).toBe(false)
    })
  })

  describe('isCSRFExemptRoute', () => {
    it('should return true for OAuth callback routes', () => {
      expect(isCSRFExemptRoute('/api/auth/callback')).toBe(true)
      expect(isCSRFExemptRoute('/api/auth/callback/google')).toBe(true)
      expect(isCSRFExemptRoute('/api/auth/callback/microsoft')).toBe(true)
    })

    it('should return true for webhook routes', () => {
      expect(isCSRFExemptRoute('/api/webhooks')).toBe(true)
      expect(isCSRFExemptRoute('/api/webhooks/stripe')).toBe(true)
    })

    it('should return true for CSRF token endpoint', () => {
      expect(isCSRFExemptRoute('/api/auth/csrf-token')).toBe(true)
    })

    it('should return true for better-auth routes', () => {
      expect(isCSRFExemptRoute('/api/auth/signin')).toBe(true)
      expect(isCSRFExemptRoute('/api/auth/signout')).toBe(true)
      expect(isCSRFExemptRoute('/api/auth/session')).toBe(true)
    })

    it('should return false for regular API routes', () => {
      expect(isCSRFExemptRoute('/api/businesses')).toBe(false)
      expect(isCSRFExemptRoute('/api/workspaces')).toBe(false)
      expect(isCSRFExemptRoute('/api/users')).toBe(false)
    })

    it('should return false for partial matches', () => {
      expect(isCSRFExemptRoute('/api/auth/custom')).toBe(false)
      expect(isCSRFExemptRoute('/api/webhook-test')).toBe(false)
    })
  })

  describe('CSRF_EXEMPT_ROUTES', () => {
    it('should include all required exempt routes', () => {
      const requiredRoutes = [
        '/api/auth/callback',
        '/api/webhooks',
        '/api/auth/csrf-token',
      ]

      requiredRoutes.forEach((route) => {
        expect(CSRF_EXEMPT_ROUTES).toContain(route)
      })
    })
  })
})
