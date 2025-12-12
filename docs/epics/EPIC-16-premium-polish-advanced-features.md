# Epic 16: Premium Polish & Advanced Features

**Epic ID:** EPIC-16
**Status:** Ready for Development
**Priority:** P2/P3 - Medium & Low Priority
**Phase:** Phase 8 - Platform Polish
**Source:** UI-UX-IMPROVEMENTS-BACKLOG.md (User Testing + Style Guide Audit)
**Prerequisite:** EPIC-15 (UI/UX Platform Foundation)

---

## Epic Overview

Implement premium polish, advanced interactions, and nice-to-have features that elevate HYVVE from functional to delightful. This epic focuses on responsive design, micro-animations, loading states, real-time updates, and celebration moments that create an exceptional user experience.

### Business Value

While EPIC-15 delivers core functionality, EPIC-16 delivers the "wow" factor that differentiates HYVVE from competitors. Premium polish, thoughtful animations, and real-time updates make users feel they're using a cutting-edge AI platform worthy of their trust.

### Success Criteria

- [ ] Responsive design works flawlessly from mobile to 4K
- [ ] All loading states use skeleton screens (no full-page spinners)
- [ ] Micro-animations provide feedback on all interactions
- [ ] Real-time updates via WebSocket for approvals and agents
- [ ] Keyboard shortcuts enable power-user efficiency
- [ ] Empty states feature character illustrations
- [ ] Celebration moments reward task completion

---

## Stories

### Chapter 1: Responsive Design (P2)

---

### Story 16.1: Implement Medium Screen Layout (1024-1280px)

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 9.1

**As a** user on a laptop or smaller monitor
**I want** the layout to adapt intelligently
**So that** I have sufficient workspace

**Acceptance Criteria:**
- [ ] At 1024-1280px width:
  - Auto-collapse sidebar to icon-only mode
  - OR auto-collapse chat panel (not both visible at full width)
- [ ] Toggle to switch between sidebar and chat priority
- [ ] Main content area maintains minimum 600px usable width
- [ ] Sidebar collapse persists in localStorage
- [ ] Smooth transition animation on collapse/expand
- [ ] Hover to temporarily expand collapsed sidebar

**Technical Notes:**
- Use CSS media queries + JS for interactive elements
- Store user preference: `layout-priority: sidebar | chat`

**Files to Modify:**
- `apps/web/src/components/layout/app-layout.tsx`
- `apps/web/src/hooks/use-responsive-layout.ts`
- `apps/web/src/app/globals.css`

---

### Story 16.2: Implement Tablet Layout (768-1024px)

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 9.2

**As a** user on a tablet
**I want** touch-friendly navigation
**So that** I can use the platform comfortably

**Acceptance Criteria:**
- [ ] Sidebar becomes overlay/drawer:
  - Slides in from left
  - Dark backdrop behind
  - Swipe to close
  - Hamburger menu to open
- [ ] Chat becomes bottom sheet or modal:
  - Swipe up to open from tab bar
  - Draggable to adjust height
  - Swipe down to close
- [ ] Touch-friendly button sizes:
  - Minimum tap target: 44x44px
  - Adequate spacing between targets
- [ ] Navigation items larger in touch mode
- [ ] Swipe gestures for common actions

**Technical Notes:**
- Use `@media (pointer: coarse)` for touch detection
- Drawer component from shadcn/ui
- Touch gesture library: `use-gesture`

**Files to Create:**
- `apps/web/src/components/layout/mobile-sidebar.tsx`
- `apps/web/src/components/layout/chat-bottom-sheet.tsx`

---

### Story 16.3: Implement Mobile Layout (<768px)

**Points:** 5
**Priority:** P2
**Backlog Reference:** Section 9.3

**As a** user on a mobile phone
**I want** a fully mobile-optimized experience
**So that** I can manage my business on the go

**Acceptance Criteria:**
- [ ] Bottom navigation bar with:
  - Dashboard icon
  - Businesses icon
  - Approvals icon (with badge)
  - AI Team icon
  - More (opens menu)
- [ ] Full-screen pages (no visible sidebar)
- [ ] Hamburger menu for settings and secondary nav
- [ ] Chat as full-screen modal:
  - Floating action button to open
  - Full-screen when open
  - Easy close (X button + swipe down)
- [ ] Cards stack vertically (single column)
- [ ] Forms optimized for mobile keyboards
- [ ] Pull-to-refresh where applicable

**Navigation Bar Design:**
```
┌─────────────────────────────────────────────────┐
│ 🏠      🏢      ✓      🤖      ⋯               │
│ Home   Business Approvals AI Team More          │
└─────────────────────────────────────────────────┘
```

**Technical Notes:**
- Use CSS `@supports (padding-bottom: env(safe-area-inset-bottom))`
- Test on iOS and Android
- Consider PWA capabilities

**Files to Create:**
- `apps/web/src/components/layout/mobile-nav.tsx`
- `apps/web/src/components/layout/mobile-layout.tsx`

---

### Story 16.4: Clarify Workspace vs Business Relationship

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 2.4

**As a** user
**I want** clarity on workspaces vs businesses
**So that** I understand the platform structure

**Acceptance Criteria:**
- [ ] Auto-select workspace when user has only one
- [ ] Remove "No Workspace Selected" message
- [ ] Clear UI hierarchy:
  - Workspace = your organization/team
  - Business = individual business you're validating/building
- [ ] Tooltip or help text explaining relationship
- [ ] If concepts are redundant, merge them

**Technical Notes:**
- May require data model discussion
- Affects middleware and context providers

**Files to Modify:**
- `apps/web/src/providers/workspace-provider.tsx`
- `apps/web/src/components/layout/workspace-selector.tsx`

---

### Chapter 2: Loading States & Feedback (P2)

---

### Story 16.5: Implement Skeleton Loading Screens

**Points:** 5
**Priority:** P2
**Backlog Reference:** Section 14.7, 12.3

**As a** user waiting for content to load
**I want** skeleton placeholders showing content structure
**So that** I know content is coming and where it will appear

**Acceptance Criteria:**
- [ ] Create skeleton variants for:
  - Card skeleton (business, agent, approval)
  - Table row skeleton
  - List item skeleton
  - Form skeleton
  - Chat message skeleton
  - Stat card skeleton
- [ ] Pulse animation on all skeletons
- [ ] Match actual content layout exactly
- [ ] Skeletons appear immediately (no delay)
- [ ] Apply to all data-fetching components:
  - Businesses portfolio
  - Approvals list
  - AI Team grid
  - Settings pages
  - Dashboard stats

**Skeleton Design:**
```
┌──────────────────────┐
│ ░░░░░░               │  ← Avatar placeholder
│ ░░░░░░░░░░░░░        │  ← Title placeholder
│ ░░░░░░░░░░           │  ← Subtitle placeholder
│                      │
│ ░░░░░░░░░░░░░░░░░░░░ │  ← Content placeholder
│ ░░░░░░░░░░░░░░       │
└──────────────────────┘
```

**Technical Notes:**
- Use CSS `@keyframes` for pulse
- shadcn Skeleton component as base
- Replace spinners with skeletons everywhere

**Files to Create:**
- `apps/web/src/components/ui/skeleton-card.tsx`
- `apps/web/src/components/ui/skeleton-table.tsx`
- `apps/web/src/components/ui/skeleton-list.tsx`

---

### Story 16.6: Implement Optimistic UI Updates

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 14.7

**As a** user performing actions
**I want** immediate visual feedback
**So that** the platform feels responsive

**Acceptance Criteria:**
- [ ] Optimistic updates for:
  - Approval approve/reject (show success before server confirms)
  - Chat message send (show message immediately)
  - Settings save (show saved state immediately)
  - Business status changes
- [ ] Rollback on error with toast notification
- [ ] Subtle loading indicator for background sync
- [ ] Retry mechanism for failed updates

**Technical Notes:**
- Use React Query's optimistic updates
- Store pending operations for offline recovery
- Error boundary for failed rollbacks

**Files to Modify:**
- `apps/web/src/hooks/use-approvals.ts`
- `apps/web/src/hooks/use-chat.ts`
- `apps/web/src/hooks/use-settings.ts`

---

### Story 16.7: Implement Form Validation & Feedback

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 7.2

**As a** user filling out forms
**I want** clear validation feedback
**So that** I can correct errors easily

**Acceptance Criteria:**
- [ ] Consistent error message styling:
  - Red text color
  - Error icon
  - Below the field
- [ ] Success toast notifications for completed actions
- [ ] Loading states on all form submissions:
  - Button shows spinner
  - Button disabled during submit
  - Form inputs disabled during submit
- [ ] Inline validation feedback:
  - Red border on error
  - Green checkmark on valid (optional)
  - Real-time validation for passwords

**Technical Notes:**
- Use Zod for validation
- shadcn Toast for notifications
- React Hook Form for form state

**Files to Modify:**
- All form components
- `apps/web/src/components/ui/form-field.tsx`

---

### Story 16.8: Implement Demo Mode Consistency

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 12.2

**As a** user in demo mode
**I want** consistent demo data across all pages
**So that** I can explore the platform realistically

**Acceptance Criteria:**
- [ ] Demo data available for:
  - 3-5 businesses with varied statuses
  - 5-10 approval items across confidence levels
  - 5 agents with activity
  - Settings with pre-filled data
- [ ] Clear "Demo Mode" indicator:
  - Banner at top of page
  - Dismissable (remembers dismissal)
  - Link to "Exit Demo Mode" (requires real setup)
- [ ] Easy toggle between demo and live mode for development
- [ ] Demo data is realistic and helpful for exploration

**Technical Notes:**
- Demo data in `apps/web/src/lib/demo-data.ts`
- Environment variable: `NEXT_PUBLIC_DEMO_MODE`

**Files to Create:**
- `apps/web/src/lib/demo-data.ts`
- `apps/web/src/components/demo-mode-banner.tsx`

---

### Chapter 3: Micro-Animations & Premium Feel (P2)

---

### Story 16.9: Implement Hover & Press Animations

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 14.1

**As a** user interacting with elements
**I want** subtle animation feedback
**So that** interactions feel responsive and premium

**Acceptance Criteria:**
- [ ] Hover lift effect on cards:
  - `transform: translateY(-2px)`
  - Subtle shadow increase
  - 200ms ease-out transition
- [ ] Button press feedback:
  - `transform: scale(0.98)` on active
  - 100ms duration
- [ ] Link hover underline animation
- [ ] Icon button scale on hover (1.05)
- [ ] List item hover background change
- [ ] Transitions on all color/shadow changes

**CSS Utility Classes:**
```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.press-feedback:active {
  transform: scale(0.98);
}
```

**Technical Notes:**
- Apply via Tailwind classes or CSS modules
- Respect `prefers-reduced-motion` media query

**Files to Modify:**
- `apps/web/src/app/globals.css`
- Various component files

---

### Story 16.10: Implement Page Transition Animations

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 14.1

**As a** user navigating between pages
**I want** smooth page transitions
**So that** navigation feels fluid

**Acceptance Criteria:**
- [ ] Page enter animation:
  - Fade in: `opacity: 0 → 1`
  - Slide up: `translateY(10px) → 0`
  - Duration: 200ms
- [ ] Page exit animation (optional):
  - Fade out
  - Duration: 100ms
- [ ] Maintain scroll position on back navigation
- [ ] Respect `prefers-reduced-motion`

**Technical Notes:**
- Use Framer Motion or CSS transitions
- Next.js App Router layout transitions

**Files to Modify:**
- `apps/web/src/app/(app)/layout.tsx`
- Create animation wrapper component

---

### Story 16.11: Implement Modal & Dropdown Animations

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 14.1

**As a** user opening modals and dropdowns
**I want** smooth open/close animations
**So that** transitions don't feel jarring

**Acceptance Criteria:**
- [ ] Modal scale-in animation:
  - Enter: `scale(0.95) → scale(1)` + `opacity: 0 → 1`
  - Exit: reverse
  - Duration: 150ms
- [ ] Dropdown slide animation:
  - Enter: `translateY(-4px) → 0` + fade
  - Exit: reverse
  - Duration: 100ms
- [ ] Backdrop fade animation
- [ ] Focus trap maintains during animation

**Technical Notes:**
- shadcn Dialog and Dropdown have animation support
- May need to customize Radix primitives

**Files to Modify:**
- `packages/ui/src/components/dialog.tsx`
- `packages/ui/src/components/dropdown-menu.tsx`

---

### Story 16.12: Implement Premium Shadow System

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 14.2

**As a** user viewing the interface
**I want** a cohesive shadow system
**So that** elevation is clear and consistent

**Acceptance Criteria:**
- [ ] Define shadow scale:
  ```css
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
  --shadow-primary: 0 4px 12px rgba(255, 107, 107, 0.25);
  ```
- [ ] Apply consistently:
  - Cards at rest: `shadow-sm`
  - Cards on hover: `shadow-md`
  - Modals/dialogs: `shadow-lg`
  - Dropdowns: `shadow-md`
  - Primary buttons: `shadow-primary`
- [ ] Dark mode: Use glows instead of shadows
  ```css
  --glow-sm: 0 0 12px rgba(255, 107, 107, 0.15);
  --glow-md: 0 0 24px rgba(255, 107, 107, 0.2);
  ```

**Technical Notes:**
- Shadows should be "soft, subtle - never harsh"
- Test on both light and dark backgrounds

**Files to Modify:**
- `apps/web/src/app/globals.css`
- `tailwind.config.ts` (extend shadow scale)

---

### Story 16.13: Implement Typography Refinements

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 14.3

**As a** user reading content
**I want** refined typography
**So that** text is comfortable to read

**Acceptance Criteria:**
- [ ] Verify Inter font loads correctly (400, 500, 600, 700)
- [ ] Apply letter-spacing to headings:
  - H1-H3: `-0.02em` (--tracking-tighter)
  - H4-H6: `-0.01em` (--tracking-tight)
- [ ] Body text line-height: `1.6-1.75`
- [ ] JetBrains Mono for code/monospace content
- [ ] Prose styles for long-form content:
  - Max width: 65ch
  - Paragraph spacing
  - Proper heading hierarchy

**Technical Notes:**
- Fonts loaded via next/font
- Apply Tailwind typography plugin for prose

**Files to Modify:**
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css`
- `tailwind.config.ts`

---

### Story 16.14: Audit Background Color Usage

**Points:** 1
**Priority:** P2
**Backlog Reference:** Section 13.6

**As a** platform
**I want** consistent background color usage
**So that** elevation hierarchy is clear

**Acceptance Criteria:**
- [ ] Audit all pages for background usage:
  - Main background: cream `#FFFBF5`
  - Cards/elevated surfaces: white `#FFFFFF`
  - Subtle sections: soft `#FFF8F0`
- [ ] Sidebar uses appropriate background (cream or slightly darker)
- [ ] No pure white backgrounds where cream should be
- [ ] Consistent across all pages

**Technical Notes:**
- May require CSS variable updates
- Use browser devtools to audit

**Files to Modify:**
- Various layout and component files

---

### Chapter 4: Real-Time & Advanced Interactions (P2)

---

### Story 16.15: Implement WebSocket Real-Time Updates

**Points:** 5
**Priority:** P2
**Backlog Reference:** Section 17.2

**As a** user monitoring approvals and agents
**I want** real-time updates without refresh
**So that** I always see the latest information

**Acceptance Criteria:**
- [ ] WebSocket connection established on app load
- [ ] Real-time events:
  - `approval.created` → New item appears in queue
  - `approval.updated` → Status changes reflected
  - `agent.status.changed` → Agent status updates
  - `notification.new` → Badge updates
  - `chat.message` → New messages appear
- [ ] Optimistic UI with server reconciliation
- [ ] Reconnection handling:
  - Exponential backoff on disconnect
  - "Reconnecting..." indicator
  - Sync missed events on reconnect
- [ ] Graceful degradation if WebSocket unavailable

**Event Types:**
```typescript
type RealtimeEvent =
  | { type: 'approval.created'; data: ApprovalItem }
  | { type: 'approval.updated'; data: Partial<ApprovalItem> }
  | { type: 'agent.status.changed'; data: { agentId: string; status: string } }
  | { type: 'notification.new'; data: Notification }
  | { type: 'chat.message'; data: ChatMessage };
```

**Technical Notes:**
- Socket.io in tech stack
- Separate namespace per workspace
- JWT auth for WebSocket connection

**Files to Create:**
- `apps/web/src/providers/realtime-provider.tsx`
- `apps/web/src/hooks/use-realtime.ts`
- `apps/api/src/realtime/realtime.gateway.ts`

---

### Story 16.16: Implement Comprehensive Keyboard Shortcuts

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 17.3

**As a** power user
**I want** keyboard shortcuts for common actions
**So that** I can work efficiently without a mouse

**Acceptance Criteria:**

**Global Shortcuts:**
- [ ] `⌘+K` - Open command palette (existing)
- [ ] `⌘+Shift+A` - Go to Approvals
- [ ] `⌘+Shift+B` - Go to Businesses
- [ ] `⌘+Shift+T` - Go to AI Team
- [ ] `⌘+Shift+S` - Go to Settings
- [ ] `⌘+/` - Focus chat input
- [ ] `Escape` - Close modal/panel/palette
- [ ] `⌘+Enter` - Submit current form

**Approvals Page:**
- [ ] `j/k` - Navigate up/down in list
- [ ] `a` - Approve selected item
- [ ] `r` - Reject selected item
- [ ] `v` - View details of selected

**Chat Panel:**
- [ ] `⌘+Shift+C` - Toggle chat panel
- [ ] `⌘+Up` - Edit last message
- [ ] `@` - Trigger mention autocomplete

**Onboarding Wizard:**
- [ ] `Enter` - Continue to next step
- [ ] `Backspace` - Go to previous step

**Technical Notes:**
- Use `react-hotkeys-hook` or native keyboard events
- Show shortcuts in tooltips and command palette
- Respect modifier keys per OS (⌘ on Mac, Ctrl on Windows)

**Files to Create:**
- `apps/web/src/hooks/use-keyboard-shortcuts.ts`
- `apps/web/src/providers/shortcuts-provider.tsx`

---

### Story 16.17: Implement Approval Queue Drag-and-Drop

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 17.1

**As an** approver with many items
**I want** to drag-and-drop to reorder approvals
**So that** I can prioritize my review queue

**Acceptance Criteria:**
- [ ] Drag handle on each approval card
- [ ] Drag to reorder (move to top/bottom)
- [ ] Visual feedback during drag:
  - Ghost element showing item
  - Drop zone highlighting
  - Smooth animation on drop
- [ ] Persist order preference per user
- [ ] Keyboard alternative for accessibility:
  - Select item, use arrow keys to move
- [ ] Undo option after reorder

**Technical Notes:**
- Use `@dnd-kit/core` or `react-beautiful-dnd`
- Store order in user preferences (localStorage or API)

**Files to Modify:**
- `apps/web/src/app/(app)/approvals/page.tsx`
- `apps/web/src/components/approval/approval-list.tsx`

---

### Chapter 5: Empty States & Celebration (P2-P3)

---

### Story 16.18: Implement Character-Driven Empty States

**Points:** 3
**Priority:** P2
**Backlog Reference:** Section 14.6

**As a** user viewing an empty page
**I want** friendly empty states with character illustrations
**So that** the platform feels warm and encouraging

**Acceptance Criteria:**
- [ ] Empty state component with:
  - Character illustration (Hub agent)
  - Warm, friendly headline
  - Helpful description
  - Single clear CTA button
- [ ] Apply to:
  - Businesses (no businesses yet)
  - Approvals (queue empty)
  - AI Team (no agents configured)
  - Chat history (no conversations)
  - Notifications (all clear)
- [ ] Example copy:
  - Approvals empty: "Your approval queue is clear! All agent actions have been reviewed. Nice work! 🎉"
  - Businesses empty: "Ready to start your entrepreneurial journey? Let's validate your first business idea together."

**Empty State Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│           🎯 [Hub illustration]         │
│                                         │
│       Your inbox is all clear!          │
│                                         │
│   All agent actions have been reviewed. │
│   Take a break, you've earned it!       │
│                                         │
│         [Back to Dashboard]             │
│                                         │
└─────────────────────────────────────────┘
```

**Technical Notes:**
- Character illustrations as SVG or PNG
- May need designer input for illustrations

**Files to Create:**
- `apps/web/src/components/ui/empty-state.tsx`
- Character illustration assets

---

### Story 16.19: Implement Input Styling Refinements

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 14.8

**As a** user filling out forms
**I want** refined input styling
**So that** form interactions feel premium

**Acceptance Criteria:**
- [ ] Focus ring: coral glow
  ```css
  &:focus {
    box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15);
    border-color: var(--color-primary);
  }
  ```
- [ ] Border color: warm `--border-default: #e5ddd4`
- [ ] Hover state: `border-color: var(--border-strong)`
- [ ] Consistent padding: 12px 16px
- [ ] Placeholder text color: muted
- [ ] Error state: red border + icon
- [ ] Disabled state: reduced opacity, gray background

**Technical Notes:**
- Update shadcn Input component
- Apply to all form inputs consistently

**Files to Modify:**
- `packages/ui/src/components/input.tsx`
- `apps/web/src/app/globals.css`

---

### Story 16.20: Implement Onboarding Step Indicator Polish

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 15.1

**As a** user going through onboarding
**I want** a polished step indicator
**So that** I know my progress clearly

**Acceptance Criteria:**
- [ ] Active step: coral (#FF6B6B) fill
- [ ] Completed steps: checkmark icon
- [ ] Upcoming steps: gray outline
- [ ] Connecting line between steps (subtle)
- [ ] Step labels with proper spacing
- [ ] Animated transitions between steps
- [ ] Progress percentage calculation

**Step Indicator Design:**
```
  ✓ ━━━━━ ● ━━━━━ ○ ━━━━━ ○
Step 1   Step 2   Step 3   Step 4
(done)  (active)  (next)   (future)
```

**Technical Notes:**
- SVG or CSS for circles and lines
- Framer Motion for animations

**Files to Modify:**
- `apps/web/src/components/onboarding/step-indicator.tsx`

---

### Story 16.21: Implement Option Card Selection Polish

**Points:** 2
**Priority:** P2
**Backlog Reference:** Section 15.2

**As a** user selecting options in wizards
**I want** clear visual feedback on selection
**So that** I know what I've chosen

**Acceptance Criteria:**
- [ ] Selected card:
  - Coral border (2px)
  - Subtle coral shadow
  - Checkmark badge in corner
- [ ] Hover state:
  - Lift effect
  - Border highlight
- [ ] Unselected cards:
  - Subtle border
  - Gray/muted appearance
- [ ] Consider custom illustrations for option cards

**Technical Notes:**
- Apply to BYOAI provider selection
- Apply to business stage selection

**Files to Modify:**
- `apps/web/src/components/ui/option-card.tsx`
- Onboarding step components

---

### Chapter 6: Nice-to-Have Features (P3)

---

### Story 16.22: Add Coming Soon Module Tooltips

**Points:** 1
**Priority:** P3
**Backlog Reference:** Section 1.3

**As a** user seeing "Coming Soon" modules
**I want** tooltips explaining what's coming
**So that** I understand the roadmap

**Acceptance Criteria:**
- [ ] Add tooltip to CRM/Projects orange dots
- [ ] Tooltip content: "Coming Soon - Expected Q1 2026"
- [ ] Or remove orange dots and rely on Coming Soon pages
- [ ] Consistent "Coming Soon" treatment across all modules

**Technical Notes:**
- Use shadcn Tooltip component
- Consider adding newsletter signup for updates

**Files to Modify:**
- `apps/web/src/components/layout/sidebar.tsx`

---

### Story 16.23: Implement Breadcrumb Polish

**Points:** 1
**Priority:** P3
**Backlog Reference:** Section 8.1

**As a** user navigating deep pages
**I want** polished breadcrumbs
**So that** I know where I am

**Acceptance Criteria:**
- [ ] Fix capitalization: "Ai-config" → "AI Configuration"
- [ ] All breadcrumbs are clickable links (except current)
- [ ] Add home/dashboard as first breadcrumb
- [ ] Truncate long breadcrumbs with ellipsis
- [ ] Mobile: Show only last 2 levels

**Technical Notes:**
- Auto-generate from route structure
- Use Next.js `usePathname` hook

**Files to Modify:**
- `apps/web/src/components/layout/breadcrumbs.tsx`

---

### Story 16.24: Implement Page Title Tags

**Points:** 1
**Priority:** P3
**Backlog Reference:** Section 8.2

**As a** user with many tabs
**I want** descriptive page titles
**So that** I can identify tabs easily

**Acceptance Criteria:**
- [ ] All pages have descriptive `<title>` tags
- [ ] Format: "Page Name | HYVVE"
- [ ] Examples:
  - "Dashboard | HYVVE"
  - "Acme Corp - Validation | HYVVE"
  - "Settings - Security | HYVVE"
- [ ] Dynamic titles for business pages

**Technical Notes:**
- Use Next.js Metadata API
- Template in layout.tsx

**Files to Modify:**
- All page.tsx files (add metadata export)
- `apps/web/src/app/(app)/layout.tsx`

---

### Story 16.25: Implement Celebration Moments

**Points:** 3
**Priority:** P3
**Backlog Reference:** Section 14.4

**As a** user completing important milestones
**I want** celebration feedback
**So that** achievements feel rewarding

**Acceptance Criteria:**
- [ ] Confetti animation on:
  - Completing onboarding wizard
  - First business creation
  - Validation score reaches 80%+
- [ ] Badge animation on first task completion
- [ ] Character celebration on:
  - Approval queue empty
  - All notifications read
- [ ] Checkmark animation on:
  - Successful payment
  - Settings saved
  - Form submitted

**Technical Notes:**
- Use `canvas-confetti` library
- Animations should be brief (1-2 seconds)
- Respect `prefers-reduced-motion`

**Files to Create:**
- `apps/web/src/components/ui/confetti.tsx`
- `apps/web/src/components/ui/celebration.tsx`
- `apps/web/src/hooks/use-celebration.ts`

---

### Story 16.26: Implement Keyboard Shortcuts Help Modal

**Points:** 2
**Priority:** P3
**Backlog Reference:** Section 17.4

**As a** user learning keyboard shortcuts
**I want** a help modal showing all shortcuts
**So that** I can become a power user

**Acceptance Criteria:**
- [ ] Trigger with `?` key
- [ ] Modal shows all keyboard shortcuts
- [ ] Categorized by context:
  - Global
  - Approvals
  - Chat
  - Navigation
- [ ] Search/filter shortcuts
- [ ] Visual key representations (⌘, ⇧, etc.)
- [ ] Link from Settings or Help menu

**Modal Layout:**
```
┌─────────────────────────────────────────┐
│ Keyboard Shortcuts                   ✕  │
├─────────────────────────────────────────┤
│ 🔍 [Search shortcuts...]                │
├─────────────────────────────────────────┤
│ Global                                  │
│   ⌘ + K      Open command palette       │
│   ⌘ + /      Focus chat                 │
│   Escape     Close modal                │
│                                         │
│ Approvals                               │
│   j / k      Navigate items             │
│   a          Approve selected           │
│   r          Reject selected            │
└─────────────────────────────────────────┘
```

**Technical Notes:**
- Reuse command palette styling
- Keep in sync with actual shortcuts

**Files to Create:**
- `apps/web/src/components/help/shortcuts-modal.tsx`

---

### Story 16.27: Implement Agent Detail Modal

**Points:** 3
**Priority:** P3
**Backlog Reference:** Section 6.3

**As a** user wanting to learn about an agent
**I want** a detailed agent modal
**So that** I understand capabilities and performance

**Acceptance Criteria:**
- [ ] Click agent card → opens detail modal
- [ ] Modal shows:
  - Large avatar with character color
  - Agent name and role
  - Full description/capabilities
  - Activity history (recent actions)
  - Performance metrics chart
  - Configuration options
  - Conversation history link
- [ ] Tabs: Overview, Activity, Settings
- [ ] Quick actions in modal footer

**Technical Notes:**
- Fetch detailed agent data on modal open
- Chart using Recharts or similar

**Files to Create:**
- `apps/web/src/components/agents/agent-detail-modal.tsx`

---

### Story 16.28: Fix Console Errors and Technical Debt

**Points:** 2
**Priority:** P3
**Backlog Reference:** Section 12.1

**As a** developer
**I want** a clean console
**So that** real errors are visible

**Acceptance Criteria:**
- [ ] Fix 400 Bad Request errors on CRM page
- [ ] Fix 404 errors for missing API endpoints
- [ ] Remove or handle Fast Refresh warnings
- [ ] No console errors on any page during normal use
- [ ] Console warnings acceptable but documented

**Technical Notes:**
- Audit all pages for console errors
- Add error boundaries where needed
- Mock missing endpoints with stubs

**Files to Modify:**
- Various based on errors found

---

## Wireframe References

| Story | Wireframe | HTML Path |
|-------|-----------|-----------|
| 16.3 Mobile Layout | SH-06 | `sh-06_mobile_layout/code.html` |
| 16.18 Empty States | - | Style guide Section 9.3 |
| 16.27 Agent Detail | AI-03 | `ai-03_agent_detail_modal/code.html` |

---

## Dependencies

- **EPIC-15** must be complete before starting EPIC-16
- Real-time features (16.15) require Event Bus from EPIC-05
- Agent detail modal (16.27) requires AI Team foundation from EPIC-15

---

## Technical Notes

### Animation Performance
- Use CSS transforms (not position/size changes)
- Hardware acceleration via `will-change` (sparingly)
- Test on low-end devices
- Respect `prefers-reduced-motion`

### Mobile Testing
- Test on real iOS and Android devices
- Use BrowserStack for device matrix
- Consider PWA for mobile experience

### Real-Time Architecture
- Socket.io namespace per workspace
- Redis pub/sub for multi-server support
- Graceful degradation to polling

---

## Estimated Effort

| Category | Stories | Points |
|----------|---------|--------|
| P2 Medium | 19 | 54 |
| P3 Low | 7 | 15 |
| **Total** | **26** | **69** |

**Estimated Sprints:** 3-4 (at ~20 points/sprint)

---

## Tech Debt from Epic 15 Retrospective

_Added: 2025-12-12 from Epic 15 code review and retrospective_

### Critical Issues (Must Fix)

#### Story 16.29: Fix Hydration Mismatch in Dashboard Layout

**Points:** 2
**Priority:** P0
**Source:** Epic 15 Code Review

**Issue:** Checking `window.innerWidth` during render causes SSR/client mismatch.

**Location:** `apps/web/src/app/(dashboard)/layout.tsx:60-65`

```typescript
const getMainContentMarginRight = () => {
  // Server always returns else branch, client may return different
  if (typeof window !== 'undefined' && window.innerWidth < 640) return undefined;
  // ...
}
```

**Acceptance Criteria:**
- [ ] Add `isMounted` state to prevent SSR mismatch
- [ ] Or refactor to use CSS media queries entirely
- [ ] No hydration warnings in console

**Recommended Fix:**
```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

const getMainContentMarginRight = () => {
  if (!isMounted) return 0; // SSR/initial render fallback
  if (window.innerWidth < 640) return undefined;
  // ... rest of logic
}
```

---

#### Story 16.30: Fix 2FA Error Handling State Inconsistency

**Points:** 2
**Priority:** P0
**Source:** Epic 15 Code Review

**Issue:** When 2FA status check fails, user sees "NETWORK_ERROR" but their session is already authenticated. The backend has created a session, but the frontend blocks the user - creating a limbo state.

**Location:** `apps/web/src/components/auth/sign-in-form.tsx:152-156`

**Acceptance Criteria:**
- [ ] Choose one approach:
  - Option A: Fail open with warning - proceed with access
  - Option B: Sign out the user and show clear error
  - Option C: Retry with exponential backoff
- [ ] User should never be in authenticated-but-blocked state

---

### High Priority (Should Fix Soon)

#### Story 16.31: Add Rate Limiting to Streaming Endpoint

**Points:** 2
**Priority:** P1
**Source:** Epic 15 Code Review

**Issue:** The streaming message endpoint has no rate limiting. Could exhaust server resources.

**Location:** `apps/web/src/app/api/agents/[id]/messages/route.ts`

**Acceptance Criteria:**
- [ ] Add rate limiting using `@/lib/utils/rate-limit`
- [ ] Limit: 20 messages per minute per user
- [ ] Return 429 with Retry-After header when exceeded

---

#### Story 16.32: Add localStorage Size Limits

**Points:** 1
**Priority:** P1
**Source:** Epic 15 Code Review

**Issue:** While limited to 100 messages, there's no size limit. Large content could fill localStorage (5-10MB limit).

**Location:** `apps/web/src/hooks/use-chat-messages.ts`

**Acceptance Criteria:**
- [ ] Add size checking before localStorage save
- [ ] Truncate to last 50 messages if serialized JSON exceeds 4MB
- [ ] Log warning when truncation occurs

---

#### Story 16.33: Verify Markdown XSS Protection

**Points:** 1
**Priority:** P1
**Source:** Epic 15 Code Review

**Issue:** `react-markdown` and `remark-gfm` were added. If not properly configured, could allow XSS through user-generated content.

**Location:** `apps/web/src/components/chat/ChatMessage.tsx`

**Acceptance Criteria:**
- [ ] Verify dangerous elements (script, iframe) are disabled
- [ ] Verify links are sanitized
- [ ] Confirm dompurify is being used
- [ ] Add test cases for XSS attack vectors

---

### Medium Priority

#### Story 16.34: Fix AbortError Type Checking

**Points:** 1
**Priority:** P2
**Source:** Epic 15 Code Review

**Issue:** AbortError is a DOMException, not an Error subclass. Current check may fail silently.

**Location:** `apps/web/src/hooks/use-chat-messages.ts:343`

**Acceptance Criteria:**
- [ ] Use `err instanceof DOMException && err.name === 'AbortError'` for accuracy
- [ ] Add tests for abort scenarios

---

#### Story 16.35: Optimize Window Resize Calculations

**Points:** 2
**Priority:** P2
**Source:** Epic 15 Code Review

**Issue:** `getMainContentMarginRight()` called on every render. Should use resize event listener.

**Location:** `apps/web/src/app/(dashboard)/layout.tsx`

**Acceptance Criteria:**
- [ ] Add resize event listener with state
- [ ] Debounce resize handler (100ms)
- [ ] Clean up listener on unmount

---

#### Story 16.36: Debounce localStorage Saves

**Points:** 1
**Priority:** P2
**Source:** Epic 15 Code Review

**Issue:** localStorage operations happen on every message. Could batch with debouncing.

**Location:** `apps/web/src/hooks/use-chat-messages.ts`

**Acceptance Criteria:**
- [ ] Add 500ms debounce to localStorage save
- [ ] Ensure save completes before page unload

---

### Missing Test Coverage

#### Story 16.37: Add Tests for New Hooks and API Routes

**Points:** 5
**Priority:** P2
**Source:** Epic 15 Code Review

**Missing Tests:**
- [ ] `apps/web/src/app/api/auth/redirect-destination/route.ts` - workspace logic tests
- [ ] `apps/web/src/hooks/use-chat-messages.ts` - streaming/abort scenarios
- [ ] `apps/web/src/hooks/use-chat-position.ts` - position state tests
- [ ] `apps/web/src/hooks/use-appearance.ts` - theme/font state tests
- [ ] OAuth deduplication logic in sign-in form

**Acceptance Criteria:**
- [ ] redirect-destination API: 10+ tests covering workspace states
- [ ] use-chat-messages: abort handling, error recovery tests
- [ ] use-chat-position: all position states, keyboard shortcuts
- [ ] use-appearance: theme switching, persistence

---

### Future Improvements (Suggestions)

#### Story 16.38: E2E Tests for Critical Flows

**Points:** 8
**Priority:** P3
**Source:** Epic 15 Retrospective

**Acceptance Criteria:**
- [ ] Playwright tests for sign-in flow
- [ ] Playwright tests for onboarding wizard
- [ ] Playwright tests for chat streaming
- [ ] Run in CI pipeline

---

#### Story 16.39: Storybook for Visual Components

**Points:** 5
**Priority:** P3
**Source:** Epic 15 Retrospective

**Acceptance Criteria:**
- [ ] Storybook setup for packages/ui
- [ ] Stories for appearance settings
- [ ] Stories for agent cards
- [ ] Visual regression testing integration

---

#### Story 16.40: Web Vitals Performance Monitoring

**Points:** 3
**Priority:** P3
**Source:** Epic 15 Retrospective

**Acceptance Criteria:**
- [ ] Add Web Vitals tracking
- [ ] Monitor chat streaming performance
- [ ] Dashboard for performance metrics

---

#### Story 16.41: Feature Flags for Gradual Rollout

**Points:** 3
**Priority:** P3
**Source:** Epic 15 Retrospective

**Acceptance Criteria:**
- [ ] Feature flag infrastructure (LaunchDarkly or similar)
- [ ] Flag for chat streaming (fallback to JSON)
- [ ] Flag for new features

---

## Updated Estimated Effort

| Category | Stories | Points |
|----------|---------|--------|
| P0 Critical (Tech Debt) | 2 | 4 |
| P1 High (Tech Debt) | 3 | 4 |
| P2 Medium | 19 + 4 | 54 + 9 |
| P3 Low | 7 + 4 | 15 + 19 |
| **Total** | **39** | **105** |

**Estimated Sprints:** 5-6 (at ~20 points/sprint)

---

_Epic created: 2025-12-11_
_Source: UI-UX-IMPROVEMENTS-BACKLOG.md_
_Prerequisite: EPIC-15 must be complete_
_Tech debt added: 2025-12-12 from Epic 15 retrospective_
