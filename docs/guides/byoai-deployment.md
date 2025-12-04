# BYOAI Deployment Guide

This guide covers the deployment and operational aspects of the BYOAI (Bring Your Own AI) Configuration system.

## Environment Variables

### Required Variables

#### ENCRYPTION_MASTER_KEY

The master encryption key used to encrypt/decrypt API keys stored in the database.

```bash
# Generate a secure 32+ character key
openssl rand -base64 32

# Example output (DO NOT USE THIS - generate your own)
# ENCRYPTION_MASTER_KEY="Kx8z2Jm9pQ4rT7wY1aB3cD5eF6gH8iJ0"
```

**Requirements:**
- Minimum 32 characters
- Should be randomly generated
- Must be consistent across all API server instances
- Should be stored in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

**Environment Configuration:**
```bash
# .env.production
ENCRYPTION_MASTER_KEY="your-secure-32-char-minimum-key-here"
```

### Validation

The API server validates `ENCRYPTION_MASTER_KEY` at startup. If not set or too short, the server will:
1. Log a warning about missing encryption key
2. Continue running but credential operations will fail

## Security Considerations

### Key Storage Best Practices

1. **Never commit to version control** - Use `.gitignore` for all `.env*` files
2. **Use a secrets manager** - AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager
3. **Rotate regularly** - See [Key Rotation Runbook](#key-rotation-runbook)
4. **Limit access** - Only DevOps/SRE should have access to production keys

### Database Security

API keys are encrypted using AES-256-GCM before storage:
- Each encryption uses a unique IV (Initialization Vector)
- Format: `iv:authTag:ciphertext` (base64 encoded)
- Key derivation: PBKDF2 with 100,000 iterations

### API Security

- Decrypted API keys are NEVER returned through public APIs
- The `getDecryptedApiKey()` method is marked `@internal` and for server-side use only
- Token usage and validation happen server-side only

## Key Rotation Runbook

### When to Rotate

- Scheduled: Every 90 days (recommended)
- Unscheduled: If key compromise is suspected
- Personnel change: When team members with key access leave

### Rotation Procedure

#### 1. Preparation

```bash
# Generate new encryption key
NEW_KEY=$(openssl rand -base64 32)
echo "New key: $NEW_KEY"

# Store the new key in your secrets manager
# AWS example:
aws secretsmanager update-secret \
  --secret-id hyvve/production/encryption-key \
  --secret-string "$NEW_KEY"
```

#### 2. Re-encrypt Existing Credentials

Run the key rotation script during a maintenance window:

```bash
# From the API server
cd apps/api

# Set both old and new keys
export ENCRYPTION_MASTER_KEY="old-key-here"
export NEW_ENCRYPTION_MASTER_KEY="new-key-here"

# Run rotation script (to be implemented)
pnpm run rotate-encryption-keys
```

**Note:** The rotation script should:
1. Fetch all `AIProviderConfig` records
2. Decrypt each `apiKeyEncrypted` with old key
3. Re-encrypt with new key
4. Update the database record
5. Verify decryption works with new key

#### 3. Deploy with New Key

```bash
# Update environment variable in all instances
# Then restart the API servers

# Verify health
curl https://api.yourapp.com/health
```

#### 4. Verify

```bash
# Test provider validation still works
curl -X POST https://api.yourapp.com/api/workspaces/{id}/ai-providers/{id}/test
```

### Rollback Procedure

If issues occur after rotation:

1. Restore old `ENCRYPTION_MASTER_KEY` from backup
2. Restart API servers
3. Investigate cause before re-attempting rotation

### Emergency: Key Compromise

If the encryption key is compromised:

1. **Immediately rotate the key** using the procedure above
2. **Notify affected users** to re-enter their API keys
3. **Audit logs** for unauthorized access
4. **Review access controls** to prevent future compromise

## Monitoring

### Health Checks

The provider health service runs every 15 minutes and validates:
- API key decryption succeeds
- Provider API responds successfully
- Authentication is valid

### Alerts to Configure

1. **Encryption failures** - Alert if decryption fails (may indicate key mismatch)
2. **Provider validation failures** - Alert on repeated validation failures
3. **Missing environment variable** - Alert if `ENCRYPTION_MASTER_KEY` not set

### Metrics

Track these metrics for operational visibility:
- `ai_provider_validation_success_total` - Successful validations
- `ai_provider_validation_failure_total` - Failed validations
- `api_key_decryption_errors_total` - Decryption failures
- `token_usage_daily` - Daily token consumption by provider

## Troubleshooting

### "Failed to decrypt API key"

**Cause:** Encryption key mismatch or corrupted ciphertext

**Solution:**
1. Verify `ENCRYPTION_MASTER_KEY` matches the key used during encryption
2. If key was rotated, ensure all instances use the new key
3. If corruption, user must re-enter their API key

### "Provider validation failed"

**Cause:** Invalid API key, expired credentials, or provider outage

**Solution:**
1. Check provider status page (Claude, OpenAI, etc.)
2. Verify API key is still valid in provider dashboard
3. Re-enter API key if needed

### "ENCRYPTION_MASTER_KEY not configured"

**Cause:** Environment variable not set

**Solution:**
1. Set `ENCRYPTION_MASTER_KEY` in environment
2. Restart API server
3. Verify with health check endpoint

## Appendix

### Supported AI Providers

| Provider | API Key Format | Documentation |
|----------|----------------|---------------|
| Claude (Anthropic) | `sk-ant-...` | [docs.anthropic.com](https://docs.anthropic.com) |
| OpenAI | `sk-...` | [platform.openai.com](https://platform.openai.com) |
| Google Gemini | Google API key | [ai.google.dev](https://ai.google.dev) |
| DeepSeek | API key | [deepseek.com](https://deepseek.com) |
| OpenRouter | `sk-or-...` | [openrouter.ai](https://openrouter.ai) |

### Related Documentation

- [Architecture: BYOAI Design](/docs/architecture.md#byoai-configuration)
- [Tech Spec: Epic 06](/docs/sprint-artifacts/tech-spec-epic-06.md)
- [Control Plane Setup](/docs/guides/control-plane-setup.md)
