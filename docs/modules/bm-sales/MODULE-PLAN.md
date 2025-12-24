# BM-Sales Module - Architecture Plan

**Version:** 1.0
**Created:** 2025-12-24
**Status:** Planning
**Module Type:** Extension Module (requires BM-CRM)

---

## Executive Summary

BM-Sales is a **CRM extension module** that adds sales-specific capabilities to the BM-CRM module. Following the patterns from Odoo, ERPNext, and Dolibarr (where Sales/Selling is distinct from CRM), BM-Sales handles the **transactional side** of customer relationships:

- **CRM handles:** Contacts, Companies, Leads, Opportunities (Deals), Activities, Lead Scoring
- **Sales handles:** Quotes, Orders, Pricing, Territories, Commissions, Revenue Forecasting

This separation allows businesses to:
1. Use CRM without Sales (relationship management only)
2. Add Sales when they need transactional capabilities
3. Eventually integrate with BM-Finance for invoicing

---

## Module Classification

| Attribute | Value |
|-----------|-------|
| **Module ID** | `bm-sales` |
| **Category** | OPERATE Phase |
| **Type** | Extension Module |
| **Requires** | `bm-crm` (hard dependency) |
| **Optional** | `bm-finance` (for invoicing) |
| **Agent Count** | 6 |
| **Priority** | P1 (follows BM-CRM) |

### Dynamic Module System Integration

Per `/docs/architecture/dynamic-module-system.md`, BM-Sales follows the extension pattern:

```yaml
# Module manifest
id: bm-sales
name: "Sales Management"
description: "Quotes, orders, territories, and commission tracking"
version: "1.0.0"
dependencies:
  - module: bm-crm
    version: ">=1.0.0"
    type: required
  - module: bm-finance
    version: ">=1.0.0"
    type: optional
interfaces:
  - AG-UI  # Frontend via CopilotKit
  - A2A    # Backend agent mesh
```

---

## CRM vs Sales: Boundary Definition

### Where CRM Ends

BM-CRM manages the **relationship lifecycle**:

```
Lead → MQL → SQL → Opportunity → Customer
         ↓
    [CRM BOUNDARY]
         ↓
    Quote → Order → Invoice → Revenue
         ↑
    [SALES TERRITORY]
```

**CRM owns:**
- Contact/Company records
- Lead scoring and qualification
- Deal/Opportunity pipeline (pre-quote)
- Activity tracking
- Engagement analysis

### Where Sales Begins

BM-Sales takes over when a **Deal converts to a Quote**:

```
CRM Deal (stage: "Proposal")
    ↓
[User clicks "Create Quote"]
    ↓
Sales Quote (linked to Deal)
    ↓
Sales Order (on acceptance)
    ↓
[Optional: BM-Finance Invoice]
```

**Sales owns:**
- Quotation/Proposal generation
- Order management
- Pricing rules and discounts
- Territory assignment
- Commission calculations
- Revenue forecasting (by closed orders)

### Shared Entities (CRM → Sales)

| Entity | Owner | Sales Access |
|--------|-------|--------------|
| Contact | BM-CRM | Read + Activity Log |
| Account | BM-CRM | Read |
| Deal | BM-CRM | Read + Convert to Quote |
| Activity | BM-CRM | Read + Write (order activities) |

---

## Agent Registry

### Handle Convention

All Sales agents use: `@bm-sales.{agent-key}`

### Naming Collision Check

Per `/docs/architecture/cross-module-architecture.md`, these names are already taken:
- `forecast` → BMP
- `flow` → BM-CRM
- `echo` → BM-CRM (now Tracker)
- `scout` → BM-CRM

Proposed Sales agents use unique names:

### BM-Sales Agent Team (6 Agents)

```
┌─────────────────────────────────────────────────────────────┐
│                   SALES TEAM (6 Agents)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      ┌─────────┐                            │
│                      │Sterling │ ← Team Leader              │
│                      │ (Orch)  │                            │
│                      └────┬────┘                            │
│                           │                                  │
│     ┌─────────┬──────────┼──────────┬─────────┬─────────┐  │
│     │         │          │          │         │         │  │
│ ┌───┴───┐ ┌───┴───┐ ┌────┴────┐ ┌───┴───┐ ┌───┴───┐    │  │
│ │ Quota │ │ Order │ │  Price  │ │Region │ │Bounty │    │  │
│ │(Quote)│ │(Order)│ │(Pricing)│ │(Terr.)│ │(Comm.)│    │  │
│ └───────┘ └───────┘ └─────────┘ └───────┘ └───────┘    │  │
│                                                          │  │
│ ═══════════════════════════════════════════════════════ │  │
│                      ┌─────────┐                        │  │
│                      │  Clara  │ ← CRM Team (Cross-ref)  │  │
│                      │ @bm-crm │                        │  │
│                      └─────────┘                        │  │
└─────────────────────────────────────────────────────────────┘
```

| Handle | Display Name | Role | Description |
|--------|--------------|------|-------------|
| `@bm-sales.sterling` | Sterling | Team Lead / Orchestrator | Coordinates sales operations, interfaces with CRM's Clara |
| `@bm-sales.quota` | Quota | Quotation Specialist | Creates and manages quotes/proposals from CRM deals |
| `@bm-sales.order` | Order | Order Manager | Converts quotes to orders, tracks fulfillment |
| `@bm-sales.price` | Price | Pricing Strategist | Manages pricing rules, discounts, and margins |
| `@bm-sales.region` | Region | Territory Manager | Territory assignment and coverage analysis |
| `@bm-sales.bounty` | Bounty | Commission Tracker | Calculates and tracks sales commissions |

### Agent Responsibilities

#### 1. Sterling - Sales Orchestrator (Team Leader)

**Role:** Coordinates all sales operations and interfaces with CRM team

**Responsibilities:**
- Route user requests to appropriate sales specialist
- Coordinate with Clara for cross-module workflows
- Present unified sales reports and forecasts
- Handle complex queries spanning CRM and Sales

**Key Interactions:**
- Receives `crm.deal.stage_changed` events (to "Proposal")
- Suggests quote creation to users
- Delegates pricing decisions to Price, territory to Region

**Implementation:**
```python
sterling = Agent(
    name="Sterling",
    role="Sales Team Lead",
    model=get_tenant_model(tenant_id),
    instructions=[
        "Coordinate sales operations across Quota, Order, Price, Region, and Bounty.",
        "Work closely with Clara (CRM) for deal-to-quote transitions.",
        "Present sales metrics and forecasts clearly.",
        "Ensure pricing rules and commissions are applied correctly.",
    ],
)
```

#### 2. Quota - Quotation Specialist

**Role:** Create and manage quotes/proposals

**Responsibilities:**
- Generate quotes from CRM deals
- Apply pricing rules and discounts
- Track quote versions and revisions
- Handle quote approval workflows
- Convert accepted quotes to orders

**Tools:**
- `create_quote` - Generate quote from deal
- `revise_quote` - Create new version
- `apply_discount` - Apply pricing rules
- `send_quote` - Email quote to contact
- `convert_to_order` - Accept quote → order

**Quote Status Flow:**
```
DRAFT → SENT → NEGOTIATING → ACCEPTED/REJECTED/EXPIRED
                   ↓
              (revision creates new version)
```

#### 3. Order - Order Manager

**Role:** Manage sales orders and fulfillment

**Responsibilities:**
- Convert accepted quotes to orders
- Track order status and fulfillment
- Coordinate with inventory (future)
- Trigger invoicing in BM-Finance
- Handle returns and cancellations

**Tools:**
- `create_order` - Convert quote to order
- `update_order_status` - Track fulfillment
- `cancel_order` - Handle cancellations
- `request_invoice` - Trigger BM-Finance

**Order Status Flow:**
```
CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
     ↓           ↓
  CANCELLED   ON_HOLD
```

#### 4. Price - Pricing Strategist

**Role:** Manage pricing rules and discounts

**Responsibilities:**
- Define pricing tiers and rules
- Calculate discounts (volume, customer-tier, promotional)
- Protect margins with floor prices
- Suggest optimal pricing
- Analyze price elasticity

**Pricing Rule Types:**
| Type | Description | Example |
|------|-------------|---------|
| Volume | Quantity-based discounts | 10+ units = 10% off |
| Tier | Customer segment pricing | Enterprise = 20% off |
| Promo | Time-limited discounts | Holiday sale 15% |
| Bundle | Package discounts | Suite = 30% off |
| Floor | Minimum price protection | Never below $50 |

**Tools:**
- `calculate_price` - Apply pricing rules to line items
- `suggest_discount` - Recommend optimal discount
- `check_margin` - Validate profitability
- `create_pricing_rule` - Define new rules

#### 5. Region - Territory Manager

**Role:** Manage sales territories and assignment

**Responsibilities:**
- Define territory boundaries (geographic, industry, size)
- Assign accounts/contacts to territories
- Balance territory coverage
- Track territory performance
- Suggest territory realignment

**Territory Types:**
| Type | Segmentation |
|------|--------------|
| Geographic | Country/State/City/ZIP |
| Industry | Vertical markets |
| Size | SMB/Mid-Market/Enterprise |
| Named | Specific account lists |

**Tools:**
- `assign_territory` - Assign account to territory
- `get_territory_coverage` - Analyze gaps
- `calculate_territory_potential` - Revenue opportunity
- `suggest_realignment` - Optimize territories

#### 6. Bounty - Commission Tracker

**Role:** Calculate and track sales commissions

**Responsibilities:**
- Define commission structures
- Calculate commissions on closed orders
- Track commission payouts
- Generate commission reports
- Handle split commissions

**Commission Models:**
| Model | Description |
|-------|-------------|
| Flat | Fixed percentage of order value |
| Tiered | Increasing % at milestones |
| Split | Multiple reps share commission |
| Override | Manager gets override on team sales |
| Bonus | Additional for exceeding quota |

**Tools:**
- `calculate_commission` - Compute for order
- `get_commission_statement` - Rep earnings report
- `track_quota_progress` - Attainment vs target
- `process_commission_payout` - Mark as paid

---

## Data Model

### New Entities (BM-Sales owns)

```prisma
// packages/db/prisma/schema.prisma

model SalesQuote {
  id               String   @id @default(cuid())
  workspaceId      String   @map("workspace_id")
  quoteNumber      String   @unique @map("quote_number")
  version          Int      @default(1)
  status           String   @default("DRAFT") // DRAFT, SENT, NEGOTIATING, ACCEPTED, REJECTED, EXPIRED

  // Linked CRM entities
  dealId           String   @map("deal_id")
  accountId        String   @map("account_id")
  contactId        String   @map("contact_id")

  // Quote details
  title            String?
  subtotal         Decimal  @default(0)
  discountTotal    Decimal  @default(0) @map("discount_total")
  taxTotal         Decimal  @default(0) @map("tax_total")
  total            Decimal  @default(0)
  currency         String   @default("USD")

  // Validity
  validUntil       DateTime? @map("valid_until")
  sentAt           DateTime? @map("sent_at")
  acceptedAt       DateTime? @map("accepted_at")

  // Territory and assignment
  territoryId      String?  @map("territory_id")
  ownerId          String   @map("owner_id")

  // Timestamps
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relations
  lineItems        SalesQuoteLineItem[]
  orders           SalesOrder[]
  territory        SalesTerritory? @relation(fields: [territoryId], references: [id])

  @@index([workspaceId])
  @@index([dealId])
  @@index([status])
  @@map("sales_quotes")
}

model SalesQuoteLineItem {
  id          String  @id @default(cuid())
  quoteId     String  @map("quote_id")
  productId   String? @map("product_id")  // Future: link to product catalog

  description String
  quantity    Decimal @default(1)
  unitPrice   Decimal @map("unit_price")
  discount    Decimal @default(0)  // Line-level discount %
  total       Decimal @default(0)

  sortOrder   Int     @default(0) @map("sort_order")

  quote       SalesQuote @relation(fields: [quoteId], references: [id], onDelete: Cascade)

  @@index([quoteId])
  @@map("sales_quote_line_items")
}

model SalesOrder {
  id             String   @id @default(cuid())
  workspaceId    String   @map("workspace_id")
  orderNumber    String   @unique @map("order_number")
  status         String   @default("CONFIRMED") // CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED

  // Source
  quoteId        String?  @map("quote_id")

  // Linked CRM entities
  accountId      String   @map("account_id")
  contactId      String   @map("contact_id")

  // Order details
  subtotal       Decimal  @default(0)
  discountTotal  Decimal  @default(0) @map("discount_total")
  taxTotal       Decimal  @default(0) @map("tax_total")
  total          Decimal  @default(0)
  currency       String   @default("USD")

  // Fulfillment
  shippedAt      DateTime? @map("shipped_at")
  deliveredAt    DateTime? @map("delivered_at")
  completedAt    DateTime? @map("completed_at")

  // Territory and assignment
  territoryId    String?  @map("territory_id")
  ownerId        String   @map("owner_id")

  // Timestamps
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relations
  quote          SalesQuote? @relation(fields: [quoteId], references: [id])
  lineItems      SalesOrderLineItem[]
  commissions    SalesCommission[]
  territory      SalesTerritory? @relation(fields: [territoryId], references: [id])

  @@index([workspaceId])
  @@index([quoteId])
  @@index([status])
  @@map("sales_orders")
}

model SalesOrderLineItem {
  id          String  @id @default(cuid())
  orderId     String  @map("order_id")
  productId   String? @map("product_id")

  description String
  quantity    Decimal @default(1)
  unitPrice   Decimal @map("unit_price")
  discount    Decimal @default(0)
  total       Decimal @default(0)

  sortOrder   Int     @default(0) @map("sort_order")

  order       SalesOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("sales_order_line_items")
}

model SalesPricingRule {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  name          String
  type          String   // VOLUME, TIER, PROMO, BUNDLE, FLOOR

  // Conditions (JSON for flexibility)
  conditions    Json     // { minQty, maxQty, customerSegment, productIds, dateRange }

  // Effect
  discountType  String   @map("discount_type") // PERCENT, FIXED
  discountValue Decimal  @map("discount_value")
  floorPrice    Decimal? @map("floor_price")

  // Priority (lower = higher priority)
  priority      Int      @default(100)

  // Validity
  startDate     DateTime? @map("start_date")
  endDate       DateTime? @map("end_date")
  isActive      Boolean  @default(true) @map("is_active")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([workspaceId])
  @@index([type])
  @@map("sales_pricing_rules")
}

model SalesTerritory {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  name          String
  type          String   // GEOGRAPHIC, INDUSTRY, SIZE, NAMED

  // Definition (JSON for flexibility)
  definition    Json     // { countries, states, industries, segments, namedAccounts }

  // Assignment
  ownerId       String   @map("owner_id")
  parentId      String?  @map("parent_id")  // Hierarchy support

  // Metrics (denormalized for performance)
  accountCount  Int      @default(0) @map("account_count")
  pipelineValue Decimal  @default(0) @map("pipeline_value")
  closedRevenue Decimal  @default(0) @map("closed_revenue")

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  parent        SalesTerritory?  @relation("TerritoryHierarchy", fields: [parentId], references: [id])
  children      SalesTerritory[] @relation("TerritoryHierarchy")
  quotes        SalesQuote[]
  orders        SalesOrder[]

  @@index([workspaceId])
  @@index([ownerId])
  @@map("sales_territories")
}

model SalesCommission {
  id              String   @id @default(cuid())
  workspaceId     String   @map("workspace_id")

  // Source
  orderId         String   @map("order_id")
  orderValue      Decimal  @map("order_value")

  // Commission
  userId          String   @map("user_id")  // Sales rep
  commissionRate  Decimal  @map("commission_rate")
  commissionValue Decimal  @map("commission_value")
  splitPercent    Decimal  @default(100) @map("split_percent")  // For split commissions

  // Status
  status          String   @default("PENDING")  // PENDING, APPROVED, PAID
  approvedAt      DateTime? @map("approved_at")
  paidAt          DateTime? @map("paid_at")

  // Period (for quota tracking)
  periodStart     DateTime @map("period_start")
  periodEnd       DateTime @map("period_end")

  createdAt       DateTime @default(now()) @map("created_at")

  // Relations
  order           SalesOrder @relation(fields: [orderId], references: [id])

  @@index([workspaceId])
  @@index([userId])
  @@index([status])
  @@map("sales_commissions")
}
```

### CRM Entity Extensions

BM-Sales adds fields to CRM entities via JSON fields (no schema changes required):

```typescript
// CrmDeal.salesData (JSON extension)
interface DealSalesExtension {
  hasQuote: boolean;
  quoteId?: string;
  quoteStatus?: string;
  territoryId?: string;
}

// CrmAccount.salesData (JSON extension)
interface AccountSalesExtension {
  territoryId?: string;
  primarySalesRep?: string;
  pricingTier?: string;  // For tier-based pricing
}
```

---

## Cross-Module Integration

### Event Bus Integration

**Events Published by BM-Sales:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `sales.quote.created` | New quote | `{quoteId, dealId, accountId, total}` |
| `sales.quote.sent` | Quote emailed | `{quoteId, contactId}` |
| `sales.quote.accepted` | Quote accepted | `{quoteId, total}` |
| `sales.quote.rejected` | Quote rejected | `{quoteId, reason}` |
| `sales.order.created` | Quote → Order | `{orderId, quoteId, total}` |
| `sales.order.completed` | Order delivered | `{orderId, total, commissions}` |
| `sales.commission.earned` | Commission calculated | `{userId, amount, orderId}` |

**Events Consumed by BM-Sales:**

| Event | Source | Action |
|-------|--------|--------|
| `crm.deal.stage_changed` | BM-CRM | If stage="Proposal", suggest quote creation |
| `crm.deal.won` | BM-CRM | Trigger order completion if linked quote |
| `crm.deal.lost` | BM-CRM | Expire associated quotes |
| `crm.contact.updated` | BM-CRM | Update quote/order contact info |
| `crm.account.updated` | BM-CRM | Update territory assignments |

### A2A Protocol Integration

**Sterling ↔ Clara Communication:**

```python
# Example: Sterling requesting deal context from Clara
from a2a import A2AClient

crm_client = A2AClient(os.getenv("CRM_AGENT_URL") + "/a2a/crm")

async def get_deal_for_quote(deal_id: str):
    task = await crm_client.send_task({
        "message": {
            "role": "user",
            "parts": [{"text": f"Get full deal context for {deal_id} including contact and account details"}]
        }
    })
    result = await crm_client.wait_for_completion(task.id)
    return result.artifacts[0].data
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER WORKFLOW                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────────────┐ │
│  │  Lead   │────▶│  Deal   │────▶│  Quote  │────▶│     Order       │ │
│  │  (CRM)  │     │  (CRM)  │     │ (Sales) │     │    (Sales)      │ │
│  └─────────┘     └────┬────┘     └────┬────┘     └────────┬────────┘ │
│                       │               │                    │          │
│                       │               │                    │          │
│                  ┌────▼────┐     ┌────▼────┐          ┌────▼────┐    │
│                  │ Clara   │     │Sterling │          │ Bounty  │    │
│                  │ @bm-crm │────▶│@bm-sales│          │@bm-sales│    │
│                  └─────────┘     └─────────┘          └─────────┘    │
│                       │               │                    │          │
│                  A2A  │          Event Bus           Commission       │
│                       ▼               ▼                    ▼          │
│                  ┌─────────┐     ┌─────────┐     ┌─────────────────┐ │
│                  │Activity │     │Analytics│     │  BM-Finance     │ │
│                  │  Log    │     │Reporting│     │   (Invoice)     │ │
│                  └─────────┘     └─────────┘     └─────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## User Interface

### Navigation (Module Extension Pattern)

When BM-Sales is enabled, it adds to the CRM navigation:

```
CRM (sidebar)
├── Dashboard
├── Contacts
├── Companies
├── Deals
│   └── [Deal Detail]
│       └── "Create Quote" button ← NEW (Sales)
├── Pipeline
├── Activities
└── Sales (sub-section) ← NEW
    ├── Quotes
    ├── Orders
    ├── Pricing
    ├── Territories
    └── Commissions
```

### Key Screens

1. **Quote Builder** - Line item editor with pricing rules
2. **Order Dashboard** - Order status and fulfillment tracking
3. **Territory Map** - Visual territory management
4. **Commission Report** - Rep earnings and quota attainment
5. **Sales Forecast** - Revenue forecast based on pipeline + orders

---

## Implementation Phases

### Phase 1: Quote Management (MVP)
**Duration:** 3-4 weeks
**Agents:** Sterling, Quota, Price (3)

- [ ] SalesQuote and SalesQuoteLineItem models
- [ ] Quote creation from CRM Deal
- [ ] Line item management
- [ ] Basic pricing rules
- [ ] Quote → Order conversion
- [ ] Sterling orchestrator
- [ ] Integration with Clara (A2A)

### Phase 2: Order & Territory
**Duration:** 3-4 weeks
**Agents:** + Order, Region (5)

- [ ] SalesOrder model
- [ ] Order lifecycle management
- [ ] Territory definition
- [ ] Territory assignment
- [ ] Territory-based reporting

### Phase 3: Commissions & Analytics
**Duration:** 2-3 weeks
**Agents:** + Bounty (6)

- [ ] Commission calculation
- [ ] Commission structures
- [ ] Quota tracking
- [ ] Sales forecasting
- [ ] Revenue analytics

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents/sales/runs` | POST | Run Sales team |
| `/agents/sales/health` | GET | Team health check |
| `/a2a/sales/rpc` | POST | A2A JSON-RPC interface |
| `/api/sales/quotes` | CRUD | Quote management |
| `/api/sales/orders` | CRUD | Order management |
| `/api/sales/pricing-rules` | CRUD | Pricing rule management |
| `/api/sales/territories` | CRUD | Territory management |
| `/api/sales/commissions` | GET | Commission queries |

---

## Agent Card (A2A Protocol)

```json
{
  "protocolVersion": "0.3.0",
  "id": "sales",
  "name": "Sales Team",
  "description": "Sales management with quotes, orders, territories, and commissions",
  "version": "1.0.0",
  "dependencies": ["crm"],
  "endpoints": {
    "rpc": "/a2a/sales/rpc",
    "ws": null
  },
  "capabilities": {
    "streaming": true,
    "events": true,
    "files": true
  },
  "skills": [
    {"name": "create_quote", "description": "Create quote from CRM deal"},
    {"name": "convert_to_order", "description": "Accept quote and create order"},
    {"name": "calculate_pricing", "description": "Apply pricing rules"},
    {"name": "assign_territory", "description": "Assign account to territory"},
    {"name": "calculate_commission", "description": "Compute sales commission"}
  ]
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Quote creation time | < 5 minutes (from deal) |
| Quote → Order conversion | > 60% |
| Pricing rule accuracy | 100% (no manual corrections) |
| Commission calculation time | < 1 minute per order |
| Territory coverage | > 95% of accounts assigned |

---

## References

- `/docs/architecture/dynamic-module-system.md` - Module system architecture
- `/docs/architecture/cross-module-architecture.md` - Agent registry and data flows
- `/docs/modules/bm-crm/PRD.md` - CRM module specification
- `/docs/architecture/module-gap-analysis.md` - ERP comparison and gaps

---

*This module plan defines BM-Sales as a natural extension of BM-CRM, following the patterns from enterprise ERP systems while maintaining HYVVE's AI-first, agent-driven approach.*
