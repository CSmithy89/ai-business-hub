# Story 15.6: Implement Settings Profile Page

**Story ID:** 15.6
**Epic:** EPIC-15 - UI/UX Platform Foundation
**Priority:** P0 - Critical
**Points:** 3
**Status:** done

---

## User Story

**As a** user managing my account
**I want** a functional profile settings page
**So that** I can update my personal information

---

## Context

The profile settings page currently shows "Profile settings coming soon." This story implements a functional profile page where users can update their name and avatar.

**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md Section 4.1 - Profile
**Backlog Reference:** Section 4.1

---

## Acceptance Criteria

### Core Functionality

- [x] Display current user info:
  - Full name (editable)
  - Email (read-only, shows verified badge if verified)
  - Avatar (with upload/change capability)
- [x] Edit name with inline validation
- [x] Avatar upload:
  - Click to open file picker
  - Drag-drop support
  - Image preview before save
  - Max file size: 2MB
  - Accepted formats: jpg, png, gif, webp
- [x] Connected accounts display (link to /settings/linked-accounts)
- [x] Save changes button (disabled until changes made)
- [x] Success toast on save
- [x] Loading state during save

---

## Technical Implementation

### Files to Create

```
apps/web/src/components/settings/profile-form.tsx     # Profile edit form
apps/web/src/components/settings/avatar-upload.tsx    # Avatar upload component
```

### Files to Modify

```
apps/web/src/app/(dashboard)/settings/page.tsx        # Profile page with form
apps/web/src/lib/auth-client.ts                       # Export updateUser if needed
```

### Implementation Strategy

1. Create ProfileForm component with:
   - Name input field with validation
   - Email display (read-only)
   - Avatar upload with preview
   - Save button with loading state

2. Create AvatarUpload component with:
   - Click-to-upload and drag-drop support
   - File type and size validation
   - Image preview
   - Upload to base64 or URL

3. Use better-auth `authClient.updateUser()` for updates

---

## Tech Spec Reference

See **tech-spec-epic-15.md** Section: "Story 15.6: Implement Settings Profile Page"

---

## Definition of Done

- [x] Profile page shows current user info
- [x] Name can be edited and saved
- [x] Avatar can be uploaded with preview
- [x] Connected accounts section links to linked-accounts page
- [x] Save shows loading state and success toast
- [x] TypeScript type check passes
- [x] ESLint passes
- [x] Code review completed

---

## Dependencies

- better-auth `updateUser` API
- Existing auth-client.ts setup

---

## Notes

- Avatar upload stores as base64 in user.image for MVP
- Future: Cloud storage (S3/R2) for avatars
- Connected accounts uses existing LinkedAccountsCard

---

## Related Stories

- **15.7:** Implement Settings Security Page
- **09-7:** Account Linking (existing LinkedAccountsCard)

---

_Story created: 2025-12-11_
_Source: EPIC-15 UI/UX Platform Foundation_
_Tech Spec: tech-spec-epic-15.md_

---

## Tasks/Subtasks

- [x] **Task 1:** Create AvatarUpload component
- [x] **Task 2:** Create ProfileForm component
- [x] **Task 3:** Update settings page with ProfileForm
- [x] **Task 4:** Use authClient.updateUser (already available from better-auth)
- [x] **Task 5:** Test profile update functionality
- [x] **Task 6:** Verify TypeScript type check passes
- [x] **Task 7:** Verify ESLint passes

---

## File List

### Files to Create

| File | Description |
|------|-------------|
| `apps/web/src/components/settings/avatar-upload.tsx` | Avatar upload component |
| `apps/web/src/components/settings/profile-form.tsx` | Profile edit form |

### Files to Modify

| File | Description |
|------|-------------|
| `apps/web/src/app/(dashboard)/settings/page.tsx` | Update with ProfileForm |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted | Claude Code |
| 2025-12-11 | Implementation complete | Claude Code |

---

## Senior Developer Review

### Implementation Summary

**Date:** 2025-12-11
**Reviewer:** Claude Code (AI)
**Status:** APPROVED

### Acceptance Criteria Validation

| Criteria | Status | Notes |
|----------|--------|-------|
| Display user info | PASS | Name, email, avatar all displayed correctly |
| Edit name | PASS | Inline editing with validation |
| Avatar upload | PASS | Drag-drop, click, preview, file validation |
| Connected accounts | PASS | Links to /settings/linked-accounts |
| Save button states | PASS | Disabled when no changes, enabled when changed |
| Loading/success states | PASS | Loader on save, toast on success |

### Code Quality

| Aspect | Assessment |
|--------|------------|
| TypeScript | Strict mode, proper typing |
| Component Structure | Clean separation (AvatarUpload, ProfileForm) |
| State Management | React useState with useEffect for sync |
| Error Handling | Validation, error toasts, file size/type checks |
| UX | Reset button, disabled states, helpful text |

### Files Created

| File | Purpose |
|------|---------|
| `apps/web/src/components/settings/avatar-upload.tsx` | Avatar upload with drag-drop and preview |
| `apps/web/src/components/settings/profile-form.tsx` | Profile form with name editing |

### Files Modified

| File | Changes |
|------|---------|
| `apps/web/src/app/(dashboard)/settings/page.tsx` | Replaced placeholder with ProfileForm |

### Testing Results

- TypeScript type check: PASS
- ESLint: PASS (warnings only for img element - expected for base64)
- Playwright UI test: PASS - Form loads, edits work, buttons respond correctly
