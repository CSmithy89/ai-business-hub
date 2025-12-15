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

## Wireframe References

All UI Shell wireframes are complete (43 total). Reference these when implementing:

### Core Shell & Navigation (6 wireframes)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| 07.1 Dashboard Layout | SH-01 Shell Layout | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-01_shell_layout_(three-panel)/code.html) |
| 07.2 Sidebar Navigation | SH-02 Navigation Sidebar | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-02_navigation_sidebar_(states)/code.html) |
| 07.3 Header Bar | SH-03 Header Bar | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-03_header_bar_with_dropdowns/code.html) |
| 07.3 Header Bar | SH-04 Status Bar | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-04_status_bar/code.html) |
| 07.6 Command Palette | SH-05 Command Palette | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-05_command_palette_(cmd+k)/code.html) |
| 07.10 Mobile Navigation | SH-06 Mobile Layout | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-06_mobile_layout/code.html) |

### Chat Interface (7 wireframes)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| 07.4 Chat Panel | CH-01 Chat Panel | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-01_chat_panel/code.html) |
| 07.4 Chat Panel | CH-02 Chat Messages | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-02_chat_messages_(all_types)_/code.html) |
| 07.4 Chat Panel | CH-03 Chat Input | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-03_chat_input_component/code.html) |
| 07.4 Chat Panel | CH-04 Typing Indicator | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-04_typing_indicator/code.html) |
| 07.4 Chat Panel | CH-05 Message Actions | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-05_message_actions_menu/code.html) |
| 07.4 Chat Panel | CH-06 Chat History | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-06_chat_history/code.html) |
| 07.4 Chat Panel | CH-07 Agent Switching | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-07_agent_switching/code.html) |

### AI Team Panel (5 wireframes)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| General | AI-01 AI Team Overview | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ai-01_ai_team_overview/code.html) |
| General | AI-02 Agent Card | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ai-02_agent_card_component/code.html) |
| General | AI-03 Agent Detail Modal | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ai-03_agent_detail_modal/code.html) |
| General | AI-04 Agent Activity Feed | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ai-04_agent_activity_feed/code.html) |
| General | AI-05 Agent Configuration | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/ai-05_agent_configuration/code.html) |

### Dashboard (1 wireframe)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| 07.9 Dashboard Home | DB-01 Dashboard Overview | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/db-01_dashboard_overview/code.html) |

### Data Components (6 wireframes) - Reusable across all modules
| Story | Wireframe | Assets |
|-------|-----------|--------|
| Components | DC-01 Data Tables | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-01_data_tables/code.html) |
| Components | DC-02 Data Cards | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-02_data_cards/code.html) |
| Components | DC-03 List Views | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-03_list_views/code.html) |
| Components | DC-04 Charts & Graphs | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-04_charts_%26_graphs/code.html) |
| Components | DC-05 Progress Indicators | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-05_progress_indicators/code.html) |
| Components | DC-06 Statistics | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/dc-06_statistics/code.html) |

### Forms & Inputs (5 wireframes) - Reusable across all modules
| Story | Wireframe | Assets |
|-------|-----------|--------|
| Components | FI-01 Text Inputs | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fi-01_text_inputs/code.html) |
| Components | FI-02 Select | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fi-02_select/code.html) |
| Components | FI-03 Checkboxes & Radios | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fi-03_checkboxes_%26_radios/code.html) |
| Components | FI-04 Date | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fi-04_date/code.html) |
| Components | FI-05 File Upload | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fi-05_file_upload/code.html) |

### Feedback & States (5 wireframes) - Reusable across all modules
| Story | Wireframe | Assets |
|-------|-----------|--------|
| Components | FS-01 Modals | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fs-01_modals/code.html) |
| Components | FS-02 Toast Notifications | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fs-02_toast_notifications/code.html) |
| Components | FS-03 Empty States | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fs-03_empty_states/code.html) |
| Components | FS-04 Error States | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fs-04_error_states/code.html) |
| Components | FS-05 Loading States | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/fs-05_loading_states/code.html) |

### Settings & Core UI (5 wireframes)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| Settings | ST-01 Settings Layout | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-01_settings_layout/code.html) |
| Settings | ST-07 Notification Settings | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-07_notification_settings/code.html) |
| 07.5 Dark/Light Mode | ST-08 Appearance | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-08_appearance/code.html) |
| 07.7 Notification Center | PM-16 Notifications | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/code.html) |
| General | PM-17 Global Search | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/code.html) |

### Core Platform UI (3 wireframes)
| Story | Wireframe | Assets |
|-------|-----------|--------|
| General | PM-18 User Profile | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-18_user_profile_%26_account/code.html) |
| General | PM-19 Onboarding Flow | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-19_onboarding_flow/code.html) |
| General | PM-20 Help & Support | [HTML](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-20_help_%26_support_center/code.html) |

**Total: 43 wireframes** · **Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

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
