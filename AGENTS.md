# Repository Guidelines

## Project Structure & Modules
- Turborepo + pnpm monorepo: `apps/web` (Next 15), `apps/api` (Nest), `apps/agents` (FastAPI/Agno), shared packages in `packages/{db,ui,shared,config}`, and reusable Agno code in `agents/`.
- Key docs: `README.md` (vision/stack), `.cursorrules` (Agno rules), `.gemini/styleguide.md` (TypeScript/Nest/Tailwind standards), `CLAUDE.md` (MCP + BMAD workflow commands), sprint status in `docs/sprint-artifacts/sprint-status.yaml`.
- BMAD workflows live in `.bmad/`; story states flow backlog → drafted → ready-for-dev → in-progress → review → done.

## Build, Test, and Development Commands
- Setup: `nvm use 20`, `pnpm install`; start dev: `pnpm dev` (runs app targets via turbo).
- Quality gates: `pnpm type-check`, `pnpm lint`, `pnpm build`.
- Web tests: `pnpm --filter @hyvve/web test` (Vitest); Playwright E2E supports `PLAYWRIGHT_REPORT_DIR` env for reports.
- Agents/API: use target filters (e.g., `pnpm --filter @hyvve/api test`); prefer local Postgres/Redis per `.env.example`.
- Environment validation: `node scripts/validate-env.js` (fail-fast env checks).
- Encryption key rotation: `pnpm --filter @hyvve/db exec node scripts/rotate-encryption-master-key.js --dry-run` (see `docs/runbooks/key-rotation.md`).

## Coding Style & Naming Conventions
- TypeScript strict; prefer `unknown` over `any`. Imports: external → `@hyvve/...` → relative. Files kebab-case; components PascalCase; hooks prefixed with `use`; types in `*.types.ts`; tests `*.test.ts`.
- React/Next: functional components, named exports, Tailwind class strings fully spelled out (avoid dynamic fragments). Multi-tenant: every query filters by `tenantId`; enforce RLS.
- Nest: one feature per module; DTOs with `class-validator`; constructor injection; throw specific HTTP exceptions.
- Agents (from `.cursorrules`): create once and reuse (never in loops), always set `output_schema`, use Postgres in prod (SQLite only for dev), enable `search_knowledge` when using knowledge bases.

## Testing Guidelines
- Target ≥80% coverage on new code; keep tests deterministic and headless. Mock network/Redis/Prisma where feasible; seed React Query caches instead of live calls.
- Capture auth/base URLs via env in tests; ensure Playwright/Vitest paths produce reports under `PLAYWRIGHT_REPORT_DIR` when set.

## Commit & Pull Request Guidelines
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`), subject ≤72 chars; keep PRs focused (<400 LOC).
- Before PR: run type-check, lint, relevant tests; include story/issue link, rationale, and screenshots/logs for UI/API changes.

## MCP & Workflow Notes
- MCP servers available: Playwright (browser automation), Serena (semantic code edits), Context7 (library docs), 21st Magic (UI components), DeepWiki (repo docs), shadcn registry, Sequential Thinking (planning). Prefer these before manual browsing.
- BMAD commands: `/bmad:bmm:workflows:story-context`, `/bmad:bmm:workflows:dev-story`, `/bmad:bmm:workflows:code-review`; keep sprint status files updated when moving stories across states.
