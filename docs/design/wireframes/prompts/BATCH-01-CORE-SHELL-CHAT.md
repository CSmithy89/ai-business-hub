# HYVVE - Google Stitch Prompts Batch 1

**Wireframes:** Core Shell (6) + Chat Interface (4) = 10 prompts
**Priority:** P0 - Critical
**Created:** 2025-12-01

---

## GLOBAL DESIGN SYSTEM

**Copy this section and include at the start of every prompt:**

```
DESIGN SYSTEM REQUIREMENTS:

BRAND:
- App Name: HYVVE
- Tagline: "AI-powered business operations"
- Design Philosophy: Premium SaaS inspired by Linear, Notion, Stripe, Superhuman

COLORS:
Light Mode:
- Background Primary: #FFFBF5 (warm cream, NOT pure white)
- Background Secondary: #f9f7f2 (sidebar, cards)
- Background Tertiary: #f5f3ee (hover states)
- Surface: #ffffff (cards, modals)
- Border: #e5e5e5 (light gray)
- Text Primary: #1a1a1a (near black)
- Text Secondary: #6b7280 (gray-500)
- Text Muted: #9ca3af (gray-400)

Dark Mode:
- Background Primary: #0a0a0b (near-black, NOT #000)
- Background Secondary: #111113 (elevated surfaces)
- Background Tertiary: #1a1a1d (cards)
- Surface: #232326 (interactive hover)
- Border: #27272a (subtle)
- Text Primary: #fafafa (almost white)
- Text Secondary: #a1a1aa (gray)
- Text Muted: #71717a (muted gray)

Brand Colors:
- Primary (Coral): #FF6B6B - Main CTA, Hub agent
- Secondary (Teal): #20B2AA - Accent, Maya agent
- Success: #2ECC71 (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)
- Info: #4B7BEC (blue)

AI Agent Colors:
- Hub (Orchestrator): #FF6B6B (coral)
- Maya (CRM): #20B2AA (teal)
- Atlas (PM): #FF9F43 (orange)
- Sage (Finance): #2ECC71 (green)
- Nova (Marketing): #FF6B9D (pink)
- Echo (Analytics): #4B7BEC (blue)

TYPOGRAPHY:
- Font Family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Monospace: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace
- Base Size: 16px
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 32px, 40px
- Line Height: 1.6 (body), 1.2 (headings)
- Letter Spacing: -0.02em (headings), 0 (body), 0.05em (uppercase labels)
- Font Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

SPACING:
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px
- Section Padding: 32px-48px
- Card Padding: 20px-24px
- Component Gap: 16px
- Tight Gap: 8px

SHADOWS (Soft, Premium):
- shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04)
- shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.04)
- shadow-md: 0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)
- shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)
- shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)

BORDER RADIUS:
- radius-sm: 4px (buttons, inputs)
- radius-md: 8px (cards, default)
- radius-lg: 12px (larger cards)
- radius-xl: 16px (modals, panels)
- radius-full: 9999px (pills, avatars)

TRANSITIONS:
- Fast: 100ms ease-out (micro-interactions)
- Normal: 150ms ease-out (hover states)
- Slow: 200-250ms ease-out (modals, panels)
- Slide: 300ms ease-out (sidebars, drawers)

INTERACTIVE STATES:
- Hover: Background shifts lighter/darker by 4-8%
- Active: Scale 0.98, shadow inset
- Focus: 2px solid primary color, 2px offset
- Disabled: Opacity 0.5, cursor not-allowed

PREMIUM UI PRINCIPLES:
1. Generous whitespace (luxury indicator)
2. Subtle shadows (never harsh)
3. Smooth micro-interactions
4. Keyboard-first design (Cmd+K everywhere)
5. Progressive disclosure (show only what's needed)
6. Speed perception (skeleton screens, optimistic updates)
7. Agent personalities visible (colors, icons)
```

---

## PROMPT 1: SH-01 Shell Layout (Three-Panel)

```
Create a premium SaaS application shell with a three-panel layout for HYVVE, an AI-powered business operations platform.

[INCLUDE GLOBAL DESIGN SYSTEM ABOVE]

LAYOUT SPECIFICATIONS:

1. OVERALL STRUCTURE:
- Full viewport width and height (100vw x 100vh)
- Three-panel layout: Sidebar | Main Content | Chat Panel
- No scrollbars on shell (panels scroll independently)
- Warm cream background (#FFFBF5) for main content area

2. HEADER BAR (fixed top, 60px height):
Position: Fixed, top: 0, left: 0, right: 0
Background: #ffffff
Border-bottom: 1px solid #e5e5e5
Padding: 0 24px
Display: flex, align-items: center, justify-content: space-between
Shadow: shadow-xs

LEFT SECTION (display: flex, align-items: center, gap: 16px):
- Logo: HYVVE icon (24px coral #FF6B6B hexagon shape) + wordmark "HYVVE" (20px, font-weight: 700, color: #1a1a1a, letter-spacing: -0.02em)
- Vertical divider: 1px solid #e5e5e5, height: 28px, margin: 0 8px
- Workspace selector button:
  - Company avatar: 28px rounded square (radius-md), background #f0f0f0, letter "A" in #6b7280
  - Company name: "Acme Corp" (14px, medium weight)
  - Chevron down icon (12px, #6b7280)
  - Hover: background #f5f5f5, radius-md

RIGHT SECTION (display: flex, align-items: center, gap: 12px):
- Global search button (pill shape):
  - Background: #f5f5f5
  - Border: 1px solid #e5e5e5
  - Padding: 8px 12px
  - Border-radius: radius-full
  - Content: Search icon (16px) + "Search..." (#9ca3af) + keyboard badge "⌘K" (background #e5e5e5, padding: 2px 6px, radius-sm, 11px font)
  - Hover: background #eeeeee

- Notification bell:
  - Icon: 20px, #6b7280
  - Badge: Absolute top-right, 16px circle, background #EF4444, color white, font-size 11px, content "3"
  - Hover: background #f5f5f5 circle

- Help button: Question mark icon in circle (20px, #6b7280), hover: background circle

- User menu:
  - Avatar: 36px circle with user photo placeholder (gradient background #FF6B6B to #FF6B9D, white initials "JD")
  - Chevron down (12px, #6b7280)
  - Hover: shadow-sm on avatar

3. LEFT SIDEBAR (fixed left, below header):
Position: Fixed, top: 60px, left: 0, bottom: 0
Width: 256px (expanded state)
Background: #f9f7f2
Border-right: 1px solid #e5e5e5
Padding: 16px 12px
Display: flex, flex-direction: column

NAVIGATION SECTION (flex: 1):
Section label: "MAIN" (11px, uppercase, font-weight: 500, color: #9ca3af, letter-spacing: 0.05em, padding: 8px 12px, margin-bottom: 4px)

Nav items (each):
- Height: 44px
- Padding: 0 12px
- Display: flex, align-items: center, gap: 12px
- Border-radius: radius-md
- Cursor: pointer
- Transition: background 150ms ease-out

Nav item content:
- Icon: 20px, #6b7280
- Label: 14px, medium weight, #1a1a1a
- Badge (if applicable): Background #FF6B6B, color white, padding: 2px 8px, radius-full, font-size 12px

Nav items list:
1. Dashboard (grid-3x3 icon) - ACTIVE STATE: background #fff, coral left border (3px), icon and text coral (#FF6B6B)
2. Approvals (check-circle icon) + badge "(5)"
3. AI Team (robot icon)
4. Settings (gear icon)

Divider: 1px solid #e5e5e5, margin: 12px 0

Section label: "MODULES"
5. CRM (users icon) - Small teal dot (6px) after label indicating Maya
6. Projects (folder icon) - Small orange dot indicating Atlas

WORKSPACE SELECTOR (bottom):
Margin-top: auto
Padding-top: 16px
Border-top: 1px solid #e5e5e5
Display: flex, align-items: center, gap: 12px
- Company avatar: 36px rounded square
- Name: "Acme Corp" (14px, medium)
- Chevron-down icon
- Hover: background #f5f3ee, radius-md

COLLAPSE TOGGLE (bottom-right corner):
Position: absolute, bottom: 16px, right: 12px
Button: 28px square, #6b7280 double-chevron-left icon
Hover: background #e5e5e5

4. MAIN CONTENT AREA:
Position: Fixed or absolute
Top: 60px
Left: 256px
Right: 380px
Bottom: 0
Background: #FFFBF5
Overflow-y: auto
Padding: 32px

Content placeholder:
- Page title: "Dashboard" (28px, bold, #1a1a1a)
- Subtitle: "Welcome back, John" (14px, #6b7280)
- Skeleton cards showing loading state (3 cards in a row, gray rectangles with pulse animation)

5. RIGHT CHAT PANEL (fixed right, below header):
Position: Fixed, top: 60px, right: 0, bottom: 0
Width: 380px
Background: #ffffff
Border-left: 1px solid #e5e5e5
Shadow: -4px 0 16px rgba(0, 0, 0, 0.04)
Display: flex, flex-direction: column

CHAT HEADER (56px):
Background: #f9f7f2
Padding: 12px 16px
Display: flex, align-items: center, justify-content: space-between
Border-bottom: 1px solid #e5e5e5

Left side:
- Agent icon: 32px circle, coral background (#FF6B6B), white target icon
- Status dot: 8px green circle, position absolute bottom-right of avatar
- Text: "Hub" (16px, semibold), "Orchestrator" (12px, #6b7280) below

Right side icons (20px each, #6b7280, hover: background circle):
- History icon (clock)
- Minimize icon (minus/line)
- Expand icon (arrows-maximize)

CHAT MESSAGES AREA (flex: 1):
Overflow-y: auto
Padding: 16px
Background: #ffffff

Show 2-3 example messages:
- User message (right aligned, coral bubble)
- Agent message (left aligned, gray bubble with Hub icon)

CHAT INPUT (bottom):
Border-top: 1px solid #e5e5e5
Padding: 12px 16px
Background: #ffffff

Input container:
- Background: #f5f5f5
- Border-radius: 24px
- Padding: 12px 48px 12px 44px
- Display: flex, align-items: center

Left icon: @ symbol (20px, #9ca3af), position absolute left 12px
Input: Placeholder "Message Hub..." (#9ca3af, 14px)
Right button: 36px coral circle (#FF6B6B), white arrow-up icon, position absolute right 6px

OUTPUT REQUIREMENTS:
1. Generate complete HTML with inline CSS
2. Use actual SVG icons or emoji placeholders where specified
3. Include hover states using :hover pseudo-class
4. Make it pixel-perfect to specifications
5. Include both light mode version
6. Add smooth transitions on interactive elements
7. Total width: 1440px (desktop reference)
```

---

## PROMPT 2: SH-02 Navigation Sidebar (Expanded + Collapsed States)

```
Create the navigation sidebar component for HYVVE with both expanded (256px) and collapsed (64px) states.

[INCLUDE GLOBAL DESIGN SYSTEM]

EXPANDED SIDEBAR (256px width):

CONTAINER:
- Width: 256px
- Height: calc(100vh - 60px) (below header)
- Background: #f9f7f2
- Border-right: 1px solid #e5e5e5
- Padding: 16px 12px
- Display: flex, flex-direction: column
- Position: fixed, left: 0, top: 60px

LOGO AREA (only in collapsed state this shows, expanded has logo in header)

SECTION 1 - MAIN NAVIGATION:
Section label:
- Text: "MAIN"
- Font: 11px, uppercase, weight 500
- Color: #9ca3af
- Letter-spacing: 0.05em
- Padding: 8px 12px
- Margin-bottom: 4px

Navigation items (4 items):

ITEM STRUCTURE:
```html
<div class="nav-item [active]">
  <div class="icon-wrapper">
    <svg class="icon">...</svg>
  </div>
  <span class="label">Label</span>
  <span class="badge">5</span> <!-- optional -->
</div>
```

ITEM STYLES:
- Height: 44px
- Padding: 0 12px
- Display: flex
- Align-items: center
- Gap: 12px
- Border-radius: 8px
- Cursor: pointer
- Transition: all 150ms ease-out

DEFAULT STATE:
- Background: transparent
- Icon: 20px, color #6b7280
- Label: 14px, weight 500, color #1a1a1a

HOVER STATE:
- Background: #f5f3ee

ACTIVE STATE:
- Background: #ffffff
- Border-left: 3px solid #FF6B6B
- Icon: color #FF6B6B
- Label: color #FF6B6B
- Box-shadow: shadow-sm

ITEMS LIST:
1. Dashboard (grid icon) - Mark as ACTIVE
   - Icon: 3x3 grid squares

2. Approvals (check-circle icon)
   - Badge: "(5)" in coral pill
   - Badge styles: background #FF6B6B, color white, padding 2px 8px, border-radius full, font-size 12px, font-weight 500

3. AI Team (robot icon)
   - Icon: Simple robot face

4. Settings (gear/cog icon)

DIVIDER:
- Height: 1px
- Background: #e5e5e5
- Margin: 12px 0

SECTION 2 - MODULES:
Section label: "MODULES" (same style as MAIN)

5. CRM (users icon)
   - After label: Small circle (6px) in teal (#20B2AA) indicating Maya agent
   - Gap between label and dot: 8px

6. Projects (folder icon)
   - After label: Small circle (6px) in orange (#FF9F43) indicating Atlas agent

WORKSPACE SELECTOR (bottom):
- Margin-top: auto
- Padding-top: 16px
- Border-top: 1px solid #e5e5e5

Container:
- Display: flex
- Align-items: center
- Gap: 12px
- Padding: 8px 12px
- Border-radius: 8px
- Cursor: pointer

Elements:
- Avatar: 36px rounded square (radius 8px), background gradient, initials "AC"
- Name: "Acme Corp" (14px, weight 500, #1a1a1a)
- Icon: Chevron-down (12px, #6b7280)

Hover: background #f5f3ee

COLLAPSE TOGGLE:
- Position: absolute, bottom: 16px, right: 12px
- Size: 28px square
- Background: transparent
- Border-radius: 6px
- Icon: double-chevron-left (16px, #6b7280)
- Hover: background #e5e5e5

---

COLLAPSED SIDEBAR (64px width):

CONTAINER:
- Width: 64px
- Same height and positioning
- Background: #f9f7f2
- Padding: 16px 8px

NAVIGATION ITEMS:
- Icon only, centered
- Size: 44px square
- Border-radius: 8px
- Display: flex, align-items: center, justify-content: center

ACTIVE STATE:
- Background: #ffffff
- Border-left: 3px solid #FF6B6B
- Icon: #FF6B6B
- Shadow: shadow-sm

HOVER STATE:
- Background: #f5f3ee

TOOLTIPS (on hover):
- Position: right of icon (left: 72px)
- Background: #1a1a1a
- Color: #ffffff
- Padding: 6px 12px
- Border-radius: 6px
- Font-size: 13px
- White-space: nowrap
- Arrow pointing left
- Shadow: shadow-lg
- Delay: 300ms

BADGES (on icons):
- Position: absolute, top: 6px, right: 6px
- Size: 18px circle
- Background: #FF6B6B
- Color: white
- Font-size: 10px
- Display: flex, align-items: center, justify-content: center

EXPAND TOGGLE:
- Same as collapse but icon: double-chevron-right

---

TRANSITION ANIMATION (between states):
- Duration: 200ms
- Easing: ease-out
- Properties: width, padding
- Nav item labels: opacity 0 → 1 with 100ms delay

OUTPUT:
Create two separate HTML blocks - one for expanded, one for collapsed state.
Include CSS transitions for smooth animation between states.
```

---

## PROMPT 3: SH-03 Header Bar with Dropdowns

```
Create the header bar component for HYVVE with all dropdown menus expanded.

[INCLUDE GLOBAL DESIGN SYSTEM]

HEADER BAR:

CONTAINER:
- Height: 60px
- Width: 100%
- Position: fixed, top: 0, left: 0, right: 0
- Background: #ffffff
- Border-bottom: 1px solid #e5e5e5
- Box-shadow: shadow-xs
- Padding: 0 24px
- Display: flex
- Align-items: center
- Justify-content: space-between
- Z-index: 100

LEFT SECTION (display: flex, align-items: center, gap: 16px):

1. LOGO:
- Icon: 28px hexagon shape, background #FF6B6B, white "H" letter or target icon inside
- Wordmark: "HYVVE" next to icon
  - Font-size: 20px
  - Font-weight: 700
  - Color: #1a1a1a
  - Letter-spacing: -0.02em
- Gap between icon and text: 8px
- Clickable, cursor: pointer

2. DIVIDER:
- Width: 1px
- Height: 28px
- Background: #e5e5e5
- Margin: 0 8px

3. WORKSPACE SELECTOR (with dropdown):
Button:
- Display: flex, align-items: center, gap: 8px
- Padding: 6px 10px
- Border-radius: 6px
- Background: transparent
- Border: none
- Cursor: pointer

Button content:
- Avatar: 24px rounded square, background linear-gradient(135deg, #FF6B6B, #FF9F43), initials "A" in white
- Name: "Acme Corp" (14px, weight 500, #1a1a1a)
- Chevron: down arrow (12px, #6b7280)

Button hover: background #f5f5f5

DROPDOWN (show expanded below button):
- Position: absolute, top: 100%, left: 0
- Width: 280px
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 12px
- Box-shadow: shadow-xl
- Padding: 8px
- Margin-top: 8px

Dropdown header:
- Padding: 12px
- Border-bottom: 1px solid #e5e5e5
- Text: "Workspaces" (12px, uppercase, #9ca3af, letter-spacing 0.05em)

Workspace items (show 3):
- Height: 48px
- Padding: 8px 12px
- Display: flex, align-items: center, gap: 12px
- Border-radius: 8px
- Cursor: pointer

Item content:
- Avatar: 32px rounded square with initials
- Name: 14px, weight 500, #1a1a1a
- Role: 12px, #6b7280

Current workspace: checkmark icon on right, background #f5f5f5

Hover: background #f5f5f5

Dropdown footer:
- Border-top: 1px solid #e5e5e5
- Padding: 8px 12px 4px

Footer button:
- Display: flex, align-items: center, gap: 8px
- Padding: 10px 12px
- Border-radius: 8px
- Color: #6b7280
- Icon: plus (16px)
- Text: "Create workspace" (14px)
- Hover: background #f5f5f5, color #1a1a1a

---

CENTER SECTION (optional breadcrumbs, show example):
- Display: flex
- Align-items: center
- Gap: 8px

Breadcrumb items:
- "CRM" (14px, #6b7280) + chevron-right (12px, #d1d5db) + "Contacts" (14px, #6b7280) + chevron-right + "Acme Corp" (14px, #1a1a1a, weight 500)
- Links hover: color #FF6B6B

---

RIGHT SECTION (display: flex, align-items: center, gap: 8px):

1. SEARCH BUTTON:
- Display: flex, align-items: center, gap: 8px
- Background: #f5f5f5
- Border: 1px solid #e5e5e5
- Border-radius: 24px (pill)
- Padding: 8px 14px
- Cursor: pointer

Content:
- Search icon: 16px, #9ca3af
- Text: "Search..." (14px, #9ca3af)
- Badge: "⌘K" in small pill (background #e5e5e5, padding 2px 6px, radius 4px, 11px font, #6b7280)

Hover: background #eeeeee

2. NOTIFICATION BELL (with dropdown):
Button:
- Width: 36px, Height: 36px
- Display: flex, align-items: center, justify-content: center
- Border-radius: 8px
- Background: transparent
- Position: relative

Icon: Bell, 20px, #6b7280

Badge:
- Position: absolute, top: 4px, right: 4px
- Size: 18px diameter
- Background: #EF4444
- Color: white
- Font-size: 11px
- Font-weight: 600
- Display: flex, align-items: center, justify-content: center
- Content: "3"

Hover: background #f5f5f5

DROPDOWN (show expanded):
- Position: absolute, top: 100%, right: 0
- Width: 380px
- Max-height: 480px
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 12px
- Box-shadow: shadow-xl
- Margin-top: 8px
- Overflow: hidden

Header:
- Padding: 16px
- Border-bottom: 1px solid #e5e5e5
- Display: flex, justify-content: space-between, align-items: center
- Title: "Notifications" (16px, weight 600)
- Action: "Mark all read" (14px, #FF6B6B, hover: underline)

Notification list (scrollable):
- Max-height: 360px
- Overflow-y: auto

Notification items (show 4):
Each item:
- Padding: 12px 16px
- Border-bottom: 1px solid #f5f5f5
- Display: flex, gap: 12px
- Cursor: pointer

Item content:
- Agent avatar: 36px circle with agent color background (🐚 Maya teal, 🎯 Hub coral)
- Content wrapper (flex: 1):
  - Message: 14px, #1a1a1a, 2 lines max (e.g., "Maya enriched 45 contacts")
  - Time: 12px, #9ca3af (e.g., "2 minutes ago")
- Unread indicator: 8px coral dot (position: absolute, left: 4px)

Unread item: background #fef2f2 (very light coral)
Hover: background #f5f5f5

Footer:
- Padding: 12px 16px
- Border-top: 1px solid #e5e5e5
- Text-align: center
- Link: "View all notifications →" (14px, #6b7280, hover: #FF6B6B)

3. HELP BUTTON:
- Same size/style as notification
- Icon: Question mark in circle (20px, #6b7280)
- Tooltip on hover: "Help & Resources"

4. USER MENU (with dropdown):
Button:
- Display: flex, align-items: center, gap: 6px
- Padding: 4px
- Border-radius: 8px
- Cursor: pointer

Avatar:
- Size: 36px circle
- Background: linear-gradient(135deg, #4B7BEC, #8B5CF6)
- Content: "JD" initials in white, 14px, weight 600

Chevron: down arrow (12px, #6b7280)

Hover: background #f5f5f5

DROPDOWN (show expanded):
- Position: absolute, top: 100%, right: 0
- Width: 240px
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 12px
- Box-shadow: shadow-xl
- Margin-top: 8px
- Padding: 8px

User info section:
- Padding: 12px
- Border-bottom: 1px solid #e5e5e5
- Display: flex, align-items: center, gap: 12px

User avatar: 40px circle
User details:
- Name: "John Doe" (14px, weight 600, #1a1a1a)
- Email: "john@acme.com" (12px, #6b7280)

Menu items (each):
- Padding: 10px 12px
- Border-radius: 6px
- Display: flex, align-items: center, gap: 12px
- Cursor: pointer
- Icon: 18px, #6b7280
- Text: 14px, #1a1a1a

Items:
- User icon + "Profile"
- Settings icon + "Account Settings"

Divider: 1px solid #e5e5e5, margin: 4px 0

Theme toggle:
- Padding: 10px 12px
- Display: flex, align-items: center, justify-content: space-between
- Icon + "Theme"
- Toggle: 3-option (Light/Dark/System) pills

Divider

Sign out:
- Same style but color: #EF4444
- Icon: log-out
- Text: "Sign Out"

Hover state for items: background #f5f5f5

OUTPUT:
Generate complete HTML showing header bar with ALL dropdowns visible (workspace, notifications, user menu).
This is for documentation/wireframe purposes - show all states simultaneously.
```

---

## PROMPT 4: SH-04 Status Bar

```
Create the application status bar for HYVVE that shows at the bottom of the viewport.

[INCLUDE GLOBAL DESIGN SYSTEM]

STATUS BAR SPECIFICATIONS:

CONTAINER:
- Position: fixed, bottom: 0, left: 0, right: 0
- Height: 32px
- Background: #f9f7f2 (light) / #111113 (dark)
- Border-top: 1px solid #e5e5e5 (light) / #27272a (dark)
- Padding: 0 16px
- Display: flex
- Align-items: center
- Justify-content: space-between
- Font-size: 12px
- Color: #6b7280
- Z-index: 50

---

LEFT SECTION (display: flex, align-items: center, gap: 16px):

1. CONNECTION STATUS:
Display: flex, align-items: center, gap: 6px

CONNECTED STATE:
- Dot: 6px circle, background #2ECC71 (green)
- Text: "Connected" (#6b7280)

RECONNECTING STATE (show as alternative):
- Dot: 6px circle, background #F59E0B (amber), with pulse animation
- Text: "Reconnecting..." (#F59E0B)

OFFLINE STATE (show as alternative):
- Dot: 6px circle, background #EF4444 (red)
- Text: "Offline" (#EF4444)

2. SYNC STATUS:
Display: flex, align-items: center, gap: 6px
- Icon: Refresh/sync icon (14px, #6b7280)
- Text: "Synced 2 min ago"

When syncing:
- Icon: Add spin animation (1s linear infinite)
- Text: "Syncing..."

Hover: Show tooltip with exact timestamp "Last synced: Dec 1, 2025 2:34 PM"

---

CENTER SECTION (display: flex, align-items: center, gap: 12px):

AGENT STATUS PILLS:
Each agent shown as a compact status pill:

Pill structure:
- Display: inline-flex
- Align-items: center
- Gap: 4px
- Padding: 2px 8px
- Border-radius: full
- Background: transparent
- Font-size: 11px
- Cursor: pointer

Content:
- Agent emoji: 🎯, 🐚, 🗺️
- Status dot: 5px circle
- Agent name (optional, abbreviated): "Hub", "Maya", "Atlas"

Status colors:
- Active (processing): #2ECC71 (green) with subtle pulse
- Idle: #9ca3af (gray)
- Error: #EF4444 (red)

Show 3 agent pills:
1. 🎯 Hub (green dot - active)
2. 🐚 Maya (green dot with pulse - processing)
3. 🗺️ Atlas (gray dot - idle)

Hover on pill:
- Background: #ffffff
- Shadow: shadow-sm
- Expand to show current task: "Enriching contacts..."

---

RIGHT SECTION (display: flex, align-items: center, gap: 16px):

1. VERSION:
- Text: "v1.0.0" (#9ca3af)
- Hover: underline, show changelog tooltip

2. KEYBOARD HINT:
- Icon: Command key symbol (⌘)
- Text: "K for commands"
- Color: #9ca3af
- Hover: color #6b7280

3. FEEDBACK BUTTON (optional):
- Text: "Feedback?"
- Color: #6b7280
- Hover: color #FF6B6B, underline

---

HOVER EXPANSION (when hovering on agent pill):
Show expanded status card above the pill:

Card:
- Position: absolute, bottom: 40px
- Width: 200px
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 8px
- Box-shadow: shadow-lg
- Padding: 12px

Content:
- Agent icon + name (14px, weight 500, agent color)
- Status text (12px, #6b7280)
- Current task (13px, #1a1a1a) if active
- Progress bar if applicable

Arrow pointing down to pill

---

RESPONSIVE BEHAVIOR:
- Below 768px: Hide center section (agent pills)
- Below 480px: Show only connection status and sync icon

OUTPUT:
Create HTML showing status bar in multiple states:
1. Normal connected state with all agents
2. One agent actively processing (with expanded hover card visible)
3. Reconnecting state variant
```

---

## PROMPT 5: SH-05 Command Palette (Cmd+K)

```
Create the command palette modal for HYVVE, triggered by Cmd+K keyboard shortcut.

[INCLUDE GLOBAL DESIGN SYSTEM]

COMMAND PALETTE SPECIFICATIONS:

BACKDROP:
- Position: fixed, inset: 0
- Background: rgba(0, 0, 0, 0.4)
- Backdrop-filter: blur(4px)
- Z-index: 1000
- Display: flex
- Align-items: flex-start
- Justify-content: center
- Padding-top: 15vh (position modal in upper portion)

MODAL CONTAINER:
- Width: 580px
- Max-height: 480px
- Background: #ffffff
- Border-radius: 16px
- Box-shadow: shadow-xl, 0 0 0 1px rgba(0,0,0,0.05)
- Overflow: hidden
- Display: flex
- Flex-direction: column

---

SEARCH INPUT SECTION:
- Height: 56px
- Border-bottom: 1px solid #e5e5e5
- Display: flex
- Align-items: center
- Padding: 0 20px
- Gap: 12px

Search icon: 20px, #9ca3af

Input field:
- Flex: 1
- Border: none
- Background: transparent
- Font-size: 16px
- Color: #1a1a1a
- Placeholder: "Type a command or search..." (#9ca3af)
- Outline: none

Right side:
- Keyboard badge: "esc" (11px, background #e5e5e5, padding 2px 6px, radius 4px, #6b7280)

Clear button (when has content):
- X icon in circle, 20px, #9ca3af
- Hover: #6b7280

---

RESULTS SECTION (scrollable):
- Flex: 1
- Overflow-y: auto
- Padding: 8px

SECTION HEADER:
- Padding: 8px 16px
- Font-size: 11px
- Text-transform: uppercase
- Letter-spacing: 0.05em
- Color: #9ca3af
- Font-weight: 500

RESULT ITEM:
- Height: 44px
- Padding: 0 16px
- Display: flex
- Align-items: center
- Gap: 12px
- Border-radius: 8px
- Cursor: pointer

Item content:
- Icon: 20px, #6b7280
- Label: 14px, #1a1a1a
- Shortcut hint (right-aligned): 12px, #9ca3af

States:
- Default: background transparent
- Hover/Selected: background #f5f5f5, border-left: 3px solid #FF6B6B

Keyboard navigation: Arrow down highlights next item

---

RESULTS CONTENT:

SECTION 1: "RECENT"
1. 📋 "Create new task" → ⌘⇧T
2. 👤 "View contact: Acme Corp" → ⌘O
3. 📧 "Compose email" → ⌘E

SECTION 2: "NAVIGATION"
4. 📊 "Dashboard" → ⌘D
5. ✅ "Approvals" → ⌘A
6. 🤖 "AI Team" → ⌘I
7. ⚙️ "Settings" → ⌘,

SECTION 3: "ACTIONS"
8. ➕ "Create contact"
9. 📝 "Create deal"
10. 📁 "New project"

SECTION 4: "AGENTS" (appears when @ is typed)
11. 🎯 "Hub" — Orchestrator
12. 🐚 "Maya" — CRM & Relationships
13. 🗺️ "Atlas" — Projects & Tasks

---

SPECIAL STATES:

@ MENTION MODE (when user types @):
- Input shows: "@" with cursor after
- Results filter to agents only
- Each agent shows:
  - Icon with colored background
  - Name in agent color
  - Role description
  - Status indicator (Online/Offline)

NO RESULTS:
- Center content vertically
- Icon: Search with X overlay, 48px, #9ca3af
- Text: "No results for 'xyz'" (16px, #6b7280)
- Subtext: "Try a different search term" (14px, #9ca3af)
- Suggestions: "Did you mean..." with clickable terms

---

FOOTER:
- Height: 44px
- Border-top: 1px solid #e5e5e5
- Padding: 0 16px
- Display: flex
- Align-items: center
- Justify-content: space-between
- Background: #f9f7f2

Left hints:
- Display: flex, gap: 12px
- Each hint: Icon + text, 12px, #6b7280
- "↑↓ Navigate"
- "↵ Select"
- "esc Close"

Right:
- Help link: "?" icon + "Help" (12px, #6b7280)
- Hover: color #FF6B6B

---

ANIMATION:
- Modal entrance: Scale from 0.95 to 1, opacity 0 to 1, 200ms ease-out
- Results appear: Stagger animation, each item fades in 50ms apart
- Selection highlight: Background transition 100ms

OUTPUT:
Create HTML showing:
1. Command palette in default state with Recent, Navigation, Actions sections
2. Include one item in hover/selected state
3. Show the @ agent selection mode as an alternative view
```

---

## PROMPT 6: SH-06 Mobile Layout

```
Create the responsive mobile layout for HYVVE (viewport < 640px).

[INCLUDE GLOBAL DESIGN SYSTEM]

MOBILE LAYOUT SPECIFICATIONS:

VIEWPORT:
- Width: 375px (iPhone reference)
- Height: 812px
- Background: #FFFBF5

---

MOBILE HEADER (fixed top):
- Height: 56px
- Background: #ffffff
- Border-bottom: 1px solid #e5e5e5
- Padding: 0 16px
- Display: flex
- Align-items: center
- Justify-content: space-between
- Position: fixed, top: 0, left: 0, right: 0
- Z-index: 100

LEFT: Hamburger menu button
- Width: 40px, Height: 40px
- Display: flex, align-items: center, justify-content: center
- Border-radius: 8px
- Icon: 3 horizontal lines (24px, #1a1a1a)
- Hover/Active: background #f5f5f5

CENTER: Logo
- "HYVVE" text (18px, weight 700, #1a1a1a)
- Or icon only (28px)

RIGHT: Chat button
- Same size as hamburger
- Icon: Chat bubble (24px, #1a1a1a)
- Badge: Red dot with number "2" if unread (position: absolute, top: 8px, right: 8px)
- Opens full-screen chat modal

---

MAIN CONTENT AREA:
- Position: relative
- Top: 56px
- Bottom: 64px
- Overflow-y: auto
- Padding: 16px
- Background: #FFFBF5

Example dashboard content:
- Page title: "Dashboard" (24px, bold)
- Welcome text: "Welcome back, John" (14px, #6b7280)
- Stat cards (2x2 grid):
  - Each card: full width, 100px height
  - Background: #ffffff
  - Border: 1px solid #e5e5e5
  - Border-radius: 12px
  - Padding: 16px
  - Display: flex, flex-direction: column
  - Icon + Label (12px) + Value (24px, bold)

---

BOTTOM NAVIGATION (fixed bottom):
- Height: 64px + safe area
- Background: #ffffff
- Border-top: 1px solid #e5e5e5
- Position: fixed, bottom: 0, left: 0, right: 0
- Padding-bottom: env(safe-area-inset-bottom) or 8px
- Display: flex
- Justify-content: space-around
- Align-items: center

NAV ITEMS (5 items):
Each item:
- Width: 56px
- Height: 48px
- Display: flex
- Flex-direction: column
- Align-items: center
- Justify-content: center
- Gap: 4px
- Border-radius: 8px
- Cursor: pointer

Item content:
- Icon: 24px
- Label: 10px, weight 500

States:
- Default: Icon #6b7280, Label #9ca3af
- Active: Icon #FF6B6B, Label #FF6B6B, background #fef2f2

Items (left to right):
1. Dashboard (grid icon) - ACTIVE
2. Approvals (check-circle) - Show badge "5" on icon
3. Hub (chat/target icon) - Opens chat
4. Tasks (folder icon)
5. More (dots-horizontal icon) - Opens full menu

Badge on item:
- Position: absolute, top: 0, right: 4px
- Size: 16px
- Background: #FF6B6B
- Color: white
- Font-size: 10px
- Border-radius: full

---

SLIDE-OUT MENU (from hamburger):
- Position: fixed, top: 0, left: 0, bottom: 0
- Width: 280px
- Background: #ffffff
- Box-shadow: shadow-xl
- Z-index: 200
- Transform: translateX(-100%) initially
- Transition: transform 300ms ease-out

BACKDROP:
- Position: fixed, inset: 0
- Background: rgba(0, 0, 0, 0.4)
- Z-index: 199
- Opacity: 0 initially
- Transition: opacity 200ms

MENU HEADER:
- Height: 60px
- Padding: 16px
- Border-bottom: 1px solid #e5e5e5
- Display: flex
- Align-items: center
- Gap: 12px

Content:
- User avatar: 40px circle
- User name: "John Doe" (16px, weight 600)
- Close X button on right

MENU CONTENT:
- Padding: 16px

Workspace section:
- Current workspace card (same as desktop sidebar)
- "Switch workspace" link

Navigation items (same as desktop but taller: 52px each):
- Dashboard, Approvals, AI Team, Settings
- Divider
- CRM, Projects

MENU FOOTER:
- Position: absolute, bottom: 0, left: 0, right: 0
- Padding: 16px
- Border-top: 1px solid #e5e5e5
- Sign out button (full width, centered text, red color)

---

CHAT MODAL (full screen):
- Position: fixed, inset: 0
- Background: #ffffff
- Z-index: 250
- Transform: translateY(100%) initially
- Transition: transform 300ms ease-out

CHAT HEADER:
- Height: 56px
- Border-bottom: 1px solid #e5e5e5
- Display: flex
- Align-items: center
- Padding: 0 16px

Content:
- Back arrow (left)
- Agent avatar + name (center)
- More options icon (right)

CHAT MESSAGES:
- Flex: 1
- Overflow-y: auto
- Padding: 16px

CHAT INPUT:
- Same as desktop but full width
- Safe area padding at bottom

---

OUTPUT:
Create HTML showing:
1. Mobile layout with bottom navigation
2. Slide-out menu in open state (overlay the main view)
3. Chat modal in open state (as separate view)

All three views in one HTML file with clear section separators.
```

---

## PROMPT 7: CH-01 Chat Panel

```
Create the persistent chat panel for HYVVE that appears on the right side of the application.

[INCLUDE GLOBAL DESIGN SYSTEM]

CHAT PANEL SPECIFICATIONS:

CONTAINER:
- Position: fixed
- Top: 60px (below header)
- Right: 0
- Bottom: 0
- Width: 380px
- Background: #ffffff
- Border-left: 1px solid #e5e5e5
- Box-shadow: -4px 0 16px rgba(0, 0, 0, 0.04)
- Display: flex
- Flex-direction: column
- Z-index: 50

---

CHAT HEADER:
- Height: 56px
- Background: #f9f7f2
- Border-bottom: 1px solid #e5e5e5
- Padding: 0 16px
- Display: flex
- Align-items: center
- Justify-content: space-between

LEFT SECTION:
Agent selector (clickable dropdown trigger):
- Display: flex
- Align-items: center
- Gap: 10px
- Padding: 6px 10px
- Border-radius: 8px
- Cursor: pointer
- Hover: background #f5f3ee

Content:
- Avatar container (36px):
  - Circle background: #FF6B6B (Hub's coral)
  - Icon: 🎯 or target icon, white, centered
  - Status dot: 10px circle, background #2ECC71 (green), position absolute bottom-right with 2px white border

- Text wrapper:
  - Name: "Hub" (15px, weight 600, #1a1a1a)
  - Status: "Online" (12px, #2ECC71) or role "Orchestrator" (12px, #6b7280)

- Chevron down: 12px, #6b7280

RIGHT SECTION:
Icon buttons row (display: flex, gap: 4px):

Each button:
- Width: 32px, Height: 32px
- Display: flex
- Align-items: center
- Justify-content: center
- Border-radius: 6px
- Background: transparent
- Cursor: pointer
- Hover: background #e5e5e5

Buttons:
1. History icon (clock) - Opens conversation history
2. Minimize icon (minus/line) - Minimizes to bar
3. Expand icon (arrows-maximize) - Expands panel width
4. (On desktop only) Popout icon - Opens in new window

---

MESSAGES AREA:
- Flex: 1
- Overflow-y: auto
- Padding: 16px
- Background: #ffffff
- Display: flex
- Flex-direction: column
- Gap: 16px

SCROLL BEHAVIOR:
- Custom scrollbar: 6px wide, #d1d5db thumb, transparent track
- Scroll-padding-bottom for new messages
- Auto-scroll to bottom on new message

TIMESTAMP DIVIDER (for grouping by day):
- Display: flex
- Align-items: center
- Gap: 12px
- Margin: 8px 0

Line: flex: 1, height: 1px, background: #e5e5e5
Text: "Today" or "Yesterday" or date (12px, #9ca3af, white-space: nowrap)

---

USER MESSAGE BUBBLE:
- Align-self: flex-end
- Max-width: 85%
- Display: flex
- Flex-direction: column
- Align-items: flex-end
- Gap: 4px

Bubble:
- Background: #FF6B6B (coral)
- Color: #ffffff
- Padding: 12px 16px
- Border-radius: 16px 16px 4px 16px
- Font-size: 14px
- Line-height: 1.5
- Word-break: break-word

Timestamp:
- Font-size: 11px
- Color: #9ca3af

Example content: "Create a follow-up email for the Johnson deal with a friendly tone"

---

AGENT MESSAGE:
- Align-self: flex-start
- Max-width: 85%
- Display: flex
- Gap: 10px

Avatar:
- Width: 28px, Height: 28px
- Flex-shrink: 0
- Circle with agent color background
- Emoji or icon inside (🐚 for Maya, etc.)

Content wrapper:
- Display: flex
- Flex-direction: column
- Gap: 4px

Agent name:
- Font-size: 12px
- Font-weight: 600
- Color: agent color (#20B2AA for Maya)

Bubble:
- Background: #f5f5f5
- Color: #1a1a1a
- Padding: 12px 16px
- Border-radius: 16px 16px 16px 4px
- Font-size: 14px
- Line-height: 1.5

Timestamp:
- Font-size: 11px
- Color: #9ca3af

---

AGENT MESSAGE WITH ACTIONS:
Same as above but with action buttons below bubble:

Action buttons container:
- Display: flex
- Gap: 8px
- Margin-top: 8px

Action button:
- Display: inline-flex
- Align-items: center
- Gap: 6px
- Padding: 6px 12px
- Border-radius: 6px
- Font-size: 13px
- Font-weight: 500
- Cursor: pointer
- Transition: all 150ms

Primary action:
- Background: #FF6B6B
- Color: #ffffff
- Hover: background #e85c5c

Secondary actions:
- Background: #ffffff
- Color: #6b7280
- Border: 1px solid #e5e5e5
- Hover: background #f5f5f5, color #1a1a1a

Example actions: [📧 Send Now] [✏️ Edit] [📋 Copy]

---

TYPING INDICATOR:
- Same structure as agent message
- Bubble contains three bouncing dots

Dots:
- Display: flex
- Gap: 4px
- Padding: 12px 16px

Each dot:
- Width: 8px
- Height: 8px
- Background: #9ca3af
- Border-radius: full
- Animation: bounce 1.4s infinite ease-in-out

Stagger:
- Dot 1: animation-delay: 0s
- Dot 2: animation-delay: 0.2s
- Dot 3: animation-delay: 0.4s

@keyframes bounce:
- 0%, 80%, 100%: transform: translateY(0)
- 40%: transform: translateY(-8px)

---

CHAT INPUT AREA:
- Border-top: 1px solid #e5e5e5
- Padding: 12px 16px
- Background: #ffffff

INPUT CONTAINER:
- Background: #f5f5f5
- Border-radius: 24px
- Padding: 8px 8px 8px 44px
- Display: flex
- Align-items: flex-end
- Gap: 8px
- Position: relative
- Min-height: 44px

LEFT ICONS (position: absolute, left: 12px, bottom: 12px):
- Display: flex
- Gap: 4px

Icon button:
- Width: 28px, Height: 28px
- Display: flex
- Align-items: center
- Justify-content: center
- Border-radius: 6px
- Color: #9ca3af
- Cursor: pointer
- Hover: background #e5e5e5, color #6b7280

Icons:
- @ symbol (mention agents)
- 📎 paperclip (attachments)

TEXTAREA:
- Flex: 1
- Border: none
- Background: transparent
- Resize: none
- Font-size: 14px
- Line-height: 1.5
- Color: #1a1a1a
- Placeholder: "Message Hub..." (#9ca3af)
- Min-height: 24px
- Max-height: 96px
- Overflow-y: auto
- Outline: none

SEND BUTTON:
- Width: 36px
- Height: 36px
- Border-radius: full
- Background: #FF6B6B
- Color: #ffffff
- Display: flex
- Align-items: center
- Justify-content: center
- Cursor: pointer
- Flex-shrink: 0
- Transition: all 150ms

Icon: Arrow up, 20px

States:
- Default: background #FF6B6B
- Hover: background #e85c5c, transform scale(1.05)
- Active: transform scale(0.95)
- Disabled (empty input): background #d1d5db, cursor: not-allowed

---

COLLAPSED STATE (48px width bar):
- Position: fixed, right: 0
- Width: 48px
- Height: calc(100vh - 60px)
- Background: #ffffff
- Border-left: 1px solid #e5e5e5
- Display: flex
- Flex-direction: column
- Align-items: center
- Padding: 16px 0

Content:
- Chat bubble icon (24px, #6b7280) at top
- Notification badge if unread
- Expand arrow at bottom

Click to expand with slide animation (300ms)

---

OUTPUT:
Create HTML showing:
1. Full expanded chat panel with:
   - Header with Hub selected
   - 3-4 messages conversation (user messages and agent responses)
   - One message with action buttons
   - Typing indicator
   - Input area with @ and attachment icons
2. Collapsed state as separate element
```

---

## PROMPT 8: CH-02 Chat Messages (All Types)

```
Create a showcase of all chat message types for HYVVE.

[INCLUDE GLOBAL DESIGN SYSTEM]

MESSAGE TYPES SHOWCASE:

Create a scrollable container (400px wide, simulating chat panel) showing each message type with spacing between them.

---

TYPE 1: USER MESSAGE (Basic)

Structure:
```html
<div class="message message--user">
  <div class="message__bubble">
    Create a follow-up email for the Johnson deal with a friendly tone.
  </div>
  <div class="message__time">2:34 PM</div>
</div>
```

Styles:
- Container: align-self: flex-end, max-width: 85%
- Bubble:
  - Background: #FF6B6B
  - Color: #ffffff
  - Padding: 12px 16px
  - Border-radius: 16px 16px 4px 16px
  - Font-size: 14px
  - Line-height: 1.5
- Time: 11px, #9ca3af, margin-top: 4px, text-align: right

---

TYPE 2: AGENT MESSAGE (Basic Text)

Structure:
```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="message__bubble">
      I've drafted a follow-up email for the Johnson deal. The tone matches your previous communications with them.
    </div>
    <div class="message__time">2:35 PM</div>
  </div>
</div>
```

Styles:
- Container: display: flex, gap: 10px, max-width: 85%
- Avatar: 28px circle, background agent color, emoji centered, flex-shrink: 0
- Name: 12px, weight 600, agent color, margin-bottom: 4px
- Bubble:
  - Background: #f5f5f5
  - Color: #1a1a1a
  - Padding: 12px 16px
  - Border-radius: 16px 16px 16px 4px
- Time: 11px, #9ca3af, margin-top: 4px

---

TYPE 3: AGENT MESSAGE WITH PREVIEW CARD

Structure: Agent message with embedded preview card

Preview card:
```html
<div class="preview-card">
  <div class="preview-card__header">
    📧 Email Draft
  </div>
  <div class="preview-card__content">
    <strong>Subject:</strong> Following up on our chat
    <br><br>
    Hi Sarah,
    <br><br>
    Great speaking with you yesterday about the Q4 expansion plans. I wanted to follow up on a few points we discussed...
    <br><br>
    <a class="preview-card__expand">Show full email →</a>
  </div>
</div>
```

Card styles:
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 8px
- Overflow: hidden
- Margin-top: 8px

Header:
- Background: #f9f7f2
- Padding: 8px 12px
- Font-size: 12px
- Font-weight: 500
- Color: #6b7280
- Border-bottom: 1px solid #e5e5e5

Content:
- Padding: 12px
- Font-size: 13px
- Color: #6b7280
- Line-height: 1.5
- Max-height: 120px
- Overflow: hidden

Expand link:
- Color: #FF6B6B
- Font-weight: 500
- Hover: underline

---

TYPE 4: AGENT MESSAGE WITH ACTION BUTTONS

After the bubble, add action buttons:

```html
<div class="message__actions">
  <button class="action-btn action-btn--primary">📧 Send Now</button>
  <button class="action-btn action-btn--secondary">✏️ Edit</button>
  <button class="action-btn action-btn--secondary">📋 Copy</button>
</div>
```

Action button styles:
- Container: display: flex, gap: 8px, margin-top: 8px, flex-wrap: wrap

Primary:
- Background: #FF6B6B
- Color: #ffffff
- Padding: 8px 14px
- Border-radius: 6px
- Font-size: 13px
- Font-weight: 500
- Border: none
- Cursor: pointer
- Hover: background #e85c5c

Secondary:
- Background: #ffffff
- Color: #6b7280
- Border: 1px solid #e5e5e5
- Same padding/radius/font
- Hover: background #f5f5f5, color #1a1a1a

---

TYPE 5: SYSTEM MESSAGE

```html
<div class="message message--system">
  <div class="message__divider"></div>
  <div class="message__system-text">
    ℹ️ Email queued for approval
  </div>
  <div class="message__divider"></div>
</div>
```

Styles:
- Container: display: flex, align-items: center, gap: 12px, margin: 16px 0
- Divider: flex: 1, height: 1px, background: #e5e5e5
- Text:
  - Font-size: 12px
  - Color: #6b7280
  - White-space: nowrap
  - Padding: 4px 12px
  - Background: #f9f7f2
  - Border-radius: 12px

---

TYPE 6: APPROVAL REQUEST CARD

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #FF6B6B">🎯</div>
  <div class="message__content">
    <div class="message__name" style="color: #FF6B6B">Hub</div>
    <div class="approval-card">
      <div class="approval-card__header">
        <span class="approval-card__icon">📋</span>
        <span class="approval-card__title">Approval Request</span>
      </div>
      <div class="approval-card__body">
        <div class="approval-card__name">"Johnson Deal Follow-up Email"</div>
        <div class="approval-card__meta">
          <span>Category: Email</span>
          <span>•</span>
          <span>Agent: Maya</span>
        </div>
        <div class="approval-card__confidence">
          <div class="confidence-bar">
            <div class="confidence-bar__fill" style="width: 78%"></div>
          </div>
          <span class="confidence-value">78%</span>
          <span class="confidence-label">Quick Review</span>
        </div>
      </div>
      <div class="approval-card__actions">
        <button class="action-btn action-btn--secondary">👀 Preview</button>
        <button class="action-btn action-btn--danger">✗ Reject</button>
        <button class="action-btn action-btn--success">✓ Approve</button>
      </div>
    </div>
    <div class="message__time">2:36 PM</div>
  </div>
</div>
```

Approval card styles:
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 12px
- Overflow: hidden
- Margin-top: 4px

Header:
- Background: #f9f7f2
- Padding: 10px 14px
- Display: flex
- Align-items: center
- Gap: 8px
- Font-size: 13px
- Font-weight: 600
- Color: #1a1a1a

Body:
- Padding: 14px

Name: 15px, weight 500, #1a1a1a, margin-bottom: 6px
Meta: 12px, #6b7280, display: flex, gap: 8px

Confidence section:
- Margin-top: 12px
- Display: flex
- Align-items: center
- Gap: 10px

Confidence bar:
- Flex: 1
- Height: 6px
- Background: #e5e5e5
- Border-radius: full
- Overflow: hidden

Fill:
- Height: 100%
- Background: #F59E0B (amber for 78%)
- Border-radius: full

Value: 14px, weight 600, #F59E0B
Label: 12px, #6b7280

Actions:
- Padding: 12px 14px
- Border-top: 1px solid #e5e5e5
- Display: flex
- Gap: 8px

Success button: Background #2ECC71, color white
Danger button: Background #ffffff, color #EF4444, border-color #EF4444

---

TYPE 7: ERROR MESSAGE

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #FF6B6B">🎯</div>
  <div class="message__content">
    <div class="message__name" style="color: #FF6B6B">Hub</div>
    <div class="message__bubble message__bubble--error">
      <div class="error-icon">⚠️</div>
      <div class="error-content">
        <strong>I couldn't complete that request.</strong>
        <br><br>
        The email service is temporarily unavailable. I'll retry automatically in 5 minutes.
      </div>
    </div>
    <div class="message__actions">
      <button class="action-btn action-btn--secondary">🔄 Retry Now</button>
      <button class="action-btn action-btn--secondary">❌ Cancel</button>
    </div>
    <div class="message__time">2:37 PM</div>
  </div>
</div>
```

Error bubble:
- Background: #fef2f2 (light red)
- Border-left: 3px solid #EF4444
- Display: flex
- Gap: 10px
- Align-items: flex-start

Error icon: 20px
Error content: normal message styling

---

TYPE 8: STREAMING/LOADING MESSAGE

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="message__bubble message__bubble--streaming">
      <div class="streaming-text">
        Analyzing the Johnson deal history and drafting a personalized email<span class="cursor">|</span>
      </div>
      <div class="streaming-progress"></div>
    </div>
  </div>
</div>
```

Streaming text:
- Characters appear one by one (simulate with full text visible)

Cursor:
- Animation: blink 1s infinite
- @keyframes blink: 0%, 50% opacity 1; 51%, 100% opacity 0

Progress shimmer:
- Height: 2px
- Background: linear-gradient(90deg, transparent, #20B2AA, transparent)
- Animation: shimmer 1.5s infinite
- @keyframes shimmer: 0% background-position -200%; 100% background-position 200%

---

OUTPUT:
Create a single HTML file showing all 8 message types in a scrollable chat-like container.
Add clear labels above each type for reference.
Include CSS for all animations (typing dots, shimmer, cursor blink).
```

---

## PROMPT 9: CH-03 Chat Input Component

```
Create the chat input component for HYVVE with all interactive states.

[INCLUDE GLOBAL DESIGN SYSTEM]

CHAT INPUT SPECIFICATIONS:

Create multiple versions showing different states in a single HTML file.

---

STATE 1: DEFAULT (Empty)

```html
<div class="chat-input-container">
  <div class="chat-input-wrapper">
    <div class="chat-input-icons-left">
      <button class="icon-btn" title="Mention agent">
        <span>@</span>
      </button>
      <button class="icon-btn" title="Attach file">
        <span>📎</span>
      </button>
    </div>
    <textarea
      class="chat-input"
      placeholder="Message Hub..."
      rows="1"
    ></textarea>
    <button class="send-btn send-btn--disabled">
      <span>↑</span>
    </button>
  </div>
</div>
```

Container styles:
- Border-top: 1px solid #e5e5e5
- Padding: 12px 16px
- Background: #ffffff

Wrapper styles:
- Background: #f5f5f5
- Border-radius: 24px
- Padding: 6px 6px 6px 8px
- Display: flex
- Align-items: flex-end
- Gap: 8px
- Position: relative
- Min-height: 48px

Left icons container:
- Display: flex
- Gap: 2px
- Padding: 4px

Icon button:
- Width: 32px
- Height: 32px
- Display: flex
- Align-items: center
- Justify-content: center
- Border-radius: 6px
- Background: transparent
- Border: none
- Color: #9ca3af
- Font-size: 16px
- Cursor: pointer
- Hover: background #e5e5e5, color #6b7280

Textarea:
- Flex: 1
- Border: none
- Background: transparent
- Resize: none
- Font-family: inherit
- Font-size: 14px
- Line-height: 1.5
- Color: #1a1a1a
- Padding: 8px 0
- Min-height: 24px
- Max-height: 120px
- Outline: none
- Placeholder color: #9ca3af

Send button:
- Width: 36px
- Height: 36px
- Border-radius: 18px
- Border: none
- Display: flex
- Align-items: center
- Justify-content: center
- Font-size: 18px
- Cursor: pointer
- Flex-shrink: 0
- Transition: all 150ms

Disabled state:
- Background: #d1d5db
- Color: #9ca3af
- Cursor: not-allowed

---

STATE 2: FOCUSED (Empty, but focused)

Same as above but:
- Wrapper: border 2px solid #FF6B6B (instead of transparent)
- Box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1)
- Placeholder: still visible

---

STATE 3: TYPING (Has content)

Changes:
- Textarea contains: "Create a follow-up email for the..."
- Textarea height: 48px (multi-line)
- Send button enabled:
  - Background: #FF6B6B
  - Color: #ffffff
  - Hover: background #e85c5c, transform scale(1.05)

---

STATE 4: MULTI-LINE (Expanded)

Changes:
- Textarea contains longer text (3+ lines)
- Textarea height: 96px (near max)
- Overflow-y: auto with custom scrollbar
- Wrapper grows in height

---

STATE 5: WITH @MENTION POPUP

Above the input, show the mention picker:

```html
<div class="mention-popup">
  <div class="mention-popup__header">Select an agent</div>
  <div class="mention-popup__list">
    <div class="mention-item mention-item--selected">
      <div class="mention-item__avatar" style="background: #FF6B6B">🎯</div>
      <div class="mention-item__info">
        <div class="mention-item__name">Hub</div>
        <div class="mention-item__role">Orchestrator</div>
      </div>
      <div class="mention-item__status" style="background: #2ECC71"></div>
    </div>
    <div class="mention-item">
      <div class="mention-item__avatar" style="background: #20B2AA">🐚</div>
      <div class="mention-item__info">
        <div class="mention-item__name">Maya</div>
        <div class="mention-item__role">CRM & Relationships</div>
      </div>
      <div class="mention-item__status" style="background: #2ECC71"></div>
    </div>
    <div class="mention-item">
      <div class="mention-item__avatar" style="background: #FF9F43">🗺️</div>
      <div class="mention-item__info">
        <div class="mention-item__name">Atlas</div>
        <div class="mention-item__role">Projects & Tasks</div>
      </div>
      <div class="mention-item__status" style="background: #9ca3af"></div>
    </div>
  </div>
</div>
```

Input shows: "@" with cursor after it

Popup styles:
- Position: absolute
- Bottom: calc(100% + 8px)
- Left: 16px
- Width: 280px
- Background: #ffffff
- Border: 1px solid #e5e5e5
- Border-radius: 12px
- Box-shadow: shadow-lg
- Overflow: hidden

Header:
- Padding: 10px 14px
- Font-size: 12px
- Color: #6b7280
- Border-bottom: 1px solid #e5e5e5

List: padding: 6px

Mention item:
- Display: flex
- Align-items: center
- Gap: 10px
- Padding: 10px 12px
- Border-radius: 8px
- Cursor: pointer

Selected/Hover:
- Background: #f5f5f5

Avatar: 32px circle with agent color
Name: 14px, weight 500, #1a1a1a
Role: 12px, #6b7280
Status: 8px circle on right

---

STATE 6: WITH ATTACHMENT PREVIEW

Above input, show attachment preview:

```html
<div class="attachment-preview">
  <div class="attachment-item">
    <div class="attachment-item__icon">📄</div>
    <div class="attachment-item__info">
      <div class="attachment-item__name">quarterly-report.pdf</div>
      <div class="attachment-item__size">2.4 MB</div>
    </div>
    <button class="attachment-item__remove">✕</button>
  </div>
</div>
```

Attachment preview container:
- Padding: 8px 16px 0
- Display: flex
- Gap: 8px
- Flex-wrap: wrap

Attachment item:
- Display: flex
- Align-items: center
- Gap: 8px
- Padding: 8px 12px
- Background: #f5f5f5
- Border-radius: 8px
- Border: 1px solid #e5e5e5

Icon: 24px
Name: 13px, #1a1a1a, max-width: 150px, truncate
Size: 12px, #6b7280
Remove: 20px circle, #9ca3af, hover: #EF4444

---

STATE 7: IMAGE ATTACHMENT PREVIEW

```html
<div class="attachment-preview">
  <div class="attachment-item attachment-item--image">
    <div class="attachment-item__thumbnail">
      <img src="placeholder.jpg" alt="Screenshot">
    </div>
    <button class="attachment-item__remove">✕</button>
  </div>
</div>
```

Thumbnail:
- Width: 80px
- Height: 60px
- Border-radius: 6px
- Object-fit: cover
- Background: #e5e5e5 (placeholder)

---

STATE 8: UPLOADING

Same as attachment but with progress:

```html
<div class="attachment-item attachment-item--uploading">
  <div class="attachment-item__icon">📄</div>
  <div class="attachment-item__info">
    <div class="attachment-item__name">quarterly-report.pdf</div>
    <div class="attachment-item__progress">
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width: 65%"></div>
      </div>
      <span>65%</span>
    </div>
  </div>
  <button class="attachment-item__cancel">✕</button>
</div>
```

Progress bar:
- Height: 4px
- Background: #e5e5e5
- Border-radius: 2px
- Flex: 1

Fill:
- Background: #FF6B6B
- Border-radius: 2px
- Transition: width 200ms

---

STATE 9: PROCESSING (Disabled)

When waiting for agent response:
- Wrapper: opacity 0.7
- Input: disabled
- Send button: shows spinner instead of arrow
- Cursor: not-allowed on container

Spinner: 20px, border 2px, border-top-color transparent, animation: spin 1s linear infinite

---

OUTPUT:
Create HTML showing all 9 states in a vertical layout, each clearly labeled.
Include a section header above each state indicating what it represents.
Add all necessary CSS including animations (spin, hover transitions).
```

---

## PROMPT 10: CH-04 Typing Indicator

```
Create all typing/loading indicator variants for HYVVE chat.

[INCLUDE GLOBAL DESIGN SYSTEM]

TYPING INDICATOR SHOWCASE:

---

VARIANT 1: SIMPLE TYPING DOTS

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="typing-indicator">
      <span class="typing-indicator__text">Maya is typing</span>
      <div class="typing-indicator__dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</div>
```

Styles:
- Container: display: flex, align-items: center, gap: 8px
- Text: 13px, #6b7280
- Dots container: display: flex, gap: 4px

Each dot:
- Width: 8px
- Height: 8px
- Background: #20B2AA (Maya's teal)
- Border-radius: full
- Animation: typing-bounce 1.4s infinite ease-in-out

Animation stagger:
- Dot 1: animation-delay: 0s
- Dot 2: animation-delay: 0.2s
- Dot 3: animation-delay: 0.4s

```css
@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}
```

---

VARIANT 2: TYPING WITH BUBBLE

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="message__bubble typing-bubble">
      <div class="typing-dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    </div>
  </div>
</div>
```

Bubble:
- Same styling as agent message bubble
- Background: #f5f5f5
- Padding: 16px 20px
- Border-radius: 16px 16px 16px 4px

Dots inside:
- Display: inline-flex
- Gap: 5px
- Dots: 10px circles with bounce animation

---

VARIANT 3: PROCESSING WITH CONTEXT

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="processing-card">
      <div class="processing-card__icon">🔍</div>
      <div class="processing-card__content">
        <div class="processing-card__title">Searching your contacts...</div>
        <div class="processing-card__progress">
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width: 45%"></div>
          </div>
          <span class="progress-percent">45%</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

Card styles:
- Background: #f5f5f5
- Border-radius: 12px
- Padding: 14px 16px
- Display: flex
- Gap: 12px
- Align-items: flex-start

Icon: 24px
Title: 14px, #1a1a1a
Progress bar:
- Height: 6px
- Background: #e5e5e5
- Border-radius: 3px
- Margin-top: 8px

Fill:
- Background: #20B2AA
- Border-radius: 3px
- Animation: progress-indeterminate 1.5s ease-in-out infinite (optional)

Percent: 12px, #6b7280, margin-left: 8px

---

VARIANT 4: MULTI-STEP PROCESSING

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #FF6B6B">🎯</div>
  <div class="message__content">
    <div class="message__name" style="color: #FF6B6B">Hub</div>
    <div class="processing-steps">
      <div class="processing-step processing-step--complete">
        <span class="step-icon">✓</span>
        <span class="step-text">Parsing request</span>
      </div>
      <div class="processing-step processing-step--complete">
        <span class="step-icon">✓</span>
        <span class="step-text">Checking calendar</span>
      </div>
      <div class="processing-step processing-step--active">
        <span class="step-icon step-icon--spinner"></span>
        <span class="step-text">Assigning to project</span>
      </div>
      <div class="processing-step processing-step--pending">
        <span class="step-icon">○</span>
        <span class="step-text">Setting due date</span>
      </div>
      <div class="processing-step processing-step--pending">
        <span class="step-icon">○</span>
        <span class="step-text">Notifying team</span>
      </div>
    </div>
  </div>
</div>
```

Steps container:
- Background: #f5f5f5
- Border-radius: 12px
- Padding: 16px
- Display: flex
- Flex-direction: column
- Gap: 10px

Each step:
- Display: flex
- Align-items: center
- Gap: 10px
- Font-size: 13px

Complete:
- Icon: ✓ in #2ECC71, 16px circle background #dcfce7
- Text: #1a1a1a

Active:
- Icon: Spinner (CSS animation), 16px, #FF6B6B
- Text: #1a1a1a, font-weight: 500

Pending:
- Icon: ○ outline, #9ca3af
- Text: #9ca3af

Spinner:
```css
.step-icon--spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e5e5;
  border-top-color: #FF6B6B;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

VARIANT 5: STREAMING TEXT RESPONSE

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="message__bubble streaming-bubble">
      <div class="streaming-text">
        I found 3 contacts matching "Johnson":

        1. **Sarah Johnson** - VP Sales at Acme Corp
           Last contact: 2 days ago

        2. **Mike Johnson** - CEO at Johnson & Co
           Last contact: 1 week ago<span class="cursor">|</span>
      </div>
    </div>
  </div>
</div>
```

Streaming text:
- Line-height: 1.6
- White-space: pre-wrap

Cursor:
- Display: inline-block
- Width: 2px
- Height: 1em
- Background: #1a1a1a
- Animation: blink 1s step-end infinite

```css
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

---

VARIANT 6: ERROR DURING PROCESSING

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #FF6B6B">🎯</div>
  <div class="message__content">
    <div class="message__name" style="color: #FF6B6B">Hub</div>
    <div class="error-card">
      <div class="error-card__header">
        <span class="error-card__icon">⚠️</span>
        <span class="error-card__title">Something went wrong</span>
      </div>
      <div class="error-card__body">
        Couldn't access the calendar service. Would you like me to:
      </div>
      <div class="error-card__actions">
        <button class="action-btn action-btn--secondary">🔄 Try again</button>
        <button class="action-btn action-btn--secondary">📅 Skip calendar</button>
      </div>
    </div>
  </div>
</div>
```

Error card:
- Background: #fef2f2
- Border: 1px solid #fecaca
- Border-radius: 12px
- Overflow: hidden

Header:
- Padding: 12px 14px
- Display: flex
- Align-items: center
- Gap: 8px
- Font-weight: 600
- Color: #EF4444

Body:
- Padding: 0 14px 14px
- Font-size: 14px
- Color: #6b7280

Actions:
- Padding: 12px 14px
- Border-top: 1px solid #fecaca
- Display: flex
- Gap: 8px

---

VARIANT 7: AGENT THINKING (Longer Process)

```html
<div class="message message--agent">
  <div class="message__avatar" style="background: #20B2AA">🐚</div>
  <div class="message__content">
    <div class="message__name" style="color: #20B2AA">Maya</div>
    <div class="thinking-card">
      <div class="thinking-animation">
        <div class="thinking-circle"></div>
        <div class="thinking-circle"></div>
        <div class="thinking-circle"></div>
      </div>
      <div class="thinking-text">
        Analyzing 2,450 contacts to find the best matches...
        <br>
        <span class="thinking-subtext">This may take a moment</span>
      </div>
    </div>
  </div>
</div>
```

Thinking card:
- Background: #f5f5f5
- Border-radius: 12px
- Padding: 20px
- Display: flex
- Align-items: center
- Gap: 16px

Animation container:
- Display: flex
- Gap: 4px

Circles:
- Width: 12px
- Height: 12px
- Background: #20B2AA
- Border-radius: 50%
- Animation: thinking-pulse 1.5s ease-in-out infinite

```css
@keyframes thinking-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-circle:nth-child(1) { animation-delay: 0s; }
.thinking-circle:nth-child(2) { animation-delay: 0.2s; }
.thinking-circle:nth-child(3) { animation-delay: 0.4s; }
```

Text: 14px, #1a1a1a
Subtext: 12px, #6b7280

---

OUTPUT:
Create HTML showing all 7 variants in a vertical scrollable container.
Include all CSS animations.
Add clear labels/headers for each variant.
Each variant should be visually distinct and clearly demonstrate its purpose.
```

---

## End of Batch 1

**Summary of Batch 1 (10 Prompts):**
1. SH-01: Shell Layout (Three-Panel) - Main application structure
2. SH-02: Navigation Sidebar - Expanded and collapsed states
3. SH-03: Header Bar with Dropdowns - All dropdown menus
4. SH-04: Status Bar - Bottom status indicators
5. SH-05: Command Palette - Cmd+K modal
6. SH-06: Mobile Layout - Responsive mobile views
7. CH-01: Chat Panel - Persistent chat component
8. CH-02: Chat Messages - All message type variants
9. CH-03: Chat Input - Input component states
10. CH-04: Typing Indicator - Loading/processing states

**Next Batch:** Approval Queue (7) + AI Team Panel (3) = 10 prompts
