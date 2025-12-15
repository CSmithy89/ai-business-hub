# Story 04-10: Integrate Approval Agent with AgentOS

**Epic:** EPIC-04 - Approval Queue System
**Story ID:** 04-10
**Priority:** P1
**Points:** 3
**Status:** done

---

## Story Description

**As a** platform
**I want** the Approval Agent operational in AgentOS
**So that** approvals can be managed conversationally with monitoring

---

## Acceptance Criteria

- [x] Implement Agno-based ApprovalAgent in `agents/platform/approval_agent.py`
- [x] Register agent with AgentOS runtime
- [x] Connect approval tools:
  - `request_approval` with `requires_confirmation=True` for HITL
  - `get_pending_approvals` for queue queries
  - `approve_item` / `reject_item` for decisions
- [x] Configure workspace context via tenant middleware
- [x] Test via AgentOS API endpoints (`/agents/approval/runs`)
- [ ] Verify agent sessions visible in Control Plane

---

## Technical Context

### AgentOS Architecture
- Python FastAPI service at `agents/`
- Uses Agno framework for agent creation
- Connects to Control Plane at os.agno.com for monitoring
- Tenant isolation via JWT middleware

### NestJS API Integration
- Base URL: `http://localhost:3001/api`
- Endpoints:
  - `GET /approvals` - List approvals with filtering
  - `GET /approvals/:id` - Get approval details
  - `POST /approvals/:id/approve` - Approve item
  - `POST /approvals/:id/reject` - Reject item
  - `POST /approvals/bulk` - Bulk operations

### Agent Tools Required
1. **request_approval** - Request human approval (HITL confirmation)
2. **get_pending_approvals** - Query approval queue
3. **approve_item** - Approve a pending item
4. **reject_item** - Reject with reason

---

## Implementation Plan

### 1. Update approval_tools.py
- Add httpx async client for NestJS API calls
- Implement tools with actual API integration
- Add @tool decorators from Agno
- Handle errors and timeouts gracefully

### 2. Update approval_agent.py
- Import Agno Agent class
- Create ApprovalAgent extending Agent
- Register approval tools
- Configure model, instructions, and DB

### 3. Register in AgentOS Runtime
- Add approval agent routes to main.py
- Configure POST /agents/approval/runs endpoint
- Add workspace context extraction
- Enable session tracking

### 4. Configuration
- Add httpx to requirements.txt
- Ensure JWT forwarding for API calls
- Configure agent DB connection

---

## References

- **Epic File:** `docs/epics/EPIC-04-approval-system.md`
- **BMAD Spec:** `.bmad/orchestrator/agents/approval-agent.agent.yaml`
- **Architecture:** ADR-007 (AgentOS for Agent Runtime)
- **NestJS Controller:** `apps/api/src/approvals/approvals.controller.ts`

---

## Testing Checklist

- [ ] Agent responds to `/agents/approval/runs` POST
- [ ] Workspace context correctly extracted from JWT
- [ ] Tools successfully call NestJS API
- [ ] request_approval triggers HITL confirmation
- [ ] get_pending_approvals returns filtered list
- [ ] approve_item updates approval status
- [ ] reject_item requires reason
- [ ] Errors handled gracefully (API unavailable, auth failure)
- [ ] Agent sessions visible in Control Plane UI

---

## Notes

- Agent should be conversational - can answer questions about queue status
- All API calls must include workspace context from JWT
- Use httpx for async HTTP requests (better than requests)
- Log all agent actions for debugging
- Control Plane verification depends on Story 04-11

---

**Created:** 2025-12-03
**Assignee:** Dev Team
**Sprint:** Epic 04 - Approval System
