# HYVVE Platform - Suggested Commands

## Package Manager
This project uses **pnpm** (v9.x). Never use npm or yarn.

## Development

### Start All Services
```bash
# Start Docker services (PostgreSQL, Redis)
pnpm docker:up

# Start development servers (all apps)
pnpm dev

# Or start specific apps
cd apps/web && pnpm dev      # Next.js on :3000
cd apps/api && pnpm dev      # NestJS on :3001
cd agents && uvicorn main:app --reload --port 7777  # AgentOS
```

### Stop Services
```bash
pnpm docker:down             # Stop Docker containers
pnpm docker:reset            # Reset with fresh volumes
```

## Building

```bash
pnpm build                   # Build all packages
pnpm turbo build             # Same, explicit turbo
cd apps/web && pnpm build    # Build specific app
cd apps/api && pnpm build
```

## Testing

```bash
# Backend (NestJS)
cd apps/api && pnpm test           # Unit tests
cd apps/api && pnpm test:watch     # Watch mode
cd apps/api && pnpm test:cov       # Coverage
cd apps/api && pnpm test:e2e       # E2E tests

# Frontend (Next.js)
cd apps/web && pnpm test:e2e       # Playwright E2E
cd apps/web && pnpm test:e2e:ui    # Playwright UI mode

# Python AgentOS
cd agents && pytest
```

## Linting & Formatting

```bash
pnpm lint                    # Lint all packages
pnpm format                  # Format all files
pnpm type-check              # TypeScript check

# Specific apps
cd apps/api && pnpm lint
cd apps/web && pnpm lint
```

## Database

```bash
# Prisma commands (from packages/db or root)
cd packages/db
pnpm prisma generate         # Generate client
pnpm prisma migrate dev      # Run migrations
pnpm prisma migrate deploy   # Production migrations
pnpm prisma studio           # Open Prisma Studio
pnpm prisma db push          # Push schema (dev only)
```

## Docker

```bash
pnpm docker:up               # Start containers
pnpm docker:down             # Stop containers
pnpm docker:logs             # View logs
pnpm docker:ps               # Show running containers
pnpm docker:reset            # Reset with clean volumes
```

## Git Workflow

```bash
git checkout -b story/XX-YY-description  # New story branch
git push -u origin <branch>              # Push new branch
git checkout main && git merge <branch>  # Merge to main
```

## System Utilities (Linux)
- `ls`, `cd`, `pwd` - Navigation
- `cat`, `head`, `tail` - File viewing
- `grep`, `find` - Searching
- `git` - Version control
