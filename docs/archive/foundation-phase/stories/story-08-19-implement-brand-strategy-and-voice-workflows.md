# Story 08.19: Implement Brand Strategy and Voice Workflows

**Story ID:** 08.19
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 4
**Priority:** P1
**Dependencies:** Story 08.18

---

## User Story

**As a** user
**I want** to develop brand strategy and voice guidelines
**So that** I have consistent brand positioning and messaging

---

## Description

This story implements the Brand Strategy (Sage) and Brand Voice (Vox) workflows, which create brand positioning, archetype selection, core values, and voice guidelines.

---

## Acceptance Criteria

### Brand Strategy (Sage)
- [x] Sage determines brand archetype from 12 archetypes
- [x] Core values (3-5) identified
- [x] Personality traits and positioning statement created
- [x] Tagline options generated
- [x] Results saved to `BrandingSession.positioning`

### Brand Voice (Vox)
- [x] Vox defines tone of voice (formal/casual, etc.)
- [x] Vocabulary guidelines (do/don't say) provided
- [x] Messaging templates and content pillars defined
- [x] Results saved to `BrandingSession.voiceGuidelines`

### API Endpoints
- [x] `/api/branding/[businessId]/brand-strategy` endpoint
- [x] `/api/branding/[businessId]/brand-voice` endpoint

---

## Definition of Done

- [x] Brand strategy workflow API created
- [x] Brand voice workflow API created
- [x] Results saved to BrandingSession
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
