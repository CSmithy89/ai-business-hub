# BM-Ads - Paid Advertising Management

> **Status:** Planning | **Parent:** BM-Marketing | **Priority:** P2

## Overview

BM-Ads is an extension module for BM-Marketing that provides comprehensive paid advertising capabilities. It handles media buying, ad creative management, audience targeting, bid optimization, and platform-specific campaign management for Google Ads and Meta Ads.

## Agent Team (6)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-ads.buyer` | Buyer | Team Lead / Media Buyer - manages ad spend | Planned |
| `@bm-ads.creative` | Creative | Ad Creative Designer - designs ad assets | Planned |
| `@bm-ads.target` | Target | Audience Targeting - defines and refines audiences | Planned |
| `@bm-ads.bid` | Bid | Bid Optimizer - manages bidding strategies | Planned |
| `@bm-ads.google` | Google | Google Ads Specialist - Search, Display, YouTube | Planned |
| `@bm-ads.meta` | Meta | Meta Ads Specialist - Facebook, Instagram | Planned |

## Key Integrations

**Requires:**
- BM-Marketing (parent module - campaign strategy, budgets, audiences)
- BM-Brand (brand guidelines for ad creative)

**Consumed By:**
- BM-CRM (lead attribution, conversion tracking)
- BM-Finance (ad spend tracking, ROI reporting)
- Core-PM (campaign projects and tasks)

**Event Patterns:**
- `ads.campaign.created` - New ad campaign launched
- `ads.campaign.paused` - Campaign paused
- `ads.campaign.completed` - Campaign ended
- `ads.conversion.recorded` - Conversion attributed
- `ads.budget.depleted` - Daily/total budget exhausted
- `ads.performance.alert` - Performance threshold triggered

## Data Model (Planned)

- **AdCampaign** - Campaign configuration and settings
- **AdGroup** - Ad set with targeting and budget
- **AdCreative** - Ad copy, images, videos
- **AdAudience** - Target audience definitions
- **AdPerformance** - Impressions, clicks, conversions, spend
- **ConversionEvent** - Attributed conversion records

## Documentation

- **Full Specification:** See [BM-Marketing MODULE-PLAN](/docs/modules/bm-marketing/MODULE-PLAN.md#bm-ads)
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-ads.*` handles defined in architecture doc

---

*Module Status: Awaiting implementation after BM-Marketing core*
