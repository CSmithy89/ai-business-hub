# BM-Email - Email Marketing Automation

> **Status:** Planning | **Parent:** BM-Marketing | **Priority:** P2

## Overview

BM-Email is an extension module for BM-Marketing that provides comprehensive email marketing automation capabilities. It handles email sequences, template management, deliverability optimization, analytics tracking, and compliance monitoring for marketing campaigns.

## Agent Team (6)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-email.dispatch` | Dispatch | Team Lead / Orchestrator | Planned |
| `@bm-email.sequence` | Sequence | Journey Architect - designs email sequences and drip campaigns | Planned |
| `@bm-email.template` | Template | Template Designer - creates and manages email templates | Planned |
| `@bm-email.deliver` | Deliver | Deliverability Expert - optimizes inbox placement | Planned |
| `@bm-email.track` | Track | Analytics Tracker - monitors opens, clicks, conversions | Planned |
| `@bm-email.comply` | Comply | Compliance Monitor - ensures CAN-SPAM, GDPR compliance | Planned |

## Key Integrations

**Requires:**
- BM-Marketing (parent module - campaign context, audience segments)

**Consumed By:**
- BM-CRM (contact engagement tracking, lead scoring signals)
- BM-Content (email content assets)

**Event Patterns:**
- `email.sequence.started` - Sequence initiated for contact
- `email.sequence.completed` - Contact finished sequence
- `email.sent` - Individual email dispatched
- `email.opened` - Recipient opened email
- `email.clicked` - Recipient clicked link
- `email.bounced` - Delivery failed
- `email.unsubscribed` - Recipient opted out

## Data Model (Planned)

- **EmailSequence** - Automated email journey definition
- **EmailTemplate** - Reusable email designs with variables
- **EmailSend** - Individual email dispatch record
- **EmailEvent** - Opens, clicks, bounces, unsubscribes
- **SubscriptionList** - Contact list with preferences
- **DeliverabilityMetrics** - Domain reputation, inbox rates

## Documentation

- **Full Specification:** See [BM-Marketing MODULE-PLAN](/docs/modules/bm-marketing/MODULE-PLAN.md#bm-email)
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-email.*` handles defined in architecture doc

---

*Module Status: Awaiting implementation after BM-Marketing core*
