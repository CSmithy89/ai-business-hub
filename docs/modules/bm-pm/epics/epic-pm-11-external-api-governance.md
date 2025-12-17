# Epic PM-11: External API & Governance

**Goal:** Developers can access PM functionality via REST API with proper governance.

## Wireframe References

| Story | Wireframe | Assets |
|-------|-----------|--------|
| PM-11: API & Webhooks Config | PM-34 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-34_api_%26_webhooks_configuration/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-34_api_%26_webhooks_configuration/screen.png) |
| PM-11: Audit & Compliance | PM-37 | [HTML](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-37_enterprise_audit_%26_compliance/code.html) · [PNG](../../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-37_enterprise_audit_%26_compliance/screen.png) |

---

### Story PM-11.1: REST API Design

**As a** platform developer,
**I want** documented REST API for PM,
**So that** external systems can integrate.

**Acceptance Criteria:**

**Given** API design complete
**When** documented
**Then** covers: projects CRUD, phases CRUD, tasks CRUD, views, search

**And** OpenAPI 3.0 spec

**And** versioned (v1)

**Prerequisites:** PM-02.1

**Technical Notes:**
- Extend existing API patterns
- Rate limiting per API key

---

### Story PM-11.2: API Authentication

**As a** API consumer,
**I want** secure authentication,
**So that** my integrations are protected.

**Acceptance Criteria:**

**Given** API key exists
**When** making API calls
**Then** authenticate via: API key in header, OAuth 2.0 for user context

**And** scoped permissions per key

**And** key management in settings

**Prerequisites:** PM-11.1

**Technical Notes:**
- Extend existing ApiKey model
- Scope: pm:read, pm:write, pm:admin

---

### Story PM-11.3: Webhook Configuration

**As a** project admin,
**I want** to configure webhooks,
**So that** external systems receive events.

**Acceptance Criteria:**

**Given** I configure webhook
**When** events occur
**Then** POST request sent to configured URL

**And** event types: task.created, task.updated, task.completed, phase.transitioned

**And** retry on failure (3 attempts)

**And** webhook logs for debugging

**Prerequisites:** PM-06.1

**Technical Notes:**
- Webhook delivery queue
- Signature verification (HMAC)

---

### Story PM-11.4: API Documentation Portal

**As a** developer,
**I want** interactive API docs,
**So that** I can explore and test.

**Acceptance Criteria:**

**Given** I access /api/docs
**When** docs load
**Then** shows: endpoint list, request/response examples, "Try It" functionality, authentication guide

**Prerequisites:** PM-11.1

**Technical Notes:**
- Swagger UI or Redoc
- Auto-generated from OpenAPI spec

---

### Story PM-11.5: API Rate Limiting & Governance

**As a** platform admin,
**I want** API rate limiting,
**So that** the platform stays performant.

**Acceptance Criteria:**

**Given** API is used
**When** limits exceeded
**Then** 429 response with retry-after header

**And** default: 1000 requests/hour per key

**And** configurable per workspace plan

**And** usage dashboard in settings

**Prerequisites:** PM-11.1

**Technical Notes:**
- Redis-based rate limiting
- Usage metrics tracking

---
