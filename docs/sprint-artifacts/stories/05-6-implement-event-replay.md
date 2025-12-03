# Story 05-6: Implement Event Replay

## Story

**As a** platform administrator,
**I want** to replay historical events from a time range,
**So that** I can recover from failures or reprocess events after bug fixes.

## Acceptance Criteria

- [ ] Admin endpoint accepts time range and optional filters (eventTypes, tenantId)
- [ ] Replay job runs asynchronously using BullMQ
- [ ] Progress tracking available via status endpoint
- [ ] Replayed events marked with `__replay: true` flag
- [ ] Event handlers can filter replay events if needed
- [ ] Replay job ID returned for tracking

## Technical Notes

### API Endpoints

- POST `/admin/events/replay` - Start replay job
- GET `/admin/events/replay/:jobId` - Get replay job status

### Implementation

1. Create EventReplayService with startReplay() and getReplayStatus()
2. Create EventReplayProcessor for BullMQ job handling
3. Create DTOs for replay request/response
4. Add controller endpoints

## Dependencies

- Story 05-2: Event publisher (completed)
- Story 05-4: BullMQ integration (completed)

## Status

- [x] Story drafted
- [x] Context generated
- [x] Implementation complete
- [x] Code review passed
- [x] Story done
