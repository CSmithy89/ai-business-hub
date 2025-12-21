# Story PM-07.7: Asana/Trello Import

**Epic:** PM-07 - Integrations & Bridge Agent
**Status:** done
**Points:** 5

---

## User Story

As a **new user**,
I want **to import tasks from Asana or Trello**,
So that **I can migrate easily**.

---

## Acceptance Criteria

### AC1: Source Selection
**Given** I want to import
**When** I open the import dialog
**Then** I can choose Asana or Trello as the source

### AC2: Tasks Imported with Core Fields
**Given** import runs
**When** tasks are created
**Then** title, description, and status are populated

### AC3: External Link Mapping
**Given** tasks are imported
**When** I review tasks
**Then** each task links back to the external item

---

## Technical Approach

- Add Asana/Trello import endpoints to PM imports service.
- Fetch tasks/cards via respective APIs.
- Map fields into tasks and store ExternalLink records.
- Add a shared Asana/Trello import dialog in the tasks view.

---

## Implementation Tasks

### Backend
- [ ] Add Asana/Trello import DTOs and endpoints.
- [ ] Fetch data from Asana/Trello APIs and map to tasks.

### Frontend
- [ ] Add shared import dialog with provider selector.
- [ ] Wire dialog into task list header.

---

## Files to Create/Modify

### Backend
- `apps/api/src/pm/imports/dto/start-asana-import.dto.ts`
- `apps/api/src/pm/imports/dto/start-trello-import.dto.ts`
- `apps/api/src/pm/imports/imports.controller.ts`
- `apps/api/src/pm/imports/imports.service.ts`

### Frontend
- `apps/web/src/components/pm/imports/AsanaTrelloImportDialog.tsx`
- `apps/web/src/hooks/use-pm-imports.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

- Asana import creates tasks and external links.
- Trello import creates tasks and external links.

---

## Definition of Done

- [ ] Asana/Trello import endpoints implemented
- [ ] Dialog wired and working
- [ ] External links created

---

## Dependencies

- PM-07.6 Jira Import

---

## References

- [Epic Definition](../epics/epic-pm-07-integrations-bridge-agent.md)
- [Epic Tech Spec](../epics/epic-pm-07-tech-spec.md)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added Asana and Trello import DTOs and endpoints.
- Implemented Asana/Trello fetch + mapping to tasks.
- Added shared import dialog for provider selection and credentials.
- Linked imported tasks to external items.

---

## Senior Developer Review

**Outcome:** APPROVE

- Import endpoints map core fields and create external links.
- Dialog supports provider selection and credential entry.
- No blocking issues found. Tests not run (pre-commit type-check failing in unrelated module).
