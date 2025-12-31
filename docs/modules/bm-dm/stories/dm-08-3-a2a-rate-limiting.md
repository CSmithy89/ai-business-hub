# Story DM-08-3: A2A Rate Limiting

**Epic:** DM-08 - Quality & Performance Hardening
**Status:** done
**Points:** 5
**Priority:** High

---

## Problem Statement

A2A endpoints need dedicated rate limiting to prevent abuse while allowing legitimate inter-agent communication.

## Root Cause

From tech debt analysis:
- A2A discovery endpoints are public and could be abused
- Need per-endpoint rate limits based on usage patterns
- Health endpoints need higher limits than query endpoints

## Implementation Plan

### 1. Create A2A Rate Limits Configuration

Create `agents/config/rate_limits.py`:
- Centralized rate limit configuration for A2A endpoints
- Different limits per endpoint type (discovery, query, health)

### 2. Add Rate Limit Decorators to A2A Routes

Modify `agents/a2a/discovery.py`:
- Add rate limit decorators using the limiter from app.state
- Apply appropriate limits per endpoint

### 3. Add Tests

Add tests for rate limiting behavior on A2A endpoints.

## Acceptance Criteria

- [x] AC1: Rate limits config created with A2A-specific limits (DMConstants.RATE_LIMITS)
- [x] AC2: Discovery endpoints rate limited (30/minute)
- [x] AC3: Rate limit headers returned (X-RateLimit-*) via SlowAPIMiddleware
- [x] AC4: get_limiter() allows routes in separate modules to use shared limiter

## Technical Notes

### Rate Limits Configuration
```python
A2A_RATE_LIMITS = {
    "discovery": "30/minute",
    "query": "100/minute",
    "health": "300/minute",
}
```

## Files to Create/Modify

```
agents/
├── config/
│   └── rate_limits.py           # NEW
├── a2a/
│   └── discovery.py             # MODIFY
└── tests/
    └── test_a2a_rate_limit.py   # NEW
```

---

## Implementation Notes

### Files Modified

1. **`agents/constants/dm_constants.py`**:
   - Added `RATE_LIMITS` class with constants for different endpoint types
   - A2A_DISCOVERY: "30/minute", A2A_QUERY: "100/minute", HEALTH: "300/minute"

2. **`agents/middleware/rate_limit.py`**:
   - Added module-level `_limiter` reference
   - Added `get_limiter()` function for routes in separate modules
   - Updated `init_rate_limiting()` to set module-level limiter

3. **`agents/a2a/discovery.py`**:
   - Added rate limit decorators to all 3 discovery endpoints
   - Added `request: Request` parameter required for rate limiting
   - Updated docstrings to document rate limiting

### Design Decisions

- Used module-level limiter for decoration, enforcement via SlowAPIMiddleware
- Rate limit of 30/minute for discovery prevents abuse while allowing reasonable usage
- Rate limit headers (X-RateLimit-*) automatically included via slowapi

---

## Review Notes

(To be filled during code review)
