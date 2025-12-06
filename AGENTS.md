# Repository Guidelines

## Mission
- HYVVE targets 90% automation with ~5 hrs/week human involvement; contributors should preserve human-in-the-loop approvals and confidence-based routing.

## Project Structure
- `apps/api`: NestJS backend; tests `src/**/*.spec.ts`.
- `apps/web`: Next.js 15 frontend; Vitest/Playwright in `tests/`.
- `packages/db`: Prisma schema + migrations; run DB scripts here.
- `packages/shared`, `packages/ui`: Shared types/utilities/components.
- `agents/`: Python Agno agents; `docker/`: Compose stack; `docs/`: specs/epics.

## Build, Test, and Development
- Install: `pnpm install` (Node >=20, pnpm >=9).
- Monorepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test`.
- Package targets: `pnpm --filter @hyvve/api dev|test:cov`, `pnpm --filter @hyvve/web dev|test:e2e`, `pnpm --filter @hyvve/db db:migrate`.
- Stack helpers: `pnpm docker:up|down|logs`. BMAD helpers (if enabled): `/bmad:bmm:workflows:story-context`, `/bmad:bmm:workflows:dev-story`, `/bmad:bmm:workflows:code-review`.

## Coding Style & Conventions
- TypeScript strict; avoid `any` (prefer `unknown`); 2-space Prettier formatting via `pnpm format`; ESLint config enforces unused-var rules and button types.
- File/Component naming: `kebab-case.ts` for services/utils, `PascalCase.tsx` for React, hooks `use*.ts`, types in `*.types.ts`.
- Import order: external → internal (`@hyvve/*`, `@/*`) → relative. Prefer named exports for components.
- Multi-tenant: every model/query must include `tenantId` + index; filter by tenant in services.

## Testing
- API: Jest specs `*.spec.ts`, coverage via `test:cov`.
- Web: Vitest unit/UI `*.test.{ts,tsx}`; Playwright e2e (`test:e2e`, `test:e2e:headed` for debugging).
- Quick pre-PR sweep: `pnpm type-check && pnpm lint && pnpm test:unit`.

## Commit & PR Expectations
- Commits: short imperative; include story/issue when relevant (e.g., “Fix password match indicator for Story 14-15”).
- PRs: one feature/fix, <~400 LOC; describe scope/risks, link issues, add UI screenshots, note migrations/config changes; list commands run (lint/type-check/tests/e2e).
- Before picking work, check current epic/story in `docs/sprint-artifacts/sprint-status.yaml` and use BMAD commands for context.

## Security & Architecture Notes
- Secrets live in `.env*`; never commit them. Keep JWT/auth hardened (short expirations, bcrypt >=12). Validate input with Zod/class-validator; sanitize HTML output.
- Prisma: after schema changes run `pnpm --filter @hyvve/db db:migrate` then rebuild dependents.
- AgentOS/Agno: reuse agents (never create in loops), set `output_schema` for structured responses, use Postgres in prod (SQLite dev only), prefer single-agent workflows before teams; add chat history when context matters; set `search_knowledge=true` when using knowledge bases.
- Python agents: install deps via `pip install -r agents/requirements.txt` in a venv; keep agent configs and keys out of VCS.

## AI Tooling (MCP Servers)
- Playwright: browser automation/testing (`browser_navigate`, `browser_snapshot`) for UI checks.
- Context7: live library docs lookup (`resolve-library-id`, `get-library-docs`) for Next.js/NestJS/Prisma/Tailwind.
- Serena: semantic code refactors (`find_symbol`, `replace_symbol_body`, `rename_symbol`)—prefer over broad file edits.
- shadcn registry: search/add UI components.
- 21st Magic: generate/refine React components or logos.
- DeepWiki: ask questions about external repos for patterns/reference.
