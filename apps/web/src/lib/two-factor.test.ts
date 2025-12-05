/**
 * Two-Factor Authentication Tests
 * Story 09: Comprehensive tests for TOTP, backup codes, and encryption
 *
 * @module two-factor.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock bcrypt - must be before imports
vi.mock('bcrypt', () => ({
  hash: vi.fn(async (data: string, rounds: number) => `hashed:${data}:${rounds}`),
  compare: vi.fn(async (data: string, hash: string) => hash === `hashed:${data}:12`),
}))

// Mock QRCode
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async () => 'data:image/png;base64,MOCK_QR_CODE'),
  },
}))

import {
  generateTOTPSecret,
  generateQRCode,
  formatManualEntryCode,
  createTOTPUri,
  verifyTOTPCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  encryptSecret,
  decryptSecret,
} from './two-factor'

describe('TOTP Secret Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate a valid base32 secret', () => {
    const secret = generateTOTPSecret()

    expect(secret).toBeDefined()
    expect(typeof secret).toBe('string')
    expect(secret.length).toBeGreaterThan(0)
    // Base32 characters only
    expect(secret).toMatch(/^[A-Z2-7]+$/)
  })

  it('should generate unique secrets on each call', () => {
    const secret1 = generateTOTPSecret()
    const secret2 = generateTOTPSecret()

    // Real crypto.randomBytes should produce unique values
    expect(secret1).not.toBe(secret2)
  })
})

describe('QR Code Generation', () => {
  it('should generate a valid QR code data URL', async () => {
    const QRCode = await import('qrcode')
    const totpUri = 'otpauth://totp/HYVVE:user@test.com?secret=ABCDEF&issuer=HYVVE'

    const result = await generateQRCode(totpUri)

    expect(result).toBe('data:image/png;base64,MOCK_QR_CODE')
    expect(QRCode.default.toDataURL).toHaveBeenCalledWith(totpUri, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    })
  })

  it('should throw an error if QR code generation fails', async () => {
    const QRCode = await import('qrcode')
    vi.mocked(QRCode.default.toDataURL).mockRejectedValueOnce(new Error('QR generation failed'))

    await expect(generateQRCode('invalid://uri')).rejects.toThrow('Failed to generate QR code')
  })
})

describe('Manual Entry Code Formatting', () => {
  it('should format secret with spaces every 4 characters', () => {
    const secret = 'ABCDEFGHIJKLMNOP'
    const formatted = formatManualEntryCode(secret)

    expect(formatted).toBe('ABCD EFGH IJKL MNOP')
  })

  it('should handle secrets that are not multiples of 4', () => {
    const secret = 'ABCDEFGHIJ'
    const formatted = formatManualEntryCode(secret)

    expect(formatted).toBe('ABCD EFGH IJ')
  })

  it('should handle short secrets', () => {
    const secret = 'ABC'
    const formatted = formatManualEntryCode(secret)

    expect(formatted).toBe('ABC')
  })

  it('should handle empty string', () => {
    const formatted = formatManualEntryCode('')

    expect(formatted).toBe('')
  })
})

describe('TOTP URI Creation', () => {
  it('should create valid otpauth URI', () => {
    const secret = 'ABCDEFGHIJKLMNOP'
    const email = 'user@test.com'

    const uri = createTOTPUri(secret, email)

    expect(uri).toContain('otpauth://totp/')
    expect(uri).toContain('HYVVE')
    expect(uri).toContain(encodeURIComponent(email))
    expect(uri).toContain('secret=')
    expect(uri).toContain('issuer=HYVVE')
    expect(uri).toContain('algorithm=SHA1')
    expect(uri).toContain('digits=6')
    expect(uri).toContain('period=30')
  })

  it('should encode special characters in email', () => {
    const secret = 'ABCDEFGHIJKLMNOP'
    const email = 'user+test@test.com'

    const uri = createTOTPUri(secret, email)

    expect(uri).toContain(encodeURIComponent(email))
  })
})

describe('TOTP Code Verification', () => {
  it('should verify a valid TOTP code', () => {
    // Generate a real TOTP code for the secret
    const { TOTP } = require('otpauth')
    const secret = 'ABCDEFGHIJKLMNOP'
    const totp = new TOTP({
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
    const validCode = totp.generate()

    const result = verifyTOTPCode(secret, validCode)

    expect(result).toBe(true)
  })

  it('should reject an invalid TOTP code', () => {
    const secret = 'ABCDEFGHIJKLMNOP'
    const invalidCode = '000000'

    const result = verifyTOTPCode(secret, invalidCode)

    expect(result).toBe(false)
  })

  it('should reject an empty code', () => {
    const secret = 'ABCDEFGHIJKLMNOP'

    const result = verifyTOTPCode(secret, '')

    expect(result).toBe(false)
  })

  it('should handle invalid secrets gracefully', () => {
    const invalidSecret = ''
    const code = '123456'

    // Should not throw, just return false
    expect(() => verifyTOTPCode(invalidSecret, code)).not.toThrow()
    const result = verifyTOTPCode(invalidSecret, code)
    expect(result).toBe(false)
  })
})

describe('Backup Code Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate the default number of backup codes', () => {
    const codes = generateBackupCodes()

    expect(codes).toHaveLength(10) // BACKUP_CODE_COUNT = 10
  })

  it('should generate specified number of backup codes', () => {
    const codes = generateBackupCodes(5)

    expect(codes).toHaveLength(5)
  })

  it('should generate codes in XXXX-XXXX format', () => {
    const codes = generateBackupCodes(1)

    expect(codes[0]).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/)
  })

  it('should exclude confusing characters (0, O, 1, I, L)', () => {
    const codes = generateBackupCodes(100)
    const allCodes = codes.join('')

    expect(allCodes).not.toContain('0')
    expect(allCodes).not.toContain('O')
    expect(allCodes).not.toContain('1')
    expect(allCodes).not.toContain('I')
    expect(allCodes).not.toContain('L')
  })

  it('should generate unique codes', () => {
    const codes = generateBackupCodes(100)
    const uniqueCodes = new Set(codes)

    expect(uniqueCodes.size).toBe(codes.length)
  })
})

describe('Backup Code Hashing', () => {
  it('should hash a backup code', async () => {
    const code = 'ABCD-EFGH'

    const hash = await hashBackupCode(code)

    expect(hash).toBe('hashed:ABCD-EFGH:12') // Mock format
  })

  it('should produce consistent hash for same input', async () => {
    const code = 'ABCD-EFGH'

    const hash1 = await hashBackupCode(code)
    const hash2 = await hashBackupCode(code)

    expect(hash1).toBe(hash2)
  })
})

describe('Backup Code Verification', () => {
  it('should verify a valid backup code', async () => {
    const code = 'ABCD-EFGH'
    const hash = await hashBackupCode(code)

    const isValid = await verifyBackupCode(code, hash)

    expect(isValid).toBe(true)
  })

  it('should reject an invalid backup code', async () => {
    const validCode = 'ABCD-EFGH'
    const hash = await hashBackupCode(validCode)

    const isValid = await verifyBackupCode('WRONG-CODE', hash)

    expect(isValid).toBe(false)
  })
})

describe('Secret Encryption/Decryption', () => {
  it('should encrypt and decrypt a secret successfully', async () => {
    const plaintext = 'MYSUPERSECRETTOTPSECRET123456'
    const masterKey = 'my-super-secure-master-key-32chars!'

    const encrypted = await encryptSecret(plaintext, masterKey)
    const decrypted = await decryptSecret(encrypted, masterKey)

    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same plaintext (due to random IV)', async () => {
    const plaintext = 'MYSUPERSECRETTOTPSECRET'
    const masterKey = 'my-super-secure-master-key!'

    const encrypted1 = await encryptSecret(plaintext, masterKey)
    const encrypted2 = await encryptSecret(plaintext, masterKey)

    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should produce base64 encoded output', async () => {
    const plaintext = 'MYSUPERSECRET'
    const masterKey = 'my-master-key'

    const encrypted = await encryptSecret(plaintext, masterKey)

    // Should be valid base64
    expect(() => Buffer.from(encrypted, 'base64')).not.toThrow()
    expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/)
  })

  it('should fail decryption with wrong key', async () => {
    const plaintext = 'MYSUPERSECRET'
    const masterKey = 'correct-key'
    const wrongKey = 'wrong-key'

    const encrypted = await encryptSecret(plaintext, masterKey)

    await expect(decryptSecret(encrypted, wrongKey)).rejects.toThrow()
  })

  it('should fail decryption with tampered ciphertext', async () => {
    const plaintext = 'MYSUPERSECRET'
    const masterKey = 'my-master-key'

    const encrypted = await encryptSecret(plaintext, masterKey)
    // Tamper with the ciphertext
    const tampered = encrypted.slice(0, -10) + 'XXXXXXXXXX'

    await expect(decryptSecret(tampered, masterKey)).rejects.toThrow()
  })

  it('should handle empty plaintext', async () => {
    const plaintext = ''
    const masterKey = 'my-master-key'

    const encrypted = await encryptSecret(plaintext, masterKey)
    const decrypted = await decryptSecret(encrypted, masterKey)

    expect(decrypted).toBe('')
  })

  it('should handle unicode in plaintext', async () => {
    const plaintext = 'секрет密码🔐'
    const masterKey = 'my-master-key'

    const encrypted = await encryptSecret(plaintext, masterKey)
    const decrypted = await decryptSecret(encrypted, masterKey)

    expect(decrypted).toBe(plaintext)
  })
})
