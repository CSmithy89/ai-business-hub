# Google Stitch Prompts - Batch 2: Chat (Remaining) + Approval Queue

**Batch:** 2 of 9
**Wireframes:** CH-05 to CH-07, AP-01 to AP-07
**Total Prompts:** 10
**Created:** 2025-12-01

---

## Global Design System (Copy to each prompt)

```
DESIGN SYSTEM - HYVVE Platform

COLORS:
- Primary/CTA: #FF6B6B (coral) - buttons, links, active states
- Secondary: #20B2AA (teal) - Maya agent, secondary actions
- Background Light: #FFFBF5 (warm cream) - main background
- Background Dark: #0a0a0b (near-black) - dark mode
- Surface Light: #FFFFFF - cards, panels
- Surface Dark: #1a1a1b - dark mode cards
- Border Light: #E5E5E5 - light mode borders
- Border Dark: #2a2a2b - dark mode borders
- Text Primary Light: #1a1a1a
- Text Primary Dark: #FAFAFA
- Text Secondary: #6B7280
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

AGENT COLORS:
- Hub (Orchestrator): #FF6B6B (coral)
- Maya (CRM): #20B2AA (teal)
- Atlas (PM): #FF9F43 (orange)
- Sage (Finance): #2ECC71 (green)
- Nova (Marketing): #FF6B9D (pink)
- Echo (Analytics): #4B7BEC (blue)

TYPOGRAPHY:
- Font Family: Inter, system-ui, sans-serif
- Code Font: JetBrains Mono, monospace
- Base Size: 16px
- Scale: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 48px
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Line Heights: 1.25 (tight), 1.5 (normal), 1.625 (relaxed)

SPACING:
- Base unit: 4px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px

BORDERS:
- Radius: 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (full)
- Width: 1px standard, 2px focus rings

SHADOWS:
- sm: 0 1px 2px rgba(0,0,0,0.04)
- md: 0 4px 6px rgba(0,0,0,0.04)
- lg: 0 10px 15px rgba(0,0,0,0.06)
- xl: 0 20px 25px rgba(0,0,0,0.08)

TRANSITIONS:
- Fast: 100ms ease-out
- Normal: 150ms ease-out
- Slow: 250ms ease-out
- Spring: 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)

CONFIDENCE COLORS:
- High (85%+): #10B981 (green)
- Medium (60-84%): #F59E0B (amber)
- Low (<60%): #EF4444 (red)
```

---

## Prompt 11: CH-05 Message Actions Menu

```
Create an HTML wireframe for a chat message actions menu in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Message Actions Menu
PURPOSE: Contextual actions that appear on hover over chat messages

TRIGGER BEHAVIOR:
- Appears on message hover (desktop) or long-press (mobile)
- Position: Top-right corner of message, offset 8px from edges
- Delay: 100ms before showing (prevent flicker)
- Persist while hovering menu itself

MENU CONTAINER:
- Background: #FFFFFF with 0 4px 12px rgba(0,0,0,0.1) shadow
- Border: 1px solid #E5E5E5
- Border-radius: 8px
- Padding: 4px
- Min-width: fit-content
- Display: inline-flex row
- Gap: 2px between buttons

ACTION BUTTONS (Icon Only):
- Size: 32px × 32px
- Border-radius: 6px
- Background: transparent
- Hover: #F3F4F6 background
- Active: #E5E7EB background
- Icon size: 16px
- Icon color: #6B7280
- Icon hover color: #1a1a1a

ACTIONS FOR USER MESSAGES:
1. Copy (clipboard icon) - Copy message text
2. Edit (pencil icon) - Edit own message
3. Delete (trash icon) - Delete message

ACTIONS FOR AGENT MESSAGES:
1. Copy (clipboard icon) - Copy message text
2. Regenerate (refresh icon) - Regenerate response
3. Pin (pin icon) - Pin important response
4. React (emoji icon) - Add reaction (thumbs up/down)

ACTIONS FOR ACTION CARDS:
1. Copy (clipboard icon) - Copy result
2. Share (share icon) - Share with team
3. View Details (expand icon) - Open in modal
4. Export (download icon) - Export data

REACTION PICKER (When emoji clicked):
- Flyout below/above action menu
- Background: #FFFFFF with shadow-lg
- Border-radius: 12px
- Padding: 8px
- Quick reactions: 👍 👎 ❤️ 🎉 🤔 ➕
- Each reaction: 28px button, hover scale 1.2
- ➕ opens full emoji picker

TOOLTIP ON HOVER:
- Show action name below button
- Background: #1a1a1a
- Text: #FFFFFF 12px
- Padding: 4px 8px
- Border-radius: 4px
- Arrow pointing up
- Delay: 500ms

KEYBOARD SUPPORT:
- Tab through actions when menu focused
- Enter/Space activates action
- Escape closes menu

STATES TO SHOW:
1. Menu appearing on message hover
2. Individual button hover state
3. Reaction picker open
4. Tooltip visible

ANIMATIONS:
- Menu fade in: opacity 0→1, translateY(-4px→0), 150ms
- Button hover: background 100ms
- Tooltip fade: 150ms
```

---

## Prompt 12: CH-06 Chat History/Search

```
Create an HTML wireframe for a chat history and search interface in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Chat History Panel
PURPOSE: Search and browse past conversations with AI agents

LAYOUT:
- Full chat panel takeover OR slide-in from right
- Width: Same as chat panel (320-480px)
- Height: 100% of chat area
- Background: #FFFBF5

HEADER:
- Height: 56px
- Background: #FFFFFF
- Border-bottom: 1px solid #E5E5E5
- Display: flex, align-items: center
- Padding: 0 16px
- Title: "Chat History" 16px semibold #1a1a1a
- Close button: X icon, 32px, right side

SEARCH BAR:
- Position: Below header, sticky
- Padding: 16px
- Background: #FFFFFF
- Input container:
  - Width: 100%
  - Height: 40px
  - Background: #F9FAFB
  - Border: 1px solid #E5E5E5
  - Border-radius: 8px
  - Focus border: 2px solid #FF6B6B
- Search icon: Left side, 16px, #6B7280
- Placeholder: "Search conversations..." #9CA3AF
- Clear button: X icon, appears when text entered

FILTER CHIPS (Below search):
- Horizontal scroll if overflow
- Gap: 8px
- Chips:
  - All Conversations (default selected)
  - Hub 🎯
  - Maya 🐚
  - Atlas 🗺️
  - Sage 🌿
  - Nova ✨
  - Echo 📊
- Chip style:
  - Padding: 6px 12px
  - Border-radius: 9999px
  - Font: 13px medium
  - Unselected: #F3F4F6 bg, #6B7280 text
  - Selected: Agent color bg, white text
  - Hover: Darken 10%

DATE GROUPING:
- Sticky headers: "Today", "Yesterday", "This Week", "Earlier"
- Background: #FFFBF5
- Padding: 8px 16px
- Font: 12px semibold #6B7280 uppercase
- Letter-spacing: 0.5px

CONVERSATION CARDS:
- Background: #FFFFFF
- Border-radius: 8px
- Padding: 12px 16px
- Margin: 4px 16px
- Border: 1px solid transparent
- Hover border: 1px solid #E5E5E5
- Hover shadow: 0 2px 4px rgba(0,0,0,0.04)
- Cursor: pointer

CARD CONTENT:
- Top row:
  - Agent icon: 20px with agent color dot
  - Agent name: 14px medium #1a1a1a
  - Timestamp: 12px #9CA3AF, right-aligned
- Preview text:
  - 14px #6B7280
  - Max 2 lines, ellipsis overflow
  - Margin-top: 4px
- Message count badge (if > 1):
  - Background: #F3F4F6
  - Color: #6B7280
  - Font: 11px medium
  - Padding: 2px 6px
  - Border-radius: 9999px
  - Position: bottom-right

SEARCH RESULTS MODE:
- Show matching text highlighted
- Highlight color: #FEF3C7 (yellow tint)
- Show context around match
- Bold matching terms

EMPTY STATES:
1. No conversations yet:
   - Illustration: Chat bubbles
   - Text: "No conversations yet"
   - Subtext: "Start chatting with your AI team"

2. No search results:
   - Illustration: Search magnifier
   - Text: "No results found"
   - Subtext: "Try different keywords"

LOAD MORE:
- Button at bottom: "Load more conversations"
- Or infinite scroll with loading spinner

KEYBOARD SHORTCUTS:
- Cmd/Ctrl + F: Focus search
- Up/Down arrows: Navigate conversations
- Enter: Open selected conversation
- Escape: Close history panel

STATES TO SHOW:
1. Default view with conversation list
2. Search active with results
3. Filter by agent selected
4. Empty state (no results)
```

---

## Prompt 13: CH-07 Agent Switching

```
Create an HTML wireframe for an agent switching interface in a premium SaaS application chat.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Switcher
PURPOSE: Switch between AI agents in chat or invoke specific agent

TRIGGER LOCATIONS:
1. Agent avatar click in chat header
2. @mention in chat input
3. Keyboard shortcut (Cmd+Shift+A)

DROPDOWN PANEL:
- Position: Below trigger, aligned left
- Width: 280px
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Shadow: 0 10px 25px rgba(0,0,0,0.1)
- Padding: 8px

HEADER (Inside dropdown):
- Padding: 8px 12px
- Text: "Switch Agent" 12px semibold #6B7280 uppercase
- Letter-spacing: 0.5px

AGENT LIST:
Each agent row:
- Height: 48px
- Padding: 8px 12px
- Border-radius: 8px
- Display: flex, align-items: center
- Gap: 12px
- Cursor: pointer
- Hover: #F9FAFB background
- Active/Selected: Agent color at 10% opacity background

AGENT ROW CONTENT:
- Avatar circle: 32px
  - Background: Agent color at 15% opacity
  - Icon/emoji: 18px centered
- Info column:
  - Name: 14px medium #1a1a1a
  - Role: 12px #6B7280
- Status indicator (right):
  - Online: 8px green dot
  - Busy: 8px amber dot
  - Offline: 8px gray dot

AGENT DEFINITIONS:
1. Hub 🎯
   - Color: #FF6B6B
   - Role: "Orchestrator"
   - Always online

2. Maya 🐚
   - Color: #20B2AA
   - Role: "CRM Agent"

3. Atlas 🗺️
   - Color: #FF9F43
   - Role: "Project Manager"

4. Sage 🌿
   - Color: #2ECC71
   - Role: "Finance Agent"

5. Nova ✨
   - Color: #FF6B9D
   - Role: "Marketing Agent"

6. Echo 📊
   - Color: #4B7BEC
   - Role: "Analytics Agent"

CURRENT AGENT INDICATOR:
- Checkmark icon on right side
- Color: Agent color
- Size: 16px

@MENTION MODE (In chat input):
- Trigger: Type "@" in chat input
- Show filtered agent list inline
- Position: Above input, floating
- Same styling as dropdown
- Filter as user types: "@ma" shows Maya
- Tab/Enter to select
- Selected agent appears as pill in input

AGENT PILL (After selection):
- Background: Agent color at 15%
- Border-radius: 9999px
- Padding: 2px 8px 2px 4px
- Display: inline-flex
- Agent emoji: 14px
- Agent name: 13px medium, agent color
- Remove X: 12px, appears on hover

CONTEXT HANDOFF INDICATOR:
- When switching mid-conversation
- Toast: "Context shared with [Agent Name]"
- Show brief loading state
- Agent avatar transitions with morph animation

KEYBOARD NAVIGATION:
- Up/Down: Navigate agent list
- Enter: Select highlighted agent
- Escape: Close dropdown
- Type to filter agents

ANIMATIONS:
- Dropdown: scale(0.95)→scale(1), opacity 0→1, 150ms
- Agent hover: background 100ms
- Agent select: brief scale pulse 1→1.02→1

STATES TO SHOW:
1. Dropdown open with agent list
2. Agent being hovered
3. Current agent selected (Hub)
4. @mention mode in input
5. Agent pill in input field
```

---

## Prompt 14: AP-01 Approval Queue Main

```
Create an HTML wireframe for the main approval queue view in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Approval Queue Main View
PURPOSE: Central hub for reviewing and approving AI-generated actions

PAGE LAYOUT:
- Full main content area (between sidebar and chat panel)
- Background: #FFFBF5
- Padding: 24px

PAGE HEADER:
- Display: flex, justify-content: space-between
- Margin-bottom: 24px

LEFT SIDE:
- Title: "Approval Queue" 24px bold #1a1a1a
- Subtitle: "Review AI-generated actions" 14px #6B7280
- Badge next to title: Pending count
  - Background: #FF6B6B
  - Color: white
  - Font: 12px bold
  - Padding: 2px 8px
  - Border-radius: 9999px

RIGHT SIDE - ACTIONS:
- "Mark All Read" text button: #6B7280, hover #1a1a1a
- "Bulk Actions" button:
  - Background: #FFFFFF
  - Border: 1px solid #E5E5E5
  - Padding: 8px 16px
  - Border-radius: 8px
  - Dropdown arrow

STATS BAR:
- Background: #FFFFFF
- Border-radius: 12px
- Padding: 16px 24px
- Margin-bottom: 24px
- Display: flex, gap: 32px
- Border: 1px solid #E5E5E5

STAT ITEMS:
1. Pending Review
   - Number: 24px bold #FF6B6B
   - Label: 12px #6B7280

2. Auto-Approved Today
   - Number: 24px bold #10B981
   - Label: 12px #6B7280

3. Avg Response Time
   - Number: 24px bold #1a1a1a
   - Label: 12px #6B7280

4. Approval Rate
   - Number: 24px bold #1a1a1a
   - Label: 12px #6B7280

FILTER/SORT BAR:
- Background: transparent
- Display: flex, gap: 12px
- Margin-bottom: 16px

FILTER ELEMENTS:
1. Search input:
   - Width: 280px
   - Height: 40px
   - Placeholder: "Search approvals..."
   - Search icon left

2. Type filter dropdown:
   - "All Types" default
   - Options: Email, Task, Deal Update, Contact Update, Campaign

3. Agent filter dropdown:
   - "All Agents" default
   - Agent options with color dots

4. Confidence filter:
   - "All Confidence" default
   - Options: High (85%+), Medium (60-84%), Low (<60%)

5. Sort dropdown:
   - "Newest First" default
   - Options: Oldest, Highest Confidence, Lowest Confidence, By Agent

QUEUE LIST:
- Display: flex flex-column
- Gap: 12px

APPROVAL CARD (Summary):
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 16px 20px
- Hover: Shadow-md, border-color #D1D5DB
- Cursor: pointer

CARD LAYOUT:
```
┌────────────────────────────────────────────────────────────┐
│ [Confidence] [Type Icon] Title                    [Agent]  │
│ 🟢 95%       📧          Summer Sale Email Draft   🐚 Maya │
│                                                            │
│ Description preview text that wraps to two lines max...    │
│                                                            │
│ Created 5 min ago · Marketing · Auto-approved              │
│                                         [View] [Actions ▼] │
└────────────────────────────────────────────────────────────┘
```

CONFIDENCE INDICATOR:
- Position: Left edge
- Width: 4px full height OR circle badge
- Colors: Green (#10B981), Amber (#F59E0B), Red (#EF4444)
- Circle badge: 40px, percentage inside, 14px bold

CARD CONTENT:
- Type icon: 20px, gray
- Title: 16px semibold #1a1a1a
- Agent: Avatar + name, right side
- Description: 14px #6B7280, max 2 lines
- Metadata: 12px #9CA3AF
- Tags: Pills, 12px, colored by category

ACTION BUTTONS:
- "View" ghost button
- "Actions" dropdown with:
  - Quick Approve
  - Request Changes
  - Reject
  - Reassign

EMPTY STATE:
- Center aligned
- Illustration: Checkmark in circle
- Heading: "All caught up!" 20px semibold
- Text: "No pending approvals" 14px #6B7280
- Show recent activity link

PAGINATION:
- Bottom of list
- "Showing 1-20 of 47 items"
- Page numbers: 1 [2] 3 ... 5
- Prev/Next arrows

STATES TO SHOW:
1. Queue with mixed confidence items
2. Empty state (all approved)
3. Filter applied state
4. Bulk selection mode (checkboxes visible)
```

---

## Prompt 15: AP-02 Approval Card (Confidence Routing)

```
Create an HTML wireframe showing different approval card states based on confidence levels.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Approval Cards by Confidence
PURPOSE: Show how cards adapt display based on AI confidence score

CONFIDENCE TIERS:
- High: 85-100% → Minimal review, auto-approve option
- Medium: 60-84% → Quick review, inline preview
- Low: 0-59% → Full review required, expanded details

---

HIGH CONFIDENCE CARD (85%+):
```
┌────────────────────────────────────────────────────────────┐
│ 🟢                                                         │
│ ┌──┐                                                       │
│ │95│  📧 Email: "Summer Sale Follow-up"         🐚 Maya   │
│ │% │                                                       │
│ └──┘  Auto-approved · Marketing · Just now                 │
│                                                            │
│                                    [View Details] [Undo ↩] │
└────────────────────────────────────────────────────────────┘
```

HIGH CONFIDENCE STYLING:
- Left border: 4px solid #10B981
- Confidence badge:
  - Background: #D1FAE5 (green-100)
  - Text: #065F46 (green-800)
  - Size: 40px circle
- Status: "Auto-approved" with checkmark
- Muted styling, slightly lower opacity (0.9)
- Actions: View Details, Undo (within time window)

---

MEDIUM CONFIDENCE CARD (60-84%):
```
┌────────────────────────────────────────────────────────────┐
│ 🟡                                                         │
│ ┌──┐                                                       │
│ │72│  📝 Blog Post: "AI Trends 2025"            ✨ Nova    │
│ │% │                                                       │
│ └──┘  Quick review · Content · 15 min ago                  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Preview:                                            │   │
│  │ "Artificial intelligence continues to reshape..."   │   │
│  │ [Show more]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  💡 AI Note: "Tone matches brand guidelines. Minor        │
│     grammar suggestions applied."                          │
│                                                            │
│                              [Reject] [Request Edit] [✓ Approve] │
└────────────────────────────────────────────────────────────┘
```

MEDIUM CONFIDENCE STYLING:
- Left border: 4px solid #F59E0B
- Confidence badge:
  - Background: #FEF3C7 (amber-100)
  - Text: #92400E (amber-800)
- Inline preview box:
  - Background: #F9FAFB
  - Border-radius: 8px
  - Padding: 12px
  - Max-height: 80px, overflow hidden
- AI Note section:
  - 💡 icon
  - 13px italic #6B7280
  - Background: transparent
- Action buttons prominent

---

LOW CONFIDENCE CARD (<60%):
```
┌────────────────────────────────────────────────────────────┐
│ 🔴                                                         │
│ ┌──┐                                                       │
│ │45│  📄 Contract: "Enterprise Deal - TechCorp"  🐚 Maya  │
│ │% │                                                       │
│ └──┘  ⚠️ Full review required · Sales · 1 hour ago        │
│                                                            │
│  ┌─ AI Reasoning ──────────────────────────────────────┐   │
│  │                                                     │   │
│  │ ⚠️ Unusual terms detected in section 4.2           │   │
│  │                                                     │   │
│  │ Concerns identified:                                │   │
│  │ • Non-standard liability clause                     │   │
│  │ • Payment terms differ from template (Net-60       │   │
│  │   vs standard Net-30)                               │   │
│  │ • Missing SLA definitions in Appendix A             │   │
│  │                                                     │   │
│  │ Confidence factors:                                 │   │
│  │ ├── Template match: 62%                             │   │
│  │ ├── Terms analysis: 38%                             │   │
│  │ └── Risk assessment: 41%                            │   │
│  │                                                     │   │
│  │                              [View Full Document →] │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  Suggested actions:                                        │
│  [📞 Schedule Review Call] [✏️ Request Legal Review]       │
│                                                            │
│                    [Reject with Reason] [Hold] [✓ Approve] │
└────────────────────────────────────────────────────────────┘
```

LOW CONFIDENCE STYLING:
- Left border: 4px solid #EF4444
- Confidence badge:
  - Background: #FEE2E2 (red-100)
  - Text: #991B1B (red-800)
- Warning badge: ⚠️ "Full review required"
  - Background: #FEF2F2
  - Border: 1px solid #FECACA
  - Border-radius: 6px
  - Padding: 4px 8px
- AI Reasoning box:
  - Background: #FFFFFF
  - Border: 1px solid #E5E5E5
  - Border-radius: 8px
  - Padding: 16px
  - Header: "AI Reasoning" 14px semibold
- Concern bullets:
  - Red bullet points
  - 14px #1a1a1a
- Confidence factors:
  - Tree structure with lines
  - Progress bars for each factor
  - Red/amber/green coloring
- Suggested actions:
  - Secondary button style
  - Left aligned
- Primary actions: Full width row at bottom

ANIMATION ON EXPAND:
- Height transition: 300ms ease-out
- Content fade in: 150ms

STATES TO SHOW:
1. All three confidence levels in a list view
2. Low confidence card expanded
3. Action being taken (approve button loading)
```

---

## Prompt 16: AP-03 Approval Detail Modal

```
Create an HTML wireframe for the approval detail modal in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Approval Detail Modal
PURPOSE: Full-screen modal for reviewing approval items in detail

MODAL CONTAINER:
- Position: fixed, inset 0
- Background overlay: rgba(0,0,0,0.5)
- Z-index: 50
- Display: flex, align-items: center, justify-content: center

MODAL CONTENT:
- Width: 90vw, max-width: 1000px
- Height: 90vh, max-height: 800px
- Background: #FFFFFF
- Border-radius: 16px
- Shadow: 0 25px 50px rgba(0,0,0,0.2)
- Display: flex flex-column
- Overflow: hidden

MODAL HEADER:
- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E5E5E5
- Padding: 0 24px
- Display: flex, align-items: center, justify-content: space-between

HEADER LEFT:
- Confidence badge: Circle with percentage
- Type icon: 24px
- Title: 18px semibold #1a1a1a
- Status pill: "Pending Review"

HEADER RIGHT:
- Agent: Avatar + name
- Timestamp: "Created 2 hours ago"
- Close button: X icon, 40px, hover #F3F4F6

MODAL BODY:
- Flex: 1
- Display: flex
- Overflow: hidden

LEFT PANEL (Content Preview) - 60%:
- Background: #FAFAFA
- Padding: 24px
- Overflow-y: auto

CONTENT TYPES:

1. Email Preview:
```
┌─────────────────────────────────────────────┐
│ From: sales@company.com                     │
│ To: john@techcorp.com                       │
│ Subject: Following up on our conversation   │
│─────────────────────────────────────────────│
│                                             │
│ Hi John,                                    │
│                                             │
│ Thank you for taking the time to discuss    │
│ your requirements yesterday. Based on our   │
│ conversation, I've put together a custom    │
│ proposal that addresses...                  │
│                                             │
│ [Full email content with formatting]        │
│                                             │
└─────────────────────────────────────────────┘
```

2. Document Preview:
- Embedded document viewer
- PDF/Doc rendering
- Highlight areas of concern in yellow
- Zoom controls: +/- buttons

3. Task/Deal Preview:
- Card format showing all fields
- Highlight changed fields
- Show before/after comparison

RIGHT PANEL (AI Analysis) - 40%:
- Background: #FFFFFF
- Border-left: 1px solid #E5E5E5
- Padding: 24px
- Overflow-y: auto

AI ANALYSIS SECTIONS:

1. Confidence Breakdown:
```
┌─────────────────────────────────────────────┐
│ Overall Confidence            72%           │
│ ━━━━━━━━━━━━━━━━░░░░░ (amber)              │
│                                             │
│ Factors:                                    │
│ ├─ Content Quality    ━━━━━━━━░░  82%      │
│ ├─ Brand Alignment    ━━━━━━━░░░  74%      │
│ ├─ Recipient Match    ━━━━━━━━━░  91%      │
│ └─ Timing Score       ━━━━░░░░░░  52%      │
└─────────────────────────────────────────────┘
```

2. AI Reasoning:
```
┌─────────────────────────────────────────────┐
│ 🤖 Analysis by Maya                         │
│─────────────────────────────────────────────│
│ This follow-up email is well-crafted with   │
│ personalized references to the previous     │
│ meeting. The timing score is lower because  │
│ optimal send time would be Tuesday AM.      │
│                                             │
│ Suggestions applied:                        │
│ • Added recipient's company name            │
│ • Included meeting reference date           │
│ • Attached proposal document                │
└─────────────────────────────────────────────┘
```

3. Related Context:
```
┌─────────────────────────────────────────────┐
│ 📋 Related Items                            │
│─────────────────────────────────────────────│
│ • Contact: John Smith (TechCorp)            │
│ • Deal: Enterprise Plan - $45,000           │
│ • Last interaction: 2 days ago              │
│ • Pipeline stage: Proposal                  │
└─────────────────────────────────────────────┘
```

4. Similar Past Approvals:
- Show 2-3 similar items user approved before
- "You approved similar items 12 times"

MODAL FOOTER:
- Height: 72px
- Background: #FFFFFF
- Border-top: 1px solid #E5E5E5
- Padding: 0 24px
- Display: flex, align-items: center, justify-content: space-between

FOOTER LEFT:
- Previous/Next navigation
- "Item 3 of 12"
- Arrow buttons

FOOTER RIGHT:
- "Reject" button: Red outline
- "Request Changes" button: Gray outline
- "Approve" button: #FF6B6B solid, white text

KEYBOARD SHORTCUTS:
- Escape: Close modal
- Left/Right arrows: Navigate items
- A: Approve
- R: Reject
- E: Request edit

ANIMATIONS:
- Modal enter: scale(0.95)→scale(1), opacity 0→1, 200ms
- Backdrop fade: 200ms
- Panel content fade: 150ms staggered

STATES TO SHOW:
1. Email approval detail
2. Document with highlighted concerns
3. Action button loading state
```

---

## Prompt 17: AP-04 Batch Approval

```
Create an HTML wireframe for batch approval functionality in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Batch Approval Interface
PURPOSE: Select and action multiple approval items at once

SELECTION MODE ACTIVATION:
- Trigger: Click "Bulk Actions" or Cmd+Shift+A
- Or: Click checkbox on any item

SELECTION MODE HEADER:
- Position: Sticky top of queue
- Background: #1a1a1a
- Color: #FFFFFF
- Height: 56px
- Padding: 0 24px
- Border-radius: 12px (if floating) or 0 (if full-width)
- Display: flex, align-items: center, gap: 16px

HEADER CONTENT:
```
┌────────────────────────────────────────────────────────────────────────┐
│ ☑️ 5 selected          [Select All High] [Select All] │ [Cancel]      │
│                        [Clear Selection]               │               │
│                                                        │               │
│      [🗑️ Reject All] [✏️ Request Changes] [✓ Approve All]            │
└────────────────────────────────────────────────────────────────────────┘
```

LEFT SECTION:
- Checkbox (checked state): 20px
- Count: "5 selected" 14px medium white
- Selection actions:
  - "Select All High (8)" - text button
  - "Select All (24)" - text button
  - "Clear Selection" - text button

RIGHT SECTION:
- "Cancel" text button
- Action buttons:
  - "Reject All": Red outline button
  - "Request Changes": Gray outline button
  - "Approve All": Green solid button (#10B981)

CARD SELECTION STATE:
- Checkbox appears left of confidence badge
- Checkbox: 20px, border-radius: 4px
- Unchecked: #E5E5E5 border, white fill
- Checked: #FF6B6B fill, white checkmark
- Hover (unchecked): #F3F4F6 background

SELECTED CARD STYLING:
- Background: #FFF5F5 (coral tint)
- Border: 2px solid #FF6B6B
- Subtle pulse animation on select

SELECTION RULES:
- Can only batch approve items at same confidence tier or higher
- Warning if mixing confidence levels
- Cannot batch approve low confidence items

MIXED SELECTION WARNING:
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Mixed confidence levels selected                        │
│                                                            │
│ • 3 High confidence items                                  │
│ • 2 Medium confidence items                                │
│ • 1 Low confidence item                                    │
│                                                            │
│ Low confidence items require individual review.            │
│ [Remove Low Items] [Review Each] [Proceed Anyway]          │
└────────────────────────────────────────────────────────────┘
```

BATCH ACTION CONFIRMATION:
```
┌────────────────────────────────────────────────────────────┐
│                    Approve 5 items?                        │
│                                                            │
│  📧 Summer Sale Email (95%)                                │
│  📧 Follow-up Email (88%)                                  │
│  📝 Blog Post Draft (92%)                                  │
│  📋 Task: Update CRM (87%)                                 │
│  📊 Report: Monthly Sales (91%)                            │
│                                                            │
│  These items will be approved and executed.                │
│                                                            │
│             [Cancel]              [✓ Approve 5 Items]      │
└────────────────────────────────────────────────────────────┘
```

CONFIRMATION MODAL:
- Width: 480px
- Background: #FFFFFF
- Border-radius: 16px
- Padding: 24px
- Shadow: xl
- List shows items with confidence
- Action button shows count

BATCH PROGRESS:
```
┌────────────────────────────────────────────────────────────┐
│              Processing 5 items...                         │
│                                                            │
│  ━━━━━━━━━━━━━━━━━━░░░░░░░░░░  3 of 5                     │
│                                                            │
│  ✓ Summer Sale Email - Approved                            │
│  ✓ Follow-up Email - Approved                              │
│  ✓ Blog Post Draft - Approved                              │
│  ◌ Task: Update CRM - Processing...                        │
│  ◌ Report: Monthly Sales - Pending                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

PROGRESS STATES:
- Pending: Gray circle, gray text
- Processing: Spinning loader, black text
- Complete: Green checkmark, green text
- Failed: Red X, red text, retry button

COMPLETION SUMMARY:
```
┌────────────────────────────────────────────────────────────┐
│                  ✓ Batch Complete                          │
│                                                            │
│           5 items approved successfully                    │
│                                                            │
│                      [Done]                                │
└────────────────────────────────────────────────────────────┘
```

KEYBOARD SHORTCUTS:
- Space: Toggle selection on focused item
- Cmd+A: Select all
- Escape: Exit selection mode
- Enter: Confirm batch action

STATES TO SHOW:
1. Queue with selection checkboxes visible
2. Multiple items selected with action bar
3. Mixed confidence warning
4. Batch confirmation modal
5. Processing progress
6. Completion summary
```

---

## Prompt 18: AP-05 Approval Filters

```
Create an HTML wireframe for the approval queue filter panel in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Approval Filters
PURPOSE: Advanced filtering for the approval queue

FILTER BAR (Collapsed State):
- Display: flex, gap: 12px
- Height: 40px per filter
- Wrap on mobile

QUICK FILTERS (Chips):
- Display: flex, gap: 8px
- Horizontal scroll on mobile

QUICK FILTER CHIPS:
1. "All" (default)
2. "Pending" - with count badge
3. "High Confidence"
4. "Needs Review" - amber indicator
5. "Today"

CHIP STYLING:
- Padding: 6px 12px
- Border-radius: 9999px
- Font: 13px medium
- Unselected: #F3F4F6 bg, #6B7280 text, 1px #E5E5E5 border
- Selected: #FF6B6B bg, white text
- Hover: Darken 5%
- Count badge: 11px, bg contrasting

DROPDOWN FILTERS:

1. TYPE FILTER:
```
┌─────────────────────────────┐
│ Type               ▼        │
├─────────────────────────────┤
│ ☑️ All Types                │
│─────────────────────────────│
│ ☐ 📧 Emails         (12)   │
│ ☐ 📝 Content         (8)   │
│ ☐ 📄 Documents       (3)   │
│ ☐ 📋 Tasks          (15)   │
│ ☐ 💼 Deal Updates    (6)   │
│ ☐ 👤 Contact Updates (4)   │
│ ☐ 📊 Reports         (2)   │
└─────────────────────────────┘
```

2. AGENT FILTER:
```
┌─────────────────────────────┐
│ Agent              ▼        │
├─────────────────────────────┤
│ ☑️ All Agents               │
│─────────────────────────────│
│ ☐ 🎯 Hub           (20)    │
│ ☐ 🐚 Maya          (15)    │
│ ☐ 🗺️ Atlas          (8)    │
│ ☐ 🌿 Sage           (4)    │
│ ☐ ✨ Nova          (10)    │
│ ☐ 📊 Echo           (3)    │
└─────────────────────────────┘
```

Agent rows have colored dot indicator matching agent color.

3. CONFIDENCE FILTER:
```
┌─────────────────────────────┐
│ Confidence         ▼        │
├─────────────────────────────┤
│ ◉ All Levels                │
│─────────────────────────────│
│ ○ 🟢 High (85%+)    (32)   │
│ ○ 🟡 Medium (60-84%) (14)  │
│ ○ 🔴 Low (<60%)      (4)   │
│─────────────────────────────│
│ Custom Range:               │
│ [ 50 ]% - [ 80 ]%          │
│                    [Apply]  │
└─────────────────────────────┘
```

4. DATE FILTER:
```
┌─────────────────────────────┐
│ Date               ▼        │
├─────────────────────────────┤
│ ◉ Any Time                  │
│─────────────────────────────│
│ ○ Today                     │
│ ○ Yesterday                 │
│ ○ Last 7 days               │
│ ○ Last 30 days              │
│ ○ Custom range...           │
│─────────────────────────────│
│ From: [MM/DD/YYYY]          │
│ To:   [MM/DD/YYYY]          │
│              [📅] [Apply]   │
└─────────────────────────────┘
```

DROPDOWN STYLING:
- Width: 240px
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Shadow: lg
- Padding: 8px

DROPDOWN ITEMS:
- Height: 36px
- Padding: 0 12px
- Border-radius: 6px
- Hover: #F9FAFB background
- Checkbox: 16px, left side
- Count: Right side, #9CA3AF

SEARCH WITHIN DROPDOWN:
- For Type and Agent filters
- Input at top of dropdown
- Placeholder: "Search..."
- Filter list as typing

ACTIVE FILTER INDICATOR:
- Filter button shows dot when active
- Dot: 6px, #FF6B6B, top-right of button
- Or: Button background changes to #FFF5F5

FILTER SUMMARY BAR:
When filters applied:
```
┌────────────────────────────────────────────────────────────┐
│ Showing: Emails from Maya, High Confidence, Last 7 days    │
│ [✕ Emails] [✕ Maya] [✕ High] [✕ 7 days]  [Clear All]     │
└────────────────────────────────────────────────────────────┘
```

FILTER TAG PILLS:
- Background: #F3F4F6
- Border-radius: 9999px
- Padding: 4px 8px 4px 12px
- Font: 12px medium #6B7280
- X button: 12px, right side
- Hover X: #EF4444

SAVED FILTERS:
- "Save Current Filters" link
- Opens modal to name filter set
- Saved filters appear in dropdown
- Star icon for favorites

SAVED FILTER DROPDOWN:
```
┌─────────────────────────────┐
│ ⭐ Saved Filters            │
├─────────────────────────────┤
│ My Queue (Default)          │
│ High Priority Only          │
│ Content Review              │
│─────────────────────────────│
│ + Save Current as...        │
│ ⚙️ Manage Saved Filters     │
└─────────────────────────────┘
```

MOBILE ADAPTATION:
- "Filters" button opens slide-up sheet
- Full-screen filter panel
- Apply button sticky at bottom

ANIMATIONS:
- Dropdown open: 150ms, scale/fade
- Filter tags: Slide in 100ms
- Clear: Fade out 150ms

STATES TO SHOW:
1. Filter bar with dropdowns
2. Type filter dropdown open
3. Multiple filters applied with tags
4. Saved filters dropdown
5. Mobile filter sheet
```

---

## Prompt 19: AP-06 Approval History

```
Create an HTML wireframe for the approval history view in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Approval History
PURPOSE: View past approval decisions and outcomes

LAYOUT OPTION 1 - Tab in Queue:
- Tab bar: "Pending (24)" | "History"
- Same page, content switches

LAYOUT OPTION 2 - Separate Page:
- Sidebar link: "Approval History"
- Full page layout

PAGE HEADER:
- Title: "Approval History" 24px bold
- Subtitle: "Review past decisions and outcomes"
- Export button: "Export CSV" outline button

SUMMARY STATS:
```
┌────────────────────────────────────────────────────────────────────────┐
│  📊 Last 30 Days                                                       │
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   247    │  │   198    │  │    42    │  │     7    │              │
│  │ Total    │  │ Approved │  │ Rejected │  │ Pending  │              │
│  │          │  │ (80.2%)  │  │ (17.0%)  │  │  (2.8%)  │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                                                                        │
│  Approval Rate: ━━━━━━━━━━━━━━━━━━━━░░░░ 80.2%                        │
└────────────────────────────────────────────────────────────────────────┘
```

STATS CARDS:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 8px
- Padding: 16px
- Number: 24px bold
- Label: 12px #6B7280

FILTER BAR (Same as Queue):
- Date range (prominent)
- Type filter
- Agent filter
- Status filter: All, Approved, Rejected, Reverted
- Search

TIMELINE VIEW:
```
┌────────────────────────────────────────────────────────────┐
│ ○ Today ─────────────────────────────────────────────────  │
│ │                                                          │
│ │  ✓ Email: "Summer Sale Follow-up"                        │
│ │    Approved by You · 2:34 PM · 95% confidence           │
│ │    📧 Sent successfully · Opened by recipient           │
│ │                                                          │
│ │  ✓ Task: Update Johnson contact                          │
│ │    Auto-approved · 1:15 PM · 92% confidence             │
│ │    ✓ Contact updated in CRM                              │
│ │                                                          │
│ │  ✗ Blog Post: "Q3 Market Analysis"                       │
│ │    Rejected by You · 11:45 AM · 68% confidence          │
│ │    Reason: "Needs updated statistics"                    │
│ │                                                          │
│ ○ Yesterday ─────────────────────────────────────────────  │
│ │                                                          │
│ │  ↩ Email: "Partnership Proposal"                         │
│ │    Reverted by You · 4:30 PM · Originally 87%           │
│ │    Reason: "Wrong recipient selected"                    │
│ │                                                          │
└────────────────────────────────────────────────────────────┘
```

TIMELINE STYLING:
- Vertical line: 2px #E5E5E5
- Date markers: 12px semibold #6B7280
- Time dot: 8px, colored by status

HISTORY ITEM CARD:
- Background: #FFFFFF (or transparent)
- Padding: 12px 16px
- Border-radius: 8px
- Hover: #F9FAFB background
- Margin-left: 24px (from timeline)

STATUS ICONS:
- Approved: ✓ green checkmark
- Rejected: ✗ red X
- Auto-approved: ✓ with "auto" badge
- Reverted: ↩ amber arrow

CARD CONTENT:
- Status icon: Left, 20px
- Title: 15px semibold #1a1a1a
- Meta: 13px #6B7280
  - "Approved by You" / "Auto-approved" / "Rejected by You"
  - Timestamp
  - Original confidence
- Outcome: 12px, colored by result
  - Success: Green text, checkmark
  - Failed: Red text, warning
  - Pending: Gray text
- Rejection reason (if rejected): Italic, in quotes

EXPANDED DETAILS (Click to expand):
```
┌────────────────────────────────────────────────────────────┐
│ ✓ Email: "Summer Sale Follow-up"                    [···]  │
│   Approved by You · 2:34 PM · 95% confidence              │
│   ────────────────────────────────────────────────────────│
│                                                            │
│   📧 Outcome: Sent successfully                            │
│   ├─ Delivered: 2:35 PM                                   │
│   ├─ Opened: 3:12 PM (first open)                        │
│   └─ Clicks: 2 (proposal link)                           │
│                                                            │
│   Original Content:                                        │
│   "Hi John, Following up on our conversation..."          │
│   [View Full Email]                                        │
│                                                            │
│   AI Analysis at time of approval:                         │
│   "Strong personalization, optimal send time..."          │
│                                                            │
│                                    [View Details] [Report] │
└────────────────────────────────────────────────────────────┘
```

TABLE VIEW OPTION:
- Toggle: "Timeline" | "Table"
- Standard data table format
- Columns: Status, Type, Title, Agent, Decision, By, Date, Outcome
- Sortable columns
- Pagination

SEARCH RESULTS:
- Highlight matching text
- Show context snippet
- Group by date

BULK EXPORT:
- Select date range
- Choose format: CSV, PDF, JSON
- Download or email

ANALYTICS LINK:
- "View Approval Analytics →"
- Links to deeper reporting

STATES TO SHOW:
1. Timeline view with mixed statuses
2. Expanded item showing outcome
3. Table view
4. Filtered results
```

---

## Prompt 20: AP-07 Quick Actions Panel

```
Create an HTML wireframe for the approval queue quick actions panel in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Quick Actions Panel
PURPOSE: Rapid approval actions without opening full detail view

LOCATION OPTIONS:
1. Floating panel on right side
2. Slide-in drawer from right
3. Bottom action bar (mobile)

FLOATING PANEL DESIGN:
- Position: Fixed right side, vertically centered
- Width: 280px
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 16px
- Shadow: xl
- Padding: 16px

PANEL HEADER:
```
┌────────────────────────────────────────┐
│ ⚡ Quick Actions              [✕]      │
│ 24 items pending                       │
└────────────────────────────────────────┘
```

HEADER STYLING:
- Lightning icon: #FF6B6B
- Title: 16px semibold
- Count: 13px #6B7280
- Close: X icon, top-right

CURRENT ITEM PREVIEW:
```
┌────────────────────────────────────────┐
│ 🟢 95%                                 │
│                                        │
│ 📧 Email: "Summer Sale Follow-up"      │
│ 🐚 Maya · Marketing                    │
│                                        │
│ "Hi John, Following up on our          │
│ conversation about the enterprise      │
│ package. I wanted to share..."         │
│                        [Show More ↓]   │
└────────────────────────────────────────┘
```

PREVIEW STYLING:
- Confidence badge: Top-left
- Type icon + title: 15px semibold
- Agent + category: 13px #6B7280
- Preview text: 13px #6B7280, max 3 lines
- Expand link: Text button

AI QUICK SUMMARY:
```
┌────────────────────────────────────────┐
│ 💡 AI Summary                          │
│ ─────────────────────────────────────  │
│ Personalized follow-up with correct    │
│ recipient and timing. All checks pass. │
└────────────────────────────────────────┘
```

SUMMARY STYLING:
- Background: #F9FAFB
- Border-radius: 8px
- Padding: 12px
- Icon: 💡
- Text: 13px #6B7280

ACTION BUTTONS:
```
┌────────────────────────────────────────┐
│                                        │
│  [        View Full Details         ]  │
│                                        │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Reject    │  │  ✓ Approve      │  │
│  └─────────────┘  └─────────────────┘  │
│                                        │
│            [Skip to Next →]            │
│                                        │
└────────────────────────────────────────┘
```

BUTTON STYLING:
- View Full: Outline button, full width
- Reject: Red outline, 48% width
- Approve: Green solid (#10B981), 48% width
- Skip: Text button, centered

REJECT QUICK OPTIONS:
On reject click, show inline options:
```
┌────────────────────────────────────────┐
│ Quick rejection reason:                │
│                                        │
│ ○ Needs revision                       │
│ ○ Wrong recipient                      │
│ ○ Timing not right                     │
│ ○ Content quality                      │
│ ○ Other: [____________]                │
│                                        │
│        [Cancel]  [Reject with Reason]  │
└────────────────────────────────────────┘
```

NAVIGATION STRIP:
```
┌────────────────────────────────────────┐
│  [←]     3 of 24     [→]              │
│                                        │
│  ● ● ● ○ ○ ○ ○ ○ ○ ○  (progress dots) │
└────────────────────────────────────────┘
```

NAVIGATION STYLING:
- Arrows: 32px circle buttons
- Counter: 14px medium, center
- Progress: Small dots, filled = reviewed
- Show first 10 dots, then "..."

KEYBOARD SHORTCUTS HINT:
```
┌────────────────────────────────────────┐
│ ⌨️ A: Approve  R: Reject  →: Skip     │
└────────────────────────────────────────┘
```

HINT STYLING:
- Background: #F3F4F6
- Border-radius: 6px
- Padding: 8px 12px
- Font: 11px #6B7280
- Can be dismissed

COMPLETION STATE:
```
┌────────────────────────────────────────┐
│                                        │
│              🎉                        │
│                                        │
│        All caught up!                  │
│                                        │
│   You've reviewed all pending items    │
│                                        │
│   Today's stats:                       │
│   ✓ 18 approved                        │
│   ✗ 4 rejected                         │
│   → 2 skipped                          │
│                                        │
│        [View History]                  │
│                                        │
└────────────────────────────────────────┘
```

COMPLETION STYLING:
- Celebration emoji: 48px, with confetti animation
- Heading: 18px semibold
- Stats: Green/red/gray text
- Button: Outline style

MOBILE ADAPTATION:
- Bottom sheet instead of side panel
- Swipe gestures: Left = reject, Right = approve
- Swipe up = view details

SWIPE INDICATORS (Mobile):
```
┌────────────────────────────────────────┐
│ ← Reject                    Approve → │
│ ┌──────────────────────────────────┐  │
│ │                                  │  │
│ │      [Swipeable Card Area]       │  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│              ↑ Details                 │
└────────────────────────────────────────┘
```

ANIMATIONS:
- Panel slide in: 200ms from right
- Card transitions: Slide + fade, 150ms
- Approval: Card slides out right with green
- Reject: Card slides out left with red
- Confetti: Burst on completion

STATES TO SHOW:
1. Panel with item preview
2. Reject reason selection
3. Navigation between items
4. Completion celebration
5. Mobile swipe view
```

---

## Batch 2 Summary

| # | Wireframe ID | Component Name | Complexity |
|---|--------------|----------------|------------|
| 11 | CH-05 | Message Actions Menu | Medium |
| 12 | CH-06 | Chat History/Search | High |
| 13 | CH-07 | Agent Switching | Medium |
| 14 | AP-01 | Approval Queue Main | High |
| 15 | AP-02 | Approval Card (Confidence) | High |
| 16 | AP-03 | Approval Detail Modal | High |
| 17 | AP-04 | Batch Approval | High |
| 18 | AP-05 | Approval Filters | Medium |
| 19 | AP-06 | Approval History | High |
| 20 | AP-07 | Quick Actions Panel | Medium |

---

## Next Batch Preview

**Batch 3** will cover:
- AI-01 through AI-05 (AI Team Panel)
- ST-01 through ST-05 (Settings - first half)

---

*End of Batch 2*
