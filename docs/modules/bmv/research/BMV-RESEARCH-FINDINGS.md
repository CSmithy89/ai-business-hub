# BMV (Business Validation) Module - Research Findings

**Status:** Complete
**Created:** 2025-11-30
**Module Code:** BMV
**Layer:** Foundation (Standalone - can be built anytime after Core)

---

## Executive Summary

The BMV (Business Validation) module provides AI-powered market validation to help entrepreneurs and businesses validate ideas before significant investment. This document synthesizes research from the MASTER-PLAN, MODULE-RESEARCH, existing BMAD research workflows, and validation best practices.

### Key Decisions Made

| Area | Decision | Rationale |
|------|----------|-----------|
| **Agent Count** | 5 specialized agents | Covers all validation aspects: market sizing, competitors, customers, feasibility, orchestration |
| **Workflow Count** | 5 core workflows | Maps to validation stages: intake, market-sizing, competitors, customers, synthesis |
| **Data Architecture** | PostgreSQL with validation_results table | Persistent storage for all validation data and sources |
| **Anti-Hallucination** | Mandatory source validation | Critical for market data accuracy - must have cited sources |
| **Output Format** | Standardized validation report | Consistent deliverable with confidence scores |

---

## 1. Module Purpose & Scope

### 1.1 Primary Purpose

Validate business ideas before investment through:
- **Market Sizing**: TAM/SAM/SOM calculations with multiple methodologies
- **Competitive Intelligence**: Deep competitor analysis and positioning
- **Customer Profiling**: ICP development and persona creation
- **Feasibility Assessment**: Risk analysis and go/no-go recommendations

### 1.2 Position in Platform

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD PHASE FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User Idea → [BMV] → [BMP] → [BMB] → [BME-*] → Launch     │
│              Validation  Planning  Branding  Product         │
│                                                              │
│   BMV validates the idea before resources are committed      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Dependencies

| Dependency | Type | Notes |
|------------|------|-------|
| Core Platform | Required | Auth, multi-tenancy, event bus |
| Web Search API | Required | For real-time market data gathering |
| BMP (Planning) | Optional Consumer | Receives validated ideas for planning |
| BMI (Intelligence) | Optional Consumer | Can use validation data for monitoring |

---

## 2. Agent Architecture

### 2.1 Agent Team Structure

```
BMV Validation Team (Leader: Validation Orchestrator)
├── Market Researcher
│   ├── TAM/SAM/SOM calculations
│   ├── Industry data gathering
│   └── Market trend analysis
├── Competitor Analyst
│   ├── Competitor identification
│   ├── Feature comparison
│   └── Positioning analysis
├── Customer Profiler
│   ├── ICP development
│   ├── Persona creation
│   └── Jobs-to-be-Done analysis
└── Feasibility Assessor
    ├── Risk assessment
    ├── Resource analysis
    └── Go/no-go recommendation
```

### 2.2 Agent Specifications

#### Validation Orchestrator (Team Lead)

```yaml
agent_id: bmv-orchestrator
role: Validation Team Lead
description: Coordinates the entire validation process, synthesizes findings from all agents into cohesive recommendations
capabilities:
  - Workflow coordination across validation stages
  - Cross-agent data synthesis
  - Confidence scoring of overall validation
  - Final go/no-go recommendation generation
  - Approval request management
tools:
  - validation_synthesis
  - confidence_calculator
  - recommendation_generator
  - approval_requester
model_preference: claude-sonnet (strategic reasoning)
```

#### Market Researcher

```yaml
agent_id: bmv-market-researcher
role: Market Analyst
description: Calculates market sizes and gathers industry intelligence using multiple methodologies
capabilities:
  - TAM/SAM/SOM calculation (top-down, bottom-up, value theory)
  - Market trend identification
  - Industry report analysis
  - Growth rate forecasting
  - Geographic market assessment
tools:
  - web_search
  - market_data_aggregator
  - tam_calculator
  - trend_analyzer
model_preference: gemini-pro (research-optimized)
anti_hallucination:
  - Every market size claim must have 2+ sources
  - All growth rates must cite analyst reports
  - Conflicting data must be presented with all sources
```

#### Competitor Analyst

```yaml
agent_id: bmv-competitor-analyst
role: Competitive Intelligence Specialist
description: Maps competitive landscape and identifies market positioning opportunities
capabilities:
  - Competitor identification and profiling
  - Feature comparison matrix creation
  - Pricing analysis
  - Market share estimation
  - Porter's Five Forces assessment
tools:
  - web_search
  - competitor_profiler
  - positioning_mapper
  - pricing_analyzer
model_preference: claude-sonnet (analytical reasoning)
```

#### Customer Profiler

```yaml
agent_id: bmv-customer-profiler
role: Customer Research Specialist
description: Develops Ideal Customer Profiles and personas using Jobs-to-be-Done framework
capabilities:
  - ICP development
  - Persona creation
  - Jobs-to-be-Done analysis
  - Willingness-to-pay estimation
  - Segment prioritization
tools:
  - web_search
  - persona_generator
  - jtbd_analyzer
  - segment_scorer
model_preference: claude-sonnet (empathy and analysis)
```

#### Feasibility Assessor

```yaml
agent_id: bmv-feasibility-assessor
role: Risk and Feasibility Analyst
description: Evaluates technical, financial, and market risks to provide go/no-go recommendations
capabilities:
  - Risk identification and scoring
  - Resource requirement estimation
  - Time-to-market analysis
  - Barrier-to-entry assessment
  - Success probability calculation
tools:
  - risk_scorer
  - resource_estimator
  - barrier_analyzer
  - probability_calculator
model_preference: claude-sonnet (risk analysis)
```

### 2.3 Agent TypeScript Interfaces

```typescript
interface ValidationOrchestrator extends IAssistantClient {
  // Workflow management
  startValidation(ideaInput: IdeaInput): Promise<ValidationSession>;
  getValidationStatus(sessionId: string): Promise<ValidationStatus>;

  // Agent coordination
  assignTask(agentId: string, task: ValidationTask): Promise<void>;
  collectAgentResults(): Promise<AgentResult[]>;

  // Synthesis
  synthesizeFindings(results: AgentResult[]): Promise<ValidationSynthesis>;
  generateRecommendation(synthesis: ValidationSynthesis): Promise<GoNoGoRecommendation>;

  // Approval
  requestApproval(recommendation: GoNoGoRecommendation): Promise<ApprovalRequest>;
}

interface MarketResearcher extends IAssistantClient {
  // Market sizing
  calculateTAM(market: MarketDefinition): Promise<TAMCalculation>;
  calculateSAM(tam: TAMCalculation, constraints: SAMConstraints): Promise<SAMCalculation>;
  calculateSOM(sam: SAMCalculation, scenarios: SOMScenario[]): Promise<SOMCalculation>;

  // Research
  gatherMarketIntelligence(queries: MarketQuery[]): Promise<MarketIntelligence>;
  identifyTrends(market: MarketDefinition): Promise<MarketTrend[]>;

  // Validation
  validateSources(claims: MarketClaim[]): Promise<SourceValidation>;
}

interface CompetitorAnalyst extends IAssistantClient {
  // Discovery
  identifyCompetitors(market: MarketDefinition): Promise<Competitor[]>;

  // Analysis
  profileCompetitor(competitor: Competitor): Promise<CompetitorProfile>;
  createFeatureMatrix(competitors: Competitor[]): Promise<FeatureMatrix>;
  analyzePricing(competitors: Competitor[]): Promise<PricingAnalysis>;

  // Positioning
  mapCompetitivePositioning(competitors: Competitor[]): Promise<PositioningMap>;
  identifyGaps(positioning: PositioningMap): Promise<MarketGap[]>;
}

interface CustomerProfiler extends IAssistantClient {
  // ICP Development
  createICP(inputs: ICPInputs): Promise<IdealCustomerProfile>;

  // Persona Creation
  generatePersonas(icp: IdealCustomerProfile): Promise<CustomerPersona[]>;

  // JTBD Analysis
  analyzeJobsToBeDone(segment: CustomerSegment): Promise<JTBDAnalysis>;

  // Pricing
  estimateWillingnessToPay(segment: CustomerSegment): Promise<WTPEstimate>;
}

interface FeasibilityAssessor extends IAssistantClient {
  // Risk Assessment
  identifyRisks(validation: ValidationData): Promise<Risk[]>;
  scoreRisks(risks: Risk[]): Promise<RiskMatrix>;

  // Feasibility
  assessTechnicalFeasibility(idea: BusinessIdea): Promise<TechnicalAssessment>;
  assessFinancialFeasibility(idea: BusinessIdea): Promise<FinancialAssessment>;
  assessMarketFeasibility(marketData: MarketData): Promise<MarketAssessment>;

  // Recommendation
  generateGoNoGo(assessments: Assessment[]): Promise<GoNoGoRecommendation>;
}
```

---

## 3. Data Model

### 3.1 Core Entities

```typescript
interface ValidationSession {
  id: string;                        // UUID
  tenantId: string;                  // Multi-tenant isolation
  userId: string;                    // Creator
  status: ValidationStatus;          // draft | in_progress | completed | archived

  // Input
  ideaInput: IdeaInput;

  // Progress
  currentStage: ValidationStage;
  stageResults: Map<ValidationStage, StageResult>;

  // Output
  finalReport?: ValidationReport;
  recommendation?: GoNoGoRecommendation;
  confidenceScore?: number;          // 0-100

  // Audit
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface IdeaInput {
  id: string;
  name: string;
  description: string;
  category: string;
  targetMarket?: string;
  geographicScope?: GeographicScope;
  existingCompetitors?: string[];    // User-provided
  additionalContext?: string;
}

interface MarketSizing {
  id: string;
  sessionId: string;

  // TAM
  tamValue: number;
  tamCurrency: string;
  tamMethodology: 'top_down' | 'bottom_up' | 'value_theory';
  tamCalculation: TAMCalculation;
  tamSources: Source[];
  tamConfidence: ConfidenceLevel;

  // SAM
  samValue: number;
  samConstraints: SAMConstraints;
  samCalculation: string;
  samSources: Source[];
  samConfidence: ConfidenceLevel;

  // SOM
  somScenarios: SOMScenario[];
  somSources: Source[];
  somConfidence: ConfidenceLevel;

  // Metadata
  calculatedAt: Date;
  dataFreshness: Date;               // When source data was published
}

interface CompetitorAnalysis {
  id: string;
  sessionId: string;

  competitors: Competitor[];
  featureMatrix: FeatureMatrix;
  pricingAnalysis: PricingAnalysis;
  positioningMap: PositioningMap;
  marketGaps: MarketGap[];
  fiveForces: PortersFiveForces;

  sources: Source[];
  analyzedAt: Date;
}

interface CustomerProfile {
  id: string;
  sessionId: string;

  icp: IdealCustomerProfile;
  personas: CustomerPersona[];
  jtbdAnalysis: JTBDAnalysis;
  wtpEstimate: WTPEstimate;
  segmentPrioritization: SegmentPriority[];

  sources: Source[];
  createdAt: Date;
}

interface FeasibilityAssessment {
  id: string;
  sessionId: string;

  // Risk Matrix
  risks: Risk[];
  riskMatrix: RiskMatrix;

  // Assessments
  technicalFeasibility: TechnicalAssessment;
  financialFeasibility: FinancialAssessment;
  marketFeasibility: MarketAssessment;

  // Recommendation
  goNoGo: GoNoGoRecommendation;
  confidenceScore: number;

  assessedAt: Date;
}

interface ValidationReport {
  id: string;
  sessionId: string;

  // Executive Summary
  executiveSummary: string;
  keyFindings: string[];
  recommendation: GoNoGoRecommendation;
  confidenceScore: number;

  // Sections
  marketSizing: MarketSizing;
  competitorAnalysis: CompetitorAnalysis;
  customerProfile: CustomerProfile;
  feasibilityAssessment: FeasibilityAssessment;

  // Source Audit
  totalSources: number;
  highConfidenceClaims: number;
  singleSourceClaims: number;
  lowConfidenceClaims: number;

  // Metadata
  generatedAt: Date;
  expiresAt: Date;                   // Market data has shelf life
}
```

### 3.2 Supporting Types

```typescript
type ValidationStatus = 'draft' | 'in_progress' | 'awaiting_input' | 'completed' | 'archived';

type ValidationStage =
  | 'idea_intake'
  | 'market_sizing'
  | 'competitor_mapping'
  | 'customer_discovery'
  | 'validation_synthesis';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

interface Source {
  id: string;
  name: string;
  url?: string;
  publishedDate?: Date;
  credibility: 'high' | 'medium' | 'low';
  dataType: 'primary' | 'secondary' | 'tertiary';
  verified: boolean;
  verificationNotes?: string;
}

interface TAMCalculation {
  methodology: 'top_down' | 'bottom_up' | 'value_theory';
  formula: string;
  inputs: Map<string, number>;
  calculation: string;              // Step-by-step calculation
  result: number;
  unit: string;
}

interface SOMScenario {
  name: 'conservative' | 'realistic' | 'optimistic';
  marketSharePercent: number;
  value: number;
  assumptions: string[];
  timeframe: string;
}

interface GoNoGoRecommendation {
  decision: 'go' | 'no_go' | 'conditional_go' | 'pivot';
  confidence: number;               // 0-100
  summary: string;
  keyStrengths: string[];
  keyRisks: string[];
  conditions?: string[];            // For conditional_go
  pivotSuggestions?: string[];      // For pivot
  nextSteps: string[];
}

interface Risk {
  id: string;
  category: 'market' | 'competitive' | 'technical' | 'financial' | 'operational';
  description: string;
  impact: 'high' | 'medium' | 'low';
  probability: 'high' | 'medium' | 'low';
  riskScore: number;                // impact × probability
  mitigation?: string;
}

interface PortersFiveForces {
  supplierPower: ForceAssessment;
  buyerPower: ForceAssessment;
  competitiveRivalry: ForceAssessment;
  threatOfNewEntry: ForceAssessment;
  threatOfSubstitutes: ForceAssessment;
  overallAttractiveness: 'high' | 'medium' | 'low';
  summary: string;
}

interface ForceAssessment {
  rating: 'high' | 'medium' | 'low';
  factors: string[];
  evidence: string[];
  sources: Source[];
}

interface JTBDAnalysis {
  functionalJobs: Job[];
  emotionalJobs: Job[];
  socialJobs: Job[];
  painPoints: string[];
  gains: string[];
}

interface Job {
  description: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  currentSolution?: string;
  satisfactionLevel?: 'low' | 'medium' | 'high';
}
```

### 3.3 Database Schema (Prisma)

```prisma
// BMV Module Schema

model ValidationSession {
  id                String               @id @default(uuid())
  tenantId          String
  userId            String
  status            ValidationStatus     @default(DRAFT)

  // Input
  ideaName          String
  ideaDescription   String               @db.Text
  category          String
  targetMarket      String?
  geographicScope   Json?
  additionalContext String?              @db.Text

  // Progress
  currentStage      ValidationStage      @default(IDEA_INTAKE)

  // Relationships
  marketSizing      MarketSizing?
  competitorAnalysis CompetitorAnalysis?
  customerProfile   CustomerProfile?
  feasibility       FeasibilityAssessment?
  finalReport       ValidationReport?

  // Audit
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
  completedAt       DateTime?

  @@index([tenantId])
  @@index([userId])
  @@index([status])
}

model MarketSizing {
  id                String               @id @default(uuid())
  sessionId         String               @unique
  session           ValidationSession    @relation(fields: [sessionId], references: [id])

  tamValue          Decimal
  tamCurrency       String               @default("USD")
  tamMethodology    TAMMethodology
  tamCalculation    Json
  tamConfidence     ConfidenceLevel

  samValue          Decimal
  samConstraints    Json
  samCalculation    String               @db.Text
  samConfidence     ConfidenceLevel

  somScenarios      Json                 // SOMScenario[]
  somConfidence     ConfidenceLevel

  sources           Json                 // Source[]
  calculatedAt      DateTime             @default(now())
  dataFreshness     DateTime
}

model CompetitorAnalysis {
  id                String               @id @default(uuid())
  sessionId         String               @unique
  session           ValidationSession    @relation(fields: [sessionId], references: [id])

  competitors       Json                 // Competitor[]
  featureMatrix     Json
  pricingAnalysis   Json
  positioningMap    Json
  marketGaps        Json                 // MarketGap[]
  fiveForces        Json                 // PortersFiveForces

  sources           Json                 // Source[]
  analyzedAt        DateTime             @default(now())
}

model CustomerProfile {
  id                String               @id @default(uuid())
  sessionId         String               @unique
  session           ValidationSession    @relation(fields: [sessionId], references: [id])

  icp               Json                 // IdealCustomerProfile
  personas          Json                 // CustomerPersona[]
  jtbdAnalysis      Json                 // JTBDAnalysis
  wtpEstimate       Json                 // WTPEstimate
  segmentPriority   Json                 // SegmentPriority[]

  sources           Json                 // Source[]
  createdAt         DateTime             @default(now())
}

model FeasibilityAssessment {
  id                String               @id @default(uuid())
  sessionId         String               @unique
  session           ValidationSession    @relation(fields: [sessionId], references: [id])

  risks             Json                 // Risk[]
  riskMatrix        Json

  technicalFeasibility Json
  financialFeasibility Json
  marketFeasibility    Json

  goNoGo            Json                 // GoNoGoRecommendation
  confidenceScore   Int                  // 0-100

  assessedAt        DateTime             @default(now())
}

model ValidationReport {
  id                String               @id @default(uuid())
  sessionId         String               @unique
  session           ValidationSession    @relation(fields: [sessionId], references: [id])

  executiveSummary  String               @db.Text
  keyFindings       Json                 // string[]
  recommendation    Json                 // GoNoGoRecommendation
  confidenceScore   Int                  // 0-100

  // Source Audit
  totalSources         Int
  highConfidenceClaims Int
  singleSourceClaims   Int
  lowConfidenceClaims  Int

  generatedAt       DateTime             @default(now())
  expiresAt         DateTime
}

enum ValidationStatus {
  DRAFT
  IN_PROGRESS
  AWAITING_INPUT
  COMPLETED
  ARCHIVED
}

enum ValidationStage {
  IDEA_INTAKE
  MARKET_SIZING
  COMPETITOR_MAPPING
  CUSTOMER_DISCOVERY
  VALIDATION_SYNTHESIS
}

enum TAMMethodology {
  TOP_DOWN
  BOTTOM_UP
  VALUE_THEORY
}

enum ConfidenceLevel {
  HIGH
  MEDIUM
  LOW
  UNVERIFIED
}
```

---

## 4. Workflow Definitions

### 4.1 Workflow Overview

| Workflow | Trigger | Agents Involved | Output |
|----------|---------|-----------------|--------|
| `idea-intake` | User submits idea | Orchestrator | Structured IdeaInput |
| `market-sizing` | After idea-intake | Market Researcher | TAM/SAM/SOM |
| `competitor-mapping` | After idea-intake | Competitor Analyst | CompetitorAnalysis |
| `customer-discovery` | After idea-intake | Customer Profiler | CustomerProfile |
| `validation-synthesis` | After all above | All agents + Orchestrator | ValidationReport |

### 4.2 Workflow: idea-intake

```yaml
name: idea-intake
description: Capture and structure business idea with clarifying questions
agent: bmv-orchestrator
trigger: user_request | api_call

steps:
  - step: 1
    action: Greet user and explain validation process
    output: welcome_message

  - step: 2
    action: Gather core idea information
    prompts:
      - "What's the name of your business idea?"
      - "Describe what it does in 2-3 sentences"
      - "What category does it fall into?"
    output: basic_info

  - step: 3
    action: Clarify target market
    prompts:
      - "Who is your target customer? (B2B, B2C, or both?)"
      - "What geographic markets are you targeting?"
      - "Do you know of any existing competitors?"
    output: market_context

  - step: 4
    action: Understand validation goals
    prompts:
      - "What's driving this validation? (fundraising, launch decision, pivot?)"
      - "What's your biggest uncertainty?"
      - "How deep should we go? (Quick assessment vs. comprehensive)"
    output: validation_scope

  - step: 5
    action: Synthesize and confirm
    output: structured_idea_input
    approval_required: false

on_complete:
  - Create ValidationSession in database
  - Trigger parallel workflows: market-sizing, competitor-mapping, customer-discovery
  - Emit event: validation.session.created
```

### 4.3 Workflow: market-sizing

```yaml
name: market-sizing
description: Calculate TAM/SAM/SOM with multiple methodologies and source validation
agent: bmv-market-researcher
trigger: validation.session.created | manual

anti_hallucination:
  - Every market size must have 2+ independent sources
  - All growth rates must cite analyst reports
  - Conflicting data must be presented with all sources
  - Mark confidence: [Verified - 2+ sources], [Single source], [Estimated]

steps:
  - step: 1
    action: Define market boundaries
    web_search:
      - "{category} market definition"
      - "{category} industry classification"
    output: market_definition

  - step: 2
    action: Research TAM using top-down approach
    web_search:
      - "{category} market size {year}"
      - "{category} industry report Gartner Forrester IDC {year}"
      - "{category} TAM total addressable market {year}"
    validation: Require 2+ sources for TAM figure
    output: tam_top_down

  - step: 3
    action: Research TAM using bottom-up approach
    calculation: |
      Number of potential customers × Average revenue per customer
    output: tam_bottom_up

  - step: 4
    action: Research TAM using value theory
    calculation: |
      Value created × Capturable percentage
    output: tam_value_theory

  - step: 5
    action: Triangulate TAM estimates
    output: tam_final

  - step: 6
    action: Calculate SAM with constraints
    constraints:
      - Geographic limitations
      - Regulatory restrictions
      - Technical requirements
      - Business model limitations
    output: sam_calculation

  - step: 7
    action: Calculate SOM scenarios
    scenarios:
      - Conservative (1-2% market share)
      - Realistic (3-5% market share)
      - Optimistic (5-10% market share)
    output: som_scenarios

  - step: 8
    action: Validate all sources
    validation:
      - Count high-confidence claims
      - Flag single-source claims
      - Mark low-confidence data
    output: source_validation

on_complete:
  - Save MarketSizing to database
  - Emit event: validation.market_sizing.completed
```

### 4.4 Workflow: competitor-mapping

```yaml
name: competitor-mapping
description: Deep competitive analysis with positioning map
agent: bmv-competitor-analyst
trigger: validation.session.created | manual

steps:
  - step: 1
    action: Identify competitors
    web_search:
      - "{category} competitors {year}"
      - "{category} alternatives comparison"
      - "top {category} companies {geographic_scope}"
    output: competitor_list

  - step: 2
    action: User selection
    prompt: "Select 3-5 competitors most relevant to analyze"
    output: selected_competitors

  - step: 3
    action: Profile each competitor
    repeat: for each selected_competitor
    web_search:
      - "{competitor} company overview"
      - "{competitor} pricing"
      - "{competitor} funding {year}"
      - "{competitor} reviews ratings"
    output: competitor_profiles

  - step: 4
    action: Create feature comparison matrix
    output: feature_matrix

  - step: 5
    action: Analyze pricing strategies
    output: pricing_analysis

  - step: 6
    action: Create competitive positioning map
    dimensions:
      - Price vs. Value
      - Feature completeness vs. Ease of use
      - Enterprise vs. SMB focus
    output: positioning_map

  - step: 7
    action: Identify market gaps
    output: market_gaps

  - step: 8
    action: Apply Porter's Five Forces
    output: five_forces_analysis

on_complete:
  - Save CompetitorAnalysis to database
  - Emit event: validation.competitor_analysis.completed
```

### 4.5 Workflow: customer-discovery

```yaml
name: customer-discovery
description: ICP development and persona creation using JTBD framework
agent: bmv-customer-profiler
trigger: validation.session.created | manual

steps:
  - step: 1
    action: Define customer segments
    output: segment_definitions

  - step: 2
    action: Research each segment
    repeat: for each segment
    web_search:
      - "{segment} demographics firmographics"
      - "{segment} buying behavior"
      - "{segment} pain points {category}"
    output: segment_research

  - step: 3
    action: Build Ideal Customer Profile
    components:
      - Demographics/Firmographics
      - Psychographics
      - Behavioral patterns
      - Budget and authority
    output: icp

  - step: 4
    action: Apply Jobs-to-be-Done framework
    categories:
      - Functional jobs
      - Emotional jobs
      - Social jobs
    output: jtbd_analysis

  - step: 5
    action: Generate customer personas
    repeat: for top 2-3 segments
    output: personas

  - step: 6
    action: Estimate willingness to pay
    factors:
      - Current spending on alternatives
      - Budget allocation for category
      - Value perception
      - Price points of substitutes
    output: wtp_estimate

  - step: 7
    action: Prioritize segments
    criteria:
      - Market size
      - Accessibility
      - Profitability
      - Strategic fit
    output: segment_prioritization

on_complete:
  - Save CustomerProfile to database
  - Emit event: validation.customer_profile.completed
```

### 4.6 Workflow: validation-synthesis

```yaml
name: validation-synthesis
description: Synthesize all findings into final recommendation
agent: bmv-orchestrator
trigger:
  all_completed:
    - validation.market_sizing.completed
    - validation.competitor_analysis.completed
    - validation.customer_profile.completed

steps:
  - step: 1
    action: Collect all agent results
    output: collected_results

  - step: 2
    action: Assign feasibility assessment
    delegate_to: bmv-feasibility-assessor
    output: feasibility_assessment

  - step: 3
    action: Calculate overall confidence score
    formula: |
      (market_confidence × 0.3) +
      (competitor_confidence × 0.2) +
      (customer_confidence × 0.25) +
      (feasibility_confidence × 0.25)
    output: confidence_score

  - step: 4
    action: Generate go/no-go recommendation
    thresholds:
      go: confidence >= 70 AND no high-impact unmitigated risks
      conditional_go: confidence >= 50 AND manageable risks
      pivot: confidence < 50 BUT viable alternative identified
      no_go: confidence < 50 AND no viable alternative
    output: recommendation

  - step: 5
    action: Draft executive summary
    output: executive_summary

  - step: 6
    action: Compile final report
    output: validation_report

  - step: 7
    action: Source audit
    validate:
      - Count total sources
      - Count high-confidence claims (2+ sources)
      - Flag single-source claims
      - Flag low-confidence claims
    output: source_audit

  - step: 8
    action: Request approval
    approval_required: true
    approval_content:
      - Executive summary
      - Key metrics (TAM/SAM/SOM)
      - Recommendation with confidence score
      - Top 3 risks
    output: approval_request

on_complete:
  - Save ValidationReport to database
  - Emit event: validation.completed
  - If approved, emit: validation.approved
```

---

## 5. Event Schema

### 5.1 BMV Events

| Event | Trigger | Payload | Consumers |
|-------|---------|---------|-----------|
| `validation.session.created` | New validation started | `{ sessionId, ideaName, userId }` | BMV agents, Notifications |
| `validation.market_sizing.completed` | Market sizing done | `{ sessionId, tamValue, samValue, somValue }` | BMV Orchestrator |
| `validation.competitor_analysis.completed` | Competitor analysis done | `{ sessionId, competitorCount, gapCount }` | BMV Orchestrator |
| `validation.customer_profile.completed` | Customer profiling done | `{ sessionId, segmentCount, personaCount }` | BMV Orchestrator |
| `validation.completed` | Full validation done | `{ sessionId, recommendation, confidence }` | BMP, Notifications |
| `validation.approved` | User approved | `{ sessionId, approvedBy }` | BMP (triggers planning) |
| `validation.rejected` | User rejected | `{ sessionId, rejectedBy, reason }` | Analytics |

---

## 6. UI Components

### 6.1 Validation Dashboard

```
┌────────────────────────────────────────────────────────────────────────┐
│  Validation Hub                                      [+ New Validation] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACTIVE VALIDATIONS                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🔬 "SustainableGrow" - Vertical Gardening SaaS                    │ │
│  │ Stage: Competitor Mapping (3/5)                                   │ │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●─────────────────  60%            │ │
│  │ [View Details] [Continue]                                         │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  COMPLETED VALIDATIONS                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ✅ "PetConnect" - Pet Services Marketplace                        │ │
│  │ Recommendation: GO (Confidence: 78%)                              │ │
│  │ Completed: Nov 28, 2025                                           │ │
│  │ [View Report] [Proceed to Planning]                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Validation Progress View

```
┌────────────────────────────────────────────────────────────────────────┐
│  Validating: "SustainableGrow"                                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PROGRESS                                                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Idea Intake          │ Completed                               │ │
│  │ ✅ Market Sizing        │ TAM: $4.2B, SAM: $850M, SOM: $25M       │ │
│  │ 🔄 Competitor Mapping   │ Analyzing 5 competitors...              │ │
│  │ ⏳ Customer Discovery   │ Pending                                  │ │
│  │ ⏳ Synthesis            │ Pending                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  LIVE AGENT ACTIVITY                                                   │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ 🔍 Competitor Analyst: Researching "GreenThumb Pro" pricing...   │ │
│  │ 📊 Market Researcher: TAM calculation complete (3 sources)        │ │
│  │ 👤 Customer Profiler: Waiting for competitor data...             │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  💬 Chat with Validation Team                                          │
│  [Type a message or ask a question about the validation...]            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Validation Report View

```
┌────────────────────────────────────────────────────────────────────────┐
│  Validation Report: "SustainableGrow"                   [Export PDF]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  RECOMMENDATION                                                   │ │
│  │                                                                   │ │
│  │        🟢 GO                     Confidence: 78%                 │ │
│  │                                                                   │ │
│  │  "The vertical gardening market shows strong growth potential    │ │
│  │   with underserved B2C segment. Recommend proceeding to          │ │
│  │   planning phase with focus on mobile-first approach."           │ │
│  │                                                                   │ │
│  │  [✓ Approve & Proceed to Planning] [✏ Request Changes] [✗ Reject]│
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  KEY METRICS                                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                      │
│  │    TAM      │ │    SAM      │ │    SOM      │                      │
│  │   $4.2B     │ │   $850M     │ │   $25-85M   │                      │
│  │  (±15%)     │ │  (±20%)     │ │ 3yr range   │                      │
│  └─────────────┘ └─────────────┘ └─────────────┘                      │
│                                                                         │
│  [Market Analysis] [Competitors] [Customers] [Risks] [Sources]         │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Integration Points

### 7.1 Platform Foundation Dependencies

| Component | Usage in BMV |
|-----------|--------------|
| Auth | User authentication for validation sessions |
| Multi-tenancy | Isolate validation data per tenant |
| Event Bus | Emit validation events for downstream modules |
| Approval System | Request user approval for recommendations |
| Notification System | Notify on validation completion |

### 7.2 Downstream Module Integrations

| Module | Integration |
|--------|-------------|
| BMP (Planning) | Receives approved validations to start planning |
| BMI (Intelligence) | Can use validation data for ongoing monitoring |
| BM-CRM | Can link validation sessions to contacts/opportunities |

### 7.3 External Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| Web Search APIs | Real-time market data | Required |
| Statista API | Market data | Optional |
| SimilarWeb API | Traffic analysis | Optional |
| Crunchbase API | Funding data | Optional |
| LinkedIn API | Company data | Optional |

---

## 8. Anti-Hallucination Protocol

### 8.1 Source Validation Rules

```typescript
interface AntiHallucinationRules {
  // Market Size Claims
  marketSizeClaims: {
    minSources: 2;
    maxAge: 24; // months
    requiredSourceTypes: ['analyst_report', 'government_data', 'industry_publication'];
  };

  // Growth Rate Claims
  growthRateClaims: {
    minSources: 2;
    requireCAGRMethodology: true;
    flagIfConflict: true;
  };

  // Competitor Data
  competitorClaims: {
    requireSourceUrl: true;
    maxAge: 12; // months for pricing
    verifyFundingWithCrunchbase: true;
  };

  // Customer Data
  customerClaims: {
    requireResearchBacking: true;
    flagAssumptions: true;
  };
}
```

### 8.2 Confidence Labeling

All claims must be labeled:
- **[Verified - 2+ sources]**: High confidence, multiple corroborating sources
- **[Single source - verify]**: Medium confidence, needs verification
- **[Estimated - low confidence]**: Agent estimation, not sourced
- **FACT**: Sourced data with citation
- **ANALYSIS**: Agent interpretation of facts
- **PROJECTION**: Forecast or speculation

---

## 9. Implementation Priorities

### 9.1 MVP (Phase 1)

1. **Core Workflows**
   - idea-intake workflow
   - market-sizing workflow (simplified)
   - validation-synthesis workflow

2. **Core Agents**
   - Validation Orchestrator
   - Market Researcher

3. **Basic UI**
   - Validation initiation form
   - Progress tracker
   - Basic report view

### 9.2 Enhanced (Phase 2)

1. **Full Agent Team**
   - Competitor Analyst
   - Customer Profiler
   - Feasibility Assessor

2. **Full Workflows**
   - competitor-mapping
   - customer-discovery

3. **Enhanced UI**
   - Interactive report
   - Source validation viewer
   - Comparison tools

### 9.3 Advanced (Phase 3)

1. **External Integrations**
   - Statista, SimilarWeb, Crunchbase APIs

2. **Advanced Features**
   - Historical validation tracking
   - Validation templates
   - Export to BMP

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Validation accuracy | >80% | Compare recommendations vs. actual outcomes |
| Source credibility | >70% high-confidence | Count verified claims per report |
| User satisfaction | >4.0/5 | Post-validation survey |
| Time to complete | <2 hours | Average validation duration |
| Conversion to planning | >60% | Approved validations proceeding to BMP |

---

## References

### Inspiration Sources

| Source | URL | Key Patterns |
|--------|-----|--------------|
| Gartner Research | https://www.gartner.com | Market sizing methodologies |
| CB Insights | https://www.cbinsights.com | Startup failure patterns |
| Statista | https://www.statista.com | Market data APIs |
| SimilarWeb | https://www.similarweb.com | Traffic/competitor analysis |
| SparkToro | https://sparktoro.com | Audience research |
| Strategyzer | https://www.strategyzer.com | Business Model Canvas |
| Lean Canvas | https://leanstack.com | Lean startup methodology |

### Internal Documentation

- `/docs/MASTER-PLAN.md` - Platform vision and module overview
- `/docs/archive/foundation-phase/MODULE-RESEARCH.md` - Module specifications
- `/.bmad/bmm/workflows/1-analysis/research/` - Research workflow patterns
- `/docs/modules/bm-pm/research/BM-PM-RESEARCH-FINDINGS.md` - Sister module research

---

**Document Status:** Complete
**Next Action:** Create BMV module using `/bmad:bmb:workflows:create-module`
