# BM-CRM Implementation Patterns

## Agent Team Pattern

Based on analysis of validation/branding/planning teams:

### Team.py Structure
```python
def create_*_team(
    session_id: str,
    user_id: str,
    business_id: Optional[str] = None,
    model: Optional[str] = None,
    debug_mode: bool = False,
) -> Team:
```

### Agno Team Configuration
- `mode="coordinate"` - Leader delegates to specific members
- `delegate_task_to_all_members=False`
- `respond_directly=True`
- `share_member_interactions=True`
- `enable_agentic_context=True`
- PostgresStorage with unique table per team

### Main.py TEAM_CONFIG
```python
TEAM_CONFIG["team_name"] = {
    "factory": create_team_function,
    "leader": "LeaderName",
    "members": ["Member1", "Member2"],
    "storage": "table_name",
    "session_prefix": "prefix",
    "description": "Team description",
}
```

## Existing CRM Agents

| File | Agent | Status |
|------|-------|--------|
| `lead_scorer_agent.py` | Scout | ✅ Has 40/35/25 scoring |
| `data_enricher_agent.py` | Atlas | ⚠️ Minimal |
| `pipeline_agent.py` | Flow | ⚠️ Minimal |
| `team.py` | Clara | ❌ MISSING |

## CRM Team Spec (from PRD v1.3)

**MVP Agents:** Clara, Scout, Atlas, Flow, Echo
**Growth Agents:** Sync, Guardian, Cadence

**Storage:** `bm_crm_sessions`
**Session Prefix:** `crm`
**Endpoint:** `/agents/crm/runs`

## Event Bus Events

Namespace: `crm.*`
- `crm.contact.created`
- `crm.contact.scored`
- `crm.contact.enriched`
- `crm.deal.stage_changed`
- `crm.deal.won`
- `crm.deal.lost`
- `crm.activity.logged`
- `crm.sequence.enrolled`
