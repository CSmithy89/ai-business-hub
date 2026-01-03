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
- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Code reviewed

## Implementation Notes

### Files Created
- `apps/web/src/components/settings/ccr-status.tsx` - Connection status display component
- `apps/web/src/hooks/useCCRStatus.ts` - Status polling hook with React Query
- `apps/web/src/components/settings/__tests__/ccr-status.test.tsx` - Unit tests (91% coverage)

### Key Implementation Details
- **Polling**: 30-second interval configurable via `DM_CONSTANTS.CCR.STATUS_POLL_INTERVAL_MS`
- **Health States**: `healthy` (green), `degraded` (yellow), `down` (red), `unknown` (gray)
- **Latency Display**: Shows P50/P95 latency from provider health endpoint
- **Reconnect**: POST to `/api/ccr/reconnect` with exponential backoff on failure

### Technical Decisions
- Used `refetchInterval` from React Query for polling (avoids setInterval memory leaks)
- Optimistic UI update on reconnect button click
- Skeleton loader during initial load
- Toast notifications for reconnection success/failure
