# Story 15.5: Fix Approvals Page Data Loading

**Story ID:** 15.5
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 3
**Status:** done

---

## User Story

**As a** user viewing the Approvals page
**I want** approval items to load without errors
**So that** I can review and act on pending approvals

---

## Context

The Approvals page currently shows "Error Loading Approvals - Failed to fetch" when the NestJS backend is not running or authentication fails. This story implements demo mode fallback with sample approval items to ensure the UI functions for demonstrations and development.

**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md Section 5.1
**Backlog Reference:** Section 5.1

---

## Acceptance Criteria

### Core Functionality

- [x] Fix "Error Loading Approvals - Failed to fetch" error
- [x] Implement proper API endpoint at GET `/api/approvals` (Next.js route)
- [x] Show skeleton loaders while loading (using existing approvals page implementation)
- [x] Demo mode fallback with sample approval items:
  - 5 realistic approval items implemented
  - Mix of confidence levels (high: 92%, 88%; medium: 75%; low: 58%, 45%)
  - Different types (content, email, deal, task, agent_action)
- [x] Graceful error handling with retry button (existing implementation)
- [x] Empty state when no approvals pending (existing implementation)

### Demo Data Requirements

Demo data should include:
- Mix of approval types: content, email, deal, task, agent_action
- Confidence scores: 92%, 75%, 58%, 88%, 45%
- Multiple agents: Nova, Maya, Hub, Atlas, Echo
- Various timestamps (recent to older)
- Realistic titles and summaries

---

## Technical Implementation

### Files to Create

```
apps/web/src/app/api/approvals/route.ts  # Next.js API route with demo fallback
apps/web/src/lib/demo-data/approvals.ts  # Demo approval items
```

### Files to Modify

```
apps/web/src/hooks/use-approvals.ts      # Add demo mode fallback
apps/web/src/app/(dashboard)/approvals/page.tsx  # Improve error states
```

### Demo Data Structure

```typescript
const demoApprovals: ApprovalItem[] = [
  {
    id: 'demo-1',
    type: 'content',
    title: 'Blog Post: AI Automation Trends 2025',
    summary: 'Nova drafted a blog post about emerging AI automation trends...',
    confidenceScore: 92,
    confidenceLevel: 'high',
    status: 'pending',
    agentId: 'nova',
    agentName: 'Nova',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    priority: 1,
  },
  {
    id: 'demo-2',
    type: 'email',
    title: 'Follow-up email to John Smith',
    summary: 'Maya prepared a follow-up email for the sales lead...',
    confidenceScore: 75,
    confidenceLevel: 'medium',
    status: 'pending',
    agentId: 'maya',
    agentName: 'Maya',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: 2,
  },
  // ... more items
];
```

### Implementation Strategy

1. Create Next.js API route `/api/approvals` that:
   - Tries to proxy to NestJS backend first
   - Falls back to demo data on error (if mock mode enabled)
   - Returns proper error response otherwise

2. Update `use-approvals.ts` hook to:
   - Use Next.js API route instead of direct NestJS URL
   - Handle demo mode gracefully
   - Show appropriate loading/error states

3. Add demo data constants with realistic approval items

---

## Tech Spec Reference

See **tech-spec-epic-15.md** Section: "Story 15.5: Fix Approvals Page Data Loading"

---

## Definition of Done

- [x] Approvals page loads without errors
- [x] Demo mode shows realistic sample approvals
- [x] Skeleton loaders display during loading
- [x] Error state shows retry button
- [x] Empty state displays when no approvals
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- **EPIC-04:** Approval queue system (exists)
- Existing approval components from EPIC-04

---

## Notes

- Demo mode should be enabled via `IS_MOCK_DATA_ENABLED` from api-config
- Real data from NestJS should always take priority when available
- Console logging should help debug issues in development

---

## Related Stories

- **15.17:** Implement Approval Cards with Confidence Visualization
- **04-4:** Create Approval Queue Dashboard (foundation)

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_
_Tech Spec: tech-spec-epic-15.md_

---

## Tasks/Subtasks

- [x] **Task 1:** Create demo approval data constants
- [x] **Task 2:** Create Next.js API route `/api/approvals` with demo fallback
- [x] **Task 3:** Update use-approvals hook to use Next.js route
- [x] **Task 4:** Improve skeleton loading states (existing implementation sufficient)
- [x] **Task 5:** Improve empty state UI (existing implementation sufficient)
- [x] **Task 6:** Verify TypeScript type check passes
- [x] **Task 7:** Verify ESLint passes

---

## File List

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/lib/demo-data/approvals.ts` | Demo approval items |
| `apps/web/src/app/api/approvals/route.ts` | Next.js API route with demo fallback |

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/hooks/use-approvals.ts` | Update to use Next.js route |
| `apps/web/src/app/(dashboard)/approvals/page.tsx` | Improve error/empty states |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete - demo data fallback working | Claude Code |

---

## Senior Developer Review

### Implementation Summary

**Date:** 2025-12-11
**Reviewer:** Claude Code (AI)
**Status:** APPROVED

### Acceptance Criteria Validation

| Criteria | Status | Notes |
|----------|--------|-------|
| Fix fetch error | ✅ PASS | Next.js API route properly handles NestJS unavailability |
| API endpoint | ✅ PASS | GET `/api/approvals` with query params, filtering, pagination |
| Skeleton loaders | ✅ PASS | Existing page implementation provides loading states |
| Demo mode fallback | ✅ PASS | 5 realistic items with varied confidence levels |
| Error handling | ✅ PASS | Graceful fallback, console logging for debugging |
| Empty state | ✅ PASS | Shows when filter returns no results |

### Code Quality

| Aspect | Assessment |
|--------|------------|
| TypeScript | ✅ Strict mode, proper typing with ApprovalItem from shared |
| Error Handling | ✅ Backend fallback, proper error responses |
| Code Organization | ✅ Clean separation: demo data, API route, hook |
| Security | ✅ Session validation, cookie forwarding |

### Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/lib/demo-data/approvals.ts` | Demo approval items (5 items, multiple agents, varied confidence) |
| `apps/web/src/app/api/approvals/route.ts` | Next.js API route with NestJS proxy + demo fallback |

### Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/hooks/use-approvals.ts` | Updated `fetchApprovals` to use Next.js route |

### Testing Results

- TypeScript type check: ✅ PASS
- ESLint: ✅ PASS (warnings only)
- Playwright UI test: ✅ PASS - All 5 demo items display correctly

### Demo Data Coverage

| Agent | Type | Confidence | Score |
|-------|------|------------|-------|
| Nova | content | high | 92% |
| Maya | email | medium | 75% |
| Hub | deal | low | 58% |
| Atlas | task | high | 88% |
| Echo | agent_action | low | 45% |
