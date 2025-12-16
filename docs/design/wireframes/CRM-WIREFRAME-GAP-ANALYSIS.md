# BM-CRM Wireframe Gap Analysis

**Analysis Date:** 2025-12-16
**PRD Version:** BM-CRM v1.4
**Status:** Audit Complete - Gaps Identified

---

## Executive Summary

Deep audit of BM-CRM PRD v1.4 against existing wireframe prompts revealed:

- **Existing Wireframes:** 20 wireframes (CRM-01 to CRM-20)
- **MVP Gaps:** 5 missing wireframes for Phase 1 features
- **Phase 2 Gaps:** 6 missing wireframes for Growth features
- **Phase 3 Gaps:** 6 missing wireframes for Growth Phase 3
- **Vision Gaps:** 6 missing wireframes for future features
- **Total New Wireframes Needed:** 23 additional

---

## Existing Wireframes Inventory

### From WIREFRAME-INDEX (CRM-01 to CRM-14) - Completed

| ID | Name | Status | Batch |
|----|------|--------|-------|
| CRM-01 | Contacts List | Complete | BATCH-06 |
| CRM-02 | Contact Detail | Complete | BATCH-06 |
| CRM-03 | Company Detail | Complete | BATCH-06 |
| CRM-04 | Deals Pipeline | Complete | BATCH-06 |
| CRM-05 | Deal Detail | Complete | BATCH-07 |
| CRM-06 | Activity Timeline | Complete | BATCH-07 |
| CRM-07 | Lead Scoring | Complete | BATCH-07 |
| CRM-08 | Enrichment Panel | Complete | BATCH-07 |
| CRM-09 | Import Wizard | Complete | BATCH-07 |
| CRM-10 | Sync Status | Complete | BATCH-07 |
| CRM-11 | CRM Dashboard | Complete | BATCH-07 |
| CRM-12 | Custom Fields | Complete | BATCH-07 |
| CRM-13 | Agent Suggestions | Complete | BATCH-07 |
| CRM-14 | Consent Center | Complete | BATCH-07 |

### From BATCH-11 (CRM-15 to CRM-20) - Prompts Created

| ID | Name | Status | Batch |
|----|------|--------|-------|
| CRM-15 | "Meet Your Team" Onboarding | Prompt Complete | BATCH-11 |
| CRM-16 | Agent Conflict Resolution | Prompt Complete | BATCH-11 |
| CRM-17 | Scoring Model Editor | Prompt Complete | BATCH-11 |
| CRM-18 | Enrichment Settings | Prompt Complete | BATCH-11 |
| CRM-19 | Integration Field Mapping | Prompt Complete | BATCH-11 |
| CRM-20 | Clara's Daily Briefing | Prompt Complete | BATCH-11 |

**Total Existing:** 20 wireframes

---

## Gap Analysis by Phase

### Phase 1 (MVP) Gaps

| ID | Name | PRD Reference | Priority |
|----|------|---------------|----------|
| CRM-21 | Email Integration Settings | FR-7.2, lines 771-775 | P1 |
| CRM-22 | Manual Score Override Modal | FR-5.4, lines 735-742 | P1 |
| CRM-23 | Tier Change Notifications Panel | FR-5.3, lines 727-733 | P1 |
| CRM-24 | Agent Proactivity Settings | NFR, lines 847-880 | P1 |
| CRM-25 | Companies List View | FR-2.1, lines 644-650 | P1 |

#### CRM-21: Email Integration Settings

**PRD Reference:** FR-7.2, lines 771-775
```
**FR-7.2: Email Integration**
- Gmail OAuth connection
- Outlook OAuth connection
- Email sync (sent/received)
- Email tracking (opens/clicks)
```

**Required Wireframe:**
- Gmail/Outlook OAuth connection buttons
- Email sync toggle (on/off)
- Email tracking settings (opens, clicks)
- Sync status indicator
- Connected accounts list
- Disconnect confirmation

#### CRM-22: Manual Score Override Modal

**PRD Reference:** FR-5.4, lines 735-742
```
**FR-5.4: Manual Score Override**
- Allow sales rep to manually adjust score (+/- 20 points max)
- Require reason selection: "Better fit than data shows", etc.
- Free-text note for override justification
- Audit trail: who overrode, when, original score, new score, reason
- Override expires after 30 days
```

**Required Wireframe:**
- Override modal triggered from CRM-07 Lead Scoring
- Score adjustment slider (+/- 20 points)
- Reason dropdown (Better fit, Worse fit, Special circumstances)
- Free-text justification field
- Expiration date display (30 days)
- Audit log preview

#### CRM-23: Tier Change Notifications Panel

**PRD Reference:** FR-5.3, lines 727-733
```
**FR-5.3: Tier Actions**
- Real-time push notifications for tier upgrades
- In-app notification badge + optional email/Slack notification
- Notification preferences configurable per user
```

**Required Wireframe:**
- Notification bell dropdown showing tier changes
- "John Doe moved from WARM → HOT" notifications
- One-click actions (View Contact, Dismiss)
- Notification preferences modal
- Channel toggles (In-app, Email, Slack)

#### CRM-24: Agent Proactivity Settings

**PRD Reference:** NFR, lines 847-880
```
**Agent Proactivity Settings**
- Quiet: Agents only respond when asked
- Helpful: Daily briefing + suggestions when viewing data
- Proactive: Real-time alerts, suggestions during workflows
- Per-agent granularity
- "Snooze" option: 1h/4h/8h/24h
```

**Required Wireframe:**
- Global proactivity slider (Quiet → Helpful → Proactive)
- Per-agent toggle overrides
- Notification channel checkboxes
- Snooze button and duration picker
- Smart batching settings

#### CRM-25: Companies List View

**PRD Reference:** FR-2.1, lines 644-650

**Note:** CRM-03 covers Company Detail, but Companies List is missing.

**Required Wireframe:**
- Company list with search/filter
- Industry, size, health score columns
- Table/card view toggle
- Bulk actions
- Quick add company

---

### Phase 2 (Growth) Gaps

| ID | Name | PRD Reference | Priority |
|----|------|---------------|----------|
| CRM-26 | Cadence: Sequence Builder | Agent spec lines 528-568 | P2 |
| CRM-27 | Cadence: Enrollment Modal | Agent spec lines 556-561 | P2 |
| CRM-28 | Calendar Integration Settings | Growth, line 117 | P2 |
| CRM-29 | LinkedIn Integration Settings | Growth, line 118 | P2 |
| CRM-30 | Multi-Pipeline Configuration | Growth, line 112 | P2 |
| CRM-31 | Sync Health Dashboard | FR-7.3, lines 475-481 | P2 |

#### CRM-26: Cadence Sequence Builder

**PRD Reference:** Cadence Agent, lines 528-568
```
**Sequence Features:**
- Multi-step: Up to 10 steps per sequence
- Conditional: Branch based on engagement
- Multi-channel: Email, LinkedIn, SMS
- Personalization: Merge fields, AI-generated
- Scheduling: Time zone aware, optimal times
```

**Required Wireframe:**
- Visual sequence builder (drag-drop steps)
- Step types: Email, LinkedIn, SMS, Wait, Condition
- Branch logic configuration
- Preview mode showing timeline
- Personalization variable picker
- Send time scheduling

#### CRM-27: Cadence Enrollment Modal

**PRD Reference:** Cadence Agent, lines 556-561
```
**Sequence Conflict Detection:**
- Detect when user enrolls contact already in active sequence
- Alert: "Contact already in [sequence name] - step 3 of 5. Enroll anyway?"
- Options: Replace existing, Run in parallel, Skip enrollment
```

**Required Wireframe:**
- Enrollment confirmation modal
- Conflict warning if contact in another sequence
- Options: Replace, Parallel, Skip
- Daily limit warning (max 2 touches/day)
- Preview upcoming sequence steps

#### CRM-28: Calendar Integration Settings

**PRD Reference:** Growth, line 117
```
- Calendar integration (Google, Outlook)
```

**Required Wireframe:**
- Google Calendar OAuth connection
- Outlook Calendar OAuth connection
- Sync settings (one-way vs two-way)
- Activity types to sync (meetings, calls)
- Connected calendars list

#### CRM-29: LinkedIn Integration Settings

**PRD Reference:** Growth, line 118
```
- LinkedIn integration
```

**Required Wireframe:**
- LinkedIn connection setup
- Profile sync settings
- InMail sequence settings
- Connection request automation
- Activity tracking toggle

#### CRM-30: Multi-Pipeline Configuration

**PRD Reference:** Growth, line 112
```
- Multi-pipeline support (by product/segment)
```

**Required Wireframe:**
- Pipeline list view
- Create new pipeline modal
- Stage configuration per pipeline
- Assign deals to pipeline
- Pipeline-specific reporting

#### CRM-31: Sync Health Dashboard (Enhanced)

**PRD Reference:** FR-7.3, lines 475-481
```
**Sync Health Dashboard:**
- Visual status indicator per integration
- Last sync timestamp and record counts
- Error log with retry status
- One-click "Sync Now" and "Pause Sync"
```

**Note:** CRM-10 covers basic sync status. This is an enhanced version.

**Required Wireframe:**
- Integration health cards (HubSpot, Salesforce, etc.)
- Real-time sync status indicators
- Error log with retry actions
- Record count discrepancies
- Field mapping visualization

---

### Phase 3 (Growth Advanced) Gaps

| ID | Name | PRD Reference | Priority |
|----|------|---------------|----------|
| CRM-32 | Advanced Analytics Dashboard | Growth, line 113 | P3 |
| CRM-33 | Relationship Mapping | Growth, line 115 | P3 |
| CRM-34 | Deal-to-Project Linking | Core-PM Integration, lines 126-131 | P3 |
| CRM-35 | CRM Playbooks in KB | Core-PM Integration, line 127 | P3 |
| CRM-36 | API & Webhooks Configuration | Growth, line 124 | P3 |
| CRM-37 | Mobile CRM Views | Growth, line 116 | P3 |

#### CRM-32: Advanced Analytics Dashboard

**PRD Reference:** Growth, line 113
```
- Advanced reporting and analytics
```

**Required Wireframe:**
- Win/loss analysis charts
- Conversion funnel visualization
- Pipeline velocity metrics
- Rep performance leaderboard
- Custom report builder
- Export/schedule reports

#### CRM-33: Relationship Mapping Visualization

**PRD Reference:** Growth, line 115
```
- Relationship mapping visualization
```

**Required Wireframe:**
- Org chart visualization
- Contact relationship nodes
- Influence arrows (reports to, works with)
- Company hierarchy tree
- Interactive zoom/pan

#### CRM-34: Deal-to-Project Linking

**PRD Reference:** Core-PM Integration, lines 128-129
```
- Deal→Project linking (won deals create onboarding projects)
- Clara↔Navi cross-team coordination for customer handoffs
```

**Required Wireframe:**
- "Link to Project" button on deal detail
- Project creation from deal modal
- Template selection for onboarding
- Clara↔Navi handoff confirmation
- Linked project status in deal view

#### CRM-35: CRM Playbooks in KB

**PRD Reference:** Core-PM Integration, line 127
```
- CRM playbooks stored in Knowledge Base (sales scripts, objection handling)
```

**Required Wireframe:**
- Playbook browser in CRM context
- Linked KB pages panel on contact/deal
- "Suggested playbook" from Clara
- Quick view without leaving CRM
- Create playbook from deal outcome

#### CRM-36: API & Webhooks Configuration

**PRD Reference:** Growth, line 124
```
- API access for external tools
```

**Required Wireframe:**
- API key management
- Webhook endpoint configuration
- Event triggers selection
- Test webhook button
- API documentation link

#### CRM-37: Mobile CRM Views

**PRD Reference:** Growth, line 116
```
- Mobile CRM views
```

**Required Wireframe:**
- Mobile contact list (responsive)
- Mobile contact detail
- Mobile deal pipeline (swipe gestures)
- Mobile-optimized daily briefing
- Quick log activity button

---

### Vision Gaps (Future)

| ID | Name | PRD Reference | Priority |
|----|------|---------------|----------|
| CRM-38 | Predictive Lead Scoring | Vision, line 135 | P4 |
| CRM-39 | Conversation Intelligence | Vision, line 136 | P4 |
| CRM-40 | Revenue Forecasting | Vision, line 137 | P4 |
| CRM-41 | Deal Coaching Panel | Vision, line 138 | P4 |
| CRM-42 | Territory Management | Vision, line 140 | P4 |
| CRM-43 | Commission Tracking | Vision, line 141 | P4 |

#### CRM-38: Predictive Lead Scoring

**PRD Reference:** Vision, line 135
```
- Predictive lead scoring with ML
```

**Required Wireframe:**
- ML model confidence display
- Prediction explanation
- "Why this score?" breakdown
- Model training status
- Prediction accuracy metrics

#### CRM-39: Conversation Intelligence

**PRD Reference:** Vision, line 136
```
- Conversation intelligence (call transcription + analysis)
```

**Required Wireframe:**
- Call recording playback
- AI transcription display
- Key moments/highlights
- Sentiment analysis timeline
- Action items extracted

#### CRM-40: Revenue Forecasting

**PRD Reference:** Vision, line 137
```
- Revenue forecasting with AI
```

**Required Wireframe:**
- Forecast vs actual charts
- Confidence intervals
- Scenario modeling (best/worst/likely)
- Forecast by rep/team/product
- Trend analysis

#### CRM-41: Deal Coaching Panel

**PRD Reference:** Vision, line 138
```
- Automatic deal coaching
```

**Required Wireframe:**
- In-deal coaching sidebar
- "Suggested next steps" from AI
- Objection handling tips
- Similar won/lost deals
- Risk indicators

#### CRM-42: Territory Management

**PRD Reference:** Vision, line 140
```
- Territory management
```

**Required Wireframe:**
- Territory map visualization
- Territory assignment by region/industry
- Rep territory assignment
- Coverage gap analysis
- Performance by territory

#### CRM-43: Commission Tracking

**PRD Reference:** Vision, line 141
```
- Commission tracking
```

**Required Wireframe:**
- Commission calculator
- Rep earnings dashboard
- Deal commission breakdown
- Payout schedule
- Commission rules configuration

---

## Summary: All Missing Wireframes

| Priority | ID | Name | Phase |
|----------|-----|------|-------|
| **P1** | CRM-21 | Email Integration Settings | MVP |
| **P1** | CRM-22 | Manual Score Override Modal | MVP |
| **P1** | CRM-23 | Tier Change Notifications Panel | MVP |
| **P1** | CRM-24 | Agent Proactivity Settings | MVP |
| **P1** | CRM-25 | Companies List View | MVP |
| **P2** | CRM-26 | Cadence: Sequence Builder | Phase 2 |
| **P2** | CRM-27 | Cadence: Enrollment Modal | Phase 2 |
| **P2** | CRM-28 | Calendar Integration Settings | Phase 2 |
| **P2** | CRM-29 | LinkedIn Integration Settings | Phase 2 |
| **P2** | CRM-30 | Multi-Pipeline Configuration | Phase 2 |
| **P2** | CRM-31 | Sync Health Dashboard (Enhanced) | Phase 2 |
| **P3** | CRM-32 | Advanced Analytics Dashboard | Phase 3 |
| **P3** | CRM-33 | Relationship Mapping | Phase 3 |
| **P3** | CRM-34 | Deal-to-Project Linking | Phase 3 |
| **P3** | CRM-35 | CRM Playbooks in KB | Phase 3 |
| **P3** | CRM-36 | API & Webhooks Configuration | Phase 3 |
| **P3** | CRM-37 | Mobile CRM Views | Phase 3 |
| **P4** | CRM-38 | Predictive Lead Scoring | Vision |
| **P4** | CRM-39 | Conversation Intelligence | Vision |
| **P4** | CRM-40 | Revenue Forecasting | Vision |
| **P4** | CRM-41 | Deal Coaching Panel | Vision |
| **P4** | CRM-42 | Territory Management | Vision |
| **P4** | CRM-43 | Commission Tracking | Vision |

---

## Required Actions

### 1. Create MVP Prompts (High Priority)
- [ ] Create BATCH-20 for CRM-21 to CRM-25 (MVP missing features)

### 2. Create Phase 2 Prompts (Medium Priority)
- [ ] Create BATCH-21 for CRM-26 to CRM-31 (Growth Phase 2 features)

### 3. Create Phase 3 Prompts (Medium Priority)
- [ ] Create BATCH-22 for CRM-32 to CRM-37 (Growth Phase 3 features)

### 4. Create Vision Prompts (Low Priority)
- [ ] Create BATCH-23 for CRM-38 to CRM-43 (Vision features)

---

## Updated Wireframe Count

| Category | Count |
|----------|-------|
| Existing CRM (complete) | 14 |
| BATCH-11 (prompts created) | 6 |
| New - MVP Missing | 5 |
| New - Phase 2 Missing | 6 |
| New - Phase 3 Missing | 6 |
| New - Vision Missing | 6 |
| **Total CRM Wireframes** | **43** |

---

## Agent Coverage Analysis

| Agent | Existing Wireframes | Missing |
|-------|---------------------|---------|
| **Clara** (Orchestrator) | CRM-15, CRM-16, CRM-20 | - |
| **Scout** (Lead Scorer) | CRM-07, CRM-17 | CRM-22, CRM-38 |
| **Atlas** (Enricher) | CRM-08, CRM-18 | - |
| **Flow** (Pipeline) | CRM-04, CRM-05 | CRM-30, CRM-32 |
| **Echo** (Tracker) | CRM-06 | CRM-39 |
| **Sync** (Integrations) | CRM-10, CRM-19 | CRM-28, CRM-29, CRM-31 |
| **Guardian** (Compliance) | CRM-14 | - |
| **Cadence** (Outreach) | - | CRM-26, CRM-27 |

---

_Gap analysis complete. Proceed with batch creation for missing wireframes._
