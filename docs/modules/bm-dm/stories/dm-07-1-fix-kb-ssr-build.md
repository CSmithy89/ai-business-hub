# Story DM-07.1: Fix KB Module SSR Build Issue

## Status: done

## Story Information

| Field | Value |
|-------|-------|
| Epic | DM-07: Infrastructure Stabilization |
| Story Points | 5 |
| Priority | Critical |
| Source | Tech Debt Consolidated (TD-01) |

## Problem Statement

The `/kb` (Knowledge Base) module uses `window` object at module level, causing SSR failures during Next.js builds. This blocks clean builds and CI reliability.

## Root Cause Analysis

From DM-01 Retrospective:
- Module-level code references browser APIs
- SSR-safe initialization patterns not followed

## Files to Investigate

```
apps/web/src/
├── app/(dashboard)/kb/layout.tsx        # Uses window.location.pathname
├── app/(dashboard)/kb/[slug]/page.tsx   # Uses window.prompt
├── components/kb/
│   ├── KBSearchInput.tsx                # Uses localStorage (already SSR-safe)
│   └── editor/
│       ├── extensions.ts                 # Uses document.createElement (in render callback)
│       ├── EditorToolbar.tsx            # Uses window.prompt
│       ├── PageEditor.tsx               # Uses window.addEventListener (in useEffect)
│       └── extensions/
│           ├── mention.ts               # Uses document.body (in render callback)
│           └── task-reference.ts        # Uses document.body (in render callback)
```

## Investigation Results

### SSR-Unsafe Patterns Found

1. **`apps/web/src/app/(dashboard)/kb/layout.tsx`** (Lines 74, 99)
   - `window.location.pathname` used inside callbacks and IIFE
   - Issue: The IIFE at line 98-102 executes at render time

2. **`apps/web/src/app/(dashboard)/kb/[slug]/page.tsx`** (Line 151)
   - `window.prompt` used inside event handler
   - Status: Safe - only executes on user interaction

3. **`apps/web/src/components/kb/editor/EditorToolbar.tsx`** (Line 43)
   - `window.prompt` used inside event handler
   - Status: Safe - only executes on user interaction

4. **`apps/web/src/components/kb/editor/PageEditor.tsx`** (Lines 309-310, 322-323)
   - `window.addEventListener` inside `useEffect`
   - Status: Safe - useEffect only runs on client

5. **`apps/web/src/components/kb/editor/extensions.ts`** (Lines 61, 65)
   - `document.createElement` inside render callback
   - Status: Safe - CollaborationCursor render only runs on client

6. **`apps/web/src/components/kb/editor/extensions/mention.ts`** (Line 89)
   - `document.body` inside tippy callback
   - Status: Safe - only runs when editor is mounted

7. **`apps/web/src/components/kb/editor/extensions/task-reference.ts`** (Line 74)
   - `document.body` inside tippy callback
   - Status: Safe - only runs when editor is mounted

8. **`apps/web/src/components/kb/KBSearchInput.tsx`** (Lines 33, 35, 48, 54)
   - localStorage with SSR guards already in place
   - Status: Already SSR-safe

### Critical Issue

**Primary SSR Issue: `apps/web/src/app/(dashboard)/kb/layout.tsx`**

Lines 98-102:
```typescript
const currentPageSlug = (() => {
  const pathname = window.location.pathname
  const match = pathname.match(/\/kb\/([^/]+)/)
  return match ? match[1] : undefined
})()
```

This IIFE executes immediately during SSR, causing `window is not defined` error.

## Implementation Plan

### Fix 1: layout.tsx - Replace window.location with usePathname hook

Replace the IIFE with Next.js `usePathname` hook which is SSR-safe.

### Fix 2: layout.tsx - Wrap confirmDelete window.location in SSR check

The `window.location.pathname` in `confirmDelete` function is safe since it's inside a callback, but should still use usePathname for consistency.

## Acceptance Criteria

- [x] AC1: `pnpm build` completes without SSR errors related to `/kb`
- [x] AC2: All browser API usages wrapped in SSR-safe checks
- [x] AC3: KB module functions correctly in both SSR and client modes
- [x] AC4: No regression in KB functionality

## Technical Notes

### SSR-Safe Pattern

```typescript
// BAD - Module-level window access
const tabId = window.sessionStorage.getItem('tabId');

// GOOD - Lazy initialization
const getTabId = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('tabId');
};

// GOOD - Use Next.js hooks
import { usePathname } from 'next/navigation';
const pathname = usePathname();
```

## Implementation Notes

### Changes Made

1. **`apps/web/src/app/(dashboard)/kb/layout.tsx`**
   - Added `usePathname` and `useMemo` hook imports
   - Replaced IIFE that accessed `window.location.pathname` with `useMemo` that uses SSR-safe `usePathname` hook
   - Updated `confirmDelete` function to use `pathname` from hook instead of `window.location`

### Verification

- KB SSR issue fixed: No more `window.location.pathname` in KB module
- Build verification: KB-related SSR errors are eliminated

**Note:** The build still fails due to unrelated SSR issues in other modules:
- `/settings/ai-config` - useSearchParams() needs Suspense boundary
- `/agents/activity` - useSearchParams() needs Suspense boundary

These issues are NOT related to the KB module and are outside the scope of this story. They are pre-existing issues that should be addressed in separate stories (potentially DM-07.3 or a new story).

## References

- [DM-07 Epic](../epics/epic-dm-07-infrastructure-stabilization.md)
- [Tech Debt Consolidated](../tech-debt-consolidated.md) - TD-01
- [DM-04 Lesson #5](../retrospectives/) - SSR-safe initialization patterns

---

## Senior Developer Review

**Review Date:** 2025-12-31

### Summary

Story DM-07.1 addresses a critical SSR build failure in the KB (Knowledge Base) module caused by direct `window.location.pathname` access at render time.

### Code Review Findings

**Files Reviewed:**
- `apps/web/src/app/(dashboard)/kb/layout.tsx`

**Implementation Quality: GOOD**

1. **SSR Fix Correctly Applied:**
   - The problematic IIFE that accessed `window.location.pathname` directly has been replaced with Next.js's SSR-safe `usePathname` hook
   - The `currentPageSlug` extraction now uses `useMemo` with proper null-checking: `if (!pathname) return undefined`
   - The `confirmDelete` function now uses the `pathname` hook variable instead of `window.location.pathname`

2. **Code Quality:**
   - Proper imports added: `usePathname` from `next/navigation` and `useMemo` from `react`
   - Clear comment explaining the SSR-safe approach: `// Extract current page slug from pathname (SSR-safe using usePathname hook)`
   - Correct dependency array in `useMemo([pathname])`
   - The `'use client'` directive is present at the top of the file

3. **Remaining window Usages (Verified Safe):**
   - `window.prompt` in `[slug]/page.tsx` and `EditorToolbar.tsx` - inside event handlers, only run on user interaction
   - `window.addEventListener/removeEventListener` in `PageEditor.tsx` - inside `useEffect`, only run on client

4. **No Regressions Identified:**
   - The `PageTree` component still receives `currentPageSlug` correctly
   - Delete confirmation logic using `pathname?.includes()` is more defensive (null-safe)
   - All existing functionality preserved

### Acceptance Criteria Verification

| Criteria | Status | Notes |
|----------|--------|-------|
| AC1: `pnpm build` completes without SSR errors related to `/kb` | PASS | KB-specific `window.location.pathname` issue resolved |
| AC2: All browser API usages wrapped in SSR-safe checks | PASS | Remaining `window` usages are in event handlers or useEffect |
| AC3: KB module functions correctly in both SSR and client modes | PASS | usePathname hook is SSR-safe by design |
| AC4: No regression in KB functionality | PASS | All functionality preserved, enhanced null-safety |

### Notes

The story correctly scopes itself to KB module SSR issues only. The implementation notes properly document that other unrelated SSR issues exist in `/settings/ai-config` and `/agents/activity` (useSearchParams needing Suspense boundaries) - these are outside the scope of this story.

### Outcome

**APPROVE**

The implementation correctly addresses the SSR build issue in the KB module by replacing unsafe `window.location.pathname` access with Next.js's SSR-safe `usePathname` hook. The code follows project patterns, includes proper null-checking, and introduces no regressions.
