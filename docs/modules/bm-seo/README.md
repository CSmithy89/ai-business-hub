# BM-SEO - Search Engine Optimization

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P2

## Overview

BM-SEO is a **standalone module** providing comprehensive search engine optimization capabilities. It handles site auditing, keyword research, on-page optimization, technical SEO, and rank tracking to improve organic search visibility.

**Standalone with Built-in Analytics:** Includes its own SEO analytics dashboard. When BM-Marketing is installed, campaigns can include SEO as a channel. When BM-Analytics is installed, AI-powered SEO recommendations are enabled.

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-seo.crawler` | Crawler | Team Lead / Site Auditor - scans site for issues | Planned |
| `@bm-seo.keyword` | Keyword | Keyword Researcher - identifies search opportunities | Planned |
| `@bm-seo.onpage` | OnPage | On-Page Optimizer - optimizes content and meta | Planned |
| `@bm-seo.technical` | Technical | Technical SEO Specialist - site speed, structure | Planned |
| `@bm-seo.rank` | Rank | Rank Tracker - monitors SERP positions | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- BM-Marketing (included in multi-channel campaigns)
- BM-CMS (shares keyword research for page optimization)
- BM-Ads (shares keyword intelligence for paid campaigns)
- BM-Analytics (AI-powered ranking recommendations)
- Core-PM (SEO projects and task tracking)

**Event Patterns:**
- `seo.audit.started` - Site crawl initiated
- `seo.audit.completed` - Audit results ready
- `seo.issue.detected` - SEO problem found
- `seo.issue.resolved` - Problem fixed
- `seo.rank.changed` - Keyword position shifted
- `seo.keyword.discovered` - New opportunity identified

## Data Model (Planned)

- **SEOAudit** - Site-wide technical audit results
- **KeywordTarget** - Target keywords with metrics
- **RankHistory** - SERP position tracking over time
- **PageOptimization** - Per-page SEO scores and recommendations
- **TechnicalIssue** - Crawl errors, speed issues, schema problems
- **BacklinkProfile** - Inbound link analysis

## Documentation

- **Full Specification:** See [BM-Marketing MODULE-PLAN](/docs/modules/bm-marketing/MODULE-PLAN.md#bm-seo)
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-seo.*` handles defined in architecture doc

---

*Module Status: Standalone module - works independently, enhanced with other modules*
