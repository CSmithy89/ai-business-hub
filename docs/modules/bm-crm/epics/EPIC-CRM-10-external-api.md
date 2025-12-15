# EPIC-CRM-10: External Integrations & API

**Module:** BM-CRM
**Phase:** Growth (Phase 3)
**Stories:** 6 | **Points:** 18
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, EPIC-CRM-08 (Cadence)

---

## Epic Overview

Implement LinkedIn/Sales Navigator integration, outbound webhooks, Zapier app, and public REST API for external integrations.

---

## Stories

### CRM-10.1: Implement LinkedIn/Sales Navigator Integration
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] LinkedIn OAuth connection (Sales Navigator required for full features)
- [ ] Store LinkedIn profile URL on contact
- [ ] Profile lookup by URL
- [ ] Connection status tracking
- [ ] Cadence support for linkedin channel
- [ ] Activity logging for LinkedIn engagement
- [ ] Handle API limitations gracefully

---

### CRM-10.2: Implement Outbound Webhook System
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmWebhook model: url, events[], secret, active
- [ ] CrmWebhookDelivery model: payload, status, retry_count
- [ ] HMAC-SHA256 signature on payloads
- [ ] Events trigger webhook queue job
- [ ] Retry with exponential backoff (max 5)
- [ ] Delivery log for debugging
- [ ] Webhook test endpoint

---

### CRM-10.3: Create Webhook Management UI
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/webhooks`
- [ ] Create webhook: URL, event selection, name
- [ ] Secret generation and display (once)
- [ ] Enable/disable toggle
- [ ] Delivery log with status
- [ ] Test webhook button
- [ ] Delete webhook

---

### CRM-10.4: Publish Zapier CRM App
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Zapier app definition
- [ ] Authentication: API key
- [ ] Triggers: Contact created, Deal stage changed, Deal won/lost
- [ ] Actions: Create contact, Update contact, Log activity
- [ ] Test in Zapier developer mode
- [ ] Submit for Zapier review

---

### CRM-10.5: Implement Public REST API
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Versioned API: `/api/v1/crm/*`
- [ ] API key authentication (Bearer token)
- [ ] Rate limiting: 100 req/min per key
- [ ] Endpoints: contacts, accounts, deals, activities
- [ ] CRUD operations on all resources
- [ ] Pagination, filtering, sorting
- [ ] OpenAPI/Swagger documentation
- [ ] API key scoping (read/write permissions)

---

### CRM-10.6: Create API Key Management UI
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/api`
- [ ] Create API key: name, scopes
- [ ] Key displayed once on creation
- [ ] Key prefix visible for identification
- [ ] Last used timestamp
- [ ] Expiration date (optional)
- [ ] Revoke key

---

## Definition of Done

- [ ] LinkedIn integration operational
- [ ] Webhooks delivering reliably
- [ ] Zapier app functional
- [ ] Public API documented and working
- [ ] API keys secure (hashed storage)
