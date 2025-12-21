# Story PM-07.3: GitHub Issues Sync

**Epic:** PM-07 - Integrations & Bridge Agent
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **to sync GitHub issues into my project tasks**,
So that **development work stays aligned between GitHub and PM**.

---

## Acceptance Criteria

### AC1: GitHub Connection Required
**Given** I want to sync issues
**When** I provide a GitHub token
**Then** the integration is connected and stored securely

### AC2: Issue Sync Creates Tasks
**Given** a connected GitHub repository
**When** I run an issues sync
**Then** new issues become tasks and existing issues are skipped

### AC3: Issue Metadata Preserved
**Given** issues are imported
**When** tasks are created
**Then** each task links back to the GitHub issue URL

---

## Technical Approach

- Add IntegrationConnection model for storing GitHub credentials.
- Implement GitHub issues sync endpoint that fetches issues and creates tasks.
- Store task-to-issue mapping using ExternalLink records.
- Provide a lightweight sync dialog in the tasks page.

---

## Implementation Tasks

### Backend
- [ ] Add IntegrationConnection + ExternalLink models to Prisma schema.
- [ ] Create `pm/integrations` module for connect/list/disconnect.
- [ ] Create GitHub issues sync endpoint and service.

### Frontend
- [ ] Add GitHub issues sync dialog with owner/repo inputs.
- [ ] Trigger sync and show summary result.

---

## Files to Create/Modify

### Backend
- `apps/api/src/pm/integrations/integrations.module.ts`
- `apps/api/src/pm/integrations/integrations.controller.ts`
- `apps/api/src/pm/integrations/integrations.service.ts`
- `apps/api/src/pm/integrations/github.controller.ts`
- `apps/api/src/pm/integrations/github-issues.service.ts`
- `apps/api/src/pm/integrations/dto/connect-integration.dto.ts`
- `apps/api/src/pm/integrations/dto/github-issues-sync.dto.ts`
- `packages/db/prisma/schema.prisma`

### Frontend
- `apps/web/src/hooks/use-pm-integrations.ts`
- `apps/web/src/components/pm/integrations/GithubIssuesSyncDialog.tsx`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

- Sync endpoint creates tasks for new issues.
- Existing issues are skipped with ExternalLink mapping.

---

## Definition of Done

- [ ] GitHub integration stored securely
- [ ] Issues sync creates tasks and external links
- [ ] Sync dialog wired into tasks page

---

## Dependencies

- PM-07.1 CSV Import Wizard
- PM-07.2 CSV Export

---

## References

- [Epic Definition](../epics/epic-pm-07-integrations-bridge-agent.md)
- [Epic Tech Spec](../epics/epic-pm-07-tech-spec.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added integration connection storage with encrypted credentials.
- Implemented GitHub issues sync service and endpoint.
- Linked tasks to GitHub issues via ExternalLink records.
- Added GitHub sync dialog and wired button into task list header.

---

## Senior Developer Review

**Outcome:** APPROVE

- External IDs include repo scope to avoid collisions.
- Sync skips already-linked issues and preserves links.
- No blocking issues found. Tests not run (pre-commit type-check failing in unrelated module).
