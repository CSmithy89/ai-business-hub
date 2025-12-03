# HYVVE Platform - Project Overview

## Purpose
HYVVE is an AI-powered business orchestration platform designed to achieve **90% automation with ~5 hours/week human involvement** for SMB businesses.

## The 90/5 Promise
- AI agents handle routine operations autonomously
- Humans approve only strategic decisions
- Confidence-based routing:
  - >85% confidence → auto-execute
  - 60-85% confidence → quick approval
  - <60% confidence → full review

## Current Phase
Foundation Build (EPIC-00 through EPIC-07)

## Key Documentation
- `docs/prd.md` - Product requirements
- `docs/architecture.md` - Technical decisions, ADRs
- `docs/ux-design.md` - User flows and design
- `docs/epics/EPIC-INDEX.md` - Development roadmap
- `docs/sprint-artifacts/sprint-status.yaml` - Current sprint status

## Development Method
This project uses the **BMAD Method** (Business Model Agile Development) with workflows in `.bmad/` directory.

## Multi-Tenant Architecture
All data models include tenant isolation via `workspaceId`. Every tenant-scoped model needs:
- `workspaceId` field (required for RLS)
- `@@index([workspaceId])` for performance

## Repository
GitHub: CSmithy89/ai-business-hub
