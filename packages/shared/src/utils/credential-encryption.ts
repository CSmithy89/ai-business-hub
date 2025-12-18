/**
 * Credential Encryption Service
 *
 * Provides secure encryption/decryption for sensitive credentials (AI provider API keys)
 * using AES-256-GCM authenticated encryption (AEAD).
 *
 * Security Properties:
 * - Confidentiality: AES-256-GCM encryption prevents unauthorized reading
 * - Integrity: Authentication tag prevents tampering
 * - Uniqueness: Random salt per encryption prevents rainbow table attacks
 * - Key Derivation: PBKDF2 with 100,000 iterations protects against brute force
 *
 * Data Format:
 * Base64(salt [64 bytes] + IV [16 bytes] + authTag [16 bytes] + encryptedData [variable])
 *
 * @packageDocumentation
 */

import crypto from 'node:crypto';
import { promisify } from 'node:util';

// Promisify pbkdf2 to avoid blocking the event loop
const pbkdf2Async = promisify(crypto.pbkdf2);

// Encryption algorithm and parameters
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits (recommended for GCM)
const SALT_LENGTH = 64; // 512 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000; // OWASP recommendation for 2023+

/**
 * Credential Encryption Service
 *
 * Encrypts and decrypts sensitive credential data using AES-256-GCM.
 *
 * @example
 * ```typescript
 * const service = new CredentialEncryptionService();
 * const encrypted = await service.encrypt('my-api-key');
 * const decrypted = await service.decrypt(encrypted); // 'my-api-key'
 * ```
 */
export class CredentialEncryptionService {
  private readonly masterKey: Buffer;

  /**
   * Initialize the encryption service
   *
   * @throws {Error} If ENCRYPTION_MASTER_KEY environment variable is missing
   * @throws {Error} If master key is not valid base64
   * @throws {Error} If master key is not exactly 32 bytes
   */
  constructor() {
    const keyBase64 = process.env.ENCRYPTION_MASTER_KEY;

    if (!keyBase64) {
      throw new Error(
        'ENCRYPTION_MASTER_KEY environment variable is required. ' +
        'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }

    // Validate base64 format and decode
    try {
      this.masterKey = Buffer.from(keyBase64, 'base64');
    } catch (error) {
      throw new Error('ENCRYPTION_MASTER_KEY must be valid base64-encoded string');
    }

    // Validate key length (must be exactly 32 bytes for AES-256)
    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(
        `ENCRYPTION_MASTER_KEY must be ${KEY_LENGTH} bytes (256 bits) when decoded. ` +
        `Got ${this.masterKey.length} bytes. ` +
        'Generate a new key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }
  }

  /**
   * Encrypt a plaintext credential (async to avoid blocking event loop)
   *
   * Encryption Process:
   * 1. Generate random salt (64 bytes)
   * 2. Generate random IV (16 bytes)
   * 3. Derive encryption key using PBKDF2(masterKey + salt)
   * 4. Encrypt plaintext using AES-256-GCM
   * 5. Extract authentication tag
   * 6. Combine all components and base64 encode
   *
   * @param plaintext - The credential to encrypt
   * @returns Base64-encoded encrypted data
   * @throws {Error} If encryption fails
   *
   * @example
   * ```typescript
   * const encrypted = await service.encrypt('claude_api_key_example');
   * // Returns: base64 string like "Q2hlY2sgdGhpcyBvdXQh..."
   * ```
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate random salt and IV for this encryption
      const salt = crypto.randomBytes(SALT_LENGTH);
      const iv = crypto.randomBytes(IV_LENGTH);

      // Derive encryption key from master key + salt using PBKDF2 (async)
      // This makes brute force attacks computationally expensive
      const key = await pbkdf2Async(
        this.masterKey,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha256'
      );

      // Create cipher and encrypt
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      // Extract authentication tag (provides integrity guarantee)
      const authTag = cipher.getAuthTag();

      // Combine all components: salt + IV + authTag + encrypted data
      // Salt and IV are not secret and can be stored with the ciphertext
      const combined = Buffer.concat([salt, iv, authTag, encrypted]);

      // Return base64-encoded string for easy storage
      return combined.toString('base64');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypt an encrypted credential (async to avoid blocking event loop)
   *
   * Decryption Process:
   * 1. Base64 decode to buffer
   * 2. Extract salt, IV, authTag, and encrypted data
   * 3. Derive encryption key using PBKDF2(masterKey + salt)
   * 4. Decrypt using AES-256-GCM
   * 5. Validate authentication tag (throws if tampered)
   * 6. Return plaintext
   *
   * @param ciphertext - Base64-encoded encrypted data
   * @returns Decrypted plaintext credential
   * @throws {Error} If ciphertext is invalid or has been tampered with
   * @throws {Error} If decryption fails (wrong key, corrupted data, etc.)
   *
   * @example
   * ```typescript
   * const decrypted = await service.decrypt('Q2hlY2sgdGhpcyBvdXQh...');
   * // Returns: 'claude_api_key_example'
   * ```
   */
  async decrypt(ciphertext: string): Promise<string> {
    try {
      // Decode from base64
      const combined = Buffer.from(ciphertext, 'base64');

      // Validate minimum length (salt + IV + authTag = 96 bytes)
      const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
      if (combined.length < minLength) {
        throw new Error(
          `Invalid ciphertext: too short. Expected at least ${minLength} bytes, got ${combined.length} bytes`
        );
      }

      // Extract components from combined buffer
      let offset = 0;
      const salt = combined.subarray(offset, offset + SALT_LENGTH);
      offset += SALT_LENGTH;

      const iv = combined.subarray(offset, offset + IV_LENGTH);
      offset += IV_LENGTH;

      const authTag = combined.subarray(offset, offset + AUTH_TAG_LENGTH);
      offset += AUTH_TAG_LENGTH;

      const encrypted = combined.subarray(offset);

      // Derive the same key using PBKDF2 with the stored salt (async)
      const key = await pbkdf2Async(
        this.masterKey,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        'sha256'
      );

      // Create decipher and set authentication tag
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the data
      // If authentication tag is invalid (data was tampered with),
      // the crypto module will throw an error
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Provide user-friendly error messages
      if (message.includes('Unsupported state') || message.includes('auth')) {
        throw new Error(
          'Decryption failed: Invalid authentication tag. ' +
          'Data may have been tampered with or encrypted with a different key.'
        );
      }

      if (message.includes('base64')) {
        throw new Error('Decryption failed: Invalid base64 encoding');
      }

      throw new Error(`Decryption failed: ${message}`);
    }
  }
}

// Export convenience functions for use without instantiation
let serviceInstance: CredentialEncryptionService | null = null;

/**
 * Get or create singleton instance of CredentialEncryptionService
 * @internal
 */
function getService(): CredentialEncryptionService {
  if (!serviceInstance) {
    serviceInstance = new CredentialEncryptionService();
  }
  return serviceInstance;
}

/**
 * Encrypt a credential using the singleton service instance
 *
 * @param plaintext - The credential to encrypt
 * @returns Base64-encoded encrypted data
 *
 * @example
 * ```typescript
 * import { encryptCredential } from '@hyvve/shared';
 * const encrypted = await encryptCredential('my-api-key');
 * ```
 */
export async function encryptCredential(plaintext: string): Promise<string> {
  return getService().encrypt(plaintext);
}

/**
 * Decrypt a credential using the singleton service instance
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @returns Decrypted plaintext credential
 *
 * @example
 * ```typescript
 * import { decryptCredential } from '@hyvve/shared';
 * const plaintext = await decryptCredential(encrypted);
 * ```
 */
export async function decryptCredential(ciphertext: string): Promise<string> {
  return getService().decrypt(ciphertext);
}
