# AI Business Hub - Module Research & Architecture

**Version:** 1.0
**Created:** 2024-11-27
**Purpose:** Comprehensive module breakdown with agents, workflows, and inspiration sources

---

## Table of Contents

1. [Module Architecture Overview](#1-module-architecture-overview)
   - 1.1 Module Categories
   - 1.2 Shared Context Architecture
   - 1.3 Shared Data Architecture (CRM/Sales)
2. [Development Methodology](#2-development-methodology)
   - 2.1-2.3 Pipeline & Patterns
   - 2.4 Taskosaur Pattern Integration
   - 2.5 Implementation Patterns (IAssistantClient, Sessions)
3. [Meta Layer - Module Builder](#3-meta-layer---module-builder)
4. [Foundation Modules](#4-foundation-modules)
5. [Product Creation Modules](#5-product-creation-modules)
   - 5.5 BME-App (SaaS/Website/WebApp) - BMAD BMM Mapping
   - 5.6 BME-Website (Alias)
6. [Operations Modules](#6-operations-modules)
7. [Conversational Workflow Builder](#7-conversational-workflow-builder)
   - 7.4 User Journey for Workflow Discovery & Management
8. [Inter-Module Flow Diagram](#8-inter-module-flow-diagram)
9. [AI Tools & Integrations](#9-ai-tools--integrations)
10. [Research Priorities](#10-research-priorities)
11. [UI/UX Style Guide Foundations](#11-uiux-style-guide-foundations)
12. [Testing Strategy](#12-testing-strategy)
13. [Meta-Validation](#13-meta-validation)

---

## 1. Module Architecture Overview

### 1.1 Module Categories

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI BUSINESS HUB MODULES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                    META LAYER - Module Builder (BMB)                   ║  │
│  ║      Conversational workflow creation using BMAD Builder patterns      ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     FOUNDATION LAYER (BUILD Phase)                      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │ │
│  │  │   BMV    │ │   BMP    │ │   BMB    │ │   BMI    │                  │ │
│  │  │Validation│ │ Planning │ │ Branding │ │  Intel   │                  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                  PRODUCT CREATION LAYER (BME-*)                        │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │ Course │ │Podcast │ │  Book  │ │YouTube │ │Digital │ │  SaaS  │   │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                                    │ │
│  │  │Physical│ │Ecomerce│ │Website │  ← NEW: Website Creation Module    │ │
│  │  └────────┘ └────────┘ └────────┘                                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                        │
│                                    ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                   OPERATIONS LAYER (OPERATE Phase)                      │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │ │
│  │  │Content │ │  Video │ │ Social │ │  SEO   │ │  Ads   │ │Email/  │   │ │
│  │  │  BMC   │ │BMC-Vid │ │BM-Socl │ │BM-SEO  │ │ BM-Ads │ │Mktg BMX│   │ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │ │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │ │
│  │  │Support │ │Analytics│ │ Sales │ │  CMS   │ │  CRM   │  ← MOVED   │ │
│  │  │BM-Supp │ │  BMT   │ │  BMS  │ │BM-CMS  │ │BM-CRM  │  from Found│ │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Shared Context Architecture

All modules share context through:

- **PostgreSQL Database**: Persistent shared memory
- **Redis Event Bus**: Real-time inter-module communication
- **Conversational UI**: Human-in-the-loop orchestration
- **Agent Memory**: Cross-module knowledge sharing

### 1.3 Shared Data Architecture

> **Architectural Decision**: Modules that operate on the same domain entities MUST share a unified data layer while maintaining separate agent teams and UIs.

#### 1.3.1 CRM + Sales Shared Data Model

The BM-CRM and BMS (Sales) modules share the same underlying data but serve different purposes:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHARED DATA LAYER (PostgreSQL)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    UNIFIED RECORD SYSTEM                              │   │
│  │  (Inspired by Twenty CRM's flexible record architecture)              │   │
│  │                                                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Contacts   │  │  Companies  │  │   Deals     │  │ Activities  │  │   │
│  │  │  (people)   │  │  (orgs)     │  │ (pipeline)  │  │ (timeline)  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         │                │                │                │          │   │
│  │         └────────────────┴────────────────┴────────────────┘          │   │
│  │                                   │                                    │   │
│  │                          ┌────────┴────────┐                          │   │
│  │                          │  Custom Fields  │                          │   │
│  │                          │  (extensible)   │                          │   │
│  │                          └─────────────────┘                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│         ┌──────────────────────┐         ┌──────────────────────┐          │
│         │      BM-CRM          │         │        BMS           │          │
│         │   (Relationship)     │         │      (Sales)         │          │
│         ├──────────────────────┤         ├──────────────────────┤          │
│         │ • Lead scoring       │         │ • Active prospecting │          │
│         │ • Contact history    │         │ • Outreach execution │          │
│         │ • Pipeline view      │         │ • Deal negotiation   │          │
│         │ • Data enrichment    │         │ • Proposal generation│          │
│         │ • Relationship track │         │ • Close coaching     │          │
│         └──────────────────────┘         └──────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.3.2 Data Ownership Rules

| Data Entity | Owner Module | Consumers | Write Access |
|-------------|--------------|-----------|--------------|
| Contacts | BM-CRM | BMS, BMX, BM-Support | CRM + enrichment agents |
| Companies | BM-CRM | BMS, BMI, BMX | CRM + enrichment agents |
| Deals | BMS | BM-CRM, BMT | Sales agents only |
| Activities | Shared | All modules | Any module can log |
| Lead Scores | BM-CRM | BMS, BMX | Scoring agent only |
| Content | BMC | BM-Social, BMX, BM-CMS | Content agents |
| Analytics Events | BMT | All modules | Collector agent only |

#### 1.3.3 Event Synchronization

When data changes in a shared entity, the owning module publishes events:

```typescript
// Example: Contact enrichment triggers events for dependent modules
interface ContactEnrichedEvent {
  type: 'contact.enriched';
  contactId: string;
  enrichedFields: string[];
  leadScoreChange?: { old: number; new: number };
}

// BMS listens and updates its view
// BMX updates email personalization
// BM-Support updates customer context
```

### 1.4 Cross-Module Event Schema

> **Critical for Infrastructure:** This schema defines ALL events that flow between modules. Required for event bus design.

#### 1.4.1 Event Naming Convention

```
{module}.{entity}.{action}

Examples:
- crm.contact.created
- crm.lead.scored
- content.article.published
- email.campaign.sent
- sales.deal.stage_changed
```

#### 1.4.2 Base Event Structure

```typescript
interface BaseEvent {
  id: string;                    // UUID
  type: string;                  // Event type (e.g., 'crm.contact.created')
  source: string;                // Module that emitted (e.g., 'bm-crm')
  timestamp: string;             // ISO 8601
  correlationId?: string;        // For tracing related events
  userId: string;                // User/tenant context
  version: string;               // Schema version (e.g., '1.0')
  data: Record<string, any>;     // Event-specific payload
}
```

#### 1.4.3 Module Event Catalog

##### BM-CRM Events (Customer Relationship)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `crm.contact.created` | New contact added | `{ contactId, source, fields }` | BMX, BMS, BM-Support |
| `crm.contact.updated` | Contact modified | `{ contactId, changedFields }` | BMX, BMS |
| `crm.contact.enriched` | Data enrichment complete | `{ contactId, enrichedFields }` | BMS, BMX |
| `crm.lead.scored` | Lead score calculated | `{ contactId, score, factors }` | BMS, BMX, Notifications |
| `crm.lead.qualified` | Lead meets threshold | `{ contactId, score, segment }` | BMS, BMX |
| `crm.company.created` | New company added | `{ companyId, fields }` | BMI, BMS |
| `crm.deal.created` | New deal started | `{ dealId, contactId, value }` | BMS, BMT |
| `crm.deal.stage_changed` | Deal moved in pipeline | `{ dealId, oldStage, newStage }` | BMS, BMT, Notifications |
| `crm.deal.won` | Deal closed successfully | `{ dealId, value, contactId }` | BMT, Notifications |
| `crm.deal.lost` | Deal closed unsuccessfully | `{ dealId, reason }` | BMT, BMI |

##### BMC Events (Content)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `content.article.drafted` | Article draft created | `{ articleId, title, authorAgent }` | Approvals |
| `content.article.approved` | Human approved content | `{ articleId, approvedBy }` | BM-Social, BM-CMS |
| `content.article.published` | Content went live | `{ articleId, url, publishedAt }` | BMT, BM-Social |
| `content.article.scheduled` | Content scheduled | `{ articleId, scheduledFor }` | BM-CMS |
| `content.calendar.updated` | Calendar modified | `{ calendarId, changes }` | BM-Social |

##### BMX Events (Email)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `email.template.created` | New template added | `{ templateId, name, type }` | - |
| `email.campaign.created` | Campaign drafted | `{ campaignId, name, audienceSize }` | Approvals |
| `email.campaign.approved` | Human approved | `{ campaignId, approvedBy }` | - |
| `email.campaign.sent` | Emails dispatched | `{ campaignId, recipientCount }` | BMT |
| `email.campaign.completed` | All emails delivered | `{ campaignId, stats }` | BMT, BM-CRM |
| `email.contact.opened` | Email opened | `{ campaignId, contactId }` | BM-CRM, BMT |
| `email.contact.clicked` | Link clicked | `{ campaignId, contactId, link }` | BM-CRM, BMT |
| `email.contact.unsubscribed` | User unsubscribed | `{ contactId, reason }` | BM-CRM |

##### BM-Social Events (Social Media)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `social.post.drafted` | Post created | `{ postId, platform, content }` | Approvals |
| `social.post.approved` | Human approved | `{ postId, approvedBy }` | - |
| `social.post.published` | Post went live | `{ postId, platform, url }` | BMT |
| `social.post.engagement` | Likes/comments/shares | `{ postId, metrics }` | BMT, BMI |
| `social.mention.detected` | Brand mentioned | `{ mentionId, platform, sentiment }` | BMI, BM-Support |

##### BMS Events (Sales)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `sales.outreach.sent` | Sales email/call made | `{ outreachId, contactId, type }` | BM-CRM, BMT |
| `sales.meeting.scheduled` | Meeting booked | `{ meetingId, contactId, datetime }` | BM-CRM, Notifications |
| `sales.proposal.sent` | Proposal delivered | `{ proposalId, dealId, value }` | BMT |
| `sales.task.completed` | Sales task done | `{ taskId, type, outcome }` | BM-CRM |

##### BMT Events (Analytics)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `analytics.report.generated` | Report created | `{ reportId, type, period }` | Notifications |
| `analytics.alert.triggered` | Threshold breached | `{ alertId, metric, value }` | Notifications, BMI |
| `analytics.insight.discovered` | AI found pattern | `{ insightId, type, recommendation }` | Notifications |

##### BMI Events (Intelligence)

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `intel.competitor.update` | Competitor change detected | `{ competitorId, changeType }` | Notifications |
| `intel.trend.identified` | Market trend found | `{ trendId, industry, impact }` | Notifications |
| `intel.opportunity.spotted` | Business opportunity | `{ opportunityId, type, confidence }` | Notifications |

##### System Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `approval.requested` | Item needs human review | `{ itemId, itemType, priority }` | Dashboard, Notifications |
| `approval.granted` | Human approved | `{ itemId, approvedBy, notes }` | Source module |
| `approval.rejected` | Human rejected | `{ itemId, rejectedBy, reason }` | Source module |
| `workflow.started` | Workflow began execution | `{ workflowId, triggeredBy }` | BMT |
| `workflow.completed` | Workflow finished | `{ workflowId, status, duration }` | BMT |
| `workflow.failed` | Workflow errored | `{ workflowId, error, step }` | Notifications |

#### 1.4.4 Event Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CROSS-MODULE EVENT FLOWS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LEAD CAPTURE → NURTURE FLOW                                                │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [Form Submit] → crm.contact.created                                        │
│                       │                                                      │
│                       ├──→ [BM-CRM] crm.lead.scored                         │
│                       │         │                                            │
│                       │         └──→ [BMX] Trigger nurture sequence         │
│                       │         └──→ [BMS] Add to outreach queue           │
│                       │                                                      │
│                       └──→ [BMX] email.campaign.sent                        │
│                                   │                                          │
│                                   └──→ email.contact.opened                 │
│                                             │                                │
│                                             └──→ [BM-CRM] Update engagement │
│                                             └──→ [BMT] Track analytics      │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  CONTENT PUBLISH FLOW                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [AI Drafts] → content.article.drafted                                      │
│                       │                                                      │
│                       └──→ approval.requested                               │
│                                   │                                          │
│                       [Human Reviews]                                        │
│                                   │                                          │
│                       └──→ approval.granted                                 │
│                                   │                                          │
│                       └──→ content.article.published                        │
│                                   │                                          │
│                                   ├──→ [BM-Social] Auto-post to platforms   │
│                                   │         └──→ social.post.published      │
│                                   │                                          │
│                                   ├──→ [BMX] Include in newsletter          │
│                                   │                                          │
│                                   └──→ [BMT] Track page views               │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  DEAL PROGRESSION FLOW                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  [Sales Creates] → crm.deal.created                                         │
│                       │                                                      │
│                       └──→ [BMT] Start deal tracking                        │
│                                                                              │
│  [Stage Change] → crm.deal.stage_changed                                    │
│                       │                                                      │
│                       ├──→ [BMS] Update sales tasks                         │
│                       ├──→ [BMX] Trigger stage-specific emails              │
│                       └──→ [BMT] Update pipeline metrics                    │
│                                                                              │
│  [Deal Won] → crm.deal.won                                                  │
│                       │                                                      │
│                       ├──→ [BMT] Record revenue                             │
│                       ├──→ [BMX] Send onboarding sequence                   │
│                       └──→ [Notifications] Alert team                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Module Dependency Graph

> **Critical for Build Order:** This graph shows which modules depend on which, determining implementation sequence.

#### 1.5.1 Dependency Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCY GRAPH                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIER 0: FOUNDATION (No dependencies - build first)                         │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CORE PLATFORM                                                       │   │
│  │  • Event Bus (Redis)                                                 │   │
│  │  • Session Management                                                │   │
│  │  • Authentication/BYOAI                                              │   │
│  │  • Approval Queue                                                    │   │
│  │  • Notification System                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  TIER 1: DATA FOUNDATION (Depends on Core)                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ┌───────────────┐                                                          │
│  │   BM-CRM      │  ← All modules that work with contacts need this        │
│  │   (Contacts,  │                                                          │
│  │    Companies, │                                                          │
│  │    Deals)     │                                                          │
│  └───────┬───────┘                                                          │
│          │                                                                   │
│  TIER 2: OPERATIONS (Depends on BM-CRM)                                     │
│  ─────────────────────────────────────────────────────────────────────────  │
│          │                                                                   │
│          ├──────────────────┬──────────────────┬──────────────────┐        │
│          ▼                  ▼                  ▼                  ▼        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐   │
│  │     BMX       │  │     BMS       │  │   BM-Support  │  │    BMT    │   │
│  │   (Email)     │  │   (Sales)     │  │   (Support)   │  │(Analytics)│   │
│  └───────┬───────┘  └───────────────┘  └───────────────┘  └─────┬─────┘   │
│          │                                                       │         │
│  TIER 3: CONTENT & MARKETING (Depends on CRM + Email)                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│          │                                                       │         │
│          ├──────────────────┬──────────────────┐                │         │
│          ▼                  ▼                  ▼                │         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │         │
│  │     BMC       │  │   BM-Social   │  │    BM-Ads     │       │         │
│  │   (Content)   │  │   (Social)    │  │   (Ads)       │       │         │
│  └───────────────┘  └───────────────┘  └───────────────┘       │         │
│                                                                  │         │
│  TIER 4: INTELLIGENCE (Depends on Analytics + Data)             │         │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                  │         │
│                                              ┌───────────────────┘         │
│                                              ▼                             │
│                                      ┌───────────────┐                     │
│                                      │     BMI       │                     │
│                                      │(Intelligence) │                     │
│                                      └───────────────┘                     │
│                                                                              │
│  STANDALONE (Can be built anytime after Core)                               │
│  ─────────────────────────────────────────────────────────────────────────  │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐   │
│  │     BMV       │  │     BMP       │  │     BMB       │  │  BME-App  │   │
│  │ (Validation)  │  │  (Planning)   │  │  (Branding)   │  │(SaaS/Web) │   │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 1.5.2 Dependency Matrix

| Module | Depends On | Depended On By |
|--------|------------|----------------|
| **Core Platform** | - | Everything |
| **BM-CRM** | Core | BMX, BMS, BM-Support, BMT, BM-Social, BMI |
| **BMX** | Core, BM-CRM | BMC, BM-Social, BMS |
| **BMS** | Core, BM-CRM | BMT |
| **BMT** | Core, BM-CRM | BMI |
| **BMC** | Core, BMX (optional) | BM-Social, BM-CMS |
| **BM-Social** | Core, BMC, BM-CRM | BMT |
| **BMI** | Core, BMT, BM-CRM | - |
| **BM-Support** | Core, BM-CRM | - |
| **BMV** | Core | - |
| **BMP** | Core | - |
| **BMB (Branding)** | Core | - |
| **BME-App** | Core | - |

#### 1.5.3 Recommended Build Order

Based on dependencies, here's the optimal build sequence:

| Phase | Modules | Reason |
|-------|---------|--------|
| **Phase 1** | Core Platform | Foundation for everything |
| **Phase 2** | BM-CRM | Data foundation, most modules need it |
| **Phase 3a** | BMX (Email) | High value, needed by marketing |
| **Phase 3b** | BMT (Analytics) | Tracking for all modules |
| **Phase 4a** | BMC (Content) | Core marketing capability |
| **Phase 4b** | BMS (Sales) | Revenue generation |
| **Phase 5** | BM-Social | Needs content from BMC |
| **Phase 6** | BMI (Intelligence) | Needs data from BMT |
| **Anytime** | BMV, BMP, BMB, BME-App | Standalone modules |

### 1.6 Shared Data Contracts

> **Critical for Database Design:** Defines the shape of data shared across modules.

#### 1.6.1 Core Entities

##### Contact (Owned by BM-CRM)

```typescript
interface Contact {
  id: string;                    // UUID
  email: string;                 // Primary identifier
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;              // FK to Company
  companyId?: string;

  // Source tracking
  source: 'form' | 'import' | 'api' | 'manual' | 'enrichment';
  sourceDetails?: Record<string, any>;

  // Scoring (calculated by BM-CRM)
  leadScore: number;             // 0-100
  leadScoreFactors: ScoreFactor[];
  leadStatus: 'new' | 'engaged' | 'qualified' | 'customer' | 'churned';

  // Segmentation
  tags: string[];
  segments: string[];

  // Communication preferences
  emailOptIn: boolean;
  emailOptInDate?: Date;
  unsubscribedAt?: Date;

  // Custom fields (user-defined)
  customFields: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt?: Date;
}
```

##### Company (Owned by BM-CRM)

```typescript
interface Company {
  id: string;                    // UUID
  name: string;
  domain?: string;               // website domain
  industry?: string;
  size?: 'solo' | 'small' | 'medium' | 'large' | 'enterprise';

  // Enriched data
  linkedinUrl?: string;
  description?: string;
  technologies?: string[];

  // Relationships
  contacts: Contact[];
  deals: Deal[];

  // Custom fields
  customFields: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

##### Deal (Owned by BMS, shared with BM-CRM)

```typescript
interface Deal {
  id: string;                    // UUID
  name: string;
  value: number;                 // Currency amount
  currency: string;              // ISO currency code

  // Pipeline
  stage: string;                 // Pipeline stage ID
  probability: number;           // 0-100
  expectedCloseDate?: Date;

  // Relationships
  contactId: string;             // Primary contact
  companyId?: string;
  assignedTo?: string;           // User ID

  // Status
  status: 'open' | 'won' | 'lost';
  lostReason?: string;
  wonAt?: Date;
  lostAt?: Date;

  // Custom fields
  customFields: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

##### Activity (Shared across modules)

```typescript
interface Activity {
  id: string;                    // UUID
  type: ActivityType;
  subtype?: string;              // Module-specific subtype

  // What happened
  title: string;
  description?: string;

  // Who/what is involved
  contactId?: string;
  companyId?: string;
  dealId?: string;

  // Source
  module: string;                // Which module created this
  agentId?: string;              // Which agent (if AI-generated)
  userId?: string;               // Which user (if human)

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  occurredAt: Date;              // When the activity happened
  createdAt: Date;               // When logged
}

type ActivityType =
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'call_made'
  | 'call_received'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'note_added'
  | 'deal_created'
  | 'deal_stage_changed'
  | 'form_submitted'
  | 'page_viewed'
  | 'content_downloaded'
  | 'social_engagement'
  | 'support_ticket_created'
  | 'support_ticket_resolved';
```

##### Content (Owned by BMC)

```typescript
interface Content {
  id: string;                    // UUID
  type: 'article' | 'video' | 'podcast' | 'social_post' | 'email_template';

  // Core content
  title: string;
  body: string;                  // Markdown or HTML
  excerpt?: string;

  // Media
  featuredImage?: string;        // URL
  mediaUrls?: string[];

  // Metadata
  author: string;                // Agent or user
  tags: string[];
  categories: string[];

  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;

  // Status
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### 1.6.2 Shared Enums

```typescript
// Used across modules for consistency
enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved'  // Met confidence threshold
}

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

enum AgentType {
  // CRM
  LEAD_SCORER = 'lead_scorer',
  CRM_ORCHESTRATOR = 'crm_orchestrator',
  DATA_ENRICHER = 'data_enricher',

  // Content
  CONTENT_WRITER = 'content_writer',
  CONTENT_EDITOR = 'content_editor',
  SEO_OPTIMIZER = 'seo_optimizer',

  // Email
  EMAIL_WRITER = 'email_writer',
  EMAIL_SCHEDULER = 'email_scheduler',

  // Sales
  SALES_COACH = 'sales_coach',
  PROPOSAL_WRITER = 'proposal_writer',

  // Social
  SOCIAL_WRITER = 'social_writer',
  SOCIAL_SCHEDULER = 'social_scheduler',

  // Analytics
  REPORT_GENERATOR = 'report_generator',
  INSIGHT_ANALYZER = 'insight_analyzer',

  // Intelligence
  TREND_SCANNER = 'trend_scanner',
  COMPETITOR_MONITOR = 'competitor_monitor'
}
```

---

## 2. Development Methodology

### 2.1 Module Development Pipeline

The recommended approach for building each module:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MODULE DEVELOPMENT PIPELINE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │ Step 1  │──▶│ Step 2  │──▶│ Step 3  │──▶│ Step 4  │──▶│ Step 5  │       │
│  │Universal│   │Research │   │  BMAD   │   │  Agno   │   │Parallel │       │
│  │ UI/UX   │   │Inspire  │   │ Builder │   │Framework│   │  Dev    │       │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│       │             │             │             │             │             │
│       ▼             ▼             ▼             ▼             ▼             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │ Style   │   │ Module  │   │ Agents  │   │ Remote  │   │  Merge  │       │
│  │ Guide   │   │Features │   │Workflows│   │ Coding  │   │ & Test  │       │
│  │ System  │   │ Ideas   │   │  Tasks  │   │Patterns │   │         │       │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Step-by-Step Process

#### Step 1: Create Universal UI/UX Style Guide

- Define consistent design tokens (colors, typography, spacing)
- Create reusable component library (shadcn/ui based)
- Establish layout patterns for module dashboards
- Design conversational UI patterns for agent interactions
- Document accessibility requirements

#### Step 2: Research Inspiration Sources

For each module:
- Study open-source alternatives (listed in this document)
- Document key features to replicate
- Identify unique value-adds for AI enhancement
- Note API patterns and data models
- Evaluate integration possibilities

#### Step 3: Use BMAD Builder (BMB) for Agent Architecture

Create using the BMad Builder module:
- **Agents**: Define persona, capabilities, tools for each role
- **Workflows**: Design conversational workflow patterns (not node-based)
- **Tasks**: Break workflows into executable task definitions
- **Checklists**: Quality gates and validation criteria

#### Step 4: Implement Using Agno Framework + Remote Coding Patterns

Reference: `docs/architecture/remote-coding-agent-patterns.md`

Key patterns to apply:
- **IAssistantClient**: Standard interface for all AI agent interactions
- **IPlatformAdapter**: Abstraction for different AI providers (BYOAI)
- **Session Management**: Handle long-running agent conversations
- **Streaming**: Real-time response streaming for conversational UI
- **Client Factory**: Dynamic provider selection

#### Step 5: Parallel Development & Merge

- Each module developed independently by separate agents/teams
- Shared event bus schema ensures compatibility
- Integration testing before merge
- Progressive rollout to production

### 2.3 Architecture Patterns Reference

From `remote-coding-agent-patterns.md`:

| Pattern | Purpose | Application |
|---------|---------|-------------|
| IAssistantClient | Unified agent interface | All module agents |
| IPlatformAdapter | Provider abstraction | BYOAI support |
| SessionManager | Conversation state | Long-running workflows |
| StreamingHandler | Real-time responses | Conversational UI |
| ClientFactory | Dynamic instantiation | Multi-provider support |
| OAuth/Token Auth | User credentials | BYOAI authentication |

### 2.4 Taskosaur Pattern Integration

> **Critical**: Taskosaur is foundational to the AI Business Hub's conversational approach. This section maps Taskosaur patterns to BMAD patterns.

#### 2.4.1 Taskosaur → BMAD Pattern Mapping

| Taskosaur Concept | BMAD Equivalent | Integration Approach |
|-------------------|-----------------|---------------------|
| Task | Task (XML/YAML) | Direct adoption - BMAD task format |
| Task Template | Workflow | BMAD workflows wrap task sequences |
| Conversational Execution | Agent + Workflow | Agent interprets, workflow executes |
| BYOAI Model | Model Router | CCR-inspired routing layer |
| Context Awareness | Agent Memory | PostgreSQL-backed shared memory |
| Task Parameters | Workflow Variables | BMAD variable resolution system |

#### 2.4.2 Taskosaur Architecture Integration

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TASKOSAUR + BMAD INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER INPUT (Natural Language)                                              │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONVERSATIONAL LAYER (Taskosaur Pattern)                           │   │
│  │  ├── Intent Recognition                                              │   │
│  │  ├── Parameter Extraction                                            │   │
│  │  ├── Clarification Dialogs                                           │   │
│  │  └── Context Maintenance                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BMAD TRANSLATION LAYER                                              │   │
│  │  ├── Map intent → BMAD workflow                                      │   │
│  │  ├── Resolve variables from conversation                             │   │
│  │  ├── Select appropriate agents                                       │   │
│  │  └── Generate workflow YAML                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BMAD EXECUTION ENGINE (workflow.xml)                                │   │
│  │  ├── Load workflow configuration                                     │   │
│  │  ├── Execute steps via agents                                        │   │
│  │  ├── Handle approval gates                                           │   │
│  │  └── Stream results back to UI                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.4.3 Taskosaur Features to Adopt

| Feature | Description | Implementation |
|---------|-------------|----------------|
| **Streaming Responses** | Real-time task execution feedback | WebSocket + Server-Sent Events |
| **Task Chaining** | One task triggers another | BMAD workflow steps with `invoke-task` |
| **Template Variables** | Dynamic parameter injection | BMAD `{{variable}}` resolution |
| **Error Recovery** | Graceful handling of failures | BMAD `goto` and retry patterns |
| **Session Persistence** | Resume long-running tasks | PostgreSQL session storage |
| **Multi-Provider Support** | Switch AI providers per task | Model Router service |

#### 2.4.4 Taskosaur-Inspired Workflow Definition

```yaml
# Example: Taskosaur-style conversational workflow in BMAD format
name: "lead-capture-to-nurture"
description: "Created via conversation: 'When a new lead comes in...'"
trigger:
  type: "event"
  event: "form_submission"

# Taskosaur-style natural language mapping
intent_mapping:
  phrases:
    - "when a new lead comes in"
    - "after someone fills out the form"
    - "new contact submission"
  parameters:
    - name: "scoring_criteria"
      prompt: "What scoring criteria should I use?"
    - name: "crm_fields"
      prompt: "Which CRM fields should I populate?"

steps:
  - task: "score-lead"
    agent: "BM-CRM-LeadScorerAgent"
    inputs:
      contact: "{{trigger.data}}"
      criteria: "{{scoring_criteria}}"

  - task: "add-to-crm"
    agent: "BM-CRM-OrchestratorAgent"
    inputs:
      contact: "{{step.0.output}}"
      fields: "{{crm_fields}}"

  - task: "send-welcome-email"
    agent: "BMX-EmailWriterAgent"
    inputs:
      recipient: "{{step.1.output.contact}}"
      template: "welcome-sequence"

  - task: "notify-high-value"
    condition: "{{step.0.output.score}} > 80"
    agent: "NotificationAgent"
    inputs:
      channel: "slack"
      message: "High-value lead: {{step.1.output.contact.name}}"
```

### 2.5 Implementation Patterns (from Remote Coding Agent)

> **Reference**: `docs/architecture/remote-coding-agent-patterns.md`

#### 2.5.1 IAssistantClient Interface

Every module agent MUST implement the standard assistant client interface:

```typescript
interface IAssistantClient {
  // Session management
  createSession(config: SessionConfig): Promise<Session>;
  resumeSession(sessionId: string): Promise<Session>;
  endSession(sessionId: string): Promise<void>;

  // Message handling
  sendMessage(sessionId: string, message: Message): Promise<Response>;
  streamMessage(sessionId: string, message: Message): AsyncIterable<Chunk>;

  // Tool execution
  executeTool(sessionId: string, tool: Tool, params: any): Promise<ToolResult>;

  // Context management
  getContext(sessionId: string): Promise<Context>;
  updateContext(sessionId: string, context: Partial<Context>): Promise<void>;
}
```

#### 2.5.2 IPlatformAdapter Interface

Abstraction for BYOAI multi-provider support:

```typescript
interface IPlatformAdapter {
  // Provider identification
  readonly providerId: string; // 'claude' | 'codex' | 'gemini' | 'openai' | 'deepseek'
  readonly capabilities: ProviderCapabilities;

  // Authentication
  validateCredentials(credentials: Credentials): Promise<boolean>;
  refreshCredentials(credentials: Credentials): Promise<Credentials>;

  // Request transformation
  transformRequest(request: UnifiedRequest): ProviderRequest;
  transformResponse(response: ProviderResponse): UnifiedResponse;

  // Streaming support
  supportsStreaming(): boolean;
  createStream(request: ProviderRequest): AsyncIterable<ProviderChunk>;
}
```

#### 2.5.3 Session Management Pattern

```typescript
interface SessionManager {
  // Create isolated session for user
  createSession(userId: string, agentType: string, moduleId: string): Promise<Session>;

  // Resume existing session (context preservation)
  resumeSession(sessionId: string): Promise<Session>;

  // Get active sessions for user
  getActiveSessions(userId: string): Promise<Session[]>;

  // Workspace isolation per session
  getWorkspacePath(sessionId: string): string;

  // Clean up completed sessions
  cleanupSession(sessionId: string): Promise<void>;
}

// Session storage schema
interface Session {
  id: string;                    // UUID
  userId: string;                // User who owns session
  moduleId: string;              // Which module (BMC, BMS, etc.)
  agentType: string;             // Which agent in the module
  assistantSessionId: string;    // Provider SDK session ID
  active: boolean;               // One active per conversation
  workspacePath: string;         // Isolated file workspace
  context: SessionContext;       // Conversation context
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2.5.4 Client Factory Pattern

```typescript
class AgentClientFactory {
  private adapters: Map<string, IPlatformAdapter>;
  private router: ModelRouter;

  createClient(
    userId: string,
    moduleId: string,
    agentType: string
  ): Promise<IAssistantClient> {
    // 1. Get user's model configuration
    const modelConfig = await this.getUserModelConfig(userId);

    // 2. Determine which provider to use for this agent
    const provider = this.router.route(agentType, modelConfig);

    // 3. Get user's credentials for that provider
    const credentials = await this.getUserCredentials(userId, provider);

    // 4. Get the appropriate adapter
    const adapter = this.adapters.get(provider);

    // 5. Create and return the client
    return new AssistantClient(adapter, credentials, {
      moduleId,
      agentType,
      userId
    });
  }
}
```

---

## 3. Meta Layer - Module Builder (BMB)

### 3.1 Purpose

The Meta Layer sits above all other modules and provides the infrastructure for creating and customizing modules themselves. This is powered by the **BMAD Builder** methodology.

### 3.2 Inspiration Sources

| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Taskosaur** | <https://github.com/Taskosaur/Taskosaur> | Conversational task execution, BYOAI model |
| BMAD Framework | Internal | Agent/workflow/task definition patterns |
| n8n | <https://n8n.io> | Workflow concepts (but NOT node-based UI) |
| Zapier | <https://zapier.com> | Trigger/action patterns |
| Retool | <https://retool.com> | Internal tool building |

### 3.3 Core Concept: Conversational Workflow Creation

Unlike traditional workflow builders (n8n, Zapier) that use node-based visual editors, the AI Business Hub uses **conversational workflow creation**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│              CONVERSATIONAL vs NODE-BASED WORKFLOW CREATION                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │     TRADITIONAL (n8n/Zapier)    │  │    AI BUSINESS HUB (Taskosaur)  │  │
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤  │
│  │                                 │  │                                 │  │
│  │  ┌───┐   ┌───┐   ┌───┐   ┌───┐│  │  User: "When a new lead comes   │  │
│  │  │ ○ │──▶│ ○ │──▶│ ○ │──▶│ ○ ││  │  in, score them, add to CRM,   │  │
│  │  └───┘   └───┘   └───┘   └───┘│  │  and start an email sequence"  │  │
│  │  Trigger Action Action Output │  │                                 │  │
│  │                                 │  │  AI: "I'll create that workflow│  │
│  │  • Drag & drop nodes           │  │  with 4 steps..."              │  │
│  │  • Manual connections          │  │                                 │  │
│  │  • Complex for non-technical   │  │  • Natural language input      │  │
│  │  • Hard to modify              │  │  • AI generates workflow       │  │
│  │                                 │  │  • Easy to modify via chat    │  │
│  │                                 │  │  • Accessible to everyone      │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 BMAD Builder Integration

The Meta Layer uses BMAD Builder to create:

| Component | Description | Example |
|-----------|-------------|---------|
| **Agents** | AI personas with specific roles | `BM-CRM-LeadScorerAgent` |
| **Workflows** | Multi-step processes | `lead-capture-to-nurture` |
| **Tasks** | Atomic operations | `score-lead`, `add-to-crm` |
| **Checklists** | Validation criteria | `lead-data-quality-check` |

### 3.5 Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Workflow Architect** | Design | Translate natural language to workflow specs |
| **Agent Designer** | Creation | Define agent personas and capabilities |
| **Integration Specialist** | Connections | Map triggers and actions across modules |
| **Validator** | Quality | Test and validate created workflows |
| **Deployment Agent** | Publishing | Deploy workflows to production |

### 3.6 Workflows

1. `create-workflow-from-description` - Natural language to workflow definition
2. `modify-existing-workflow` - Edit workflows conversationally
3. `create-new-agent` - Define new agent with persona and tools
4. `test-workflow` - Execute workflow in sandbox
5. `deploy-workflow` - Push to production with rollback support

---

## 4. Foundation Modules

### 4.1 BMV - Business Validation Module

**Purpose**: Validate business ideas before investment

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Gartner Research | https://www.gartner.com | Market sizing methodologies |
| CB Insights | https://www.cbinsights.com | Startup failure patterns |
| Statista | https://www.statista.com | Market data APIs |
| SimilarWeb | https://www.similarweb.com | Traffic/competitor analysis |
| SparkToro | https://sparktoro.com | Audience research |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Market Researcher** | TAM/SAM/SOM Analysis | Calculate market sizes, identify trends, assess opportunity |
| **Competitor Analyst** | Competitive Intelligence | Map competitors, analyze positioning, identify gaps |
| **Customer Profiler** | ICP Development | Build ideal customer profiles, validate assumptions |
| **Feasibility Assessor** | Risk Analysis | Evaluate technical/financial/market risks |
| **Validation Orchestrator** | Team Lead | Coordinate validation process, synthesize findings |

#### Workflows
1. `idea-intake` - Capture and structure business idea
2. `market-sizing` - Calculate TAM/SAM/SOM
3. `competitor-mapping` - Deep competitive analysis
4. `customer-discovery` - ICP and persona development
5. `validation-synthesis` - Final go/no-go recommendation

---

### 4.2 BMP - Business Planning Module

**Purpose**: Create comprehensive business plans and financial models

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| LivePlan | https://www.liveplan.com | Business plan templates |
| Strategyzer | https://www.strategyzer.com | Business Model Canvas tool |
| Lean Canvas | https://leanstack.com | Lean startup methodology |
| Financial Modeling Prep | https://financialmodelingprep.com | Financial APIs |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Business Model Architect** | Canvas Design | Build business model canvas, value propositions |
| **Financial Modeler** | Projections | Revenue models, cash flow, break-even analysis |
| **Go-to-Market Strategist** | GTM Planning | Pricing strategy, launch planning, channel strategy |
| **Operations Planner** | Ops Design | Operational workflows, resource planning |
| **Plan Compiler** | Document Assembly | Synthesize into investor-ready documents |

#### Workflows
1. `business-model-canvas` - Interactive BMC creation
2. `financial-projections` - 3-5 year financial models
3. `gtm-strategy` - Go-to-market planning
4. `pitch-deck-generation` - Investor presentation creation
5. `plan-iteration` - Refine based on feedback

---

### 4.3 BMB - Brand Building Module

**Purpose**: Create complete brand identity and guidelines

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Looka | https://looka.com | AI logo generation |
| Brandmark | https://brandmark.io | Brand identity AI |
| Coolors | https://coolors.co | Color palette generation |
| Fontjoy | https://fontjoy.com | Font pairing AI |
| Namelix | https://namelix.com | Business name generator |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Brand Strategist** | Brand Positioning | Define brand essence, positioning, differentiation |
| **Visual Identity Designer** | Logo & Colors | Generate logos, palettes, typography systems |
| **Voice & Tone Developer** | Brand Voice | Create messaging guidelines, tone documentation |
| **Asset Generator** | Brand Collateral | Generate templates, social assets, mockups |
| **Guidelines Compiler** | Documentation | Compile brand book and style guides |

#### Workflows
1. `brand-discovery` - Brand essence exploration
2. `visual-identity` - Logo, colors, typography creation
3. `voice-development` - Tone and messaging guidelines
4. `asset-generation` - Brand asset creation
5. `brand-book-assembly` - Complete guidelines document

---

### 4.4 BMI - Business Intelligence Module

**Purpose**: Continuous market monitoring and trend analysis

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Crayon | https://www.crayon.co | Competitive intelligence |
| Klue | https://klue.com | Win/loss analysis |
| Semrush | https://www.semrush.com | SEO competitive data |
| Google Trends | https://trends.google.com | Trend tracking |
| Feedly | https://feedly.com | News aggregation |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Trend Scanner** | Market Monitoring | Track industry trends, emerging patterns |
| **Competitor Watchdog** | Competitive Updates | Monitor competitor activities, changes |
| **News Curator** | Industry News | Aggregate relevant news, filter signal from noise |
| **Insight Synthesizer** | Analysis | Connect dots, identify opportunities/threats |
| **Alert Manager** | Notifications | Trigger alerts for significant changes |

#### Workflows
1. `hourly-scan` - Quick trend/news scan
2. `competitor-update` - Weekly competitor analysis
3. `market-report` - Monthly market intelligence report
4. `opportunity-alert` - Real-time opportunity detection
5. `threat-assessment` - Risk and threat evaluation

---

## 5. Product Creation Modules

### 5.1 BME-Course - Online Course Module

**Purpose**: Create complete online courses with curriculum and content

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Teachable | https://teachable.com | Course structure |
| Thinkific | https://www.thinkific.com | Course builder UX |
| Kajabi | https://kajabi.com | All-in-one platform |
| Coursera | https://www.coursera.org | Curriculum design patterns |
| Synthesia | https://www.synthesia.io | AI video lectures |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Curriculum Designer** | Course Structure | Design learning paths, module breakdowns |
| **Lesson Writer** | Content Creation | Write lesson content, scripts |
| **Quiz Creator** | Assessments | Generate quizzes, assignments |
| **Video Script Writer** | Video Content | Write scripts for video lessons |
| **Resource Compiler** | Supplementary Materials | Create workbooks, cheat sheets |

#### Workflows
1. `curriculum-design` - Full course outline creation
2. `lesson-generation` - Individual lesson content
3. `assessment-creation` - Quizzes and tests
4. `video-scripting` - Lecture video scripts
5. `course-assembly` - Final course packaging

---

### 5.2 BME-Podcast - Podcast Module

**Purpose**: Plan and produce podcast series

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Riverside.fm | https://riverside.fm | Recording platform |
| Descript | https://www.descript.com | AI editing, transcription |
| Podcastle | https://podcastle.ai | AI-powered podcast tools |
| ElevenLabs | https://elevenlabs.io | Voice synthesis |
| Buzzsprout | https://www.buzzsprout.com | Distribution |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Show Planner** | Series Strategy | Define format, schedule, themes |
| **Episode Writer** | Script Creation | Write episode outlines, scripts |
| **Guest Researcher** | Guest Booking | Find and research potential guests |
| **Show Notes Creator** | Documentation | Generate show notes, timestamps |
| **Distribution Manager** | Publishing | Handle multi-platform publishing |

#### Workflows
1. `series-planning` - Podcast series strategy
2. `episode-scripting` - Individual episode scripts
3. `guest-research` - Guest identification and prep
4. `post-production` - Show notes, transcripts
5. `distribution` - Multi-platform publishing

---

### 5.3 BME-Book - Book/eBook Module

**Purpose**: Write and publish books and eBooks

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Sudowrite | https://www.sudowrite.com | AI writing assistant |
| ProWritingAid | https://prowritingaid.com | Editing AI |
| Reedsy | https://reedsy.com | Book creation platform |
| Draft2Digital | https://www.draft2digital.com | Self-publishing |
| Canva | https://www.canva.com | Book covers |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Book Architect** | Structure | Create book outline, chapter structure |
| **Chapter Writer** | Content Creation | Draft individual chapters |
| **Editor Agent** | Quality Control | Edit for clarity, consistency, style |
| **Cover Designer** | Visual Assets | Generate book cover concepts |
| **Publishing Agent** | Distribution | Handle formatting and publishing |

#### Workflows
1. `book-outlining` - Complete book structure
2. `chapter-drafting` - Individual chapter writing
3. `editing-revision` - Multi-pass editing
4. `cover-design` - Book cover creation
5. `publishing-prep` - Format for platforms

---

### 5.4 BME-YouTube - YouTube Channel Module

**Purpose**: Create and manage YouTube channel content

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| TubeBuddy | https://www.tubebuddy.com | Channel optimization |
| vidIQ | https://vidiq.com | YouTube analytics |
| Opus Clip | https://www.opus.pro | AI clip generation |
| Pictory | https://pictory.ai | Video from scripts |
| Canva | https://www.canva.com | Thumbnail design |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Channel Strategist** | Content Strategy | Plan content calendar, niche positioning |
| **Script Writer** | Video Scripts | Write engaging video scripts |
| **Thumbnail Designer** | Visual Hooks | Create click-worthy thumbnails |
| **SEO Optimizer** | Discoverability | Optimize titles, descriptions, tags |
| **Shorts Creator** | Short-form Content | Create clips from long-form |

#### Workflows
1. `channel-strategy` - YouTube strategy development
2. `video-scripting` - Full video scripts
3. `thumbnail-generation` - Thumbnail creation
4. `seo-optimization` - Video SEO optimization
5. `shorts-extraction` - Short-form clip creation

---

### 5.5 BME-App - Application Product Module (SaaS/Website/WebApp)

> **IMPORTANT**: This module IS the BMAD BMM (BMAD Method Module) with application-specific configuration. It is NOT a new creation - it leverages existing BMAD agents and workflows.

**Purpose**: Specify and plan software products, websites, and web applications

#### 5.5.1 BMAD BMM → BME-App Mapping

This module directly maps to existing BMAD BMM agents:

| BME-App Agent | BMAD BMM Agent | Agent File |
|---------------|----------------|------------|
| Product Specifier | analyst (Mary) | `.bmad/bmm/agents/analyst.md` |
| Architecture Designer | architect (Winston) | `.bmad/bmm/agents/architect.md` |
| UI/UX Specifier | ux-designer (Sally) | `.bmad/bmm/agents/ux-designer.md` |
| Developer | dev (Amelia) | `.bmad/bmm/agents/dev.md` |
| Scrum Master | sm (Bob) | `.bmad/bmm/agents/sm.md` |
| Test Architect | tea (Murat) | `.bmad/bmm/agents/tea.md` |
| Tech Writer | tech-writer (Paige) | `.bmad/bmm/agents/tech-writer.md` |
| Product Manager | pm (John) | `.bmad/bmm/agents/pm.md` |

#### 5.5.2 Application Type Configuration

Rather than separate modules, BME-App uses a `type` parameter:

```yaml
# BME-App Configuration
module: BME-App
type: saas | website | webapp | mobile-app

# Type-specific configurations
saas:
  requires_backend: true
  requires_authentication: true
  requires_billing: true
  deployment: cloud

website:
  requires_backend: false  # or minimal (CMS)
  requires_authentication: false  # optional
  requires_billing: false
  deployment: static | jamstack

webapp:
  requires_backend: true
  requires_authentication: true
  requires_billing: false
  deployment: cloud | edge
```

#### 5.5.3 BMAD BMM Workflows Already Available

These workflows from BMAD BMM are ready to use:

| BME-App Workflow | BMAD BMM Workflow | Path |
|------------------|-------------------|------|
| `prd-creation` | `prd` | `.bmad/bmm/workflows/prd/` |
| `architecture-design` | `architecture` | `.bmad/bmm/workflows/architecture/` |
| `ui-specification` | `create-ux-design` | `.bmad/bmm/workflows/create-ux-design/` |
| `epic-creation` | `create-epics-and-stories` | `.bmad/bmm/workflows/create-epics-and-stories/` |
| `story-development` | `dev-story` | `.bmad/bmm/workflows/dev-story/` |
| `tech-spec` | `tech-spec` | `.bmad/bmm/workflows/tech-spec/` |

#### Inspiration Sources (Additional)
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Linear | https://linear.app | Modern project management |
| Notion | https://www.notion.so | Documentation |
| Figma | https://www.figma.com | Design collaboration |
| Vercel | https://vercel.com | Deployment patterns |
| Supabase | https://supabase.com | Backend as a service |
| **Framer** | <https://www.framer.com> | AI website builder (for website type) |
| Webflow | <https://webflow.com> | Visual development (for website type) |

#### Type-Specific Agent Focus

| Type | Primary Agents | Secondary Agents |
|------|----------------|------------------|
| **SaaS** | architect, dev, tea | pm, analyst, ux-designer |
| **Website** | ux-designer, tech-writer | architect (minimal), dev |
| **WebApp** | architect, dev, ux-designer | pm, tea |

#### Workflows
1. `prd-creation` - Product requirements document (inherits from BMM)
2. `architecture-design` - Technical architecture (inherits from BMM)
3. `ui-specification` - Design specifications (inherits from BMM)
4. `api-design` - API contract definition
5. `mvp-scoping` - MVP feature prioritization
6. `site-planning` - Information architecture (website type)
7. `landing-page-builder` - High-conversion pages (website type)

---

### 5.6 BME-Website (Alias)

> **Note**: BME-Website is an **alias** for `BME-App` with `type: website`. It is NOT a separate module.

For convenience, users can reference BME-Website, which automatically configures:

```yaml
# BME-Website is equivalent to:
module: BME-App
type: website
config:
  requires_backend: false
  primary_agents: [ux-designer, tech-writer, content-writer]
  workflows: [site-planning, page-creation, landing-page-builder]
```

#### Website-Specific Inspiration Sources

| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Framer** | <https://www.framer.com> | AI website builder |
| Webflow | <https://webflow.com> | Visual development |
| Wix Studio | <https://www.wix.com/studio> | AI design tools |
| Squarespace | <https://www.squarespace.com> | Template system |
| Builder.io | <https://www.builder.io> | Headless visual CMS |

#### Website-Specific Workflows

1. `site-planning` - Define structure and information architecture
2. `page-creation` - Individual page content and design
3. `landing-page-builder` - High-conversion landing pages
4. `portfolio-generator` - Portfolio/showcase sites
5. `site-optimization` - Performance and SEO optimization

---

## 6. Operations Modules

### 6.1 BMC - Content Creation Module

**Purpose**: Create all types of marketing content

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Jasper | https://www.jasper.ai | AI content generation |
| Copy.ai | https://www.copy.ai | Marketing copy AI |
| Writesonic | https://writesonic.com | Multi-format content |
| Grammarly | https://www.grammarly.com | Writing quality |
| Hemingway | https://hemingwayapp.com | Readability |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Content Strategist** | Planning | Content calendar, topic clusters |
| **Blog Writer** | Long-form | Write SEO blog posts, articles |
| **Copywriter** | Short-form | Ad copy, email copy, landing pages |
| **Content Editor** | Quality | Edit and polish all content |
| **Repurposing Agent** | Multi-format | Transform content across formats |

#### Workflows
1. `content-calendar` - Monthly content planning
2. `blog-creation` - Full blog post workflow
3. `copy-generation` - Marketing copy creation
4. `content-editing` - Review and polish
5. `repurposing` - Multi-format adaptation

---

### 6.2 BMC-Video - AI Video Creation Module

**Purpose**: Create AI-generated marketing videos

#### Inspiration Sources (from your list!)
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **AdCreative.ai** | https://www.adcreative.ai | Ad creative generation |
| **Google Pomelli** | https://labs.google.com/pomelli/about/ | Google's creative AI |
| **Google Flow** | https://labs.google/flow/about | Multi-modal creation |
| **TryHolo.ai** | https://tryholo.ai/ | AI video avatars |
| **Quickads.ai** | https://quickads.ai | Quick ad generation |
| **Arcads.ai** | https://www.arcads.ai/ | UGC-style AI ads |
| **Creatify** | https://creatify.ai/ | Product video AI |
| **Hera.video** | https://hera.video/ | AI video creation |
| **Synthesia** | https://www.synthesia.io | AI avatars |
| **HeyGen** | https://www.heygen.com | AI spokesperson videos |

#### AI Tools Integration
| Tool | Provider | Use Case |
|------|----------|----------|
| **VEO3** | Google/Kie.ai | Text-to-video generation |
| **Sora** | OpenAI/fal.ai | Image-to-video, text-to-video |
| **NanoBanana** | fal.ai | Image editing/enhancement |
| **Seedream** | fal.ai | Image generation |
| **ElevenLabs** | ElevenLabs | Voice synthesis |
| **D-ID** | D-ID | Talking avatars |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Video Strategist** | Planning | Video content strategy, formats |
| **Script Writer** | Scripts | Write video scripts, hooks |
| **Visual Director** | Storyboarding | Plan shots, scenes, visuals |
| **AI Generator** | Production | Orchestrate AI video tools |
| **Caption Writer** | Captions | Write captions, hashtags |
| **Publisher** | Distribution | Multi-platform publishing |

#### Workflows (inspired by n8n templates)
1. `ugc-video-generation` - UGC-style promotional videos
   - Input: Product image + description
   - Steps: Image analysis → Script generation → Image enhancement → Video generation → Caption → Publish

2. `product-ad-creation` - Product advertisement videos
   - Input: Product details + brand guidelines
   - Steps: Ad concept → Storyboard → AI generation → Review → Publish

3. `talking-head-video` - AI spokesperson videos
   - Input: Script + avatar selection
   - Steps: Script polish → Avatar generation → Voice synthesis → Assembly

4. `viral-short-creation` - Short-form viral content
   - Input: Topic + hook
   - Steps: Hook writing → Scene planning → AI generation → Caption → Schedule

5. `video-repurposing` - Long to short conversion
   - Input: Long-form video URL
   - Steps: Transcription → Highlight detection → Clip extraction → Optimization

---

### 6.3 BM-Social - Social Media Management Module

**Purpose**: Manage social media presence across platforms

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Postiz** | https://github.com/gitroomhq/postiz-app | Open-source social scheduler |
| Buffer | https://buffer.com | Simple scheduling |
| Hootsuite | https://www.hootsuite.com | Enterprise social |
| Later | https://later.com | Visual planning |
| Blotato | https://blotato.com | Multi-platform publishing API |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Social Strategist** | Planning | Platform strategy, content mix |
| **Post Creator** | Content | Write platform-specific posts |
| **Engagement Agent** | Community | Monitor and respond to engagement |
| **Analytics Agent** | Performance | Track metrics, optimize timing |
| **Scheduler** | Publishing | Optimal timing, cross-posting |

#### Workflows
1. `social-calendar` - Weekly/monthly social planning
2. `post-creation` - Platform-specific post creation
3. `engagement-monitoring` - Comment/DM management
4. `analytics-reporting` - Performance analysis
5. `trend-surfing` - Trending topic content

---

### 6.4 BM-SEO - Search Engine Optimization Module

**Purpose**: Optimize content and website for search engines

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Ahrefs | https://ahrefs.com | Backlink analysis |
| Semrush | https://www.semrush.com | Keyword research |
| Surfer SEO | https://surferseo.com | Content optimization |
| Clearscope | https://www.clearscope.io | Content grading |
| Screaming Frog | https://www.screamingfrog.co.uk | Technical SEO |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Keyword Researcher** | Opportunity Finding | Find high-value keywords |
| **Content Optimizer** | On-page SEO | Optimize existing content |
| **Technical Auditor** | Site Health | Identify technical issues |
| **Link Strategist** | Authority Building | Backlink opportunities |
| **SERP Analyst** | Competition | Analyze search results |

#### Workflows
1. `keyword-research` - Comprehensive keyword analysis
2. `content-optimization` - On-page SEO improvements
3. `technical-audit` - Site health check
4. `backlink-prospecting` - Link building opportunities
5. `rank-tracking` - Position monitoring

---

### 6.5 BM-Ads - Paid Advertising Module

**Purpose**: Create and manage paid advertising campaigns

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| AdEspresso | https://adespresso.com | Ad management |
| Revealbot | https://revealbot.com | Ad automation |
| Madgicx | https://madgicx.com | AI ad optimization |
| AdCreative.ai | https://www.adcreative.ai | Creative generation |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Campaign Strategist** | Planning | Campaign structure, budgets |
| **Ad Creative Agent** | Content | Generate ad creatives, copy |
| **Audience Builder** | Targeting | Build audience segments |
| **Bid Optimizer** | Performance | Optimize bids, budgets |
| **Analytics Agent** | Reporting | Track ROAS, conversions |

#### Workflows
1. `campaign-creation` - New campaign setup
2. `creative-generation` - Ad creative production
3. `audience-building` - Targeting strategy
4. `performance-optimization` - Campaign optimization
5. `reporting` - Performance dashboards

---

### 6.6 BMX - Email Marketing & Automation Module

**Purpose**: Email marketing campaigns and automation

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Mautic** | https://github.com/mautic/mautic | Open-source marketing automation |
| Mailchimp | https://mailchimp.com | Email marketing |
| ConvertKit | https://convertkit.com | Creator email |
| ActiveCampaign | https://www.activecampaign.com | Automation |
| Beehiiv | https://www.beehiiv.com | Newsletter platform |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Email Strategist** | Campaign Planning | Email strategy, sequences |
| **Email Writer** | Content | Write email copy |
| **Automation Builder** | Workflows | Design automation flows |
| **List Manager** | Segmentation | Segment and clean lists |
| **Deliverability Agent** | Technical | Monitor deliverability |

#### Workflows
1. `campaign-creation` - Email campaign design
2. `sequence-building` - Automation sequence creation
3. `list-segmentation` - Audience segmentation
4. `a-b-testing` - Email testing workflows
5. `deliverability-monitoring` - Health checks

---

### 6.7 BM-Support - Customer Support Module

**Purpose**: Unified inbox and AI-powered customer support

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Chatwoot** | https://github.com/chatwoot/chatwoot | Open-source support platform |
| Intercom | https://www.intercom.com | Conversational support |
| Zendesk | https://www.zendesk.com | Ticketing system |
| Crisp | https://crisp.chat | Live chat |
| Help Scout | https://www.helpscout.com | Shared inbox |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Triage Agent** | Classification | Categorize and route inquiries |
| **Response Agent** | Replies | Draft helpful responses |
| **Knowledge Base Agent** | Documentation | Build and update help docs |
| **Escalation Agent** | Complex Issues | Handle edge cases |
| **Feedback Collector** | Insights | Gather and analyze feedback |

#### Workflows
1. `inquiry-triage` - Classify and route support requests
2. `auto-response` - AI-powered responses
3. `knowledge-base-update` - Documentation maintenance
4. `escalation-handling` - Complex issue workflow
5. `feedback-analysis` - Customer feedback insights

---

### 6.8 BMT - Analytics & Tracking Module

**Purpose**: Track and analyze business performance

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Matomo** | https://github.com/matomo-org/matomo | Open-source analytics |
| Mixpanel | https://mixpanel.com | Product analytics |
| Amplitude | https://amplitude.com | Behavioral analytics |
| Plausible | https://plausible.io | Privacy-friendly analytics |
| PostHog | https://posthog.com | Product analytics |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Data Collector** | Tracking | Ensure proper data collection |
| **Metric Analyst** | Analysis | Analyze key metrics |
| **Report Generator** | Reporting | Create automated reports |
| **Insight Finder** | Patterns | Identify trends and anomalies |
| **Recommendation Agent** | Actions | Suggest optimization actions |

#### Workflows
1. `dashboard-creation` - Custom dashboard setup
2. `daily-metrics` - Daily performance summary
3. `weekly-report` - Comprehensive weekly analysis
4. `anomaly-detection` - Alert on unusual patterns
5. `optimization-recommendations` - Data-driven suggestions

---

### 6.9 BMS - Sales Module

**Purpose**: Sales automation and pipeline management

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| Salesforce | https://www.salesforce.com | Enterprise sales |
| Close | https://close.com | Inside sales CRM |
| Apollo | https://www.apollo.io | Sales intelligence |
| Gong | https://www.gong.io | Conversation intelligence |
| Lemlist | https://lemlist.com | Cold outreach |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Prospecting Agent** | Lead Generation | Find and qualify prospects |
| **Outreach Agent** | Communication | Personalized cold outreach |
| **Demo Scheduler** | Booking | Schedule and prep demos |
| **Proposal Writer** | Documents | Generate proposals, quotes |
| **Close Coach** | Negotiation | Suggest closing strategies |

#### Workflows
1. `prospect-research` - Lead identification
2. `outreach-campaign` - Cold email sequences
3. `demo-preparation` - Demo prep and follow-up
4. `proposal-generation` - Custom proposal creation
5. `deal-closing` - Negotiation support

---

### 6.10 BM-CMS - Content Management System Module

**Purpose**: Manage website content, blogs, and landing pages

#### Inspiration Sources
| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Payload CMS** | https://payloadcms.com | Modern headless CMS |
| **Strapi** | https://strapi.io | Open-source headless CMS |
| Sanity | https://www.sanity.io | Real-time collaboration |
| Contentful | https://www.contentful.com | API-first CMS |
| Ghost | https://ghost.org | Publishing platform |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Content Manager** | Organization | Organize and structure content |
| **SEO Content Agent** | Optimization | Optimize for search |
| **Blog Publisher** | Publishing | Schedule and publish posts |
| **Landing Page Builder** | Conversion | Create landing pages |
| **Asset Manager** | Media | Manage images, videos, files |

#### Workflows
1. `content-planning` - Editorial calendar
2. `blog-publishing` - Blog post workflow
3. `landing-page-creation` - Conversion page design
4. `content-update` - Content refresh workflow
5. `asset-optimization` - Media optimization

---

### 6.11 BM-CRM - Customer Relationship Management Module

**Purpose**: Manage customer relationships, pipeline, and interactions

> **Note**: CRM is in Operations Layer as it runs continuously during the OPERATE phase, working closely with Sales and Support modules.

#### Inspiration Sources

| Source | URL | Key Features to Study |
|--------|-----|----------------------|
| **Twenty** | <https://github.com/twentyhq/twenty> | Modern open-source CRM, GraphQL, workspace model |
| HubSpot | <https://www.hubspot.com> | Free CRM features |
| Pipedrive | <https://www.pipedrive.com> | Visual pipeline |
| Folk | <https://www.folk.app> | Lightweight CRM |
| Attio | <https://attio.com> | Modern data model |

#### Agent Team

| Agent | Role | Primary Tasks |
|-------|------|---------------|
| **Lead Scorer** | Lead Qualification | Score and prioritize leads based on behavior |
| **Outreach Agent** | Communication | Draft personalized outreach sequences |
| **Pipeline Coach** | Deal Management | Suggest next best actions for deals |
| **Relationship Manager** | Contact Intelligence | Track interactions, suggest touchpoints |
| **CRM Orchestrator** | Data Hygiene | Keep data clean, enrich records |

#### Workflows

1. `lead-capture` - Auto-capture and enrich leads
2. `lead-scoring` - AI-powered lead qualification
3. `outreach-sequencing` - Personalized email sequences
4. `pipeline-optimization` - Deal stage recommendations
5. `customer-360` - Complete customer view assembly

#### CRM + Sales Relationship

The CRM module is the **data backbone** while Sales module handles **active selling**:

| CRM (BM-CRM) | Sales (BMS) |
|--------------|-------------|
| Lead database & scoring | Active prospecting |
| Contact history | Outreach execution |
| Pipeline visualization | Deal negotiation |
| Data enrichment | Proposal generation |
| Relationship tracking | Close coaching |

Both modules share the same contact database but serve different functions.

---

## 7. Conversational Workflow Builder

### 7.1 Core Philosophy

The AI Business Hub rejects traditional node-based workflow builders in favor of **conversational workflow creation**. This is directly inspired by **Taskosaur** - enabling users to create complex automations through natural language conversation.

### 7.2 Key Inspiration: Taskosaur

| Feature | Description | Application in Hub |
|---------|-------------|-------------------|
| **Conversational Task Execution** | Execute tasks through natural language | All module workflows |
| **BYOAI Model** | Users bring their own AI (Claude tokens, OpenAI keys) | Multi-provider support |
| **Task Templates** | Reusable task definitions | BMAD workflow templates |
| **Context Awareness** | Maintains context across tasks | Session management |

Repository: <https://github.com/Taskosaur/Taskosaur>

### 7.3 How It Works

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONVERSATIONAL WORKFLOW CREATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER DESCRIBES INTENT                                                   │
│     "Every time someone fills out my contact form, I want to:               │
│      - Score the lead                                                       │
│      - Add them to my CRM                                                   │
│      - Send them a welcome email                                            │
│      - If they're high-value, notify me on Slack"                          │
│                                                                              │
│  2. AI INTERPRETS & CLARIFIES                                              │
│     "I'll create a workflow with 4 steps. A few questions:                 │
│      - What scoring criteria should I use?                                  │
│      - Which CRM fields should I populate?                                  │
│      - Should the welcome email be immediate or delayed?"                   │
│                                                                              │
│  3. AI GENERATES WORKFLOW SPEC (BMAD Format)                               │
│     ```yaml                                                                 │
│     workflow: lead-capture-to-nurture                                       │
│     trigger: form_submission                                                │
│     steps:                                                                  │
│       - task: score-lead                                                    │
│         agent: BM-CRM-LeadScorerAgent                                       │
│       - task: add-to-crm                                                    │
│         agent: BM-CRM-OrchestatorAgent                                      │
│       - task: send-welcome-email                                            │
│         agent: BMX-EmailWriterAgent                                         │
│       - task: notify-high-value                                             │
│         condition: lead_score > 80                                          │
│         agent: NotificationAgent                                            │
│     ```                                                                     │
│                                                                              │
│  4. USER REVIEWS & MODIFIES                                                │
│     "Actually, can you also add them to my nurture sequence?"              │
│                                                                              │
│  5. AI UPDATES & DEPLOYS                                                   │
│     "Done! I've added a step to enroll them in the 7-day nurture           │
│      sequence. The workflow is now active."                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 User Journey for Workflow Discovery & Management

> **Critical**: The conversational approach must address how users discover, debug, and manage workflows.

#### 7.4.1 Workflow Discovery Journey

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW DISCOVERY USER JOURNEY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ENTRY POINTS                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Natural Language: "I want to automate..."                        │   │
│  │  2. Template Gallery: Browse pre-built workflows                     │   │
│  │  3. Module Suggestions: "Recommended for your business"              │   │
│  │  4. Event-Triggered: "When X happens, what should I do?"            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  CAPABILITY DISCOVERY                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI: "Based on your installed modules, you can automate:"            │   │
│  │                                                                       │   │
│  │  📊 CRM & Sales:                                                      │   │
│  │     • Lead scoring and routing                                        │   │
│  │     • Follow-up sequences                                             │   │
│  │     • Deal stage automation                                           │   │
│  │                                                                       │   │
│  │  📝 Content & Marketing:                                              │   │
│  │     • Content calendar automation                                     │   │
│  │     • Social media posting                                            │   │
│  │     • Email nurture sequences                                         │   │
│  │                                                                       │   │
│  │  [Show me examples] [I have a specific idea] [Browse templates]      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.4.2 Handling AI Misinterpretation

When the AI misunderstands user intent, the system provides structured recovery:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MISINTERPRETATION RECOVERY FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User: "Send an email when someone signs up"                                │
│                                                                              │
│  AI Interpretation (shown to user):                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  📋 I understood:                                                     │   │
│  │  • Trigger: New user registration                                    │   │
│  │  • Action: Send welcome email                                         │   │
│  │  • Template: Default welcome                                          │   │
│  │                                                                       │   │
│  │  ⚠️  Assumptions I made:                                              │   │
│  │  • "signs up" = website registration (not newsletter signup)         │   │
│  │  • "email" = from BMX module (not personal email)                    │   │
│  │  • Immediate send (no delay)                                          │   │
│  │                                                                       │   │
│  │  [✓ Correct] [✏️ Adjust] [🔄 Start Over]                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  IF USER CLICKS "Adjust":                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI: "What would you like to change?"                                │   │
│  │                                                                       │   │
│  │  • [Change trigger] - "Actually, I meant newsletter signup"          │   │
│  │  • [Change action] - "I want to add them to a sequence first"        │   │
│  │  • [Add conditions] - "Only for premium signups"                     │   │
│  │  • [Describe in full] - Re-explain what you want                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.4.3 Workflow Debugging Interface

When a workflow isn't working as expected:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW DEBUGGING INTERFACE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Workflow: "Lead Capture to Nurture"                    Status: ⚠️ Issues   │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  EXECUTION TIMELINE (Last 24 hours)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ✅ 10:30 AM - Trigger: Form submitted (John Doe)                    │   │
│  │  ✅ 10:30 AM - Step 1: Lead scored (Score: 75)                       │   │
│  │  ✅ 10:30 AM - Step 2: Added to CRM                                  │   │
│  │  ❌ 10:30 AM - Step 3: Email failed                                  │   │
│  │     └── Error: Template "welcome-v2" not found                       │   │
│  │  ⏭️ 10:30 AM - Step 4: Skipped (depends on Step 3)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  AI DIAGNOSIS:                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  🔍 The workflow references template "welcome-v2" which doesn't      │   │
│  │     exist. You have these templates available:                        │   │
│  │     • welcome-sequence (created Nov 15)                              │   │
│  │     • welcome-newsletter (created Nov 10)                            │   │
│  │                                                                       │   │
│  │  Suggested fixes:                                                     │   │
│  │  1. [Use "welcome-sequence" instead]                                 │   │
│  │  2. [Create new "welcome-v2" template]                               │   │
│  │  3. [Show me how to fix this manually]                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  CONVERSATIONAL DEBUG:                                                       │
│  User: "Why didn't John Doe get the email?"                                 │
│  AI: "The email step failed because the template 'welcome-v2' doesn't      │
│       exist. John was added to the CRM but never received the welcome       │
│       email. Would you like me to: 1) Resend with a working template,      │
│       2) Fix the workflow for future leads?"                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 7.4.4 Workflow Management Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  My Workflows                                        [+ Create New]          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ACTIVE WORKFLOWS                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Lead Capture to Nurture          ✅ Active    Runs: 156 (24h)      │   │
│  │  "When form submitted → score → CRM → email"                         │   │
│  │  [Edit] [Pause] [View History] [Duplicate]                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Weekly Content Publishing        ✅ Active    Runs: 7 (7d)         │   │
│  │  "Every Monday → generate → review → publish"                        │   │
│  │  [Edit] [Pause] [View History] [Duplicate]                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  High-Value Lead Alert            ⚠️ Issues   Runs: 3 (24h)         │   │
│  │  "When score > 90 → notify Slack"     1 failed                       │   │
│  │  [Debug] [Edit] [Pause] [View History]                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  PAUSED WORKFLOWS                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Old Welcome Sequence             ⏸️ Paused    Last run: Nov 10      │   │
│  │  [Resume] [Delete] [View History]                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  WORKFLOW TEMPLATES                                                          │
│  [Browse 50+ pre-built workflows for your modules...]                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Benefits Over Node-Based Builders

| Traditional (n8n/Zapier) | Conversational (AI Business Hub) |
|--------------------------|----------------------------------|
| Steep learning curve | Natural language - no learning curve |
| Manual node configuration | AI infers configuration |
| Hard to modify complex flows | "Change X to Y" conversation |
| Limited to available nodes | AI can orchestrate any capability |
| Static workflows | Adaptive workflows with AI judgment |

### 7.5 Integration with BMAD Builder

The Conversational Workflow Builder uses BMAD Builder patterns under the hood:

1. **User Intent** → AI interprets the goal
2. **Task Decomposition** → Breaks into BMAD tasks
3. **Agent Assignment** → Maps tasks to appropriate agents
4. **Workflow Generation** → Creates BMAD workflow YAML
5. **Validation** → Tests workflow in sandbox
6. **Deployment** → Activates in production

---

## 8. Inter-Module Flow Diagram

### 8.1 Complete System Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LIFECYCLE FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║                        BUILD PHASE (Sequential)                        ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────────┐ │
│  │   BMV    │───▶│   BMP    │───▶│   BMB    │───▶│    BME-* Modules    │ │
│  │Validation│    │ Planning │    │ Branding │    │  (Product Creation)  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────────┘ │
│       │              │              │                      │               │
│       │              │              │                      │               │
│       ▼              ▼              ▼                      ▼               │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED CONTEXT DATABASE                          │   │
│  │  • Business Model      • Brand Guidelines    • Product Assets      │   │
│  │  • Market Research     • Customer Profiles   • Content Library     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ╔═══════════════════════════════════════════════════════════════════════╗ │
│  ║                     OPERATE PHASE (Parallel/Continuous)                ║ │
│  ╚═══════════════════════════════════════════════════════════════════════╝ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INTELLIGENCE LOOP (Hourly)                    │   │
│  │  ┌─────────┐                                         ┌─────────┐    │   │
│  │  │   BMI   │──────▶ Trends/Competitors ──────▶     │ BM-CRM  │    │   │
│  │  │  Intel  │         Updates                        │  Lead   │    │   │
│  │  └─────────┘                                         │ Scoring │    │   │
│  │                                                      └─────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CONTENT LOOP (Daily)                          │   │
│  │  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌─────────┐            │   │
│  │  │   BMC   │──▶│BMC-Video │──▶│BM-Social│──▶│  BM-CMS │            │   │
│  │  │ Content │   │  Video   │   │ Social  │   │   Blog  │            │   │
│  │  └─────────┘   └──────────┘   └─────────┘   └─────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       MARKETING LOOP (Weekly)                        │   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐                           │   │
│  │  │ BM-SEO  │──▶│ BM-Ads  │──▶│   BMX   │                           │   │
│  │  │  SEO    │   │   Ads   │   │  Email  │                           │   │
│  │  └─────────┘   └─────────┘   └─────────┘                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       CUSTOMER LOOP (Real-time)                      │   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐            │   │
│  │  │ BM-CRM  │──▶│BM-Support│──▶│   BMS   │──▶│   BMT   │            │   │
│  │  │Pipeline │   │ Support │   │  Sales  │   │Analytics│            │   │
│  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Cross-Module Event Flows

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT-DRIVEN CONNECTIONS                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Content Created (BMC)                                                       │
│  ├──▶ BM-Social: Schedule social posts                                      │
│  ├──▶ BMC-Video: Generate video variant                                     │
│  ├──▶ BM-SEO: Optimize for search                                           │
│  ├──▶ BMX: Add to email nurture sequence                                    │
│  └──▶ BM-CMS: Publish to website                                            │
│                                                                              │
│  Lead Captured (BM-CRM)                                                      │
│  ├──▶ BMI: Research company/contact                                         │
│  ├──▶ BMX: Start nurture sequence                                           │
│  ├──▶ BMS: Queue for outreach                                               │
│  └──▶ BMC: Generate personalized content                                    │
│                                                                              │
│  Video Generated (BMC-Video)                                                 │
│  ├──▶ BM-Social: Post to TikTok, Instagram, YouTube                         │
│  ├──▶ BM-Ads: Use as ad creative                                            │
│  ├──▶ BM-CMS: Embed on website                                              │
│  └──▶ BMX: Include in email campaigns                                       │
│                                                                              │
│  Deal Closed (BMS)                                                           │
│  ├──▶ BM-Support: Onboard new customer                                      │
│  ├──▶ BMC: Create case study content                                        │
│  ├──▶ BM-Social: Celebrate with social proof                                │
│  └──▶ BMT: Log revenue attribution                                          │
│                                                                              │
│  Trend Detected (BMI)                                                        │
│  ├──▶ BMC: Create trending content                                          │
│  ├──▶ BMC-Video: Generate trend-based videos                                │
│  ├──▶ BM-SEO: Update keyword targets                                        │
│  └──▶ BM-Ads: Adjust ad targeting                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. AI Tools & Integrations

### 9.1 Content Generation Tools

| Tool | Type | Use Cases | API/Integration |
|------|------|-----------|-----------------|
| GPT-4o/GPT-4o-mini | LLM | Scripts, copy, analysis | OpenAI API |
| Claude | LLM | Strategy, long-form, code | Anthropic API |
| Gemini | LLM | Research, multimodal | Google AI API |
| DeepSeek | LLM | Cost-optimized tasks | DeepSeek API |

### 9.2 Image Generation Tools

| Tool | Type | Use Cases | API/Integration |
|------|------|-----------|-----------------|
| NanoBanana | Image Edit | Product image enhancement | fal.ai |
| DALL-E 3 | Image Gen | Marketing images | OpenAI API |
| Midjourney | Image Gen | Creative visuals | Via Discord/API |
| Seedream | Image Gen | Product images | fal.ai |

### 9.3 Video Generation Tools

| Tool | Type | Use Cases | API/Integration |
|------|------|-----------|-----------------|
| VEO3 | Text-to-Video | Marketing videos | kie.ai API |
| Sora 2 | Image-to-Video | Product promos | fal.ai |
| HeyGen | AI Avatar | Spokesperson videos | HeyGen API |
| Synthesia | AI Avatar | Training videos | Synthesia API |
| D-ID | Talking Head | Short-form content | D-ID API |

### 9.4 Voice & Audio Tools

| Tool | Type | Use Cases | API/Integration |
|------|------|-----------|-----------------|
| ElevenLabs | TTS | Voiceovers, narration | ElevenLabs API |
| Whisper | STT | Transcription | OpenAI API |
| Descript | Editing | Audio/video editing | Descript API |

### 9.5 Publishing & Distribution

| Tool | Type | Use Cases | API/Integration |
|------|------|-----------|-----------------|
| Blotato | Social Publishing | Multi-platform posts | Blotato API |
| Buffer | Scheduling | Social scheduling | Buffer API |
| Mailchimp | Email | Email campaigns | Mailchimp API |
| Mautic | Marketing Automation | Full automation | Self-hosted |

---

## 10. Research Priorities

### 10.1 Phase 1 - Core Infrastructure (Highest Priority)

| Priority | Module | Research Focus | Key Questions |
|----------|--------|----------------|---------------|
| 1 | BM-CRM | Twenty codebase | How does their record system work? GraphQL schema? |
| 2 | BMC-Video | Video AI integrations | Best API wrappers for VEO3/Sora? |
| 3 | BM-Social | Postiz architecture | How to replicate scheduling? |
| 4 | Core | Event bus design | Redis Streams vs BullMQ for events? |

### 10.2 Phase 2 - Content Engine (High Priority)

| Priority | Module | Research Focus | Key Questions |
|----------|--------|----------------|---------------|
| 1 | BMC | Content generation patterns | Best prompting strategies? |
| 2 | BM-CMS | Payload vs Strapi | Which CMS fits our architecture? |
| 3 | BM-SEO | SEO tool integrations | APIs for keyword research? |
| 4 | BM-Ads | Ad platform APIs | Google/Meta/TikTok ad APIs? |

### 10.3 Phase 3 - Business Operations (Medium Priority)

| Priority | Module | Research Focus | Key Questions |
|----------|--------|----------------|---------------|
| 1 | BMX | Mautic integration | How to integrate as module? |
| 2 | BM-Support | Chatwoot architecture | Widget embedding? |
| 3 | BMT | Matomo API | Custom dashboard integration? |
| 4 | BMS | Sales automation | Best outreach patterns? |

### 10.4 Open Source Repositories to Study

| Repository | URL | Study Focus |
|------------|-----|-------------|
| Twenty | https://github.com/twentyhq/twenty | CRM architecture, GraphQL, workspace model |
| Postiz | https://github.com/gitroomhq/postiz-app | Social scheduling, multi-account |
| Chatwoot | https://github.com/chatwoot/chatwoot | Support platform, webhooks |
| Mautic | https://github.com/mautic/mautic | Marketing automation |
| Payload CMS | https://github.com/payloadcms/payload | Headless CMS, admin UI |
| Strapi | https://github.com/strapi/strapi | Headless CMS, plugins |
| Matomo | https://github.com/matomo-org/matomo | Analytics, tracking |
| Cal.com | https://github.com/calcom/cal.com | Scheduling (for demos) |
| **Taskosaur** | https://github.com/Taskosaur/Taskosaur | Conversational task execution, BYOAI |
| Framer | https://www.framer.com | AI website builder patterns |

---

## Appendix A: Agent Naming Convention

All agents follow the pattern: `{Module}-{Role}Agent`

Examples:
- `BMV-MarketResearcherAgent`
- `BMC-Video-ScriptWriterAgent`
- `BM-CRM-LeadScorerAgent`

---

## Appendix B: Workflow Naming Convention

All workflows follow the pattern: `{module}-{action}-{target}`

Examples:
- `bmv-analyze-market`
- `bmc-video-generate-ugc`
- `bm-social-schedule-posts`

---

## 11. UI/UX Style Guide Foundations

> **Critical**: All modules MUST share a consistent visual language. This section establishes the foundational design system.

### 11.1 Design Tokens

```typescript
// Design tokens for AI Business Hub
const tokens = {
  // Colors
  colors: {
    // Brand
    primary: '#6366F1',      // Indigo - AI/tech feel
    secondary: '#8B5CF6',    // Purple - creativity
    accent: '#F59E0B',       // Amber - attention/approval

    // Semantic
    success: '#10B981',      // Green - completed/approved
    warning: '#F59E0B',      // Amber - needs attention
    error: '#EF4444',        // Red - failed/rejected
    info: '#3B82F6',         // Blue - informational

    // Agent Status
    agentActive: '#10B981',  // Green dot
    agentPaused: '#F59E0B',  // Amber dot
    agentIdle: '#6B7280',    // Gray dot
    agentError: '#EF4444',   // Red dot

    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F9FAFB',
    bgTertiary: '#F3F4F6',
    bgDark: '#111827',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },

  // Border Radius
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
};
```

### 11.2 Component Library (shadcn/ui Based)

All modules use a shared component library based on shadcn/ui:

| Component | Purpose | Used In |
|-----------|---------|---------|
| `Card` | Content containers | All modules |
| `Button` | Actions | All modules |
| `Input` | Text input | Forms, chat |
| `Select` | Dropdowns | Settings, filters |
| `Dialog` | Modal dialogs | Approvals, confirmations |
| `Sheet` | Side panels | Agent details, settings |
| `Tabs` | Tab navigation | Module sections |
| `Table` | Data tables | Lists, analytics |
| `Badge` | Status indicators | Agent status, workflow status |
| `Avatar` | User/agent images | Agent panel, chat |
| `Progress` | Progress bars | Workflow progress |
| `Toast` | Notifications | System messages |

### 11.3 Conversational UI Patterns

#### 11.3.1 Chat Interface

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  💬 Chat with AI Team                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Avatar] Mary (Business Analyst)                        10:30 AM   │   │
│  │  I've analyzed the market data. Here's what I found:                │   │
│  │                                                                      │   │
│  │  • TAM: $2.4B (growing 15% YoY)                                     │   │
│  │  • Top competitor: XYZ Corp (32% market share)                      │   │
│  │  • Key opportunity: Underserved SMB segment                         │   │
│  │                                                                      │   │
│  │  [View Full Report] [Ask Follow-up]                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Avatar] You                                            10:32 AM   │   │
│  │  Can you dig deeper into the SMB opportunity?                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Avatar] Mary is typing...                              ●●●        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Type a message or @mention an agent...]                    [Send] [📎]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 11.3.2 Agent Presence Indicators

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI TEAM STATUS                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐                    │
│  │  📊   │  │  🏗️   │  │  💻   │  │  📋   │  │  🧪   │                    │
│  │ Mary  │  │Winston│  │Amelia │  │ John  │  │ Murat │                    │
│  │  🟢   │  │  🟢   │  │  🟡   │  │  ⚪   │  │  ⚪   │                    │
│  │Active │  │Active │  │Pending│  │ Idle  │  │ Idle  │                    │
│  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘                    │
│                                                                              │
│  🟢 Active (2)  🟡 Pending Approval (1)  ⚪ Idle (2)  🔴 Error (0)         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 11.3.3 Approval Card Design

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ⏳ PENDING APPROVAL                                          HIGH PRIORITY │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  📝 Blog Post: "10 Tips for Vertical Gardening"                             │
│                                                                              │
│  Created by: Content Agent (Mary)                                           │
│  Confidence: ████████░░ 85%                                                 │
│  Scheduled: Monday, Nov 18 at 9:00 AM                                       │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI Recommendation: ✅ APPROVE                                       │   │
│  │  "Content aligns with brand voice. SEO score: 92/100.               │   │
│  │   One minor suggestion: Add internal link to related post."         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  [Preview] ─────────────────────────────────────────────────────────────── │
│                                                                              │
│  [✅ Approve]  [✏️ Edit]  [❌ Reject]  [⏰ Reschedule]  [💬 Ask AI]        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 11.3.4 Real-time Activity Feed

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📡 LIVE ACTIVITY                                              [Filter ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ● NOW   Mary is analyzing competitor pricing...                            │
│  ● NOW   Winston is designing database schema...                            │
│                                                                              │
│  ○ 2m    Amelia completed: API endpoint /users created                     │
│  ○ 5m    Content approved: "Welcome Email Template"                         │
│  ○ 8m    John added 3 items to approval queue                              │
│  ○ 15m   Workflow triggered: "New Lead → Score → CRM"                       │
│  ○ 20m   Mary completed: Market analysis report                             │
│                                                                              │
│  [Load More...]                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.4 Layout Patterns

#### 11.4.1 Module Dashboard Layout

All module dashboards follow this structure:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Module Navigation | Notifications | Profile                  │
├────────────────┬────────────────────────────────────────────────────────────┤
│                │                                                             │
│  SIDEBAR       │  MAIN CONTENT AREA                                         │
│  • Dashboard   │  ┌─────────────────────────────────────────────────────┐  │
│  • Approvals   │  │  Key Metrics Row                                     │  │
│  • [Module     │  └─────────────────────────────────────────────────────┘  │
│    specific]   │                                                             │
│  • Settings    │  ┌──────────────────────┐  ┌──────────────────────────┐  │
│                │  │  Primary Content     │  │  Secondary Panel         │  │
│  ────────────  │  │  (varies by module)  │  │  (context, details)      │  │
│                │  │                      │  │                          │  │
│  AGENT PANEL   │  │                      │  │                          │  │
│  🟢 Mary       │  │                      │  │                          │  │
│  🟢 Winston    │  │                      │  │                          │  │
│  🟡 Amelia     │  └──────────────────────┘  └──────────────────────────┘  │
│                │                                                             │
├────────────────┴────────────────────────────────────────────────────────────┤
│  CHAT BAR: [Type a message...] | @mention | Send                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.5 Accessibility Requirements

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| Color Contrast | WCAG 2.1 AA | 4.5:1 for text, 3:1 for UI |
| Keyboard Navigation | Full support | Tab order, focus indicators |
| Screen Readers | ARIA labels | All interactive elements |
| Motion | Reduced motion | Respect `prefers-reduced-motion` |
| Text Scaling | Up to 200% | Responsive typography |

---

## 12. Testing Strategy

> **Critical**: With 20+ modules and dynamic AI-generated workflows, comprehensive testing is essential.

### 12.1 Testing Pyramid

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TESTING PYRAMID                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            ┌───────┐                                        │
│                           /   E2E   \                                       │
│                          /  (10%)    \                                      │
│                         ├─────────────┤                                     │
│                        /  Integration  \                                    │
│                       /     (20%)       \                                   │
│                      ├───────────────────┤                                  │
│                     /       Unit          \                                 │
│                    /        (70%)          \                                │
│                   └─────────────────────────┘                               │
│                                                                              │
│  + AI-Specific Testing Layer (across all levels)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Test Categories

#### 12.2.1 Unit Tests

| Test Type | Scope | Tools |
|-----------|-------|-------|
| Component Tests | React components | Jest, React Testing Library |
| Service Tests | Business logic | Jest, Vitest |
| Utility Tests | Helper functions | Jest |
| Agent Logic | Agent decision logic | Jest with mocks |

#### 12.2.2 Integration Tests

| Test Type | Scope | Tools |
|-----------|-------|-------|
| API Tests | REST endpoints | Supertest, Jest |
| Database Tests | Queries, migrations | Prisma testing |
| Event Bus Tests | Redis pub/sub | Redis mock |
| Module Integration | Cross-module events | Custom test harness |

#### 12.2.3 E2E Tests

| Test Type | Scope | Tools |
|-----------|-------|-------|
| User Flows | Complete workflows | Playwright |
| Approval Flows | Human-in-the-loop | Playwright |
| Chat Interactions | Conversational UI | Playwright |

### 12.3 AI-Specific Testing

#### 12.3.1 Generated Workflow Validation

```typescript
interface WorkflowValidator {
  // Syntax validation
  validateYAML(workflow: string): ValidationResult;

  // Schema validation
  validateSchema(workflow: Workflow): ValidationResult;

  // Reference validation
  validateReferences(workflow: Workflow): ValidationResult;
  // - Do referenced agents exist?
  // - Do referenced templates exist?
  // - Do referenced events exist?

  // Logic validation
  validateLogic(workflow: Workflow): ValidationResult;
  // - No circular dependencies
  // - All conditions are resolvable
  // - Exit conditions exist

  // Sandbox execution
  executeSandbox(workflow: Workflow, mockData: any): ExecutionResult;
}
```

#### 12.3.2 Agent Response Testing

```typescript
interface AgentResponseTest {
  // Brand consistency
  checkBrandVoice(response: string, brandGuidelines: BrandGuide): Score;

  // Factual accuracy
  checkFactualClaims(response: string, knowledgeBase: KB): FactCheckResult;

  // Harmful content
  checkSafety(response: string): SafetyResult;

  // Prompt injection resistance
  checkInjectionResistance(agent: Agent, maliciousInput: string): boolean;

  // Consistency across runs
  checkDeterminism(prompt: string, runs: number): ConsistencyScore;
}
```

#### 12.3.3 Cross-Module Event Testing

```typescript
interface EventTestHarness {
  // Simulate event publication
  publishEvent(event: Event): void;

  // Verify subscribers received event
  assertReceived(subscriberModule: string, event: Event): void;

  // Verify correct transformations
  assertTransformed(input: Event, output: Event): void;

  // Test event ordering
  assertOrdering(events: Event[]): void;

  // Test failure handling
  simulateSubscriberFailure(module: string): void;
  assertRetry(event: Event, attempts: number): void;
  assertDeadLetter(event: Event): void;
}
```

### 12.4 Test Data Management

| Data Type | Strategy | Location |
|-----------|----------|----------|
| Fixtures | Static test data | `/tests/fixtures/` |
| Factories | Dynamic test data | `/tests/factories/` |
| Mocks | API/Service mocks | `/tests/mocks/` |
| Seeds | Database seeds | `/prisma/seeds/` |

### 12.5 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  ai-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:ai-validation
```

### 12.6 Quality Gates

| Gate | Threshold | Action |
|------|-----------|--------|
| Unit Test Coverage | ≥ 80% | Block merge |
| Integration Tests | All pass | Block merge |
| E2E Tests | All pass | Block merge |
| AI Validation | ≥ 90% pass | Warning |
| Performance | < 200ms API response | Warning |
| Security Scan | No critical issues | Block merge |

---

## 13. Meta-Validation

> **Note**: This document should be validated by the BMad Builder module itself.

### 13.1 Self-Validation Checklist

The agent definitions in this document should be creatable using BMad Builder. To validate:

1. **Agent Definitions**: Can BMad Builder generate the agent YAML files for each module's agent team?
2. **Workflow Definitions**: Can BMad Builder create the workflow YAML files from the descriptions?
3. **Task Decomposition**: Are the workflows properly decomposed into BMAD tasks?
4. **Checklist Generation**: Can validation checklists be generated for each workflow?

### 13.2 Validation Command

```bash
# Run BMad Builder validation on MODULE-RESEARCH.md
bmad validate --input docs/archive/foundation-phase/MODULE-RESEARCH.md --check-agents --check-workflows

# Expected output:
# ✅ 45 agents validated - all creatable
# ✅ 68 workflows validated - all executable
# ⚠️ 3 workflows missing checklist definitions
# ✅ Document is BMad Builder compatible
```

### 13.3 Gap Identification

If BMad Builder cannot create an artifact described in this document, it indicates:
1. The description is too vague → Add more detail
2. BMAD patterns don't support the concept → Extend BMAD
3. The concept is outside BMAD scope → Document separately

---

## Next Steps

Following the Development Methodology (Section 2):

### Phase 1: Foundation

1. **Create Universal UI/UX Style Guide** - Design tokens, component library, conversational UI patterns
2. **Study Taskosaur** - Understand conversational task execution for workflow builder
3. **Deep dive into Twenty CRM** - Study GraphQL schema, record system, workspace model

### Phase 2: Infrastructure

4. **Design event bus schema** - Define all inter-module events (Redis Streams)
5. **Implement IAssistantClient pattern** - Standard interface for all module agents
6. **Build BYOAI authentication** - Claude OAuth, API key management

### Phase 3: Module Development

7. **Create agent templates using BMAD Builder** - Standardize agent definitions
8. **Prototype video generation workflow** - Build VEO3/Sora integration
9. **Develop modules in parallel** - Each module uses Agno framework + remote-coding-agent patterns

### Phase 4: Integration

10. **Integration testing** - Cross-module event flows
11. **Merge and deploy** - Progressive rollout to production

---

**Document Status:** Living document - update as research progresses
**Last Updated:** 2025-11-27 (v1.1 - Added gaps from Party Mode review)
**Owner:** AI Business Hub Team

---

## Changelog

### v1.1 (2025-11-27)
- Added Section 1.3: Shared Data Architecture (CRM/Sales data layer)
- Added Section 2.4: Taskosaur Pattern Integration
- Added Section 2.5: Implementation Patterns (IAssistantClient, IPlatformAdapter, Session Management)
- Updated Section 5.5: Renamed to BME-App with explicit BMAD BMM mapping
- Updated Section 5.6: BME-Website now documented as alias
- Added Section 7.4: User Journey for Workflow Discovery & Management
- Added Section 11: UI/UX Style Guide Foundations
- Added Section 12: Testing Strategy
- Added Section 13: Meta-Validation

### v1.0 (2025-11-27)
- Initial document creation
