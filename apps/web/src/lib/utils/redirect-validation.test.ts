/**
 * Redirect Validation Utility Tests
 *
 * Tests for open redirect prevention and URL validation.
 * These tests verify security-critical functionality.
 *
 * Story: 15.15 - Security Enhancement
 */

import { describe, it, expect } from 'vitest'
import { isAllowedRedirect, getSafeRedirectUrl } from './redirect-validation'

describe('isAllowedRedirect', () => {
  describe('valid internal paths', () => {
    it('should allow /businesses path', () => {
      expect(isAllowedRedirect('/businesses')).toBe(true)
    })

    it('should allow /businesses with subpath', () => {
      expect(isAllowedRedirect('/businesses/123')).toBe(true)
      expect(isAllowedRedirect('/businesses/123/settings')).toBe(true)
    })

    it('should allow /dashboard path', () => {
      expect(isAllowedRedirect('/dashboard')).toBe(true)
      expect(isAllowedRedirect('/dashboard/123')).toBe(true)
    })

    it('should allow /agents path', () => {
      expect(isAllowedRedirect('/agents')).toBe(true)
      expect(isAllowedRedirect('/agents/hub')).toBe(true)
    })

    it('should allow /approvals path', () => {
      expect(isAllowedRedirect('/approvals')).toBe(true)
      expect(isAllowedRedirect('/approvals/pending')).toBe(true)
    })

    it('should allow /settings path', () => {
      expect(isAllowedRedirect('/settings')).toBe(true)
      expect(isAllowedRedirect('/settings/profile')).toBe(true)
    })

    it('should allow /onboarding path', () => {
      expect(isAllowedRedirect('/onboarding')).toBe(true)
      expect(isAllowedRedirect('/onboarding/wizard')).toBe(true)
    })

    it('should allow /profile path', () => {
      expect(isAllowedRedirect('/profile')).toBe(true)
      expect(isAllowedRedirect('/profile/edit')).toBe(true)
    })

    it('should handle paths with query strings', () => {
      // Query strings are allowed when they follow a valid path with subpath
      // /businesses?tab passes because it matches "/businesses" exactly or "/businesses/" prefix
      // Since "?tab=active" doesn't start with "/", it's not a subpath match
      expect(isAllowedRedirect('/businesses?tab=active')).toBe(false)
      // But /dashboard/123?view works because it matches "/dashboard/" prefix
      expect(isAllowedRedirect('/dashboard/123?view=overview')).toBe(true)
    })
  })

  describe('blocked paths', () => {
    it('should block non-allowlisted paths', () => {
      expect(isAllowedRedirect('/admin')).toBe(false)
      expect(isAllowedRedirect('/api/secret')).toBe(false)
      expect(isAllowedRedirect('/internal')).toBe(false)
    })

    it('should block root path', () => {
      expect(isAllowedRedirect('/')).toBe(false)
    })

    it('should block similar but not exact prefix matches', () => {
      // /business is not the same as /businesses
      expect(isAllowedRedirect('/business')).toBe(false)
      expect(isAllowedRedirect('/setting')).toBe(false)
    })
  })

  describe('external URL attacks', () => {
    it('should block absolute HTTP URLs', () => {
      expect(isAllowedRedirect('http://evil.com')).toBe(false)
      expect(isAllowedRedirect('http://evil.com/businesses')).toBe(false)
    })

    it('should block absolute HTTPS URLs', () => {
      expect(isAllowedRedirect('https://evil.com')).toBe(false)
      expect(isAllowedRedirect('https://evil.com/businesses')).toBe(false)
    })

    it('should block protocol-relative URLs', () => {
      expect(isAllowedRedirect('//evil.com')).toBe(false)
      expect(isAllowedRedirect('//evil.com/businesses')).toBe(false)
    })

    it('should block URLs with different protocols', () => {
      expect(isAllowedRedirect('ftp://evil.com')).toBe(false)
      expect(isAllowedRedirect('file:///etc/passwd')).toBe(false)
    })
  })

  describe('XSS and injection attacks', () => {
    it('should block javascript: URLs', () => {
      expect(isAllowedRedirect('javascript:alert(1)')).toBe(false)
      expect(isAllowedRedirect('/businesses/javascript:alert(1)')).toBe(false)
    })

    it('should block javascript: with case variations', () => {
      expect(isAllowedRedirect('JAVASCRIPT:alert(1)')).toBe(false)
      expect(isAllowedRedirect('Javascript:alert(1)')).toBe(false)
      expect(isAllowedRedirect('jAvAsCrIpT:alert(1)')).toBe(false)
    })

    it('should block data: URLs', () => {
      expect(isAllowedRedirect('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isAllowedRedirect('/businesses/data:text/html')).toBe(false)
    })

    it('should block vbscript: URLs', () => {
      expect(isAllowedRedirect('vbscript:msgbox(1)')).toBe(false)
      expect(isAllowedRedirect('VBSCRIPT:msgbox(1)')).toBe(false)
    })
  })

  describe('encoding bypass attempts', () => {
    it('should block encoded slashes', () => {
      expect(isAllowedRedirect('/businesses%2f../admin')).toBe(false)
      expect(isAllowedRedirect('/businesses%2F../admin')).toBe(false)
    })

    it('should block encoded backslashes', () => {
      expect(isAllowedRedirect('/businesses%5c../admin')).toBe(false)
      expect(isAllowedRedirect('/businesses%5C../admin')).toBe(false)
    })

    it('should block null byte injection', () => {
      expect(isAllowedRedirect('/businesses%00admin')).toBe(false)
    })

    it('should block backslashes', () => {
      expect(isAllowedRedirect('/businesses\\..\\admin')).toBe(false)
      expect(isAllowedRedirect('\\\\evil.com')).toBe(false)
    })
  })

  describe('null and edge cases', () => {
    it('should reject null', () => {
      expect(isAllowedRedirect(null)).toBe(false)
    })

    it('should reject undefined', () => {
      expect(isAllowedRedirect(undefined)).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isAllowedRedirect('')).toBe(false)
    })

    it('should reject whitespace only', () => {
      expect(isAllowedRedirect('   ')).toBe(false)
    })

    it('should handle leading/trailing whitespace', () => {
      expect(isAllowedRedirect('  /businesses  ')).toBe(true)
      expect(isAllowedRedirect('\n/dashboard\t')).toBe(true)
    })
  })

  describe('path traversal attacks', () => {
    it('should handle double dots in paths (URL will be normalized by browser)', () => {
      // These are allowed because they start with valid prefix
      // The browser will normalize them before the server sees them
      expect(isAllowedRedirect('/businesses/../businesses')).toBe(true)
    })

    it('should block paths trying to escape via encoding', () => {
      expect(isAllowedRedirect('/businesses%2f..%2fadmin')).toBe(false)
    })
  })
})

describe('getSafeRedirectUrl', () => {
  describe('valid URLs', () => {
    it('should return valid URL unchanged', () => {
      expect(getSafeRedirectUrl('/businesses')).toBe('/businesses')
      expect(getSafeRedirectUrl('/dashboard/123')).toBe('/dashboard/123')
    })

    it('should trim whitespace from valid URLs', () => {
      expect(getSafeRedirectUrl('  /businesses  ')).toBe('/businesses')
    })
  })

  describe('invalid URLs with default fallback', () => {
    it('should return /businesses for invalid URLs', () => {
      expect(getSafeRedirectUrl('https://evil.com')).toBe('/businesses')
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/businesses')
      expect(getSafeRedirectUrl(null)).toBe('/businesses')
      expect(getSafeRedirectUrl(undefined)).toBe('/businesses')
      expect(getSafeRedirectUrl('')).toBe('/businesses')
    })
  })

  describe('custom fallback', () => {
    it('should return custom fallback for invalid URLs', () => {
      expect(getSafeRedirectUrl('https://evil.com', '/dashboard')).toBe('/dashboard')
      expect(getSafeRedirectUrl(null, '/agents')).toBe('/agents')
    })

    it('should use custom fallback when URL is empty', () => {
      expect(getSafeRedirectUrl('', '/settings')).toBe('/settings')
    })
  })
})

describe('Security Attack Scenarios', () => {
  const attackPayloads = [
    // Protocol attacks
    'http://evil.com',
    'https://evil.com',
    '//evil.com',
    '///evil.com',
    'javascript:alert(document.cookie)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',

    // Encoding attacks
    '/businesses%2f..%2fadmin',
    '/businesses%5c..%5cadmin',
    '/businesses%00admin',
    '/%2fbusinesses',

    // Backslash attacks
    '\\\\evil.com',
    '/businesses\\..\\admin',

    // Whitespace attacks
    '   javascript:alert(1)',
    'javascript\t:alert(1)',
    'java\nscript:alert(1)',

    // Case variation attacks
    'HTTPS://evil.com',
    'HTTP://evil.com',
    'JaVaScRiPt:alert(1)',

    // Mixed attacks
    '//evil.com/businesses',
    'https://evil.com?redirect=/businesses',
    '/businesses@evil.com',
  ]

  it('should block all attack payloads', () => {
    for (const payload of attackPayloads) {
      expect(isAllowedRedirect(payload)).toBe(false)
    }
  })

  it('should return safe fallback for all attack payloads', () => {
    for (const payload of attackPayloads) {
      expect(getSafeRedirectUrl(payload)).toBe('/businesses')
    }
  })
})
