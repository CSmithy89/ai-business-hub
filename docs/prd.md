# HYVVE Platform Foundation - Product Requirements Document

**Author:** chris
**Date:** 2025-11-30
**Version:** 1.0
**Status:** Draft

---

## Executive Summary

HYVVE is an AI-powered business orchestration platform designed to achieve **90% automation with 5 hours/week human involvement** for SMB businesses. This PRD covers the **Platform Foundation** - the core infrastructure that enables modular business automation modules to be built on top.

The Platform Foundation provides:
- Multi-tenant workspace architecture with Row-Level Security
- Role-Based Access Control (RBAC) with hierarchical permissions
- Authentication system with OAuth and organization support
- Human-in-the-loop approval system for AI-proposed actions
- Event bus for cross-module communication
- BYOAI (Bring Your Own AI) key management
- UI shell with responsive sidebar, main content, and chat panel

### What Makes This Special

**The 90/5 Promise:** Unlike traditional business software that requires constant human attention, HYVVE's AI agents handle routine operations autonomously while surfacing only important decisions for human approval. The confidence-based routing system means:
- High confidence actions (>85%) auto-execute with audit logging
- Medium confidence (60-85%) get quick 1-click approval
- Low confidence (<60%) require full human review

This creates a **force multiplier** where a single SMB owner can operate with the efficiency of a much larger team.

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
- [ ] GitHub OAuth provider
- [ ] Microsoft OAuth provider (enterprise)
- [ ] Magic link / passwordless authentication
- [ ] 2FA/TOTP support
- [ ] Account linking (multiple OAuth providers)

#### Advanced RBAC
- [ ] Custom role creation
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
| NFR-S1 | All API keys encrypted at rest using AES-256 |
| NFR-S2 | All traffic encrypted in transit using TLS 1.3 |
| NFR-S3 | JWT tokens signed with RS256 |
| NFR-S4 | CSRF protection on all state-changing endpoints |
| NFR-S5 | XSS prevention with CSP headers |
| NFR-S6 | SQL injection prevention via parameterized queries |
| NFR-S7 | Rate limiting on all public endpoints |
| NFR-S8 | Audit logging for security-sensitive operations |
| NFR-S9 | OWASP Top 10 compliance |

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
| **Authentication** | 6 | [AU-01 Login](design/wireframes/Finished%20wireframes%20and%20html%20files/au-01_login_page/code.html) · [AU-02 Register](design/wireframes/Finished%20wireframes%20and%20html%20files/au-02_register/code.html) |
| **Data Components** | 6 | [DC-01 Tables](design/wireframes/Finished%20wireframes%20and%20html%20files/dc-01_data_tables/code.html) · [DC-02 Cards](design/wireframes/Finished%20wireframes%20and%20html%20files/dc-02_data_cards/code.html) |
| **Forms & Inputs** | 5 | [FI-01 Inputs](design/wireframes/Finished%20wireframes%20and%20html%20files/fi-01_text_inputs/code.html) · [FI-05 Upload](design/wireframes/Finished%20wireframes%20and%20html%20files/fi-05_file_upload/code.html) |
| **Feedback States** | 5 | [FS-01 Modals](design/wireframes/Finished%20wireframes%20and%20html%20files/fs-01_modals/code.html) · [FS-03 Empty](design/wireframes/Finished%20wireframes%20and%20html%20files/fs-03_empty_states/code.html) |
| **CRM Module** | 14 | [CRM-01 Contacts](design/wireframes/Finished%20wireframes%20and%20html%20files/crm-01_contacts_list/code.html) · [CRM-03 Deals](design/wireframes/Finished%20wireframes%20and%20html%20files/crm-03_deals_pipeline/code.html) |
| **PM Module** | 20 | [PM-01 Projects](design/wireframes/Finished%20wireframes%20and%20html%20files/pm-01_projects_list_view/code.html) · [PM-03 Kanban](design/wireframes/Finished%20wireframes%20and%20html%20files/pm-03_task_board_(kanban_view)_/code.html) |
| **Business Onboarding** | 18 | [BO-01 Portfolio](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-01_portfolio_dashboard_with_business_cards/code.html) · [BO-06 Validation](design/wireframes/Finished%20wireframes%20and%20html%20files/bo-06_validation_page_with_chat_interface/code.html) |

---

## Implementation Phases

### Phase 1: Core Foundation (Weeks 1-3)
- [ ] Project scaffolding (monorepo, Turborepo)
- [ ] Authentication with better-auth
- [ ] Workspace CRUD
- [ ] Member invitation flow
- [ ] Basic UI shell

### Phase 2: RBAC & Multi-tenancy (Weeks 4-5)
- [ ] Role hierarchy implementation
- [ ] RLS policy setup
- [ ] Prisma tenant extension
- [ ] Permission checks middleware

### Phase 3: Approval System (Weeks 6-7)
- [ ] Approval queue backend
- [ ] Confidence routing logic
- [ ] Approval UI components
- [ ] Notification integration

### Phase 4: Event Bus & BYOAI (Weeks 8-9)
- [ ] Redis Streams setup
- [ ] Event publishing/subscribing
- [ ] AI provider configuration UI
- [ ] Token usage tracking

### Phase 5: Polish & Testing (Weeks 10-11)
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation

### Phase 6: Launch Prep (Week 12)
- [ ] Security audit
- [ ] Load testing
- [ ] Monitoring setup
- [ ] Beta launch

---

_This PRD captures the Platform Foundation for HYVVE - the core infrastructure enabling 90% business automation with human-in-the-loop oversight._

_Created through collaborative discovery between chris and AI facilitator._
