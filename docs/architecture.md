# HYVVE Platform Foundation - Architecture Document

**Author:** chris
**Date:** 2026-01-04
**Version:** 3.0
**Status:** Approved (Foundation + Core-PM + bm-dm Complete)

---

## Executive Summary

HYVVE Platform Foundation uses a **hybrid monorepo architecture** combining Next.js 15 (App Router) for the frontend and platform API routes, NestJS for modular business logic, and AgentOS (FastAPI + Agno) for agent execution. The architecture employs **defense-in-depth multi-tenancy** through Row-Level Security (RLS) combined with Prisma Client Extensions. Real-time capabilities are provided via Socket.io with a WebSocket gateway, with Redis Streams powering the event bus for cross-module communication. The BYOAI (Bring Your Own AI) pattern enables users to connect their preferred AI providers (Claude, OpenAI, Gemini, DeepSeek, OpenRouter) with encrypted credential storage, and AgentOS can decrypt those credentials for agent runs.

**All Phases Complete:** 44 epics (328 stories, ~1,172 points) have been delivered across three phases:
- **Foundation (17 epics):** Multi-provider authentication, 2FA, RBAC, approval queue, event bus, BYOAI, business onboarding, real-time WebSocket, responsive design
- **Core-PM (16 epics):** Project management, knowledge base with RAG, real-time collaboration (Yjs), PM agent team (Navi, Sage, Chrono), KB agent (Scribe)
- **bm-dm (11 epics):** Unified Protocol Architecture (AG-UI + A2A + MCP), CopilotKit integration, generative UI widgets, real-time state sync, event-driven HITL, OpenTelemetry observability

This document focuses on how these pieces are wired together across:

- `apps/web` (Next.js UI + platform routes)
- `apps/api` (NestJS API)
- `agents/` (AgentOS runtime + reusable agent code)
- `packages/*` (shared DB/UI/config modules)

---

## Repository Bootstrapping

This repository is already bootstrapped as a Turborepo monorepo. For local setup and first-run instructions, see `docs/GETTING-STARTED.md`.

High-level entry points:

- Web UI: `apps/web`
- Nest API: `apps/api`
- AgentOS: `agents/`

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
| **Authentication** | better-auth | 1.x | FR-1 | Organization plugin, 2FA, Magic Link, multi-provider OAuth |
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
│   │   │   │   ├── copilot/          # CopilotKit integration (AG-UI)
│   │   │   │   │   ├── CopilotProvider.tsx
│   │   │   │   │   ├── ChatPanel.tsx
│   │   │   │   │   └── widgets/      # Generative UI widgets
│   │   │   │   │       ├── metrics-widget.tsx
│   │   │   │   │       ├── action-widget.tsx
│   │   │   │   │       └── widget-slots.tsx
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
│       │   ├── websocket/            # WebSocket gateway
│       │   │   ├── websocket.module.ts
│       │   │   └── websocket.gateway.ts
│       │   ├── telemetry/            # OpenTelemetry observability
│       │   │   ├── otel.ts           # OTel SDK setup
│       │   │   ├── tracing.ts        # Trace context
│       │   │   └── metrics.ts        # Custom metrics
│       │   └── a2a/                  # A2A Protocol endpoints
│       │       ├── a2a.module.ts
│       │       ├── a2a.controller.ts # /.well-known/agent.json
│       │       └── a2a.service.ts    # AgentCard generation
│       ├── test/                     # E2E tests
│       ├── nest-cli.json
│       └── package.json
│
├── agents/                          # AgentOS Runtime (Python/FastAPI)
│   ├── core_platform/               # Core platform agents
│   │   ├── approval_agent.py        # Approval routing agent
│   │   ├── orchestrator_agent.py    # Workflow orchestrator
│   │   ├── scribe/                  # Knowledge Base agent
│   │   ├── bridge/                  # Bridge agent
│   │   └── tools/                   # Agent tools
│   ├── pm/                          # Project Management agents
│   │   ├── navi.py                  # PM team lead
│   │   ├── chrono.py                # Timeline/scheduling
│   │   ├── oracle.py                # Strategy/forecasting
│   │   ├── prism.py                 # Analytics/insights
│   │   └── team.py                  # Team coordination
│   ├── gateway/                     # Gateway agent (A2A routing)
│   │   ├── router.py                # A2A request routing
│   │   ├── agent_cards.py           # AgentCard discovery
│   │   └── rate_limiter.py          # Per-agent rate limiting
│   ├── mesh/                        # Agent mesh infrastructure
│   │   ├── discovery.py             # Agent discovery service
│   │   ├── orchestrator.py          # Multi-agent orchestration
│   │   └── state_sync.py            # Redis state synchronization
│   ├── hitl/                        # Human-in-the-loop handlers
│   │   ├── approval_flow.py         # Event-driven approvals
│   │   ├── websocket_handler.py     # WebSocket notifications
│   │   └── timeout_manager.py       # Approval timeouts
│   ├── telemetry/                   # Python observability
│   │   ├── otel.py                  # OpenTelemetry setup
│   │   └── metrics.py               # Agent metrics
│   ├── middleware/                  # Custom middleware
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
- **Plugins**: Organization, Two-Factor (TOTP), Magic Link
- **Configuration**:
  ```typescript
  // lib/auth.ts
  import { betterAuth } from 'better-auth'
  import { organization, twoFactor, magicLink } from 'better-auth/plugins'
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
      twoFactor({
        issuer: 'HYVVE',
        totpOptions: { digits: 6, period: 30 },
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await resend.emails.send({
            to: email,
            subject: 'Sign in to HYVVE',
            html: `<a href="${url}">Click to sign in</a>`,
          });
        },
      }),
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: 'common',
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,     // Refresh daily
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'microsoft', 'github'],
      },
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

### ADR-008: Multi-Provider OAuth Authentication

**Status**: Accepted (EPIC-09)

**Context**: Users require flexibility in authentication methods. Single OAuth provider limits adoption.

**Decision**: Implement multiple OAuth providers alongside email authentication.

**Providers Implemented**:
| Provider | Scopes | Use Case |
|----------|--------|----------|
| Google | email, profile | Primary social login |
| Microsoft | User.Read | Enterprise users |
| GitHub | read:user, user:email | Developer users |
| Magic Link | N/A | Passwordless option |

**Consequences**:
- Broader user adoption across enterprise and consumer segments
- Account linking prevents duplicate accounts
- OAuth deduplication logic handles existing accounts

### ADR-009: Two-Factor Authentication (TOTP)

**Status**: Accepted (EPIC-09)

**Context**: Security-conscious users require additional authentication factors.

**Decision**: Implement TOTP-based 2FA using better-auth's twoFactor plugin.

**Implementation**:
```typescript
// 2FA flow
1. User enables 2FA in settings
2. System generates TOTP secret + QR code
3. User scans with authenticator app
4. User verifies with 6-digit code
5. Backup codes generated and shown once
6. Future logins require password + TOTP code
```

**Consequences**:
- Enhanced security for user accounts
- Standard TOTP compatible with Google Authenticator, Authy, etc.
- Backup codes for account recovery

### ADR-010: WebSocket Real-Time Architecture

**Status**: Accepted (EPIC-16)

**Context**: Users need real-time updates for approvals, agent status, and notifications without polling.

**Decision**: Implement Socket.io WebSocket gateway in NestJS with JWT authentication.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    WebSocket Architecture                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────────────┐     ┌───────────────┐
│   Client    │────>│  WebSocket Gateway  │────>│ Event Handler │
│  (Browser)  │<────│   (NestJS/Socket.io)│<────│               │
└─────────────┘     └─────────────────────┘     └───────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Redis Pub/Sub     │
                    │  (Multi-instance)   │
                    └─────────────────────┘

Event Types:
- approval.created    → New approval appears in queue
- approval.updated    → Approval status changes
- agent.status.changed → Agent becomes online/offline
- notification.new     → Badge count updates
- chat.message        → New chat messages appear
```

**Implementation**:
```typescript
// apps/api/src/realtime/realtime.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection {
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    const session = await this.authService.validateToken(token);
    if (!session) {
      client.disconnect();
      return;
    }
    client.join(`workspace:${session.workspaceId}`);
    client.join(`user:${session.userId}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, channel: string) {
    client.join(channel);
  }
}
```

**Consequences**:
- Real-time UI updates without polling
- Reduced server load vs. polling
- Reconnection handling with exponential backoff
- Graceful degradation if WebSocket unavailable

### ADR-011: Responsive Design Architecture

**Status**: Accepted (EPIC-16)

**Context**: Users access platform from desktop, tablet, and mobile devices.

**Decision**: Implement mobile-first responsive design with breakpoint-specific layouts.

**Breakpoints**:
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Bottom nav, full-screen pages |
| Tablet | 768-1024px | Drawer sidebar, bottom sheet chat |
| Medium | 1024-1280px | Collapsible sidebar, prioritized panels |
| Desktop | > 1280px | Full three-panel layout |

**Layout Components**:
```
Mobile (<768px):
┌─────────────────────────────┐
│        Full Screen          │
│         Content             │
├─────────────────────────────┤
│ 🏠  🏢  ✓  🤖  ⋯          │
└─────────────────────────────┘

Desktop (>1280px):
┌────┬────────────────────┬────┐
│    │                    │    │
│ S  │      Content       │ C  │
│ i  │                    │ h  │
│ d  │                    │ a  │
│ e  │                    │ t  │
│ b  │                    │    │
│ a  │                    │    │
│ r  │                    │    │
└────┴────────────────────┴────┘
```

**Consequences**:
- Full mobile support for on-the-go access
- Touch-friendly interactions (44x44px tap targets)
- Layout preferences persisted per user

### ADR-012: Skeleton Loading & Optimistic Updates

**Status**: Accepted (EPIC-16)

**Context**: Users perceive loading spinners as slower than skeleton placeholders.

**Decision**: Replace full-page spinners with skeleton screens and implement optimistic UI updates.

**Implementation**:
- Skeleton variants for cards, tables, lists, forms
- Optimistic updates for approvals, chat, settings
- Rollback on error with toast notification

**Consequences**:
- Perceived performance improvement
- Immediate feedback on user actions
- Graceful error handling with retry

### ADR-013: AG-UI Protocol (CopilotKit Integration)

**Status**: Accepted (DM-01)

**Context**: Need standardized protocol for agent-to-user communication with streaming support.

**Decision**: Adopt AG-UI protocol via CopilotKit for frontend agent interactions.

**Implementation**:
```typescript
// Slot-based widget rendering
<CopilotKit>
  <SlotProvider slots={['metrics', 'actions', 'insights']}>
    <Dashboard />
  </SlotProvider>
</CopilotKit>

// Agent tool calls render as widgets
useRenderToolCall({
  name: 'render_metrics_widget',
  handler: (props) => <MetricsWidget {...props} />
})
```

**Consequences**:
- Generative UI with agent-controlled rendering
- Streaming responses with partial updates
- Standardized widget interface

### ADR-014: A2A Protocol (Agent-to-Agent Communication)

**Status**: Accepted (DM-02, DM-03)

**Context**: Agents need to communicate with each other for orchestration and delegation.

**Decision**: Adopt Google's A2A (Agent-to-Agent) protocol standard.

**Implementation**:
- AgentCard discovery for capability advertisement
- Task-based RPC for agent invocation
- Async task status polling with webhook callbacks

**Key Components**:
```
Dashboard Agent (Gateway)
    ├── PM Agents (Navi, Sage, Chrono)
    ├── KB Agent (Scribe)
    ├── Brand Agents (Bella team)
    └── CRM Agents (future)
```

**Consequences**:
- Zero custom adapters (Agno handles natively)
- Automatic capability negotiation
- Interoperability with external A2A agents

### ADR-015: MCP Integration Pattern

**Status**: Accepted (DM-06)

**Context**: Agents need access to external tools (file system, databases, APIs).

**Decision**: Integrate Model Context Protocol (MCP) for external tool access.

**Implementation**:
- Workspace-scoped MCP server configuration
- Permission-controlled tool exposure
- Parallel MCP connection initialization (DM-11-4)

**Consequences**:
- Extensible tool ecosystem
- Security via permission controls
- Performance via parallel connections

### ADR-016: Unified Protocol Architecture

**Status**: Accepted (DM-02)

**Context**: Multiple protocols (AG-UI, A2A, MCP) need coherent integration.

**Decision**: Implement Unified Protocol Architecture with Agno's multi-interface support.

**Architecture**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED PROTOCOL LAYER                        │
├─────────────────────┬─────────────────────┬─────────────────────┤
│      AG-UI          │        A2A          │        MCP          │
│   (User ↔ Agent)    │   (Agent ↔ Agent)   │   (Agent ↔ Tools)   │
│                     │                     │                     │
│   CopilotKit        │   Google Standard   │   Anthropic Standard│
│   Streaming         │   Task RPC          │   Tool Invocation   │
└─────────────────────┴─────────────────────┴─────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AgentOS (Agno)                           │
│                                                                  │
│   Same agent accessible via all three protocols                  │
└─────────────────────────────────────────────────────────────────┘
```

**Consequences**:
- Single agent definition, multiple interfaces
- No custom adapter code
- Future-proof for new protocols

### ADR-017: OpenTelemetry Observability Stack

**Status**: Accepted (DM-09)

**Context**: Production systems need comprehensive observability for debugging and performance analysis.

**Decision**: Implement OpenTelemetry for traces, metrics, and structured logging.

**Implementation**:
- Traces: Cross-service request tracking
- Metrics: Counter, histogram, gauge instruments
- Logs: Structured logging with trace context

**Key Metrics**:
| Metric | Type | Purpose |
|--------|------|---------|
| `http.request.duration` | Histogram | API latency |
| `a2a.task.duration` | Histogram | Agent task time |
| `widget.render.duration` | Histogram | Widget render time |
| `ws.connections.active` | Gauge | WebSocket connections |
| `approval.pending` | Gauge | Pending approvals |

**Consequences**:
- Full request tracing across services
- Performance bottleneck identification
- Vendor-agnostic (works with Jaeger, Grafana, etc.)

### ADR-018: Dashboard State Sync System

**Status**: Accepted (DM-04, DM-11)

**Context**: Dashboard state needs synchronization across browser tabs and devices.

**Decision**: Implement Redis + WebSocket state synchronization with version-based conflict detection.

**Architecture**:
```
Browser Tab A ──┐
Browser Tab B ──┼── WebSocket ── NestJS Gateway ── Redis
Browser Tab C ──┘
```

**Key Features**:
- Tab ID management (echo prevention)
- Version-based conflict detection
- Debounced updates (100ms)
- LZ-string compression for large payloads
- Migration system for schema evolution

**Consequences**:
- Real-time cross-tab sync
- Optimistic updates with rollback
- Offline-resilient with reconnection recovery

---

## Foundation Modules Architecture (Agno Teams)

### Overview

HYVVE's Foundation Modules use the **Agno framework** for multi-agent orchestration. Each module is implemented as an Agno **Team** with a leader agent and specialist agents.

### Team Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FOUNDATION MODULES                                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│   BMV (Validation)  │  │   BMP (Planning)    │  │  BM-Brand (Branding)│
│                     │  │                     │  │                     │
│  Leader: Vera       │  │  Leader: Blake      │  │  Leader: Bella      │
│  ────────────────   │  │  ────────────────   │  │  ────────────────   │
│  Marco (Market)     │  │  Model (BMC)        │  │  Sage (Strategy)    │
│  Cipher (Competitor)│  │  Finn (Financial)   │  │  Vox (Voice)        │
│  Persona (Customer) │  │  Revenue (Pricing)  │  │  Iris (Visual)      │
│  Risk (Feasibility) │  │  Forecast (Growth)  │  │  Artisan (Assets)   │
│                     │  │                     │  │  Audit (Review)     │
│                     │  │                     │  │                     │
│  Mode: coordinate   │  │  Mode: coordinate   │  │  Mode: coordinate   │
│  Storage: Postgres  │  │  Storage: Postgres  │  │  Storage: Postgres  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │    PostgreSQL Tables    │
                    │  ───────────────────    │
                    │  agent_sessions         │
                    │  agent_memories         │
                    │  validation_sessions    │
                    │  planning_sessions      │
                    │  branding_sessions      │
                    │  businesses             │
                    └─────────────────────────┘
```

### Agent Session Database Schema

```sql
-- Core business entity
CREATE TABLE businesses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),

    -- Basic info
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    industry        VARCHAR(100),
    stage           VARCHAR(50) DEFAULT 'idea',

    -- Onboarding status
    onboarding_status   VARCHAR(50) DEFAULT 'wizard',
    onboarding_progress INT DEFAULT 0,

    -- Module status
    validation_status   VARCHAR(50) DEFAULT 'not_started',
    planning_status     VARCHAR(50) DEFAULT 'not_started',
    branding_status     VARCHAR(50) DEFAULT 'not_started',

    -- Validation outputs
    validation_score    INT,
    validation_recommendation VARCHAR(50),

    -- Timestamps
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    -- Multi-tenant index
    CONSTRAINT idx_businesses_workspace UNIQUE (workspace_id, name)
);

CREATE INDEX idx_businesses_workspace_id ON businesses(workspace_id);

-- Agno session storage
CREATE TABLE agent_sessions (
    id              VARCHAR(255) PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    workspace_id    VARCHAR(255),
    business_id     VARCHAR(255),
    team_type       VARCHAR(50), -- bmv, bmp, branding
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_user ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_workspace ON agent_sessions(workspace_id);
CREATE INDEX idx_agent_sessions_business ON agent_sessions(business_id);

-- Agno memory storage
CREATE TABLE agent_memories (
    id              VARCHAR(255) PRIMARY KEY,
    session_id      VARCHAR(255) REFERENCES agent_sessions(id),
    memory_type     VARCHAR(50), -- message, tool_call, summary
    content         JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_memories_session ON agent_memories(session_id);

-- Enable RLS on tenant-scoped tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_businesses ON businesses
    USING (workspace_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY tenant_isolation_sessions ON agent_sessions
    USING (workspace_id = current_setting('app.tenant_id', true));
```

### Agno Team Configuration Pattern

```python
# agents/validation/team.py
from agno.team import Team
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage

def create_validation_team(
    session_id: str,
    user_id: str,
    business_id: str,
    workspace_id: str,
) -> Team:
    """Create BMV Validation Team with Vera as leader."""

    # Team Leader
    vera = Agent(
        name="Vera",
        role="Validation Orchestrator",
        description="Coordinates validation, synthesizes go/no-go recommendation",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "Guide users through business idea validation step by step.",
            "Delegate to specialists: Marco (market), Cipher (competitor), "
            "Persona (customer), Risk (feasibility).",
            "Synthesize findings into clear recommendations.",
        ],
    )

    # Specialists
    marco = Agent(name="Marco", role="Market Researcher", ...)
    cipher = Agent(name="Cipher", role="Competitor Analyst", ...)
    persona = Agent(name="Persona", role="Customer Profiler", ...)
    risk = Agent(name="Risk", role="Feasibility Assessor", ...)

    return Team(
        name="Validation Team",
        mode="coordinate",
        leader=vera,
        members=[marco, cipher, persona, risk],
        storage=PostgresStorage(
            table_name="validation_sessions",
            db_url=os.getenv("DATABASE_URL"),
        ),
        session_id=session_id,
        user_id=user_id,
        additional_context={
            "business_id": business_id,
            "workspace_id": workspace_id,
            "module": "bmv",
        },
    )
```

### AgentOS API Endpoints

```python
# agents/main.py - FastAPI routes for agent teams
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/api")

@router.post("/teams/{team_type}/chat")
async def chat_with_team(
    team_type: str,  # bmv, bmp, branding
    request: ChatRequest,
    workspace_id: str = Depends(get_workspace_id),
    user_id: str = Depends(get_user_id),
):
    """Chat with a foundation module team."""
    team = get_team_instance(team_type, request.business_id, workspace_id, user_id)
    response = await team.arun(message=request.message, session_id=request.session_id)
    return ChatResponse(response=response.content, agent_name=response.agent_name)

@router.post("/teams/{team_type}/chat/stream")
async def chat_stream(team_type: str, request: ChatRequest, ...):
    """SSE streaming for real-time agent responses."""
    async def event_generator():
        async for chunk in team.astream(message=request.message):
            yield f"data: {chunk.model_dump_json()}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/teams/{team_type}/sessions/{session_id}/history")
async def get_session_history(team_type: str, session_id: str, ...):
    """Get conversation history for a session."""
    ...
```

### Two-Level Dashboard Architecture

```
/dashboard                               ← Portfolio Dashboard
│   ├── List all user's businesses
│   ├── Business cards with status
│   └── "Add Business" → Wizard
│
├── /dashboard/[businessId]              ← Business Dashboard
│   ├── /overview                        ← Business overview
│   │       ├── Module status cards
│   │       ├── Recent activity
│   │       └── Next steps
│   │
│   ├── /validation                      ← BMV Module
│   │       ├── Chat with Vera's team
│   │       ├── Validation progress
│   │       └── Market/competitor/customer outputs
│   │
│   ├── /planning                        ← BMP Module
│   │       ├── Chat with Blake's team
│   │       ├── Business Model Canvas
│   │       └── Financial projections
│   │
│   ├── /branding                        ← BM-Brand Module
│   │       ├── Chat with Bella's team
│   │       ├── Brand strategy
│   │       └── Asset downloads
│   │
│   └── /settings                        ← Business settings
```

### Frontend-AgentOS Integration

```typescript
// apps/web/src/lib/team-client.ts
const AGENTOS_URL = process.env.NEXT_PUBLIC_AGENTOS_URL || '/api';

export async function chatWithTeam(
  teamType: 'bmv' | 'bmp' | 'branding',
  businessId: string,
  message: string,
  sessionId?: string,
) {
  const response = await fetch(`${AGENTOS_URL}/teams/${teamType}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSessionToken()}`,
    },
    body: JSON.stringify({ business_id: businessId, message, session_id: sessionId }),
  });
  return response.json();
}

// SSE streaming for real-time responses
export function streamTeamChat(
  teamType: string,
  businessId: string,
  message: string,
  onChunk: (chunk: ChatChunk) => void,
) {
  const eventSource = new EventSource(
    `${AGENTOS_URL}/teams/${teamType}/chat/stream?business_id=${businessId}&message=${encodeURIComponent(message)}`
  );
  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
      return;
    }
    onChunk(JSON.parse(event.data));
  };
  return eventSource;
}
```

### Anti-Hallucination Architecture

The foundation modules implement strict data quality controls:

| Team | Control | Implementation |
|------|---------|----------------|
| BMV | 2+ source requirement | Marco requires multiple data sources for market claims |
| BMV | Source recency | Sources must be < 24 months old |
| BMV | Confidence marking | All claims marked `[Verified]`, `[Single Source]`, `[Estimated]` |
| BMV | URL verification | Cipher requires source URLs for competitor claims |
| BMP | 3-scenario modeling | Finn generates Conservative/Realistic/Optimistic projections |
| BMP | Assumption tracking | All projections include documented assumptions |
| BM-Brand | Competitive review | Audit validates brand against competitor landscape |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [PRD](prd.md) | Product requirements and scope |
| [UX Design](ux-design.md) | User experience decisions |
| [Wireframe Index](design/wireframes/WIREFRAME-INDEX.md) | **109 completed wireframes** with HTML/PNG assets |
| [Epic Index](archive/foundation-phase/epics/EPIC-INDEX.md) | Sprint planning and story breakdown |
| [Brand Guidelines](design/BRAND-GUIDELINES.md) | Visual identity and brand standards |
| [Style Guide](design/STYLE-GUIDE.md) | Design tokens and component specifications |

### Key Wireframe Categories for Architecture Reference

| Feature | Wireframes | Description |
|---------|------------|-------------|
| **Three-Panel Shell** | SH-01 to SH-06 | Core layout implementation |
| **Chat Interface** | CH-01 to CH-07 | Real-time messaging patterns |
| **Approval System** | AP-01 to AP-07 | Confidence-based routing UI |
| **BYOAI Settings** | ST-02 to ST-05 | Provider configuration UI |
| **Business Onboarding** | BO-01 to BO-18 | BMV/BMP/BM-Brand workflow UI |

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-30_
_Updated: 2025-12-13_
_Version: 2.0 - Foundation Complete (17 Epics, 190 Stories, 541 Points)_
_For: chris_
