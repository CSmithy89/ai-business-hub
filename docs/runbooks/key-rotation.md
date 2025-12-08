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
