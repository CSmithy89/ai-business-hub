# Repository Guidelines

## Project Structure & Modules
- Monorepo (Turborepo + pnpm). Apps: `apps/web` (Next.js 15), `apps/api` (NestJS), `apps/agents` (Agno/FastAPI). Shared packages in `packages/{db,ui,shared,config}`; reusable agent code under `agents/`.
- Docs: `README.md`, `docs/architecture.md`, `docs/epics/EPIC-INDEX.md`; sprint artifacts in `docs/sprint-artifacts/` (status in `sprint-status.yaml`). Style refs: `.cursorrules` (Agno rules), `.gemini/styleguide.md` (TypeScript/Nest standards), `CLAUDE.md` (MCP + workflow notes).
- BMAD workflows live in `.bmad/`; story states flow backlog → drafted → ready-for-dev → in-progress → review → done.

## Build, Test, and Development Commands
- Setup: Node 20 (`nvm use`), `pnpm install`.
- Type check: `pnpm type-check` or `pnpm --filter @hyvve/web run type-check`.
- Lint: `pnpm lint`; build: `pnpm build`; dev servers: `pnpm dev`.
- Targeted tests: `pnpm --filter @hyvve/web exec vitest run src/__tests__/approval-quick-actions.test.tsx --pool=threads` (headless CI-friendly). Use Playwright scripts where defined for E2E.
- Pre-commit hooks run type-check, lint-staged, and optional Semgrep; fix failures before committing.

## Coding Style & Naming
- TypeScript strict; avoid `any` (prefer `unknown`). Components PascalCase, utilities kebab-case, types `*.types.ts`, tests `*.test.ts`. Import order: external → internal (`@hyvve/...`, `@/...`) → relative.
- React/Next: functional components, named exports, hooks prefixed with `use`. Tailwind: keep full class strings visible (no dynamic fragments); use inline styles for truly dynamic values.
- Backend: Nest modules per feature; DTOs with class-validator; constructor injection; throw specific HTTP exceptions. Multi-tenant queries must filter by `tenantId` and follow RLS.
- Agents: create once and reuse (never in loops); prefer `output_schema`; Postgres in production, SQLite only for dev.

## Testing Guidelines
- Aim for ~80%+ coverage on new code. Favor unit/integration tests (Vitest) with deterministic data; seed React Query caches over live network calls. Keep tests headless for CI.
- Document commands/env needed; run type-check and relevant tests before raising PRs.

## Commit & Pull Request Guidelines
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), subject ≤72 chars. Keep PRs small (<400 LOC) and single-purpose.
- Before PR: `pnpm type-check`, `pnpm lint`, targeted tests. Provide story/issue links, rationale, and screenshots/logs for UI/API changes.

## MCP & Agent-Specific Notes
- MCP servers: Playwright (browser automation), Serena (semantic edits), Context7 (library docs), 21st Magic (UI components), DeepWiki (repo docs), shadcn registry, Sequential Thinking (planning). Prefer these before manual browsing.
- BMAD reminders: fetch context with `/bmad:bmm:workflows:story-context`, implement via `/bmad:bmm:workflows:dev-story`, move to review with `/bmad:bmm:workflows:code-review`, and update `docs/sprint-artifacts/sprint-status.yaml` accordingly.
