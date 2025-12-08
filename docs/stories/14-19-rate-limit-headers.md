# Story 14-19: Rate Limit Header Implementation

**Epic:** EPIC-14 - Testing & Observability  
**Status:** drafted  
**Points:** 2  
**Priority:** P2 Medium

## User Story
As an API consumer, I want every rate-limited endpoint to emit standard `X-RateLimit-*` headers so that I can adjust request volume before hitting hard limits.

## Acceptance Criteria
- [ ] AC1: Export the shared `generateRateLimitHeaders()` helper from `lib/utils/rate-limit.ts`
- [ ] AC2: Attach headers for auth endpoints that invoke `checkRateLimit`
- [ ] AC3: Attach headers for workspace/API endpoints that use rate limiting
- [ ] AC4: Add automated tests verifying header emission for representative routes
- [ ] AC5: Document the header behavior in the relevant story/docs

## Technical Notes
- Reuse the helper introduced in Story 14-1 to ensure formatting consistency.
- Prefer middleware/utility wrappers when possible so routes stay lean.
- Tests can leverage existing mocks in `apps/web/src/__tests__/rate-limit.test.ts` and any route-specific suites.

## Definition of Done
- [ ] Headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are returned by all rate-limited endpoints.
- [ ] Automated tests cover header presence for representative routes.
- [ ] Story file captures implementation details and testing evidence.
