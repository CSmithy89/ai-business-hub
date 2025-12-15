# Story 08.10: Implement Customer Discovery Workflow

**Story ID:** 08.10
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.7 (Idea Intake Workflow)

---

## User Story

**As a** user
**I want** customer profiles and personas
**So that** I understand who my customers are

---

## Description

This story implements the Customer Discovery workflow where Persona (Customer Research Specialist) develops Ideal Customer Profiles (ICP), buyer personas, and Jobs-to-be-Done (JTBD) analysis.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `customer-discovery` workflow task
- [x] Persona agent develops:
  - Ideal Customer Profile (ICP)
  - 3 buyer personas with emotional truth
  - Jobs-to-be-Done analysis
- [x] Validate willingness to pay, not just interest
- [x] Segment prioritization

### API Integration
- [x] Create `/api/validation/[businessId]/customer-discovery` endpoint
- [x] Support POST to run customer discovery
- [x] Return structured customer profile output

---

## Technical Implementation Details

### Output Schema

```typescript
interface CustomerDiscoveryOutput {
  icp: {
    segment: string;
    industry: string;
    company_size: string;
    characteristics: string[];
    must_haves: string[];
    disqualifiers: string[];
    confidence: 'high' | 'medium' | 'low';
  };
  personas: Array<{
    name: string;
    title: string;
    demographics: string;
    goals: string[];
    frustrations: string[];
    objections: string[];
    representative_quote: string;
  }>;
  jtbd: {
    functional_jobs: string[];
    emotional_jobs: string[];
    social_jobs: string[];
    opportunity_scores: Array<{
      job: string;
      importance: number;
      satisfaction: number;
      opportunity: number;
    }>;
  };
  willingness_to_pay: {
    assessment: string;
    price_sensitivity: 'low' | 'medium' | 'high';
    value_drivers: string[];
  };
  recommended_segment: string;
  next_workflow: 'validation_synthesis';
}
```

---

## Definition of Done

- [x] Customer discovery workflow implemented
- [x] ICP with confidence score
- [x] 3 personas with representative quotes
- [x] JTBD analysis
- [x] API endpoint created
- [x] Data persists to ValidationSession
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
