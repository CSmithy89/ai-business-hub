# Story DM-02.8: CCR Task-Based Routing

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** High (Intelligent routing)
**Dependencies:** DM-02.7 (Complete - CCR-Agno Integration)

---

## Overview

Implement task-based routing middleware that classifies requests and routes them to the optimal provider through CCR. This extends the CCR integration with intelligent task classification and dynamic routing.

**Key Deliverables:**
- Task classifier utility in `agents/models/task_classifier.py`
- Integration with CCRModel to auto-set task type
- Agent task type inference from message content
- Unit tests for task classification

---

## Acceptance Criteria

1. **AC1:** Task classifier identifies task types from message content
2. **AC2:** CCRModel auto-classifies tasks when task_type not specified
3. **AC3:** Classification rules configurable via DMConstants
4. **AC4:** Agent type contributes to task classification (context-aware)
5. **AC5:** Unit tests cover classification edge cases
6. **AC6:** All code uses DMConstants (no magic numbers)

---

## Technical Notes

### Task Types (CCR Routing)
- `reasoning`: Complex analysis, planning, strategy
- `code_generation`: Code writing, debugging, review
- `long_context`: Document processing, summarization
- `general`: Default for unclassified tasks

### Classification Signals
- Keywords in message (e.g., "analyze", "write code", "summarize")
- Agent type context (e.g., sage -> code_generation)
- Explicit hints in message (e.g., "[code]", "[analysis]")

### Classification Priority
1. Explicit hints in message
2. Agent type default
3. Keyword-based classification
4. Fall back to "general"

---

## Implementation Tasks

### Task 1: Create Task Classifier
**File:** `agents/models/task_classifier.py`
- TaskType enum matching CCR routing types
- classify_task() function with keyword matching
- extract_explicit_hints() for bracket hints
- get_task_type_for_agent() with agent context

### Task 2: Update CCRModel
**File:** `agents/models/ccr_provider.py`
- Auto-classify when task_type not provided
- Integration with task_classifier

### Task 3: Add Classification Constants
**File:** `agents/constants/dm_constants.py`
- TASK_KEYWORDS dict mapping keywords to task types
- EXPLICIT_HINT_PATTERN regex

### Task 4: Create Unit Tests
**File:** `agents/tests/test_dm_02_8_task_classifier.py`
- Test keyword classification
- Test explicit hints
- Test agent context
- Test edge cases (empty, unknown)

---

## Definition of Done

- [x] Task classifier identifies major task types
- [x] Auto-classification works in CCRModel
- [x] Classification rules in DMConstants
- [x] Agent context influences classification
- [x] Unit tests pass
- [x] All code uses DMConstants
- [x] Sprint status updated to "done"

## Implementation Notes

### Files Created
- `agents/services/task_classifier.py` - TaskClassifier for routing decisions
- `agents/tests/test_dm_02_8_task_classifier.py` - Unit tests for classification

### Key Implementation Details
- **Task Types**: `code`, `content`, `strategy`, `analysis`, `general`
- **Classification Sources**: Keyword matching, explicit hints (e.g., "use deepseek"), agent context
- **Routing Rules**: Defined in `DMConstants.CCR.TASK_ROUTING_RULES`
- **Integration**: `CCRModel.classify_task()` called before routing

### Task Type → Provider Mapping (Default)
| Task Type | Primary Provider | Fallback |
|-----------|-----------------|----------|
| code | claude-cli | deepseek |
| content | claude-cli | gemini |
| strategy | claude-cli | openrouter |
| analysis | gemini | deepseek |
| general | auto (CCR decides) | - |
