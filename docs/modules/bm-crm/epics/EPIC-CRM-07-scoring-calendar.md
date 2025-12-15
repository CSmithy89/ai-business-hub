# EPIC-CRM-07: Custom Scoring & Calendar Integration

**Module:** BM-CRM
**Phase:** Growth (Phase 2)
**Stories:** 5 | **Points:** 14
**Status:** `backlog`
**Dependencies:** EPIC-CRM-02 (Scout agent)

---

## Epic Overview

Enable tenant-customizable scoring models and integrate with Google/Outlook calendars for meeting sync.

---

## Stories

### CRM-07.1: Create Scoring Model Configuration Schema
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmScoringModel Prisma model
- [ ] JSON schema for weights, factors, thresholds
- [ ] Support for custom firmographic/behavioral/intent factors
- [ ] Active model per workspace
- [ ] Migration from default to custom model

---

### CRM-07.2: Implement Scoring Model UI in Settings
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/scoring`
- [ ] Weight sliders (must sum to 100)
- [ ] Factor configuration (score per criteria)
- [ ] Tier threshold adjustment
- [ ] Preview mode showing sample scores
- [ ] Save requires approval (triggers bulk recalculation)

---

### CRM-07.3: Extend Scout to Use Custom Scoring Models
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Scout loads active scoring model for tenant
- [ ] Apply custom weights and factors
- [ ] Fallback to default if no custom model
- [ ] Recalculate all scores when model changes (batched, approved)
- [ ] Score breakdown reflects custom factors

---

### CRM-07.4: Implement Google Calendar Integration
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Google Calendar OAuth flow
- [ ] CrmCalendarConnection model
- [ ] Poll for events (every 15 min)
- [ ] Match attendees to contacts by email
- [ ] Create activity records for matched meetings
- [ ] Two-way: Create calendar event from CRM

---

### CRM-07.5: Implement Outlook Calendar Integration
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Microsoft Graph OAuth flow
- [ ] Same sync logic as Google
- [ ] Handle recurring events
- [ ] Time zone awareness
- [ ] Connection management in Settings

---

## Definition of Done

- [ ] Custom scoring operational
- [ ] Google Calendar sync working
- [ ] Outlook Calendar sync working
- [ ] Activities auto-created for meetings
