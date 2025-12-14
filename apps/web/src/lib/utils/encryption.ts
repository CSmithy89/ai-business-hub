/**
 * Encryption Utilities (Server-only)
 *
 * This module standardizes encryption across the monorepo by delegating to the
 * shared AES-256-GCM implementation used for BYOAI (`@hyvve/shared/server`).
 *
 * Format:
 * Base64(salt [64 bytes] + iv [16 bytes] + authTag [16 bytes] + ciphertext [variable])
 *
 * Key source:
 * - `ENCRYPTION_MASTER_KEY` (base64, must decode to 32 bytes)
 */

import { decryptCredential, encryptCredential } from '@hyvve/shared/server'

const SALT_LENGTH = 64
const AES_IV_LENGTH = 16
const GCM_AUTH_TAG_LENGTH = 16

/**
 * Encrypt a plaintext string using the shared credential encryption scheme.
 *
 * Note: `masterKey` is intentionally ignored; the shared implementation uses
 * `process.env.ENCRYPTION_MASTER_KEY` for consistency across services.
 */
export async function encrypt(plaintext: string, _masterKey?: string): Promise<string> {
  return encryptCredential(plaintext)
}

/**
 * Decrypt a base64-encoded encrypted string using the shared credential encryption scheme.
 *
 * Note: `masterKey` is intentionally ignored; the shared implementation uses
 * `process.env.ENCRYPTION_MASTER_KEY` for consistency across services.
 */
export async function decrypt(encryptedData: string, _masterKey?: string): Promise<string> {
  return decryptCredential(encryptedData)
}

/**
 * Check if a string appears to be encrypted data with the expected envelope.
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false

  const base64Regex = /^[A-Za-z0-9+/]+=*$/
  if (!base64Regex.test(data)) return false

  const minLength = SALT_LENGTH + AES_IV_LENGTH + GCM_AUTH_TAG_LENGTH + 1
  try {
    const decoded = Buffer.from(data, 'base64')
    return decoded.length >= minLength
  } catch {
    return false
  }
}

/**
 * Encrypt API key for MCP server storage.
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  return encrypt(apiKey)
}

/**
 * Decrypt API key from MCP server storage.
 */
export async function decryptApiKey(encryptedApiKey: string): Promise<string> {
  return decrypt(encryptedApiKey)
}

