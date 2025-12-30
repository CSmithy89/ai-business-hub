# Epic DM-07: Infrastructure Stabilization

## Overview

Address critical build, test, and configuration issues that block CI/CD reliability and developer productivity. This epic resolves all Sprint 1 "Must Do" items from the [Tech Debt Consolidated Document](../tech-debt-consolidated.md).

## Source Reference

**Tech Debt Document:** `docs/modules/bm-dm/tech-debt-consolidated.md`
**Priority:** Sprint 1 - Must Do (Critical Blockers)
**Items Addressed:** TD-01, TD-02, TD-03, TD-05, TD-06, TD-17

## Scope

### Critical Infrastructure Issues

| ID | Issue | Impact | Source Epic |
|----|-------|--------|-------------|
| TD-01 | `/kb` SSR issue (window usage) | Blocks clean builds | DM-01 |
| TD-02 | Pre-existing test failures (rate-limit, TimelineView, WidgetSlotGrid) | CI unreliable | DM-03 |
| TD-17 | Pre-existing ~24 failing TypeScript tests (DashboardSlots, API, Redis mock) | CI unreliable | DM-05 |
| TD-03 | DM-02.9 status mismatch (story says in-progress, sprint says done) | Audit failure | DM-02 |
| TD-05 | Keyboard shortcut conflicts between legacy chat and Copilot chat | UX confusion | DM-01 |
| TD-06 | Constants mismatch for chat shortcut (`DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT`) | Code inconsistency | DM-01 |

## Proposed Stories

### Story DM-07.1: Fix KB Module SSR Build Issue

**Problem:** The `/kb` (Knowledge Base) module uses `window` object at module level, causing SSR failures during Next.js builds.

**Root Cause (from DM-01 Retrospective):**
- Module-level code references browser APIs
- SSR-safe initialization patterns not followed

**Implementation:**
- Audit all `/kb` module files for `window`, `document`, `localStorage` usage
- Wrap browser-only code in `typeof window !== 'undefined'` checks
- Use lazy initialization functions instead of module-level constants
- Apply pattern from DM-04 Lesson #5: SSR-safe initialization

**Files to Investigate:**
```
apps/web/src/
├── app/(dashboard)/kb/
├── components/kb/
└── lib/kb/
```

**Acceptance Criteria:**
- [ ] AC1: `pnpm build` completes without SSR errors related to `/kb`
- [ ] AC2: All browser API usages wrapped in SSR-safe checks
- [ ] AC3: KB module functions correctly in both SSR and client modes
- [ ] AC4: No regression in KB functionality

**Points:** 5

---

### Story DM-07.2: Fix Pre-existing Python Test Failures

**Problem:** Rate-limit and other Python tests failing, creating unreliable CI gates.

**Root Cause (from DM-03 Retrospective):**
- Tests written against older API versions
- Mock setups incomplete or stale
- Redis mock configuration issues

**Implementation:**
- Run full Python test suite: `pytest agents/ -v`
- Identify all failing tests and categorize by failure type
- Fix rate-limit test mocking (likely AsyncMock pattern issue per DM-06 Lesson #2)
- Update Redis mock configurations
- Ensure all agent tests pass

**Files to Fix:**
```
agents/
├── tests/
│   ├── test_rate_limit.py
│   └── ... (other failing tests)
└── conftest.py (shared fixtures)
```

**Acceptance Criteria:**
- [ ] AC1: All Python tests pass with `pytest agents/ -v`
- [ ] AC2: Rate-limit tests correctly mock Redis
- [ ] AC3: AsyncMock patterns follow DM-06 guidelines
- [ ] AC4: Test coverage remains at or above current level

**Points:** 8

---

### Story DM-07.3: Fix Pre-existing TypeScript Test Failures

**Problem:** ~24 TypeScript tests failing across DashboardSlots, API, and Redis mock areas.

**Root Cause (from DM-05 Retrospective):**
- Tests not updated after component refactoring
- Missing `act()` wrappers for async state updates
- Mock setup issues in API tests

**Implementation:**
- Run full TS test suite: `pnpm test`
- Fix TimelineView component tests
- Fix WidgetSlotGrid component tests
- Fix DashboardSlots integration tests
- Add missing `act()` wrappers per DM-06 Lesson
- Update API mock configurations

**Files to Fix:**
```
apps/web/src/
├── components/
│   ├── dashboard/__tests__/
│   ├── timeline/__tests__/
│   └── widgets/__tests__/
└── lib/api/__tests__/
```

**Acceptance Criteria:**
- [ ] AC1: All TypeScript tests pass with `pnpm test`
- [ ] AC2: Async state updates wrapped in `act()`
- [ ] AC3: Component tests reflect current implementations
- [ ] AC4: No test skips or `.skip` markers added as workarounds

**Points:** 8

---

### Story DM-07.4: Reconcile DM-02.9 Status Mismatch

**Problem:** Story DM-02.9 shows conflicting status (in-progress in story file, done in sprint status).

**Root Cause (from DM-02 Retrospective):**
- Story file not updated after completion
- Sprint status updated but story file forgotten

**Implementation:**
- Review DM-02.9 story file and implementation
- Verify all acceptance criteria were actually met
- Update story file status to match reality
- Add implementation notes documenting what was done
- This also addresses TD-10 (Missing implementation notes for DM-02.5 to DM-02.9)

**Files to Update:**
```
docs/modules/bm-dm/stories/dm-02-9-*.md
docs/modules/bm-dm/sprint-status.yaml
```

**Acceptance Criteria:**
- [ ] AC1: DM-02.9 story file status matches sprint-status.yaml
- [ ] AC2: Implementation notes added for DM-02.9
- [ ] AC3: All DM-02.5 through DM-02.9 have implementation notes (TD-10)
- [ ] AC4: Sprint status audit passes

**Points:** 3

---

### Story DM-07.5: Unify Keyboard Shortcut Handling

**Problem:** Keyboard shortcuts conflict between legacy chat system and new Copilot chat. Constants define one shortcut but implementations differ.

**Root Cause (from DM-01 Retrospective):**
- Legacy chat: One keyboard shortcut
- Copilot chat: Different shortcut
- `DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT` not used consistently

**Implementation:**
- Audit all keyboard shortcut registrations
- Identify conflict points between legacy and Copilot chat
- Consolidate to single source of truth in `DM_CONSTANTS`
- Update all usages to reference constants
- Add shortcut documentation
- Consider: Should both chats coexist or should legacy be deprecated?

**Files to Update:**
```
apps/web/src/
├── lib/constants/dm-constants.ts
├── components/chat/
│   ├── LegacyChat.tsx
│   └── CopilotChat.tsx
└── hooks/
    └── useKeyboardShortcuts.ts
```

**Acceptance Criteria:**
- [ ] AC1: Single keyboard shortcut constant for chat toggle
- [ ] AC2: No conflicting shortcuts between chat systems
- [ ] AC3: All shortcut usages reference `DM_CONSTANTS`
- [ ] AC4: Keyboard shortcut behavior documented

**Points:** 5

---

## Total Points: 29

## Dependencies

- None (foundational epic - must be completed first)

## Technical Notes

### SSR-Safe Pattern (for DM-07.1)

```typescript
// BAD - Module-level window access
const tabId = window.sessionStorage.getItem('tabId');

// GOOD - Lazy initialization
const getTabId = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('tabId');
};
```

### AsyncMock Pattern (for DM-07.2)

```python
# From DM-06 Lesson #2: Need both AsyncMock for function AND MagicMock for module
from unittest.mock import AsyncMock, MagicMock, patch

@patch('module.async_function', new_callable=AsyncMock)
@patch('module.sync_dependency', new_callable=MagicMock)
async def test_function(mock_dep, mock_async):
    mock_async.return_value = {'success': True}
    # ...
```

### Act() Wrapper Pattern (for DM-07.3)

```typescript
// From DM-06: Always wrap state-changing operations
import { act } from '@testing-library/react';

await act(async () => {
  fireEvent.click(button);
  await waitFor(() => expect(result).toBeTruthy());
});
```

## Risks

1. **Hidden Dependencies** - Fixing one test may reveal others were passing by accident
2. **Scope Creep** - Test fixes may surface deeper issues
3. **Keyboard Shortcuts** - Changing shortcuts may affect user muscle memory

## Success Criteria

- CI pipeline passes reliably on main branch
- All builds complete without SSR errors
- Sprint status accurately reflects reality
- Developer onboarding not blocked by failing tests

## References

- [Tech Debt Consolidated](../tech-debt-consolidated.md) - Source document
- [DM-01 Retrospective](../retrospectives/epic-dm-01-retro-2025-12-30.md) - TD-01, TD-05, TD-06
- [DM-02 Retrospective](../retrospectives/epic-dm-02-retro-2025-12-30.md) - TD-03
- [DM-03 Retrospective](epic-dm-03-retrospective.md) - TD-02
- [DM-05 Retrospective](../../sprint-artifacts/epic-dm-05-retrospective.md) - TD-17
- [DM-06 Retrospective](epic-dm-06-retrospective.md) - AsyncMock patterns
