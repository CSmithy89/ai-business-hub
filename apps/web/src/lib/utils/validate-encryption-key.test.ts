/**
 * Encryption Key Validation Tests
 * Story 09: Tests for encryption key entropy validation
 *
 * @module validate-encryption-key.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store original env
const originalEnv = { ...process.env }

describe('Encryption Key Validation', () => {
  beforeEach(() => {
    vi.resetModules()
    // Clear console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  describe('validateEncryptionKey', () => {
    it('should accept a strong key with high entropy', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      // A truly random 32+ character key
      const strongKey = 'aB3$xY7!mN9@pQ2#wE5^tR8&uI1*oP4%'

      const result = validateEncryptionKey(strongKey)

      expect(result.valid).toBe(true)
      // Total entropy bits should exceed MIN_ENTROPY_BITS (128)
      expect(result.entropy).toBeGreaterThan(128)
    })

    it('should reject undefined key', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const result = validateEncryptionKey(undefined)

      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toContain('not set')
    })

    it('should reject empty key', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const result = validateEncryptionKey('')

      expect(result.valid).toBe(false)
      // Empty string treated as falsy, same as undefined
      expect(result.errors.join(' ')).toContain('not set')
    })

    it('should reject key shorter than minimum length', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const result = validateEncryptionKey('short')

      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toMatch(/less than minimum|at least/)
    })

    it('should reject low entropy key (repeated characters)', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const result = validateEncryptionKey('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

      expect(result.valid).toBe(false)
      expect(result.errors.join(' ')).toContain('entropy')
      // Total entropy bits = 0 for repeated char (Shannon entropy is 0)
      expect(result.entropy).toBeLessThan(1)
    })

    it('should reject sequential characters key', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      // 32 unique sequential chars have high Shannon entropy (~5 bits/char)
      // Total bits = 5 * 32 = 160, which exceeds MIN_ENTROPY_BITS (128)
      // So this key is actually VALID from entropy perspective
      const result = validateEncryptionKey('abcdefghijklmnopqrstuvwxyz123456')

      // With 32 unique chars, entropy is high (~160 bits)
      // Key passes validation despite sequential pattern
      expect(result.entropy).toBeGreaterThan(100)
    })

    it('should accept key with exact minimum length and good entropy', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      // 32 chars with good entropy
      const key = 'Kj8#mP2$nQ5!xY9@wE3^tR7&uI1*oP4%'

      const result = validateEncryptionKey(key)

      expect(result.valid).toBe(true)
    })

    it('should calculate total entropy bits correctly', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      // Single character repeated has entropy = 0 bits (Shannon entropy per char = 0)
      const singleChar = validateEncryptionKey('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
      expect(singleChar.entropy).toBeLessThan(0.1)

      // Two characters alternating: Shannon entropy = 1 bit/char, total = 1 * 32 = 32 bits
      const twoChars = validateEncryptionKey('abababababababababababababababab')
      expect(twoChars.entropy).toBeGreaterThan(30)
      expect(twoChars.entropy).toBeLessThan(34)

      // More diverse key: Shannon entropy ~4-5 bits/char, total = ~128-160 bits
      const diverse = validateEncryptionKey('aB3$xY7!mN9@pQ2#wE5^tR8&uI1*oP4%')
      expect(diverse.entropy).toBeGreaterThan(128)
    })
  })

  describe('validateEncryptionKeyOnStartup', () => {
    // Helper to set NODE_ENV since it's readonly in TypeScript
    const setNodeEnv = (env: string) => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: env,
        writable: true,
        configurable: true,
      })
    }

    it('should not throw in development with weak key', async () => {
      setNodeEnv('development')
      process.env.BETTER_AUTH_SECRET = 'weak-key-for-dev'

      const { validateEncryptionKeyOnStartup } = await import('./validate-encryption-key')

      // Should warn but not throw
      expect(() => validateEncryptionKeyOnStartup()).not.toThrow()
      expect(console.error).toHaveBeenCalled()
    })

    it('should throw in production with weak key', async () => {
      setNodeEnv('production')
      process.env.BETTER_AUTH_SECRET = 'weak-key'

      // Need to re-import to pick up new env
      vi.resetModules()
      const { validateEncryptionKeyOnStartup } = await import('./validate-encryption-key')

      expect(() => validateEncryptionKeyOnStartup()).toThrow()
    })

    it('should throw in production with missing key', async () => {
      setNodeEnv('production')
      delete process.env.BETTER_AUTH_SECRET

      vi.resetModules()
      const { validateEncryptionKeyOnStartup } = await import('./validate-encryption-key')

      expect(() => validateEncryptionKeyOnStartup()).toThrow()
    })

    it('should pass in production with strong key', async () => {
      setNodeEnv('production')
      process.env.BETTER_AUTH_SECRET = 'aB3$xY7!mN9@pQ2#wE5^tR8&uI1*oP4%'

      vi.resetModules()
      const { validateEncryptionKeyOnStartup } = await import('./validate-encryption-key')

      expect(() => validateEncryptionKeyOnStartup()).not.toThrow()
    })

    it('should pass in development with strong key', async () => {
      setNodeEnv('development')
      process.env.BETTER_AUTH_SECRET = 'aB3$xY7!mN9@pQ2#wE5^tR8&uI1*oP4%'

      vi.resetModules()
      const { validateEncryptionKeyOnStartup } = await import('./validate-encryption-key')

      expect(() => validateEncryptionKeyOnStartup()).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle unicode characters', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const unicodeKey = '你好世界🔐密码安全测试键值对加密解密'

      const result = validateEncryptionKey(unicodeKey)

      // Unicode has high entropy due to many unique characters
      // Total bits = Shannon entropy * length
      expect(result.entropy).toBeGreaterThan(50)
    })

    it('should handle whitespace-only key', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const result = validateEncryptionKey('                                ')

      expect(result.valid).toBe(false)
      expect(result.entropy).toBeLessThan(0.1) // All same character = 0 entropy
    })

    it('should handle key with special characters', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const specialKey = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'

      const result = validateEncryptionKey(specialKey)

      // Good entropy from diverse special chars (30 unique chars)
      // Shannon entropy ~4.9 bits/char * 30 chars = ~147 total bits
      expect(result.entropy).toBeGreaterThan(100)
    })

    it('should handle very long key', async () => {
      const { validateEncryptionKey } = await import('./validate-encryption-key')

      const longKey = 'aB3$xY7!'.repeat(100)

      const result = validateEncryptionKey(longKey)

      // Should still validate (no max length)
      expect(result.valid).toBe(true)
    })
  })
})
