# BM-CRM Architecture Decisions

## Summary
Module architecture created at `docs/modules/bm-crm/architecture.md` on 2025-12-15.

## Key Architectural Patterns

### Agent Team Topology
- Clara as team leader (coordinator mode)
- MVP members: Scout, Atlas, Flow, Echo
- Growth agents: Sync, Guardian, Cadence
- All agents share tools.py

### Enrichment Architecture
- Waterfall strategy: apollo → clearbit → hunter
- Budget tracking per tenant (default $50/month)
- 7-day cache for company, 30-day for contact
- Provider adapter pattern for extensibility

### Lead Scoring Engine
- Event-driven (not polling)
- Redis cache with 24h TTL
- Configurable weights and thresholds per tenant
- Triggers: contact.created, contact.enriched, activity.logged, deal.stage_changed

### Email Sequence State Machine
- BullMQ delayed jobs for step scheduling
- Each step schedules next step on completion
- Conflict detection before enrollment
- Daily touch limit: 2 per contact

### Data Retention
- Anonymization over deletion (preserve analytics)
- Configurable per entity type
- Consent tracking table

## ADRs
1. ADR-CRM-001: Enrichment Provider Waterfall
2. ADR-CRM-002: Event-Driven Scoring
3. ADR-CRM-003: BullMQ for Sequence Steps
4. ADR-CRM-004: Sequence Conflict Prevention
5. ADR-CRM-005: Anonymization Over Deletion
6. ADR-CRM-006: Most Recent Wins for Sync Conflicts

## Related Files
- PRD: docs/modules/bm-crm/PRD.md (v1.3)
- Architecture: docs/modules/bm-crm/architecture.md (v1.0)
- Platform: docs/architecture.md
