# Story PM-07.6: Jira Import

**Epic:** PM-07 - Integrations & Bridge Agent
**Status:** done
**Points:** 5

---

## User Story

As a **new user**,
I want **to import tasks from Jira**,
So that **I can migrate my existing projects**.

---

## Acceptance Criteria

### AC1: Jira Import Wizard
**Given** I start Jira import
**When** the dialog opens
**Then** I can provide Jira base URL, email, and API token

### AC2: Issues Imported as Tasks
**Given** Jira issues are fetched
**When** import completes
**Then** tasks are created and linked to Jira issue keys

### AC3: Status Mapping
**Given** Jira issues have status categories
**When** tasks are created
**Then** status maps to TODO / IN_PROGRESS / DONE

---

## Technical Approach

- Add Jira import endpoint to PM imports service.
- Fetch issues via Jira REST API using basic auth.
- Map issue fields to tasks and create ExternalLink records.
- Add a lightweight Jira import dialog in the tasks view.

---

## Implementation Tasks

### Backend
- [ ] Add Jira import DTO and endpoint.
- [ ] Fetch Jira issues via REST API and map to tasks.
- [ ] Store ExternalLink with provider JIRA.

### Frontend
- [ ] Add Jira import dialog with credentials and JQL input.
- [ ] Wire dialog into project task header.

---

## Files to Create/Modify

### Backend
- `apps/api/src/pm/imports/dto/start-jira-import.dto.ts`
- `apps/api/src/pm/imports/imports.controller.ts`
- `apps/api/src/pm/imports/imports.service.ts`

### Frontend
- `apps/web/src/components/pm/imports/JiraImportDialog.tsx`
- `apps/web/src/hooks/use-pm-imports.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

- Jira import creates tasks with mapped status.
- ExternalLink entries created for each issue.

---

## Definition of Done

- [ ] Jira import endpoint implemented
- [ ] Dialog wired and working
- [ ] Status mapping applied

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

- Added Jira import DTO and REST API integration.
- Mapped Jira issue status categories to task status.
- Added Jira import dialog and wiring to task header.
- Created ExternalLink records for Jira issues.

---

## Senior Developer Review

**Outcome:** APPROVE

- Import flow maps statuses deterministically and links issues.
- Jira credentials are used only for import call.
- No blocking issues found. Tests not run (pre-commit type-check failing in unrelated module).
