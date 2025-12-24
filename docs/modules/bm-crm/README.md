# BM-CRM - Customer Relationship Management

> **Status:** Research Complete | **Type:** Standalone Module | **Priority:** P1

## Overview

BM-CRM is a **standalone module** providing AI-first customer relationship management. Unlike traditional CRMs that are databases with workflows, BM-CRM is built around an **8-agent AI team** that proactively manages customer relationships, scores leads, enriches data, and automates pipeline operations.

**Standalone with Built-in Analytics:** Includes its own CRM analytics dashboard (pipeline velocity, conversion rates, lead scores). Works independently with full functionality.

**Data Ownership:** BM-CRM owns contact/company data. Other modules read via A2A when installed together.

## Agent Team (8)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-crm.clara` | Clara | Team Lead / Orchestrator | Planned |
| `@bm-crm.scout` | Scout | Lead Scoring (40/35/25 algorithm) | Partial |
| `@bm-crm.atlas` | Atlas | Data Enrichment (Clearbit/Apollo) | Scaffold |
| `@bm-crm.flow` | Flow | Pipeline Management | Partial |
| `@bm-crm.tracker` | Tracker | Activity Tracking | Planned |
| `@bm-crm.sync` | Sync | Integration Specialist | Planned |
| `@bm-crm.guardian` | Guardian | Compliance (GDPR) | Planned |
| `@bm-crm.cadence` | Cadence | Outreach Sequences | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- BM-Sales (extends CRM with quotes, orders, commissions - **requires CRM**)
- BM-Email (contact engagement, lead scoring signals)
- BM-Social (contact tagging, social profiles)
- BM-Support (customer history, ticket context)
- BM-Marketing (audience segments, campaign attribution)
- BM-Analytics (AI-powered customer insights)
- Core-PM (customer projects, task linking)

**Event Patterns:**
- `crm.contact.created` - New contact added
- `crm.contact.updated` - Contact data changed
- `crm.company.created` - New company added
- `crm.deal.created` - New deal in pipeline
- `crm.deal.stage_changed` - Deal moved stages
- `crm.deal.won` - Deal closed won
- `crm.deal.lost` - Deal closed lost
- `crm.lead.scored` - Lead score updated

## Data Model

- **Contact** - Individual people with profile data
- **Company** - Organizations/accounts with firmographics
- **Deal** - Sales opportunities with pipeline stages
- **Activity** - Emails, calls, meetings, notes
- **LeadScore** - Calculated scores with breakdown
- **CustomField** - Tenant-defined fields
- **Tag** - Flexible categorization

## Documentation

- **PRD:** See [PRD.md](./PRD.md)
- **Architecture:** See [architecture.md](./architecture.md)
- **Agent Mapping:** See [agent-mapping.md](./agent-mapping.md)
- **Research:** See [research/](./research/) directory
- **Epics:** See [epics/](./epics/) directory
- **Cross-Module:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Protocols:** See [Dynamic Module System](/docs/architecture/dynamic-module-system.md) (AG-UI, A2A, MCP)
- **Agent Registry:** `@bm-crm.*` handles defined in cross-module architecture

---

*Module Status: Standalone module - CRM owns contact data, other modules integrate via A2A*
