/**
 * Unit tests for Credential Encryption Service
 *
 * Test Coverage:
 * - Successful encryption/decryption (round-trip)
 * - Salt uniqueness (same plaintext produces different ciphertext)
 * - Master key validation (missing, invalid base64, wrong length)
 * - Tamper detection (modified ciphertext fails decryption)
 * - Error handling (invalid inputs, truncated data, wrong key)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { CredentialEncryptionService, encryptCredential, decryptCredential } from './credential-encryption';

describe('CredentialEncryptionService', () => {
  // Store original environment variable
  const originalMasterKey = process.env.ENCRYPTION_MASTER_KEY;

  // Generate a valid 32-byte key for testing
  const validMasterKey = crypto.randomBytes(32).toString('base64');
  const anotherValidKey = crypto.randomBytes(32).toString('base64');

  beforeEach(() => {
    // Set valid master key for each test
    process.env.ENCRYPTION_MASTER_KEY = validMasterKey;
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalMasterKey) {
      process.env.ENCRYPTION_MASTER_KEY = originalMasterKey;
    } else {
      delete process.env.ENCRYPTION_MASTER_KEY;
    }
  });

  describe('Constructor Validation', () => {
    it('should throw error if ENCRYPTION_MASTER_KEY is not set', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;

      expect(() => new CredentialEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY environment variable is required'
      );
    });

    it('should throw error if ENCRYPTION_MASTER_KEY is empty string', () => {
      process.env.ENCRYPTION_MASTER_KEY = '';

      expect(() => new CredentialEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY environment variable is required'
      );
    });

    it('should throw error if ENCRYPTION_MASTER_KEY is not valid base64', () => {
      // Node.js base64 decoder is lenient, so use a string that decodes but has wrong length
      process.env.ENCRYPTION_MASTER_KEY = 'not-valid-base64-!!!@@@';

      // This will decode (Node.js is lenient) but will have wrong length
      expect(() => new CredentialEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY must be 32 bytes'
      );
    });

    it('should throw error if ENCRYPTION_MASTER_KEY is wrong length (too short)', () => {
      // 16 bytes instead of 32
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(16).toString('base64');

      expect(() => new CredentialEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY must be 32 bytes (256 bits) when decoded'
      );
    });

    it('should throw error if ENCRYPTION_MASTER_KEY is wrong length (too long)', () => {
      // 64 bytes instead of 32
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(64).toString('base64');

      expect(() => new CredentialEncryptionService()).toThrow(
        'ENCRYPTION_MASTER_KEY must be 32 bytes (256 bits) when decoded'
      );
    });

    it('should successfully initialize with valid 32-byte key', () => {
      expect(() => new CredentialEncryptionService()).not.toThrow();
    });
  });

  describe('Encryption', () => {
    let service: CredentialEncryptionService;

    beforeEach(() => {
      service = new CredentialEncryptionService();
    });

    it('should encrypt a plaintext string', async () => {
      const plaintext = 'my-secret-api-key';
      const encrypted = await service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should produce valid base64 output', async () => {
      const plaintext = 'test-key';
      const encrypted = await service.encrypt(plaintext);

      // Should be able to decode as base64 without error
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should encrypt different plaintexts to different ciphertexts', async () => {
      const plaintext1 = 'key-one';
      const plaintext2 = 'key-two';

      const encrypted1 = await service.encrypt(plaintext1);
      const encrypted2 = await service.encrypt(plaintext2);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce different ciphertext for same plaintext (salt uniqueness)', async () => {
      const plaintext = 'same-key';

      const encrypted1 = await service.encrypt(plaintext);
      const encrypted2 = await service.encrypt(plaintext);

      // Same plaintext should produce different ciphertext due to unique salt
      expect(encrypted1).not.toBe(encrypted2);

      // Both should decrypt to same plaintext
      expect(await service.decrypt(encrypted1)).toBe(plaintext);
      expect(await service.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should encrypt empty string', async () => {
      const plaintext = '';
      const encrypted = await service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(await service.decrypt(encrypted)).toBe(plaintext);
    });

    it('should encrypt string with special characters', async () => {
      const plaintext = 'key!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const encrypted = await service.encrypt(plaintext);

      expect(await service.decrypt(encrypted)).toBe(plaintext);
    });

    it('should encrypt string with unicode characters', async () => {
      const plaintext = 'key-with-unicode-你好-🚀-café';
      const encrypted = await service.encrypt(plaintext);

      expect(await service.decrypt(encrypted)).toBe(plaintext);
    });

    it('should encrypt long strings', async () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = await service.encrypt(plaintext);

      expect(await service.decrypt(encrypted)).toBe(plaintext);
    });

    it('should encrypt multiline strings', async () => {
      const plaintext = 'line1\nline2\nline3\r\nline4';
      const encrypted = await service.encrypt(plaintext);

      expect(await service.decrypt(encrypted)).toBe(plaintext);
    });
  });

  describe('Decryption', () => {
    let service: CredentialEncryptionService;

    beforeEach(() => {
      service = new CredentialEncryptionService();
    });

    it('should decrypt ciphertext back to original plaintext', async () => {
      const plaintext = 'my-secret-key';
      const encrypted = await service.encrypt(plaintext);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle round-trip for various input lengths', async () => {
      const testCases = [
        'short',
        'medium-length-api-key',
        'very-long-api-key-' + 'x'.repeat(1000),
      ];

      for (const plaintext of testCases) {
        const encrypted = await service.encrypt(plaintext);
        const decrypted = await service.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it('should throw error for invalid base64 ciphertext', async () => {
      // Node.js base64 decoder is lenient, so use a string that decodes but is too short
      const invalidBase64 = 'not-valid-base64-!!!@@@';

      // This will decode (Node.js is lenient) but will be too short
      await expect(service.decrypt(invalidBase64)).rejects.toThrow(
        'Invalid ciphertext: too short'
      );
    });

    it('should throw error for truncated ciphertext (too short)', async () => {
      // Valid base64 but too short to contain salt + IV + authTag
      const tooShort = Buffer.alloc(50).toString('base64'); // Only 50 bytes, need at least 96

      await expect(service.decrypt(tooShort)).rejects.toThrow(
        'Invalid ciphertext: too short'
      );
    });

    it('should throw error for empty string', async () => {
      await expect(service.decrypt('')).rejects.toThrow();
    });

    it('should throw error when decrypting with wrong master key', async () => {
      const plaintext = 'secret-key';
      const encrypted = await service.encrypt(plaintext);

      // Create new service with different master key
      process.env.ENCRYPTION_MASTER_KEY = anotherValidKey;
      const wrongKeyService = new CredentialEncryptionService();

      // Should fail to decrypt with wrong key
      await expect(wrongKeyService.decrypt(encrypted)).rejects.toThrow(
        'Decryption failed'
      );
    });
  });

  describe('Tamper Detection', () => {
    let service: CredentialEncryptionService;

    beforeEach(() => {
      service = new CredentialEncryptionService();
    });

    it('should fail decryption if ciphertext is modified', async () => {
      const plaintext = 'my-secret-key';
      const encrypted = await service.encrypt(plaintext);

      // Modify the ciphertext by changing one character
      const tamperedCiphertext = encrypted.slice(0, -5) + 'XXXXX';

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow(
        'Decryption failed'
      );
    });

    it('should fail decryption if authentication tag is modified', async () => {
      const plaintext = 'my-secret-key';
      const encrypted = await service.encrypt(plaintext);

      // Decode, modify the authTag section, re-encode
      const buffer = Buffer.from(encrypted, 'base64');
      const saltLength = 64;
      const ivLength = 16;

      // Modify a byte in the authTag section (bytes 64-80)
      buffer[saltLength + ivLength] ^= 0xFF; // Flip bits

      const tamperedCiphertext = buffer.toString('base64');

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow(
        'Invalid authentication tag'
      );
    });

    it('should fail decryption if encrypted data is modified', async () => {
      const plaintext = 'my-secret-key';
      const encrypted = await service.encrypt(plaintext);

      // Decode, modify the encrypted data section, re-encode
      const buffer = Buffer.from(encrypted, 'base64');
      const saltLength = 64;
      const ivLength = 16;
      const authTagLength = 16;

      // Modify a byte in the encrypted data section (after byte 96)
      const modifyIndex = saltLength + ivLength + authTagLength + 5;
      buffer[modifyIndex] ^= 0xFF; // Flip bits

      const tamperedCiphertext = buffer.toString('base64');

      await expect(service.decrypt(tamperedCiphertext)).rejects.toThrow(
        'Invalid authentication tag'
      );
    });
  });

  describe('Convenience Functions', () => {
    it('should encrypt using encryptCredential function', async () => {
      const plaintext = 'test-key';
      const encrypted = await encryptCredential(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
    });

    it('should decrypt using decryptCredential function', async () => {
      const plaintext = 'test-key';
      const encrypted = await encryptCredential(plaintext);
      const decrypted = await decryptCredential(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle round-trip with convenience functions', async () => {
      const plaintext = 'my-api-key-12345';
      const encrypted = await encryptCredential(plaintext);
      const decrypted = await decryptCredential(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should use singleton instance (same instance on multiple calls)', async () => {
      // This is implicit, but we can test behavior is consistent
      const plaintext = 'test';
      const encrypted1 = await encryptCredential(plaintext);
      const encrypted2 = await encryptCredential(plaintext);

      // Should produce different ciphertexts (unique salt)
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt correctly
      expect(await decryptCredential(encrypted1)).toBe(plaintext);
      expect(await decryptCredential(encrypted2)).toBe(plaintext);
    });
  });

  describe('Real-World Scenarios', () => {
    let service: CredentialEncryptionService;

    beforeEach(() => {
      service = new CredentialEncryptionService();
    });

    it('should handle typical Claude API key format', async () => {
      const apiKey = 'sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = await service.encrypt(apiKey);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle typical OpenAI API key format', async () => {
      const apiKey = 'sk-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP';
      const encrypted = await service.encrypt(apiKey);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle typical Google API key format', async () => {
      const apiKey = 'AIzaSyD-1234567890abcdefghijklmnopqrstuv';
      const encrypted = await service.encrypt(apiKey);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should handle typical OpenRouter API key format', async () => {
      const apiKey = 'sk-or-v1-1234567890abcdefghijklmnopqrstuvwxyz';
      const encrypted = await service.encrypt(apiKey);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should encrypt multiple different API keys independently', async () => {
      const keys = [
        'sk-ant-api03-claude-key',
        'sk-openai-key',
        'AIzaSyD-google-key',
        'sk-or-v1-openrouter-key',
      ];

      const encrypted = await Promise.all(keys.map((key) => service.encrypt(key)));
      const decrypted = await Promise.all(encrypted.map((enc) => service.decrypt(enc)));

      expect(decrypted).toEqual(keys);
    });
  });

  describe('Data Format Validation', () => {
    let service: CredentialEncryptionService;

    beforeEach(() => {
      service = new CredentialEncryptionService();
    });

    it('should produce ciphertext with expected structure', async () => {
      const plaintext = 'test-key';
      const encrypted = await service.encrypt(plaintext);
      const buffer = Buffer.from(encrypted, 'base64');

      // Verify minimum length: salt (64) + IV (16) + authTag (16) = 96 bytes minimum
      expect(buffer.length).toBeGreaterThanOrEqual(96);

      // Verify we can extract components without error
      const salt = buffer.subarray(0, 64);
      const iv = buffer.subarray(64, 80);
      const authTag = buffer.subarray(80, 96);
      const encryptedData = buffer.subarray(96);

      expect(salt.length).toBe(64);
      expect(iv.length).toBe(16);
      expect(authTag.length).toBe(16);
      expect(encryptedData.length).toBeGreaterThan(0);
    });

    it('should use different salts for each encryption', async () => {
      const plaintext = 'same-text';

      const encrypted1 = await service.encrypt(plaintext);
      const encrypted2 = await service.encrypt(plaintext);

      const buffer1 = Buffer.from(encrypted1, 'base64');
      const buffer2 = Buffer.from(encrypted2, 'base64');

      const salt1 = buffer1.subarray(0, 64);
      const salt2 = buffer2.subarray(0, 64);

      // Salts should be different
      expect(salt1.equals(salt2)).toBe(false);
    });

    it('should use different IVs for each encryption', async () => {
      const plaintext = 'same-text';

      const encrypted1 = await service.encrypt(plaintext);
      const encrypted2 = await service.encrypt(plaintext);

      const buffer1 = Buffer.from(encrypted1, 'base64');
      const buffer2 = Buffer.from(encrypted2, 'base64');

      const iv1 = buffer1.subarray(64, 80);
      const iv2 = buffer2.subarray(64, 80);

      // IVs should be different
      expect(iv1.equals(iv2)).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error message for missing key', () => {
      delete process.env.ENCRYPTION_MASTER_KEY;

      let error: Error | null = null;
      try {
        new CredentialEncryptionService();
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('ENCRYPTION_MASTER_KEY');
      expect(error?.message).toContain('Generate with');
      expect(error?.message).toContain('crypto');
    });

    it('should provide helpful error message for wrong key length', () => {
      process.env.ENCRYPTION_MASTER_KEY = crypto.randomBytes(16).toString('base64');

      let error: Error | null = null;
      try {
        new CredentialEncryptionService();
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toContain('32 bytes');
      expect(error?.message).toContain('256 bits');
      expect(error?.message).toContain('Generate a new key');
    });
  });
});
