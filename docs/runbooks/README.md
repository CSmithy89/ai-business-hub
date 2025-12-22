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

1. Verify `CSRF_ENABLED=true` and correct `FRONTEND_URL` in the API environment.
2. Fetch a token: `GET /csrf` (sets `hyvve.csrf_token` cookie + returns token).
3. Repeat the failing request with `x-csrf-token: <token>` and cookies attached.
4. Confirm the session cookie (`hyvve.session_token`) is present for cookie-auth flows.

## Escalation
- Primary on-call: Platform Ops
- Secondary: Backend Lead
- Security incidents: Security Lead (parallel bridge to Ops)
- For Sev1, open incident bridge, page secondary immediately, and start the Incident Response runbook.
