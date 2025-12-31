# Story DM-02.9: CCR Usage Monitoring & Alerts

**Epic:** DM-02 - Agno Multi-Interface Backend
**Points:** 5
**Status:** done
**Priority:** Medium (Operational visibility)
**Dependencies:** DM-02.8 (Complete - CCR Task-Based Routing)

---

## Overview

Implement usage tracking and alerting for CCR to enable operational visibility and quota management. This enables monitoring of token usage, provider distribution, and quota warnings.

**Key Deliverables:**
- CCR usage tracker service in `agents/services/ccr_usage.py`
- Quota warning/critical thresholds from DMConstants
- Usage metrics endpoint
- Unit tests for usage tracking

---

## Acceptance Criteria

1. **AC1:** Usage tracker records requests by provider and task type
2. **AC2:** Quota thresholds trigger warnings (80%) and critical (95%) alerts
3. **AC3:** Usage metrics endpoint returns aggregated data
4. **AC4:** All thresholds defined in DMConstants
5. **AC5:** Unit tests verify quota alert logic
6. **AC6:** Graceful handling when CCR unavailable

---

## Technical Notes

### Quota Thresholds (DMConstants)
- Warning: 80% of daily limit
- Critical: 95% of daily limit
- Alerts logged with severity levels

### Metrics Tracked
- Requests per provider (claude, deepseek, gemini, openrouter)
- Requests per task type
- Token usage estimates
- Fallback trigger count

### Alert Levels
- INFO: Normal operation
- WARNING: Approaching quota limit
- CRITICAL: Near quota exhaustion

---

## Implementation Tasks

### Task 1: Create CCR Usage Tracker
**File:** `agents/services/ccr_usage.py`
- CCRUsageTracker class with request counting
- Quota status calculation with thresholds
- Alert level determination
- Daily reset functionality

### Task 2: Add Usage Metrics Endpoint
**File:** `agents/main.py`
- `/ccr/metrics` endpoint returning usage data
- Integration with CCR health checker

### Task 3: Verify DMConstants
**File:** `agents/constants/dm_constants.py`
- QUOTA_WARNING_THRESHOLD (0.8)
- QUOTA_CRITICAL_THRESHOLD (0.95)

### Task 4: Create Unit Tests
**File:** `agents/tests/test_dm_02_9_ccr_usage.py`
- Test quota calculation
- Test alert thresholds
- Test daily reset

---

## Definition of Done

- [x] Usage tracker records provider/task metrics
- [x] Quota alerts triggered at thresholds
- [x] Metrics endpoint returns data
- [x] All thresholds use DMConstants
- [x] Unit tests pass
- [x] Sprint status updated to "done"

---

## Implementation Notes

**Completed:** 2025-12-30

### Files Created

| File | Purpose |
|------|---------|
| `agents/services/ccr_usage.py` | CCRUsageTracker class with request counting, quota calculation, and alert levels |
| `agents/tests/test_dm_02_9_ccr_usage.py` | Comprehensive unit tests for usage tracking and quota alerts |

### Key Implementation Details

1. **CCRUsageTracker Service**: Implements request counting by provider and task type, with daily reset functionality

2. **Quota Thresholds**: Uses DMConstants for warning (80%) and critical (95%) thresholds

3. **Metrics Endpoint**: Added `/ccr/metrics` endpoint in `agents/main.py` returning aggregated usage data

4. **Alert Levels**: INFO (normal), WARNING (approaching quota), CRITICAL (near exhaustion)

### Verification

- All unit tests pass: `pytest agents/tests/test_dm_02_9_ccr_usage.py`
- Endpoint accessible at `/ccr/metrics`
- Thresholds configured via `DMConstants.CCR.QUOTA_WARNING_THRESHOLD` and `DMConstants.CCR.QUOTA_CRITICAL_THRESHOLD`
