# Story 02.6: Create Workspace Settings Page

**Story ID:** 02-6
**Epic:** EPIC-02 - Workspace Management
**Status:** Drafted
**Priority:** P1 - High
**Points:** 2
**Created:** 2025-12-02

---

## User Story

**As a** workspace owner or admin
**I want** to configure workspace settings
**So that** I can customize the workspace experience

---

## Story Context

The workspace settings page allows owners and admins to update workspace properties like name, image, and timezone. Changes are saved with optimistic updates and appropriate feedback.

---

## Acceptance Criteria

### AC-2.6.1: Settings page accessible
**Given** owner/admin navigating to settings
**When** accessing `/settings/workspace`
**Then**:
- Workspace settings page displayed
- Current workspace info pre-filled
- Only visible to owners/admins

### AC-2.6.2: Name update saves
**Given** owner editing workspace name
**When** saving changes
**Then**:
- Name updated in database
- Slug regenerated automatically
- Success toast shown
- Workspace selector updated

### AC-2.6.3: Avatar upload works
**Given** owner with image file
**When** uploading workspace avatar
**Then**:
- Image preview shown
- Image URL saved
- Optimistic update in UI
- Success feedback shown

### AC-2.6.4: Timezone selection
**Given** owner in timezone dropdown
**When** selecting new timezone
**Then**:
- Timezone updated
- Used for workspace-level timestamps

---

## Technical Implementation Guidance

### Components to Implement

#### 1. Workspace Settings Page

**Location:** `apps/web/src/app/settings/workspace/page.tsx`

**Features:**
- Pre-filled form with current workspace values
- Form validation with Zod
- Optimistic updates with React Query
- Success/error toast notifications

---

#### 2. Update SettingsLayout

**Location:** `apps/web/src/components/layouts/settings-layout.tsx`

**Changes:**
- Add "Workspace" section to navigation
- Include General and Members links

---

## Definition of Done

- [ ] Settings page at `/settings/workspace`
- [ ] Name editing with slug regeneration
- [ ] Image URL update
- [ ] Timezone selection
- [ ] Toast notifications for success/error
- [ ] No linting or type errors
- [ ] Successfully tested in local development

---

## Dependencies

### Upstream Dependencies
- **Story 02-1:** Workspace CRUD (PATCH API)
- **Story 02-4:** Workspace switching (context)

### Downstream Dependencies
- **Story 02-7:** Workspace deletion (settings integration)

---

## References

- **Tech Spec:** `/docs/archive/foundation-phase/sprint-artifacts/tech-spec-epic-02.md`
- **Epic File:** `/docs/epics/EPIC-02-workspace-management.md`
- **Wireframe:** ST-01 Settings Layout

---

## Implementation Notes (2025-12-02)

**Completed:**
- Workspace settings page at `/settings/workspace`
- Members settings page at `/settings/workspace/members`
- WorkspaceSettingsForm component with name, image URL, timezone editing
- MembersList component with role management and member removal
- Sonner toast notifications added for feedback
- Settings navigation updated with grouped sections (Account, Workspace, AI & Automation)

**Components Created:**
- `apps/web/src/app/settings/workspace/page.tsx` - Workspace settings page
- `apps/web/src/app/settings/workspace/members/page.tsx` - Members page
- `apps/web/src/components/settings/workspace-settings-form.tsx` - Settings form
- `apps/web/src/components/settings/members-list.tsx` - Members management UI

**Features:**
- Optimistic updates with React Query
- Form validation with live change detection
- Image preview with fallback to initials
- Role change dropdown with confirmation
- Member removal with confirmation dialog

---

_Story drafted: 2025-12-02_
_Implementation completed: 2025-12-02_
