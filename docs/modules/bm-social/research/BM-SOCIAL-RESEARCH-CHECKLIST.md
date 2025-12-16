# BM-Social Module PRD - Research Checklist

**Purpose:** Research tasks completed for creating the BM-Social (Social Media) Module PRD
**Status:** ✅ COMPLETE
**Created:** 2025-12-17
**Completed:** 2025-12-17
**Output:** See [BM-SOCIAL-RESEARCH-FINDINGS.md](./BM-SOCIAL-RESEARCH-FINDINGS.md) for comprehensive findings

---

## Overview

This checklist tracks research tasks for the BM-Social module. Research was conducted using DeepWiki analysis of the Postiz open-source social media scheduling platform.

**Reference System:**
- Repository: `gitroomhq/postiz-app`
- DeepWiki: https://deepwiki.com/gitroomhq/postiz-app

---

## 1. Architecture & Tech Stack

**Status:** ✅ Complete

### Research Tasks

- [x] **Monorepo Structure**
  - [x] Application organization (backend, frontend, workers, cron)
  - [x] Shared libraries structure
  - [x] Build and deployment patterns

- [x] **Tech Stack Analysis**
  - [x] NestJS backend patterns
  - [x] Next.js frontend patterns
  - [x] Prisma + PostgreSQL schema
  - [x] BullMQ + Redis worker architecture

### Key Findings

- Postiz uses pnpm monorepo with 7 apps and 3 shared libraries
- Perfect alignment with AI Business Hub tech stack
- Worker/Cron separation for background processing

---

## 2. Data Models

**Status:** ✅ Complete

### Research Tasks

- [x] **Core Entities**
  - [x] Post model (content, state, scheduling)
  - [x] Integration model (platform connections)
  - [x] Organization model (multi-tenancy)
  - [x] User and permissions

- [x] **Supporting Entities**
  - [x] Media attachments
  - [x] Tags and categorization
  - [x] Comments and collaboration
  - [x] Webhooks

### Key Findings

- Post states: DRAFT, QUEUE, PUBLISHED, ERROR
- Integration stores OAuth tokens per platform
- Multi-tenant via organizationId

---

## 3. Social Media Provider Framework

**Status:** ✅ Complete

### Research Tasks

- [x] **Provider Pattern**
  - [x] SocialAbstract base class
  - [x] SocialProvider interface
  - [x] IntegrationManager registry

- [x] **Platform Implementations**
  - [x] Twitter/X provider
  - [x] LinkedIn provider
  - [x] Facebook provider
  - [x] Instagram provider
  - [x] TikTok provider
  - [x] YouTube provider
  - [x] Pinterest provider
  - [x] Threads provider

- [x] **OAuth Flow**
  - [x] generateAuthUrl method
  - [x] authenticate method
  - [x] refreshToken method
  - [x] isBetweenSteps for multi-step auth

### Key Findings

- Each provider extends SocialAbstract, implements SocialProvider
- Platform-specific rate limits (maxConcurrentJob)
- Standardized posting interface across platforms

---

## 4. Post Scheduling System

**Status:** ✅ Complete

### Research Tasks

- [x] **Scheduling Flow**
  - [x] Post creation and validation
  - [x] Queue emission with delay
  - [x] Worker pickup and execution
  - [x] State transitions

- [x] **Safety Mechanisms**
  - [x] CheckMissingQueues cron
  - [x] PostNowPendingQueues cron
  - [x] Token refresh handling
  - [x] Error retry logic

- [x] **Multi-Platform Posting**
  - [x] Group UUID for related posts
  - [x] Platform-specific content variations
  - [x] Thread support

### Key Findings

- BullMQ with delay for scheduled posts
- Hourly cron checks for missing posts
- Automatic retry for transient failures

---

## 5. Worker & Background Processing

**Status:** ✅ Complete

### Research Tasks

- [x] **BullMQ Configuration**
  - [x] Queue types and purposes
  - [x] Concurrency settings
  - [x] Stalled job handling

- [x] **Job Types**
  - [x] Post publishing
  - [x] Digest emails
  - [x] Webhooks
  - [x] Auto-posting (cron)

- [x] **Cron Jobs**
  - [x] Missing queue checks
  - [x] Pending post recovery
  - [x] Token refresh

### Key Findings

- 300 concurrent jobs per worker
- Max 10 stalled attempts before failure
- Separate cron app for scheduled tasks

---

## 6. Calendar & Content Management UI

**Status:** ✅ Complete

### Research Tasks

- [x] **Calendar Views**
  - [x] Day view (hourly slots)
  - [x] Week view (7-day grid)
  - [x] Month view (42-day grid)

- [x] **Interactions**
  - [x] Drag-drop rescheduling
  - [x] Time slot editing
  - [x] Bulk actions

- [x] **State Management**
  - [x] CalendarContext pattern
  - [x] SWR for data fetching
  - [x] Zustand for local state

### Key Findings

- Calendar views match standard patterns
- Drag-drop uses useDrag/useDrop hooks
- Time slots configurable per integration

---

## 7. AI Capabilities

**Status:** ✅ Complete

### Research Tasks

- [x] **Content Generation**
  - [x] Post generation from topics
  - [x] Thread breaking/creation
  - [x] Hook generation
  - [x] Content extraction

- [x] **Image Generation**
  - [x] DALL-E integration
  - [x] Prompt generation

- [x] **AI Agents**
  - [x] Copilot runtime
  - [x] LangChain agent graph
  - [x] Research capabilities
  - [x] Content classification

- [x] **Auto-Posting**
  - [x] Automated content generation
  - [x] Scheduling rules

### Key Findings

- OpenAI GPT-4 for text, DALL-E 3 for images
- LangChain for agent workflows
- Adapt to BYOAI for user-provided keys

---

## 8. Analytics System

**Status:** ✅ Complete

### Research Tasks

- [x] **Metrics Collection**
  - [x] Platform-specific metrics
  - [x] Standardized format
  - [x] On-demand fetching

- [x] **Display**
  - [x] Analytics dashboard patterns
  - [x] Chart components
  - [x] Date range filtering

### Key Findings

- Each platform has unique metrics
- Standardized AnalyticsData interface
- Real-time fetch, optional snapshot storage

---

## 9. Multi-Tenant & Team Management

**Status:** ✅ Complete

### Research Tasks

- [x] **Organization Model**
  - [x] Workspace structure
  - [x] Multi-org support

- [x] **Team Permissions**
  - [x] Role definitions (SUPERADMIN, ADMIN, USER)
  - [x] Permission matrix
  - [x] Team invitation flow

- [x] **Account Management**
  - [x] Multiple social accounts per org
  - [x] Account switching

### Key Findings

- Organization = workspace tenant
- Three roles with hierarchical permissions
- Platform tenant + workspace model

---

## 10. Adding New Providers

**Status:** ✅ Complete

### Research Tasks

- [x] **Implementation Steps**
  - [x] Provider class creation
  - [x] Interface implementation
  - [x] Registration in manager

- [x] **Configuration**
  - [x] Environment variables
  - [x] OAuth credentials
  - [x] Frontend settings

### Key Findings

- Extend SocialAbstract, implement SocialProvider
- Register in IntegrationManager
- Add env vars for OAuth

---

## Research Summary

| Section | Status | Key Source |
|---------|--------|------------|
| Architecture | ✅ | DeepWiki - Overview |
| Data Models | ✅ | DeepWiki - Database Schema |
| Provider Framework | ✅ | DeepWiki - Integration Framework |
| Scheduling System | ✅ | DeepWiki - Post Management |
| Worker Architecture | ✅ | DeepWiki - Worker Architecture |
| Calendar UI | ✅ | DeepWiki - Calendar Interface |
| AI Capabilities | ✅ | DeepWiki - AI Services |
| Analytics | ✅ | DeepWiki - Social Integrations |
| Multi-Tenancy | ✅ | DeepWiki - Database Schema |
| Provider Guide | ✅ | DeepWiki - Developer Guides |

---

## Dependencies

### Platform Foundation Required

| BM-Social Requirement | Platform Dependency |
|-----------------------|---------------------|
| Post scheduling | BullMQ worker infrastructure |
| OAuth connections | OAuth provider registry |
| Team permissions | RBAC system |
| Multi-tenancy | Tenant isolation |
| Approval queue | Approval system (Sentinel) |
| Analytics storage | Time-series infrastructure |

### Cross-Module Dependencies

| Feature | Dependent Module |
|---------|------------------|
| Brand voice in content | BM-Brand |
| Article-to-social | BMC (Content) |
| Contact tagging | BM-CRM |
| Unified analytics | BMT |

---

## Next Steps

1. ✅ Research Complete
2. Create BM-Social PRD using `/bmad:bmm:workflows:prd`
3. Design agent YAML files
4. Create workflow packages
5. Implement provider framework
6. Build calendar UI

---

**Document Status:** ✅ Research Complete
**Owner:** AI Business Hub Team
**Completed:** 2025-12-17
