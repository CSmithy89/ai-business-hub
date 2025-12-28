# BM-Marketing Module

**Module ID:** `bm-marketing`
**Phase:** BUILD (Strategic)
**Status:** Planning
**Priority:** P1 (after BM-Brand, before tactical modules)

---

## Overview

BM-Marketing is a core strategic marketing module that handles high-level go-to-market strategy and campaign orchestration. It sits in the BUILD phase alongside BMV, BMP, and BM-Brand.

**Key Insight:** BM-Marketing is to tactical channels what BM-CRM is to BM-Sales. It owns the **strategy**, while standalone modules handle **execution**.

### Module Hierarchy

```
BUILD Phase (Strategy)              OPERATE Phase (Execution)
─────────────────────────────────────────────────────────────
BMV → BMP → BM-Brand
              ↓
         BM-Marketing  ────────→  Standalone Modules:
         (Orchestrator)           ├─ BM-Social (social media)
                                  ├─ BM-Email (email marketing)
                                  ├─ BM-CMS (website/blog)
                                  ├─ BM-SEO (search optimization)
                                  └─ BM-Ads (paid advertising)
```

---

## Agent Team (6 Agents)

| Handle | Display Name | Role |
|--------|--------------|------|
| `@bm-marketing.maven` | Maven | Team Lead / GTM Strategist |
| `@bm-marketing.channel` | Channel | Channel Mix Optimizer |
| `@bm-marketing.segment` | Segment | Audience Strategist |
| `@bm-marketing.campaign` | Campaign | Campaign Orchestrator |
| `@bm-marketing.budget` | Budget | Marketing Budget Allocator |
| `@bm-marketing.measure` | Measure | Attribution Analyst |

---

## Dependencies

| Module | Type | Reason |
|--------|------|--------|
| `bm-brand` | Required | Brand voice, guidelines, positioning |
| `bm-crm` | Optional | Audience sync, lead handoff |
| `bm-support` | Optional | Route marketing inquiries |

### Coordinates (via A2A)

- `bm-social` - Social media execution
- `bm-email` - Email marketing
- `bm-cms` - Website/blog content
- `bm-seo` - Search optimization
- `bm-ads` - Paid advertising

---

## Core Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **GTM Strategy** | Go-to-market planning, launch coordination |
| **Campaign Architecture** | Campaign structure, objectives, timeline |
| **Audience Segmentation** | Define and manage audience segments |
| **Channel Mix** | Recommend optimal channel allocation |
| **Budget Allocation** | Distribute marketing budget across channels |
| **Attribution** | Aggregate performance across all channels |

---

## Documentation

| Document | Status | Description |
|----------|--------|-------------|
| `MODULE-PLAN.md` | Complete | Detailed architecture plan |
| `PRD.md` | Pending | Product requirements |
| `architecture.md` | Pending | Technical architecture |

---

## References

- [Module Architecture Plan](./MODULE-PLAN.md)
- [Dynamic Module System](../../architecture/dynamic-module-system.md)
- [Cross-Module Architecture](../../architecture/cross-module-architecture.md)
