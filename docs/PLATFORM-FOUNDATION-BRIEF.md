# HYVVE Platform Foundation Brief

**Version:** 1.0
**Date:** 2025-11-30
**Status:** READY FOR PRD EXPANSION
**Authors:** Product Team (Party Mode Session)

---

## Executive Summary

This brief captures the key architectural decisions for the HYVVE platform foundation, enabling modular development of business automation modules. These decisions are based on comprehensive research documented in the `/docs/research/` folder.

**Platform Vision:** An AI-powered business orchestration platform achieving 90% automation with 5 hours/week human involvement for SMB businesses.

---

## 1. Multi-Tenant Architecture

### Decision: Hybrid RLS + Prisma Client Extension

**Rationale:** Defense-in-depth approach combining application-level filtering with database-level Row-Level Security.

| Aspect | Decision |
|--------|----------|
| **Isolation Strategy** | Row-Level Security (RLS) + Prisma middleware |
| **Tenant ID** | UUID (matches workspace.id) |
| **Schema** | Single shared schema with tenant_id column |
| **Query Scoping** | Prisma Client Extension auto-filters |
| **Admin Access** | RLS bypass role for platform operations |

### Key Artifacts
- All module tables include `tenantId` column
- Composite indexes on (tenantId, frequently_queried_column)
- Cascade delete tenant data when workspace deleted
- 30-day soft delete retention for GDPR

**Research:** [Multi-Tenant Isolation Research](/docs/research/multi-tenant-isolation-research.md)

---

## 2. Role-Based Access Control (RBAC)

### Decision: Three-Tier Hierarchical RBAC

**Rationale:** Simple role hierarchy with optional module-level overrides for flexibility.

| Level | Roles |
|-------|-------|
| **Platform** | Platform Admin, Support Agent (internal only) |
| **Workspace** | Owner → Admin → Member → Viewer → Guest |
| **Module** | Optional overrides per module |

### Permission Summary

| Role | Workspace Settings | Members | Records | Approvals | Agents |
|------|-------------------|---------|---------|-----------|--------|
| Owner | Full | Full | Full | Full | Full |
| Admin | Edit | Manage | Full | Approve | Configure |
| Member | ✗ | ✗ | Own + Assigned | Request | Run |
| Viewer | ✗ | ✗ | Read | ✗ | ✗ |
| Guest | ✗ | ✗ | Limited | ✗ | ✗ |

### Key Artifacts
- Role hierarchy with permission inheritance
- Module permission overrides (JSON field)
- API keys with scoped permissions
- Default invite role configurable per workspace

**Research:** [RBAC Specification Research](/docs/research/rbac-specification-research.md)

---

## 3. Authentication System

### Decision: better-auth Library

**Rationale:** Native organization support, TypeScript-first, self-hosted, extensive plugin ecosystem.

| Aspect | Decision |
|--------|----------|
| **Library** | better-auth |
| **Primary Auth** | Email/Password + Google OAuth |
| **Session** | JWT access tokens + database sessions |
| **Multi-tenant** | Organization plugin for workspaces |

### Authentication Methods (Priority)

| Method | Priority | Status |
|--------|----------|--------|
| Email/Password | P0 | MVP |
| Google OAuth | P0 | MVP |
| GitHub OAuth | P1 | Post-MVP |
| Microsoft OAuth | P1 | Enterprise |
| Magic Link | P2 | Future |
| 2FA/TOTP | P2 | Future |
| SAML/SSO | P3 | Enterprise |

### Token Strategy

| Token | Duration | Purpose |
|-------|----------|---------|
| Access (JWT) | 15 min | API authentication |
| Session | 7 days (30 with remember) | User session |
| Refresh | 30 days | Session renewal |

**Research:** [Authentication System Research](/docs/research/authentication-system-research.md)

---

## 4. Technology Stack (Confirmed)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State:** Zustand + React Query
- **Real-time:** Socket.io client

### Backend
- **API:** NestJS (for modules) + Next.js API routes
- **Database:** PostgreSQL (Supabase or self-hosted)
- **ORM:** Prisma
- **Cache/Queue:** Redis + BullMQ
- **Events:** Redis pub/sub

### AI/Agent
- **Framework:** Agno (multi-model orchestration)
- **BYOAI:** User-provided API keys
- **Models:** Claude, GPT-4, Gemini, DeepSeek support

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway/Render (backend)
- **Storage:** Supabase Storage or S3
- **Email:** Resend
- **Monitoring:** OpenTelemetry + Helicone (LLM)

---

## 5. Approval System (Human-in-the-Loop)

### Decision: Confidence-Based Routing

| Confidence | Action |
|------------|--------|
| High (>85%) | Auto-approve, log for audit |
| Medium (60-85%) | Quick approval (1-click confirm) |
| Low (<60%) | Full review required |

### Key Features
- 48-hour default timeout with escalation
- Notification via in-app + email
- Delegation during absence
- Bulk approval for similar items
- Audit trail for all decisions

---

## 6. Event Bus & Cross-Module Communication

### Decision: Redis Streams

| Aspect | Decision |
|--------|----------|
| **Transport** | Redis Streams |
| **Delivery** | At-least-once |
| **Retention** | 30 days (replay capability) |
| **Dead Letter** | Separate queue with 3 retry attempts |

### Event Schema
```typescript
interface BaseEvent {
  id: string;
  type: string;           // "crm.contact.created"
  source: string;         // "bm-crm"
  timestamp: string;
  correlationId?: string;
  tenantId: string;
  userId: string;
  version: string;
  data: Record<string, any>;
}
```

---

## 7. Module Build Order

Based on dependency analysis:

| Phase | Module(s) | Timeline |
|-------|-----------|----------|
| **Phase 1** | Core Platform (this PRD) | First |
| **Phase 2** | BM-CRM | After Core |
| **Phase 3a** | BMX (Email) | After CRM |
| **Phase 3b** | BMT (Analytics) | Parallel with Email |
| **Phase 4** | BMC (Content), BMS (Sales) | After Email |
| **Phase 5** | BM-Social | After Content |
| **Phase 6** | BMI (Intelligence) | After Analytics |
| **Standalone** | BMV, BMP, BMB, BME-App | Anytime |

---

## 8. MVP Scope (Platform Foundation)

### In Scope
1. ✅ User authentication (email/password + Google OAuth)
2. ✅ Workspace creation and management
3. ✅ Member invitation and role assignment
4. ✅ Multi-tenant data isolation
5. ✅ RBAC permission system
6. ✅ Approval queue UI
7. ✅ Event bus infrastructure
8. ✅ BYOAI configuration (API key storage)
9. ✅ UI shell (sidebar + main content + chat panel)
10. ✅ Settings pages (workspace, profile, integrations)

### Out of Scope (Module PRDs)
- ❌ CRM functionality (separate PRD)
- ❌ Content creation (separate PRD)
- ❌ Email marketing (separate PRD)
- ❌ Social media management (separate PRD)
- ❌ Sales workflows (separate PRD)

---

## 9. Key Questions Resolved

| Question | Answer |
|----------|--------|
| Tenant count Year 1? | 100-500 (SMB focus) |
| Tenant count Year 3? | 5,000-10,000 |
| Tenants share data? | No (isolated) |
| Compliance requirements? | GDPR (launch), SOC2 (future) |
| OAuth providers MVP? | Google (required), GitHub (nice to have) |
| SSO for MVP? | No (enterprise future) |
| 2FA for MVP? | No (optional future) |
| Approval timeout? | 48 hours default |
| Data retention? | 30 days soft delete |
| Dark mode MVP? | Yes (user preference) |
| Mobile app MVP? | No (responsive web only) |

---

## 10. Next Steps

1. **Create Platform Foundation PRD** - Full detailed requirements
2. **Database Schema Design** - Finalize Prisma schema
3. **API Specification** - OpenAPI/tRPC definitions
4. **UI/UX Wireframes** - High-fidelity designs
5. **Sprint Planning** - Break into implementable stories

---

## Research Documents

| Document | Path |
|----------|------|
| Multi-Tenant Research | `/docs/research/multi-tenant-isolation-research.md` |
| RBAC Research | `/docs/research/rbac-specification-research.md` |
| Authentication Research | `/docs/research/authentication-system-research.md` |
| Module Research | `/docs/MODULE-RESEARCH.md` |
| Master Plan | `/docs/MASTER-PLAN.md` |
| Twenty CRM Analysis | `/docs/modules/bm-crm/research/twenty-crm-analysis.md` |
| Taskosaur Analysis | `/docs/research/taskosaur-analysis.md` |
| Agno Analysis | `/docs/research/agno-analysis.md` |

---

**Document Status:** Ready for PRD Expansion
**Approvals Required:** Product Owner sign-off before PRD development
