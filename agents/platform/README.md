# Platform Agents - Agno Implementation

**Status:** Active Development
**Created:** 2025-11-29
**Updated:** 2025-12-02
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
| `approval_agent.py` | ApprovalAgent | Sentinel | Scaffold |
| `orchestrator_agent.py` | OrchestratorAgent | Navigator | Active |

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

## Directory Structure

```
agents/
├── platform/                 ← You are here
│   ├── README.md
│   ├── __init__.py
│   ├── approval_agent.py     ← Sentinel (approval workflows)
│   ├── orchestrator_agent.py ← Navigator (request routing)
│   ├── schemas/
│   │   └── approval.py       ← Pydantic models
│   └── tools/
│       └── approval_tools.py ← Tool definitions
│
├── validation/               ← BMV Module (Vera's team)
│   ├── team.py               ← Agno Team definition
│   └── *_agent.py            ← Individual agents
│
├── planning/                 ← BMP Module (Blake's team)
│   ├── team.py               ← Agno Team definition
│   └── *_agent.py            ← Individual agents
│
└── branding/                 ← BMB Module (Bella's team)
    ├── team.py               ← Agno Team definition
    └── *_agent.py            ← Individual agents
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

1. [x] Add BMV, BMP, BMB modules to MODULE_REGISTRY
2. [x] Create Agno Team implementations for each module
3. [ ] Install Agno: `pip install agno`
4. [ ] Set up PostgreSQL database
5. [ ] Create `agents/config.py` with `get_tenant_model()` and `get_agent_db()`
6. [ ] Implement tool functions with actual database queries
7. [ ] Wire up orchestrator to invoke module teams
8. [ ] Write tests for approval workflows
9. [ ] Create API endpoints to expose agents

## BMAD Specs

The BMAD YAML specifications for these agents are in:
- `.bmad/orchestrator/agents/approval-agent.agent.yaml`
- `.bmad/orchestrator/agents/orchestrator-agent.agent.yaml`

## Related Documentation

- Agno Framework: `/docs/research/agno-analysis.md`
- Agent Mapping: `/docs/modules/bm-crm/agent-mapping.md`
- BMAD Module: `.bmad/orchestrator/README.md`
