/**
 * Encryption Utilities
 * AES-256-GCM encryption for sensitive data storage
 *
 * Used for:
 * - TOTP secrets (2FA)
 * - MCP server API keys
 * - Any other sensitive configuration data
 */

import crypto from 'crypto'
import {
  PBKDF2_ITERATIONS,
  AES_KEY_LENGTH,
  AES_IV_LENGTH,
  SALT_LENGTH,
  GCM_AUTH_TAG_LENGTH,
} from '@/lib/constants/security'

const ALGORITHM = 'aes-256-gcm'

/**
 * Get the master encryption key from environment
 * Uses BETTER_AUTH_SECRET as the master key
 *
 * @throws Error if BETTER_AUTH_SECRET is not set
 */
function getMasterKey(): string {
  const key = process.env.BETTER_AUTH_SECRET
  if (!key) {
    throw new Error('BETTER_AUTH_SECRET environment variable is not set')
  }
  return key
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @param masterKey - Optional master key (defaults to BETTER_AUTH_SECRET)
 * @returns Base64-encoded encrypted data (salt + iv + ciphertext + authTag)
 */
export async function encrypt(plaintext: string, masterKey?: string): Promise<string> {
  const key = masterKey || getMasterKey()

  // Derive encryption key from master key using PBKDF2
  const salt = crypto.randomBytes(SALT_LENGTH)
  const derivedKey = crypto.pbkdf2Sync(key, salt, PBKDF2_ITERATIONS, AES_KEY_LENGTH, 'sha256')

  // Encrypt with AES-256-GCM
  const iv = crypto.randomBytes(AES_IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

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
 * Decrypt a base64-encoded encrypted string using AES-256-GCM
 *
 * @param encryptedData - Base64-encoded encrypted data
 * @param masterKey - Optional master key (defaults to BETTER_AUTH_SECRET)
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export async function decrypt(encryptedData: string, masterKey?: string): Promise<string> {
  const key = masterKey || getMasterKey()
  const combined = Buffer.from(encryptedData, 'base64')

  // Validate minimum length
  const minLength = SALT_LENGTH + AES_IV_LENGTH + GCM_AUTH_TAG_LENGTH + 1
  if (combined.length < minLength) {
    throw new Error('Invalid encrypted data: too short')
  }

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + AES_IV_LENGTH)
  const ciphertext = combined.subarray(SALT_LENGTH + AES_IV_LENGTH, -GCM_AUTH_TAG_LENGTH)
  const authTag = combined.subarray(-GCM_AUTH_TAG_LENGTH)

  // Derive encryption key
  const derivedKey = crypto.pbkdf2Sync(key, salt, PBKDF2_ITERATIONS, AES_KEY_LENGTH, 'sha256')

  // Decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a string appears to be encrypted data
 * (starts with valid base64 and has minimum expected length)
 *
 * @param data - String to check
 * @returns True if data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false

  // Check if it's valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  if (!base64Regex.test(data)) return false

  // Check minimum length (salt + iv + authTag + at least 1 byte ciphertext)
  const minLength = SALT_LENGTH + AES_IV_LENGTH + GCM_AUTH_TAG_LENGTH + 1
  try {
    const decoded = Buffer.from(data, 'base64')
    return decoded.length >= minLength
  } catch {
    return false
  }
}

/**
 * Encrypt API key for MCP server storage
 * Convenience wrapper with explicit naming
 *
 * @param apiKey - The API key to encrypt
 * @returns Encrypted API key (base64)
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  return encrypt(apiKey)
}

/**
 * Decrypt API key from MCP server storage
 * Convenience wrapper with explicit naming
 *
 * @param encryptedApiKey - The encrypted API key
 * @returns Decrypted API key
 */
export async function decryptApiKey(encryptedApiKey: string): Promise<string> {
  return decrypt(encryptedApiKey)
}
