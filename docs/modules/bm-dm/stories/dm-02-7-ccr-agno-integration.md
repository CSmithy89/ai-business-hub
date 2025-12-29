# Story DM-02.7: CCR-Agno Integration

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** High (CCR routing foundation)
**Dependencies:** DM-02.6 (Complete - CCR Installation & Configuration)

---

## Overview

Integrate Agno agents with the CCR (Claude Code Router) routing layer, enabling intelligent model selection based on task type, agent preferences, and hybrid BYOAI/CCR mode.

**Key Deliverables:**
- CCR model provider in `agents/models/ccr_provider.py`
- Model selection utility in `agents/models/selector.py`
- CCR validation on agent startup in `agents/main.py`
- Unit tests for CCR provider and model selection

---

## Acceptance Criteria

1. **AC1:** CCRModel class extends OpenAI-compatible model with CCR-specific headers
2. **AC2:** Hybrid mode selects CCR or BYOAI based on configuration and health
3. **AC3:** Agent startup validates CCR connection when enabled
4. **AC4:** Model selector uses agent preferences for task type hints
5. **AC5:** All code uses DMConstants (no magic numbers)
6. **AC6:** Unit tests verify model selection logic and fallback behavior

---

## Technical Notes

### CCR Model Pattern
- CCR exposes OpenAI-compatible API at `/v1/chat/completions`
- Custom headers used for routing hints (X-CCR-Task-Type)
- No real API key needed (uses "ccr-platform" placeholder)

### Hybrid Mode Logic
Selection priority:
1. Explicit model override
2. User's BYOAI configuration (if provided)
3. CCR routing (if enabled and healthy)
4. Default fallback model

### Agent Model Preferences
Different agents have different optimal task types:
- Dashboard/Navi: reasoning
- Sage: code_generation
- Pulse/Chrono: reasoning

---

## Implementation Tasks

### Task 1: Create CCR Model Provider
**File:** `agents/models/ccr_provider.py`
- CCRModel class extending OpenAI-compatible model
- Task type header injection
- get_model_for_agent() hybrid selector
- validate_ccr_connection() startup check

### Task 2: Create Model Selector Utility
**File:** `agents/models/selector.py`
- Agent-specific model preferences
- select_model_for_agent() main function
- Integration with CCR provider

### Task 3: Create Models Module Init
**File:** `agents/models/__init__.py`
- Export CCRModel, get_model_for_agent, select_model_for_agent

### Task 4: Update Main Startup
**File:** `agents/main.py`
- Import and call validate_ccr_connection()
- Log CCR connection status

### Task 5: Create Unit Tests
**File:** `agents/tests/test_dm_02_7_ccr_provider.py`
- Test CCRModel initialization
- Test hybrid mode selection
- Test CCR validation
- Test agent preferences

---

## Definition of Done

- [x] CCRModel class routes requests through CCR
- [x] Hybrid mode selects correct model source
- [x] Agent startup validates CCR connection
- [x] Model preferences applied per agent
- [x] Unit tests pass with good coverage
- [x] All code uses DMConstants (no magic numbers)
- [x] Sprint status updated to "done"
