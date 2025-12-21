# Implementation Todo List

## Code Review Fixes (2025-12-21)

### `apps/api/src/pm/imports/imports.service.ts`
- [ ] **Fix Inconsistent Error Handling:** Wrap `tasksService.create` and `externalLink.create` calls in `startJiraImport`, `startAsanaImport`, and `startTrelloImport` within a `try/catch` block inside the loop. This will allow the import job to continue processing remaining items even if one fails (matching the behavior of `startCsvImport`).
- [ ] **Implement Transaction Safety:** Wrap the task creation and external link creation in a Prisma transaction (`this.prisma.$transaction`) to prevent orphaned tasks if the external link creation fails.

### `docs/modules/bm-pm/sprint-status.yaml`
- [ ] **Restore Missing Header:** Restore the `# KB-04: AI-Native Knowledge Base` section header which is currently missing (lines ~248).
