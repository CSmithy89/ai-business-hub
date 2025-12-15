# Story 14-5: Operational Runbooks

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 3  
**Priority:** P2 Medium  
**Created:** 2025-12-07

## User Story
As an operator, I want operational runbooks so that incidents can be resolved quickly and consistently.

## Acceptance Criteria
- [x] AC1: Create runbook index at `docs/runbooks/README.md` with quick links and ownership/escalation info.
- [x] AC2: Add DLQ management runbook (`docs/runbooks/dlq-management.md`) with inspect/retry/purge/verify steps.
- [x] AC3: Add database recovery runbook (`docs/runbooks/database-recovery.md`) covering backup/restore and verification.
- [x] AC4: Add incident response runbook (`docs/runbooks/incident-response.md`) with triage, comms, and postmortem checklist.
- [x] AC5: Add key rotation runbook (`docs/runbooks/key-rotation.md`) for app secrets and credentials with rollback steps.
- [x] AC6: Add troubleshooting guides under `docs/runbooks/troubleshooting/` (`auth-failures.md`, `agent-errors.md`, `performance-issues.md`) with signals and fixes.

## Context
- Observability stack from Story 14-4 exposes `/metrics` for Prometheus and Grafana dashboards.
- Event bus uses Redis Streams with DLQ endpoints (`/api/events/health`, `/api/events/dlq`, `/api/events/dlq/retry`, `/api/events/dlq/purge`).
- Database is PostgreSQL (Prisma) with backups stored via cloud snapshot tooling.
- Agent services (FastAPI) and NestJS API are deployed; incidents often originate from auth, agent calls, or performance regressions.

## Implementation Plan
1. Create runbook index with scope, escalation, and dashboard links.
2. Author DLQ, database recovery, incident response, and key rotation runbooks with prerequisites, procedures, verification, and rollback.
3. Add troubleshooting guides for auth failures, agent errors, and performance issues with signals and step-by-step remediation.
4. Cross-link related runbooks and metrics where applicable; ensure commands use existing APIs and common tooling.

## Implementation Summary
- Added runbook index (`docs/runbooks/README.md`) with links, observability references, and escalation paths.
- Authored DLQ, database recovery, incident response, and key rotation runbooks with prerequisites, procedures, verification, and rollback.
- Added troubleshooting guides for auth failures, agent errors, and performance issues with signals, checks, mitigations, and related links.

## Definition of Done
- [x] Acceptance criteria completed with clear, actionable steps.
- [x] Runbooks use consistent template (Overview, When to Use, Prerequisites, Procedure, Verification, Rollback, Related).
- [x] Links between runbooks and metrics dashboards included.
- [x] Story status updated to done and sprint status reflects completion.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** Runbooks cover DLQ, DB recovery, incident response, key rotation, and targeted troubleshooting with clear verification/rollback. Cross-links to metrics and related procedures present. No blockers—story stays at done.
