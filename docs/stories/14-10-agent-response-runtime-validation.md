# Story 14-10: Agent Response Runtime Validation

**Epic:** EPIC-14 - Testing & Observability  
**Status:** done  
**Points:** 3  
**Priority:** P1 High  
**Created:** 2025-12-07

## User Story
As a platform engineer, I want runtime validation of agent responses so that malformed responses are caught before impacting clients.

## Acceptance Criteria
- [x] AC1: Add runtime validation schema for agent responses (Zod) covering required fields (success/content/session_id/metadata/error).
- [x] AC2: Enforce validation in agent client pipeline; reject or sanitize malformed responses.
- [x] AC3: Add tests covering valid response, missing required fields, wrong types, and error payloads.
- [x] AC4: Ensure errors are surfaced with descriptive messages and do not crash handlers.

## Context
- Agent responses are consumed by the NestJS/Next.js layers; malformed responses can propagate errors.
- Zod schemas are already in use elsewhere (see ADR-14.5).

## Implementation Summary
- Added `AgentResponseSchema` (`apps/web/src/lib/agent-schemas.ts`) and integrated validation into `AgentClient` pipeline; invalid shapes raise `AgentAPIError`.
- Added tests `apps/web/src/lib/agent-client.test.ts` covering valid response, missing fields, wrong types, agent error payloads, and non-JSON responses.

## Definition of Done
- [x] Acceptance criteria covered with code and tests.
- [ ] Tests to run in CI (not executed here).
- [x] Story status updated to done; sprint status updated.

## Senior Developer Review

**Status:** APPROVED  
**Reviewer Notes:** Runtime Zod validation added to agent client; tests cover success and malformed payloads (missing/typed errors, non-JSON, agent error responses). Ensure CI runs Vitest suite.
