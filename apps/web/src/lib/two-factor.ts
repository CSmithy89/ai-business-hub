/**
 * Two-Factor Authentication Utility Functions
 * Story 09-3: Two-Factor Authentication Setup
 */

import QRCode from 'qrcode'
import { TOTP } from 'otpauth'
import crypto from 'crypto'

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude 0, O, 1, I, L

/**
 * Generate a TOTP secret for two-factor authentication
 * @returns Base32-encoded TOTP secret
 */
export function generateTOTPSecret(): string {
  const totp = new TOTP({
    issuer: 'HYVVE',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  return totp.secret.base32
}

/**
 * Generate a QR code data URI from TOTP URI
 * @param totpUri - The otpauth URI
 * @returns Promise resolving to QR code data URL
 */
export async function generateQRCode(totpUri: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(totpUri, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    })
    return qrCodeDataUrl
  } catch (error) {
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Format secret for manual entry (add spaces every 4 characters)
 * @param secret - The TOTP secret
 * @returns Formatted secret with spaces
 */
export function formatManualEntryCode(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret
}

/**
 * Create TOTP URI for authenticator apps
 * @param secret - The TOTP secret
 * @param email - User email
 * @returns otpauth URI
 */
export function createTOTPUri(secret: string, email: string): string {
  const totp = new TOTP({
    issuer: 'HYVVE',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  })
  return totp.toString()
}

/**
 * Verify a TOTP code against a secret
 * @param secret - The TOTP secret
 * @param code - The 6-digit code to verify
 * @returns True if code is valid
 */
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const totp = new TOTP({
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })

    // Verify with time window for clock drift
    const delta = totp.validate({
      token: code,
      window: 1, // Check current, previous, and next time step
    })

    return delta !== null
  } catch (error) {
    return false
  }
}

/**
 * Generate backup codes for 2FA recovery
 * @param count - Number of codes to generate (default 10)
 * @returns Array of backup codes in XXXX-XXXX format
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes = new Set<string>()

  while (codes.size < count) {
    const code = generateSingleCode()
    codes.add(code)
  }

  return Array.from(codes)
}

/**
 * Generate a single backup code
 * @returns Backup code in XXXX-XXXX format
 */
function generateSingleCode(): string {
  const part1 = generateRandomString(4)
  const part2 = generateRandomString(4)
  return `${part1}-${part2}`
}

/**
 * Generate random string from safe characters
 * @param length - Length of string to generate
 * @returns Random string
 */
function generateRandomString(length: number): string {
  const bytes = crypto.randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS[bytes[i] % SAFE_CHARS.length]
  }

  return result
}

/**
 * Hash a backup code for secure storage using bcrypt
 * @param code - The backup code to hash
 * @returns Promise resolving to hashed code
 */
export async function hashBackupCode(code: string): Promise<string> {
  // Use bcrypt with cost factor of 10 (recommended for backup codes)
  const bcrypt = await import('bcrypt')
  return bcrypt.hash(code, 10)
}

/**
 * Verify a backup code against a hash
 * @param code - The backup code to verify
 * @param hash - The stored hash
 * @returns Promise resolving to true if code matches
 */
export async function verifyBackupCode(code: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcrypt')
  return bcrypt.compare(code, hash)
}

/**
 * Encrypt TOTP secret for database storage
 * @param plaintext - The secret to encrypt
 * @param masterKey - The master encryption key (from BETTER_AUTH_SECRET)
 * @returns Promise resolving to encrypted secret (base64)
 */
export async function encryptSecret(plaintext: string, masterKey: string): Promise<string> {
  const ALGORITHM = 'aes-256-gcm'
  const KEY_LENGTH = 32
  const IV_LENGTH = 16
  const SALT_LENGTH = 64

  // Derive encryption key from master key
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256')

  // Encrypt with AES-256-GCM
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Combine salt + iv + encrypted + authTag
  const combined = Buffer.concat([
    salt,
    iv,
    Buffer.from(encrypted, 'hex'),
    authTag,
  ])

  return combined.toString('base64')
}

/**
 * Decrypt TOTP secret from database storage
 * @param encrypted - The encrypted secret (base64)
 * @param masterKey - The master encryption key (from BETTER_AUTH_SECRET)
 * @returns Promise resolving to decrypted secret
 */
export async function decryptSecret(encrypted: string, masterKey: string): Promise<string> {
  const KEY_LENGTH = 32
  const IV_LENGTH = 16
  const SALT_LENGTH = 64
  const TAG_LENGTH = 16

  const combined = Buffer.from(encrypted, 'base64')

  // Extract components
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH, -TAG_LENGTH)
  const authTag = combined.slice(-TAG_LENGTH as number)

  // Derive encryption key
  const key = crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256')

  // Decrypt
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
