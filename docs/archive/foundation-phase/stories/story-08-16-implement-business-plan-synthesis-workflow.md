# Story 08.16: Implement Business Plan Synthesis Workflow

**Story ID:** 08.16
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.15

---

## User Story

**As a** user
**I want** to generate a comprehensive business plan document
**So that** I have an investor-ready business plan

---

## Description

This story implements the Business Plan Synthesis workflow where Blake (Planning Orchestrator) synthesizes all planning outputs into a professional business plan document with standard sections.

---

## Acceptance Criteria

### Document Generation
- [x] Blake synthesizes all planning outputs into business plan
- [x] Sections include: Executive Summary, Company Description, Market Analysis, Products/Services, Business Model, Go-to-Market, Operations, Management, Financials, Funding
- [x] Professional markdown document generated

### Storage & Export
- [x] Document URL saved to `PlanningSession.businessPlanUrl`
- [x] API endpoint at `/api/planning/[businessId]/business-plan`

### Integration
- [x] HITL approval before finalization
- [x] Integrate with planning page
- [x] Mark planning workflow as complete

---

## Technical Implementation Details

### Business Plan Structure

```typescript
interface BusinessPlan {
  sections: {
    executiveSummary: string;
    companyDescription: string;
    marketAnalysis: string;
    productsServices: string;
    businessModel: string;
    goToMarket: string;
    operations: string;
    management: string;
    financials: string;
    funding: string;
  };
  metadata: {
    version: string;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'final';
  };
}
```

### Workflow Steps
1. Gather all planning data (canvas, financials)
2. Gather validation data (market sizing, competitors, customers)
3. Generate each section based on available data
4. Request HITL approval
5. Generate final document

---

## Definition of Done

- [x] API endpoint created
- [x] All 10 sections generated
- [x] Document saved to PlanningSession
- [x] HITL approval flow working
- [x] Planning workflow marked complete
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
