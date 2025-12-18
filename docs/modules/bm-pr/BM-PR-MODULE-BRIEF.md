# BM-PR Module Brief

**Module Code:** `bm-pr`
**Version:** 0.1.0
**Layer:** Operations (OPERATE Phase)
**Status:** Brief
**Dependencies:** `bm-crm`, `bm-brand`, `bm-social`

---

## Executive Summary

The Public Relations Module (`bm-pr`) is a specialized suite for managing media relations, press distribution, and corporate communications. Unlike `bm-social` which focuses on algorithmic distribution to audiences, `bm-pr` focuses on relational distribution to gatekeepers (journalists, editors, influencers).

It effectively replaces tools like Cision, Muck Rack, and Prowly by leveraging the AgentOS for personalized pitching and media monitoring.

### Core Value Proposition
- **Automated Pitching:** AI agents that research journalists and write hyper-personalized pitches.
- **Dynamic Newsroom:** A self-updating press center hosted on the business domain.
- **Media Monitoring:** Tracking brand mentions across news, print, and broadcast (distinct from social).
- **Relationship Management:** A specialized CRM view for cultivating long-term journalist relationships.

---

## Module Architecture

### Agent Team (5 Agents)

| Agent | Code Name | Role | Key Capabilities |
|-------|-----------|------|------------------|
| **Chief Comms Officer** | `comms-director` | Strategy & Orchestration | PR strategy, crisis comms, message alignment |
| **Pitch Perfect** | `media-relations` | Outreach & Pitching | Journalist research, pitch writing, follow-up management |
| **Newswire** | `press-distributor` | Content & Distribution | Press release writing, wire distribution, newsroom management |
| **Newshound** | `media-monitor` | Monitoring & Analysis | News tracking, sentiment analysis, share of voice |
| **Rolodex** | `media-researcher` | Data & Contacts | Database maintenance, contact verification, list building |

### Core Workflows

1.  **`develop-pr-strategy`**
    *   Input: Business goals, `bm-brand` identity.
    *   Output: PR calendar, target media list, key messaging points.

2.  **`distribute-press-release`**
    *   Input: News topic (product launch, funding, etc.).
    *   Process: `Newswire` writes release -> `Brand` approves -> Distributes to Wire Services + Updates Newsroom.

3.  **`pitch-journalist`**
    *   Input: Story angle.
    *   Process: `Rolodex` finds relevant journalists -> `Pitch Perfect` drafts personalized emails -> User approves -> Sequences follow-ups.

4.  **`monitor-coverage`**
    *   Input: Keywords, Competitors.
    *   Process: `Newshound` scans news APIs -> Alerts on coverage -> Sentiment analysis -> Impact report.

5.  **`manage-crisis`**
    *   Input: Negative event.
    *   Process: `Comms Director` activates protocol -> Drafts statements -> Coordinates with `bm-social` -> Monitors fallout.

---

## Integration Points

| Module | Integration |
|--------|-------------|
| **BM-CRM** | Stores journalist contacts as a specialized `Contact` type with `MediaOutlet` relations. |
| **BM-Social** | `bm-pr` pushes news to `bm-social` for amplification; `bm-social` alerts `bm-pr` of viral trends. |
| **BM-Brand** | Source of truth for logos, bios, and tone of voice for all press materials. |

## Data Models (Draft)

- **MediaContact:** Extends CRM Contact (Beat, Outlet, Pitch Preferences).
- **PressRelease:** Title, Body, Embargo Date, Assets.
- **PitchCampaign:** Series of emails/interactions with a media list.
- **Coverage:** Record of a published article/clip with sentiment and reach metrics.
- **Newsroom:** Configuration for the public-facing press page.

---

## Recommendation
This module is **High Value** for B2B and High-Growth startups (the target of Ai Business Hub). It complements `bm-social` by handling the "Credibility" layer of marketing while Social handles "Visibility".
