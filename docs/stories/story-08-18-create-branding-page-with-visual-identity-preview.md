# Story 08.18: Create Branding Page with Visual Identity Preview

**Story ID:** 08.18
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 5
**Priority:** P1
**Dependencies:** Story 08.17

---

## User Story

**As a** user
**I want** a branding page with visual identity preview
**So that** I can see my brand identity develop in real-time

---

## Description

This story creates the branding page at `/dashboard/[businessId]/branding` with a chat interface to Bella (brand team leader), workflow progress tracking, visual identity preview panels, and asset gallery.

---

## Acceptance Criteria

### Page Structure
- [x] `/dashboard/[businessId]/branding` page exists
- [x] Header with business name and progress indicator
- [x] Chat interface with Bella (team leader)
- [x] Workflow progress sidebar

### Workflow Progress
- [x] Shows progress for all brand workflows:
  - Brand Strategy
  - Brand Voice
  - Visual Identity
  - Brand Guidelines
  - Asset Generation
  - Brand Audit

### Visual Identity Preview
- [x] Color palette visualization with hex codes
- [x] Typography samples with scale
- [x] Logo concept placeholder/description

### Asset Gallery
- [x] Asset list with status (pending/generated)
- [x] Download links for generated assets
- [x] Organized by category

### Integration
- [x] Connects to `/api/branding/[businessId]/chat` API
- [x] Updates BrandingSession data
- [x] Shows visual feedback for workflow completion

---

## Technical Implementation Details

### Component Structure

```typescript
BrandingPage
├── BrandingHeader (progress indicator)
├── WorkflowProgress (sidebar)
├── ChatPanel
│   ├── ChatMessages
│   └── ChatInput
└── PreviewPanel
    ├── ColorPalettePreview
    ├── TypographyPreview
    └── AssetGallery
```

### Layout
- Desktop: 3-column (progress | chat | preview)
- Mobile: Stacked with tabs

---

## Definition of Done

- [x] Page created with all sections
- [x] Chat interface working
- [x] Visual preview components
- [x] API integration complete
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
