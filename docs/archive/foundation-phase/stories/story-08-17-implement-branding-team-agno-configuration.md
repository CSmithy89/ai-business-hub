# Story 08.17: Implement Branding Team Agno Configuration

**Story ID:** 08.17
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 4
**Priority:** P1
**Dependencies:** Story 08.16

---

## User Story

**As a** user
**I want** the branding team agents configured
**So that** AI agents can help develop my brand identity

---

## Description

This story implements the Branding Team (BM-Brand) Agno configuration with Bella as team leader and 5 specialist agents (Sage, Vox, Iris, Artisan, Audit) to guide users through brand development.

---

## Acceptance Criteria

### Team Configuration
- [x] BrandingTeam class exists in AgentOS (`agents/branding/team.py`)
- [x] Team has Bella as leader
- [x] Team has Sage (Strategy), Vox (Voice), Iris (Visual), Artisan (Assets), Audit (QA) as members
- [x] Team receives business context from BMP session
- [x] Team can be invoked via `/api/branding/[businessId]/chat` endpoint

### Agent Configuration
- [x] Bella (Brand Orchestrator) agent configured
- [x] Sage (Brand Strategist) agent configured
- [x] Vox (Voice Architect) agent configured
- [x] Iris (Visual Identity Designer) agent configured
- [x] Artisan (Asset Generator) agent configured
- [x] Audit (Brand Auditor) agent configured

### Integration
- [x] API endpoint created for branding chat
- [x] BrandingSession model utilized
- [x] Workflow tracking integrated

---

## Technical Implementation Details

### Team Structure

```
Branding Team (BM-Brand)
├── Leader: Bella (Brand Orchestrator)
└── Members:
    ├── Sage (Brand Strategist)
    ├── Vox (Voice Architect)
    ├── Iris (Visual Identity Designer)
    ├── Artisan (Asset Generator)
    └── Audit (Brand Auditor)
```

### Workflow Functions

1. `run_brand_strategy` - Brand positioning, archetype, values
2. `run_brand_voice` - Tone, vocabulary, messaging templates
3. `run_visual_identity` - Colors, typography, logo concepts
4. `run_brand_guidelines` - Comprehensive documentation
5. `run_asset_generation` - Asset specifications

---

## Definition of Done

- [x] Python team configuration complete
- [x] All 6 agents configured
- [x] API endpoint created
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
