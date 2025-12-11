# Story 15.9: Implement Workspace General Settings

**Story ID:** 15.9
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 3
**Status:** in-progress

---

## User Story

**As a** workspace owner
**I want** to configure workspace-level settings
**So that** I can customize my workspace

---

## Context

The workspace settings page already exists with good core functionality from Story 02-6. This story adds enhancements from the UI/UX backlog:

**Existing Features:**
- Workspace name edit with validation
- Timezone selection dropdown
- Workspace image URL input
- Delete workspace with confirmation
- Save changes with loading state
- Success/error toasts

**Enhancements Required:**
- Workspace slug/URL display (read-only)
- Default language selection dropdown

**Source:** EPIC-15 tech spec Section 15.9
**Backlog Reference:** Section 4.2 - General

---

## Acceptance Criteria

### Core Functionality (already implemented)

- [x] Workspace name edit with validation
- [x] Timezone selection dropdown (common IANA timezones)
- [x] Workspace image URL input
- [x] Delete workspace button with confirmation
- [x] Save changes button with loading state
- [x] Success/error toasts

### Enhancements (Story 15-9)

- [x] Workspace slug/URL display (read-only after creation)
- [x] Default language selection (English, Spanish, French, German, etc.)

---

## Technical Implementation

### Files to Modify

```
apps/web/src/components/settings/workspace-settings-form.tsx
```

### Implementation Strategy

1. Add read-only workspace slug field showing the URL path
2. Add language selection dropdown with common languages
3. Wire language to form data and mutation

---

## Definition of Done

- [x] Workspace slug displayed as read-only
- [x] Language selection dropdown works
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- Existing workspace settings form
- Workspace API endpoints

---

## Notes

- Slug/URL is read-only because changing it would break bookmarks and links
- Language setting affects UI translations (future i18n implementation)

---

## Related Stories

- **02-6:** Create Workspace Settings Page (foundation)
- **15.8:** Implement Settings Sessions Page
- **15.10:** Fix Workspace Members Page

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_

---

## Tasks/Subtasks

- [x] **Task 1:** Add workspace slug read-only field
- [x] **Task 2:** Add language selection dropdown
- [x] **Task 3:** Wire language to form state
- [x] **Task 4:** Verify TypeScript type check passes
- [x] **Task 5:** Verify ESLint passes

---

## File List

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/components/settings/workspace-settings-form.tsx` | Add slug display and language selection |

---

## Code Review

### Changes Summary
- Added `SUPPORTED_LANGUAGES` constant with 10 common languages
- Added `language` field to `WorkspaceFormData` interface
- Updated form state initialization to include language (default: 'en')
- Updated `checkChanges` function to track language changes
- Updated `handleSubmit` to include language in mutation payload
- Added read-only workspace slug/URL display field
- Renamed "Timezone" card to "Regional Settings" with Globe icon
- Added language selection dropdown to Regional Settings card

### Code Quality
- TypeScript: ✅ No errors
- ESLint: ✅ No new errors (pre-existing `<img>` warnings only)
- Follows existing code patterns and styling conventions
- Proper use of shadcn/ui components

### Testing Results
- Workspace settings page renders correctly
- Language dropdown shows all 10 languages
- Slug display shows read-only workspace URL
- Form change detection works for new language field

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |
