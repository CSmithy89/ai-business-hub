# Epic PM-07: Integrations & Bridge Agent - Technical Specification

**Epic:** PM-07 - Integrations & Bridge Agent
**Module:** Core-PM (bm-pm)
**FRs Covered:** FR-8.1, FR-8.3, FR-8.4
**Stories:** 7 (PM-07.1 to PM-07.7)
**Created:** 2025-12-19
**Status:** Technical Context

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Data Model Changes](#data-model-changes)
4. [API Design](#api-design)
5. [Bridge Agent Design](#bridge-agent-design)
6. [Frontend Components](#frontend-components)
7. [Integration Flows](#integration-flows)
8. [Story Breakdown with Technical Notes](#story-breakdown-with-technical-notes)
9. [Security & Compliance](#security--compliance)
10. [Testing Strategy](#testing-strategy)
11. [Risks & Mitigations](#risks--mitigations)

---

## Executive Summary

Epic PM-07 introduces integrations for CSV import/export, GitHub linking, and migration from PM tools (Jira, Asana, Trello). A new Bridge agent coordinates sync signals across external systems but always requires user approval before applying changes.

Key outcomes:
- CSV import wizard with mapping + validation
- CSV export with field selection and filter-awareness
- GitHub integration (PR linking, status, optional auto-complete)
- Import wizards for Jira, Asana, Trello
- Integration settings UI with secure credential storage

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PM Integrations (PM-07)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Frontend (Next.js)                                                          │
│  • CSV Import Wizard                                                       │
│  • CSV Export Modal                                                        │
│  • Integration Settings (connect/disconnect)                               │
│  • GitHub PR link badges in task detail                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Backend (NestJS)                                                            │
│  • pm/integrations module (REST APIs)                                      │
│  • pm/imports module (CSV + PM tool import pipelines)                      │
│  • webhook controllers (GitHub)                                            │
│  • jobs/queues for long-running imports                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Agent Layer (Agno)                                                          │
│  • Bridge agent for cross-tool sync suggestions                            │
│  • Outputs require approval (no auto-apply)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Data Layer (Prisma + Postgres)                                              │
│  • IntegrationConnection (credentials + status)                            │
│  • ImportJob / ImportError (tracking + validation)                         │
│  • ExternalLink (task <-> external item mapping)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Flow (CSV Import)

```
User clicks "Import CSV"
  -> Frontend wizard (upload -> mapping -> preview -> import)
  -> Backend POST /pm/imports/csv/start
  -> Job enqueued (BullMQ)
  -> Backend validates rows + maps fields
  -> Progress streaming via polling endpoint
  -> On completion: tasks created, errors persisted
```

### Component Flow (GitHub PR Linking)

```
User connects GitHub integration
  -> OAuth handshake stores encrypted token
  -> Webhook receiver listens for PR events
  -> Parse task number from branch/PR body
  -> Create ExternalLink to task
  -> Optional: update task status on merge (approval gated)
```

---

## Data Model Changes

### New Models

**IntegrationConnection**
- id
- workspaceId
- provider (github | jira | asana | trello)
- status (connected | disconnected | error)
- encryptedCredentials
- metadata (JSON, e.g., repo list, base URL)
- createdAt, updatedAt, lastCheckedAt

**ImportJob**
- id
- workspaceId
- projectId
- source (csv | jira | asana | trello)
- status (queued | running | completed | failed)
- totalRows, processedRows, errorCount
- mappingConfig (JSON)
- createdAt, updatedAt

**ImportError**
- id
- importJobId
- rowNumber
- field
- message
- rawRow (JSON)

**ExternalLink**
- id
- workspaceId
- taskId
- provider
- externalId (issue/pr id)
- externalUrl
- metadata (JSON)
- createdAt

### Existing Model Changes

- **Task**: optional fields for linked PR info could remain via ExternalLink table (no direct Task fields needed)
- **Workspace**: no changes required

---

## API Design

### CSV Export
- `GET /pm/exports/tasks`
  - Query: projectId, phaseId, status, type, assigneeId, fields[]
  - Response: streamed CSV

### CSV Import
- `POST /pm/imports/csv/start`
  - Body: projectId, fileId, mapping
  - Returns: importJobId
- `GET /pm/imports/:id/status`
  - Returns: progress + errors summary
- `GET /pm/imports/:id/errors`
  - Returns: error list for display

### Integration Connections
- `GET /pm/integrations`
- `POST /pm/integrations/:provider/connect`
- `POST /pm/integrations/:provider/disconnect`
- `POST /pm/integrations/:provider/refresh`

### GitHub Webhooks
- `POST /pm/integrations/github/webhook`
  - Handles PR opened/merged/synchronized

### PM Tool Imports
- `POST /pm/imports/jira/start`
- `POST /pm/imports/asana/start`
- `POST /pm/imports/trello/start`

---

## Bridge Agent Design

**Purpose:** Monitor external integrations and suggest synchronization actions (never auto-execute).

**Location:** `agents/platform/bridge/`

**Core Behaviors:**
- Detect external updates (PR merged, issue status change)
- Suggest internal task updates
- Log suggestions for approval

**Agent Settings:**
- `suggestion_mode = true`
- `confidence_threshold = 0.85`
- Requires approval workflow for any changes

---

## Frontend Components

- `CsvImportWizard` (multi-step flow with mapping + validation)
- `CsvExportModal` (field selection + filter preview)
- `IntegrationSettingsPanel` (connect/disconnect, status)
- `TaskExternalLinks` (PR badges + status)

---

## Integration Flows

### Jira Import
- OAuth/token storage per workspace
- Fetch projects + issues
- Map Epic/Story/Bug to task types
- Preserve hierarchy + relations

### Asana/Trello Import
- OAuth per provider
- Map status + labels where possible
- Import as tasks with notes and due dates

---

## Story Breakdown with Technical Notes

1. **PM-07.1 CSV Import Wizard**
   - File upload + mapping + preview + progress UI
   - Backend import pipeline with row validation
2. **PM-07.2 CSV Export**
   - Export respects filters + field selection
   - Stream CSV for large datasets
3. **PM-07.3 GitHub Issues Sync**
   - Store GitHub connection + issue mapping
   - Create tasks from linked issues (manual import)
4. **PM-07.4 GitHub PR Linking**
   - Webhook for PR events + branch parsing
   - Optional auto-complete gated by approval
5. **PM-07.5 Bridge Agent Foundation**
   - Agent scaffolding + approval-based suggestions
6. **PM-07.6 Jira Import**
   - Wizard + mapping + rate-limited batch import
7. **PM-07.7 Asana/Trello Import**
   - Wizard + shared import base

---

## Security & Compliance

- Encrypt all credentials using `@hyvve/shared` credential encryption utilities.
- Store tokens only in IntegrationConnection.
- Webhook signatures validated (GitHub `X-Hub-Signature-256`).
- Audit log for all imports and sync suggestions.

---

## Testing Strategy

- Unit tests for CSV parsing and mapping validation.
- Integration tests for import jobs and progress endpoints.
- Webhook signature verification tests.
- UI tests for wizard flows (Vitest + Playwright where available).

---

## Risks & Mitigations

- **Large CSV imports**: Use streaming parser + background jobs.
- **API rate limits**: Implement backoff and rate limiting for Jira/Asana/Trello.
- **Incorrect mappings**: Preview + per-row error reporting.
- **Security**: Encrypted credentials + webhook signature verification.

---

## References

- [Epic Definition](epic-pm-07-integrations-bridge-agent.md)
- [Module PRD](../PRD.md) - FR-8
- [Module Architecture](../architecture.md) - Phase 2 agents
- [Sprint Status](../sprint-status.yaml)
