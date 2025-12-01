# HYVVE Platform - Google Stitch Wireframe Prompts

**Purpose:** Detailed prompts for generating HTML wireframes using Google Stitch
**Created:** 2025-12-01
**Total Wireframes:** 90+ (ready for design)

---

## Global Design System (Include in Every Prompt)

Every prompt should reference these foundational specifications:

```
GLOBAL DESIGN TOKENS:
- Background (Light): #FFFBF5 (warm cream, NOT pure white)
- Background (Dark): #0a0a0b (near-black, NOT pure black #000)
- Primary Action: #FF6B6B (coral)
- Secondary Accent: #20B2AA (teal)
- Text Primary: #1a1a1a (light) / #fafafa (dark)
- Text Secondary: #6b7280 (light) / #a1a1aa (dark)
- Border: #e5e5e5 (light) / #27272a (dark)
- Success: #2ECC71
- Warning: #F59E0B
- Error: #EF4444

TYPOGRAPHY:
- Font Family: Inter (UI), JetBrains Mono (code/data)
- Base Size: 16px
- Line Height: 1.6 for body, 1.2 for headings
- Letter Spacing: -0.02em for headings, normal for body

SPACING SCALE:
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

SHADOWS (Premium, Soft):
- sm: 0 1px 2px rgba(0,0,0,0.04)
- md: 0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.03)
- lg: 0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.02)

BORDER RADIUS:
- sm: 4px, md: 8px, lg: 12px, xl: 16px, full: 9999px

ANIMATION:
- Hover: 150ms ease-out
- Modal: 200-250ms ease-out
- Button press: transform scale(0.98) 100ms

AI AGENT COLORS:
- Hub (Orchestrator): #FF6B6B coral
- Maya (CRM): #20B2AA teal
- Atlas (PM): #FF9F43 orange
- Sage (Finance): #2ECC71 green
- Nova (Marketing): #FF6B9D pink
- Echo (Analytics): #4B7BEC blue

PREMIUM UI PRINCIPLES:
1. Speed as feature - 100ms or less for all interactions
2. Keyboard-first - Cmd+K command palette everywhere
3. Progressive disclosure - Show only what's needed
4. Purposeful restraint - Every element earns its place
5. Generous whitespace - Luxury indicator
6. Subtle micro-interactions - Feels alive, not flashy
```

---

## Section 1: Core Shell & Navigation (6 Wireframes)

### SH-01: Shell Layout (Three-Panel)

```
PROMPT: Create an HTML wireframe for a premium SaaS application shell with a three-panel layout.

LAYOUT STRUCTURE:
- Total width: Full viewport (1440px desktop reference)
- Left sidebar: 256px expanded, 64px collapsed
- Main content: Flexible, minimum 600px
- Right chat panel: 380px default, collapsible to 48px icon

HEADER BAR (60px height):
- Left: Logo "HYVVE" in brand coral (#FF6B6B), 24px font-weight-600
- Center-left: Workspace selector dropdown ("Acme Corp ▼")
- Right section (grouped):
  - Search icon (Cmd+K hint tooltip)
  - Notification bell with red badge "3"
  - User avatar (32px circle) with dropdown arrow
  - Settings gear icon

LEFT SIDEBAR (256px):
- Background: Slightly darker than main (#f7f5f0 light / #111113 dark)
- Top: Logo area (60px matches header)
- Navigation items (48px height each):
  - Dashboard icon + "Dashboard" (active state: coral left border, coral text)
  - Checkmark icon + "Approvals" + badge "(5)" in coral
  - Robot icon + "AI Team"
  - Settings icon + "Settings"
- Divider line (1px #e5e5e5)
- Module section header "MODULES" (12px uppercase, #6b7280)
  - CRM icon + "CRM"
  - Folder icon + "Projects"
- Bottom: Workspace selector + collapse toggle (<< icon)

Collapsed sidebar (64px):
- Icons only, centered
- Tooltip on hover showing label
- Badge count visible on icons

MAIN CONTENT AREA:
- Background: #FFFBF5 warm cream
- Padding: 32px
- Content placeholder with skeleton shapes

RIGHT CHAT PANEL (380px):
- Header: "Chat with Hub" + minimize/expand icons
- Background: White (#ffffff)
- Shadow: -4px 0 12px rgba(0,0,0,0.04)
- Collapsed state: 48px bar with chat bubble icon + notification dot

VISUAL STYLE:
- Clean, minimal, premium feel
- Subtle shadows, no harsh borders
- Smooth hover states
- Focus on whitespace
- Inter font throughout

Include both light and dark mode versions.
```

### SH-02: Navigation Sidebar

```
PROMPT: Create an HTML wireframe for a collapsible navigation sidebar with these specifications:

EXPANDED STATE (256px width):
Background: #f9f7f2 (light) / #111113 (dark)
Padding: 16px

LOGO SECTION (60px height):
- HYVVE logo with icon + wordmark
- Coral (#FF6B6B) icon, dark text

NAVIGATION GROUPS:
Group 1 - "MAIN" (label 11px uppercase #6b7280):
- Dashboard (grid icon) - active state with coral left border (3px)
- Approvals (check-circle icon) + badge "(5)" coral background
- AI Team (robot icon)
- Settings (gear icon)

Each nav item:
- Height: 44px
- Padding: 12px 16px
- Border-radius: 8px
- Hover: background #f0ede8
- Active: coral left border, coral text, cream background
- Icon: 20px, margin-right 12px
- Text: 14px medium weight

DIVIDER: 1px #e5e5e5, margin 12px 0

Group 2 - "MODULES":
- CRM (users icon) with Maya teal dot
- Projects (folder icon) with Atlas orange dot
- Marketing (megaphone icon) with Nova pink dot - "Coming Soon" badge
- Analytics (chart icon) with Echo blue dot - "Coming Soon" badge

Module items have small colored dots indicating associated agent.

WORKSPACE SELECTOR (bottom):
- Company avatar (36px rounded square)
- Company name "Acme Corp"
- Dropdown arrow
- Border-top 1px

COLLAPSE TOGGLE:
- Position: bottom-left corner
- Icon: chevrons-left
- On click: animates to 64px width

COLLAPSED STATE (64px):
- Icons only, centered
- Tooltips on hover (right side)
- Badges still visible
- Logo becomes icon-only
- Smooth 200ms transition

HOVER INTERACTIONS:
- Background color shift on hover
- Tooltip delay 300ms
- Smooth scale(1.02) on icon hover

Include keyboard navigation focus states with coral outline.
```

### SH-03: Header Bar

```
PROMPT: Create an HTML wireframe for a premium application header bar.

DIMENSIONS:
- Height: 60px
- Width: 100%
- Background: #ffffff (light) / #0a0a0b (dark)
- Border-bottom: 1px solid #e5e5e5 (light) / #27272a (dark)
- Padding: 0 24px

LEFT SECTION:
- Logo: "HYVVE" with coral (#FF6B6B) icon (32px) + wordmark (20px bold)
- Vertical divider: 1px #e5e5e5, height 24px, margin 0 20px
- Workspace selector:
  - Company icon (24px rounded square with initials)
  - Name "Acme Corp" (14px medium)
  - Chevron down icon
  - Click reveals dropdown with workspace list

CENTER SECTION:
- Breadcrumb trail (when in sub-pages):
  - "Dashboard > CRM > Contacts" format
  - Links styled in #6b7280, active page in #1a1a1a
  - Chevron separators

RIGHT SECTION (aligned right, 16px gaps):
- Search button:
  - Search icon + "Search..." text + "⌘K" badge
  - Rounded pill shape (36px height)
  - Background: #f5f5f5, border: 1px #e5e5e5
  - Hover: background #eeeeee

- Notifications bell:
  - Bell icon (20px)
  - Red dot badge with count "3" (absolute positioned top-right)
  - Click reveals dropdown panel

- Help button:
  - Question mark in circle icon
  - Tooltip: "Help & Resources"

- User menu:
  - Avatar (36px circle with user photo or initials)
  - Dropdown arrow
  - Click reveals menu:
    - User name + email
    - Divider
    - Profile Settings
    - Theme toggle (Light/Dark/System)
    - Divider
    - Sign Out

NOTIFICATION DROPDOWN (when clicked):
- Width: 360px
- Max-height: 480px with scroll
- Header: "Notifications" + "Mark all read" link
- List of notification items:
  - Agent icon + message + timestamp
  - Hover state with background
  - Unread indicator (coral dot)
- Footer: "View all notifications" link

RESPONSIVE:
- Below 1024px: Hide search text, show icon only
- Below 768px: Hamburger menu replaces sidebar
```

### SH-04: Status Bar

```
PROMPT: Create an HTML wireframe for an application status bar showing system status.

DIMENSIONS:
- Height: 32px
- Position: Bottom of viewport, full width
- Background: #f9f7f2 (light) / #1a1a1d (dark)
- Border-top: 1px solid #e5e5e5

LEFT SECTION:
- Connection status:
  - Green dot + "Connected" OR
  - Yellow dot + "Reconnecting..." OR
  - Red dot + "Offline"

- Sync status:
  - Refresh icon (animated when syncing)
  - "Last synced: 2 min ago"

CENTER SECTION:
- Agent status indicators (small pills):
  - 🎯 Hub: green dot "Ready"
  - 🐚 Maya: yellow dot "Processing..."
  - 🗺️ Atlas: green dot "Idle"

RIGHT SECTION:
- Version: "v1.0.0"
- Keyboard shortcut hint: "Press ⌘K for commands"

HOVER STATES:
- Each agent pill expands on hover to show current task
- Sync status shows detailed timestamp

VISUAL STYLE:
- Subtle, doesn't compete with main content
- Small text (12px)
- Muted colors (#6b7280)
```

### SH-05: Command Palette (Cmd+K)

```
PROMPT: Create an HTML wireframe for a command palette modal (like Linear/Notion).

TRIGGER: Cmd+K keyboard shortcut

MODAL CONTAINER:
- Position: Center of screen, slight top offset (20% from top)
- Width: 560px
- Max-height: 480px
- Background: #ffffff
- Border-radius: 16px
- Shadow: 0 25px 50px rgba(0,0,0,0.15)
- Backdrop: rgba(0,0,0,0.4) with blur

SEARCH INPUT (top):
- Height: 56px
- Padding: 16px 20px
- No border, bottom border only (1px #e5e5e5)
- Search icon (20px) on left
- Placeholder: "Type a command or search..."
- Font size: 16px
- Right side: "⌘K" badge showing shortcut
- Clear button (X) when has content

RESULTS AREA (scrollable):
- Padding: 8px

SECTION: "RECENT" (label 11px uppercase #6b7280, padding 12px 16px)
- List items:
  - Height: 44px
  - Padding: 8px 16px
  - Icon (20px) + Label + Right-aligned shortcut hint
  - Hover: background #f5f5f5, border-radius 8px
  - Selected: background #f0f0f0, coral left border

Example items:
- 📋 "Create new task" → ⌘+Shift+T
- 👤 "View contact: Acme Corp" → ⌘+O
- 📧 "Compose email" → ⌘+E

SECTION: "NAVIGATION"
- 📊 "Dashboard" → ⌘+D
- ✅ "Approvals" → ⌘+A
- 🤖 "AI Team" → ⌘+I
- ⚙️ "Settings" → ⌘+,

SECTION: "ACTIONS"
- ➕ "Create contact"
- 📝 "Create task"
- 📧 "Send email"

SECTION: "AGENTS" (when typing @)
- 🎯 "Hub" - Orchestrator
- 🐚 "Maya" - CRM
- 🗺️ "Atlas" - Projects

FOOTER:
- Height: 40px
- Border-top: 1px #e5e5e5
- Left: Tips "↑↓ Navigate" "↵ Select" "esc Close"
- Right: "?" icon for help

KEYBOARD NAVIGATION:
- Up/Down arrows move selection
- Enter executes
- Escape closes
- Type filters results

FUZZY SEARCH:
- Highlight matching characters in results
- Show "No results for 'xyz'" with suggestions
```

### SH-06: Mobile Layout

```
PROMPT: Create HTML wireframes for responsive mobile layouts.

MOBILE LAYOUT (< 640px):

HEADER (56px):
- Hamburger menu icon (left)
- Logo "HYVVE" centered
- Chat bubble icon (right) with notification dot

MAIN CONTENT:
- Full width, edge-to-edge
- Padding: 16px
- Scrollable

BOTTOM NAVIGATION (64px):
- Position: Fixed bottom
- Background: #ffffff
- Border-top: 1px #e5e5e5
- 5 items, evenly spaced:
  - Dashboard (grid icon) - active: coral icon
  - Approvals (check icon) + badge
  - Hub (chat icon) - opens chat modal
  - Tasks (folder icon)
  - More (dots icon) - reveals full menu

SLIDE-OUT MENU (hamburger):
- Full height, 280px width
- Slides in from left
- Same navigation as desktop sidebar
- Backdrop overlay (tap to close)

CHAT MODAL (from bottom):
- Slides up from bottom
- Height: 90% viewport
- Drag handle to dismiss
- Full chat interface

TABLET LAYOUT (640-1024px):

TWO-PANEL:
- Sidebar: 64px (icons only)
- Main content: Remaining width
- Chat: Overlay modal (not persistent panel)

HEADER:
- Same as desktop but condensed
- Breadcrumbs truncated

TOUCH TARGETS:
- Minimum 44px for all interactive elements
- Increased spacing between tap targets

GESTURES:
- Swipe right: Open sidebar
- Swipe left: Close sidebar
- Swipe down on chat: Minimize

Create both layouts showing Dashboard view content.
```

---

## Section 2: Chat Interface (7 Wireframes)

### CH-01: Chat Panel

```
PROMPT: Create an HTML wireframe for a persistent chat panel.

PANEL STRUCTURE:
- Width: 380px (expandable to 480px)
- Height: Full viewport minus header (calc(100vh - 60px))
- Position: Right side, attached to main content
- Background: #ffffff
- Shadow: -4px 0 16px rgba(0,0,0,0.06)

HEADER (56px):
- Background: #f9f7f2
- Left: Agent selector showing current agent:
  - Avatar/icon (32px)
  - Name "Hub"
  - Status dot (green)
  - Chevron down (reveals agent picker)
- Right icons:
  - History icon (conversation list)
  - Minimize icon (line)
  - Expand icon (arrows out)
  - Close icon (X) - desktop only

MESSAGES AREA (flex-grow, scrollable):
- Padding: 16px
- Scroll: Auto with custom scrollbar (4px, #d1d5db)
- Message spacing: 16px between messages

MESSAGE BUBBLES:
User messages (right-aligned):
- Background: #FF6B6B (coral)
- Text: #ffffff
- Border-radius: 16px 16px 4px 16px
- Max-width: 280px
- Padding: 12px 16px
- Timestamp: 11px, #ffffff80, below bubble

Agent messages (left-aligned):
- Agent icon (24px) to left of bubble
- Background: #f5f5f5
- Text: #1a1a1a
- Border-radius: 16px 16px 16px 4px
- Agent name above bubble (12px bold, agent color)
- Timestamp: 11px, #6b7280, below bubble

INPUT AREA (bottom):
- Min-height: 72px (grows with content)
- Border-top: 1px #e5e5e5
- Padding: 12px 16px

Input field:
- Background: #f5f5f5
- Border-radius: 24px
- Padding: 12px 48px 12px 16px
- Placeholder: "Message Hub..." (or current agent)
- Multi-line support (grows up to 120px)

Quick actions (left of input):
- Attachment icon (paperclip)
- @mention icon (at symbol)

Send button:
- Position: Inside input, right
- Coral background, white arrow icon
- 36px circle
- Disabled state when empty

TYPING INDICATOR:
- Shows when agent is processing
- Three bouncing dots with agent color
- Text: "Hub is typing..."

COLLAPSED STATE (48px width):
- Chat bubble icon centered
- Notification badge if unread
- Click expands panel with slide animation (300ms)

Include smooth transitions for expand/collapse.
```

### CH-02: Chat Messages

```
PROMPT: Create an HTML wireframe showing all chat message types.

CANVAS: 360px width, scrollable height (simulate chat panel)

MESSAGE TYPE 1 - USER MESSAGE:
```
                               [Avatar]
                    Create a follow-up email
                    for the Johnson deal with
                    a friendly tone.
                                    2:34 PM
```
- Align right
- Coral background (#FF6B6B)
- White text
- Small avatar (24px) top-right

MESSAGE TYPE 2 - AGENT MESSAGE (Text):
```
[🐚]  Maya
      I've drafted a follow-up email for the
      Johnson deal. The tone matches your
      previous communications with them.

      The email references your last meeting
      and proposes a follow-up call next week.

                                    2:35 PM
```
- Agent icon with teal ring (Maya's color)
- Name in teal, bold
- Light gray background
- Dark text

MESSAGE TYPE 3 - AGENT MESSAGE WITH ACTIONS:
```
[🐚]  Maya
      Here's the draft email:

      ┌─────────────────────────────────────┐
      │ Subject: Following up on our chat   │
      │                                     │
      │ Hi Sarah,                           │
      │                                     │
      │ Great speaking with you yesterday   │
      │ about the Q4 expansion plans...     │
      │                                     │
      │ [Show full email]                   │
      └─────────────────────────────────────┘

      [📧 Send Now] [✏️ Edit] [📋 Copy]
                                    2:35 PM
```
- Embedded preview card with subtle border
- Action buttons: pill-shaped, icon + text
- Primary action (Send) in coral, others in gray

MESSAGE TYPE 4 - SYSTEM MESSAGE:
```
      ─────────────────────────────────────
      ℹ️ Email queued for approval
      ─────────────────────────────────────
```
- Centered, smaller text
- Gray color (#6b7280)
- Divider lines above/below

MESSAGE TYPE 5 - APPROVAL REQUEST CARD:
```
[🎯]  Hub
      ┌─────────────────────────────────────┐
      │ 📋 Approval Request                  │
      │                                     │
      │ "Johnson Deal Follow-up Email"      │
      │ Category: Email                     │
      │ Confidence: 78%                     │
      │ [████████░░] Quick Review           │
      │                                     │
      │ [👀 Preview] [✓ Approve] [✗ Reject] │
      └─────────────────────────────────────┘
                                    2:36 PM
```
- Card with border
- Confidence bar with color (yellow for medium)
- Three action buttons

MESSAGE TYPE 6 - ERROR MESSAGE:
```
[🎯]  Hub
      ⚠️ I couldn't complete that request.

      The email service is temporarily
      unavailable. I'll retry automatically
      in 5 minutes.

      [🔄 Retry Now] [❌ Cancel]
                                    2:37 PM
```
- Warning icon, yellow/orange accent
- Error explanation in plain language
- Recovery actions

MESSAGE TYPE 7 - LOADING/STREAMING:
```
[🐚]  Maya
      Analyzing the Johnson deal history
      and drafting a personalized email...

      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

      ● ● ●
```
- Streaming text appearing character by character
- Progress shimmer animation
- Typing dots below

Show timestamps grouping (e.g., "Today", "Yesterday").
```

### CH-03: Chat Input

```
PROMPT: Create an HTML wireframe for an advanced chat input component.

CONTAINER:
- Min-height: 72px (grows with content)
- Max-height: 200px (then scrolls)
- Background: #ffffff
- Border-top: 1px #e5e5e5
- Padding: 12px 16px

INPUT FIELD:
- Background: #f5f5f5
- Border: 1px solid transparent
- Border-radius: 24px
- Padding: 12px 56px 12px 48px (space for icons)
- Focus: Border coral, subtle coral glow
- Placeholder: "Message Hub..."

LEFT ICONS (inside input):
- @ icon: Opens @mention picker
- 📎 icon: Opens file picker
- Hover: Background #e5e5e5, border-radius full

RIGHT AREA (inside input):
- Character count when > 500 chars: "1,234 / 2,000"
- Send button: 36px coral circle, white arrow-up icon
- Disabled when empty (gray, opacity 0.5)
- Hover: scale(1.05)
- Active: scale(0.95)

@MENTION PICKER (above input when @ typed):
- Width: 280px
- Background: #ffffff
- Shadow: md
- Border-radius: 12px
- List of agents:
  - [🎯] Hub - Orchestrator
  - [🐚] Maya - CRM & Relationships
  - [🗺️] Atlas - Projects & Tasks
  - [✨] Nova - Marketing
  - [📊] Echo - Analytics
- Hover state, keyboard navigation
- Selected agent inserts @Maya etc

/COMMAND PICKER (when / typed):
- Similar to @mention
- Commands:
  - /help - Show available commands
  - /status - Check agent status
  - /clear - Clear conversation
  - /feedback - Send feedback

FILE UPLOAD PREVIEW (when file attached):
- Appears above input
- Thumbnail + filename + size + X to remove
- Multiple files stack horizontally

MULTI-LINE BEHAVIOR:
- Enter sends message
- Shift+Enter creates new line
- Auto-grows up to max-height
- Smooth height transition

STATES:
1. Empty: Placeholder visible, send disabled
2. Typing: No placeholder, send enabled
3. With attachment: Preview shown, send enabled
4. Agent mentioned: @Maya highlighted in input
5. Processing: Input disabled, spinner in send button
6. Error: Red border, error message below
```

### CH-04: Typing Indicator

```
PROMPT: Create an HTML wireframe for chat typing/processing indicators.

TYPING INDICATOR (simple):
```
[🐚]  Maya is typing...
      ● ● ●
```
- Agent icon (24px) with colored ring
- Text "Maya is typing..." in #6b7280
- Three dots with staggered bounce animation
- Dot color matches agent color (teal for Maya)

PROCESSING INDICATOR (with context):
```
[🐚]  Maya
      ┌─────────────────────────────────────┐
      │ 🔍 Searching your contacts...        │
      │ ████████░░░░░░░░░░░░░ 45%           │
      └─────────────────────────────────────┘
```
- Shows current action
- Progress bar when duration known
- Subtle pulse animation on card

STREAMING RESPONSE:
```
[🐚]  Maya
      I found 3 contacts matching "Johnson":

      1. **Sarah Johnson** - VP Sales at Acme
         Last contact: 2 days ago
      |
```
- Text appears character by character
- Blinking cursor at end
- Smooth scroll to keep cursor visible

MULTI-STEP PROCESSING:
```
[🎯]  Hub
      ┌─────────────────────────────────────┐
      │ Creating your task...               │
      │                                     │
      │ ✓ Parsing request                   │
      │ ✓ Checking calendar                 │
      │ ● Assigning to project...           │
      │ ○ Setting due date                  │
      │ ○ Notifying team                    │
      └─────────────────────────────────────┘
```
- Checklist format
- ✓ Complete (green)
- ● In progress (coral, spinning)
- ○ Pending (gray)

ERROR DURING PROCESSING:
```
[🎯]  Hub
      ┌─────────────────────────────────────┐
      │ ⚠️ Something went wrong              │
      │                                     │
      │ Couldn't access the calendar        │
      │ service. Would you like me to:      │
      │                                     │
      │ [🔄 Try again] [📅 Skip calendar]   │
      └─────────────────────────────────────┘
```
- Yellow warning state
- Clear error message
- Recovery options

ANIMATION SPECS:
- Dot bounce: 0.6s infinite, staggered 0.2s
- Progress bar: 1.5s ease-in-out pulse
- Streaming: 30ms per character
- Checkmark appear: 200ms scale from 0.5
```

### CH-05: Agent Selector

```
PROMPT: Create an HTML wireframe for an @mention agent picker.

TRIGGER: Click @ button OR type @ in input

POPUP CONTAINER:
- Position: Above input field, left-aligned
- Width: 300px
- Max-height: 320px
- Background: #ffffff
- Border-radius: 12px
- Shadow: lg
- Border: 1px #e5e5e5

HEADER:
- Height: 44px
- Text: "Select an agent" (14px, #6b7280)
- Close X icon on right
- Border-bottom: 1px #e5e5e5

SEARCH INPUT:
- Height: 40px
- Placeholder: "Search agents..."
- No border, bottom border only
- Auto-focus when opened

AGENT LIST (scrollable):
- Padding: 8px

Each agent item (height: 56px):
```
┌─────────────────────────────────────┐
│ [🐚]  Maya                    ● ○   │
│       CRM & Relationships           │
│       "Managing your customer data" │
└─────────────────────────────────────┘
```
- Icon: 36px with colored background ring
- Name: 14px bold, agent color
- Role: 12px #6b7280
- Status dot: 8px (green=online, gray=offline)
- Hover: Background #f5f5f5
- Selected: Background coral/10%, coral left border

AGENTS TO SHOW:
1. 🎯 Hub (coral) - Orchestrator - "Coordinates your AI team"
2. 🐚 Maya (teal) - CRM Agent - "Manages relationships & deals"
3. 🗺️ Atlas (orange) - PM Agent - "Tracks projects & tasks"
4. 🌿 Sage (green) - Finance - "Coming soon" (disabled)
5. ✨ Nova (pink) - Marketing - "Coming soon" (disabled)
6. 📊 Echo (blue) - Analytics - "Coming soon" (disabled)

DISABLED STATE:
- Opacity: 0.5
- "Coming soon" badge
- Not clickable

KEYBOARD NAVIGATION:
- Up/Down arrows to navigate
- Enter to select
- Escape to close
- Type to filter

FOOTER:
- Height: 40px
- Text: "Type @ in chat to mention" (12px, #9ca3af)
- Border-top: 1px #e5e5e5

INSERTION BEHAVIOR:
- Clicking agent inserts: "@Maya " at cursor
- Agent name styled in agent color in input
- Space added after for continued typing
```

### CH-06: Chat Attachments

```
PROMPT: Create an HTML wireframe for chat attachment handling.

ATTACHMENT PICKER (click paperclip):
Menu dropdown with options:
```
┌─────────────────────────────────┐
│ 📎 Attach                       │
├─────────────────────────────────┤
│ 📄 Upload file                  │
│ 📷 Upload image                 │
│ 📋 Paste from clipboard         │
│ 🔗 Share link                   │
└─────────────────────────────────┘
```
- 200px width
- Icon + text per option
- Hover state

FILE UPLOAD PREVIEW (above input):
```
┌─────────────────────────────────────┐
│ 📄 quarterly-report.pdf        ✕    │
│    2.4 MB                           │
│ ████████████████░░░░ Uploading 80%  │
└─────────────────────────────────────┘
```
- File icon based on type
- Filename (truncate if long)
- File size
- Progress bar during upload
- X to cancel/remove

IMAGE PREVIEW:
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │
│ │                               │   │
│ │     [Image Thumbnail]         │   │
│ │        150x100px              │   │
│ │                               │   │
│ └───────────────────────────────┘ ✕ │
│ screenshot.png · 1.2 MB             │
└─────────────────────────────────────┘
```
- Thumbnail preview
- Filename and size
- X to remove

MULTIPLE FILES:
- Horizontal scroll if > 3 files
- Max 5 files per message
- "+2 more" indicator if collapsed

IN-MESSAGE ATTACHMENT DISPLAY:
```
[You]
      Here's the report for review:

      ┌─────────────────────────────────┐
      │ 📄 quarterly-report.pdf    ⬇️   │
      │    2.4 MB · PDF Document        │
      └─────────────────────────────────┘
                                2:34 PM
```
- Clickable to download
- Download icon on right
- File type indicator

IMAGE IN MESSAGE:
```
[🐚]  Maya
      I created this chart for your report:

      ┌─────────────────────────────────┐
      │                                 │
      │    [Full-width Image]           │
      │       max 300px wide            │
      │       click to expand           │
      │                                 │
      └─────────────────────────────────┘

      [💾 Save] [📋 Copy] [🔍 Expand]
                                2:35 PM
```
- Click opens full-screen lightbox
- Action buttons below

DRAG & DROP ZONE (when dragging):
```
┌─────────────────────────────────────┐
│                                     │
│           📥 Drop files here         │
│           to attach to message      │
│                                     │
└─────────────────────────────────────┘
```
- Dashed border (coral)
- Appears over chat area
- Accepts multiple files

FILE TYPE ICONS:
- 📄 PDF, DOC
- 📊 XLS, CSV
- 📷 JPG, PNG, GIF
- 🎥 MP4, MOV
- 📁 ZIP, other
```

### CH-07: Chat History

```
PROMPT: Create an HTML wireframe for conversation history panel.

TRIGGER: Click history icon in chat header

SLIDE-IN PANEL:
- Slides from right (over chat panel)
- Width: 380px
- Height: Full viewport minus header
- Background: #ffffff
- Shadow: -8px 0 24px rgba(0,0,0,0.1)

HEADER (56px):
- Back arrow (returns to chat)
- Title: "Conversation History"
- Search icon

SEARCH BAR (when expanded):
- Full width input
- Placeholder: "Search conversations..."
- Filter icon with dropdown:
  - All agents
  - Hub only
  - Maya only
  - etc.
- Date range picker

CONVERSATION LIST:
```
┌─────────────────────────────────────┐
│ TODAY                               │
├─────────────────────────────────────┤
│ [🐚] Johnson Deal Follow-up         │
│      Maya · 2:34 PM                 │
│      "Here's the draft email..."    │
├─────────────────────────────────────┤
│ [🎯] Task Creation                  │
│      Hub · 11:20 AM                 │
│      "Created 3 tasks for Q4..."    │
├─────────────────────────────────────┤
│ YESTERDAY                           │
├─────────────────────────────────────┤
│ [🗺️] Sprint Planning                │
│      Atlas · 4:15 PM                │
│      "Sprint 5 has been planned..." │
├─────────────────────────────────────┤
│ [🐚] Contact Enrichment             │
│      Maya · 10:30 AM                │
│      "Enriched 45 contacts..."      │
└─────────────────────────────────────┘
```

Each conversation item:
- Height: 72px
- Agent icon (24px)
- Title (14px bold) - auto-generated or user-named
- Agent name + timestamp (12px #6b7280)
- Preview text (13px, truncated to 1 line)
- Hover: Background #f5f5f5
- Click: Loads full conversation

DATE GROUPINGS:
- Today
- Yesterday
- This Week
- Earlier (by month)

EMPTY STATE:
```
┌─────────────────────────────────────┐
│                                     │
│              💬                     │
│                                     │
│      No conversations yet           │
│                                     │
│   Start chatting with your AI team  │
│   and your history will appear here │
│                                     │
│        [Start a conversation]       │
│                                     │
└─────────────────────────────────────┘
```

CONVERSATION DETAIL VIEW:
- Back button returns to list
- Title editable (click to rename)
- Full message history (scrollable)
- "Continue conversation" button at bottom

ACTIONS (swipe or long-press):
- Rename conversation
- Pin to top
- Delete (with confirmation)

LOAD MORE:
- "Load older conversations" at bottom
- Infinite scroll with loading spinner
```

---

## Section 3: Approval Queue (7 Wireframes)

### AP-01: Approval Queue

```
PROMPT: Create an HTML wireframe for the main approval queue view.

PAGE LAYOUT:
- Full main content area (sidebar + this + chat panel)
- Background: #FFFBF5

HEADER SECTION:
- Title: "Approvals" (28px bold)
- Subtitle: "5 items awaiting your review" (14px #6b7280)
- Right side: View toggle [List | Cards]

FILTER BAR:
```
┌─────────────────────────────────────────────────────────────────┐
│ [All Types ▼] [All Status ▼] [All Agents ▼] [Date Range ▼]      │
│                                                                 │
│ Active filters: Status: Pending ✕ | Agent: Maya ✕ | [Clear all] │
└─────────────────────────────────────────────────────────────────┘
```
- Dropdown filters
- Active filter pills with X to remove
- Clear all link

STATS ROW:
```
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ ⏳ Pending     │ │ 🟢 Auto-approved│ │ ✅ Approved   │ │ ❌ Rejected   │
│    5          │ │    12 (24h)    │ │    28 (7d)    │ │    3 (7d)     │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```
- Four stat cards in a row
- Click filters the list

QUEUE LIST (main content):
```
┌─────────────────────────────────────────────────────────────────┐
│ ☐ │ 🟢 │ Email Campaign: "Summer Sale"            │ 95% │ 2m   │
│   │    │ Auto-approved · Marketing · Maya         │     │      │
│   │    │                                    [View] [↩ Undo]     │
├───┼────┼──────────────────────────────────────────┼─────┼──────┤
│ ☐ │ 🟡 │ Blog Post: "AI Trends 2025"              │ 72% │ 15m  │
│   │    │ Quick review · Content · Nova            │     │      │
│   │    │ "The landscape of AI is evolving..."     │     │      │
│   │    │                             [Reject] [✓ Approve]       │
├───┼────┼──────────────────────────────────────────┼─────┼──────┤
│ ☐ │ 🔴 │ Contract: "Enterprise Deal"              │ 45% │ 1h   │
│   │    │ Full review required · Sales · Maya      │     │      │
│   │    │ ⚠️ Unusual terms in section 4.2          │     │      │
│   │    │          [View Full] [Edit] [Reject] [✓ Approve]       │
└───┴────┴──────────────────────────────────────────┴─────┴──────┘
```

Each row shows:
- Checkbox for bulk selection
- Confidence indicator (🟢🟡🔴)
- Title + type
- Status + category + agent
- Preview text (for medium/low confidence)
- Confidence percentage
- Time since created
- Actions based on confidence level

BULK ACTIONS BAR (when items selected):
```
┌─────────────────────────────────────────────────────────────────┐
│ 3 items selected     [✓ Approve All] [✗ Reject All] [Clear]    │
└─────────────────────────────────────────────────────────────────┘
```
- Appears at top when checkbox(es) checked
- Sticky/fixed position

EMPTY STATE:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                            ✅                                    │
│                                                                 │
│                  Your queue is empty!                           │
│                                                                 │
│         All agent actions have been reviewed.                   │
│         New approvals will appear here automatically.           │
│                                                                 │
│                   [View Agent Activity →]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Celebration illustration
- Helpful message
- CTA to view agent activity
```

### AP-02: Approval Card - High Confidence

```
PROMPT: Create an HTML wireframe for a high-confidence (>85%) auto-approved item card.

CARD CONTAINER:
- Width: 100%
- Background: #ffffff
- Border: 1px #e5e5e5
- Border-radius: 12px
- Padding: 20px

LAYOUT:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🟢 Auto-approved                                    95%         │
│                                                                 │
│ Email Campaign: "Summer Sale Announcement"                      │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Agent: 🐚 Maya                         Category: Marketing  │ │
│ │ Created: 2 minutes ago                 Model: claude-sonnet │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Auto-approval reason ──────────────────────────────────────┐ │
│ │ ✓ Content matches approved templates (92%)                  │ │
│ │ ✓ Recipient list verified (100%)                            │ │
│ │ ✓ No compliance flags detected (98%)                        │ │
│ │ ✓ Within authorized send limits (100%)                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                    [View Details]  [↩ Undo]     │
└─────────────────────────────────────────────────────────────────┘
```

HEADER:
- Left: Green badge "🟢 Auto-approved"
- Right: Confidence "95%" in green text

TITLE:
- Bold, 18px
- Type prefix + descriptive title

METADATA ROW:
- Two columns
- Agent with icon, Category
- Created time (relative), Model used

REASONING BOX:
- Light green background (#f0fdf4)
- List of confidence factors
- Each with checkmark and percentage

ACTIONS:
- "View Details" - opens detail modal
- "Undo" - reverts auto-approval, moves to manual queue
- Both in secondary button style

UNDO CONFIRMATION:
When "Undo" clicked, show inline:
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Move this item back to pending review?                       │
│                                          [Cancel]  [Yes, Undo]  │
└─────────────────────────────────────────────────────────────────┘
```

AUDIT LOG (expandable):
```
┌─ Activity Log ─────────────────────────────────────────────────┐
│ ▼ 2:34 PM - Auto-approved by system (confidence: 95%)         │
│   2:34 PM - Generated by Maya                                  │
│   2:33 PM - Request initiated by user                          │
└────────────────────────────────────────────────────────────────┘
```
- Collapsed by default
- Click to expand
- Chronological events
```

### AP-03: Approval Card - Medium Confidence

```
PROMPT: Create an HTML wireframe for a medium-confidence (60-85%) quick review card.

CARD CONTAINER:
- Width: 100%
- Background: #ffffff
- Border: 1px #e5e5e5
- Border-left: 4px solid #F59E0B (amber)
- Border-radius: 12px
- Padding: 20px

LAYOUT:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🟡 Quick Review                                     72%         │
│                                                                 │
│ Blog Post: "AI Trends 2025"                                     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Agent: ✨ Nova                         Category: Content     │ │
│ │ Created: 15 minutes ago                Model: gpt-4o        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Preview ───────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ The landscape of artificial intelligence is evolving at    │ │
│ │ an unprecedented pace. In 2025, we're seeing three major   │ │
│ │ trends emerge that will shape the future of business...    │ │
│ │                                                             │ │
│ │                                          [Read more →]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Review Notes ──────────────────────────────────────────────┐ │
│ │ ℹ️ Some claims may need fact-checking:                       │ │
│ │    • "AI adoption up 300%" - source needed                  │ │
│ │    • Company names mentioned without context                │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                          [View Full]  [✗ Reject]  [✓ Approve]   │
└─────────────────────────────────────────────────────────────────┘
```

HEADER:
- Left: Amber badge "🟡 Quick Review"
- Right: Confidence "72%" in amber text

PREVIEW SECTION:
- Light gray background (#f9fafb)
- Truncated content (3-4 lines)
- "Read more" link to expand

REVIEW NOTES:
- Light amber background (#fffbeb)
- Info icon + heading
- Bullet points of concerns
- Helps user make quick decision

ACTIONS:
- "View Full" - opens detail view
- "Reject" - secondary button with red hover
- "Approve" - primary button, coral

QUICK ACTIONS:
- Enter key = Approve (when focused)
- Escape = Skip to next
- Shown as hint: "Press Enter to approve"

REJECT FLOW:
When "Reject" clicked:
```
┌─────────────────────────────────────────────────────────────────┐
│ Reason for rejection (optional):                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Needs more fact-checking before publication                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ○ Send back to agent for revision                               │
│ ● Reject permanently                                            │
│                                          [Cancel]  [Confirm]    │
└─────────────────────────────────────────────────────────────────┘
```
- Optional reason text
- Option to send back vs reject
```

### AP-04: Approval Card - Low Confidence

```
PROMPT: Create an HTML wireframe for a low-confidence (<60%) full review card.

CARD CONTAINER:
- Width: 100%
- Background: #ffffff
- Border: 1px #e5e5e5
- Border-left: 4px solid #EF4444 (red)
- Border-radius: 12px
- Padding: 24px

LAYOUT:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔴 Full Review Required                             45%         │
│                                                                 │
│ Contract: "Enterprise Deal - Acme Corp"                         │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Agent: 🐚 Maya                         Category: Sales       │ │
│ │ Created: 1 hour ago                    Model: claude-opus   │ │
│ │ ⏰ Expires in: 47 hours                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ AI Analysis ───────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ ⚠️ UNUSUAL TERMS DETECTED                                    │ │
│ │                                                             │ │
│ │ Section 4.2 - Liability Clause                              │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│ │ "The liability cap differs from our standard template       │ │
│ │ by $500,000. This is outside normal variance."              │ │
│ │                                                             │ │
│ │ Section 7.1 - Payment Terms                                 │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │ │
│ │ "Net-90 payment terms requested vs standard Net-30."        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Confidence Breakdown ──────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Template Match        ████████░░░░░░░░░░░░  42%             │ │
│ │ Compliance Check      ██████████████░░░░░░  68%             │ │
│ │ Value Authorization   ████████████████░░░░  78%             │ │
│ │ Historical Pattern    ██████░░░░░░░░░░░░░░  32%             │ │
│ │                                                             │ │
│ │ AI Recommendation: ⚠️ Requires Legal Review                  │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│        [View Full Contract]  [✏️ Edit]  [✗ Reject]  [✓ Approve]  │
│                                                                 │
│ ┌─ Delegate ──────────────────────────────────────────────────┐ │
│ │ Assign to: [Select team member ▼]                [Delegate] │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

HEADER:
- Left: Red badge "🔴 Full Review Required"
- Right: Confidence "45%" in red text

EXPIRATION WARNING:
- Shows timeout countdown
- Becomes more prominent as deadline approaches
- Red background when < 4 hours

AI ANALYSIS SECTION:
- Red-tinted background (#fef2f2)
- Warning icon + "UNUSUAL TERMS DETECTED"
- Specific sections with issues
- Clear explanation of concerns

CONFIDENCE BREAKDOWN:
- Individual factor scores with progress bars
- Color-coded: green >70%, amber 50-70%, red <50%
- AI recommendation at bottom

ACTIONS:
- "View Full Contract" - opens document viewer
- "Edit" - allows modifications before approval
- "Reject" - requires reason
- "Approve" - requires explicit confirmation

DELEGATION:
- Dropdown to select team member
- Useful for escalation to legal/finance

APPROVE CONFIRMATION (for low confidence):
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Confirm Approval                                             │
│                                                                 │
│ This item has low confidence (45%) and unusual terms detected.  │
│ Are you sure you want to approve?                               │
│                                                                 │
│ ☐ I have reviewed the flagged sections                          │
│ ☐ I accept responsibility for this approval                     │
│                                                                 │
│                              [Cancel]  [Confirm Approval]       │
└─────────────────────────────────────────────────────────────────┘
```
- Requires checkboxes before enabling confirm
```

### AP-05: Approval Detail

```
PROMPT: Create an HTML wireframe for the full approval detail view.

MODAL/SLIDE-OUT:
- Width: 720px (or 60% of viewport)
- Height: 90% viewport
- Slides in from right
- Background: #ffffff
- Shadow: large

HEADER (sticky):
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back                            🟡 72%              [✕ Close] │
│                                                                 │
│ Blog Post: "AI Trends 2025"                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Created by ✨ Nova · 15 min ago · Category: Content         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

TAB NAVIGATION:
```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│   Content     │   Analysis    │   History     │   Related     │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

CONTENT TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ [Full rendered content preview]                                 │
│                                                                 │
│ For email: shows formatted email                                │
│ For document: shows document preview                            │
│ For code: shows syntax-highlighted code                         │
│ For data: shows table/JSON view                                 │
│                                                                 │
│ ┌─ Metadata ──────────────────────────────────────────────────┐ │
│ │ Word Count: 1,247                                           │ │
│ │ Reading Time: 5 min                                         │ │
│ │ Target Audience: Business Decision Makers                   │ │
│ │ Keywords: AI, Machine Learning, 2025 Trends                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

ANALYSIS TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Confidence Factors ────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Content Quality        ████████████████░░░░  78%            │ │
│ │   Explanation: Well-structured with clear points            │ │
│ │                                                             │ │
│ │ Brand Voice Match      ██████████████░░░░░░  68%            │ │
│ │   Explanation: Slightly more formal than usual              │ │
│ │                                                             │ │
│ │ Factual Accuracy       ████████████░░░░░░░░  58%            │ │
│ │   Explanation: Some statistics need verification            │ │
│ │                                                             │ │
│ │ SEO Optimization       ████████████████████  95%            │ │
│ │   Explanation: Strong keyword usage and structure           │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ AI Recommendations ────────────────────────────────────────┐ │
│ │ 1. Verify the "300% adoption" statistic                     │ │
│ │ 2. Add source attribution for industry quotes               │ │
│ │ 3. Consider softer tone in conclusion                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

HISTORY TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ● 2:45 PM - Pending review                                      │
│ │  Currently awaiting your approval                             │
│ │                                                               │
│ ○ 2:34 PM - Generated by Nova                                   │
│ │  Using model: gpt-4o                                          │
│ │  Tokens: 2,450 ($0.07)                                        │
│ │                                                               │
│ ○ 2:33 PM - Task created                                        │
│    Request: "Write a blog post about AI trends for 2025"        │
│    Initiated by: john@company.com                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Timeline format
- Expandable entries

FOOTER (sticky):
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Comment (optional):                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Add feedback for the agent...                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                  [✏️ Edit First]  [✗ Reject]  [✓ Approve]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Optional comment field
- Edit before approve option
- Primary actions
```

### AP-06: Approval Diff View

```
PROMPT: Create an HTML wireframe for a before/after diff comparison view.

USE CASE: When an agent modifies existing content

HEADER:
```
┌─────────────────────────────────────────────────────────────────┐
│ Content Update: "Product Description - Widget Pro"              │
│                                                                 │
│ Changes made by ✨ Nova · 10 minutes ago                         │
│ View: [◉ Side by Side] [○ Unified] [○ Changes Only]             │
└─────────────────────────────────────────────────────────────────┘
```

SIDE-BY-SIDE VIEW:
```
┌───────────────────────────────┬───────────────────────────────┐
│ ORIGINAL                      │ UPDATED                       │
├───────────────────────────────┼───────────────────────────────┤
│                               │                               │
│ Widget Pro is a powerful      │ Widget Pro is a powerful      │
│ tool for businesses.          │ tool for businesses.          │
│                               │                               │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░    │ ░░░░░░░░░░░░░░░░░░░░░░░░░    │
│ Features include:             │ Key Features:                 │
│ - Fast processing             │ - Lightning-fast processing   │
│ - Easy integration            │ - Seamless integration        │
│ - 24/7 support               │ - 24/7 premium support        │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░    │ ░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                               │                               │
│ Contact us to learn more.     │ Start your free trial today.  │
│                               │                               │
└───────────────────────────────┴───────────────────────────────┘
```
- Highlighted background for changes:
  - Removed: Red background (#fef2f2)
  - Added: Green background (#f0fdf4)
  - Modified: Yellow background (#fffbeb)
- Line numbers on both sides
- Scroll sync between panels

UNIFIED VIEW:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Widget Pro is a powerful tool for businesses.                 │
│                                                                 │
│ - Features include:                                             │
│ + Key Features:                                                 │
│ - - Fast processing                                             │
│ + - Lightning-fast processing                                   │
│ - - Easy integration                                            │
│ + - Seamless integration                                        │
│ - - 24/7 support                                                │
│ + - 24/7 premium support                                        │
│                                                                 │
│ - Contact us to learn more.                                     │
│ + Start your free trial today.                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Git-style +/- prefixes
- Color coding for add/remove

CHANGES SUMMARY:
```
┌─────────────────────────────────────────────────────────────────┐
│ Summary: 12 words added, 8 words removed, 4 lines changed       │
│                                                                 │
│ Change types:                                                   │
│ ● Tone adjustment (more action-oriented)                        │
│ ● Feature descriptions enhanced                                 │
│ ● CTA updated                                                   │
│                                                                 │
│ AI Confidence in changes: 85%                                   │
└─────────────────────────────────────────────────────────────────┘
```

INLINE COMMENTING:
- Click any line to add comment
- Comment bubble appears inline
```
│ + Start your free trial today.  [💬 1 comment]                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 👤 John: "Should we include pricing info here?"          │   │
│   └─────────────────────────────────────────────────────────┘   │
```

ACTIONS:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Revert to Original]  [✏️ Edit Changes]  [✗ Reject]  [✓ Accept] │
└─────────────────────────────────────────────────────────────────┘
```
```

### AP-07: Batch Approval

```
PROMPT: Create an HTML wireframe for batch approval operations.

TRIGGER: When multiple items are selected in queue

BATCH ACTION BAR (sticky top):
```
┌─────────────────────────────────────────────────────────────────┐
│ 5 items selected                                                │
│                                                                 │
│ [☑ Select All]  |  [✓ Approve All]  [✗ Reject All]  [Clear]    │
│                                                                 │
│ Breakdown: 3 high confidence · 2 medium confidence              │
└─────────────────────────────────────────────────────────────────┘
```

SELECTED ITEMS PREVIEW:
```
┌─────────────────────────────────────────────────────────────────┐
│ ☑ │ 🟢 Email: "Welcome Series #1"                    95% │ ✕   │
│ ☑ │ 🟢 Email: "Welcome Series #2"                    93% │ ✕   │
│ ☑ │ 🟢 Email: "Welcome Series #3"                    91% │ ✕   │
│ ☑ │ 🟡 Social Post: "Product Launch"                 78% │ ✕   │
│ ☑ │ 🟡 Blog Draft: "Company Update"                  72% │ ✕   │
└─────────────────────────────────────────────────────────────────┘
```
- Individual X to deselect
- Grouped by confidence level

BATCH APPROVE CONFIRMATION:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Approve 5 items?                                                │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🟢 3 high confidence items (auto-approvable)                │ │
│ │    Will be approved immediately                             │ │
│ │                                                             │ │
│ │ 🟡 2 medium confidence items                                │ │
│ │    ⚠️ Recommended to review individually                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ○ Approve only high confidence (3 items)                        │
│ ● Approve all selected (5 items)                                │
│                                                                 │
│ Add note (applied to all):                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Batch approved - reviewed in bulk                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                    [Cancel]  [Confirm Approval] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

BATCH REJECT FLOW:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Reject 5 items?                                                 │
│                                                                 │
│ Reason for rejection:                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Action:                                                         │
│ ○ Send back to agents for revision                              │
│ ● Reject permanently                                            │
│ ○ Reject and pause similar requests                             │
│                                                                 │
│                                   [Cancel]  [Confirm Rejection] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

DELEGATION MODAL:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Delegate 5 items                                                │
│                                                                 │
│ Assign to:                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Search team members...]                                ▼   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Available team members:                                         │
│ ○ Sarah Chen (Legal) - 2 pending                                │
│ ○ Mike Ross (Finance) - 0 pending                               │
│ ○ Lisa Park (Marketing) - 5 pending                             │
│                                                                 │
│ Note to assignee:                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Please review these by EOD                                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ☐ Notify assignee via email                                     │
│                                                                 │
│                                      [Cancel]  [Delegate Items] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

PROGRESS INDICATOR (during batch operation):
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Processing 5 items...                                           │
│                                                                 │
│ ████████████████░░░░░░░░░░░░░░░░  3/5                          │
│                                                                 │
│ ✓ Email: "Welcome Series #1" - Approved                         │
│ ✓ Email: "Welcome Series #2" - Approved                         │
│ ✓ Email: "Welcome Series #3" - Approved                         │
│ ● Social Post: "Product Launch" - Processing...                 │
│ ○ Blog Draft: "Company Update"                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
```

---

## Section 4: AI Team Panel (5 Wireframes)

### AI-01: AI Team Overview

```
PROMPT: Create an HTML wireframe for the AI Team overview page.

PAGE HEADER:
```
┌─────────────────────────────────────────────────────────────────┐
│ Your AI Team                                                    │
│ 6 agents ready to help · 2 currently active                     │
└─────────────────────────────────────────────────────────────────┘
```

STATS BAR:
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🤖 Agents        │ │ ⚡ Tasks Today   │ │ 💰 Tokens Used   │ │ ✅ Success Rate  │
│    6 Active     │ │    47           │ │    125K ($3.20) │ │    98.5%        │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

AGENT GRID (2x3 cards):
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌──────────────────────────┐  ┌──────────────────────────┐     │
│ │ 🎯 Hub                   │  │ 🐚 Maya                  │     │
│ │ ●  Active                │  │ ●  Processing            │     │
│ │                          │  │                          │     │
│ │ Orchestrator             │  │ CRM & Relationships      │     │
│ │                          │  │                          │     │
│ │ Current: Coordinating    │  │ Current: Enriching       │     │
│ │ email campaign           │  │ 45 contacts              │     │
│ │                          │  │                          │     │
│ │ Tasks: 12 today          │  │ Tasks: 8 today           │     │
│ │ Tokens: 34K              │  │ Tokens: 28K              │     │
│ │                          │  │                          │     │
│ │ [View] [Configure]       │  │ [View] [Configure]       │     │
│ └──────────────────────────┘  └──────────────────────────┘     │
│                                                                 │
│ ┌──────────────────────────┐  ┌──────────────────────────┐     │
│ │ 🗺️ Atlas                 │  │ 🌿 Sage                  │     │
│ │ ○  Idle                  │  │ ○  Coming Soon           │     │
│ │                          │  │                          │     │
│ │ Projects & Tasks         │  │ Finance                  │     │
│ │                          │  │                          │     │
│ │ Last: Sprint planning    │  │ Available in Phase 2     │     │
│ │ completed                │  │                          │     │
│ │                          │  │                          │     │
│ │ Tasks: 15 today          │  │                          │     │
│ │ Tokens: 41K              │  │                          │     │
│ │                          │  │                          │     │
│ │ [View] [Configure]       │  │ [Learn More]             │     │
│ └──────────────────────────┘  └──────────────────────────┘     │
│                                                                 │
│ ┌──────────────────────────┐  ┌──────────────────────────┐     │
│ │ ✨ Nova                  │  │ 📊 Echo                  │     │
│ │ ○  Idle                  │  │ ○  Coming Soon           │     │
│ │                          │  │                          │     │
│ │ Marketing & Content      │  │ Analytics                │     │
│ │                          │  │                          │     │
│ │ Last: Blog post          │  │ Available in Phase 2     │     │
│ │ drafted                  │  │                          │     │
│ │                          │  │                          │     │
│ │ Tasks: 5 today           │  │                          │     │
│ │ Tokens: 22K              │  │                          │     │
│ │                          │  │                          │     │
│ │ [View] [Configure]       │  │ [Learn More]             │     │
│ └──────────────────────────┘  └──────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

AGENT CARD DETAILS:
- Agent icon (32px) with colored background matching agent color
- Name in bold, agent color
- Status indicator:
  - ● Green = Active/Processing
  - ○ Gray = Idle
  - ● Yellow = Coming Soon
- Role description
- Current task or last completed
- Daily stats
- Action buttons

ACTIVITY FEED (below grid):
```
┌─────────────────────────────────────────────────────────────────┐
│ Recent Activity                                    [View All →] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [🐚] Maya enriched contact "Sarah Johnson"           2 min ago  │
│ [🎯] Hub created task "Follow up with Acme"         5 min ago  │
│ [✨] Nova drafted "Q4 Newsletter"                   12 min ago  │
│ [🗺️] Atlas completed sprint planning               25 min ago  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
```

### AI-02: Agent Card

```
PROMPT: Create an HTML wireframe for an individual agent card component.

CARD DIMENSIONS:
- Width: 320px (or 50% of grid)
- Min-height: 200px
- Background: #ffffff
- Border: 1px #e5e5e5
- Border-radius: 16px
- Padding: 24px
- Hover: Shadow-lg, subtle border glow in agent color

ACTIVE AGENT CARD:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────────┐                                                     │
│  │  🐚    │  Maya                              ●  Processing    │
│  │        │  CRM & Relationships                                │
│  └────────┘                                                     │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  Currently working on:                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Enriching contact data for 45 new leads                 │   │
│  │ ████████████████░░░░░░░░░░░░ 62%                        │   │
│  │ ~3 minutes remaining                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Today's Stats                                                  │
│  ┌───────────────┬───────────────┬───────────────┐             │
│  │ Tasks: 8      │ Tokens: 28K   │ Cost: $0.85   │             │
│  └───────────────┴───────────────┴───────────────┘             │
│                                                                 │
│  Model: claude-3-sonnet                                         │
│                                                                 │
│                              [View History]  [⚙ Configure]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Icon container:
- 64px square
- Agent color background (teal #20B2AA for Maya)
- White icon or emoji
- Rounded 12px

Status indicator:
- Position: right of name
- Green dot + "Processing" / "Active"
- Pulsing animation when active

Current task:
- Gray background box
- Task description
- Progress bar (agent color)
- Time estimate

Stats row:
- Three equal columns
- Icon + number + label

IDLE AGENT CARD:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌────────┐                                                     │
│  │  🗺️    │  Atlas                                  ○  Idle    │
│  │        │  Projects & Tasks                                   │
│  └────────┘                                                     │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  Last completed:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ✓ Sprint 5 planning completed                           │   │
│  │   25 minutes ago                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Today's Stats                                                  │
│  ┌───────────────┬───────────────┬───────────────┐             │
│  │ Tasks: 15     │ Tokens: 41K   │ Cost: $1.23   │             │
│  └───────────────┴───────────────┴───────────────┘             │
│                                                                 │
│  Model: gpt-4o                                                  │
│                                                                 │
│                              [View History]  [⚙ Configure]      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Gray status dot
- "Last completed" instead of "Currently working on"
- Checkmark icon for completed task

COMING SOON CARD:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                         ○○○○○○  │
│  ┌────────┐                                                     │
│  │  🌿    │  Sage                            ○  Coming Soon     │
│  │        │  Finance                                            │
│  └────────┘                                                     │
│                                                                 │
│  ──────────────────────────────────────────────────────────     │
│                                                                 │
│  Available in Phase 2                                           │
│                                                                 │
│  Sage will help you with:                                       │
│  • Invoice processing                                           │
│  • Expense tracking                                             │
│  • Financial reporting                                          │
│  • Budget management                                            │
│                                                                 │
│                                            [Learn More →]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Muted colors (opacity 0.7)
- Feature list instead of stats
- "Learn More" CTA
```

### AI-03: Agent Detail

```
PROMPT: Create an HTML wireframe for an expanded agent detail view.

MODAL/PAGE:
- Full main content area
- Background: #ffffff

HEADER:
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back to AI Team                                               │
│                                                                 │
│ ┌────────┐                                                      │
│ │  🐚    │  Maya                                                │
│ │        │  CRM & Relationships                                 │
│ └────────┘  ●  Processing · claude-3-sonnet                     │
│                                                                 │
│ "I help you manage customer relationships, enrich contact       │
│  data, and keep your pipeline healthy."                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
- Large icon (96px)
- Agent personality quote
- Current status and model

TAB NAVIGATION:
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Overview   │  History    │  Settings   │  Analytics  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

OVERVIEW TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Current Task ──────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Enriching contact data for 45 new leads                     │ │
│ │ Started: 5 minutes ago                                      │ │
│ │                                                             │ │
│ │ ████████████████████████░░░░░░░░░░ 72%                      │ │
│ │                                                             │ │
│ │ Processing: sarah.johnson@acme.com                          │ │
│ │ Remaining: 13 contacts                                      │ │
│ │                                                             │ │
│ │                               [Pause]  [Cancel]             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Capabilities ──────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ ✓ Contact enrichment via Clearbit/Apollo                    │ │
│ │ ✓ Lead scoring (40% firmographic, 35% behavioral, 25% intent)│ │
│ │ ✓ Deal pipeline management                                  │ │
│ │ ✓ Email drafting and follow-ups                             │ │
│ │ ✓ CRM data maintenance                                      │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Recent Completions ────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ ✓ Drafted follow-up email for Johnson deal      10 min ago  │ │
│ │ ✓ Updated 12 contact records                    25 min ago  │ │
│ │ ✓ Generated lead score report                   1 hour ago  │ │
│ │ ✓ Enriched "Acme Corp" company profile          2 hours ago │ │
│ │                                                             │ │
│ │                                         [View All History →] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

HISTORY TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Filter: [All Tasks ▼]  [Today ▼]  [Search...]                   │
│                                                                 │
│ TODAY                                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ● 2:45 PM - Enriching contacts (in progress)                │ │
│ │   45 contacts · claude-3-sonnet · 28K tokens                │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ✓ 2:30 PM - Email drafted                                   │ │
│ │   "Johnson Follow-up" · Approved · 2.1K tokens              │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ✓ 1:15 PM - Contact records updated                         │ │
│ │   12 records · Auto-approved · 8.5K tokens                  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ ✗ 11:30 AM - Email draft rejected                           │ │
│ │   "Cold outreach" · Rejected: Too aggressive · 1.8K tokens  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ YESTERDAY                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ... more entries                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                              [Load More]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

ANALYTICS TAB:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ Period: [Last 7 Days ▼]                                         │
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐    │
│ │ Tasks Completed │ │ Approval Rate   │ │ Avg Confidence  │    │
│ │      47         │ │     94%         │ │      82%        │    │
│ │   ↑ 12% vs last │ │   ↑ 3% vs last  │ │   ↑ 5% vs last  │    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
│                                                                 │
│ ┌─ Token Usage Over Time ─────────────────────────────────────┐ │
│ │                                                             │ │
│ │     [Line chart showing daily token usage]                  │ │
│ │                                                             │ │
│ │  Mon   Tue   Wed   Thu   Fri   Sat   Sun                    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─ Task Distribution ─────────────────────────────────────────┐ │
│ │                                                             │ │
│ │  Contact Enrichment  ████████████████████████  48%          │ │
│ │  Email Drafting      ██████████████           28%          │ │
│ │  Data Updates        ████████                 16%          │ │
│ │  Lead Scoring        ████                      8%          │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
```

### AI-04: Agent Activity Feed

```
PROMPT: Create an HTML wireframe for a real-time agent activity feed.

CONTAINER:
- Can be embedded in dashboard or standalone page
- Background: #ffffff
- Border: 1px #e5e5e5
- Border-radius: 12px

HEADER:
```
┌─────────────────────────────────────────────────────────────────┐
│ Agent Activity                              ● Live    [Filters] │
└─────────────────────────────────────────────────────────────────┘
```
- "Live" indicator with pulsing dot
- Filter dropdown

FILTER DROPDOWN:
```
┌─────────────────────────┐
│ ☑ All Agents            │
│ ☑ Hub                   │
│ ☑ Maya                  │
│ ☑ Atlas                 │
│ ☐ Show completed only   │
│ ☐ Show errors only      │
└─────────────────────────┘
```

ACTIVITY STREAM:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ LIVE ─────────────────────────────────────────────────────┐  │
│ │                                                            │  │
│ │ [🐚]  Maya is enriching contact data...                    │  │
│ │       Processing: sarah.johnson@acme.com                   │  │
│ │       ████████████████████░░░░░░░░░░  68%                  │  │
│ │       ~2 min remaining                                     │  │
│ │                                                   [Pause]  │  │
│ │                                                            │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ● Just now                                                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ [🎯] Hub created approval request                          │  │
│ │      "Email: Johnson Follow-up"                            │  │
│ │      Confidence: 78%                                       │  │
│ │                                       [View in Queue →]    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ● 2 minutes ago                                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ [🗺️] Atlas completed task                                  │  │
│ │      "Sprint 5 Planning"                                   │  │
│ │      ✓ 12 tasks created · 3 assigned                       │  │
│ │                                            [View Tasks →]  │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ● 5 minutes ago                                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ [🐚] Maya auto-approved                                    │  │
│ │      Contact update: "Acme Corp"                           │  │
│ │      Confidence: 96% · No review needed                    │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ● 12 minutes ago                                                │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ [✨] Nova draft rejected                               ⚠️   │  │
│ │      "Cold Outreach Email"                                 │  │
│ │      Reason: Tone too aggressive                           │  │
│ │                                         [View Feedback →]  │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                              [Load More]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

ENTRY TYPES:
1. **In Progress** - Progress bar, live status
2. **Approval Created** - Links to queue
3. **Task Completed** - Summary of output
4. **Auto-Approved** - Confidence shown
5. **Rejected/Error** - Warning styling, feedback link

VISUAL INDICATORS:
- Agent icon with colored ring
- Relative timestamps
- Entry backgrounds:
  - In progress: Light blue (#eff6ff)
  - Success: Light green (#f0fdf4)
  - Warning/Rejected: Light amber (#fffbeb)
  - Error: Light red (#fef2f2)

STREAMING UPDATE:
New entries slide in from top with animation (300ms).

EMPTY STATE:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         😴                                       │
│                                                                 │
│              Your agents are taking a break                     │
│                                                                 │
│        Start a conversation to put them to work!                │
│                                                                 │
│                    [Chat with Hub →]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
```

### AI-05: Agent Configuration Panel

```
PROMPT: Create an HTML wireframe for agent configuration settings.

SETTINGS TAB IN AGENT DETAIL:

MODEL ASSIGNMENT:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Model Configuration ───────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Primary Model                                               │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ claude-3-sonnet                                     ▼   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ Available models from your API keys:                        │ │
│ │ • claude-3-opus (Anthropic) - Most capable                  │ │
│ │ • claude-3-sonnet (Anthropic) - Balanced ← Current          │ │
│ │ • claude-3-haiku (Anthropic) - Fastest                      │ │
│ │ • gpt-4o (OpenAI)                                           │ │
│ │ • gpt-4-turbo (OpenAI)                                      │ │
│ │ • deepseek-chat (DeepSeek) - Budget option                  │ │
│ │                                                             │ │
│ │ ☐ Enable fallback to DeepSeek when rate limited             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

CONFIDENCE THRESHOLDS:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Approval Thresholds ───────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Auto-approve when confidence ≥                              │ │
│ │ ├──────────────────────────────────●──────────┤ 85%         │ │
│ │                                                             │ │
│ │ Require full review when confidence <                       │ │
│ │ ├────────────────●────────────────────────────┤ 60%         │ │
│ │                                                             │ │
│ │ Current behavior:                                           │ │
│ │ • ≥85%: Auto-approved (no human review)                     │ │
│ │ • 60-84%: Quick review (preview + 1-click)                  │ │
│ │ • <60%: Full review (detailed analysis required)            │ │
│ │                                                             │ │
│ │ ⚠️ Lowering auto-approve threshold may increase risk        │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

USAGE LIMITS:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Daily Limits ──────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Maximum tokens per day                                      │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 100,000                                             ▼   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ Current usage: 28,450 / 100,000 (28.5%)                     │ │
│ │                                                             │ │
│ │ Maximum tasks per day                                       │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Unlimited                                           ▼   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ When limit reached:                                         │ │
│ │ ○ Pause agent until tomorrow                                │ │
│ │ ● Switch to fallback model (DeepSeek)                       │ │
│ │ ○ Send notification and continue                            │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

NOTIFICATION PREFERENCES:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Notifications ─────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Notify me when:                                             │ │
│ │                                                             │ │
│ │ ☑ Task requires my approval                                 │ │
│ │ ☑ Task fails or encounters error                            │ │
│ │ ☐ Task completes successfully (silent by default)           │ │
│ │ ☑ Daily limit approaching (80%)                             │ │
│ │ ☐ Agent starts working on new task                          │ │
│ │                                                             │ │
│ │ Notification channels:                                      │ │
│ │ ☑ In-app notifications                                      │ │
│ │ ☐ Email notifications                                       │ │
│ │ ☐ Slack (configure in integrations)                         │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

ADVANCED OPTIONS:
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Advanced ──────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Temperature (creativity)                                    │ │
│ │ ├──────●──────────────────────────────────────┤ 0.3         │ │
│ │ More precise                      More creative             │ │
│ │                                                             │ │
│ │ Context window                                              │ │
│ │ ├─────────────────────────────────●───────────┤ 8K tokens   │ │
│ │ Less context                      More context              │ │
│ │                                                             │ │
│ │ ☐ Enable experimental features                              │ │
│ │ ☐ Allow agent to create sub-agents                          │ │
│ │                                                             │ │
│ │                      [Reset to Defaults]                    │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                    [Cancel]  [Save Changes]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
```

---

**Document continues with Sections 5-12...**

Due to length, I'll continue with the remaining sections in follow-up writes. This covers:
- Section 5: Settings Pages (8 wireframes)
- Section 6: CRM Module (14 wireframes)
- Section 7: PM Module (16 wireframes)
- Section 8: Data Components (6 wireframes)
- Section 9: Forms & Inputs (5 wireframes)
- Section 10: Feedback & States (5 wireframes)
- Section 11: Authentication (6 wireframes)

---

## Usage Instructions for Google Stitch

1. **Copy the Global Design System** at the top of each prompt
2. **Paste the specific wireframe prompt** from the relevant section
3. **Request HTML output** with inline CSS using the design tokens
4. **Ask for responsive variants** when needed
5. **Request dark mode version** for P0 screens

## Quality Checklist

Before accepting generated wireframes:
- [ ] Colors match brand palette (#FF6B6B, #20B2AA, #FFFBF5)
- [ ] Typography uses Inter font family
- [ ] Spacing follows 4px/8px/16px/24px/32px scale
- [ ] Border radius is consistent (8px default, 12px cards, 16px modals)
- [ ] Shadows are subtle, not harsh
- [ ] Interactive elements have hover states
- [ ] Focus states visible for accessibility
- [ ] Agent colors are correct (Hub=coral, Maya=teal, Atlas=orange, etc.)

