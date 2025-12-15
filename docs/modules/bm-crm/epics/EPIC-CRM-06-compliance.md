# EPIC-CRM-06: Guardian Agent & Compliance

**Module:** BM-CRM
**Phase:** Growth (Phase 2)
**Stories:** 6 | **Points:** 17
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, EPIC-CRM-02

---

## Epic Overview

Implement the Guardian compliance agent for GDPR, consent management, data retention, and audit trails.

---

## Stories

### CRM-06.1: Create Guardian Compliance Agent
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] `agents/crm/compliance_agent.py` created
- [ ] Guardian added to CRM team
- [ ] Tools: delete_contact_data, export_contact_data, record_consent, check_compliance
- [ ] Hard veto power on compliance violations
- [ ] Audit trail for all actions

---

### CRM-06.2: Implement Consent Tracking System
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmConsent model in Prisma
- [ ] Consent types: marketing_email, sales_outreach, data_processing, third_party
- [ ] Record consent with timestamp, source, IP, evidence URL
- [ ] Consent withdrawal handling
- [ ] Consent status visible on contact detail

---

### CRM-06.3: Implement GDPR Erasure Workflow
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Data subject request intake
- [ ] Guardian identifies all contact data across tables
- [ ] Approval request to Sentinel (requires admin approval)
- [ ] Execute deletion on approval
- [ ] Generate erasure certificate
- [ ] Audit log entry
- [ ] Event: `crm.compliance.erasure_completed`

---

### CRM-06.4: Implement Data Export (Portability)
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Export all data for a contact (GDPR Art. 20)
- [ ] JSON and CSV formats
- [ ] Include: contact data, activities, consents, deals
- [ ] Secure download link (24h expiry)
- [ ] Audit log entry

---

### CRM-06.5: Implement Data Retention Policies
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmRetentionPolicy model
- [ ] Per-entity-type configuration (contact, activity, deal)
- [ ] Actions: archive, delete, anonymize
- [ ] Scheduled job to apply policies
- [ ] Anonymization preserves aggregatable fields
- [ ] Admin UI for policy configuration
- [ ] Requires approval for bulk operations

---

### CRM-06.6: Create Compliance Audit Trail UI
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/settings/compliance`
- [ ] Audit log viewer with filters
- [ ] GDPR request status tracker
- [ ] Consent report generator
- [ ] Retention policy status

---

## Definition of Done

- [ ] Guardian agent operational
- [ ] Consent tracking complete
- [ ] GDPR erasure workflow tested
- [ ] Retention policies enforced
- [ ] Audit trail comprehensive
