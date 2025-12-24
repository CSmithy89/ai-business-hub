# BM-Marketing Module - Architecture Plan

**Version:** 1.0
**Created:** 2025-12-24
**Status:** Planning
**Module Type:** Core Strategic Module (BUILD Phase)

---

## Executive Summary

BM-Marketing is a **core strategic marketing module** that sits in the BUILD phase alongside BMV, BMP, and BM-Brand. It handles high-level marketing strategy and go-to-market planning, while tactical execution modules extend it for specific channels.

**Key Insight:** BM-Marketing is to tactical channels what BM-CRM is to BM-Sales. It owns the **strategy**, while extensions handle **execution**.

### Module Hierarchy

```
BUILD Phase (Strategy)                    OPERATE Phase (Execution)
───────────────────────────────────────────────────────────────────
BMV → BMP → BM-Brand
              ↓
         BM-Marketing  ───────────────→   Standalone Modules (coordinate via A2A):
         (Campaign Orchestrator)          ├─ BM-Social (social media)
              │                           ├─ BM-Email (email marketing)
              │                           ├─ BM-CMS (website/blog)
              │                           ├─ BM-SEO (search optimization)
              │                           └─ BM-Ads (paid advertising)
              │
              └─── Optional ───────────→   BM-Support (inquiry routing)
```

---

## Module Classification

| Attribute | Value |
|-----------|-------|
| **Module ID** | `bm-marketing` |
| **Category** | BUILD Phase |
| **Type** | Core Strategic Module |
| **Requires** | `bm-brand` (for brand guidelines & voice) |
| **Coordinates** | `bm-social`, `bm-email`, `bm-cms`, `bm-seo`, `bm-ads` (standalone modules via A2A) |
| **Integrates** | `bm-support` (optional, for inquiry routing) |
| **Agent Count** | 6 |
| **Priority** | P1 (after BM-Brand, before tactical modules) |

### Dynamic Module System Integration

```yaml
# Module manifest
id: bm-marketing
name: "Marketing Strategy"
description: "Go-to-market strategy, campaign orchestration, and marketing intelligence"
version: "1.0.0"
phase: BUILD
dependencies:
  - module: bm-brand
    version: ">=1.0.0"
    type: required
    reason: "Brand voice, guidelines, and positioning"
coordinates:  # Standalone modules - BM-Marketing orchestrates campaigns via A2A
  - bm-social
  - bm-email
  - bm-cms
  - bm-seo
  - bm-ads
optional_integrations:
  - module: bm-support
    type: bidirectional
    reason: "Route marketing inquiries to unified inbox"
  - module: bm-crm
    type: bidirectional
    reason: "Audience sync, lead handoff"
interfaces:
  - AG-UI
  - A2A
```

---

## What BM-Marketing Owns vs Extensions

### BM-Marketing Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **GTM Strategy** | Go-to-market planning, launch coordination |
| **Campaign Architecture** | Campaign structure, objectives, timeline |
| **Audience Segmentation** | Define and manage audience segments |
| **Channel Mix** | Recommend optimal channel allocation |
| **Budget Allocation** | Distribute marketing budget across channels |
| **Attribution** | Aggregate performance across all channels |

### What Standalone Modules Own

| Module | Ownership |
|--------|-----------|
| **BM-Social** | Social platform execution, posting, engagement |
| **BM-Email** | Email sequences, templates, deliverability |
| **BM-CMS** | Website pages, blog posts, landing pages |
| **BM-SEO** | Keyword research, on-page optimization, rankings |
| **BM-Ads** | Ad creative, bidding, platform management |

---

## Agent Registry

### Handle Convention

All Marketing agents use: `@bm-marketing.{agent-key}`

### Naming Collision Check

Per `/docs/architecture/cross-module-architecture.md`:
- `budget` - unique (BM-Finance uses `bookkeeper`, `controller`, `cfo`, `compliance`)
- All proposed names are unique

### BM-Marketing Agent Team (6 Agents)

```
┌─────────────────────────────────────────────────────────────┐
│                 MARKETING TEAM (6 Agents)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      ┌─────────┐                            │
│                      │  Maven  │ ← Team Leader              │
│                      │  (GTM)  │                            │
│                      └────┬────┘                            │
│                           │                                  │
│     ┌─────────┬──────────┼──────────┬─────────┐            │
│     │         │          │          │         │            │
│ ┌───┴───┐ ┌───┴───┐ ┌────┴────┐ ┌───┴───┐ ┌───┴───┐       │
│ │Channel│ │Segment│ │Campaign │ │Budget │ │Measure│       │
│ │(Alloc)│ │(Aud.) │ │ (Orch.) │ │($$)   │ │(Attr.)│       │
│ └───────┘ └───────┘ └─────────┘ └───────┘ └───────┘       │
│                                                              │
│ ═══════════════════════════════════════════════════════════ │
│         Standalone Modules (Coordinated via A2A)            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │BM-Social│ │BM-Email │ │ BM-CMS  │ │ BM-SEO  │ │BM-Ads │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

| Handle | Display Name | Role | Description |
|--------|--------------|------|-------------|
| `@bm-marketing.maven` | Maven | Team Lead / GTM Strategist | Orchestrates marketing strategy, coordinates with BM-Brand's Bella |
| `@bm-marketing.channel` | Channel | Channel Mix Optimizer | Recommends channel allocation, analyzes channel performance |
| `@bm-marketing.segment` | Segment | Audience Strategist | Defines and manages audience segments, syncs with BM-CRM |
| `@bm-marketing.campaign` | Campaign | Campaign Orchestrator | Creates campaigns, coordinates execution across extensions |
| `@bm-marketing.budget` | Budget | Marketing Budget Allocator | Allocates budget, tracks spend, optimizes ROI |
| `@bm-marketing.measure` | Measure | Attribution Analyst | Aggregates attribution, generates insights, reports performance |

---

## Agent Specifications

### 1. Maven - GTM Strategist (Team Leader)

**Role:** Orchestrates all marketing strategy and go-to-market planning

**Responsibilities:**
- Define go-to-market strategy based on BM-Brand positioning
- Coordinate with Bella (BM-Brand) for brand alignment
- Set marketing OKRs and success metrics
- Prioritize marketing initiatives
- Present unified marketing strategy to users

**Key Interactions:**
- Receives brand positioning from `@bm-brand.bella`
- Delegates segmentation to Segment, channel planning to Channel
- Coordinates campaign launches with Campaign

**Implementation:**
```python
maven = Agent(
    name="Maven",
    role="Marketing Team Lead",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Develop go-to-market strategies aligned with brand positioning.",
        "Coordinate Channel, Segment, Campaign, Budget, and Measure agents.",
        "Ensure marketing efforts drive measurable business outcomes.",
        "Present clear, actionable marketing plans to users.",
    ],
)
```

### 2. Channel - Channel Mix Optimizer

**Role:** Optimize marketing channel allocation

**Responsibilities:**
- Analyze channel performance data
- Recommend channel mix for campaigns
- Identify emerging channel opportunities
- Evaluate channel fit for audience segments
- Monitor channel health and trends

**Channel Framework:**
| Channel Type | Extensions | Use Case |
|--------------|------------|----------|
| Owned | Content, Email, SEO | Long-term brand building |
| Earned | Social (organic), PR | Credibility, virality |
| Paid | Ads, Social (paid) | Scale, targeting |

**Tools:**
- `recommend_channel_mix` - Suggest channels for campaign
- `analyze_channel_performance` - Historical analysis
- `forecast_channel_roi` - Predict returns
- `compare_channels` - A/B channel comparison

### 3. Segment - Audience Strategist

**Role:** Define and manage audience segments

**Responsibilities:**
- Create audience segments based on behavior, demographics, value
- Sync segments with BM-CRM contacts
- Provide targeting criteria to extensions
- Analyze segment performance
- Identify high-value segment opportunities

**Segment Types:**
| Type | Basis | Example |
|------|-------|---------|
| Behavioral | Actions | "Engaged last 30 days" |
| Demographic | Attributes | "SMB, Tech Industry" |
| Value | Revenue | "High LTV Customers" |
| Lifecycle | Stage | "Trial Users", "Churned" |
| Intent | Signals | "Visited pricing page" |

**Tools:**
- `create_segment` - Define new audience segment
- `analyze_segment` - Segment performance metrics
- `sync_to_crm` - Push segment to BM-CRM
- `recommend_targeting` - Suggest targeting for campaign
- `estimate_segment_size` - Audience size estimation

### 4. Campaign - Campaign Orchestrator

**Role:** Create and orchestrate marketing campaigns across extensions

**Responsibilities:**
- Define campaign structure, objectives, timeline
- Coordinate execution across BM-Social, BM-Email, BM-Ads, etc.
- Track campaign progress and milestones
- Trigger campaign phases (launch, mid-flight optimization, wrap-up)
- Handle multi-touch campaign flows

**Campaign Structure:**
```
Campaign
├── Objective (awareness, consideration, conversion)
├── Audience Segments (from Segment agent)
├── Channels (from Channel agent)
├── Budget (from Budget agent)
├── Timeline (start, phases, end)
├── Creative Brief (from BM-Brand)
└── Channel Executions
    ├── Social Posts (→ BM-Social)
    ├── Email Sequences (→ BM-Email)
    ├── Website/Blog Content (→ BM-CMS)
    ├── SEO Initiatives (→ BM-SEO)
    └── Ad Campaigns (→ BM-Ads)
```

**Tools:**
- `create_campaign` - Define new campaign
- `launch_campaign` - Trigger execution across extensions
- `pause_campaign` - Pause all channel executions
- `get_campaign_status` - Aggregate status from extensions
- `optimize_campaign` - Mid-flight adjustments

### 5. Budget - Marketing Budget Allocator

**Role:** Allocate and optimize marketing spend

**Responsibilities:**
- Allocate budget across channels and campaigns
- Track spend against budget
- Optimize allocation based on performance
- Forecast budget needs
- Report on marketing ROI

**Budget Allocation Model:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Historical ROI | 40% | Past performance by channel |
| Strategic Priority | 30% | Business objectives |
| Audience Fit | 20% | Segment preferences |
| Competitive Pressure | 10% | Market dynamics |

**Tools:**
- `allocate_budget` - Distribute budget to channels
- `track_spend` - Monitor actual vs planned
- `optimize_allocation` - Rebalance based on performance
- `forecast_spend` - Project future needs
- `calculate_roi` - Return on marketing investment

### 6. Measure - Attribution Analyst

**Role:** Aggregate attribution and generate performance insights

**Responsibilities:**
- Collect performance data from all extensions
- Apply attribution models (first-touch, last-touch, multi-touch)
- Generate marketing reports and dashboards
- Identify optimization opportunities
- Track marketing contribution to pipeline

**Attribution Models:**
| Model | Description | Best For |
|-------|-------------|----------|
| First Touch | Credit to first interaction | Awareness campaigns |
| Last Touch | Credit to last interaction | Conversion campaigns |
| Linear | Equal credit across touches | Balanced view |
| Time Decay | More credit to recent touches | Long cycles |
| Position Based | 40/20/40 first/middle/last | B2B journeys |

**Tools:**
- `aggregate_performance` - Collect from all extensions
- `calculate_attribution` - Apply attribution model
- `generate_report` - Create performance report
- `identify_opportunities` - Find optimization areas
- `track_pipeline_contribution` - Marketing-sourced pipeline

---

## Data Model

### Core Entities (BM-Marketing owns)

```prisma
model MarketingCampaign {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  name            String
  description     String?
  objective       String   // AWARENESS, CONSIDERATION, CONVERSION
  status          String   @default("DRAFT") // DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED

  // Timeline
  startDate       DateTime? @map("start_date")
  endDate         DateTime? @map("end_date")

  // Budget
  budgetTotal     Decimal  @default(0) @map("budget_total")
  budgetSpent     Decimal  @default(0) @map("budget_spent")
  currency        String   @default("USD")

  // Ownership
  createdById     String   @map("created_by_id")
  ownerId         String   @map("owner_id")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  segments        CampaignSegment[]
  channels        CampaignChannel[]
  attributionEvents AttributionEvent[]

  @@index([workspaceId])
  @@index([status])
  @@map("marketing_campaigns")
}

model AudienceSegment {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  name            String
  description     String?
  type            String   // BEHAVIORAL, DEMOGRAPHIC, VALUE, LIFECYCLE, INTENT

  // Definition (JSON for flexibility)
  criteria        Json     // { rules: [...], logic: "AND" | "OR" }

  // Metrics (denormalized)
  estimatedSize   Int      @default(0) @map("estimated_size")
  actualSize      Int      @default(0) @map("actual_size")

  // Sync status
  crmSyncEnabled  Boolean  @default(false) @map("crm_sync_enabled")
  lastSyncedAt    DateTime? @map("last_synced_at")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  campaigns       CampaignSegment[]

  @@index([workspaceId])
  @@index([type])
  @@map("audience_segments")
}

model CampaignSegment {
  id          String   @id @default(cuid())
  campaignId  String   @map("campaign_id")
  segmentId   String   @map("segment_id")

  campaign    MarketingCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  segment     AudienceSegment @relation(fields: [segmentId], references: [id])

  @@unique([campaignId, segmentId])
  @@map("campaign_segments")
}

model CampaignChannel {
  id              String   @id @default(cuid())
  campaignId      String   @map("campaign_id")
  channel         String   // SOCIAL, EMAIL, CONTENT, SEO, ADS

  // Budget allocation
  budgetAllocated Decimal  @default(0) @map("budget_allocated")
  budgetSpent     Decimal  @default(0) @map("budget_spent")

  // Performance metrics
  impressions     Int      @default(0)
  clicks          Int      @default(0)
  conversions     Int      @default(0)

  // Extension reference
  extensionRef    String?  @map("extension_ref")  // e.g., "bm-social:campaign:123"

  campaign        MarketingCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)

  @@index([campaignId])
  @@map("campaign_channels")
}

model AttributionEvent {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")
  campaignId      String?  @map("campaign_id")

  // Source
  channel         String   // SOCIAL, EMAIL, CONTENT, SEO, ADS, SUPPORT
  sourceModule    String   @map("source_module")  // bm-social, bm-email, etc.
  sourceRef       String?  @map("source_ref")  // Reference ID in source module

  // Contact
  contactId       String?  @map("contact_id")  // BM-CRM contact
  anonymousId     String?  @map("anonymous_id")  // For unknown visitors

  // Event
  eventType       String   @map("event_type")  // IMPRESSION, CLICK, CONVERSION, INQUIRY
  eventData       Json?    @map("event_data")
  occurredAt      DateTime @map("occurred_at")

  // Attribution
  attributionModel String? @map("attribution_model")
  attributionWeight Decimal? @map("attribution_weight")

  createdAt       DateTime @default(now()) @map("created_at")

  campaign        MarketingCampaign? @relation(fields: [campaignId], references: [id])

  @@index([workspaceId])
  @@index([campaignId])
  @@index([channel])
  @@index([contactId])
  @@map("attribution_events")
}

model MarketingBudget {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")

  // Period
  periodType      String   @map("period_type")  // MONTHLY, QUARTERLY, ANNUAL
  periodStart     DateTime @map("period_start")
  periodEnd       DateTime @map("period_end")

  // Amounts
  totalBudget     Decimal  @map("total_budget")
  allocatedBudget Decimal  @default(0) @map("allocated_budget")
  spentBudget     Decimal  @default(0) @map("spent_budget")
  currency        String   @default("USD")

  // Channel breakdown (JSON)
  channelAllocations Json? @map("channel_allocations")

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([workspaceId])
  @@index([periodStart])
  @@map("marketing_budgets")
}
```

---

## Extension Module Specifications

### BM-Social (Already Defined)

Per `/docs/architecture/cross-module-architecture.md`, BM-Social has 18 agents.
**New requirement:** Must receive campaigns from BM-Marketing.

**Integration Points:**
- Receives: `marketing.campaign.launched` → Create social posts
- Publishes: `social.post.published`, `social.engagement.tracked`
- Reports: Performance data to Measure agent

### BM-Email (New)

**Module ID:** `bm-email`
**Agent Count:** 6

| Handle | Name | Role |
|--------|------|------|
| `@bm-email.dispatch` | Dispatch | Team Lead / Orchestrator |
| `@bm-email.sequence` | Sequence | Sequence Builder |
| `@bm-email.template` | Template | Template Designer |
| `@bm-email.deliver` | Deliver | Deliverability Manager |
| `@bm-email.track` | Track | Engagement Tracker |
| `@bm-email.comply` | Comply | Compliance (CAN-SPAM, GDPR) |

### BM-CMS (Website/Blog Content)

**Module ID:** `bm-cms`
**Agent Count:** 5

| Handle | Name | Role |
|--------|------|------|
| `@bm-cms.publisher` | Publisher | Team Lead / CMS Orchestrator |
| `@bm-cms.page` | Page | Page Builder - creates and manages pages |
| `@bm-cms.blog` | Blog | Blog Manager - posts and categories |
| `@bm-cms.media` | Media | Media Library - images, videos, assets |
| `@bm-cms.template` | Template | Template Designer - reusable layouts |

### BM-SEO (New)

**Module ID:** `bm-seo`
**Agent Count:** 5

| Handle | Name | Role |
|--------|------|------|
| `@bm-seo.crawler` | Crawler | Team Lead / SEO Orchestrator |
| `@bm-seo.keyword` | Keyword | Keyword Research |
| `@bm-seo.onpage` | OnPage | On-Page Optimization |
| `@bm-seo.technical` | Technical | Technical SEO |
| `@bm-seo.rank` | Rank | Rank Tracking |

### BM-Ads (New)

**Module ID:** `bm-ads`
**Agent Count:** 6

| Handle | Name | Role |
|--------|------|------|
| `@bm-ads.buyer` | Buyer | Team Lead / Media Buyer |
| `@bm-ads.creative` | Creative | Ad Creative Manager |
| `@bm-ads.target` | Target | Audience Targeting |
| `@bm-ads.bid` | Bid | Bid Optimization |
| `@bm-ads.google` | Google | Google Ads Specialist |
| `@bm-ads.meta` | Meta | Meta Ads Specialist |

---

## Cross-Module Integration

### Event Bus Integration

**Events Published by BM-Marketing:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `marketing.campaign.created` | New campaign | `{campaignId, name, objective}` |
| `marketing.campaign.launched` | Campaign goes live | `{campaignId, channels[], segments[]}` |
| `marketing.campaign.paused` | Campaign paused | `{campaignId}` |
| `marketing.campaign.completed` | Campaign ends | `{campaignId, performance}` |
| `marketing.segment.created` | New segment | `{segmentId, criteria}` |
| `marketing.segment.synced` | Synced to CRM | `{segmentId, contactCount}` |
| `marketing.attribution.calculated` | Attribution computed | `{campaignId, conversions, revenue}` |

**Events Consumed by BM-Marketing:**

| Event | Source | Action |
|-------|--------|--------|
| `social.post.published` | BM-Social | Track campaign execution |
| `social.engagement.tracked` | BM-Social | Update attribution |
| `email.send.delivered` | BM-Email | Track campaign execution |
| `email.open.tracked` | BM-Email | Update attribution |
| `ads.impression.tracked` | BM-Ads | Update attribution |
| `ads.click.tracked` | BM-Ads | Update attribution |
| `support.conversation.created` | BM-Support | Track inquiry (if from campaign) |
| `crm.contact.created` | BM-CRM | Evaluate for segments |
| `crm.deal.won` | BM-CRM | Calculate marketing contribution |

### A2A Protocol Integration

**Maven ↔ Bella Communication:**

```python
# Example: Maven requesting brand guidelines for campaign
from a2a import A2AClient

brand_client = A2AClient(os.getenv("BRAND_AGENT_URL") + "/a2a/brand")

async def get_brand_guidelines_for_campaign(campaign_objective: str):
    task = await brand_client.send_task({
        "message": {
            "role": "user",
            "parts": [{"text": f"Provide brand voice and visual guidelines for a {campaign_objective} campaign"}]
        }
    })
    result = await brand_client.wait_for_completion(task.id)
    return result.artifacts[0].data
```

### BM-Support Integration (Horizontal Service)

BM-Support is NOT a dependency but an optional integration:

```
Marketing Campaign → User sees ad/post → Has question
    ↓
BM-Social.Engage detects support-worthy mention
    ↓
Event: social.mention.support_needed { sourceModule: "bm-marketing", campaignId: "..." }
    ↓
BM-Support.Triage creates conversation with campaign context
    ↓
Agent resolves inquiry
    ↓
Event: support.conversation.resolved { campaignId: "...", resolution: "..." }
    ↓
BM-Marketing.Measure logs as campaign touchpoint!
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                      MARKETING WORKFLOW                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────────────┐ │
│  │BM-Brand │────▶│  Maven  │────▶│Campaign │────▶│   Extensions    │ │
│  │ (Voice) │     │  (GTM)  │     │ (Orch)  │     │   Execute       │ │
│  └─────────┘     └────┬────┘     └────┬────┘     └────────┬────────┘ │
│                       │               │                    │          │
│                  ┌────▼────┐     ┌────▼────┐          ┌────▼────┐    │
│                  │ Segment │     │ Channel │          │ Measure │    │
│                  │@bm-mkt  │     │@bm-mkt  │          │@bm-mkt  │    │
│                  └────┬────┘     └────┬────┘          └────┬────┘    │
│                       │               │                    │          │
│                  Sync │          Allocate              Aggregate      │
│                       ▼               ▼                    ▲          │
│                  ┌─────────┐     ┌─────────┐               │          │
│                  │ BM-CRM  │     │ Budget  │     Performance Data     │
│                  │(Contacts│     │@bm-mkt  │               │          │
│                  └─────────┘     └─────────┘               │          │
│                                                            │          │
│  ┌─────────────────────────────────────────────────────────┘         │
│  │   Attribution Events from: Social, Email, CMS, SEO, Ads           │
│  │   + Support inquiries with campaign context                        │
│  └────────────────────────────────────────────────────────────────────│
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core Marketing (MVP)
**Duration:** 4-5 weeks
**Agents:** Maven, Segment, Campaign, Measure (4)

- [ ] MarketingCampaign and AudienceSegment models
- [ ] Campaign CRUD with objective-based templates
- [ ] Basic segmentation engine
- [ ] Performance aggregation from extensions
- [ ] Maven orchestrator
- [ ] Integration with BM-Brand

### Phase 2: Channel & Budget
**Duration:** 2-3 weeks
**Agents:** + Channel, Budget (6)

- [ ] Channel recommendation engine
- [ ] Budget allocation model
- [ ] Spend tracking
- [ ] ROI calculation
- [ ] Channel performance analysis

### Phase 3: Standalone Module Integrations
**Modules:** BM-Email, BM-CMS, BM-SEO, BM-Ads (all standalone, coordinated via A2A)

- [ ] Event bus integration with BM-Social (already exists)
- [ ] BM-Email module (6 agents)
- [ ] BM-CMS module (5 agents)
- [ ] BM-SEO module (5 agents)
- [ ] BM-Ads module (6 agents)

### Phase 4: Attribution & Analytics
**Duration:** 2-3 weeks

- [ ] Multi-touch attribution models
- [ ] Marketing contribution to pipeline
- [ ] Cross-channel journey visualization
- [ ] Predictive analytics

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents/marketing/runs` | POST | Run Marketing team |
| `/agents/marketing/health` | GET | Team health check |
| `/a2a/marketing/rpc` | POST | A2A JSON-RPC interface |
| `/api/marketing/campaigns` | CRUD | Campaign management |
| `/api/marketing/segments` | CRUD | Audience segments |
| `/api/marketing/budgets` | CRUD | Budget management |
| `/api/marketing/attribution` | GET | Attribution data |

---

## Agent Card (A2A Protocol)

```json
{
  "protocolVersion": "0.3.0",
  "id": "marketing",
  "name": "Marketing Team",
  "description": "Go-to-market strategy, campaign orchestration, and marketing intelligence",
  "version": "1.0.0",
  "dependencies": ["brand"],
  "coordinates": ["social", "email", "cms", "seo", "ads"],
  "endpoints": {
    "rpc": "/a2a/marketing/rpc",
    "ws": null
  },
  "capabilities": {
    "streaming": true,
    "events": true,
    "files": true
  },
  "skills": [
    {"name": "create_campaign", "description": "Create marketing campaign"},
    {"name": "define_segment", "description": "Define audience segment"},
    {"name": "recommend_channels", "description": "Recommend channel mix"},
    {"name": "allocate_budget", "description": "Allocate marketing budget"},
    {"name": "calculate_attribution", "description": "Multi-touch attribution"}
  ]
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Campaign creation time | < 10 minutes |
| Segment sync latency | < 5 minutes |
| Attribution accuracy | > 90% coverage |
| Cross-channel coordination | Real-time |
| Budget utilization | > 95% of allocated |

---

## Summary: Module Hierarchy

```
BUILD PHASE                         OPERATE PHASE
───────────────────────────────────────────────────────────
BMV (Validation)
 ↓
BMP (Planning)
 ↓
BM-Brand (Branding)
 ↓
BM-Marketing (GTM Strategy) ────────┬─→ BM-Social (16 agents)
 • Maven (Lead)                     ├─→ BM-Email (6 agents)
 • Channel                          ├─→ BM-CMS (5 agents)
 • Segment                          ├─→ BM-SEO (5 agents)
 • Campaign                         └─→ BM-Ads (6 agents)
 • Budget
 • Measure

HORIZONTAL SERVICES (Cross-Cutting)
───────────────────────────────────────────────────────────
BM-Support (8 agents) ← receives from CRM, Marketing, Sales
BM-Analytics ← AI-powered insights aggregated from ALL modules
```

**Total New Agents:** 6 (Marketing) + 6 (Email) + 5 (CMS) + 5 (SEO) + 6 (Ads) = **28 agents**

---

## References

- `/docs/architecture/dynamic-module-system.md` - Module system architecture
- `/docs/architecture/cross-module-architecture.md` - Agent registry and data flows
- `/docs/modules/bm-sales/MODULE-PLAN.md` - Similar extension pattern
- `/docs/modules/bm-support/README.md` - Horizontal service pattern

---

*This module plan establishes BM-Marketing as the strategic hub for marketing operations, coordinating standalone modules (BM-Social, BM-Email, BM-CMS, BM-SEO, BM-Ads) via A2A protocol. Each channel module works independently with its own analytics, enhanced when installed alongside BM-Marketing for multi-channel campaign orchestration.*
