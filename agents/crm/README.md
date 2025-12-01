# CRM Agents - Agno Implementation

**Status:** Scaffold (structure created, implementation pending)
**Created:** 2025-11-29
**Framework:** Agno (https://docs.agno.com/)

## Purpose

Runtime implementations of CRM module agents using the Agno framework.
These agents handle lead scoring, data enrichment, and pipeline automation.

## Agents

| File | Agent | Name | Status |
|------|-------|------|--------|
| `lead_scorer_agent.py` | LeadScorerAgent | Scout | Scaffold + Logic |
| `data_enricher_agent.py` | DataEnricherAgent | Atlas | Scaffold |
| `pipeline_agent.py` | PipelineAgent | Flow | Scaffold + Logic |

## Directory Structure

```
agents/crm/
├── README.md                 ← You are here
├── __init__.py
├── lead_scorer_agent.py      ← LeadScorerAgent (Scout)
├── data_enricher_agent.py    ← DataEnricherAgent (Atlas)
├── pipeline_agent.py         ← PipelineAgent (Flow)
├── schemas/                  ← (To be created)
│   └── crm.py
└── tools/                    ← (To be created)
    └── crm_tools.py
```

## Implementation Status

### LeadScorerAgent (Scout) 🎯

| Component | Status | Notes |
|-----------|--------|-------|
| Agent config | ✅ Done | AGENT_NAME, INSTRUCTIONS |
| Scoring algorithm | ✅ Done | Firmographic (40%), Behavioral (35%), Intent (25%) |
| Tier classification | ✅ Done | Cold, Warm, Hot, Sales-Ready |
| Agno Agent factory | ❌ TODO | Uncomment when Agno installed |
| Database integration | ❌ TODO | Store/retrieve scores |

### DataEnricherAgent (Atlas) 🔍

| Component | Status | Notes |
|-----------|--------|-------|
| Agent config | ✅ Done | AGENT_NAME, INSTRUCTIONS |
| Enrichment stubs | ✅ Done | lookup_company, find_linkedin, verify_email |
| API integrations | ❌ TODO | Clearbit, LinkedIn, etc. |
| Rate limiting | ❌ TODO | Implement for external APIs |

### PipelineAgent (Flow) 🔄

| Component | Status | Notes |
|-----------|--------|-------|
| Agent config | ✅ Done | AGENT_NAME, INSTRUCTIONS |
| Stage automations | ✅ Done | Suggestions for each stage transition |
| Stuck deal logic | ✅ Done | identify_stuck_deals() |
| Pipeline health | ✅ Done | calculate_pipeline_health() |
| Approval integration | ❌ TODO | Connect to ApprovalAgent |

## Key Implementation Details

### Lead Scoring Algorithm

```python
# Weights
FIRMOGRAPHIC = 40%   # Company size, industry, budget
BEHAVIORAL = 35%     # Email engagement, website activity
INTENT = 25%         # Demo requests, pricing views, trials

# Tiers
COLD = score < 50
WARM = 50 <= score < 70
HOT = 70 <= score < 90
SALES_READY = score >= 90
```

### Pipeline Automation Suggestions

Stage transitions trigger context-aware automation suggestions:
- Lead → Qualified: Follow-up email, schedule call
- Qualified → Proposal: Generate proposal, alert manager
- Proposal → Negotiation: Objection handling, check-ins
- Negotiation → Won: Contract, onboarding, notify CS
- Any → Lost: Feedback request, re-engagement schedule

## Prerequisites

```bash
# Install Agno framework
pip install agno

# External API keys needed:
# - CLEARBIT_API_KEY
# - LINKEDIN_API_KEY (or enrichment service)
# - EMAIL_VERIFICATION_KEY
```

## Next Steps

1. [ ] Create `agents/crm/schemas/crm.py` with Contact, Deal, LeadScore models
2. [ ] Create `agents/crm/tools/crm_tools.py` with Agno @tool decorators
3. [ ] Implement external API integrations (Clearbit, etc.)
4. [ ] Connect to database for score persistence
5. [ ] Integrate with ApprovalAgent for pipeline automations
6. [ ] Write tests for scoring and pipeline logic

## BMAD Specs

The BMAD YAML specifications for these agents are in:
- `.bmad/bm-crm/agents/lead-scorer-agent.agent.yaml`
- `.bmad/bm-crm/agents/data-enricher-agent.agent.yaml`
- `.bmad/bm-crm/agents/pipeline-agent.agent.yaml`

## Related Documentation

- Agent Mapping: `/docs/modules/bm-crm/agent-mapping.md`
- Twenty CRM Research: `/docs/modules/bm-crm/research/twenty-crm-analysis.md`
- Agno Framework: `/docs/research/agno-analysis.md`
- BMAD Module: `.bmad/bm-crm/README.md`
