# Story 04-6: Implement AI Reasoning Display

**Epic:** EPIC-04 - Approval Queue System
**Points:** 2
**Priority:** P0
**Status:** done
**Branch:** story/04-6-ai-reasoning-display

## User Story

**As an** approver reviewing low-confidence items
**I want** to see why the AI is uncertain
**So that** I can make an informed decision

## Context

When AI agents create approval items with low confidence (<60%), approvers need clear visibility into:
1. What factors contributed to the low confidence score
2. Why each factor scored poorly
3. Which factors are most concerning
4. Context about related entities

This story implements a comprehensive AI reasoning display that shows confidence factors breakdown and AI-generated reasoning.

## Acceptance Criteria

- [ ] Display `aiReasoning` text in a styled block
- [ ] Show confidence factors breakdown with:
  - [ ] Factor name (formatted from snake_case to Title Case)
  - [ ] Score (0-100) with progress bar
  - [ ] Weight contribution (percentage)
  - [ ] Explanation text
- [ ] Highlight concerning factors with red border/background
- [ ] Collapsible section with Chevron icon
- [ ] Expanded by default for low confidence (<60%)
- [ ] Collapsed by default for medium/high confidence (>=60%)
- [ ] Link to related entities if `sourceModule` and `sourceId` are available
- [ ] Factors sorted by score (lowest first to prioritize concerns)
- [ ] Component is responsive and works on mobile

## Technical Implementation

### Components Created

1. **ConfidenceFactorsList** (`apps/web/src/components/approval/confidence-factors-list.tsx`)
   - Displays each confidence factor with visual indicators
   - Shows score, weight, and explanation
   - Highlights concerning factors
   - Sorts factors to show lowest scores first

2. **AIReasoningSection** (`apps/web/src/components/approval/ai-reasoning-section.tsx`)
   - Collapsible section wrapper
   - Contains ConfidenceFactorsList
   - Shows AI reasoning text
   - Links to related entity
   - Auto-expands for low confidence items

### Files Modified

1. **ApprovalCard** (`apps/web/src/components/approval/approval-card.tsx`)
   - Replaced placeholder AI reasoning with AIReasoningSection
   - Passes factors, aiReasoning, and related entity props

2. **Approval Detail Page** (`apps/web/src/app/approvals/[id]/page.tsx`)
   - Replaced placeholder with AIReasoningSection
   - Shows full reasoning in expanded view

3. **Shared Types** (`packages/shared/src/types/approval.ts`)
   - Updated ApprovalItem interface to include missing fields from DB model
   - Added sourceModule, sourceId, aiReasoning, factors (confidenceFactors)

## Design Decisions

1. **Factor Sorting:** Lowest scores first to immediately show concerns
2. **Color Scheme:** Consistent with existing confidence colors (green/yellow/red)
3. **Concerning Factors:** Red border-l-4 to visually distinguish problem areas
4. **Collapsible State:** Auto-expand for low confidence to encourage review
5. **Factor Names:** Convert snake_case to Title Case for better readability
6. **Weight Display:** Show as percentage of total for clarity

## Testing Notes

- Test with various confidence scores (<60%, 60-85%, >85%)
- Test with different numbers of factors (1-6)
- Test with/without concerning factors
- Test with/without aiReasoning text
- Test with/without sourceModule/sourceId
- Test collapsible behavior
- Test responsive layout on mobile

## Dependencies

- Existing: ConfidenceIndicator component
- Existing: shadcn/ui components (Card, Badge, Button, Progress)
- Existing: lucide-react icons
- New: Collapsible component (using built-in state management)

## Related Files

- Database: `packages/db/prisma/schema.prisma` (ApprovalItem model)
- Types: `packages/shared/src/types/approval.ts`
- API: `apps/api/src/approval/approval.service.ts` (provides data)
- Wireframe: `docs/ux-design.md` (AP-03 Approval Detail Modal)

## Notes

- This component is designed to be reusable for both card and detail page views
- The aiReasoning field is optional and only shown when present
- Related entity links are optional and only shown when sourceModule and sourceId are present
- Component follows existing HYVVE design patterns and styling
