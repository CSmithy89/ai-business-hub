# Epic 11: Agent Integration

**Epic ID:** EPIC-11
**Status:** Backlog
**Priority:** P0 - Critical
**Phase:** Post-Foundation Enhancement

---

## Epic Overview

Wire existing Agno agent teams (Validation, Planning, Branding) to FastAPI endpoints and connect frontend workflow pages to real agent APIs. The agent code already exists (~55K lines) - this epic exposes it via API.

### Business Value
Unlocks the full AI-powered platform promise. 16 agents across 3 teams become operational, enabling the core business onboarding workflows.

### Success Criteria
- [ ] All 3 agent team endpoints operational
- [ ] Frontend workflow pages connected to real agents
- [ ] Vera, Blake, and Bella teams respond in chat panels
- [ ] E2E tests cover agent integration
- [ ] Tenant isolation enforced for all agent interactions

### Dependencies
- **None** - Can start immediately
- **Parallel with:** EPIC-10 (Platform Hardening), EPIC-12 (UX Polish)
- **Enables:** EPIC-13 (AI Agent Management), EPIC-14 (Testing)

---

## Existing Agent Code

The following agent teams are **already implemented** in `/agents/`:

| Team | Location | Agents | Lines |
|------|----------|--------|-------|
| Validation | `agents/validation/` | Vera, Marco, Cipher, Persona, Risk | ~17K |
| Planning | `agents/planning/` | Blake, Model, Finn, Revenue, Forecast | ~17K |
| Branding | `agents/branding/` | Bella, Sage, Vox, Iris, Artisan, Audit | ~21K |

All use Agno framework with:
- `agno.agent.Agent` and `agno.team.Team`
- `agno.models.anthropic.Claude`
- `agno.storage.postgres.PostgresStorage`
- Custom tools for each domain

**Only `/agents/approval/runs` (ApprovalAgent) is currently exposed.**

---

## Stories

### Story 11.1: Wire Validation Team API Endpoint

**Points:** 2
**Priority:** P0 Critical

**As a** user in business validation
**I want** to interact with Vera's validation team
**So that** my business idea gets validated by AI agents

**Acceptance Criteria:**
- [ ] AC1: Add `/agents/validation/runs` POST endpoint to `agents/main.py`
- [ ] AC2: Import ValidationTeam from `agents/validation/team.py`
- [ ] AC3: Accept request body: `{ businessId, sessionId, message, context }`
- [ ] AC4: Return streaming response (SSE) for real-time updates
- [ ] AC5: Include tenant isolation via `tenantId` header
- [ ] AC6: Handle errors gracefully with proper status codes
- [ ] AC7: Add health check for validation team at `/agents/validation/health`

**Files:**
- `agents/main.py` (modify)
- `agents/validation/team.py` (verify imports)

**Technical Notes:**
- Follow existing ApprovalAgent pattern in main.py
- SSE streaming enables real-time chat updates

---

### Story 11.2: Wire Planning Team API Endpoint

**Points:** 2
**Priority:** P0 Critical

**As a** user in business planning
**I want** to interact with Blake's planning team
**So that** my business plan gets developed by AI agents

**Acceptance Criteria:**
- [ ] AC1: Add `/agents/planning/runs` POST endpoint to `agents/main.py`
- [ ] AC2: Import PlanningTeam from `agents/planning/team.py`
- [ ] AC3: Accept request body: `{ businessId, sessionId, message, validationData }`
- [ ] AC4: Return streaming response (SSE) for real-time updates
- [ ] AC5: Accept validation output as input context for continuity
- [ ] AC6: Include tenant isolation via `tenantId` header
- [ ] AC7: Add health check for planning team at `/agents/planning/health`

**Files:**
- `agents/main.py` (modify)
- `agents/planning/team.py` (verify imports)

**Technical Notes:**
- Planning team receives validation synthesis as context
- Enables workflow continuity from validation to planning

---

### Story 11.3: Wire Branding Team API Endpoint

**Points:** 2
**Priority:** P0 Critical

**As a** user in brand development
**I want** to interact with Bella's branding team
**So that** my brand identity gets created by AI agents

**Acceptance Criteria:**
- [ ] AC1: Add `/agents/branding/runs` POST endpoint to `agents/main.py`
- [ ] AC2: Import BrandingTeam from `agents/branding/team.py`
- [ ] AC3: Accept request body: `{ businessId, sessionId, message, planningData }`
- [ ] AC4: Return streaming response (SSE) for real-time updates
- [ ] AC5: Accept planning output as input context for continuity
- [ ] AC6: Include tenant isolation via `tenantId` header
- [ ] AC7: Add health check for branding team at `/agents/branding/health`

**Files:**
- `agents/main.py` (modify)
- `agents/branding/team.py` (verify imports)

**Technical Notes:**
- Branding team receives business plan as context
- Enables workflow continuity from planning to branding

---

### Story 11.4: Connect Frontend Workflow Pages

**Points:** 3
**Priority:** P0 Critical

**As a** user
**I want** the workflow pages to connect to real agents
**So that** I get AI responses instead of mocked data

**Acceptance Criteria:**
- [ ] AC1: Create agent API client in `apps/web/src/lib/agent-client.ts`
- [ ] AC2: Implement SSE streaming handler for agent responses
- [ ] AC3: Update validation page to call `/agents/validation/runs`
- [ ] AC4: Update planning page to call `/agents/planning/runs`
- [ ] AC5: Update branding page to call `/agents/branding/runs`
- [ ] AC6: Show real agent names (Vera, Blake, Bella, etc.) instead of mocks
- [ ] AC7: Pass business context (id, session, history) to agents
- [ ] AC8: Handle loading, error, and success states properly

**Files:**
- `apps/web/src/lib/agent-client.ts` (create)
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/validation/page.tsx` (modify)
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/planning/page.tsx` (modify)
- `apps/web/src/app/(onboarding)/onboarding/[businessId]/branding/page.tsx` (modify)
- `apps/web/src/components/chat/ChatPanel.tsx` (modify)

**Technical Notes:**
- SSE (Server-Sent Events) for streaming responses
- Include auth token in API calls for tenant context

---

### Story 11.5: Agent Integration E2E Tests

**Points:** 4
**Priority:** P1 High

**As a** developer
**I want** comprehensive E2E tests for agent integration
**So that** agent functionality is verified and regressions are caught

**Acceptance Criteria:**
- [ ] AC1: Create `apps/web/e2e/agents.spec.ts` test file
- [ ] AC2: Test validation endpoint health check returns 200
- [ ] AC3: Test planning endpoint health check returns 200
- [ ] AC4: Test branding endpoint health check returns 200
- [ ] AC5: Test full workflow: validation → planning → branding handoff
- [ ] AC6: Test error handling for invalid requests (400 errors)
- [ ] AC7: Test tenant isolation (cross-tenant access denied with 403)
- [ ] AC8: Create mock fixtures for deterministic AI responses

**Files:**
- `apps/web/e2e/agents.spec.ts` (create)
- `apps/web/e2e/fixtures/agent-mocks.ts` (create)

**Technical Notes:**
- Mock AI responses for deterministic tests
- Test both happy path and error scenarios

---

## Summary

| Metric | Value |
|--------|-------|
| Total Stories | 5 |
| Total Points | 13 |
| P0 Critical | 4 stories (9 points) |
| P1 High | 1 story (4 points) |
| Dependencies | None |
| Parallel with | EPIC-10, EPIC-12 |
| Enables | EPIC-13, EPIC-14 |

---

## Testing Gaps Closed

From `docs/sprint-artifacts/CONSOLIDATED-TECH-DEBT-AND-IMPROVEMENTS.md`:

| Gap | Status After Epic |
|-----|-------------------|
| Workflow API tests (validation, planning, branding) | Resolved |
| Agent team configurations | Resolved |
| Integration tests for handoff workflows | Resolved |

---

## Architecture Notes

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Validation  │  │   Planning   │  │   Branding   │      │
│  │    Page      │  │    Page      │  │    Page      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   agent-client.ts (SSE)                      │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI (agents/main.py)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /validation  │  │  /planning   │  │  /branding   │      │
│  │    /runs     │  │    /runs     │  │    /runs     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agno Agent Teams                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vera's Team  │  │ Blake's Team │  │ Bella's Team │      │
│  │  5 agents    │  │  5 agents    │  │  6 agents    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

_Generated by BMAD Party Mode Planning Session_
_Date: 2025-12-05_
