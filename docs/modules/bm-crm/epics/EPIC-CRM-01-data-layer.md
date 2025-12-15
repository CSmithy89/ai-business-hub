# EPIC-CRM-01: Data Layer & Core CRUD

**Module:** BM-CRM
**Phase:** MVP (Phase 1)
**Stories:** 8 | **Points:** 21
**Status:** `backlog`
**Dependencies:** Platform foundation (RLS, Prisma)

---

## Epic Overview

Implement the foundational data models and CRUD operations for all CRM entities: Contacts, Accounts, Deals, and Activities. This epic establishes the database schema with proper multi-tenant isolation using Row-Level Security (RLS).

### Success Criteria
- All 4 CRM models created with proper RLS policies
- CRUD APIs functional for all entities
- Full-text search on Contact and Account
- Activity logging working for all entity types

---

## Stories

### CRM-01.1: Create CrmContact Prisma Model with RLS
**Points:** 3 | **Status:** `backlog`

**Description:**
Create the CrmContact Prisma model with all fields from the PRD, including composite JSON fields for emails, phones, and addresses. Implement RLS policy for workspace isolation.

**Acceptance Criteria:**
- [ ] CrmContact model in `packages/db/prisma/schema.prisma`
- [ ] Fields: id, workspaceId, firstName, lastName, email, phone, jobTitle, department
- [ ] JSON fields: emails, phones, address, socialLinks, customFields
- [ ] CRM fields: leadScore, scoreTier, lifecycle, source, sourceDetail
- [ ] Consent fields: emailOptIn, marketingConsent, consentDate
- [ ] Relations: accountId → CrmAccount, ownerId → User
- [ ] Indexes on: workspaceId, email, scoreTier, lifecycle
- [ ] RLS policy: `workspace_id = current_workspace_id()`
- [ ] Migration runs successfully

**Technical Notes:**
```prisma
model CrmContact {
  id            String   @id @default(cuid())
  workspaceId   String   @map("workspace_id")
  firstName     String?  @map("first_name")
  lastName      String?  @map("last_name")
  email         String?
  phone         String?
  jobTitle      String?  @map("job_title")
  department    String?
  emails        Json?    // [{email, type, primary}]
  phones        Json?    // [{phone, type, primary}]
  address       Json?    // {street, city, state, country, zip}
  socialLinks   Json?    @map("social_links") // {linkedin, twitter}
  leadScore     Int      @default(0) @map("lead_score")
  scoreTier     String   @default("cold") @map("score_tier")
  lifecycle     String   @default("lead")
  source        String?
  sourceDetail  String?  @map("source_detail")
  emailOptIn    Boolean  @default(false) @map("email_opt_in")
  marketingConsent Boolean @default(false) @map("marketing_consent")
  consentDate   DateTime? @map("consent_date")
  customFields  Json?    @map("custom_fields")
  tags          String[] @default([])
  accountId     String?  @map("account_id")
  ownerId       String?  @map("owner_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at") // Soft delete

  account       CrmAccount? @relation(fields: [accountId], references: [id])
  activities    CrmActivity[]
  deals         CrmDeal[]

  @@index([workspaceId])
  @@index([email])
  @@index([scoreTier])
  @@index([lifecycle])
  @@map("crm_contacts")
}
```

---

### CRM-01.2: Create CrmAccount Prisma Model
**Points:** 2 | **Status:** `backlog`

**Description:**
Create the CrmAccount (Company) Prisma model with firmographic fields for company data.

**Acceptance Criteria:**
- [ ] CrmAccount model in schema.prisma
- [ ] Fields: name, domain, industry, industryCode (NAICS)
- [ ] Size fields: employeeCount, employeeRange, annualRevenue, revenueRange
- [ ] Classification: segment (smb/mid-market/enterprise), type (prospect/customer/partner)
- [ ] Health: healthScore, idealCustomerProfile flag
- [ ] Hierarchy: parentId for subsidiaries
- [ ] Relations: contacts[], deals[], ownerId → User
- [ ] Indexes on: workspaceId, domain
- [ ] Migration runs successfully

---

### CRM-01.3: Create CrmDeal Prisma Model
**Points:** 3 | **Status:** `backlog`

**Description:**
Create the CrmDeal model for opportunity/deal pipeline tracking.

**Acceptance Criteria:**
- [ ] CrmDeal model in schema.prisma
- [ ] Fields: name, value, currency, stage, probability
- [ ] Date fields: expectedCloseDate, actualCloseDate
- [ ] Status: lostReason (for closed-lost deals)
- [ ] Relations: accountId → CrmAccount, primaryContactId → CrmContact, ownerId → User
- [ ] Indexes on: workspaceId, stage
- [ ] Default stages enum or string validation
- [ ] Migration runs successfully

---

### CRM-01.4: Create CrmActivity Prisma Model
**Points:** 2 | **Status:** `backlog`

**Description:**
Create the CrmActivity model for tracking all contact engagement (emails, calls, meetings, notes, tasks).

**Acceptance Criteria:**
- [ ] CrmActivity model in schema.prisma
- [ ] Fields: type (enum: email, call, meeting, note, task), subject, body
- [ ] Timing: happenedAt (when activity occurred)
- [ ] Analysis: sentiment (positive/neutral/negative)
- [ ] Relations: contactId → CrmContact, dealId → CrmDeal, createdById → User
- [ ] Indexes on: workspaceId, contactId, dealId, type
- [ ] Migration runs successfully

---

### CRM-01.5: Implement Contact CRUD API Endpoints
**Points:** 3 | **Status:** `backlog`

**Description:**
Create NestJS API endpoints for Contact CRUD operations with full-text search and filtering.

**Acceptance Criteria:**
- [ ] `POST /api/crm/contacts` - Create contact
- [ ] `GET /api/crm/contacts` - List contacts with pagination
- [ ] `GET /api/crm/contacts/:id` - Get single contact
- [ ] `PATCH /api/crm/contacts/:id` - Update contact
- [ ] `DELETE /api/crm/contacts/:id` - Soft delete contact
- [ ] Query params: search, scoreTier, lifecycle, tags, ownerId
- [ ] Full-text search on firstName, lastName, email, jobTitle
- [ ] Zod validation on request bodies
- [ ] Returns 404 for non-existent or other-workspace contacts

**API Contract:**
```typescript
// POST /api/crm/contacts
interface CreateContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;  // At least firstName OR email required
  phone?: string;
  jobTitle?: string;
  accountId?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

// GET /api/crm/contacts?search=john&scoreTier=hot&page=1&limit=20
interface ContactListResponse {
  data: CrmContact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

### CRM-01.6: Implement Account CRUD API Endpoints
**Points:** 2 | **Status:** `backlog`

**Description:**
Create NestJS API endpoints for Account (Company) CRUD operations.

**Acceptance Criteria:**
- [ ] `POST /api/crm/accounts` - Create account
- [ ] `GET /api/crm/accounts` - List accounts with pagination
- [ ] `GET /api/crm/accounts/:id` - Get single account with contacts
- [ ] `PATCH /api/crm/accounts/:id` - Update account
- [ ] `DELETE /api/crm/accounts/:id` - Soft delete account
- [ ] Query params: search, segment, type, industry
- [ ] Include contact count in list response
- [ ] Zod validation on request bodies

---

### CRM-01.7: Implement Deal CRUD API Endpoints
**Points:** 3 | **Status:** `backlog`

**Description:**
Create NestJS API endpoints for Deal CRUD operations with pipeline stage management.

**Acceptance Criteria:**
- [ ] `POST /api/crm/deals` - Create deal
- [ ] `GET /api/crm/deals` - List deals with pagination
- [ ] `GET /api/crm/deals/:id` - Get single deal with contact/account
- [ ] `PATCH /api/crm/deals/:id` - Update deal (including stage change)
- [ ] `DELETE /api/crm/deals/:id` - Soft delete (or close as lost)
- [ ] Query params: stage, ownerId, accountId, minValue, maxValue
- [ ] Stage change triggers event: `crm.deal.stage_changed`
- [ ] Zod validation on request bodies

---

### CRM-01.8: Implement Activity CRUD API Endpoints
**Points:** 3 | **Status:** `backlog`

**Description:**
Create NestJS API endpoints for Activity logging and timeline retrieval.

**Acceptance Criteria:**
- [ ] `POST /api/crm/activities` - Log activity
- [ ] `GET /api/crm/contacts/:id/activities` - Get contact timeline
- [ ] `GET /api/crm/deals/:id/activities` - Get deal timeline
- [ ] `GET /api/crm/activities/:id` - Get single activity
- [ ] `PATCH /api/crm/activities/:id` - Update activity
- [ ] `DELETE /api/crm/activities/:id` - Delete activity
- [ ] Activity creation triggers event: `crm.activity.logged`
- [ ] Timeline sorted by happenedAt DESC
- [ ] Filter by activity type

---

## Definition of Done

- [ ] All Prisma models created and migrated
- [ ] All API endpoints implemented with Zod validation
- [ ] RLS policies verified with cross-tenant test
- [ ] Unit tests for CRUD services
- [ ] API documentation updated
- [ ] Events publishing on create/update/delete

---

## Technical Notes

### File Locations
- Models: `packages/db/prisma/schema.prisma`
- API: `apps/api/src/crm/` (new module)
- DTOs: `apps/api/src/crm/dto/`
- Services: `apps/api/src/crm/services/`

### Testing
```bash
# Run migrations
pnpm db:migrate

# Test API
curl -X POST http://localhost:3001/api/crm/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"firstName": "John", "email": "john@example.com"}'
```
