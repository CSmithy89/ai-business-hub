# Business Onboarding Architecture

**Version:** 1.0.0
**Date:** 2025-12-01
**Status:** Draft
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules

---

## Executive Summary

The Business Onboarding system provides AI-guided workflows for users starting new businesses on the HYVVE platform. It orchestrates three foundation modules (BMV, BMP, BM-Brand) through conversational interfaces, enabling users to either upload existing business documents or generate them through AI-assisted workflows.

### The 90/5 Promise Applied to Onboarding
- AI agents guide 90% of business planning and branding
- Users spend ~5 hours reviewing/approving strategic decisions
- Confidence-based routing determines auto-execution vs human review

---

## Architecture Overview

### Two-Level Dashboard Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HYVVE PLATFORM NAVIGATION                           │
└─────────────────────────────────────────────────────────────────────────────┘

Level 1: Portfolio Dashboard (Home)
┌─────────────────────────────────────────────────────────────────────────────┐
│  /dashboard (no business context)                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │  │
│  │ │  Business A     │ │  Business B     │ │  + Start New    │           │  │
│  │ │  ─────────────  │ │  ─────────────  │ │    Business     │           │  │
│  │ │  Status: Active │ │  Status: Draft  │ │                 │           │  │
│  │ │  Revenue: $XXX  │ │  Validation: 85%│ │  [Launch Wizard]│           │  │
│  │ └─────────────────┘ └─────────────────┘ └─────────────────┘           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Features:                                                                  │
│  - Business portfolio overview                                              │
│  - Quick stats across all businesses                                        │
│  - "Start New Business" prominent CTA                                       │
│  - Recent activity feed (cross-business)                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Level 2: Business Dashboard (Context-Aware)
┌─────────────────────────────────────────────────────────────────────────────┐
│  /dashboard/[businessId] (business context active)                          │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Sidebar:              │ Main Content:                                 │  │
│  │ ─────────────────     │ ─────────────────────────────────────────     │  │
│  │ [Switch Business ▼]   │ Approval Queue (3 pending)                    │  │
│  │                       │ Recent Agent Activity                         │  │
│  │ Dashboard             │ Business Health Metrics                       │  │
│  │ Approvals (3)         │                                               │  │
│  │ Business              │                                               │  │
│  │   └─ Validation       │                                               │  │
│  │   └─ Planning         │                                               │  │
│  │   └─ Branding         │                                               │  │
│  │ Products              │                                               │  │
│  │ Agents                │                                               │  │
│  │ Settings              │                                               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Onboarding Entry Points

| Entry Point | Location | User State | Action |
|-------------|----------|------------|--------|
| **"Start New Business"** | Portfolio Dashboard | Authenticated, no business context | Opens Onboarding Wizard |
| **"Add Business"** | Sidebar dropdown | Inside existing business | Opens Onboarding Wizard |
| **Quick Access** | Command Palette (⌘K) | Anywhere | `new business` command |

---

## Foundation Modules Inventory

### BMV - Business Validation Module

**Purpose:** Validate business ideas with market sizing, competitive analysis, and go/no-go recommendations

| Component | Count | Details |
|-----------|-------|---------|
| **Agents** | 5 | validation-orchestrator, market-researcher, competitor-analyst, customer-profiler, feasibility-assessor |
| **Workflows** | 8 | idea-intake, market-sizing, competitor-mapping, customer-discovery, product-fit-analysis, quick-validation, validation-synthesis, export-to-planning |
| **Checklists** | 2 | market-data-validation, go-no-go-criteria |
| **Tasks** | 3 | quick-tam, competitor-snapshot, validation-summary |

**Agent Team Structure:**
```yaml
validation_team:
  leader: Vera (validation-orchestrator)
  members:
    - Marco (market-researcher): TAM/SAM/SOM calculations
    - Cipher (competitor-analyst): Competitive intelligence
    - Persona (customer-profiler): ICP and persona development
    - Risk (feasibility-assessor): Go/no-go recommendations
```

**Key Workflows:**

1. **idea-intake** - Capture and structure business idea
2. **market-sizing** - Calculate TAM/SAM/SOM with multiple methodologies
3. **competitor-mapping** - Deep competitive analysis with positioning map
4. **customer-discovery** - ICP development and persona creation
5. **product-fit-analysis** - Match idea to product types, gap analysis
6. **quick-validation** - Fast validation for simple ideas
7. **validation-synthesis** - Synthesize findings into final recommendation
8. **export-to-planning** - Prepare validated data for BMP

**Anti-Hallucination Requirements:**
- Market size claims require 2+ independent sources
- Sources must be < 24 months old
- Confidence levels: high (2+ sources), medium (1 source), low (estimation)

---

### BMP - Business Planning Module

**Purpose:** Create comprehensive business plans, financial projections, and investor-ready documentation

| Component | Count | Details |
|-----------|-------|---------|
| **Agents** | 5 | planning-orchestrator, business-model-architect, financial-analyst, monetization-strategist, growth-forecaster |
| **Workflows** | 9 | business-model-canvas, financial-projections, pricing-strategy, revenue-model, growth-forecast, business-plan, pitch-deck, multi-product-planning, export-to-development |
| **Checklists** | Per workflow | Each workflow has validation checklist |
| **Templates** | Per workflow | Each workflow has output template |

**Agent Team Structure:**
```yaml
planning_team:
  leader: Blake (planning-orchestrator, persona: Blueprint)
  members:
    - Model (business-model-architect): Business Model Canvas expert
    - Finance (financial-analyst): Financial projections and analysis
    - Revenue (monetization-strategist): Pricing and monetization
    - Forecast (growth-forecaster): Growth predictions and scenarios
```

**Key Workflows:**

1. **business-model-canvas** - 9-block canvas with value propositions
2. **financial-projections** - P&L, cash flow, balance sheet forecasts
3. **pricing-strategy** - Pricing models and competitive positioning
4. **revenue-model** - Revenue streams and unit economics
5. **growth-forecast** - Growth scenarios with assumptions
6. **business-plan** - Investor-ready comprehensive plan (requires: canvas, projections)
7. **pitch-deck** - Presentation content generation
8. **multi-product-planning** - Cross-product synergy analysis
9. **export-to-development** - Prepare for BMM/BM-PM handoff

**Workflow Dependencies:**
```
business-model-canvas ────┐
                          ├──→ business-plan ──→ pitch-deck
financial-projections ────┤
pricing-strategy ─────────┤
growth-forecast ──────────┘
```

---

### BM-Brand - Branding Module

**Purpose:** Create cohesive brand identity systems including strategy, voice, visual identity, and asset generation

| Component | Count | Details |
|-----------|-------|---------|
| **Agents** | 6 | brand-orchestrator, brand-strategist, voice-architect, visual-identity-designer, asset-generator, brand-auditor |
| **Workflows** | 7 | brand-strategy, brand-voice, visual-identity, brand-guidelines, asset-checklist, asset-generation, brand-audit |
| **Checklists** | Per workflow | Comprehensive validation checklists |
| **Templates** | Per workflow | Detailed output templates |

**Agent Team Structure:**
```yaml
brand_team:
  leader: Bella (brand-orchestrator)
  members:
    - Sage (brand-strategist): Positioning and archetype development
    - Vox (voice-architect): Verbal identity and messaging
    - Iris (visual-identity-designer): Logo, colors, typography
    - Artisan (asset-generator): Production-ready deliverables
    - Audit (brand-auditor): Quality assurance and consistency
```

**Key Workflows:**

1. **brand-strategy** - Define positioning, archetype, core messaging
2. **brand-voice** - Develop verbal identity and communication guidelines
3. **visual-identity** - Logo, colors, typography specifications
4. **brand-guidelines** - Comprehensive brand documentation
5. **asset-checklist** - Audit required brand assets
6. **asset-generation** - Create all brand deliverables
7. **brand-audit** - Validate existing brand materials

**Recommended Sequence:**
```
brand-strategy → brand-voice → visual-identity → brand-guidelines → asset-checklist → asset-generation
```

**Asset Generation Specifications:**

The asset-generator agent produces comprehensive deliverables:

| Asset Type | Formats | Details |
|------------|---------|---------|
| **Logo Package** | AI, EPS, SVG, PNG | Primary, secondary, icon, favicon in full color, B&W, reversed |
| **Social Media** | PNG/JPG | Platform-specific dimensions for FB, IG, LinkedIn, X, YouTube, TikTok |
| **Business Collateral** | PDF, AI | Business card, letterhead, envelope, email signature, presentation |
| **Digital Assets** | PNG, HTML | Favicon set, OG images, email headers/footers |

**File Naming Convention:** `[brand]-[asset]-[variant]-[size].[format]`

**Delivery Package Structure:**
```
[brand-name]-brand-assets/
├── 01-logos/
│   ├── primary/
│   ├── secondary/
│   ├── icon/
│   └── favicon/
├── 02-colors/
├── 03-typography/
├── 04-social-media/
├── 05-business-collateral/
├── 06-digital/
├── 07-templates/
└── README.txt
```

---

## Module Integration Flow

### Sequential Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BUSINESS ONBOARDING PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

User Entry
    │
    ▼
┌───────────────────────────────────────┐
│  Onboarding Wizard                    │
│  ─────────────────────────────────    │
│  "Do you have existing documents?"    │
│  [Upload Docs] [Start Fresh]          │
└───────────────────────────────────────┘
    │
    ├── Upload Path: Extract & validate existing docs
    │                Fill gaps with AI assistance
    │
    └── Fresh Path: Full AI-guided workflow
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: VALIDATION (BMV)                                                  │
│  ───────────────────────────────────────────────────────────────────────    │
│  Agent Team: Vera (lead), Marco, Cipher, Persona, Risk                      │
│                                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│  │  Idea    │ → │  Market  │ → │Competitor│ → │ Customer │                 │
│  │  Intake  │   │  Sizing  │   │ Mapping  │   │ Discovery│                 │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                 │
│                                                       │                     │
│                                                       ▼                     │
│                                              ┌──────────────┐               │
│                                              │  Validation  │               │
│                                              │  Synthesis   │               │
│                                              │  (Go/No-Go)  │               │
│                                              └──────────────┘               │
│                                                       │                     │
│  Output: Validated Idea + Market Research + ICPs     │                     │
└──────────────────────────────────────────────────────┼─────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: PLANNING (BMP)                                                    │
│  ───────────────────────────────────────────────────────────────────────    │
│  Agent Team: Blake (lead), Model, Finance, Revenue, Forecast                │
│                                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│  │ Business │ → │ Financial│ → │ Pricing  │ → │  Growth  │                 │
│  │  Model   │   │Projections│  │ Strategy │   │ Forecast │                 │
│  │  Canvas  │   │          │   │          │   │          │                 │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                 │
│                                                       │                     │
│                                                       ▼                     │
│                                              ┌──────────────┐               │
│                                              │  Business    │               │
│                                              │  Plan        │               │
│                                              │  (Synthesis) │               │
│                                              └──────────────┘               │
│                                                       │                     │
│  Output: Business Plan + Financial Model + Pitch Deck │                     │
└──────────────────────────────────────────────────────┼─────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: BRANDING (BM-Brand)                                               │
│  ───────────────────────────────────────────────────────────────────────    │
│  Agent Team: Bella (lead), Sage, Vox, Iris, Artisan, Audit                  │
│                                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│  │  Brand   │ → │  Brand   │ → │  Visual  │ → │  Brand   │                 │
│  │ Strategy │   │  Voice   │   │ Identity │   │Guidelines│                 │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                 │
│                                                       │                     │
│                                                       ▼                     │
│                                    ┌──────────┐   ┌──────────┐             │
│                                    │  Asset   │ → │  Asset   │             │
│                                    │ Checklist│   │Generation│             │
│                                    └──────────┘   └──────────┘             │
│                                                       │                     │
│  Output: Brand Guidelines + Visual Assets + Voice Framework                 │
└──────────────────────────────────────────────────────┼─────────────────────┘
                                                       │
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  HANDOFF: TO BM-PM (Project Management)                                     │
│  ───────────────────────────────────────────────────────────────────────    │
│  Business is now ready for product development                              │
│  - All foundation documents created                                         │
│  - Brand assets ready for use                                               │
│  - Business context established in database                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agno Team Implementation

### Team Configuration Pattern

Based on Agno documentation, teams use a leader-based delegation model:

```python
from agno.agent import Agent
from agno.team import Team
from agno.storage.postgres import PostgresStorage

# Validation Team Example
validation_team = Team(
    name="Validation Team",
    mode="coordinate",  # Leader coordinates, delegates to specialists
    model=Model(id="claude-sonnet-4-20250514"),

    # Leader configuration
    leader=Agent(
        name="Vera",
        role="Validation Orchestrator",
        description="Coordinates validation activities and synthesizes findings",
        instructions=[
            "Guide users through business idea validation",
            "Delegate research tasks to specialist agents",
            "Synthesize findings into go/no-go recommendations",
        ],
    ),

    # Specialist members
    members=[
        Agent(
            name="Marco",
            role="Market Researcher",
            description="TAM/SAM/SOM calculations and market intelligence",
            tools=[WebSearchTool(), CalculatorTool()],
            instructions=[
                "Calculate market sizes using multiple methodologies",
                "Require 2+ sources for all claims",
                "Include confidence levels in all estimates",
            ],
        ),
        Agent(
            name="Cipher",
            role="Competitor Analyst",
            description="Competitive intelligence and positioning",
            tools=[WebSearchTool()],
        ),
        Agent(
            name="Persona",
            role="Customer Profiler",
            description="ICP development and Jobs-to-be-Done analysis",
        ),
        Agent(
            name="Risk",
            role="Feasibility Assessor",
            description="Risk assessment and go/no-go recommendations",
        ),
    ],

    # Team behavior
    delegate_task_to_all_members=False,  # Leader decides who to delegate to
    respond_directly=True,  # Leader responds to user

    # Multi-tenant storage
    storage=PostgresStorage(
        table_name="validation_sessions",
        db_url=os.getenv("DATABASE_URL"),
    ),

    # Session management
    session_id=lambda: get_current_session_id(),
    user_id=lambda: get_current_user_id(),
)
```

### HITL (Human-in-the-Loop) Integration

```python
from agno.tools import Tool

class ApprovalTool(Tool):
    """Tool for requesting human approval on strategic decisions"""

    name = "request_approval"
    description = "Request human approval for strategic decisions"

    # Triggers approval queue in HYVVE
    requires_confirmation = True

    def run(self, decision_type: str, content: dict, confidence: float):
        if confidence >= 0.85:
            # Auto-execute with logging
            return {"status": "auto_approved", "confidence": confidence}
        elif confidence >= 0.60:
            # Quick approval flow
            return {"status": "pending_quick_approval", "queue": "quick"}
        else:
            # Full review required
            return {"status": "pending_full_review", "queue": "strategic"}
```

### Session Context Management

```python
from agno.memory import AgentMemory
from agno.storage.postgres import PostgresStorage

# Per-business session context
business_context = {
    "business_id": "biz_123",
    "tenant_id": "tenant_456",
    "session_id": "session_789",
    "user_id": "user_012",
    "phase": "validation",  # validation | planning | branding
    "completed_workflows": ["idea-intake", "market-sizing"],
    "pending_workflows": ["competitor-mapping", "customer-discovery"],
}

# Agno memory stores conversation + workflow state
memory = AgentMemory(
    storage=PostgresStorage(
        table_name="agent_sessions",
        db_url=os.getenv("DATABASE_URL"),
    ),
    session_id=business_context["session_id"],
    user_id=business_context["user_id"],
)
```

---

## Database Schema

### Core Tables

```prisma
// Business - Top-level container
model Business {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  description     String?
  status          BusinessStatus @default(DRAFT)

  // Onboarding progress
  onboardingPhase OnboardingPhase @default(VALIDATION)
  validationScore Float?

  // Relationships
  validationData  ValidationSession?
  planningData    PlanningSession?
  brandingData    BrandingSession?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId])
}

enum BusinessStatus {
  DRAFT           // In onboarding
  VALIDATED       // Passed validation
  PLANNING        // In planning phase
  BRANDED         // Has brand identity
  ACTIVE          // Fully operational
  PAUSED
  ARCHIVED
}

enum OnboardingPhase {
  VALIDATION
  PLANNING
  BRANDING
  COMPLETE
}

// Validation Session Data
model ValidationSession {
  id              String   @id @default(cuid())
  businessId      String   @unique
  business        Business @relation(fields: [businessId], references: [id])

  // Idea Intake
  ideaDescription String?
  problemStatement String?
  targetAudience  String?

  // Market Sizing
  tam             Json?    // {value, methodology, sources[], confidence}
  sam             Json?
  som             Json?

  // Competitor Analysis
  competitors     Json[]   // [{name, strengths, weaknesses, positioning}]
  positioningMap  Json?

  // Customer Profiles
  icps            Json[]   // [{name, demographics, psychographics, jtbd}]

  // Feasibility
  riskAssessment  Json?
  goNoGoScore     Float?
  recommendation  String?  // GO | NO_GO | CONDITIONAL

  // Workflow Progress
  completedWorkflows String[]
  agentSessionId  String?  // Agno session reference

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Planning Session Data
model PlanningSession {
  id              String   @id @default(cuid())
  businessId      String   @unique
  business        Business @relation(fields: [businessId], references: [id])

  // Business Model Canvas
  canvas          Json?    // 9-block canvas data

  // Financial Projections
  financials      Json?    // P&L, cash flow, balance sheet

  // Pricing & Revenue
  pricingStrategy Json?
  revenueModel    Json?

  // Growth Forecast
  growthForecast  Json?    // 3-5 year scenarios

  // Generated Documents
  businessPlanUrl String?
  pitchDeckUrl    String?

  // Workflow Progress
  completedWorkflows String[]
  agentSessionId  String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Branding Session Data
model BrandingSession {
  id              String   @id @default(cuid())
  businessId      String   @unique
  business        Business @relation(fields: [businessId], references: [id])

  // Brand Strategy
  positioning     Json?    // archetype, values, personality

  // Brand Voice
  voiceGuidelines Json?    // tone, vocabulary, messaging templates

  // Visual Identity
  visualIdentity  Json?    // colors, typography, logo specs

  // Brand Guidelines
  guidelinesUrl   String?

  // Asset Checklist & Generation
  assetChecklist  Json?    // required assets with status
  generatedAssets Json[]   // [{type, url, format, dimensions}]

  // Workflow Progress
  completedWorkflows String[]
  agentSessionId  String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Document Storage
model OnboardingDocument {
  id              String   @id @default(cuid())
  businessId      String
  sessionType     String   // validation | planning | branding
  documentType    String   // business-plan | pitch-deck | brand-guidelines
  version         Int      @default(1)

  // Content
  content         String?  // Markdown content
  fileUrl         String?  // For generated files (PDF, images)
  metadata        Json?

  // Source tracking
  sourceWorkflow  String?
  sourceAgent     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([businessId, sessionType])
}

// Validation Sources (Anti-hallucination)
model ValidationSource {
  id              String   @id @default(cuid())
  sessionId       String
  claimType       String   // market_size | growth_rate | competitor
  claimValue      String

  // Source details
  sourceName      String
  sourceUrl       String?
  sourceDate      DateTime?
  sourceType      String   // analyst_report | government | industry

  // Confidence
  confidence      String   // high | medium | low
  verifiedAt      DateTime?

  createdAt       DateTime @default(now())

  @@index([sessionId, claimType])
}
```

---

## API Endpoints

### Onboarding APIs

```typescript
// Start new business onboarding
POST /api/businesses/onboard
Body: { name: string, description?: string, hasExistingDocs?: boolean }
Response: { businessId: string, wizardSessionId: string }

// Upload existing documents
POST /api/businesses/:id/documents/upload
Body: FormData { files: File[], documentType: string }
Response: { extractedData: object, gaps: string[] }

// Get onboarding progress
GET /api/businesses/:id/onboarding/status
Response: {
  phase: OnboardingPhase,
  completedWorkflows: string[],
  pendingWorkflows: string[],
  nextAction: string
}

// Start specific workflow
POST /api/businesses/:id/workflows/:workflowId/start
Response: { sessionId: string, agentEndpoint: string }

// Get workflow status
GET /api/businesses/:id/workflows/:workflowId/status
Response: { status: string, progress: number, outputs: object }
```

### Agent Communication APIs

```typescript
// Chat with team leader
POST /api/agents/chat
Body: {
  businessId: string,
  teamId: string,  // validation | planning | branding
  message: string,
  sessionId?: string
}
Response: {
  response: string,
  agentName: string,
  suggestedActions?: string[],
  approvalRequired?: object
}

// Get agent session history
GET /api/agents/sessions/:sessionId
Response: { messages: Message[], context: object }
```

---

## UI Components

### Onboarding Wizard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Start a New Business                                              Step 1/4 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Do you have existing business documents?                                   │
│                                                                             │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │                                 │  │                                 │  │
│  │  📄 I have documents            │  │  ✨ Start from scratch          │  │
│  │                                 │  │                                 │  │
│  │  Upload your existing:          │  │  Our AI will guide you through: │  │
│  │  • Business plan                │  │  • Market validation            │  │
│  │  • Market research              │  │  • Business planning            │  │
│  │  • Brand guidelines             │  │  • Brand development            │  │
│  │                                 │  │                                 │  │
│  │  We'll identify gaps and        │  │  ~2-4 hours with AI assistance  │  │
│  │  help you complete them.        │  │                                 │  │
│  │                                 │  │                                 │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                             │
│                               [Continue →]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Business Page (Validation Tab)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Business Validation                                    Score: 78/100    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Workflows                                                                  │
│  ┌───────────────────┬──────────────┬──────────────┬───────────────────┐   │
│  │ Idea Intake       │ Market Sizing│ Competitors  │ Customer Discovery│   │
│  │ ✅ Complete       │ ✅ Complete  │ 🔄 In Progress│ ⏳ Pending        │   │
│  └───────────────────┴──────────────┴──────────────┴───────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Chat with Vera (Validation Lead)                                    │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │                                                                     │   │
│  │ Vera: I've identified 5 key competitors in your space. Cipher is   │   │
│  │       now analyzing their positioning. Would you like to review    │   │
│  │       the preliminary findings?                                    │   │
│  │                                                                     │   │
│  │ [Show Competitors] [Continue Analysis] [Ask a Question]            │   │
│  │                                                                     │   │
│  │ ┌─────────────────────────────────────────────────────────────────┐│   │
│  │ │ Type a message...                                    [Send]     ││   │
│  │ └─────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Key Findings                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TAM: $4.2B (High confidence - 3 sources)                            │  │
│  │ SAM: $840M (Medium confidence - 2 sources)                          │  │
│  │ SOM: $42M (Year 1 target)                                           │  │
│  │                                                                      │  │
│  │ [View Full Market Analysis →]                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## EPIC-08: Business Onboarding Stories

### Story Breakdown (18 Stories, ~48 Points)

#### Foundation Stories (Infrastructure)

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| 08-01 | Create Business, ValidationSession, PlanningSession, BrandingSession database models | 3 | P0 |
| 08-02 | Implement onboarding wizard UI with step navigation | 5 | P0 |
| 08-03 | Create Portfolio Dashboard with business cards and "Start New Business" CTA | 5 | P0 |
| 08-04 | Implement document upload and extraction pipeline | 5 | P1 |

#### Validation Team Stories (BMV)

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| 08-05 | Implement Validation Team Agno configuration (Vera + 4 specialists) | 5 | P0 |
| 08-06 | Create validation chat interface with team leader | 3 | P0 |
| 08-07 | Implement idea-intake workflow with structured capture | 3 | P0 |
| 08-08 | Implement market-sizing workflow with TAM/SAM/SOM calculations | 3 | P0 |
| 08-09 | Implement competitor-mapping workflow | 3 | P1 |
| 08-10 | Implement customer-discovery and ICP creation workflow | 3 | P1 |
| 08-11 | Implement validation-synthesis with go/no-go scoring | 3 | P0 |

#### Planning Team Stories (BMP)

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| 08-12 | Implement Planning Team Agno configuration (Blake + 4 specialists) | 5 | P1 |
| 08-13 | Create planning page with workflow progress | 3 | P1 |
| 08-14 | Implement business-model-canvas workflow | 3 | P1 |
| 08-15 | Implement financial-projections workflow | 3 | P1 |
| 08-16 | Implement business-plan synthesis workflow | 3 | P1 |

#### Branding Team Stories (BM-Brand)

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| 08-17 | Implement Branding Team Agno configuration (Bella + 5 specialists) | 5 | P2 |
| 08-18 | Create branding page with visual identity preview | 3 | P2 |
| 08-19 | Implement brand-strategy and brand-voice workflows | 3 | P2 |
| 08-20 | Implement visual-identity workflow | 3 | P2 |
| 08-21 | Implement asset-generation workflow with deliverables | 5 | P2 |

#### Integration Stories

| ID | Story | Points | Priority |
|----|-------|--------|----------|
| 08-22 | Implement workflow handoff between modules (BMV→BMP→Brand) | 3 | P1 |
| 08-23 | Implement onboarding completion and handoff to BM-PM | 2 | P2 |

### Priority Distribution
- **P0 (MVP):** 8 stories, ~27 points - Core validation + wizard
- **P1 (Important):** 7 stories, ~23 points - Planning + integration
- **P2 (Nice-to-have):** 6 stories, ~19 points - Branding + polish

---

## Implementation Sequence

### Phase 1: Foundation (Sprint 1)
1. Database models (08-01)
2. Portfolio Dashboard (08-03)
3. Onboarding Wizard (08-02)

### Phase 2: Validation MVP (Sprint 2)
1. Validation Team config (08-05)
2. Chat interface (08-06)
3. Idea intake (08-07)
4. Market sizing (08-08)
5. Validation synthesis (08-11)

### Phase 3: Planning Integration (Sprint 3)
1. Planning Team config (08-12)
2. Planning page (08-13)
3. BMC workflow (08-14)
4. Financial projections (08-15)
5. Module handoff (08-22)

### Phase 4: Branding & Polish (Sprint 4)
1. Branding Team config (08-17)
2. Branding page (08-18)
3. Brand workflows (08-19, 08-20)
4. Asset generation (08-21)
5. Completion handoff (08-23)

---

## Event Flow

```yaml
# Business Onboarding Events
events:
  business.created:
    data: { businessId, tenantId, name }
    triggers: [validation.session.init]

  validation.workflow.completed:
    data: { businessId, workflowId, outputs }
    triggers: [validation.progress.update]

  validation.session.completed:
    data: { businessId, score, recommendation }
    triggers: [planning.session.init] # if GO

  planning.session.completed:
    data: { businessId, planUrl, deckUrl }
    triggers: [branding.session.init]

  branding.session.completed:
    data: { businessId, guidelinesUrl, assets[] }
    triggers: [business.onboarding.complete]

  business.onboarding.complete:
    data: { businessId, phase: COMPLETE }
    triggers: [business.status.update(ACTIVE)]
```

---

## Security Considerations

### Multi-Tenant Isolation
- All queries filtered by tenantId
- RLS policies on validation/planning/branding tables
- Session context includes tenant verification

### Sensitive Data
- Financial projections encrypted at rest
- API keys for external services (if any) encrypted
- Document uploads scanned and sandboxed

### Agent Access Control
- Agents operate within business context only
- No cross-business data access
- Approval required for data export

---

## Monitoring & Analytics

### Key Metrics
- Onboarding completion rate by phase
- Average time per workflow
- Go/No-Go distribution
- Document upload success rate
- Agent interaction patterns

### Health Checks
- Agno team availability
- Workflow execution time
- Error rates per workflow
- Session persistence

---

## References

- [BMAD Module Specifications](/.bmad/)
- [Agno Documentation](https://docs.agno.com)
- [HYVVE Architecture](../architecture.md)
- [PRD](../prd.md)
- [UX Design](../ux-design.md)
