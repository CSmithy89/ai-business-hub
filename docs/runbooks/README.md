# Operational Runbooks Index

Use these runbooks to respond to incidents on the HYVVE platform. Keep a terminal open with access to production tooling (kubectl, psql/psql-compatible client, curl) and the incident channel.

## Runbooks
- [Dead Letter Queue Management](./dlq-management.md)
- [Database Recovery](./database-recovery.md)
- [Incident Response](./incident-response.md)
- [Key Rotation](./key-rotation.md)
- [Knowledge Base Maintenance](./knowledge-base-maintenance.md)
- [Troubleshooting: Auth Failures](./troubleshooting/auth-failures.md)
- [Troubleshooting: Agent Errors](./troubleshooting/agent-errors.md)
- [Troubleshooting: Performance Issues](./troubleshooting/performance-issues.md)

## Observability References
- `/api/metrics` (Prometheus) → Grafana dashboards: API latency, event bus health, AI provider status
- `/api/events/health`, `/api/events/dlq`, `/api/events/dlq/retry`, `/api/events/dlq/purge`
- Application logs (NestJS, FastAPI agents) in centralized logging
- Database telemetry: Postgres dashboard (connections, replication lag, slow queries)

## CSRF Quick Check
Use when state-changing requests unexpectedly return 403 in environments with CSRF enabled.

1. Verify `CSRF_ENABLED=true` and a CSRF secret (`CSRF_SECRET` or `BETTER_AUTH_SECRET`) are set in the API environment.
2. Fetch a token from the right endpoint:
   - NestJS API: `GET /csrf`
   - Next.js app: `GET /api/auth/csrf-token`
3. Confirm the CSRF cookie name via `CSRF_COOKIE_NAME` (default `hyvve_csrf_token`).
4. Repeat the failing request with both cookies attached (`hyvve.session_token` + CSRF cookie) and `x-csrf-token: <token>` set to the exact CSRF cookie value (headerToken must equal cookieToken). The token is HMAC-signed (`<token>.<signature>`), so both parts must be preserved.

## Escalation
- Primary on-call: Platform Ops
- Secondary: Backend Lead
- Security incidents: Security Lead (parallel bridge to Ops)
- For Sev1, open incident bridge, page secondary immediately, and start the Incident Response runbook.
