# Story: KB-02.3 - Conflict Resolution

**Epic:** KB-02 - KB Real-Time & RAG
**Status:** Done
**Completed:** 2025-12-17
**Points:** 5

---

## Story Description

As a KB user, I want collaborative edits to merge safely and transparently, so that concurrent changes don’t overwrite each other and I can trust the editor state.

---

## Acceptance Criteria

- [x] Given multiple users are editing the same page
- [x] When edits occur concurrently
- [x] Then changes merge without user intervention (CRDT)
- [x] And the UI communicates sync status (connecting/syncing/live/offline)
- [x] And unsynced local changes are surfaced while reconnecting

---

## Technical Implementation

### Frontend (Next.js)

#### 1. Sync State & Unsynced Changes Indicator
Hooked into Hocuspocus provider events:
- `onSynced` to detect when the CRDT state is in sync
- `onUnsyncedChanges` to surface queued changes during reconnects

Rendered a compact status indicator:
- Connecting / Syncing / Live / Offline

**Location:** `apps/web/src/components/kb/editor/PageEditor.tsx`

### Notes

Actual conflict resolution is handled by Yjs CRDT semantics; this story focuses on ensuring the UX clearly reflects sync/merge state and avoids accidental “local save” loops for remote-origin transactions.

