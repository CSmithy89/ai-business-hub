# Story DM-01.8: CCR Quota & Usage Display

## Story Overview
**Epic:** DM-01 - CopilotKit Frontend Infrastructure
**Points:** 5
**Status:** done

## Description
Add CCR subscription quota progress bars to the usage dashboard, displaying remaining API calls per provider, quota limits, and reset dates.

## Acceptance Criteria
- [ ] CCRQuotaDisplay component renders quota progress bars
- [ ] Each provider shows used/limit counts
- [ ] Warning state shown when usage exceeds threshold
- [ ] Critical state shown when near limit
- [ ] Quota reset date displayed for each provider
- [ ] Integrated with existing Token Usage page
- [ ] Unit tests pass with ≥85% coverage

## Technical Notes
### Files to Create
- `apps/web/src/components/settings/ccr-quota-display.tsx`
- `apps/web/src/hooks/useCCRQuota.ts`
- `apps/web/src/components/settings/__tests__/ccr-quota-display.test.tsx`

### Files to Modify
- `apps/web/src/app/(dashboard)/settings/ai-config/usage/page.tsx`

### Dependencies
- DM_CONSTANTS.CCR.DEFAULT_QUOTA_WARNING_THRESHOLD
- DM_CONSTANTS.CCR.DEFAULT_QUOTA_CRITICAL_THRESHOLD
- shadcn/ui Progress component

### Design Pattern
Follow existing TokenUsageDashboard pattern with:
- Card layout with quota list
- Progress bars with color states
- Reset date formatting
- Provider names and limits

## Testing Requirements
- Unit: Progress bars render correctly
- Unit: Warning state shown at threshold
- Unit: Critical state shown near limit
- Unit: Reset date displays correctly

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed
