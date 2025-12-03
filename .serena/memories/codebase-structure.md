# HYVVE Platform - Codebase Structure

## Root Directory
```
/
├── apps/                    # Application packages
│   ├── web/                 # Next.js 15 frontend
│   └── api/                 # NestJS backend
│
├── packages/                # Shared packages
│   └── db/                  # Prisma schema + migrations
│
├── agents/                  # Python AgentOS runtime
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Environment config
│   ├── platform/            # Core platform agents
│   │   ├── approval_agent.py
│   │   └── tools/
│   ├── validation/          # Business validation agents
│   ├── planning/            # Business planning agents
│   ├── branding/            # Brand development agents
│   └── crm/                 # CRM agents
│
├── docs/                    # Documentation
│   ├── prd.md
│   ├── architecture.md
│   ├── ux-design.md
│   ├── epics/               # Epic definitions
│   ├── stories/             # Story files
│   └── sprint-artifacts/    # Sprint tracking
│
├── .bmad/                   # BMAD workflows & agents
├── docker/                  # Docker configuration
└── tests/                   # E2E tests
```

## Frontend Structure (apps/web/src/)
```
├── app/                     # Next.js App Router
│   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── approvals/       # Approval queue
│   │   ├── workspaces/      # Workspace management
│   │   └── settings/        # Settings pages
│   └── api/                 # API routes (better-auth)
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── approval/            # Approval-specific components
│   └── workspace/           # Workspace components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities (auth.ts, api.ts)
└── types/                   # TypeScript types
```

## Backend Structure (apps/api/src/)
```
├── main.ts                  # NestJS entry point
├── app.module.ts            # Root module
├── common/                  # Shared utilities
│   ├── decorators/          # Custom decorators
│   ├── guards/              # Auth guards
│   └── services/            # Shared services (PrismaService)
├── auth/                    # Authentication module
├── approvals/               # Approval queue module
│   ├── approvals.controller.ts
│   ├── approvals.service.ts
│   ├── services/            # Sub-services
│   └── dto/                 # DTOs
├── agentos/                 # AgentOS bridge module
└── health/                  # Health check endpoints
```

## Database (packages/db/)
```
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Migration files
├── src/
│   ├── index.ts             # Prisma client export
│   ├── tenant-extension.ts  # Multi-tenant extension
│   └── rls-context.ts       # RLS context helpers
```
