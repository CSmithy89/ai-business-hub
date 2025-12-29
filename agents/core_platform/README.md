# Platform Agents - Agno Implementation

**Status:** Active Development
**Created:** 2025-11-29
**Updated:** 2025-12-03
**Framework:** Agno (https://docs.agno.com/)

## Purpose

Runtime implementations of platform orchestration agents using the Agno framework.
These agents run in the AI Business Hub platform to:
- Route requests to appropriate module teams
- Manage approval workflows (human-in-the-loop)
- Coordinate cross-module workflows

## Agents

| File | Agent | Name | Status |
|------|-------|------|--------|
| `approval_agent.py` | ApprovalAgent | Sentinel | **Active** (Story 04-10) |
| `orchestrator_agent.py` | OrchestratorAgent | Navigator | Scaffold |

---

## ApprovalAgent (Sentinel) - Story 04-10

**Purpose:** Human-in-the-loop gatekeeper and approval workflow manager

**BMAD Spec:** `.bmad/orchestrator/agents/approval-agent.agent.yaml`

### Capabilities

- Request approvals with human-in-the-loop confirmation
- Query approval queue with filters (status, type, priority)
- Approve/reject pending approval items
- Get detailed approval information with AI reasoning
- View queue statistics and metrics

### Tools

1. `request_approval` - Create approval request (requires HITL confirmation)
2. `get_pending_approvals` - List pending approvals
3. `approve_item` - Approve an item
4. `reject_item` - Reject an item (requires reason)
5. `get_approval_details` - Get full approval context
6. `get_approval_stats` - Get queue statistics

### Testing

#### 1. Start AgentOS

```bash
cd agents
python -m uvicorn main:app --reload --port 7777
```

#### 2. Get Agent Info

```bash
curl http://localhost:7777/agents/approval/info
```

#### 3. Run Agent (requires JWT)

```bash
# Get JWT token from Better Auth
export JWT_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:7777/agents/approval/runs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "message": "Show me pending approvals",
    "session_id": "test-session-001"
  }'
```

#### Example Conversations

**Check queue:**
```json
{"message": "What's in the approval queue?", "session_id": "s1"}
```

**High priority:**
```json
{"message": "Show me high priority approvals", "session_id": "s1"}
```

**Approve:**
```json
{"message": "Approve apr_20241203", "session_id": "s1"}
```

**Reject:**
```json
{"message": "Reject apr_20241203 - needs legal review", "session_id": "s1"}
```

**Stats:**
```json
{"message": "Give me approval queue stats", "session_id": "s1"}
```

### API Integration

All tools communicate with NestJS API at `http://localhost:3001/api`:

- `GET /approvals` - List approvals
- `GET /approvals/:id` - Get details
- `POST /approvals/:id/approve` - Approve
- `POST /approvals/:id/reject` - Reject

### Implementation Status

| Component | Status |
|-----------|--------|
| Agent class | ✅ Done |
| Tools with httpx | ✅ Done |
| API endpoints | ✅ Done |
| Workspace context | ✅ Done |
| Session storage | ✅ Done |
| HITL confirmation | ✅ Done |
| Control Plane | ⏳ Story 04-11 |

---

## Module Registry

The orchestrator routes requests to these module teams:

### Business Onboarding (BMAD Foundation)

| Module | Name | Team Leader | Agents | Location |
|--------|------|-------------|--------|----------|
| `bmv` | Business Model Validation | Vera | 5 agents | `agents/validation/` |
| `bmp` | Business Planning | Blake | 5 agents | `agents/planning/` |
| `bmb` | Business Branding | Bella | 6 agents | `agents/branding/` |

### Operational Modules (Coming Soon)

| Module | Name | Status |
|--------|------|--------|
| `bm-crm` | CRM Module | Planned |
| `bmc` | Content Module | Planned |
| `bm-social` | Social Module | Planned |
| `bmx` | Email Module | Planned |
| `bms` | Sales Module | Planned |
| `bm-pm` | Project Management | Planned |

---

## Directory Structure

```
agents/
├── platform/                 ← You are here
│   ├── README.md
│   ├── __init__.py
│   ├── approval_agent.py     ← Sentinel (approval workflows) ✅
│   ├── orchestrator_agent.py ← Navigator (request routing)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── approval.py       ← Pydantic models ✅
│   └── tools/
│       ├── __init__.py
│       └── approval_tools.py ← Tool definitions ✅
│
├── validation/               ← BMV Module (Vera's team)
├── planning/                 ← BMP Module (Blake's team)
├── branding/                 ← BMB Module (Bella's team)
├── main.py                   ← FastAPI app with agent routes ✅
├── config.py                 ← Environment configuration ✅
├── middleware/
│   └── tenant.py            ← JWT & workspace context ✅
└── requirements.txt          ← Dependencies (includes httpx) ✅
```

---

## Architecture

### Workspace Context Flow

1. User authenticates with Better Auth (JWT)
2. Request to `/agents/approval/runs` with JWT header
3. TenantMiddleware extracts: `workspace_id`, `user_id`, `jwt_token`
4. Agent runner injects context into tools via `tool_params`
5. Tools use context for API calls to NestJS

### Session Management

- Database: PostgreSQL via Agno's `PostgresDb`
- Table: `agent_sessions`
- Features:
  - Conversation continuity
  - Context history (last 5 runs)
  - User memories
  - Session replay

---

## Development

### Adding New Tools

1. Define in `tools/approval_tools.py`:

```python
from agno.tools import tool

@tool
async def my_tool(param: str, jwt_token: Optional[str] = None) -> Dict:
    """Tool description."""
    client = APIClient(jwt_token, workspace_id)
    result = await client.get("/endpoint")
    return result
```

2. Import in `approval_agent.py`:

```python
from .tools.approval_tools import my_tool

# Add to tools list
tools=[..., my_tool]
```

3. Update agent info in `main.py`

---

## Troubleshooting

### Agent not responding

```bash
# Check logs
tail -f agents/logs/*.log

# Or run with debug
uvicorn main:app --reload --log-level debug
```

### API connection errors

```bash
# Verify NestJS is running
curl http://localhost:3001/api/health
```

### JWT failures

```bash
# Test JWT token
curl http://localhost:3001/api/workspaces \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Database issues

```bash
# Check PostgreSQL
psql $DATABASE_URL -c "SELECT 1"
```

---

## Control Plane (Story 04-11)

Once configured, agent sessions visible at `os.agno.com`:
- View conversation history
- Debug tool calls
- Monitor performance
- Review memories

Note: Control Plane connects FROM browser TO AgentOS - no data leaves your infrastructure.

---

## Next Steps

**Story 04-10 (Complete):**
- [x] Implement ApprovalAgent with Agno
- [x] Create approval tools with httpx
- [x] Register agent routes in main.py
- [x] Add workspace context injection
- [x] Enable session storage

**Story 04-11 (Next):**
- [ ] Configure Control Plane connection
- [ ] Verify agent sessions visible
- [ ] Test session history
- [ ] Document access for team

**Story 04-12 (After 04-11):**
- [ ] Create NestJS AgentOSService
- [ ] Implement agent invocation methods
- [ ] Add retry logic
- [ ] Test business logic triggers

---

## BMAD Specs

The BMAD YAML specifications for these agents are in:
- `.bmad/orchestrator/agents/approval-agent.agent.yaml`
- `.bmad/orchestrator/agents/orchestrator-agent.agent.yaml`

## Related Documentation

- Epic: `docs/epics/EPIC-04-approval-system.md`
- Story: `docs/stories/04-10-integrate-approval-agent-with-agentos.md`
- Architecture: ADR-007 (AgentOS for Agent Runtime)
- Agno Framework: `docs/research/agno-analysis.md`

---

**Last Updated:** 2025-12-03 (Story 04-10)
