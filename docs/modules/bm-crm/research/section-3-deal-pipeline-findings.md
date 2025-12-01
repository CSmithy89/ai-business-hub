# Section 3: Deal Pipeline Management - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** Twenty CRM Analysis, Industry Best Practices, Pipeline Velocity Research

---

## Summary

Deal pipeline management is the core of CRM functionality. Based on research, we need well-defined stages, clear probability mappings, velocity tracking, and automation triggers.

---

## 1. Deal Entity Design

### 1.1 Core Fields

Based on Twenty CRM's `OpportunityWorkspaceEntity`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Yes | Primary key |
| `workspaceId` | UUID | Yes | Tenant isolation |
| `name` | String | Yes | Deal name |
| `amount` | Decimal | No | Deal value |
| `currency` | String | Yes | ISO currency code |
| `stage` | String | Yes | Current pipeline stage |
| `closeDate` | DateTime | No | Expected close date |

### 1.2 Pipeline Fields

| Field | Type | Notes |
|-------|------|-------|
| `probability` | Integer | Win probability (0-100%) |
| `forecastCategory` | Enum | Pipeline, Best Case, Commit, Closed |
| `pipelineId` | UUID | Which pipeline (for multiple) |
| `lostReason` | String | Why deal was lost |
| `wonReason` | String | Why deal was won |

### 1.3 Relationship Fields

| Field | Type | Notes |
|-------|------|-------|
| `accountId` | UUID | Associated company |
| `contactId` | UUID | Primary contact/champion |
| `ownerId` | UUID | Sales rep owner |
| `createdById` | UUID | Who created the deal |

### 1.4 Tracking Fields

| Field | Type | Notes |
|-------|------|-------|
| `stageEnteredAt` | DateTime | When entered current stage |
| `lastActivityAt` | DateTime | Last engagement |
| `nextStepDate` | DateTime | Next action due |
| `nextStep` | String | Next action description |
| `daysInStage` | Integer | Computed field |

### 1.5 Position for Kanban

```typescript
// Position field for drag-drop ordering within stage
position: Float  // e.g., 1.0, 1.5, 2.0
```

---

## 2. Pipeline Configuration

### 2.1 Recommended Default Stages

Based on B2B best practices research:

| Stage | Position | Probability | Forecast Category | Exit Criteria |
|-------|----------|-------------|-------------------|---------------|
| `LEAD` | 0 | 10% | Pipeline | Initial interest confirmed |
| `QUALIFIED` | 1 | 25% | Pipeline | BANT/MEDDIC qualified |
| `DISCOVERY` | 2 | 40% | Best Case | Pain points identified |
| `PROPOSAL` | 3 | 60% | Best Case | Proposal delivered |
| `NEGOTIATION` | 4 | 80% | Commit | Terms being negotiated |
| `CLOSED_WON` | 5 | 100% | Closed | Deal won |
| `CLOSED_LOST` | 6 | 0% | Closed | Deal lost |

### 2.2 Stage Configuration Schema

```typescript
interface PipelineStage {
  id: string;
  name: string;
  position: number;
  probability: number;
  forecastCategory: 'pipeline' | 'best_case' | 'commit' | 'closed';
  color: string;

  // Automation
  requiredFields?: string[];     // Fields required to enter stage
  automations?: StageAutomation[];

  // Alerts
  maxDaysInStage?: number;       // Alert if exceeds
  isWon?: boolean;
  isLost?: boolean;
}
```

### 2.3 Multiple Pipelines

**Decision:** Support multiple pipelines per workspace.

Use cases:
- Different products (Enterprise vs SMB)
- Different regions
- Different deal types (New vs Renewal)

```typescript
model Pipeline {
  id            String   @id @default(uuid())
  workspaceId   String
  name          String
  description   String?
  isDefault     Boolean  @default(false)
  stages        Json     // Array of PipelineStage

  deals         Deal[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([workspaceId, name])
}
```

### 2.4 Stage Transition Rules

```typescript
interface StageTransition {
  from: string;
  to: string;
  allowed: boolean;
  requiresApproval?: boolean;
  requiredFields?: string[];
  automations?: string[];
}

// Example: Can't skip from LEAD directly to NEGOTIATION
const transitions: StageTransition[] = [
  { from: 'LEAD', to: 'QUALIFIED', allowed: true },
  { from: 'LEAD', to: 'DISCOVERY', allowed: false }, // Must qualify first
  { from: 'QUALIFIED', to: 'DISCOVERY', allowed: true },
  // ...
];
```

---

## 3. Pipeline Analytics

### 3.1 Pipeline Velocity Formula

```typescript
// Pipeline Velocity = (Opportunities × Deal Size × Win Rate) / Sales Cycle
function calculatePipelineVelocity(metrics: PipelineMetrics): number {
  return (
    (metrics.opportunityCount *
     metrics.avgDealSize *
     metrics.winRate) /
    metrics.avgSalesCycleDays
  );
}

// Example: (50 deals × $10,000 × 0.25) / 30 days = $4,166/day
```

**Reference:** [Pipeline Velocity Guide](https://www.factors.ai/blog/pipeline-velocity)

### 3.2 Key Metrics to Track

| Metric | Formula | Target |
|--------|---------|--------|
| **Win Rate** | Won Deals / Total Closed | 20-30% B2B |
| **Avg Deal Size** | Total Won Value / Won Deals | Industry dependent |
| **Sales Cycle Length** | Avg days from Created to Closed | < 90 days |
| **Pipeline Coverage** | Pipeline Value / Quota | 3-4x |
| **Conversion Rate (per stage)** | Deals progressed / Deals entered | Varies |
| **Time in Stage** | Avg days in each stage | Stage dependent |

### 3.3 Forecast Accuracy

```typescript
// Forecast accuracy calculation
function calculateForecastAccuracy(
  forecast: number,
  actual: number
): number {
  if (actual === 0) return forecast === 0 ? 100 : 0;
  return 100 - Math.abs((forecast - actual) / actual * 100);
}

// Target: 85%+ accuracy
```

**Reference:** [DealHub Pipeline Accuracy](https://dealhub.io/glossary/pipeline-accuracy/)

### 3.4 Stage Conversion Analysis

```typescript
interface StageConversion {
  stage: string;
  enteredCount: number;
  progressedCount: number;
  conversionRate: number;
  avgDaysInStage: number;
  stuckCount: number;  // Over threshold
}
```

---

## 4. Deal Activities

### 4.1 Activity Types

| Type | Icon | Auto-logged | Notes |
|------|------|-------------|-------|
| `email` | ✉️ | Yes | Email sent/received |
| `call` | 📞 | Manual | Phone calls |
| `meeting` | 📅 | Yes | Calendar events |
| `note` | 📝 | Manual | Internal notes |
| `task` | ✅ | Manual | Follow-up tasks |
| `stage_change` | 🔄 | Yes | Pipeline movement |
| `field_change` | ✏️ | Yes | Deal field updated |

### 4.2 Activity Logging

**Auto-logged (system):**
- Stage changes
- Field updates
- Email sends (via integration)
- Meeting bookings (via calendar sync)

**Manual logging:**
- Phone calls
- Notes
- Tasks
- Custom activities

### 4.3 Next Action Tracking

```typescript
interface NextAction {
  dealId: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  description: string;
  dueDate: DateTime;
  assigneeId: string;
  completed: boolean;
  completedAt?: DateTime;
}
```

---

## 5. Answers to Research Questions

### Q1: Multiple pipelines per tenant or just one?

**Answer: Multiple pipelines supported.**

Rationale:
- Different sales motions (Enterprise vs PLG)
- Different products may have different stages
- Regional variations
- Twenty CRM supports this via ViewEntity

### Q2: Can deals move backward in pipeline?

**Answer: Yes, with tracking.**

Rationale:
- Deals can regress (e.g., back to Discovery after objection)
- Track regression events for analysis
- Consider: require reason for backward movement

```typescript
// Stage change event
interface StageChangeEvent {
  dealId: string;
  fromStage: string;
  toStage: string;
  direction: 'forward' | 'backward';
  reason?: string;
  changedById: string;
  changedAt: DateTime;
}
```

### Q3: How do we handle split deals or deal linking?

**Answer: Parent-child relationship + linked deals.**

```typescript
// Deal splitting
model Deal {
  // ... other fields
  parentDealId  String?
  parentDeal    Deal?   @relation("DealSplit", fields: [parentDealId], references: [id])
  childDeals    Deal[]  @relation("DealSplit")

  splitRatio    Decimal?  // If split, this deal's portion
}

// Deal linking (related but not split)
model DealLink {
  id        String @id @default(uuid())
  dealAId   String
  dealBId   String
  linkType  String  // "related", "upsell", "renewal"
}
```

### Q4: What triggers "stuck deal" detection?

**Answer: Stage-specific thresholds + automated alerts.**

```typescript
const STUCK_THRESHOLDS = {
  LEAD: 7,           // 7 days without activity
  QUALIFIED: 14,     // 14 days
  DISCOVERY: 21,
  PROPOSAL: 14,
  NEGOTIATION: 30,
};

// Stuck detection query
function findStuckDeals(workspaceId: string): Deal[] {
  return deals.filter(deal => {
    const threshold = STUCK_THRESHOLDS[deal.stage];
    const daysSinceActivity = daysSince(deal.lastActivityAt);
    return daysSinceActivity > threshold && !deal.stage.startsWith('CLOSED');
  });
}
```

---

## 6. Stage Automations

Based on our existing agent mapping, Flow agent suggests automations:

### 6.1 Automation Triggers

```typescript
const STAGE_AUTOMATIONS = {
  'LEAD → QUALIFIED': [
    { id: 'followup_email', name: 'Send personalized follow-up email' },
    { id: 'schedule_discovery', name: 'Schedule discovery call' },
    { id: 'notify_sdr', name: 'Notify SDR of qualified lead' },
  ],
  'QUALIFIED → DISCOVERY': [
    { id: 'prep_questions', name: 'Generate discovery questions' },
    { id: 'research_company', name: 'Research company background' },
  ],
  'DISCOVERY → PROPOSAL': [
    { id: 'generate_proposal', name: 'Generate proposal draft' },
    { id: 'notify_manager', name: 'Alert manager for review' },
    { id: 'schedule_demo', name: 'Schedule solution demo' },
  ],
  'PROPOSAL → NEGOTIATION': [
    { id: 'objection_prep', name: 'Prepare objection handling' },
    { id: 'schedule_followup', name: 'Schedule weekly check-in' },
    { id: 'involve_exec', name: 'Consider executive involvement' },
  ],
  'NEGOTIATION → CLOSED_WON': [
    { id: 'contract_process', name: 'Initiate contract process' },
    { id: 'onboarding_handoff', name: 'Notify CS for onboarding' },
    { id: 'celebrate', name: 'Send celebration notification' },
  ],
  '* → CLOSED_LOST': [
    { id: 'loss_review', name: 'Request loss review feedback' },
    { id: 'nurture_add', name: 'Add to re-engagement nurture' },
    { id: 'analyze_loss', name: 'Log loss reason for analysis' },
  ],
};
```

### 6.2 High-Value Deal Approval

Deals over threshold require approval:

```typescript
interface ApprovalTrigger {
  condition: 'amount_over' | 'discount_over' | 'custom_terms';
  threshold: number;
  approverRole: string;
}

const APPROVAL_TRIGGERS = [
  { condition: 'amount_over', threshold: 50000, approverRole: 'manager' },
  { condition: 'discount_over', threshold: 20, approverRole: 'director' },
  { condition: 'custom_terms', threshold: 0, approverRole: 'legal' },
];
```

---

## 7. Recommended Prisma Schema

```prisma
model Pipeline {
  id            String   @id @default(uuid())
  workspaceId   String

  name          String
  description   String?
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)

  // Stage configuration as JSON
  stages        Json     // PipelineStage[]

  // Relations
  deals         Deal[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model Deal {
  id              String    @id @default(uuid())
  workspaceId     String

  // Core
  name            String
  amount          Decimal?
  currency        String    @default("USD")

  // Pipeline
  pipelineId      String
  pipeline        Pipeline  @relation(fields: [pipelineId], references: [id])
  stage           String    @default("LEAD")
  probability     Int?
  forecastCategory String?

  // Dates
  closeDate       DateTime?
  stageEnteredAt  DateTime  @default(now())

  // Lost/Won
  closedAt        DateTime?
  lostReason      String?
  wonReason       String?
  competitorLostTo String?

  // Tracking
  lastActivityAt  DateTime?
  nextStepDate    DateTime?
  nextStep        String?

  // Relations
  accountId       String?
  account         Account?  @relation(fields: [accountId], references: [id])
  contactId       String?
  contact         Contact?  @relation(fields: [contactId], references: [id])
  ownerId         String?
  createdById     String?

  // Deal splitting
  parentDealId    String?
  parentDeal      Deal?     @relation("DealSplit", fields: [parentDealId], references: [id])
  childDeals      Deal[]    @relation("DealSplit")
  splitRatio      Decimal?

  // Activities
  activities      Activity[]
  stageHistory    StageChange[]

  // Custom
  customFields    Json?
  tags            String[]

  // System
  position        Float     @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@index([workspaceId])
  @@index([pipelineId, stage])
  @@index([accountId])
  @@index([ownerId])
  @@index([closeDate])
}

model StageChange {
  id          String   @id @default(uuid())
  dealId      String
  deal        Deal     @relation(fields: [dealId], references: [id])

  fromStage   String
  toStage     String
  direction   String   // forward, backward
  reason      String?

  changedById String
  changedAt   DateTime @default(now())

  @@index([dealId])
  @@index([changedAt])
}
```

---

## 8. Sources

- [Twenty CRM Analysis](/docs/modules/bm-crm/research/twenty-crm-analysis.md)
- [10 Best Practices for Sales Pipeline Management](https://www.sybill.ai/blogs/10-tips-for-effective-sales-pipeline-management)
- [6 Best Practices for CRM Opportunity Stages](https://www.prospectsoft.com/resources/blog/6-best-practices-for-defining-managing-crm-opportunity-stages/)
- [9 Essential Stages for B2B Pipeline](https://blog.hubspot.com/sales/essential-stages-b2b-sales-pipeline)
- [Pipeline Velocity Definition & Formula](https://www.factors.ai/blog/pipeline-velocity)
- [Pipeline Accuracy | DealHub](https://dealhub.io/glossary/pipeline-accuracy/)
- [How to Improve Forecast Accuracy](https://salesmotion.io/blog/how-to-improve-forecast-accuracy)

---

**Research Status:** ✅ Complete
**Next:** Update checklist and proceed to Section 2 (Lead Scoring)
