# Runbook: Incident Response

## Overview
Structured steps to triage, contain, resolve, and document incidents.

## When to Use
- Any Sev1/Sev2 alert (availability, data risk, security)
- Sustained error/latency spikes or DLQ growth
- Security concerns (credential leak, unauthorized access)

## Prerequisites
- Access to observability tools (Grafana, logs, alerts)
- Ability to coordinate comms in incident channel
- Authority to page secondary/on-call

## Step-by-Step Procedure

### 1. Declare and classify severity
- Open incident channel/bridge; note timestamp and IC (incident commander).
- Sev1: Major outage/data risk; Sev2: partial impact; Sev3: minor.

### 2. Triage signals
- Check `/api/metrics` dashboards (API latency, error rate, DLQ).
- Inspect logs for top errors; check deploy history and feature flags.
- Identify blast radius (which tenants/users/regions).

### 3. Stabilize
- Roll back latest deploy or disable feature flag if correlated.
- Scale components if resource saturation observed.
- For queue issues, pause consumers if causing data corruption.

### 4. Mitigate
- Apply runbook specific to symptom (DLQ, auth, agents, performance).
- Capture commands and timestamps in channel for auditability.

### 5. Communicate
- Post ETA/next update cadence (e.g., every 15 minutes for Sev1).
- Notify stakeholders (Ops, Eng leads; Security for sensitive events).

### 6. Verify recovery
- Success criteria: error rate returns to baseline, latency normal, DLQ stable.
- Confirm critical user flows (auth, approvals, agent calls).

### 7. Close and document
- Summarize root cause, actions, duration, follow-ups.
- Create postmortem doc within 24 hours for Sev1/Sev2.
- File follow-up tickets (tests, alerts, hardening).

## Verification
- Metrics back to baseline; alerts cleared.
- Smoke tests for critical flows pass.

## Rollback
- Use deployment rollback procedures.
- If mitigation fails, revert to last stable config/deploy.

## Related Runbooks
- [DLQ Management](./dlq-management.md)
- [Performance Issues](./troubleshooting/performance-issues.md)
- [Auth Failures](./troubleshooting/auth-failures.md)
- [Agent Errors](./troubleshooting/agent-errors.md)
