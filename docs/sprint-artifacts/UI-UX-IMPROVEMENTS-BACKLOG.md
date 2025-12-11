# HYVVE Platform - UI/UX Improvements Backlog

**Created:** December 11, 2025
**Source:** Comprehensive User Testing + Style Guide Audit + Product Owner Feedback
**Status:** Ready for Sprint Planning

---

## Priority Legend
- **P0** - Critical / Blocking
- **P1** - High Priority / Next Sprint
- **P2** - Medium Priority / Future Sprint
- **P3** - Low Priority / Nice to Have

---

## 1. Navigation & Information Architecture

### 1.1 Main Menu Restructuring (P1)
**Current State:** Menu shows Dashboard, Approvals, AI Team, Settings + Modules (CRM, Projects)

**Required Changes:**
- [ ] Add "Businesses" tab to main menu (not under Modules)
- [ ] Under Businesses, show sub-navigation:
  - [ ] Portfolio (list of all businesses)
  - [ ] Planning (business planning pages)
  - [ ] Branding (brand development pages)
  - [ ] Validation (business validation pages)
- [ ] Move "Your Businesses" from Dashboard to dedicated `/businesses` route
- [ ] Consider if `grid_view` icon text should be hidden in production (currently shows "Dashboard" label)

### 1.2 Sidebar Icon Labels - STYLE GUIDE DEVIATION (P1)
**Issue:** Sidebar shows Material Icon names (`grid_view`, `check_circle`, `smart_toy`, `settings`, `group`, `folder_open`) instead of proper labels

**Style Guide Reference:** Section 7.3 - Nav items should show proper text labels
```
Per Style Guide:
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
```

**Required Fix:**
- [ ] Replace `grid_view` → "Dashboard"
- [ ] Replace `check_circle` → "Approvals"
- [ ] Replace `smart_toy` → "AI Team"
- [ ] Replace `settings` → "Settings"
- [ ] Replace `group` → "CRM"
- [ ] Replace `folder_open` → "Projects"
- [ ] Use proper icon components (Lucide Icons per style guide) instead of text strings

### 1.3 Coming Soon Module Indicators (P3)
- [ ] Add tooltips to CRM/Projects orange dots explaining "Coming Soon"
- [ ] Or remove orange dots and rely on Coming Soon pages

---

## 2. Landing Page & User Flow

### 2.1 Post-Sign-In Landing Page (P0)
**Current State:** After sign-in, user lands on Dashboard with "No Workspace Selected"

**Wireframe Reference:** `BO-01 Portfolio Dashboard with Business Cards`
- HTML: `docs/design/wireframes/Finished wireframes and html files/bo-01_portfolio_dashboard_with_business_cards/code.html`

**Required Changes:**
- [ ] Create dedicated landing page at `/businesses` or `/portfolio`
- [ ] Show all user's businesses as cards/grid (see wireframe for card design)
- [ ] Add prominent "Start New Business" button → links to `/onboarding/wizard`
- [ ] Show business status indicators (Validation, Planning, Branding, Active)
- [ ] Add quick actions per business card (Continue, View, Archive)
- [ ] Business card shows: Logo, Name, Status badge (Active/Draft/Paused), Validation Score, Phase progress dots, Last updated

**Portfolio Layout from Wireframe:**
```
Your Businesses                                    [+ Add Business]

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 🏢 Acme Corp     │  │ 🏢 TechStart     │  │ ➕ Add New       │
│ ━━━━━━━━━━━━━━━  │  │ ━━━━━━━━━━━━━━━  │  │  Start a new     │
│ Validation: 85%  │  │ Validation: 40%  │  │  business        │
│ Planning: 60%    │  │ Planning: 0%     │  │  validation      │
│ Branding: 30%    │  │ Branding: 0%     │  │                  │
│ [Continue →]     │  │ [Continue →]     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.2 User Onboarding Flow - Sign-Up to Dashboard (P0)
**Wireframe Reference:** `AU-05 Onboarding Wizard`
- Described in WIREFRAME-INDEX.md lines 887-960

**4-Step Onboarding Wizard (after sign-up):**

**Step 1: Create Workspace**
```
● ○ ○ ○                                    Step 1/4
Let's set up your workspace

Workspace name: [Acme Corp            ]
Your workspace URL: hyvve.app/acme-corp

                                      [Continue →]
```

**Step 2: Add AI Provider (BYOAI Setup)**
```
○ ● ○ ○                                    Step 2/4
Connect your AI provider

   🧠 Claude (Anthropic)  ←  [Recommended]
   🤖 OpenAI
   💎 Google Gemini
   🔮 DeepSeek
   🌐 OpenRouter

API Key: [sk-ant-...                      ]

[Test Key]                   [← Back] [Continue →]
```

**Step 3: Meet Your AI Team**
```
○ ○ ● ○                                    Step 3/4
Meet your AI team

 🎯 Hub          Your orchestrator
 🐚 Maya         CRM & relationships
 🗺️ Atlas        Projects & tasks
 ✨ Nova         Marketing & content
 📊 Echo         Analytics & insights

 They'll handle 90% of your business operations
 while you focus on what matters.

                              [← Back] [Continue →]
```

**Step 4: Ready!**
- Welcome message
- Quick tour option
- "Go to Dashboard" CTA

**Implementation Tasks:**
- [ ] Create `/onboarding/account-setup` route for 4-step wizard
- [ ] Step 1: Workspace creation form
- [ ] Step 2: BYOAI API key setup with provider selection
- [ ] Step 3: AI team introduction carousel
- [ ] Step 4: Success state with dashboard redirect
- [ ] Progress indicator (4 dots/steps)
- [ ] Back/Continue navigation
- [ ] Skip option (but warn about limited functionality)

### 2.3 Sign-In Flow Update (P1)
- [ ] After successful sign-in, redirect to `/businesses` (not `/dashboard`)
- [ ] If no businesses exist, show empty state with "Create Your First Business" CTA
- [ ] If onboarding incomplete, show "Continue Setup" prompt

### 2.4 Workspace vs Business Clarification (P2)
**Issue:** "No Workspace Selected" message is confusing alongside "Your Businesses"

- [ ] Clarify relationship between Workspaces and Businesses in UI
- [ ] Auto-select workspace when user has only one
- [ ] Or merge concepts if they're the same thing

---

## 3. Chat Panel Enhancements

### 3.1 Chat Panel Positions (P1)
**Current State:** Fixed right-side panel

**Required Positions:**
- [ ] **Position 1: Right Panel** (current) - Full height on right side
- [ ] **Position 2: Bottom Horizontal** - Docked at bottom, full width, ~200px height
- [ ] **Position 3: Floating Window** - Draggable, resizable window
- [ ] **Position 4: Collapsed** - Minimized to icon/button only

**Implementation:**
- [ ] Add position toggle in chat header (3-dot menu or dedicated buttons)
- [ ] Remember user preference in localStorage
- [ ] Animate transitions between positions
- [ ] Keyboard shortcut to toggle (e.g., `Ctrl+Shift+C`)

### 3.2 Chat Panel Responsive Behavior (P1)
- [ ] Auto-collapse chat panel on screens < 1024px
- [ ] Show floating action button to open chat when collapsed
- [ ] Full-screen modal mode on mobile (< 768px)

### 3.3 Chat Functionality - Agent Integration (P0)
**Current State:** Chat shows placeholder/demo messages only

**Required:**
- [ ] Connect chat to real agent backend (Agno/FastAPI)
- [ ] Implement message sending functionality
- [ ] Show typing indicators when agent is processing
- [ ] Support streaming responses
- [ ] Handle agent errors gracefully
- [ ] Persist chat history per session/business
- [ ] Support @mentions for specific agents
- [ ] File attachment upload and processing

### 3.4 Chat Agent Selection (P1)
- [ ] Allow switching between agent teams in chat header
- [ ] Show available agents: Hub (orchestrator), Vera (Validation), etc.
- [ ] Context-aware agent suggestions based on current page

---

## 4. Settings Pages - Full Implementation

### 4.1 Account Settings (P0)

#### Profile Page (`/settings`)
- [ ] Display current user info (name, email, avatar)
- [ ] Edit name functionality
- [ ] Avatar upload/change
- [ ] Email display (read-only or change with verification)
- [ ] Connected accounts display (OAuth providers)
- [ ] Save changes with success toast

#### Security Page (`/settings/security`)
- [ ] Current password verification
- [ ] Change password form
- [ ] Password strength indicator
- [ ] Two-factor authentication setup/management
- [ ] Show 2FA status (enabled/disabled)
- [ ] Backup codes generation and display
- [ ] Recent security events log

#### Sessions Page (`/settings/sessions`)
- [ ] List all active sessions
- [ ] Show: Device, Browser, Location, Last Active, IP
- [ ] Current session indicator
- [ ] "Sign out" button per session
- [ ] "Sign out all other sessions" button
- [ ] Session creation timestamps

### 4.2 Workspace Settings (P0)

#### General Page (`/settings/workspace`)
- [ ] Workspace name edit
- [ ] Workspace slug/URL display
- [ ] Timezone selection dropdown
- [ ] Default language selection
- [ ] Workspace avatar/logo upload
- [ ] Delete workspace (with confirmation)
- [ ] Save changes functionality

#### Members Page (`/settings/workspace/members`)
**Current State:** Shows "No workspace selected"

- [ ] Fix workspace context loading
- [ ] Display members table with: Name, Email, Role, Status, Last Active, Actions
- [ ] Invite member modal (email input, role selection)
- [ ] Pending invitations section
- [ ] Role change dropdown per member
- [ ] Remove member with confirmation
- [ ] Bulk actions (remove, change role)
- [ ] Search and filter functionality
- [ ] Pagination for large teams

#### Roles Page (`/settings/workspace/roles`)
- [ ] Display 5 default roles with permissions matrix
- [ ] Create custom role functionality
- [ ] Permission checkboxes per role
- [ ] Role description editing
- [ ] Delete custom role (with member reassignment)
- [ ] Role assignment counts

### 4.3 AI & Automation Settings (P1)

#### AI Configuration Page (`/settings/ai-config`)
**Current State:** Shows empty state with "Add Provider" button

- [ ] Add provider modal with:
  - Provider selection (OpenAI, Anthropic, Google, DeepSeek, OpenRouter)
  - API key input (masked)
  - Test connection button
  - Model selection dropdown
- [ ] Display configured providers as cards
- [ ] Per-provider settings (default model, temperature, etc.)
- [ ] Provider status indicator (Valid, Invalid, Testing)
- [ ] Usage statistics per provider
- [ ] Remove provider functionality

#### API Keys Page (`/settings/api-keys`)
- [ ] List all API keys with: Name, Key (masked), Created, Last Used
- [ ] Create new API key modal
- [ ] Copy key to clipboard (one-time display)
- [ ] Revoke key with confirmation
- [ ] Key permissions/scopes

#### Appearance Page (`/settings/appearance`)
- [ ] Theme toggle (Light/Dark/System)
- [ ] Accent color selection
- [ ] Font size preference
- [ ] Sidebar default state (expanded/collapsed)
- [ ] Chat panel default position
- [ ] Compact mode toggle

---

## 5. Approvals Page Fixes

### 5.1 Data Loading (P0)
**Current Issue:** "Error Loading Approvals - Failed to fetch"

- [ ] Implement proper API endpoint or demo data fallback
- [ ] Show skeleton loaders while loading
- [ ] Graceful error handling with retry
- [ ] Demo mode should show sample approval items

### 5.2 Approval Cards (P1)
- [ ] Display approval items in cards/list
- [ ] Show: Type, Title, Confidence score, Agent, Timestamp
- [ ] Color-coded confidence (green >85%, yellow 60-85%, red <60%)
- [ ] Quick actions (Approve, Reject, View Details)
- [ ] Bulk selection and actions

### 5.3 Approval Detail Modal (P1)
- [ ] Full approval context display
- [ ] AI reasoning explanation
- [ ] Confidence breakdown
- [ ] Approve/Reject with comment
- [ ] History of similar approvals

---

## 6. AI Agents Page Enhancements

### 6.1 Layout Fixes (P2)
- [ ] Fix status filter badges being cut off at top
- [ ] Add visible labels/placeholders to dropdown filters
- [ ] Improve agent card grid responsiveness

### 6.2 Agent Cards (P1)
- [ ] Show agent avatar/icon
- [ ] Display: Name, Role, Status, Tasks Completed, Success Rate
- [ ] Click to open agent detail modal
- [ ] Quick actions (Configure, View Activity, Pause/Resume)

### 6.3 Agent Detail Modal (P2)
- [ ] Full agent information
- [ ] Activity history
- [ ] Performance metrics chart
- [ ] Configuration options
- [ ] Conversation history with agent

---

## 7. Form & Input Improvements

### 7.1 Accessibility (P1)
- [ ] Add `autocomplete="email"` to email inputs
- [ ] Add `autocomplete="current-password"` to password inputs
- [ ] Add `autocomplete="new-password"` to password creation inputs
- [ ] Improve focus ring visibility on dark backgrounds
- [ ] Add aria-labels to icon-only buttons

### 7.2 Validation & Feedback (P2)
- [ ] Consistent error message styling
- [ ] Success toast notifications for actions
- [ ] Loading states on all form submissions
- [ ] Inline validation feedback

---

## 8. Breadcrumb & Navigation Polish

### 8.1 Breadcrumb Improvements (P3)
- [ ] Fix "Ai-config" → "AI Configuration" capitalization
- [ ] Ensure all breadcrumbs are clickable links
- [ ] Add home/dashboard as first breadcrumb item

### 8.2 Page Titles (P3)
- [ ] Ensure all pages have descriptive `<title>` tags
- [ ] Format: "Page Name | HYVVE"

---

## 9. Responsive Design

### 9.1 Medium Screens (1024px - 1280px) (P2)
- [ ] Auto-collapse sidebar OR chat panel (not both visible)
- [ ] Add toggle to switch between sidebar and chat
- [ ] Ensure content area has minimum usable width

### 9.2 Tablet (768px - 1024px) (P2)
- [ ] Sidebar as overlay/drawer
- [ ] Chat as bottom sheet or modal
- [ ] Touch-friendly button sizes

### 9.3 Mobile (< 768px) (P2)
- [ ] Bottom navigation bar
- [ ] Full-screen pages
- [ ] Hamburger menu for navigation
- [ ] Chat as full-screen modal

---

## 10. Business Module Pages (18 Wireframes Available)

> **Complete Wireframe Set:** All 18 business onboarding wireframes are available in:
> `docs/design/wireframes/Finished wireframes and html files/bo-**/code.html`

### 10.1 Business Portfolio Page (P0)
**Route:** `/businesses`
**Wireframe:** `BO-01 Portfolio Dashboard with Business Cards`
**HTML:** `bo-01_portfolio_dashboard_with_business_cards/code.html`

- [ ] Grid of business cards
- [ ] Card shows: Name, Status, Last Activity, Progress
- [ ] Status badges: Draft, Validating, Planning, Branding, Active
- [ ] Click to open business detail
- [ ] "New Business" button → onboarding wizard
- [ ] Search and filter businesses
- [ ] Sort by: Name, Created, Last Activity, Status

### 10.2 Business Switcher (P0)
**Wireframe:** `BO-09 Business Switcher Dropdown`
**HTML:** `bo-09_business_switcher_dropdown/code.html`

- [ ] Header dropdown for switching between businesses
- [ ] Shows status badges per business
- [ ] Quick access to portfolio
- [ ] Replaces workspace selector when in business context

### 10.3 Business Onboarding Wizard (P0)
**Routes:** `/onboarding/wizard` (existing, needs enhancement)
**Wireframes:**
- `BO-02`: Step 1 - Documents upload (`bo-02_onboarding_wizard_-_step_1__documents/code.html`)
- `BO-03`: Step 2 - Business details (`bo-03_onboarding_wizard_-_step_2__business_details/code.html`)
- `BO-04`: Step 3 - Capture idea with Vera (`bo-04_onboarding_wizard_-_step_3__capture_idea/code.html`)
- `BO-05`: Step 4 - Launch & summary (`bo-05_onboarding_wizard_-_step_4__launch_&_summary/code.html`)

**Current vs Wireframe Comparison:**
| Feature | Current | Wireframe Design |
|---------|---------|------------------|
| Step 1 | Choice (docs vs scratch) | Upload documents (pitch deck, business plan) |
| Step 2 | Business name/description | Full form: name, industry, stage, team size, funding |
| Step 3 | Problem/customer/solution | Chat with Vera (conversational intake) |
| Step 4 | Review summary | Team introduction (5 agents) + timeline preview |

**Implementation Tasks:**
- [ ] Add document upload with drag-drop zone in Step 1
- [ ] Expand Step 2 form: industry dropdown, stage selection, team size, funding status
- [ ] Replace Step 3 form with chat interface (Vera conversation)
- [ ] Add validation team introduction in Step 4 (Vera, Marco, Cipher, Persona, Risk)
- [ ] Show estimated timeline for validation process

### 10.4 Validation Module Pages (P1)
**Route:** `/businesses/[id]/validation`
**Wireframes:**
- `BO-06`: Validation page with chat (`bo-06_validation_page_with_chat_interface/code.html`)
- `BO-10`: Validation synthesis results (`bo-10_validation_synthesis_results/code.html`)
- `BO-11`: Market sizing results (`bo-11_market_sizing_results/code.html`)
- `BO-12`: Competitor analysis (`bo-12_competitor_analysis_dashboard/code.html`)
- `BO-13`: Customer discovery (`bo-13_customer_discovery_results/code.html`)

**Main Validation Page Layout (from BO-06):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Business Logo] Business Name                    [Business ▼]   │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Dashbd │  Business Validation                    Score: 78/100  │
│        │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│✅Validn│  Workflow Progress:                                    │
│        │  ✓ Idea Intake → ✓ Market Sizing → ● Competitors → ... │
│ Plannng│                                                        │
│        │  [Workflow Results Cards]                              │
│ Brandng│                                                        │
│        │  [Chat with Vera - Validation Lead]                    │
└────────┴────────────────────────────────────────────────────────┘
```

**Sub-pages:**
- [ ] `/businesses/[id]/validation` - Main page with workflow progress
- [ ] `/businesses/[id]/validation/market-sizing` - TAM/SAM/SOM funnel (BO-11)
- [ ] `/businesses/[id]/validation/competitors` - Competitor matrix (BO-12)
- [ ] `/businesses/[id]/validation/customers` - ICP cards, personas (BO-13)
- [ ] `/businesses/[id]/validation/synthesis` - Final scorecard (BO-10)

**Validation Team Agents (displayed in sidebar):**
| Agent | Icon | Color | Role |
|-------|------|-------|------|
| Vera | 🎯 | Coral #FF6B6B | Validation Lead / Orchestrator |
| Marco | 📊 | Blue #4B7BEC | Market Research Analyst |
| Cipher | 🔍 | Teal #20B2AA | Competitive Intelligence |
| Persona | 👤 | Purple #9B59B6 | Customer Discovery |
| Risk | ⚠️ | Orange #FF9F43 | Risk Assessment |

### 10.5 Planning Module Pages (P1)
**Route:** `/businesses/[id]/planning`
**Wireframes:**
- `BO-07`: Planning page with workflow progress (`bo-07_planning_page_with_workflow_progress/code.html`)
- `BO-14`: Business Model Canvas (`bo-14_business_model_canvas_view/code.html`)
- `BO-15`: Financial projections (`bo-15_financial_projections_dashboard/code.html`)

**Implementation Tasks:**
- [ ] `/businesses/[id]/planning` - Main page with BMC preview + financials preview
- [ ] `/businesses/[id]/planning/canvas` - Full 9-block BMC with AI suggestions
- [ ] `/businesses/[id]/planning/financials` - Revenue charts, expense breakdown, scenarios
- [ ] Chat integration with Planning agent (Blake)

### 10.6 Branding Module Pages (P1)
**Route:** `/businesses/[id]/branding`
**Wireframes:**
- `BO-08`: Branding page with visual identity (`bo-08_branding_page_with_visual_identity_preview/code.html`)
- `BO-16`: Brand strategy results (`bo-16_brand_strategy_results/code.html`)
- `BO-17`: Visual identity system (`bo-17_visual_identity_system/code.html`)
- `BO-18`: Asset gallery & download (`bo-18_asset_gallery_&_download/code.html`)

**Implementation Tasks:**
- [ ] `/businesses/[id]/branding` - Main page with visual identity preview
- [ ] `/businesses/[id]/branding/strategy` - Archetype, personality, messaging (BO-16)
- [ ] `/businesses/[id]/branding/identity` - Logo, colors, typography (BO-17)
- [ ] `/businesses/[id]/branding/assets` - Asset gallery with download (BO-18)
- [ ] Chat integration with Branding agent (Bella)

---

## 11. API Keys & BYOAI Settings

### 11.1 API Keys Management Page (P1)
**Route:** `/settings/api-keys` or `/settings/ai-config`
**Wireframe:** `ST-02 API Keys Management`
**HTML:** `st-02_api_keys_management/code.html`

**Wireframe Design:**
```
┌─────────────────────────────────────────────────────────────────┐
│ API Keys                                       [+ Add Provider]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🧠 Claude (Anthropic)                     ✓ Verified       │ │
│  │ API Key: sk-ant-••••••••••••••3f2a        [Test] [Remove]  │ │
│  │ Last used: 2 hours ago                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🤖 OpenAI                                  ✓ Verified       │ │
│  │ API Key: sk-••••••••••••••7b4c            [Test] [Remove]  │ │
│  │ Last used: 1 day ago                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 💎 Google Gemini                           ○ Not configured │ │
│  │                                            [Add Key]        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Tasks:**
- [ ] Provider list with status indicators (Verified/Not configured)
- [ ] Masked API key display (show last 4 chars)
- [ ] Test key functionality with real API call
- [ ] Add/Remove key actions
- [ ] Last used timestamp
- [ ] Key expiration warnings
- [ ] Usage statistics per provider

---

## 12. Technical Debt

### 12.1 Console Errors (P1)
- [ ] Fix 400 Bad Request errors on CRM page
- [ ] Fix 404 errors for missing API endpoints
- [ ] Remove or handle Fast Refresh warnings

### 12.2 Demo Mode (P2)
- [ ] Consistent demo data across all pages
- [ ] Clear "Demo Mode" indicator that can be dismissed
- [ ] Easy toggle between demo and live mode for development

### 12.3 Loading States (P2)
- [ ] Add skeleton loaders to all data-fetching components
- [ ] Consistent loading spinner component
- [ ] Page transition animations

---

## 13. Style Guide Deviations - CRITICAL FIXES

### 13.1 Icon System - Replace Material Icon Strings (P0)
**Current Issue:** Icons display as text strings (`grid_view`, `check_circle`, etc.) instead of actual icons

**Style Guide Reference:** Section 13.1 - Use Lucide Icons
```
Tech Stack:
- Icons: Lucide Icons
```

**Required Fixes:**
- [ ] Replace all Material Icon text strings with Lucide React components
- [ ] Sidebar icons: Use `<LayoutGrid />`, `<CheckCircle />`, `<Bot />`, `<Settings />`, `<Users />`, `<Folder />`
- [ ] Header icons: Use `<Search />`, `<Bell />`, `<HelpCircle />`
- [ ] Chat icons: Use `<AtSign />`, `<Paperclip />`, `<ArrowUp />`, `<History />`, `<Minimize2 />`, `<Maximize2 />`, `<ExternalLink />`

### 13.2 Header Bar - Style Deviations (P1)
**Current Issues:**
- Icons showing as text (`search`, `notifications`, `help`, `expand_more`)
- Missing proper hover states per style guide
- `expand_more` text visible next to workspace selector

**Style Guide Reference:** Section 3.1 - Shell Architecture
```
Header Bar should show:
Logo │ Project Selector │ Breadcrumbs │ Search │ Notifications │ User
```

**Required Fixes:**
- [ ] Replace text icons with Lucide components
- [ ] Add hover lift effect per Section 10.3 `.hover-lift`
- [ ] Hide expand_more text, show only chevron icon

### 13.3 Chat Panel - Typography & Spacing (P1)
**Current Issues:**
- Agent messages missing proper bubble styling
- Timestamps not aligned per design
- Chat header icons showing as text

**Style Guide Reference:** Section 5.2 - Message Styles
```css
.message-agent-bubble {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
  padding: var(--space-4);
}
```

**Required Fixes:**
- [ ] Apply proper bubble styling to agent messages
- [ ] Align timestamps consistently (right for user, left for agent)
- [ ] Replace icon text strings in chat header
- [ ] Add typing indicator animation per Section 5.3

### 13.4 Card Styling - Premium Feel (P1)
**Current Issues:**
- Cards lack subtle shadow hierarchy
- Missing hover state transitions
- Border radius inconsistent

**Style Guide Reference:** Section 4.3 - Cards
```css
.card {
  background: var(--bg-white);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);  /* 16px */
  padding: var(--space-6);  /* 24px */
  box-shadow: var(--shadow-sm);
}
.card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-md);
}
```

**Required Fixes:**
- [ ] Update all cards to use `border-radius: 16px` (currently varies)
- [ ] Add `box-shadow: var(--shadow-sm)` to cards at rest
- [ ] Add hover transition with `box-shadow: var(--shadow-md)`
- [ ] Ensure consistent padding (24px per style guide)

### 13.5 Button Styling - Premium Hierarchy (P1)
**Current Issues:**
- Primary buttons missing shadow per style guide
- Ghost buttons lacking proper hover state
- Inconsistent border radius

**Style Guide Reference:** Section 4.2 - Buttons
```css
.btn-primary {
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.25);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.35);
}
```

**Required Fixes:**
- [ ] Add coral shadow to primary buttons
- [ ] Add hover lift effect (`translateY(-1px)`)
- [ ] Ensure `border-radius: 10px` (--radius-md) on all buttons
- [ ] Add active state `transform: scale(0.98)`

### 13.6 Background Colors - Warm Cream (P2)
**Current Issues:**
- Main background appears to use correct cream (#FFFBF5) ✓
- Some sections may use pure white instead of cream

**Style Guide Reference:** Section 2.3 - Background Colors
```css
--bg-cream: #FFFBF5;  /* Main background */
--bg-white: #FFFFFF;  /* Cards, elevated surfaces */
--bg-soft: #FFF8F0;   /* Subtle sections */
```

**Verification Needed:**
- [ ] Audit all page backgrounds for cream vs white usage
- [ ] Cards should be white on cream background for elevation
- [ ] Sidebar should use appropriate background

### 13.7 Focus States - Accessibility (P1)
**Current Issues:**
- Focus rings may not use coral color per brand
- Insufficient contrast on some focus states

**Style Guide Reference:** Section 11.2 - Focus Management
```css
:focus-visible {
  outline: 2px solid var(--color-primary);  /* #FF6B6B */
  outline-offset: 2px;
}
```

**Required Fixes:**
- [ ] Update focus ring color to coral (#FF6B6B)
- [ ] Add 2px offset to all focus states
- [ ] Ensure focus is visible on all interactive elements

---

## 14. Premium Feel Enhancements

### 14.1 Micro-Animations (P2)
**Style Guide Reference:** Section 10 - Animation & Motion

**Required Additions:**
- [ ] Add hover lift effect to cards (translateY(-2px))
- [ ] Add button press feedback (scale(0.98))
- [ ] Add page transition animations (fade-in, slide-up)
- [ ] Add skeleton pulse animation for loading states
- [ ] Add modal scale-in animation

### 14.2 Premium Shadows (P2)
**Style Guide Reference:** Section 2.7 - Shadows & Elevation

**Required Additions:**
- [ ] Apply shadow hierarchy: xs → sm → md → lg → xl
- [ ] Add colored shadows for primary actions (`--shadow-primary`)
- [ ] Use glows instead of shadows in dark mode (`--glow-sm`, `--glow-md`)
- [ ] Ensure shadows are "soft, subtle - never harsh"

### 14.3 Typography Refinements (P2)
**Style Guide Reference:** Section 2.8 - Typography

**Required Fixes:**
- [ ] Verify Inter font is loaded correctly
- [ ] Apply letter-spacing: -0.02em to headings (--tracking-tighter)
- [ ] Ensure generous line-height: 1.5-1.75 on body text
- [ ] Use JetBrains Mono for code/mono content

### 14.4 Celebration Moments (P3)
**Style Guide Reference:** Section 9.6 - Celebration Moments

**Required Additions:**
- [ ] Confetti on completing onboarding
- [ ] Badge animation on first task completion
- [ ] Character celebration on inbox/queue zero
- [ ] Checkmark animation on successful payment/action

### 14.5 Agent Character Styling (P1)
**Style Guide Reference:** Section 2.2 & 4.4 - AI Team Character Colors

**Required Additions:**
- [ ] Apply character colors to agent avatars/badges:
  - Hub: #FF6B6B (coral)
  - Maya: #20B2AA (teal)
  - Atlas: #FF9F43 (orange)
  - Sage: #2ECC71 (green)
  - Nova: #FF6B9D (pink)
  - Echo: #4B7BEC (blue)
- [ ] Add agent gradients for premium agent cards
- [ ] Use agent-specific border colors on cards

### 14.6 Empty States - Character Driven (P2)
**Style Guide Reference:** Section 9.3 - Empty States

**Current Issues:**
- Empty states lack character illustrations
- Missing personality/warmth

**Required Fixes:**
- [ ] Add Hub character illustration to empty states
- [ ] Include warm, friendly copy (not sterile)
- [ ] Single clear CTA button
- [ ] Example: "Your approval queue is empty. All agent actions have been reviewed. Nice work!"

### 14.7 Loading States - Premium (P2)
**Style Guide Reference:** Section 9.1 & 9.2 - Loading States

**Required Hierarchy (fastest to slowest):**
1. [ ] Optimistic UI - Show success before server confirms
2. [ ] Skeleton Screens - Show content structure with pulse animation
3. [ ] Progress Bar - When duration is measurable
4. [ ] Spinner - Brief, unknown duration only
5. [ ] Avoid full-page loaders

### 14.8 Input Refinements (P2)
**Style Guide Reference:** Section 8.1 - Input Styles

**Required Fixes:**
- [ ] Apply coral focus ring: `box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.15)`
- [ ] Ensure warm border color: `--border-default: #e5ddd4`
- [ ] Add hover state: `border-color: var(--border-strong)`
- [ ] Consistent padding: 12px 16px

---

## 15. Onboarding Wizard Styling

### 15.1 Step Indicator Polish (P2)
**Current State:** Functional but basic styling

**Required Enhancements:**
- [ ] Active step should use coral (#FF6B6B) fill
- [ ] Completed steps should show checkmark
- [ ] Add subtle connecting line between steps
- [ ] Step labels need better spacing

### 15.2 Option Cards (P2)
**Current Issues:**
- Cards lack selected state shadow
- Icons are basic, could be more illustrative

**Required Fixes:**
- [ ] Selected card: Add coral border and shadow
- [ ] Hover state: Add lift effect
- [ ] Consider custom illustrations instead of icons

### 15.3 Progress Animation (P3)
- [ ] Animate progress percentage change
- [ ] Add step transition animation

---

## Summary by Priority

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 10 | Critical blockers - must fix |
| P1 | 24 | High priority - next sprint |
| P2 | 18 | Medium priority - future sprints |
| P3 | 6 | Low priority - nice to have |

### P0 Items (Critical)
1. Post-sign-in landing page → Businesses portfolio
2. Chat agent integration (connect to Agno backend)
3. Settings Profile page functionality
4. Settings Security page functionality
5. Settings Sessions page functionality
6. Workspace General settings functionality
7. Workspace Members page fix and functionality
8. Approvals data loading fix
9. Business Portfolio Page (`/businesses`)
10. **Icon System - Replace Material Icon text strings with Lucide components**

### P1 Style Guide Fixes (High Priority)
1. Sidebar icon labels - replace text with proper icons
2. Header bar icons - replace text strings
3. Chat panel styling per spec
4. Card styling with premium shadows
5. Button styling with hover effects
6. Focus states with coral ring
7. Agent character colors

### Estimated Effort
- **P0 Items:** ~3-4 sprints
- **P1 Items:** ~3-4 sprints (increased due to styling fixes)
- **P2 Items:** ~2-3 sprints
- **P3 Items:** ~1 sprint

---

## Next Steps

1. Review and prioritize with product team
2. Create EPIC-15 for UI/UX improvements
3. Break down into stories
4. Add to sprint backlog
5. **Address P0 icon system fix immediately** - highly visible issue

---

## Style Guide Compliance Checklist

| Area | Status | Notes |
|------|--------|-------|
| Color Palette | ⚠️ Partial | Cream background correct, need to verify all usage |
| Typography | ⚠️ Partial | Font appears correct, letter-spacing needs audit |
| Shadows | ❌ Missing | Cards/buttons lack premium shadow hierarchy |
| Border Radius | ⚠️ Partial | Some inconsistency, should be 16px for cards |
| Icons | ❌ Broken | Material icon text strings instead of Lucide |
| Animations | ❌ Missing | No hover lift, no press feedback |
| Focus States | ⚠️ Partial | Need coral color ring |
| Character Colors | ⚠️ Partial | Hub coral visible, others need verification |
| Empty States | ❌ Missing | No character illustrations |
| Loading States | ❌ Missing | No skeleton screens, no optimistic UI |

---

## 16. Wireframe Implementation Reference Index

> **Location:** `docs/design/wireframes/Finished wireframes and html files/`
> **Index:** `docs/design/wireframes/WIREFRAME-INDEX.md`

### Authentication & Onboarding Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| AU-01 | Login Page | Sign-in with email/password, Google OAuth | `au-01_login_page/code.html` |
| AU-02 | Register | Sign-up form with terms checkbox | `au-02_register/sign_up/code.html` |
| AU-03 | Forgot Password | Email input for reset | `au-03_forgot_password/code.html` |
| AU-04 | Password Reset | New password form | `au-04_password_reset/code.html` |
| AU-05 | Onboarding Wizard | 4-step: Workspace → API key → AI team → Dashboard | `au-05_email_verification/code.html` |
| AU-06 | Workspace Invite | Accept/decline invitation | `au-06_two-factor_authentication/code.html` |

### Settings & API Keys Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| ST-01 | Settings Layout | Sidebar navigation structure | `st-01_settings_layout/code.html` |
| ST-02 | API Keys Management | Add/test/remove BYOAI keys | `st-02_api_keys_management/code.html` |
| ST-03 | AI Provider Setup | Provider selection and config | `st-03_ai_provider_setup_*/code.html` |
| ST-04 | Agent Model Preferences | Model selection per agent | `st-04_agent_model_preferences/code.html` |
| ST-05 | Usage & Billing | Token usage, billing info | `st-05_usage_&_billing/code.html` |
| ST-06 | Team Members | Invite and manage members | `st-06_team_members/code.html` |
| ST-07 | Notification Settings | Alert preferences | `st-07_notification_settings/code.html` |
| ST-08 | Appearance/Theme | Dark/light mode settings | `st-08_appearance/theme/code.html` |

### Business Onboarding Wireframes (18 total)

| ID | Name | Description | Path |
|----|------|-------------|------|
| **Portfolio** | | | |
| BO-01 | Portfolio Dashboard | Business cards with progress | `bo-01_portfolio_dashboard_with_business_cards/code.html` |
| BO-09 | Business Switcher | Header dropdown for businesses | `bo-09_business_switcher_dropdown/code.html` |
| **Wizard** | | | |
| BO-02 | Step 1 - Documents | Upload pitch deck, business plan | `bo-02_onboarding_wizard_-_step_1__documents/code.html` |
| BO-03 | Step 2 - Details | Name, industry, stage, team, funding | `bo-03_onboarding_wizard_-_step_2__business_details/code.html` |
| BO-04 | Step 3 - Idea | Chat with Vera for idea capture | `bo-04_onboarding_wizard_-_step_3__capture_idea/code.html` |
| BO-05 | Step 4 - Launch | Team intro, timeline, start | `bo-05_onboarding_wizard_-_step_4__launch_&_summary/code.html` |
| **Module Pages** | | | |
| BO-06 | Validation Page | Chat interface + 8 workflow progress | `bo-06_validation_page_with_chat_interface/code.html` |
| BO-07 | Planning Page | BMC preview + financials preview | `bo-07_planning_page_with_workflow_progress/code.html` |
| BO-08 | Branding Page | Visual identity preview + assets | `bo-08_branding_page_with_visual_identity_preview/code.html` |
| **Validation Results** | | | |
| BO-10 | Validation Synthesis | Scorecard, findings, recommendations | `bo-10_validation_synthesis_results/code.html` |
| BO-11 | Market Sizing | TAM/SAM/SOM funnel, growth charts | `bo-11_market_sizing_results/code.html` |
| BO-12 | Competitor Analysis | Matrix, positioning map, gaps | `bo-12_competitor_analysis_dashboard/code.html` |
| BO-13 | Customer Discovery | ICP cards, pain points, JTBD | `bo-13_customer_discovery_results/code.html` |
| **Planning Results** | | | |
| BO-14 | Business Model Canvas | 9-block BMC with AI suggestions | `bo-14_business_model_canvas_view/code.html` |
| BO-15 | Financial Projections | Revenue, expenses, cash flow | `bo-15_financial_projections_dashboard/code.html` |
| **Branding Results** | | | |
| BO-16 | Brand Strategy | Archetype, personality, messaging | `bo-16_brand_strategy_results/code.html` |
| BO-17 | Visual Identity | Logo, colors, typography | `bo-17_visual_identity_system/code.html` |
| BO-18 | Asset Gallery | Download logos, social kit | `bo-18_asset_gallery_&_download/code.html` |

### Shell & Navigation Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| SH-01 | Shell Layout | Three-panel layout structure | `sh-01_shell_layout_(three-panel)/code.html` |
| SH-02 | Navigation Sidebar | All states (expanded/collapsed) | `sh-02_navigation_sidebar_(states)/code.html` |
| SH-03 | Header Bar | Dropdowns, search, notifications | `sh-03_header_bar_with_dropdowns/code.html` |
| SH-05 | Command Palette | Cmd+K search interface | `sh-05_command_palette_(cmd+k)/code.html` |
| SH-06 | Mobile Layout | Responsive mobile design | `sh-06_mobile_layout/code.html` |

### Chat Interface Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| CH-01 | Chat Panel | Main chat container | `ch-01_chat_panel/code.html` |
| CH-02 | Chat Messages | All message types | `ch-02_chat_messages_(all_types)_/code.html` |
| CH-03 | Chat Input | Message input component | `ch-03_chat_input_component/code.html` |
| CH-04 | Typing Indicator | Agent typing animation | `ch-04_typing_indicator/code.html` |
| CH-05 | Message Actions | Copy, edit, delete menu | `ch-05_message_actions_menu/code.html` |
| CH-06 | Chat History | Search/filter history | `ch-06_chat_history/search/code.html` |
| CH-07 | Agent Switching | Switch between agents | `ch-07_agent_switching/code.html` |

### AI Team Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| AI-01 | AI Team Overview | Grid of all agents | `ai-01_ai_team_overview/code.html` |
| AI-02 | Agent Card | Individual agent card | `ai-02_agent_card_component/code.html` |
| AI-03 | Agent Detail Modal | Full agent details | `ai-03_agent_detail_modal/code.html` |
| AI-04 | Agent Activity Feed | Agent action history | `ai-04_agent_activity_feed/code.html` |
| AI-05 | Agent Configuration | Per-agent settings | `ai-05_agent_configuration/code.html` |

### Approval Queue Wireframes

| ID | Name | Description | Path |
|----|------|-------------|------|
| AP-01 | Approval Queue | Main queue page | `ap-01_approval_queue_main/code.html` |
| AP-02 | Approval Card | Confidence routing card | `ap-02_approval_card_(confidence_routing_)/code.html` |
| AP-03 | Approval Detail | Full item detail modal | `ap-03_approval_detail_modal/code.html` |
| AP-04 | Batch Approval | Multi-select approval | `ap-04_batch_approval/code.html` |
| AP-05 | Approval Filters | Filter/sort controls | `ap-05_approval_filters/code.html` |
| AP-06 | Approval History | Past approvals | `ap-06_approval_history/code.html` |

---

*Document created from comprehensive user testing + style guide audit + wireframe analysis*
*Last updated: December 11, 2025*
