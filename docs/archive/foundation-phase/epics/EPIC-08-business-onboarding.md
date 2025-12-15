# Epic 08: Business Onboarding & Foundation Modules

**Epic ID:** EPIC-08
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 2 - Business Foundation
**Points:** 82 total (23 stories)

---

## Epic Overview

Implement the Business Onboarding system that guides users through starting a new business on HYVVE. This epic integrates three BMAD Foundation Modules (BMV, BMP, BM-Brand) as Agno agent teams, providing AI-assisted workflows for business validation, planning, and branding.

### Business Value
- Enables the core value proposition: AI-guided business creation
- Implements the 90/5 Promise for business planning (90% automated, ~5 hours human involvement)
- Creates reusable foundation for all future businesses on the platform

### Success Criteria
- [ ] Users can start a new business from Portfolio Dashboard
- [ ] Onboarding wizard captures existing docs or guides through fresh start
- [ ] Validation Team (BMV) fully functional with all 8 workflows
- [ ] Planning Team (BMP) fully functional with all 9 workflows
- [ ] Branding Team (BM-Brand) fully functional with all 7 workflows
- [ ] All agent conversations persist to database
- [ ] HITL approval integration working for strategic decisions
- [ ] Handoff between modules (BMV→BMP→Brand) working

### Architecture Reference
- [Business Onboarding Architecture](../architecture/business-onboarding-architecture.md)
- [Agno Implementation Guide](../architecture/agno-implementation-guide.md)

### Design Assets
- [Wireframe Index - Business Onboarding Section](../design/wireframes/WIREFRAME-INDEX.md#17-business-onboarding-18-wireframes-)
- [Wireframe Prompts (BATCH-10)](../design/wireframes/prompts/BATCH-10-BUSINESS-ONBOARDING.md)
- **Wireframe Status:** 18/18 Complete ✅

| ID | Wireframe | Status |
|----|-----------|--------|
| BO-01 | Portfolio Dashboard | ✅ Complete |
| BO-02 | Wizard Step 1 - Documents | ✅ Complete |
| BO-03 | Wizard Step 2 - Details | ✅ Complete |
| BO-04 | Wizard Step 3 - Idea | ✅ Complete |
| BO-05 | Wizard Step 4 - Launch | ✅ Complete |
| BO-06 | Validation Page | ✅ Complete |
| BO-07 | Planning Page | ✅ Complete |
| BO-08 | Branding Page | ✅ Complete |
| BO-09 | Business Switcher | ✅ Complete |
| BO-10 | Validation Results | ✅ Complete |
| BO-11 | Market Sizing Results | ✅ Complete |
| BO-12 | Competitor Analysis | ✅ Complete |
| BO-13 | Customer Discovery | ✅ Complete |
| BO-14 | Business Model Canvas | ✅ Complete |
| BO-15 | Financial Projections | ✅ Complete |
| BO-16 | Brand Strategy | ✅ Complete |
| BO-17 | Visual Identity | ✅ Complete |
| BO-18 | Asset Gallery | ✅ Complete |

### Agent Implementation Status
- **BMV (Validation):** ✅ Agno Team implemented - `agents/validation/`
- **BMP (Planning):** ✅ Agno Team implemented - `agents/planning/`
- **BMB (Branding):** ✅ Agno Team implemented - `agents/branding/`

---

## Module Inventory

### BMV - Business Validation Module
| Agents | Workflows | Checklists | Tasks |
|--------|-----------|------------|-------|
| 5 | 8 | 2 | 3 |

**Agents:** validation-orchestrator (Vera), market-researcher (Marco), competitor-analyst (Cipher), customer-profiler (Persona), feasibility-assessor (Risk)

**Workflows:**
1. idea-intake
2. market-sizing
3. competitor-mapping
4. customer-discovery
5. product-fit-analysis
6. quick-validation
7. validation-synthesis
8. export-to-planning

### BMP - Business Planning Module
| Agents | Workflows | Checklists | Templates |
|--------|-----------|------------|-----------|
| 5 | 9 | Per workflow | Per workflow |

**Agents:** planning-orchestrator (Blake/Blueprint), business-model-architect (Model), financial-analyst (Finance), monetization-strategist (Revenue), growth-forecaster (Forecast)

**Workflows:**
1. business-model-canvas
2. financial-projections
3. pricing-strategy
4. revenue-model
5. growth-forecast
6. business-plan
7. pitch-deck
8. multi-product-planning
9. export-to-development

### BM-Brand - Branding Module
| Agents | Workflows | Checklists | Templates |
|--------|-----------|------------|-----------|
| 6 | 7 | Per workflow | Per workflow |

**Agents:** brand-orchestrator (Bella), brand-strategist (Sage), voice-architect (Vox), visual-identity-designer (Iris), asset-generator (Artisan), brand-auditor (Audit)

**Workflows:**
1. brand-strategy
2. brand-voice
3. visual-identity
4. brand-guidelines
5. asset-checklist
6. asset-generation
7. brand-audit

---

## Stories

### Section 1: Foundation Infrastructure (Stories 08.1-08.4)

---

### Story 08.1: Create Business Onboarding Database Models

**Points:** 3
**Priority:** P0
**Dependencies:** EPIC-00 (Prisma setup)

**As a** developer
**I want** database models for business onboarding data
**So that** all validation, planning, and branding data persists correctly

**Acceptance Criteria:**
- [ ] Create `Business` model with onboarding status tracking
- [ ] Create `ValidationSession` model with full BMV data structure
- [ ] Create `PlanningSession` model with full BMP data structure
- [ ] Create `BrandingSession` model with full BM-Brand data structure
- [ ] Create `OnboardingDocument` model for generated files
- [ ] Create `ValidationSource` model for anti-hallucination tracking
- [ ] Add proper indexes for tenant isolation
- [ ] Create and run migrations

**Data Models:**
```prisma
model Business {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  status          BusinessStatus @default(DRAFT)
  onboardingPhase OnboardingPhase @default(VALIDATION)
  validationScore Float?
  // Relations
  validationData  ValidationSession?
  planningData    PlanningSession?
  brandingData    BrandingSession?
  @@index([tenantId])
}

model ValidationSession {
  id              String   @id @default(cuid())
  businessId      String   @unique
  // Idea Intake
  ideaDescription String?
  problemStatement String?
  // Market Sizing
  tam             Json?
  sam             Json?
  som             Json?
  // Competitors, ICPs, etc.
  completedWorkflows String[]
  agentSessionId  String?
}
```

**Technical Notes:**
- Follow existing Prisma patterns from `packages/db`
- Include RLS-ready tenant isolation
- JSON columns for flexible agent output storage

---

### Story 08.2: Implement Portfolio Dashboard with Business Cards

**Points:** 5
**Priority:** P0
**Dependencies:** Story 08.1

**As a** user
**I want** a portfolio dashboard showing all my businesses
**So that** I can manage multiple businesses and start new ones

**Acceptance Criteria:**
- [ ] Create `/dashboard` route (portfolio view, no business context)
- [ ] Display business cards with status indicators
- [ ] Show key metrics per business (validation score, phase, status)
- [ ] Add prominent "Start New Business" CTA card
- [ ] Implement business card click to enter business context
- [ ] Add business switcher dropdown in sidebar
- [ ] Create empty state for users with no businesses

**UI Components:**
- `BusinessCard` - Individual business summary card
- `PortfolioDashboard` - Grid layout of business cards
- `StartBusinessCard` - CTA to launch onboarding wizard
- `BusinessSwitcher` - Dropdown in sidebar for context switching

**Technical Notes:**
- Use React Query for data fetching
- Implement optimistic updates for status changes
- Consider skeleton loading states

---

### Story 08.3: Implement Onboarding Wizard UI

**Points:** 5
**Priority:** P0
**Dependencies:** Story 08.2

**As a** user
**I want** a guided onboarding wizard
**So that** I can start a new business with clear steps

**Acceptance Criteria:**
- [ ] Create multi-step wizard component
- [ ] Step 1: "Do you have existing documents?" (Upload vs Fresh Start)
- [ ] Step 2: Business name and description
- [ ] Step 3: Initial idea capture (feeds into validation)
- [ ] Step 4: Confirmation and launch
- [ ] Add progress indicator showing current step
- [ ] Allow navigation back to previous steps
- [ ] Persist wizard state (resume if abandoned)
- [ ] Create business record on completion

**UI Wireframe:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Start a New Business                                  Step 1/4 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Do you have existing business documents?                       │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │  📄 I have documents    │  │  ✨ Start from scratch      │  │
│  │  Upload and we'll       │  │  AI will guide you through  │  │
│  │  identify gaps          │  │  the complete process       │  │
│  └─────────────────────────┘  └─────────────────────────────┘  │
│                                                                 │
│                              [Continue →]                       │
└─────────────────────────────────────────────────────────────────┘
```

**Technical Notes:**
- Use Zustand for wizard state management
- Store partial progress in localStorage
- Create business API call on final step

---

### Story 08.4: Implement Document Upload and Extraction Pipeline

**Points:** 5
**Priority:** P1
**Dependencies:** Story 08.3

**As a** user
**I want** to upload existing business documents
**So that** the system can extract relevant data and identify gaps

**Acceptance Criteria:**
- [ ] Create file upload component with drag-and-drop
- [ ] Support PDF, DOCX, MD file types
- [ ] Implement file validation (size, type)
- [ ] Create extraction endpoint that:
  - Parses uploaded documents
  - Extracts key business information
  - Maps to validation/planning/branding fields
  - Identifies missing sections
- [ ] Display extraction results with confidence scores
- [ ] Show gap analysis (what's missing)
- [ ] Allow manual correction of extracted data

**Extraction Mapping:**
| Document Type | Extracted Fields |
|---------------|------------------|
| Business Plan | Business model, financials, market analysis |
| Market Research | TAM/SAM/SOM, competitors, customer profiles |
| Brand Guide | Colors, typography, voice, positioning |
| Pitch Deck | Value proposition, target market, team |

**Technical Notes:**
- Use LangChain for document parsing
- Store raw files in S3/Supabase Storage
- Agent processes extraction with structured output

---

### Section 2: Validation Team - BMV (Stories 08.5-08.11)

---

### Story 08.5: Implement Validation Team Agno Configuration

**Points:** 5
**Priority:** P0
**Dependencies:** Story 08.1, EPIC-07 (AgentOS setup)

**As a** developer
**I want** the Validation Team configured in Agno
**So that** BMV agents work together as a coordinated team

**Acceptance Criteria:**
- [ ] Create `ValidationTeam` class in AgentOS
- [ ] Configure team leader: Vera (validation-orchestrator)
- [ ] Configure specialist agents:
  - Marco (market-researcher)
  - Cipher (competitor-analyst)
  - Persona (customer-profiler)
  - Risk (feasibility-assessor)
- [ ] Set up leader-based delegation (`delegate_task_to_all_members=False`)
- [ ] Configure team storage with multi-tenant context
- [ ] Add HITL tool for approval requests
- [ ] Implement anti-hallucination rules in agent instructions

**Team Configuration:**
```python
validation_team = Team(
    name="Validation Team",
    mode="coordinate",
    model=Claude(id="claude-sonnet-4-20250514"),
    leader=vera_agent,
    members=[marco, cipher, persona, risk],
    delegate_task_to_all_members=False,
    respond_directly=True,
    storage=PostgresStorage(table_name="validation_sessions"),
)
```

**Agent Personas:**
| Agent | Name | Role | Key Instructions |
|-------|------|------|------------------|
| Leader | Vera | Orchestrator | Guide, delegate, synthesize |
| Member | Marco | Market Research | TAM/SAM/SOM, 2+ sources required |
| Member | Cipher | Competitors | Positioning maps, source URLs |
| Member | Persona | Customer | ICP, JTBD analysis |
| Member | Risk | Feasibility | Go/no-go scoring |

**Technical Notes:**
- Follow patterns from `agno-implementation-guide.md`
- Use BYOAI for model selection (user's API keys)
- Include workspace context in all sessions

---

### Story 08.6: Create Validation Chat Interface

**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.5

**As a** user
**I want** to chat with the Validation Team
**So that** I can validate my business idea through conversation

**Acceptance Criteria:**
- [ ] Create `/business/[id]/validation` page
- [ ] Implement chat interface component
- [ ] Display team leader (Vera) as primary responder
- [ ] Show agent name for each message
- [ ] Implement SSE streaming for responses
- [ ] Add suggested action buttons from agent responses
- [ ] Show workflow progress indicator
- [ ] Display key findings summary panel

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Business Validation                        Score: --/100    │
├─────────────────────────────────────────────────────────────────┤
│  Workflow Progress                                              │
│  [Idea ✅] [Market ⏳] [Competitors ○] [Customers ○] [Synthesis ○]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Chat with Vera (Validation Lead)                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Vera: Welcome! I'm Vera, your validation lead. Let's start  ││
│  │       by understanding your business idea. What problem     ││
│  │       are you trying to solve?                              ││
│  │                                                             ││
│  │ You: I want to create an AI-powered CRM for small...        ││
│  │                                                             ││
│  │ Vera: Great! I'm going to have Marco research the market    ││
│  │       size while I ask you a few more questions...          ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Type a message...                               [Send]      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Show Market Research] [View Competitors] [Continue →]         │
└─────────────────────────────────────────────────────────────────┘
```

**Technical Notes:**
- Use React Query for message fetching
- Implement optimistic UI for sent messages
- Store conversation in agent session

---

### Story 08.7: Implement Idea Intake Workflow

**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.5

**As a** user
**I want** a structured idea intake process
**So that** my business idea is captured completely

**Acceptance Criteria:**
- [ ] Create `idea-intake` workflow task in Agno
- [ ] Vera asks clarifying questions to understand:
  - Problem being solved
  - Target customer
  - Proposed solution
  - Initial business model hypothesis
- [ ] Structure captured data into standardized format
- [ ] Store in `ValidationSession.ideaDescription`
- [ ] Trigger downstream workflows on completion
- [ ] Allow editing of captured idea

**Idea Intake Output:**
```json
{
  "problem_statement": "SMBs struggle with...",
  "target_customer": "Small businesses 5-50 employees",
  "proposed_solution": "AI-powered CRM that...",
  "initial_hypothesis": {
    "value_proposition": "...",
    "revenue_model": "SaaS subscription"
  },
  "clarifying_answers": [...]
}
```

**Technical Notes:**
- Use structured output in Agno
- Progressive disclosure of questions
- Save partial progress

---

### Story 08.8: Implement Market Sizing Workflow

**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.7

**As a** user
**I want** accurate market size calculations
**So that** I understand the opportunity size

**Acceptance Criteria:**
- [ ] Create `market-sizing` workflow task
- [ ] Marco agent calculates:
  - TAM (Total Addressable Market)
  - SAM (Serviceable Available Market)
  - SOM (Serviceable Obtainable Market)
- [ ] Use multiple methodologies (top-down, bottom-up)
- [ ] Require minimum 2 sources per claim
- [ ] Sources must be < 24 months old
- [ ] Include confidence levels (high/medium/low)
- [ ] Store sources in `ValidationSource` table
- [ ] Display results with source citations

**Market Sizing Checklist (from BMAD):**
- [ ] At least 2 independent sources for TAM
- [ ] Sources from current year or within 24 months
- [ ] Credible sources (Gartner, Forrester, govt data)
- [ ] Conflicting data noted with all sources
- [ ] Confidence levels marked

**Output Structure:**
```json
{
  "tam": {
    "value": 4200000000,
    "formatted": "$4.2B",
    "methodology": "Top-down from industry reports",
    "confidence": "high",
    "sources": [
      {"name": "Gartner CRM Report 2024", "url": "...", "date": "2024-03"},
      {"name": "Forrester Market Sizing", "url": "...", "date": "2024-06"}
    ]
  },
  "sam": {...},
  "som": {...}
}
```

**Technical Notes:**
- Marco uses WebSearchTool for research
- Anti-hallucination validation on sources
- Cache research results for efficiency

---

### Story 08.9: Implement Competitor Mapping Workflow

**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.7

**As a** user
**I want** competitive analysis
**So that** I understand the competitive landscape

**Acceptance Criteria:**
- [ ] Create `competitor-mapping` workflow task
- [ ] Cipher agent identifies:
  - Direct competitors (same solution, same market)
  - Indirect competitors (different solution, same problem)
  - Substitute products
- [ ] Analyze each competitor:
  - Pricing
  - Key features
  - Strengths
  - Weaknesses
  - Market positioning
- [ ] Create positioning map visualization data
- [ ] Identify opportunity gaps
- [ ] All claims require source URLs
- [ ] Store in `ValidationSession.competitors`

**Competitor Analysis Output:**
```json
{
  "competitors": [
    {
      "name": "Salesforce",
      "type": "direct",
      "pricing": "$25-300/user/month",
      "features": ["Contact management", "Pipeline", "AI"],
      "strengths": ["Market leader", "Enterprise features"],
      "weaknesses": ["Complex", "Expensive for SMB"],
      "market_share": "23%",
      "source_url": "..."
    }
  ],
  "positioning_map": {
    "axes": ["Price", "Ease of Use"],
    "positions": [...]
  },
  "opportunity_gaps": [
    "SMB-focused AI CRM with simple pricing"
  ]
}
```

**Technical Notes:**
- Can run in parallel with market-sizing
- Use structured web search for competitor data
- Generate positioning map coordinates

---

### Story 08.10: Implement Customer Discovery Workflow

**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.7

**As a** user
**I want** customer profiles
**So that** I understand who I'm building for

**Acceptance Criteria:**
- [ ] Create `customer-discovery` workflow task
- [ ] Persona agent develops:
  - Ideal Customer Profiles (ICPs)
  - Buyer personas (2-3 per ICP)
  - Jobs-to-be-Done analysis
  - Pain points and desired outcomes
- [ ] Include demographics, psychographics, behaviors
- [ ] Map customer journey touchpoints
- [ ] Identify key decision factors
- [ ] Store in `ValidationSession.icps`

**Customer Profile Output:**
```json
{
  "icps": [
    {
      "name": "Growing SMB",
      "company_size": "10-50 employees",
      "industry": "Professional Services",
      "budget": "$1K-5K/month",
      "current_solution": "Spreadsheets or basic CRM",
      "personas": [
        {
          "name": "Sales Manager Sam",
          "role": "Sales Manager",
          "age_range": "30-45",
          "goals": ["Hit quota", "Reduce admin time"],
          "pain_points": ["Manual data entry", "No visibility"],
          "jtbd": [
            "When I onboard a new rep, I want easy training so they hit quota faster",
            "When I review pipeline, I want accurate forecasts so I can plan"
          ]
        }
      ]
    }
  ]
}
```

**Technical Notes:**
- Can run in parallel with market-sizing and competitors
- JTBD format: "When [situation], I want [motivation] so [outcome]"
- Consider survey/interview templates for user validation

---

### Story 08.11: Implement Validation Synthesis Workflow

**Points:** 3
**Priority:** P0
**Dependencies:** Stories 08.8, 08.9, 08.10

**As a** user
**I want** a synthesized validation recommendation
**So that** I can decide whether to proceed

**Acceptance Criteria:**
- [ ] Create `validation-synthesis` workflow task
- [ ] Risk agent synthesizes findings from:
  - Market sizing (Marco)
  - Competitor analysis (Cipher)
  - Customer discovery (Persona)
- [ ] Calculate validation score (0-100)
- [ ] Generate go/no-go recommendation:
  - GO: Proceed to planning
  - CONDITIONAL: Proceed with noted risks
  - NO_GO: Significant concerns
- [ ] Identify key risks and mitigations
- [ ] Require HITL approval for final recommendation
- [ ] Store final score in `Business.validationScore`
- [ ] Trigger handoff to BMP on approval

**Go/No-Go Criteria (from BMAD):**
- [ ] TAM > $1B (or justified smaller market)
- [ ] SAM > $100M (realistic serviceable market)
- [ ] No dominant competitor with >80% market share
- [ ] Clear customer pain points identified
- [ ] No insurmountable barriers to entry
- [ ] Technical feasibility confirmed

**Synthesis Output:**
```json
{
  "validation_score": 78,
  "recommendation": "CONDITIONAL",
  "summary": "Strong market opportunity with manageable risks",
  "strengths": [
    "Large and growing TAM ($4.2B)",
    "Clear pain points in SMB segment"
  ],
  "risks": [
    {
      "risk": "Established competitors (Salesforce, HubSpot)",
      "severity": "medium",
      "mitigation": "Focus on AI differentiation and SMB-specific features"
    }
  ],
  "next_steps": [
    "Develop detailed business model canvas",
    "Create financial projections"
  ]
}
```

**Technical Notes:**
- Sequential execution after parallel workflows complete
- HITL integration for approval
- Trigger `validation.completed` event

---

### Section 3: Planning Team - BMP (Stories 08.12-08.16)

---

### Story 08.12: Implement Planning Team Agno Configuration

**Points:** 5
**Priority:** P1
**Dependencies:** Story 08.11, EPIC-07

**As a** developer
**I want** the Planning Team configured in Agno
**So that** BMP agents work together as a coordinated team

**Acceptance Criteria:**
- [ ] Create `PlanningTeam` class in AgentOS
- [ ] Configure team leader: Blake/Blueprint (planning-orchestrator)
- [ ] Configure specialist agents:
  - Model (business-model-architect)
  - Finance (financial-analyst)
  - Revenue (monetization-strategist)
  - Forecast (growth-forecaster)
- [ ] Set up leader-based delegation
- [ ] Configure team storage with business context
- [ ] Receive validated data from BMV session
- [ ] Add HITL tool for financial approval

**Agent Personas:**
| Agent | Name | Role | Key Instructions |
|-------|------|------|------------------|
| Leader | Blake | Orchestrator | Guide planning, delegate, synthesize |
| Member | Model | BMC Expert | Business Model Canvas, value props |
| Member | Finance | Financial Analyst | P&L, cash flow, projections |
| Member | Revenue | Monetization | Pricing, revenue models |
| Member | Forecast | Growth | Scenarios, assumptions |

**Technical Notes:**
- Receives context from validation session
- Uses validated market data for projections
- Generates investor-ready documents

---

### Story 08.13: Create Planning Page with Workflow Progress

**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.12

**As a** user
**I want** a planning page to track my business planning progress
**So that** I can complete all planning workflows

**Acceptance Criteria:**
- [ ] Create `/business/[id]/planning` page
- [ ] Display workflow progress for all 9 BMP workflows
- [ ] Show chat interface with Blake (team leader)
- [ ] Display completed artifacts (canvas, projections, etc.)
- [ ] Add download links for generated documents
- [ ] Show dependencies between workflows
- [ ] Indicate which workflows require validation data

**Workflow Dependencies:**
```
business-model-canvas ───┐
                         ├──→ business-plan ──→ pitch-deck
financial-projections ───┤
pricing-strategy ────────┤
growth-forecast ─────────┘
```

**Technical Notes:**
- Similar layout to validation page
- Show document previews where applicable
- Real-time progress updates

---

### Story 08.14: Implement Business Model Canvas Workflow

**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.12

**As a** user
**I want** to create a Business Model Canvas
**So that** I have a structured view of my business model

**Acceptance Criteria:**
- [ ] Create `business-model-canvas` workflow task
- [ ] Model agent guides through 9 canvas blocks:
  1. Customer Segments (from validation ICPs)
  2. Value Propositions
  3. Channels
  4. Customer Relationships
  5. Revenue Streams
  6. Key Resources
  7. Key Activities
  8. Key Partnerships
  9. Cost Structure
- [ ] Pre-fill from validation data where available
- [ ] Generate visual canvas output
- [ ] Store in `PlanningSession.canvas`
- [ ] Export to PDF/image

**Canvas Output:**
```json
{
  "customer_segments": [...],
  "value_propositions": [...],
  "channels": [...],
  "customer_relationships": [...],
  "revenue_streams": [...],
  "key_resources": [...],
  "key_activities": [...],
  "key_partnerships": [...],
  "cost_structure": [...]
}
```

**Technical Notes:**
- Import ICP data from validation
- Interactive canvas editing UI
- Generate shareable canvas image

---

### Story 08.15: Implement Financial Projections Workflow

**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.14

**As a** user
**I want** financial projections
**So that** I understand the financial viability

**Acceptance Criteria:**
- [ ] Create `financial-projections` workflow task
- [ ] Finance agent generates:
  - Revenue projections (3-5 years)
  - Cost projections
  - P&L statement
  - Cash flow forecast
  - Unit economics
  - Break-even analysis
- [ ] Use market data from validation
- [ ] Include sensitivity analysis
- [ ] Show assumptions clearly
- [ ] Store in `PlanningSession.financials`
- [ ] Generate Excel/CSV export

**Financial Model Structure:**
```json
{
  "revenue": {
    "year_1": 500000,
    "year_2": 1500000,
    "year_3": 4000000,
    "assumptions": [...]
  },
  "costs": {...},
  "pnl": {...},
  "cash_flow": {...},
  "unit_economics": {
    "cac": 200,
    "ltv": 2400,
    "ltv_cac_ratio": 12
  }
}
```

**Technical Notes:**
- Finance agent uses CalculatorTool
- Allow assumption modifications
- Recalculate on assumption changes

---

### Story 08.16: Implement Business Plan Synthesis Workflow

**Points:** 3
**Priority:** P1
**Dependencies:** Stories 08.14, 08.15

**As a** user
**I want** a comprehensive business plan
**So that** I have an investor-ready document

**Acceptance Criteria:**
- [ ] Create `business-plan` workflow task
- [ ] Blake synthesizes all planning outputs into sections:
  - Executive Summary
  - Company Description
  - Market Analysis (from validation)
  - Products/Services
  - Business Model (from canvas)
  - Go-to-Market Strategy
  - Operations Plan
  - Management Team
  - Financial Projections
  - Funding Requirements
- [ ] Generate professional markdown document
- [ ] Convert to PDF with branding
- [ ] Store URL in `PlanningSession.businessPlanUrl`
- [ ] HITL approval before finalization

**Technical Notes:**
- Pulls from all prior workflows
- Professional formatting templates
- Support for custom sections

---

### Section 4: Branding Team - BM-Brand (Stories 08.17-08.21)

---

### Story 08.17: Implement Branding Team Agno Configuration

**Points:** 5
**Priority:** P2
**Dependencies:** Story 08.16, EPIC-07

**As a** developer
**I want** the Branding Team configured in Agno
**So that** BM-Brand agents work together as a coordinated team

**Acceptance Criteria:**
- [ ] Create `BrandingTeam` class in AgentOS
- [ ] Configure team leader: Bella (brand-orchestrator)
- [ ] Configure specialist agents:
  - Sage (brand-strategist)
  - Vox (voice-architect)
  - Iris (visual-identity-designer)
  - Artisan (asset-generator)
  - Audit (brand-auditor)
- [ ] Set up leader-based delegation
- [ ] Configure team storage with business context
- [ ] Receive data from BMV and BMP sessions

**Agent Personas:**
| Agent | Name | Role | Key Instructions |
|-------|------|------|------------------|
| Leader | Bella | Orchestrator | Coordinate brand development |
| Member | Sage | Strategist | Positioning, archetype |
| Member | Vox | Voice Architect | Tone, messaging |
| Member | Iris | Visual Designer | Logo, colors, typography |
| Member | Artisan | Asset Generator | Production deliverables |
| Member | Audit | Auditor | Quality assurance |

**Technical Notes:**
- Receives business context from planning
- Generates production-ready assets
- Most complex asset generation

---

### Story 08.18: Create Branding Page with Visual Identity Preview

**Points:** 3
**Priority:** P2
**Dependencies:** Story 08.17

**As a** user
**I want** a branding page to develop my brand identity
**So that** I can create consistent branding

**Acceptance Criteria:**
- [ ] Create `/business/[id]/branding` page
- [ ] Display workflow progress for all 7 brand workflows
- [ ] Show chat interface with Bella (team leader)
- [ ] Display visual identity preview:
  - Logo variations
  - Color palette
  - Typography samples
- [ ] Add asset gallery with download links
- [ ] Show brand guidelines preview

**Technical Notes:**
- Visual-heavy interface
- Real-time preview updates
- Asset download functionality

---

### Story 08.19: Implement Brand Strategy and Voice Workflows

**Points:** 3
**Priority:** P2
**Dependencies:** Story 08.17

**As a** user
**I want** brand strategy and voice guidelines
**So that** my brand has consistent positioning and messaging

**Acceptance Criteria:**
- [ ] Create `brand-strategy` workflow task:
  - Brand archetype (from 12 archetypes)
  - Core values (3-5 values)
  - Brand personality traits
  - Positioning statement
  - Tagline options
- [ ] Create `brand-voice` workflow task:
  - Tone of voice (formal/casual, etc.)
  - Vocabulary guidelines (do/don't say)
  - Messaging templates
  - Content pillars
- [ ] Store in `BrandingSession.positioning` and `voiceGuidelines`

**Brand Strategy Output:**
```json
{
  "archetype": "The Sage",
  "values": ["Innovation", "Clarity", "Empowerment"],
  "personality": ["Smart", "Helpful", "Trustworthy"],
  "positioning": "For SMBs who need..., [Brand] is...",
  "taglines": ["Work Smarter, Not Harder", ...]
}
```

**Technical Notes:**
- Use brand archetype framework
- Generate multiple tagline options
- Link values to messaging

---

### Story 08.20: Implement Visual Identity Workflow

**Points:** 3
**Priority:** P2
**Dependencies:** Story 08.19

**As a** user
**I want** visual identity specifications
**So that** I have consistent visual branding

**Acceptance Criteria:**
- [ ] Create `visual-identity` workflow task
- [ ] Iris agent specifies:
  - Primary color (with hex, RGB, CMYK)
  - Secondary colors
  - Accent colors
  - Typography (heading, body, accent fonts)
  - Logo concept description
  - Logo usage guidelines
  - Spacing and sizing rules
- [ ] Generate color palette visualization
- [ ] Store in `BrandingSession.visualIdentity`
- [ ] Create style guide preview

**Visual Identity Output:**
```json
{
  "colors": {
    "primary": {"hex": "#6366F1", "name": "Indigo"},
    "secondary": {"hex": "#10B981", "name": "Emerald"},
    "accent": {"hex": "#F59E0B", "name": "Amber"},
    "neutrals": [...]
  },
  "typography": {
    "headings": {"family": "Inter", "weights": ["600", "700"]},
    "body": {"family": "Inter", "weights": ["400", "500"]},
    "accent": {"family": "JetBrains Mono"}
  },
  "logo": {
    "concept": "Abstract mark combining...",
    "variations": ["full", "icon", "wordmark"]
  }
}
```

**Technical Notes:**
- Generate accessible color combinations
- Include contrast ratios
- Font pairing recommendations

---

### Story 08.21: Implement Asset Generation Workflow

**Points:** 5
**Priority:** P2
**Dependencies:** Story 08.20

**As a** user
**I want** production-ready brand assets
**So that** I can use them immediately

**Acceptance Criteria:**
- [ ] Create `asset-checklist` workflow task:
  - Generate required asset list based on business type
  - Track completion status
- [ ] Create `asset-generation` workflow task
- [ ] Artisan agent generates:
  - Logo package (SVG, PNG @1x/@2x/@3x)
  - Favicon set (16px to 512px)
  - Social media assets (all platforms)
  - Business card template
  - Email signature
  - Letterhead template
  - Presentation template
- [ ] Follow naming convention: `[brand]-[asset]-[variant]-[size].[format]`
- [ ] Create organized folder structure
- [ ] Generate brand guidelines PDF
- [ ] Store asset URLs in `BrandingSession.generatedAssets`

**Asset Package Structure:**
```
[brand-name]-brand-assets/
├── 01-logos/
│   ├── primary/
│   │   ├── vector/ (SVG)
│   │   ├── png/ (@1x, @2x, @3x)
│   │   └── reversed/
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

**Technical Notes:**
- Use image generation APIs (if available)
- SVG templates for vector assets
- Store in cloud storage with CDN

---

### Section 5: Integration & Handoff (Stories 08.22-08.23)

---

### Story 08.22: Implement Module Handoff Workflows

**Points:** 3
**Priority:** P1
**Dependencies:** Stories 08.11, 08.16

**As a** developer
**I want** seamless handoffs between modules
**So that** data flows correctly through the pipeline

**Acceptance Criteria:**
- [ ] Implement `export-to-planning` workflow (BMV → BMP):
  - Transfer validated market data
  - Transfer customer profiles
  - Transfer competitor analysis
  - Update business phase to PLANNING
- [ ] Implement `export-to-branding` workflow (BMP → Brand):
  - Transfer business model
  - Transfer value propositions
  - Transfer target audience
  - Update business phase to BRANDING
- [ ] Emit appropriate events on each handoff
- [ ] Update `Business.onboardingPhase` on transitions
- [ ] Handle rollback if downstream fails

**Event Flow:**
```
validation.completed → planning.session.init
planning.completed → branding.session.init
branding.completed → business.onboarding.complete
```

**Technical Notes:**
- Use Redis Streams for events
- Atomic phase transitions
- Error handling and recovery

---

### Story 08.23: Implement Onboarding Completion and Handoff to BM-PM

**Points:** 2
**Priority:** P2
**Dependencies:** Story 08.21

**As a** user
**I want** my completed onboarding to transition to active business management
**So that** I can start building products

**Acceptance Criteria:**
- [ ] Create onboarding completion workflow
- [ ] Generate completion summary:
  - Validation score
  - Business plan URL
  - Brand guidelines URL
  - Key metrics
- [ ] Update business status to ACTIVE
- [ ] Trigger `business.onboarding.complete` event
- [ ] Show completion celebration UI
- [ ] Navigate to business dashboard
- [ ] Enable product creation (future BM-PM features)

**Completion Output:**
```json
{
  "business_id": "...",
  "validation_score": 78,
  "documents": {
    "business_plan": "https://...",
    "pitch_deck": "https://...",
    "brand_guidelines": "https://...",
    "asset_package": "https://..."
  },
  "ready_for": ["product_creation", "team_invites"]
}
```

**Technical Notes:**
- Atomic status update
- Confetti/celebration animation
- Clear next steps guidance

---

## Story Summary

| Section | Stories | Total Points |
|---------|---------|--------------|
| Foundation | 08.1 - 08.4 | 18 |
| Validation (BMV) | 08.5 - 08.11 | 23 |
| Planning (BMP) | 08.12 - 08.16 | 17 |
| Branding (BM-Brand) | 08.17 - 08.21 | 19 |
| Integration | 08.22 - 08.23 | 5 |
| **Total** | **23 stories** | **82 points** |

## Priority Distribution

| Priority | Stories | Points |
|----------|---------|--------|
| P0 | 08.1-08.3, 08.5-08.8, 08.11 | 30 |
| P1 | 08.4, 08.9-08.10, 08.12-08.16, 08.22 | 33 |
| P2 | 08.17-08.21, 08.23 | 19 |

## Implementation Phases

### Phase 1: MVP Validation (Sprint N)
Stories: 08.1, 08.2, 08.3, 08.5, 08.6, 08.7, 08.8, 08.11
**Core validation flow working end-to-end**

### Phase 2: Full Validation + Planning Start (Sprint N+1)
Stories: 08.4, 08.9, 08.10, 08.12, 08.13, 08.14, 08.22
**Complete validation, begin planning integration**

### Phase 3: Planning Complete + Branding Start (Sprint N+2)
Stories: 08.15, 08.16, 08.17, 08.18, 08.19
**Complete planning, begin branding**

### Phase 4: Branding Complete + Polish (Sprint N+3)
Stories: 08.20, 08.21, 08.23
**Complete branding, full onboarding flow**

---

## Technical Dependencies

- **EPIC-00:** Database, monorepo structure
- **EPIC-01:** Authentication for user context
- **EPIC-02:** Workspace for business container
- **EPIC-04:** Approval queue for HITL
- **EPIC-07:** AgentOS infrastructure

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Agent quality inconsistent | Medium | High | Extensive prompt engineering, testing |
| Asset generation slow | Medium | Medium | Async generation, progress indicators |
| HITL interrupts flow | Low | Medium | Design for minimal interruption |
| Large file handling | Medium | Medium | CDN, chunked uploads |
