# BM-PM: Project Management Module

> **Status**: Planning / Architecture
> **Module Code**: BM-PM
> **Last Updated**: 2025-11-28

## Overview

The Project Management module (BM-PM) serves as the higher-level container for all product development within AI Business Hub. It enables users to manage multiple businesses, each containing various products (BME-Course, BME-Podcast, BME-Book, etc.) that progress through BMAD methodology phases with AI agent assistance.

## Key Features

- **Business Context Switching** - Users can switch between different businesses, with all modules loading dependent data
- **Product Management** - Color-coded product containers with dedicated agent teams
- **BMAD Phase Tracking** - Time-boxed phases mapped to BMAD methodology (BUILD phases 1-7 + OPERATE loops)
- **Agent Task Assignment** - Tasks can be assigned to humans, AI agents, or hybrid combinations
- **Approval Workflows** - Confidence-based auto-approval with human review gates
- **Real-time Updates** - WebSocket-based progress streaming and notifications
- **Analytics Dashboard** - Product progress, phase status, agent activity, and more

## Core Hierarchy

```
Business (Workspace Context)
├── Product (BME-Course, BME-Podcast, BME-Book, etc.)
│   ├── Phase (BMAD phases: Brief, Requirements, Architecture, etc.)
│   │   ├── Task (Agent-assigned work items)
│   │   │   └── Subtasks & Checklists
```

## Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | Full architecture specification with data models, integrations, and UI mockups |
| [research/plane-analysis.md](./research/plane-analysis.md) | Deep-dive into Plane patterns applicable to BM-PM |
| [research/sdk-layer-integration.md](./research/sdk-layer-integration.md) | SDK client integration for Remote Coding Agents (Claude Code, Codex, CCR Router) |

## Research Sources

This module's architecture is informed by analysis of:

1. **Taskosaur** - Task management, Kanban boards, sprint planning, real-time updates
2. **Plane** - Module/Cycle patterns, Views system, Inbox triage, Analytics

See [/docs/research/taskosaur-analysis.md](/docs/research/taskosaur-analysis.md) for the full pattern research.

## Implementation Roadmap

| Sprint | Focus |
|--------|-------|
| Sprint 1 | Business/Product data models, basic CRUD APIs |
| Sprint 2 | Phase management with BMAD templates |
| Sprint 3 | Task system with agent assignment |
| Sprint 4 | Real-time updates and agent activity streaming |
| Sprint 5 | Analytics dashboard (Critical metrics) |
| Sprint 6 | Views and saved filters |
| Future | Advanced analytics, predictive completion, cost analysis |

## Related Modules

- **BM-CORE** - Core infrastructure (auth, queue, notifications)
- **BM-AI** - Agent orchestration with Agno
- **BME-*** - Product-specific modules (Course, Podcast, Book, etc.)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hierarchy Model | Business → Product → Phase → Task | Aligns with BMAD methodology and business-centric vision |
| Real-time | WebSocket + Y.js (future) | Proven patterns from Taskosaur/Plane |
| Task Assignment | Human / Agent / Hybrid | Flexibility for different task types |
| Approval Flow | Confidence-based auto-approval | Balances automation with human oversight |

## Open Questions

1. Should we implement Plane's Inbox pattern for agent output triage?
2. What's the right granularity for BMAD phase templates?
3. How deep should the Plane implementation research go before building?

---

## Quick Links

- [MASTER-PLAN](/docs/MASTER-PLAN.md) - Overall architecture vision
- [MODULE-RESEARCH](/docs/MODULE-RESEARCH.md) - Module discovery and planning
- [Taskosaur Analysis](/docs/research/taskosaur-analysis.md) - Pattern research
