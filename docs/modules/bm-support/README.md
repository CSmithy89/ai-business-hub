# BM-Support Module Documentation

## Unified Inbox & Customer Support Module

**Module Code:** `bm-support`
**Version:** 0.1.0 (Research Complete)
**Layer:** Operations (OPERATE Phase)
**Status:** Research Complete - PRD Pending

---

## Overview

The Unified Inbox & Customer Support Module (BM-Support) consolidates all customer communication channels into a single interface, powered by AI for intelligent routing and response assistance.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Unified Inbox** | All conversations from all channels in one place |
| **Multi-Channel** | Web widget, email, WhatsApp, SMS, social media |
| **Auto-Assignment** | Round-robin, balanced, team-based routing |
| **Automation Rules** | Event-driven triggers with conditions and actions |
| **AI Assistant (Captain)** | Intelligent response suggestions and knowledge search |
| **Canned Responses** | Pre-written quick replies with shortcodes |
| **Macros** | Multi-step action sequences |
| **CSAT Tracking** | Customer satisfaction measurement |
| **Real-Time Updates** | WebSocket-based live communication |
| **Embeddable Widget** | Chat widget SDK for websites |

---

## Research Status

| Phase | Status | Output |
|-------|--------|--------|
| Architecture Research | ✅ Complete | Chatwoot patterns analyzed |
| Data Model Design | ✅ Complete | Prisma models defined |
| Channel Architecture | ✅ Complete | Polymorphic channel pattern |
| Agent Architecture | ✅ Complete | 8 agents designed |
| Workflow Design | ✅ Complete | 10 workflows defined |
| Social Integration | ✅ Complete | BM-Social bridge designed |
| PRD | ⏳ Pending | Next step |

---

## Documentation

### Research
- [Research Findings](./research/BM-SUPPORT-RESEARCH-FINDINGS.md) - Comprehensive analysis
- [Research Checklist](./research/BM-SUPPORT-RESEARCH-CHECKLIST.md) - Completed tasks

### Coming Soon
- PRD.md - Product Requirements
- architecture.md - Technical Architecture
- ux/ - UX Design Pack

---

## Module Architecture

### Agent Team (8 Agents)

| Agent | Personality | Role |
|-------|-------------|------|
| **Hub** | Organized, efficient | Orchestrates all support activities |
| **Triage** | Analytical, fair | Routes and assigns conversations |
| **Reply** | Helpful, empathetic | Drafts and sends responses |
| **Automate** | Systematic, precise | Manages automation rules |
| **Quality** | Detail-oriented | Monitors quality and CSAT |
| **Captain** | Intelligent, helpful | AI-powered assistance |
| **Docs** | Knowledgeable | Manages knowledge base |
| **Escalate** | Calm, decisive | Handles escalations |

### Workflows (10)

1. `setup-inbox` - Create and configure new inbox
2. `handle-conversation` - Process customer conversation
3. `route-conversation` - Assign to appropriate agent
4. `respond-to-customer` - Send response
5. `create-automation` - Create automation rule
6. `manage-canned-responses` - Manage quick replies
7. `configure-widget` - Set up chat widget
8. `run-csat-survey` - Send satisfaction survey
9. `generate-reports` - Create performance reports
10. `escalate-issue` - Handle escalations

---

## Channel Support

### Phase 1 (MVP)
- Web Widget (live chat)
- Email (IMAP/SMTP)

### Phase 2
- WhatsApp (Cloud API)
- SMS (Twilio)
- Facebook Messenger

### Phase 3
- Instagram DMs
- Twitter DMs
- Telegram
- Social channels (via BM-Social)

---

## Reference System

Research based on [Chatwoot](https://github.com/chatwoot/chatwoot):
- Open-source customer engagement platform
- Rails 7.1 + Vue 3 stack
- Polymorphic channel architecture
- Action Cable real-time updates
- Sidekiq background jobs

---

## BM-Social Integration

BM-Support serves as THE unified inbox for customer communication. Social media engagement flows through:

```
BM-Social (Echo agent)
    ↓
Detects support-worthy mentions/comments
    ↓
BM-Support (Creates conversation)
    ↓
Agent responds in unified inbox
    ↓
BM-Social (Posts reply to platform)
```

---

## Dependencies

### Platform Foundation
- Socket.io for real-time
- BullMQ for background jobs
- PostgreSQL with pgvector
- RBAC permissions

### Cross-Module
- **BM-Social** - Social channel bridge
- **BM-CRM** - Contact sync
- **BMX** - Email channel
- **BMT** - Unified analytics

---

## Next Steps

1. Create PRD using `/bmad:bmm:workflows:prd`
2. Design detailed architecture
3. Create UX design pack
4. Implement widget SDK
5. Build agent dashboard

---

**Module Owner:** AI Business Hub Team
**Pipeline:** BM-CRM → BM-Support → BMT
**Last Updated:** 2025-12-17
