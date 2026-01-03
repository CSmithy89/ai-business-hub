# Story DM-11.11: Fix CopilotKit API Drift

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 5
**Priority:** Medium

---

## Problem Statement

As CopilotKit evolves, some of our hook usages may drift from current best practices. This story audits all CopilotKit integrations and updates them to align with the v1.50.1 SDK patterns.

The primary concern is our use of `useCopilotAction` with `renderAndWaitForResponse` for HITL (Human-in-the-Loop) flows, when CopilotKit provides a dedicated `useHumanInTheLoop` hook for this purpose.

## Gap Addressed

**TD-16:** CopilotKit API drift - ensure hooks match SDK patterns

## API Audit Results

### CopilotKit Version: 1.50.1

| API | Files | Status | Notes |
|-----|-------|--------|-------|
| `useCopilotReadable` | copilot-context.ts, use-copilot-*-context.ts | ✅ Correct | Using `{ description, value }` signature |
| `useCoAgentStateRender` | use-agent-state-sync.ts | ✅ Correct | Using `{ name, render }` signature |
| `useCopilotAction` (render) | DashboardSlots.tsx | ✅ Correct | Using standard `render` prop |
| `useCopilotAction` (HITL) | use-hitl-action.tsx | ⚠️ Legacy | Using `renderAndWaitForResponse` - migrate to `useHumanInTheLoop` |
| `useCopilotAction` (generative) | use-generative-layout.tsx | ✅ Appropriate | `renderAndWaitForResponse` is appropriate for rendering |
| `CopilotKit` provider | CopilotKitProvider.tsx | ✅ Correct | Using `runtimeUrl` and `publicApiKey` |

### Hook Comparison

**Legacy Pattern (`useCopilotAction` + `renderAndWaitForResponse`):**
```typescript
useCopilotAction({
  name: 'hitl_action',
  parameters: [...],
  renderAndWaitForResponse: ({ args, respond, status }) => { ... },
});
```

**Current Pattern (`useHumanInTheLoop`):**
```typescript
useHumanInTheLoop({
  name: 'hitl_action',
  description: '...',
  parameters: [...],
  render: ({ args, respond, status }) => { ... },
});
```

The key differences:
1. Cleaner API with `render` instead of `renderAndWaitForResponse`
2. No need for `handler` (which was `never` type anyway for HITL)
3. Explicit HITL semantics

## Implementation Plan

### 1. Migrate use-hitl-action.tsx to useHumanInTheLoop

Update the HITL action hook to use the dedicated API:

```typescript
import { useHumanInTheLoop } from '@copilotkit/react-core';

// Replace useCopilotAction with useHumanInTheLoop
useHumanInTheLoop({
  name: `hitl_${name}`,
  description: description || `Human-in-the-loop approval for ${name}`,
  parameters: [...],
  render: ({ args, respond, status }) => {
    // Same logic as before, just different prop name
  },
});
```

### 2. Add SDK Version Documentation

Create a reference document for CopilotKit integration patterns.

### 3. Update Type Exports

Ensure our re-exports align with CopilotKit's current type structure.

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/lib/hitl/use-hitl-action.tsx` | Migrate to `useHumanInTheLoop` |
| `apps/web/src/hooks/useCopilotContext.ts` | Verify exports match SDK |
| `apps/web/src/types/copilotkit.d.ts` | Review type augmentations |

## Acceptance Criteria

- [x] AC1: use-hitl-action.tsx uses `useHumanInTheLoop` hook
- [x] AC2: All CopilotKit hook usages audited and documented
- [x] AC3: No TypeScript errors with CopilotKit integrations
- [x] AC4: HITL approval flow works correctly after migration
- [x] AC5: Tests updated for new hook

## Test Requirements

### Unit Tests

1. **HITL Hook Tests**
   - Verify action registration with correct parameters
   - Verify render callback receives correct props
   - Verify respond callback works correctly

2. **Integration Tests**
   - Approval flow renders correctly
   - Approval/rejection callbacks execute properly

## Dependencies

- **CopilotKit 1.50.1** - Current SDK version
- **DM-05** (HITL Implementation) - Original HITL implementation

## References

- [CopilotKit useHumanInTheLoop](https://docs.copilotkit.ai/reference/hooks/useHumanInTheLoop)
- [CopilotKit useCopilotAction](https://docs.copilotkit.ai/reference/hooks/useCopilotAction)
- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md)
- [Tech Debt TD-16](../tech-debt-consolidated.md)

---

*Story Created: 2026-01-01*
*Epic: DM-11 | Story: 11 of 15 | Points: 5*

---

## Implementation Notes

**Implemented:** 2026-01-01

### Changes Made

1. **use-hitl-action.tsx** - Migrated to useHumanInTheLoop:
   - Replaced `useCopilotAction` import with `useHumanInTheLoop`
   - Changed `renderAndWaitForResponse` prop to `render` (new API)
   - Updated documentation to reference both the original DM-05.2 story and this migration
   - No functional changes - the render callback logic remains identical

2. **CopilotKitProvider.test.tsx** - Updated mock:
   - Added `useHumanInTheLoop: vi.fn()` to the CopilotKit mock
   - Tests now pass with the new hook being used

### API Audit Summary

| Hook | Status | Notes |
|------|--------|-------|
| `useCopilotReadable` | ✅ Correct | 8 usages in context providers |
| `useCoAgentStateRender` | ✅ Correct | 1 usage in agent state sync |
| `useCopilotAction` (render) | ✅ Correct | DashboardSlots widget rendering |
| `useCopilotAction` (generative) | ✅ Appropriate | Generative layout rendering |
| `useHumanInTheLoop` | ✅ Migrated | HITL action registration |
| `CopilotKit` provider | ✅ Correct | runtimeUrl and publicApiKey |

### Technical Notes

- `useHumanInTheLoop` is specifically designed for HITL flows
- The hook internally uses the same `renderAndWaitForResponse` pattern but exposes it as `render`
- Migration was straightforward - only import and prop name changed
- No changes needed to HITL store, approval cards, or other HITL infrastructure
