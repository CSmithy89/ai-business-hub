# Epic Technical Specification: UI Shell

Date: 2025-12-04
Author: chris
Epic ID: EPIC-07
Status: Draft

---

## Overview

Epic 07 implements the responsive three-panel UI shell that serves as the primary navigation and interaction framework for the HYVVE platform. This epic delivers the conversation-first, keyboard-optimized interface that embodies the "90/5 Promise" - enabling users to accomplish complex business automation tasks through intuitive navigation, AI chat interactions, and streamlined approval workflows.

The UI Shell establishes the visual identity and interaction patterns that will be consistently applied across all modules (CRM, PM, Content, etc.). It provides the foundation for the dashboard home page, persistent chat panel, notification center, and command palette - critical components that enable rapid access to platform features without leaving context.

## Objectives and Scope

### In Scope

- **Dashboard Layout**: Three-panel structure (sidebar + main + chat) with responsive breakpoints
- **Sidebar Navigation**: Collapsible navigation with workspace switcher, module icons, active state
- **Header Bar**: Breadcrumbs, search trigger, notification bell, user menu dropdown
- **Chat Panel**: Persistent AI chat with message types, @mentions, streaming responses
- **Dark/Light Mode**: Theme toggle with next-themes, CSS variables from Style Guide
- **Command Palette**: Cmd+K palette using cmdk library for quick navigation
- **Notification Center**: Dropdown with read/unread states, mark as read actions
- **Keyboard Shortcuts**: Global shortcuts system (Cmd+K, Cmd+/, Cmd+B, etc.)
- **Dashboard Home Page**: Welcome message, quick stats cards, activity feed
- **Mobile Navigation**: Bottom nav bar, slide-out sidebar, touch-friendly targets

### Out of Scope

- Authentication UI (Epic 01 - already complete)
- Workspace management UI (Epic 02 - already complete)
- Approval queue dashboard (Epic 04 - already complete)
- Settings pages beyond theme toggle (Epic 02 - already complete)
- Module-specific UI (BM-CRM, BM-PM - future epics)
- Real-time chat backend integration (WebSocket - integrated in future stories)
- Agent avatar generation (deferred to UX polish phase)

## System Architecture Alignment

### Components Referenced

| Component | Purpose | Package |
|-----------|---------|---------|
| Next.js App Router | Page routing, layouts | `apps/web/src/app` |
| shadcn/ui | Component primitives | `apps/web/src/components/ui` |
| Zustand | UI state (sidebar, theme) | `apps/web/src/stores` |
| React Query | Server state (notifications) | `apps/web` |
| next-themes | Theme management | `apps/web` |
| cmdk | Command palette | `apps/web/src/components/command-palette.tsx` |
| Tailwind CSS 4 | Styling with design tokens | `apps/web/tailwind.config.ts` |

### Architecture Constraints

- **Design System**: Follow HYVVE Style Guide (warm cream light mode, near-black dark mode)
- **Responsive**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- **Accessibility**: WCAG 2.1 AA compliance - keyboard navigation, screen readers, focus indicators
- **Performance**: LCP < 2.5s, interaction response < 100ms
- **Theme**: CSS variables defined in Style Guide, respect system preference

### Wireframe References

All 43 UI Shell wireframes are complete. Reference these during implementation:

**Core Shell & Navigation (6 wireframes):**
- [SH-01: Shell Layout](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-01_shell_layout_(three-panel)/code.html) - Three-panel structure
- [SH-02: Navigation Sidebar](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-02_navigation_sidebar_(states)/code.html) - Sidebar states
- [SH-03: Header Bar](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-03_header_bar_with_dropdowns/code.html) - Header with dropdowns
- [SH-04: Status Bar](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-04_status_bar/code.html) - Status indicators
- [SH-05: Command Palette](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-05_command_palette_(cmd+k)/code.html) - Cmd+K palette
- [SH-06: Mobile Layout](../design/wireframes/Finished%20wireframes%20and%20html%20files/sh-06_mobile_layout/code.html) - Mobile navigation

**Chat Interface (7 wireframes):**
- [CH-01: Chat Panel](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-01_chat_panel/code.html) - Panel structure
- [CH-02: Chat Messages](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-02_chat_messages_(all_types)_/code.html) - Message types
- [CH-03: Chat Input](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-03_chat_input_component/code.html) - Input component
- [CH-04: Typing Indicator](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-04_typing_indicator/code.html) - Loading states
- [CH-05: Message Actions](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-05_message_actions_menu/code.html) - Actions menu
- [CH-06: Chat History](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-06_chat_history/code.html) - History view
- [CH-07: Agent Switching](../design/wireframes/Finished%20wireframes%20and%20html%20files/ch-07_agent_switching/code.html) - Agent selector

**Dashboard & Core UI:**
- [DB-01: Dashboard Overview](../design/wireframes/Finished%20wireframes%20and%20html%20files/db-01_dashboard_overview/code.html) - Home page
- [ST-08: Appearance Settings](../design/wireframes/Finished%20wireframes%20and%20html%20files/st-08_appearance/code.html) - Theme toggle
- [PM-16: Notifications Center](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-16_notifications_center/code.html) - Notification dropdown
- [PM-17: Global Search](../design/wireframes/Finished%20wireframes%20and%20html%20files/pm-17_global_search/code.html) - Search patterns

**Reusable Components (17 wireframes):**
- **Data Components (6)**: DC-01 Tables, DC-02 Cards, DC-03 Lists, DC-04 Charts, DC-05 Progress, DC-06 Statistics
- **Forms & Inputs (5)**: FI-01 Text, FI-02 Select, FI-03 Checkboxes, FI-04 Date, FI-05 Upload
- **Feedback & States (5)**: FS-01 Modals, FS-02 Toasts, FS-03 Empty, FS-04 Error, FS-05 Loading

**Full wireframe index:** [WIREFRAME-INDEX.md](../design/wireframes/WIREFRAME-INDEX.md)

---

## Detailed Design

### Services and Modules

| Service | Responsibility | Location | Owner |
|---------|----------------|----------|-------|
| DashboardLayout | Three-panel shell structure | `apps/web/src/app/(dashboard)/layout.tsx` | Frontend |
| Sidebar | Navigation with workspace switcher | `apps/web/src/components/shell/sidebar.tsx` | Frontend |
| Header | Breadcrumbs, search, notifications, user menu | `apps/web/src/components/shell/header.tsx` | Frontend |
| ChatPanel | Persistent AI chat interface | `apps/web/src/components/shell/chat-panel.tsx` | Frontend |
| CommandPalette | Cmd+K quick navigation | `apps/web/src/components/command-palette.tsx` | Frontend |
| NotificationCenter | Notification dropdown | `apps/web/src/components/notification-center.tsx` | Frontend |
| ThemeProvider | Dark/light mode management | `apps/web/src/components/providers/theme-provider.tsx` | Frontend |
| KeyboardShortcuts | Global shortcut handler | `apps/web/src/hooks/use-keyboard-shortcuts.ts` | Frontend |
| UIStore | Sidebar/panel state (Zustand) | `apps/web/src/stores/ui.ts` | Frontend |

### Data Models and Contracts

**UI State (Zustand Store):**

```typescript
// apps/web/src/stores/ui.ts
interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Chat panel state
  chatPanelOpen: boolean;
  chatPanelWidth: number; // 320-480px
  toggleChatPanel: () => void;
  setChatPanelWidth: (width: number) => void;

  // Command palette state
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Notification center
  notificationCenterOpen: boolean;
  toggleNotificationCenter: () => void;

  // Mobile navigation
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}
```

**Chat Message Types:**

```typescript
// apps/web/src/types/chat.ts
interface ChatMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;

  // Agent messages
  agentId?: string;       // e.g., 'hub', 'maya', 'atlas'
  agentName?: string;     // e.g., 'Hub', 'Maya', 'Atlas'
  agentIcon?: string;     // emoji or icon identifier
  agentColor?: string;    // hex color for agent

  // Message metadata
  isStreaming?: boolean;
  attachments?: Attachment[];
  actions?: MessageAction[];
}

interface MessageAction {
  id: string;
  label: string;
  icon?: string;
  variant: 'primary' | 'secondary' | 'ghost';
  onClick: () => void;
}
```

**Notification Types:**

```typescript
// apps/web/src/types/notification.ts
interface Notification {
  id: string;
  type: 'approval' | 'mention' | 'system' | 'agent_action';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
```

### APIs and Interfaces

**Client-Side State Management (No Backend APIs in This Epic):**

This epic focuses on UI components and client-side interactions. Backend integration points:

| Integration Point | Epic | Notes |
|-------------------|------|-------|
| User session | Epic 01 | Already complete - use existing session hook |
| Workspace context | Epic 02 | Already complete - use workspace store |
| Notifications API | Future | Mock data for now, real API in future epic |
| Chat backend | Future | Mock streaming for now, AgentOS integration later |

**Mock Data Structures:**

```typescript
// apps/web/src/lib/mock-data.ts
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Approval needed',
    message: 'Email campaign "Summer Sale" requires your review',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    read: false,
    priority: 'high',
  },
  // ... more mock notifications
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'agent',
    content: 'Hi! I\'m Hub, your AI orchestrator. How can I help you today?',
    timestamp: new Date(),
    agentId: 'hub',
    agentName: 'Hub',
    agentIcon: '🎯',
    agentColor: '#FF6B6B',
  },
  // ... more mock messages
];
```

### Workflows and Sequencing

**Dashboard Layout Rendering:**
```
1. User navigates to /dashboard
2. DashboardLayout component mounts
3. Load UI state from localStorage (sidebar collapsed, theme)
4. Render three panels:
   - Sidebar (64px collapsed / 256px expanded)
   - Main content area (flexible, min 600px)
   - Chat panel (320-480px / collapsed to icon)
5. Apply responsive breakpoints based on viewport
6. Initialize keyboard shortcuts
```

**Command Palette Flow:**
```
1. User presses Cmd+K (or Ctrl+K)
2. CommandPalette modal opens with focus
3. User types query (fuzzy search across pages, actions, recent items)
4. Results categorized: Pages, Quick Actions, Recent
5. User navigates with ↑/↓, selects with Enter
6. Navigate to selected page or execute action
7. Close on Escape or selection
```

**Chat Interaction Flow:**
```
1. User types message in chat input
2. On Enter, add user message to chat history
3. Show typing indicator for agent
4. Stream agent response (simulated with mock chunks)
5. Display agent message with avatar/color
6. If message has actions, render action buttons
7. User can copy, edit (future), or react (future) to messages
```

**Theme Toggle Flow:**
```
1. User clicks theme toggle in user menu or header
2. ThemeProvider updates theme state
3. next-themes updates <html> class attribute
4. CSS variables switch based on data-theme attribute
5. Save preference to localStorage
6. Apply transition animation (300ms)
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time (Dashboard) | < 2.5s | Lighthouse LCP |
| Sidebar toggle animation | 60fps | DevTools performance |
| Command palette open | < 100ms | Interaction response time |
| Chat message render | < 50ms per message | React DevTools profiler |
| Theme switch | < 300ms | Visual transition time |
| Mobile menu animation | 60fps | Touch-responsive |

### Accessibility

| Requirement | Implementation | Reference |
|-------------|----------------|-----------|
| Keyboard navigation | Full functionality without mouse | WCAG 2.1 AA |
| Focus indicators | Visible 2px outline on all interactive elements | NFR-A5 |
| Screen reader | Semantic HTML, ARIA labels, live regions | NFR-A3 |
| Color contrast | 4.5:1 for text, 3:1 for large text | NFR-A4 |
| Skip links | "Skip to main content" link at top | WCAG 2.4.1 |
| Reduced motion | Respect prefers-reduced-motion | WCAG 2.3.3 |

**Keyboard Shortcuts:**
- `Cmd+K` / `Ctrl+K`: Open command palette
- `Cmd+/` / `Ctrl+/`: Toggle chat panel
- `Cmd+B` / `Ctrl+B`: Toggle sidebar
- `Cmd+,` / `Ctrl+,`: Open settings
- `Cmd+1-5`: Quick nav to sections
- `Esc`: Close modals/palettes
- `Tab` / `Shift+Tab`: Navigate focusable elements
- `Space` / `Enter`: Activate buttons/links

### Responsiveness

| Breakpoint | Width | Layout | Behavior |
|------------|-------|--------|----------|
| Mobile | < 640px | Single panel | Bottom nav, sidebar slides over, chat fullscreen |
| Tablet | 640-1024px | Two panels | Sidebar + main, chat slides over |
| Desktop | 1024-1440px | Three panels | All panels visible |
| Wide | > 1440px | Three panels | Wider main content area |

**Touch Targets:**
- Minimum 44x44px for all interactive elements on mobile
- Increased spacing between buttons for thumb-friendly tapping
- Swipe gestures for panel navigation

### Design Tokens (CSS Variables)

From Style Guide, implement in `apps/web/src/styles/globals.css`:

```css
:root {
  /* Colors - Light Mode */
  --bg-cream: #FFFBF5;
  --bg-secondary: #F8F5F0;
  --color-primary: #FF6B6B;
  --color-accent: #20B2AA;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --border-light: #E5E5E5;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Layout */
  --sidebar-width-collapsed: 64px;
  --sidebar-width-expanded: 256px;
  --chat-panel-width-min: 320px;
  --chat-panel-width-max: 480px;
  --header-height: 64px;

  /* Animation */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
  --transition-slow: 500ms ease;
}

[data-theme="dark"] {
  --bg-cream: #0a0a0b;
  --bg-secondary: #1a1a1b;
  --color-primary: #FF6B6B;
  --color-accent: #20B2AA;
  --text-primary: #e5e5e5;
  --text-secondary: #a0a0a0;
  --border-light: #2a2a2b;
}
```

---

## Dependencies and Integrations

### npm Dependencies

```json
{
  "dependencies": {
    "next-themes": "^0.3.0",
    "cmdk": "^1.0.0",
    "zustand": "^4.5.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "@radix-ui/react-tooltip": "^1.0.0",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  }
}
```

### Epic Dependencies

- **Epic 00** (Complete): Project scaffolding, Next.js setup
- **Epic 01** (Complete): Authentication, session management
- **Epic 02** (Complete): Workspace management, workspace switcher

### Component Structure

```
apps/web/src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Story 07.1 - Dashboard Layout
│   │   ├── page.tsx                      # Story 07.9 - Dashboard Home
│   │   ├── approvals/                    # Epic 04 (existing)
│   │   ├── agents/                       # Future
│   │   └── settings/                     # Epic 02 (existing)
│   └── api/                              # Backend integration (future)
│
├── components/
│   ├── shell/
│   │   ├── sidebar.tsx                   # Story 07.2
│   │   ├── header.tsx                    # Story 07.3
│   │   ├── chat-panel.tsx                # Story 07.4
│   │   ├── mobile-nav.tsx                # Story 07.10
│   │   └── workspace-switcher.tsx        # Epic 02 (existing)
│   ├── command-palette.tsx               # Story 07.6
│   ├── notification-center.tsx           # Story 07.7
│   ├── theme-toggle.tsx                  # Story 07.5
│   ├── ui/                               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── tooltip.tsx
│   │   └── ... (other primitives)
│   └── providers/
│       └── theme-provider.tsx            # Story 07.5
│
├── hooks/
│   ├── use-keyboard-shortcuts.ts         # Story 07.8
│   ├── use-sidebar.ts                    # Story 07.2
│   └── use-chat-panel.ts                 # Story 07.4
│
├── stores/
│   └── ui.ts                             # Zustand store
│
├── lib/
│   └── mock-data.ts                      # Mock notifications/chat
│
└── styles/
    └── globals.css                       # Theme CSS variables
```

---

## Acceptance Criteria (Authoritative)

### AC-07.1: Dashboard Layout Component

1. Dashboard layout renders with three-panel structure (sidebar, main, chat)
2. Sidebar width: 64px collapsed, 256px expanded
3. Main content area: flexible width, minimum 600px
4. Chat panel: 320px-480px, collapsible to icon
5. Panel states persist in localStorage
6. Responsive breakpoints work correctly:
   - Mobile (<640px): Single panel, bottom nav
   - Tablet (640-1024px): Two panels
   - Desktop (>1024px): Three panels
7. Applied to all /dashboard/* routes via layout

### AC-07.2: Sidebar Navigation

1. Sidebar component renders with navigation items
2. Items displayed:
   - Dashboard (📊)
   - Approvals (✅) with badge count
   - Agents (🤖)
   - Settings (⚙️)
3. Collapsed/expanded toggle button works
4. Active route indicator highlights current page
5. Tooltips appear on hover in collapsed state
6. Full keyboard navigation with Tab/Arrow keys
7. Workspace selector at bottom opens dropdown

### AC-07.3: Header Bar

1. Header component renders with all elements
2. Logo/brand on left
3. Breadcrumb navigation shows current path
4. Search/command palette trigger (Cmd+K hint)
5. Notification bell with unread count badge
6. User menu dropdown opens with:
   - Profile link
   - Settings link
   - Sign out action
7. Help link (? icon)

### AC-07.4: Chat Panel

1. ChatPanel component renders
2. Message list displays with scroll
3. Message types render correctly:
   - User messages (right-aligned, gray background)
   - Agent messages (left, with avatar and color)
   - System messages (centered, muted)
4. Input area with:
   - Text input
   - @mention support (autocomplete agents)
   - Send button (or Enter key)
5. Collapse/expand toggle works
6. Minimizes to icon when collapsed
7. Streaming response display (simulated)

### AC-07.5: Dark/Light Mode

1. next-themes installed and configured
2. Theme toggle component in header/user menu
3. CSS variables applied from Style Guide:
   - Light: --bg-cream, warm tones
   - Dark: --bg-dark-primary, elevated surfaces
4. Theme preference persists across sessions
5. System preference respected on first visit
6. Smooth 300ms transition animation on toggle

### AC-07.6: Command Palette

1. CommandPalette component using cmdk library
2. Opens with Cmd/Ctrl+K
3. Search functionality:
   - Navigate to pages (Dashboard, Approvals, Settings, etc.)
   - Quick actions (New workspace, View profile, etc.)
   - Search content (future - mock for now)
4. Keyboard navigation: ↑/↓ arrows, Enter to select
5. Recent items section shows last 5 visited pages
6. Categorized results: Pages, Actions, Recent
7. Closes on Escape or selection

### AC-07.7: Notification Center

1. NotificationCenter component renders
2. Dropdown from header bell icon
3. Lists notifications with:
   - Icon by type (approval, mention, system, agent)
   - Title and message
   - Timestamp (relative, e.g., "15 min ago")
   - Read/unread visual indicator
4. Mark as read on click
5. "Mark all as read" button at top
6. Empty state when no notifications
7. Link to full notification settings (future)

### AC-07.8: Keyboard Shortcuts

1. Global keyboard shortcut system implemented
2. Shortcuts work:
   - Cmd+K: Command palette
   - Cmd+/: Chat panel toggle
   - Cmd+B: Sidebar toggle
   - Cmd+,: Settings
   - Cmd+1-5: Quick nav to sections
   - Esc: Close modals/palettes
3. Shortcuts display in command palette help section
4. Shortcuts help modal accessible (? icon or Cmd+?)

### AC-07.9: Dashboard Home Page

1. Page at /dashboard route
2. Welcome message with user name
3. Quick stats cards:
   - Pending approvals count
   - Active agents count
   - Today's token usage
4. Recent activity feed (mock data)
5. Quick actions section (buttons for common tasks)
6. Responsive layout adapts to viewport

### AC-07.10: Mobile Navigation

1. Bottom navigation bar renders on mobile (<640px)
2. Slide-out sidebar opens on tap
3. Chat opens as full-screen overlay
4. Touch-friendly tap targets (min 44x44px)
5. Swipe gestures for panels (left/right)
6. Bottom nav hides on scroll down, shows on scroll up

---

## Traceability Mapping

| AC | Spec Section | Component(s) | Test Approach |
|----|--------------|--------------|---------------|
| AC-07.1 | Dashboard Layout | DashboardLayout, UIStore | Visual: verify panel widths, localStorage persistence |
| AC-07.2 | Sidebar Navigation | Sidebar, use-sidebar | Interaction: toggle, keyboard nav, tooltips |
| AC-07.3 | Header Bar | Header, NotificationCenter, UserMenu | Visual: all elements present, dropdowns work |
| AC-07.4 | Chat Panel | ChatPanel, ChatMessage, use-chat-panel | Interaction: message types, streaming, collapse |
| AC-07.5 | Dark/Light Mode | ThemeProvider, theme-toggle | Visual: theme switch, CSS variable inspection |
| AC-07.6 | Command Palette | CommandPalette (cmdk) | Interaction: open, search, navigate, close |
| AC-07.7 | Notification Center | NotificationCenter | Interaction: dropdown, mark as read, empty state |
| AC-07.8 | Keyboard Shortcuts | use-keyboard-shortcuts | Manual: test all shortcuts |
| AC-07.9 | Dashboard Home | /dashboard/page.tsx | Visual: stats cards, activity feed, layout |
| AC-07.10 | Mobile Navigation | MobileNav, bottom nav | Visual: responsive, swipe gestures, touch targets |

---

## Risks, Assumptions, Open Questions

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **R1**: cmdk library performance with large datasets | Medium | Medium | Implement pagination, limit results to 50 |
| **R2**: Theme transition flicker on page load | Low | Low | Use next-themes suppressHydrationWarning |
| **R3**: Mobile swipe gestures conflict with native browser gestures | Medium | Medium | Implement carefully, test on multiple devices |
| **R4**: Chat panel scroll performance with many messages | Medium | Medium | Virtualized list with react-window (future optimization) |
| **R5**: Sidebar collapse animation janky on low-end devices | Low | Low | Use CSS transforms (GPU-accelerated) |

### Assumptions

| Assumption | Rationale |
|------------|-----------|
| **A1**: shadcn/ui components work with Tailwind CSS 4 | shadcn maintained for latest Tailwind |
| **A2**: next-themes compatible with Next.js 15 | next-themes actively maintained |
| **A3**: Users have JavaScript enabled | Modern SaaS requirement |
| **A4**: Browsers support CSS custom properties | All modern browsers support |
| **A5**: Mock data sufficient for UI demonstration | Real backend integration in future epics |

### Open Questions

| Question | Owner | Decision Needed By |
|----------|-------|-------------------|
| **Q1**: Should chat panel support multiple concurrent conversations (tabs)? | Product | Story 07.4 |
| **Q2**: Notification retention period (how long before auto-delete)? | Product | Story 07.7 |
| **Q3**: Should command palette include emoji shortcuts (e.g., `:smile:`)? | UX | Story 07.6 |
| **Q4**: Mobile: gesture swipe distance threshold (px)? | UX | Story 07.10 |

---

## Test Strategy Summary

### Test Levels

| Level | Scope | Framework | Coverage Target |
|-------|-------|-----------|-----------------|
| **Unit** | Component rendering, hooks | Vitest + React Testing Library | 80% |
| **Visual** | Component appearance, responsive | Storybook + Chromatic | All components |
| **Interaction** | User flows, keyboard nav | Playwright | Critical paths |
| **Accessibility** | WCAG 2.1 AA compliance | axe-core, WAVE | 100% automated checks |

### Test Plan

1. **Story 07.1**: Visual regression on layout, responsive breakpoints
2. **Story 07.2**: Keyboard nav, tooltip display, toggle animation
3. **Story 07.3**: Dropdown interactions, breadcrumb navigation
4. **Story 07.4**: Message rendering, @mention autocomplete, collapse
5. **Story 07.5**: Theme switch, CSS variable inspection, persistence
6. **Story 07.6**: Command palette search, keyboard nav, fuzzy matching
7. **Story 07.7**: Notification dropdown, mark as read, badge count
8. **Story 07.8**: All keyboard shortcuts work as documented
9. **Story 07.9**: Dashboard stats render, activity feed scrolls
10. **Story 07.10**: Mobile bottom nav, swipe gestures, touch targets

### Edge Cases to Verify

- **Long notification messages**: Text truncates with ellipsis
- **No notifications**: Empty state displays correctly
- **Long chat messages**: Word wrap, scroll behavior
- **Rapid theme toggling**: No race conditions
- **Command palette with no results**: "No results found" message
- **Sidebar collapse during navigation**: State preserved
- **Mobile landscape orientation**: Layout adapts
- **Slow network**: Loading states for async data (future)

### Accessibility Testing

- **Keyboard-only navigation**: Complete all user flows without mouse
- **Screen reader**: Test with NVDA/JAWS on Windows, VoiceOver on Mac/iOS
- **Focus indicators**: Verify visible on all interactive elements
- **Color contrast**: Use WAVE or axe DevTools to verify ratios
- **ARIA labels**: Ensure all buttons/icons have descriptive labels

---

## Story Breakdown (Epic 07 - 10 Stories)

| Story | Title | Points | Dependencies |
|-------|-------|--------|--------------|
| 07.1 | Create Dashboard Layout Component | 3 | Epic 00 (scaffolding) |
| 07.2 | Create Sidebar Navigation | 3 | 07.1 |
| 07.3 | Create Header Bar | 2 | 07.1 |
| 07.4 | Implement Chat Panel | 3 | 07.1 |
| 07.5 | Implement Dark/Light Mode | 2 | 07.1 |
| 07.6 | Create Command Palette | 3 | 07.1, 07.2 |
| 07.7 | Create Notification Center | 2 | 07.3 |
| 07.8 | Implement Keyboard Shortcuts | 2 | 07.6 |
| 07.9 | Create Dashboard Home Page | 2 | 07.1, 07.2, 07.3 |
| 07.10 | Create Mobile Navigation | 2 | 07.1, 07.2 |

**Total: 24 points**

---

## Implementation Notes

### Story 07.1: Dashboard Layout Component
- Use Next.js App Router layout structure
- Implement ResizePanel for chat panel width adjustment
- Store sidebar/panel states in Zustand + localStorage
- Use CSS Grid for three-panel layout
- Media queries for responsive breakpoints

### Story 07.2: Sidebar Navigation
- shadcn/ui components: Tooltip, Button
- Dynamic active state from usePathname()
- Lucide React icons for navigation items
- Badge component for approval count (from React Query)
- Workspace switcher dropdown (Epic 02 integration)

### Story 07.3: Header Bar
- shadcn/ui components: DropdownMenu, Separator
- Breadcrumb component with Next.js Link
- Search trigger opens command palette (07.6)
- User menu with avatar (from session)
- Notification bell badge from NotificationCenter (07.7)

### Story 07.4: Chat Panel
- Message list with auto-scroll to bottom
- Agent avatar/color from agent registry
- @mention autocomplete with Radix Popover
- Streaming simulation with async generator
- Message actions: Copy, Edit (future), React (future)

### Story 07.5: Dark/Light Mode
- next-themes ThemeProvider in root layout
- CSS variables switch via [data-theme] attribute
- Theme toggle in Header + Settings page
- Smooth transition with transition-colors class
- System preference detection on first visit

### Story 07.6: Command Palette
- cmdk library for fuzzy search
- Command groups: Pages, Quick Actions, Recent
- Recent items from localStorage
- Keyboard hints (Cmd+K to open, ↓↑ to navigate)
- Quick actions: Navigate, Create workspace, etc.

### Story 07.7: Notification Center
- Dropdown with ScrollArea (shadcn/ui)
- Badge count on bell icon in Header
- Mark as read updates local state (API call future)
- Relative timestamps with date-fns
- Empty state with illustration

### Story 07.8: Keyboard Shortcuts
- useKeyboardShortcuts custom hook
- Event listener on window/document
- Prevent default for Cmd+K, Cmd+/
- Shortcuts help modal (Dialog)
- Platform detection (Mac vs Windows)

### Story 07.9: Dashboard Home Page
- Stats cards with shadcn/ui Card component
- Activity feed with ScrollArea
- Quick actions with Button grid
- Welcome message with user name from session
- Responsive grid layout

### Story 07.10: Mobile Navigation
- Bottom navigation with fixed positioning
- Slide-out sidebar with Sheet (shadcn/ui)
- Fullscreen chat with Dialog
- Touch targets 44x44px minimum
- Swipe detection with touch events

---

_Generated by BMAD Epic Technical Context Workflow v1.0_
_Date: 2025-12-04_
_For: chris_
