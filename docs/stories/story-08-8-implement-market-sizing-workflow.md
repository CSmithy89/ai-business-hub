# Story 08.8: Implement Market Sizing Workflow

**Story ID:** 08.8
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.7 (Idea Intake Workflow)

---

## User Story

**As a** user
**I want** accurate market size calculations
**So that** I understand the opportunity size

---

## Description

This story implements the Market Sizing workflow where Marco (Market Research Specialist) calculates TAM/SAM/SOM using multiple methodologies. All claims require at least 2 independent sources with proper citations and confidence levels.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `market-sizing` workflow task
- [x] Marco agent calculates:
  - TAM (Total Addressable Market)
  - SAM (Serviceable Available Market)
  - SOM (Serviceable Obtainable Market)
- [x] Use multiple methodologies (top-down, bottom-up)
- [x] Require minimum 2 sources per claim
- [x] Include confidence levels (high/medium/low)

### Source Validation
- [x] Sources must be < 24 months old
- [x] Store sources in ValidationSession.marketSizing
- [x] Display results with source citations
- [x] Mark confidence: [Verified], [Single Source], [Estimated]

### API Integration
- [x] Create `/api/validation/[businessId]/market-sizing` endpoint
- [x] Support POST to run market sizing
- [x] Return structured market sizing output

---

## Technical Implementation Details

### Output Schema

```typescript
interface MarketSizingOutput {
  tam: {
    value: number;
    formatted: string;
    methodology: string;
    confidence: 'high' | 'medium' | 'low';
    sources: Array<{
      name: string;
      url?: string;
      date: string;
    }>;
  };
  sam: {
    value: number;
    formatted: string;
    constraints: string[];
    confidence: 'high' | 'medium' | 'low';
    sources: Array<{
      name: string;
      url?: string;
      date: string;
    }>;
  };
  som: {
    conservative: number;
    realistic: number;
    optimistic: number;
    assumptions: string[];
    confidence: 'high' | 'medium' | 'low';
  };
  overall_confidence: 'high' | 'medium' | 'low';
  next_workflow: 'competitor_mapping';
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Market sizing output validation
- [ ] Source confidence scoring

### Integration Tests
- [ ] Full market sizing workflow

---

## Definition of Done

- [x] Market sizing workflow implemented
- [x] TAM/SAM/SOM calculations with sources
- [x] API endpoint created
- [x] Data persists to ValidationSession
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

## Related Documentation

- [Epic 08: Business Onboarding](../epics/EPIC-08-business-onboarding.md)
- [Story 08.7: Idea Intake Workflow](./story-08-7-implement-idea-intake-workflow.md)

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
