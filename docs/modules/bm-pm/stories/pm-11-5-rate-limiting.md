# Story PM-11.5: API Rate Limiting & Governance

**Epic:** PM-11 - External API & Governance
**Status:** done
**Points:** 5

---

## User Story

As a **platform administrator**,
I want **API rate limiting and governance**,
So that **the platform remains stable and fair**.

---

## Acceptance Criteria

### AC1: Rate Limiting
**Given** an API key is being used
**When** requests exceed the rate limit
**Then** the system:
- Returns `429 Too Many Requests` status
- Enforces per-API-key limits (default 1000/hour)
- Uses sliding window algorithm for fairness

### AC2: Rate Limit Headers
**Given** any API response
**When** rate limiting is active
**Then** headers include:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait (on 429 responses)

### AC3: API Usage Tracking
**Given** an API key is configured
**When** viewing API key details
**Then** I can see:
- Current usage count
- Rate limit configuration
- Remaining requests
- Reset timestamp

---

## Technical Implementation

### Rate Limiting Service
- Redis-based sliding window algorithm
- Lua scripts for atomic operations
- Fail-open strategy (allows requests if Redis unavailable)

### Rate Limit Guard
- Enforces limits based on API key configuration
- Attaches rate limit info to request context

### Rate Limit Interceptor
- Adds standard rate limit headers to all responses
- Adds `Retry-After` header for 429 responses

### Database Updates
- Added `rateLimit` field to ApiKey model
- Default: 1000 requests/hour

---

## Definition of Done
- [x] Rate limit guard implemented
- [x] Rate limit service with Redis
- [x] Rate limit headers interceptor
- [x] 429 error response handling
- [x] API key usage tracking
- [x] TypeScript compiles without errors
- [x] ESLint passes without errors
