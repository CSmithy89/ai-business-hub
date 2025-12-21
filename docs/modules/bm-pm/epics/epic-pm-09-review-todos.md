# Epic PM-09 Review TODOs (PR Follow-ups)

PR: https://github.com/CSmithy89/ai-business-hub/pull/35

## P1 (Fix before merge)

- [ ] **Remove invalid workspaceId query params**: `use-pm-portfolio` and `use-pm-dependencies` should not send `workspaceId` in query (DTOs forbid unknown fields; 400s when ValidationPipe is strict).
- [ ] **Workspace scoping on dependencies projects**: add `workspaceId` filter to project lookup in `apps/api/src/pm/dependencies/dependencies.service.ts`.
- [ ] **Workspace scoping on portfolio lead users**: ensure lead user query is filtered to the current workspace in `apps/api/src/pm/portfolio/portfolio.service.ts`.
- [ ] **Timeline saved view restore**: include `TIMELINE` mapping in `applyView` and `applyTemplateState` so timeline views restore correctly.
- [ ] **Do not show raw backend error messages**: replace `error.message` with a generic user-facing string in `DependenciesDashboard`.
- [ ] **Started-at event payload**: emit `updated.startedAt` (not DTO value) in `apps/api/src/pm/tasks/tasks.service.ts` update events.

## P2 (High priority follow-up)

- [ ] **Portfolio search validation**: add `@MaxLength(100)` and safe `@Matches(...)` to `PortfolioQueryDto.search`.
- [ ] **Dependencies pagination**: replace hard-coded `take: 250` with `limit/offset` in `DependenciesQueryDto` (include `hasMore` or total count).
- [ ] **Reject invalid boolean query values**: update `toBoolean` so invalid strings fail validation (do not coerce to false).
- [ ] **Filter out null projectIds**: sanitize `projectIds` and relation comparisons to avoid null/undefined edge cases.
- [ ] **Parse date range inputs**: validate/parse `from/to` query values to `Date` before Prisma filters to avoid timezone inconsistencies.
- [ ] **Portfolio date typing**: align backend `startDate/targetDate` types with frontend (`string | null`) or serialize explicitly.
- [ ] **ProjectTasksContent effect dependencies**: include `activeSavedViewId/applyView` and stabilize `savedViews`/`applyView` via `useCallback` or memoization.
- [ ] **Saved view payload freshness**: read latest local storage preferences when saving views/templates (avoid stale sort/columns).
- [ ] **Portfolio link format**: use string href (`/dashboard/pm/${slug}`) to avoid `/[slug]?slug=...` URLs.
- [ ] **Critical path logic**: validate whether parentId hierarchy is correct; consider using explicit dependency relations for critical path.

## Minor / Quality

- [ ] **Date validation**: avoid accepting Invalid Date for `startedAt` in `UpdateTaskDto` transform.
- [ ] **Portfolio UI**:
  - [ ] Parse ISO dates with `parseISO` to avoid timezone shifts.
  - [ ] Show placeholder (not `0%`) when `averageScore` is null.
  - [ ] Hide empty state when `error` is present.
- [ ] **Dependencies UI**: only show empty state when `data` exists and no error.
- [ ] **SaveViewModal UX**:
  - [ ] Remove `viewState` from effect deps to avoid wiping edits while open.
  - [ ] Disable sort selects while save/update mutation is loading.
- [ ] **SavedViewsDropdown**: remove unused `onCopyLink` prop for team shared views.
- [ ] **TimelineView**:
  - [ ] Stabilize drag effect dependencies (use `mutate` function reference).
  - [ ] Add keyboard handling for task bars (Enter/Space).
- [ ] **Labels in PortfolioFilters**: use `<Label>` with `htmlFor` for accessibility.
- [ ] **Portfolio module exports**: add `exports: [PortfolioService]` if other modules need injection.
- [ ] **CSRF**: verify middleware coverage for state-changing endpoints (if not already global).

## Performance / Scale

- [ ] **Timeline virtualization**: add `@tanstack/react-virtual` for 500+ tasks.
- [ ] **Portfolio caching**: cache aggregation results in Redis (60s TTL).
- [ ] **N+1 lead user query**: replace with nested select or join where feasible.

## Testing (Add coverage)

- [ ] Portfolio service:
  - [ ] Workspace isolation enforced.
  - [ ] Health score calculation correctness.
- [ ] Dependencies service:
  - [ ] Cross-project filter behavior.
  - [ ] Workspace isolation for source and target tasks.
- [ ] Timeline view:
  - [ ] Critical path calculation.
  - [ ] Drag and resize operations.
  - [ ] Circular dependency handling.

## Documentation

- [ ] Add `docs/modules/bm-pm/README.md` with performance notes, routes, and limitations.
