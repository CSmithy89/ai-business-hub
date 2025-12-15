# EPIC-CRM-04: MVP Integrations

**Module:** BM-CRM
**Phase:** MVP (Phase 1)
**Stories:** 6 | **Points:** 16
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, EPIC-CRM-02

---

## Epic Overview

Implement CSV import/export, basic Gmail integration for email logging, and event bus publishing for platform integration.

---

## Stories

### CRM-04.1: Implement CSV Import with Field Mapping Wizard
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Upload CSV file (max 10MB, 50k rows)
- [ ] Preview first 10 rows
- [ ] Field mapping UI: CSV column → CRM field
- [ ] Auto-detect common fields (email, first_name, etc.)
- [ ] Duplicate handling: Skip, Update, Create duplicate
- [ ] Validation report showing errors/warnings
- [ ] Background processing with progress indicator
- [ ] Event: `crm.import.completed`

---

### CRM-04.2: Implement CSV Export with Field Selection
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Export contacts, accounts, or deals
- [ ] Field selection checkboxes
- [ ] Filter application (export filtered results)
- [ ] Background generation for large exports
- [ ] Download link with 24h expiry
- [ ] Event: `crm.export.completed`

---

### CRM-04.3: Implement Gmail OAuth Connection
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] OAuth 2.0 flow with Google
- [ ] Scopes: gmail.readonly, gmail.send
- [ ] Store encrypted refresh token per user
- [ ] Connection status in Settings → Integrations
- [ ] Disconnect/reconnect capability
- [ ] Handle token refresh

---

### CRM-04.4: Implement Email Activity Auto-Logging from Gmail
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Poll Gmail for new messages (every 5 min)
- [ ] Match sender/recipient to CRM contacts by email
- [ ] Create CrmActivity records for matched emails
- [ ] Track email opens (via tracking pixel if enabled)
- [ ] Track link clicks (via redirect if enabled)
- [ ] Deduplicate already-logged emails
- [ ] Event: `crm.activity.logged` with type=email

---

### CRM-04.5: Implement CRM Event Publishers
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Redis Streams publisher in NestJS
- [ ] Events published on all CRUD operations
- [ ] Event schema matches platform standard
- [ ] Include: workspaceId, userId, correlationId, timestamp
- [ ] Events: contact.*, account.*, deal.*, activity.*

---

### CRM-04.6: Create CRM Event Handlers for Platform Events
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Subscribe to relevant platform events
- [ ] `user.created` → Optional: Create contact for team members
- [ ] `business.created` → Initialize CRM for new business
- [ ] `approval.completed` → Execute approved CRM actions
- [ ] Handler error handling with retry

---

## Definition of Done

- [ ] CSV import/export functional
- [ ] Gmail integration working
- [ ] All events publishing
- [ ] Platform event handlers operational
