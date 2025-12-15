# Epic Technical Specification: Project Scaffolding & Core Setup

Date: 2025-12-01
Author: chris
Epic ID: EPIC-00
Status: Draft

---

## Overview

Epic 00 establishes the foundational infrastructure for the HYVVE Platform - a multi-tenant AI-powered business orchestration platform achieving 90% automation with 5 hours/week human involvement. This epic sets up the hybrid monorepo architecture combining Next.js 15 (App Router) for the frontend with NestJS for modular business logic, plus AgentOS as a Python microservice for AI agent runtime. The scaffolding creates the development environment and core tooling upon which all subsequent epics depend.

This is a **zero-dependency epic** - it must complete before any feature development can begin. The scaffolding creates the workspace structure, database connectivity, shared type definitions, and Docker development environment that enable parallel work streams in subsequent sprints.

## Objectives and Scope

### In Scope

- **Monorepo Structure**: Turborepo-orchestrated workspace with apps/web, apps/api, packages/db, packages/ui, packages/shared
- **Next.js 15 Frontend**: App Router, Tailwind CSS 4, shadcn/ui, dark/light theme support
- **NestJS 10 Backend**: Modular architecture, Swagger/OpenAPI, health check endpoints
- **Prisma Database Package**: Schema, migrations, tenant extension pattern
- **Docker Development Environment**: PostgreSQL 16, Redis 7, AgentOS container, pgAdmin
- **Shared Types Package**: Auth, workspace, approval, and event type definitions
- **AgentOS Runtime**: Python/FastAPI microservice with tenant middleware, Control Plane connection

### Out of Scope

- Authentication implementation (Epic 01)
- Workspace management logic (Epic 02)
- RBAC and multi-tenancy policies (Epic 03)
- Approval queue business logic (Epic 04)
- Event bus implementation (Epic 05)
- BYOAI provider configuration (Epic 06)
- UI shell components beyond base layout (Epic 07)
- Production deployment configuration
- CI/CD pipeline setup

## System Architecture Alignment

This epic implements the foundational layer of the architecture documented in `docs/architecture.md`:

**Project Structure** (Architecture Section: Project Structure):
- Creates the exact folder hierarchy specified in the architecture document
- Establishes the hybrid API pattern: Next.js API Routes for platform + NestJS for modules

**Technology Stack** (Architecture Section: Decision Summary):
- Next.js 15.x with App Router, typedRoutes enabled
- NestJS 10.x with Swagger plugin
- Prisma 6.x with preview features (fullTextSearch, multiSchema)
- PostgreSQL 16 via Supabase connection pooler
- Redis 7 for cache/queue/events

**AgentOS Integration** (ADR-007):
- Python/FastAPI microservice on port 7777
- Tenant middleware for workspace_id injection from JWT
- Shared DATABASE_URL with NestJS services

**Key Constraints**:
- Node.js 20.x LTS required
- pnpm 9.x for package management
- PgBouncer session mode required for RLS (future epics)

---

## Detailed Design

### Services and Modules

| Service/Package | Responsibility | Inputs | Outputs | Owner |
|-----------------|----------------|--------|---------|-------|
| `apps/web` | Frontend rendering, platform API routes | HTTP requests, user interactions | React pages, JSON responses | Frontend |
| `apps/api` | Modular business logic, WebSocket gateway | HTTP/WS requests from frontend | JSON responses, events | Backend |
| `packages/db` | Database access, schema, migrations | Prisma queries | Typed database entities | Backend |
| `packages/ui` | Shared React components (shadcn/ui + custom) | Props | Rendered components | Frontend |
| `packages/shared` | TypeScript types, constants, utilities | N/A | Type definitions | Shared |
| `agents/` | AI agent runtime (AgentOS) | HTTP requests with JWT | Agent responses, SSE streams | AI/Backend |

### Data Models and Contracts

No new data models are created in this epic. The scaffolding prepares the Prisma schema structure defined in the PRD and existing `packages/db/prisma/schema.prisma`:

**Schema Structure Prepared:**
```prisma
// Core entities to be implemented in subsequent epics
model User { ... }           // Epic 01
model Session { ... }        // Epic 01
model Account { ... }        // Epic 01
model Workspace { ... }      // Epic 02
model WorkspaceMember { ... } // Epic 02
model AIProviderConfig { ... } // Epic 06
model ApprovalItem { ... }   // Epic 04
model ApiKey { ... }         // Epic 02
```

**Tenant Extension Pattern** (implemented in Story 00.4):
```typescript
// packages/db/src/tenant-extension.ts
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>()
export function createTenantPrismaClient() { ... }
```

### APIs and Interfaces

**Story 00.3 - NestJS Health Check:**
| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/health` | `{ status: 'ok', timestamp: string }` | Public |

**Story 00.7 - AgentOS Health Check:**
| Method | Path | Response | Auth |
|--------|------|----------|------|
| GET | `/health` | `{ status: 'ok', version: string }` | Public |

**Shared Type Interfaces** (Story 00.6):
```typescript
// packages/shared/src/types/auth.ts
interface JwtPayload {
  sub: string;           // User ID
  sessionId: string;
  workspaceId?: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

// packages/shared/src/types/workspace.ts
type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

// packages/shared/src/types/events.ts
interface BaseEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  correlationId?: string;
  tenantId: string;
  userId: string;
  version: string;
  data: Record<string, any>;
}
```

### Workflows and Sequencing

**Development Setup Flow:**
```
1. Clone repository
2. pnpm install (installs all workspace dependencies)
3. cp .env.example .env.local (configure environment)
4. docker compose up -d (start PostgreSQL, Redis, AgentOS)
5. pnpm db:migrate (run Prisma migrations)
6. pnpm dev (start all apps in parallel via Turborepo)
```

**Turborepo Pipeline Execution:**
```
pnpm dev
├── packages/db → generates Prisma client
├── packages/shared → compiles types
├── packages/ui → builds component library
├── apps/web → starts Next.js dev server (port 3000)
├── apps/api → starts NestJS dev server (port 3001)
└── docker → AgentOS running (port 7777)
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Source |
|--------|--------|--------|
| `pnpm dev` cold start | < 30 seconds | Development efficiency |
| `pnpm build` full build | < 2 minutes | CI/CD readiness |
| Turborepo cache hit build | < 10 seconds | Development efficiency |
| Docker compose startup | < 60 seconds | Development efficiency |
| Next.js HMR | < 500ms | NFR-P1, NFR-P2 (Page load targets imply fast dev experience) |

### Security

| Requirement | Implementation | Reference |
|-------------|----------------|-----------|
| Environment variable isolation | `.env.local` gitignored, `.env.example` template provided | NFR-S1 (encryption at rest) |
| Docker network isolation | Internal bridge network for services | Security best practice |
| No secrets in repository | All credentials via environment variables | NFR-S1 |
| AgentOS JWT validation | Shared BETTER_AUTH_SECRET for token verification | ADR-007 |

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Development reproducibility | Docker volumes for persistent data |
| Recovery from crashes | `docker compose up -d` restarts failed containers |
| Dependency lock | `pnpm-lock.yaml` ensures consistent installs |
| Node version lock | `.nvmrc` specifies Node.js 20.x |

### Observability

| Signal | Implementation | Story |
|--------|----------------|-------|
| NestJS startup logs | Built-in NestJS logger | 00.3 |
| Prisma query logs | `log: ['query', 'error', 'warn']` | 00.4 |
| AgentOS request logs | FastAPI/uvicorn logging | 00.7 |
| Docker container logs | `docker compose logs -f` | 00.5 |

---

## Dependencies and Integrations

### Node.js Dependencies (package.json root)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `turbo` | ^2.x | Monorepo orchestration |
| `typescript` | ^5.x | Type checking |
| `eslint` | ^9.x | Code linting |
| `prettier` | ^3.x | Code formatting |

### apps/web Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `next` | ^15.x | Frontend framework |
| `react` | ^19.x | UI library |
| `tailwindcss` | ^4.x | Styling |
| `@radix-ui/*` | Latest | shadcn/ui primitives |

### apps/api Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@nestjs/core` | ^10.x | Backend framework |
| `@nestjs/swagger` | ^7.x | OpenAPI generation |
| `@nestjs/config` | ^3.x | Environment configuration |

### packages/db Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@prisma/client` | ^6.x | Database client |
| `prisma` | ^6.x | Migration CLI |

### AgentOS Dependencies (requirements.txt)

| Dependency | Version | Purpose |
|------------|---------|---------|
| `agno` | Latest | AI agent framework |
| `fastapi` | ^0.109 | Web framework |
| `uvicorn` | ^0.27 | ASGI server |
| `pyjwt` | ^2.8 | JWT handling |
| `sqlalchemy` | ^2.0 | Database ORM |
| `psycopg2-binary` | ^2.9 | PostgreSQL driver |

### External Services (Development)

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| PostgreSQL | `postgres:16-alpine` | 5432 | Database |
| Redis | `redis:7-alpine` | 6379 | Cache/Queue |
| pgAdmin | `dpage/pgadmin4` | 5050 | Database UI (optional) |

---

## Acceptance Criteria (Authoritative)

### AC-00.1: Monorepo Structure
1. Repository contains `apps/web`, `apps/api`, `packages/db`, `packages/ui`, `packages/shared` directories
2. Running `pnpm install` succeeds without errors
3. Running `pnpm build` builds all packages successfully
4. Running `pnpm lint` passes with no errors
5. Turborepo caching works (second build is faster)

### AC-00.2: Next.js Frontend
1. `apps/web` starts on port 3000
2. App Router structure exists with `src/app` directory
3. Tailwind CSS compiles and applies styles
4. shadcn/ui is initialized (components.json exists)
5. Dark/light mode toggle works in base layout
6. TypeScript type checking passes

### AC-00.3: NestJS Backend
1. `apps/api` starts on port 3001
2. `/health` endpoint returns 200 OK
3. Swagger UI available at `/api/docs`
4. CORS configured to accept requests from localhost:3000
5. Environment validation rejects missing required vars

### AC-00.4: Database Package
1. Prisma schema compiles without errors
2. `pnpm db:migrate` creates/updates database schema
3. `pnpm db:studio` opens Prisma Studio
4. Prisma Client is generated and exported from package
5. Tenant extension file exists with AsyncLocalStorage pattern

### AC-00.5: Docker Environment
1. `docker compose up -d` starts all services
2. PostgreSQL is accessible on port 5432
3. Redis is accessible on port 6379
4. AgentOS is accessible on port 7777
5. Data persists across container restarts (volumes)

### AC-00.6: Shared Types
1. `packages/shared` exports type definitions
2. Types are importable in both `apps/web` and `apps/api`
3. `JwtPayload`, `WorkspaceRole`, `BaseEvent` types are defined
4. Package builds without TypeScript errors

### AC-00.7: AgentOS Runtime
1. `agents/` directory contains required structure
2. `requirements.txt` includes all specified dependencies
3. Dockerfile builds successfully
4. AgentOS starts and responds to `/health`
5. Tenant middleware extracts workspace_id from JWT
6. AgentOS container runs in docker-compose

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-00.1 | Monorepo Structure | Root `package.json`, `turbo.json`, `pnpm-workspace.yaml` | Manual verification, CI build check |
| AC-00.2 | Next.js Frontend | `apps/web/*` | Manual startup, theme toggle, TypeScript check |
| AC-00.3 | NestJS Backend | `apps/api/*` | Health check request, Swagger UI load, CORS test |
| AC-00.4 | Database Package | `packages/db/*` | Migration run, Studio launch, import test |
| AC-00.5 | Docker Environment | `docker/docker-compose.yml` | Container status check, port connectivity |
| AC-00.6 | Shared Types | `packages/shared/*` | Build check, import from apps |
| AC-00.7 | AgentOS Runtime | `agents/*` | Health check, JWT middleware test |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1**: Turborepo cache invalidation issues | Medium | Medium | Pin Turborepo version, clear cache on issues |
| **R2**: Next.js 15 / React 19 breaking changes | Low | High | Use stable versions, monitor release notes |
| **R3**: Prisma 6 preview features instability | Medium | Medium | Isolate preview features, have fallback plan |
| **R4**: Docker networking issues on different OS | Medium | Low | Document platform-specific troubleshooting |
| **R5**: AgentOS Python/Node interop complexity | Low | Medium | Keep interfaces minimal, test JWT flow early |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| **A1**: Developers have Docker Desktop installed | Standard development environment |
| **A2**: Supabase will be used for production PostgreSQL | Architecture decision, free tier available |
| **A3**: Node.js 20 LTS is stable for production | LTS guarantees long-term support |
| **A4**: pnpm 9.x workspace features work as documented | Widely adopted, mature tooling |

### Open Questions

| Question | Owner | Decision Needed By |
|----------|-------|-------------------|
| **Q1**: Should we use Bun instead of pnpm for faster installs? | chris | Before Story 00.1 |
| **Q2**: Do we need pgAdmin in development or is Prisma Studio sufficient? | chris | Before Story 00.5 |
| **Q3**: Should AgentOS use poetry instead of requirements.txt? | chris | Before Story 00.7 |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Smoke Tests** | All services start and respond | Manual + Shell scripts | 100% of health checks |
| **Type Checking** | All TypeScript compiles | `tsc --noEmit` | 100% type coverage |
| **Lint** | Code style compliance | ESLint + Prettier | 0 errors, 0 warnings |
| **Integration** | Cross-package imports work | Manual verification | All exports importable |

### Test Plan

1. **Story 00.1**: Run `pnpm install && pnpm build && pnpm lint`
2. **Story 00.2**: Start Next.js, verify theme toggle, check TypeScript
3. **Story 00.3**: Start NestJS, hit `/health`, verify Swagger UI
4. **Story 00.4**: Run migrations, open Prisma Studio, test client import
5. **Story 00.5**: `docker compose up -d`, verify all ports accessible
6. **Story 00.6**: Import types in apps/web and apps/api, verify no errors
7. **Story 00.7**: Start AgentOS, hit `/health`, test JWT middleware

### Edge Cases to Verify

- Cold start with empty node_modules
- Build with Turborepo cache miss
- Docker restart preserves database data
- Next.js hot reload works after shared package change
- AgentOS handles missing Authorization header gracefully
