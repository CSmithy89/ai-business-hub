# Story 08.7: Implement Idea Intake Workflow

**Story ID:** 08.7
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P0
**Dependencies:** Story 08.5 (Validation Team Agno Configuration)

---

## User Story

**As a** user
**I want** a structured idea intake process
**So that** my business idea is captured completely

---

## Description

This story implements the first validation workflow - Idea Intake. Vera guides users through a structured process to capture their business idea, including the problem being solved, target customer, proposed solution, and initial business model hypothesis.

---

## Acceptance Criteria

### Workflow Implementation
- [x] Create `idea-intake` workflow task in Agno
- [x] Vera asks clarifying questions to understand:
  - Problem being solved
  - Target customer
  - Proposed solution
  - Initial business model hypothesis
- [x] Structure captured data into standardized format
- [x] Store in `ValidationSession.ideaDescription`
- [x] Allow editing of captured idea

### Structured Output
- [x] Define Pydantic model for IdeaIntakeOutput
- [x] Include problem_statement, target_customer, proposed_solution
- [x] Include initial_hypothesis (value_proposition, revenue_model)
- [x] Include clarifying_answers from conversation

### API Integration
- [x] Create `/api/validation/[businessId]/idea-intake` endpoint
- [x] Support POST for new idea intake
- [x] Support PUT for updating captured idea
- [x] Return structured idea output

---

## Technical Implementation Details

### Output Schema

```typescript
interface IdeaIntakeOutput {
  problem_statement: string;
  target_customer: string;
  proposed_solution: string;
  initial_hypothesis: {
    value_proposition: string;
    revenue_model: string;
  };
  clarifying_answers: Array<{
    question: string;
    answer: string;
  }>;
  confidence_score: number;
  next_workflow: 'market_sizing';
}
```

### API Endpoint

```typescript
// apps/web/src/app/api/validation/[businessId]/idea-intake/route.ts

export async function POST(request: Request, { params }: { params: { businessId: string } }) {
  // 1. Get user message from request body
  // 2. Call Python agent team via bridge
  // 3. Return structured idea output
}

export async function PUT(request: Request, { params }: { params: { businessId: string } }) {
  // 1. Get updated idea data from request body
  // 2. Update ValidationSession.ideaDescription
  // 3. Return updated data
}
```

---

## Testing Requirements

### Unit Tests
- [ ] IdeaIntakeOutput validation
- [ ] Workflow state management

### Integration Tests
- [ ] Full idea intake conversation flow
- [ ] Database persistence

---

## Definition of Done

- [x] Idea intake workflow implemented in Agno
- [x] Structured output schema defined
- [x] API endpoint created
- [x] Data persists to ValidationSession
- [x] Workflow triggers next step
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

## Related Documentation

- [Epic 08: Business Onboarding](../epics/EPIC-08-business-onboarding.md)
- [Story 08.5: Validation Team Configuration](./story-08-5-implement-validation-team-agno-configuration.md)
- [Story 08.6: Validation Chat Interface](./story-08-6-create-validation-chat-interface.md)

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
