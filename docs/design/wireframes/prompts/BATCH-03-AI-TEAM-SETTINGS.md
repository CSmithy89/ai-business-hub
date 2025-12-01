# Google Stitch Prompts - Batch 3: AI Team Panel + Settings

**Batch:** 3 of 9
**Wireframes:** AI-01 to AI-05, ST-01 to ST-05
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
```

---

## Prompt 21: AI-01 AI Team Overview

```
Create an HTML wireframe for the AI Team overview page in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: AI Team Overview
PURPOSE: Dashboard showing all AI agents, their status, and recent activity

PAGE LAYOUT:
- Full main content area
- Background: #FFFBF5
- Padding: 24px

PAGE HEADER:
- Title: "AI Team" 24px bold #1a1a1a
- Subtitle: "Your intelligent workforce" 14px #6B7280
- Right side: "Team Settings" button (outline)

TEAM STATS BANNER:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │     6       │ │     5       │ │   1,247     │ │    94.2%    │      │
│  │   Agents    │ │   Online    │ │ Tasks Today │ │  Success    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

STATS BANNER STYLING:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 20px 24px
- Display: flex, justify-content: space-around
- Margin-bottom: 24px

STAT ITEM:
- Number: 28px bold #1a1a1a
- Label: 13px #6B7280
- Vertical layout, center aligned

AGENT GRID:
- Display: grid
- Grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))
- Gap: 20px

AGENT CARD:
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  ┌────┐  Hub                              ● Online         │
│  │ 🎯 │  Orchestrator                                      │
│  └────┘  "Coordinating your AI team"                       │
│                                                            │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  Today's Activity                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━ 156 tasks                       │
│                                                            │
│  Recent:                                                   │
│  • Routed email inquiry to Maya          2 min ago         │
│  • Created project brief for Atlas       5 min ago         │
│  • Summarized daily metrics              12 min ago        │
│                                                            │
│                              [View Activity] [Configure]   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

AGENT CARD STYLING:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 16px
- Padding: 20px
- Hover: Shadow-md, border-color agent color at 50%
- Transition: 150ms

CARD HEADER:
- Avatar: 48px circle
  - Background: Agent color at 15%
  - Emoji: 24px centered
- Name: 18px semibold #1a1a1a
- Role: 14px #6B7280
- Tagline: 13px italic #9CA3AF
- Status dot: 8px, right side
  - Online: #10B981
  - Busy: #F59E0B
  - Offline: #9CA3AF

CARD DIVIDER:
- Height: 1px
- Background: #E5E5E5
- Margin: 16px 0

ACTIVITY SECTION:
- Label: "Today's Activity" 12px semibold #6B7280
- Progress bar: Full width, 4px height
  - Background: #E5E5E5
  - Fill: Agent color
  - Border-radius: 2px
- Count: Right of bar, 13px #6B7280

RECENT ITEMS:
- Max 3 items
- Bullet: Agent color dot, 6px
- Text: 13px #6B7280
- Time: Right-aligned, 12px #9CA3AF
- Truncate long text with ellipsis

CARD ACTIONS:
- "View Activity": Text button, agent color
- "Configure": Text button, #6B7280

AGENT CARDS DATA:

1. Hub 🎯 (Coral #FF6B6B)
   - Role: Orchestrator
   - Tagline: "Coordinating your AI team"

2. Maya 🐚 (Teal #20B2AA)
   - Role: CRM Agent
   - Tagline: "Building lasting relationships"

3. Atlas 🗺️ (Orange #FF9F43)
   - Role: Project Manager
   - Tagline: "Keeping projects on track"

4. Sage 🌿 (Green #2ECC71)
   - Role: Finance Agent
   - Tagline: "Managing your numbers"

5. Nova ✨ (Pink #FF6B9D)
   - Role: Marketing Agent
   - Tagline: "Growing your reach"

6. Echo 📊 (Blue #4B7BEC)
   - Role: Analytics Agent
   - Tagline: "Insights that matter"

EMPTY STATE (No agents configured):
- Illustration: Robot/AI icon
- Heading: "Set up your AI team"
- Text: "Configure AI agents to automate your workflow"
- Button: "Get Started" primary

STATES TO SHOW:
1. Full team grid (6 agents)
2. Mixed online/offline status
3. Hover state on card
4. One agent card expanded/focused
```

---

## Prompt 22: AI-02 Agent Card Component

```
Create an HTML wireframe for individual AI agent card variations in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Card Variants
PURPOSE: Different card states and sizes for AI agents

---

VARIANT 1: COMPACT CARD (For lists/sidebars)
```
┌────────────────────────────────────────────────┐
│  ┌────┐                                        │
│  │ 🐚 │  Maya              ● Online    [···]   │
│  └────┘  CRM Agent · 42 tasks today            │
└────────────────────────────────────────────────┘
```

COMPACT STYLING:
- Height: 64px
- Padding: 12px 16px
- Avatar: 40px
- Name: 15px semibold
- Meta: 13px #6B7280
- Status: 6px dot
- Menu: 3-dot icon, appears on hover

---

VARIANT 2: STANDARD CARD (Grid view)
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────┐                                              │
│  │      │   Maya                         ● Online      │
│  │  🐚  │   CRM Agent                                  │
│  │      │   "Building lasting relationships"           │
│  └──────┘                                              │
│                                                        │
│  ───────────────────────────────────────────────────   │
│                                                        │
│  📊 Performance                                        │
│  ├─ Tasks completed: 1,247                             │
│  ├─ Success rate: 96.3%                                │
│  └─ Avg response: 1.2s                                 │
│                                                        │
│                         [View Details] [Chat with Maya]│
│                                                        │
└────────────────────────────────────────────────────────┘
```

STANDARD STYLING:
- Min-height: 240px
- Padding: 20px
- Avatar: 64px
- Performance stats with tree lines
- Action buttons at bottom

---

VARIANT 3: EXPANDED CARD (Detail focus)
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌────────┐                                                            │
│  │        │   Maya                                      ● Online       │
│  │   🐚   │   CRM Agent                                                │
│  │        │   "Building lasting relationships"                         │
│  └────────┘                                                            │
│                                                                        │
│  Powered by: Claude 3.5 Sonnet · Temperature: 0.7 · Context: 100k     │
│                                                                        │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                        │
│  📊 Today's Stats           📈 This Week              🎯 Capabilities  │
│  ────────────────           ────────────              ───────────────  │
│  Tasks: 42                  Tasks: 284                • Lead scoring   │
│  Success: 97.6%             Success: 96.1%            • Email drafts   │
│  Approvals: 38              Approvals: 251            • Contact mgmt   │
│  Avg time: 0.8s             Avg time: 1.1s            • Follow-ups     │
│                                                        • Deal tracking  │
│                                                                        │
│  Recent Activity                                                       │
│  ───────────────────────────────────────────────────────────────────   │
│  ✓ Drafted follow-up email for Johnson Corp              2 min ago    │
│  ✓ Updated lead score for TechStart Inc                  5 min ago    │
│  ✓ Created contact from inbound form                     8 min ago    │
│  ○ Pending: Review enterprise proposal                   Queued       │
│                                                                        │
│  [View All Activity]  [Configure Agent]  [Chat with Maya]             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

EXPANDED STYLING:
- Full width (or max 800px)
- Padding: 24px
- Avatar: 80px
- Model info: 12px #9CA3AF, below tagline
- Three-column stats layout
- Activity list with status icons
- Capabilities as tag list

---

VARIANT 4: MINI AVATAR (Chat/mentions)
```
┌──────┐
│  🐚  │  ← 32px, hover shows tooltip "Maya - CRM Agent"
└──────┘
```

MINI STYLING:
- Size: 32px circle
- Background: Agent color at 15%
- Emoji: 16px
- Tooltip on hover: Name + role
- Click opens agent detail

---

VARIANT 5: STATUS BADGE (Inline)
```
🐚 Maya is working on "Email draft for Johnson"...
```

BADGE STYLING:
- Inline with text
- Emoji: 16px
- Name: 14px semibold, agent color
- Status text: 14px #6B7280
- Animated ellipsis for active work

---

AGENT STATUS STATES:

ONLINE:
- Dot: #10B981 (green)
- Glow: 0 0 8px rgba(16, 185, 129, 0.4)
- Label: "Online"

BUSY:
- Dot: #F59E0B (amber)
- Pulse animation
- Label: "Working on task..."

OFFLINE:
- Dot: #9CA3AF (gray)
- No glow
- Label: "Offline"

ERROR:
- Dot: #EF4444 (red)
- Label: "Error - Check configuration"

---

HOVER INTERACTIONS:

Standard Card Hover:
- Scale: 1.02
- Shadow: lg
- Border: Agent color at 30%

Compact Card Hover:
- Background: #F9FAFB
- Show action menu

Avatar Hover:
- Scale: 1.1
- Show tooltip after 500ms

CLICK ACTIONS:
- Card click: Open detail modal
- Avatar click: Start chat with agent
- Status click: Show status details

ANIMATIONS:
- Hover scale: 150ms ease-out
- Status dot pulse: 2s infinite for busy
- Activity items: Stagger fade in 50ms each

STATES TO SHOW:
1. All 5 card variants
2. Each status state (online, busy, offline, error)
3. Hover states
4. Loading/skeleton state
```

---

## Prompt 23: AI-03 Agent Detail Modal

```
Create an HTML wireframe for the AI agent detail modal in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Detail Modal
PURPOSE: Full configuration and activity view for an AI agent

MODAL CONTAINER:
- Position: fixed, inset 0
- Background overlay: rgba(0,0,0,0.5)
- Z-index: 50
- Display: flex, align-items: center, justify-content: center

MODAL CONTENT:
- Width: 90vw, max-width: 900px
- Height: 90vh, max-height: 700px
- Background: #FFFFFF
- Border-radius: 16px
- Shadow: xl
- Display: flex flex-column
- Overflow: hidden

MODAL HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌────────┐                                                            │
│  │   🐚   │  Maya                                ● Online      [✕]    │
│  └────────┘  CRM Agent · Powered by Claude 3.5 Sonnet                 │
│                                                                        │
│  ───────────────────────────────────────────────────────────────────   │
│  [Overview]  [Activity]  [Configuration]  [Permissions]  [Analytics]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

HEADER STYLING:
- Height: 120px
- Background: Linear gradient from agent color (10%) to white
- Padding: 20px 24px
- Avatar: 56px
- Name: 24px bold #1a1a1a
- Meta: 14px #6B7280
- Close: X button, 40px, top-right

TAB BAR:
- Border-bottom: 1px solid #E5E5E5
- Tab: 14px medium, padding 12px 16px
- Inactive: #6B7280
- Active: Agent color, 2px bottom border
- Hover: #1a1a1a

---

TAB 1: OVERVIEW
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  About Maya                                                            │
│  ─────────────────────────────────────────────────────────────────     │
│  Maya is your dedicated CRM agent, specializing in customer           │
│  relationship management, lead nurturing, and sales automation.        │
│  She helps you build lasting relationships with your customers.        │
│                                                                        │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐     │
│  │ 📊 Performance (30 days)    │  │ 🎯 Capabilities             │     │
│  │ ─────────────────────────── │  │ ─────────────────────────── │     │
│  │ Tasks completed: 3,847      │  │ ✓ Lead scoring & routing    │     │
│  │ Success rate: 96.2%         │  │ ✓ Email draft generation    │     │
│  │ Avg response: 1.1s          │  │ ✓ Contact management        │     │
│  │ Approvals needed: 12%       │  │ ✓ Follow-up scheduling      │     │
│  │                             │  │ ✓ Deal stage tracking       │     │
│  │ ━━━━━━━━━━━━━━━━━━ 96.2%   │  │ ✓ Customer insights         │     │
│  └─────────────────────────────┘  └─────────────────────────────┘     │
│                                                                        │
│  Quick Actions                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│  [💬 Chat with Maya]  [⚙️ Configure]  [📊 View Analytics]  [⏸️ Pause] │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

TAB 2: ACTIVITY
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Filter: [All] [Completed] [Pending] [Failed]     Search: [________]  │
│                                                                        │
│  ○ Today ──────────────────────────────────────────────────────────   │
│  │                                                                     │
│  │  ✓ Drafted follow-up email for Johnson Corp           2:34 PM     │
│  │    📧 Email · High confidence (94%) · Auto-approved                │
│  │                                                                     │
│  │  ✓ Updated lead score: TechStart Inc → Hot            2:15 PM     │
│  │    📊 Analysis · High confidence (91%) · Auto-approved             │
│  │                                                                     │
│  │  ○ Pending: Enterprise proposal review                 Queued      │
│  │    📄 Document · Awaiting your review                              │
│  │                                                                     │
│  │  ✗ Failed: Email to invalid address                    1:45 PM    │
│  │    📧 Email · Error: Recipient not found                           │
│  │                                                                     │
│  ○ Yesterday ──────────────────────────────────────────────────────   │
│  │                                                                     │
│  │  ✓ Created 12 contacts from import                     5:30 PM    │
│  │                                                                     │
│                                              [Load More Activity]      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

ACTIVITY STYLING:
- Timeline with vertical line
- Status icons: ✓ green, ○ gray, ✗ red
- Confidence badges inline
- Expandable items for details

---

TAB 3: CONFIGURATION
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  AI Model Settings                                                     │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Model                                                                 │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Claude 3.5 Sonnet                                      ▼   │       │
│  └────────────────────────────────────────────────────────────┘       │
│  Recommended for CRM tasks. Balances speed and capability.            │
│                                                                        │
│  Temperature                                    0.7                    │
│  ━━━━━━━━━━━━━━━━●━━━━━━━━━━                                          │
│  Lower = more focused, Higher = more creative                          │
│                                                                        │
│  Automation Level                                                      │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  ○ Manual - All actions require approval                               │
│  ◉ Balanced - Auto-approve high confidence (85%+)                     │
│  ○ Autonomous - Auto-approve medium+ confidence (60%+)                │
│  ○ Full Auto - Approve all actions (use with caution)                 │
│                                                                        │
│  Notification Preferences                                              │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  [✓] Notify on task completion                                        │
│  [✓] Notify on approval needed                                        │
│  [ ] Notify on auto-approved actions                                  │
│  [✓] Daily summary email                                              │
│                                                                        │
│                                        [Cancel]  [Save Configuration] │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

TAB 4: PERMISSIONS
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Data Access                                                           │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  [✓] Contacts - Read and write                                        │
│  [✓] Deals - Read and write                                           │
│  [✓] Companies - Read only                                            │
│  [ ] Financial data - No access                                       │
│  [✓] Email integration - Full access                                  │
│  [✓] Calendar - Read only                                             │
│                                                                        │
│  Action Permissions                                                    │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  [✓] Create new contacts                                              │
│  [✓] Update existing contacts                                         │
│  [ ] Delete contacts (requires approval)                              │
│  [✓] Send emails                                                      │
│  [✓] Schedule follow-ups                                              │
│  [✓] Update deal stages                                               │
│  [ ] Create deals over $10,000                                        │
│                                                                        │
│  Integration Access                                                    │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  [✓] Gmail · Connected as john@company.com                            │
│  [✓] Slack · #sales-team channel                                      │
│  [ ] HubSpot · Not connected                          [Connect]       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

TAB 5: ANALYTICS
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Performance Over Time                    [7 days] [30 days] [90 days]│
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  [Line chart showing tasks completed and success rate over time]       │
│  Height: 200px                                                         │
│  X-axis: Dates                                                         │
│  Y-axis: Count / Percentage                                            │
│  Lines: Tasks (agent color), Success % (green)                         │
│                                                                        │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│  │ Task Breakdown     │  │ Confidence Dist.   │  │ Time Saved      │  │
│  │ ────────────────── │  │ ────────────────── │  │ ─────────────── │  │
│  │ [Pie chart]        │  │ [Bar chart]        │  │                 │  │
│  │ Emails: 45%        │  │ High: 78%          │  │    47 hours     │  │
│  │ Updates: 30%       │  │ Medium: 18%        │  │   this month    │  │
│  │ Analysis: 15%      │  │ Low: 4%            │  │                 │  │
│  │ Other: 10%         │  │                    │  │ ≈ $2,350 value  │  │
│  └────────────────────┘  └────────────────────┘  └─────────────────┘  │
│                                                                        │
│                                              [Export Report]           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

MODAL FOOTER:
- Height: 64px
- Background: #FAFAFA
- Border-top: 1px solid #E5E5E5
- Display: flex, justify-content: space-between
- Left: "Last updated 2 min ago"
- Right: Primary action button per tab

ANIMATIONS:
- Modal enter: scale(0.95)→1, opacity 0→1, 200ms
- Tab switch: Content fade, 150ms
- Charts: Draw-in animation on tab visible

STATES TO SHOW:
1. Overview tab (default)
2. Activity tab with timeline
3. Configuration tab with form
4. Analytics tab with charts
```

---

## Prompt 24: AI-04 Agent Activity Feed

```
Create an HTML wireframe for the agent activity feed component in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Activity Feed
PURPOSE: Real-time feed of AI agent actions across the platform

LOCATION OPTIONS:
1. Dedicated page
2. Sidebar widget
3. Modal overlay

---

FULL PAGE LAYOUT:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Activity Feed                                          [⟳ Live]      │
│  Real-time updates from your AI team                                  │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────     │
│  Filter: [All Agents ▼] [All Types ▼] [All Status ▼]   🔍 Search     │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

HEADER STYLING:
- Title: 24px bold
- Subtitle: 14px #6B7280
- Live indicator: Green dot + "Live" text, pulsing
- Filters inline

---

ACTIVITY ITEM - STANDARD:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌────┐  Maya drafted an email                            2 min ago   │
│  │ 🐚 │  ─────────────────────────────────────────────────────────    │
│  └────┘  📧 "Follow-up: Enterprise Package Discussion"                │
│          To: john.smith@techcorp.com                                  │
│          Confidence: 94% · Auto-approved                              │
│                                                                        │
│          [View Email] [View in CRM]                                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

STANDARD ITEM STYLING:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 16px
- Margin-bottom: 12px
- Left border: 3px agent color (on hover or for emphasis)

ITEM COMPONENTS:
- Agent avatar: 40px, left side
- Action text: 15px #1a1a1a
  - Agent name: semibold, agent color
  - Action verb: normal weight
- Timestamp: 13px #9CA3AF, right side
- Divider: 1px #E5E5E5
- Details: 14px #6B7280
- Confidence badge: Inline
- Action buttons: Text style, right-aligned

---

ACTIVITY ITEM - COMPACT:
```
┌────────────────────────────────────────────────────────────────────────┐
│  🐚 Maya created contact "Sarah Johnson"           ✓ Auto    2m ago  │
└────────────────────────────────────────────────────────────────────────┘
```

COMPACT STYLING:
- Single line
- Height: 44px
- Padding: 8px 16px
- No border, subtle hover background
- Status: ✓ green, ⏳ amber, ✗ red

---

ACTIVITY ITEM - PENDING APPROVAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                      ⏳ Needs Review   │
│  ┌────┐  Atlas created a project proposal                 5 min ago  │
│  │ 🗺️ │  ─────────────────────────────────────────────────────────    │
│  └────┘  📄 "Q1 Marketing Campaign - Full Plan"                       │
│          Confidence: 72% · Requires your approval                     │
│                                                                        │
│          Preview:                                                      │
│          ┌──────────────────────────────────────────────────────┐     │
│          │ Executive Summary                                    │     │
│          │ This proposal outlines a comprehensive Q1...         │     │
│          │                                       [Show More ↓]  │     │
│          └──────────────────────────────────────────────────────┘     │
│                                                                        │
│                              [Reject]  [Request Edit]  [✓ Approve]    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

PENDING STYLING:
- Border-left: 4px #F59E0B (amber)
- Badge: "Needs Review" amber background
- Preview box: #F9FAFB background
- Action buttons prominent

---

ACTIVITY ITEM - ERROR:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                           ✗ Failed    │
│  ┌────┐  Echo failed to generate report                  10 min ago  │
│  │ 📊 │  ─────────────────────────────────────────────────────────    │
│  └────┘  📊 "Weekly Analytics Summary"                                │
│          Error: Data source connection timeout                        │
│                                                                        │
│                                              [Retry]  [View Details]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

ERROR STYLING:
- Border-left: 4px #EF4444 (red)
- Badge: "Failed" red background
- Error message: 13px #EF4444

---

ACTIVITY TYPES & ICONS:
- 📧 Email: Drafted, Sent, Opened
- 📝 Content: Created, Updated, Published
- 📄 Document: Generated, Reviewed, Signed
- 👤 Contact: Created, Updated, Merged
- 💼 Deal: Created, Stage changed, Won/Lost
- 📋 Task: Created, Completed, Overdue
- 📊 Report: Generated, Shared
- 🔄 Integration: Synced, Connected, Error
- 🎯 Routing: Assigned, Escalated

---

REAL-TIME UPDATES:
- New item animation: Slide down from top, fade in
- "New activity" banner when scrolled down:
```
┌────────────────────────────────────────┐
│  ↑ 3 new activities · Click to view   │
└────────────────────────────────────────┘
```
- Banner: Fixed top of feed, coral background, white text

---

GROUPING OPTIONS:
1. Chronological (default)
2. By Agent
3. By Type
4. By Status

GROUPED BY AGENT:
```
┌────────────────────────────────────────────────────────────────────────┐
│  🐚 Maya · 12 activities today                          [Collapse ▼]  │
│  ───────────────────────────────────────────────────────────────────   │
│  [Activity items...]                                                   │
│                                                                        │
│  🗺️ Atlas · 8 activities today                          [Expand ▶]   │
│  ───────────────────────────────────────────────────────────────────   │
└────────────────────────────────────────────────────────────────────────┘
```

---

SIDEBAR WIDGET VERSION:
- Width: 320px
- Fixed height: 400px
- Scrollable
- Header: "Recent Activity"
- Compact items only
- "View All →" link at bottom

EMPTY STATE:
- Illustration: Activity/timeline icon
- Text: "No recent activity"
- Subtext: "Your AI team is ready to work"

STATES TO SHOW:
1. Full page with mixed activity types
2. Pending approval items
3. Error state item
4. New activity banner
5. Sidebar widget version
```

---

## Prompt 25: AI-05 Agent Configuration

```
Create an HTML wireframe for the agent configuration page in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Configuration
PURPOSE: Detailed settings and customization for individual AI agents

PAGE LAYOUT:
- Full page or large modal
- Two-column: Navigation (240px) + Content
- Background: #FFFBF5

HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back to AI Team                                                    │
│                                                                        │
│  ┌────────┐                                                            │
│  │   🐚   │  Configure Maya                              [Save All]   │
│  └────────┘  CRM Agent                                                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

SIDEBAR NAVIGATION:
```
┌────────────────────┐
│ Configuration      │
│ ────────────────── │
│ ● General          │
│ ○ AI Model         │
│ ○ Behavior         │
│ ○ Permissions      │
│ ○ Integrations     │
│ ○ Notifications    │
│ ○ Advanced         │
│                    │
│ ────────────────── │
│ ⚠️ Danger Zone     │
└────────────────────┘
```

NAV STYLING:
- Width: 240px
- Background: #FFFFFF
- Border-right: 1px solid #E5E5E5
- Item padding: 12px 16px
- Active: #FF6B6B text, #FFF5F5 background
- Hover: #F9FAFB background

---

SECTION 1: GENERAL
```
┌────────────────────────────────────────────────────────────────────────┐
│  General Settings                                                      │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Display Name                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Maya                                                           │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  This is how the agent appears in chat and notifications              │
│                                                                        │
│  Role Description                                                      │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ CRM Agent                                                      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Avatar                                                                │
│  ┌────────┐                                                            │
│  │   🐚   │  [Change Emoji]  [Upload Image]                           │
│  └────────┘                                                            │
│                                                                        │
│  Theme Color                                                           │
│  ● #20B2AA (Current)                                                  │
│  [🔵] [🟢] [🟡] [🟠] [🔴] [🟣] [Custom...]                            │
│                                                                        │
│  Status                                                                │
│  ┌─────────────────────────────────────────┐                          │
│  │ ● Active                            ▼   │                          │
│  └─────────────────────────────────────────┘                          │
│  Options: Active, Paused, Maintenance                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

SECTION 2: AI MODEL
```
┌────────────────────────────────────────────────────────────────────────┐
│  AI Model Settings                                                     │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Primary Model                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Claude 3.5 Sonnet (Recommended)                            ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Best for: Complex reasoning, nuanced communication                    │
│  Cost: ~$0.003 per 1K tokens                                          │
│                                                                        │
│  Fallback Model                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Claude 3 Haiku (Fast)                                      ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Used when primary is unavailable or for simple tasks                  │
│                                                                        │
│  Temperature                                                           │
│  More Precise ━━━━━━━━━━━━━━●━━━━━━━━━━ More Creative                 │
│               0                0.7                    1                │
│  Current: 0.7 (Balanced)                                              │
│                                                                        │
│  Max Tokens                                                            │
│  ┌──────────────────────────┐                                         │
│  │ 4096                     │  tokens per response                    │
│  └──────────────────────────┘                                         │
│                                                                        │
│  Context Window                                                        │
│  [●] Use full context (100k tokens) - Better memory, higher cost      │
│  [ ] Use limited context (32k tokens) - Faster, lower cost            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

SECTION 3: BEHAVIOR
```
┌────────────────────────────────────────────────────────────────────────┐
│  Behavior Settings                                                     │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Automation Level                                                      │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  ○ Manual Review                                                      │
│    All actions require your approval before execution                  │
│                                                                        │
│  ◉ Smart Automation (Recommended)                                     │
│    Auto-approve high confidence actions (85%+)                        │
│    ┌─ Confidence threshold: [85]% ─────────────────────────────┐     │
│    └───────────────────────────────────────────────────────────┘     │
│                                                                        │
│  ○ Full Automation                                                    │
│    Approve all actions automatically                                   │
│    ⚠️ Not recommended for sensitive operations                        │
│                                                                        │
│  Response Style                                                        │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Tone                                                                  │
│  Formal ━━━━━━━━━●━━━━━━━━━━━━━━━━━━ Casual                           │
│                                                                        │
│  Detail Level                                                          │
│  Concise ━━━━━━━━━━━━━━●━━━━━━━━━━━━ Detailed                         │
│                                                                        │
│  Custom Instructions                                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Always reference the customer's company name in emails.        │   │
│  │ Use bullet points for lists longer than 3 items.               │   │
│  │ Include a clear call-to-action in follow-up emails.            │   │
│  │                                                                 │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  These instructions guide the agent's responses and actions            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

SECTION 4: INTEGRATIONS
```
┌────────────────────────────────────────────────────────────────────────┐
│  Connected Integrations                                                │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 📧 Gmail                                          ● Connected   │  │
│  │    john@company.com · Read & Send permissions                   │  │
│  │    Last sync: 2 minutes ago                                     │  │
│  │                                    [Configure]  [Disconnect]    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 💬 Slack                                          ● Connected   │  │
│  │    #sales-team, #crm-updates                                    │  │
│  │    Can post messages and read channels                          │  │
│  │                                    [Configure]  [Disconnect]    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 🔗 HubSpot                                        ○ Not Connected│  │
│  │    Sync contacts, deals, and activities                         │  │
│  │                                                    [Connect]    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  Available Integrations                                                │
│  ─────────────────────────────────────────────────────────────────     │
│  [Salesforce] [Pipedrive] [Calendly] [Zoom] [+12 more]                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

SECTION 7: DANGER ZONE
```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Danger Zone                                                       │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Reset Configuration                                                   │
│  Reset all settings to default values                                  │
│                                                 [Reset to Defaults]   │
│                                                                        │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Disable Agent                                                         │
│  Temporarily disable this agent. Can be re-enabled anytime.            │
│                                                    [Disable Agent]    │
│                                                                        │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Delete Agent                                                          │
│  Permanently remove this agent and all associated data.                │
│  This action cannot be undone.                                         │
│                                                    [Delete Agent]     │
│                                                    (Red button)        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

DANGER ZONE STYLING:
- Border: 1px solid #FCA5A5
- Background: #FEF2F2
- Buttons: Red outline or red solid for delete

SAVE BEHAVIOR:
- Auto-save with debounce (show "Saving..." indicator)
- Or explicit "Save" button per section
- Unsaved changes warning on navigation

STATES TO SHOW:
1. General settings section
2. AI Model configuration
3. Behavior with sliders
4. Integrations (connected + available)
5. Danger zone with confirmation modal
```

---

## Prompt 26: ST-01 Settings Layout

```
Create an HTML wireframe for the settings page layout in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Settings Page Layout
PURPOSE: Main structure for all settings screens

PAGE STRUCTURE:
- Sidebar navigation (left)
- Content area (right)
- Responsive: Stack on mobile

FULL LAYOUT:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐  ┌────────────────────────────────────────────────────┐ │
│  │                 │  │                                                    │ │
│  │  Settings       │  │  Section Title                          [Action]  │ │
│  │  ─────────────  │  │  Section description text                         │ │
│  │                 │  │                                                    │ │
│  │  ● Account      │  │  ────────────────────────────────────────────────  │ │
│  │  ○ Profile      │  │                                                    │ │
│  │  ○ Security     │  │  [Content Area]                                    │ │
│  │                 │  │                                                    │ │
│  │  Workspace      │  │                                                    │ │
│  │  ─────────────  │  │                                                    │ │
│  │  ○ General      │  │                                                    │ │
│  │  ○ Members      │  │                                                    │ │
│  │  ○ Billing      │  │                                                    │ │
│  │                 │  │                                                    │ │
│  │  AI & Automation│  │                                                    │ │
│  │  ─────────────  │  │                                                    │ │
│  │  ○ AI Providers │  │                                                    │ │
│  │  ○ API Keys     │  │                                                    │ │
│  │  ○ Automation   │  │                                                    │ │
│  │                 │  │                                                    │ │
│  │  Integrations   │  │                                                    │ │
│  │  ─────────────  │  │                                                    │ │
│  │  ○ Connected    │  │                                                    │ │
│  │  ○ Available    │  │                                                    │ │
│  │                 │  │                                                    │ │
│  └─────────────────┘  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

SIDEBAR:
- Width: 240px (fixed)
- Background: #FFFFFF
- Border-right: 1px solid #E5E5E5
- Padding: 24px 0
- Position: sticky, top: 0
- Height: 100vh (or content height)

SIDEBAR HEADER:
- "Settings" 18px semibold #1a1a1a
- Padding: 0 20px 16px

NAVIGATION GROUPS:
- Group label: 11px semibold uppercase #9CA3AF
- Letter-spacing: 0.5px
- Padding: 16px 20px 8px
- Margin-top: 8px (after first group)

NAV ITEMS:
- Height: 36px
- Padding: 8px 20px
- Font: 14px medium
- Color: #6B7280
- Border-radius: 0 (full width) or 8px (with margin)
- Hover: #F9FAFB background, #1a1a1a text
- Active: #FFF5F5 background, #FF6B6B text
- Active indicator: 3px left border OR filled dot

CONTENT AREA:
- Flex: 1
- Min-width: 0
- Max-width: 800px
- Padding: 32px 40px
- Background: #FFFBF5

CONTENT HEADER:
- Title: 24px bold #1a1a1a
- Description: 14px #6B7280
- Action button: Right-aligned (optional)
- Margin-bottom: 24px
- Border-bottom: 1px solid #E5E5E5
- Padding-bottom: 24px

SETTINGS CARD:
```
┌────────────────────────────────────────────────────────────────────────┐
│  Card Title                                                            │
│  Card description explaining what this setting controls                │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  [Setting content - form fields, toggles, etc.]                        │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

CARD STYLING:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 20px 24px
- Margin-bottom: 20px

SETTING ROW (Inside card):
```
┌────────────────────────────────────────────────────────────────────────┐
│  Setting Label                                           [Control]     │
│  Description of what this setting does                                 │
└────────────────────────────────────────────────────────────────────────┘
```

ROW STYLING:
- Display: flex, justify-content: space-between
- Align-items: flex-start
- Padding: 16px 0
- Border-bottom: 1px solid #F3F4F6 (except last)
- Label: 15px medium #1a1a1a
- Description: 13px #6B7280, margin-top: 4px

COMMON CONTROLS:
1. Toggle switch
2. Dropdown select
3. Text input
4. Radio group
5. Checkbox
6. Button

MOBILE LAYOUT (< 768px):
- Sidebar becomes top tabs or hamburger menu
- Content full width
- Padding reduced to 16px

BREADCRUMB (Optional):
- "Settings / Account / Profile"
- 13px #6B7280
- Links in coral on hover
- Above page title

UNSAVED CHANGES BAR:
```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚠️ You have unsaved changes                    [Discard]  [Save]     │
└────────────────────────────────────────────────────────────────────────┘
```
- Position: fixed bottom or sticky
- Background: #FFFBEB (amber tint)
- Border-top: 1px solid #FCD34D

STATES TO SHOW:
1. Full settings layout with sidebar
2. Active navigation state
3. Settings card with various controls
4. Mobile layout
5. Unsaved changes bar
```

---

## Prompt 27: ST-02 API Keys Management

```
Create an HTML wireframe for API keys management in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: API Keys Management
PURPOSE: Create, view, and manage API keys for integrations

PAGE HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│  API Keys                                           [+ Create New Key] │
│  Manage API keys for external integrations                             │
└────────────────────────────────────────────────────────────────────────┘
```

SECURITY NOTICE:
```
┌────────────────────────────────────────────────────────────────────────┐
│  🔒 Security Notice                                                    │
│  API keys provide full access to your account. Keep them secure and    │
│  never share them publicly. Rotate keys periodically for security.     │
└────────────────────────────────────────────────────────────────────────┘
```

NOTICE STYLING:
- Background: #EFF6FF (blue tint)
- Border: 1px solid #BFDBFE
- Border-radius: 8px
- Padding: 12px 16px
- Icon: 🔒 or shield icon
- Text: 14px #1E40AF

API KEYS LIST:
```
┌────────────────────────────────────────────────────────────────────────┐
│  Active Keys (3)                                                       │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  Production API Key                              ● Active        │ │
│  │  ─────────────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Key:  sk_live_••••••••••••••••••••4f2a          [👁️] [📋]       │ │
│  │                                                                  │ │
│  │  Created: Dec 15, 2024 · Last used: 2 hours ago                 │ │
│  │  Permissions: Full access                                        │ │
│  │                                                                  │ │
│  │                                          [Rotate]  [Revoke]     │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  Development API Key                             ● Active        │ │
│  │  ─────────────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Key:  sk_test_••••••••••••••••••••8b3c          [👁️] [📋]       │ │
│  │                                                                  │ │
│  │  Created: Nov 28, 2024 · Last used: 5 days ago                  │ │
│  │  Permissions: Read only                                          │ │
│  │                                                                  │ │
│  │                                          [Rotate]  [Revoke]     │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

KEY CARD STYLING:
- Background: #FFFFFF
- Border: 1px solid #E5E5E5
- Border-radius: 12px
- Padding: 20px
- Margin-bottom: 16px

KEY DISPLAY:
- Font: JetBrains Mono (monospace)
- Size: 14px
- Background: #F9FAFB
- Padding: 8px 12px
- Border-radius: 6px
- Masked by default (dots)
- Show button: Eye icon, reveals full key
- Copy button: Clipboard icon

KEY METADATA:
- Created date: 13px #6B7280
- Last used: 13px #6B7280, green if recent
- Permissions: Badge style

STATUS BADGES:
- Active: Green dot + "Active"
- Expiring: Amber + "Expires in 7 days"
- Revoked: Red + "Revoked"

ACTION BUTTONS:
- Rotate: Outline button
- Revoke: Red text button
- Both require confirmation

---

CREATE NEW KEY MODAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Create API Key                                                [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Key Name                                                              │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Production API Key                                             │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  A descriptive name to identify this key                              │
│                                                                        │
│  Environment                                                           │
│  ◉ Production (sk_live_...)                                           │
│  ○ Development (sk_test_...)                                          │
│                                                                        │
│  Permissions                                                           │
│  [✓] Read - View data                                                 │
│  [✓] Write - Create and update data                                   │
│  [ ] Delete - Remove data                                             │
│  [ ] Admin - Full account access                                      │
│                                                                        │
│  Expiration                                                            │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Never                                                       ▼  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Options: Never, 30 days, 90 days, 1 year, Custom                     │
│                                                                        │
│                                           [Cancel]  [Create Key]      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

NEW KEY CREATED MODAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                          ✓ Key Created                                │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Your new API key has been created. Copy it now - you won't be able   │
│  to see it again!                                                      │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6  │   │
│  │                                                         [📋]   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ⚠️ This key will only be shown once. Store it securely.             │
│                                                                        │
│                                               [Done, I've copied it]  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

KEY REVEAL STYLING:
- Full key shown
- Large copy button
- Warning icon and text prominent
- Button confirms user has copied

---

REVOKE CONFIRMATION:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Revoke API Key?                                               [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Are you sure you want to revoke "Production API Key"?                │
│                                                                        │
│  This will immediately invalidate the key. Any applications using     │
│  this key will lose access.                                            │
│                                                                        │
│  Type the key name to confirm:                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│                                    [Cancel]  [Revoke Key] (disabled)  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

REVOKE STYLING:
- Destructive action pattern
- Type to confirm
- Button disabled until name matches
- Red "Revoke Key" button when enabled

USAGE STATS (Optional section):
```
┌────────────────────────────────────────────────────────────────────────┐
│  API Usage (Last 30 days)                                              │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  [Simple bar chart showing requests per day]                           │
│                                                                        │
│  Total requests: 12,847                                                │
│  Avg. latency: 145ms                                                   │
│  Error rate: 0.3%                                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

STATES TO SHOW:
1. Keys list with active keys
2. Create new key modal
3. Key created success (showing full key)
4. Revoke confirmation modal
5. Empty state (no keys)
```

---

## Prompt 28: ST-03 AI Provider Setup

```
Create an HTML wireframe for AI provider configuration in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: AI Provider Setup
PURPOSE: Configure and manage AI model providers (Anthropic, OpenAI, etc.)

PAGE HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│  AI Providers                                                          │
│  Configure AI models and API connections                               │
└────────────────────────────────────────────────────────────────────────┘
```

PROVIDER CARDS:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  [Anthropic Logo]                                 ● Connected    │ │
│  │                                                                  │ │
│  │  Anthropic (Claude)                               [Recommended]  │ │
│  │  Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku               │ │
│  │                                                                  │ │
│  │  ─────────────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  API Key: sk-ant-••••••••••••••••4f2a             [Edit] [Test] │ │
│  │  Status: Verified · Last checked 5 min ago                      │ │
│  │                                                                  │ │
│  │  Usage this month: $127.45 / $500 limit                         │ │
│  │  ━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░ 25%                             │ │
│  │                                                                  │ │
│  │                                    [View Usage]  [Configure]     │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  [OpenAI Logo]                                    ○ Not Connected│ │
│  │                                                                  │ │
│  │  OpenAI (GPT)                                                    │ │
│  │  GPT-4, GPT-4 Turbo, GPT-3.5 Turbo                              │ │
│  │                                                                  │ │
│  │  ─────────────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Connect your OpenAI account to use GPT models                   │ │
│  │                                                                  │ │
│  │                                              [Connect OpenAI]    │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  [Google Logo]                                    ○ Not Connected│ │
│  │                                                                  │ │
│  │  Google (Gemini)                                                 │ │
│  │  Gemini Pro, Gemini Ultra                                        │ │
│  │                                                                  │ │
│  │                                              [Connect Google]    │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

CONNECTED PROVIDER STYLING:
- Border-left: 4px solid #10B981 (green)
- Status: Green dot + "Connected"
- Shows API key (masked), usage, controls

NOT CONNECTED STYLING:
- Border-left: 4px solid #E5E5E5
- Status: Gray dot + "Not Connected"
- Single CTA button

RECOMMENDED BADGE:
- Background: #DBEAFE
- Color: #1E40AF
- Font: 11px semibold
- Padding: 2px 8px
- Border-radius: 9999px

---

CONNECT PROVIDER MODAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Connect Anthropic                                             [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  [Anthropic Logo]                                                      │
│                                                                        │
│  Enter your Anthropic API key to connect Claude models.               │
│                                                                        │
│  API Key                                                               │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ sk-ant-api03-                                                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Get your API key from console.anthropic.com                          │
│                                  [↗ Get API Key]                      │
│                                                                        │
│  Monthly Spend Limit (Optional)                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ $ 500                                                          │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  You'll be notified when approaching this limit                       │
│                                                                        │
│  [✓] Set as default provider for new agents                           │
│                                                                        │
│                                      [Cancel]  [Connect & Verify]     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

VERIFICATION STATES:

VERIFYING:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                    ◌ Verifying API key...                             │
│                                                                        │
│  Checking connection to Anthropic                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

SUCCESS:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                    ✓ Connected Successfully                           │
│                                                                        │
│  Your Anthropic account is now connected.                              │
│                                                                        │
│  Available models:                                                     │
│  • Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)                     │
│  • Claude 3 Opus (claude-3-opus-20240229)                             │
│  • Claude 3 Haiku (claude-3-haiku-20240307)                           │
│                                                                        │
│                                                   [Done]              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

ERROR:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                    ✗ Connection Failed                                │
│                                                                        │
│  Invalid API key. Please check and try again.                          │
│                                                                        │
│  Common issues:                                                        │
│  • API key may have expired                                            │
│  • Key may not have required permissions                               │
│  • Rate limit may have been exceeded                                   │
│                                                                        │
│                                    [Try Again]  [Get Help]            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

PROVIDER CONFIGURATION:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Anthropic Configuration                                       [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Default Model                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Claude 3.5 Sonnet                                          ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Used when no specific model is requested                              │
│                                                                        │
│  Fallback Model                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Claude 3 Haiku                                             ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  Used when primary model is unavailable or rate limited               │
│                                                                        │
│  Rate Limiting                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│  Max requests per minute: [60]                                        │
│  Max tokens per minute: [100000]                                      │
│                                                                        │
│  Spending Controls                                                     │
│  ─────────────────────────────────────────────────────────────────     │
│  Monthly limit: $[500]                                                │
│  [✓] Pause agents when limit reached                                  │
│  [✓] Send alert at 80% of limit                                       │
│                                                                        │
│                                        [Cancel]  [Save Configuration] │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

MODEL COMPARISON TABLE:
```
┌────────────────────────────────────────────────────────────────────────┐
│  Available Models                                                      │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Model              │ Speed    │ Quality  │ Cost      │ Best For      │
│  ─────────────────────────────────────────────────────────────────     │
│  Claude 3.5 Sonnet │ Fast     │ High     │ $3/1M tok │ General use   │
│  Claude 3 Opus     │ Slower   │ Highest  │ $15/1M    │ Complex tasks │
│  Claude 3 Haiku    │ Fastest  │ Good     │ $0.25/1M  │ Simple tasks  │
│  ─────────────────────────────────────────────────────────────────     │
│  GPT-4 Turbo       │ Medium   │ High     │ $10/1M    │ Analysis      │
│  GPT-3.5 Turbo     │ Fastest  │ Medium   │ $0.50/1M  │ Quick tasks   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

TABLE STYLING:
- Header: 12px semibold #6B7280
- Cells: 14px #1a1a1a
- Alternating row background
- Sortable columns

STATES TO SHOW:
1. Provider list (mix of connected/not connected)
2. Connect modal with API key input
3. Verification in progress
4. Success/error states
5. Configuration modal
```

---

## Prompt 29: ST-04 Agent Model Preferences

```
Create an HTML wireframe for agent model preferences settings in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Agent Model Preferences
PURPOSE: Configure which AI models each agent uses and their settings

PAGE HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│  Agent Model Preferences                                               │
│  Configure AI models for each agent in your team                       │
└────────────────────────────────────────────────────────────────────────┘
```

GLOBAL DEFAULTS CARD:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  🌐 Global Defaults                                                    │
│  These settings apply to all agents unless overridden                  │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Default Provider                                                      │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Anthropic (Claude)                                         ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Default Model                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Claude 3.5 Sonnet                                          ▼   │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Default Temperature                               0.7                 │
│  ━━━━━━━━━━━━━━━━━━━━━●━━━━━━━━━━                                      │
│  0 (Precise)                           1 (Creative)                    │
│                                                                        │
│                                              [Reset to Defaults]       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

AGENT-SPECIFIC SETTINGS:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Agent-Specific Settings                                               │
│  Override global defaults for individual agents                        │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  ┌────┐  Hub 🎯                                                  │ │
│  │  │    │  Orchestrator                              [Using Global]│ │
│  │  └────┘  ─────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Model: Claude 3.5 Sonnet (inherited)                           │ │
│  │  Temperature: 0.7 (inherited)                                    │ │
│  │                                                                  │ │
│  │                                              [Customize ▼]       │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  ┌────┐  Maya 🐚                                                 │ │
│  │  │    │  CRM Agent                                  [Customized] │ │
│  │  └────┘  ─────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Model: Claude 3.5 Sonnet ✓                                     │ │
│  │  Temperature: 0.5 (more precise for CRM tasks)                  │ │
│  │  Custom instructions: "Always reference customer name..."       │ │
│  │                                                                  │ │
│  │                                   [Edit] [Reset to Global]       │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  ┌────┐  Atlas 🗺️                                                │ │
│  │  │    │  Project Manager                            [Customized] │ │
│  │  └────┘  ─────────────────────────────────────────────────────   │ │
│  │                                                                  │ │
│  │  Model: Claude 3 Opus (for complex planning)                    │ │
│  │  Temperature: 0.3 (very precise for schedules)                  │ │
│  │  Max tokens: 8192 (for longer documents)                        │ │
│  │                                                                  │ │
│  │                                   [Edit] [Reset to Global]       │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

BADGES:
- [Using Global]: Gray badge, indicates inheritance
- [Customized]: Coral badge, indicates override

---

CUSTOMIZE AGENT MODAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Customize Maya's Model Settings                               [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌────┐                                                                │
│  │ 🐚 │  Maya · CRM Agent                                             │
│  └────┘                                                                │
│                                                                        │
│  Provider                                                              │
│  ○ Use global default (Anthropic)                                     │
│  ◉ Override:                                                          │
│    ┌────────────────────────────────────────────────────────────┐     │
│    │ Anthropic                                              ▼   │     │
│    └────────────────────────────────────────────────────────────┘     │
│                                                                        │
│  Model                                                                 │
│  ○ Use global default (Claude 3.5 Sonnet)                             │
│  ◉ Override:                                                          │
│    ┌────────────────────────────────────────────────────────────┐     │
│    │ Claude 3.5 Sonnet                                      ▼   │     │
│    └────────────────────────────────────────────────────────────┘     │
│                                                                        │
│  Temperature                                                           │
│  ○ Use global default (0.7)                                           │
│  ◉ Override: 0.5                                                      │
│    ━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━                                   │
│    💡 Lower temperature recommended for CRM tasks                     │
│                                                                        │
│  Max Output Tokens                                                     │
│  ○ Use global default (4096)                                          │
│  ◉ Override: [2048]                                                   │
│                                                                        │
│  Custom Instructions                                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ For Maya specifically:                                         │   │
│  │ - Always use the customer's first name                         │   │
│  │ - Keep emails under 150 words                                  │   │
│  │ - Include a clear call-to-action                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│  These instructions are appended to Maya's base prompt               │
│                                                                        │
│                                         [Cancel]  [Save Settings]     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

MODEL RECOMMENDATIONS:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  💡 Model Recommendations                                              │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Based on agent roles, we recommend:                                   │
│                                                                        │
│  Hub (Orchestrator)                                                    │
│  └─ Claude 3.5 Sonnet · Temp 0.7 · Fast routing decisions             │
│                                                                        │
│  Maya (CRM)                                                            │
│  └─ Claude 3.5 Sonnet · Temp 0.5 · Precise customer comms             │
│                                                                        │
│  Atlas (PM)                                                            │
│  └─ Claude 3 Opus · Temp 0.3 · Complex planning & scheduling          │
│                                                                        │
│  Sage (Finance)                                                        │
│  └─ Claude 3 Opus · Temp 0.2 · Accuracy critical for numbers          │
│                                                                        │
│  Nova (Marketing)                                                      │
│  └─ Claude 3.5 Sonnet · Temp 0.8 · Creative content generation        │
│                                                                        │
│  Echo (Analytics)                                                      │
│  └─ Claude 3 Haiku · Temp 0.3 · Fast data processing                  │
│                                                                        │
│                                        [Apply All Recommendations]     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

RECOMMENDATION STYLING:
- Background: #F0FDF4 (green tint)
- Border: 1px solid #BBF7D0
- Tree structure showing agent → model
- "Apply All" button applies recommendations

---

COST IMPACT PREVIEW:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  📊 Estimated Monthly Cost Impact                                      │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Current configuration: ~$150/month                                    │
│  With recommendations: ~$180/month (+$30)                              │
│                                                                        │
│  Cost breakdown:                                                       │
│  Hub   ━━━━━━━━░░  $25    (Sonnet)                                    │
│  Maya  ━━━━━━━░░░  $35    (Sonnet)                                    │
│  Atlas ━━━━━━━━━━  $60    (Opus) ← Higher cost model                  │
│  Sage  ━━━━━━━━━░  $40    (Opus)                                      │
│  Nova  ━━━━░░░░░░  $15    (Sonnet)                                    │
│  Echo  ━━░░░░░░░░  $5     (Haiku)                                     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

STATES TO SHOW:
1. Global defaults card
2. Agent list with mixed inherited/customized
3. Customize modal for one agent
4. Recommendations panel
5. Cost preview
```

---

## Prompt 30: ST-05 Usage & Billing

```
Create an HTML wireframe for usage and billing settings in a premium SaaS application.

DESIGN SYSTEM:
[Paste Global Design System above]

COMPONENT: Usage & Billing
PURPOSE: View usage metrics, manage subscription, and billing details

PAGE HEADER:
```
┌────────────────────────────────────────────────────────────────────────┐
│  Usage & Billing                                                       │
│  Monitor usage and manage your subscription                            │
└────────────────────────────────────────────────────────────────────────┘
```

CURRENT PLAN CARD:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Current Plan                                                          │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  🚀 Professional Plan                           $99/month        │ │
│  │                                                                  │ │
│  │  • 6 AI Agents included                                         │ │
│  │  • 100,000 AI tokens/month                                      │ │
│  │  • Unlimited team members                                        │ │
│  │  • Priority support                                              │ │
│  │  • Advanced analytics                                            │ │
│  │                                                                  │ │
│  │  Next billing date: January 1, 2025                             │ │
│  │                                                                  │ │
│  │                             [Change Plan]  [Cancel Subscription] │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

PLAN CARD STYLING:
- Featured border: 2px solid #FF6B6B (for current plan)
- Plan name: 20px bold
- Price: 20px bold, right-aligned
- Features: Checkmarks or bullets
- Actions at bottom

---

USAGE OVERVIEW:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Usage This Month                                  Resets in 5 days   │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  AI Tokens                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░  68,420 / 100,000  │
│                                                              68.4%    │
│                                                                        │
│  API Requests                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░  12,847 / 50,000   │
│                                                              25.7%    │
│                                                                        │
│  Storage                                                               │
│  ━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  2.4 GB / 10 GB    │
│                                                              24.0%    │
│                                                                        │
│  Team Members                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  8 / Unlimited     │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

PROGRESS BAR STYLING:
- Height: 8px
- Background: #E5E5E5
- Fill: Gradient based on usage
  - 0-70%: #10B981 (green)
  - 70-90%: #F59E0B (amber)
  - 90%+: #EF4444 (red)
- Border-radius: 4px

---

USAGE BREAKDOWN:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Token Usage by Agent                            [7 days ▼] [Export]  │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  [Line chart showing token usage over time]                            │
│  Height: 200px                                                         │
│  Lines colored by agent                                                │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                        │
│  Agent Breakdown                                                       │
│                                                                        │
│  🎯 Hub         ━━━━━━━━━━━━━━━━━━━━━━━░░░░░  18,240 tokens  (27%)   │
│  🐚 Maya        ━━━━━━━━━━━━━━━━━━━━━━░░░░░░  16,420 tokens  (24%)   │
│  🗺️ Atlas       ━━━━━━━━━━━━━━━━━━░░░░░░░░░░  14,100 tokens  (21%)   │
│  ✨ Nova        ━━━━━━━━━━━━━━░░░░░░░░░░░░░░  10,840 tokens  (16%)   │
│  🌿 Sage        ━━━━━━━━░░░░░░░░░░░░░░░░░░░░   5,420 tokens   (8%)   │
│  📊 Echo        ━━━━░░░░░░░░░░░░░░░░░░░░░░░░   3,400 tokens   (5%)   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

BILLING HISTORY:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Billing History                                          [Download All]│
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  Invoice          │ Date           │ Amount    │ Status   │ Action    │
│  ─────────────────────────────────────────────────────────────────     │
│  INV-2024-012     │ Dec 1, 2024    │ $99.00    │ ● Paid   │ [PDF]     │
│  INV-2024-011     │ Nov 1, 2024    │ $99.00    │ ● Paid   │ [PDF]     │
│  INV-2024-010     │ Oct 1, 2024    │ $99.00    │ ● Paid   │ [PDF]     │
│  INV-2024-009     │ Sep 1, 2024    │ $79.00    │ ● Paid   │ [PDF]     │
│  INV-2024-008     │ Aug 1, 2024    │ $79.00    │ ● Paid   │ [PDF]     │
│                                                                        │
│                                              [Load More]               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

TABLE STYLING:
- Header: 12px semibold #6B7280
- Rows: 14px #1a1a1a
- Status: Green dot for paid, amber for pending, red for failed
- PDF: Download icon button

---

PAYMENT METHOD:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Payment Method                                                        │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  💳 Visa ending in 4242                                         │ │
│  │     Expires 12/2026                                              │ │
│  │                                                                  │ │
│  │                                    [Update]  [Remove]            │ │
│  │                                                                  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [+ Add Payment Method]                                                │
│                                                                        │
│  Billing Address                                                       │
│  ───────────────────────────────────────────────────────────────────   │
│  Acme Corp                                                             │
│  123 Business St, Suite 100                                            │
│  San Francisco, CA 94105                                               │
│  United States                                            [Edit]       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

UPGRADE PROMPT (When approaching limits):
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  ⚠️ Approaching Token Limit                                           │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  You've used 68% of your monthly tokens with 5 days remaining.         │
│  At your current pace, you may exceed your limit.                      │
│                                                                        │
│  Options:                                                              │
│  • Upgrade to Business plan for 500,000 tokens ($199/mo)              │
│  • Purchase additional tokens ($10 per 10,000)                         │
│  • Wait for monthly reset on January 1                                 │
│                                                                        │
│                        [Purchase Tokens]  [Upgrade Plan]               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

PROMPT STYLING:
- Background: #FFFBEB (amber tint)
- Border: 1px solid #FCD34D
- Warning icon prominent
- Clear action buttons

---

PLAN COMPARISON MODAL:
```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  Choose Your Plan                                              [✕]    │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │                 │  │    ★ Popular    │  │                 │        │
│  │    Starter      │  │  Professional   │  │    Business     │        │
│  │                 │  │                 │  │                 │        │
│  │    $29/mo       │  │    $99/mo       │  │    $199/mo      │        │
│  │                 │  │                 │  │                 │        │
│  │  2 Agents       │  │  6 Agents       │  │  Unlimited      │        │
│  │  25k tokens     │  │  100k tokens    │  │  500k tokens    │        │
│  │  5 team members │  │  Unlimited      │  │  Unlimited      │        │
│  │  Email support  │  │  Priority       │  │  Dedicated      │        │
│  │                 │  │                 │  │                 │        │
│  │  [Downgrade]    │  │  Current Plan   │  │   [Upgrade]     │        │
│  │                 │  │                 │  │                 │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                        │
│                        [Contact Sales for Enterprise]                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

PLAN CARD STYLING:
- Equal width columns
- Popular: Coral border, "Popular" badge
- Current: Grayed out button "Current Plan"
- Upgrade: Coral solid button
- Downgrade: Gray outline button

STATES TO SHOW:
1. Full billing page with current plan
2. Usage meters at various levels
3. Usage breakdown chart
4. Billing history table
5. Upgrade prompt
6. Plan comparison modal
```

---

## Batch 3 Summary

| # | Wireframe ID | Component Name | Complexity |
|---|--------------|----------------|------------|
| 21 | AI-01 | AI Team Overview | High |
| 22 | AI-02 | Agent Card Component | Medium |
| 23 | AI-03 | Agent Detail Modal | High |
| 24 | AI-04 | Agent Activity Feed | High |
| 25 | AI-05 | Agent Configuration | High |
| 26 | ST-01 | Settings Layout | Medium |
| 27 | ST-02 | API Keys Management | High |
| 28 | ST-03 | AI Provider Setup | High |
| 29 | ST-04 | Agent Model Preferences | Medium |
| 30 | ST-05 | Usage & Billing | High |

---

## Next Batch Preview

**Batch 4** will cover:
- ST-06 through ST-08 (Settings remaining)
- AU-01 through AU-06 (Authentication)
- DB-01 (Dashboard)

---

*End of Batch 3*
