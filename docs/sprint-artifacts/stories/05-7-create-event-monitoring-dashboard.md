# Story 05-7: Create Event Monitoring Dashboard

## Story

**As a** platform administrator,
**I want** to view event bus metrics and manage the dead letter queue,
**So that** I can monitor system health and troubleshoot failed events.

## Acceptance Criteria

- [ ] Admin page shows event throughput metrics
- [ ] DLQ size and contents visible
- [ ] Individual DLQ events can be inspected
- [ ] Retry button for DLQ events works
- [ ] Consumer group lag displayed
- [ ] Auto-refresh every 5 seconds

## Technical Notes

### Backend API

- GET `/admin/events/stats` - Get throughput, DLQ size, consumer lag
- Existing DLQ endpoints already implemented in prior stories

### Frontend

- Dashboard page at `/admin/events`
- StatCard component for metrics
- DLQEventTable component for failed events
- Auto-refresh using React Query refetchInterval

## Dependencies

- Story 05-1: Redis Streams infrastructure (completed)
- Story 05-4: DLQ implementation (completed)

## Status

- [x] Story drafted
- [x] Context generated
- [x] Implementation complete
- [ ] Code review passed
- [ ] Story done
