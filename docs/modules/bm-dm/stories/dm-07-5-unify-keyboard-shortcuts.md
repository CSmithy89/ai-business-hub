# Story DM-07.5: Unify Keyboard Shortcut Handling

## Status: done

## Story Information

| Field | Value |
|-------|-------|
| Epic | DM-07: Infrastructure Stabilization |
| Story Points | 5 |
| Priority | Medium |
| Source | Tech Debt Consolidated (TD-05, TD-06) |

## Problem Statement

Keyboard shortcuts conflicted between the legacy chat system (`ChatPanel`) and the new CopilotKit integration (`CopilotChat`). Both handlers listened for `Cmd+/` to toggle their respective chat panels. Additionally, `DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT` was defined but not used consistently.

## Investigation Results

### Initial State

- **KeyboardShortcuts.tsx**: Handled `Cmd+/` to toggle legacy `ChatPanel` via `useUIStore.getState().toggleChatPanel()`
- **CopilotKeyboardShortcut.tsx**: Handled `Cmd+/` to toggle `CopilotChat` via `useCopilotChatState().toggle()`
- **DM_CONSTANTS**: Defined `CHAT.KEYBOARD_SHORTCUT: '/'` and `CHAT.KEYBOARD_MODIFIER: 'meta'` but neither component used them

### Root Cause

- DM-01.4 added CopilotKeyboardShortcut for the new CopilotChat
- The legacy KeyboardShortcuts.tsx was not updated to remove its handler
- Both handlers fired for the same shortcut, causing unpredictable behavior
- DM_CONSTANTS was defined for future unification but never implemented

## Implementation

### Solution

1. **Designated CopilotKeyboardShortcut as primary** - CopilotChat is the primary chat interface going forward

2. **Removed legacy handler** - Commented out `Cmd+/` handling in KeyboardShortcuts.tsx with explanation

3. **Used DM_CONSTANTS consistently** - Updated CopilotKeyboardShortcut and CopilotChatButton to use `DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT` and `DM_CONSTANTS.CHAT.KEYBOARD_MODIFIER`

### Files Changed

| File | Change |
|------|--------|
| `apps/web/src/components/keyboard/KeyboardShortcuts.tsx` | Removed `Cmd+/` handler, added comment |
| `apps/web/src/components/copilot/CopilotKeyboardShortcut.tsx` | Import and use DM_CONSTANTS |
| `apps/web/src/components/copilot/CopilotChatButton.tsx` | Import and use DM_CONSTANTS for shortcut display |
| `docs/modules/bm-dm/sprint-status.yaml` | Updated status to done |

## Acceptance Criteria

- [x] AC1: Single keyboard shortcut constant for chat toggle (DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT)
- [x] AC2: No conflicting shortcuts between chat systems
- [x] AC3: All shortcut usages reference DM_CONSTANTS
- [x] AC4: Keyboard shortcut behavior documented

## Technical Notes

### Shortcut Configuration

The chat shortcut is configured in `DM_CONSTANTS`:

```typescript
CHAT: {
  KEYBOARD_SHORTCUT: '/',        // The key
  KEYBOARD_MODIFIER: 'meta',     // Cmd on Mac, Ctrl on Windows
}
```

### Handler Priority

CopilotKeyboardShortcut is now the sole handler for `Cmd+/`:
- Imports DM_CONSTANTS for the shortcut key
- Uses platform detection for Mac/Windows modifier key
- Registered in dashboard layout after CopilotChat component

### Legacy System Status

The legacy ChatPanel and its keyboard handling have been deprecated in favor of CopilotChat. The UI toggle button and panel remain functional for backward compatibility, but the keyboard shortcut now only activates CopilotChat.

## References

- [DM-07 Epic](../epics/epic-dm-07-infrastructure-stabilization.md)
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - TD-05, TD-06
- [DM-01.4 Story](./dm-01-4-copilotkit-chat-integration.md) - Original CopilotKit integration

---

## Senior Developer Review

**Review Date:** 2025-12-31

### Summary

Story DM-07.5 resolves keyboard shortcut conflicts between legacy and CopilotKit chat systems.

### Code Review Findings

**Files Reviewed:**
- `apps/web/src/components/keyboard/KeyboardShortcuts.tsx`
- `apps/web/src/components/copilot/CopilotKeyboardShortcut.tsx`
- `apps/web/src/components/copilot/CopilotChatButton.tsx`

**Implementation Quality: GOOD**

1. **Clean Separation:**
   - Legacy handler commented out with clear explanation
   - CopilotKeyboardShortcut is now the single source of truth

2. **DM_CONSTANTS Usage:**
   - Both shortcut key and modifier now use DM_CONSTANTS
   - Button tooltip also uses DM_CONSTANTS for consistency

3. **Platform Handling:**
   - Correctly handles Mac (metaKey) vs Windows (ctrlKey)
   - Uses 'meta' modifier setting from DM_CONSTANTS

4. **TypeScript Check:**
   - All changes pass type checking

### Acceptance Criteria Verification

| Criteria | Status | Notes |
|----------|--------|-------|
| AC1: Single constant | PASS | DM_CONSTANTS.CHAT.KEYBOARD_SHORTCUT used |
| AC2: No conflicts | PASS | Legacy handler removed |
| AC3: Constants used | PASS | Both components use DM_CONSTANTS |
| AC4: Documented | PASS | Story documents the change |

### Outcome

**APPROVE**

The keyboard shortcut conflict has been resolved. CopilotChat is now the exclusive handler for `Cmd+/`, and all code uses DM_CONSTANTS for the shortcut configuration.
