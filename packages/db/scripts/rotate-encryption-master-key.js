#!/usr/bin/env node
/**
 * Rotate ENCRYPTION_MASTER_KEY (Re-encrypt stored credentials)
 *
 * Re-encrypts encrypted credential columns that use the shared AES-256-GCM + PBKDF2 envelope:
 *   Base64(salt [64] + iv [16] + authTag [16] + ciphertext [N])
 *
 * Usage (recommended):
 *   pnpm --filter @hyvve/db exec node scripts/rotate-encryption-master-key.js --dry-run
 *
 *   ENCRYPTION_MASTER_KEY_OLD="..." \
 *   ENCRYPTION_MASTER_KEY_NEW="..." \
 *   DATABASE_URL="postgresql://..." \
 *   pnpm --filter @hyvve/db exec node scripts/rotate-encryption-master-key.js
 *
 * Flags:
 *   --dry-run       Print counts only; do not write updates
 *   --batch-size=N  Default 200
 */
/* eslint-disable no-console */

const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

function parseArgs(argv) {
  const result = {
    dryRun: false,
    batchSize: 200,
  };

  for (const raw of argv) {
    if (raw === '--dry-run') {
      result.dryRun = true;
      continue;
    }
    if (raw.startsWith('--batch-size=')) {
      const value = Number.parseInt(raw.split('=')[1] ?? '', 10);
      if (Number.isFinite(value) && value > 0) {
        result.batchSize = value;
      }
    }
  }

  return result;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function decodeMasterKey(keyBase64, label) {
  let decoded;
  try {
    decoded = Buffer.from(keyBase64, 'base64');
  } catch {
    throw new Error(`${label} must be base64`);
  }
  if (decoded.length !== KEY_LENGTH) {
    throw new Error(`${label} must decode to ${KEY_LENGTH} bytes (got ${decoded.length})`);
  }
  return decoded;
}

function deriveKey(masterKeyBytes, salt) {
  return crypto.pbkdf2Sync(masterKeyBytes, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
}

function isLikelyEncryptedBase64(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) return false;
  try {
    const decoded = Buffer.from(value, 'base64');
    const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
    return decoded.length >= minLength;
  } catch {
    return false;
  }
}

function decryptCredential(ciphertextBase64, masterKeyBytes) {
  const combined = Buffer.from(ciphertextBase64, 'base64');
  const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1;
  if (combined.length < minLength) {
    throw new Error(`Ciphertext too short (${combined.length} bytes)`);
  }

  let offset = 0;
  const salt = combined.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const iv = combined.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const authTag = combined.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;
  const encrypted = combined.subarray(offset);

  const key = deriveKey(masterKeyBytes, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function encryptCredential(plaintext, masterKeyBytes) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterKeyBytes, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  return combined.toString('base64');
}

async function rotateEncryptedColumn({
  prisma,
  modelName,
  idField,
  encryptedField,
  batchSize,
  oldKeyBytes,
  newKeyBytes,
  dryRun,
  where,
  selectExtra = {},
}) {
  let cursor = undefined;
  let scanned = 0;
  let rotated = 0;
  let skippedAlreadyRotated = 0;

  while (true) {
    const rows = await prisma[modelName].findMany({
      where,
      take: batchSize,
      orderBy: { [idField]: 'asc' },
      ...(cursor ? { cursor: { [idField]: cursor }, skip: 1 } : {}),
      select: { [idField]: true, [encryptedField]: true, ...selectExtra },
    });

    if (rows.length === 0) break;

    const processRow = async (row, client) => {
      scanned += 1;
      const id = row[idField];
      const encryptedValue = row[encryptedField];

      cursor = id;

      if (!encryptedValue) return;
      if (!isLikelyEncryptedBase64(encryptedValue)) {
        throw new Error(
          `[${modelName}] Row ${String(id)}: ${encryptedField} is not a recognized encrypted envelope`
        );
      }

      let plaintext;
      try {
        plaintext = decryptCredential(encryptedValue, oldKeyBytes);
      } catch (err) {
        // If a previous run partially rotated this dataset, allow safe resume:
        // - If it decrypts with the NEW key, treat as already rotated and skip.
        try {
          decryptCredential(encryptedValue, newKeyBytes);
          skippedAlreadyRotated += 1;
          return;
        } catch {
          throw new Error(
            `[${modelName}] Row ${String(id)}: failed to decrypt with old key (${encryptedField}). ` +
              `Aborting rotation. ${(err && err.message) || String(err)}`
          );
        }
      }

      const reEncrypted = encryptCredential(plaintext, newKeyBytes);
      rotated += 1;

      if (dryRun) return;

      await client[modelName].update({
        where: { [idField]: id },
        data: { [encryptedField]: reEncrypted },
      });
    };

    if (dryRun) {
      for (const row of rows) {
        // eslint-disable-next-line no-await-in-loop
        await processRow(row, prisma);
      }
    } else {
      await prisma.$transaction(async (tx) => {
        for (const row of rows) {
          // eslint-disable-next-line no-await-in-loop
          await processRow(row, tx);
        }
      });
    }
  }

  return { scanned, rotated, skippedAlreadyRotated };
}

async function main() {
  const { dryRun, batchSize } = parseArgs(process.argv.slice(2));

  const oldKeyBase64 = requireEnv('ENCRYPTION_MASTER_KEY_OLD');
  const newKeyBase64 = requireEnv('ENCRYPTION_MASTER_KEY_NEW');
  requireEnv('DATABASE_URL');

  const oldKeyBytes = decodeMasterKey(oldKeyBase64, 'ENCRYPTION_MASTER_KEY_OLD');
  const newKeyBytes = decodeMasterKey(newKeyBase64, 'ENCRYPTION_MASTER_KEY_NEW');

  if (oldKeyBytes.equals(newKeyBytes)) {
    throw new Error('Old and new master keys are identical; nothing to rotate.');
  }

  const prisma = new PrismaClient();

  try {
    console.log(`[rotate] Starting ${dryRun ? '(dry-run) ' : ''}with batchSize=${batchSize}`);

    const providerResult = await rotateEncryptedColumn({
      prisma,
      modelName: 'aIProviderConfig',
      idField: 'id',
      encryptedField: 'apiKeyEncrypted',
      batchSize,
      oldKeyBytes,
      newKeyBytes,
      dryRun,
      where: {},
      selectExtra: { workspaceId: true, provider: true },
    });
    console.log(
      `[rotate] AIProviderConfig: scanned=${providerResult.scanned}, rotated=${providerResult.rotated}, skippedAlreadyRotated=${providerResult.skippedAlreadyRotated}`
    );

    const mcpResult = await rotateEncryptedColumn({
      prisma,
      modelName: 'mCPServerConfig',
      idField: 'id',
      encryptedField: 'apiKeyEncrypted',
      batchSize,
      oldKeyBytes,
      newKeyBytes,
      dryRun,
      where: { apiKeyEncrypted: { not: null } },
      selectExtra: { workspaceId: true, serverId: true },
    });
    console.log(
      `[rotate] MCPServerConfig: scanned=${mcpResult.scanned}, rotated=${mcpResult.rotated}, skippedAlreadyRotated=${mcpResult.skippedAlreadyRotated}`
    );

    if (dryRun) {
      console.log('[rotate] Dry-run complete. No data was modified.');
    } else {
      console.log('[rotate] Rotation complete.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[rotate] Failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
