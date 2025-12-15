# Story 08.15: Implement Financial Projections Workflow

**Story ID:** 08.15
**Epic:** EPIC-08 - Business Onboarding & Foundation Modules
**Status:** done
**Points:** 3
**Priority:** P1
**Dependencies:** Story 08.14

---

## User Story

**As a** user
**I want** to generate financial projections with multiple scenarios
**So that** I can understand my business financial outlook

---

## Description

This story implements the Financial Projections workflow where the Finance agent (Finn) generates 3 scenarios (Conservative, Realistic, Optimistic) with complete financial models including revenue projections, cost structures, P&L, cash flow, and unit economics.

---

## Acceptance Criteria

### Scenario Generation
- [x] Finance agent generates 3 scenarios: Conservative, Realistic, Optimistic
- [x] Each scenario includes revenue projections (3-5 years)
- [x] Each scenario includes cost projections
- [x] Each scenario includes P&L statement
- [x] Each scenario includes cash flow projections
- [x] Each scenario includes unit economics

### Analysis Features
- [x] Break-even analysis included
- [x] Assumptions clearly documented
- [x] Key financial metrics calculated

### Data Persistence
- [x] Results saved to `PlanningSession.financials`
- [x] API endpoint at `/api/planning/[businessId]/financial-projections`

### Integration
- [x] Integrate with planning page
- [x] Update workflow progress on completion

---

## Technical Implementation Details

### Financial Projections Structure

```typescript
interface FinancialProjections {
  scenarios: {
    conservative: ScenarioData;
    realistic: ScenarioData;
    optimistic: ScenarioData;
  };
  breakEvenAnalysis: {
    monthsToBreakeven: number;
    breakEvenRevenue: number;
    breakEvenUnits: number;
  };
  assumptions: Assumption[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}

interface ScenarioData {
  name: string;
  description: string;
  revenue: YearlyProjection[];
  costs: CostProjection;
  pnl: PLStatement[];
  cashFlow: CashFlowStatement[];
  unitEconomics: UnitEconomics;
}

interface YearlyProjection {
  year: number;
  amount: number;
  growthRate: number;
}

interface UnitEconomics {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  arpu: number;
  churnRate: number;
  grossMargin: number;
}
```

### Agent: Finance (Finn)
- Role: Financial Analyst
- Generates comprehensive financial models
- Uses market sizing data from validation
- Requests HITL approval for financial assumptions

---

## Definition of Done

- [x] API endpoint created
- [x] 3 scenarios generated with complete financial data
- [x] Break-even analysis included
- [x] Assumptions documented
- [x] Results saved to PlanningSession
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Code reviewed

---

_Story created: 2025-12-05_
_Last updated: 2025-12-05_
