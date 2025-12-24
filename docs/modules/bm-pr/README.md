# BM-PR - Public Relations

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P3

## Overview

BM-PR is a **standalone module** providing comprehensive public relations capabilities including PR strategy, media relations, press release distribution, media coverage tracking, and journalist/outlet database management.

**Standalone with Built-in Analytics:** Includes its own PR analytics dashboard (coverage, reach, sentiment). Works independently with full functionality.

## Agent Team (5)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-pr.chief` | Chief | PR Strategy - develops communication strategies | Planned |
| `@bm-pr.pitcher` | Pitcher | Media Relations - pitches stories to journalists | Planned |
| `@bm-pr.wire` | Wire | Press Distribution - distributes press releases | Planned |
| `@bm-pr.monitor` | Monitor | Media Tracking - monitors coverage and mentions | Planned |
| `@bm-pr.contacts` | Contacts | Media Database - manages journalist relationships | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- BM-Brand (brand messaging, voice guidelines)
- BM-Marketing (campaign alignment)
- BM-Social (press coverage amplification)
- BM-CRM (media contact management - extends Contact model)
- BM-Analytics (AI-powered PR recommendations)
- Core-PM (PR campaign projects)

**Event Patterns:**
- `pr.release.drafted` - Press release created
- `pr.release.approved` - Release approved for distribution
- `pr.release.distributed` - Release sent to media
- `pr.pitch.sent` - Story pitch delivered
- `pr.pitch.accepted` - Journalist interested
- `pr.coverage.detected` - Media mention found
- `pr.coverage.analyzed` - Sentiment/reach analyzed

## Data Model (Planned)

- **PressRelease** - Official company announcements
- **MediaPitch** - Story pitches to journalists
- **MediaOutlet** - Publications and media companies
- **MediaContact** - Journalist and editor contacts (extends CRM Contact)
- **Coverage** - Media mentions and articles
- **PRCampaign** - Coordinated PR efforts

## Documentation

- **Module Brief:** See [BM-PR-MODULE-BRIEF.md](./BM-PR-MODULE-BRIEF.md)
- **Research:** See [research/](./research/) directory
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-pr.*` handles defined in architecture doc

---

*Module Status: Standalone module - works independently, enhanced with other modules*
