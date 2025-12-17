# Story: KB-02.4 - Offline Support

**Epic:** KB-02 - KB Real-Time & RAG
**Status:** Done
**Completed:** 2025-12-17
**Points:** 8

---

## Story Description

As a KB user, I want to keep editing pages while offline and have my changes sync automatically when I reconnect, so that connectivity issues don’t block progress.

---

## Acceptance Criteria

- [x] Given I lose network connection
- [x] When I continue editing
- [x] Then changes are persisted locally (IndexedDB)
- [x] And an offline indicator is shown
- [x] And on reconnect, changes sync automatically via CRDT

---

## Technical Implementation

### Frontend (Next.js)

#### 1. IndexedDB Persistence
Added Yjs persistence using `y-indexeddb` so page edits survive refreshes and offline periods.

Keyed by document name:
- `kb:page:{pageId}`

**Location:** `apps/web/src/components/kb/editor/PageEditor.tsx`

#### 2. Network Status Hook
Added a small hook to detect online/offline state using browser events.

**Location:** `apps/web/src/hooks/use-network-status.ts`

**Tests:** `apps/web/src/hooks/__tests__/use-network-status.test.ts`

#### 3. Offline UX
The editor footer now indicates offline mode and whether local persistence has synced:
- Offline (saving locally…)
- Offline (saved locally)

**Location:** `apps/web/src/components/kb/editor/PageEditor.tsx`

