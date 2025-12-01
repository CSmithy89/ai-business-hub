# Platform Foundation PRD - Research Checklist

**Purpose:** Research tasks to complete before creating the Platform Foundation PRD
**Status:** In Progress
**Created:** 2025-11-30

---

## Overview

This checklist identifies gaps in our platform documentation that need research before we can write a comprehensive Platform Foundation PRD. Each section includes:
- What we need to discover
- Research questions to answer
- Potential sources/references
- Checkbox for completion

---

## 1. Multi-Tenant Data Isolation

**Current State:** Concept mentioned but architecture undecided

### Research Tasks

- [ ] **Isolation Strategy Decision**
  - [ ] Research Row-Level Security (RLS) in PostgreSQL
  - [ ] Research schema-per-tenant approach
  - [ ] Research application-level tenant filtering
  - [ ] Compare pros/cons for our scale (SMB SaaS)
  - [ ] Document decision with rationale

- [ ] **Tenant ID Implementation**
  - [ ] Decide: UUID vs integer for tenant_id
  - [ ] List all tables requiring tenant_id column
  - [ ] Define foreign key cascade behavior
  - [ ] Research composite primary key patterns

- [ ] **Query Scoping Pattern**
  - [ ] Research Prisma middleware for automatic tenant filtering
  - [ ] Research PostgreSQL RLS policy syntax
  - [ ] Define pattern for all database queries
  - [ ] Document escape hatch for cross-tenant admin queries

### Questions to Answer
1. What's the expected tenant count in Year 1? Year 3?
2. Do tenants ever need to share data (partnerships)?
3. What compliance requirements affect data isolation (SOC2, GDPR)?
4. How do we handle tenant deletion and data retention?

### Reference Sources
- [ ] Review Twenty CRM tenant isolation (already researched)
- [ ] Review Plane workspace isolation (already researched)
- [ ] Research Supabase RLS patterns
- [ ] Research Prisma multi-tenancy guides

---

## 2. Role-Based Access Control (RBAC)

**Current State:** Not specified beyond basic user concept

### Research Tasks

- [ ] **Role Hierarchy Definition**
  - [ ] Define role types (Owner, Admin, Member, Viewer, Guest?)
  - [ ] Define role scope levels (Platform, Workspace, Project, Module?)
  - [ ] Research inherited vs explicit permissions
  - [ ] Document role assignment workflow

- [ ] **Permission Matrix**
  - [ ] List all protected resources (projects, contacts, deals, content, etc.)
  - [ ] List all actions (create, read, update, delete, approve, export)
  - [ ] Create role-to-permission mapping table
  - [ ] Define custom permission overrides

- [ ] **Module-Level Permissions**
  - [ ] Can users have different roles per module?
  - [ ] How do module permissions interact with workspace roles?
  - [ ] Define approval permission (who can approve what)

- [ ] **API Key Permissions**
  - [ ] Should API keys have scoped permissions?
  - [ ] How do API key permissions relate to user permissions?
  - [ ] Define rate limits per permission level

### Questions to Answer
1. Do we need team/group-based permissions or just individual?
2. Should permissions be inherited down the hierarchy?
3. What's the default permission for new users?
4. How do we handle permission changes for existing data?

### Reference Sources
- [ ] Research Clerk.dev RBAC implementation
- [ ] Research Auth0 RBAC patterns
- [ ] Review Twenty CRM permission model
- [ ] Review Plane member roles

---

## 3. Authentication System

**Current State:** JWT + OAuth mentioned, details missing

### Research Tasks

- [ ] **Authentication Methods**
  - [ ] Email/password with verification
  - [ ] OAuth providers to support (Google, GitHub, Microsoft?)
  - [ ] Magic link / passwordless option?
  - [ ] SSO/SAML for enterprise (future consideration?)

- [ ] **Session Management**
  - [ ] JWT vs session tokens decision
  - [ ] Token refresh strategy
  - [ ] Session duration and expiration
  - [ ] Multi-device session handling
  - [ ] Remember me functionality

- [ ] **Security Requirements**
  - [ ] Password complexity rules
  - [ ] Rate limiting on auth endpoints
  - [ ] Brute force protection
  - [ ] 2FA/MFA implementation (optional or required?)

- [ ] **Account Recovery**
  - [ ] Password reset flow
  - [ ] Email change verification
  - [ ] Account lockout and recovery
  - [ ] Support intervention process

### Questions to Answer
1. Which OAuth providers are must-have vs nice-to-have?
2. Is SSO required for MVP or post-launch?
3. What's our 2FA strategy (TOTP, SMS, WebAuthn)?
4. How do we handle social auth account linking?

### Reference Sources
- [ ] Research NextAuth.js patterns
- [ ] Research Lucia auth library
- [ ] Review Clerk.dev features (potential integration)
- [ ] Research better-auth library

---

## 4. Approval System (Human-in-the-Loop)

**Current State:** Flow defined, operational details missing

### Research Tasks

- [ ] **Escalation Rules**
  - [ ] Define escalation triggers (timeout, value threshold, type)
  - [ ] Define escalation path (who gets escalated requests)
  - [ ] Research auto-approval rules for low-risk actions
  - [ ] Define delegation during absence

- [ ] **Notification System**
  - [ ] In-app notification implementation
  - [ ] Email notification triggers and templates
  - [ ] Push notification strategy (web push, mobile?)
  - [ ] Notification preferences per user
  - [ ] Digest vs real-time notifications

- [ ] **Multi-Level Approvals**
  - [ ] Sequential approval workflows (A then B then C)
  - [ ] Parallel approvals (A and B must both approve)
  - [ ] Threshold-based routing (deals > $X need manager)
  - [ ] Define approval chain configuration UI

- [ ] **Audit Trail Requirements**
  - [ ] What metadata to capture per approval
  - [ ] Approval reason/notes field
  - [ ] Change history tracking
  - [ ] Compliance/export requirements

### Questions to Answer
1. What's the default approval timeout (24h, 48h, 7d)?
2. Can approvals be delegated or reassigned?
3. Do we need approval templates/presets?
4. How do we handle approval for bulk operations?

### Reference Sources
- [ ] Research Retool approval workflows
- [ ] Review how Slack handles approval bots
- [ ] Research n8n/Zapier approval patterns
- [ ] Study enterprise approval systems (ServiceNow patterns)

---

## 5. Event Bus & Cross-Module Communication

**Current State:** Redis Streams + schema defined, implementation gaps

### Research Tasks

- [ ] **Event Persistence**
  - [ ] Event log retention policy (days, count, size)
  - [ ] Event replay capability requirements
  - [ ] Archive strategy for old events
  - [ ] Event sourcing consideration (full CQRS?)

- [ ] **Error Handling**
  - [ ] Dead letter queue implementation
  - [ ] Retry policy (count, backoff strategy)
  - [ ] Poison pill detection and handling
  - [ ] Event ordering guarantees needed?

- [ ] **Event Versioning**
  - [ ] Schema evolution strategy
  - [ ] Backward compatibility rules
  - [ ] Event version migration patterns
  - [ ] Consumer version handling

- [ ] **Monitoring & Observability**
  - [ ] Event processing latency metrics
  - [ ] Dead letter queue alerts
  - [ ] Consumer lag monitoring
  - [ ] Event throughput dashboard

### Questions to Answer
1. Do we need exactly-once delivery or at-least-once?
2. What's acceptable event processing latency?
3. How long should events be retained for replay?
4. Do we need event correlation/tracing across modules?

### Reference Sources
- [ ] Research Redis Streams patterns in depth
- [ ] Review BullMQ event patterns
- [ ] Research EventBridge patterns (AWS)
- [ ] Study event sourcing with EventStore

---

## 6. External Integration Framework

**Current State:** Almost no integration specs documented

### Research Tasks

- [ ] **OAuth Connection Management**
  - [ ] How users connect external accounts
  - [ ] Token storage and refresh strategy
  - [ ] Connection status UI/UX
  - [ ] Disconnection and re-auth flows

- [ ] **API Rate Limiting**
  - [ ] Rate limit strategy (per user, per tenant, global)
  - [ ] Rate limit storage (Redis)
  - [ ] Rate limit headers and responses
  - [ ] Burst allowance vs sustained rate

- [ ] **Webhook Handling**
  - [ ] Webhook signature verification patterns
  - [ ] Idempotency key handling
  - [ ] Webhook retry/failure handling
  - [ ] Webhook to internal event mapping

- [ ] **Integration Patterns**
  - [ ] Standardized integration interface
  - [ ] Credential storage pattern (encrypted)
  - [ ] Health check/connection test pattern
  - [ ] Error handling and user notification

- [ ] **Priority Integrations to Research**
  - [ ] AI Providers (OpenAI, Anthropic, Google) - partially done
  - [ ] Email (SendGrid, AWS SES, Resend)
  - [ ] CRM (HubSpot, Salesforce) for data sync
  - [ ] Social (Meta, LinkedIn, Twitter APIs)
  - [ ] Payment (Stripe for billing)

### Questions to Answer
1. Which integrations are required for MVP?
2. Do we build integrations or use Zapier/Make?
3. How do we handle integration API changes/deprecations?
4. What's our integration testing strategy?

### Reference Sources
- [ ] Research Nango for OAuth management
- [ ] Research Merge.dev for unified APIs
- [ ] Review Supabase edge functions for webhooks
- [ ] Study Vercel's integration patterns

---

## 7. UI Shell & Design System

**Current State:** Layout mockups exist, design system incomplete

### Research Tasks

- [ ] **Design System Foundation**
  - [ ] Color palette (light/dark mode)
  - [ ] Typography scale
  - [ ] Spacing system (4px, 8px grid)
  - [ ] Border radius, shadows, elevation
  - [ ] Animation/transition standards

- [ ] **Component Library**
  - [ ] Inventory of needed components
  - [ ] shadcn/ui customization approach
  - [ ] Custom component patterns
  - [ ] Component documentation format

- [ ] **Responsive Design**
  - [ ] Breakpoint definitions
  - [ ] Mobile-first vs desktop-first
  - [ ] Touch target sizes
  - [ ] Navigation patterns per breakpoint

- [ ] **Accessibility**
  - [ ] WCAG conformance level target (AA?)
  - [ ] Keyboard navigation patterns
  - [ ] Screen reader testing approach
  - [ ] Color contrast requirements

- [ ] **Real-Time UI**
  - [ ] WebSocket connection management
  - [ ] Optimistic UI patterns
  - [ ] Loading and skeleton states
  - [ ] Error state handling

### Questions to Answer
1. Dark mode required for MVP?
2. Mobile app or mobile-responsive web only?
3. What accessibility level is required (AA, AAA)?
4. Do we need offline support?

### Reference Sources
- [ ] Review Taskosaur UI patterns (already researched)
- [ ] Study Radix UI primitives
- [ ] Research Tailwind CSS best practices
- [ ] Review shadcn/ui theming

---

## 8. Agent Monitoring & Observability

**Current State:** Not documented

### Research Tasks

- [ ] **Token Usage Tracking**
  - [ ] Track tokens per request
  - [ ] Track tokens per agent/session
  - [ ] Track tokens per tenant (billing)
  - [ ] Cost calculation and display

- [ ] **Agent Activity Logging**
  - [ ] What to log (requests, tools, responses)
  - [ ] Log retention policy
  - [ ] Log search and filtering
  - [ ] Privacy considerations (PII in logs)

- [ ] **Performance Metrics**
  - [ ] Response time tracking
  - [ ] Error rate tracking
  - [ ] Model availability tracking
  - [ ] Queue depth monitoring

- [ ] **Error Handling**
  - [ ] Timeout handling strategy
  - [ ] Retry policies per model
  - [ ] Fallback model selection
  - [ ] User notification on failures

### Questions to Answer
1. Should users see detailed agent logs?
2. How long to retain agent interaction history?
3. What metrics matter for agent performance?
4. How do we handle model provider outages?

### Reference Sources
- [ ] Research LangSmith for agent observability
- [ ] Review OpenTelemetry patterns
- [ ] Study Agno's built-in monitoring
- [ ] Research Helicone for LLM monitoring

---

## 9. Data Layer Details

**Current State:** Schema draft exists, relationships incomplete

### Research Tasks

- [ ] **Entity Relationships**
  - [ ] Complete ERD diagram
  - [ ] Foreign key constraints
  - [ ] Cascade delete rules
  - [ ] Many-to-many junction tables

- [ ] **Indexing Strategy**
  - [ ] Primary access patterns per table
  - [ ] Composite indexes needed
  - [ ] Full-text search indexes
  - [ ] JSON/JSONB indexing (GIN)

- [ ] **Data Migration**
  - [ ] Migration tooling (Prisma Migrate)
  - [ ] Schema versioning approach
  - [ ] Rollback strategy
  - [ ] Data seeding for dev/test

- [ ] **Shared Entities**
  - [ ] User schema finalization
  - [ ] Workspace/Tenant schema
  - [ ] Audit log schema
  - [ ] File/attachment schema

### Questions to Answer
1. Do we need soft deletes or hard deletes?
2. What's our JSON vs relational data strategy?
3. How do we handle schema changes in production?
4. What's the backup/restore strategy?

### Reference Sources
- [ ] Review Prisma schema best practices
- [ ] Study PostgreSQL indexing guides
- [ ] Research database migration patterns
- [ ] Review Twenty CRM schema patterns

---

## Research Priority Order

### Phase 1: Foundation Blockers (Do First)
1. Multi-Tenant Isolation (Section 1)
2. RBAC Specification (Section 2)
3. Authentication System (Section 3)

### Phase 2: Core Functionality
4. Approval System (Section 4)
5. Event Bus (Section 5)
6. Data Layer (Section 9)

### Phase 3: Integration & Polish
7. External Integrations (Section 6)
8. Agent Monitoring (Section 8)
9. UI/Design System (Section 7)

---

## Completion Tracking

| Section | Research Status | Notes |
|---------|-----------------|-------|
| 1. Multi-Tenant Isolation | ⬜ Not Started | |
| 2. RBAC | ⬜ Not Started | |
| 3. Authentication | ⬜ Not Started | |
| 4. Approval System | ⬜ Not Started | |
| 5. Event Bus | ⬜ Not Started | |
| 6. External Integrations | ⬜ Not Started | |
| 7. UI Shell | ⬜ Not Started | |
| 8. Agent Monitoring | ⬜ Not Started | |
| 9. Data Layer | ⬜ Not Started | |

---

## Next Steps

1. Work through Phase 1 sections systematically
2. For each section, research the reference sources
3. Document findings in `/docs/research/` folder
4. Update this checklist as items are completed
5. Once Phase 1 complete, ready to start Platform PRD

---

**Document Status:** Active Research Checklist
**Owner:** AI Business Hub Team
