"""
Credential encryption compatibility tests (BYOAI).

Verifies the Python implementation matches the Node.js AES-256-GCM format used in:
`packages/shared/src/utils/credential-encryption.ts`.
"""

from __future__ import annotations

import base64
import sys
import shutil
import subprocess

import pytest

from pathlib import Path

AGENTS_ROOT = Path(__file__).resolve().parents[1]
if str(AGENTS_ROOT) not in sys.path:
    sys.path.insert(0, str(AGENTS_ROOT))

from utils.encryption import CredentialEncryptionService


def _master_key_base64() -> str:
    # Deterministic 32-byte master key for tests
    return base64.b64encode(bytes(range(32))).decode("utf-8")


def test_python_encrypt_decrypt_round_trip():
    service = CredentialEncryptionService(_master_key_base64())
    plaintext = "sk-test-123\nwith-unicode-✓"

    encrypted = service.encrypt(plaintext)
    decrypted = service.decrypt(encrypted)

    assert decrypted == plaintext


@pytest.mark.skipif(shutil.which("node") is None, reason="node is required for cross-language test")
def test_node_encrypt_python_decrypt_round_trip():
    """
    Node encrypt -> Python decrypt should succeed.
    """
    master_key = _master_key_base64()
    plaintext = "node->python roundtrip"

    node_script = r"""
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const pbkdf2Async = promisify(crypto.pbkdf2);

const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

(async () => {
  const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'base64');
  const plaintext = process.argv[1];
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = await pbkdf2Async(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  process.stdout.write(combined.toString('base64'));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
"""

    encrypted = subprocess.check_output(
        ["node", "-e", node_script, plaintext],
        env={"ENCRYPTION_MASTER_KEY": master_key},
        text=True,
    ).strip()

    service = CredentialEncryptionService(master_key)
    assert service.decrypt(encrypted) == plaintext


@pytest.mark.skipif(shutil.which("node") is None, reason="node is required for cross-language test")
def test_python_encrypt_node_decrypt_round_trip():
    """
    Python encrypt -> Node decrypt should succeed.
    """
    master_key = _master_key_base64()
    plaintext = "python->node roundtrip"

    service = CredentialEncryptionService(master_key)
    encrypted = service.encrypt(plaintext)

    node_script = r"""
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const pbkdf2Async = promisify(crypto.pbkdf2);

const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

(async () => {
  const masterKey = Buffer.from(process.env.ENCRYPTION_MASTER_KEY, 'base64');
  const ciphertext = process.argv[1];
  const combined = Buffer.from(ciphertext, 'base64');

  const minLength = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH;
  if (combined.length < minLength) {
    throw new Error('ciphertext too short');
  }

  let offset = 0;
  const salt = combined.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;
  const iv = combined.subarray(offset, offset + IV_LENGTH);
  offset += IV_LENGTH;
  const tag = combined.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;
  const encrypted = combined.subarray(offset);

  const key = await pbkdf2Async(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  process.stdout.write(decrypted.toString('utf8'));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
"""

    decrypted = subprocess.check_output(
        ["node", "-e", node_script, encrypted],
        env={"ENCRYPTION_MASTER_KEY": master_key},
        text=True,
    ).strip()

    assert decrypted == plaintext
