# Story: PM-12.6 - Real-time Agent Features

## Story Info
- **Epic**: PM-12 (Consolidated Follow-ups from PM-04/PM-05)
- **Story ID**: PM-12.6
- **Title**: Real-time Agent Features
- **Status**: Done
- **Points**: 5

## User Story
As a user interacting with PM agents, I want real-time updates for agent responses, suggestion changes, and health score updates so that I can see immediate feedback without page refreshes.

## Acceptance Criteria
- [x] Agent response streaming sends chunks via WebSocket
- [x] Suggestion lifecycle events (created, updated, accepted, rejected) broadcast in real-time
- [x] Live health score updates push to connected clients
- [x] Frontend hooks consume WebSocket events for PM agents
- [x] Real-time indicators show when agents are processing

## Technical Notes
- Extends existing `RealtimeGateway` with new PM agent events
- Uses existing Socket.io infrastructure
- Follows established event naming: `pm.{entity}.{action}`
- Client subscribes via project room: `project:{projectId}`

## Tasks
1. Add WebSocket event types for agent streaming
2. Add broadcast methods for suggestion lifecycle
3. Add live health score broadcasting
4. Create React hooks for consuming PM real-time events
5. Add typing/processing indicators to agent chat

## Dependencies
- PM-04.4 (Navi Chat Interface) - completed
- PM-05.4 (Pulse Health Agent) - completed
- PM-06.3 (Real-time Kanban) - completed

## Definition of Done
- [x] All acceptance criteria met
- [x] Type definitions added to realtime.types.ts
- [x] Gateway methods implemented
- [x] Frontend hooks created
- [x] No TypeScript errors
