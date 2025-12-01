# Orchestrator Module

**Status:** Scaffold (agents defined, implementation pending)
**Created:** 2025-11-29

## Purpose

Core platform module providing cross-cutting orchestration capabilities:
- Human-in-the-loop approval gates
- Request routing to appropriate module agents
- Multi-module workflow coordination

## Agents

| Agent | Name | Icon | Status | Description |
|-------|------|------|--------|-------------|
| `approval-agent` | Sentinel | 🛡️ | Scaffold | Approval workflow manager |
| `orchestrator-agent` | Navigator | 🧭 | Scaffold | Request router & coordinator |

## Directory Structure

```
.bmad/orchestrator/
├── README.md           ← You are here
├── config.yaml         ← Module configuration
├── agents/
│   ├── approval-agent.agent.yaml      ← BMAD spec for Sentinel
│   └── orchestrator-agent.agent.yaml  ← BMAD spec for Navigator
└── workflows/          ← (To be created)
    ├── approval-request/
    └── approval-reminder/
```

## Runtime Implementation

Agno Python implementations are in: `agents/platform/`

See `agents/platform/README.md` for implementation status.

## Workflows To Create

| Workflow | Status | Description |
|----------|--------|-------------|
| `approval-request` | TODO | Request and process approvals |
| `approval-reminder` | TODO | Automated reminders for pending approvals |
| `multi-module-task` | TODO | Coordinate tasks across modules |

## Dependencies

- **Requires:** None (core module)
- **Required By:** bm-crm, bmc, bm-pm, bms (all modules)

## Next Steps

1. [ ] Create `approval-request` workflow
2. [ ] Create `approval-reminder` workflow
3. [ ] Implement Agno tools in `agents/platform/tools/`
4. [ ] Set up database tables (approval_requests, etc.)
5. [ ] Build approval queue UI component

## Related Documentation

- Agent Mapping: `/docs/modules/bm-crm/agent-mapping.md`
- Agno Patterns: `/docs/research/agno-analysis.md`
- Runtime Implementation: `/agents/platform/README.md`
