import base64
import os

import pytest


@pytest.mark.asyncio
async def test_provider_resolver_returns_decrypted_api_key_from_db(monkeypatch):
    from agents.providers.byoai_client import BYOAIClient
    from agents.providers.provider_resolver import ProviderResolver
    from agents.utils.encryption import CredentialEncryptionService

    master_key = base64.b64encode(os.urandom(32)).decode("utf-8")
    plaintext_key = "sk-test-123"
    encrypted_key = CredentialEncryptionService(master_key).encrypt(plaintext_key)

    row = {
        "id": "prov-1",
        "provider": "openai",
        "default_model": "gpt-4o",
        "api_key_encrypted": encrypted_key,
        "is_valid": True,
        "last_validated_at": None,
        "validation_error": None,
        "max_tokens_per_day": 100000,
        "tokens_used_today": 0,
        "created_at": None,
    }

    class DummyConn:
        async def fetch(self, _query, _workspace_id):
            return [row]

    class DummyAcquire:
        async def __aenter__(self):
            return DummyConn()

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class DummyPool:
        def acquire(self):
            return DummyAcquire()

    client = BYOAIClient(
        api_base_url="http://localhost:3001",
        database_url="postgresql://example",
        encryption_master_key_base64=master_key,
    )

    async def fake_get_db_pool():
        return DummyPool()

    monkeypatch.setattr(client, "_get_db_pool", fake_get_db_pool)

    resolver = ProviderResolver(byoai_client=client)
    resolved = await resolver.resolve_provider(
        workspace_id="ws-1",
        jwt_token="jwt",
        preferred_provider="openai",
        check_limits=False,
    )

    assert resolved is not None
    assert resolved.api_key == plaintext_key

