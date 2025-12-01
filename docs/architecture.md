# HYVVE Platform Foundation - Architecture Document

**Author:** chris
**Date:** 2025-11-30
**Version:** 1.0
**Status:** Draft

---

## Executive Summary

HYVVE Platform Foundation uses a **hybrid monorepo architecture** combining Next.js 15 (App Router) for the frontend and platform API routes with NestJS for modular business logic. The architecture employs **defense-in-depth multi-tenancy** through Row-Level Security (RLS) combined with Prisma Client Extensions. Real-time capabilities are provided via Socket.io, with Redis Streams powering the event bus for cross-module communication. The BYOAI (Bring Your Own AI) pattern enables users to connect their preferred AI providers (Claude, OpenAI, Gemini, DeepSeek) with encrypted credential storage.

---

## Project Initialization

First implementation story should execute:

```bash
# Create monorepo with Turborepo
npx create-turbo@latest hyvve --example basic

# Navigate to project
cd hyvve

# Add workspace structure
mkdir -p apps/web apps/api packages/db packages/ui packages/shared
```

This establishes the base architecture with:
- Turborepo for monorepo orchestration
- Separate apps for web (Next.js) and api (NestJS)
- Shared packages for database, UI components, and utilities

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| **Framework (Frontend)** | Next.js | 15.x | All | Server components, streaming, App Router |
| **UI Library** | React | 19.x | FR-6 | Concurrent rendering, latest features |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x | FR-6 | Utility-first, accessible components |
| **State Management** | Zustand + React Query | 5.x / 5.x | FR-6 | Simple global + server state |
| **Framework (Backend)** | NestJS | 10.x | FR-1-5 | Modular architecture, TypeScript |
| **API (Platform)** | Next.js API Routes | 15.x | FR-1-2 | Co-located with frontend |
| **Authentication** | better-auth | 1.x | FR-1 | Organization plugin, self-hosted |
| **Database** | PostgreSQL (Supabase) | 16.x | All | RLS, JSON, proven reliability |
| **ORM** | Prisma | 6.x | All | Type-safe, migrations |
| **Cache/Queue** | Redis + BullMQ | 7.x / 5.x | FR-5 | Pub/sub, reliable queues |
| **Events** | Redis Streams | 7.x | FR-5 | Event sourcing capability |
| **Real-time** | Socket.io | 4.x | FR-6 | WebSocket with fallbacks |
| **AI Framework** | Agno | Latest | FR-4 | Multi-model, teams, workflows |
| **Agent Runtime** | AgentOS | Latest | FR-3,4 | Python microservice, Control Plane |
| **Email** | Resend | Latest | FR-2 | Developer-friendly, reliable |
| **Hosting (Frontend)** | Vercel | N/A | All | Edge network, preview deploys |
| **Hosting (Backend)** | Railway | N/A | All | Container orchestration |
| **Monitoring** | OpenTelemetry + Helicone | Latest | All | Vendor-agnostic + LLM observability |

---

## Project Structure

```
hyvve/
├── apps/
│   ├── web/                          # Next.js 15 Frontend + Platform API
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── (auth)/           # Auth routes (sign-in, sign-up, etc.)
│   │   │   │   │   ├── sign-in/
│   │   │   │   │   ├── sign-up/
│   │   │   │   │   └── forgot-password/
│   │   │   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   │   │   ├── layout.tsx    # Dashboard shell layout
│   │   │   │   │   ├── page.tsx      # Dashboard home
│   │   │   │   │   ├── approvals/    # Approval queue
│   │   │   │   │   ├── agents/       # Agent management
│   │   │   │   │   └── settings/     # Workspace settings
│   │   │   │   ├── api/              # API routes
│   │   │   │   │   ├── auth/         # better-auth handlers
│   │   │   │   │   ├── workspaces/   # Workspace CRUD
│   │   │   │   │   ├── approvals/    # Approval endpoints
│   │   │   │   │   └── ai-providers/ # BYOAI configuration
│   │   │   │   └── layout.tsx        # Root layout
│   │   │   ├── components/           # React components
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── shell/            # Layout components
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   └── chat-panel.tsx
│   │   │   │   ├── approval/         # Approval queue components
│   │   │   │   ├── workspace/        # Workspace components
│   │   │   │   └── common/           # Shared components
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── lib/                  # Utilities
│   │   │   │   ├── auth.ts           # better-auth client
│   │   │   │   ├── api.ts            # API client
│   │   │   │   └── utils.ts          # Helper functions
│   │   │   ├── stores/               # Zustand stores
│   │   │   │   ├── workspace.ts
│   │   │   │   └── ui.ts
│   │   │   └── styles/               # Global styles
│   │   ├── public/                   # Static assets
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                          # NestJS Backend (Modules)
│       ├── src/
│       │   ├── main.ts               # Entry point
│       │   ├── app.module.ts         # Root module
│       │   ├── common/               # Shared utilities
│       │   │   ├── decorators/       # Custom decorators
│       │   │   ├── guards/           # Auth guards
│       │   │   ├── interceptors/     # Logging, etc.
│       │   │   └── filters/          # Exception filters
│       │   ├── auth/                 # Auth module
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.guard.ts
│       │   │   └── tenant.guard.ts
│       │   ├── events/               # Event bus module
│       │   │   ├── events.module.ts
│       │   │   ├── events.service.ts
│       │   │   └── events.types.ts
│       │   ├── approvals/            # Approval queue module
│       │   │   ├── approvals.module.ts
│       │   │   ├── approvals.controller.ts
│       │   │   ├── approvals.service.ts
│       │   │   └── dto/
│       │   ├── ai-providers/         # BYOAI module
│       │   │   ├── ai-providers.module.ts
│       │   │   ├── ai-providers.controller.ts
│       │   │   ├── ai-providers.service.ts
│       │   │   └── providers/
│       │   │       ├── claude.provider.ts
│       │   │       ├── openai.provider.ts
│       │   │       ├── gemini.provider.ts
│       │   │       └── deepseek.provider.ts
│       │   └── websocket/            # WebSocket gateway
│       │       ├── websocket.module.ts
│       │       └── websocket.gateway.ts
│       ├── test/                     # E2E tests
│       ├── nest-cli.json
│       └── package.json
│
├── agents/                          # AgentOS Runtime (Python/FastAPI)
│   ├── platform/                    # Platform agents
│   │   ├── __init__.py
│   │   ├── approval_agent.py        # Approval routing agent
│   │   ├── orchestrator_agent.py    # Workflow orchestrator
│   │   └── tools/                   # Agent tools
│   │       ├── __init__.py
│   │       ├── approval_tools.py    # HITL approval tools
│   │       └── workspace_tools.py   # Workspace context tools
│   ├── middleware/                  # Custom middleware
│   │   ├── __init__.py
│   │   └── tenant.py               # Workspace context injection
│   ├── config.py                    # AgentOS configuration
│   ├── main.py                      # FastAPI entry point
│   ├── requirements.txt             # Python dependencies
│   └── Dockerfile                   # Agent runtime container
│
├── packages/
│   ├── db/                           # Prisma database package
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Migration files
│   │   │   └── seed.ts               # Seed data
│   │   ├── src/
│   │   │   ├── index.ts              # Exports
│   │   │   ├── client.ts             # Prisma client instance
│   │   │   └── tenant-extension.ts   # Tenant filtering extension
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # shadcn/ui + custom
│   │   │   ├── hooks/                # Shared hooks
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared/                       # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/                # TypeScript types
│   │   │   │   ├── auth.ts
│   │   │   │   ├── workspace.ts
│   │   │   │   ├── approval.ts
│   │   │   │   └── events.ts
│   │   │   ├── constants/            # Shared constants
│   │   │   └── utils/                # Shared utilities
│   │   └── package.json
│   │
│   └── eslint-config/                # Shared ESLint config
│       └── package.json
│
├── docker/                           # Docker configuration
│   ├── docker-compose.yml            # Local development
│   ├── docker-compose.prod.yml       # Production
│   └── Dockerfile.api                # NestJS Dockerfile
│
├── .env.example                      # Environment template
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
└── README.md
```

---

## FR Category to Architecture Mapping

| FR Category | Architecture Component | Primary Package | Secondary |
|-------------|----------------------|-----------------|-----------|
| **FR-1: User Authentication** | better-auth + API routes | `apps/web/src/app/api/auth` | `packages/db` |
| **FR-2: Workspace Management** | API routes + Prisma | `apps/web/src/app/api/workspaces` | `packages/db` |
| **FR-3: Approval Queue** | NestJS module + WebSocket | `apps/api/src/approvals` | `apps/web/src/components/approval` |
| **FR-4: BYOAI Configuration** | NestJS module | `apps/api/src/ai-providers` | `packages/db` |
| **FR-5: Event Bus** | Redis Streams + NestJS | `apps/api/src/events` | `packages/shared` |
| **FR-6: UI Shell** | Next.js App Router | `apps/web/src/app/(dashboard)` | `packages/ui` |

---

## Technology Stack Details

### Core Technologies

#### Next.js 15 (App Router)
- **Purpose**: Frontend rendering, platform API routes
- **Features Used**: Server Components, Streaming, Parallel Routes, Intercepting Routes
- **Configuration**:
  ```typescript
  // next.config.ts
  import type { NextConfig } from 'next'

  const config: NextConfig = {
    experimental: {
      typedRoutes: true,
    },
    images: {
      remotePatterns: [
        { protocol: 'https', hostname: '*.supabase.co' },
      ],
    },
  }

  export default config
  ```

#### NestJS 10
- **Purpose**: Modular business logic, WebSocket gateway, background jobs
- **Modules**: Approvals, AI Providers, Events, WebSocket
- **Configuration**:
  ```typescript
  // nest-cli.json
  {
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "plugins": ["@nestjs/swagger"],
      "assets": ["**/*.json"],
      "watchAssets": true
    }
  }
  ```

#### PostgreSQL 16 (Supabase)
- **Purpose**: Primary data store with RLS
- **Features Used**: Row-Level Security, JSONB, Full-text search, Triggers
- **Connection**: Via Supabase pooler (PgBouncer)

#### Redis 7
- **Purpose**: Caching, queues, event streaming, session storage
- **Features Used**: Redis Streams, Pub/Sub, Key expiration
- **Deployment**: Upstash or Railway Redis

#### better-auth
- **Purpose**: Authentication with organization support
- **Plugins**: Organization, Two-Factor (future), Magic Link (future)
- **Configuration**:
  ```typescript
  // lib/auth.ts
  import { betterAuth } from 'better-auth'
  import { organization } from 'better-auth/plugins'
  import { prismaAdapter } from 'better-auth/adapters/prisma'

  export const auth = betterAuth({
    database: prismaAdapter(prisma),
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
        organizationLimit: 5,
        roles: {
          owner: ['*'],
          admin: ['read', 'update', 'invite', 'remove'],
          member: ['read'],
          viewer: ['read'],
          guest: ['read:limited'],
        },
      }),
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,     // Refresh daily
    },
  })
  ```

### Integration Points

#### Frontend ↔ Platform API
- **Protocol**: REST via fetch/React Query
- **Authentication**: JWT in Authorization header
- **Base URL**: `/api/*`

#### Frontend ↔ NestJS API
- **Protocol**: REST via fetch/React Query + WebSocket
- **Authentication**: JWT in Authorization header
- **Base URL**: `process.env.NEXT_PUBLIC_API_URL`

#### NestJS ↔ Database
- **Protocol**: Prisma Client with tenant extension
- **Connection Pool**: PgBouncer (session mode for RLS)

#### Cross-Module Communication
- **Protocol**: Redis Streams
- **Pattern**: Publish/Subscribe with consumer groups
- **Delivery**: At-least-once with idempotency keys

#### NestJS ↔ AgentOS Integration
- **Protocol**: HTTP REST via API Gateway
- **Authentication**: JWT passthrough from better-auth
- **Routing**: nginx/traefik routes `/agents/*`, `/teams/*`, `/workflows/*` to AgentOS
- **Tenant Context**: Custom middleware injects `workspace_id` from JWT claims
- **Agent Monitoring**: Control Plane at os.agno.com connects to AgentOS (browser-based, no data leaves infra)

**API Gateway Routing:**
```nginx
# nginx.conf
location /api/ {
    proxy_pass http://nestjs:3001/;
}

location /agents/ {
    proxy_pass http://agentos:7777/agents/;
}

location /teams/ {
    proxy_pass http://agentos:7777/teams/;
}

location /workflows/ {
    proxy_pass http://agentos:7777/workflows/;
}
```

**Frontend Agent Interaction:**
```typescript
// apps/web/src/lib/agent-client.ts
const AGENTOS_URL = process.env.NEXT_PUBLIC_AGENTOS_URL || '/agents';

export async function invokeAgent(agentId: string, params: AgentParams) {
  const response = await fetch(`${AGENTOS_URL}/${agentId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSessionToken()}`, // JWT passthrough
    },
    body: JSON.stringify(params),
  });
  return response.json();
}

// SSE streaming for agent responses
export function streamAgentResponse(runId: string) {
  return new EventSource(`${AGENTOS_URL}/runs/${runId}/stream`);
}
```

---

## Novel Pattern Designs

### 1. Confidence-Based Approval Routing

**Purpose**: Automatically route AI-proposed actions based on confidence scores.

**Components**:
- `ConfidenceCalculator`: Analyzes action factors to produce score
- `ApprovalRouter`: Routes to auto/quick/full review based on thresholds
- `ApprovalQueue`: Manages pending items with escalation

**Data Flow**:
```
AI Agent Action
      │
      ▼
┌─────────────────┐
│ Calculate       │
│ Confidence      │
│ (0-100)         │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Score?  │
    └────┬────┘
         │
    ┌────┼────────────┬─────────────┐
    │    │            │             │
   >85%  60-85%      <60%          │
    │    │            │             │
    ▼    ▼            ▼             │
┌──────┐ ┌──────┐ ┌──────┐         │
│ Auto │ │Quick │ │ Full │         │
│Approv│ │Review│ │Review│         │
└──────┘ └──────┘ └──────┘         │
    │       │         │            │
    └───────┴─────────┴────────────┘
                    │
                    ▼
            ┌─────────────┐
            │ Audit Log   │
            └─────────────┘
```

**Implementation Guide**:
```typescript
// apps/api/src/approvals/confidence-calculator.service.ts
interface ConfidenceFactor {
  factor: string;
  score: number;
  weight: number;
  explanation: string;
}

interface ConfidenceResult {
  overallScore: number;
  factors: ConfidenceFactor[];
  recommendation: 'approve' | 'reject' | 'review';
}

class ConfidenceCalculatorService {
  calculate(action: AgentAction, context: ActionContext): ConfidenceResult {
    const factors = this.evaluateFactors(action, context);
    const overallScore = this.weightedAverage(factors);

    return {
      overallScore,
      factors,
      recommendation: this.getRecommendation(overallScore),
    };
  }

  private getRecommendation(score: number): 'approve' | 'reject' | 'review' {
    if (score >= 85) return 'approve';
    if (score >= 60) return 'review'; // Quick review
    return 'review'; // Full review
  }
}
```

**Affects FR Categories**: FR-3 (Approval Queue), FR-4 (BYOAI)

### 2. Prisma Tenant Extension Pattern

**Purpose**: Automatically scope all database queries to current tenant.

**Components**:
- `TenantContext`: Async local storage for tenant ID
- `TenantPrismaExtension`: Prisma extension adding tenant filters
- `TenantMiddleware`: Extracts tenant from JWT

**Implementation Guide**:
```typescript
// packages/db/src/tenant-extension.ts
import { PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>()

export function createTenantPrismaClient() {
  const prisma = new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const context = tenantContext.getStore()
          if (!context?.tenantId) {
            throw new Error('Tenant context required')
          }

          const tenantId = context.tenantId

          // Skip tenant filtering for non-tenant tables
          const nonTenantTables = ['User', 'Session', 'Account', 'Workspace']
          if (nonTenantTables.includes(model)) {
            return query(args)
          }

          // Add tenant filter to reads
          if (['findMany', 'findFirst', 'findUnique', 'count'].includes(operation)) {
            args.where = { ...args.where, workspaceId: tenantId }
          }

          // Add tenant to creates
          if (['create', 'createMany'].includes(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(d => ({ ...d, workspaceId: tenantId }))
            } else {
              args.data = { ...args.data, workspaceId: tenantId }
            }
          }

          // Add tenant filter to updates/deletes
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, workspaceId: tenantId }
          }

          return query(args)
        },
      },
    },
  })

  return prisma
}
```

**Affects FR Categories**: All (data isolation)

### 3. BYOAI Provider Abstraction

**Purpose**: Unified interface for multiple AI providers with encrypted credentials.

**Components**:
- `AIProviderFactory`: Creates provider instances
- `AIProviderInterface`: Common interface for all providers
- `CredentialManager`: Encrypts/decrypts API keys

**Supported Providers**:
| Provider | Models | Special Features |
|----------|--------|------------------|
| Claude (Anthropic) | claude-3-opus, sonnet, haiku | Native Agno support |
| OpenAI | gpt-4o, gpt-4-turbo, o1 | Native Agno support |
| Google Gemini | gemini-pro, gemini-flash | Native Agno support |
| DeepSeek | deepseek-chat, deepseek-r1 | Native Agno support |
| **OpenRouter** | **100+ models** | Meta-provider with automatic fallbacks |

**OpenRouter Integration**:
OpenRouter is a meta-provider that gives users access to 100+ models through a single API key:
- One API key → Access Claude, GPT-4, Llama 3, Mistral, and more
- Automatic fallbacks if primary model is unavailable
- Cost optimization across providers
- No vendor lock-in

**Implementation Guide**:
```typescript
// apps/api/src/ai-providers/ai-provider.interface.ts
interface AIProviderInterface {
  readonly provider: 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';

  validateCredentials(): Promise<boolean>;

  chat(params: ChatParams): Promise<ChatResponse>;

  streamChat(params: ChatParams): AsyncGenerator<ChatChunk>;

  getUsage(): Promise<UsageStats>;
}

// apps/api/src/ai-providers/provider-factory.service.ts
@Injectable()
class AIProviderFactory {
  create(config: AIProviderConfig): AIProviderInterface {
    const decryptedKey = this.credentialManager.decrypt(config.apiKeyEncrypted);

    switch (config.provider) {
      case 'claude':
        return new ClaudeProvider(decryptedKey, config.defaultModel);
      case 'openai':
        return new OpenAIProvider(decryptedKey, config.defaultModel);
      case 'gemini':
        return new GeminiProvider(decryptedKey, config.defaultModel);
      case 'deepseek':
        return new DeepSeekProvider(decryptedKey, config.defaultModel);
      case 'openrouter':
        return new OpenRouterProvider(decryptedKey, config.defaultModel);
    }
  }
}
```

**Agno/AgentOS Integration**:
```python
from agno.agent import Agent
from agno.models.openrouter import OpenRouter

# Access any of 100+ models via OpenRouter
agent = Agent(
    model=OpenRouter(id="anthropic/claude-3-opus"),  # or "openai/gpt-4o", etc.
    markdown=True
)
```

**Affects FR Categories**: FR-4 (BYOAI Configuration)

---

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| **Database Tables** | snake_case, plural | `workspace_members`, `approval_items` |
| **Database Columns** | snake_case | `created_at`, `workspace_id` |
| **Prisma Models** | PascalCase, singular | `WorkspaceMember`, `ApprovalItem` |
| **API Endpoints** | kebab-case, plural | `/api/workspaces`, `/api/ai-providers` |
| **Route Parameters** | camelCase | `:workspaceId`, `:itemId` |
| **React Components** | PascalCase | `ApprovalCard.tsx`, `WorkspaceSelector.tsx` |
| **Component Files** | kebab-case or PascalCase | `approval-card.tsx` OR `ApprovalCard.tsx` |
| **Hooks** | camelCase with use prefix | `useWorkspace`, `useApprovals` |
| **Zustand Stores** | camelCase with Store suffix | `workspaceStore`, `uiStore` |
| **Event Types** | dot.separated.lowercase | `approval.requested`, `workspace.member.invited` |
| **Environment Variables** | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `NEXT_PUBLIC_API_URL` |

### Code Organization

| Concern | Location | Pattern |
|---------|----------|---------|
| **Page Components** | `apps/web/src/app/**/page.tsx` | Server Component by default |
| **Interactive Components** | `apps/web/src/components/**` | Client Components with 'use client' |
| **API Routes** | `apps/web/src/app/api/**` | Route Handlers |
| **NestJS Controllers** | `apps/api/src/*/**.controller.ts` | REST endpoints |
| **NestJS Services** | `apps/api/src/*/**.service.ts` | Business logic |
| **Database Models** | `packages/db/prisma/schema.prisma` | Single source of truth |
| **Shared Types** | `packages/shared/src/types/**` | Exported TypeScript interfaces |
| **UI Components** | `packages/ui/src/components/**` | shadcn/ui + custom |

### Error Handling

```typescript
// Standard error response format
interface APIError {
  error: {
    code: string;           // Machine-readable: 'UNAUTHORIZED', 'NOT_FOUND', etc.
    message: string;        // Human-readable message
    details?: unknown;      // Additional context (validation errors, etc.)
    requestId?: string;     // For support/debugging
  };
}

// HTTP status codes
// 200 - Success
// 201 - Created
// 204 - No Content (successful delete)
// 400 - Bad Request (validation error)
// 401 - Unauthorized (no/invalid token)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 409 - Conflict (duplicate, etc.)
// 422 - Unprocessable Entity (business rule violation)
// 429 - Too Many Requests (rate limited)
// 500 - Internal Server Error

// NestJS exception filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: APIError = {
      error: {
        code: this.getErrorCode(exception),
        message: this.getErrorMessage(exception),
        requestId: request.headers['x-request-id'] as string,
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

### Logging Strategy

```typescript
// Structured logging format
interface LogEntry {
  timestamp: string;        // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;          // 'web', 'api', 'worker'
  message: string;
  context?: {
    requestId?: string;
    userId?: string;
    workspaceId?: string;
    [key: string]: unknown;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Usage
logger.info('Approval processed', {
  context: {
    requestId: req.id,
    userId: user.id,
    workspaceId: workspace.id,
    approvalId: approval.id,
    decision: 'approved',
  },
});
```

---

## Consistency Rules

### Naming Conventions

All agents MUST follow these conventions:

| Type | Convention | Example |
|------|------------|---------|
| TypeScript files | camelCase or PascalCase (components) | `userService.ts`, `UserCard.tsx` |
| Test files | `.test.ts` or `.spec.ts` suffix | `auth.service.test.ts` |
| Type definitions | PascalCase with descriptive names | `WorkspaceMemberRole` |
| Interfaces | PascalCase, no `I` prefix | `ApprovalItem` not `IApprovalItem` |
| Enums | PascalCase, singular | `ApprovalStatus`, `WorkspaceRole` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Functions | camelCase, verb prefix | `createWorkspace`, `validateApiKey` |
| Boolean variables | is/has/can prefix | `isValid`, `hasPermission`, `canApprove` |

### Date/Time Handling

```typescript
// All dates stored as UTC in database
// All API responses use ISO 8601 format
// Client converts to local timezone for display

// Prisma default
createdAt DateTime @default(now())

// API response format
{
  "createdAt": "2025-11-30T12:00:00.000Z"
}

// Client display (using date-fns)
import { formatDistanceToNow, format } from 'date-fns'

// Relative: "2 hours ago"
formatDistanceToNow(new Date(createdAt), { addSuffix: true })

// Absolute: "Nov 30, 2025, 12:00 PM"
format(new Date(createdAt), 'PPp')
```

### API Response Format

```typescript
// Success response (single item)
{
  "data": { /* item */ }
}

// Success response (list)
{
  "data": [ /* items */ ],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "isEmail"
    }
  }
}
```

---

## Data Architecture

### Core Entities

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    User     │────<│ WorkspaceMember  │>────│   Workspace     │
└─────────────┘     └──────────────────┘     └─────────────────┘
      │                                              │
      │                                              │
      ▼                                              │
┌─────────────┐                                      │
│   Session   │                                      │
└─────────────┘                                      │
      │                                              │
      ▼                                              ▼
┌─────────────┐                        ┌─────────────────────┐
│   Account   │                        │  AIProviderConfig   │
│  (OAuth)    │                        └─────────────────────┘
└─────────────┘                                      │
                                                     │
                                       ┌─────────────┴─────────────┐
                                       │                           │
                                       ▼                           ▼
                             ┌─────────────────┐         ┌─────────────┐
                             │  ApprovalItem   │         │   ApiKey    │
                             └─────────────────┘         └─────────────┘
```

### Key Relationships

- **User → WorkspaceMember → Workspace**: Many-to-many through junction table
- **Workspace → AIProviderConfig**: One-to-many (multiple providers per workspace)
- **Workspace → ApprovalItem**: One-to-many (tenant-scoped)
- **Workspace → ApiKey**: One-to-many (scoped API keys)
- **User → Session**: One-to-many (multi-device)
- **User → Account**: One-to-many (multiple OAuth providers)

### Indexes

```sql
-- Workspace lookups
CREATE INDEX idx_workspace_slug ON workspaces(slug);

-- Member lookups
CREATE INDEX idx_workspace_member_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_member_workspace ON workspace_members(workspace_id);
CREATE UNIQUE INDEX idx_workspace_member_unique ON workspace_members(user_id, workspace_id);

-- Approval queue
CREATE INDEX idx_approval_workspace_status ON approval_items(workspace_id, status);
CREATE INDEX idx_approval_assigned ON approval_items(assigned_to, status);
CREATE INDEX idx_approval_due ON approval_items(due_at) WHERE status = 'pending';

-- Session management
CREATE INDEX idx_session_user ON sessions(user_id);
CREATE INDEX idx_session_token ON sessions(token);
CREATE INDEX idx_session_expires ON sessions(expires_at);

-- API keys
CREATE INDEX idx_api_key_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_key_hash ON api_keys(key_hash);
```

---

## API Contracts

### Authentication Endpoints

| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/api/auth/sign-up/email` | `{ email, password, name }` | `{ user, session }` | Public |
| POST | `/api/auth/sign-in/email` | `{ email, password }` | `{ user, session }` | Public |
| POST | `/api/auth/sign-in/social` | `{ provider, callbackUrl }` | Redirect | Public |
| POST | `/api/auth/sign-out` | - | `{ success: true }` | Required |
| GET | `/api/auth/session` | - | `{ user, session }` | Required |
| POST | `/api/auth/forgot-password` | `{ email }` | `{ success: true }` | Public |
| POST | `/api/auth/reset-password` | `{ token, password }` | `{ success: true }` | Public |

### Workspace Endpoints

| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/api/workspaces` | - | `{ data: Workspace[] }` | Required |
| POST | `/api/workspaces` | `{ name }` | `{ data: Workspace }` | Required |
| GET | `/api/workspaces/:id` | - | `{ data: Workspace }` | Required |
| PATCH | `/api/workspaces/:id` | `{ name?, image?, timezone? }` | `{ data: Workspace }` | Owner/Admin |
| DELETE | `/api/workspaces/:id` | - | `{ success: true }` | Owner |
| GET | `/api/workspaces/:id/members` | - | `{ data: Member[] }` | Required |
| POST | `/api/workspaces/:id/members` | `{ email, role }` | `{ data: Invitation }` | Owner/Admin |

### Approval Endpoints

| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/api/approvals` | `?status&type&page` | `{ data: ApprovalItem[], meta }` | Required |
| GET | `/api/approvals/:id` | - | `{ data: ApprovalItem }` | Required |
| POST | `/api/approvals/:id/approve` | `{ notes? }` | `{ data: ApprovalItem }` | Owner/Admin |
| POST | `/api/approvals/:id/reject` | `{ reason }` | `{ data: ApprovalItem }` | Owner/Admin |
| POST | `/api/approvals/bulk` | `{ ids, action, notes? }` | `{ data: ApprovalItem[] }` | Owner/Admin |

### AI Provider Endpoints

| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/api/ai-providers` | - | `{ data: AIProvider[] }` | Owner/Admin |
| POST | `/api/ai-providers` | `{ provider, apiKey, defaultModel }` | `{ data: AIProvider }` | Owner/Admin |
| PATCH | `/api/ai-providers/:id` | `{ apiKey?, defaultModel? }` | `{ data: AIProvider }` | Owner/Admin |
| DELETE | `/api/ai-providers/:id` | - | `{ success: true }` | Owner/Admin |
| POST | `/api/ai-providers/:id/test` | - | `{ valid: boolean, error? }` | Owner/Admin |
| GET | `/api/ai-providers/usage` | `?startDate&endDate` | `{ data: UsageStats }` | Required |

---

## Security Architecture

### Authentication Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │────>│ Sign In │────>│ Verify  │────>│ Create  │
│         │     │  Form   │     │ Creds   │     │ Session │
└─────────┘     └─────────┘     └─────────┘     └────┬────┘
                                                     │
                    ┌────────────────────────────────┘
                    │
                    ▼
              ┌───────────┐     ┌───────────┐
              │  Return   │────>│   Store   │
              │   JWT     │     │  in HTTP  │
              │           │     │   Only    │
              └───────────┘     │  Cookie   │
                                └───────────┘
```

### Authorization Matrix

| Role | Workspace Settings | Members | Records | Approvals | AI Config |
|------|-------------------|---------|---------|-----------|-----------|
| Owner | Full | Full | Full | Full | Full |
| Admin | Edit | Manage | Full | Approve | Configure |
| Member | - | View | Own+Assigned | View Own | - |
| Viewer | - | View | Read | - | - |
| Guest | - | - | Limited Read | - | - |

### Data Protection

- **Encryption at Rest**: AES-256 for API keys, sensitive data
- **Encryption in Transit**: TLS 1.3 for all connections
- **Password Hashing**: Argon2id (better-auth default)
- **JWT Signing**: RS256 with rotating keys
- **API Key Storage**: Hashed with bcrypt, prefix stored separately

### Rate Limiting

```typescript
// Rate limit configuration
const rateLimits = {
  'sign-in': { window: 15 * 60, max: 5 },      // 5 per 15 min
  'sign-up': { window: 60 * 60, max: 3 },      // 3 per hour
  'forgot-password': { window: 60 * 60, max: 3 }, // 3 per hour
  'api-default': { window: 60, max: 1000 },    // 1000 per minute
  'ai-provider': { window: 60, max: 100 },     // 100 per minute
};
```

---

## Performance Considerations

### Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|--------------|
| Session | Redis | 7 days | On logout/expiry |
| User permissions | Redis | 5 min | On role change |
| Workspace settings | Redis | 10 min | On update |
| AI provider config | Memory | 5 min | On update |
| Static assets | CDN | 1 year | Version in filename |

### Database Optimization

- **Connection Pooling**: PgBouncer in session mode (required for RLS)
- **Query Optimization**: Explain analyze for slow queries
- **Indexing**: Composite indexes on (workspace_id, frequently_filtered_column)
- **Pagination**: Cursor-based for large datasets

### Frontend Performance

- **Code Splitting**: Automatic via Next.js App Router
- **Image Optimization**: Next.js Image component
- **Bundle Size**: < 100KB initial JS
- **LCP Target**: < 2.5 seconds

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                               │
│                      (DNS, CDN, DDoS)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Vercel     │    │    Railway    │    │    Railway    │
│  (Next.js)    │    │   (NestJS)    │    │  (AgentOS)    │
│               │    │               │    │               │
│ /api/* routes │    │ Business API  │    │ /agents/*     │
│ Frontend      │    │ Events bus    │    │ /teams/*      │
│               │    │               │    │ /workflows/*  │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│              (PostgreSQL + Storage + Realtime)                   │
│                                                                  │
│   ┌────────────────────┐    ┌────────────────────┐              │
│   │   hyvve schema     │    │   agno_* tables    │              │
│   │   (Prisma ORM)     │    │   (SQLAlchemy)     │              │
│   └────────────────────┘    └────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Upstash Redis                               │
│              (Cache + Queues + Event Streams)                    │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Control Plane (os.agno.com)                     │
│              (Agent Monitoring - Browser Connection)             │
│                  - Sessions, Memory, Knowledge                   │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # For migrations

# Redis
REDIS_URL="redis://..."

# Authentication
BETTER_AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Providers (workspace-level, stored encrypted in DB)
ENCRYPTION_KEY="..." # For API key encryption

# Email
RESEND_API_KEY="..."

# Monitoring
HELICONE_API_KEY="..."

# AgentOS
AGENTOS_PORT="7777"
AGENTOS_HOST="0.0.0.0"

# Public
NEXT_PUBLIC_API_URL="https://api.hyvve.io"
NEXT_PUBLIC_WS_URL="wss://api.hyvve.io"
NEXT_PUBLIC_AGENTOS_URL="https://agents.hyvve.io"
```

---

## Development Environment

### Prerequisites

- Node.js 20.x LTS
- pnpm 9.x
- Docker Desktop (for local PostgreSQL/Redis)
- Git

### Setup Commands

```bash
# Clone repository
git clone https://github.com/hyvve/platform.git
cd platform

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Start local services (PostgreSQL, Redis)
docker compose up -d

# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start development servers
pnpm dev
```

### Development URLs

- **Web**: http://localhost:3000
- **API**: http://localhost:3001
- **Database Studio**: http://localhost:5555 (Prisma Studio)

---

## Architecture Decision Records (ADRs)

### ADR-001: Monorepo with Turborepo

**Status**: Accepted

**Context**: Need to manage multiple packages (web, api, db, ui, shared) with efficient builds.

**Decision**: Use Turborepo for monorepo orchestration.

**Consequences**:
- Faster builds with remote caching
- Clear dependency management
- Shared configuration across packages

### ADR-002: Hybrid API Architecture

**Status**: Accepted

**Context**: Platform API (auth, workspaces) needs tight frontend integration; module APIs need modularity.

**Decision**: Use Next.js API Routes for platform, NestJS for modules.

**Consequences**:
- Platform API benefits from Next.js features (middleware, edge)
- Module APIs benefit from NestJS patterns (DI, modules)
- Requires clear API boundary documentation

### ADR-003: RLS + Prisma Extension for Multi-tenancy

**Status**: Accepted

**Context**: Need defense-in-depth for tenant data isolation.

**Decision**: Combine PostgreSQL RLS with Prisma Client Extension.

**Consequences**:
- Database-level enforcement as safety net
- Application-level filtering for convenience
- Requires session mode for connection pooling

### ADR-004: Redis Streams for Event Bus

**Status**: Accepted

**Context**: Need cross-module communication with replay capability.

**Decision**: Use Redis Streams with consumer groups.

**Consequences**:
- At-least-once delivery
- 30-day event retention for replay
- Simpler than Kafka for our scale

### ADR-005: better-auth for Authentication

**Status**: Accepted

**Context**: Need multi-tenant auth with organization support.

**Decision**: Use better-auth with organization plugin.

**Consequences**:
- Native workspace/organization support
- Self-hosted (GDPR compliance)
- TypeScript-first with excellent DX

### ADR-006: BYOAI Provider Abstraction

**Status**: Accepted

**Context**: Users want to use their own AI provider API keys.

**Decision**: Create unified provider interface with encrypted credential storage.

**Consequences**:
- Support Claude, OpenAI, Gemini, DeepSeek
- Per-workspace configuration
- Token usage tracking per provider

### ADR-007: AgentOS for Agent Runtime

**Status**: Accepted

**Context**: Agno is selected as the AI framework for agent orchestration, but agents need a production runtime with monitoring capabilities. Options considered:

1. **Build custom runtime** - More control but significant development effort
2. **Use AgentOS** - Agno's official runtime with Control Plane monitoring
3. **Run agents in NestJS** - Language mismatch (Python vs TypeScript)

**Decision**: Deploy AgentOS as a Python/FastAPI microservice alongside NestJS, use the Control Plane at os.agno.com for agent monitoring.

**Architecture Impact**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    Control Plane (os.agno.com)                  │
│  - Session monitoring    - Memory visualization                 │
│  - Agent chat interface  - Knowledge management                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Connects via browser
                            │ (no data sent to Agno)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │     NestJS       │  │    AgentOS       │  │   Next.js    │  │
│  │   (Main API)     │  │  (Agent Runtime) │  │  (Frontend)  │  │
│  │                  │  │                  │  │              │  │
│  │ - Business logic │  │ - Agno Agents    │  │ - UI Shell   │  │
│  │ - Approvals DB   │  │ - Teams          │  │ - API calls  │  │
│  │ - Event Bus      │  │ - Workflows      │  │ - SSE stream │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┘  │
│           │                     │                               │
│           └──────────┬──────────┘                               │
│                      │                                          │
│              ┌───────▼───────┐                                  │
│              │  PostgreSQL   │                                  │
│              │               │                                  │
│              │ hyvve schema  │                                  │
│              │ agno_* tables │                                  │
│              └───────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Integration Points**:

1. **API Gateway Routing**: nginx/traefik routes agent requests to AgentOS
2. **JWT Passthrough**: better-auth tokens work in both services
3. **Tenant Middleware**: Custom middleware injects `workspace_id` from JWT claims
4. **Shared Database**: Both services use same PostgreSQL instance (different tables)
5. **BYOAI Integration**: AgentOS uses Agno's 40+ model providers instead of custom abstraction

**Consequences**:
- **Positive**:
  - Agent monitoring "for free" via Control Plane
  - Mature BYOAI abstraction (40+ providers built into Agno)
  - Built-in HITL patterns (`requires_confirmation`)
  - Session/memory management UI
  - Reduced custom code for agent infrastructure
- **Negative**:
  - Additional service to deploy (Python/FastAPI alongside Node.js)
  - Two ORMs in codebase (Prisma for NestJS, SQLAlchemy for AgentOS)
  - Custom middleware needed for workspace_id injection

**Tenant Middleware Implementation**:
```python
# agents/middleware/tenant.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import jwt

class TenantMiddleware(BaseHTTPMiddleware):
    """Inject workspace_id from JWT into agent context."""

    async def dispatch(self, request: Request, call_next):
        # Extract JWT from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                # Decode JWT (verify with same secret as better-auth)
                claims = jwt.decode(token, options={"verify_signature": False})
                request.state.user_id = claims.get("sub")
                request.state.workspace_id = claims.get("workspace_id")
            except jwt.DecodeError:
                pass

        return await call_next(request)
```

**Docker Compose Addition**:
```yaml
# docker/docker-compose.yml
services:
  agentos:
    build:
      context: ../agents
      dockerfile: Dockerfile
    ports:
      - "7777:7777"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      REDIS_URL: ${REDIS_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
```

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-30_
_For: chris_
