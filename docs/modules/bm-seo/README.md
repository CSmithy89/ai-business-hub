# BM-SEO - Search Engine Optimization

> **Status:** Planning | **Parent:** BM-Marketing | **Priority:** P2

## Overview

BM-SEO is an extension module for BM-Marketing that provides comprehensive search engine optimization capabilities. It handles site auditing, keyword research, on-page optimization, technical SEO, and rank tracking to improve organic search visibility.

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-seo.crawler` | Crawler | Team Lead / Site Auditor - scans site for issues | Planned |
| `@bm-seo.keyword` | Keyword | Keyword Researcher - identifies search opportunities | Planned |
| `@bm-seo.onpage` | OnPage | On-Page Optimizer - optimizes content and meta | Planned |
| `@bm-seo.technical` | Technical | Technical SEO Specialist - site speed, structure | Planned |
| `@bm-seo.rank` | Rank | Rank Tracker - monitors SERP positions | Planned |

## Key Integrations

**Requires:**
- BM-Marketing (parent module - marketing goals, target audiences)

**Consumed By:**
- BM-Content (content optimization recommendations)
- BM-Ads (keyword intelligence for paid campaigns)
- Core-PM (SEO tasks and projects)

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

*Module Status: Awaiting implementation after BM-Marketing core*
