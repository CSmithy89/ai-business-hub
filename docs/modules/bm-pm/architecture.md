# Core-PM + Knowledge Base Architecture Document

**Component:** Core-PM (Platform Core)
**Version:** 2.0
**Last Updated:** 2025-12-16
**Status:** Architecture Revision - PM as Platform Core

---

## Read First (Scope + Terminology)

1. This document describes the **target** Core-PM architecture; several code paths, schemas, and packages referenced below are **proposed** and not yet present in the repository.
2. **Canonical tenancy identifier:** use `workspaceId` across Core-PM docs/models/APIs. `tenantId` appears in the event bus payloads today and must be treated as an alias (`tenantId == workspaceId`) until/unless the platform standardizes naming.
3. MVP real-time is already Socket.io-based in the codebase; **Yjs/Hocuspocus is intended for Phase 2 collaboration**, not a prerequisite for Phase 1 task updates.
4. UX flows and UI interaction rules are defined in `docs/modules/bm-pm/ux/README.md`.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Data Architecture](#data-architecture)
4. [Agent Architecture](#agent-architecture)
5. [Knowledge Base & RAG Architecture](#knowledge-base--rag-architecture)
6. [Real-Time Collaboration Architecture](#real-time-collaboration-architecture)
7. [API Architecture](#api-architecture)
8. [Security Architecture](#security-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Deployment Architecture](#deployment-architecture)
11. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)

---

## Executive Summary

Core-PM is the **platform's foundational infrastructure**, not an optional module. It provides:

1. **Project Management** - AI-powered PM with 9-agent team (Navi, Sage, Herald, Chrono, Scope, Pulse, Bridge, Scribe, Prism)
2. **Knowledge Base** - Collaborative wiki with Yjs real-time editing, RAG-powered search, and verified content system
3. **Cross-Module Orchestration** - All business modules (CRM, Content, Analytics) use Core-PM for orchestration

### Architectural Position

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM CORE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────┐      ┌─────────────────────────────────┐  │
│   │     Project Management      │      │        Knowledge Base           │  │
│   │                             │      │                                 │  │
│   │  • Products/Projects        │◄────►│  • Wiki Pages (Yjs CRDT)       │  │
│   │  • BMAD Workflow Engine     │      │  • RAG Pipeline (pgvector)     │  │
│   │  • 9-Agent Team             │      │  • Verified Content System     │  │
│   │  • Human + AI Hybrid Tasks  │      │  • @mentions & #references     │  │
│   │                             │      │                                 │  │
│   └─────────────────────────────┘      └─────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                            ▲                    ▲
                            │                    │
            ┌───────────────┼────────────────────┼───────────────┐
            │               │                    │               │
      ┌─────┴─────┐   ┌─────┴─────┐        ┌─────┴─────┐   ┌─────┴─────┐
      │  BM-CRM   │   │BM-Content │        │BM-Finance │   │  BM-...   │
      │ (Module)  │   │ (Module)  │        │ (Module)  │   │ (Module)  │
      └───────────┘   └───────────┘        └───────────┘   └───────────┘
```

---

## High-Level Architecture

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (Next.js 15)                             │
├──────────────────────────────┬──────────────────────────────────────────────┤
│         PM UI Components     │           KB UI Components                    │
│  • Product Dashboard         │  • KB Home (Recent, Favorites)               │
│  • Kanban/List/Calendar      │  • Page Editor (Tiptap + Yjs)                │
│  • Team Management           │  • Search Results                             │
│  • Task Detail Panel         │  • Version History                            │
│  • Agent Chat Panel          │  • Verification Controls                      │
└──────────────────────────────┴──────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
┌───────────────────────┐  ┌───────────────┐  ┌───────────────────────┐
│  REST API (NestJS)    │  │  WebSocket    │  │  Hocuspocus Server    │
│  • /api/pm/*          │  │  (Socket.io)  │  │  (Yjs Sync)           │
│  • /api/kb/*          │  │  • Events     │  │  • Real-time collab   │
│  • /api/rag/*         │  │  • Presence   │  │  • Cursor presence    │
└───────────────────────┘  └───────────────┘  └───────────────────────┘
            │                     │                       │
            └─────────────────────┼───────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Service Layer (NestJS)                              │
├──────────────────────────────┬──────────────────────────────────────────────┤
│         PM Services          │           KB Services                         │
│  • ProductsService           │  • PagesService                              │
│  • PhasesService             │  • VersionsService                           │
│  • TasksService              │  • SearchService (FTS + Semantic)            │
│  • TeamsService              │  • RAGService                                │
│  • AnalyticsService          │  • VerificationService                       │
└──────────────────────────────┴──────────────────────────────────────────────┘
            │                                         │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Data Layer (Prisma + PostgreSQL)                     │
├──────────────────────────────┬──────────────────────────────────────────────┤
│         PM Models            │           KB Models                           │
│  • Product, Phase, Task      │  • KnowledgePage, PageVersion                │
│  • ProductTeam, TeamMember   │  • PageEmbedding (pgvector)                  │
│  • TaskActivity, TaskRelation│  • ProjectPage (many-to-many)               │
│  • SavedView, RiskEntry      │  • PageComment, PageMention                  │
└──────────────────────────────┴──────────────────────────────────────────────┘
            │                                         │
            └─────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Agent Layer (Python/Agno)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                           Core-PM Agent Team                                 │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     Navi (Team Leader)                               │   │
│   │              PM Orchestrator + KB Navigator                          │   │
│   └─────────────────────────────┬───────────────────────────────────────┘   │
│                                 │                                            │
│   ┌───────┬───────┬─────────────┼─────────────┬───────┬───────┬───────┐     │
│   │       │       │             │             │       │       │       │     │
│   ▼       ▼       ▼             ▼             ▼       ▼       ▼       ▼     │
│ ┌─────┐┌─────┐┌──────┐     ┌──────┐     ┌─────┐┌──────┐┌──────┐┌─────┐     │
│ │Sage ││Herald││Chrono│     │Scope │     │Pulse││Scribe││Bridge││Prism│     │
│ └─────┘└─────┘└──────┘     └──────┘     └─────┘└──────┘└──────┘└─────┘     │
│ Estim.  Report  Track       Plan         Risk    KB Mgr  Integ.  Analytics  │
│                                                                              │
│   MVP Phase 1 (6 agents)                   Phase 2 (3 agents)               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React 19 | UI framework |
| Styling | Tailwind CSS 4 + shadcn/ui | Design system |
| Rich Editor | Tiptap + ProseMirror | KB page editing |
| Real-time Collab | Yjs + Hocuspocus | CRDT-based sync |
| Backend | NestJS 10 | REST API, services |
| WebSocket | Socket.io 4 | Real-time events |
| Database | PostgreSQL 16 + pgvector | Data + embeddings |
| ORM | Prisma 6 | Database access |
| Queue | Redis + BullMQ | Background jobs |
| Agents | Python 3.12 + Agno | AI agent framework |
| Vector DB | pgvector | Embedding storage |

---

## Data Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT MANAGEMENT DOMAIN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐                │
│  │   Business  │──────<│   Product   │──────<│    Phase    │                │
│  │             │  1:N  │             │  1:N  │             │                │
│  │ id          │       │ id          │       │ id          │                │
│  │ workspaceId │       │ businessId  │       │ productId   │                │
│  │ slug        │       │ name, slug  │       │ name        │                │
│  │ name        │       │ type        │       │ bmadPhase   │                │
│  │ aiConfig{}  │       │ status      │       │ status      │                │
│  │ settings{}  │       │ budget{}    │       │ progress{}  │                │
│  └─────────────┘       │ bmadConfig{}│       └──────┬──────┘                │
│                        └──────┬──────┘              │                       │
│                               │                     │ 1:N                    │
│                               │ 1:1                 │                       │
│                               ▼                     ▼                       │
│                        ┌─────────────┐       ┌─────────────┐                │
│                        │ ProductTeam │       │    Task     │                │
│                        │             │       │             │                │
│                        │ productId   │       │ id          │                │
│                        │ leadUserId  │       │ phaseId     │                │
│                        └──────┬──────┘       │ taskNumber  │                │
│                               │              │ title       │                │
│                               │ 1:N          │ type        │                │
│                               ▼              │ status      │                │
│                        ┌─────────────┐       │ assignment{}│                │
│                        │ TeamMember  │       │ approval{}  │                │
│                        │             │       │ estimate{}  │                │
│                        │ userId      │       └──────┬──────┘                │
│                        │ productId   │              │                       │
│                        │ role        │              │ 1:N                    │
│                        │ capacity{}  │              ▼                       │
│                        └─────────────┘       ┌─────────────┐                │
│                                              │TaskActivity │                │
│                                              │             │                │
│                                              │ taskId      │                │
│                                              │ type        │                │
│                                              │ data{}      │                │
│                                              └─────────────┘                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE BASE DOMAIN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐                                                        │
│  │  KnowledgePage  │◄───────┐ (self-referential: parent-child)              │
│  │                 │        │                                                │
│  │ id              │────────┘                                                │
│  │ workspaceId     │                                                        │
│  │ workspaceId     │        ┌─────────────────┐                             │
│  │ parentId        │───────►│  KnowledgePage  │ (parent)                    │
│  │ title           │        └─────────────────┘                             │
│  │ slug            │                                                        │
│  │ content (JSON)  │──┬─────────────────────────────────────────┐           │
│  │ contentText     │  │ Tiptap/ProseMirror JSON structure       │           │
│  │                 │  │ {type: 'doc', content: [...]}           │           │
│  │ isVerified      │  └─────────────────────────────────────────┘           │
│  │ verifiedAt      │                                                        │
│  │ verifiedById    │        ┌─────────────────┐                             │
│  │ verifyExpires   │──1:N──►│  PageVersion    │                             │
│  │ ownerId         │        │                 │                             │
│  │ viewCount       │        │ id              │                             │
│  │ lastViewedAt    │        │ pageId          │                             │
│  │ createdAt       │        │ content (JSON)  │                             │
│  │ updatedAt       │        │ version         │                             │
│  │ deletedAt       │        │ createdBy       │                             │
│  └────────┬────────┘        │ changeNote      │                             │
│           │                 └─────────────────┘                             │
│           │                                                                  │
│           │ 1:N             ┌─────────────────┐                             │
│           ├────────────────►│ PageEmbedding   │                             │
│           │                 │                 │                             │
│           │                 │ id              │                             │
│           │                 │ pageId          │                             │
│           │                 │ chunkIndex      │                             │
│           │                 │ chunkText       │                             │
│           │                 │ embedding[]     │◄── pgvector(1536)          │
│           │                 └─────────────────┘                             │
│           │                                                                  │
│           │ N:M             ┌─────────────────┐                             │
│           └────────────────►│  ProjectPage    │ (Many-to-Many join)         │
│                             │                 │                             │
│                             │ productId       │────────► Product            │
│                             │ pageId          │────────► KnowledgePage      │
│                             │ isPrimary       │                             │
│                             └─────────────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core PM Prisma Schema

```prisma
// packages/db/prisma/schema.prisma (planned: split into pm/kb schema files when Core-PM lands)

model Product {
  id            String        @id @default(cuid())
  workspaceId   String
  businessId    String
  slug          String
  name          String
  description   String?

  // Visual Identity
  color         String        @default("#3B82F6")
  icon          String        @default("folder")
  coverImage    String?

  // Type Classification
  type          ProductType   @default(CUSTOM)

  // BMAD Configuration
  bmadTemplateId String?
  currentPhase   String?

  // Budget
  budget        Decimal?      @db.Decimal(12, 2)
  actualSpend   Decimal?      @db.Decimal(12, 2)

  // Status
  status        ProductStatus @default(PLANNING)
  startDate     DateTime?
  targetDate    DateTime?

  // Progress (denormalized for performance)
  totalTasks      Int         @default(0)
  completedTasks  Int         @default(0)
  lastActivityAt  DateTime?

  // Settings
  autoApprovalThreshold Float @default(0.85)
  suggestionMode        Boolean @default(true)

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  // Relations
  business      Business      @relation(fields: [businessId], references: [id])
  phases        Phase[]
  team          ProductTeam?
  views         SavedView[]
  pages         ProjectPage[]

  @@unique([workspaceId, slug])
  @@index([workspaceId])
  @@index([businessId])
  @@index([status])
}

model Phase {
  id            String        @id @default(cuid())
  productId     String
  name          String
  description   String?

  // BMAD Mapping
  bmadPhase     BmadPhaseType?
  phaseNumber   Int

  // Timeline
  startDate     DateTime?
  endDate       DateTime?

  // Status
  status        PhaseStatus   @default(UPCOMING)

  // Progress (denormalized)
  totalTasks      Int         @default(0)
  completedTasks  Int         @default(0)
  totalPoints     Int         @default(0)
  completedPoints Int         @default(0)

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  product       Product       @relation(fields: [productId], references: [id])
  tasks         Task[]
  snapshots     PhaseSnapshot[]

  @@index([productId])
  @@index([status])
}

model Task {
  id            String        @id @default(cuid())
  workspaceId   String
  phaseId       String
  productId     String        // Denormalized for queries

  // Basic Info
  taskNumber    Int           // Sequential per product: PROD-001
  title         String
  description   String?       // Rich text markdown

  // Classification
  type          TaskType      @default(TASK)
  priority      TaskPriority  @default(MEDIUM)

  // Assignment
  assignmentType AssignmentType @default(HUMAN)
  assigneeId     String?       // Human user ID
  agentId        String?       // Module agent ID

  // Estimation
  storyPoints    Int?
  estimatedHours Float?
  actualHours    Float?
  confidenceScore Float?       // 0-1, from Sage

  // Status
  status        TaskStatus    @default(BACKLOG)
  stateId       String?       // Custom state reference

  // Timeline
  dueDate       DateTime?
  startedAt     DateTime?
  completedAt   DateTime?

  // Hierarchy
  parentId      String?

  // Approval
  approvalRequired Boolean    @default(false)
  approvalStatus   ApprovalStatus @default(NOT_NEEDED)
  approvedBy       String?
  approvedAt       DateTime?

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?
  createdBy     String

  // Relations
  phase         Phase         @relation(fields: [phaseId], references: [id])
  parent        Task?         @relation("TaskHierarchy", fields: [parentId], references: [id])
  children      Task[]        @relation("TaskHierarchy")
  activities    TaskActivity[]
  relations     TaskRelation[] @relation("SourceTask")
  relatedTo     TaskRelation[] @relation("TargetTask")
  attachments   TaskAttachment[]
  comments      TaskComment[]
  labels        TaskLabel[]

  @@unique([productId, taskNumber])
  @@index([workspaceId])
  @@index([phaseId])
  @@index([productId])
  @@index([status])
  @@index([assigneeId])
  @@index([dueDate])
}

model ProductTeam {
  id            String        @id @default(cuid())
  productId     String        @unique
  leadUserId    String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  product       Product       @relation(fields: [productId], references: [id])
  members       TeamMember[]

  @@index([leadUserId])
}

model TeamMember {
  id            String        @id @default(cuid())
  teamId        String
  userId        String
  role          TeamRole      @default(DEVELOPER)
  customRoleName String?

  // Capacity
  hoursPerWeek  Float         @default(40)
  productivity  Float         @default(0.8)

  // Permissions
  canAssignTasks      Boolean @default(false)
  canApproveAgents    Boolean @default(false)
  canModifyPhases     Boolean @default(false)

  // Status
  isActive      Boolean       @default(true)
  joinedAt      DateTime      @default(now())

  team          ProductTeam   @relation(fields: [teamId], references: [id])

  @@unique([teamId, userId])
  @@index([userId])
}

enum ProductType {
  COURSE
  PODCAST
  BOOK
  NEWSLETTER
  VIDEO_SERIES
  COMMUNITY
  SOFTWARE
  WEBSITE
  CUSTOM
}

enum ProductStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  ARCHIVED
}

enum BmadPhaseType {
  PHASE_1_BRIEF
  PHASE_2_REQUIREMENTS
  PHASE_3_ARCHITECTURE
  PHASE_4_IMPLEMENTATION
  PHASE_5_TESTING
  PHASE_6_DEPLOYMENT
  PHASE_7_LAUNCH
  OPERATE_MAINTAIN
  OPERATE_ITERATE
  OPERATE_SCALE
}

enum PhaseStatus {
  UPCOMING
  CURRENT
  COMPLETED
  CANCELLED
}

enum TaskType {
  EPIC
  STORY
  TASK
  SUBTASK
  BUG
  RESEARCH
  CONTENT
  AGENT_REVIEW
}

enum TaskPriority {
  URGENT
  HIGH
  MEDIUM
  LOW
  NONE
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  REVIEW
  AWAITING_APPROVAL
  DONE
  CANCELLED
}

enum AssignmentType {
  HUMAN
  AGENT
  HYBRID
}

enum ApprovalStatus {
  NOT_NEEDED
  PENDING
  APPROVED
  REJECTED
  CHANGES_REQUESTED
}

enum TeamRole {
  PRODUCT_LEAD
  DEVELOPER
  DESIGNER
  QA_ENGINEER
  STAKEHOLDER
  CUSTOM
}
```

### Knowledge Base Prisma Schema

```prisma
// packages/db/prisma/schema.prisma (planned: split into pm/kb schema files when Core-PM lands)

model KnowledgePage {
  id            String        @id @default(cuid())
  workspaceId   String
  parentId      String?

  // Content
  title         String
  slug          String
  content       Json          // Tiptap/ProseMirror JSON
  contentText   String        // Plain text for FTS

  // Verification
  isVerified    Boolean       @default(false)
  verifiedAt    DateTime?
  verifiedById  String?
  verifyExpires DateTime?

  // Ownership
  ownerId       String

  // Analytics
  viewCount     Int           @default(0)
  lastViewedAt  DateTime?

  // Yjs State
  yjsState      Bytes?        // Yjs document state for persistence

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  // Relations
  parent        KnowledgePage?   @relation("PageHierarchy", fields: [parentId], references: [id])
  children      KnowledgePage[]  @relation("PageHierarchy")
  versions      PageVersion[]
  embeddings    PageEmbedding[]
  projects      ProjectPage[]
  comments      PageComment[]
  mentions      PageMention[]
  activities    PageActivity[]

  @@unique([workspaceId, slug])
  @@index([workspaceId])
  @@index([parentId])
  @@index([ownerId])
  @@index([isVerified])
  @@index([updatedAt])
}

model PageVersion {
  id            String        @id @default(cuid())
  pageId        String
  version       Int
  content       Json          // Snapshot of content at this version
  contentText   String        // Plain text snapshot

  // Metadata
  changeNote    String?
  createdById   String
  createdAt     DateTime      @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id])

  @@unique([pageId, version])
  @@index([pageId])
}

model PageEmbedding {
  id            String        @id @default(cuid())
  pageId        String
  chunkIndex    Int           // Order within page
  chunkText     String        // Original text chunk

  // Vector embedding - using pgvector extension
  // Note: Prisma doesn't natively support pgvector, use raw SQL for queries
  // Stored as float array, actual vector ops via raw queries
  embedding     Unsupported("vector(1536)")

  // Metadata
  embeddingModel String       @default("text-embedding-3-small")
  createdAt     DateTime      @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@index([pageId])
}

model ProjectPage {
  id            String        @id @default(cuid())
  productId     String
  pageId        String
  isPrimary     Boolean       @default(false)
  createdAt     DateTime      @default(now())

  product       Product       @relation(fields: [productId], references: [id])
  page          KnowledgePage @relation(fields: [pageId], references: [id])

  @@unique([productId, pageId])
  @@index([productId])
  @@index([pageId])
}

model PageComment {
  id            String        @id @default(cuid())
  pageId        String
  userId        String
  content       String

  // Thread support
  parentId      String?

  // Timestamps
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  page          KnowledgePage @relation(fields: [pageId], references: [id])
  parent        PageComment?  @relation("CommentThread", fields: [parentId], references: [id])
  replies       PageComment[] @relation("CommentThread")

  @@index([pageId])
  @@index([userId])
}

model PageMention {
  id            String        @id @default(cuid())
  pageId        String

  // Mention type
  mentionType   MentionType
  targetId      String        // User ID, Task ID, or Page ID

  // Position in content
  position      Int           // Character offset

  createdAt     DateTime      @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id])

  @@index([pageId])
  @@index([targetId])
}

model PageActivity {
  id            String        @id @default(cuid())
  pageId        String
  userId        String
  type          PageActivityType
  data          Json?
  createdAt     DateTime      @default(now())

  page          KnowledgePage @relation(fields: [pageId], references: [id])

  @@index([pageId])
  @@index([userId])
  @@index([createdAt])
}

enum MentionType {
  USER          // @username
  TASK          // #PM-123
  PAGE          // [[Page Title]]
}

enum PageActivityType {
  CREATED
  UPDATED
  DELETED
  RESTORED
  VIEWED
  VERIFIED
  UNVERIFIED
  LINKED_TO_PROJECT
  UNLINKED_FROM_PROJECT
  COMMENTED
}
```

---

## Agent Architecture

### Core-PM Agent Team

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Core-PM Agent Team                                 │
│                    (Manages PM Tool, KB & Process)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Navi (Team Leader)                            │   │
│   │                 PM Orchestrator + KB Navigator                       │   │
│   │                                                                      │   │
│   │   Responsibilities:                                                  │   │
│   │   • Route requests to specialist agents                             │   │
│   │   • Coordinate multi-agent workflows                                │   │
│   │   • Generate daily briefings                                        │   │
│   │   • Search KB for context (delegates to Scribe)                     │   │
│   │   • SUGGEST actions (never auto-execute)                            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│       ┌─────────────────────────────┼─────────────────────────────┐         │
│       │                             │                             │         │
│       ▼                             ▼                             ▼         │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                     MVP Agents (Phase 1)                            │   │
│   ├──────────┬──────────┬──────────┬──────────┬──────────┬────────────┤   │
│   │   Sage   │  Herald  │  Chrono  │  Scope   │  Pulse   │            │   │
│   │ Estimator│ Reporter │ Tracker  │ Planner  │Risk Mon. │            │   │
│   │          │          │          │          │          │            │   │
│   │• Estimate│• Standup │• Activity│• Sprint  │• Risk    │            │   │
│   │• Velocity│• Reports │• Stale   │• Capacity│• Blocker │            │   │
│   │• Cold-   │• Burndown│• Audit   │• Workload│• Health  │            │   │
│   │  start   │• Forecast│• History │• Priority│• Deadline│            │   │
│   └──────────┴──────────┴──────────┴──────────┴──────────┴────────────┘   │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │                     Phase 2 Agents                                  │   │
│   ├──────────┬──────────┬──────────────────────────────────────────────┤   │
│   │  Scribe  │  Bridge  │  Prism                                       │   │
│   │ KB Mgr   │ Integrat.│ Analytics                                    │   │
│   │          │          │                                              │   │
│   │• KB CRUD │• GitHub  │• Predict                                     │   │
│   │• RAG Ops │• GitLab  │• Trends                                      │   │
│   │• Verify  │• Import  │• Optimize                                    │   │
│   │• Search  │• Webhook │• Anomaly                                     │   │
│   └──────────┴──────────┴──────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Team Factory Pattern

```python
# (proposed) agents/core-pm/team.py

from agno import Agent, Team
from agno.storage.postgres import PostgresStorage
from agno.memory import Memory

	def create_core_pm_team(
	    session_id: str,
	    user_id: str,
	    workspace_id: str,
	    business_id: str,
	    product_id: str,
	) -> Team:
	    """Create Core-PM agent team for a product (pattern aligned with agents/*/team.py)."""

    # Shared memory for team context
    shared_memory = Memory(
        db=PostgresStorage(
	            table_name=f"core_pm_memory_{workspace_id}",
	            schema="agent_memory"
	        ),
	        namespace=f"product:{product_id}"
	    )

    # MVP Agents
	    navi = create_navi(workspace_id, product_id, shared_memory)
	    sage = create_sage(workspace_id, product_id, shared_memory)
	    herald = create_herald(workspace_id, product_id, shared_memory)
	    chrono = create_chrono(workspace_id, product_id, shared_memory)
	    scope = create_scope(workspace_id, product_id, shared_memory)
	    pulse = create_pulse(workspace_id, product_id, shared_memory)

    # Phase 2 Agents (initialized but not active until feature flag)
	    scribe = create_scribe(workspace_id, product_id, shared_memory)
	    bridge = create_bridge(workspace_id, product_id, shared_memory)
	    prism = create_prism(workspace_id, product_id, shared_memory)

    return Team(
        name="Core-PM Team",
        mode="coordinate",  # Navi coordinates, agents execute
        leader=navi,
        members=[
            sage, herald, chrono, scope, pulse,  # MVP
            scribe, bridge, prism  # Phase 2
        ],
        memory=shared_memory,
        instructions=[
            "You are the Core-PM Team managing projects and knowledge.",
            "Navi leads and coordinates all operations.",
            "ALWAYS suggest actions, never auto-execute without confirmation.",
            "Route approvals through Sentinel when confidence < 85%.",
            "Use Scribe for all KB operations and RAG search.",
            "Prioritize verified KB content in all AI responses.",
        ],
        settings={
            "suggestion_mode": True,
            "confidence_threshold": 0.85,
            "kb_rag_enabled": True,
            "verified_content_boost": 1.5,
        }
    )
```

### Scribe Agent Implementation

```python
# (proposed) agents/core-pm/scribe.py

from agno import Agent
from agno.tools import tool
from typing import List, Optional
from .tools.kb_tools import (
    create_kb_page, update_kb_page, delete_kb_page,
    search_kb, query_rag, get_context_for_task,
    mark_verified, detect_stale_pages, summarize_page
)

	def create_scribe(workspace_id: str, product_id: str, memory) -> Agent:
	    """Create Scribe - Knowledge Base Manager agent."""

	    return Agent(
	        name="Scribe",
	        role="Knowledge Base Manager",
	        model=get_workspace_model(workspace_id),
	        instructions=load_prompt("scribe_system.md"),
        tools=[
            # Page Management
            create_kb_page,
            update_kb_page,
            delete_kb_page,
            move_kb_page,

            # Search & Discovery
            search_kb,
            find_related_pages,
            get_backlinks,

            # RAG Operations
            generate_embeddings,
            query_rag,
            get_context_for_task,

            # Quality & Verification
            mark_verified,
            expire_verification,
            detect_stale_pages,
            suggest_updates,
            summarize_page,

            # Organization
            link_page_to_project,
            unlink_page,
            suggest_structure,
        ],
        memory=memory,
        settings={
            "rag_config": {
                "chunk_size": 512,
                "chunk_overlap": 50,
                "top_k": 5,
                "verified_boost": 1.5,
                "recency_decay": 0.95,
            }
        }
    )
```

---

## Knowledge Base & RAG Architecture

### RAG Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAG Pipeline                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Ingestion Pipeline                              │   │
│   │                                                                      │   │
│   │   KB Page Created/Updated                                            │   │
│   │          │                                                           │   │
│   │          ▼                                                           │   │
│   │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │   │
│   │   │   Extract    │───►│    Chunk     │───►│   Embed      │          │   │
│   │   │   Text       │    │   Content    │    │   Chunks     │          │   │
│   │   └──────────────┘    └──────────────┘    └──────────────┘          │   │
│   │                                                  │                   │   │
│   │   Tiptap JSON ──► Plain text    512 tokens      ▼                   │   │
│   │                                50 overlap  ┌──────────────┐          │   │
│   │                                            │  pgvector    │          │   │
│   │                                            │  Store       │          │   │
│   │                                            └──────────────┘          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Retrieval Pipeline                              │   │
│   │                                                                      │   │
│   │   User Query / Agent Request                                         │   │
│   │          │                                                           │   │
│   │          ▼                                                           │   │
│   │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │   │
│   │   │    Embed     │───►│   Vector     │───►│   Rank &     │          │   │
│   │   │    Query     │    │   Search     │    │   Boost      │          │   │
│   │   └──────────────┘    └──────────────┘    └──────────────┘          │   │
│   │                                                  │                   │   │
│   │   Query ──► vector      Cosine sim.             ▼                   │   │
│   │                         top_k=5          ┌──────────────┐           │   │
│   │                                          │   Context    │           │   │
│   │                                          │   Assembly   │           │   │
│   │                                          └──────────────┘           │   │
│   │                                                  │                   │   │
│   │                                                  ▼                   │   │
│   │                                          ┌──────────────┐           │   │
│   │                                          │   LLM with   │           │   │
│   │                                          │   Context    │           │   │
│   │                                          └──────────────┘           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### RAG Service Implementation

```typescript
// (proposed) apps/api/src/core-pm/kb/rag.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { ByoaiService } from '@/modules/ai/byoai.service';

interface RAGConfig {
  chunkSize: number;      // 512 tokens
  chunkOverlap: number;   // 50 tokens
  topK: number;           // 5 results
  verifiedBoost: number;  // 1.5x for verified content
  recencyDecay: number;   // 0.95 decay factor
}

interface RAGResult {
  pageId: string;
  pageTitle: string;
  chunkText: string;
  similarity: number;
  isVerified: boolean;
  score: number;  // Final ranked score
}

@Injectable()
export class RAGService {
  private config: RAGConfig = {
    chunkSize: 512,
    chunkOverlap: 50,
    topK: 5,
    verifiedBoost: 1.5,
    recencyDecay: 0.95,
  };

  constructor(
    private prisma: PrismaService,
    private byoai: ByoaiService,
  ) {}

  /**
   * Generate embeddings for a KB page
   */
  async generateEmbeddings(
    workspaceId: string,
    pageId: string,
  ): Promise<void> {
    // 1. Get page content
    const page = await this.prisma.knowledgePage.findUnique({
      where: { id: pageId },
      select: { contentText: true },
    });

    if (!page) throw new Error('Page not found');

    // 2. Chunk content
    const chunks = this.chunkText(page.contentText);

    // 3. Delete existing embeddings
    await this.prisma.pageEmbedding.deleteMany({
      where: { pageId },
    });

    // 4. Generate embeddings using workspace's BYOAI
    const embeddings = await this.byoai.embed(workspaceId, chunks);

    // 5. Store embeddings with raw SQL for pgvector
    for (let i = 0; i < chunks.length; i++) {
      await this.prisma.$executeRaw`
        INSERT INTO "PageEmbedding" (id, "pageId", "chunkIndex", "chunkText", embedding, "createdAt")
        VALUES (
          ${crypto.randomUUID()},
          ${pageId},
          ${i},
          ${chunks[i]},
          ${embeddings[i]}::vector,
          NOW()
        )
      `;
    }
  }

  /**
   * Query KB using RAG
   */
  async query(
    workspaceId: string,
    queryText: string,
    options?: { topK?: number; boostVerified?: boolean },
  ): Promise<RAGResult[]> {
    const topK = options?.topK ?? this.config.topK;
    const boostVerified = options?.boostVerified ?? true;

    // 1. Embed query
    const [queryEmbedding] = await this.byoai.embed(workspaceId, [queryText]);

    // 2. Vector search with pgvector
    const results = await this.prisma.$queryRaw<RAGResult[]>`
      SELECT
        pe.id,
        pe."pageId",
        kp.title as "pageTitle",
        pe."chunkText",
        1 - (pe.embedding <=> ${queryEmbedding}::vector) as similarity,
        kp."isVerified",
        CASE
          WHEN kp."isVerified" AND ${boostVerified}
          THEN (1 - (pe.embedding <=> ${queryEmbedding}::vector)) * ${this.config.verifiedBoost}
          ELSE 1 - (pe.embedding <=> ${queryEmbedding}::vector)
        END as score
      FROM "PageEmbedding" pe
      JOIN "KnowledgePage" kp ON pe."pageId" = kp.id
      WHERE kp."workspaceId" = ${workspaceId}
        AND kp."deletedAt" IS NULL
      ORDER BY score DESC
      LIMIT ${topK}
    `;

    return results;
  }

  /**
   * Get context for a task (used by agents)
   */
  async getContextForTask(
    workspaceId: string,
    taskId: string,
  ): Promise<string> {
    // 1. Get task details
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { phase: { include: { product: true } } },
    });

    if (!task) return '';

    // 2. Search KB for relevant context
    const query = `${task.title} ${task.description || ''}`;
    const results = await this.query(
      workspaceId,
      query,
      { topK: 3, boostVerified: true },
    );

    // 3. Assemble context
    return results
      .map(r => `[${r.isVerified ? '✓ Verified' : 'Unverified'}] ${r.pageTitle}:\n${r.chunkText}`)
      .join('\n\n---\n\n');
  }

  /**
   * Chunk text using sliding window
   */
  private chunkText(text: string): string[] {
    const chunks: string[] = [];
    const words = text.split(/\s+/);

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + this.config.chunkSize, words.length);
      chunks.push(words.slice(start, end).join(' '));
      start += this.config.chunkSize - this.config.chunkOverlap;
    }

    return chunks;
  }
}
```

### Verified Content System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Verified Content System                                 │
│                   (ClickUp Brain-Inspired)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   States:                                                                    │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│   │  Unverified  │───►│   Verified   │───►│   Expired    │                  │
│   │   (default)  │    │ (authoritative)│   │(needs review)│                  │
│   └──────────────┘    └──────────────┘    └──────────────┘                  │
│          ▲                   │                    │                          │
│          │                   │                    │                          │
│          └───────────────────┴────────────────────┘                          │
│                         (re-verification)                                    │
│                                                                              │
│   Verification Flow:                                                         │
│                                                                              │
│   1. Page owner clicks "Mark as Verified"                                   │
│   2. Select expiration: 30 / 60 / 90 days / Never                           │
│   3. Page gets isVerified=true, verifiedAt, verifyExpires                   │
│   4. Visual badge displayed on page                                         │
│   5. RAG search boosts verified content by 1.5x                             │
│   6. Cron job checks for expired verifications daily                        │
│   7. Expired pages → email owner, flag in stale list                        │
│                                                                              │
│   UI Indicators:                                                             │
│   ┌────────────────────────────────────────────┐                            │
│   │  📄 Deployment Process Guide               │                            │
│   │  ✓ Verified · Expires in 45 days           │                            │
│   │                                            │                            │
│   │  This page is marked as authoritative.     │                            │
│   │  AI prioritizes this content in search.    │                            │
│   └────────────────────────────────────────────┘                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Real-Time Collaboration Architecture

### Yjs + Hocuspocus Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Real-Time Collaboration (Yjs)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Client A                 Hocuspocus Server              Client B           │
│   ┌─────────┐              ┌─────────────┐              ┌─────────┐         │
│   │ Tiptap  │              │             │              │ Tiptap  │         │
│   │ Editor  │◄────────────►│  Yjs Doc    │◄────────────►│ Editor  │         │
│   │         │   WebSocket  │  Sync       │   WebSocket  │         │         │
│   │ Y.Doc   │              │             │              │ Y.Doc   │         │
│   └─────────┘              │  Presence   │              └─────────┘         │
│       │                    │  Awareness  │                  │               │
│       │                    │             │                  │               │
│       ▼                    └──────┬──────┘                  ▼               │
│   ┌─────────┐                     │                    ┌─────────┐         │
│   │ IndexedDB│                    │                    │ IndexedDB│         │
│   │ (offline)│                    │                    │ (offline)│         │
│   └─────────┘                     │                    └─────────┘         │
│                                   │                                         │
│                                   ▼                                         │
│                          ┌─────────────┐                                    │
│                          │  PostgreSQL │                                    │
│                          │  yjsState   │                                    │
│                          │  (BLOB)     │                                    │
│                          └─────────────┘                                    │
│                                                                              │
│   Features:                                                                  │
│   • CRDT conflict-free merging                                              │
│   • Cursor presence (see other editors)                                     │
│   • Offline editing with sync on reconnect                                  │
│   • Automatic save every 5 seconds                                          │
│   • Version snapshots on explicit save                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hocuspocus Server Configuration

```typescript
// (proposed) apps/api/src/core-pm/kb/hocuspocus/hocuspocus.service.ts

import { Hocuspocus } from '@hocuspocus/server';
import { Database } from '@hocuspocus/extension-database';
import { Logger } from '@hocuspocus/extension-logger';

export function createHocuspocusServer(prisma: PrismaService) {
  return new Hocuspocus({
    port: 1234,
    extensions: [
      new Logger(),
      new Database({
        // Fetch document from PostgreSQL
        fetch: async ({ documentName }) => {
          const pageId = documentName.replace('kb:', '');
          const page = await prisma.knowledgePage.findUnique({
            where: { id: pageId },
            select: { yjsState: true },
          });
          return page?.yjsState || null;
        },

        // Store document to PostgreSQL
        store: async ({ documentName, state }) => {
          const pageId = documentName.replace('kb:', '');
          await prisma.knowledgePage.update({
            where: { id: pageId },
            data: {
              yjsState: state,
              updatedAt: new Date(),
            },
          });
        },
      }),
    ],

    // Authentication
    onAuthenticate: async ({ token, documentName }) => {
      // Validate JWT token
      const user = await validateToken(token);
      if (!user) throw new Error('Unauthorized');

      // Check page access permissions
      const pageId = documentName.replace('kb:', '');
      const hasAccess = await checkPageAccess(user.id, pageId);
      if (!hasAccess) throw new Error('Forbidden');

      return { user };
    },

    // Presence awareness
    onAwarenessUpdate: async ({ documentName, states }) => {
      // Broadcast cursor positions to other clients
      // States contain: { cursor: { anchor, head }, user: { name, color } }
    },
  });
}
```

### Tiptap Editor Integration

```typescript
// (proposed) apps/web/src/components/kb/editor/CollaborativeEditor.tsx

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';

interface Props {
  pageId: string;
  initialContent?: any;
  onSave?: (content: any) => void;
}

export function CollaborativeEditor({ pageId, initialContent, onSave }: Props) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [ydoc] = useState(() => new Y.Doc());

  useEffect(() => {
    const hocuspocusProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL,
      name: `kb:${pageId}`,
      document: ydoc,
      token: getAuthToken(),
      onSync: () => {
        console.log('Document synced');
      },
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
    };
  }, [pageId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs handles history
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: currentUser.name,
          color: getUserColor(currentUser.id),
        },
      }),
      // Custom extensions for @mentions, #references
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: mentionSuggestion,
      }),
      TaskReference.configure({
        HTMLAttributes: { class: 'task-reference' },
        suggestion: taskReferenceSuggestion,
      }),
    ],
    content: initialContent,
    onUpdate: debounce(({ editor }) => {
      onSave?.(editor.getJSON());
    }, 5000),
  });

  return (
    <div className="kb-editor">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      <PresenceIndicator provider={provider} />
    </div>
  );
}
```

---

## API Architecture

### REST API Endpoints

```yaml
# Project Management APIs
/api/pm:
  /products:
    GET:      List products (with filters, pagination)
    POST:     Create product
    /:id:
      GET:    Get product details
      PUT:    Update product
      DELETE: Soft delete product
      /team:
        GET:    Get team members
        POST:   Add team member
        DELETE: Remove team member
      /phases:
        GET:    List phases
        POST:   Create phase
      /tasks:
        GET:    List tasks (filters, views)
        POST:   Create task
      /docs:
        GET:    Get linked KB pages

  /phases:
    /:id:
      GET:    Get phase details
      PUT:    Update phase
      DELETE: Delete phase
      /start: Start phase
      /complete: Complete phase

  /tasks:
    /:id:
      GET:    Get task details
      PUT:    Update task
      DELETE: Soft delete task
      /assign: Assign task
      /approve: Approve/reject agent output
      /activities: Get activity log

  /views:
    GET:      List saved views
    POST:     Create saved view
    /:id:
      GET:    Get view config
      PUT:    Update view
      DELETE: Delete view

# Knowledge Base APIs
/api/kb:
  /pages:
    GET:      List pages (tree, flat, search)
    POST:     Create page
    /:id:
      GET:    Get page details
      PUT:    Update page
      DELETE: Soft delete page
      /versions:
        GET:  Get version history
        /:v:  Get specific version
      /verify:
        POST: Mark as verified
        DELETE: Remove verification
      /link:
        POST: Link to product
        DELETE: Unlink from product

  /search:
    GET:      Full-text search
    /semantic:
      POST:   RAG/semantic search

  /rag:
    /query:
      POST:   Query with RAG context
    /embed:
      POST:   Generate embeddings for page

  /stale:
    GET:      List stale pages

  /verified:
    GET:      List verified pages
```

### WebSocket Events

```typescript
// Planned Core-PM domain events (pm.* / kb.*).
// Note: these are not yet defined in `packages/shared/src/types/events.ts` and should not be emitted
// until they are (a) added as typed EventTypes and (b) validated at runtime in `packages/shared/src/schemas/events.ts`.
// For Phase 1, reuse existing platform events (approval.*, agent.*) and Socket.io channels where applicable.

// PM Events
'pm.product.created'
'pm.product.updated'
'pm.product.archived'
'pm.product.team_changed'

'pm.phase.started'
'pm.phase.completed'
'pm.phase.blocked'

'pm.task.created'
'pm.task.updated'
'pm.task.state_changed'
'pm.task.assigned'
'pm.task.completed'
'pm.task.approval_needed'
'pm.task.approval_resolved'

'pm.agent.suggestion'
'pm.agent.started'
'pm.agent.progress'
'pm.agent.completed'

'pm.risk.detected'
'pm.health.critical'

// KB Events
'kb.page.created'
'kb.page.updated'
'kb.page.deleted'
'kb.page.moved'
'kb.page.viewed'

'kb.page.verified'
'kb.page.verification_expired'

'kb.page.linked_to_project'
'kb.page.unlinked_from_project'

'kb.embedding.created'
'kb.embedding.updated'

'kb.search.performed'
'kb.rag.query'
'kb.rag.context_used'

'kb.stale.detected'
'kb.comment.created'
```

---

## Security Architecture

### Row Level Security (RLS)

```sql
-- All Core-PM tables have workspace isolation (tenant == workspace)
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Phase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgePage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PageEmbedding" ENABLE ROW LEVEL SECURITY;

-- Product RLS
CREATE POLICY "tenant_isolation" ON "Product"
  USING (workspace_id = current_setting('app.tenant_id', true)::uuid);

-- Task RLS (inherits from Product via Phase)
CREATE POLICY "tenant_isolation" ON "Task"
  USING (workspace_id = current_setting('app.tenant_id', true)::uuid);

-- KnowledgePage RLS
CREATE POLICY "tenant_isolation" ON "KnowledgePage"
  USING (workspace_id = current_setting('app.tenant_id', true)::uuid);

-- PageEmbedding RLS (via page)
CREATE POLICY "tenant_isolation" ON "PageEmbedding"
  USING (
    page_id IN (
      SELECT id FROM "KnowledgePage"
      WHERE workspace_id = current_setting('app.tenant_id', true)::uuid
    )
  );
```

### Permission Model

```typescript
// PM Permissions
enum PMPermission {
  // Product
  PRODUCT_VIEW = 'pm:product:view',
  PRODUCT_CREATE = 'pm:product:create',
  PRODUCT_UPDATE = 'pm:product:update',
  PRODUCT_DELETE = 'pm:product:delete',
  PRODUCT_MANAGE_TEAM = 'pm:product:manage_team',

  // Task
  TASK_VIEW = 'pm:task:view',
  TASK_CREATE = 'pm:task:create',
  TASK_UPDATE = 'pm:task:update',
  TASK_DELETE = 'pm:task:delete',
  TASK_ASSIGN = 'pm:task:assign',
  TASK_APPROVE = 'pm:task:approve',

  // Phase
  PHASE_CREATE = 'pm:phase:create',
  PHASE_UPDATE = 'pm:phase:update',
  PHASE_DELETE = 'pm:phase:delete',
}

// KB Permissions
enum KBPermission {
  PAGE_VIEW = 'kb:page:view',
  PAGE_CREATE = 'kb:page:create',
  PAGE_UPDATE = 'kb:page:update',
  PAGE_DELETE = 'kb:page:delete',
  PAGE_VERIFY = 'kb:page:verify',
  PAGE_LINK = 'kb:page:link',

  RAG_QUERY = 'kb:rag:query',
  SETTINGS_UPDATE = 'kb:settings:update',
}

// Role → Permission mapping
const ROLE_PERMISSIONS = {
  PRODUCT_LEAD: [
    ...Object.values(PMPermission),
    ...Object.values(KBPermission),
  ],
  DEVELOPER: [
    'pm:product:view', 'pm:task:view', 'pm:task:create',
    'pm:task:update', 'kb:page:view', 'kb:page:create',
    'kb:page:update', 'kb:rag:query',
  ],
  STAKEHOLDER: [
    'pm:product:view', 'pm:task:view',
    'kb:page:view', 'kb:rag:query',
  ],
};
```

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Task list load | <500ms P95 | With pagination, 50 items |
| Kanban board render | <800ms P95 | Including WebSocket setup |
| KB page load | <400ms P95 | Without Yjs sync |
| Yjs sync latency | <100ms P95 | Real-time collaboration |
| RAG query | <1s P95 | Vector search + LLM |
| Search (FTS) | <300ms P95 | PostgreSQL tsvector |
| Search (semantic) | <800ms P95 | pgvector similarity |

### Scalability Targets

| Dimension | MVP | Growth |
|-----------|-----|--------|
| Products per tenant | 50 | 500 |
| Tasks per product | 10,000 | 100,000 |
| KB pages per workspace | 1,000 | 50,000 |
| Embeddings per tenant | 100,000 | 5,000,000 |
| Concurrent KB editors | 10 | 100 |
| Agent executions/min | 10 | 100 |

### Optimization Strategies

```typescript
// 1. Denormalization for read performance
// Product stores aggregated task counts
await prisma.product.update({
  where: { id: productId },
  data: {
    totalTasks: { increment: 1 },
    lastActivityAt: new Date(),
  },
});

// 2. Materialized views for analytics
CREATE MATERIALIZED VIEW mv_product_metrics AS
SELECT
  p.id as product_id,
  COUNT(t.id) as total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'DONE') as completed_tasks,
  SUM(t.story_points) as total_points
FROM "Product" p
LEFT JOIN "Phase" ph ON p.id = ph.product_id
LEFT JOIN "Task" t ON ph.id = t.phase_id
GROUP BY p.id;

-- Refresh nightly
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_metrics;

// 3. Embedding index for vector search
CREATE INDEX idx_page_embedding_vector
ON "PageEmbedding"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

// 4. Connection pooling for Hocuspocus
// Use PgBouncer for high-concurrency KB editing

// 5. Redis caching for frequently accessed data
const cacheKey = `product:${productId}:metrics`;
let metrics = await redis.get(cacheKey);
if (!metrics) {
  metrics = await computeMetrics(productId);
  await redis.setex(cacheKey, 300, JSON.stringify(metrics)); // 5 min TTL
}
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Production Deployment                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Load Balancer (Nginx)                         │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                          │
│           ┌───────────────────────┼───────────────────────┐                 │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│   ┌───────────────┐       ┌───────────────┐       ┌───────────────┐        │
│   │   Next.js     │       │   NestJS      │       │  Hocuspocus   │        │
│   │   Frontend    │       │   API         │       │  (Yjs Sync)   │        │
│   │   (Vercel)    │       │   (K8s)       │       │   (K8s)       │        │
│   └───────────────┘       └───────────────┘       └───────────────┘        │
│                                   │                       │                 │
│                                   ▼                       │                 │
│   ┌───────────────────────────────────────────────────────┼─────────────┐   │
│   │                                                       │             │   │
│   │   ┌───────────────┐   ┌───────────────┐              │             │   │
│   │   │  PostgreSQL   │   │    Redis      │              │             │   │
│   │   │  + pgvector   │   │  (Queue)      │◄─────────────┘             │   │
│   │   │  (RDS)        │   │  (ElastiCache)│                            │   │
│   │   └───────────────┘   └───────────────┘                            │   │
│   │                                                                     │   │
│   │   ┌───────────────┐   ┌───────────────┐                            │   │
│   │   │  Agent Runner │   │   BullMQ      │                            │   │
│   │   │  (Python/K8s) │   │   Workers     │                            │   │
│   │   └───────────────┘   └───────────────┘                            │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Project Management as Platform Core

**Status:** Accepted

**Context:** PM was initially planned as an optional module (BM-PM). Analysis revealed that all business modules depend on PM infrastructure for orchestration.

**Decision:** Elevate PM from optional module to Platform Core (Core-PM). PM is always available and cannot be disabled.

**Consequences:**
- (+) All modules can rely on PM infrastructure
- (+) Consistent task/project model across platform
- (+) Agent teams managed centrally
- (-) Larger initial deployment footprint
- (-) Cannot run platform without PM

---

### ADR-002: Knowledge Base as Core Component

**Status:** Accepted

**Context:** Knowledge management is essential for AI context. Scattering knowledge across modules reduces AI effectiveness.

**Decision:** Include Knowledge Base as part of Core-PM, not a separate module.

**Consequences:**
- (+) RAG context available to all agents
- (+) Single source of truth for organizational knowledge
- (+) Real-time collaboration on documentation
- (-) Increased complexity in Core-PM
- (-) KB development blocks some PM features

---

### ADR-003: Yjs + Hocuspocus for Real-Time Collaboration

**Status:** Accepted

**Context:** KB pages need real-time collaborative editing like Google Docs.

**Alternatives Considered:**
1. Operational Transformation (OT) - Complex to implement correctly
2. Custom CRDT - Too much engineering effort
3. Yjs + Hocuspocus - Battle-tested, open source, Tiptap integration

**Decision:** Use Yjs (CRDT library) with Hocuspocus (sync server).

**Consequences:**
- (+) Conflict-free real-time editing
- (+) Offline support with sync on reconnect
- (+) Cursor presence out of the box
- (+) Proven at scale (used by Plane, Outline)
- (-) Additional infrastructure (Hocuspocus server)
- (-) Learning curve for Yjs concepts

---

### ADR-004: pgvector for RAG Embeddings

**Status:** Accepted

**Context:** RAG requires vector storage for semantic search.

**Alternatives Considered:**
1. Pinecone - Managed, expensive, vendor lock-in
2. Weaviate - Feature-rich, separate infrastructure
3. pgvector - PostgreSQL extension, simpler ops

**Decision:** Use pgvector extension in PostgreSQL.

**Consequences:**
- (+) Single database for all data
- (+) RLS works on embeddings
- (+) Simpler operations
- (+) Cost-effective
- (-) Less specialized than vector DBs
- (-) May need tuning for large scale

---

### ADR-005: Verified Content System for RAG Quality

**Status:** Accepted

**Context:** AI responses are only as good as their context. Need to prioritize authoritative content.

**Decision:** Implement "Verified Content" system inspired by ClickUp Brain Verified Wiki.

**Consequences:**
- (+) Higher quality AI responses
- (+) Clear content authority
- (+) Encourages content maintenance
- (-) Requires verification workflow
- (-) Additional UX for page owners

---

## Related Documents

- [PRD.md](./PRD.md) - Product Requirements Document
- [Platform Architecture](../../architecture.md) - Overall platform architecture
- [BMAD Workflows](../../../.bmad/) - BMAD workflows/configuration (repo folder)
- [Agent Patterns](./research/sdk-layer-integration.md) - Remote coding agent integration patterns

---

**Changelog:**

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-16 | Major revision: PM as Platform Core, KB integration |
| 1.0 | 2025-11-28 | Initial architecture based on Taskosaur/Plane research |
