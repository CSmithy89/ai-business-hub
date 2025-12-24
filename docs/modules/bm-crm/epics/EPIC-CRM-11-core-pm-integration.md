# EPIC-CRM-11: Core-PM Integration

**Module:** BM-CRM
**Phase:** Growth (Phase 3)
**Stories:** 5 | **Points:** 15
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01, Core-PM (all epics)

---

## Epic Overview

Implement deep integration between BM-CRM and Core-PM (Platform Core) for project linking, Knowledge Base playbooks, and cross-team agent coordination. This epic leverages Core-PM's KB, task management, and Navi agent team to create seamless workflows between sales and delivery.

### Key Integration Points

1. **CRM Playbooks in KB** - Sales scripts, objection handling, and process docs stored as verified KB content
2. **Deal→Project Linking** - Won deals automatically create customer onboarding projects
3. **Cross-Team Coordination** - Clara↔Navi A2A communication for customer handoffs
4. **Activity→Task Linking** - CRM activities can reference PM tasks for context
5. **CRM Reports in KB** - Analytics and reports stored as verified content

---

## Stories

### CRM-11.1: Create CRM Playbooks in Knowledge Base
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Define CrmPlaybook KB page type with structured sections
- [ ] Create playbook templates: Sales Script, Objection Handling, Discovery Questions
- [ ] Link playbooks to CrmDeal stages (e.g., "Discovery" stage shows discovery playbook)
- [ ] Clara can recommend relevant playbook via `@kb.search`
- [ ] Playbooks marked as verified content by default
- [ ] Quick-access playbook sidebar in Deal detail view

**Technical Notes:**
- Uses Core-PM KB `Page` model with `type: 'crm_playbook'`
- Leverages RAG for playbook search
- Links via `CrmDealPlaybook` join table

---

### CRM-11.2: Implement Deal→Project Linking on Deal Won
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] `crm.deal.won` event triggers project creation workflow
- [ ] Project template selection based on deal type/product
- [ ] Auto-populate project with customer data from CrmAccount
- [ ] Create `CrmDealProject` linking table
- [ ] Project visible on Deal detail page
- [ ] Deal visible on Project detail page (Core-PM UI)
- [ ] Clara notifies user of project creation

**Technical Notes:**
- Event handler listens to `crm.deal.won`
- Invokes Navi via A2A to create project from template
- Stores link in `CrmDealProject` with `dealId` and `projectId`

---

### CRM-11.3: Add Clara↔Navi A2A Coordination for Handoffs
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Clara can invoke Navi for project/task operations
- [ ] Navi can query Clara for customer context
- [ ] Handoff workflow: Clara packages customer context for Navi
- [ ] Context includes: account info, deal history, key contacts, activities
- [ ] Handoff logged as CrmActivity with type `customer_handoff`
- [ ] Bidirectional agent card discovery

**Technical Notes:**
- Uses A2A protocol for RPC calls
- Clara implements `getCustomerContext(accountId)` for Navi
- Navi implements `createProjectFromDeal(dealId)` for Clara

---

### CRM-11.4: Link Tracker Activities to PM Tasks
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] Add optional `taskId` field to CrmActivity model
- [ ] Activity creation can reference PM task
- [ ] Tracker agent can suggest task linkage for meeting activities
- [ ] Linked activities show task reference with link
- [ ] Task detail (in Core-PM) shows related CRM activities
- [ ] Filter activities by linked task

**Technical Notes:**
- `CrmActivity.taskId` → `Task.id` (Core-PM)
- Tracker uses `@core-pm.navi` to find relevant tasks
- Task link rendered as clickable reference

---

### CRM-11.5: Create CRM Reports as KB Verified Content
**Points:** 3 | **Status:** `backlog`

**Acceptance Criteria:**
- [ ] CRM reports can be published to KB as verified content
- [ ] Report types: Pipeline Summary, Win/Loss Analysis, Rep Performance
- [ ] Published reports have snapshot date and data
- [ ] Scribe agent formats report for KB consumption
- [ ] Reports searchable via KB RAG
- [ ] Monthly auto-publish option for key reports
- [ ] Version history for published reports

**Technical Notes:**
- Uses KB `Page` model with `type: 'crm_report'`
- Report data stored as structured JSON in page content
- `isVerified: true` for all published reports
- Scribe converts analytics data to readable format

---

## Definition of Done

- [ ] CRM playbooks accessible from deal detail
- [ ] Won deals create projects automatically
- [ ] Clara↔Navi can communicate via A2A
- [ ] Activities can link to PM tasks
- [ ] CRM reports publishable to KB
- [ ] All integration points have event bus hooks

---

## Data Model Additions

```prisma
// Add to CrmActivity
model CrmActivity {
  // ... existing fields
  taskId        String?   // Link to PM Task
  task          Task?     @relation(fields: [taskId], references: [id])
}

// New join table for Deal→Project
model CrmDealProject {
  id        String   @id @default(cuid())
  dealId    String
  projectId String
  createdAt DateTime @default(now())

  deal      CrmDeal  @relation(fields: [dealId], references: [id])
  project   Project  @relation(fields: [projectId], references: [id])

  @@unique([dealId, projectId])
  @@index([dealId])
  @@index([projectId])
}

// New join table for Deal→Playbook
model CrmDealPlaybook {
  id         String   @id @default(cuid())
  dealId     String
  pageId     String   // KB Page ID
  stageKey   String   // Which stage this playbook is for

  deal       CrmDeal  @relation(fields: [dealId], references: [id])
  page       Page     @relation(fields: [pageId], references: [id])

  @@unique([dealId, pageId])
  @@index([dealId])
}
```

---

## Event Patterns

| Event | Trigger | Handler |
|-------|---------|---------|
| `crm.deal.won` | Deal moves to won | Create project via Navi |
| `crm.activity.created` | Activity logged | Check for task linkage |
| `pm.project.created` | Project created from deal | Link back to deal |
| `crm.handoff.initiated` | Customer handoff started | Package context for Navi |

---

## Risk Considerations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Core-PM not available | Integration fails | Graceful degradation, queue for retry |
| A2A latency | Slow handoffs | Async with status updates |
| Data sync issues | Stale links | Event-driven updates |

---

_Part of BM-CRM Growth Phase 3 - Core-PM Integration_
