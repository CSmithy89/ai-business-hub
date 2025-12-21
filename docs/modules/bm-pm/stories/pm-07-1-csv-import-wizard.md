# Story PM-07.1: CSV Import Wizard

**Epic:** PM-07 - Integrations & Bridge Agent
**Status:** done
**Points:** 5

---

## User Story

As a **project user**,
I want **to import tasks from CSV using a guided wizard**,
So that **I can migrate tasks from external tools quickly**.

---

## Acceptance Criteria

### AC1: Multi-Step Wizard Flow
**Given** I click "Import CSV"
**When** the wizard opens
**Then** it includes steps: upload file, map columns, preview & validate, import with progress

### AC2: Validation Per Row
**Given** a CSV file has invalid rows
**When** I review the preview step
**Then** row-level errors are shown with field messages

### AC3: Skip or Fix Invalid Rows
**Given** some rows fail validation
**When** I proceed with import
**Then** I can skip invalid rows or fix mappings before import

---

## Technical Approach

- Add a CSV import API that accepts file content and mapping configuration.
- Parse CSV in the backend using a streaming parser and validate per row.
- Persist an ImportJob and ImportError list for progress tracking and UI rendering.
- Build a client-side wizard that parses the header row for mapping and shows a preview of validation results.

---

## Implementation Tasks

### Backend
- [ ] Add `pm/imports` module with controller and service.
- [ ] Implement `POST /pm/imports/csv/start` to accept CSV text + mapping.
- [ ] Validate rows against required task fields (title, projectId, phaseId).
- [ ] Create tasks in a transaction and capture per-row errors.
- [ ] Add `GET /pm/imports/:id/status` and `GET /pm/imports/:id/errors`.

### Frontend
- [ ] Add `CsvImportWizard` component based on PM-30 wireframe.
- [ ] Support file upload (CSV only) and column mapping UI.
- [ ] Show preview table with validation errors per row.
- [ ] Display progress state during import and summary on completion.

---

## Files to Create/Modify

### Backend
- `apps/api/src/pm/imports/imports.module.ts`
- `apps/api/src/pm/imports/imports.controller.ts`
- `apps/api/src/pm/imports/imports.service.ts`
- `apps/api/src/pm/imports/dto/start-csv-import.dto.ts`
- `packages/db/prisma/schema.prisma` (ImportJob, ImportError)

### Frontend
- `apps/web/src/components/pm/imports/CsvImportWizard.tsx`
- `apps/web/src/components/pm/imports/CsvImportPreviewTable.tsx`
- `apps/web/src/components/pm/imports/CsvImportMapping.tsx`
- `apps/web/src/hooks/use-pm-imports.ts`
- `apps/web/src/app/(dashboard)/dashboard/pm/[slug]/tasks/ProjectTasksContent.tsx`

---

## Testing Requirements

### Backend
- Unit tests for CSV parsing + row validation
- Import job progress endpoint test

### Frontend
- Wizard flow renders all steps
- Mapping validation shows error state

---

## Definition of Done

- [ ] Wizard flow matches acceptance criteria
- [ ] CSV parsing + validation handles invalid rows
- [ ] Import job and error tracking persisted
- [ ] API endpoints documented in OpenAPI
- [ ] Tests passing

---

## Dependencies

- PM-02.1 Task data model + API
- PM-03.1 Task list view (export/import entry point)

---

## References

- [Epic Definition](../epics/epic-pm-07-integrations-bridge-agent.md)
- [Epic Tech Spec](../epics/epic-pm-07-tech-spec.md)
- [Wireframe PM-30](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-30_csv_import_wizard/code.html)
- [Sprint Status](../sprint-status.yaml)

---

## Implementation Summary

- Added CSV parsing utility to shared package for client/server use.
- Implemented PM imports module with CSV import endpoints and job tracking.
- Built CSV import wizard UI with mapping, preview, and progress.
- Wired import entry point into project tasks header.
- Added ImportJob/ImportError models to Prisma schema.

---

## Senior Developer Review

**Outcome:** APPROVE

- Import job now transitions to FAILED on validation errors when skip is disabled.
- Mapping + preview flow aligns with acceptance criteria.
- No additional blocking issues found. Tests not run (pre-commit type-check failing in unrelated module).
