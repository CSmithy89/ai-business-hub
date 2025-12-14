"""
Credential encryption/decryption utilities (BYOAI).

Mirrors the Node.js implementation in `packages/shared/src/utils/credential-encryption.ts`.

Format:
Base64(salt [64 bytes] + iv [16 bytes] + auth_tag [16 bytes] + encrypted [variable])
Where `encrypted` is the raw AES-256-GCM ciphertext (without the auth tag).
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from typing import Optional

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ALGORITHM = "aes-256-gcm"
KEY_LENGTH = 32
IV_LENGTH = 16
SALT_LENGTH = 64
AUTH_TAG_LENGTH = 16
PBKDF2_ITERATIONS = 100000


class CredentialDecryptionError(RuntimeError):
    """Raised when credential decryption fails."""


class CredentialEncryptionError(RuntimeError):
    """Raised when credential encryption fails."""


@dataclass(frozen=True)
class ParsedCiphertext:
    salt: bytes
    iv: bytes
    auth_tag: bytes
    encrypted: bytes


def _require_bytes_length(value: bytes, length: int, label: str) -> None:
    if len(value) != length:
        raise ValueError(f"{label} must be {length} bytes, got {len(value)} bytes")


def _parse_ciphertext(ciphertext_b64: str) -> ParsedCiphertext:
    try:
        combined = base64.b64decode(ciphertext_b64)
    except Exception as exc:  # noqa: BLE001
        raise CredentialDecryptionError("Invalid base64 encoding") from exc

    min_length = SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    if len(combined) < min_length:
        raise CredentialDecryptionError(
            f"Invalid ciphertext: too short. Expected at least {min_length} bytes, got {len(combined)} bytes"
        )

    offset = 0
    salt = combined[offset : offset + SALT_LENGTH]
    offset += SALT_LENGTH

    iv = combined[offset : offset + IV_LENGTH]
    offset += IV_LENGTH

    auth_tag = combined[offset : offset + AUTH_TAG_LENGTH]
    offset += AUTH_TAG_LENGTH

    encrypted = combined[offset:]

    _require_bytes_length(iv, IV_LENGTH, "IV")
    _require_bytes_length(salt, SALT_LENGTH, "Salt")
    _require_bytes_length(auth_tag, AUTH_TAG_LENGTH, "Auth tag")

    return ParsedCiphertext(salt=salt, iv=iv, auth_tag=auth_tag, encrypted=encrypted)


def _derive_key(master_key: bytes, salt: bytes) -> bytes:
    _require_bytes_length(master_key, KEY_LENGTH, "Master key")
    _require_bytes_length(salt, SALT_LENGTH, "Salt")

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=KEY_LENGTH,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(master_key)


class CredentialEncryptionService:
    """
    AES-256-GCM credential encryption compatible with the Node.js implementation.
    """

    def __init__(self, master_key_base64: str):
        try:
            master_key = base64.b64decode(master_key_base64)
        except Exception as exc:  # noqa: BLE001
            raise ValueError("ENCRYPTION_MASTER_KEY must be valid base64") from exc

        _require_bytes_length(master_key, KEY_LENGTH, "ENCRYPTION_MASTER_KEY")
        self._master_key = master_key

    @classmethod
    def from_env(cls) -> "CredentialEncryptionService":
        key = os.getenv("ENCRYPTION_MASTER_KEY")
        if not key:
            raise ValueError("ENCRYPTION_MASTER_KEY is required")
        return cls(key)

    def encrypt(self, plaintext: str) -> str:
        try:
            salt = os.urandom(SALT_LENGTH)
            iv = os.urandom(IV_LENGTH)

            key = _derive_key(self._master_key, salt)
            aesgcm = AESGCM(key)

            encrypted_plus_tag = aesgcm.encrypt(iv, plaintext.encode("utf-8"), None)
            encrypted = encrypted_plus_tag[:-AUTH_TAG_LENGTH]
            auth_tag = encrypted_plus_tag[-AUTH_TAG_LENGTH:]

            combined = salt + iv + auth_tag + encrypted
            return base64.b64encode(combined).decode("utf-8")
        except Exception:  # noqa: BLE001
            # Avoid chaining sensitive errors (may include plaintext in rare cases).
            raise CredentialEncryptionError("Encryption failed") from None

    def decrypt(self, ciphertext_b64: str) -> str:
        parsed = _parse_ciphertext(ciphertext_b64)

        try:
            key = _derive_key(self._master_key, parsed.salt)
            aesgcm = AESGCM(key)

            encrypted_plus_tag = parsed.encrypted + parsed.auth_tag
            decrypted = aesgcm.decrypt(parsed.iv, encrypted_plus_tag, None)
            return decrypted.decode("utf-8")
        except Exception:  # noqa: BLE001
            # Avoid chaining sensitive errors (may include ciphertext/master key hints).
            raise CredentialDecryptionError(
                "Decryption failed: Invalid authentication tag or wrong key"
            ) from None


def decrypt_credential(ciphertext_b64: str, master_key_base64: str) -> str:
    return CredentialEncryptionService(master_key_base64).decrypt(ciphertext_b64)


def encrypt_credential(plaintext: str, master_key_base64: str) -> str:
    return CredentialEncryptionService(master_key_base64).encrypt(plaintext)
