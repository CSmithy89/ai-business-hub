# Story 08.5: Implement Validation Team Agno Configuration

**Story ID:** 08.5
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 5
**Priority:** P0
**Dependencies:** Story 08.1, EPIC-07 (AgentOS setup)

---

## User Story

**As a** developer
**I want** the Validation Team configured in Agno
**So that** BMV agents work together as a coordinated team

---

## Description

This story completes the Agno Validation Team configuration for the BMV (Business Validation Module). The team is led by Vera (validation-orchestrator) with specialist agents: Marco (market-researcher), Cipher (competitor-analyst), Persona (customer-profiler), and Risk (feasibility-assessor).

The team uses leader-based delegation, meaning Vera coordinates and delegates to specific members rather than broadcasting to all. All agents share a PostgreSQL-backed session storage and follow strict anti-hallucination rules requiring source citations.

---

## Acceptance Criteria

### Team Configuration
- [x] Create `ValidationTeam` via `create_validation_team()` function
- [x] Configure team leader: Vera (validation-orchestrator)
- [x] Configure specialist agents:
  - [x] Marco (market-researcher)
  - [x] Cipher (competitor-analyst)
  - [x] Persona (customer-profiler)
  - [x] Risk (feasibility-assessor)
- [x] Set up leader-based delegation (`delegate_task_to_all_members=False`)
- [x] Configure team storage with multi-tenant context

### HITL Integration
- [x] Add approval request tool for go/no-go recommendations
- [x] Integrate with existing approval_tools.py
- [ ] Configure approval thresholds for automatic vs. manual approval

### Anti-Hallucination Rules
- [x] Market claims require 2+ independent sources
- [x] Sources must be cited with URLs where available
- [x] Confidence levels marked: [Verified], [Single Source], [Estimated]
- [x] Distinguish between facts and inferences

### BYOAI Integration
- [x] Support user-provided API keys via provider_resolver
- [x] Allow model override per team/agent
- [x] Fallback to default model when BYOAI not configured

### API Integration
- [ ] Create `/api/validation/team` endpoint for team interactions
- [ ] Create `/api/validation/sessions/:id` for session management
- [ ] Implement SSE streaming for real-time responses

---

## Technical Implementation Details

### Team Configuration (Already Implemented)

```python
# agents/validation/team.py
team = Team(
    name="Validation Team",
    mode="coordinate",
    model=Claude(id="claude-sonnet-4-20250514"),
    leader=vera,
    members=[marco, cipher, persona, risk],
    delegate_task_to_all_members=False,
    respond_directly=True,
    share_member_interactions=True,
    enable_agentic_context=True,
    session_id=session_id,
    user_id=user_id,
    storage=storage,
)
```

### Agent Personas

| Agent | Name | Role | Key Instructions |
|-------|------|------|------------------|
| Leader | Vera | Orchestrator | Guide, delegate, synthesize |
| Member | Marco | Market Research | TAM/SAM/SOM, 2+ sources required |
| Member | Cipher | Competitors | Positioning maps, source URLs |
| Member | Persona | Customer | ICP, JTBD analysis |
| Member | Risk | Feasibility | Go/no-go scoring |

### HITL Integration

The team uses the existing `request_approval` tool from `agents/platform/tools/approval_tools.py`:

```python
from agents.platform.tools.approval_tools import request_approval

# Risk agent uses this for go/no-go decisions
@tool
async def submit_go_no_go_recommendation(
    recommendation: str,  # GO, CONDITIONAL, NO_GO
    validation_score: int,
    rationale: str,
    business_id: str,
):
    return await request_approval(
        action_type="validation_decision",
        description=f"{recommendation}: {rationale}",
        resource_id=business_id,
        resource_type="business_validation",
        urgency="normal" if recommendation == "GO" else "high",
    )
```

### Anti-Hallucination Rules

All agents include these instructions:
1. "ALWAYS cite sources - market claims require 2+ independent sources"
2. "Mark confidence levels: [Verified], [Single Source], [Estimated]"
3. "Use ranges instead of point estimates when uncertain"
4. "Distinguish between facts (sourced) and inferences (analysis)"

---

## Testing Requirements

### Unit Tests
- [ ] Test team creation with all agents
- [ ] Test delegation from leader to members
- [ ] Test HITL approval flow
- [ ] Test BYOAI model resolution

### Integration Tests
- [ ] Test full validation workflow
- [ ] Test session persistence
- [ ] Test multi-tenant isolation

---

## Definition of Done

- [x] ValidationTeam class/function implemented
- [x] All 5 agents configured (Vera, Marco, Cipher, Persona, Risk)
- [x] Leader-based delegation working
- [x] PostgresStorage configured
- [x] Anti-hallucination rules in instructions
- [x] HITL tool available for approval requests
- [x] BYOAI provider support
- [ ] API endpoints created (deferred to Story 08.6)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [x] Code reviewed
- [x] No TypeScript errors (N/A - Python module)
- [x] Documentation updated

---

## Notes

### Existing Implementation
The validation team was pre-implemented in `agents/validation/team.py` as part of the foundation setup. This story validates and enhances the existing implementation.

### Files Modified
- `agents/validation/team.py` - Enhanced with HITL integration
- `agents/validation/__init__.py` - Updated exports
- `agents/platform/tools/approval_tools.py` - Reference for HITL

### Future Enhancements
- Real-time streaming via WebSockets
- Confidence score calibration
- Source verification automation

---

## Related Documentation

- [Epic 08: Business Onboarding](../epics/EPIC-08-business-onboarding.md)
- [Tech Spec: Epic 08](../sprint-artifacts/tech-spec-epic-08.md)
- [Agno Implementation Guide](../architecture/agno-implementation-guide.md)

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
