# Story DM-08-7: Response Parser Validation

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

Agent responses need validation before updating UI state. Raw responses may have missing fields, wrong types, or unexpected structures.

## Root Cause

From tech debt analysis:
- No Pydantic schemas for agent responses on Python side
- Frontend trusts agent data without validation
- Type mismatches can cause runtime errors

## Implementation Plan

### 1. Create Pydantic Schemas

Create agents/pm/schemas/ with validation for each agent response type.

### 2. Schema Structure

- base.py: Common AgentError, AgentResponse, parse_agent_response
- navi_response.py: NaviProjectResponse, ProjectStatusData
- pulse_response.py: PulseHealthResponse, HealthMetric
- herald_response.py: HeraldActivityResponse, ActivityEntry

### 3. Widget Data Conversion

Each response type includes to_widget_data() for frontend compatibility.

## Acceptance Criteria

- [x] AC1: Pydantic schemas for Navi responses
- [x] AC2: Pydantic schemas for Pulse responses
- [x] AC3: Pydantic schemas for Herald responses
- [x] AC4: parse_agent_response utility with fallback
- [x] AC5: to_widget_data() methods for frontend

---

## Implementation Notes

### Files Created (DM-08.7)

```text
agents/pm/schemas/
├── __init__.py          # Package exports
├── base.py              # AgentError, AgentResponse, parse_agent_response
├── navi_response.py     # NaviProjectResponse, ProjectStatusData
├── pulse_response.py    # PulseHealthResponse, HealthMetric
└── herald_response.py   # HeraldActivityResponse, ActivityEntry
```

### Navi Response Schema

```python
class NaviProjectResponse(BaseModel):
    project_id: str
    content: Optional[str]
    raw_data: Optional[Dict[str, Any]]
    tool_calls: Optional[List[Dict[str, Any]]]
    duration_ms: Optional[int]
    error: Optional[str]
    agent: str = "navi"
    project_status: Optional[ProjectStatusData]
    tasks: Optional[List[TaskBreakdown]]
    timeline: Optional[List[TimelineMilestone]]
```

### Graceful Degradation

```python
def parse_agent_response(
    raw_data: Dict[str, Any],
    schema_class: type[T],
    agent_id: str,
    default_factory: Optional[callable] = None,
) -> T | Dict[str, Any]:
    try:
        return schema_class(**raw_data)
    except ValidationError as e:
        logger.warning(f"[{agent_id}] Validation failed")
        if default_factory:
            return default_factory()
        return {**raw_data, "_validation_error": True}
```

---

## Review Notes

(To be filled during code review)
