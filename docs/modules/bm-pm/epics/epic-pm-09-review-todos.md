# Epic PM-09 Review TODOs (PR Follow-ups)

PR: https://github.com/CSmithy89/ai-business-hub/pull/35

## P1 (Fix before merge)

- [x] **Remove invalid workspaceId query params**: `use-pm-portfolio` and `use-pm-dependencies` should not send `workspaceId` in query (DTOs forbid unknown fields; 400s when ValidationPipe is strict).
- [x] **Workspace scoping on dependencies projects**: add `workspaceId` filter to project lookup in `apps/api/src/pm/dependencies/dependencies.service.ts`.
- [x] **Workspace scoping on portfolio lead users**: ensure lead user query is filtered to the current workspace in `apps/api/src/pm/portfolio/portfolio.service.ts`.
- [x] **Timeline saved view restore**: include `TIMELINE` mapping in `applyView` and `applyTemplateState` so timeline views restore correctly.
- [x] **Do not show raw backend error messages**: replace `error.message` with a generic user-facing string in `DependenciesDashboard`.
- [x] **Started-at event payload**: emit `updated.startedAt` (not DTO value) in `apps/api/src/pm/tasks/tasks.service.ts` update events.

## P2 (High priority follow-up)

- [x] **Portfolio search validation**: add `@MaxLength(100)` and safe `@Matches(...)` to `PortfolioQueryDto.search`.
- [x] **Dependencies pagination**: replace hard-coded `take: 250` with `limit/offset` in `DependenciesQueryDto` (include `hasMore` or total count).
- [x] **Reject invalid boolean query values**: update `toBoolean` so invalid strings fail validation (do not coerce to false).
- [x] **Filter out null projectIds**: sanitize `projectIds` and relation comparisons to avoid null/undefined edge cases.
- [x] **Parse date range inputs**: validate/parse `from/to` query values to `Date` before Prisma filters to avoid timezone inconsistencies.
- [x] **Portfolio date typing**: align backend `startDate/targetDate` types with frontend (`string | null`) or serialize explicitly.
- [x] **ProjectTasksContent effect dependencies**: include `activeSavedViewId/applyView` and stabilize `savedViews`/`applyView` via `useCallback` or memoization.
- [x] **Saved view payload freshness**: read latest local storage preferences when saving views/templates (avoid stale sort/columns).
- [x] **Portfolio link format**: use string href (`/dashboard/pm/${slug}`) to avoid `/[slug]?slug=...` URLs.
- [x] **Critical path logic**: validate whether parentId hierarchy is correct; consider using explicit dependency relations for critical path.
- [x] **DTO string length limits**: add `@MaxLength` guards to remaining string fields in PM DTOs per security guidance.

## Minor / Quality

- [x] **Date validation**: avoid accepting Invalid Date for `startedAt` in `UpdateTaskDto` transform.
- [x] **Portfolio UI**:
  - [x] Parse ISO dates with `parseISO` to avoid timezone shifts.
  - [x] Show placeholder (not `0%`) when `averageScore` is null.
  - [x] Hide empty state when `error` is present.
- [x] **Dependencies UI**: only show empty state when `data` exists and no error.
- [x] **SaveViewModal UX**:
  - [x] Remove `viewState` from effect deps to avoid wiping edits while open.
  - [x] Disable sort selects while save/update mutation is loading.
- [x] **SavedViewsDropdown**: remove unused `onCopyLink` prop for team shared views.
- [x] **TimelineView**:
  - [x] Stabilize drag effect dependencies (use `mutate` function reference).
  - [x] Add keyboard handling for task bars (Enter/Space).
- [x] **Labels in PortfolioFilters**: use `<Label>` with `htmlFor` for accessibility.
- [x] **Portfolio module exports**: add `exports: [PortfolioService]` if other modules need injection.
- [x] **CSRF**: verify middleware coverage for state-changing endpoints (if not already global).
- [x] **Session shape normalization**: centralize token/workspace extraction helpers for PM hooks.

## Performance / Scale

- [x] **Timeline virtualization**: add `@tanstack/react-virtual` for 500+ tasks.
- [x] **Portfolio caching**: cache aggregation results in Redis (60s TTL).
- [x] **N+1 lead user query**: lead user lookup is already batched in a single query and covered by portfolio caching.

## Testing (Add coverage)

- [x] Portfolio service:
  - [x] Workspace isolation enforced.
  - [x] Health score calculation correctness.
- [x] Dependencies service:
  - [x] Cross-project filter behavior.
  - [x] Workspace isolation for source and target tasks.
- [x] Timeline view:
  - [x] Critical path calculation.
  - [x] Drag and resize operations.
  - [x] Circular dependency handling.

## Documentation

- [x] Add `docs/modules/bm-pm/README.md` with performance notes, routes, and limitations.

## Additional Review Follow-ups (Post-PR)

- [x] **CSRF HMAC signing** (Medium): switch double-submit tokens to HMAC-signed tokens using `CSRF_SECRET`, validate with timing-safe compare; align with `apps/web/src/lib/csrf.ts`.
- [x] **CSRF token entropy** (Critical): replace `randomUUID()` with `randomBytes(32)` (base64url) for CSRF token generation in `apps/api/src/common/controllers/csrf.controller.ts`.
- [x] **CSRF constant-time compare** (Critical): use `timingSafeEqual` for header/cookie token comparison in `apps/api/src/main.ts`.
- [x] **CORS CSRF header** (Critical): allow `x-csrf-token` in `allowedHeaders` for NestJS CORS config.
- [x] **CSRF endpoint rate limiting** (High): throttle `GET /csrf` to prevent unlimited token minting.
- [x] **CSRF runbook accuracy** (High): verify cookie name and endpoint scope, and clarify header=cookie equality requirement in `docs/runbooks/README.md`.
- [x] **StartedAt vs startDate consistency** (High): verify Prisma schema field name and tech spec references; standardize on one field and add migration if needed.
- [x] **Health score formula documentation** (Low): document backend calculation in tech spec/architecture docs and align with UI thresholds.
- [x] **Cross-project dependency null filtering** (Low): behavior verified and covered by `dependencies.service.spec.ts` (no action needed).
- [x] **Portfolio date parsing guard** (Critical): ensure `query.from/to` are `Date` instances before calling `getTime()`.
- [x] **E2E coverage** (Medium): add tests for timeline drag/resize, portfolio filters + drill-down, and view sharing via `viewId`.
- [x] **Component tests** (Medium): add coverage for `PortfolioDashboard`, `DependenciesDashboard`, `SavedViewsDropdown`.
- [x] **Timeline resize accessibility** (High): add keyboard-accessible alternatives for resize handles in `TimelineView`.
- [x] **Portfolio cache invalidation** (Low): ensure task/project updates bust portfolio cache to avoid stale aggregates.
- [x] **Share token security** (Medium): confirm shareToken is cryptographically random and validated server-side.
- [x] **Observability** (Low): add tracing + monitoring for `/pm/portfolio` and `/pm/dependencies` (P95 latency, cache hit rate).

## New Review Findings (2025-12-22)

### CRITICAL / HIGH PRIORITY

- [x] **Fix In-Memory Pagination & N+1 in Dependencies** (Critical)
  - Location: `apps/api/src/pm/dependencies/dependencies.service.ts:33-65`
  - Issue: Fetches ALL relations, filters in-memory, then slices array.
  - Fix: Apply `take: limit` and `skip: offset` in Prisma query. Move cross-project filtering to DB where clause if possible.

- [x] **Enforce Secure Cookie for SameSite=None** (Critical)
  - Location: `apps/api/src/common/controllers/csrf.controller.ts:28-40`
  - Issue: `sameSite='none'` requires `secure=true` per browser policy. Current logic allows `secure=false` in dev/test which breaks functionality.
  - Fix: Explicitly force `secure: true` if `sameSite === 'none'`.

- [x] **Set CSRF Cookie MaxAge** (High)
  - Location: `apps/api/src/common/controllers/csrf.controller.ts:16`
  - Issue: No maxAge configured; tokens persist indefinitely.
  - Fix: Add `maxAge` (e.g., 1 hour) to cookie options.

### MEDIUM PRIORITY

- [x] **Fix Cache Key Serialization Collision**
  - Location: `apps/api/src/pm/portfolio/portfolio.service.ts:44-50`
  - Issue: `JSON.stringify` key order isn't guaranteed, causing cache misses.
  - Fix: Use deterministic serialization (e.g., sort keys or use hash).

- [x] **Add Error Logging for Silent Cache Failures**
  - Location: `apps/api/src/pm/portfolio/portfolio.service.ts:205-223`
  - Issue: Cache errors are swallowed.
  - Fix: Add logger.error() in catch block.

- [x] **Add Date Range Validation**
  - Location: `apps/api/src/pm/portfolio/portfolio.service.ts:37-42`
  - Issue: No check for `from > to`.
  - Fix: Add class-validator check in DTO.

- [x] **Document Database Indexes**
  - Issue: Missing documentation for required indexes.
  - Fix: Add index definitions to schema or docs for workspace/project queries.
