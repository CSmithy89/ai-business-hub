# Story: KB-02.2 - Presence Cursors

**Epic:** KB-02 - KB Real-Time & RAG
**Status:** Done
**Completed:** 2025-12-17
**Points:** 8

---

## Story Description

As a KB user, I want to edit pages with others simultaneously and see their live cursors, so that we can collaborate in real-time without stepping on each other’s work.

---

## Acceptance Criteria

- [x] Given multiple users open the same KB page
- [x] When one user types
- [x] Then other users see changes immediately
- [x] And remote cursor + label are visible
- [x] And a “Live/Connecting/Offline” indicator is shown

---

## Technical Implementation

### Frontend (Next.js)

#### 1. Collaboration WebSocket URL
Added `KB_COLLAB_WS_URL` derivation for the web client (defaults to `ws://localhost:3002`).

**Location:** `apps/web/src/lib/api-config.ts`

#### 2. Collaborative Editor Wiring
Enabled Yjs collaboration for KB pages by connecting Tiptap to:
- `@hocuspocus/provider` (WebSocket client)
- `@tiptap/extension-collaboration` (CRDT binding)
- `@tiptap/extension-collaboration-cursor` (cursor + selection rendering)

Document name convention matches the server:
- `kb:page:{pageId}`

**Location:** `apps/web/src/components/kb/editor/PageEditor.tsx`

#### 3. Cursor Styling
Added baseline CSS for cursor caret/label/selection.

**Location:** `apps/web/src/app/globals.css`

#### 4. Deterministic User Colors
Added a small utility to generate consistent user colors from userId.

**Location:** `apps/web/src/lib/utils/color.ts`

#### 5. KB Page Integration
Passed the session token and user identity into `PageEditor` so the provider can authenticate.

**Location:** `apps/web/src/app/(dashboard)/kb/[slug]/page.tsx`

### Dependencies

Installed:
- `@hocuspocus/provider`
- `@tiptap/extension-collaboration`
- `@tiptap/extension-collaboration-cursor`
- `yjs`

