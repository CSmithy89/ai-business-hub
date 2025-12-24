# BM-CMS - Content Management System

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P2

## Overview

BM-CMS is a **standalone module** providing website and blog content management capabilities. It handles page creation, blog publishing, landing pages, media management, and content scheduling for web properties.

**Note:** Each HYVVE module has built-in content creation for its domain (email templates, social posts, ad creatives). BM-CMS specifically manages **website content** - pages, blogs, and landing pages.

**Standalone with Built-in Analytics:** Includes its own content analytics dashboard (page views, engagement, conversions).

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-cms.publisher` | Publisher | Team Lead / Orchestrator | Planned |
| `@bm-cms.page` | Page | Page Builder - creates and manages web pages | Planned |
| `@bm-cms.blog` | Blog | Blog Manager - handles blog posts and articles | Planned |
| `@bm-cms.media` | Media | Media Library - manages images, videos, files | Planned |
| `@bm-cms.template` | Template | Template Designer - creates reusable layouts | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- BM-Brand (brand guidelines, visual identity for pages)
- BM-SEO (page optimization, meta tags, structured data)
- BM-Social (share published content)
- BM-Email (embed forms, capture leads)
- BM-Ads (landing pages for campaigns)
- BM-Analytics (AI-powered content recommendations)
- Core-PM (content projects and editorial calendar)

**Event Patterns:**
- `cms.page.created` - New page drafted
- `cms.page.published` - Page went live
- `cms.page.updated` - Page content changed
- `cms.blog.published` - Blog post published
- `cms.media.uploaded` - New media asset added
- `cms.form.submitted` - Website form submission

## Data Model (Planned)

- **Page** - Website pages with content blocks
- **BlogPost** - Blog articles with metadata
- **MediaAsset** - Images, videos, documents
- **Template** - Reusable page layouts
- **Form** - Contact forms, lead capture
- **Navigation** - Site menus and structure

## Inspiration Sources

| Source | URL | Key Features |
|--------|-----|--------------|
| Payload CMS | https://payloadcms.com | Modern headless CMS |
| Strapi | https://strapi.io | Open-source headless CMS |
| Sanity | https://www.sanity.io | Real-time collaboration |
| Ghost | https://ghost.org | Publishing platform |

## Documentation

- **Research:** See [MODULE-RESEARCH.md](/docs/archive/foundation-phase/MODULE-RESEARCH.md#610-bm-cms)
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-cms.*` handles defined in architecture doc

---

*Module Status: Standalone module - works independently, enhanced with other modules*
