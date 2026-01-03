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

#### ENCRYPTION_MASTER_KEY format (required)

HYVVE requires `ENCRYPTION_MASTER_KEY` to be a **base64-encoded 32-byte key**.

Example generation:

```bash
openssl rand -base64 32
```

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

Notes:

- The script processes rows in transactional batches.
- If a rotation attempt is interrupted, re-run the script with the same `OLD`/`NEW` keys. Rows already encrypted with the new key are detected and skipped.

#### AGENT_SERVICE_TOKEN (Agent-to-API Authentication)

The `AGENT_SERVICE_TOKEN` is used for service-to-service authentication between Python agents and the NestJS API. It's validated using timing-safe comparison in `ServiceAuthGuard`.

Rotation steps:
1. Generate a new secure token:
   ```bash
   openssl rand -hex 32
   ```
2. Update `AGENT_SERVICE_TOKEN` in both:
   - NestJS API environment (`apps/api/.env`)
   - Python agents environment (`apps/agents/.env`)
3. Deploy API first (it will accept both old connections briefly)
4. Deploy agents to pick up the new token
5. Verify agent health checks succeed in logs

Notes:
- Both services must be updated within a short window
- The token is checked on every agent-to-API call
- Monitor for `401 Unauthorized` errors in agent logs during rotation

#### METRICS_API_KEY (Metrics Endpoint Authentication)

The `METRICS_API_KEY` protects the `/metrics` endpoint used by Prometheus and Grafana for scraping application metrics.

##### When to Rotate
- Suspected key exposure
- Personnel changes (ops team members leaving)
- Periodic rotation (recommended: every 90 days)

##### Rotation Steps

1. **Generate new key:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update secret store:**

   For Kubernetes:
   ```bash
   kubectl create secret generic metrics-auth \
     --from-literal=METRICS_API_KEY=<new-key> \
     --dry-run=client -o yaml | kubectl apply -f -
   ```

   For environment file:
   ```bash
   # Update .env.production
   METRICS_API_KEY=<new-key>
   ```

3. **Rolling deployment (zero downtime):**
   ```bash
   kubectl rollout restart deployment/agent-api
   kubectl rollout status deployment/agent-api
   ```

4. **Update monitoring tools:**

   Prometheus scrape config:
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'hyvve-api'
       bearer_token: '<new-key>'
       static_configs:
         - targets: ['api.hyvve.app:443']
   ```

   Grafana datasource (via UI or provisioning):
   ```yaml
   # grafana/provisioning/datasources/prometheus.yaml
   datasources:
     - name: Prometheus
       type: prometheus
       access: proxy
       url: http://prometheus:9090
       basicAuth: false
       httpHeaderName1: 'Authorization'
       httpHeaderValue1: 'Bearer <new-key>'
   ```

5. **Verify access:**
   ```bash
   curl -H "Authorization: Bearer <new-key>" \
     https://api.hyvve.app/metrics

   # Should return Prometheus-format metrics
   # HELP http_requests_total Total HTTP requests
   # TYPE http_requests_total counter
   ```

6. **Revoke old key:**
   - Old key is automatically invalid after deployment
   - No explicit revocation needed (not stored externally)

##### Rollback

If issues occur after rotation:
```bash
kubectl rollout undo deployment/agent-api
```

Then restore old key in monitoring tools.

##### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Prometheus scrape failing | Key mismatch | Update prometheus.yml with new key |
| Grafana showing no data | Datasource outdated | Update Grafana datasource config |
| 401 on /metrics | Key not deployed | Verify METRICS_API_KEY in pod env |
| Metrics endpoint 404 | Endpoint disabled | Check METRICS_ENABLED=true |

### 4. Decommission old secrets
- After you verify stability, revoke old keys from provider.
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

If you need to roll back `ENCRYPTION_MASTER_KEY` after re-encrypting rows, you can rotate back by swapping `ENCRYPTION_MASTER_KEY_OLD` and `ENCRYPTION_MASTER_KEY_NEW` and running the same script again.

## Related Runbooks
- [Incident Response](./incident-response.md)
- [Auth Failures](./troubleshooting/auth-failures.md)
