# Story DM-09-7: CCR Operational Verification Tests

**Epic:** DM-09 - Observability & Testing Infrastructure
**Status:** drafted
**Points:** 5
**Priority:** High

---

## Problem Statement

CCR (Claude Code Router) integration lacks operational verification. Without integration tests for CCR behavior, we cannot:
- Verify model routing decisions work correctly
- Confirm fallback behavior when primary models fail
- Ensure quota enforcement protects workspaces
- Validate connection error handling and recovery
- Trust health check accuracy

This gap was identified as **Testing Gap #4** in the tech debt consolidation document.

## Gap Addressed

- **Testing Gap #4:** CCR operational verification

## Test Scenarios

### Scenario 1: CCR Routing Tests (Primary Model Selection)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Route to primary model | Standard task routes to configured primary | Primary model returned |
| Route by task type | Complex tasks route to capable models | Higher-tier model for complex tasks |
| Respect workspace preferences | Honor provider preferences | Selected model matches preference |
| Return routing metadata | Include latency, reason, alternatives | Metadata fields present |

### Scenario 2: Fallback Behavior Tests (When Primary Fails)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Fallback on primary failure | Primary model unavailable | Fallback model used, flag set |
| Fallback chain exhaustion | All models fail | Error with fallback_attempts count |
| Preserve context through fallback | Custom data in request | Context maintained after fallback |
| Timeout handling | Slow model response | TimeoutError raised appropriately |

### Scenario 3: Quota Enforcement Tests (Workspace Limits)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Enforce daily quota | Exhausted workspace requests | quota_exceeded error |
| Return quota status | Query quota information | Limit, used, remaining, reset_at |
| Warning threshold | 80% quota used | quota_warning flag set |
| Workspace isolation | Exhaust one workspace | Other workspaces unaffected |

### Scenario 4: Connection Error Handling

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Retry transient failures | Connection errors on first attempts | Retry succeeds |
| Max retry limit | Persistent failures | Fail after max retries |
| Graceful degradation | CCR unavailable | Clear error, no crash |

### Scenario 5: Health Check Verification

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Validate connection | Basic connectivity | is_healthy = True |
| Health check status | Query health endpoint | Status, latency, models |
| Detect degraded state | Some models unavailable | degraded status |
| Model status detail | Include per-model status | available/degraded/unavailable |

## Implementation Plan

### 1. Integration Test Fixtures (conftest.py)

Create fixtures for CCR testing:
- `ccr_enabled` - Skip test if CCR not enabled
- `ccr_test_config` - Test configuration (workspace, models, limits)
- `ccr_client` - CCR client instance
- `exhausted_quota_workspace` - Workspace with zero remaining quota

### 2. CCR Routing Tests

Test primary model selection and routing logic:
- Standard task routing
- Task-type-based routing
- Workspace preference handling
- Routing metadata validation

### 3. CCR Fallback Tests

Test model failure recovery:
- Primary failure triggers fallback
- Fallback chain exhaustion handling
- Context preservation through fallbacks
- Timeout behavior

### 4. CCR Quota Tests

Test quota enforcement:
- Daily limit enforcement
- Quota status retrieval
- Warning threshold detection
- Multi-workspace isolation

### 5. CCR Health Tests

Test health and connectivity:
- Connection validation
- Health check endpoint
- Degraded state detection
- Retry logic for transient failures

## Files to Create

| File | Description |
|------|-------------|
| `agents/tests/integration/__init__.py` | Integration test package marker |
| `agents/tests/integration/conftest.py` | Integration test fixtures |
| `agents/tests/integration/test_ccr_routing.py` | CCR routing tests |
| `agents/tests/integration/test_ccr_fallback.py` | CCR fallback behavior tests |
| `agents/tests/integration/test_ccr_quota.py` | CCR quota enforcement tests |
| `agents/tests/integration/test_ccr_health.py` | CCR health check tests |

## Acceptance Criteria

- [ ] AC1: CCR routing tests pass
- [ ] AC2: Fallback behavior verified
- [ ] AC3: Quota enforcement verified
- [ ] AC4: Connection error handling verified
- [ ] AC5: Health check endpoint verified

## Dependencies

- **DM-07 (Complete):** Infrastructure stabilization required
- **DM-08 (Complete):** Rate limiting and caching affect CCR behavior
- **DM-08.4 (Complete):** Async mock fixtures for Redis and A2A mocking
- **DM-09.1 (Complete):** OpenTelemetry for tracing during tests
- **DM-02.6 (Complete):** CCR installation and configuration
- **DM-02.7 (Complete):** CCR Agno integration

## Technical Notes

### CCR Test Environment

Tests require:
- `CCR_ENABLED=true` environment variable (or skip)
- Valid CCR test credentials
- Test workspace with configurable quota limits
- Mock Redis for quota simulation (from DM-08.4 fixtures)

### Using DM-08.4 Fixtures

Integration tests should leverage existing fixtures:
```python
from agents.tests.fixtures import mock_redis, async_mock_factory
```

### Test Markers

All tests use `@pytest.mark.integration` marker:
```python
@pytest.mark.integration
async def test_ccr_routing_primary():
    ...
```

Run integration tests with:
```bash
pytest agents/tests/integration/ -m integration
```

### CCR Graceful Handling

Tests should work regardless of CCR availability:
- Skip tests when `CCR_ENABLED` is not set
- Use mocks for quota exhaustion scenarios
- Provide clear skip reasons in CI

### Test Isolation

Each test should:
- Use unique workspace IDs to avoid cross-test interference
- Clean up any created state
- Not depend on external CCR state

## Risks

1. **CCR Test Failures in CI** - CCR may not be available in all environments
   - Mitigation: Use `ccr_enabled` fixture to skip tests, mock fallbacks

2. **Rate Limiting** - DM-08.3 rate limiting may affect test speed
   - Mitigation: Use test workspace with higher limits

3. **State Pollution** - Tests may affect shared CCR state
   - Mitigation: Use unique workspace IDs, mock Redis for quota

4. **Flaky Network Tests** - Network issues cause intermittent failures
   - Mitigation: Retry logic, proper timeout handling

---

## Definition of Done

- [ ] Integration test package created (`agents/tests/integration/`)
- [ ] CCR routing tests implemented and passing
- [ ] CCR fallback tests implemented and passing
- [ ] CCR quota tests implemented and passing
- [ ] CCR health tests implemented and passing
- [ ] Tests skip gracefully when CCR not enabled
- [ ] Integration with DM-08.4 fixtures verified
- [ ] CI can run tests with appropriate markers

---

## References

- [Epic DM-09: Observability & Testing](../epics/epic-dm-09-observability-testing.md)
- [Tech Spec DM-09.7](../epics/epic-dm-09-tech-spec.md)
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Testing Gap #4
- [DM-08.4 Async Mock Fixtures](dm-09-6-load-testing-infrastructure.md)
- [CCR Architecture](../../architecture/remote-coding-agent-patterns.md)

---

## Code Review Notes

**Reviewer:** Senior Developer (AI-Assisted)
**Date:** 2025-12-31
**Review Type:** Story Completion Review

### Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `agents/tests/integration/__init__.py` | 11 | Package marker with docstring |
| `agents/tests/integration/conftest.py` | 523 | Integration test fixtures |
| `agents/tests/integration/test_ccr_routing.py` | 410 | CCR routing tests |
| `agents/tests/integration/test_ccr_fallback.py` | 481 | CCR fallback behavior tests |
| `agents/tests/integration/test_ccr_quota.py` | 431 | CCR quota enforcement tests |
| `agents/tests/integration/test_ccr_health.py` | 568 | CCR health check tests |

**Total Lines:** ~2,424

### Strengths

1. **Comprehensive Fixture Design (conftest.py)**
   - Well-designed `ccr_enabled` fixture with proper skip logic (defaults to `true` for mocked tests)
   - Excellent `StateController` pattern for `mock_ccr_health_checker` enabling test manipulation
   - `UsageController` pattern for quota testing provides clean test control
   - Proper mocking of external dependencies (httpx, prometheus_client, agno, opentelemetry)
   - Re-exports DM-08.4 fixtures for integration (line 517-522)

2. **Test Organization**
   - Clear class-based grouping by test scenario
   - Consistent use of `@pytest.mark.integration` and `@pytest.mark.ccr` markers
   - Proper `@pytest.mark.anyio` for async tests
   - Descriptive test names following pattern `test_{what}_{condition}`

3. **Test Coverage Quality**
   - Routing tests cover all specified scenarios (primary, task type, preferences, metadata)
   - Fallback tests include circuit breaker behavior, timeout handling, and recovery
   - Quota tests verify thresholds (80% warning, 95% critical) and workspace isolation
   - Health tests cover degraded detection, per-provider status, and singleton pattern

4. **Mock Pattern Consistency**
   - Uses `unittest.mock.patch` with context managers throughout
   - Mock exception classes (`MockConnectError`, `MockTimeoutException`, `MockHTTPStatusError`) properly defined
   - `AsyncMock` used correctly for async methods
   - No real network calls - all HTTP interactions mocked

5. **Graceful CCR Skip Handling**
   - `ccr_enabled` fixture checks `CCR_ENABLED` env var (defaults to "true")
   - Tests can run in CI without actual CCR service
   - Clear skip messages via `pytest.skip()`

### Concerns

1. **Minor: Duplicate pytest_plugins Declaration**
   - `pytest_plugins = ["anyio"]` appears in both `conftest.py` and individual test files
   - Recommendation: Remove from individual test files since conftest.py is loaded first
   - Severity: Low (not breaking, just redundant)

2. **Minor: sys.modules Mock Setup Duplication**
   - Mock setup for httpx, agno, prometheus_client repeated from existing tests
   - Could potentially centralize in a shared test helper
   - Severity: Low (functional, but increases maintenance)

3. **Minor: Import Inconsistency**
   - Some imports use `from tests.integration.conftest import MockConnectError`
   - Others use `from agents.tests.fixtures import ...`
   - Mixed import paths work but could be more consistent
   - Severity: Low (functional)

4. **Observation: CCRHealthChecker Singleton Reset**
   - Tests properly call `await CCRHealthChecker.reset_instance()` before each test
   - This is good practice but worth noting for future test additions

5. **Observation: Test Data Coupling**
   - `ccr_test_config` fixture uses hardcoded model names (e.g., "claude-opus-4-20250514")
   - These should match `DMConstants.CCR` values - currently they do
   - Future changes to constants could require fixture updates

### Acceptance Criteria Verification

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | CCR routing tests pass | PASS | `test_ccr_routing.py`: 4 test classes, 12 tests covering primary routing, task type routing, preferences, and metadata |
| AC2 | Fallback behavior verified | PASS | `test_ccr_fallback.py`: 4 test classes, 12 tests covering CCR unhealthy, circuit breaker, context preservation, timeout handling |
| AC3 | Quota enforcement verified | PASS | `test_ccr_quota.py`: 6 test classes, 16 tests covering daily quota, status reporting, warning thresholds, workspace isolation, fallback tracking |
| AC4 | Connection error handling verified | PASS | `test_ccr_fallback.py`: `TestCCRTimeoutHandling` class with 5 tests covering timeout, connection error, HTTP error, and recovery |
| AC5 | Health check endpoint verified | PASS | `test_ccr_health.py`: 6 test classes, 17 tests covering connection validation, status, degraded detection, per-model status, singleton pattern |

### Definition of Done Verification

| Item | Status | Notes |
|------|--------|-------|
| Integration test package created | PASS | `agents/tests/integration/` with proper `__init__.py` |
| CCR routing tests implemented and passing | PASS | 12 tests in `test_ccr_routing.py` |
| CCR fallback tests implemented and passing | PASS | 12 tests in `test_ccr_fallback.py` |
| CCR quota tests implemented and passing | PASS | 16 tests in `test_ccr_quota.py` |
| CCR health tests implemented and passing | PASS | 17 tests in `test_ccr_health.py` |
| Tests skip gracefully when CCR not enabled | PASS | `ccr_enabled` fixture with `pytest.skip()` |
| Integration with DM-08.4 fixtures verified | PASS | Re-exports in conftest.py line 517-522 |
| CI can run tests with appropriate markers | PASS | `@pytest.mark.integration` and `@pytest.mark.ccr` markers applied |

### Test Count Summary

| Test File | Test Classes | Test Methods |
|-----------|--------------|--------------|
| test_ccr_routing.py | 4 | 12 |
| test_ccr_fallback.py | 4 | 12 |
| test_ccr_quota.py | 6 | 16 |
| test_ccr_health.py | 6 | 17 |
| **Total** | **20** | **57** |

### Security Review

- No hardcoded secrets or API keys
- Mock credentials used appropriately (`test-key`, `test-workspace-001`)
- No external network calls in test execution
- Environment variable checks for CCR_ENABLED

### Alignment with Tech Spec

The implementation aligns well with the DM-09.7 tech spec requirements:

1. **Integration Tests**: All four test files created per spec
2. **Routing Tests**: Coverage matches spec scenarios
3. **Fallback Tests**: Includes primary failure, chain exhaustion, context preservation
4. **Quota Tests**: Includes daily limits, thresholds, workspace isolation
5. **Health Tests**: Includes connection validation, degraded detection, per-model status

### Recommendations (Optional for Future)

1. Consider adding a shared mock setup module to reduce duplication across test files
2. Add test for quota reset timing behavior
3. Consider property-based testing for routing edge cases

### Decision

**APPROVE**

All acceptance criteria are met. The implementation is comprehensive, well-organized, and follows project patterns. Minor concerns are stylistic and do not impact functionality or security. The test suite provides thorough coverage of CCR operational behavior with proper mocking to ensure no real network calls.

---

**Review Completed:** 2025-12-31T00:00:00Z
