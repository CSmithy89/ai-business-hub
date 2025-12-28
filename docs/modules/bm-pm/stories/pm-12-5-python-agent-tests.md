# Story PM-12.5: Python Agent Tests

## Overview

Add comprehensive Python test coverage for PM agents including unit tests for tools, mock API responses, input validation, and error handling.

## Story Points: 8

## Dependencies

- PM-12.2 (Agent Response Parsing) - For structured output models

## Acceptance Criteria

### 1. Common Utilities Tests
- [ ] Test `api_request` function with mock HTTP responses
- [ ] Test `api_request_strict` function with Pydantic validation
- [ ] Test `AgentToolError` exception handling
- [ ] Test `get_auth_headers` with and without token

### 2. Health Tools Tests
- [ ] Test `detect_risks` with mock API responses
- [ ] Test `calculate_health_score` with various health levels
- [ ] Test `check_team_capacity` with overload scenarios
- [ ] Test `analyze_velocity` with trend detection
- [ ] Test `detect_blocker_chains` with chain scenarios
- [ ] Test `get_overdue_tasks` with date filtering

### 3. Agent Tests
- [ ] Test Navi agent initialization and tools
- [ ] Test Oracle agent initialization and tools
- [ ] Test Chrono agent initialization and tools
- [ ] Test Scope agent initialization and tools
- [ ] Test Vitals agent initialization and tools
- [ ] Test Herald agent initialization and tools

### 4. Error Handling Tests
- [ ] Test HTTP error responses (4xx, 5xx)
- [ ] Test network timeout handling
- [ ] Test validation error handling
- [ ] Test graceful fallback behavior

### 5. Input Validation Tests
- [ ] Test required parameter validation
- [ ] Test workspace_id format validation
- [ ] Test project_id format validation
- [ ] Test output model validation

## Technical Notes

- Use pytest fixtures for common setup
- Use `unittest.mock` for mocking HTTP calls
- Use `respx` or `httpx_mock` for HTTP mocking
- Tests should run without network access
- All tests should be deterministic

## Test Coverage Target

Achieve 80%+ test coverage for:
- `agents/pm/tools/*.py`
- `agents/pm/*.py` (agent modules)

## Files to Create/Modify

### New Files
- `agents/pm/tests/test_common.py`
- `agents/pm/tests/test_health_tools.py`
- `agents/pm/tests/test_agents.py`
- `agents/pm/tests/conftest.py`

### Modified Files
- `agents/pm/tests/__init__.py` (if needed)
