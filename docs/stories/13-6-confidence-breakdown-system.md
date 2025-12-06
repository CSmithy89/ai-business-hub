# Story 13.6: Confidence Breakdown System

**Epic:** EPIC-13 - AI Agent Management
**Priority:** P2 Medium
**Points:** 4
**Status:** Drafted

---

## User Story

**As a** user reviewing AI-generated approvals,
**I want to** see a detailed breakdown of the AI's confidence factors,
**So that** I can understand the reasoning behind the confidence score and make better-informed decisions.

---

## Acceptance Criteria

- [ ] **AC1:** ConfidenceBreakdown component added to approval detail modal
- [ ] **AC2:** Four factor bars displayed: Content Quality, Brand Alignment, Recipient Match, Timing Score
- [ ] **AC3:** Each factor shows progress bar, percentage, weight, and explanation
- [ ] **AC4:** Progress bars color-coded: green (>80%), yellow (60-80%), red (<60%)
- [ ] **AC5:** Overall weighted calculation displayed prominently
- [ ] **AC6:** AI Reasoning section shown for low-confidence items (<60%)
- [ ] **AC7:** Suggested Actions section shown with recommended next steps
- [ ] **AC8:** Backend API endpoint `/api/approvals/:id/confidence` returns factor data
- [ ] **AC9:** Component is collapsible for high-confidence items (>85%)
- [ ] **AC10:** Dark mode support for all confidence components
- [ ] **AC11:** Responsive design works on mobile
- [ ] **AC12:** Loading states during data fetch
- [ ] **AC13:** Error handling with fallback UI

---

## Technical Implementation

### Components to Create

#### 1. ConfidenceBreakdown.tsx
**Location:** `apps/web/src/components/approval/ConfidenceBreakdown.tsx`

Main component that orchestrates the confidence display:
- Fetches confidence data using React Query hook
- Displays overall confidence score prominently
- Shows all four factor bars
- Conditionally renders AIReasoning and SuggestedActions based on score
- Collapsible accordion for high-confidence items
- Loading skeleton state
- Error boundary

**Props:**
```typescript
interface ConfidenceBreakdownProps {
  approvalId: string;
  initialConfidence?: number;  // Optional for optimistic display
  className?: string;
}
```

#### 2. ConfidenceFactorBar.tsx
**Location:** `apps/web/src/components/approval/ConfidenceFactorBar.tsx`

Individual factor display:
- Progress bar with color coding
- Factor name and explanation
- Score percentage
- Weight indicator
- Expandable details

**Props:**
```typescript
interface ConfidenceFactorBarProps {
  factor: ConfidenceFactor;
  className?: string;
}

interface ConfidenceFactor {
  factor: string;
  score: number;        // 0-100
  weight: number;       // 0-1
  explanation: string;
}
```

#### 3. AIReasoning.tsx
**Location:** `apps/web/src/components/approval/AIReasoning.tsx`

Displays detailed reasoning for low-confidence items:
- Bullet points with icons
- Severity indicators
- Expandable detail view
- Only shown when confidence < 60%

**Props:**
```typescript
interface AIReasoningProps {
  reasons: ReasonItem[];
  className?: string;
}

interface ReasonItem {
  text: string;
  severity: 'high' | 'medium' | 'low';
  icon?: React.ReactNode;
}
```

#### 4. SuggestedActions.tsx
**Location:** `apps/web/src/components/approval/SuggestedActions.tsx`

Action recommendations:
- Card-based layout
- Each action: icon, name, reason, priority badge
- Click handler for executing actions
- Dismissible actions

**Props:**
```typescript
interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onActionClick?: (action: SuggestedAction) => void;
  onDismiss?: (actionId: string) => void;
  className?: string;
}

interface SuggestedAction {
  id: string;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}
```

### API Endpoint

#### GET /api/approvals/:id/confidence
**Location:** `apps/web/src/app/api/approvals/[id]/confidence/route.ts`

Returns confidence breakdown data for an approval item.

**Response Schema:**
```typescript
{
  factors: ConfidenceFactor[];
  suggestedActions: SuggestedAction[];
  overallScore: number;
}
```

**Implementation:**
- Validates session and workspace access
- Fetches approval item from database
- Calculates or retrieves confidence factors
- Generates suggested actions based on low factors
- Returns JSON response

**Mock Data Strategy:**
For this story, use calculated mock data based on the approval's existing confidence score:
- Generate 4 factors with realistic scores that average to overall score
- Vary weights to show different importance levels
- Generate suggested actions for factors scoring < 70%

### React Query Hook

#### useConfidenceBreakdown
**Location:** `apps/web/src/hooks/use-confidence-breakdown.ts`

React Query hook for fetching confidence data:
- Queries `/api/approvals/:id/confidence`
- Caches data for 5 minutes
- Enabled only when approvalId is provided
- Returns loading/error/success states

```typescript
export function useConfidenceBreakdown(approvalId: string) {
  return useQuery({
    queryKey: ['confidence', approvalId],
    queryFn: () => fetchConfidenceBreakdown(approvalId),
    enabled: !!approvalId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Integration with Approval Modal

**Modify:** `apps/web/src/components/approval/approval-detail-modal.tsx`

Add ConfidenceBreakdown component to the modal:
- Place after main content, before action buttons
- Only render if confidence score exists
- Pass approvalId to component
- Collapsible accordion UI (default closed for >85%)

---

## Design Specifications

### Color Coding

**Factor Score Colors:**
- **Green:** score > 80% → `bg-green-500`, `text-green-700`
- **Yellow:** 60% ≤ score ≤ 80% → `bg-yellow-500`, `text-yellow-700`
- **Red:** score < 60% → `bg-red-500`, `text-red-700`

**Priority Badge Colors:**
- **High:** `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
- **Medium:** `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
- **Low:** `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`

### Layout

**Progress Bar:**
- Height: 12px
- Rounded corners: `rounded-full`
- Animated fill on mount
- Progress percentage label inline

**Accordion:**
- Use shadcn/ui Accordion component
- Default state: open for <85%, closed for ≥85%
- Smooth animation

**Responsive:**
- Desktop: Two-column layout for factors
- Mobile: Single column, stacked

---

## Dependencies

**Packages:**
- React Query (already installed)
- shadcn/ui components: Accordion, Progress, Badge, Card
- Tailwind CSS (already configured)

**Existing Components:**
- `approval-detail-modal.tsx` (modification)

**Types:**
- Extend or create types in `packages/shared/src/types/agent.ts`

---

## Testing Requirements

### Unit Tests

**ConfidenceFactorBar.test.tsx:**
- Renders progress bar with correct color for each score range
- Displays factor name, score, weight, explanation
- Handles edge cases (0%, 100%, null values)

**ConfidenceBreakdown.test.tsx:**
- Fetches and displays confidence data
- Shows loading skeleton during fetch
- Handles error states gracefully
- Conditionally renders AIReasoning for low scores
- Collapsible state works correctly

**AIReasoning.test.tsx:**
- Renders reason items with correct severity icons
- Expandable detail view works

**SuggestedActions.test.tsx:**
- Renders action cards with priority badges
- Click handlers fire correctly
- Dismiss functionality works

### Integration Tests

**API Route Test:**
- Returns correct data structure
- Validates session and workspace
- Returns 404 for non-existent approval
- Returns 401 for unauthorized access

**Modal Integration:**
- ConfidenceBreakdown appears in approval modal
- Data fetches when modal opens
- Component unmounts cleanly when modal closes

---

## Code Standards

### TypeScript
- Use strict mode
- Define all interfaces in separate types file
- Use Zod for API response validation (optional for this story, add if time permits)

### React
- Use functional components with hooks
- Implement loading skeletons (shadcn/ui Skeleton)
- Use Error Boundary wrapper
- Add 'use client' directive

### Styling
- Use Tailwind utility classes
- Follow dark mode patterns (`dark:` variants)
- Responsive breakpoints: `sm:`, `md:`, `lg:`
- Use layout constants from `@/lib/layout-constants` if needed

### Imports
```typescript
// 1. External
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

// 2. Internal (@/)
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// 3. Relative
import { ConfidenceFactorBar } from './ConfidenceFactorBar';
```

---

## Definition of Done

- [ ] All 4 components created and working
- [ ] API endpoint returns mock confidence data
- [ ] React Query hook implemented
- [ ] Integration with approval modal complete
- [ ] TypeScript type check passes (`pnpm turbo type-check`)
- [ ] ESLint passes (`pnpm turbo lint`)
- [ ] Unit tests written and passing (optional for this story)
- [ ] Dark mode tested
- [ ] Mobile responsive tested
- [ ] Loading states work
- [ ] Error states handled
- [ ] Code reviewed and approved
- [ ] Documentation updated (if applicable)

---

## Notes

### Mock Data Strategy

For the initial implementation, the API endpoint should generate intelligent mock data:

```typescript
function calculateConfidenceFactors(approval: ApprovalItem): ConfidenceFactor[] {
  const overallScore = approval.confidenceScore || 75;

  // Generate 4 factors that average to overall score
  return [
    {
      factor: 'Content Quality',
      score: Math.min(100, overallScore + Math.floor(Math.random() * 20 - 10)),
      weight: 0.35,
      explanation: 'Content is well-structured and professional',
    },
    {
      factor: 'Brand Alignment',
      score: Math.min(100, overallScore + Math.floor(Math.random() * 20 - 10)),
      weight: 0.25,
      explanation: 'Tone matches brand guidelines',
    },
    {
      factor: 'Recipient Match',
      score: Math.min(100, overallScore + Math.floor(Math.random() * 20 - 10)),
      weight: 0.25,
      explanation: 'Target audience is appropriate',
    },
    {
      factor: 'Timing Score',
      score: Math.min(100, overallScore + Math.floor(Math.random() * 20 - 10)),
      weight: 0.15,
      explanation: 'Timing is acceptable',
    },
  ];
}
```

### Future Enhancements

- Real AI-powered confidence factor calculation
- Historical confidence trends
- Factor importance learning over time
- Custom factor definitions per workspace

---

## Related Stories

- **Story 13.1:** Agent Card Components (provides avatar/status patterns)
- **Story 13.2:** Agent Detail Modal (similar modal structure)
- **Story 04.6:** AI Reasoning Display (approval system context)

---

## Files to Create/Modify

### New Files
```
apps/web/src/components/approval/
├── ConfidenceBreakdown.tsx
├── ConfidenceFactorBar.tsx
├── AIReasoning.tsx
└── SuggestedActions.tsx

apps/web/src/app/api/approvals/[id]/confidence/
└── route.ts

apps/web/src/hooks/
└── use-confidence-breakdown.ts
```

### Modified Files
```
apps/web/src/components/approval/
└── approval-detail-modal.tsx
```

### Types Files (if needed)
```
packages/shared/src/types/
└── confidence.ts (or extend agent.ts)
```

---

_Story created: 2025-12-06_
_Epic: EPIC-13 - AI Agent Management_
_Tech Spec: `/docs/sprint-artifacts/tech-spec-epic-13.md`_
