# Story 08.14: Implement Business Model Canvas Workflow

**Story ID:** 08.14
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.12

---

## User Story

**As a** user
**I want** to create a Business Model Canvas with AI guidance
**So that** I can visualize and structure my business model

---

## Description

This story implements the Business Model Canvas workflow where the Model agent guides users through the 9 canvas blocks. The workflow pre-fills data from validation where available and generates a visual canvas output.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `/api/planning/[businessId]/business-model-canvas` API endpoint
- [x] Model agent guides through 9 canvas blocks
- [x] Canvas blocks: Customer Segments, Value Propositions, Channels, Customer Relationships, Revenue Streams, Key Resources, Key Activities, Key Partnerships, Cost Structure
- [x] Data pre-filled from validation where available

### Visual Output
- [x] Generate visual canvas representation
- [x] Results saved to `PlanningSession.canvas`
- [x] Canvas data structured as JSON with all 9 blocks

### Integration
- [x] Integrate with planning page chat interface
- [x] Show canvas preview in artifacts panel
- [x] Update workflow progress on completion

---

## Technical Implementation Details

### Business Model Canvas Structure

```typescript
interface BusinessModelCanvas {
  customer_segments: CanvasBlock;
  value_propositions: CanvasBlock;
  channels: CanvasBlock;
  customer_relationships: CanvasBlock;
  revenue_streams: CanvasBlock;
  key_resources: CanvasBlock;
  key_activities: CanvasBlock;
  key_partnerships: CanvasBlock;
  cost_structure: CanvasBlock;
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    completionPercentage: number;
  };
}

interface CanvasBlock {
  items: string[];
  notes: string;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
}
```

### Workflow Steps

1. **Customer Segments** - Who are your most important customers?
2. **Value Propositions** - What value do you deliver?
3. **Channels** - How do you reach customers?
4. **Customer Relationships** - What relationships do you establish?
5. **Revenue Streams** - How do you generate revenue?
6. **Key Resources** - What key resources do you need?
7. **Key Activities** - What key activities must you perform?
8. **Key Partnerships** - Who are your key partners?
9. **Cost Structure** - What are your most important costs?

### Pre-fill from Validation

| Canvas Block | Validation Source |
|--------------|-------------------|
| Customer Segments | `targetCustomer`, `customerProfile` |
| Value Propositions | `proposedSolution`, `valueProposition` |
| Revenue Streams | `revenueModel` from hypothesis |
| Key Resources | Extracted from `problemStatement` |

---

## Definition of Done

- [x] API endpoint created at correct route
- [x] 9 canvas blocks guided by Model agent
- [x] Pre-fill from validation data working
- [x] Canvas saved to PlanningSession
- [x] Integration with planning page
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
