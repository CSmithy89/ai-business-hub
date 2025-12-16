# BM-Social Module Documentation

## Social Media Management Module

**Module Code:** `bm-social`
**Version:** 0.1.0 (Research Complete)
**Layer:** Operations (OPERATE Phase)
**Status:** Research Complete - PRD Pending

---

## Overview

The Social Media Management Module (BM-Social) provides AI-powered social media scheduling, content creation, and analytics across multiple platforms.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Multi-Platform Posting** | Schedule to Twitter/X, LinkedIn, Facebook, Instagram, TikTok, YouTube, Pinterest, Threads |
| **Content Calendar** | Visual calendar with day/week/month views and drag-drop scheduling |
| **AI Content Generation** | Generate posts, threads, and hooks using BYOAI providers |
| **Analytics Dashboard** | Track performance metrics across all connected platforms |
| **Team Collaboration** | Role-based access with approval workflows |
| **Auto-Posting** | AI-generated content with configurable automation rules |

---

## Research Status

| Phase | Status | Output |
|-------|--------|--------|
| Architecture Research | ✅ Complete | Postiz patterns analyzed |
| Data Model Design | ✅ Complete | Prisma models defined |
| Provider Framework | ✅ Complete | SocialProvider interface |
| Agent Architecture | ✅ Complete | 6 agents designed |
| Workflow Design | ✅ Complete | 8 workflows defined |
| PRD | ⏳ Pending | Next step |

---

## Documentation

### Research
- [Research Findings](./research/BM-SOCIAL-RESEARCH-FINDINGS.md) - Comprehensive analysis
- [Research Checklist](./research/BM-SOCIAL-RESEARCH-CHECKLIST.md) - Completed tasks

### Coming Soon
- PRD.md - Product Requirements
- architecture.md - Technical Architecture
- ux/ - UX Design Pack

---

## Module Architecture

### Agent Team (15 Agents: 6 Core + 9 Platform Specialists)

#### Core Agents

| Agent | Personality | Role |
|-------|-------------|------|
| **Conductor** | Strategic, organized | Orchestrates all social activities |
| **Spark** | Creative, brand-focused | Content strategy & delegation |
| **Tempo** | Precise, analytical | Manages posting schedules |
| **Pulse** | Data-driven, insightful | Analyzes performance |
| **Echo** | Responsive, social | Manages engagement |
| **Scout** | Curious, connected | Identifies trends |

#### Platform Specialists

| Agent | Platform | Specializations |
|-------|----------|-----------------|
| **Chirp** | Twitter/X | Threads, hooks, viral tactics |
| **Link** | LinkedIn | B2B tone, thought leadership, carousels |
| **Meta** | Facebook | Pages, groups, community building |
| **Gram** | Instagram | Visual-first, Reels, Stories, hashtags |
| **Tok** | TikTok | Trend-jacking, hooks, native style |
| **Tube** | YouTube | Titles, thumbnails, Shorts, SEO |
| **Pin** | Pinterest | Pins, boards, visual search |
| **Thread** | Threads | Conversational, cross-posting |
| **Blue** | Bluesky/Mastodon | Decentralized, community norms |

### Workflows (8)

1. `connect-platform` - Connect social media accounts
2. `create-post` - Create and publish posts
3. `schedule-content` - Schedule future posts
4. `generate-content` - AI-generate social content
5. `analyze-performance` - Review analytics
6. `manage-calendar` - Manage content calendar
7. `bulk-schedule` - Schedule multiple posts
8. `content-repurpose` - Adapt content across platforms

---

## Platform Support

### Phase 1 (MVP)
- Twitter/X
- LinkedIn (Personal + Pages)
- Facebook Pages

### Phase 2
- Instagram (Business)
- TikTok
- YouTube

### Phase 3
- Pinterest
- Threads
- Bluesky/Mastodon

---

## Reference System

Research based on [Postiz](https://github.com/gitroomhq/postiz-app):
- Open-source social media scheduling platform
- NestJS + Next.js + Prisma stack
- Provider abstraction pattern
- BullMQ worker architecture

---

## Dependencies

### Platform Foundation
- BullMQ worker infrastructure
- OAuth provider registry
- RBAC permissions
- Approval queue system

### Cross-Module
- **BM-Brand** - Brand voice for content
- **BMC** - Article-to-social conversion
- **BM-CRM** - Contact tagging
- **BMT** - Unified analytics

---

## Next Steps

1. Create PRD using `/bmad:bmm:workflows:prd`
2. Design detailed architecture
3. Create UX design pack
4. Implement provider framework
5. Build calendar UI

---

**Module Owner:** AI Business Hub Team
**Pipeline:** BMC → BM-Social → BMT
**Last Updated:** 2025-12-17
