# Section 1: Contact & Company Data Model - Research Findings

**Research Date:** 2025-11-30
**Status:** Complete
**Sources:** Twenty CRM Analysis, HubSpot Best Practices, Industry Standards

---

## Summary

Based on comprehensive research of Twenty CRM architecture and HubSpot best practices, we have clear patterns for our Contact & Company data model.

---

## 1. Contact Entity Design

### 1.1 Core Fields (Required)

Based on Twenty CRM's `PersonWorkspaceEntity` and HubSpot's required properties:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Yes | Primary key |
| `workspaceId` | UUID | Yes | Tenant isolation |
| `firstName` | String | Yes | First name |
| `lastName` | String | Yes | Last name |
| `email` | String | No* | Primary email (*required for most operations) |

### 1.2 Standard Fields (Recommended)

| Field | Type | Notes |
|-------|------|-------|
| `phone` | String | Primary phone |
| `jobTitle` | String | Professional title |
| `city` | String | Location |
| `ownerId` | UUID | Assigned sales rep |
| `accountId` | UUID | Associated company |

### 1.3 Composite Fields (JSON)

Following Twenty CRM's pattern of using JSONB for multi-value fields:

```typescript
// Email addresses (primary + additional)
emails: {
  primary: "john@acme.com",
  additional: ["j.doe@personal.com"]
}

// Phone numbers
phones: {
  primary: { number: "+1-555-0100", type: "work" },
  additional: [{ number: "+1-555-0101", type: "mobile" }]
}

// Address
address: {
  street1: "123 Main St",
  street2: "Suite 100",
  city: "San Francisco",
  state: "CA",
  postalCode: "94102",
  country: "US"
}

// Social links
socialLinks: {
  linkedin: "https://linkedin.com/in/johndoe",
  twitter: "@johndoe"
}
```

### 1.4 CRM-Specific Fields

| Field | Type | Notes |
|-------|------|-------|
| `leadScore` | Integer | 0-100 score from Scout agent |
| `scoreTier` | Enum | COLD, WARM, HOT, SALES_READY |
| `lifecycle` | Enum | lead, mql, sql, opportunity, customer, churned |
| `source` | String | web, referral, campaign, event, import |
| `sourceDetail` | String | Specific campaign or event name |
| `lastActivityAt` | DateTime | Last engagement timestamp |
| `lastContactedAt` | DateTime | Last outreach by team |

### 1.5 Custom Fields Architecture

**Decision:** Use JSON column for MVP, migrate to metadata-driven later.

```typescript
customFields: {
  "preferred_contact_time": "morning",
  "budget_range": "50k-100k",
  "competitor_using": "Salesforce"
}
```

### 1.6 Contact Source Tracking

Standard source values:
- `web_form` - Website form submission
- `landing_page` - Landing page conversion
- `import` - CSV/manual import
- `integration` - HubSpot/Salesforce sync
- `referral` - Customer referral
- `event` - Trade show/webinar
- `outbound` - Sales prospecting
- `inbound_call` - Phone inquiry
- `social` - Social media
- `partner` - Partner referral

### 1.7 Contact Lifecycle Stages

| Stage | Description | Criteria |
|-------|-------------|----------|
| `lead` | New contact, unqualified | Just created |
| `mql` | Marketing Qualified Lead | Score > 50, engaged |
| `sql` | Sales Qualified Lead | Score > 70, verified fit |
| `opportunity` | Active deal | Has associated deal |
| `customer` | Closed-won deal | Deal won |
| `churned` | Lost customer | Deal lost or cancelled |

### 1.8 Duplicate Detection Strategy

Following Twenty CRM's `@WorkspaceDuplicateCriteria` pattern:

```typescript
// Duplicate detection criteria (match ANY of these)
duplicateCriteria: [
  ['firstName', 'lastName', 'accountId'],  // Same name at same company
  ['email'],                                // Same email
  ['linkedinUrl'],                          // Same LinkedIn
]
```

---

## 2. Company/Account Entity Design

### 2.1 Core Fields

Based on Twenty CRM's `CompanyWorkspaceEntity`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Yes | Primary key |
| `workspaceId` | UUID | Yes | Tenant isolation |
| `name` | String | Yes | Company name |
| `domain` | String | No | Primary website domain |

### 2.2 Firmographic Fields (for Lead Scoring)

| Field | Type | Notes |
|-------|------|-------|
| `employeeCount` | Integer | Number of employees |
| `employeeRange` | Enum | 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+ |
| `annualRevenue` | Decimal | Annual revenue |
| `revenueRange` | Enum | <1M, 1-10M, 10-50M, 50-100M, 100M+ |
| `industry` | String | Industry classification |
| `industryCode` | String | NAICS code (6-digit) |
| `sicCode` | String | SIC code (4-digit) - legacy support |
| `segment` | Enum | enterprise, mid_market, smb, startup |
| `type` | Enum | prospect, customer, partner, competitor |

### 2.3 Industry Classification Decision

**Recommendation:** Use NAICS as primary, with custom tags as supplement.

Rationale:
- NAICS is the modern standard (updated 2022)
- 6-digit codes provide granularity
- Government and enterprise systems use NAICS
- Custom tags handle edge cases (tech, SaaS, etc.)

```typescript
// Industry storage
industry: "Technology",              // Human-readable
industryCode: "541511",              // NAICS: Custom Computer Programming
industryTags: ["saas", "b2b", "ai"]  // Custom tags for filtering
```

**Reference:** [NAICS Association](https://www.naics.com/) | [US Census NAICS](https://www.census.gov/naics/)

### 2.4 Company Hierarchy

| Field | Type | Notes |
|-------|------|-------|
| `parentId` | UUID | Parent company (for subsidiaries) |
| `isParent` | Boolean | Has child companies |
| `hierarchyLevel` | Integer | 0=root, 1=child, etc. |

### 2.5 Health & Engagement Fields

| Field | Type | Notes |
|-------|------|-------|
| `healthScore` | Integer | 0-100 account health |
| `idealCustomerProfile` | Boolean | Matches ICP |
| `lastActivityAt` | DateTime | Last engagement |
| `totalDealsValue` | Decimal | Sum of deal amounts |
| `wonDealsCount` | Integer | Number of won deals |

---

## 3. Relationship Tracking

### 3.1 Contact-to-Company

**Decision:** Many-to-One with position tracking.

- One contact belongs to one company (primary)
- Position tracking for job history
- `accountId` on Contact entity

```typescript
// Contact entity
accountId: string;      // Current company
account: Account;       // Relation
```

### 3.2 Multi-Company Support (Future)

For contacts at multiple companies (consultants, board members):

```typescript
// ContactCompany junction table (future)
model ContactCompany {
  contactId   String
  accountId   String
  role        String    // "Employee", "Advisor", "Investor"
  isPrimary   Boolean
  startDate   DateTime?
  endDate     DateTime?
}
```

### 3.3 Contact-to-Contact Relationships (Future)

For tracking referrals, reporting structure:

```typescript
// ContactRelationship table (future)
model ContactRelationship {
  fromContactId String
  toContactId   String
  type          String    // "reports_to", "referred_by", "knows"
  strength      String?   // "strong", "medium", "weak"
}
```

### 3.4 Company-to-Company Relationships

| Relationship | Description |
|--------------|-------------|
| `parent` | Parent-subsidiary |
| `partner` | Business partner |
| `competitor` | Competitive relationship |
| `customer` | Is customer of |
| `vendor` | Is vendor to |

---

## 4. Data Quality

### 4.1 Required vs Optional Fields

**Required for Creation:**
- `firstName` OR `email` (at minimum one identifier)
- `workspaceId` (system-set)

**Required for Sales-Ready:**
- `firstName`, `lastName`
- `email` (verified)
- `accountId` (associated company)
- `phone` (recommended)

### 4.2 Email Validation Rules

```typescript
// Email validation
const emailRules = {
  format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  maxLength: 254,
  prohibitedDomains: ['test.com', 'example.com'],
  requireBusinessDomain: false, // For B2B, could enable
};

// Email status enum
enum EmailStatus {
  UNVERIFIED = 'unverified',
  VALID = 'valid',
  INVALID = 'invalid',
  BOUNCED = 'bounced',
  CATCH_ALL = 'catch_all',
  DISPOSABLE = 'disposable',
}
```

### 4.3 Phone Validation

```typescript
// Phone storage (E.164 format internally)
const phoneRules = {
  format: /^\+[1-9]\d{1,14}$/,  // E.164
  displayFormat: 'national',     // For UI display
};
```

### 4.4 Data Completeness Score

```typescript
// Calculate profile completeness (0-100)
function calculateCompleteness(contact: Contact): number {
  const weights = {
    firstName: 15,
    lastName: 15,
    email: 20,
    phone: 10,
    jobTitle: 10,
    accountId: 15,
    linkedinUrl: 5,
    address: 10,
  };

  let score = 0;
  for (const [field, weight] of Object.entries(weights)) {
    if (contact[field]) score += weight;
  }
  return score;
}
```

### 4.5 Merge/Dedup Workflow

1. **Auto-detect** - System flags potential duplicates based on criteria
2. **Review queue** - User reviews flagged duplicates
3. **Merge decision** - User selects master record
4. **Field resolution** - For each field, keep master or merge value
5. **Activity merge** - All activities consolidated to master
6. **Redirect setup** - Old IDs redirect to master

---

## 5. Answers to Research Questions

### Q1: Should contacts exist without a company?

**Answer: Yes.**

Rationale:
- Early-stage leads may not have company info yet
- Consumers (B2C) may not have companies
- Allows for progressive profiling
- Twenty CRM allows this (nullable `companyId`)

### Q2: Can one contact belong to multiple companies?

**Answer: Not in MVP, planned for future.**

MVP: One contact → one company (many-to-one)
Future: Junction table for multi-company support

### Q3: What standard for industry classification?

**Answer: NAICS as primary, custom tags as supplement.**

- Store 6-digit NAICS code
- Store human-readable industry name
- Support custom industry tags
- Consider SIC for legacy data imports

### Q4: How do we handle contact opt-out/unsubscribe status?

**Answer: Dedicated consent tracking fields.**

```typescript
// Consent fields
emailOptIn: boolean;           // Consented to email
emailOptOutAt: DateTime | null; // When they opted out
smsOptIn: boolean;
marketingConsent: boolean;
consentSource: string;         // How consent was obtained
consentDate: DateTime;
```

---

## 6. Recommended Prisma Schema

```prisma
model Contact {
  id              String    @id @default(uuid())
  workspaceId     String

  // Identity
  firstName       String
  lastName        String
  email           String?
  emailStatus     String    @default("unverified")
  phone           String?

  // Professional
  jobTitle        String?
  department      String?

  // Composite (JSON)
  emails          Json?     // { primary, additional[] }
  phones          Json?     // { primary, additional[] }
  address         Json?     // { street1, city, state, ... }
  socialLinks     Json?     // { linkedin, twitter }

  // CRM
  leadScore       Int?
  scoreTier       String?   // COLD, WARM, HOT, SALES_READY
  lifecycle       String    @default("lead")
  source          String?
  sourceDetail    String?

  // Engagement
  lastActivityAt  DateTime?
  lastContactedAt DateTime?
  completeness    Int       @default(0)

  // Consent
  emailOptIn      Boolean   @default(false)
  emailOptOutAt   DateTime?
  marketingConsent Boolean  @default(false)

  // Custom
  customFields    Json?
  tags            String[]

  // Relations
  accountId       String?
  account         Account?  @relation(fields: [accountId], references: [id])
  ownerId         String?

  deals           Deal[]
  activities      Activity[]

  // System
  position        Float     @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@unique([workspaceId, email])
  @@index([workspaceId])
  @@index([accountId])
  @@index([lifecycle])
  @@index([scoreTier])
}

model Account {
  id              String    @id @default(uuid())
  workspaceId     String

  // Identity
  name            String
  domain          String?

  // Firmographics
  employeeCount   Int?
  employeeRange   String?
  annualRevenue   Decimal?
  revenueRange    String?

  // Industry
  industry        String?
  industryCode    String?   // NAICS
  industryTags    String[]

  // Classification
  segment         String?   // enterprise, mid_market, smb
  type            String    @default("prospect")

  // Composite
  address         Json?
  socialLinks     Json?

  // Health
  healthScore     Int?
  idealCustomerProfile Boolean @default(false)

  // Hierarchy
  parentId        String?
  parent          Account?  @relation("AccountHierarchy", fields: [parentId], references: [id])
  children        Account[] @relation("AccountHierarchy")

  // Relations
  ownerId         String?
  contacts        Contact[]
  deals           Deal[]
  activities      Activity[]

  // Custom
  customFields    Json?
  tags            String[]

  // System
  position        Float     @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  @@unique([workspaceId, domain])
  @@index([workspaceId])
  @@index([industry])
  @@index([segment])
}
```

---

## 7. Sources

- [Twenty CRM Analysis](/docs/modules/bm-crm/research/twenty-crm-analysis.md) - Primary source
- [HubSpot Data Model Overview](https://knowledge.hubspot.com/data-management/view-a-model-of-your-crm-object-and-activity-relationships)
- [HubSpot Contact Properties Guide](https://www.hublead.io/blog/hubspot-contact-properties)
- [HubSpot Data Management Best Practices](https://www.eternalworks.com/blog/hubspot-crm-data-management-best-practices-organization-clean-up-and-maintenance)
- [NAICS Association](https://www.naics.com/)
- [US Census NAICS](https://www.census.gov/naics/)

---

**Research Status:** ✅ Complete
**Next:** Update checklist and proceed to Section 3 (Deal Pipeline)
