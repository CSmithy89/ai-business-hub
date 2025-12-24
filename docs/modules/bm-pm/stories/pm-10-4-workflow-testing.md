# Story PM-10-4: Workflow Testing (Dry-Run Simulation)

**Epic:** PM-10 - Workflow Builder
**Module:** Core-PM (bm-pm)
**Status:** done
**Created:** 2025-12-24
**Story Points:** 5

---

## User Story

**As a** workflow designer,
**I want** to test workflows before activation,
**So that** I can verify they work correctly without affecting real data.

---

## Acceptance Criteria

**Given** I have created a workflow
**When** I click "Test Workflow"
**Then** I can select a sample task to test against

**And** the workflow runs in dry-run mode (no actual changes)

**And** I see an execution trace showing each step's result

**And** the trace visualizes the path taken through the workflow

**And** each step shows what would happen (simulated results)

**And** I can identify which conditions passed/failed

---

## Technical Implementation Details

### Overview

This story implements the workflow testing functionality that allows users to safely test their workflows before activating them. The system uses dry-run mode to simulate execution without persisting any changes to the database.

### Backend API Endpoint

**Test Workflow Endpoint:**
```
POST /pm/workflows/:id/test
Body: {
  taskId: string;       // Sample task to test against
  overrides?: Record<string, any>; // Optional trigger data overrides
}
Response: {
  executionId: string;
  workflowId: string;
  trace: {
    steps: ExecutionStep[];
  };
  summary: {
    stepsExecuted: number;
    stepsPassed: number;
    stepsFailed: number;
    duration: number;
  };
}
```

### Execution Trace Format

```typescript
interface ExecutionStep {
  nodeId: string;
  type: 'trigger' | 'condition' | 'action';
  status: 'passed' | 'failed' | 'skipped';
  result: {
    simulated?: boolean;
    action?: string;
    matched?: boolean;
    evaluated?: boolean;
    condition?: string;
    error?: string;
  };
  duration: number;
}
```

### Frontend Components

1. **WorkflowTestPanel** - Panel for selecting sample task and running tests
2. **ExecutionTraceViewer** - Displays step-by-step execution results
3. **TaskSelector** - Dropdown for selecting tasks from the project

### Integration with WorkflowCanvas

- The test panel integrates with the existing workflow canvas
- After running a test, the canvas highlights the execution path
- Nodes are colored based on their execution result (passed/failed/skipped)

### Files to Create/Modify

**Backend:**
- `apps/api/src/pm/workflows/dto/test-workflow.dto.ts` - Request/response DTOs
- `apps/api/src/pm/workflows/workflows.controller.ts` - Add test endpoint
- `apps/api/src/pm/workflows/workflows.service.ts` - Add test method

**Frontend:**
- `apps/web/src/components/pm/workflows/WorkflowTestPanel.tsx` - Test panel component
- `apps/web/src/components/pm/workflows/ExecutionTraceViewer.tsx` - Trace visualization
- `apps/web/src/components/pm/workflows/TaskSelector.tsx` - Task selection dropdown
- Modify `WorkflowCanvas.tsx` - Add execution path highlighting

---

## Definition of Done

- [ ] Backend test endpoint implemented
- [ ] Dry-run mode correctly simulates without persisting
- [ ] Frontend test panel with task selection
- [ ] Execution trace viewer shows step results
- [ ] Canvas highlights execution path after test
- [ ] Error handling for invalid workflows
- [ ] All TypeScript types properly defined
- [ ] API returns proper error codes (400, 404, 500)

---

## Dependencies

- PM-10-1: Workflow Canvas (provides canvas infrastructure)
- PM-10-2: Trigger Conditions (provides filter evaluation)
- PM-10-3: Action Library (provides action simulation)

---

## Notes

- Dry-run mode is critical for safe testing - no database writes
- The execution trace should be detailed enough to debug issues
- Consider highlighting the execution path on the canvas for visual feedback
- Rate limits should still apply in dry-run mode (for realistic testing)
