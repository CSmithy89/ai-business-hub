# BM-Content - Content Marketing Management

> **Status:** Planning | **Parent:** BM-Marketing | **Priority:** P2

## Overview

BM-Content is an extension module for BM-Marketing that provides comprehensive content marketing capabilities. It handles content creation, asset management, editorial planning, content repurposing, and multi-channel distribution to support marketing campaigns.

## Agent Team (6)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-content.editor` | Editor | Team Lead / Orchestrator | Planned |
| `@bm-content.writer` | Writer | Content Creator - writes blog posts, articles, copy | Planned |
| `@bm-content.visual` | Visual | Visual Content Creator - images, graphics, videos | Planned |
| `@bm-content.library` | Library | Asset Manager - organizes and retrieves content | Planned |
| `@bm-content.repurpose` | Repurpose | Content Atomizer - transforms content across formats | Planned |
| `@bm-content.calendar` | Calendar | Editorial Planner - schedules content pipeline | Planned |

## Key Integrations

**Requires:**
- BM-Marketing (parent module - campaign themes, audience targeting)
- BM-Brand (brand guidelines, voice, visual identity)

**Consumed By:**
- BM-Email (email content assets)
- BM-Social (social media content)
- BM-Ads (ad creative assets)
- BM-SEO (optimized content for search)

**Event Patterns:**
- `content.asset.created` - New content piece drafted
- `content.asset.published` - Content went live
- `content.asset.updated` - Content revised
- `content.asset.archived` - Content deprecated
- `content.calendar.scheduled` - Content added to calendar

## Data Model (Planned)

- **ContentAsset** - Blog posts, articles, videos, images
- **ContentTemplate** - Reusable content structures
- **EditorialCalendar** - Publishing schedule
- **AssetVersion** - Content revision history
- **ContentTag** - Taxonomy and categorization
- **RepurposeChain** - Content transformation lineage

## Documentation

- **Full Specification:** See [BM-Marketing MODULE-PLAN](/docs/modules/bm-marketing/MODULE-PLAN.md#bm-content)
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-content.*` handles defined in architecture doc

---

*Module Status: Awaiting implementation after BM-Marketing core*
