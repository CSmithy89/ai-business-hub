# Epic KB-03: KB Verification & Scribe Agent

**Goal:** Users get verified content marking and AI-powered KB management.

**FRs Covered:** KB-F5, KB-F7

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| KB-03.1: Verification System | KB-05 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-05_verified_content_management/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-05_verified_content_management/screen.png) |
| KB-03: Scribe Panel | KB-10 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-10_scribe_panel/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-10_scribe_panel/screen.png) |
| KB-03: Comments | KB-07 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-07_page_comments/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/kb-07_page_comments/screen.png) |

---

### Story KB-03.1: Verification System

**As a** KB user,
**I want** to mark pages as verified,
**So that** AI prioritizes authoritative content.

**Acceptance Criteria:**

**Given** I am page owner or admin
**When** I click "Mark as Verified"
**Then** dropdown shows expiration options: 30, 60, 90 days, never

**And** page shows verified badge with expiry date

**And** verified pages get 1.5x boost in search

**Prerequisites:** KB-01.1

**Technical Notes:**
- isVerified, verifiedAt, verifyExpires fields
- POST /api/kb/pages/:id/verify

---

### Story KB-03.2: Verification Expiration

**As a** platform,
**I want** verification to expire,
**So that** outdated content is flagged.

**Acceptance Criteria:**

**Given** page has verifyExpires date
**When** date is reached
**Then** page flagged as "Verification Expired"

**And** owner notified

**And** page still searchable but with warning badge

**And** stale pages list shows expired verifications

**Prerequisites:** KB-03.1

**Technical Notes:**
- Daily cron job checks expirations
- Notification to page owner

---

### Story KB-03.3: Re-verification Workflow

**As a** page owner,
**I want** easy re-verification,
**So that** I can keep content current.

**Acceptance Criteria:**

**Given** page verification expired
**When** I review the page
**Then** "Re-verify" button available

**And** can update expiration period

**And** activity log shows re-verification

**Prerequisites:** KB-03.2

**Technical Notes:**
- Same verify endpoint, updates timestamps

---

### Story KB-03.4: Stale Content Dashboard

**As a** KB admin,
**I want** to see pages needing review,
**So that** I can maintain KB quality.

**Acceptance Criteria:**

**Given** I navigate to /kb/stale
**When** dashboard loads
**Then** shows: expired verifications, pages not updated in 90+ days, pages with low view count

**And** bulk actions: verify, delete, assign for review

**Prerequisites:** KB-03.2

**Technical Notes:**
- Query filters for stale detection

---

### Story KB-03.5: @Mention Support

**As a** KB user,
**I want** to @mention users in pages,
**So that** I can reference team members.

**Acceptance Criteria:**

**Given** I type "@" in editor
**When** autocomplete shows
**Then** I can search and select team members

**And** mention renders as clickable chip

**And** mentioned user notified

**Prerequisites:** KB-01.3

**Technical Notes:**
- Tiptap Mention extension
- PageMention model stores mentions

---

### Story KB-03.6: #Task Reference Support

**As a** KB user,
**I want** to reference tasks in pages,
**So that** I can link documentation to work.

**Acceptance Criteria:**

**Given** I type "#" in editor
**When** autocomplete shows
**Then** I can search tasks by number or title

**And** reference renders as clickable chip (#PM-123)

**And** click navigates to task

**Prerequisites:** KB-01.3, PM-02.1

**Technical Notes:**
- Custom Tiptap extension for task references
- PageMention with mentionType=TASK

---

### Story KB-03.7: Scribe Agent Foundation

**As a** platform,
**I want** Scribe agent for KB management,
**So that** AI helps maintain documentation.

**Acceptance Criteria:**

**Given** Scribe is active
**When** asked about KB
**Then** can: create pages from context, summarize existing pages, detect stale content, suggest structure improvements

**And** all actions require human approval

**Prerequisites:** KB-01.1

**Technical Notes:**
- Agno agent in `agents/platform/scribe/`
- Tools: create_page, update_page, search_kb, analyze_structure

---
