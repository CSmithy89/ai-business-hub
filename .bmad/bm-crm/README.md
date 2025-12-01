# BM-CRM Module

**Status:** Scaffold (agents defined, implementation pending)
**Created:** 2025-11-29

## Purpose

Customer Relationship Management module with AI-powered capabilities:
- Intelligent lead scoring based on firmographic and behavioral data
- Contact data enrichment from external sources
- Deal pipeline automation with approval gates

## Agents

| Agent | Name | Icon | Status | Description |
|-------|------|------|--------|-------------|
| `lead-scorer-agent` | Scout | 🎯 | Scaffold | Lead scoring specialist |
| `data-enricher-agent` | Atlas | 🔍 | Scaffold | Data enrichment specialist |
| `pipeline-agent` | Flow | 🔄 | Scaffold | Pipeline automation specialist |

## Directory Structure

```
.bmad/bm-crm/
├── README.md           ← You are here
├── config.yaml         ← Module configuration
├── agents/
│   ├── lead-scorer-agent.agent.yaml   ← BMAD spec for Scout
│   ├── data-enricher-agent.agent.yaml ← BMAD spec for Atlas
│   └── pipeline-agent.agent.yaml      ← BMAD spec for Flow
├── workflows/          ← (To be created)
│   ├── lead-scoring/
│   ├── contact-enrichment/
│   └── pipeline-automation/
└── research/
    └── twenty-crm-analysis.md  ← Research from Twenty CRM
```

## Runtime Implementation

Agno Python implementations are in: `agents/crm/`

See `agents/crm/README.md` for implementation status.

## Workflows To Create

| Workflow | Trigger | Status | Description |
|----------|---------|--------|-------------|
| `lead-scoring` | contact.created | TODO | Score leads automatically |
| `contact-enrichment` | user-initiated | TODO | Enrich contact data |
| `pipeline-automation` | deal.stage_changed | TODO | Suggest automations |
| `stuck-deal-alert` | scheduled (daily) | TODO | Alert on stuck deals |

## Checklists To Create

| Checklist | Status | Description |
|-----------|--------|-------------|
| `new-lead-checklist` | TODO | Steps for processing new leads |
| `deal-stage-checklist` | TODO | Steps for stage transitions |

## Dependencies

- **Requires:** orchestrator (for approval gates)
- **Required By:** bms (Sales), bmx (Email)

## User Flows

Documented in `/docs/modules/bm-crm/agent-mapping.md`:

1. **Lead Capture & Scoring** - Automatic scoring on lead arrival
2. **Contact Enrichment** - User-initiated data lookup
3. **Deal Pipeline** - Drag-drop with automation suggestions
4. **High-Value Approval** - Manager approval for big deals

## Next Steps

1. [ ] Create PRD using `/bmad:bmm:workflows:prd`
2. [ ] Create architecture doc
3. [ ] Create workflows for each agent
4. [ ] Implement Agno tools (Clearbit, LinkedIn APIs)
5. [ ] Set up database schema (contacts, deals, etc.)
6. [ ] Build UI components (pipeline board, contact cards)

## Related Documentation

- Agent Mapping: `/docs/modules/bm-crm/agent-mapping.md`
- Twenty CRM Research: `/docs/modules/bm-crm/research/twenty-crm-analysis.md`
- Agno Patterns: `/docs/research/agno-analysis.md`
- Runtime Implementation: `/agents/crm/README.md`
