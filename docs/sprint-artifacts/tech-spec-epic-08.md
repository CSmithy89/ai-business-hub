# Epic Technical Specification: Business Onboarding & Foundation Modules

Date: 2025-12-04
Author: claude (epic-tech-context workflow)
Epic ID: EPIC-08
Status: Draft

---

## Overview

Epic 08 implements the **Business Onboarding System** - HYVVE's first-run experience that guides users through validating, planning, and branding their business using three AI agent teams (BMV, BMP, BM-Brand). This epic creates a two-level dashboard architecture where users manage a portfolio of businesses, then dive deep into each business through AI-guided workflows.

This is the **first business-facing epic** - all prior epics (00-07) were platform infrastructure. Epic 08 introduces the concept of "Businesses" as first-class entities and demonstrates the 90/5 Promise through intelligent AI-assisted workflows with human-in-the-loop approvals for strategic decisions.

**Business Value:**
- Enables the core value proposition: AI-guided business creation
- Implements the 90/5 Promise for business planning (90% automated, ~5 hours human involvement)
- Creates reusable foundation for all future businesses on the platform
- Demonstrates Agno team coordination across validation, planning, and branding

## Objectives and Scope

### In Scope

**Foundation Infrastructure (Stories 08.1-08.4):**
- Business entity database model with onboarding status tracking
- ValidationSession, PlanningSession, BrandingSession models for agent data
- Portfolio Dashboard showing all user's businesses with status cards
- Onboarding wizard (4 steps) for capturing business basics
- Document upload and AI extraction pipeline

**Validation Team - BMV (Stories 08.5-08.11):**
- Agno Team configuration with Vera (leader) + 4 specialists
- Validation chat interface with real-time agent responses
- Idea intake workflow (structured business concept capture)
- Market sizing workflow (TAM/SAM/SOM with 2+ source requirement)
- Competitor mapping workflow (positioning analysis)
- Customer discovery workflow (ICP and JTBD development)
- Validation synthesis workflow (go/no-go recommendation with HITL)

**Planning Team - BMP (Stories 08.12-08.16):**
- Agno Team configuration with Blake (leader) + 4 specialists
- Planning page with workflow progress tracking
- Business Model Canvas interactive generation
- Financial projections (3 scenarios: Conservative/Realistic/Optimistic)
- Business plan synthesis (investor-ready document)

**Branding Team - BM-Brand (Stories 08.17-08.21):**
- Agno Team configuration with Bella (leader) + 5 specialists
- Branding page with visual identity preview
- Brand strategy and voice guidelines workflows
- Visual identity specification (colors, typography, logo concept)
- Asset generation workflow (production-ready deliverables)

**Integration & Handoff (Stories 08.22-08.23):**
- Module handoff workflows (BMV → BMP → Brand)
- Event-driven phase transitions
- Onboarding completion and handoff to operational modules

### Out of Scope

- Business Model Validation (BMV) advanced workflows (product-fit-analysis, quick-validation)
- BMP advanced workflows (pitch-deck, multi-product-planning, export-to-development)
- BM-Brand advanced workflows (brand-audit)
- Logo generation via AI image models (use concept descriptions for MVP)
- Business collaboration features (team access to specific business)
- Business templates or industry presets
- CRM module (BM-CRM) - future epic
- Project Management module (BM-PM) - future epic

## System Architecture Alignment

This epic extends the architecture with the **two-level dashboard pattern** and **Agno team coordination**:

**Two-Level Dashboard Architecture:**
```
/dashboard                          ← Portfolio Dashboard (no business context)
└── /dashboard/[businessId]         ← Business Dashboard (business context)
    ├── /overview                   ← Module status overview
    ├── /validation                 ← BMV chat + validation progress
    ├── /planning                   ← BMP chat + business plan
    ├── /branding                   ← BM-Brand chat + brand assets
    └── /settings                   ← Business-specific settings
```

**AgentOS Team Integration (ADR-007):**
- Three Agno Teams deployed in AgentOS (BMV, BMP, BM-Brand)
- Leader-based delegation (leader coordinates specialist agents)
- PostgreSQL storage for agent sessions and memories
- JWT passthrough from better-auth for workspace context
- SSE streaming for real-time agent responses

**Event Flow:**
```
validation.completed → planning.session.init → planning.completed → branding.session.init → branding.completed → business.onboarding.complete
```

**Database Extensions:**
- New tenant-scoped tables: Business, ValidationSession, PlanningSession, BrandingSession, OnboardingDocument, ValidationSource
- Foreign key relationships to Workspace (tenant isolation)
- JSON columns for flexible agent output storage

---

## Detailed Design

### Services and Modules

| Service/Component | Responsibility | Inputs | Outputs | Owner |
|-------------------|----------------|--------|---------|-------|
| **Business Service** (Next.js API) | Business CRUD, onboarding orchestration | HTTP requests | Business entities | Backend |
| **Validation Team** (AgentOS) | BMV workflows, market research, go/no-go | User messages, business context | Validation score, recommendation | AI/Backend |
| **Planning Team** (AgentOS) | BMP workflows, business model, financials | Validated data, user messages | Business plan, canvas, projections | AI/Backend |
| **Branding Team** (AgentOS) | BM-Brand workflows, visual identity, assets | Business plan, user preferences | Brand guidelines, assets | AI/Backend |
| **Document Extraction** (Next.js API) | Upload, parse, extract business data | PDF/DOCX files | Structured business data | Backend |
| **Portfolio UI** (Next.js) | Business cards, navigation, status | Business list | Interactive dashboard | Frontend |
| **Business Dashboard** (Next.js) | Module navigation, progress tracking | Business ID, module status | Tabbed interface | Frontend |
| **Chat Interfaces** (Next.js) | Real-time agent communication | User messages | Agent responses (SSE) | Frontend |

### Data Models and Contracts

**Story 08.1 - Business Onboarding Database Models:**

```prisma
// Core business entity
model Business {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  userId          String   @map("user_id")  // Creator

  // Basic info
  name            String
  description     String?  @db.Text
  industry        String?
  stage           BusinessStage @default(IDEA)

  // Onboarding tracking
  onboardingStatus    OnboardingStatus @default(WIZARD)
  onboardingProgress  Int @default(0)  // 0-100

  // Module status
  validationStatus  ModuleStatus @default(NOT_STARTED)
  planningStatus    ModuleStatus @default(NOT_STARTED)
  brandingStatus    ModuleStatus @default(NOT_STARTED)

  // Validation outputs
  validationScore          Int?     // 0-100
  validationRecommendation ValidationRecommendation?

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  validationData  ValidationSession?
  planningData    PlanningSession?
  brandingData    BrandingSession?
  documents       OnboardingDocument[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
  @@index([userId])
  @@map("businesses")
}

enum BusinessStage {
  IDEA
  VALIDATION
  MVP
  GROWTH
  SCALE
}

enum OnboardingStatus {
  WIZARD
  VALIDATION
  PLANNING
  BRANDING
  COMPLETE
}

enum ModuleStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETE
}

enum ValidationRecommendation {
  GO
  CONDITIONAL_GO
  PIVOT
  NO_GO
}

// BMV - Validation Session
model ValidationSession {
  id              String   @id @default(cuid())
  businessId      String   @unique @map("business_id")

  // Idea Intake (Story 08.7)
  ideaDescription     String?  @db.Text
  problemStatement    String?  @db.Text
  targetCustomer      String?  @db.Text
  proposedSolution    String?  @db.Text
  initialHypothesis   Json?    // { value_proposition, revenue_model }

  // Market Sizing (Story 08.8)
  tam                 Json?    // { value, formatted, methodology, confidence, sources[] }
  sam                 Json?
  som                 Json?

  // Competitor Mapping (Story 08.9)
  competitors         Json?    // [{ name, type, pricing, features, strengths, weaknesses, source_url }]
  positioningMap      Json?    // { axes: [], positions: [] }
  opportunityGaps     Json?    // []

  // Customer Discovery (Story 08.10)
  icps                Json?    // [{ name, company_size, industry, personas[] }]

  // Validation Synthesis (Story 08.11)
  validationScore     Int?
  recommendation      ValidationRecommendation?
  strengths           Json?
  risks               Json?    // [{ risk, severity, mitigation }]
  nextSteps           Json?

  // Workflow tracking
  completedWorkflows  String[]  @default([])
  agentSessionId      String?   @map("agent_session_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  sources  ValidationSource[]

  @@index([businessId])
  @@map("validation_sessions")
}

// Anti-hallucination tracking
model ValidationSource {
  id        String @id @default(cuid())
  sessionId String @map("session_id")

  claimType String  @map("claim_type")  // market_size, competitor, customer
  claim     String  @db.Text
  sourceUrl String  @map("source_url")
  sourceName String @map("source_name")
  sourceDate DateTime @map("source_date")
  confidence String  // high, medium, low

  createdAt DateTime @default(now()) @map("created_at")

  session ValidationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("validation_sources")
}

// BMP - Planning Session
model PlanningSession {
  id              String   @id @default(cuid())
  businessId      String   @unique @map("business_id")

  // Business Model Canvas (Story 08.14)
  canvas          Json?    // { customer_segments, value_propositions, channels, ... }

  // Financial Projections (Story 08.15)
  financials      Json?    // { revenue, costs, pnl, cash_flow, unit_economics }

  // Business Plan (Story 08.16)
  businessPlanUrl String?  @map("business_plan_url")

  // Workflow tracking
  completedWorkflows  String[]  @default([])
  agentSessionId      String?   @map("agent_session_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@map("planning_sessions")
}

// BM-Brand - Branding Session
model BrandingSession {
  id              String   @id @default(cuid())
  businessId      String   @unique @map("business_id")

  // Brand Strategy (Story 08.19)
  positioning     Json?    // { archetype, values, personality, positioning_statement, taglines }
  voiceGuidelines Json?    // { tone, vocabulary_dos, vocabulary_donts, messaging_templates, content_pillars }

  // Visual Identity (Story 08.20)
  visualIdentity  Json?    // { colors, typography, logo_concept }

  // Generated Assets (Story 08.21)
  generatedAssets Json?    // [{ type, name, url, size, format }]
  assetPackageUrl String?  @map("asset_package_url")
  guidelinesUrl   String?  @map("guidelines_url")

  // Workflow tracking
  completedWorkflows  String[]  @default([])
  agentSessionId      String?   @map("agent_session_id")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@map("branding_sessions")
}

// Document upload tracking
model OnboardingDocument {
  id         String @id @default(cuid())
  businessId String @map("business_id")

  fileName     String  @map("file_name")
  fileUrl      String  @map("file_url")
  fileType     String  @map("file_type")  // pdf, docx, md
  fileSize     Int     @map("file_size")

  // Extraction results
  extractedData  Json?   @map("extracted_data")
  extractionStatus String @default("pending") @map("extraction_status")
  extractionError String? @map("extraction_error") @db.Text

  uploadedAt DateTime @default(now()) @map("uploaded_at")

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@index([businessId])
  @@map("onboarding_documents")
}
```

### APIs and Interfaces

**Business API (Next.js API Routes):**

| Method | Path | Request | Response | Auth |
|--------|------|---------|----------|------|
| GET | `/api/businesses` | - | `{ data: Business[] }` | Required |
| POST | `/api/businesses` | `{ name, description, industry, stage }` | `{ data: Business }` | Required |
| GET | `/api/businesses/:id` | - | `{ data: Business }` | Required |
| PATCH | `/api/businesses/:id` | `{ name?, description?, ... }` | `{ data: Business }` | Required |
| DELETE | `/api/businesses/:id` | - | `{ success: true }` | Required |
| POST | `/api/businesses/:id/documents` | FormData (file upload) | `{ data: OnboardingDocument }` | Required |

**AgentOS Team API:**

| Method | Path | Request | Response | Auth |
|--------|------|---------|----------|------|
| POST | `/teams/bmv/chat` | `{ business_id, message, session_id? }` | `{ response, agent_name }` | Required |
| POST | `/teams/bmv/chat/stream` | `{ business_id, message, session_id? }` | SSE stream | Required |
| GET | `/teams/bmv/sessions/:sessionId/history` | - | `{ messages: [] }` | Required |
| POST | `/teams/bmp/chat` | `{ business_id, message, session_id? }` | `{ response, agent_name }` | Required |
| POST | `/teams/bmp/chat/stream` | `{ business_id, message, session_id? }` | SSE stream | Required |
| POST | `/teams/branding/chat` | `{ business_id, message, session_id? }` | `{ response, agent_name }` | Required |
| POST | `/teams/branding/chat/stream` | `{ business_id, message, session_id? }` | SSE stream | Required |

**Agent Response Format:**

```typescript
interface ChatResponse {
  response: string;           // Agent's response text
  agent_name: string;         // e.g., "Vera", "Marco", "Blake"
  agent_role?: string;        // e.g., "Validation Orchestrator"
  workflow?: string;          // Current workflow being executed
  requires_approval?: boolean; // If action needs HITL
  approval_item_id?: string;  // If approval was created
  metadata?: {
    confidence?: number;      // Agent confidence in response
    sources?: SourceRef[];    // Citations for claims
    next_steps?: string[];    // Suggested user actions
  };
}

interface SourceRef {
  name: string;
  url: string;
  date: string;
}
```

### Workflows and Sequencing

**User Journey - Validation Phase:**

```
1. User creates business on Portfolio Dashboard
   ├── POST /api/businesses
   ├── Business record created with status=WIZARD
   └── Redirect to /dashboard/[businessId]/validation

2. Onboarding wizard guides through 4 steps
   ├── Step 1: Business name & description
   ├── Step 2: Industry & stage
   ├── Step 3: Initial idea capture
   └── Step 4: Document upload (optional)

3. User opens Validation page
   ├── ValidationSession created if not exists
   ├── AgentOS team initialized (Vera + specialists)
   └── Chat interface ready

4. Idea Intake Workflow (Story 08.7)
   ├── User chats with Vera
   ├── Vera asks clarifying questions
   ├── Marco/Cipher/Persona provide specialist insights
   ├── Structured data saved to ValidationSession.ideaDescription
   └── Workflow marked complete

5. Market Sizing Workflow (Story 08.8)
   ├── User requests market analysis
   ├── Vera delegates to Marco (market researcher)
   ├── Marco researches TAM/SAM/SOM with 2+ sources
   ├── Sources saved to ValidationSource table
   ├── Results saved to ValidationSession.tam/sam/som
   └── Workflow marked complete

6. Parallel Workflows (Stories 08.9, 08.10)
   ├── Competitor Mapping (Cipher)
   ├── Customer Discovery (Persona)
   └── Results saved to ValidationSession

7. Validation Synthesis (Story 08.11)
   ├── User requests final recommendation
   ├── Risk agent synthesizes all findings
   ├── Calculates validation score (0-100)
   ├── Generates go/no-go recommendation
   ├── Creates HITL approval item (if needed)
   ├── User approves/rejects recommendation
   └── On approval: emit validation.completed event

8. Module Handoff (Story 08.22)
   ├── Event handler catches validation.completed
   ├── Business.onboardingStatus → PLANNING
   ├── Emit planning.session.init event
   └── User navigated to Planning page
```

**Event-Driven Phase Transitions:**

```
Event: validation.completed
├── Trigger: User approves validation synthesis
├── Handler: Validation handoff handler
├── Actions:
│   ├── Update Business.onboardingStatus = PLANNING
│   ├── Update Business.validationScore
│   ├── Update Business.validationRecommendation
│   ├── Create PlanningSession if not exists
│   ├── Transfer validated data to planning context
│   └── Emit planning.session.init
└── Result: User can access Planning page

Event: planning.completed
├── Trigger: Business plan synthesis approved
├── Handler: Planning handoff handler
├── Actions:
│   ├── Update Business.onboardingStatus = BRANDING
│   ├── Create BrandingSession if not exists
│   ├── Transfer business model data to branding context
│   └── Emit branding.session.init
└── Result: User can access Branding page

Event: branding.completed
├── Trigger: Asset generation complete
├── Handler: Branding handoff handler
├── Actions:
│   ├── Update Business.onboardingStatus = COMPLETE
│   ├── Update Business validation/planning/branding status = COMPLETE
│   ├── Emit business.onboarding.complete
│   └── Show completion celebration UI
└── Result: Business ready for operational modules
```

---

## Architecture Decisions

### AD-08.1: Two-Level Dashboard Pattern

**Context:** Users will manage multiple businesses; each business has multiple modules.

**Decision:** Implement two-level dashboard architecture:
- Portfolio Dashboard (`/dashboard`) - No business context, shows all businesses
- Business Dashboard (`/dashboard/[businessId]/*`) - Business context, module navigation

**Rationale:**
- Clear separation between portfolio management and business operations
- Business context (ID) in URL enables deep linking to specific business modules
- Follows SaaS patterns (Stripe: /customers → /customers/[id], Linear: /projects → /projects/[id])

**Consequences:**
- Need Business Switcher in sidebar for quick navigation
- Business context must be passed to all API calls from Business Dashboard
- Portfolio Dashboard has no workspace_id in URL (derived from session)

### AD-08.2: Agent Teams Use Leader-Based Delegation

**Context:** Each foundation module has 4-6 specialist agents.

**Decision:** Use Agno's `mode="coordinate"` with leader-based delegation (`delegate_task_to_all_members=False`).

**Rationale:**
- Leader agent (Vera/Blake/Bella) provides consistent user interface
- Leader decides when to delegate to specialists
- Avoids overwhelming user with multiple agent voices simultaneously
- Aligns with BMAD module definitions (orchestrator + specialists)

**Consequences:**
- Leader agent instructions must include delegation logic
- Specialist agents must be configured with clear role boundaries
- User primarily interacts with leader; specialist contributions are synthesized

### AD-08.3: Anti-Hallucination via ValidationSource Table

**Context:** AI agents must provide verifiable claims for market data, competitor info.

**Decision:** Create dedicated `ValidationSource` table with:
- Required source URL and date for all claims
- Minimum 2 sources for market sizing claims
- Confidence levels (high/medium/low) based on source quality

**Rationale:**
- Prevents hallucinated market sizes or competitor features
- Audit trail for all validation claims
- Enables "show sources" UI feature
- Enforces BMAD BMV anti-hallucination standards

**Consequences:**
- Marco agent must be instructed to always save sources
- UI must display source citations alongside claims
- Agents cannot make claims without providing sources

### AD-08.4: Business Plan Documents Stored in Supabase Storage

**Context:** Business plans, pitch decks, brand guidelines are large documents.

**Decision:** Store generated documents in Supabase Storage, save URLs in session tables.

**Rationale:**
- Database should not store large binary/text blobs
- Supabase Storage provides CDN, versioning, access control
- Document URLs are shareable and directly downloadable

**Consequences:**
- Need to configure Supabase Storage bucket for business documents
- URL signing may be required for private documents
- Document generation workflow must upload to storage, then save URL

### AD-08.5: Module Handoff Uses Event Bus

**Context:** Validation → Planning → Branding transitions need orchestration.

**Decision:** Use event bus (from Epic 05) for module handoffs:
- `validation.completed` → triggers planning init
- `planning.completed` → triggers branding init
- `branding.completed` → triggers onboarding complete

**Rationale:**
- Decouples modules (validation doesn't know about planning implementation)
- Event handlers can be extended for new modules (e.g., BM-PM)
- Enables async processing (e.g., asset generation in background)
- Follows existing event architecture from Epic 05

**Consequences:**
- Event handlers must be idempotent (handle duplicate events)
- Need to handle partial handoffs (user skips a module)
- Event replay (Epic 05-6) enables recovery from failed handoffs

---

## Non-Functional Requirements

### Performance

| Metric | Target | Source |
|--------|--------|--------|
| Portfolio Dashboard load time (10 businesses) | < 1.5 seconds | NFR-P1 (< 2.5s LCP) |
| Business Dashboard load time | < 1.5 seconds | NFR-P1 |
| Agent chat response start (streaming) | < 2 seconds | User experience |
| Agent chat full response | < 30 seconds | User patience threshold |
| Document upload (10MB) | < 5 seconds | User experience |
| Document extraction (10MB PDF) | < 15 seconds | Acceptable for background task |
| Market sizing workflow (Marco) | < 2 minutes | Research tasks are slower |
| Business plan generation | < 3 minutes | Complex synthesis task |

### Security

| Requirement | Implementation | Reference |
|-------------|----------------|-----------|
| Business tenant isolation | `Business.workspaceId` with RLS | Epic 03 (RBAC & Multi-tenancy) |
| Agent session isolation | `agentSessionId` scoped to workspace | ADR-007 (AgentOS) |
| Document access control | Signed URLs from Supabase Storage | NFR-S1 (encryption at rest) |
| AI provider key isolation | Per-workspace BYOAI config | Epic 06 (BYOAI) |

### Reliability/Availability

| Requirement | Implementation |
|-------------|----------------|
| Graceful agent failures | Retry 3x, fallback to generic error message |
| Document upload failures | Client-side retry, progress indicator |
| Module handoff failures | Event replay from Epic 05-6 |
| Session state recovery | Agent sessions persist to PostgreSQL |

### Observability

| Signal | Implementation | Story |
|--------|----------------|-------|
| Business creation events | Audit log entry | 08.2 |
| Agent team invocations | Event log with team_type | 08.5 |
| Validation sources tracked | ValidationSource table | 08.8 |
| Module transitions | Event bus events | 08.22 |
| Agent errors | Exception logs + user notifications | All agent stories |

---

## Dependencies and Integrations

### Upstream Dependencies (Must Complete First)

| Epic | Dependency | Required For |
|------|------------|--------------|
| **EPIC-00** | Database (Prisma) | Business models (Story 08.1) |
| **EPIC-00** | Next.js frontend | Portfolio/Business dashboards (08.2, 08.3) |
| **EPIC-00** | AgentOS runtime | Agent teams (08.5, 08.12, 08.17) |
| **EPIC-01** | Authentication | User context for businesses (08.2) |
| **EPIC-02** | Workspace management | Tenant context for businesses (08.1) |
| **EPIC-04** | Approval queue | HITL for validation synthesis (08.11) |
| **EPIC-05** | Event bus | Module handoffs (08.22) |
| **EPIC-06** | BYOAI configuration | AI models for agent teams (08.5+) |
| **EPIC-07** | UI shell | Navigation, sidebar (08.2) |

### Downstream Impacts (Will Use This Epic)

| Future Epic | Dependency on Epic 08 |
|-------------|----------------------|
| **BM-CRM** | Business entity as container for CRM data |
| **BM-PM** | Business entity as container for projects/products |
| **BM-Content** | Brand guidelines for content generation |
| **BM-Finance** | Financial projections as baseline for accounting |

### External Services

| Service | Purpose | Story |
|---------|---------|-------|
| Supabase Storage | Document storage (uploads, generated docs) | 08.4 |
| Agno Cloud (os.agno.com) | Agent monitoring (Control Plane) | 08.5+ |
| OpenAI/Claude/etc | AI models for agent responses | 08.5+ (via BYOAI) |

### Shared Package Dependencies

| Package | Usage |
|---------|-------|
| `packages/db` | Business models, sessions, Prisma client |
| `packages/shared` | Business types, event types |
| `packages/ui` | Chat components, cards, forms |

---

## Acceptance Criteria (Authoritative)

### AC-08.1: Business Onboarding Database Models
1. Business table exists with all specified columns and relationships
2. ValidationSession, PlanningSession, BrandingSession tables exist
3. OnboardingDocument and ValidationSource tables exist
4. All enums (BusinessStage, OnboardingStatus, ModuleStatus, ValidationRecommendation) are defined
5. Foreign keys to Workspace enforce tenant isolation
6. Migrations run successfully without errors
7. Prisma Client generates types for all new models

### AC-08.2: Portfolio Dashboard with Business Cards
1. `/dashboard` route displays all user's businesses
2. Business cards show: name, description, status, validation score (if available)
3. "Add Business" CTA card is prominent
4. Clicking business card navigates to `/dashboard/[businessId]/overview`
5. Empty state displays when user has no businesses
6. Business Switcher dropdown in sidebar shows all businesses
7. Loading state displays while fetching businesses

### AC-08.3: Onboarding Wizard UI
1. Wizard displays 4 steps with progress indicator
2. Step 1: Captures business name and description
3. Step 2: Captures industry and stage
4. Step 3: Captures initial idea (problem/solution)
5. Step 4: Offers document upload (optional, can skip)
6. Back navigation works between steps
7. Wizard state persists (can resume if abandoned)
8. On completion: Business record created, user redirected to Validation page

### AC-08.4: Document Upload and Extraction Pipeline
1. File upload component accepts PDF, DOCX, MD
2. File validation checks size (<10MB) and type
3. Upload progress indicator displays
4. Uploaded documents create OnboardingDocument records
5. Extraction endpoint parses document and extracts business data
6. Extraction results display with confidence scores
7. Gap analysis shows missing sections
8. User can edit extracted data before accepting

### AC-08.5: Validation Team Agno Configuration
1. ValidationTeam class exists in AgentOS (`agents/validation/team.py`)
2. Team has Vera as leader and Marco, Cipher, Persona, Risk as members
3. Team storage configured with PostgreSQL
4. HITL tool is available to agents for approval requests
5. Agent instructions include anti-hallucination rules (2+ sources)
6. Team can be invoked via `/teams/bmv/chat` endpoint
7. Workspace context is injected via tenant middleware

### AC-08.6: Validation Chat Interface
1. `/dashboard/[businessId]/validation` page exists
2. Chat interface displays with Vera as primary responder
3. SSE streaming shows real-time agent responses
4. Agent name displays for each message
5. Workflow progress indicator shows completed/current workflows
6. Key findings summary panel updates as workflows complete
7. User can send messages via text input

### AC-08.7: Idea Intake Workflow
1. Vera asks clarifying questions about business idea
2. Questions cover: problem, customer, solution, business model
3. Structured data is saved to `ValidationSession.ideaDescription`
4. User can view and edit captured idea
5. Workflow completion triggers availability of market sizing
6. `completedWorkflows` includes "idea-intake"

### AC-08.8: Market Sizing Workflow
1. Marco agent calculates TAM, SAM, SOM
2. Each market size has: value, formatted string, methodology, confidence
3. Minimum 2 sources required for each claim
4. Sources saved to ValidationSource table with URL and date
5. Sources must be < 24 months old
6. UI displays market sizes with source citations
7. `completedWorkflows` includes "market-sizing"

### AC-08.9: Competitor Mapping Workflow
1. Cipher identifies direct, indirect competitors, substitutes
2. Each competitor has: name, type, pricing, features, strengths, weaknesses
3. All claims require source URLs
4. Positioning map data generated (axes, positions)
5. Opportunity gaps identified
6. Results saved to `ValidationSession.competitors`
7. `completedWorkflows` includes "competitor-mapping"

### AC-08.10: Customer Discovery Workflow
1. Persona develops ICPs and buyer personas
2. Each ICP has: name, company size, industry, budget, current solution
3. Each persona has: role, age range, goals, pain points, JTBD
4. JTBD format: "When [situation], I want [motivation] so [outcome]"
5. Results saved to `ValidationSession.icps`
6. `completedWorkflows` includes "customer-discovery"

### AC-08.11: Validation Synthesis Workflow
1. Risk agent synthesizes findings from Marco, Cipher, Persona
2. Validation score (0-100) is calculated
3. Go/no-go recommendation generated (GO, CONDITIONAL_GO, PIVOT, NO_GO)
4. Strengths, risks, and next steps are listed
5. HITL approval item created for final recommendation
6. User can approve or reject recommendation
7. On approval: `validation.completed` event emitted
8. Business.validationScore and validationRecommendation updated

### AC-08.12: Planning Team Agno Configuration
1. PlanningTeam class exists in AgentOS (`agents/planning/team.py`)
2. Team has Blake as leader and Model, Finn, Revenue, Forecast as members
3. Team receives validated data from BMV session
4. Financial approval tool available for projections
5. Team can be invoked via `/teams/bmp/chat` endpoint

### AC-08.13: Planning Page with Workflow Progress
1. `/dashboard/[businessId]/planning` page exists
2. Shows progress for all 9 BMP workflows
3. Chat interface with Blake (team leader)
4. Completed artifacts display (canvas, projections, plan)
5. Download links for generated documents
6. Workflow dependencies indicated (e.g., canvas before plan)

### AC-08.14: Business Model Canvas Workflow
1. Model agent guides through 9 canvas blocks
2. Canvas blocks: Customer Segments, Value Propositions, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partnerships, Cost Structure
3. Data pre-filled from validation where available
4. Visual canvas output generated
5. Results saved to `PlanningSession.canvas`
6. Canvas exportable to PDF/image

### AC-08.15: Financial Projections Workflow
1. Finn generates 3 scenarios: Conservative, Realistic, Optimistic
2. Each scenario includes: revenue projections (3-5 years), cost projections, P&L, cash flow, unit economics
3. Break-even analysis included
4. Assumptions clearly documented
5. Results saved to `PlanningSession.financials`
6. Exportable to Excel/CSV

### AC-08.16: Business Plan Synthesis Workflow
1. Blake synthesizes all planning outputs into business plan
2. Sections: Executive Summary, Company Description, Market Analysis, Products/Services, Business Model, Go-to-Market, Operations, Management, Financials, Funding
3. Professional markdown document generated
4. Converted to PDF with branding
5. URL saved to `PlanningSession.businessPlanUrl`
6. HITL approval before finalization

### AC-08.17: Branding Team Agno Configuration
1. BrandingTeam class exists in AgentOS (`agents/branding/team.py`)
2. Team has Bella as leader and Sage, Vox, Iris, Artisan, Audit as members
3. Team receives business context from BMP session
4. Team can be invoked via `/teams/branding/chat` endpoint

### AC-08.18: Branding Page with Visual Identity Preview
1. `/dashboard/[businessId]/branding` page exists
2. Shows progress for all 7 brand workflows
3. Chat interface with Bella (team leader)
4. Visual identity preview: logo variations, color palette, typography samples
5. Asset gallery with download links
6. Brand guidelines preview

### AC-08.19: Brand Strategy and Voice Workflows
1. Sage determines brand archetype from 12 archetypes
2. Core values (3-5) identified
3. Personality traits and positioning statement created
4. Tagline options generated
5. Vox defines tone of voice (formal/casual, etc.)
6. Vocabulary guidelines (do/don't say) provided
7. Messaging templates and content pillars defined
8. Results saved to `BrandingSession.positioning` and `voiceGuidelines`

### AC-08.20: Visual Identity Workflow
1. Iris specifies primary color (hex, RGB, CMYK)
2. Secondary and accent colors defined
3. Typography (headings, body, accent fonts) specified
4. Logo concept description provided
5. Logo usage guidelines defined
6. Color palette visualization generated
7. Results saved to `BrandingSession.visualIdentity`

### AC-08.21: Asset Generation Workflow
1. Asset checklist generated based on business type
2. Artisan generates: logo package (SVG, PNG @1x/@2x/@3x), favicon set, social media assets, business card template, email signature, letterhead, presentation template
3. Folder structure organized: 01-logos/, 02-colors/, 03-typography/, 04-social-media/, etc.
4. Brand guidelines PDF generated
5. Asset URLs saved to `BrandingSession.generatedAssets`
6. Asset package URL saved to `BrandingSession.assetPackageUrl`

### AC-08.22: Module Handoff Workflows
1. `validation.completed` event triggers planning session init
2. Validated market data transferred to planning context
3. Business.onboardingStatus updated to PLANNING
4. `planning.completed` event triggers branding session init
5. Business model and value props transferred to branding context
6. Business.onboardingStatus updated to BRANDING
7. Event handlers are idempotent (handle retries)

### AC-08.23: Onboarding Completion and Handoff
1. Completion summary displays: validation score, business plan URL, brand guidelines URL, key metrics
2. Business.status updated to ACTIVE
3. `business.onboarding.complete` event emitted
4. Celebration UI displayed (confetti, success message)
5. User navigated to business dashboard
6. Product creation enabled (for future BM-PM features)

---

## Traceability Mapping

| AC | Epic Story | Component(s) | Test Approach |
|----|------------|--------------|---------------|
| AC-08.1 | 08.1 | Prisma schema, migrations | Migration run, TypeScript generation check |
| AC-08.2 | 08.2 | Portfolio Dashboard, Business cards | Manual UI test, snapshot test |
| AC-08.3 | 08.3 | Onboarding wizard | E2E test through wizard flow |
| AC-08.4 | 08.4 | Document upload, extraction pipeline | Upload test, extraction accuracy check |
| AC-08.5 | 08.5 | ValidationTeam (AgentOS) | Team initialization test, health check |
| AC-08.6 | 08.6 | Validation chat UI | UI test, SSE streaming verification |
| AC-08.7 | 08.7 | Idea intake workflow | Agent conversation test, data persistence |
| AC-08.8 | 08.8 | Market sizing workflow | Marco agent test, source validation |
| AC-08.9 | 08.9 | Competitor mapping workflow | Cipher agent test, positioning map |
| AC-08.10 | 08.10 | Customer discovery workflow | Persona agent test, ICP validation |
| AC-08.11 | 08.11 | Validation synthesis workflow | Risk agent test, HITL approval flow |
| AC-08.12 | 08.12 | PlanningTeam (AgentOS) | Team initialization test |
| AC-08.13 | 08.13 | Planning page | UI test, workflow progress tracking |
| AC-08.14 | 08.14 | Business Model Canvas | Model agent test, canvas generation |
| AC-08.15 | 08.15 | Financial projections | Finn agent test, scenario validation |
| AC-08.16 | 08.16 | Business plan synthesis | Blake agent test, PDF generation |
| AC-08.17 | 08.17 | BrandingTeam (AgentOS) | Team initialization test |
| AC-08.18 | 08.18 | Branding page | UI test, visual preview |
| AC-08.19 | 08.19 | Brand strategy/voice | Sage/Vox agent tests |
| AC-08.20 | 08.20 | Visual identity | Iris agent test |
| AC-08.21 | 08.21 | Asset generation | Artisan agent test, asset download |
| AC-08.22 | 08.22 | Module handoffs | Event bus integration test |
| AC-08.23 | 08.23 | Onboarding completion | E2E test, event emission check |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1**: Agent response quality inconsistent | Medium | High | Extensive prompt engineering, few-shot examples in instructions |
| **R2**: Market research claims are hallucinated | Medium | High | Enforce ValidationSource table, 2+ source requirement, manual review |
| **R3**: Financial projections unrealistic | Medium | Medium | HITL approval for projections, show assumptions prominently |
| **R4**: Asset generation slow (>5 min) | Medium | Medium | Async generation with progress indicators, background jobs |
| **R5**: Module handoff fails (event loss) | Low | High | Event replay from Epic 05-6, idempotent handlers |
| **R6**: Document extraction poor quality | Medium | Medium | Allow manual editing, show confidence scores |
| **R7**: User abandons wizard mid-flow | High | Low | Save partial state, resume functionality |
| **R8**: AgentOS crashes during long workflow | Low | High | Session persistence to PostgreSQL, resumable workflows |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| **A1**: Users will accept AI-generated business plans | Early adopters value speed over perfection |
| **A2**: 2-source requirement for market data is sufficient | Industry standard for business plans |
| **A3**: Users can provide business idea in conversational form | Chat interfaces are familiar, onboarding reduces friction |
| **A4**: Supabase Storage is sufficient for document storage | Proven at scale, integrated with Supabase PostgreSQL |
| **A5**: HITL approval sufficient for strategic decisions | 90/5 Promise design, users approve high-impact items |
| **A6**: Agent teams can complete workflows in <30 min | Testing required, may need workflow timeouts |

### Open Questions

| Question | Owner | Decision Needed By |
|----------|-------|-------------------|
| **Q1**: Should we support multiple validation sessions per business (iterate on idea)? | chris | Before Story 08.1 (data model) |
| **Q2**: Should validation score algorithm be configurable per workspace? | chris | Before Story 08.11 (synthesis) |
| **Q3**: Do we need real-time collaboration for business planning (multiple users)? | chris | Before Story 08.13 (planning page) |
| **Q4**: Should brand assets be editable in-app or download-and-edit? | chris | Before Story 08.21 (asset generation) |
| **Q5**: Should we integrate with logo design APIs (Looka, Tailor Brands)? | chris | Before Story 08.21 (can defer to future) |
| **Q6**: Do we need versioning for business plans/brand guidelines? | chris | Before Story 08.16 (business plan) |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Agent Unit Tests** | Individual agent responses | pytest (AgentOS) | 80% of agent instructions |
| **Workflow Integration Tests** | Full workflow execution | pytest + E2E | 100% of critical workflows |
| **UI Component Tests** | React components | Vitest + Testing Library | 70% component coverage |
| **E2E Tests** | Complete user journeys | Playwright | Critical paths only |
| **Data Validation Tests** | Schema constraints, data integrity | Jest + Prisma | 100% of constraints |

### Test Plan

**Section 1: Foundation (Stories 08.1-08.4)**
1. **08.1**: Run migrations, test Prisma client generation, validate foreign keys
2. **08.2**: Snapshot test business cards, test empty state, test navigation
3. **08.3**: E2E test wizard flow (all 4 steps), test resume functionality
4. **08.4**: Upload test files, validate extraction accuracy, test error handling

**Section 2: Validation (Stories 08.5-08.11)**
1. **08.5**: Initialize team, verify leader/members, test HITL tool availability
2. **08.6**: Test chat UI render, SSE connection, message display
3. **08.7**: Agent conversation test, validate saved data structure
4. **08.8**: Marco agent test with mock sources, validate 2+ source requirement
5. **08.9**: Cipher agent test, validate source URLs, test positioning map generation
6. **08.10**: Persona agent test, validate ICP structure, JTBD format
7. **08.11**: Risk agent synthesis test, HITL approval flow, event emission

**Section 3: Planning (Stories 08.12-08.16)**
1. **08.12**: Initialize planning team, verify data transfer from validation
2. **08.13**: Test planning page render, workflow dependencies
3. **08.14**: Model agent canvas test, validate 9 blocks, export test
4. **08.15**: Finn agent projections test, 3 scenarios, assumption tracking
5. **08.16**: Blake synthesis test, PDF generation, approval flow

**Section 4: Branding (Stories 08.17-08.21)**
1. **08.17**: Initialize branding team
2. **08.18**: Test branding page, visual preview render
3. **08.19**: Sage/Vox agent tests, archetype selection, voice guidelines
4. **08.20**: Iris agent test, color palette, typography
5. **08.21**: Artisan asset generation test, folder structure, download

**Section 5: Integration (Stories 08.22-08.23)**
1. **08.22**: Event bus handoff tests, idempotency, data transfer
2. **08.23**: Completion flow E2E, celebration UI, business activation

### Edge Cases to Verify

- User skips document upload in wizard
- User abandons wizard mid-step
- Agent provides conflicting recommendations
- Market research finds 0 sources for niche industry
- User rejects validation synthesis (pivots idea)
- Planning team receives minimal validation data
- Asset generation fails (fallback to manual instructions)
- Event handler receives duplicate events (idempotency)
- Multiple users access same business simultaneously
- User deletes business mid-onboarding

---

## Story Implementation Order (Recommended)

### Phase 1: MVP Validation (Sprint N) - 30 points
**Goal:** Core validation flow working end-to-end

1. **08.1** - Create Business Onboarding Database Models (3 points)
2. **08.2** - Implement Portfolio Dashboard with Business Cards (5 points)
3. **08.3** - Implement Onboarding Wizard UI (5 points)
4. **08.5** - Implement Validation Team Agno Configuration (5 points)
5. **08.6** - Create Validation Chat Interface (3 points)
6. **08.7** - Implement Idea Intake Workflow (3 points)
7. **08.8** - Implement Market Sizing Workflow (3 points)
8. **08.11** - Implement Validation Synthesis Workflow (3 points)

**Milestone:** User can create business, chat with Vera, complete market sizing, get go/no-go recommendation

### Phase 2: Full Validation + Planning Start (Sprint N+1) - 33 points
**Goal:** Complete validation, begin planning integration

1. **08.4** - Implement Document Upload and Extraction Pipeline (5 points)
2. **08.9** - Implement Competitor Mapping Workflow (3 points)
3. **08.10** - Implement Customer Discovery Workflow (3 points)
4. **08.12** - Implement Planning Team Agno Configuration (5 points)
5. **08.13** - Create Planning Page with Workflow Progress (3 points)
6. **08.14** - Implement Business Model Canvas Workflow (3 points)
7. **08.22** - Implement Module Handoff Workflows (3 points)

**Milestone:** Full validation with document upload, planning team initialized, canvas generation working

### Phase 3: Planning Complete + Branding Start (Sprint N+2) - 19 points
**Goal:** Complete planning, begin branding

1. **08.15** - Implement Financial Projections Workflow (3 points)
2. **08.16** - Implement Business Plan Synthesis Workflow (3 points)
3. **08.17** - Implement Branding Team Agno Configuration (5 points)
4. **08.18** - Create Branding Page with Visual Identity Preview (3 points)
5. **08.19** - Implement Brand Strategy and Voice Workflows (3 points)

**Milestone:** Business plan generation, branding team initialized, strategy/voice working

### Phase 4: Branding Complete + Polish (Sprint N+3) - 19 points
**Goal:** Complete branding, full onboarding flow

1. **08.20** - Implement Visual Identity Workflow (3 points)
2. **08.21** - Implement Asset Generation Workflow (5 points)
3. **08.23** - Implement Onboarding Completion and Handoff to BM-PM (2 points)

**Milestone:** Full onboarding flow from idea to brand assets, completion celebration

**Total: 82 points across 4 sprints (23 stories)**

---

## Technical Implementation Notes

### Agno Team Configuration Pattern

```python
# agents/validation/team.py
from agno.team import Team
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.storage.postgres import PostgresStorage
from agno.tools import Tool
import os

# HITL Approval Tool
class ApprovalTool(Tool):
    """Request human approval for strategic decisions."""

    def __init__(self):
        super().__init__(
            name="request_approval",
            description="Request human approval for strategic decisions"
        )

    def run(self, item_type: str, title: str, description: str, confidence: int, reasoning: str):
        # Call HYVVE API to create approval item
        # Return approval_item_id for tracking
        pass

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
            "You are Vera, the lead of the Business Validation Team.",
            "Guide users through business idea validation step by step.",
            "Delegate to specialists: Marco (market), Cipher (competitor), Persona (customer), Risk (feasibility).",
            "Always ask clarifying questions before delegating.",
            "Synthesize findings into clear, actionable recommendations.",
            "Use the request_approval tool for go/no-go recommendations.",
        ],
        tools=[ApprovalTool()],
    )

    # Market Researcher
    marco = Agent(
        name="Marco",
        role="Market Researcher",
        description="TAM/SAM/SOM calculations with 2+ source requirement",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "You are Marco, the market research specialist.",
            "ALWAYS provide at least 2 independent sources for market size claims.",
            "Sources must be < 24 months old.",
            "Cite sources with: name, URL, publication date.",
            "Mark confidence: [Verified] (2+ sources), [Single Source], [Estimated].",
            "Use top-down and bottom-up methodologies.",
        ],
        tools=[],  # Add WebSearchTool from Agno
    )

    # Competitor Analyst
    cipher = Agent(
        name="Cipher",
        role="Competitor Analyst",
        description="Positioning maps and competitive analysis",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "You are Cipher, the competitor analysis specialist.",
            "Identify direct, indirect competitors, and substitutes.",
            "ALL claims must include source URLs.",
            "Analyze: pricing, features, strengths, weaknesses, positioning.",
            "Generate positioning map coordinates (2 axes: price vs ease-of-use is common).",
            "Identify opportunity gaps where competitors are weak.",
        ],
        tools=[],
    )

    # Customer Profiler
    persona = Agent(
        name="Persona",
        role="Customer Profiler",
        description="ICP and Jobs-to-be-Done analysis",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "You are Persona, the customer profiling specialist.",
            "Develop Ideal Customer Profiles (ICPs) with 2-3 buyer personas each.",
            "Use Jobs-to-be-Done format: 'When [situation], I want [motivation] so [outcome]'.",
            "Include: demographics, psychographics, behaviors, pain points, goals.",
            "Map customer journey touchpoints.",
        ],
        tools=[],
    )

    # Feasibility Assessor
    risk = Agent(
        name="Risk",
        role="Feasibility Assessor",
        description="Risk assessment and go/no-go synthesis",
        model=Claude(id="claude-sonnet-4-20250514"),
        instructions=[
            "You are Risk, the feasibility assessment specialist.",
            "Synthesize findings from Marco, Cipher, Persona into go/no-go recommendation.",
            "Calculate validation score (0-100) based on: TAM size, competition level, customer clarity, feasibility.",
            "Recommend: GO (score >75), CONDITIONAL_GO (60-75), PIVOT (45-60), NO_GO (<45).",
            "List strengths, risks with severity, mitigations, and next steps.",
        ],
        tools=[ApprovalTool()],
    )

    return Team(
        name="Validation Team",
        mode="coordinate",
        leader=vera,
        members=[marco, cipher, persona, risk],
        delegate_task_to_all_members=False,  # Leader-based delegation
        respond_directly=True,
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

### Frontend Agent Chat Pattern

```typescript
// apps/web/src/components/business/validation-chat.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export function ValidationChat() {
  const params = useParams();
  const businessId = params.businessId as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsStreaming(true);

    // Call AgentOS streaming endpoint
    const response = await fetch('/api/teams/bmv/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: businessId,
        message: input,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let agentMessage = '';

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          agentMessage += data.content;

          // Update last message or add new
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, content: agentMessage }];
            } else {
              return [...prev, { role: 'assistant', content: agentMessage, agent_name: data.agent_name }];
            }
          });
        }
      }
    }

    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            {msg.role === 'assistant' && (
              <div className="text-sm text-muted-foreground mb-1">{msg.agent_name}</div>
            )}
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isStreaming}
          />
          <button onClick={sendMessage} disabled={isStreaming}>
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

_This technical specification provides the blueprint for implementing Epic 08: Business Onboarding & Foundation Modules, enabling AI-guided business validation, planning, and branding through Agno agent teams._

_Generated: 2025-12-04 by epic-tech-context workflow_
_For: chris_
