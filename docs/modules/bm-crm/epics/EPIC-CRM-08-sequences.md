# EPIC-CRM-08: Cadence Agent & Email Sequences

**Module:** BM-CRM
**Phase:** Growth (Phase 3)
**Stories:** 8 | **Points:** 26
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, EPIC-CRM-02

---

## Epic Overview

Implement Cadence outreach agent with email sequences, multi-channel campaigns, conflict detection, and analytics.

---

## Stories

### CRM-08.1: Create Cadence Outreach Agent
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] `agents/crm/outreach_agent.py` created
- [ ] Cadence added to CRM team
- [ ] Tools: create_sequence, enroll_contact, pause_sequence, suggest_personalization
- [ ] Multi-channel support: email, linkedin, task
- [ ] A/B testing suggestions
- [ ] Optimal send time recommendations

---

### CRM-08.2: Create CrmSequence and CrmSequenceEnrollment Models
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CrmSequence model: name, steps (JSON), channels, active flag
- [ ] CrmSequenceStep: order, channel, delay_hours, subject, body, conditions
- [ ] CrmSequenceEnrollment: contact_id, sequence_id, current_step, status, next_send_at
- [ ] Unique constraint on (contact_id, sequence_id)
- [ ] Indexes for efficient querying

---

### CRM-08.3: Implement Sequence Step State Machine
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] States: created, pending, sent, replied, completed, paused, bounced, unsubscribed
- [ ] State transitions validated
- [ ] Auto-advance on no_response after delay
- [ ] Auto-complete on reply
- [ ] Pause/resume capability
- [ ] Bounce and unsubscribe handling

---

### CRM-08.4: Implement BullMQ Job Processor for Sequences
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] BullMQ queue: `crm:sequences`
- [ ] Delayed jobs for each step
- [ ] Each step schedules next step on completion
- [ ] Retry logic with exponential backoff
- [ ] Dead letter queue for failed sends
- [ ] Job visibility in admin (via BullBoard)

---

### CRM-08.5: Implement Sequence Conflict Detection
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Check before enrollment: already in sequence?
- [ ] Check: in another active sequence?
- [ ] Check: daily touch limit (max 2/day)
- [ ] Conflict presentation to user
- [ ] Resolution options: Replace, Parallel, Skip
- [ ] Tool: check_sequence_conflicts

---

### CRM-08.6: Create Sequence Builder UI
**Points:** 5 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Route: `/crm/sequences/new` and `/crm/sequences/:id/edit`
- [ ] Visual step builder (drag-and-drop)
- [ ] Step configuration: channel, delay, subject, body
- [ ] Merge field picker ({{first_name}}, etc.)
- [ ] AI personalization button (Cadence generates)
- [ ] Preview mode
- [ ] Save and activate

---

### CRM-08.7: Create Sequence Enrollment UI
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] "Add to Sequence" button on contact page
- [ ] Sequence picker with status
- [ ] Conflict warning display
- [ ] Enrollment confirmation
- [ ] Active enrollments visible on contact timeline
- [ ] Pause/resume from contact page

---

### CRM-08.8: Implement Sequence Analytics and A/B Testing
**Points:** 2 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Sequence performance dashboard
- [ ] Metrics: Open rate, Click rate, Reply rate per step
- [ ] Funnel visualization
- [ ] A/B test setup (variant sequences)
- [ ] Winner detection and auto-selection

---

## Definition of Done

- [ ] Cadence agent operational
- [ ] Sequences can be created and enrolled
- [ ] BullMQ processing reliable
- [ ] Conflict detection prevents over-contact
- [ ] Analytics provide insights
