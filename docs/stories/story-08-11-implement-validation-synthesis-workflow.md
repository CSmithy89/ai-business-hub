# Story 08.11: Implement Validation Synthesis Workflow

**Story ID:** 08.11
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 5
**Priority:** P0
**Dependencies:** Stories 08.7-08.10 (All validation workflows)

---

## User Story

**As a** user
**I want** a final validation recommendation
**So that** I know whether to proceed with my business idea

---

## Description

This story implements the Validation Synthesis workflow where Vera (Validation Lead) and Risk (Feasibility Analyst) combine all findings into a final go/no-go recommendation with validation score, key strengths, risks, and next steps.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `validation-synthesis` workflow task
- [x] Combine findings from:
  - Market sizing (TAM/SAM/SOM)
  - Competitor analysis
  - Customer discovery
- [x] Risk agent provides feasibility assessment
- [x] Calculate overall validation score (0-100)
- [x] Generate go/no-go recommendation

### Recommendation Types
- [x] GO: Proceed to planning (score >= 70)
- [x] CONDITIONAL_GO: Proceed with conditions (score 50-69)
- [x] PIVOT: Consider alternative direction (has opportunities)
- [x] NO_GO: Do not proceed (score < 50 or fatal risks)

### HITL Integration
- [x] Request approval for final recommendation
- [x] Include confidence level

### API Integration
- [x] Create `/api/validation/[businessId]/synthesis` endpoint
- [x] Support POST to run validation synthesis
- [x] Return final recommendation with score

---

## Technical Implementation Details

### Output Schema

```typescript
interface ValidationSynthesisOutput {
  validation_score: number;
  recommendation: 'GO' | 'CONDITIONAL_GO' | 'PIVOT' | 'NO_GO';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  key_strengths: string[];
  key_risks: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  conditions?: string[];
  pivot_suggestions?: string[];
  next_steps: string[];
  requires_approval: boolean;
}
```

---

## Definition of Done

- [x] Validation synthesis workflow implemented
- [x] Score calculation algorithm
- [x] Go/no-go recommendation logic
- [x] HITL approval integration
- [x] API endpoint created
- [x] Updates ValidationSession with final results
- [x] Updates Business.validationStatus
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
