# EPIC-CRM-05: Sync Agent & External CRM Integration

**Module:** BM-CRM
**Phase:** Growth (Phase 2)
**Stories:** 7 | **Points:** 23
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, EPIC-CRM-02

---

## Epic Overview

Implement the Sync integration agent with bi-directional sync for HubSpot and Salesforce CRMs.

---

## Stories

### CRM-05.1: Create Sync Integration Agent
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] `agents/crm/integration_agent.py` created
- [ ] Sync agent added to CRM team
- [ ] Tools: sync_now, configure_mapping, get_sync_status, resolve_conflict
- [ ] Supports multiple sync modes: real-time, scheduled, manual

---

### CRM-05.2: Implement HubSpot OAuth and API Adapter
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] HubSpot OAuth 2.0 flow
- [ ] Encrypted token storage
- [ ] API adapter for contacts, companies, deals
- [ ] Rate limit handling
- [ ] Connection health check

---

### CRM-05.3: Implement HubSpot Bi-Directional Sync
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Field mapping configuration (CRM field ↔ HubSpot property)
- [ ] Inbound sync: HubSpot → BM-CRM
- [ ] Outbound sync: BM-CRM → HubSpot
- [ ] Conflict resolution (most_recent_wins default)
- [ ] Sync history logging
- [ ] Incremental sync using last_modified

---

### CRM-05.4: Implement Salesforce OAuth and API Adapter
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Salesforce OAuth 2.0 flow
- [ ] Support for sandbox and production
- [ ] API adapter for Contact, Account, Opportunity
- [ ] Bulk API for large syncs
- [ ] Rate limit handling

---

### CRM-05.5: Implement Salesforce Bi-Directional Sync
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Field mapping for Salesforce objects
- [ ] Bi-directional sync logic
- [ ] Handle Salesforce-specific fields (RecordType, etc.)
- [ ] Conflict resolution
- [ ] Support custom objects (future)

---

### CRM-05.6: Create Sync Health Dashboard UI
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/integrations`
- [ ] Connection cards for each integration
- [ ] Status indicators: 🟢 Healthy, 🟡 Degraded, 🔴 Failed
- [ ] Last sync timestamp and record counts
- [ ] "Sync Now" and "Pause" buttons
- [ ] Error log with retry status

---

### CRM-05.7: Implement Sync Conflict Resolution Queue
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Conflict queue for manual resolution
- [ ] UI showing: Local value vs Remote value
- [ ] Resolution actions: Use local, Use remote, Skip
- [ ] Bulk resolution for similar conflicts
- [ ] Auto-resolve option with strategy

---

## Definition of Done

- [ ] HubSpot and Salesforce sync operational
- [ ] Conflict resolution working
- [ ] Health dashboard showing status
- [ ] Sync agent integrated with team
