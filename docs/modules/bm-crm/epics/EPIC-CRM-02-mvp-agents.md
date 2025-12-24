# EPIC-CRM-02: MVP Agent Team

**Module:** BM-CRM
**Phase:** MVP (Phase 1)
**Stories:** 10 | **Points:** 30
**Status:** `backlog`
**Dependencies:** EPIC-CRM-01 (Data Layer)

---

## Epic Overview

Implement the 5 MVP CRM agents following the Agno team pattern: Clara (orchestrator), Scout (scoring), Atlas (enrichment), Flow (pipeline), and Tracker (activities). Register the team in AgentOS and expose via the platform's "Unified Protocol" architecture (AG-UI for frontend, A2A for inter-agent).

> **Protocol Reference:** See [Dynamic Module System](/docs/architecture/dynamic-module-system.md) for Agno + CopilotKit integration details.

### Success Criteria
- CRM team operational with 5 agents
- Clara coordinates all user requests
- Scout calculates scores on contact events
- Atlas enriches new contacts automatically
- Flow manages pipeline transitions
- Tracker tracks all engagement

---

## Stories

### CRM-02.1: Create CRM team.py with Clara as Leader
**Points:** 5 | **Status:** `backlog`

**Description:**
Create the CRM team factory following the validation/branding team pattern.

**Acceptance Criteria:**
- [ ] `agents/crm/team.py` created
- [ ] `create_crm_team(session_id, user_id, business_id, model, debug_mode)` function
- [ ] Team uses `mode="coordinate"` with Clara as leader
- [ ] PostgresStorage with table `bm_crm_sessions`
- [ ] `delegate_task_to_all_members=False`
- [ ] `respond_directly=True`
- [ ] Team instructions include business context

**Technical Reference:**
```python
def create_crm_team(
    session_id: str,
    user_id: str,
    business_id: Optional[str] = None,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
    storage = PostgresStorage(
        table_name="bm_crm_sessions",
        db_url=get_postgres_url(),
    )

    return Team(
        name="CRM Team",
        mode="coordinate",
        leader=create_clara_agent(model, storage),
        members=[
            create_scout_agent(model, storage),
            create_atlas_agent(model, storage),
            create_flow_agent(model, storage),
            create_tracker_agent(model, storage),
        ],
        # ... rest of config
    )
```

---

### CRM-02.2: Implement Clara Orchestrator Agent
**Points:** 5 | **Status:** `backlog`

**Description:**
Create Clara, the CRM team leader who coordinates all operations and generates daily briefings.

**Acceptance Criteria:**
- [ ] `agents/crm/crm_orchestrator_agent.py` created
- [ ] Clara routes requests to appropriate specialists
- [ ] Clara synthesizes multi-agent results
- [ ] Daily briefing generation capability
- [ ] "Who to call" prioritization algorithm
- [ ] Maintains conversation context

**Agent Definition:**
```python
def create_clara_agent(model: str, storage: PostgresStorage) -> Agent:
    return Agent(
        name="Clara",
        role="CRM Team Lead",
        model=Claude(id=model or "claude-sonnet-4-20250514"),
        instructions=[
            "You are Clara, the CRM Team Lead.",
            "Route requests to Scout (scoring), Atlas (enrichment), Flow (pipeline), or Tracker (activities).",
            "Synthesize findings into actionable insights.",
            "Generate morning briefings with prioritized actions.",
        ],
        tools=[...],
        storage=storage,
    )
```

---

### CRM-02.3: Enhance Scout Lead Scorer Agent
**Points:** 3 | **Status:** `backlog`

**Description:**
Enhance the existing Scout agent with full 40/35/25 scoring algorithm and tier classification.

**Acceptance Criteria:**
- [ ] Existing `agents/crm/lead_scorer_agent.py` enhanced
- [ ] `calculate_score` tool with breakdown
- [ ] Firmographic scoring (40%): company size, industry, revenue
- [ ] Behavioral scoring (35%): email engagement, website, content
- [ ] Intent scoring (25%): demo requests, pricing views, trial signup
- [ ] Tier classification: COLD (<50), WARM (50-69), HOT (70-89), SALES_READY (90+)
- [ ] Score explanation capability
- [ ] Tier change alerts

---

### CRM-02.4: Enhance Atlas Data Enricher Agent
**Points:** 3 | **Status:** `backlog`

**Description:**
Enhance the existing Atlas agent with provider waterfall and budget tracking.

**Acceptance Criteria:**
- [ ] Existing `agents/crm/data_enricher_agent.py` enhanced
- [ ] Provider waterfall: Apollo → Clearbit → Hunter
- [ ] Budget tracking per tenant
- [ ] `enrich_contact` tool
- [ ] `enrich_company` tool
- [ ] `verify_email` tool
- [ ] Rate limiting per provider
- [ ] Cache enriched data (30-day TTL)

---

### CRM-02.5: Enhance Flow Pipeline Manager Agent
**Points:** 3 | **Status:** `backlog`

**Description:**
Enhance the existing Flow agent with stage automations and stuck deal detection.

**Acceptance Criteria:**
- [ ] Existing `agents/crm/pipeline_agent.py` enhanced
- [ ] `move_deal` tool with stage validation
- [ ] `suggest_next_action` based on stage
- [ ] `identify_stuck_deals` with SLA thresholds
- [ ] `calculate_pipeline_health` metrics
- [ ] `forecast_revenue` weighted by probability
- [ ] Stage transition automation suggestions

---

### CRM-02.6: Create Tracker Activity Tracker Agent
**Points:** 3 | **Status:** `backlog`

**Description:**
Create Tracker agent for engagement tracking and relationship health scoring.

**Acceptance Criteria:**
- [ ] `agents/crm/activity_tracker_agent.py` created
- [ ] `log_activity` tool for manual logging
- [ ] `get_activity_timeline` tool
- [ ] `calculate_engagement_score` based on recency/frequency/depth
- [ ] `find_cold_contacts` - contacts with declining engagement
- [ ] Activity point system (email: +2, click: +5, reply: +15, call: +10, meeting: +20)

---

### CRM-02.7: Create CRM tools.py with Shared Tools
**Points:** 3 | **Status:** `backlog`

**Description:**
Create shared tool functions that multiple CRM agents use.

**Acceptance Criteria:**
- [ ] `agents/crm/tools.py` created
- [ ] `calculate_lead_score(contact_id, firmographic, behavioral, intent)` → ScoreResult
- [ ] `enrich_contact(contact_id, sources)` → EnrichmentResult
- [ ] `move_deal_stage(deal_id, new_stage, reason)` → DealResult
- [ ] `log_activity(contact_id, type, details)` → ActivityResult
- [ ] `get_engagement_score(contact_id)` → EngagementResult
- [ ] `request_crm_approval(action, entity_id, reason)` → ApprovalRequest
- [ ] All tools use tenant-scoped database queries

---

### CRM-02.8: Register CRM Team in main.py TEAM_CONFIG
**Points:** 2 | **Status:** `backlog`

**Description:**
Register the CRM team in the AgentOS main.py configuration.

**Acceptance Criteria:**
- [ ] Import `create_crm_team` in `agents/main.py`
- [ ] Add CRM to `TEAM_CONFIG` dictionary
- [ ] Team accessible at `/agents/crm/runs`
- [ ] Health check at `/agents/crm/health`
- [ ] Supports streaming responses

**Configuration:**
```python
TEAM_CONFIG["crm"] = {
    "factory": create_crm_team,
    "leader": "Clara",
    "members": ["Scout", "Atlas", "Flow", "Tracker"],
    "storage": "bm_crm_sessions",
    "session_prefix": "crm",
    "description": "AI-powered CRM with lead scoring, enrichment, and pipeline management",
}
```

---

### CRM-02.9: Implement Unified Protocol Endpoints for CRM Team
**Points:** 2 | **Status:** `backlog`

**Description:**
Expose CRM team via the Unified Protocol (AG-UI for frontend, A2A for inter-module).

**Acceptance Criteria:**
- [ ] **A2A Protocol:**
  - [ ] Agent Card at `/a2a/crm/.well-known/agent-card.json`
  - [ ] Card includes: id, name, description, version, skills
  - [ ] JSON-RPC endpoint at `/a2a/crm/rpc`
  - [ ] Capabilities: streaming, events
- [ ] **AG-UI Protocol:**
  - [ ] CopilotKit endpoint at `/agui/crm`
  - [ ] Clara exposed as primary agent for "Ask Clara" chat
  - [ ] Generative UI support for CRM widgets

---

### CRM-02.10: Create CRM Event Bus Publishers
**Points:** 1 | **Status:** `backlog`

**Description:**
Publish CRM events to Redis Streams for platform integration.

**Acceptance Criteria:**
- [ ] Events defined in `apps/api/src/crm/events/`
- [ ] `crm.contact.created` - New contact
- [ ] `crm.contact.scored` - Score calculated
- [ ] `crm.contact.enriched` - Data enriched
- [ ] `crm.deal.stage_changed` - Deal moved
- [ ] `crm.deal.won` / `crm.deal.lost` - Deal closed
- [ ] `crm.activity.logged` - Activity recorded
- [ ] All events include workspaceId, userId, correlationId

---

## Definition of Done

- [ ] All 5 MVP agents created and tested
- [ ] Team factory registered in main.py
- [ ] Unified Protocol endpoints exposed (A2A + AG-UI)
- [ ] All tools functional with database
- [ ] Events publishing correctly
- [ ] Integration test: Create contact → enriched → scored → tier assigned
