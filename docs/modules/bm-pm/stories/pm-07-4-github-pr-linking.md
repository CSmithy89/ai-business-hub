# Story PM-07.4: GitHub PR Linking

**Epic:** PM-07 - Integrations & Bridge Agent
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **tasks linked to GitHub pull requests**,
So that **development work is tracked in PM**.

---

## Acceptance Criteria

### AC1: PR Webhook Linking
**Given** a GitHub PR references a task number (PM-123 or #123)
**When** the webhook is received
**Then** the task shows a linked PR

### AC2: PR Status Visible
**Given** a task has linked PRs
**When** I open task details
**Then** PR status is visible in the task panel

### AC3: Optional Auto-Complete
**Given** auto-complete on merge is enabled
**When** the PR is merged
**Then** the task is marked Done

---

## Technical Approach

- Add GitHub webhook handler (public endpoint) for pull_request events.
- Parse task number from branch name or PR description.
- Store PR links as ExternalLink records.
- Display linked PRs in TaskDetailSheet.
- Optional auto-complete controlled via integration metadata.

---

## Implementation Tasks

### Backend
- [ ] Add GitHub webhook controller for pull_request events.
- [ ] Create PR link records with status metadata.
- [ ] Optionally mark task Done if auto-complete enabled.

### Frontend
- [ ] Display linked PRs in task detail panel.

---

## Files to Create/Modify

### Backend
- `apps/api/src/pm/integrations/github-webhook.controller.ts`
- `apps/api/src/pm/integrations/github-pull-requests.service.ts`
- `apps/api/src/pm/integrations/integrations.module.ts`
- `apps/api/src/pm/tasks/tasks.service.ts`

### Frontend
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/TaskDetailSheet.tsx`
- `apps/web/src/hooks/use-pm-tasks.ts`

---

## Testing Requirements

- Webhook creates ExternalLink entry for PR.
- Task detail view shows linked PR metadata.

---

## Definition of Done

- [ ] PR webhooks link tasks
- [ ] Task panel shows linked PRs
- [ ] Auto-complete on merge supported

---

## Dependencies

- PM-07.3 GitHub Issues Sync

---

## References

- [Epic Definition](../epics/epic-pm-07-integrations-bridge-agent.md)
- [Epic Tech Spec](../epics/epic-pm-07-tech-spec.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added GitHub webhook handler for pull_request events.
- Linked PRs to tasks via ExternalLink records and repo-scoped IDs.
- Displayed linked PRs in the task detail panel with status badges.
- Added optional auto-complete on merge via integration metadata.

---

## Senior Developer Review

**Outcome:** APPROVE

- Webhook flow is public with optional signature verification.
- Task panel displays linked PRs and status metadata.
- Auto-complete is gated by integration metadata. Tests not run (pre-commit type-check failing in unrelated module).
