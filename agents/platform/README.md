# Platform Agents - Agno Implementation

**Status:** Scaffold (structure created, implementation pending)
**Created:** 2025-11-29
**Framework:** Agno (https://docs.agno.com/)

## Purpose

Runtime implementations of platform orchestration agents using the Agno framework.
These agents run in the AI Business Hub platform to manage approvals and routing.

## Agents

| File | Agent | Name | Status |
|------|-------|------|--------|
| `approval_agent.py` | ApprovalAgent | Sentinel | Scaffold |
| `orchestrator_agent.py` | OrchestratorAgent | Navigator | Scaffold |

## Directory Structure

```
agents/platform/
├── README.md                 ← You are here
├── __init__.py
├── approval_agent.py         ← ApprovalAgent (Sentinel)
├── orchestrator_agent.py     ← OrchestratorAgent (Navigator)
├── schemas/
│   ├── __init__.py
│   └── approval.py           ← Pydantic models for approvals
└── tools/
    ├── __init__.py
    └── approval_tools.py     ← Tool function definitions
```

## Implementation Status

### ApprovalAgent (Sentinel) 🛡️

| Component | Status | Notes |
|-----------|--------|-------|
| Agent config | ✅ Done | AGENT_NAME, INSTRUCTIONS, PRINCIPLES |
| Pydantic schemas | ✅ Done | ApprovalRequest, ApprovalDecision, etc. |
| Tool stubs | ✅ Done | request_approval, get_pending, etc. |
| Database integration | ❌ TODO | Need PostgresDb setup |
| Agno Agent factory | ❌ TODO | Uncomment when Agno installed |
| API endpoints | ❌ TODO | Need NestJS/FastAPI routes |

### OrchestratorAgent (Navigator) 🧭

| Component | Status | Notes |
|-----------|--------|-------|
| Agent config | ✅ Done | AGENT_NAME, INSTRUCTIONS |
| Module registry | ✅ Done | Maps modules to capabilities |
| Routing logic stubs | ✅ Done | analyze_intent, route_to_agent |
| Database integration | ❌ TODO | Need PostgresDb setup |
| Agno Agent factory | ❌ TODO | Uncomment when Agno installed |

## Prerequisites

```bash
# Install Agno framework
pip install agno

# Or with all providers
pip install "agno[all]"
```

## Usage (After Implementation)

```python
from agents.platform import create_approval_agent

# Create tenant-isolated agent
agent = create_approval_agent(
    tenant_id="tenant_123",
    user_id="user_456",
)

# Run approval request
response = agent.run("Request approval for publishing campaign X")
```

## Next Steps

1. [ ] Install Agno: `pip install agno`
2. [ ] Set up PostgreSQL database
3. [ ] Create `agents/config.py` with `get_tenant_model()` and `get_agent_db()`
4. [ ] Implement tool functions with actual database queries
5. [ ] Uncomment Agno imports and agent factory functions
6. [ ] Write tests for approval workflows
7. [ ] Create API endpoints to expose agents

## BMAD Specs

The BMAD YAML specifications for these agents are in:
- `.bmad/orchestrator/agents/approval-agent.agent.yaml`
- `.bmad/orchestrator/agents/orchestrator-agent.agent.yaml`

## Related Documentation

- Agno Framework: `/docs/research/agno-analysis.md`
- Agent Mapping: `/docs/modules/bm-crm/agent-mapping.md`
- BMAD Module: `.bmad/orchestrator/README.md`
