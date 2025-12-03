# HYVVE Platform - Tech Stack

## Frontend (apps/web)
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19 + Tailwind CSS 4 + shadcn/ui
- **State:** React Query (TanStack Query) 5.x + Zustand
- **Auth:** better-auth 1.x
- **Forms:** react-hook-form + zod validation
- **Testing:** Playwright (E2E), Vitest (unit)

## Backend (apps/api)
- **Framework:** NestJS 10.x
- **ORM:** Prisma 6.x
- **Validation:** class-validator + class-transformer
- **Queue:** BullMQ (Redis-backed)
- **Testing:** Jest + Supertest

## Agent System (agents/)
- **Runtime:** Python 3.12+ with FastAPI
- **Framework:** Agno (AI agent framework)
- **HTTP Client:** httpx (async)
- **Port:** 7777

## Database
- **Primary:** PostgreSQL 16 with RLS policies
- **ORM:** Prisma (packages/db)
- **Cache/Queue:** Redis 7

## Infrastructure
- **Monorepo:** Turborepo + pnpm 9.x
- **Containers:** Docker Compose
- **Node:** 20.x (see .nvmrc)

## Key Dependencies by App

### apps/web
- next, react, react-dom
- @tanstack/react-query
- better-auth
- zod, react-hook-form
- lucide-react (icons)
- sonner (toasts)

### apps/api
- @nestjs/common, @nestjs/core
- @prisma/client
- class-validator, class-transformer
- @nestjs/axios, uuid

### agents/
- fastapi, uvicorn
- agno (AI framework)
- httpx, pyjwt
- sqlalchemy, asyncpg
