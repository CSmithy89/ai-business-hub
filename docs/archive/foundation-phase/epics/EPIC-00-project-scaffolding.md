# Epic 00: Project Scaffolding & Core Setup

**Epic ID:** EPIC-00
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 1 - Core Foundation

---

## Epic Overview

Set up the monorepo structure, development environment, and core tooling for the HYVVE Platform Foundation.

### Business Value
Establishes the foundation for all subsequent development, ensuring consistent tooling, type safety, and developer experience across the platform.

### Success Criteria
- [ ] Monorepo running with `pnpm dev`
- [ ] All packages building successfully
- [ ] Database migrations executable
- [ ] Type checking passing across all packages
- [ ] ESLint/Prettier configured and passing

---

## Stories

### Story 00.1: Initialize Monorepo with Turborepo

**Points:** 3
**Priority:** P0

**As a** developer
**I want** a properly structured monorepo
**So that** I can work efficiently across multiple packages with shared code

**Acceptance Criteria:**
- [ ] Create project with `npx create-turbo@latest hyvve --example basic`
- [ ] Configure workspace structure:
  - `apps/web` - Next.js 15 frontend
  - `apps/api` - NestJS backend
  - `packages/db` - Prisma database package
  - `packages/ui` - Shared UI components
  - `packages/shared` - Types and utilities
- [ ] Configure Turborepo pipelines for build, dev, lint
- [ ] Set up pnpm workspaces
- [ ] Configure TypeScript project references

**Technical Notes:**
- Use pnpm 9.x for package management
- Node.js 20.x LTS required
- Turborepo for task orchestration

---

### Story 00.2: Configure Next.js 15 Frontend

**Points:** 2
**Priority:** P0

**As a** developer
**I want** Next.js 15 with App Router configured
**So that** I can build the frontend with server components and streaming

**Acceptance Criteria:**
- [ ] Initialize Next.js 15 in `apps/web`
- [ ] Configure App Router structure
- [ ] Set up Tailwind CSS 4
- [ ] Add shadcn/ui base configuration
- [ ] Configure environment variables
- [ ] Add base layout with theme support (dark/light)

**Technical Notes:**
- Use `next.config.ts` (TypeScript config)
- Enable typedRoutes for type-safe routing
- Configure image optimization domains

---

### Story 00.3: Configure NestJS Backend

**Points:** 2
**Priority:** P0

**As a** developer
**I want** NestJS 10 configured for modular business logic
**So that** I can build scalable backend modules

**Acceptance Criteria:**
- [ ] Initialize NestJS in `apps/api`
- [ ] Configure base modules (App, Common)
- [ ] Set up Swagger/OpenAPI documentation
- [ ] Configure environment validation
- [ ] Add health check endpoint
- [ ] Configure CORS for frontend origin

**Technical Notes:**
- Use NestJS 10.x
- Configure `nest-cli.json` for Swagger plugin
- Add validation pipe globally

---

### Story 00.4: Set Up Database Package with Prisma

**Points:** 3
**Priority:** P0

**As a** developer
**I want** Prisma configured with the database schema
**So that** I have type-safe database access across all apps

**Acceptance Criteria:**
- [ ] Initialize Prisma in `packages/db`
- [ ] Copy `schema.prisma` from `/packages/db/prisma/schema.prisma`
- [ ] Configure PostgreSQL connection (Supabase)
- [ ] Set up Prisma Client export
- [ ] Create tenant extension file (`tenant-extension.ts`)
- [ ] Add migration scripts to package.json
- [ ] Verify migrations run successfully

**Technical Notes:**
- Use Prisma 6.x with preview features
- Configure both DATABASE_URL and DIRECT_URL for pooler
- Enable fullTextSearch and multiSchema preview features

---

### Story 00.5: Configure Docker Development Environment

**Points:** 2
**Priority:** P1

**As a** developer
**I want** local development services in Docker
**So that** I can develop without external dependencies

**Acceptance Criteria:**
- [ ] Create `docker/docker-compose.yml` with:
  - PostgreSQL 16
  - Redis 7
  - AgentOS (Python/FastAPI)
  - pgAdmin (optional)
- [ ] Add volume mounts for data persistence
- [ ] Configure environment variables
- [ ] Add startup script in package.json

**Technical Notes:**
- Use official Docker images
- Mount volumes for data persistence
- Expose standard ports (5432, 6379)

---

### Story 00.6: Set Up Shared Types Package

**Points:** 2
**Priority:** P0

**As a** developer
**I want** shared TypeScript types across packages
**So that** I have consistent type definitions

**Acceptance Criteria:**
- [ ] Create `packages/shared` package
- [ ] Add type definitions:
  - `types/auth.ts` - JWT payload, session types
  - `types/workspace.ts` - Workspace, member types
  - `types/approval.ts` - Approval item types
  - `types/events.ts` - Event bus types
- [ ] Export types from package entry point
- [ ] Configure package.json exports

---

### Story 00.7: Set Up AgentOS Runtime Environment

**Points:** 3
**Priority:** P0

**As a** developer
**I want** AgentOS configured as a Python microservice
**So that** I can run Agno agents with Control Plane monitoring

**Acceptance Criteria:**
- [ ] Create `agents/` directory structure:
  - `agents/platform/` - Platform agents
  - `agents/middleware/` - Custom middleware
  - `agents/config.py` - Configuration
  - `agents/main.py` - FastAPI entry point
- [ ] Create `requirements.txt` with:
  - `agno` - AI agent framework
  - `fastapi` - Web framework
  - `uvicorn` - ASGI server
  - `pyjwt` - JWT handling
  - `sqlalchemy` - Database ORM
  - `psycopg2-binary` - PostgreSQL driver
- [ ] Create `Dockerfile` for AgentOS container
- [ ] Implement tenant middleware (`middleware/tenant.py`):
  - Extract JWT from Authorization header
  - Inject `workspace_id` into request state
- [ ] Update `docker-compose.yml` to include AgentOS service
- [ ] Verify AgentOS starts and responds to health check

**Technical Notes:**
- AgentOS runs on port 7777
- Uses same DATABASE_URL as other services
- JWT secret shared with better-auth for token validation
- Control Plane connection configured via environment

**Reference:**
- ADR-007: AgentOS for Agent Runtime
- Architecture: NestJS ↔ AgentOS Integration

---

## Dependencies

- None (this is the first epic)

## Technical Notes

### File Structure After Completion
```
hyvve/
├── apps/
│   ├── web/            # Next.js 15
│   └── api/            # NestJS 10
├── agents/             # AgentOS (Python/FastAPI)
│   ├── platform/       # Platform agents
│   ├── middleware/     # Tenant middleware
│   ├── main.py         # FastAPI entry
│   ├── config.py       # Configuration
│   ├── requirements.txt
│   └── Dockerfile
├── packages/
│   ├── db/             # Prisma
│   ├── ui/             # shadcn/ui
│   └── shared/         # Types
├── docker/
│   └── docker-compose.yml
├── turbo.json
└── package.json
```

### Commands Available
```bash
pnpm dev        # Start all apps in dev mode
pnpm build      # Build all packages
pnpm lint       # Run ESLint
pnpm db:migrate # Run database migrations
pnpm db:studio  # Open Prisma Studio
```

---

_Epic created: 2025-11-30_
_PRD Reference: Phase 1 - Core Foundation_
