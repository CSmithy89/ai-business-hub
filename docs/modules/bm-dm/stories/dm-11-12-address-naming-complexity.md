# Story DM-11.12: Address Naming Complexity

**Epic:** DM-11 - Advanced Features & Optimizations
**Status:** done
**Points:** 2
**Priority:** Low

---

## Problem Statement

The agent naming throughout the codebase uses internal code names (pulse, navi, herald) which are not user-friendly. Users and developers need a consistent mapping between internal names and display names to improve readability in the UI and documentation.

## Gap Addressed

**TD-18:** Naming complexity - multiple naming conventions for agents

## Implementation Plan

### 1. Create Agent Names Utility

Create a centralized utility for agent name mapping:

```typescript
// packages/shared/src/agent-names.ts
export const AGENT_NAME_MAP = {
  pulse: {
    display: 'Vitals',
    description: 'System health metrics and performance indicators',
    icon: 'heart-pulse',
  },
  navi: {
    display: 'Project Status',
    description: 'Project overview and task management',
    icon: 'map',
  },
  // ... more agents
} as const;
```

### 2. Create Documentation

Document the naming conventions in `docs/architecture/agent-naming.md`.

## Files to Create/Modify

| File | Changes |
|------|---------|
| `packages/shared/src/agent-names.ts` | NEW - Agent name mapping utility |
| `packages/shared/src/index.ts` | Export agent names |
| `docs/architecture/agent-naming.md` | NEW - Naming convention documentation |

## Acceptance Criteria

- [x] AC1: Agent name mapping utility created
- [x] AC2: Helper functions for display name and description lookup
- [x] AC3: Type-safe agent internal names
- [x] AC4: Documentation for naming conventions
- [x] AC5: Exported from @hyvve/shared package

## Dependencies

- None (foundational utility)

## References

- [Epic DM-11 Tech Spec](../epics/epic-dm-11-tech-spec.md#dm-1112-address-naming-complexity-2-pts)
- [Tech Debt TD-18](../tech-debt-consolidated.md)

---

*Story Created: 2026-01-01*
*Epic: DM-11 | Story: 12 of 15 | Points: 2*

---

## Implementation Notes

**Implemented:** 2026-01-01

### Changes Made

1. **packages/shared/src/agent-names.ts** - Created agent name mapping utility:
   - Defined AGENT_NAME_MAP with all agent internal names and their display info
   - Helper functions: getAgentDisplayName, getAgentDescription, getAgentIcon
   - Type exports: AgentInternalName for type-safe usage

2. **packages/shared/src/index.ts** - Added exports:
   - Export all agent name utilities and types

3. **docs/architecture/agent-naming.md** - Created documentation:
   - Explained the naming conventions
   - Listed all agent mappings
   - Usage examples for TypeScript
