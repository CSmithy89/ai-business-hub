# Story 08.9: Implement Competitor Mapping Workflow

**Story ID:** 08.9
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.7 (Idea Intake Workflow)

---

## User Story

**As a** user
**I want** competitive analysis
**So that** I understand the competitive landscape

---

## Description

This story implements the Competitor Mapping workflow where Cipher (Competitor Analysis Specialist) identifies direct and indirect competitors, analyzes positioning, and finds market opportunities.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `competitor-mapping` workflow task
- [x] Cipher agent identifies:
  - Direct competitors (same solution, same market)
  - Indirect competitors (different solution, same problem)
  - Substitute products
- [x] Analyze each competitor: pricing, features, strengths, weaknesses
- [x] Create positioning map visualization data
- [x] Identify opportunity gaps
- [x] All claims require source URLs

### API Integration
- [x] Create `/api/validation/[businessId]/competitor-mapping` endpoint
- [x] Support POST to run competitor analysis
- [x] Return structured competitor output

---

## Technical Implementation Details

### Output Schema

```typescript
interface CompetitorMappingOutput {
  competitors: Array<{
    name: string;
    type: 'direct' | 'indirect' | 'substitute';
    pricing: string;
    features: string[];
    strengths: string[];
    weaknesses: string[];
    market_position: string;
    source_url?: string;
  }>;
  positioning_map: {
    x_axis: string;
    y_axis: string;
    positions: Array<{
      name: string;
      x: number;
      y: number;
    }>;
  };
  opportunity_gaps: string[];
  porter_five_forces: {
    competitive_rivalry: string;
    supplier_power: string;
    buyer_power: string;
    threat_of_substitutes: string;
    threat_of_new_entrants: string;
  };
  next_workflow: 'customer_discovery';
}
```

---

## Definition of Done

- [x] Competitor mapping workflow implemented
- [x] Competitor profiles with sources
- [x] Positioning map data generated
- [x] API endpoint created
- [x] Data persists to ValidationSession
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
