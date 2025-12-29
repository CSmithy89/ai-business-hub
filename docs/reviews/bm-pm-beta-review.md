# BM-PM Module Beta Testing Review

**Date:** December 29, 2025
**Tester:** Claude Code (Automated Beta Testing)
**Module:** Project Management (bm-pm) + Knowledge Base (bm-kb)
**Environment:** Development (localhost:3000 + localhost:3001)

---

## Executive Summary

The PM module provides a solid foundation for project management with well-designed UI components and a comprehensive feature set. However, several critical bugs were discovered that need immediate attention before production deployment.

### Overall Assessment: **BETA - NOT PRODUCTION READY**

| Category | Rating | Notes |
|----------|--------|-------|
| UI/UX Design | ⭐⭐⭐⭐ (4/5) | Clean, consistent design following design system |
| Functionality | ⭐⭐⭐ (3/5) | Core features work, but critical bugs exist |
| Stability | ⭐⭐ (2/5) | Intermittent "Project not found" errors |
| Knowledge Base | ⭐ (1/5) | Non-functional due to CORS issues |
| Mobile Responsiveness | ⭐⭐⭐⭐ (4/5) | Good mobile layout with bottom nav |

---

## Critical Bugs (P0 - Must Fix)

### 1. Knowledge Base CORS Errors - CRITICAL

**Severity:** P0 - Blocking
**Location:** KB Module (`/kb/*`)
**Impact:** Entire Knowledge Base module is non-functional

**Description:**
The Knowledge Base module directly calls the NestJS backend (`http://localhost:3001/api/kb/...`) instead of using the Next.js API proxy (`/api/kb/...`), causing CORS errors.

**Console Errors:**
```
Access to fetch at 'http://localhost:3001/api/kb/pages?flat=true' from origin 'http://localhost:3000' has been blocked by CORS policy
Access to fetch at 'http://localhost:3001/api/kb/templates' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Affected Operations:**
- Loading KB pages list
- Loading KB templates
- Creating new KB pages
- All KB functionality

**Fix Required:**
Update KB hooks/services to use `/api/kb/...` (Next.js proxy) instead of direct backend calls.

---

### 2. Intermittent "Project not found" Errors

**Severity:** P0 - Critical
**Location:** Project detail pages (`/dashboard/pm/[slug]/*`)
**Impact:** Users randomly cannot access their projects

**Description:**
Project detail pages (Overview, Tasks, Team, Docs, Settings) intermittently show "Project not found" error even when:
- The project exists in the database
- The API returns 200 OK
- The user just created the project

**Observations:**
- Works immediately after project creation
- Fails after page refresh or direct navigation
- Team page sometimes works when other pages fail
- Issue may be related to session/workspace context

**Possible Causes:**
1. React Query cache invalidation issues
2. Session/workspace ID not properly propagated
3. Race condition in authentication context
4. Backend workspace resolution issues

**Steps to Reproduce:**
1. Create a new project
2. Navigate to project overview (works)
3. Click on Team, Docs, or Settings
4. Sometimes shows "Project not found"
5. Refresh page - may show error even on overview

---

### 3. Tasks API 400 Bad Request

**Severity:** P1 - High
**Location:** Tasks page (`/dashboard/pm/[slug]/tasks`)
**Impact:** Tasks cannot be loaded or managed

**Description:**
Tasks page shows "Failed to fetch tasks" with 400 Bad Request errors from the API.

**Console Errors:**
```
GET /api/pm/projects/[id]/tasks?workspaceId=... 400 (Bad Request)
```

---

## High Priority Bugs (P1)

### 4. Presence API 404 Errors

**Severity:** P1 - High
**Location:** PM module (all project pages)
**Impact:** Real-time presence indicators don't work

**Description:**
Multiple 404 errors for presence-related endpoints:
```
GET http://localhost:3001/pm/presence/... 404 (Not Found)
```

**Impact:**
- Real-time user presence not functional
- Collaboration features degraded

---

### 5. PM-Specific Agents Not Visible

**Severity:** P1 - High
**Location:** Agent Panel dropdown
**Impact:** PM agents (Navi, Sage, Chrono) not accessible

**Description:**
The epic documentation mentions PM-specific agents:
- **Navi** - Project Navigator (task routing, phase transitions)
- **Sage** - Domain Expert (technical guidance)
- **Chrono** - Timeline Analyst (scheduling, dependencies)

However, only platform agents are visible in the agent selector:
- Hub (Orchestrator)
- Maya (CRM)
- Atlas (Projects)
- Nova (Marketing)
- Echo (Analytics)

---

## Medium Priority Bugs (P2)

### 6. Breadcrumb Capitalization Issue

**Severity:** P2 - Medium
**Location:** `HeaderBreadcrumbs.tsx`
**Impact:** Project names not properly capitalized

**Description:**
Project names in breadcrumbs show improper capitalization. For example:
- "PM Beta Test" displays as "Pm Beta Test"

**Root Cause:**
The `formatSegmentName` function applies title case transformation to dynamic segments (project slugs), but this doesn't preserve original capitalization for proper nouns or acronyms.

**Fix:**
For project slugs, fetch the actual project name from the route context rather than transforming the slug.

---

## Working Features ✓

### Projects List Page
- ✅ Project list loads correctly
- ✅ Empty state with "Create your first project" CTA
- ✅ Filters present (Status, Type, Search)
- ✅ "New Project" button functional

### Create Project Wizard
- ✅ 3-step wizard flow works (Basics → Template → Create)
- ✅ Business selector populated
- ✅ Template selection (BMAD Course with 10 phases)
- ✅ Project created successfully with toast notification
- ✅ Redirects to new project overview

### Project Overview Page (when working)
- ✅ Project header with name, description, status badge
- ✅ Progress indicator (0%)
- ✅ Navigation tabs (Overview, Tasks, Team, Docs, Settings)
- ✅ 10 BMAD phases displayed correctly
- ✅ Phase status badges (CURRENT, UPCOMING)
- ✅ Stats cards (Tasks 0/0, Team 1, Days remaining —)
- ✅ Quick links to Project Docs and Settings

### Project Team Page (when working)
- ✅ Team members table
- ✅ Member details (name, role, capacity, permissions)
- ✅ Lead user badge
- ✅ Edit/Remove buttons (disabled for lead)
- ✅ Add member dialog
- ✅ Role selector with options (Developer, Designer, QA, Stakeholder, Custom)
- ✅ Permission toggles (Assign tasks, Approve agents, Modify phases)

### Project Docs Page (when working)
- ✅ Project header with documentation context
- ✅ "Link Existing" and "Create New" buttons
- ✅ Navigation tabs
- ✅ Empty state message

### Project Settings Page (when working)
- ✅ General settings (Name, Description, Start/Target dates)
- ✅ Automation settings (Auto-approval threshold 0.85, Suggestion mode toggle)
- ✅ Budget tracking toggle
- ✅ Phases management (all 10 phases editable)
- ✅ Add phase form with name and number
- ✅ Phase reorder/delete buttons
- ✅ Danger Zone (Archive, Delete buttons)

### Agent Panel (Chat)
- ✅ Chat interface opens with "Open chat" button
- ✅ Agent selector dropdown
- ✅ Available agents: Hub, Maya, Atlas, Nova, Echo
- ✅ Chat history preserved
- ✅ Markdown rendering in messages (bold, italic)
- ✅ Message input with @ mention button
- ✅ File attachment button
- ✅ Send button (disabled when empty)
- ✅ Agent switching works

### Mobile Responsiveness
- ✅ Sidebar hidden on mobile
- ✅ Bottom navigation bar (Business, Approvals, AI Team, More)
- ✅ Hamburger menu for navigation
- ✅ Filters stack vertically
- ✅ Full-width buttons
- ✅ Floating chat button positioned correctly

---

## UI/UX Review

### Design Consistency
- ✅ Consistent use of CSS variables (`rgb(var(--color-*))`)
- ✅ Proper dark/light mode support via theme variables
- ✅ Consistent spacing and typography
- ✅ Icon usage from Lucide React

### Accessibility
- ✅ Skip to main content link present
- ✅ Aria labels on interactive elements
- ✅ Breadcrumb navigation with proper structure
- ✅ Keyboard navigation appears supported

### Minor UI Suggestions
1. Consider adding loading skeletons for project cards
2. Add confirmation dialog before Archive/Delete in danger zone
3. Consider progress animation when phase status changes
4. Add tooltips for icon-only buttons

---

## Missing Pages/Features

Based on epic documentation review:

1. **Task Views** - Simple, Table, Kanban, Calendar, Timeline views exist but couldn't fully test due to Tasks API errors
2. **Project Analytics** - Not observed in testing
3. **Scribe Agent** (KB) - Not accessible due to CORS issues
4. **Phase Transitions** - UI exists but couldn't test end-to-end
5. **Bulk Task Operations** - Not tested due to no tasks

---

## Performance Observations

- Page loads are generally fast
- React Query caching appears to work
- WebSocket connection establishes successfully
- Some redundant API calls observed (templates fetched multiple times)

---

## Recommendations

### Immediate Actions (Before Beta Release)
1. **Fix KB CORS issues** - Route all KB API calls through Next.js proxy
2. **Fix Project not found bug** - Investigate session/workspace context issues
3. **Fix Tasks API** - Debug 400 Bad Request errors
4. **Implement presence API** - Or gracefully handle 404s

### Short-term Improvements
1. Add proper error boundaries with retry buttons
2. Implement optimistic UI updates for better UX
3. Add loading states for all async operations
4. Fix breadcrumb capitalization for dynamic segments

### Future Enhancements
1. Implement PM-specific agents (Navi, Sage, Chrono)
2. Add project templates beyond BMAD Course
3. Implement task dependencies visualization
4. Add project timeline/Gantt view

---

## Test Environment

- **Frontend:** Next.js 15 (localhost:3000)
- **Backend:** NestJS (localhost:3001)
- **Browser:** Playwright (Chromium)
- **Viewport Tested:** 1280x800 (Desktop), 375x812 (Mobile)
- **Test Duration:** ~45 minutes
- **Test Coverage:** Manual E2E via Playwright MCP

---

## Appendix: Console Errors Summary

```
[ERROR] 404 Not Found - /api/pm/presence/*
[ERROR] 400 Bad Request - /api/pm/projects/*/tasks
[ERROR] CORS - http://localhost:3001/api/kb/pages
[ERROR] CORS - http://localhost:3001/api/kb/templates
[ERROR] net::ERR_FAILED - KB API calls
```

---

*Report generated by Claude Code during automated beta testing session.*
