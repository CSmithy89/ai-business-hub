# Story 16-24: Implement Page Title Tags

**Epic:** EPIC-16 - Premium Polish & Advanced Features
**Priority:** P3
**Points:** 1
**Status:** Done

## User Story

As a user with many tabs
I want descriptive page titles
So that I can identify tabs easily

## Acceptance Criteria

- [x] All pages have descriptive `<title>` tags
- [x] Format: "Page Name | HYVVE"
- [x] Examples:
  - "Dashboard | HYVVE"
  - "Approvals | HYVVE"
  - "Settings - Security | HYVVE"
- [x] Dynamic titles for business pages

## Technical Notes

- Use Next.js Metadata API
- Title template in root layout
- Refactor client pages to server component wrappers

## Files to Create/Modify

- `apps/web/src/app/layout.tsx` - Title template
- All page.tsx files - Add metadata exports

## Implementation Steps

1. Add title template to root layout
2. Update existing metadata to remove redundant suffix
3. Refactor client pages to server component pattern
4. Add metadata to key pages

## Testing Checklist

- [x] Title template working
- [x] All settings pages have titles
- [x] Dashboard page has title
- [x] Agents page has title
- [x] Approvals page has title
- [x] TypeScript check passes

---

## Implementation Summary

**Date:** 2025-12-13
**Status:** Done

### Changes Made

1. **Root Layout (`layout.tsx`):**
   - Added title template: `{ template: '%s | HYVVE', default: 'HYVVE - Your AI Team' }`

2. **Updated Existing Metadata (16 files):**
   - Removed redundant "| HYVVE" suffix (template handles it)
   - Files: security, sign-in, sign-up, appearance, terms, help, privacy, ai-config, usage, agent-preferences, profile, sessions, linked-accounts, api-keys, magic-link, invite

3. **Refactored Client Pages (6 pages):**
   - Created `*Content.tsx` client components
   - Updated `page.tsx` to server components with metadata
   - Pages: dashboard, agents, approvals, crm, projects, workspace settings

### Page Titles Added

| Page | Title |
|------|-------|
| Dashboard | Dashboard |
| AI Team | AI Team |
| Approvals | Approvals |
| CRM | CRM |
| Projects | Projects |
| Profile | Profile |
| Security | Security |
| Sessions | Active Sessions |
| Appearance | Appearance |
| Workspace | Workspace Settings |
| AI Config | AI Configuration |

### Verification

- [x] TypeScript check passes
- [x] Title template working
- [x] Titles show in browser tabs

---

## Senior Developer Review

**Reviewer:** Code Review
**Outcome:** APPROVED

Clean implementation using Next.js Metadata API with proper server/client component separation.
