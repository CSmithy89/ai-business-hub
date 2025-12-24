# BM-Content - Content Marketing Management

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P2

## Overview

BM-Content is a **standalone module** providing comprehensive content marketing capabilities. It handles content creation, asset management, editorial planning, content repurposing, and multi-channel distribution.

**Standalone with Built-in Analytics:** Includes its own content performance dashboard. Provides assets to any installed module via A2A. When BM-Analytics is installed, AI-powered content optimization recommendations are enabled.

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

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- BM-Brand (brand guidelines, voice, visual identity)
- BM-Marketing (campaign-coordinated content)
- BM-Email (provides email content assets)
- BM-Social (provides social media content)
- BM-Ads (provides ad creative assets)
- BM-SEO (SEO-optimized content, keyword research)
- BM-Analytics (AI-powered content recommendations)
- Core-PM (editorial projects and tasks)

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

*Module Status: Standalone module - works independently, enhanced with other modules*
