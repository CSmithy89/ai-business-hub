# Story DM-01.7: CCR Connection Status

## Story Overview
**Epic:** DM-01 - CopilotKit Frontend Infrastructure
**Points:** 5
**Status:** done

## Description
Create CCR connection status component showing real-time provider health, connection state, and reconnection controls.

## Acceptance Criteria
- [ ] CCRStatus component displays connection state (connected/disconnected)
- [ ] Per-provider health indicators with colored status badges
- [ ] Active routing mode displayed
- [ ] Reconnect button triggers reconnection attempt
- [ ] Last checked timestamp shown
- [ ] Provider latency displayed when available
- [ ] Unit tests pass with ≥85% coverage

## Technical Notes
### Files to Create
- `apps/web/src/components/settings/ccr-status.tsx`
- `apps/web/src/hooks/useCCRStatus.ts`
- `apps/web/src/components/settings/__tests__/ccr-status.test.tsx`

### Dependencies
- DM_CONSTANTS.CCR.STATUS_POLL_INTERVAL_MS for polling
- React Query for data fetching
- shadcn/ui components

### Design Pattern
Follow existing ProviderHealthStatus patterns with:
- Card layout with status header
- Provider list with status badges
- Latency indicators
- Reconnect action button

## Testing Requirements
- Unit: Status displays correctly for all states
- Unit: Reconnect button triggers reconnection
- Unit: Provider health colors are correct
- Unit: Loading and error states handled

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Code reviewed
