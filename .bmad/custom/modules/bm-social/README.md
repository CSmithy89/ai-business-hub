# BM-Social

AI-Powered Social Media Management Module

## Overview

BM-Social provides comprehensive social media management capabilities for the HYVVE platform, including:

- **Multi-Platform Posting** - Schedule to Twitter/X, LinkedIn, Facebook, Instagram, TikTok, YouTube, Pinterest, Threads, and Bluesky
- **Content Calendar** - Visual calendar with day/week/month views and drag-drop scheduling
- **AI Content Generation** - Generate posts, threads, and hooks using BYOAI providers
- **Analytics Dashboard** - Track performance metrics across all connected platforms
- **Social Listening** - Monitor brand mentions, sentiment, and competitive intelligence
- **Crisis Response** - Rapid response coordination for reputation management

## Installation

```bash
bmad install bm-social
```

## Components

### Agents (18)

#### Core Agents (6)

| Agent | Code | Role |
|-------|------|------|
| **Conductor** | social-orchestrator | Orchestrates all social activities |
| **Spark** | content-strategist | Content strategy & delegation |
| **Tempo** | scheduler | Manages posting schedules |
| **Pulse** | analytics | Performance analysis & reporting |
| **Echo** | engagement | Engagement & community management |
| **Scout** | trend-scout | Trend identification |

#### Platform Specialists (9)

| Agent | Platform |
|-------|----------|
| **Chirp** | Twitter/X |
| **Link** | LinkedIn |
| **Meta** | Facebook |
| **Gram** | Instagram |
| **Tok** | TikTok |
| **Tube** | YouTube |
| **Pin** | Pinterest |
| **Thread** | Threads |
| **Blue** | Bluesky/Mastodon |

#### Specialized Agents (3)

| Agent | Role |
|-------|------|
| **Sentinel** | Brand monitoring & alerts |
| **Radar** | Competitive intelligence |
| **Shield** | Crisis & reputation management |

### Workflows (15)

#### Core Workflows

1. `connect-platform` - Connect social media accounts
2. `create-post` - Create and publish posts
3. `schedule-content` - Schedule future posts
4. `generate-content` - AI-generate social content
5. `analyze-performance` - Review analytics
6. `manage-calendar` - Manage content calendar
7. `bulk-schedule` - Schedule multiple posts
8. `content-repurpose` - Adapt content across platforms

#### Extended Workflows

9. `campaign-launch` - Multi-platform campaigns
10. `crisis-response` - Handle negative PR
11. `influencer-outreach` - Influencer relationships
12. `competitor-analysis` - Monitor competitors
13. `hashtag-research` - Optimize hashtag strategy
14. `ugc-curation` - User-generated content
15. `report-generate` - Stakeholder reports

## Quick Start

1. **Load the main agent:**

   ```
   /bmad:bm-social:agents:social-orchestrator
   ```

2. **View available commands:**

   ```
   *help
   ```

3. **Connect a platform:**

   ```
   *connect
   ```

4. **Create your first post:**

   ```
   *create
   ```

## Module Structure

```
bm-social/
├── agents/
│   ├── core/                    # 6 core agents
│   ├── platform/                # 9 platform specialists
│   └── specialized/             # 3 specialized agents
├── workflows/
│   ├── core/                    # 8 core workflows
│   └── extended/                # 7 extended workflows
├── tasks/                       # 12 task files
├── templates/                   # Shared templates
├── data/                        # Module data files
├── _module-installer/           # Installation config
└── README.md
```

## Configuration

The module can be configured in `.bmad/bm-social/config.yaml`

Key settings:

- `social_output_path` - Where to save content and reports
- `default_platforms` - Platforms enabled by default
- `automation_level` - Manual, assisted, or autonomous
- `approval_threshold` - Confidence score for auto-approval
- `enable_listening` - Enable social listening features

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

## Development Status

See [TODO.md](./TODO.md) for development roadmap.

## Author

Created by chris on 2025-12-17

---

**Module Code:** `bm-social`
**Version:** 1.0.0
**Layer:** Operations (OPERATE Phase)
