# Epic 07: UI Shell

**Epic ID:** EPIC-07
**Status:** Ready for Development
**Priority:** P0 - Critical
**Phase:** Phase 1-3 (Progressive)

---

## Epic Overview

Implement the responsive three-panel UI shell with sidebar navigation, main content area, and collapsible chat panel.

### Business Value
The UI shell provides consistent navigation and AI interaction across the platform. The keyboard-first, conversation-driven design enables the 90/5 efficiency promise.

### Success Criteria
- [ ] Three-panel layout functional
- [ ] Sidebar navigation with module icons
- [ ] Workspace switcher working
- [ ] Chat panel accessible from any view
- [ ] Dark/light mode toggle
- [ ] Command palette operational
- [ ] Responsive on tablet/mobile

---

## Stories

### Story 07.1: Create Dashboard Layout Component

**Points:** 3
**Priority:** P0

**As a** user
**I want** a consistent app shell layout
**So that** I can navigate the platform easily

**Acceptance Criteria:**
- [ ] Create `DashboardLayout` component
- [ ] Three-panel structure:
  - Sidebar: 64px collapsed, 256px expanded
  - Main: Flexible, min 600px
  - Chat: 320px-480px, collapsible
- [ ] Persist panel states in localStorage
- [ ] Responsive breakpoints:
  - Mobile (<640px): Single panel, bottom nav
  - Tablet (640-1024px): Two panels
  - Desktop (>1024px): Three panels
- [ ] Apply to all dashboard routes

---

### Story 07.2: Create Sidebar Navigation

**Points:** 3
**Priority:** P0

**As a** user
**I want** clear sidebar navigation
**So that** I can access all platform features

**Acceptance Criteria:**
- [ ] Create `Sidebar` component
- [ ] Navigation items:
  - Dashboard (📊)
  - Approvals (✅) with badge
  - Agents (🤖)
  - Settings (⚙️)
- [ ] Collapsed/expanded toggle
- [ ] Active state indicator
- [ ] Tooltips on collapsed state
- [ ] Keyboard navigation support
- [ ] Workspace selector at bottom

---

### Story 07.3: Create Header Bar

**Points:** 2
**Priority:** P0

**As a** user
**I want** a header bar with key actions
**So that** I can access common functions

**Acceptance Criteria:**
- [ ] Create `Header` component
- [ ] Logo/brand on left
- [ ] Breadcrumb navigation
- [ ] Search/command palette trigger (Cmd+K)
- [ ] Notification bell with unread count
- [ ] User menu dropdown:
  - Profile
  - Settings
  - Sign out
- [ ] Help link

---

### Story 07.4: Implement Chat Panel

**Points:** 3
**Priority:** P0

**As a** user
**I want** a persistent chat panel
**So that** I can interact with AI agents

**Acceptance Criteria:**
- [ ] Create `ChatPanel` component
- [ ] Message list with scroll
- [ ] Message types:
  - User messages (right-aligned)
  - Agent messages (left, with avatar)
  - System messages (centered, muted)
- [ ] Input area with:
  - Text input
  - @mention support
  - Send button
- [ ] Collapse/expand toggle
- [ ] Minimize to icon when collapsed
- [ ] Streaming response display

---

### Story 07.5: Implement Dark/Light Mode

**Points:** 2
**Priority:** P0

**As a** user
**I want** to choose dark or light theme
**So that** I can work comfortably

**Acceptance Criteria:**
- [ ] Use next-themes for theme management
- [ ] Create theme toggle component
- [ ] Apply CSS variables from Style Guide:
  - Light: `--bg-cream`, warm tones
  - Dark: `--bg-dark-primary`, etc.
- [ ] Persist preference
- [ ] Support system preference
- [ ] Smooth transition on toggle

---

### Story 07.6: Create Command Palette

**Points:** 3
**Priority:** P1

**As a** power user
**I want** a command palette (Cmd+K)
**So that** I can navigate quickly

**Acceptance Criteria:**
- [ ] Create `CommandPalette` component
- [ ] Open with Cmd/Ctrl+K
- [ ] Search functionality:
  - Navigate to pages
  - Quick actions
  - Search content
- [ ] Keyboard navigation (up/down, enter)
- [ ] Recent items
- [ ] Categorized results
- [ ] Close on selection or Escape

---

### Story 07.7: Create Notification Center

**Points:** 2
**Priority:** P1

**As a** user
**I want** a notification center
**So that** I can see important updates

**Acceptance Criteria:**
- [ ] Create `NotificationCenter` component
- [ ] Dropdown from header bell icon
- [ ] List notifications with:
  - Icon by type
  - Title and message
  - Timestamp
  - Read/unread state
- [ ] Mark as read on click
- [ ] Mark all as read button
- [ ] Empty state when no notifications
- [ ] Link to full notification settings

---

### Story 07.8: Implement Keyboard Shortcuts

**Points:** 2
**Priority:** P1

**As a** power user
**I want** keyboard shortcuts
**So that** I can work faster

**Acceptance Criteria:**
- [ ] Create keyboard shortcut system
- [ ] Global shortcuts:
  - Cmd+K: Command palette
  - Cmd+/: Chat panel toggle
  - Cmd+B: Sidebar toggle
  - Cmd+,: Settings
  - Cmd+1-5: Quick nav to sections
- [ ] Show shortcuts in command palette
- [ ] Create shortcuts help modal

---

### Story 07.9: Create Dashboard Home Page

**Points:** 2
**Priority:** P0

**As a** user
**I want** a dashboard home page
**So that** I can see an overview of my workspace

**Acceptance Criteria:**
- [ ] Create page at `/dashboard`
- [ ] Welcome message with user name
- [ ] Quick stats cards:
  - Pending approvals
  - Active agents
  - Today's token usage
- [ ] Recent activity feed
- [ ] Quick actions section
- [ ] Responsive layout

---

### Story 07.10: Create Mobile Navigation

**Points:** 2
**Priority:** P2

**As a** mobile user
**I want** touch-friendly navigation
**So that** I can use the platform on my phone

**Acceptance Criteria:**
- [ ] Bottom navigation bar for mobile
- [ ] Slide-out sidebar on tap
- [ ] Chat as full-screen overlay
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Swipe gestures for panels
- [ ] Hide on scroll for more space

---

## Dependencies

- Epic 00: Project Scaffolding
- Epic 01: Authentication (for user context)
- Epic 02: Workspace Management (for workspace switcher)

## Technical Notes

### Component Library
Using shadcn/ui components customized to Hyvve brand:
- Install: `npx shadcn@latest init`
- Theme: Custom theme following Style Guide

### State Management
- UI state (sidebar, theme): Zustand
- Server state (notifications): React Query

### Accessibility
- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader support
- Focus management

---

_Epic created: 2025-11-30_
_PRD Reference: FR-6 UI Shell_
