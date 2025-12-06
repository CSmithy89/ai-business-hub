# Troubleshooting: Auth Failures

## Signals
- Spikes in 401/403 on `/api/auth/*` or agent endpoints
- Login/registration errors reported by users
- Token validation failures in logs

## Checks
- Grafana: auth error rate panels; `/api/metrics` for `http_requests_total{status="401"}`.
- Recent deploys or feature flags affecting auth.
- Identity provider status (email/OAuth).

## Steps
1. **Confirm scope**: which flows fail (login, registration, session refresh).
2. **Inspect logs** for top auth errors.
3. **Validate secrets**: ensure `JWT_SECRET`/BetterAuth keys not rotated unexpectedly.
4. **Check rate limits**: ensure rate limiting not blocking auth; clear offending IPs if necessary.
5. **Test flow** manually in staging; compare behavior to prod.

## Mitigations
- Roll back auth-related deploy if correlated.
- Clear invalid sessions/tokens if key rotation occurred.
- Disable new feature flag if tied to errors.

## Verification
- Auth success rate returns to baseline; 401/403 back to normal levels.
- Manual login/signup succeeds.

## Escalation / Related
- If tied to secrets, run [Key Rotation](../key-rotation.md).
- For widespread outage, follow [Incident Response](../incident-response.md).
