# Runbook: Key Rotation

## Overview
Rotate sensitive keys (database, Redis, JWT/BetterAuth, Agent API) without downtime when possible.

## When to Use
- Key compromise suspected or confirmed
- Scheduled security rotation window
- Infrastructure change requiring new credentials

## Prerequisites
- Access to secrets manager or deployment config
- Ability to restart API/agent workloads
- Knowledge of dependent services (DB, Redis, AgentOS)

## Step-by-Step Procedure

### 1. Prepare new secrets
- Generate new values (e.g., `ENCRYPTION_KEY`, `DATABASE_URL`, `REDIS_URL`, `AGNO_API_KEY`, `JWT_SECRET`).
- Store in secrets manager with timestamped version.

### 2. Stage secrets
- Update deployment manifests or environment with new secrets under a new version key.
- For DB/Redis URLs, keep old credentials active during transition.

### 3. Rotate in application
- Deploy API/agent workloads to pick up new secrets.
- Validate health checks and `/api/metrics` for connection errors.

#### ENCRYPTION_MASTER_KEY (Credential Encryption) – Required re-encryption
If rotating `ENCRYPTION_MASTER_KEY`, you must re-encrypt existing encrypted rows (BYOAI provider keys, MCP server API keys) or agents will not be able to decrypt credentials.

Run the rotation script from `@hyvve/db`:
```bash
# Dry-run first (prints counts, no writes)
ENCRYPTION_MASTER_KEY_OLD="<old-base64-32-bytes>" \
ENCRYPTION_MASTER_KEY_NEW="<new-base64-32-bytes>" \
DATABASE_URL="<postgres-url>" \
pnpm --filter @hyvve/db exec node scripts/rotate-encryption-master-key.js --dry-run

# Apply rotation
ENCRYPTION_MASTER_KEY_OLD="<old-base64-32-bytes>" \
ENCRYPTION_MASTER_KEY_NEW="<new-base64-32-bytes>" \
DATABASE_URL="<postgres-url>" \
pnpm --filter @hyvve/db exec node scripts/rotate-encryption-master-key.js
```

### 4. Decommission old secrets
- After validation window (30–60 minutes), revoke old keys from provider.
- Remove old secret versions from deployment config.

### 5. Audit and log
- Record secret IDs, rotation time, and who performed it.
- Confirm logging does not leak secrets.

## Verification
- No auth/connection errors in logs or metrics.
- Critical flows (auth, event bus, agent calls) succeed post-rotation.
- Grafana shows stable connection counts and error rates.

## Rollback
- Reapply prior secret version and redeploy workloads if new secret fails.
- Keep prior secrets valid until rotation is confirmed.

## Related Runbooks
- [Incident Response](./incident-response.md)
- [Auth Failures](./troubleshooting/auth-failures.md)
