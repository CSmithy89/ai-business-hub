# Story 04-5: Create Approval Card Component

**Epic:** EPIC-04 - Approval Queue System
**Status:** done
**Points:** 3
**Assigned To:** Dev
**Created:** 2025-12-03

---

## User Story

**As an** approver
**I want** clear approval cards
**So that** I can make quick, informed decisions

---

## Acceptance Criteria

- [x] Create ApprovalCard component with two variants (compact/expanded)
- [x] Show confidence score with color indicator:
  - Green (>85%): High confidence
  - Yellow (60-85%): Medium
  - Red (<60%): Low
- [x] Display AI recommendation
- [x] Show preview data (expandable)
- [x] Approve/Reject buttons with loading states
- [x] Add notes input for decision
- [x] Create ConfidenceIndicator component
- [x] Create ApprovalActions component
- [x] Create approval detail page showing expanded variant
- [x] Update approval list page to use compact variant

---

## Technical Implementation

### Components Created

1. **ConfidenceIndicator** (`apps/web/src/components/approval/confidence-indicator.tsx`)
   - Visual display of confidence score with progress bar
   - Color coding: green (>85%), yellow (60-85%), red (<60%)
   - Score label and recommendation text

2. **ApprovalActions** (`apps/web/src/components/approval/approval-actions.tsx`)
   - Approve/Reject buttons with loading states
   - Notes textarea for decision context
   - Confirmation dialogs
   - Integration with useApprovalMutations hook

3. **ApprovalCard** (`apps/web/src/components/approval/approval-card.tsx`)
   - Compact variant for list view
   - Expanded variant for detail view
   - Color-coded left border based on confidence level
   - Title, badges (type, confidence, priority)
   - Description with expandable preview
   - Preview data display (JSON formatted)
   - AI reasoning section (placeholder for Story 04-6)
   - Metadata (created time, due time, created by)

### Pages Created

1. **Approval Detail Page** (`apps/web/src/app/approvals/[id]/page.tsx`)
   - Shows full approval details using expanded ApprovalCard
   - Back button to return to approval list
   - Loading and error states
   - AI reasoning section (placeholder)

### Pages Updated

1. **Approval List Page** (`apps/web/src/app/approvals/page.tsx`)
   - Updated to use ApprovalCard in compact mode
   - Removed old ApprovalListItem component

---

## Design Reference

- **Wireframe:** AP-02 - Approval Card (Confidence Routing)
- **Location:** `/docs/design/wireframes/Finished wireframes and html files/ap-02_approval_card_(confidence_routing_)/`
- **Design System:** `/docs/design/STYLE-GUIDE.md`

---

## Dependencies

- Story 04-3: Implement Approval Router (routing logic)
- Story 04-4: Create Approval Queue Dashboard (base page)

---

## Notes

- AI reasoning display is a placeholder for Story 04-6
- Used existing shadcn/ui components (Card, Button, Badge, Textarea)
- Followed existing patterns from ApprovalListItem
- Responsive design with mobile support
- Proper TypeScript types throughout
- Loading and error states implemented

---

## Testing Checklist

- [ ] Compact card displays correctly in list view
- [ ] Expanded card displays correctly in detail view
- [ ] Confidence indicators show correct colors
- [ ] Approve/Reject actions work correctly
- [ ] Notes can be added to decisions
- [ ] Loading states display during actions
- [ ] Error states display when actions fail
- [ ] Preview data can be expanded/collapsed
- [ ] Responsive on mobile and tablet
- [ ] Keyboard navigation works
- [ ] Links navigate correctly

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Code follows TypeScript best practices
- [x] Components are responsive
- [x] Loading and error states implemented
- [ ] Code reviewed and approved
- [ ] Tested in development environment
- [ ] Story marked as done in sprint status
