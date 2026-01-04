# HYVVE Platform Foundation - Product Requirements Document

**Author:** chris
**Date:** 2026-01-04
**Version:** 3.0
**Status:** Approved (Foundation + Core-PM + bm-dm Complete)

---

## Executive Summary

HYVVE is an AI-powered business orchestration platform designed to achieve **high automation with human-in-the-loop oversight** for SMB businesses. This PRD covers the **Platform Foundation**: the core infrastructure that enables modular business automation modules to be built on top.

The Platform Foundation provides:
- Multi-tenant workspace architecture with Row-Level Security
- Role-Based Access Control (RBAC) with hierarchical permissions
- Authentication system with OAuth and organization support
- Human-in-the-loop approval system for AI-proposed actions
- Event bus for cross-module communication
- BYOAI (Bring Your Own AI) key management
- MCP (Model Context Protocol) integrations with permission controls
- AgentOS runtime with A2A discovery + AG-UI streaming protocols
- Workspace-scoped knowledge base (RAG) for retrieval-augmented agents
- Real-time updates via WebSocket gateway
- UI shell with responsive sidebar, main content, and chat panel

### What Makes This Special

Unlike traditional business software that requires constant human attention, HYVVE's AI agents handle routine operations autonomously while surfacing only important decisions for human approval. The confidence-based routing system means:
- High confidence actions (>85%) auto-execute with audit logging
- Medium confidence (60-85%) get quick 1-click approval
- Low confidence (<60%) require full human review

This creates a **force multiplier** where small teams can operate with the efficiency of much larger teams.

---

## Project Classification

**Technical Type:** SaaS B2B Platform
**Domain:** Business Automation / AI Orchestration
**Complexity:** Medium-High (multi-tenant, RBAC, AI integration)

This is a multi-tenant B2B SaaS platform with:
- Workspace-based tenancy (one workspace = one tenant)
- Hierarchical RBAC with module-level overrides
- Real-time event-driven architecture
- AI agent orchestration with human oversight

---

## Success Criteria

### MVP Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User can complete signup → workspace creation | < 3 minutes | Time tracking |
| Invite acceptance rate | > 70% | Analytics |
| Approval queue response time | < 24 hours avg | Queue metrics |
| System uptime | > 99.5% | Monitoring |
| Page load time | < 2 seconds | Performance monitoring |
| API response time (p95) | < 500ms | APM |

### Business Metrics

| Metric | Target (Year 1) | Notes |
|--------|-----------------|-------|
| Tenant count | 100-500 | SMB focus |
| Monthly Active Users per tenant | 2-5 | SMB team size |
| Approval throughput | 50+ per tenant/day | Efficiency metric |
| Module adoption | 2+ modules per tenant | Cross-sell indicator |

---

## Product Scope

### MVP - Minimum Viable Product

#### Authentication & Onboarding
- [x] Email/password registration with email verification
- [x] Google OAuth sign-in/sign-up
- [x] Password reset flow with secure token
- [x] Session management with JWT access + database sessions
- [x] Multi-device session handling with revocation

#### Workspace Management
- [x] Workspace creation with auto-generated slug
- [x] Workspace settings (name, avatar, timezone)
- [x] Member invitation via email with role assignment
- [x] Workspace switching for users in multiple workspaces
- [x] Workspace deletion with 30-day grace period

#### Role-Based Access Control
- [x] Five-role hierarchy: Owner → Admin → Member → Viewer → Guest
- [x] Permission matrix for workspace operations
- [x] Module-level permission overrides (JSON field)
- [x] API key creation with scoped permissions

#### Multi-Tenant Data Isolation
- [x] Row-Level Security (RLS) policies on all tenant tables
- [x] Prisma Client Extension for automatic tenant filtering
- [x] Composite indexes on (tenantId, frequently_queried_column)
- [x] Cascade delete tenant data with 30-day soft delete

#### Approval Queue System
- [x] Confidence-based routing (auto/quick/full review)
- [x] Approval queue dashboard with filtering and sorting
- [x] 1-click approve/reject for high-confidence items
- [x] Full review interface with AI reasoning display
- [x] 48-hour default timeout with escalation
- [x] Bulk approval for similar items
- [x] Audit trail for all approval decisions

#### Event Bus Infrastructure
- [x] Redis Streams for pub/sub messaging
- [x] BaseEvent schema with correlation ID support
- [x] At-least-once delivery guarantee
- [x] 30-day event retention for replay
- [x] Dead letter queue with 3 retry attempts

#### BYOAI Configuration
- [x] Secure API key storage (encrypted at rest)
- [x] Provider support: Claude, OpenAI, Gemini, DeepSeek, OpenRouter
- [x] API key validation and testing
- [x] Per-workspace AI configuration
- [x] Token usage tracking (per-request, per-session, per-tenant)

#### UI Shell
- [x] Responsive three-panel layout (sidebar + main + chat)
- [x] Collapsible sidebar with workspace navigation
- [x] Persistent chat panel for AI assistant
- [x] Dark/light mode toggle (user preference)
- [x] Notification center with unread count
- [x] Command palette (keyboard shortcuts)

### Growth Features (Post-MVP)

#### Authentication Enhancements
- [x] GitHub OAuth provider (EPIC-09)
- [x] Microsoft OAuth provider - enterprise (EPIC-09)
- [x] Magic link / passwordless authentication (EPIC-09)
- [x] 2FA/TOTP support (EPIC-09)
- [x] Account linking - multiple OAuth providers (EPIC-09)

#### Advanced RBAC
- [x] Custom role creation (EPIC-09)
- [ ] Permission templates
- [ ] Time-limited access grants
- [ ] Audit log export for compliance

#### Enterprise Features
- [ ] SAML/SSO integration
- [ ] SCIM user provisioning
- [ ] Custom data retention policies
- [ ] White-labeling options
- [ ] Dedicated tenant infrastructure

### Vision (Future)

- [ ] Mobile applications (iOS/Android)
- [ ] Offline mode with sync
- [ ] AI model fine-tuning per tenant
- [ ] Marketplace for community modules
- [ ] Multi-region deployment
- [ ] SOC2 Type II certification

---

## Business Onboarding & Foundation Modules

### Overview

Business Onboarding is the **first-run experience** for HYVVE users. Unlike traditional SaaS that drops users into an empty dashboard, HYVVE's onboarding uses AI agent teams to:

1. **Validate** the business idea (BMV - Business Model Validation)
2. **Plan** the business model and financials (BMP - Business Planning)
3. **Brand** the business identity and assets (BM-Brand - Business Branding)

This creates a **two-level dashboard architecture**:
- **Portfolio Dashboard** (`/dashboard`): Overview of all user's businesses
- **Business Dashboard** (`/dashboard/[businessId]`): Deep dive into a specific business

### The Onboarding Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BUSINESS ONBOARDING JOURNEY                            │
└─────────────────────────────────────────────────────────────────────────────┘

    User Signs Up
         │
         ▼
┌─────────────────┐
│ Portfolio       │  ← Empty state prompts "Add Your First Business"
│ Dashboard       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Onboarding      │  ← 4-step wizard captures business basics
│ Wizard          │     Step 1: Name & Description
│ (BO-02 → BO-05) │     Step 2: Industry & Stage
│                 │     Step 3: Goals & Timeline
│                 │     Step 4: Document Upload (optional)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FOUNDATION MODULES                                     │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│                     │                     │                                  │
│   BMV (Validation)  │   BMP (Planning)    │   BM-Brand (Branding)           │
│   Team: Vera + 4    │   Team: Blake + 4   │   Team: Bella + 5               │
│                     │                     │                                  │
│   • Idea Intake     │   • Business Model  │   • Brand Strategy              │
│   • Market Sizing   │     Canvas          │   • Voice & Tone                │
│   • Competitor Map  │   • Financial       │   • Visual Identity             │
│   • Customer ICP    │     Projections     │   • Asset Generation            │
│   • Go/No-Go        │   • Business Plan   │   • Brand Audit                 │
│                     │                     │                                  │
│   Output: Score +   │   Output: Canvas +  │   Output: Brand Kit +           │
│   Recommendation    │   Investor Deck     │   Logo + Guidelines             │
│                     │                     │                                  │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
                               ▼
                  ┌─────────────────────┐
                  │ Business Dashboard  │  ← Ready for operational modules
                  │ (BM-CRM, Core-PM...)│
                  └─────────────────────┘
```

### Agent Team Architecture

HYVVE uses the **Agno framework** for multi-agent orchestration. Each foundation module has a dedicated **team** with a leader and specialists:

#### BMV - Validation Team (Vera's Team)

| Agent | Role | Specialization |
|-------|------|----------------|
| **Vera** | Team Leader | Orchestrates validation, synthesizes go/no-go |
| **Marco** | Market Researcher | TAM/SAM/SOM calculations, 2+ sources required |
| **Cipher** | Competitor Analyst | Porter's 5 Forces, positioning maps |
| **Persona** | Customer Profiler | ICP development, Jobs-to-be-Done |
| **Risk** | Feasibility Assessor | Risk matrix, mitigation strategies |

**Anti-Hallucination Standards:**
- Market claims require 2+ independent sources
- Sources must be < 24 months old
- All claims marked: `[Verified]`, `[Single Source]`, or `[Estimated]`
- Competitor features must have source URLs

#### BMP - Planning Team (Blake's Team)

| Agent | Role | Specialization |
|-------|------|----------------|
| **Blake** | Team Leader | Coordinates planning, investor-ready docs |
| **Model** | Business Model Architect | 9-block BMC, value proposition |
| **Finn** | Financial Analyst | P&L, unit economics, funding |
| **Revenue** | Monetization Strategist | Pricing tiers, competitive pricing |
| **Forecast** | Growth Forecaster | 3-5 year scenarios, milestones |

**Financial Standards:**
- Three scenarios: Conservative (50th), Realistic (70th), Optimistic (90th)
- LTV/CAC target: 3:1 or better
- CAC payback: < 12 months for SaaS
- All projections include assumptions and sources

#### BM-Brand - Branding Team (Bella's Team)

| Agent | Role | Specialization |
|-------|------|----------------|
| **Bella** | Team Leader | Orchestrates brand development |
| **Sage** | Brand Strategist | Positioning, archetype, differentiation |
| **Vox** | Voice Architect | Tone, messaging, content guidelines |
| **Iris** | Visual Identity Designer | Colors, typography, logo direction |
| **Artisan** | Asset Generator | Logo creation, template production |
| **Audit** | Brand Auditor | Consistency checks, competitive review |

### Portfolio & Business Dashboard Structure

```
/dashboard                           ← Portfolio Dashboard (all businesses)
├── /dashboard/[businessId]          ← Business Dashboard (specific business)
│   ├── /overview                    ← Business overview with module status
│   ├── /validation                  ← BMV chat + validation progress
│   ├── /planning                    ← BMP chat + business plan
│   ├── /branding                    ← BM-Brand chat + brand assets
│   ├── /crm                         ← (Future) CRM module
│   ├── /projects                    ← (Future) PM module
│   └── /settings                    ← Business-specific settings
```

### Business Onboarding Data Model

```typescript
interface Business {
  id: string;
  workspaceId: string;        // Multi-tenant
  userId: string;             // Creator

  // Basic info
  name: string;
  description: string;
  industry: string;
  stage: 'idea' | 'validation' | 'mvp' | 'growth' | 'scale';

  // Onboarding status
  onboardingStatus: 'wizard' | 'validation' | 'planning' | 'branding' | 'complete';
  onboardingProgress: number; // 0-100

  // Module status
  validationStatus: 'not_started' | 'in_progress' | 'complete';
  planningStatus: 'not_started' | 'in_progress' | 'complete';
  brandingStatus: 'not_started' | 'in_progress' | 'complete';

  // Validation outputs
  validationScore?: number;   // 0-100
  validationRecommendation?: 'go' | 'conditional_go' | 'pivot' | 'no_go';

  // Planning outputs
  businessModel?: BusinessModelCanvas;
  financialProjections?: FinancialProjections;

  // Branding outputs
  brandStrategy?: BrandStrategy;
  brandAssets?: BrandAssetCollection;

  createdAt: Date;
  updatedAt: Date;
}
```

### Functional Requirements - Business Onboarding

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-BO.1 | Users can create a new business from Portfolio Dashboard | P0 |
| FR-BO.2 | Onboarding wizard captures business basics in 4 steps | P0 |
| FR-BO.3 | Users can upload existing documents for AI extraction | P1 |
| FR-BO.4 | Portfolio Dashboard shows all businesses with status cards | P0 |
| FR-BO.5 | Business Dashboard shows module tabs with progress | P0 |
| FR-BO.6 | Validation page provides chat with Vera's team | P0 |
| FR-BO.7 | Market sizing workflow runs with Marco | P0 |
| FR-BO.8 | Competitor mapping workflow runs with Cipher | P0 |
| FR-BO.9 | Customer discovery workflow runs with Persona | P0 |
| FR-BO.10 | Validation synthesis provides go/no-go score | P0 |
| FR-BO.11 | Planning page provides chat with Blake's team | P1 |
| FR-BO.12 | Business Model Canvas is generated interactively | P1 |
| FR-BO.13 | Financial projections are generated with 3 scenarios | P1 |
| FR-BO.14 | Branding page provides chat with Bella's team | P2 |
| FR-BO.15 | Visual identity is designed with user preferences | P2 |
| FR-BO.16 | Brand assets are generated and downloadable | P2 |
| FR-BO.17 | Module handoff preserves context between teams | P1 |
| FR-BO.18 | Users can skip modules but are guided through sequence | P1 |

---

## Multi-Tenancy Architecture

### Isolation Strategy

**Decision:** Hybrid RLS + Prisma Client Extension

| Aspect | Implementation |
|--------|----------------|
| **Isolation Strategy** | Row-Level Security (RLS) + Prisma middleware |
| **Tenant ID** | UUID (matches workspace.id) |
| **Schema** | Single shared schema with tenant_id column |
| **Query Scoping** | Prisma Client Extension auto-filters |
| **Admin Access** | RLS bypass role for platform operations |

### Prisma Client Extension Pattern

```typescript
// lib/prisma-tenant.ts
export function createTenantPrismaClient(tenantId: string) {
  const prisma = new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Add tenant filter to reads
          if (['findMany', 'findFirst', 'findUnique', 'count', 'aggregate'].includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          // Add tenant to creates
          if (['create', 'createMany'].includes(operation)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(d => ({ ...d, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }

          // Add tenant filter to updates/deletes
          if (['update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          return query(args);
        },
      },
    },
  });

  return prisma;
}
```

### RLS Policies (Defense in Depth)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Create admin bypass role
CREATE ROLE platform_admin;
GRANT BYPASSRLS ON DATABASE hyvve TO platform_admin;
```

---

## Authentication & Authorization

### Authentication System

**Decision:** better-auth Library

| Aspect | Implementation |
|--------|----------------|
| **Library** | better-auth |
| **Primary Auth** | Email/Password + Google OAuth |
| **Session** | JWT access tokens + database sessions |
| **Multi-tenant** | Organization plugin for workspaces |

### Token Strategy

| Token | Duration | Purpose |
|-------|----------|---------|
| Access (JWT) | 15 min | API authentication |
| Session | 7 days (30 with remember) | User session |
| Refresh | 30 days | Session renewal |
| Password Reset | 1 hour | Account recovery |
| Email Verification | 24 hours | Account activation |

### JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;                   // User ID
  sessionId: string;             // Session reference
  workspaceId?: string;          // Active workspace (multi-tenant)
  email: string;
  name: string;
  iat: number;                   // Issued at
  exp: number;                   // Expiration
}
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Sign In | 5 attempts | 15 minutes |
| Sign Up | 3 attempts | 1 hour |
| Password Reset | 3 attempts | 1 hour |
| Email Verification | 5 resends | 1 hour |
| API requests | 1000 requests | 1 minute |

---

## Permissions & Roles

### Role Hierarchy

| Level | Roles |
|-------|-------|
| **Platform** | Platform Admin, Support Agent (internal only) |
| **Workspace** | Owner → Admin → Member → Viewer → Guest |
| **Module** | Optional overrides per module |

### Permission Matrix

| Permission | Owner | Admin | Member | Viewer | Guest |
|------------|-------|-------|--------|--------|-------|
| **Workspace Settings** | Full | Edit | - | - | - |
| **View Members** | ✓ | ✓ | ✓ | ✓ | - |
| **Invite Members** | ✓ | ✓ | - | - | - |
| **Remove Members** | ✓ | ✓ | - | - | - |
| **Change Roles** | ✓ | Limited* | - | - | - |
| **Delete Workspace** | ✓ | - | - | - | - |
| **View Records** | ✓ | ✓ | Own + Assigned | Read-only | Limited |
| **Create Records** | ✓ | ✓ | ✓ | - | - |
| **Edit Records** | ✓ | ✓ | Own + Assigned | - | - |
| **Delete Records** | ✓ | ✓ | Own only | - | - |
| **View Approvals** | ✓ | ✓ | Own | - | - |
| **Approve/Reject** | ✓ | ✓ | - | - | - |
| **Configure Agents** | ✓ | ✓ | - | - | - |
| **Run Agents** | ✓ | ✓ | ✓ | - | - |
| **View Agent Output** | ✓ | ✓ | ✓ | ✓ | - |
| **API Key Management** | ✓ | ✓ | - | - | - |

*Admin can change roles up to Admin level; cannot demote Owner

### Module Permission Overrides

```typescript
interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

  // Module-specific overrides (JSON field)
  modulePermissions?: {
    [moduleId: string]: {
      role?: 'admin' | 'member' | 'viewer';
      permissions?: string[];
    };
  };

  invitedBy: string;
  invitedAt: Date;
  acceptedAt?: Date;
}
```

---

## Approval System (Human-in-the-Loop)

### Confidence-Based Routing

| Confidence Level | Range | Action | UI Treatment |
|------------------|-------|--------|--------------|
| **High** | > 85% | Auto-approve, log for audit | Shown in "Auto-approved" tab |
| **Medium** | 60-85% | Quick approval (1-click) | Card with "Approve" button |
| **Low** | < 60% | Full review required | Expanded card with AI reasoning |

### Approval Item Schema

```typescript
interface ApprovalItem {
  id: string;
  tenantId: string;

  // What needs approval
  type: 'content' | 'email' | 'campaign' | 'deal' | 'integration' | 'agent_action';
  title: string;
  description: string;

  // AI assessment
  confidenceScore: number;        // 0-100
  confidenceFactors: ConfidenceFactor[];
  aiRecommendation: 'approve' | 'reject' | 'review';
  aiReasoning: string;

  // Preview/context
  previewUrl?: string;
  previewData?: Record<string, any>;
  relatedEntities: EntityReference[];

  // Status
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Assignment
  requestedBy: string;            // User or agent
  assignedTo?: string;            // Specific approver
  escalatedTo?: string;           // After timeout

  // Timeline
  createdAt: Date;
  dueAt: Date;                    // Default: createdAt + 48h
  resolvedAt?: Date;
  resolvedBy?: string;

  // Outcome
  resolution?: {
    decision: 'approved' | 'rejected';
    notes?: string;
    modifications?: Record<string, any>;
  };

  // Audit
  auditLog: AuditEntry[];
}

interface ConfidenceFactor {
  factor: string;                 // e.g., "brand_voice_alignment"
  score: number;                  // 0-100
  weight: number;                 // Contribution to overall score
  explanation: string;
}
```

### Approval Queue Features

- **Filtering**: By type, status, priority, date range, assignee
- **Sorting**: By due date, confidence score, priority, created date
- **Bulk Actions**: Approve/reject multiple similar items
- **Delegation**: Reassign approvals during absence
- **Escalation**: Auto-escalate after timeout period
- **Notifications**: In-app + email for new approvals

---

## Event Bus Architecture

### Technology Choice

**Decision:** Redis Streams

| Aspect | Implementation |
|--------|----------------|
| **Transport** | Redis Streams |
| **Delivery** | At-least-once |
| **Retention** | 30 days (replay capability) |
| **Dead Letter** | Separate queue with 3 retry attempts |

### Base Event Schema

```typescript
interface BaseEvent {
  id: string;                     // UUID
  type: string;                   // e.g., "crm.contact.created"
  source: string;                 // Module that emitted (e.g., "bm-crm")
  timestamp: string;              // ISO 8601
  correlationId?: string;         // For tracing related events
  tenantId: string;               // Workspace isolation
  userId: string;                 // Who triggered
  version: string;                // Schema version (e.g., "1.0")
  data: Record<string, any>;      // Event-specific payload
}
```

### Event Naming Convention

```
{module}.{entity}.{action}

Examples:
- crm.contact.created
- crm.lead.scored
- content.article.published
- email.campaign.sent
- approval.requested
- approval.granted
```

### Core Platform Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `approval.requested` | Item needs human review | `{ itemId, itemType, priority }` | Dashboard, Notifications |
| `approval.granted` | Human approved | `{ itemId, approvedBy, notes }` | Source module |
| `approval.rejected` | Human rejected | `{ itemId, rejectedBy, reason }` | Source module |
| `approval.expired` | Timeout reached | `{ itemId, escalatedTo }` | Notifications |
| `workflow.started` | Workflow began | `{ workflowId, triggeredBy }` | Analytics |
| `workflow.completed` | Workflow finished | `{ workflowId, status, duration }` | Analytics |
| `workflow.failed` | Workflow errored | `{ workflowId, error, step }` | Notifications |
| `user.invited` | Member invitation sent | `{ email, role, invitedBy }` | Notifications |
| `user.joined` | Member accepted invite | `{ userId, workspaceId }` | Analytics |
| `agent.started` | Agent task began | `{ agentId, taskType, inputs }` | Dashboard |
| `agent.completed` | Agent task finished | `{ agentId, outputs, duration }` | Dashboard |
| `agent.error` | Agent task failed | `{ agentId, error }` | Notifications |

---

## BYOAI Configuration

### Supported Providers

| Provider | Auth Method | MVP Status | Models |
|----------|-------------|------------|--------|
| **Claude (Anthropic)** | API Key / OAuth Token | Required | claude-3-opus, claude-3-sonnet, claude-3-haiku |
| **OpenAI** | API Key | Required | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| **Google (Gemini)** | API Key | Optional | gemini-pro, gemini-pro-vision |
| **DeepSeek** | API Key | Optional | deepseek-chat, deepseek-coder |
| **OpenRouter** | API Key | Optional | 100+ models (Claude, GPT-4, Llama, Mistral, etc.) |

### API Key Storage

```typescript
interface AIProviderConfig {
  id: string;
  tenantId: string;

  provider: 'claude' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';

  // Encrypted credentials
  apiKey: string;                 // AES-256 encrypted
  oauthToken?: string;            // For Claude OAuth

  // Configuration
  defaultModel: string;
  maxTokensPerRequest: number;
  maxTokensPerDay: number;

  // Validation
  isValid: boolean;
  lastValidatedAt: Date;
  validationError?: string;

  // Usage tracking
  tokensUsedToday: number;
  tokensUsedTotal: number;

  createdAt: Date;
  updatedAt: Date;
}
```

### Token Usage Tracking

```typescript
interface TokenUsage {
  id: string;
  tenantId: string;
  providerId: string;

  // Request details
  agentId: string;
  sessionId: string;
  model: string;

  // Token counts
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  // Cost calculation
  estimatedCost: number;          // In USD

  // Timing
  requestedAt: Date;
  duration: number;               // Milliseconds
}
```

---

## User Experience Principles

### Design Philosophy

1. **AI Transparency**: Users always understand what AI agents are doing and why
2. **Progressive Disclosure**: Show summary first, details on demand
3. **Confidence Indicators**: Visual cues for AI certainty levels
4. **Quick Actions**: 1-click approve for high-confidence items
5. **Keyboard-First**: Full keyboard navigation and shortcuts
6. **Mobile-Responsive**: Core features work on tablet/phone

### Key Interactions

#### Approval Flow
1. User sees notification badge on Approval Queue
2. Opens queue, sees prioritized list with confidence indicators
3. High-confidence items: 1-click approve with optional note
4. Low-confidence items: Expand to see AI reasoning, preview, edit before deciding
5. Bulk actions for similar items

#### Agent Interaction
1. User initiates task via chat panel or dashboard action
2. Agent activity shows in real-time (streaming response)
3. If approval needed, item appears in queue
4. User can pause, cancel, or redirect agent mid-task
5. Results summarized with links to created/modified items

#### Workspace Navigation
1. Sidebar shows current workspace with module list
2. Command palette (Cmd+K) for quick navigation
3. Breadcrumb trail shows current location
4. Recent items accessible from dashboard

---

## Functional Requirements

### FR-1: User Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Users can register with email and password | P0 |
| FR-1.2 | Users receive email verification link after registration | P0 |
| FR-1.3 | Users can sign in with Google OAuth | P0 |
| FR-1.4 | Users can reset password via email link | P0 |
| FR-1.5 | System creates session on successful login | P0 |
| FR-1.6 | Users can sign out from current device | P0 |
| FR-1.7 | Users can sign out from all devices | P0 |
| FR-1.8 | Session expires after configured duration | P0 |
| FR-1.9 | System rate-limits auth endpoints | P0 |

### FR-2: Workspace Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Users can create new workspaces | P0 |
| FR-2.2 | Workspace creator becomes Owner | P0 |
| FR-2.3 | Owners can update workspace settings | P0 |
| FR-2.4 | Owners can invite members via email | P0 |
| FR-2.5 | Invitees receive email with accept link | P0 |
| FR-2.6 | Admins can change member roles | P0 |
| FR-2.7 | Members can leave workspace | P0 |
| FR-2.8 | Owners can remove members | P0 |
| FR-2.9 | Users can switch between workspaces | P0 |
| FR-2.10 | Owners can delete workspace (30-day grace) | P1 |

### FR-3: Approval Queue

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | System displays pending approvals with metadata | P0 |
| FR-3.2 | Users can filter approvals by type, status, priority | P0 |
| FR-3.3 | Users can sort approvals by date, confidence, priority | P0 |
| FR-3.4 | Users can approve items with optional notes | P0 |
| FR-3.5 | Users can reject items with required reason | P0 |
| FR-3.6 | High-confidence items auto-approve with audit log | P0 |
| FR-3.7 | System escalates items after timeout | P1 |
| FR-3.8 | Users can delegate approvals to others | P1 |
| FR-3.9 | Users can bulk approve/reject similar items | P1 |
| FR-3.10 | System shows AI reasoning for low-confidence items | P0 |

### FR-4: BYOAI Configuration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Users can add AI provider API keys | P0 |
| FR-4.2 | System validates API keys before saving | P0 |
| FR-4.3 | API keys are encrypted at rest | P0 |
| FR-4.4 | Users can update or remove API keys | P0 |
| FR-4.5 | System tracks token usage per provider | P0 |
| FR-4.6 | Users can set daily token limits | P1 |
| FR-4.7 | System alerts when approaching token limits | P1 |
| FR-4.8 | Users can configure default model per provider | P0 |

### FR-5: Event Bus

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Modules can publish events to the bus | P0 |
| FR-5.2 | Modules can subscribe to event types | P0 |
| FR-5.3 | Events include tenant context for isolation | P0 |
| FR-5.4 | Failed events go to dead letter queue | P0 |
| FR-5.5 | System retries failed events (3 attempts) | P0 |
| FR-5.6 | Events retained for 30 days | P1 |
| FR-5.7 | Admin can replay events from specific time | P2 |

### FR-6: UI Shell

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Dashboard displays in three-panel layout | P0 |
| FR-6.2 | Sidebar shows workspace navigation | P0 |
| FR-6.3 | Sidebar collapses on mobile | P0 |
| FR-6.4 | Chat panel accessible from any view | P0 |
| FR-6.5 | Users can toggle dark/light mode | P0 |
| FR-6.6 | Notification center shows unread count | P0 |
| FR-6.7 | Command palette opens with Cmd/Ctrl+K | P1 |
| FR-6.8 | Keyboard shortcuts for common actions | P1 |

### FR-7: MCP Integrations

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Owners/Admins can configure MCP servers for a workspace | P0 |
| FR-7.2 | Members can view the MCP server list (non-secret fields only) | P0 |
| FR-7.3 | MCP server secrets (API keys, headers, env vars) are stored encrypted or protected from non-admin reads | P0 |
| FR-7.4 | MCP server environment variables are restricted to MCP-scoped prefixes | P0 |
| FR-7.5 | Users can restrict MCP tool exposure via allow/deny lists | P1 |
| FR-7.6 | MCP permissions support READ / WRITE / EXECUTE separation | P0 |
| FR-7.7 | Agents only load tools permitted by workspace MCP permissions | P0 |

### FR-8: Knowledge Base (RAG)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8.1 | Each workspace has an isolated knowledge store for retrieval | P0 |
| FR-8.2 | Knowledge storage uses pgvector in Postgres | P0 |
| FR-8.3 | Knowledge table naming prevents cross-tenant collisions | P0 |
| FR-8.4 | Agents can search knowledge with workspace isolation | P0 |
| FR-8.5 | Operators can clear cached knowledge instances without data loss (restart or cache clear) | P1 |
| FR-8.6 | Operators can delete a workspace knowledge table during workspace reset/deletion | P1 |

### FR-9: AgentOS Protocols (A2A + AG-UI)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-9.1 | AgentOS provides A2A discovery endpoints for registered agents/teams | P0 |
| FR-9.2 | AgentOS provides an A2A RPC endpoint for invoking agent tasks | P0 |
| FR-9.3 | AgentOS streams agent/team responses using AG-UI events over SSE | P0 |
| FR-9.4 | AgentOS enforces workspace context for authenticated protocol calls | P0 |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P1 | Page load time (LCP) | < 2.5 seconds |
| NFR-P2 | Time to interactive (TTI) | < 3.5 seconds |
| NFR-P3 | API response time (p95) | < 500ms |
| NFR-P4 | API response time (p99) | < 2000ms |
| NFR-P5 | WebSocket message latency | < 100ms |
| NFR-P6 | Database query time (p95) | < 100ms |
| NFR-P7 | Concurrent users per instance | 1000+ |

### Security

| ID | Requirement |
|----|-------------|
| NFR-S1 | All API keys encrypted at rest using AES-256-GCM |
| NFR-S2 | All traffic encrypted in transit using TLS 1.3 |
| NFR-S3 | JWT tokens signed and verified using a secure algorithm (HS256 for BetterAuth) |
| NFR-S4 | CSRF protection on all state-changing endpoints |
| NFR-S5 | XSS prevention with CSP headers |
| NFR-S6 | SQL injection prevention via parameterized queries |
| NFR-S7 | Rate limiting on all public endpoints |
| NFR-S8 | Audit logging for security-sensitive operations |
| NFR-S9 | OWASP Top 10 compliance |
| NFR-S10 | Encryption master key rotation is supported with operational runbook + tooling |

### Scalability

| ID | Requirement |
|----|-------------|
| NFR-SC1 | Horizontal scaling via stateless API servers |
| NFR-SC2 | Database connection pooling (PgBouncer) |
| NFR-SC3 | Redis cluster for high availability |
| NFR-SC4 | CDN for static assets |
| NFR-SC5 | Support 10,000 tenants by Year 3 |

### Accessibility

| ID | Requirement |
|----|-------------|
| NFR-A1 | WCAG 2.1 Level AA compliance |
| NFR-A2 | Full keyboard navigation |
| NFR-A3 | Screen reader compatibility |
| NFR-A4 | Minimum color contrast ratio 4.5:1 |
| NFR-A5 | Focus indicators on interactive elements |
| NFR-A6 | Semantic HTML structure |

### Integration

| ID | Requirement |
|----|-------------|
| NFR-I1 | RESTful API with OpenAPI 3.0 spec |
| NFR-I2 | WebSocket for real-time updates |
| NFR-I3 | Webhook support for external integrations |
| NFR-I4 | OAuth 2.0 for third-party auth |
| NFR-I5 | Standard event schema for module communication |

---

## Technology Stack

### Frontend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Server components, streaming |
| UI Library | React 19 | Latest features, concurrent rendering |
| Styling | Tailwind CSS 4 + shadcn/ui | Utility-first, accessible components |
| State | Zustand + React Query | Simple global state + server state |
| Real-time | Socket.io client | WebSocket with fallbacks |
| Charts | Recharts | React-native, customizable |

### Backend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| API (Modules) | NestJS | Modular architecture, TypeScript |
| API (Platform) | Next.js API Routes | Co-located with frontend |
| Auth | better-auth | Organization support, self-hosted |
| Database | PostgreSQL (Supabase) | RLS, JSON, proven reliability |
| ORM | Prisma | Type-safe, migrations |
| Cache/Queue | Redis + BullMQ | Pub/sub, reliable queues |
| Events | Redis Streams | Event sourcing capability |

### AI/Agent
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Agno | Multi-model, teams, workflows |
| Models | Claude, GPT-4, Gemini, DeepSeek | BYOAI flexibility |
| Monitoring | Helicone | LLM-specific observability |

### Infrastructure
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend Hosting | Vercel | Edge network, preview deploys |
| Backend Hosting | Railway / Render | Container orchestration |
| Database | Supabase | Managed Postgres with RLS |
| File Storage | Supabase Storage / S3 | Scalable object storage |
| Email | Resend | Developer-friendly, reliable |
| Monitoring | OpenTelemetry | Vendor-agnostic tracing |

---

## Database Schema (Core)

```prisma
// Core authentication entities
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  emailVerified   Boolean   @default(false)
  name            String?
  image           String?
  passwordHash    String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  sessions        Session[]
  accounts        Account[]
  workspaces      WorkspaceMember[]
}

model Session {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  token               String    @unique
  expiresAt           DateTime
  ipAddress           String?
  userAgent           String?
  activeWorkspaceId   String?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([userId])
}

model Account {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider            String
  providerAccountId   String
  accessToken         String?   @db.Text
  refreshToken        String?   @db.Text
  expiresAt           DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}

// Multi-tenant workspace entities
model Workspace {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  image           String?
  timezone        String    @default("UTC")

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  members         WorkspaceMember[]
  aiProviders     AIProviderConfig[]
  approvals       ApprovalItem[]
  apiKeys         ApiKey[]
}

model WorkspaceMember {
  id                  String    @id @default(uuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  role                String    @default("member") // owner, admin, member, viewer, guest
  modulePermissions   Json?     // Module-specific overrides

  invitedBy           String?
  invitedAt           DateTime  @default(now())
  acceptedAt          DateTime?

  @@unique([userId, workspaceId])
  @@index([workspaceId])
}

// BYOAI configuration
model AIProviderConfig {
  id                  String    @id @default(uuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  provider            String    // claude, openai, gemini, deepseek
  apiKeyEncrypted     String    @db.Text
  defaultModel        String

  isValid             Boolean   @default(false)
  lastValidatedAt     DateTime?
  validationError     String?

  maxTokensPerDay     Int       @default(100000)
  tokensUsedToday     Int       @default(0)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([workspaceId, provider])
  @@index([workspaceId])
}

// Approval queue
model ApprovalItem {
  id                  String    @id @default(uuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  type                String    // content, email, campaign, etc.
  title               String
  description         String?

  confidenceScore     Int       // 0-100
  aiRecommendation    String    // approve, reject, review
  aiReasoning         String?   @db.Text

  previewData         Json?
  relatedEntities     Json?

  status              String    @default("pending")
  priority            String    @default("medium")

  requestedBy         String
  assignedTo          String?

  dueAt               DateTime
  resolvedAt          DateTime?
  resolvedBy          String?
  resolution          Json?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([workspaceId, status])
  @@index([assignedTo, status])
}

// API Keys
model ApiKey {
  id                  String    @id @default(uuid())
  workspaceId         String
  workspace           Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  name                String
  keyHash             String    @unique
  keyPrefix           String    // First 8 chars for identification

  permissions         Json      // Scoped permissions

  lastUsedAt          DateTime?
  expiresAt           DateTime?

  createdBy           String
  createdAt           DateTime  @default(now())
  revokedAt           DateTime?

  @@index([workspaceId])
  @@index([keyHash])
}
```

---

## API Specification

### Authentication Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/sign-up/email` | POST | Register with email/password | Public |
| `/api/auth/sign-in/email` | POST | Login with email/password | Public |
| `/api/auth/sign-in/social` | POST | Initiate OAuth flow | Public |
| `/api/auth/callback/:provider` | GET | OAuth callback | Public |
| `/api/auth/sign-out` | POST | Logout | Required |
| `/api/auth/session` | GET | Get current session | Required |
| `/api/auth/forgot-password` | POST | Request password reset | Public |
| `/api/auth/reset-password` | POST | Reset with token | Public |
| `/api/auth/verify-email` | POST | Verify email token | Public |

### Workspace Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/workspaces` | GET | List user's workspaces | Required |
| `/api/workspaces` | POST | Create new workspace | Required |
| `/api/workspaces/:id` | GET | Get workspace details | Required |
| `/api/workspaces/:id` | PATCH | Update workspace | Owner/Admin |
| `/api/workspaces/:id` | DELETE | Delete workspace | Owner |
| `/api/workspaces/:id/members` | GET | List members | Required |
| `/api/workspaces/:id/members` | POST | Invite member | Owner/Admin |
| `/api/workspaces/:id/members/:userId` | PATCH | Update member role | Owner/Admin |
| `/api/workspaces/:id/members/:userId` | DELETE | Remove member | Owner/Admin |

### Approval Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/approvals` | GET | List pending approvals | Required |
| `/api/approvals/:id` | GET | Get approval details | Required |
| `/api/approvals/:id/approve` | POST | Approve item | Owner/Admin |
| `/api/approvals/:id/reject` | POST | Reject item | Owner/Admin |
| `/api/approvals/bulk` | POST | Bulk approve/reject | Owner/Admin |

### AI Provider Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/ai-providers` | GET | List configured providers | Owner/Admin |
| `/api/ai-providers` | POST | Add provider config | Owner/Admin |
| `/api/ai-providers/:id` | PATCH | Update provider config | Owner/Admin |
| `/api/ai-providers/:id` | DELETE | Remove provider | Owner/Admin |
| `/api/ai-providers/:id/test` | POST | Validate API key | Owner/Admin |
| `/api/ai-providers/usage` | GET | Get token usage stats | Required |

---

## UI Wireframe Reference

### Shell Layout Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Logo]  HYVVE                        🔔(3)  [User ▼]  [?] [Settings]  │
├────────┬───────────────────────────────────────────────────────────────┤
│        │                                                                │
│  📊    │  [Main Content Area]                                          │
│ Dashbd │                                                                │
│        │  • Module-specific UI                                          │
│  ✅    │  • Data tables                                                │
│Apprvls │  • Forms                                                      │
│  (5)   │  • Visualizations                                             │
│        │                                                                │
│  🤖    │                                                                │
│ Agents │                                                                │
│        │                                                                │
│  ⚙️    │                                                                │
│Settngs │                                                                │
│        │                                                                │
│────────│────────────────────────────────────────────────────────────────│
│        │                                                                │
│ [ws]   │                                                        💬 Chat│
│ ▼      │                                                        [─][□] │
│        │                                                                │
└────────┴───────────────────────────────────────────────────────────────┘
```

### Key Screen References

**109 wireframes complete** - Full index: [WIREFRAME-INDEX.md](design/wireframes/WIREFRAME-INDEX.md)

| Category | Count | Key Wireframes |
|----------|-------|----------------|
| **Core Shell** | 6 | [SH-01 Layout](design/wireframes/Finished%20wireframes%20and%20html%20files/sh-01_shell_layout_(three-panel)/code.html) · [SH-02 Sidebar](design/wireframes/Finished%20wireframes%20and%20html%20files/sh-02_navigation_sidebar_(states)/code.html) |
| **Chat Interface** | 7 | [CH-01 Panel](design/wireframes/Finished%20wireframes%20and%20html%20files/ch-01_chat_panel/code.html) · [CH-02 Messages](design/wireframes/Finished%20wireframes%20and%20html%20files/ch-02_chat_messages_(all_types)_/code.html) |
| **Approval Queue** | 7 | [AP-01 Queue](design/wireframes/Finished%20wireframes%20and%20html%20files/ap-01_approval_queue_main/code.html) · [AP-02 Cards](design/wireframes/Finished%20wireframes%20and%20html%20files/ap-02_approval_card_(confidence_routing_)/code.html) |
| **AI Team Panel** | 5 | [AI-01 Overview](design/wireframes/Finished%20wireframes%20and%20html%20files/ai-01_ai_team_overview/code.html) · [AI-02 Agent Card](design/wireframes/Finished%20wireframes%20and%20html%20files/ai-02_agent_card_component/code.html) |
| **Dashboard** | 1 | [DB-01 Dashboard](design/wireframes/Finished%20wireframes%20and%20html%20files/db-01_dashboard_overview/code.html) |
| **Settings** | 8 | [ST-01 Layout](design/wireframes/Finished%20wireframes%20and%20html%20files/st-01_settings_layout/code.html) · [ST-02 API Keys](design/wireframes/Finished%20wireframes%20and%20html%20files/st-02_api_keys_management/code.html) |
| **Authentication** | 6 | [AU-01 Login](design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/code.html) · [AU-02 Register](design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/sign_up/code.html) |
| **Data Components** | 6 | [DC-01 Tables](design/wireframes/Finished%20wireframes%20and%20html%20files/dc-01_data_tables/code.html) · [DC-02 Cards](design/wireframes/Finished%20wireframes%20and%20html%20files/dc-02_data_cards/code.html) |
| **Forms & Inputs** | 5 | [FI-01 Inputs](design/wireframes/Finished%20wireframes%20and%20html%20files/fi-01_text_inputs/code.html) · [FI-05 Upload](design/wireframes/Finished%20wireframes%20and%20html%20files/fi-05_file_upload/code.html) |
| **Feedback States** | 5 | [FS-01 Modals](design/wireframes/Finished%20wireframes%20and%20html%20files/fs-01_modals/code.html) · [FS-03 Empty](design/wireframes/Finished%20wireframes%20and%20html%20files/fs-03_empty_states/code.html) |
| **CRM Module** | 14 | [CRM-01 Contacts](design/wireframes/Finished%20wireframes%20and%20html%20files/crm-01_contacts_list/code.html) · [CRM-03 Deals](design/wireframes/Finished%20wireframes%20and%20html%20files/crm-03_deals_pipeline/code.html) |
| **PM Module** | 20 | [PM-01 Projects](design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/code.html) · [PM-03 Kanban](design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/code.html) |
| **Business Onboarding** | 18 | [BO-01 Portfolio](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-01_portfolio_dashboard_with_business_cards/code.html) · [BO-06 Validation](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-06_validation_page_with_chat_interface/code.html) |

---

## Implementation Phases

**All foundation phases complete as of 2025-12-13**

### Phase 1: Core Foundation (EPIC-00, EPIC-01, EPIC-02)
- [x] Project scaffolding (monorepo, Turborepo)
- [x] Authentication with better-auth
- [x] Workspace CRUD
- [x] Member invitation flow
- [x] Basic UI shell

### Phase 2: RBAC & Multi-tenancy (EPIC-03)
- [x] Role hierarchy implementation
- [x] RLS policy setup
- [x] Prisma tenant extension
- [x] Permission checks middleware

### Phase 3: Approval System (EPIC-04)
- [x] Approval queue backend
- [x] Confidence routing logic
- [x] Approval UI components
- [x] Notification integration

### Phase 4: Event Bus & BYOAI (EPIC-05, EPIC-06)
- [x] Redis Streams setup
- [x] Event publishing/subscribing
- [x] AI provider configuration UI
- [x] Token usage tracking

### Phase 5: Polish & Testing (EPIC-07, EPIC-14)
- [x] E2E tests
- [x] Performance optimization
- [x] Accessibility audit
- [x] Documentation

### Phase 6: Business Onboarding Foundation (EPIC-08)
- [x] Business and agent session database models
- [x] Portfolio Dashboard with business cards
- [x] Onboarding wizard (4 steps)
- [x] Validation Team Agno configuration
- [x] Validation chat interface with Vera's team
- [x] Market sizing, competitor mapping, customer discovery workflows
- [x] Validation synthesis with go/no-go recommendation

### Phase 7: UI & Auth Enhancements (EPIC-09 to EPIC-13)
- [x] Multi-provider OAuth (Microsoft, GitHub)
- [x] 2FA/TOTP authentication
- [x] Magic link authentication
- [x] Account linking
- [x] Platform hardening (EPIC-10)
- [x] Agent integration improvements (EPIC-11)
- [x] UX polish and refinements (EPIC-12)
- [x] AI agent management UI (EPIC-13)

### Phase 8: Premium Polish & Launch (EPIC-15, EPIC-16)
- [x] UI/UX platform foundation (EPIC-15)
- [x] Responsive design (mobile, tablet, desktop)
- [x] WebSocket real-time updates
- [x] Skeleton loading screens
- [x] Micro-animations and celebration moments
- [x] Keyboard shortcuts system
- [x] Tech debt fixes and security hardening

---

## Core-PM Module (Project Management + Knowledge Base)

**Status:** Complete (16 epics, 61 stories)

The Core-PM module provides project management capabilities with AI-assisted planning and a workspace-scoped knowledge base.

### Project Management Features (PM-01 to PM-12)

| Feature | Epic | Status |
|---------|------|--------|
| Project CRUD & Settings | PM-01 | Complete |
| Phase & Milestone Management | PM-02 | Complete |
| Task Management | PM-03 | Complete |
| Task Views (List, Board, Timeline) | PM-04 | Complete |
| Real-time Collaboration (Yjs) | PM-05 | Complete |
| Notifications & Activity Feed | PM-06 | Complete |
| Search & Filtering | PM-07 | Complete |
| Reporting & Analytics | PM-08 | Complete |
| External API & Webhooks | PM-09 | Complete |
| PM Agent Team (Navi, Sage, Chrono) | PM-10 | Complete |
| Agent-UI Integration | PM-11 | Complete |
| Polish & Performance | PM-12 | Complete |

### Knowledge Base Features (KB-01 to KB-04)

| Feature | Epic | Status |
|---------|------|--------|
| Document Management & Versioning | KB-01 | Complete |
| RAG Infrastructure (pgvector) | KB-02 | Complete |
| KB Agent (Scribe) | KB-03 | Complete |
| Advanced Features | KB-04 | Complete |

### PM Agent Team

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Navi** | Team Lead | Project orchestration, task delegation |
| **Sage** | Strategy Advisor | Risk analysis, resource optimization |
| **Chrono** | Timeline Manager | Scheduling, deadline tracking, dependencies |

---

## Dynamic Module System (bm-dm)

**Status:** Complete (11 epics, 77 stories, 431 points)

The bm-dm module implements the Unified Protocol Architecture enabling seamless agent-to-user and agent-to-agent communication.

### Protocol Stack

| Protocol | Purpose | Implementation |
|----------|---------|----------------|
| **AG-UI** | Agent-to-User streaming | CopilotKit integration |
| **A2A** | Agent-to-Agent communication | Google's A2A standard |
| **MCP** | External tool integration | Model Context Protocol |

### Implementation Phases

| Phase | Epic | Focus | Stories |
|-------|------|-------|---------|
| 1 | DM-01 | CopilotKit Frontend Infrastructure | 8 |
| 2 | DM-02 | Agno Multi-Interface Backend | 9 |
| 3 | DM-03 | Dashboard Agent Integration | 5 |
| 4 | DM-04 | Shared State & Real-Time | 5 |
| 5 | DM-05 | Advanced HITL & Streaming | 5 |
| 6 | DM-06 | Contextual Intelligence | 6 |
| 7 | DM-07 | Infrastructure Stabilization | 5 |
| 8 | DM-08 | Quality & Performance Hardening | 7 |
| 9 | DM-09 | Observability & Testing | 8 |
| 10 | DM-10 | Documentation & DX | 16 |
| 11 | DM-11 | Advanced Features & Optimizations | 15 |

### Key Capabilities Delivered

- **Generative UI**: Widgets rendered dynamically from agent tool calls
- **Real-time State Sync**: Redis + WebSocket for cross-tab/device sync
- **Event-driven HITL**: No-polling approval workflows (<100ms latency)
- **OpenTelemetry**: Full observability stack (traces, metrics, logs)
- **Zod Validation**: Runtime schema validation for widget data
- **Rate Limiting**: A2A request throttling and caching
- **Comprehensive Documentation**: 16 guides and runbooks

---

## Implementation Summary

### All Phases Complete

| Phase | Epics | Stories | Points | Status |
|-------|-------|---------|--------|--------|
| **Foundation** | 17 | 190 | 541 | Complete |
| **Core-PM** | 16 | 61 | ~200 | Complete |
| **bm-dm** | 11 | 77 | 431 | Complete |
| **TOTAL** | **44** | **328** | **~1,172** | **Complete** |

---

_This PRD captures the Platform Foundation for HYVVE - the core infrastructure enabling 90% business automation with human-in-the-loop oversight._

_Version 3.0 - Updated: 2026-01-04 - Foundation + Core-PM + bm-dm Complete (44 Epics, 328 Stories, ~1,172 Points)_

_Created through collaborative discovery between chris and AI facilitator._
