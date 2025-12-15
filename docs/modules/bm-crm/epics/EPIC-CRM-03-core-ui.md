# EPIC-CRM-03: Core CRM UI

**Module:** BM-CRM
**Phase:** MVP (Phase 1)
**Stories:** 8 | **Points:** 22
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01 (Data Layer), EPIC-CRM-02 (Agents)

---

## Epic Overview

Build the core CRM user interface including contact/account lists, detail views, pipeline kanban board, and CRM dashboard. Implement the "Meet Your CRM Team" onboarding experience.

### Success Criteria
- Full CRUD UI for contacts, accounts, deals
- Pipeline kanban with drag-and-drop
- Activity timeline on contact/deal pages
- CRM dashboard with key metrics
- Agent team onboarding flow

---

## Stories

### CRM-03.1: Create Contact List Page with Search/Filter
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/contacts`
- [ ] DataTable with columns: Name, Email, Company, Score, Tier, Owner, Last Activity
- [ ] Score badge with tier color (cold=gray, warm=yellow, hot=orange, sales_ready=green)
- [ ] Search bar with full-text search
- [ ] Filters: Tier, Lifecycle, Tags, Owner
- [ ] Pagination with configurable page size
- [ ] Bulk actions: Delete, Assign Owner, Add Tag
- [ ] "New Contact" button opens create modal
- [ ] Row click navigates to detail page

---

### CRM-03.2: Create Contact Detail Page with Timeline
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/contacts/:id`
- [ ] Header: Name, job title, company, score badge
- [ ] Contact info card: Email, phone, address, social links
- [ ] Score breakdown card with explanation (hover tooltip shows factors)
- [ ] Activity timeline (chronological, filterable by type)
- [ ] Deals section showing associated deals
- [ ] Edit button opens edit modal
- [ ] "Ask Clara" button for agent interaction
- [ ] Quick actions: Log Call, Send Email, Create Deal

---

### CRM-03.3: Create Account List Page
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/accounts`
- [ ] DataTable with columns: Name, Domain, Industry, Size, Contacts, Health Score
- [ ] Search and filter by segment, industry
- [ ] Contact count badge
- [ ] "New Account" button
- [ ] Row click navigates to detail

---

### CRM-03.4: Create Account Detail Page
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/accounts/:id`
- [ ] Header: Company name, domain, logo (from Clearbit)
- [ ] Firmographics card: Industry, size, revenue, location
- [ ] Contacts tab: List of associated contacts
- [ ] Deals tab: Associated deals
- [ ] Activity tab: Aggregated activity timeline
- [ ] Health score with trend

---

### CRM-03.5: Create Pipeline Kanban Board
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/pipeline`
- [ ] Kanban columns for each stage (Lead → Qualified → Proposal → Negotiation → Won/Lost)
- [ ] Deal cards showing: Name, Value, Company, Days in stage
- [ ] Drag-and-drop to move between stages
- [ ] Stage move triggers API call and event
- [ ] Column totals: Deal count, Total value
- [ ] Filter by owner, value range, expected close date
- [ ] "New Deal" button
- [ ] Card click opens deal detail modal
- [ ] Use @dnd-kit/core for drag-and-drop

---

### CRM-03.6: Create Deal Detail Modal/Page
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Modal or dedicated page: `/crm/deals/:id`
- [ ] Header: Deal name, value, stage badge, probability
- [ ] Details: Expected close, actual close (if closed), owner
- [ ] Associated contact and account info
- [ ] Activity timeline specific to deal
- [ ] Stage history showing time in each stage
- [ ] Quick stage change buttons
- [ ] Edit and delete actions

---

### CRM-03.7: Create CRM Dashboard with Metrics
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm` (CRM landing page)
- [ ] Metrics cards: Total Contacts, Hot Leads, Active Deals, Pipeline Value
- [ ] Pipeline funnel visualization
- [ ] Recent activity feed
- [ ] Top contacts by score
- [ ] Deals closing this week/month
- [ ] Agent suggestion card (Clara's daily briefing preview)
- [ ] Link to full pipeline board

---

### CRM-03.8: Implement "Meet Your CRM Team" Onboarding
**Points:** 1 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Shown on first visit to CRM module
- [ ] Agent carousel introducing: Clara, Scout, Atlas, Flow, Echo
- [ ] Each agent card: Avatar, name, tagline, 3 capabilities
- [ ] Quick preferences: Proactivity level, Morning briefing toggle
- [ ] First action prompt: Import contacts or create first contact
- [ ] "Skip" option to bypass
- [ ] Flag stored in user preferences to not show again

---

## Definition of Done

- [ ] All pages/components implemented
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Loading states and error handling
- [ ] Keyboard navigation support
- [ ] Connected to API endpoints
- [ ] Agent interaction integrated (Ask Clara)
