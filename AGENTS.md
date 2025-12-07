# Repository Guidelines

## Project Structure & Modules
- Monorepo (Turborepo, pnpm). Core apps: `apps/web` (Next.js 15 platform + API routes), `apps/api` (NestJS), `apps/agents` (Python/Agno). Shared packages under `packages/` (`db`, `ui`, `shared`, `config`).
- Key docs: `docs/architecture.md`, `docs/ux-design.md`, `docs/epics/EPIC-INDEX.md`, sprint status in `docs/sprint-artifacts/sprint-status.yaml`, story files in `docs/sprint-artifacts/`.
- Agent guidelines: see `.cursorrules` (Agno patterns) and `.gemini/styleguide.md` (TypeScript/Nest standards). MCP/AI tooling summarized below.

## Build, Test, and Development Commands
- Install: `pnpm install` (root). Use Node 20 (`nvm use`).
- Build all: `pnpm build`
- Dev servers: `pnpm dev`
- Lint: `pnpm lint`
- Type check: `pnpm type-check`
- Targeted tests: `pnpm vitest run apps/web/src/__tests__/rate-limit.test.ts --pool=threads` (example). Use `pnpm test` if configured in package scripts.

## Coding Style & Naming
- TypeScript strict; no `any`. Prefer `unknown` when needed.
- File naming: components `PascalCase.tsx`; utilities `kebab-case.ts`; types in `*.types.ts`; tests `*.test.ts`.
- Imports: external → internal (`@/…`, `@hyvve/...`) → relative.
- React: functional components, named exports, hooks prefixed with `use`. Tailwind: avoid dynamic class fragments; use explicit class strings or inline styles.
- Python/Agno: reuse agents (don’t create in loops); prefer `output_schema`; Postgres in prod, SQLite only for dev.

## Testing Guidelines
- Minimum 80% coverage on new code. Add unit tests for logic and integration tests for API routes (Vitest/Testcontainers). E2E uses Playwright when needed.
- Rate-limit and CSRF tests live in `apps/web/src/__tests__/`; follow existing patterns. Mock fetch responsibly; prefer real Redis containers for rate-limit cases.

## Commit & Pull Request Guidelines
- Conventional commits (e.g., `feat:`, `fix:`, `docs:`); imperative first line ≤72 chars. Keep PRs small (<400 LOC) and single-purpose.
- Before PR: run `pnpm type-check`, `pnpm lint`, and relevant tests. Include rationale and linked story/issue. Add screenshots or logs when UI/API behavior changes.

## MCP & Agent-Specific Notes
- Available MCP servers: Playwright (browser automation), Serena (semantic code edits/refactors), Context7 (library docs lookup), 21st Magic (UI components), DeepWiki (repo docs), shadcn registry, Sequential Thinking (step planning). Prefer these over manual browsing when applicable.
- Follow BMAD workflows in `.bmad/` for story execution; update `sprint-status.yaml` when changing story states.

## Security & Configuration
- Multi-tenant data: always filter by `tenantId` and enforce RLS (see `packages/db`). Validate input with Zod or class-validator; never expose internal errors. BYOAI keys must be encrypted at rest; avoid committing secrets.
