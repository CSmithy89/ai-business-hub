# BM-Sales Module

**Module ID:** `bm-sales`
**Phase:** OPERATE (Extension)
**Status:** Planning
**Priority:** P1 (follows BM-CRM)

---

## Overview

BM-Sales is a CRM extension module that adds sales-specific capabilities to the BM-CRM module. Following patterns from Odoo, ERPNext, and Dolibarr, BM-Sales handles the **transactional side** of customer relationships.

### CRM vs Sales Boundary

```
CRM owns:                    Sales owns:
────────────────────────────────────────────
Lead → MQL → SQL → Deal  →  Quote → Order
         (Relationship)        (Transaction)
```

**What CRM Owns:**
- Contact/Company records
- Lead scoring and qualification
- Deal/Opportunity pipeline
- Activity tracking

**What Sales Owns:**
- Quotation/Proposal generation
- Order management
- Pricing rules and discounts
- Territory assignment
- Commission calculations

---

## Agent Team (6 Agents)

| Handle | Display Name | Role |
|--------|--------------|------|
| `@bm-sales.sterling` | Sterling | Team Lead / Orchestrator |
| `@bm-sales.quota` | Quota | Quotation Specialist |
| `@bm-sales.order` | Order | Order Manager |
| `@bm-sales.price` | Price | Pricing Strategist |
| `@bm-sales.region` | Region | Territory Manager |
| `@bm-sales.bounty` | Bounty | Commission Tracker |

---

## Dependencies

| Module | Type | Reason |
|--------|------|--------|
| `bm-crm` | Required | Contact, Account, Deal data |
| `bm-finance` | Optional | Invoice generation |

---

## Data Model

### New Entities

- **SalesQuote** - Quotations generated from CRM deals
- **SalesOrder** - Orders from accepted quotes
- **SalesPricingRule** - Volume, tier, promo discounts
- **SalesTerritory** - Geographic/industry territories
- **SalesCommission** - Rep commission tracking

---

## User Interface

When BM-Sales is enabled, it extends CRM navigation:

```
CRM (sidebar)
├── Dashboard
├── Contacts
├── Companies
├── Deals
│   └── [Deal Detail]
│       └── "Create Quote" button ← NEW
└── Sales (sub-section) ← NEW
    ├── Quotes
    ├── Orders
    ├── Pricing
    ├── Territories
    └── Commissions
```

---

## Implementation Phases

| Phase | Focus | Duration | Agents |
|-------|-------|----------|--------|
| 1 | Quote Management (MVP) | 3-4 weeks | Sterling, Quota, Price |
| 2 | Order & Territory | 3-4 weeks | + Order, Region |
| 3 | Commissions & Analytics | 2-3 weeks | + Bounty |

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
- [BM-CRM Module](../bm-crm/README.md)
- [Dynamic Module System](../../architecture/dynamic-module-system.md)
